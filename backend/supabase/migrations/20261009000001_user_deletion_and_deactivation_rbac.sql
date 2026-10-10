-- ==============================================================================
-- Migration: 20261009000001_user_deletion_and_deactivation_rbac.sql
-- Description: Robust Admin RPCs for Permanent User Deletion and Status Management
--              Ensures cascading deletion of dependent student/faculty records
--              and strictly enforces backend administrator-only authorization.
-- ==============================================================================

-- 1. Helper Function: public.admin_delete_user
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_role TEXT;
    v_target_email TEXT;
    v_student_id UUID;
    v_faculty_id UUID;
    v_caller_id UUID := auth.uid();
BEGIN
    -- 1. Enforce Administrator Privileges
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION '403 Forbidden: Only administrators can permanently delete accounts.';
    END IF;

    -- 2. Self-Protection Rule: Cannot delete own administrator account
    IF p_user_id = v_caller_id THEN
        RAISE EXCEPTION '403 Forbidden: Administrators cannot delete their own active account.';
    END IF;

    -- 3. Check Target User Existence
    SELECT role, email INTO v_target_role, v_target_email
    FROM public.users
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User with ID % not found in public.users.', p_user_id;
    END IF;

    -- 4. Clean up dependent academic records safely
    IF v_target_role = 'student' THEN
        SELECT id INTO v_student_id FROM public.students WHERE user_id = p_user_id;
        IF v_student_id IS NOT NULL THEN
            -- Delete submission answers and submissions
            DELETE FROM public.assessment_answers
            WHERE submission_id IN (
                SELECT id FROM public.assessment_submissions WHERE student_id = v_student_id
            );
            DELETE FROM public.assessment_submissions WHERE student_id = v_student_id;
            DELETE FROM public.students WHERE id = v_student_id;
        END IF;
    ELSIF v_target_role = 'faculty' THEN
        SELECT id INTO v_faculty_id FROM public.faculty WHERE user_id = p_user_id;
        IF v_faculty_id IS NOT NULL THEN
            DELETE FROM public.faculty_assignments WHERE faculty_id = v_faculty_id;
            DELETE FROM public.assessments WHERE faculty_id = v_faculty_id;
            DELETE FROM public.faculty WHERE id = v_faculty_id;
        END IF;
    END IF;

    -- 5. Delete from public.users
    DELETE FROM public.users WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'userId', p_user_id,
        'email', v_target_email,
        'role', v_target_role,
        'message', format('User %s successfully deleted from database.', v_target_email)
    );
END;
$$;

-- 2. Helper Function: public.admin_set_user_status
CREATE OR REPLACE FUNCTION public.admin_set_user_status(p_user_id UUID, p_status TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_status TEXT;
    v_target_email TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION '403 Forbidden: Only administrators can update user status.';
    END IF;

    v_clean_status := lower(trim(p_status));
    IF v_clean_status NOT IN ('active', 'inactive', 'pending', 'rejected', 'suspended') THEN
        RAISE EXCEPTION 'Invalid status: %. Must be active, inactive, pending, rejected, or suspended.', p_status;
    END IF;

    UPDATE public.users
    SET status = v_clean_status
    WHERE id = p_user_id
    RETURNING email INTO v_target_email;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User with ID % not found in public.users.', p_user_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'userId', p_user_id,
        'email', v_target_email,
        'status', v_clean_status,
        'message', format('User %s status updated to %s.', v_target_email, v_clean_status)
    );
END;
$$;

-- 3. Grant Permissions to Authenticated Users
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_status(UUID, TEXT) TO authenticated;
