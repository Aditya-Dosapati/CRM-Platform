-- ==============================================================================
-- Migration: 20261005000002_faculty_assignments.sql
-- Description: Faculty Assignment Management (Faculty <-> Subject <-> Class/Section)
--              Full connected relational system for Admin, Faculty, and Student portals.
-- ==============================================================================

-- 1. Create table: public.faculty_assignments
CREATE TABLE IF NOT EXISTS public.faculty_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL DEFAULT '2025-2026',
    regulation TEXT NOT NULL DEFAULT 'AR23',
    year INTEGER NOT NULL DEFAULT 1,
    semester INTEGER NOT NULL DEFAULT 1,
    section TEXT NOT NULL DEFAULT 'A',
    assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Performance & Query Resolution Indexes
CREATE INDEX IF NOT EXISTS idx_faculty_assignments_faculty_id ON public.faculty_assignments(faculty_id);
CREATE INDEX IF NOT EXISTS idx_faculty_assignments_subject_id ON public.faculty_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_faculty_assignments_dept_id ON public.faculty_assignments(department_id);
CREATE INDEX IF NOT EXISTS idx_faculty_assignments_dept_sec ON public.faculty_assignments(department_id, year, semester, section);
CREATE INDEX IF NOT EXISTS idx_faculty_assignments_is_active ON public.faculty_assignments(is_active);

-- 3. Automatic updated_at Trigger
DROP TRIGGER IF EXISTS trg_faculty_assignments_updated_at ON public.faculty_assignments;
CREATE TRIGGER trg_faculty_assignments_updated_at
    BEFORE UPDATE ON public.faculty_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.faculty_assignments ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if any
DROP POLICY IF EXISTS "faculty_assignments_admin_all" ON public.faculty_assignments;
DROP POLICY IF EXISTS "faculty_assignments_faculty_select" ON public.faculty_assignments;
DROP POLICY IF EXISTS "faculty_assignments_student_select" ON public.faculty_assignments;
DROP POLICY IF EXISTS "faculty_assignments_auth_select" ON public.faculty_assignments;

-- Policy A: Admin Full Management (CRUD)
CREATE POLICY "faculty_assignments_admin_all"
ON public.faculty_assignments
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Policy B: Faculty Read (Can read own assignments and active curriculum assignments)
CREATE POLICY "faculty_assignments_faculty_select"
ON public.faculty_assignments
FOR SELECT
TO authenticated
USING (
    public.is_faculty() OR
    faculty_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid())
);

-- Policy C: Student Read (Can read assignments relevant to their department, year, semester, and section)
CREATE POLICY "faculty_assignments_student_select"
ON public.faculty_assignments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.user_id = auth.uid()
        AND s.department_id = faculty_assignments.department_id
        AND s.year = faculty_assignments.year
        AND s.semester = faculty_assignments.semester
        AND s.section = faculty_assignments.section
    )
);

-- Policy D: Allow all authenticated users to read active assignments if role functions are resolving
CREATE POLICY "faculty_assignments_auth_select"
ON public.faculty_assignments
FOR SELECT
TO authenticated
USING (is_active = true);
