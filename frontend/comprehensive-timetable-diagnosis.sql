-- Comprehensive diagnostic script for timetable generation issue
-- This will help us understand why the fix didn't work

-- 1. Check the current structure of teacher_subjects table
SELECT 
    'teacher_subjects table structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'teacher_subjects'
ORDER BY ordinal_position;

-- 2. Check if there are any records in teacher_subjects at all
SELECT 
    'teacher_subjects record count' as check_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_records,
    COUNT(semester_id) as records_with_semester_id,
    COUNT(semester) as records_with_semester_string,
    COUNT(study_year_id) as records_with_study_year_id,
    COUNT(academic_year) as records_with_academic_year
FROM teacher_subjects;

-- 3. Check what departments exist
SELECT 
    'departments' as check_type,
    id,
    name,
    name_en,
    is_active
FROM departments
ORDER BY name;

-- 4. Check what semesters exist
SELECT 
    'semesters' as check_type,
    id,
    name,
    name_en,
    code,
    is_current,
    study_year_id
FROM semesters
ORDER BY name;

-- 5. Check what study years exist
SELECT 
    'study_years' as check_type,
    id,
    name,
    name_en,
    is_current
FROM study_years
ORDER BY name;

-- 6. Sample teacher_subjects data with all relationships
SELECT 
    'sample teacher_subjects data' as check_type,
    ts.id,
    ts.teacher_id,
    ts.subject_id,
    ts.department_id,
    ts.semester_id,
    ts.semester,
    ts.study_year_id,
    ts.academic_year,
    ts.is_active,
    t.name as teacher_name,
    s.name as subject_name,
    d.name as department_name,
    sem.name as semester_name,
    sy.name as study_year_name
FROM teacher_subjects ts
LEFT JOIN teachers t ON ts.teacher_id = t.id
LEFT JOIN subjects s ON ts.subject_id = s.id
LEFT JOIN departments d ON ts.department_id = d.id
LEFT JOIN semesters sem ON ts.semester_id = sem.id
LEFT JOIN study_years sy ON ts.study_year_id = sy.id
ORDER BY ts.created_at DESC
LIMIT 10;

-- 7. Check if there are any teacher assignments for specific department/semester combinations
SELECT 
    'department-semester assignments' as check_type,
    ts.department_id,
    ts.semester_id,
    ts.semester,
    COUNT(*) as assignment_count,
    d.name as department_name,
    sem.name as semester_name
FROM teacher_subjects ts
LEFT JOIN departments d ON ts.department_id = d.id
LEFT JOIN semesters sem ON ts.semester_id = sem.id
WHERE ts.is_active = true
GROUP BY ts.department_id, ts.semester_id, ts.semester, d.name, sem.name
ORDER BY assignment_count DESC;

-- 8. Check student groups
SELECT 
    'student_groups' as check_type,
    COUNT(*) as total_groups,
    COUNT(CASE WHEN department_id IS NOT NULL THEN 1 END) as groups_with_department,
    COUNT(CASE WHEN semester_id IS NOT NULL THEN 1 END) as groups_with_semester
FROM student_groups;

-- 9. Sample student groups data
SELECT 
    'sample student_groups data' as check_type,
    sg.id,
    sg.group_name,
    sg.department_id,
    sg.semester_id,
    sg.current_students,
    d.name as department_name,
    s.name as semester_name
FROM student_groups sg
LEFT JOIN departments d ON sg.department_id = d.id
LEFT JOIN semesters s ON sg.semester_id = s.id
ORDER BY sg.created_at DESC
LIMIT 10;

-- 10. Check if there are any teachers
SELECT 
    'teachers' as check_type,
    COUNT(*) as total_teachers,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_teachers
FROM teachers;

-- 11. Check if there are any subjects
SELECT 
    'subjects' as check_type,
    COUNT(*) as total_subjects,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_subjects
FROM subjects;

-- 12. Check the specific combination that might be selected in the UI
-- This will help us understand what the user is trying to select
SELECT 
    'potential UI selections' as check_type,
    'Group A' as selected_group,
    'marsul' as selected_semester,
    'ادارة اعمال' as selected_department,
    'No specific matches found - this might be the issue' as note;

-- 13. Try to find matches for the UI selections
SELECT 
    'matching assignments for UI selections' as check_type,
    ts.id,
    ts.teacher_id,
    ts.subject_id,
    ts.department_id,
    ts.semester_id,
    ts.is_active,
    t.name as teacher_name,
    s.name as subject_name,
    d.name as department_name,
    sem.name as semester_name
FROM teacher_subjects ts
LEFT JOIN teachers t ON ts.teacher_id = t.id
LEFT JOIN subjects s ON ts.subject_id = s.id
LEFT JOIN departments d ON ts.department_id = d.id
LEFT JOIN semesters sem ON ts.semester_id = sem.id
WHERE ts.is_active = true
AND (
    d.name ILIKE '%ادارة اعمال%' OR 
    d.name_en ILIKE '%business%' OR
    sem.name ILIKE '%marsul%' OR
    sem.name_en ILIKE '%marsul%'
)
LIMIT 10;
