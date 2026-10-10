-- ==============================================================================
-- Migration: 20261010000003_fix_rag_storage_pdf_access.sql
-- Description: Fix Student PDF Preview & Download Access Control in Supabase Storage
--              Ensures published, uploaded, and indexed resources in 'rag-documents'
--              are readable by authorized students (cohort match, direct permission,
--              or selected_student_ids).
-- ==============================================================================

-- 1. Helper function: can_read_rag_document
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
                    -- A. Explicit user permission in document_permissions
                    EXISTS (
                        SELECT 1 FROM public.document_permissions dp
                        WHERE dp.document_id = rd.id
                        AND dp.user_id = auth.uid()
                        AND dp.can_view = TRUE
                    )
                    -- B. Selected students audience
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
                    -- C. Entire mapped cohort audience (cohort / all / default)
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Also maintain alias function can_access_rag_storage_object
CREATE OR REPLACE FUNCTION public.can_access_rag_storage_object(object_name TEXT, object_owner UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.can_read_rag_document(object_name, object_owner);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 2. Re-apply SELECT policy on storage.objects for 'rag-documents' bucket
DROP POLICY IF EXISTS "rag_storage_authorized_select" ON storage.objects;
DROP POLICY IF EXISTS "rag_storage_authenticated_select" ON storage.objects;

CREATE POLICY "rag_storage_authorized_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'rag-documents'
    AND public.can_read_rag_document(name, owner)
);
