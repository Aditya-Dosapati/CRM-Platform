"""FastAPI router for DeepExtract RAG workflow integration."""

import logging
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, status

from backend.rag.providers import create_answer_provider
from backend.rag.retrieval import retrieve_authorized_chunks
from backend.rag.types import ChatRequest, ChatResponse
from backend.rag.workflow import run_rag_agent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/rag", tags=["rag"])


@router.get("/health")
async def rag_health():
    """Return RAG workflow operational health and configuration."""
    return {
        "status": "healthy",
        "system": "GMR CRM - DeepExtract RAG Integration",
        "embedding_model": "intfloat/multilingual-e5-small (384 dim)",
        "vector_prefix": "query: / passage:",
        "workflow": "LangGraph (classify -> retrieve -> grade -> rewrite_retry -> generate -> validate_sources)",
        "grounding": "strict (untrusted data isolation + prompt injection defense)",
    }


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    req: ChatRequest,
    authorization: Optional[str] = Header(None),
):
    """Execute authenticated DeepExtract RAG workflow turn."""
    if not authorization or not authorization.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid session token.",
        )

    token = authorization.replace("Bearer ", "").replace("bearer ", "").strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Invalid Authorization header format.",
        )

    # Security check: Validate client query_vector if provided (reject malformed, non-finite, or wrong-dimension)
    if req.query_vector is not None:
        if not isinstance(req.query_vector, list) or len(req.query_vector) != 384:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid query_vector: expected 384 dimensions, got {len(req.query_vector) if isinstance(req.query_vector, list) else 'non-list'}.",
            )
        import math
        if not all(isinstance(x, (int, float)) and math.isfinite(x) for x in req.query_vector):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid query_vector: all elements must be finite floating-point numbers.",
            )

    try:
        answer_provider = create_answer_provider()

        async def retrieve_fn(target_query: str, retry_idx: int):
            # If retrying with a rewritten query, do not reuse the initial query's vector
            active_vec = req.query_vector if retry_idx == 0 else None
            return await retrieve_authorized_chunks(
                token=token,
                query=target_query,
                query_vector=active_vec,
                options=req.options or {},
            )

        agent_result = await run_rag_agent(
            query=req.question,
            retrieve_fn=retrieve_fn,
            answer_provider=answer_provider,
            max_retries=1,
        )

        hits_count = len(agent_result.get("hits") or [])
        top_sim = (
            agent_result["hits"][0]["score"]
            if agent_result.get("hits")
            else 0.0
        )

        return ChatResponse(
            success=True,
            question=req.question,
            answer=agent_result.get("answer"),
            grounded=agent_result.get("grounded", False),
            sources=agent_result.get("sources") or [],
            error=agent_result.get("error"),
            retrieval={
                "chunkCount": hits_count,
                "topSimilarity": round(top_sim, 4),
                "retryCount": agent_result.get("retry_count", 0),
                "classification": agent_result.get("classification"),
            },
        )

    except PermissionError as perm_err:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(perm_err),
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unexpected error in RAG chat endpoint: %s", exc)
        return ChatResponse(
            success=False,
            question=req.question,
            answer=None,
            grounded=False,
            sources=[],
            error=f"RAG workflow error: {str(exc)}",
        )
