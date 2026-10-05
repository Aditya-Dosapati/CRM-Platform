-- ==============================================================================
-- Migration: 20261005000001_faculty_resource_ownership_rls.sql
-- Description: Enforce strict faculty resource ownership RLS policies on public.rag_documents.
--              Faculty members can only SELECT, INSERT, UPDATE, and DELETE resources
--              that they personally uploaded (where uploaded_by = auth.uid()).
-- ==============================================================================

-- 1. Ensure table has RLS enabled
ALTER TABLE public.rag_documents ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing SELECT and modification policies on rag_documents
DROP POLICY IF EXISTS "rag_docs_authenticated_select" ON public.rag_documents;
DROP POLICY IF EXISTS "rag_docs_faculty_insert" ON public.rag_documents;
DROP POLICY IF EXISTS "rag_docs_faculty_modify" ON public.rag_documents;
DROP POLICY IF EXISTS "rag_docs_faculty_delete" ON public.rag_documents;
DROP POLICY IF EXISTS "rag_docs_admin_manage" ON public.rag_documents;

-- 3. Admin: Full Access (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "rag_docs_admin_manage" ON public.rag_documents
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4. Faculty: Can INSERT only with their own auth.uid() as uploaded_by
CREATE POLICY "rag_docs_faculty_insert" ON public.rag_documents
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_faculty() 
        AND uploaded_by = auth.uid()
    );

-- 5. Faculty: Can UPDATE only documents they personally uploaded
CREATE POLICY "rag_docs_faculty_modify" ON public.rag_documents
    FOR UPDATE
    TO authenticated
    USING (
        public.is_faculty() 
        AND uploaded_by = auth.uid()
    )
    WITH CHECK (
        public.is_faculty() 
        AND uploaded_by = auth.uid()
    );

-- 6. Faculty: Can DELETE only documents they personally uploaded
CREATE POLICY "rag_docs_faculty_delete" ON public.rag_documents
    FOR DELETE
    TO authenticated
    USING (
        public.is_faculty() 
        AND uploaded_by = auth.uid()
    );

-- 7. Policy: Authenticated SELECT with strict Faculty isolation
-- - Admins: Global visibility
-- - Document Uploader (Faculty/Admin): Can always view resources they uploaded
-- - Students (non-faculty, non-admin): Can view indexed documents for their enrolled subjects
CREATE POLICY "rag_docs_authenticated_select" ON public.rag_documents
    FOR SELECT
    TO authenticated
    USING (
        -- Document owner (the faculty/user who uploaded it)
        uploaded_by = auth.uid()
        -- Admin global access
        OR public.is_admin()
        -- Student access: only indexed materials for subjects student is enrolled in
        OR (
            NOT public.is_faculty()
            AND NOT public.is_admin()
            AND status = 'indexed'
            AND (
                public.check_document_permission(id, auth.uid())
                OR (
                    subject_id IS NOT NULL AND EXISTS (
                        SELECT 1 FROM public.student_subjects ss
                        JOIN public.students s ON s.id = ss.student_id
                        WHERE ss.subject_id = rag_documents.subject_id
                        AND s.user_id = auth.uid()
                    )
                )
            )
        )
    );
