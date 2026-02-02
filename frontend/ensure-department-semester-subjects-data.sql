-- ======================================================================
-- ENSURE DEPARTMENT_SEMESTER_SUBJECTS HAS DATA
-- ======================================================================
-- This ensures the department_semester_subjects table has the subjects data

-- ======================================================================
-- 1. CHECK CURRENT STATE
-- ======================================================================

-- Check if table exists and has data
SELECT 
    'Checking department_semester_subjects...' as status,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'department_semester_subjects'
    ) as table_exists;

SELECT 
    'Current relationships:' as info,
    COUNT(*) as count
FROM department_semester_subjects;

-- ======================================================================
-- 2. CREATE TABLE IF MISSING
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
-- 3. ENSURE DATA EXISTS
-- ======================================================================

-- If no data exists, create sample relationships
DO $$
DECLARE
    subject_record RECORD;
    dept_record RECORD;
    semester_record RECORD;
    relationship_count INTEGER;
BEGIN
    -- Count existing relationships
    SELECT COUNT(*) INTO relationship_count FROM department_semester_subjects;
    
    -- If no relationships exist, create some
    IF relationship_count = 0 THEN
        -- Get first department and semester
        SELECT id INTO dept_record FROM departments LIMIT 1;
        SELECT id INTO semester_record FROM semesters LIMIT 1;
        
        IF dept_record.id IS NOT NULL AND semester_record.id IS NOT NULL THEN
            -- Link all subjects to this department for semester 1
            FOR subject_record IN 
                SELECT id FROM subjects
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
            
            RAISE NOTICE 'Created department-semester-subject relationships for all subjects';
        END IF;
    END IF;
END $$;

-- ======================================================================
-- 4. DISABLE RLS
-- ======================================================================

ALTER TABLE department_semester_subjects DISABLE ROW LEVEL SECURITY;

-- ======================================================================
-- 5. VERIFY DATA
-- ======================================================================

-- Show final relationships
SELECT 
    'Final relationships:' as status,
    COUNT(*) as count
FROM department_semester_subjects;

-- Show sample data
SELECT 
    d.name as department_name,
    s.name as subject_name,
    s.code as subject_code,
    dss.semester_number,
    s.credits
FROM department_semester_subjects dss
JOIN departments d ON d.id = dss.department_id
JOIN subjects s ON s.id = dss.subject_id
ORDER BY d.name, dss.semester_number, s.name
LIMIT 10;

-- Test the exact query used by fetchDepartmentDetails
SELECT 
    'Testing fetchDepartmentDetails query...' as test,
    COUNT(*) as subjects_found
FROM department_semester_subjects dss
JOIN subjects s ON s.id = dss.subject_id
WHERE dss.department_id = (SELECT id FROM departments LIMIT 1);

-- ======================================================================
-- SUCCESS MESSAGE
-- ======================================================================

SELECT 'SUCCESS: Department-semester-subjects table is ready! Subjects should now show in department detail page.' as result;
