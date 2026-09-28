-- ==============================================================================
-- Migration: 20260923000000_fix_match_rag_chunks_search_path.sql
-- Description: Fix operator resolution for pgvector cosine distance (<=>) in match_rag_chunks
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.match_rag_chunks(
    query_embedding vector(384),
    match_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 5,
    filter_subject_id UUID DEFAULT NULL,
    filter_department_id UUID DEFAULT NULL,
    filter_document_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    document_title TEXT,
    document_file_name TEXT,
    document_type TEXT,
    chunk_index INT,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        rc.id,
        rc.document_id,
        rd.title AS document_title,
        rd.file_name AS document_file_name,
        rd.document_type,
        rc.chunk_index,
        rc.content,
        rc.metadata,
        (1 - (rc.embedding OPERATOR(extensions.<=>) query_embedding))::FLOAT AS similarity
    FROM public.rag_chunks rc
    INNER JOIN public.rag_documents rd ON rc.document_id = rd.id
    WHERE
        rd.status = 'indexed'
        AND (filter_document_id IS NULL OR rc.document_id = filter_document_id)
        AND (filter_subject_id IS NULL OR rd.subject_id = filter_subject_id)
        AND (filter_department_id IS NULL OR rd.department_id = filter_department_id)
        AND (1 - (rc.embedding OPERATOR(extensions.<=>) query_embedding)) >= match_threshold
    ORDER BY rc.embedding OPERATOR(extensions.<=>) query_embedding ASC
    LIMIT match_count;
END;
$$;
