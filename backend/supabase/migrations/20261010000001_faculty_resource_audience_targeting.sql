-- ==============================================================================
-- Migration: 20261010000001_faculty_resource_audience_targeting.sql
-- Description: Enable Granular Audience Targeting (Cohort vs Selected Students)
--              1. Add audience_type and selected_student_ids columns to public.rag_documents
--              2. Add performance index on audience_type
--              3. Update public.rag_documents RLS policies for cohort vs selected student access
--              4. Update storage access function for audience-specific PDF downloads
-- ==============================================================================

-- 1. Add audience targeting columns to public.rag_documents
ALTER TABLE public.rag_documents 
    ADD COLUMN IF NOT EXISTS audience_type TEXT DEFAULT 'cohort',
    ADD COLUMN IF NOT EXISTS selected_student_ids JSONB DEFAULT '[]'::jsonb;

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_rag_documents_audience ON public.rag_documents(audience_type);

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

-- Policy B: Faculty Insert
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

-- Policy E: Authenticated SELECT with Audience-Level Student Isolation
CREATE POLICY "rag_docs_authenticated_select" ON public.rag_documents
    FOR SELECT
    TO authenticated
    USING (
        -- 1. Admin global access
        public.is_admin()
        -- 2. Faculty/Uploader access to own documents
        OR uploaded_by = auth.uid()
        -- 3. Student access to published/indexed documents
        OR (
            status IN ('published', 'indexed', 'uploaded')
            AND (
                -- Case A: Explicit permission in document_permissions (for selected_students audience)
                EXISTS (
                    SELECT 1 FROM public.document_permissions dp
                    WHERE dp.document_id = rag_documents.id
                    AND dp.user_id = auth.uid()
                    AND dp.can_view = TRUE
                )
                -- Case B: Student ID is in selected_student_ids JSON array
                OR (
                    rag_documents.audience_type = 'selected_students'
                    AND EXISTS (
                        SELECT 1 FROM public.students s
                        WHERE s.user_id = auth.uid()
                        AND (
                            rag_documents.selected_student_ids ? auth.uid()::text
                            OR rag_documents.selected_student_ids ? s.id::text
                            OR (s.roll_number IS NOT NULL AND rag_documents.selected_student_ids ? s.roll_number)
                        )
                    )
                )
                -- Case C: Entire mapped cohort audience (when audience_type is 'cohort' or 'all' or default)
                OR (
                    (rag_documents.audience_type IS NULL OR rag_documents.audience_type = 'cohort' OR rag_documents.audience_type = 'all')
                    AND EXISTS (
                        SELECT 1 FROM public.students s
                        WHERE s.user_id = auth.uid()
                        AND (
                            -- Linked to specific faculty_assignment matching student cohort
                            (rag_documents.faculty_assignment_id IS NOT NULL AND EXISTS (
                                SELECT 1 FROM public.faculty_assignments fa
                                WHERE fa.id = rag_documents.faculty_assignment_id
                                AND fa.department_id = s.department_id
                                AND fa.year = s.year
                                AND fa.semester = s.semester
                                AND fa.section = s.section
                                AND fa.is_active = true
                            ))
                            -- Direct cohort match on rag_documents
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
        )
    );

-- 4. Storage helper function update for audience targeting
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

    -- 3. Check access against rag_documents
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
                    -- Selected students JSON check
                    OR (
                        rd.audience_type = 'selected_students'
                        AND EXISTS (
                            SELECT 1 FROM public.students s
                            WHERE s.user_id = auth.uid()
                            AND (
                                rd.selected_student_ids ? auth.uid()::text
                                OR rd.selected_student_ids ? s.id::text
                                OR (s.roll_number IS NOT NULL AND rd.selected_student_ids ? s.roll_number)
                            )
                        )
                    )
                    -- Entire cohort match
                    OR (
                        (rd.audience_type IS NULL OR rd.audience_type = 'cohort' OR rd.audience_type = 'all')
                        AND EXISTS (
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
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
