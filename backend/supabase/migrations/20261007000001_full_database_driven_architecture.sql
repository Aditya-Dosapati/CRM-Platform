-- ==============================================================================
-- Migration: 20261007000001_full_database_driven_architecture.sql
-- Description: Complete Database-Driven Architecture for GMR CRM
--              1. faculty_assignments (Faculty <-> Subject <-> Section)
--              2. assessments (Faculty Assessments linked to Cohort & Resources)
--              3. assessment_questions (Assessment MCQs & Answers)
--              4. assessment_submissions (Student Submissions, Scores & Results)
--              5. assessment_answers (Student Chosen Options & Question Results)
--              6. Enhanced RLS Policies for Admin, Faculty, and Students
-- ==============================================================================

-- ==============================================================================
-- 1. Table: public.faculty_assignments
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.faculty_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL DEFAULT '2025-2026',
    regulation TEXT NOT NULL DEFAULT 'AR23',
    year INTEGER NOT NULL DEFAULT 4,
    semester INTEGER NOT NULL DEFAULT 7,
    section TEXT NOT NULL DEFAULT 'A',
    assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_faculty_assignment_unique UNIQUE (faculty_id, subject_id, department_id, year, semester, section, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_fa_faculty_id ON public.faculty_assignments(faculty_id);
CREATE INDEX IF NOT EXISTS idx_fa_subject_id ON public.faculty_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_fa_dept_id ON public.faculty_assignments(department_id);
CREATE INDEX IF NOT EXISTS idx_fa_cohort ON public.faculty_assignments(department_id, year, semester, section);
CREATE INDEX IF NOT EXISTS idx_fa_is_active ON public.faculty_assignments(is_active);

-- Auto updated_at Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_faculty_assignments_updated_at ON public.faculty_assignments;
CREATE TRIGGER trg_faculty_assignments_updated_at
    BEFORE UPDATE ON public.faculty_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- RLS for faculty_assignments
ALTER TABLE public.faculty_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fa_admin_all" ON public.faculty_assignments;
DROP POLICY IF EXISTS "fa_faculty_select" ON public.faculty_assignments;
DROP POLICY IF EXISTS "fa_auth_select" ON public.faculty_assignments;

CREATE POLICY "fa_admin_all"
ON public.faculty_assignments
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "fa_faculty_select"
ON public.faculty_assignments
FOR SELECT
TO authenticated
USING (
    public.is_faculty() OR
    faculty_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid())
);

CREATE POLICY "fa_auth_select"
ON public.faculty_assignments
FOR SELECT
TO authenticated
USING (is_active = true);


-- ==============================================================================
-- 2. Table: public.assessments
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
    faculty_assignment_id UUID REFERENCES public.faculty_assignments(id) ON DELETE SET NULL,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL DEFAULT '2025-2026',
    regulation TEXT NOT NULL DEFAULT 'AR23',
    year INTEGER NOT NULL DEFAULT 4,
    semester INTEGER NOT NULL DEFAULT 7,
    section TEXT NOT NULL DEFAULT 'A',
    resource_id UUID REFERENCES public.rag_documents(id) ON DELETE SET NULL,
    source_resource_name TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 20,
    due_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'closed', 'archived')),
    total_marks INTEGER NOT NULL DEFAULT 10,
    pass_percentage INTEGER NOT NULL DEFAULT 50,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asmt_faculty_id ON public.assessments(faculty_id);
CREATE INDEX IF NOT EXISTS idx_asmt_assignment_id ON public.assessments(faculty_assignment_id);
CREATE INDEX IF NOT EXISTS idx_asmt_subject_id ON public.assessments(subject_id);
CREATE INDEX IF NOT EXISTS idx_asmt_dept_cohort ON public.assessments(department_id, year, semester, section);
CREATE INDEX IF NOT EXISTS idx_asmt_status ON public.assessments(status);

DROP TRIGGER IF EXISTS trg_assessments_updated_at ON public.assessments;
CREATE TRIGGER trg_assessments_updated_at
    BEFORE UPDATE ON public.assessments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assessments_admin_all" ON public.assessments;
DROP POLICY IF EXISTS "assessments_faculty_manage" ON public.assessments;
DROP POLICY IF EXISTS "assessments_student_select" ON public.assessments;

CREATE POLICY "assessments_admin_all"
ON public.assessments
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "assessments_faculty_manage"
ON public.assessments
FOR ALL
TO authenticated
USING (
    faculty_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid()) OR
    public.is_admin()
)
WITH CHECK (
    faculty_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid()) OR
    public.is_admin()
);

CREATE POLICY "assessments_student_select"
ON public.assessments
FOR SELECT
TO authenticated
USING (
    status = 'published' AND
    (
        public.is_admin() OR
        public.is_faculty() OR
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.user_id = auth.uid()
            AND s.department_id = assessments.department_id
            AND s.year = assessments.year
            AND s.semester = assessments.semester
            AND s.section = assessments.section
        )
    )
);


-- ==============================================================================
-- 3. Table: public.assessment_questions
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.assessment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL DEFAULT 1,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    marks INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_assessment_question_num UNIQUE (assessment_id, question_number)
);

CREATE INDEX IF NOT EXISTS idx_aq_assessment_id ON public.assessment_questions(assessment_id);

ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "aq_admin_all" ON public.assessment_questions;
DROP POLICY IF EXISTS "aq_faculty_manage" ON public.assessment_questions;
DROP POLICY IF EXISTS "aq_student_select" ON public.assessment_questions;

CREATE POLICY "aq_admin_all"
ON public.assessment_questions
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "aq_faculty_manage"
ON public.assessment_questions
FOR ALL
TO authenticated
USING (
    assessment_id IN (
        SELECT id FROM public.assessments 
        WHERE faculty_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid())
    ) OR
    public.is_admin()
)
WITH CHECK (
    assessment_id IN (
        SELECT id FROM public.assessments 
        WHERE faculty_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid())
    ) OR
    public.is_admin()
);

CREATE POLICY "aq_student_select"
ON public.assessment_questions
FOR SELECT
TO authenticated
USING (
    assessment_id IN (
        SELECT id FROM public.assessments WHERE status = 'published'
    )
);


-- ==============================================================================
-- 4. Table: public.assessment_submissions
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.assessment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    total_questions INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    incorrect_count INTEGER NOT NULL DEFAULT 0,
    unanswered_count INTEGER NOT NULL DEFAULT 0,
    score NUMERIC NOT NULL DEFAULT 0,
    percentage NUMERIC NOT NULL DEFAULT 0,
    is_passed BOOLEAN NOT NULL DEFAULT false,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'graded', 'abandoned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_assessment_submission_once UNIQUE (assessment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_asub_asmt ON public.assessment_submissions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_asub_student ON public.assessment_submissions(student_id);

DROP TRIGGER IF EXISTS trg_assessment_submissions_updated_at ON public.assessment_submissions;
CREATE TRIGGER trg_assessment_submissions_updated_at
    BEFORE UPDATE ON public.assessment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.assessment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "asub_admin_all" ON public.assessment_submissions;
DROP POLICY IF EXISTS "asub_faculty_select" ON public.assessment_submissions;
DROP POLICY IF EXISTS "asub_student_manage" ON public.assessment_submissions;

CREATE POLICY "asub_admin_all"
ON public.assessment_submissions
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "asub_faculty_select"
ON public.assessment_submissions
FOR SELECT
TO authenticated
USING (
    public.is_admin() OR
    assessment_id IN (
        SELECT id FROM public.assessments 
        WHERE faculty_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid())
    )
);

CREATE POLICY "asub_student_manage"
ON public.assessment_submissions
FOR ALL
TO authenticated
USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()) OR
    public.is_admin()
)
WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()) OR
    public.is_admin()
);


-- ==============================================================================
-- 5. Table: public.assessment_answers
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.assessment_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.assessment_submissions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
    selected_option TEXT CHECK (selected_option IN ('A', 'B', 'C', 'D', NULL)),
    is_correct BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_submission_question_answer UNIQUE (submission_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_aa_sub ON public.assessment_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_aa_q ON public.assessment_answers(question_id);

ALTER TABLE public.assessment_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "aa_admin_all" ON public.assessment_answers;
DROP POLICY IF EXISTS "aa_faculty_select" ON public.assessment_answers;
DROP POLICY IF EXISTS "aa_student_manage" ON public.assessment_answers;

CREATE POLICY "aa_admin_all"
ON public.assessment_answers
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "aa_faculty_select"
ON public.assessment_answers
FOR SELECT
TO authenticated
USING (
    public.is_admin() OR
    submission_id IN (
        SELECT sub.id FROM public.assessment_submissions sub
        JOIN public.assessments asmt ON asmt.id = sub.assessment_id
        WHERE asmt.faculty_id IN (SELECT f.id FROM public.faculty f WHERE f.user_id = auth.uid())
    )
);

CREATE POLICY "aa_student_manage"
ON public.assessment_answers
FOR ALL
TO authenticated
USING (
    submission_id IN (
        SELECT id FROM public.assessment_submissions 
        WHERE student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    ) OR
    public.is_admin()
)
WITH CHECK (
    submission_id IN (
        SELECT id FROM public.assessment_submissions 
        WHERE student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    ) OR
    public.is_admin()
);


-- ==============================================================================
-- 6. Enhance public.users RLS for Profile Viewing
--    Allows authenticated users to view active user profiles (e.g., student name in roster, faculty name on subject)
-- ==============================================================================
DROP POLICY IF EXISTS "Users view own or admin view all" ON public.users;
DROP POLICY IF EXISTS "Users view profile policy" ON public.users;

CREATE POLICY "Users view profile policy"
ON public.users
FOR SELECT
TO authenticated
USING (
    id = auth.uid() OR
    public.is_admin() OR
    public.is_faculty() OR
    status = 'active'
);
