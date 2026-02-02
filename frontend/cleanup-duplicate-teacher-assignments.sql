-- Clean up duplicate teacher assignments
-- This script removes duplicate assignments, keeping only the most recent active one

-- First, let's see what duplicates exist
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

-- Remove duplicates, keeping only the most recent active assignment
WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY teacher_id, subject_id, department_id, academic_year, semester 
            ORDER BY created_at DESC, is_active DESC
        ) as rn
    FROM teacher_subjects
)
DELETE FROM teacher_subjects 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Show remaining assignments
SELECT 
    ts.id,
    t.name as teacher_name,
    s.name as subject_name,
    d.name as department_name,
    ts.academic_year,
    ts.semester,
    ts.is_active,
    ts.created_at
FROM teacher_subjects ts
JOIN teachers t ON ts.teacher_id = t.id
JOIN subjects s ON ts.subject_id = s.id
JOIN departments d ON ts.department_id = d.id
ORDER BY t.name, s.name, ts.academic_year, ts.semester;

SELECT 'Duplicate assignments cleaned up successfully!' as status;


