-- ==============================================================================
-- Migration: 20261029000001_fix_syllabus_access_and_subjects_rls.sql
-- Description: 1. Allow public/anon + authenticated SELECT on public.subjects
--              2. Allow students to view institutional syllabi (document_type = 'syllabus')
--                 matching their department/semester without requiring a faculty_assignment
--              3. Update can_read_rag_document storage function for syllabus downloads
-- ==============================================================================

-- 1. Allow public & authenticated read access to public.subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view subjects" ON public.subjects;
DROP POLICY IF EXISTS "Allow public read access to subjects" ON public.subjects;
DROP POLICY IF EXISTS "Allow authenticated read access to subjects" ON public.subjects;

CREATE POLICY "Anyone can view subjects"
ON public.subjects
FOR SELECT
TO anon, authenticated
USING (true);

-- 2. Update RLS policy on public.rag_documents
DROP POLICY IF EXISTS "rag_docs_authenticated_select" ON public.rag_documents;

CREATE POLICY "rag_docs_authenticated_select" ON public.rag_documents
    FOR SELECT
    TO authenticated
    USING (
        -- 1. Admin global access
        public.is_admin()
        -- 2. Faculty/Uploader access to own documents
        OR uploaded_by = auth.uid()
        -- 3. Student access to published/indexed/uploaded documents
        OR (
            status IN ('published', 'indexed', 'uploaded')
            AND (
                -- Case 0: Institutional syllabus / curriculum documents are accessible to students matching department
                (
                    (document_type = 'syllabus' OR document_type = 'curriculum' OR audience_type = 'all')
                    AND EXISTS (
                        SELECT 1 FROM public.students s
                        WHERE s.user_id = auth.uid()
                        AND (rag_documents.department_id IS NULL OR rag_documents.department_id = s.department_id)
                        AND (
                            rag_documents.semester IS NULL 
                            OR rag_documents.semester = s.semester::text 
                            OR rag_documents.semester = ('Semester ' || s.semester::text)
                            OR rag_documents.semester = ('Sem ' || s.semester::text)
                        )
                    )
                )
                -- Case A: Explicit permission in document_permissions (for selected_students audience)
                OR EXISTS (
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
                -- Case C: Entire mapped cohort audience (when audience_type is 'cohort' or default)
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
                                    OR rag_documents.semester = ('Sem ' || s.semester::text)
                                )
                                AND (rag_documents.section IS NULL OR rag_documents.section = s.section)
                                AND (
                                    rag_documents.subject_id IS NULL 
                                    OR rag_documents.document_type = 'syllabus'
                                    OR EXISTS (
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

-- 3. Storage access helper update for syllabus
CREATE OR REPLACE FUNCTION public.can_read_rag_document(object_name TEXT, object_owner UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- 1. Admins have unrestricted access
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
        WHERE (rd.storage_path = object_name OR rd.file_name = object_name)
        AND (
            -- Uploader access
            rd.uploaded_by = auth.uid()
            OR (
                -- Published, indexed, or uploaded status
                rd.status IN ('published', 'indexed', 'uploaded')
                AND (
                    -- Institutional syllabus / all audience
                    (
                        (rd.document_type = 'syllabus' OR rd.document_type = 'curriculum' OR rd.audience_type = 'all')
                        AND EXISTS (
                            SELECT 1 FROM public.students s
                            WHERE s.user_id = auth.uid()
                            AND (rd.department_id IS NULL OR rd.department_id = s.department_id)
                            AND (
                                rd.semester IS NULL 
                                OR rd.semester = s.semester::text 
                                OR rd.semester = ('Semester ' || s.semester::text)
                                OR rd.semester = ('Sem ' || s.semester::text)
                            )
                        )
                    )
                    -- Explicit user permission in document_permissions
                    OR EXISTS (
                        SELECT 1 FROM public.document_permissions dp
                        WHERE dp.document_id = rd.id
                        AND dp.user_id = auth.uid()
                        AND dp.can_view = TRUE
                    )
                    -- Selected students audience
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
                    -- Cohort audience
                    OR (
                        (rd.audience_type IS NULL OR rd.audience_type = 'cohort' OR rd.audience_type = 'all')
                        AND EXISTS (
                            SELECT 1 FROM public.students s
                            WHERE s.user_id = auth.uid()
                            AND (
                                -- Linked faculty assignment cohort match
                                (rd.faculty_assignment_id IS NOT NULL AND EXISTS (
                                    SELECT 1 FROM public.faculty_assignments fa
                                    WHERE fa.id = rd.faculty_assignment_id
                                    AND fa.department_id = s.department_id
                                    AND fa.year = s.year
                                    AND fa.semester = s.semester
                                    AND fa.section = s.section
                                    AND fa.is_active = true
                                ))
                                -- Direct cohort match
                                OR (
                                    (rd.department_id IS NULL OR rd.department_id = s.department_id)
                                    AND (rd.year IS NULL OR rd.year = s.year)
                                    AND (rd.section IS NULL OR rd.section = s.section)
                                    AND (
                                        rd.subject_id IS NULL 
                                        OR rd.document_type = 'syllabus'
                                        OR EXISTS (
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_access_rag_storage_object(object_name TEXT, object_owner UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.can_read_rag_document(object_name, object_owner);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

