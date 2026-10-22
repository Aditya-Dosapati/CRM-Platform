-- ==============================================================================
-- Migration: 20261021000001_seed_students_and_fix_cohort_sharing.sql
-- Description: 
--   1. Ensure public.students has academic_year and regulation columns.
--   2. Seed public.students from existing public.users where role = 'student'.
--   3. Create auto-sync trigger so any newly registered student in public.users
--      automatically gets a corresponding public.students record.
--   4. Backfill public.rag_documents cohort and audience columns from metadata.
--   5. Fix public.document_permissions RLS to allow faculty to grant student view permissions.
--   6. Backfill document_permissions for existing selected-student resources.
-- ==============================================================================

-- 1. Ensure columns on public.students
ALTER TABLE public.students 
    ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2025-2026',
    ADD COLUMN IF NOT EXISTS regulation TEXT DEFAULT 'AR23';

-- 2. Seed public.students from public.users (safely skipping any existing user_id or roll_number)
INSERT INTO public.students (user_id, roll_number, department_id, year, semester, section, program, academic_year, regulation)
SELECT 
    u.id AS user_id,
    COALESCE(
        CASE 
            WHEN u.email ~* '^[0-9]{2}[0-9a-z]+@' THEN UPPER(SPLIT_PART(u.email, '@', 1))
            ELSE NULL 
        END,
        'STU_' || SUBSTRING(REPLACE(u.id::text, '-', ''), 1, 10)
    ) AS roll_number,
    CASE 
        WHEN u.email ~* '42' THEN '835f1428-d1ec-47b9-87e0-d281feba4234'::uuid -- AIML
        WHEN u.email ~* '54' THEN 'e126f2f2-8159-4c22-8d86-4ff57ee3d66c'::uuid -- AIDS
        ELSE 'b9cce72e-288c-4091-88a7-fcb31a08863f'::uuid -- CSE
    END AS department_id,
    4 AS year,
    7 AS semester,
    'A' AS section,
    'B.Tech' AS program,
    '2025-2026' AS academic_year,
    'AR23' AS regulation
FROM public.users u
WHERE u.role = 'student'
AND NOT EXISTS (
    SELECT 1 FROM public.students s WHERE s.user_id = u.id
)
AND NOT EXISTS (
    SELECT 1 FROM public.students s2 WHERE s2.roll_number = UPPER(SPLIT_PART(u.email, '@', 1))
)
ON CONFLICT DO NOTHING;

-- Ensure Admins and Faculty have SELECT access to public.students
DROP POLICY IF EXISTS "admins_all_students" ON public.students;
CREATE POLICY "admins_all_students" ON public.students
    FOR ALL
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "faculty_all_students" ON public.students;
CREATE POLICY "faculty_all_students" ON public.students
    FOR SELECT
    TO authenticated
    USING (public.is_faculty());


-- 3. Trigger for automated student provisioning on users insert/update
CREATE OR REPLACE FUNCTION public.handle_new_student_user()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'student' AND NOT EXISTS (SELECT 1 FROM public.students WHERE user_id = NEW.id) THEN
        INSERT INTO public.students (user_id, roll_number, department_id, year, semester, section, program, academic_year, regulation)
        VALUES (
            NEW.id,
            COALESCE(
                CASE 
                    WHEN NEW.email ~* '^[0-9]{2}[0-9a-z]+@' THEN UPPER(SPLIT_PART(NEW.email, '@', 1))
                    ELSE NULL 
                END,
                'STU_' || SUBSTRING(NEW.id::text, 1, 8)
            ),
            CASE 
                WHEN NEW.email ~* '42' THEN '835f1428-d1ec-47b9-87e0-d281feba4234'::uuid
                WHEN NEW.email ~* '54' THEN 'e126f2f2-8159-4c22-8d86-4ff57ee3d66c'::uuid
                ELSE 'b9cce72e-288c-4091-88a7-fcb31a08863f'::uuid
            END,
            4,
            7,
            'A',
            'B.Tech',
            '2025-2026',
            'AR23'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_new_student_user ON public.users;
CREATE TRIGGER trg_new_student_user
    AFTER INSERT OR UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_student_user();

-- 4. Backfill public.rag_documents cohort & audience columns from metadata
UPDATE public.rag_documents
SET 
    department = COALESCE(department, metadata->>'department', 'CSE'),
    branch = COALESCE(branch, metadata->>'branch', 'AIML'),
    year = COALESCE(year, (metadata->>'year')::integer, 4),
    section = COALESCE(section, metadata->>'section', 'A'),
    audience_type = COALESCE(audience_type, metadata->>'audience_type', 'cohort'),
    selected_student_ids = COALESCE(selected_student_ids, metadata->'selected_student_ids', '[]'::jsonb),
    faculty_assignment_id = COALESCE(
        faculty_assignment_id,
        (SELECT fa.id FROM public.faculty_assignments fa WHERE fa.subject_id = rag_documents.subject_id LIMIT 1)
    )
WHERE 
    audience_type IS NULL 
    OR faculty_assignment_id IS NULL 
    OR year IS NULL 
    OR section IS NULL;

-- 5. Fix and ensure can_manage_document helper for document_permissions
CREATE OR REPLACE FUNCTION public.can_manage_document(doc_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    RETURN (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.rag_documents
            WHERE id = doc_id
            AND uploaded_by = auth.uid()
        )
    );
END;
$$;

-- Ensure document_permissions RLS policies
ALTER TABLE public.document_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doc_perms_admin_all" ON public.document_permissions;
DROP POLICY IF EXISTS "doc_perms_uploader_manage" ON public.document_permissions;
DROP POLICY IF EXISTS "doc_perms_user_select" ON public.document_permissions;

CREATE POLICY "doc_perms_admin_all" ON public.document_permissions
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "doc_perms_uploader_manage" ON public.document_permissions
    FOR ALL
    TO authenticated
    USING (public.can_manage_document(document_id))
    WITH CHECK (public.can_manage_document(document_id));

CREATE POLICY "doc_perms_user_select" ON public.document_permissions
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() 
        OR public.can_manage_document(document_id)
        OR public.is_admin() 
        OR public.is_faculty()
    );

-- 6. Backfill document_permissions for existing selected-student documents
INSERT INTO public.document_permissions (document_id, user_id, can_view)
SELECT 
    rd.id AS document_id,
    u.id AS user_id,
    true AS can_view
FROM public.rag_documents rd
CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(rd.selected_student_ids, rd.metadata->'selected_student_ids', '[]'::jsonb)) AS student_identifier
JOIN public.users u ON (
    u.id::text = student_identifier
    OR UPPER(u.email) LIKE UPPER(student_identifier || '%')
    OR u.email = student_identifier
)
WHERE rd.audience_type = 'selected_students' OR rd.metadata->>'audience_type' = 'selected_students'
ON CONFLICT (document_id, user_id) DO NOTHING;
