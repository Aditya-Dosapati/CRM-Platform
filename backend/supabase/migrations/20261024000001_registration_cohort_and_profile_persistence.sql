-- Migration: 20261024000001_registration_cohort_and_profile_persistence.sql
-- Description: Helper RPCs to securely persist student academic cohort and faculty details
--              during self-registration, and synchronize the automated student provisioning trigger.

-- 1. Function: save_student_registration_cohort
CREATE OR REPLACE FUNCTION public.save_student_registration_cohort(
    p_user_id UUID,
    p_roll_number TEXT,
    p_department_id UUID,
    p_year INT,
    p_semester INT,
    p_section TEXT,
    p_program TEXT DEFAULT 'B.Tech'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.students (
        user_id,
        roll_number,
        department_id,
        year,
        semester,
        section,
        program,
        academic_year,
        regulation
    )
    VALUES (
        p_user_id,
        p_roll_number,
        p_department_id,
        p_year,
        p_semester,
        p_section,
        COALESCE(p_program, 'B.Tech'),
        '2025-2026',
        'AR23'
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
        roll_number = EXCLUDED.roll_number,
        department_id = EXCLUDED.department_id,
        year = EXCLUDED.year,
        semester = EXCLUDED.semester,
        section = EXCLUDED.section,
        program = EXCLUDED.program;

    RETURN jsonb_build_object(
        'success', true,
        'userId', p_user_id,
        'message', 'Student cohort details successfully persisted.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_student_registration_cohort TO anon, authenticated, service_role;

-- 2. Function: save_faculty_registration_details
CREATE OR REPLACE FUNCTION public.save_faculty_registration_details(
    p_user_id UUID,
    p_employee_id TEXT,
    p_department_id UUID,
    p_designation TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.faculty (
        user_id,
        employee_id,
        department_id,
        designation
    )
    VALUES (
        p_user_id,
        p_employee_id,
        p_department_id,
        COALESCE(p_designation, 'Assistant Professor')
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
        employee_id = EXCLUDED.employee_id,
        department_id = EXCLUDED.department_id,
        designation = EXCLUDED.designation;

    RETURN jsonb_build_object(
        'success', true,
        'userId', p_user_id,
        'message', 'Faculty details successfully persisted.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_faculty_registration_details TO anon, authenticated, service_role;

-- 3. Update handle_new_student_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_student_user()
RETURNS TRIGGER AS $$
DECLARE
    v_meta JSONB;
    v_roll TEXT;
    v_dept_id UUID;
    v_year INT;
    v_sem INT;
    v_sec TEXT;
    v_program TEXT;
    v_raw_year TEXT;
    v_raw_sem TEXT;
BEGIN
    IF NEW.role = 'student' THEN
        -- Retrieve metadata from auth.users if available
        SELECT raw_user_meta_data INTO v_meta
        FROM auth.users
        WHERE id = NEW.id;

        v_roll := COALESCE(
            v_meta->>'rollNumber',
            v_meta->>'roll_number',
            CASE 
                WHEN NEW.email ~* '^[0-9]{2}[0-9a-z]+@' THEN UPPER(SPLIT_PART(NEW.email, '@', 1))
                ELSE NULL 
            END,
            'STU_' || SUBSTRING(NEW.id::text, 1, 8)
        );

        -- Resolve department_id from metadata or email
        v_dept_id := CASE 
            WHEN v_meta->>'department_id' IS NOT NULL AND v_meta->>'department_id' ~* '^[0-9a-f-]{36}$' THEN (v_meta->>'department_id')::uuid
            WHEN v_meta->>'branch' = 'AIML' OR v_meta->>'branch' = 'dept-aiml' OR v_meta->>'branch' ~* 'AIML' THEN '835f1428-d1ec-47b9-87e0-d281feba4234'::uuid
            WHEN v_meta->>'branch' = 'AIDS' OR v_meta->>'branch' = 'dept-aids' OR v_meta->>'branch' ~* 'AIDS' THEN 'e126f2f2-8159-4c22-8d86-4ff57ee3d66c'::uuid
            WHEN v_meta->>'department' ~* '835f1428-d1ec-47b9-87e0-d281feba4234' THEN '835f1428-d1ec-47b9-87e0-d281feba4234'::uuid
            WHEN v_meta->>'department' ~* 'e126f2f2-8159-4c22-8d86-4ff57ee3d66c' THEN 'e126f2f2-8159-4c22-8d86-4ff57ee3d66c'::uuid
            WHEN NEW.email ~* '42' THEN '835f1428-d1ec-47b9-87e0-d281feba4234'::uuid
            WHEN NEW.email ~* '54' THEN 'e126f2f2-8159-4c22-8d86-4ff57ee3d66c'::uuid
            ELSE 'b9cce72e-288c-4091-88a7-fcb31a08863f'::uuid
        END;

        v_raw_year := COALESCE(v_meta->>'year', '');
        v_year := CASE
            WHEN v_raw_year ~* 'IV|4' THEN 4
            WHEN v_raw_year ~* 'III|3' THEN 3
            WHEN v_raw_year ~* 'II|2' THEN 2
            WHEN v_raw_year ~* 'I|1' THEN 1
            ELSE 1
        END;

        v_raw_sem := COALESCE(v_meta->>'semester', '');
        v_sem := COALESCE(NULLIF(regexp_replace(v_raw_sem, '[^0-9]', '', 'g'), '')::int, v_year * 2 - 1);
        IF v_sem < 1 OR v_sem > 8 THEN v_sem := v_year * 2 - 1; END IF;

        v_sec := COALESCE(NULLIF(UPPER(TRIM(regexp_replace(COALESCE(v_meta->>'section', ''), '^Section\\s*', '', 'i'))), ''), 'A');
        v_program := COALESCE(NULLIF(TRIM(v_meta->>'program'), ''), 'B.Tech');

        IF EXISTS (SELECT 1 FROM public.students WHERE user_id = NEW.id) THEN
            UPDATE public.students
            SET roll_number = COALESCE(v_roll, roll_number),
                department_id = COALESCE(v_dept_id, department_id),
                year = COALESCE(v_year, year),
                semester = COALESCE(v_sem, semester),
                section = COALESCE(v_sec, section),
                program = COALESCE(v_program, program)
            WHERE user_id = NEW.id;
        ELSE
            INSERT INTO public.students (user_id, roll_number, department_id, year, semester, section, program, academic_year, regulation)
            VALUES (
                NEW.id,
                v_roll,
                v_dept_id,
                v_year,
                v_sem,
                v_sec,
                v_program,
                '2025-2026',
                'AR23'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
