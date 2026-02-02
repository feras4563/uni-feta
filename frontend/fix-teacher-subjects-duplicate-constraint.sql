-- Fix teacher_subjects duplicate constraint issue
-- This script helps identify and resolve duplicate assignment issues

-- First, let's see what the current unique constraint looks like
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'teacher_subjects'::regclass 
AND conname LIKE '%unique%';

-- Check for existing duplicate assignments
SELECT 
    teacher_id,
    subject_id,
    department_id,
    academic_year,
    semester,
    COUNT(*) as duplicate_count
FROM teacher_subjects 
GROUP BY teacher_id, subject_id, department_id, academic_year, semester
HAVING COUNT(*) > 1;

-- Show all current assignments for reference
SELECT 
    ts.id,
    t.name as teacher_name,
    s.name as subject_name,
    d.name as department_name,
    ts.academic_year,
    ts.semester,
    ts.is_active
FROM teacher_subjects ts
JOIN teachers t ON ts.teacher_id = t.id
JOIN subjects s ON ts.subject_id = s.id
JOIN departments d ON ts.department_id = d.id
ORDER BY t.name, s.name, ts.academic_year, ts.semester;


