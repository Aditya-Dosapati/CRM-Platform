-- ============================================================================
-- GMR CRM Academic Master Data Migration (AR23 Regulation)
-- Branches: CSE, CSE-AI&DS, CSE-AI&ML
-- Source of Truth: GMRIT AR23 Official Syllabus PDFs
-- ============================================================================

-- 1. Schema Updates: Safe Constraint Adjustments & Normalized Mapping Table
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Safely drop single-column unique constraint on code if present
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.subjects'::regclass
          AND contype = 'u'
          AND conname NOT LIKE '%code%name%'
          AND array_to_string(conkey, ',') = (
              SELECT attnum::text FROM pg_attribute WHERE attrelid = 'public.subjects'::regclass AND attname = 'code'
          )
    ) LOOP
        EXECUTE 'ALTER TABLE public.subjects DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.subjects'::regclass
          AND conname = 'subjects_code_name_key'
    ) THEN
        ALTER TABLE public.subjects ADD CONSTRAINT subjects_code_name_key UNIQUE (code, name);
    END IF;
END $$;

ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS subject_type TEXT DEFAULT 'CORE';
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS elective_group TEXT;
ALTER TABLE public.subjects ALTER COLUMN department_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.subject_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT subject_departments_subject_id_department_id_key UNIQUE(subject_id, department_id)
);

ALTER TABLE public.subject_departments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'subject_departments' AND policyname = 'Authenticated users can view subject departments'
    ) THEN
        CREATE POLICY "Authenticated users can view subject departments"
        ON public.subject_departments
        FOR SELECT
        TO authenticated
        USING (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'subject_departments' AND policyname = 'Admins can manage subject departments'
    ) THEN
        CREATE POLICY "Admins can manage subject departments"
        ON public.subject_departments
        FOR ALL
        TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());
    END IF;
END $$;

-- 2. Ensure Official Departments Exist
INSERT INTO public.departments (name, code)
VALUES
    ('Computer Science and Engineering', 'CSE'),
    ('CSE - Artificial Intelligence and Data Science', 'AIDS'),
    ('CSE - Artificial Intelligence and Machine Learning', 'AIML')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name;

-- 3. Seed Official Qualifying Subjects (66 records)
INSERT INTO public.subjects (code, name, credits, semester, subject_type, elective_group, regulation)
VALUES
    ('23CS301', 'Problem Solving using Python', 4, 3, 'CORE', NULL, 'AR23'),
    ('23HSX10', 'Engineering Economics and Project Management', 3, 3, 'CORE', NULL, 'AR23'),
    ('23ML302', 'Artificial Intelligence', 3, 3, 'CORE', NULL, 'AR23'),
    ('23CS303', 'Design and Analysis of Algorithms', 3, 3, 'CORE', NULL, 'AR23'),
    ('23CS304', 'Digital Logic Design', 4, 3, 'CORE', NULL, 'AR23'),
    ('23CS305', 'Discrete Mathematical Structures', 3, 3, 'CORE', NULL, 'AR23'),
    ('23DS305', 'Mathematical Foundation for Data Science', 3, 3, 'CORE', NULL, 'AR23'),
    ('23CS306', 'Object Oriented Programming with JAVA', 3, 3, 'CORE', NULL, 'AR23'),
    ('23IT304', 'Database Management Systems', 3, 4, 'CORE', NULL, 'AR23'),
    ('23IT403', 'Operating Systems', 3, 4, 'CORE', NULL, 'AR23'),
    ('23CS403', 'Computer Organization and Architecture', 3, 4, 'CORE', NULL, 'AR23'),
    ('23MA404', 'Probability and Statistics using Python', 4, 4, 'CORE', NULL, 'AR23'),
    ('23CS405', 'Web Coding and Development', 3, 4, 'CORE', NULL, 'AR23'),
    ('23DS405', 'Foundations of Data Science', 3, 4, 'CORE', NULL, 'AR23'),
    ('23ML405', 'Foundations of Machine Learning', 3, 4, 'CORE', NULL, 'AR23'),
    ('23EC502', 'Microprocessors and Microcontrollers (Integrated)', 4, 5, 'CORE', NULL, 'AR23'),
    ('23CS502', 'Artificial Intelligence and Machine Learning', 3, 5, 'CORE', NULL, 'AR23'),
    ('23CS503', 'Computer Networks (Integrated)', 4, 5, 'CORE', NULL, 'AR23'),
    ('23CS504', 'Theory of Computation', 3, 5, 'CORE', NULL, 'AR23'),
    ('23IT405', 'Web Technologies', 4, 5, 'CORE', NULL, 'AR23'),
    ('23DS502', 'Deep Learning for Data Science', 3, 5, 'CORE', NULL, 'AR23'),
    ('23ML502', 'Neural Networks', 3, 5, 'CORE', NULL, 'AR23'),
    ('23DS503', 'Data Analytics & Visualization Techniques', 4, 5, 'CORE', NULL, 'AR23'),
    ('23ML504', 'Computer Networks', 3, 5, 'CORE', NULL, 'AR23'),
    ('23CSC11', 'Artificial Neural Networks', 3, 5, 'PROFESSIONAL_ELECTIVE', 'Elective I', 'AR23'),
    ('23MLC11', 'Computer Vision & Pattern Recognition', 3, 5, 'PROFESSIONAL_ELECTIVE', 'Elective I', 'AR23'),
    ('23CSC21', 'Backend Programming Languages', 3, 5, 'PROFESSIONAL_ELECTIVE', 'Elective I', 'AR23'),
    ('23ITC31', 'Fundamentals of Security', 3, 5, 'PROFESSIONAL_ELECTIVE', 'Elective I', 'AR23'),
    ('23MLC31', 'Fundamentals of Cloud Computing', 3, 5, 'PROFESSIONAL_ELECTIVE', 'Elective I', 'AR23'),
    ('23CS004', 'Principles of Programming Languages', 3, 5, 'PROFESSIONAL_ELECTIVE', 'Elective I', 'AR23'),
    ('23CS005', 'Mobile Computing', 3, 5, 'PROFESSIONAL_ELECTIVE', 'Elective I', 'AR23'),
    ('23CS006', 'Distributed Operating Systems', 3, 5, 'PROFESSIONAL_ELECTIVE', 'Elective I', 'AR23'),
    ('23CS601', 'Compiler Design', 3, 6, 'CORE', NULL, 'AR23'),
    ('23CS602', 'Cryptography and Network Security', 3, 6, 'CORE', NULL, 'AR23'),
    ('23CS603', 'Software Engineering', 3, 6, 'CORE', NULL, 'AR23'),
    ('23DS601', 'Optimization Techniques for ML', 3, 6, 'CORE', NULL, 'AR23'),
    ('23ML601', 'Deep Learning Techniques', 3, 6, 'CORE', NULL, 'AR23'),
    ('23ML602', 'Automata Theory and Language Processors', 3, 6, 'CORE', NULL, 'AR23'),
    ('23CSC12', 'Deep Learning', 4, 6, 'PROFESSIONAL_ELECTIVE', 'Elective III', 'AR23'),
    ('23MLC12', 'Machine Learning for Business Intelligence', 4, 6, 'PROFESSIONAL_ELECTIVE', 'Elective III', 'AR23'),
    ('23CSC22', 'Web Application Frameworks', 4, 6, 'PROFESSIONAL_ELECTIVE', 'Elective III', 'AR23'),
    ('23ITC32', 'Cybernet Security', 4, 6, 'PROFESSIONAL_ELECTIVE', 'Elective III', 'AR23'),
    ('23MLC32', 'Cloud Services using AWS', 4, 6, 'PROFESSIONAL_ELECTIVE', 'Elective III', 'AR23'),
    ('23CS007', 'Cloud Computing Essentials', 4, 6, 'PROFESSIONAL_ELECTIVE', 'Elective III', 'AR23'),
    ('23CS008', 'Internet of Things', 4, 6, 'PROFESSIONAL_ELECTIVE', 'Elective III', 'AR23'),
    ('23CS008', 'Cryptography and Network Security', 4, 6, 'PROFESSIONAL_ELECTIVE', 'Elective III', 'AR23'),
    ('23CSC13', 'Natural Language Processing', 3, 7, 'PROFESSIONAL_ELECTIVE', 'Elective V', 'AR23'),
    ('23MLC13', 'Conversational AI', 3, 7, 'PROFESSIONAL_ELECTIVE', 'Elective V', 'AR23'),
    ('23CSC23', 'Web Application Databases', 3, 7, 'PROFESSIONAL_ELECTIVE', 'Elective V', 'AR23'),
    ('23ITC33', 'Cloud Security', 3, 7, 'PROFESSIONAL_ELECTIVE', 'Elective V', 'AR23'),
    ('23MLC33', 'Cloud Security Essentials', 3, 7, 'PROFESSIONAL_ELECTIVE', 'Elective V', 'AR23'),
    ('23IT010', 'Social Network Analysis', 3, 7, 'PROFESSIONAL_ELECTIVE', 'Elective V', 'AR23'),
    ('23IT017', 'Social Network Analysis', 3, 7, 'PROFESSIONAL_ELECTIVE', 'Elective V', 'AR23'),
    ('23ML001', 'Human Computer Interaction', 3, 7, 'PROFESSIONAL_ELECTIVE', 'Elective V', 'AR23'),
    ('23CS011', 'Optimization Techniques', 3, 7, 'PROFESSIONAL_ELECTIVE', 'Elective V', 'AR23'),
    ('23CS012', 'Wireless Adhoc Networks', 3, 7, 'PROFESSIONAL_ELECTIVE', 'Elective V', 'AR23'),
    ('23CS014', 'Green Computing', 3, 7, 'PROFESSIONAL_ELECTIVE', 'Elective VI', 'AR23'),
    ('23DS002', 'Data Visualization with Power BI', 3, 7, 'PROFESSIONAL_ELECTIVE', 'Elective VI', 'AR23'),
    ('23ML002', 'Large Language Models', 3, 7, 'PROFESSIONAL_ELECTIVE', 'Elective VI', 'AR23'),
    ('23CS015', 'Software Project Management', 3, 7, 'PROFESSIONAL_ELECTIVE', 'Elective VI', 'AR23'),
    ('23CS016', 'Soft Computing', 3, 7, 'PROFESSIONAL_ELECTIVE', 'Elective VI', 'AR23'),
    ('23ML003', 'Reinforcement Learning', 3, 7, 'PROFESSIONAL_ELECTIVE', 'Elective VI', 'AR23'),
    ('23CS017', 'Fundamentals of Social Network Analysis', 3, 8, 'PROFESSIONAL_ELECTIVE', 'Elective VIII', 'AR23'),
    ('23CS018', 'Information Retrieval Systems', 3, 8, 'PROFESSIONAL_ELECTIVE', 'Elective VIII', 'AR23'),
    ('23CS019', 'Fundamentals of Devops', 3, 8, 'PROFESSIONAL_ELECTIVE', 'Elective VIII', 'AR23'),
    ('23DS003', 'Cyber Security', 3, 8, 'PROFESSIONAL_ELECTIVE', 'Elective VIII', 'AR23')
ON CONFLICT (code, name) DO UPDATE
SET credits = EXCLUDED.credits,
    semester = EXCLUDED.semester,
    subject_type = EXCLUDED.subject_type,
    elective_group = EXCLUDED.elective_group,
    regulation = EXCLUDED.regulation;

-- 4. Populate Normalized Branch Mappings (Exact Match on code AND name)
INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS301' AND s.name = 'Problem Solving using Python' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS301' AND s.name = 'Problem Solving using Python' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS301' AND s.name = 'Problem Solving using Python' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23HSX10' AND s.name = 'Engineering Economics and Project Management' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23ML302' AND s.name = 'Artificial Intelligence' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23ML302' AND s.name = 'Artificial Intelligence' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS303' AND s.name = 'Design and Analysis of Algorithms' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS303' AND s.name = 'Design and Analysis of Algorithms' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS303' AND s.name = 'Design and Analysis of Algorithms' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS304' AND s.name = 'Digital Logic Design' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS304' AND s.name = 'Digital Logic Design' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS304' AND s.name = 'Digital Logic Design' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS305' AND s.name = 'Discrete Mathematical Structures' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23DS305' AND s.name = 'Mathematical Foundation for Data Science' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23DS305' AND s.name = 'Mathematical Foundation for Data Science' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS306' AND s.name = 'Object Oriented Programming with JAVA' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS306' AND s.name = 'Object Oriented Programming with JAVA' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS306' AND s.name = 'Object Oriented Programming with JAVA' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23IT304' AND s.name = 'Database Management Systems' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23IT304' AND s.name = 'Database Management Systems' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23IT304' AND s.name = 'Database Management Systems' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23IT403' AND s.name = 'Operating Systems' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23IT403' AND s.name = 'Operating Systems' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23IT403' AND s.name = 'Operating Systems' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS403' AND s.name = 'Computer Organization and Architecture' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS403' AND s.name = 'Computer Organization and Architecture' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS403' AND s.name = 'Computer Organization and Architecture' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23MA404' AND s.name = 'Probability and Statistics using Python' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23MA404' AND s.name = 'Probability and Statistics using Python' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23MA404' AND s.name = 'Probability and Statistics using Python' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS405' AND s.name = 'Web Coding and Development' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23DS405' AND s.name = 'Foundations of Data Science' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23ML405' AND s.name = 'Foundations of Machine Learning' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23EC502' AND s.name = 'Microprocessors and Microcontrollers (Integrated)' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS502' AND s.name = 'Artificial Intelligence and Machine Learning' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS503' AND s.name = 'Computer Networks (Integrated)' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS504' AND s.name = 'Theory of Computation' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23IT405' AND s.name = 'Web Technologies' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23IT405' AND s.name = 'Web Technologies' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23DS502' AND s.name = 'Deep Learning for Data Science' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23ML502' AND s.name = 'Neural Networks' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23DS503' AND s.name = 'Data Analytics & Visualization Techniques' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23DS503' AND s.name = 'Data Analytics & Visualization Techniques' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23ML504' AND s.name = 'Computer Networks' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23ML504' AND s.name = 'Computer Networks' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CSC11' AND s.name = 'Artificial Neural Networks' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23MLC11' AND s.name = 'Computer Vision & Pattern Recognition' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23MLC11' AND s.name = 'Computer Vision & Pattern Recognition' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CSC21' AND s.name = 'Backend Programming Languages' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CSC21' AND s.name = 'Backend Programming Languages' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CSC21' AND s.name = 'Backend Programming Languages' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23ITC31' AND s.name = 'Fundamentals of Security' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23MLC31' AND s.name = 'Fundamentals of Cloud Computing' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23MLC31' AND s.name = 'Fundamentals of Cloud Computing' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23MLC31' AND s.name = 'Fundamentals of Cloud Computing' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS004' AND s.name = 'Principles of Programming Languages' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS004' AND s.name = 'Principles of Programming Languages' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS004' AND s.name = 'Principles of Programming Languages' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS005' AND s.name = 'Mobile Computing' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS005' AND s.name = 'Mobile Computing' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS005' AND s.name = 'Mobile Computing' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS006' AND s.name = 'Distributed Operating Systems' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS006' AND s.name = 'Distributed Operating Systems' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS006' AND s.name = 'Distributed Operating Systems' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS601' AND s.name = 'Compiler Design' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS602' AND s.name = 'Cryptography and Network Security' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS603' AND s.name = 'Software Engineering' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS603' AND s.name = 'Software Engineering' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS603' AND s.name = 'Software Engineering' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23DS601' AND s.name = 'Optimization Techniques for ML' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23ML601' AND s.name = 'Deep Learning Techniques' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23ML602' AND s.name = 'Automata Theory and Language Processors' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23ML602' AND s.name = 'Automata Theory and Language Processors' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CSC12' AND s.name = 'Deep Learning' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23MLC12' AND s.name = 'Machine Learning for Business Intelligence' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23MLC12' AND s.name = 'Machine Learning for Business Intelligence' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CSC22' AND s.name = 'Web Application Frameworks' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CSC22' AND s.name = 'Web Application Frameworks' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CSC22' AND s.name = 'Web Application Frameworks' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23ITC32' AND s.name = 'Cybernet Security' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23MLC32' AND s.name = 'Cloud Services using AWS' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23MLC32' AND s.name = 'Cloud Services using AWS' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23MLC32' AND s.name = 'Cloud Services using AWS' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS007' AND s.name = 'Cloud Computing Essentials' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS007' AND s.name = 'Cloud Computing Essentials' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS007' AND s.name = 'Cloud Computing Essentials' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS008' AND s.name = 'Internet of Things' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS008' AND s.name = 'Cryptography and Network Security' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS008' AND s.name = 'Cryptography and Network Security' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CSC13' AND s.name = 'Natural Language Processing' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23MLC13' AND s.name = 'Conversational AI' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23MLC13' AND s.name = 'Conversational AI' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CSC23' AND s.name = 'Web Application Databases' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CSC23' AND s.name = 'Web Application Databases' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CSC23' AND s.name = 'Web Application Databases' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23ITC33' AND s.name = 'Cloud Security' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23MLC33' AND s.name = 'Cloud Security Essentials' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23MLC33' AND s.name = 'Cloud Security Essentials' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23MLC33' AND s.name = 'Cloud Security Essentials' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23IT010' AND s.name = 'Social Network Analysis' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23IT010' AND s.name = 'Social Network Analysis' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23IT017' AND s.name = 'Social Network Analysis' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23ML001' AND s.name = 'Human Computer Interaction' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23ML001' AND s.name = 'Human Computer Interaction' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS011' AND s.name = 'Optimization Techniques' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS012' AND s.name = 'Wireless Adhoc Networks' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS012' AND s.name = 'Wireless Adhoc Networks' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS012' AND s.name = 'Wireless Adhoc Networks' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS014' AND s.name = 'Green Computing' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23DS002' AND s.name = 'Data Visualization with Power BI' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23ML002' AND s.name = 'Large Language Models' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS015' AND s.name = 'Software Project Management' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS015' AND s.name = 'Software Project Management' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS015' AND s.name = 'Software Project Management' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS016' AND s.name = 'Soft Computing' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23ML003' AND s.name = 'Reinforcement Learning' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23ML003' AND s.name = 'Reinforcement Learning' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS017' AND s.name = 'Fundamentals of Social Network Analysis' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS018' AND s.name = 'Information Retrieval Systems' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS018' AND s.name = 'Information Retrieval Systems' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS018' AND s.name = 'Information Retrieval Systems' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS019' AND s.name = 'Fundamentals of Devops' AND d.code = 'CSE'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS019' AND s.name = 'Fundamentals of Devops' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23CS019' AND s.name = 'Fundamentals of Devops' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23DS003' AND s.name = 'Cyber Security' AND d.code = 'AIDS'
ON CONFLICT (subject_id, department_id) DO NOTHING;

INSERT INTO public.subject_departments (subject_id, department_id)
SELECT s.id, d.id FROM public.subjects s, public.departments d
WHERE s.code = '23DS003' AND s.name = 'Cyber Security' AND d.code = 'AIML'
ON CONFLICT (subject_id, department_id) DO NOTHING;
