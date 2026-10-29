"""Types and data structures for DeepExtract RAG workflow in GMR CRM."""

from typing import Any, Literal, Optional, TypedDict
from pydantic import BaseModel, Field

INSUFFICIENT_EVIDENCE = (
    "I couldn't find enough information in the available documents to answer that question."
)


class Evidence(TypedDict):
    """Authorized retrieval result safe for workflow state and provider formatting."""
    document_id: str
    document_name: str
    file_name: str
    page_number: Optional[int]
    chunk_id: str
    chunk_index: int
    score: float
    content: str
    storage_path: Optional[str]
    subject: Optional[str]
    department: Optional[str]


class SourceRecord(BaseModel):
    """Verified citation record returned to the client."""
    document_id: str
    document_name: str
    file_name: str
    page_number: Optional[int] = None
    chunk_id: str
    chunk_index: int
    score: float
    excerpt: str
    storage_path: Optional[str] = ""
    subject: Optional[str] = ""
    department: Optional[str] = ""


class AgentState(TypedDict):
    """Complete per-turn state for the LangGraph agent workflow."""
    query: str
    retrieval_query: str
    classification: Literal["conversation", "knowledge"]
    needs_retrieval: bool
    hits: list[Evidence]
    retry_count: int
    grounded: bool
    answer: str
    sources: list[dict[str, Any]]
    error: Optional[str]


class ChatRequest(BaseModel):
    """Incoming request to the /api/rag/chat endpoint."""
    question: str = Field(..., min_length=1, max_length=1000)
    query_vector: Optional[list[float]] = None
    options: Optional[dict[str, Any]] = None


class ChatResponse(BaseModel):
    """Standardized response from the RAG workflow."""
    success: bool
    question: str
    answer: Optional[str] = None
    grounded: bool = False
    sources: list[dict[str, Any]] = []
    error: Optional[str] = None
    retrieval: Optional[dict[str, Any]] = None
