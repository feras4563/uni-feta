-- ======================================================================
-- CREATE DEPARTMENT_SEMESTER_SUBJECTS TABLE
-- ======================================================================
-- This fixes the issue where subjects show in modal but not in main page

-- ======================================================================
-- 1. CHECK CURRENT STATE
-- ======================================================================

-- Check if department_semester_subjects table exists
SELECT 
    'Checking department_semester_subjects table...' as status,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'department_semester_subjects'
    ) as table_exists;

-- Check current data counts
SELECT 
    'Current subjects:' as info,
    COUNT(*) as count
FROM subjects;

SELECT 
    'Current departments:' as info,
    COUNT(*) as count
FROM departments;

-- ======================================================================
-- 2. CREATE DEPARTMENT_SEMESTER_SUBJECTS TABLE
-- ======================================================================

CREATE TABLE IF NOT EXISTS department_semester_subjects (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    semester_number INTEGER NOT NULL,
    semester_id TEXT REFERENCES semesters(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(department_id, subject_id, semester_number)
);

-- ======================================================================
-- 3. MIGRATE DATA FROM SUBJECT_DEPARTMENTS
-- ======================================================================

-- Migrate existing subject-department relationships to department_semester_subjects
DO $$
DECLARE
    relationship_record RECORD;
    default_semester_id TEXT;
BEGIN
    -- Get default semester (Fall 2024)
    SELECT id INTO default_semester_id FROM semesters WHERE name = 'الفصل الأول' LIMIT 1;
    
    -- Migrate from subject_departments to department_semester_subjects
    FOR relationship_record IN 
        SELECT sd.subject_id, sd.department_id, s.semester_number
        FROM subject_departments sd
        JOIN subjects s ON s.id = sd.subject_id
        WHERE sd.is_active = true
    LOOP
        INSERT INTO department_semester_subjects (
            department_id, 
            subject_id, 
            semester_number, 
            semester_id
        )
        VALUES (
            relationship_record.department_id,
            relationship_record.subject_id,
            COALESCE(relationship_record.semester_number, 1),
            default_semester_id
        )
        ON CONFLICT (department_id, subject_id, semester_number) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Migrated subject-department relationships to department_semester_subjects';
END $$;

-- ======================================================================
-- 4. CREATE SAMPLE DATA FOR TESTING
-- ======================================================================

-- Create sample department-semester-subject relationships if none exist
DO $$
DECLARE
    subject_record RECORD;
    dept_record RECORD;
    semester_record RECORD;
    relationship_count INTEGER;
BEGIN
    -- Count existing relationships
    SELECT COUNT(*) INTO relationship_count FROM department_semester_subjects;
    
    -- If no relationships exist, create some sample ones
    IF relationship_count = 0 THEN
        -- Get first department and semester
        SELECT id INTO dept_record FROM departments LIMIT 1;
        SELECT id INTO semester_record FROM semesters LIMIT 1;
        
        IF dept_record.id IS NOT NULL AND semester_record.id IS NOT NULL THEN
            -- Link first 3 subjects to this department for semester 1
            FOR subject_record IN 
                SELECT id FROM subjects LIMIT 3
            LOOP
                INSERT INTO department_semester_subjects (
                    department_id, 
                    subject_id, 
                    semester_number, 
                    semester_id
                )
                VALUES (
                    dept_record.id,
                    subject_record.id,
                    1,
                    semester_record.id
                )
                ON CONFLICT (department_id, subject_id, semester_number) DO NOTHING;
            END LOOP;
            
            RAISE NOTICE 'Created sample department-semester-subject relationships';
        END IF;
    END IF;
END $$;

-- ======================================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ======================================================================

CREATE INDEX IF NOT EXISTS idx_department_semester_subjects_dept ON department_semester_subjects(department_id);
CREATE INDEX IF NOT EXISTS idx_department_semester_subjects_subject ON department_semester_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_department_semester_subjects_semester ON department_semester_subjects(semester_number);
CREATE INDEX IF NOT EXISTS idx_department_semester_subjects_semester_id ON department_semester_subjects(semester_id);

-- ======================================================================
-- 6. DISABLE RLS FOR DEVELOPMENT
-- ======================================================================

ALTER TABLE department_semester_subjects DISABLE ROW LEVEL SECURITY;

-- ======================================================================
-- 7. VERIFY THE CREATION
-- ======================================================================

-- Check final relationships
SELECT 
    'Final department-semester-subject relationships:' as status,
    COUNT(*) as count
FROM department_semester_subjects;

-- Show sample relationships
SELECT 
    d.name as department_name,
    s.name as subject_name,
    s.code as subject_code,
    dss.semester_number,
    sem.name as semester_name
FROM department_semester_subjects dss
JOIN departments d ON d.id = dss.department_id
JOIN subjects s ON s.id = dss.subject_id
LEFT JOIN semesters sem ON sem.id = dss.semester_id
ORDER BY d.name, dss.semester_number, s.name
LIMIT 10;

-- Test the modal query
SELECT 
    'Testing modal query...' as test,
    COUNT(*) as subjects_found
FROM department_semester_subjects dss
JOIN subjects s ON s.id = dss.subject_id
WHERE dss.department_id = (SELECT id FROM departments LIMIT 1)
AND dss.semester_number = 1;

-- ======================================================================
-- SUCCESS MESSAGE
-- ======================================================================

SELECT 'SUCCESS: Department-semester-subjects table created! Subjects should now show in both modal and main page.' as result;
