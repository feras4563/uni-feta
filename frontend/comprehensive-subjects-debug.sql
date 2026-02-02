-- Comprehensive debugging for subjects not showing issue
-- Run this to understand the complete data structure

-- 1. Check the student "تجربة" details
SELECT '=== STUDENT DETAILS ===' as section;
SELECT 
    id, 
    name, 
    department_id, 
    status,
    email
FROM students 
WHERE name ILIKE '%تجربة%';

-- 2. Check all departments
SELECT '=== ALL DEPARTMENTS ===' as section;
SELECT id, name, name_en, semester_count 
FROM departments 
ORDER BY name;

-- 3. Check all subjects with semester_number = 1
SELECT '=== ALL SUBJECTS FOR SEMESTER 1 ===' as section;
SELECT 
    s.id,
    s.code,
    s.name,
    s.name_en,
    s.department_id,
    s.semester_number,
    s.credits,
    s.cost_per_credit,
    s.total_cost,
    s.is_required,
    d.name as department_name
FROM subjects s
LEFT JOIN departments d ON s.department_id = d.id
WHERE s.semester_number = 1
ORDER BY d.name, s.code;

-- 4. Check department_semester_subjects table
SELECT '=== DEPARTMENT_SEMESTER_SUBJECTS TABLE ===' as section;
SELECT 
    dss.id,
    dss.department_id,
    dss.semester_id,
    dss.subject_id,
    dss.semester_number,
    dss.is_active,
    s.code as subject_code,
    s.name as subject_name,
    d.name as department_name
FROM department_semester_subjects dss
LEFT JOIN subjects s ON dss.subject_id = s.id
LEFT JOIN departments d ON dss.department_id = d.id
ORDER BY d.name, dss.semester_number, s.name;

-- 5. Check if there's a department_curriculum table
SELECT '=== DEPARTMENT_CURRICULUM TABLE (if exists) ===' as section;
SELECT 
    dc.id,
    dc.department_id,
    dc.semester_id,
    dc.subject_id,
    dc.semester_number,
    dc.is_required,
    dc.is_active,
    s.code as subject_code,
    s.name as subject_name,
    d.name as department_name
FROM department_curriculum dc
LEFT JOIN subjects s ON dc.subject_id = s.id
LEFT JOIN departments d ON dc.department_id = d.id
ORDER BY d.name, dc.semester_number, s.name;

-- 6. Test the exact query that the API uses
SELECT '=== API QUERY SIMULATION ===' as section;
-- This simulates the exact query from fetchDepartmentCurriculumBySemesterNumber
-- Replace 'feras' with the actual department_id from step 1
SELECT 
    dss.id,
    dss.department_id,
    dss.semester_id,
    dss.subject_id,
    dss.semester_number,
    dss.is_active,
    s.id as subject_id_check,
    s.code,
    s.name,
    s.name_en,
    s.credits,
    s.cost_per_credit,
    s.total_cost,
    s.is_required,
    s.semester_number as subject_semester_number,
    sem.id as semester_id_check,
    sem.name as semester_name,
    d.id as department_id_check,
    d.name as department_name
FROM department_semester_subjects dss
LEFT JOIN subjects s ON dss.subject_id = s.id
LEFT JOIN semesters sem ON dss.semester_id = sem.id
LEFT JOIN departments d ON dss.department_id = d.id
WHERE dss.department_id = 'feras'  -- This will be replaced with actual department_id
AND dss.semester_number = 1
AND dss.is_active = true
ORDER BY s.name;

-- 7. Check what semesters exist
SELECT '=== SEMESTERS TABLE ===' as section;
SELECT id, name, name_en, is_current 
FROM semesters 
ORDER BY name;

-- 8. Check if there are any RLS policies that might be blocking access
SELECT '=== RLS POLICIES CHECK ===' as section;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('department_semester_subjects', 'subjects', 'departments')
ORDER BY tablename, policyname;


