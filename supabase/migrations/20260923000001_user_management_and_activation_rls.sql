-- ==============================================================================
-- Migration: 20260923000001_user_management_and_activation_rls.sql
-- Description: Admin-Controlled Activation, Helper Functions & Complete RLS
--              (Auth accounts are created via Supabase Admin Auth API in Edge Functions;
--               ZERO direct SQL manipulation of auth.users or auth.identities)
-- ==============================================================================

-- ==============================================================================
-- 0. Schema Constraint: Update users_status_check to support pending & rejected
-- ==============================================================================
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE public.users ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive', 'pending', 'rejected'));
ALTER TABLE public.users ALTER COLUMN status SET DEFAULT 'pending';

-- ==============================================================================
-- 1. Helper Function: public.admin_approve_user
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.admin_approve_user(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION '403 Forbidden: Only administrators can approve user registrations.';
    END IF;

    UPDATE public.users
    SET status = 'active'
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User with ID % not found in public.users.', p_user_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'userId', p_user_id,
        'status', 'active',
        'message', 'User successfully approved and activated.'
    );
END;
$$;

-- ==============================================================================
-- 2. Helper Function: public.admin_reject_user
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.admin_reject_user(p_user_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION '403 Forbidden: Only administrators can reject user registrations.';
    END IF;

    UPDATE public.users
    SET status = 'rejected'
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User with ID % not found in public.users.', p_user_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'userId', p_user_id,
        'status', 'rejected',
        'reason', p_reason,
        'message', 'User registration rejected.'
    );
END;
$$;

-- ==============================================================================
-- 3. Helper Function: public.admin_set_user_status
-- Toggle status: active, inactive, pending, rejected
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.admin_set_user_status(p_user_id UUID, p_status TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_status TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION '403 Forbidden: Only administrators can update user activation status.';
    END IF;

    v_clean_status := lower(trim(p_status));
    IF v_clean_status NOT IN ('active', 'inactive', 'pending', 'rejected') THEN
        RAISE EXCEPTION 'Invalid status: %. Must be active, inactive, pending, or rejected.', p_status;
    END IF;

    UPDATE public.users
    SET status = v_clean_status
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User with ID % not found in public.users.', p_user_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'userId', p_user_id,
        'status', v_clean_status,
        'message', format('User status updated to %s.', v_clean_status)
    );
END;
$$;

-- ==============================================================================
-- 4. Row-Level Security (RLS) Policies
-- ==============================================================================

-- A. Table: public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to read own profile" ON public.users;
DROP POLICY IF EXISTS "Admin full access to users" ON public.users;
DROP POLICY IF EXISTS "Users view own or admin view all" ON public.users;
DROP POLICY IF EXISTS "Users insert policy" ON public.users;
DROP POLICY IF EXISTS "Users update policy" ON public.users;
DROP POLICY IF EXISTS "Users delete policy" ON public.users;

-- SELECT: User can view their own profile, Admin can view all users
CREATE POLICY "Users view own or admin view all"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.is_admin());

-- INSERT: Admin can insert, or self-registered user inserting own row with status = pending
CREATE POLICY "Users insert policy"
ON public.users
FOR INSERT
TO authenticated, anon
WITH CHECK (
    public.is_admin() OR 
    (id = auth.uid() AND role IN ('student', 'faculty') AND status = 'pending')
);

-- UPDATE: Admin full update OR user can update own non-sensitive fields
CREATE POLICY "Users update policy"
ON public.users
FOR UPDATE
TO authenticated
USING (public.is_admin() OR id = auth.uid())
WITH CHECK (
    public.is_admin() OR 
    (id = auth.uid() AND role = (SELECT u.role FROM public.users u WHERE u.id = auth.uid()) AND status = (SELECT u.status FROM public.users u WHERE u.id = auth.uid()))
);

-- DELETE: Admin only
CREATE POLICY "Users delete policy"
ON public.users
FOR DELETE
TO authenticated
USING (public.is_admin());


-- B. Table: public.students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students view own or admin view all" ON public.students;
DROP POLICY IF EXISTS "Students insert policy" ON public.students;
DROP POLICY IF EXISTS "Students update policy" ON public.students;
DROP POLICY IF EXISTS "Students delete policy" ON public.students;

CREATE POLICY "Students view own or admin view all"
ON public.students
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin() OR public.is_faculty());

CREATE POLICY "Students insert policy"
ON public.students
FOR INSERT
TO authenticated, anon
WITH CHECK (public.is_admin() OR user_id = auth.uid());

CREATE POLICY "Students update policy"
ON public.students
FOR UPDATE
TO authenticated
USING (public.is_admin() OR user_id = auth.uid())
WITH CHECK (public.is_admin() OR user_id = auth.uid());

CREATE POLICY "Students delete policy"
ON public.students
FOR DELETE
TO authenticated
USING (public.is_admin());


-- C. Table: public.faculty
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Faculty view all" ON public.faculty;
DROP POLICY IF EXISTS "Faculty insert policy" ON public.faculty;
DROP POLICY IF EXISTS "Faculty update policy" ON public.faculty;
DROP POLICY IF EXISTS "Faculty delete policy" ON public.faculty;

CREATE POLICY "Faculty view all"
ON public.faculty
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Faculty insert policy"
ON public.faculty
FOR INSERT
TO authenticated, anon
WITH CHECK (public.is_admin() OR user_id = auth.uid());

CREATE POLICY "Faculty update policy"
ON public.faculty
FOR UPDATE
TO authenticated
USING (public.is_admin() OR user_id = auth.uid())
WITH CHECK (public.is_admin() OR user_id = auth.uid());

CREATE POLICY "Faculty delete policy"
ON public.faculty
FOR DELETE
TO authenticated
USING (public.is_admin());


-- D. Table: public.student_subjects
ALTER TABLE public.student_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Student subjects select" ON public.student_subjects;
DROP POLICY IF EXISTS "Student subjects manage" ON public.student_subjects;

CREATE POLICY "Student subjects select"
ON public.student_subjects
FOR SELECT
TO authenticated
USING (
    public.is_admin() OR 
    public.is_faculty() OR 
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

CREATE POLICY "Student subjects manage"
ON public.student_subjects
FOR ALL
TO authenticated
USING (public.is_admin() OR public.is_faculty())
WITH CHECK (public.is_admin() OR public.is_faculty());


-- E. Table: public.faculty_subjects
ALTER TABLE public.faculty_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Faculty subjects select" ON public.faculty_subjects;
DROP POLICY IF EXISTS "Faculty subjects manage" ON public.faculty_subjects;

CREATE POLICY "Faculty subjects select"
ON public.faculty_subjects
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Faculty subjects manage"
ON public.faculty_subjects
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Grant execute on stored functions to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_approve_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_status TO authenticated;
