-- ==============================================
-- FIX: CREATE MISSING SUBJECT_DEPARTMENTS TABLE
-- ==============================================
-- This script creates the missing subject_departments junction table

-- ==============================================
-- 1. CREATE SUBJECT_DEPARTMENTS JUNCTION TABLE
-- ==============================================

-- Create the junction table for subject-department relationships
CREATE TABLE IF NOT EXISTS subject_departments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    
    -- Additional metadata for the relationship
    is_primary_department BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate relationships
    UNIQUE(subject_id, department_id)
);

-- ==============================================
-- 2. CREATE INDEXES
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_subject_departments_subject_id ON subject_departments(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_departments_department_id ON subject_departments(department_id);
CREATE INDEX IF NOT EXISTS idx_subject_departments_primary ON subject_departments(subject_id, is_primary_department);

-- ==============================================
-- 3. CREATE TRIGGER FOR UPDATED_AT
-- ==============================================

CREATE TRIGGER update_subject_departments_updated_at 
BEFORE UPDATE ON subject_departments 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 4. DISABLE RLS FOR DEVELOPMENT
-- ==============================================

ALTER TABLE subject_departments DISABLE ROW LEVEL SECURITY;

-- ==============================================
-- 5. TEST THE RELATIONSHIP
-- ==============================================

-- Test inserting a subject-department relationship
DO $$
DECLARE
    test_subject_id TEXT;
    test_department_id TEXT;
BEGIN
    -- Get a sample subject and department
    SELECT id INTO test_subject_id FROM subjects LIMIT 1;
    SELECT id INTO test_department_id FROM departments LIMIT 1;
    
    -- Only proceed if we have both
    IF test_subject_id IS NOT NULL AND test_department_id IS NOT NULL THEN
        -- Insert test relationship
        INSERT INTO subject_departments (subject_id, department_id, is_primary_department)
        VALUES (test_subject_id, test_department_id, true)
        ON CONFLICT (subject_id, department_id) DO NOTHING;
        
        RAISE NOTICE 'Test relationship created: Subject % -> Department %', test_subject_id, test_department_id;
    END IF;
END $$;

-- ==============================================
-- 6. VERIFY THE FIX
-- ==============================================

-- Check if the table exists and has the correct structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'subject_departments'
ORDER BY ordinal_position;

-- Check sample data
SELECT 
    sd.id,
    sd.subject_id,
    s.name as subject_name,
    sd.department_id,
    d.name as department_name,
    sd.is_primary_department
FROM subject_departments sd
LEFT JOIN subjects s ON s.id = sd.subject_id
LEFT JOIN departments d ON d.id = sd.department_id
LIMIT 5;

-- ==============================================
-- FIX COMPLETE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '✅ subject_departments table created successfully!';
    RAISE NOTICE '📊 Table: subject_departments (junction table for many-to-many relationships)';
    RAISE NOTICE '🔗 Columns: id, subject_id, department_id, is_primary_department, is_active';
    RAISE NOTICE '🎯 SubjectCreate should now save department relationships properly';
END $$;
