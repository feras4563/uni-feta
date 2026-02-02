-- Fix timetable generation issue by ensuring teacher_subjects table has proper semester_id relationships
-- This script addresses the "لا توجد تكليفات مدرسين بالمواد للقسم والفصل المحددين" error

-- First, let's check the current state of teacher_subjects table
SELECT 
    'Current teacher_subjects structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'teacher_subjects'
ORDER BY ordinal_position;

-- Check if semester_id column exists and has data
SELECT 
    'teacher_subjects semester_id check' as check_type,
    COUNT(*) as total_records,
    COUNT(semester_id) as records_with_semester_id,
    COUNT(semester) as records_with_semester_string
FROM teacher_subjects;

-- Check if there are any teacher assignments for current semester
SELECT 
    'Current teacher assignments' as check_type,
    ts.department_id,
    ts.semester_id,
    ts.semester,
    COUNT(*) as assignment_count,
    d.name as department_name,
    s.name as semester_name
FROM teacher_subjects ts
LEFT JOIN departments d ON ts.department_id = d.id
LEFT JOIN semesters s ON ts.semester_id = s.id
WHERE ts.is_active = true
GROUP BY ts.department_id, ts.semester_id, ts.semester, d.name, s.name
ORDER BY assignment_count DESC;

-- If semester_id column doesn't exist, add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teacher_subjects' AND column_name = 'semester_id'
    ) THEN
        ALTER TABLE teacher_subjects 
        ADD COLUMN semester_id TEXT REFERENCES semesters(id) ON DELETE CASCADE;
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_teacher_subjects_semester_id ON teacher_subjects(semester_id);
        
        RAISE NOTICE 'Added semester_id column to teacher_subjects table';
    ELSE
        RAISE NOTICE 'semester_id column already exists in teacher_subjects table';
    END IF;
END $$;

-- Update existing records to populate semester_id
UPDATE teacher_subjects 
SET semester_id = s.id
FROM semesters s
WHERE teacher_subjects.semester_id IS NULL
AND teacher_subjects.semester = CASE 
    WHEN s.name ILIKE '%خريف%' OR s.name ILIKE '%fall%' OR s.code ILIKE '%F%' THEN 'fall'
    WHEN s.name ILIKE '%ربيع%' OR s.name ILIKE '%spring%' OR s.code ILIKE '%S%' THEN 'spring'
    WHEN s.name ILIKE '%صيف%' OR s.name ILIKE '%summer%' OR s.code ILIKE '%U%' THEN 'summer'
    ELSE teacher_subjects.semester
END;

-- For any remaining records, try to match with current semester
UPDATE teacher_subjects 
SET semester_id = (
    SELECT id FROM semesters WHERE is_current = true LIMIT 1
)
WHERE semester_id IS NULL;

-- Verify the fix worked
SELECT 
    'After fix verification' as check_type,
    COUNT(*) as total_records,
    COUNT(semester_id) as records_with_semester_id,
    COUNT(CASE WHEN semester_id IS NOT NULL THEN 1 END) as non_null_semester_id
FROM teacher_subjects
WHERE is_active = true;

-- Show sample of fixed data
SELECT 
    ts.id,
    ts.teacher_id,
    ts.subject_id,
    ts.department_id,
    ts.semester_id,
    ts.semester,
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
LIMIT 5;
