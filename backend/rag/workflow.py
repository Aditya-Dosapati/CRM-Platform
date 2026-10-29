"""LangGraph agent workflow for GMR CRM academic RAG intelligence."""

import logging
import re
from typing import Any, Callable, Coroutine, Literal

from langgraph.graph import END, START, StateGraph

from backend.rag.providers import AnswerProvider
from backend.rag.types import INSUFFICIENT_EVIDENCE, AgentState, Evidence

logger = logging.getLogger(__name__)

CONVERSATIONAL_PATTERNS = [
    r"^(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b",
    r"^(thanks|thank you|thx)\b",
    r"^(who are you|what is your name|what can you do|help)\b",
    r"^bye|goodbye|see you\b",
]

CONVERSATIONAL_GREETING = (
    "Hello! 👋 I am your GMRIT AI Academic Assistant, your intelligent educational companion.\n\n"
    "I can help you explore your course syllabi (AR23), faculty lecture notes, and study materials. "
    "What academic topic or question would you like to explore today?"
)


def classify_query(query: str) -> Literal["conversation", "knowledge"]:
    """Classify if the user request is casual conversation or academic knowledge."""
    cleaned = query.strip().lower()
    for pattern in CONVERSATIONAL_PATTERNS:
        if re.search(pattern, cleaned):
            return "conversation"
    return "knowledge"


def rewrite_retrieval_query(query: str) -> str:
    """Rewrite query to focus on core academic search terms when initial retrieval is empty."""
    stopwords = {
        "what", "is", "the", "explain", "describe", "tell", "me", "about", "a", "an",
        "in", "of", "and", "or", "for", "with", "can", "you", "please", "show", "give",
        "define", "how", "to", "do", "does", "are", "which"
    }
    cleaned = re.sub(r"[^\w\s-]", " ", query.lower())
    tokens = [tok for tok in cleaned.split() if tok and tok not in stopwords]
    rewritten = " ".join(tokens).strip()
    return rewritten if len(rewritten) >= 3 else query.strip()


def validate_sources(hits: list[Evidence]) -> list[dict[str, Any]]:
    """Build citation records exclusively from database-returned chunks (zero fabrication)."""
    seen_chunks: set[str] = set()
    sources: list[dict[str, Any]] = []

    for hit in hits:
        chunk_id = hit["chunk_id"]
        if chunk_id in seen_chunks:
            continue
        seen_chunks.add(chunk_id)

        sources.append({
            "document_id": hit["document_id"],
            "document_name": hit["document_name"],
            "file_name": hit["file_name"],
            "page_number": hit.get("page_number"),
            "chunk_id": chunk_id,
            "chunk_index": hit["chunk_index"],
            "score": round(hit["score"], 4),
            "similarity": round(hit["score"], 4),
            "excerpt": hit["content"][:400] + ("..." if len(hit["content"]) > 400 else ""),
            "storage_path": hit.get("storage_path") or "",
            "subject": hit.get("subject") or "General",
            "department": hit.get("department") or "General",
        })

    return sources


def build_rag_workflow(
    retrieve_fn: Callable[[str, int], Coroutine[Any, Any, list[Evidence]]],
    answer_provider: AnswerProvider,
    max_retries: int = 1,
) -> Any:
    """Compile the LangGraph retrieval, bounded retry, grounded generation, and citation validator graph."""

    async def classify(state: AgentState) -> dict[str, Any]:
        cls = classify_query(state["query"])
        return {"classification": cls}

    async def determine_retrieval(state: AgentState) -> dict[str, Any]:
        return {"needs_retrieval": state["classification"] == "knowledge"}

    def route_retrieval(state: AgentState) -> Literal["retrieve", "generate"]:
        return "retrieve" if state["needs_retrieval"] else "generate"

    async def retrieve(state: AgentState) -> dict[str, Any]:
        target_query = state.get("retrieval_query") or state["query"]
        retry_idx = state.get("retry_count", 0)
        hits = await retrieve_fn(target_query, retry_idx)
        return {"hits": hits}

    async def grade_context(state: AgentState) -> dict[str, Any]:
        hits = state.get("hits") or []
        if not hits:
            return {"grounded": False}
        top_score = hits[0].get("score", 0.0)
        # Evidence gate: If top similarity is below threshold (0.60), evidence is insufficient
        if top_score < 0.60:
            logger.info("Evidence gate abstained: top score %.4f < 0.60 threshold", top_score)
            return {"grounded": False}
        return {"grounded": True}

    def route_context(state: AgentState) -> Literal["rewrite", "generate"]:
        if not state.get("hits") and state.get("retry_count", 0) < max_retries:
            return "rewrite"
        return "generate"

    async def rewrite(state: AgentState) -> dict[str, Any]:
        new_query = rewrite_retrieval_query(state["query"])
        return {
            "retrieval_query": new_query,
            "retry_count": state.get("retry_count", 0) + 1,
        }

    async def generate(state: AgentState) -> dict[str, Any]:
        if state.get("classification") == "conversation":
            return {
                "answer": CONVERSATIONAL_GREETING,
                "grounded": False,
            }

        hits = state.get("hits") or []
        if not hits:
            return {
                "answer": INSUFFICIENT_EVIDENCE,
                "grounded": False,
            }

        try:
            answer = await answer_provider.generate_answer(state["query"], hits)
            if not answer or answer.strip() == INSUFFICIENT_EVIDENCE:
                return {"answer": INSUFFICIENT_EVIDENCE, "grounded": False}
            return {"answer": answer, "grounded": True}
        except Exception as exc:
            logger.error("Generation node failed: %s", exc)
            return {
                "answer": f"Unable to generate response: {exc}",
                "grounded": False,
                "error": str(exc),
            }

    async def finalize_sources(state: AgentState) -> dict[str, Any]:
        if not state.get("grounded"):
            return {"sources": []}
        hits = state.get("hits") or []
        return {"sources": validate_sources(hits)}

    # Build the StateGraph
    graph = StateGraph(AgentState)
    graph.add_node("classify", classify)
    graph.add_node("determine_retrieval", determine_retrieval)
    graph.add_node("retrieve", retrieve)
    graph.add_node("grade_context", grade_context)
    graph.add_node("rewrite", rewrite)
    graph.add_node("generate", generate)
    graph.add_node("finalize_sources", finalize_sources)

    graph.add_edge(START, "classify")
    graph.add_edge("classify", "determine_retrieval")
    graph.add_conditional_edges("determine_retrieval", route_retrieval)
    graph.add_edge("retrieve", "grade_context")
    graph.add_conditional_edges("grade_context", route_context)
    graph.add_edge("rewrite", "retrieve")
    graph.add_edge("generate", "finalize_sources")
    graph.add_edge("finalize_sources", END)

    return graph.compile()


async def run_rag_agent(
    query: str,
    retrieve_fn: Callable[[str, int], Coroutine[Any, Any, list[Evidence]]],
    answer_provider: AnswerProvider,
    max_retries: int = 1,
) -> AgentState:
    """Execute one bounded agent turn and return validated state."""
    app = build_rag_workflow(
        retrieve_fn=retrieve_fn,
        answer_provider=answer_provider,
        max_retries=max_retries,
    )

    initial_state: AgentState = {
        "query": query.strip(),
        "retrieval_query": query.strip(),
        "classification": "knowledge",
        "needs_retrieval": True,
        "hits": [],
        "retry_count": 0,
        "grounded": False,
        "answer": "",
        "sources": [],
        "error": None,
    }

    result = await app.ainvoke(initial_state)
    return result
