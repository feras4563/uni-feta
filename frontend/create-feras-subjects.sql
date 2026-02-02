-- ==============================================
-- CREATE SUBJECTS FOR FERAS DEPARTMENT
-- This script creates sample subjects for the "feras" department
-- ==============================================

-- First, check if the feras department exists
SELECT 'Checking feras department:' as info;
SELECT id, name, name_en FROM departments WHERE id = 'feras';

-- If feras department doesn't exist, create it
INSERT INTO departments (id, name, name_en, semester_count, is_locked)
VALUES ('feras', 'فيراس', 'Feras', 8, false)
ON CONFLICT (id) DO NOTHING;

-- Create sample subjects for the feras department, semester 1
INSERT INTO subjects (
    id,
    code,
    name,
    name_en,
    department_id,
    credits,
    cost_per_credit,
    total_cost,
    is_required,
    semester_number,
    max_students
) VALUES 
(
    'SUBJ_FERAS_001',
    'FER101',
    'مقدمة في علوم الحاسوب',
    'Introduction to Computer Science',
    'feras',
    3,
    50,
    150,
    true,
    1,
    30
),
(
    'SUBJ_FERAS_002',
    'FER102',
    'البرمجة الأساسية',
    'Basic Programming',
    'feras',
    4,
    50,
    200,
    true,
    1,
    25
),
(
    'SUBJ_FERAS_003',
    'FER103',
    'الرياضيات التطبيقية',
    'Applied Mathematics',
    'feras',
    3,
    45,
    135,
    true,
    1,
    35
),
(
    'SUBJ_FERAS_004',
    'FER104',
    'اللغة الإنجليزية التقنية',
    'Technical English',
    'feras',
    2,
    40,
    80,
    false,
    1,
    40
),
(
    'SUBJ_FERAS_005',
    'FER105',
    'أساسيات قواعد البيانات',
    'Database Fundamentals',
    'feras',
    3,
    50,
    150,
    true,
    1,
    30
)
ON CONFLICT (id) DO NOTHING;

-- Create entries in department_semester_subjects table
INSERT INTO department_semester_subjects (
    id,
    department_id,
    semester_number,
    subject_id,
    is_active
) VALUES 
(
    'DSS_FERAS_001',
    'feras',
    1,
    'SUBJ_FERAS_001',
    true
),
(
    'DSS_FERAS_002',
    'feras',
    1,
    'SUBJ_FERAS_002',
    true
),
(
    'DSS_FERAS_003',
    'feras',
    1,
    'SUBJ_FERAS_003',
    true
),
(
    'DSS_FERAS_004',
    'feras',
    1,
    'SUBJ_FERAS_004',
    true
),
(
    'DSS_FERAS_005',
    'feras',
    1,
    'SUBJ_FERAS_005',
    true
)
ON CONFLICT (id) DO NOTHING;

-- Verify the created subjects
SELECT 'Created subjects for feras department, semester 1:' as info;
SELECT 
    s.id,
    s.code,
    s.name,
    s.name_en,
    s.credits,
    s.cost_per_credit,
    s.total_cost,
    s.is_required,
    s.semester_number,
    d.name as department_name
FROM subjects s
LEFT JOIN departments d ON s.department_id = d.id
WHERE s.department_id = 'feras'
AND s.semester_number = 1
ORDER BY s.code;

-- Verify the department_semester_subjects entries
SELECT 'Department semester subjects entries:' as info;
SELECT 
    dss.id,
    dss.department_id,
    dss.semester_number,
    dss.subject_id,
    dss.is_active,
    s.code,
    s.name,
    s.total_cost
FROM department_semester_subjects dss
LEFT JOIN subjects s ON dss.subject_id = s.id
WHERE dss.department_id = 'feras'
AND dss.semester_number = 1
AND dss.is_active = true
ORDER BY s.code;

-- Test the API query that should now return subjects
SELECT 'API Test Query Result:' as info;
SELECT 
    dss.id as curriculum_id,
    dss.department_id,
    dss.semester_id,
    dss.subject_id,
    dss.semester_number,
    true as is_required,
    dss.is_active,
    s.id as subject_id_check,
    s.code,
    s.name,
    s.name_en,
    s.credits,
    s.cost_per_credit,
    s.total_cost,
    s.is_required as subject_is_required,
    s.semester_number as subject_semester_number,
    d.id as department_id_check,
    d.name as department_name,
    d.name_en as department_name_en
FROM department_semester_subjects dss
LEFT JOIN subjects s ON dss.subject_id = s.id
LEFT JOIN departments d ON dss.department_id = d.id
WHERE dss.department_id = 'feras'
AND dss.semester_number = 1
AND dss.is_active = true
ORDER BY s.name;


