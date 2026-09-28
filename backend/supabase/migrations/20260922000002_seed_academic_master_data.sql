-- ==============================================================================
-- GMR CRM: Academic Master Data Seed Migration
-- Target Departments (ONLY 3):
--   1. Computer Science & Engineering (CSE)
--   2. Artificial Intelligence & Machine Learning (AIML)
--   3. Artificial Intelligence & Data Science (AIDS)
-- ==============================================================================

-- 1. Insert Target Academic Departments
INSERT INTO public.departments (id, name, code)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Computer Science & Engineering', 'CSE'),
    ('a0000000-0000-0000-0000-000000000002', 'Artificial Intelligence & Machine Learning', 'AIML'),
    ('a0000000-0000-0000-0000-000000000003', 'Artificial Intelligence & Data Science', 'AIDS')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code;

-- 2. Insert Core Academic Subjects for CSE, AIML, and AIDS
INSERT INTO public.subjects (id, department_id, name, code, credits, semester, regulation)
VALUES
    -- ==========================================================================
    -- 2.1 Computer Science & Engineering (CSE)
    -- ==========================================================================
    (
        'b0000000-0000-0000-0001-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'Data Structures & Algorithms',
        '20CS301',
        4,
        3,
        'R20'
    ),
    (
        'b0000000-0000-0000-0001-000000000002',
        'a0000000-0000-0000-0000-000000000001',
        'Database Management Systems',
        '20CS401',
        3,
        4,
        'R20'
    ),
    (
        'b0000000-0000-0000-0001-000000000003',
        'a0000000-0000-0000-0000-000000000001',
        'Operating Systems',
        '20CS402',
        3,
        4,
        'R20'
    ),
    (
        'b0000000-0000-0000-0001-000000000004',
        'a0000000-0000-0000-0000-000000000001',
        'Computer Networks',
        '20CS501',
        3,
        5,
        'R20'
    ),
    (
        'b0000000-0000-0000-0001-000000000005',
        'a0000000-0000-0000-0000-000000000001',
        'Software Engineering & Agile Methodologies',
        '20CS502',
        3,
        5,
        'R20'
    ),

    -- ==========================================================================
    -- 2.2 Artificial Intelligence & Machine Learning (AIML)
    -- ==========================================================================
    (
        'b0000000-0000-0000-0002-000000000001',
        'a0000000-0000-0000-0000-000000000002',
        'Machine Learning',
        '20AI401',
        4,
        4,
        'R20'
    ),
    (
        'b0000000-0000-0000-0002-000000000002',
        'a0000000-0000-0000-0000-000000000002',
        'Artificial Intelligence Principles',
        '20AI402',
        3,
        4,
        'R20'
    ),
    (
        'b0000000-0000-0000-0002-000000000003',
        'a0000000-0000-0000-0000-000000000002',
        'Deep Learning & Neural Networks',
        '20AI501',
        4,
        5,
        'R20'
    ),
    (
        'b0000000-0000-0000-0002-000000000004',
        'a0000000-0000-0000-0000-000000000002',
        'Natural Language Processing',
        '20AI601',
        3,
        6,
        'R20'
    ),
    (
        'b0000000-0000-0000-0002-000000000005',
        'a0000000-0000-0000-0000-000000000002',
        'Computer Vision & Pattern Recognition',
        '20AI602',
        3,
        6,
        'R20'
    ),

    -- ==========================================================================
    -- 2.3 Artificial Intelligence & Data Science (AIDS)
    -- ==========================================================================
    (
        'b0000000-0000-0000-0003-000000000001',
        'a0000000-0000-0000-0000-000000000003',
        'Mathematical Foundations for Data Science',
        '20DS301',
        4,
        3,
        'R20'
    ),
    (
        'b0000000-0000-0000-0003-000000000002',
        'a0000000-0000-0000-0000-000000000003',
        'Applied Data Science & Statistical Modeling',
        '20DS401',
        4,
        4,
        'R20'
    ),
    (
        'b0000000-0000-0000-0003-000000000003',
        'a0000000-0000-0000-0000-000000000003',
        'Big Data Analytics & Hadoop Ecosystem',
        '20DS501',
        3,
        5,
        'R20'
    ),
    (
        'b0000000-0000-0000-0003-000000000004',
        'a0000000-0000-0000-0000-000000000003',
        'Data Mining & Predictive Analytics',
        '20DS502',
        3,
        5,
        'R20'
    ),
    (
        'b0000000-0000-0000-0003-000000000005',
        'a0000000-0000-0000-0000-000000000003',
        'Data Visualization & Business Intelligence',
        '20DS601',
        3,
        6,
        'R20'
    )
ON CONFLICT (id) DO UPDATE SET
    department_id = EXCLUDED.department_id,
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    credits = EXCLUDED.credits,
    semester = EXCLUDED.semester,
    regulation = EXCLUDED.regulation;
