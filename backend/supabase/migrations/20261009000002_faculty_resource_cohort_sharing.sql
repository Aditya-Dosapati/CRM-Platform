-- ==============================================================================
-- Migration: 20261009000002_faculty_resource_cohort_sharing.sql
-- Description: Enable Faculty Resource Sharing with Mapped Student Cohorts
--              1. Add cohort columns to public.rag_documents (department, branch, year, section, faculty_assignment_id)
--              2. Add performance indexes for cohort-based resource resolution
--              3. Update public.rag_documents RLS policies for faculty and student cohort isolation
--              4. Update storage policies to grant access to mapped students
-- ==============================================================================

-- 1. Add cohort and faculty assignment columns to public.rag_documents
ALTER TABLE public.rag_documents 
    ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'CSE',
    ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'CSE',
    ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT 4,
    ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'A',
    ADD COLUMN IF NOT EXISTS faculty_assignment_id UUID REFERENCES public.faculty_assignments(id) ON DELETE SET NULL;

-- 2. Performance indexes on rag_documents for fast cohort resolution
CREATE INDEX IF NOT EXISTS idx_rag_documents_cohort ON public.rag_documents(department_id, year, semester, section);
CREATE INDEX IF NOT EXISTS idx_rag_documents_branch ON public.rag_documents(department, branch);
CREATE INDEX IF NOT EXISTS idx_rag_documents_fa_id ON public.rag_documents(faculty_assignment_id);
CREATE INDEX IF NOT EXISTS idx_rag_documents_uploaded_status ON public.rag_documents(uploaded_by, status);

-- 3. Update RLS policies on public.rag_documents
ALTER TABLE public.rag_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rag_docs_admin_manage" ON public.rag_documents;
DROP POLICY IF EXISTS "rag_docs_faculty_insert" ON public.rag_documents;
DROP POLICY IF EXISTS "rag_docs_faculty_modify" ON public.rag_documents;
DROP POLICY IF EXISTS "rag_docs_faculty_delete" ON public.rag_documents;
DROP POLICY IF EXISTS "rag_docs_authenticated_select" ON public.rag_documents;

-- Policy A: Admin Full Control
CREATE POLICY "rag_docs_admin_manage" ON public.rag_documents
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Policy B: Faculty Insert (Must be authenticated faculty, own uploaded_by, and if faculty_assignment_id is specified, must be their assignment)
CREATE POLICY "rag_docs_faculty_insert" ON public.rag_documents
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (public.is_faculty() OR public.is_admin())
        AND uploaded_by = auth.uid()
        AND (
            faculty_assignment_id IS NULL OR
            EXISTS (
                SELECT 1 FROM public.faculty_assignments fa
                JOIN public.faculty f ON f.id = fa.faculty_id
                WHERE fa.id = rag_documents.faculty_assignment_id
                AND f.user_id = auth.uid()
            )
        )
    );

-- Policy C: Faculty Modify / Update own resources
CREATE POLICY "rag_docs_faculty_modify" ON public.rag_documents
    FOR UPDATE
    TO authenticated
    USING (
        public.is_admin() OR
        (public.is_faculty() AND uploaded_by = auth.uid())
    )
    WITH CHECK (
        public.is_admin() OR
        (public.is_faculty() AND uploaded_by = auth.uid())
    );

-- Policy D: Faculty Delete own resources
CREATE POLICY "rag_docs_faculty_delete" ON public.rag_documents
    FOR DELETE
    TO authenticated
    USING (
        public.is_admin() OR
        (public.is_faculty() AND uploaded_by = auth.uid())
    );

-- Policy E: Authenticated SELECT with Cohort-Level Student Isolation
CREATE POLICY "rag_docs_authenticated_select" ON public.rag_documents
    FOR SELECT
    TO authenticated
    USING (
        -- Admin global access
        public.is_admin()
        -- Faculty/Uploader access to own documents
        OR uploaded_by = auth.uid()
        -- Student access to published/indexed documents matching student cohort
        OR (
            status IN ('published', 'indexed', 'uploaded')
            AND (
                -- Explicit permission in document_permissions
                public.check_document_permission(id, auth.uid())
                -- Match via faculty_assignments and student enrollment
                OR EXISTS (
                    SELECT 1 FROM public.students s
                    WHERE s.user_id = auth.uid()
                    AND (
                        -- Case 1: Linked to specific faculty_assignment matching student cohort
                        (rag_documents.faculty_assignment_id IS NOT NULL AND EXISTS (
                            SELECT 1 FROM public.faculty_assignments fa
                            WHERE fa.id = rag_documents.faculty_assignment_id
                            AND fa.department_id = s.department_id
                            AND fa.year = s.year
                            AND fa.semester = s.semester
                            AND fa.section = s.section
                            AND fa.is_active = true
                        ))
                        -- Case 2: Direct cohort match on rag_documents
                        OR (
                            rag_documents.faculty_assignment_id IS NULL
                            AND (rag_documents.department_id IS NULL OR rag_documents.department_id = s.department_id)
                            AND (rag_documents.year IS NULL OR rag_documents.year = s.year)
                            AND (
                                rag_documents.semester IS NULL 
                                OR rag_documents.semester = s.semester::text 
                                OR rag_documents.semester = ('Semester ' || s.semester::text)
                            )
                            AND (rag_documents.section IS NULL OR rag_documents.section = s.section)
                            AND (
                                rag_documents.subject_id IS NULL OR EXISTS (
                                    SELECT 1 FROM public.faculty_assignments fa2
                                    WHERE fa2.subject_id = rag_documents.subject_id
                                    AND fa2.department_id = s.department_id
                                    AND fa2.year = s.year
                                    AND fa2.semester = s.semester
                                    AND fa2.section = s.section
                                    AND fa2.is_active = true
                                )
                            )
                        )
                    )
                )
            )
        )
    );

-- 4. Storage helper function update for student cohort access
CREATE OR REPLACE FUNCTION public.can_access_rag_storage_object(
    object_name TEXT,
    object_owner UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- 1. Admin has global read access
    IF public.is_admin() THEN
        RETURN TRUE;
    END IF;

    -- 2. Direct uploader / owner has access
    IF object_owner = auth.uid() THEN
        RETURN TRUE;
    END IF;

    -- 3. Check access against rag_documents matching student cohort
    RETURN EXISTS (
        SELECT 1 
        FROM public.rag_documents rd
        WHERE rd.storage_path = object_name
        AND (
            rd.uploaded_by = auth.uid()
            OR (
                rd.status IN ('published', 'indexed', 'uploaded')
                AND (
                    -- Document permissions
                    EXISTS (
                        SELECT 1 FROM public.document_permissions dp
                        WHERE dp.document_id = rd.id
                        AND dp.user_id = auth.uid()
                        AND dp.can_view = TRUE
                    )
                    -- Student cohort match
                    OR EXISTS (
                        SELECT 1 FROM public.students s
                        WHERE s.user_id = auth.uid()
                        AND (
                            (rd.faculty_assignment_id IS NOT NULL AND EXISTS (
                                SELECT 1 FROM public.faculty_assignments fa
                                WHERE fa.id = rd.faculty_assignment_id
                                AND fa.department_id = s.department_id
                                AND fa.year = s.year
                                AND fa.semester = s.semester
                                AND fa.section = s.section
                                AND fa.is_active = true
                            ))
                            OR (
                                (rd.department_id IS NULL OR rd.department_id = s.department_id)
                                AND (rd.year IS NULL OR rd.year = s.year)
                                AND (rd.section IS NULL OR rd.section = s.section)
                                AND (
                                    rd.subject_id IS NULL OR EXISTS (
                                        SELECT 1 FROM public.faculty_assignments fa2
                                        WHERE fa2.subject_id = rd.subject_id
                                        AND fa2.department_id = s.department_id
                                        AND fa2.year = s.year
                                        AND fa2.semester = s.semester
                                        AND fa2.section = s.section
                                        AND fa2.is_active = true
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
