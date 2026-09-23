-- ==============================================================================
-- GMR CRM: RAG Knowledge Base & Vector Embeddings Migration
-- Embedding Model: intfloat/multilingual-e5-small (Dimension: 384)
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create Helper Function for Automatic updated_at Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. Table: rag_documents
-- Master table storing metadata, storage paths, and status of uploaded RAG documents
-- ==============================================================================
CREATE TABLE IF NOT EXISTS rag_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_name TEXT NOT NULL,
    storage_path TEXT,
    document_type TEXT, -- e.g., 'syllabus', 'pyq', 'faculty_notes', 'lab_manual', 'textbook'
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    semester TEXT,
    academic_year TEXT,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'indexed', 'failed', 'archived'
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for auto-updating updated_at on rag_documents
DROP TRIGGER IF EXISTS trg_rag_documents_updated_at ON rag_documents;
CREATE TRIGGER trg_rag_documents_updated_at
    BEFORE UPDATE ON rag_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 4. Table: rag_chunks
-- Chunked document segments with 384-dimensional vector embeddings
-- ==============================================================================
CREATE TABLE IF NOT EXISTS rag_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(384),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 5. Table: rag_ingestion_jobs
-- Background asynchronous ingestion, extraction, and embedding tracking jobs
-- ==============================================================================
CREATE TABLE IF NOT EXISTS rag_ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed'
    error_message TEXT,
    chunks_created INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 6. Table: document_permissions
-- Granular document access control rules per user
-- ==============================================================================
CREATE TABLE IF NOT EXISTS document_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    can_view BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_document_user_permission UNIQUE (document_id, user_id)
);

-- ==============================================================================
-- 7. Performance & Vector Indexes
-- ==============================================================================

-- rag_documents indexes
CREATE INDEX IF NOT EXISTS idx_rag_documents_subject_id ON rag_documents(subject_id);
CREATE INDEX IF NOT EXISTS idx_rag_documents_department_id ON rag_documents(department_id);
CREATE INDEX IF NOT EXISTS idx_rag_documents_status ON rag_documents(status);
CREATE INDEX IF NOT EXISTS idx_rag_documents_uploaded_by ON rag_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_rag_documents_document_type ON rag_documents(document_type);

-- rag_chunks indexes
CREATE INDEX IF NOT EXISTS idx_rag_chunks_document_id ON rag_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_chunk_index ON rag_chunks(document_id, chunk_index);

-- Vector Cosine Similarity Index (HNSW for fast approximate nearest neighbor search)
CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding_hnsw 
    ON rag_chunks 
    USING hnsw (embedding vector_cosine_ops);

-- rag_ingestion_jobs indexes
CREATE INDEX IF NOT EXISTS idx_rag_ingestion_jobs_document_id ON rag_ingestion_jobs(document_id);
CREATE INDEX IF NOT EXISTS idx_rag_ingestion_jobs_status ON rag_ingestion_jobs(status);

-- document_permissions indexes
CREATE INDEX IF NOT EXISTS idx_document_permissions_doc_user ON document_permissions(document_id, user_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_user_id ON document_permissions(user_id);

-- ==============================================================================
-- 8. Row Level Security (RLS) Configuration
-- ==============================================================================

-- Enable RLS on all 4 tables
ALTER TABLE rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Helper function to check if current user is an Admin
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        (auth.jwt() ->> 'role' = 'admin') OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------------------------
-- Helper function to check if current user is Faculty
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_faculty()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        (auth.jwt() ->> 'role' = 'faculty') OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'faculty'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------------------------
-- RLS Policies: rag_documents
-- ------------------------------------------------------------------------------

-- Admins have full access
DROP POLICY IF EXISTS "rag_docs_admin_all" ON rag_documents;
CREATE POLICY "rag_docs_admin_all" ON rag_documents
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Faculty can insert documents and manage their own uploaded documents
DROP POLICY IF EXISTS "rag_docs_faculty_insert" ON rag_documents;
CREATE POLICY "rag_docs_faculty_insert" ON rag_documents
    FOR INSERT
    TO authenticated
    WITH CHECK (is_faculty() AND uploaded_by = auth.uid());

DROP POLICY IF EXISTS "rag_docs_faculty_update" ON rag_documents;
CREATE POLICY "rag_docs_faculty_update" ON rag_documents
    FOR UPDATE
    TO authenticated
    USING (is_faculty() AND uploaded_by = auth.uid())
    WITH CHECK (is_faculty() AND uploaded_by = auth.uid());

-- Authenticated users (Students/Faculty) can SELECT active indexed documents if:
-- 1. Explicit permission granted in document_permissions, OR
-- 2. Document belongs to a subject they are enrolled in/teach, OR
-- 3. They are the uploader
DROP POLICY IF EXISTS "rag_docs_authenticated_select" ON rag_documents;
CREATE POLICY "rag_docs_authenticated_select" ON rag_documents
    FOR SELECT
    TO authenticated
    USING (
        status = 'indexed' AND (
            uploaded_by = auth.uid()
            OR is_admin()
            OR is_faculty()
            OR EXISTS (
                SELECT 1 FROM document_permissions dp
                WHERE dp.document_id = rag_documents.id
                AND dp.user_id = auth.uid()
                AND dp.can_view = true
            )
            OR (
                subject_id IS NOT NULL AND (
                    EXISTS (
                        SELECT 1 FROM student_subjects ss
                        JOIN students s ON s.id = ss.student_id
                        WHERE ss.subject_id = rag_documents.subject_id
                        AND s.user_id = auth.uid()
                    )
                    OR EXISTS (
                        SELECT 1 FROM faculty_subjects fs
                        JOIN faculty f ON f.id = fs.faculty_id
                        WHERE fs.subject_id = rag_documents.subject_id
                        AND f.user_id = auth.uid()
                    )
                )
            )
        )
    );

-- ------------------------------------------------------------------------------
-- RLS Policies: rag_chunks
-- ------------------------------------------------------------------------------

-- Admins have full access to chunks
DROP POLICY IF EXISTS "rag_chunks_admin_all" ON rag_chunks;
CREATE POLICY "rag_chunks_admin_all" ON rag_chunks
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Authenticated users can read chunks if they have access to the parent document
DROP POLICY IF EXISTS "rag_chunks_authenticated_select" ON rag_chunks;
CREATE POLICY "rag_chunks_authenticated_select" ON rag_chunks
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM rag_documents rd
            WHERE rd.id = rag_chunks.document_id
            AND (
                rd.status = 'indexed'
                OR rd.uploaded_by = auth.uid()
                OR is_admin()
            )
        )
    );

-- ------------------------------------------------------------------------------
-- RLS Policies: rag_ingestion_jobs
-- ------------------------------------------------------------------------------

-- Admins have full access to ingestion jobs
DROP POLICY IF EXISTS "rag_jobs_admin_all" ON rag_ingestion_jobs;
CREATE POLICY "rag_jobs_admin_all" ON rag_ingestion_jobs
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Uploaders / Faculty can monitor ingestion jobs for their uploaded documents
DROP POLICY IF EXISTS "rag_jobs_faculty_select" ON rag_ingestion_jobs;
CREATE POLICY "rag_jobs_faculty_select" ON rag_ingestion_jobs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM rag_documents rd
            WHERE rd.id = rag_ingestion_jobs.document_id
            AND rd.uploaded_by = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- RLS Policies: document_permissions
-- ------------------------------------------------------------------------------

-- Admins have full access to permissions
DROP POLICY IF EXISTS "doc_perms_admin_all" ON document_permissions;
CREATE POLICY "doc_perms_admin_all" ON document_permissions
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Document uploaders can view and assign permissions for their own documents
DROP POLICY IF EXISTS "doc_perms_uploader_manage" ON document_permissions;
CREATE POLICY "doc_perms_uploader_manage" ON document_permissions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM rag_documents rd
            WHERE rd.id = document_permissions.document_id
            AND rd.uploaded_by = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM rag_documents rd
            WHERE rd.id = document_permissions.document_id
            AND rd.uploaded_by = auth.uid()
        )
    );

-- Users can inspect their own permissions
DROP POLICY IF EXISTS "doc_perms_user_select" ON document_permissions;
CREATE POLICY "doc_perms_user_select" ON document_permissions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- ==============================================================================
-- 9. Semantic Vector Search RPC Function
-- Used by GMRIT AI / RAG query engine for cosine similarity searches
-- ==============================================================================
CREATE OR REPLACE FUNCTION match_rag_chunks(
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
SET search_path = public, extensions
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
        1 - (rc.embedding <=> query_embedding) AS similarity
    FROM rag_chunks rc
    INNER JOIN rag_documents rd ON rc.document_id = rd.id
    WHERE
        rd.status = 'indexed'
        AND (filter_document_id IS NULL OR rc.document_id = filter_document_id)
        AND (filter_subject_id IS NULL OR rd.subject_id = filter_subject_id)
        AND (filter_department_id IS NULL OR rd.department_id = filter_department_id)
        AND (1 - (rc.embedding <=> query_embedding)) >= match_threshold
    ORDER BY rc.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;
