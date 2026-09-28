-- ==============================================================================
-- Migration: 20260928000001_add_must_change_password_flag.sql
-- Description: Add must_change_password flag for bulk-imported users and secure
--              password-change completion RPC function.
-- ==============================================================================

-- 1. Add must_change_password column to public.users (Default FALSE for existing/self-registered users)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

-- 2. Secure RPC to complete password change (Authorized via auth.uid(), no client user_id trusted)
CREATE OR REPLACE FUNCTION public.complete_password_change()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION '401 Unauthorized: Valid authentication session required.';
    END IF;

    UPDATE public.users
    SET must_change_password = false
    WHERE id = v_uid;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User record not found for authenticated ID %', v_uid;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'userId', v_uid,
        'mustChangePassword', false,
        'message', 'Temporary password flag successfully cleared.'
    );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.complete_password_change() TO authenticated;
