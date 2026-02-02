-- Fix the foreign key relationship issue between teacher_subjects and subjects
-- The error shows: "Could not find a relationship between 'teacher_subjects' and 'subjects'"

-- 1. Check the current foreign key constraints
SELECT 
    'Current foreign keys' as info,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'teacher_subjects';

-- 2. Check if subjects table exists and has the right structure
SELECT 'Subjects table structure' as info, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'subjects'
ORDER BY ordinal_position;

-- 3. Check if teacher_subjects table has subject_id column
SELECT 'Teacher_subjects table structure' as info, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'teacher_subjects'
ORDER BY ordinal_position;

-- 4. Try to recreate the foreign key relationship
-- First, drop existing foreign key if it exists
ALTER TABLE teacher_subjects DROP CONSTRAINT IF EXISTS teacher_subjects_subject_id_fkey;

-- 5. Recreate the foreign key relationship
ALTER TABLE teacher_subjects 
ADD CONSTRAINT teacher_subjects_subject_id_fkey 
FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;

-- 6. Also fix the other foreign key relationships
ALTER TABLE teacher_subjects DROP CONSTRAINT IF EXISTS teacher_subjects_teacher_id_fkey;
ALTER TABLE teacher_subjects 
ADD CONSTRAINT teacher_subjects_teacher_id_fkey 
FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE;

ALTER TABLE teacher_subjects DROP CONSTRAINT IF EXISTS teacher_subjects_department_id_fkey;
ALTER TABLE teacher_subjects 
ADD CONSTRAINT teacher_subjects_department_id_fkey 
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE;

ALTER TABLE teacher_subjects DROP CONSTRAINT IF EXISTS teacher_subjects_semester_id_fkey;
ALTER TABLE teacher_subjects 
ADD CONSTRAINT teacher_subjects_semester_id_fkey 
FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE;

-- 7. Verify the relationships are fixed
SELECT 
    'Fixed foreign keys' as info,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'teacher_subjects';

-- 8. Now create some test assignments to verify everything works
INSERT INTO teacher_subjects (
    id, teacher_id, subject_id, department_id, semester_id, study_year_id,
    academic_year, semester, is_active, is_primary_teacher, can_edit_grades, can_take_attendance
)
SELECT 
    gen_random_uuid()::text,
    t.id,
    s.id,
    'cd6f54a9-f1c1-470a-bd2d-7518b05189d8',  -- exact department ID
    '52222aad-7c8d-4a18-943d-1713e1149337',  -- exact semester ID
    COALESCE(sy.id, 'year-2024-2025'),
    '2024-2025',
    'fall',
    true,
    true,
    true,
    true
FROM (SELECT id FROM teachers WHERE is_active = true LIMIT 1) t
CROSS JOIN (SELECT id FROM subjects WHERE is_active = true LIMIT 1) s
LEFT JOIN study_years sy ON sy.is_current = true
WHERE NOT EXISTS (
    SELECT 1 FROM teacher_subjects ts 
    WHERE ts.teacher_id = t.id 
    AND ts.subject_id = s.id 
    AND ts.department_id = 'cd6f54a9-f1c1-470a-bd2d-7518b05189d8'
    AND ts.semester_id = '52222aad-7c8d-4a18-943d-1713e1149337'
);

-- 9. Test the relationship by querying with joins
SELECT 
    'Test query with joins' as info,
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
WHERE ts.department_id = 'cd6f54a9-f1c1-470a-bd2d-7518b05189d8'
AND ts.semester_id = '52222aad-7c8d-4a18-943d-1713e1149337'
AND ts.is_active = true;