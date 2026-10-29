"""Permission-aware retrieval and vector similarity for GMR CRM RAG."""

import asyncio
import json
import logging
import math
import os
import re
from typing import Any, Optional

import httpx
from backend.rag.types import Evidence

logger = logging.getLogger(__name__)

EMBEDDING_DIMENSION = 384
DEFAULT_SCORE_THRESHOLD = 0.60
DEFAULT_TOP_K = 5
E5_MODEL_NAME = "intfloat/multilingual-e5-small"

_model_cache: Any = None


def get_e5_model() -> Any:
    """Lazily load SentenceTransformer for intfloat/multilingual-e5-small."""
    global _model_cache
    if _model_cache is not None:
        return _model_cache
    from sentence_transformers import SentenceTransformer
    logger.info("Loading local SentenceTransformer model: %s...", E5_MODEL_NAME)
    _model_cache = SentenceTransformer(E5_MODEL_NAME)
    return _model_cache


def generate_e5_query_embedding(text: str) -> list[float]:
    """Generate 384-dim normalized query vector with required 'query: ' prefix."""
    model = get_e5_model()
    formatted = f"query: {text.strip()}"
    vec = model.encode(formatted, normalize_embeddings=True)
    if hasattr(vec, "tolist"):
        return [float(x) for x in vec.tolist()]
    return [float(x) for x in vec]


def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Calculate dot product between two normalized 384-dimensional vectors."""
    if len(vec_a) != EMBEDDING_DIMENSION or len(vec_b) != EMBEDDING_DIMENSION:
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    return max(0.0, min(1.0, float(dot)))


def get_supabase_config() -> tuple[str, str]:
    """Retrieve Supabase URL and Anon Key from environment."""
    supabase_url = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL") or ""
    supabase_anon_key = os.getenv("VITE_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_ANON_KEY") or ""
    if not supabase_url or not supabase_anon_key:
        raise ValueError("Supabase environment configuration is missing.")
    return supabase_url.rstrip("/"), supabase_anon_key


from fastapi import HTTPException, status


async def verify_supabase_user(token: str) -> dict[str, Any]:
    """Verify Supabase JWT token and extract authenticated user details and role."""
    supabase_url, anon_key = get_supabase_config()
    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {token}",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.get(f"{supabase_url}/auth/v1/user", headers=headers)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Supabase Auth service unreachable: {str(exc)}",
            )

        if res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required. Invalid or expired session token.",
            )
        user_data = res.json()
        user_id = user_data.get("id")
        user_metadata = user_data.get("user_metadata") or {}
        role = user_metadata.get("role")

        # If role not in metadata, fetch from public.users table
        if not role and user_id:
            try:
                user_res = await client.get(
                    f"{supabase_url}/rest/v1/users?id=eq.{user_id}&select=role",
                    headers=headers,
                )
                if user_res.status_code == 200:
                    rows = user_res.json()
                    if rows:
                        role = rows[0].get("role")
            except Exception:
                pass

        user_data["role"] = role or "student"

        if user_data["role"] == "faculty":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Faculty access to the Student AI Academic Copilot is restricted.",
            )

        return user_data


async def retrieve_authorized_chunks(
    token: str,
    query: str,
    query_vector: Optional[list[float]] = None,
    options: Optional[dict[str, Any]] = None,
) -> list[Evidence]:
    """Retrieve and rank authorized document chunks strictly respecting Supabase RLS."""
    options = options or {}
    score_threshold = float(options.get("score_threshold", DEFAULT_SCORE_THRESHOLD))
    top_k = int(options.get("top_k", options.get("maxChunks", DEFAULT_TOP_K)))

    # 1. Verify user session and role
    user = await verify_supabase_user(token)
    role = user.get("role")

    if role == "faculty":
        raise PermissionError("Faculty access to the Student AI Academic Copilot is restricted.")

    # 2. Ensure query vector
    if query_vector and len(query_vector) == EMBEDDING_DIMENSION and all(math.isfinite(x) for x in query_vector):
        active_vec = query_vector
    else:
        # Generate query vector with E5 pipeline asynchronously
        loop = asyncio.get_running_loop()
        active_vec = await loop.run_in_executor(None, generate_e5_query_embedding, query)

    # 3. Query accessible documents via PostgREST with user's JWT token (RLS enforced)
    supabase_url, anon_key = get_supabase_config()
    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {token}",
    }

    doc_params = [
        "select=id,title,file_name,document_type,status,subject_id,department_id,storage_path",
        "status=in.(indexed,published)",
    ]
    if options.get("documentId"):
        doc_params.append(f"id=eq.{options['documentId']}")
    if options.get("subjectId"):
        doc_params.append(f"subject_id=eq.{options['subjectId']}")
    if options.get("departmentId"):
        doc_params.append(f"department_id=eq.{options['departmentId']}")

    doc_url = f"{supabase_url}/rest/v1/rag_documents?{'&'.join(doc_params)}"

    async with httpx.AsyncClient(timeout=15.0) as client:
        doc_res = await client.get(doc_url, headers=headers)
        if doc_res.status_code != 200:
            logger.error("Failed to fetch documents: %s %s", doc_res.status_code, doc_res.text)
            return []

        accessible_docs = doc_res.json()
        if not accessible_docs:
            return []

        doc_ids = [d["id"] for d in accessible_docs]
        doc_map = {d["id"]: d for d in accessible_docs}

        # 4. Fetch candidate chunks for accessible documents
        doc_ids_formatted = ",".join(doc_ids)
        chunk_url = (
            f"{supabase_url}/rest/v1/rag_chunks"
            f"?document_id=in.({doc_ids_formatted})"
            "&select=id,document_id,chunk_index,content,embedding,metadata"
        )

        chunk_res = await client.get(chunk_url, headers=headers)
        if chunk_res.status_code != 200:
            logger.error("Failed to fetch chunks: %s %s", chunk_res.status_code, chunk_res.text)
            return []

        raw_chunks = chunk_res.json()
        if not raw_chunks:
            return []

    # 5. Score chunks using cosine similarity
    scored_hits: list[tuple[float, dict[str, Any]]] = []
    seen_fingerprints: set[str] = set()

    for chunk in raw_chunks:
        emb = chunk.get("embedding")
        if isinstance(emb, str):
            try:
                emb = json.loads(emb)
            except Exception:
                continue

        if not isinstance(emb, list) or len(emb) != EMBEDDING_DIMENSION:
            continue

        similarity = cosine_similarity(active_vec, emb)
        if similarity >= score_threshold:
            content = (chunk.get("content") or "").strip()
            fingerprint = content.lower()[:120]
            if fingerprint in seen_fingerprints:
                continue
            seen_fingerprints.add(fingerprint)
            scored_hits.append((similarity, chunk))

    # 6. Rank descending and slice top K
    scored_hits.sort(key=lambda x: x[0], reverse=True)
    top_candidates = scored_hits[:top_k]

    evidence_list: list[Evidence] = []
    for score, chunk in top_candidates:
        doc = doc_map.get(chunk["document_id"], {})
        meta = chunk.get("metadata") or {}
        page_num = meta.get("page_number") or meta.get("page")
        if isinstance(page_num, str) and page_num.isdigit():
            page_num = int(page_num)
        elif not isinstance(page_num, int):
            page_num = None

        evidence_list.append({
            "document_id": chunk["document_id"],
            "document_name": doc.get("title") or meta.get("document_title") or "Academic Document",
            "file_name": doc.get("file_name") or meta.get("file_name") or "document.pdf",
            "page_number": page_num,
            "chunk_id": chunk["id"],
            "chunk_index": chunk.get("chunk_index", 0),
            "score": score,
            "content": chunk.get("content", ""),
            "storage_path": doc.get("storage_path") or "",
            "subject": meta.get("subject_name") or meta.get("subject_code") or "General",
            "department": meta.get("department_name") or meta.get("department_code") or "General",
        })

    return evidence_list
