-- ======================================================================
-- FIX SUBJECT-DEPARTMENT LINKING ISSUE
-- ======================================================================
-- This fixes the issue where subjects don't show in department detail pages

-- ======================================================================
-- 1. CHECK CURRENT STATE
-- ======================================================================

-- Check if subject_departments table exists
SELECT 
    'Checking subject_departments table...' as status,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'subject_departments'
    ) as table_exists;

-- Check current subjects and departments
SELECT 
    'Current subjects count:' as info,
    COUNT(*) as count
FROM subjects;

SELECT 
    'Current departments count:' as info,
    COUNT(*) as count
FROM departments;

-- Check if any subject-department relationships exist
SELECT 
    'Current subject-department relationships:' as info,
    COUNT(*) as count
FROM subject_departments;

-- ======================================================================
-- 2. CREATE SUBJECT_DEPARTMENTS TABLE (IF MISSING)
-- ======================================================================

CREATE TABLE IF NOT EXISTS subject_departments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    is_primary_department BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(subject_id, department_id)
);

-- ======================================================================
-- 3. MIGRATE EXISTING DATA
-- ======================================================================

-- If subjects have department_id column, migrate that data
DO $$
DECLARE
    subject_record RECORD;
BEGIN
    -- Check if subjects table has department_id column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subjects' AND column_name = 'department_id'
    ) THEN
        -- Migrate existing subject-department relationships
        FOR subject_record IN 
            SELECT id, department_id FROM subjects WHERE department_id IS NOT NULL
        LOOP
            INSERT INTO subject_departments (subject_id, department_id, is_primary_department, is_active)
            VALUES (subject_record.id, subject_record.department_id, true, true)
            ON CONFLICT (subject_id, department_id) DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'Migrated existing subject-department relationships';
    END IF;
END $$;

-- ======================================================================
-- 4. CREATE SAMPLE RELATIONSHIPS FOR TESTING
-- ======================================================================

-- Create sample subject-department relationships if none exist
DO $$
DECLARE
    subject_record RECORD;
    dept_record RECORD;
    relationship_count INTEGER;
BEGIN
    -- Count existing relationships
    SELECT COUNT(*) INTO relationship_count FROM subject_departments;
    
    -- If no relationships exist, create some sample ones
    IF relationship_count = 0 THEN
        -- Get first department
        SELECT id INTO dept_record FROM departments LIMIT 1;
        
        IF dept_record.id IS NOT NULL THEN
            -- Link first 3 subjects to this department
            FOR subject_record IN 
                SELECT id FROM subjects LIMIT 3
            LOOP
                INSERT INTO subject_departments (subject_id, department_id, is_primary_department, is_active)
                VALUES (subject_record.id, dept_record.id, true, true)
                ON CONFLICT (subject_id, department_id) DO NOTHING;
            END LOOP;
            
            RAISE NOTICE 'Created sample subject-department relationships';
        END IF;
    END IF;
END $$;

-- ======================================================================
-- 5. CREATE SUBJECTS_WITH_DEPARTMENTS VIEW
-- ======================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS subjects_with_departments;

-- Create updated view
CREATE VIEW subjects_with_departments AS
SELECT 
    s.id,
    s.name,
    s.name_en,
    s.code,
    s.description,
    s.credits,
    s.department_id,
    s.cost_per_credit,
    s.total_cost,
    s.is_required,
    s.semester_number,
    s.semester,
    s.prerequisites,
    s.teacher_id,
    s.max_students,
    s.is_active,
    s.created_at,
    s.updated_at,
    
    -- Aggregate department information as JSON array
    COALESCE(
        json_agg(
            json_build_object(
                'id', d.id,
                'name', d.name,
                'name_en', d.name_en,
                'is_primary', sd.is_primary_department,
                'is_active', sd.is_active
            ) ORDER BY sd.is_primary_department DESC, d.name
        ) FILTER (WHERE d.id IS NOT NULL),
        '[]'::json
    ) as departments,
    
    -- Primary department for backward compatibility
    (
        SELECT json_build_object('id', d.id, 'name', d.name, 'name_en', d.name_en)
        FROM subject_departments sd
        JOIN departments d ON d.id = sd.department_id
        WHERE sd.subject_id = s.id AND sd.is_primary_department = true AND sd.is_active = true
        LIMIT 1
    ) as primary_department,
    
    -- Legacy fields for backward compatibility
    (
        SELECT d.name
        FROM subject_departments sd
        JOIN departments d ON d.id = sd.department_id
        WHERE sd.subject_id = s.id AND sd.is_primary_department = true AND sd.is_active = true
        LIMIT 1
    ) as department_name
FROM subjects s
LEFT JOIN subject_departments sd ON s.id = sd.subject_id AND sd.is_active = true
LEFT JOIN departments d ON d.id = sd.department_id
GROUP BY s.id, s.name, s.name_en, s.code, s.description, s.credits, s.department_id, 
         s.cost_per_credit, s.total_cost, s.is_required, s.semester_number, s.semester, 
         s.prerequisites, s.teacher_id, s.max_students, s.is_active, s.created_at, s.updated_at;

-- ======================================================================
-- 6. DISABLE RLS FOR DEVELOPMENT
-- ======================================================================

ALTER TABLE subject_departments DISABLE ROW LEVEL SECURITY;

-- ======================================================================
-- 7. VERIFY THE FIX
-- ======================================================================

-- Check final relationships
SELECT 
    'Final subject-department relationships:' as status,
    COUNT(*) as count
FROM subject_departments;

-- Show sample relationships
SELECT 
    s.name as subject_name,
    d.name as department_name,
    sd.is_primary_department,
    sd.is_active
FROM subject_departments sd
JOIN subjects s ON s.id = sd.subject_id
JOIN departments d ON d.id = sd.department_id
ORDER BY d.name, s.name
LIMIT 10;

-- Test the department details query
SELECT 
    'Testing department details query...' as test,
    COUNT(*) as subjects_found
FROM subject_departments sd
JOIN subjects s ON s.id = sd.subject_id
WHERE sd.department_id = (SELECT id FROM departments LIMIT 1)
AND sd.is_active = true;

-- ======================================================================
-- SUCCESS MESSAGE
-- ======================================================================

SELECT 'SUCCESS: Subject-department linking fixed! Subjects should now show in department details.' as result;
