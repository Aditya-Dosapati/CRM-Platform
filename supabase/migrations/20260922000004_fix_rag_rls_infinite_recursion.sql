-- ==============================================================================
-- Migration: 20260922000004_fix_rag_rls_infinite_recursion.sql
-- Description: Fix RLS Infinite Recursion on public.rag_documents, rag_chunks,
--              rag_ingestion_jobs, and document_permissions
-- ==============================================================================

-- 1. Helper Function: is_admin() - SECURITY DEFINER with fixed search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    RETURN (
        (COALESCE(auth.jwt() ->> 'role', '') = 'admin') OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );
END;
$$;

-- 2. Helper Function: is_faculty() - SECURITY DEFINER with fixed search_path
CREATE OR REPLACE FUNCTION public.is_faculty()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    RETURN (
        (COALESCE(auth.jwt() ->> 'role', '') = 'faculty') OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'faculty'
        )
    );
END;
$$;

-- 3. Helper Function: can_manage_document(doc_id) - Breaks recursion on document_permissions
CREATE OR REPLACE FUNCTION public.can_manage_document(doc_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    RETURN public.is_admin() OR EXISTS (
        SELECT 1 FROM public.rag_documents
        WHERE id = doc_id AND uploaded_by = auth.uid()
    );
END;
$$;

-- 4. Helper Function: check_document_permission(doc_id, usr_id) - Breaks recursion on rag_documents select
CREATE OR REPLACE FUNCTION public.check_document_permission(doc_id UUID, usr_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.document_permissions
        WHERE document_id = doc_id
        AND user_id = usr_id
        AND can_view = true
    );
END;
$$;

-- 5. Helper Function: can_read_document_chunks(doc_id) - Breaks recursion on rag_chunks select
CREATE OR REPLACE FUNCTION public.can_read_document_chunks(doc_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    RETURN public.is_admin() OR EXISTS (
        SELECT 1 FROM public.rag_documents
        WHERE id = doc_id AND (uploaded_by = auth.uid() OR status = 'indexed')
    );
END;
$$;

-- ==============================================================================
-- 6. Clean and Recreate Policies on: public.rag_documents
-- ==============================================================================

ALTER TABLE public.rag_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rag_docs_admin_all" ON public.rag_documents;
DROP POLICY IF EXISTS "rag_docs_admin_manage" ON public.rag_documents;
DROP POLICY IF EXISTS "rag_docs_faculty_insert" ON public.rag_documents;
DROP POLICY IF EXISTS "rag_docs_faculty_update" ON public.rag_documents;
DROP POLICY IF EXISTS "rag_docs_faculty_modify" ON public.rag_documents;
DROP POLICY IF EXISTS "rag_docs_faculty_delete" ON public.rag_documents;
DROP POLICY IF EXISTS "rag_docs_authenticated_select" ON public.rag_documents;

-- Admin: Full Access (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "rag_docs_admin_manage" ON public.rag_documents
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Faculty: Can insert their own documents
CREATE POLICY "rag_docs_faculty_insert" ON public.rag_documents
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_faculty() AND uploaded_by = auth.uid());

-- Faculty: Can update/modify their own uploaded documents
CREATE POLICY "rag_docs_faculty_modify" ON public.rag_documents
    FOR UPDATE
    TO authenticated
    USING (public.is_faculty() AND uploaded_by = auth.uid())
    WITH CHECK (public.is_faculty() AND uploaded_by = auth.uid());

-- Faculty: Can delete their own uploaded documents
CREATE POLICY "rag_docs_faculty_delete" ON public.rag_documents
    FOR DELETE
    TO authenticated
    USING (public.is_faculty() AND uploaded_by = auth.uid());

-- Authenticated Select: Uploader, Admin, Faculty, or Students with enrolled/permitted access
CREATE POLICY "rag_docs_authenticated_select" ON public.rag_documents
    FOR SELECT
    TO authenticated
    USING (
        uploaded_by = auth.uid()
        OR public.is_admin()
        OR (
            status = 'indexed' AND (
                public.is_faculty()
                OR public.check_document_permission(id, auth.uid())
                OR (
                    subject_id IS NOT NULL AND (
                        EXISTS (
                            SELECT 1 FROM public.student_subjects ss
                            JOIN public.students s ON s.id = ss.student_id
                            WHERE ss.subject_id = rag_documents.subject_id
                            AND s.user_id = auth.uid()
                        )
                        OR EXISTS (
                            SELECT 1 FROM public.faculty_subjects fs
                            JOIN public.faculty f ON f.id = fs.faculty_id
                            WHERE fs.subject_id = rag_documents.subject_id
                            AND f.user_id = auth.uid()
                        )
                    )
                )
            )
        )
    );

-- ==============================================================================
-- 7. Clean and Recreate Policies on: public.rag_chunks
-- ==============================================================================

ALTER TABLE public.rag_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rag_chunks_admin_all" ON public.rag_chunks;
DROP POLICY IF EXISTS "rag_chunks_uploader_manage" ON public.rag_chunks;
DROP POLICY IF EXISTS "rag_chunks_authenticated_select" ON public.rag_chunks;

-- Admin: Full Access
CREATE POLICY "rag_chunks_admin_all" ON public.rag_chunks
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Document Manager: Can manage chunks for documents they own
CREATE POLICY "rag_chunks_uploader_manage" ON public.rag_chunks
    FOR ALL
    TO authenticated
    USING (public.can_manage_document(document_id))
    WITH CHECK (public.can_manage_document(document_id));

-- Authenticated Users: Read chunks for accessible documents
CREATE POLICY "rag_chunks_authenticated_select" ON public.rag_chunks
    FOR SELECT
    TO authenticated
    USING (public.can_read_document_chunks(document_id));

-- ==============================================================================
-- 8. Clean and Recreate Policies on: public.rag_ingestion_jobs
-- ==============================================================================

ALTER TABLE public.rag_ingestion_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rag_jobs_admin_all" ON public.rag_ingestion_jobs;
DROP POLICY IF EXISTS "rag_jobs_faculty_select" ON public.rag_ingestion_jobs;
DROP POLICY IF EXISTS "rag_jobs_uploader_manage" ON public.rag_ingestion_jobs;

-- Admin: Full Access
CREATE POLICY "rag_jobs_admin_all" ON public.rag_ingestion_jobs
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Document Manager: Can create/view/update ingestion jobs for documents they manage
CREATE POLICY "rag_jobs_uploader_manage" ON public.rag_ingestion_jobs
    FOR ALL
    TO authenticated
    USING (public.can_manage_document(document_id))
    WITH CHECK (public.can_manage_document(document_id));

-- ==============================================================================
-- 9. Clean and Recreate Policies on: public.document_permissions
-- ==============================================================================

ALTER TABLE public.document_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doc_perms_admin_all" ON public.document_permissions;
DROP POLICY IF EXISTS "doc_perms_uploader_manage" ON public.document_permissions;
DROP POLICY IF EXISTS "doc_perms_user_select" ON public.document_permissions;

-- Admin: Full Access
CREATE POLICY "doc_perms_admin_all" ON public.document_permissions
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Document Manager: Assign/manage permissions for their own documents
CREATE POLICY "doc_perms_uploader_manage" ON public.document_permissions
    FOR ALL
    TO authenticated
    USING (public.can_manage_document(document_id))
    WITH CHECK (public.can_manage_document(document_id));

-- Authenticated Users: View their own assigned permissions
CREATE POLICY "doc_perms_user_select" ON public.document_permissions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
