-- ==============================================================================
-- Migration: 20260923000002_allow_anon_read_departments.sql
-- Description: Allow unauthenticated (anon) and authenticated users to read 
--              public.departments for registration form and academic catalog.
-- ==============================================================================

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to departments" ON public.departments;
DROP POLICY IF EXISTS "Allow authenticated read access to departments" ON public.departments;
DROP POLICY IF EXISTS "Departments read policy" ON public.departments;
DROP POLICY IF EXISTS "Anyone can view departments" ON public.departments;
DROP POLICY IF EXISTS "Authenticated users can view departments" ON public.departments;

CREATE POLICY "Anyone can view departments"
ON public.departments
FOR SELECT
TO anon, authenticated
USING (true);
