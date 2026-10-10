-- ==============================================================================
-- Migration: 20261010000002_faculty_assignment_and_student_roster_access.sql
-- Description: Fix Faculty Assignment loading and Student Roster visibility for Faculty
-- ==============================================================================

-- 1. Update public.users SELECT policy to allow faculty to view student user profiles
DROP POLICY IF EXISTS "Users view own or admin view all" ON public.users;
DROP POLICY IF EXISTS "Users view own, admin view all, faculty view students" ON public.users;

CREATE POLICY "Users view own, admin view all, faculty view students"
ON public.users
FOR SELECT
TO authenticated
USING (
    id = auth.uid() OR 
    public.is_admin() OR 
    (public.is_faculty() AND role = 'student')
);

-- 2. Ensure public.faculty_assignments allows faculty to read all active teaching assignments
DROP POLICY IF EXISTS "faculty_assignments_faculty_select" ON public.faculty_assignments;
DROP POLICY IF EXISTS "faculty_assignments_auth_select" ON public.faculty_assignments;

CREATE POLICY "faculty_assignments_faculty_select"
ON public.faculty_assignments
FOR SELECT
TO authenticated
USING (
    public.is_admin() OR
    public.is_faculty() OR
    faculty_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid()) OR
    is_active = true
);

-- 3. Ensure public.students allows faculty to view student cohort records
DROP POLICY IF EXISTS "Students view own or admin view all" ON public.students;

CREATE POLICY "Students view own or admin view all"
ON public.students
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR 
    public.is_admin() OR 
    public.is_faculty()
);

-- 4. Ensure public.faculty is readable by authenticated users
DROP POLICY IF EXISTS "Faculty view all" ON public.faculty;

CREATE POLICY "Faculty view all"
ON public.faculty
FOR SELECT
TO authenticated
USING (true);
