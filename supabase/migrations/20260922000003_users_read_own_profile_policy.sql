-- Migration: 20260922000003_users_read_own_profile_policy.sql
-- Description: Minimal secure RLS policy allowing authenticated users to read their own profile

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to read own profile" ON public.users;

CREATE POLICY "Users can read own profile"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());
