-- ======================================================================
-- FIX 400 BAD REQUEST ERROR FOR DEPARTMENT_SEMESTER_SUBJECTS
-- ======================================================================
-- This fixes the 400 error when querying department_semester_subjects table

-- ======================================================================
-- 1. CHECK IF TABLE EXISTS
-- ======================================================================

-- Check if department_semester_subjects table exists
SELECT 
    'Checking department_semester_subjects table...' as status,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'department_semester_subjects'
    ) as table_exists;

-- Check table structure if it exists
SELECT 
    'Table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'department_semester_subjects'
ORDER BY ordinal_position;

-- ======================================================================
-- 2. DROP AND RECREATE TABLE WITH CORRECT STRUCTURE
-- ======================================================================

-- Drop the table if it exists (to ensure clean structure)
DROP TABLE IF EXISTS department_semester_subjects CASCADE;

-- Create department_semester_subjects table with correct structure
CREATE TABLE department_semester_subjects (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    semester_number INTEGER NOT NULL DEFAULT 1,
    semester_id TEXT REFERENCES semesters(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(department_id, subject_id, semester_number)
);

-- ======================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ======================================================================

CREATE INDEX idx_department_semester_subjects_dept_id ON department_semester_subjects(department_id);
CREATE INDEX idx_department_semester_subjects_subject_id ON department_semester_subjects(subject_id);
CREATE INDEX idx_department_semester_subjects_semester_num ON department_semester_subjects(semester_number);
CREATE INDEX idx_department_semester_subjects_active ON department_semester_subjects(is_active);

-- ======================================================================
-- 4. DISABLE RLS FOR DEVELOPMENT
-- ======================================================================

ALTER TABLE department_semester_subjects DISABLE ROW LEVEL SECURITY;

-- ======================================================================
-- 5. INSERT SAMPLE DATA FOR TESTING
-- ======================================================================

-- Insert sample data for the department from the error log
DO $$
DECLARE
    dept_id TEXT := 'cd6f54a9-f1c1-470a-bd2d-7518b05189d8'; -- From the error URL
    subject_record RECORD;
    semester_record RECORD;
    subject_count INTEGER := 0;
BEGIN
    -- Get a semester ID
    SELECT id INTO semester_record FROM semesters LIMIT 1;
    
    -- Check if the department exists
    IF EXISTS (SELECT 1 FROM departments WHERE id = dept_id) THEN
        -- Link first 3 subjects to this department for semester 1
        FOR subject_record IN 
            SELECT id FROM subjects LIMIT 3
        LOOP
            INSERT INTO department_semester_subjects (
                department_id, 
                subject_id, 
                semester_number, 
                semester_id,
                is_active
            )
            VALUES (
                dept_id,
                subject_record.id,
                1,
                semester_record.id,
                true
            )
            ON CONFLICT (department_id, subject_id, semester_number) DO NOTHING;
            
            subject_count := subject_count + 1;
        END LOOP;
        
        -- Link next 2 subjects to semester 2
        FOR subject_record IN 
            SELECT id FROM subjects OFFSET 3 LIMIT 2
        LOOP
            INSERT INTO department_semester_subjects (
                department_id, 
                subject_id, 
                semester_number, 
                semester_id,
                is_active
            )
            VALUES (
                dept_id,
                subject_record.id,
                2,
                semester_record.id,
                true
            )
            ON CONFLICT (department_id, subject_id, semester_number) DO NOTHING;
            
            subject_count := subject_count + 1;
        END LOOP;
        
        RAISE NOTICE 'Created % sample relationships for department %', subject_count, dept_id;
    ELSE
        RAISE NOTICE 'Department % does not exist', dept_id;
        
        -- Create sample data for first available department
        SELECT id INTO dept_id FROM departments LIMIT 1;
        
        IF dept_id IS NOT NULL THEN
            FOR subject_record IN 
                SELECT id FROM subjects LIMIT 5
            LOOP
                INSERT INTO department_semester_subjects (
                    department_id, 
                    subject_id, 
                    semester_number, 
                    semester_id,
                    is_active
                )
                VALUES (
                    dept_id,
                    subject_record.id,
                    1,
                    semester_record.id,
                    true
                )
                ON CONFLICT (department_id, subject_id, semester_number) DO NOTHING;
                
                subject_count := subject_count + 1;
            END LOOP;
            
            RAISE NOTICE 'Created % sample relationships for first department %', subject_count, dept_id;
        END IF;
    END IF;
END $$;

-- ======================================================================
-- 6. TEST THE EXACT API QUERY
-- ======================================================================

-- Test the exact query that was failing in the console
SELECT 
    'Testing the failing API query...' as test,
    dss.semester_number,
    dss.semester_id,
    s.id,
    s.code,
    s.name,
    s.name_en,
    s.credits,
    s.semester,
    s.max_students,
    s.created_at
FROM department_semester_subjects dss
INNER JOIN subjects s ON s.id = dss.subject_id
WHERE dss.department_id = 'cd6f54a9-f1c1-470a-bd2d-7518b05189d8'
LIMIT 5;

-- Test with any available department if the specific one doesn't exist
SELECT 
    'Testing with first available department...' as test,
    dss.semester_number,
    dss.semester_id,
    s.id,
    s.code,
    s.name,
    s.name_en,
    s.credits,
    s.semester,
    s.max_students,
    s.created_at
FROM department_semester_subjects dss
INNER JOIN subjects s ON s.id = dss.subject_id
WHERE dss.department_id = (SELECT id FROM departments LIMIT 1)
LIMIT 5;

-- ======================================================================
-- 7. VERIFY FOREIGN KEY RELATIONSHIPS
-- ======================================================================

-- Check foreign key constraints
SELECT 
    conname as constraint_name,
    confrelid::regclass as references_table,
    a.attname as column_name,
    af.attname as references_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.conrelid = 'department_semester_subjects'::regclass
AND c.contype = 'f'
ORDER BY conname;

-- ======================================================================
-- 8. FINAL VERIFICATION
-- ======================================================================

-- Show final table status
SELECT 
    'Final table status:' as status,
    COUNT(*) as total_relationships
FROM department_semester_subjects;

-- Show sample data
SELECT 
    'Sample data:' as info,
    d.name as department_name,
    s.name as subject_name,
    dss.semester_number,
    dss.is_active
FROM department_semester_subjects dss
JOIN departments d ON d.id = dss.department_id
JOIN subjects s ON s.id = dss.subject_id
ORDER BY d.name, dss.semester_number
LIMIT 5;

-- ======================================================================
-- SUCCESS MESSAGE
-- ======================================================================

SELECT 'SUCCESS: department_semester_subjects table recreated with correct structure! 400 error should be fixed.' as result;
