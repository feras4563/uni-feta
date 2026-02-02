-- ==============================================
-- COMPLETE SUBJECT DEPARTMENTS FIX
-- ==============================================
-- This script will ensure everything is set up correctly

-- ==============================================
-- 1. CREATE JUNCTION TABLE (IF NOT EXISTS)
-- ==============================================

CREATE TABLE IF NOT EXISTS subject_departments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    is_primary_department BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(subject_id, department_id)
);

-- ==============================================
-- 2. CREATE INDEXES
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_subject_departments_subject_id ON subject_departments(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_departments_department_id ON subject_departments(department_id);
CREATE INDEX IF NOT EXISTS idx_subject_departments_primary ON subject_departments(subject_id, is_primary_department);

-- ==============================================
-- 3. DISABLE RLS
-- ==============================================

ALTER TABLE subject_departments DISABLE ROW LEVEL SECURITY;

-- ==============================================
-- 4. CREATE/UPDATE VIEW
-- ==============================================

DROP VIEW IF EXISTS subjects_with_departments;

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
    
    -- JSON array of all departments
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
    
    -- Primary department object
    (
        SELECT json_build_object('id', d.id, 'name', d.name, 'name_en', d.name_en)
        FROM subject_departments sd
        JOIN departments d ON d.id = sd.department_id
        WHERE sd.subject_id = s.id AND sd.is_primary_department = true AND sd.is_active = true
        LIMIT 1
    ) as primary_department,
    
    -- Legacy compatibility fields
    (
        SELECT d.name
        FROM subject_departments sd
        JOIN departments d ON d.id = sd.department_id
        WHERE sd.subject_id = s.id AND sd.is_primary_department = true AND sd.is_active = true
        LIMIT 1
    ) as department_name,
    
    (
        SELECT d.name_en
        FROM subject_departments sd
        JOIN departments d ON d.id = sd.department_id
        WHERE sd.subject_id = s.id AND sd.is_primary_department = true AND sd.is_active = true
        LIMIT 1
    ) as department_name_en,
    
    (
        SELECT d.head
        FROM subject_departments sd
        JOIN departments d ON d.id = sd.department_id
        WHERE sd.subject_id = s.id AND sd.is_primary_department = true AND sd.is_active = true
        LIMIT 1
    ) as department_head

FROM subjects s
LEFT JOIN subject_departments sd ON s.id = sd.subject_id AND sd.is_active = true
LEFT JOIN departments d ON d.id = sd.department_id
GROUP BY s.id, s.name, s.name_en, s.code, s.description, s.credits, s.department_id, s.cost_per_credit, s.total_cost, s.is_required, s.semester_number, s.semester, s.prerequisites, s.teacher_id, s.max_students, s.is_active, s.created_at, s.updated_at;

-- ==============================================
-- 5. MIGRATE EXISTING DATA FROM department_id
-- ==============================================

-- If subjects have department_id but no relationships, create them
INSERT INTO subject_departments (subject_id, department_id, is_primary_department, is_active)
SELECT 
    s.id as subject_id,
    s.department_id,
    true as is_primary_department,
    true as is_active
FROM subjects s
WHERE s.department_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM subject_departments sd 
    WHERE sd.subject_id = s.id AND sd.department_id = s.department_id
)
ON CONFLICT (subject_id, department_id) DO NOTHING;

-- ==============================================
-- 6. CREATE SAMPLE RELATIONSHIPS FOR TESTING
-- ==============================================

-- Create relationships for subjects without any departments
DO $$
DECLARE
    subject_rec RECORD;
    dept_id TEXT;
BEGIN
    FOR subject_rec IN 
        SELECT s.id, s.name 
        FROM subjects s 
        WHERE NOT EXISTS (
            SELECT 1 FROM subject_departments sd WHERE sd.subject_id = s.id
        )
        LIMIT 5
    LOOP
        -- Get a random department
        SELECT id INTO dept_id FROM departments ORDER BY RANDOM() LIMIT 1;
        
        IF dept_id IS NOT NULL THEN
            INSERT INTO subject_departments (subject_id, department_id, is_primary_department, is_active)
            VALUES (subject_rec.id, dept_id, true, true)
            ON CONFLICT (subject_id, department_id) DO NOTHING;
            
            RAISE NOTICE 'Created relationship: % -> %', subject_rec.name, dept_id;
        END IF;
    END LOOP;
END $$;

-- ==============================================
-- 7. VERIFY THE FIX
-- ==============================================

-- Show sample subjects with departments
SELECT 
    s.name as subject_name,
    s.code,
    json_array_length(s.departments) as dept_count,
    s.departments,
    s.department_name as primary_dept_name
FROM subjects_with_departments s
LIMIT 5;

-- Show relationship counts
SELECT 
    'Total Subjects' as metric,
    COUNT(*)::text as value
FROM subjects
UNION ALL
SELECT 
    'Subjects with Departments' as metric,
    COUNT(DISTINCT subject_id)::text as value
FROM subject_departments
UNION ALL
SELECT 
    'Total Relationships' as metric,
    COUNT(*)::text as value
FROM subject_departments;

-- ==============================================
-- COMPLETE FIX FINISHED
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Complete subject departments fix applied!';
    RAISE NOTICE '📊 Junction table created with indexes and RLS disabled';
    RAISE NOTICE '👁️ View updated to use many-to-many relationships';
    RAISE NOTICE '🔗 Existing data migrated from department_id field';
    RAISE NOTICE '📝 Sample relationships created for testing';
    RAISE NOTICE '🎯 Subjects should now display their departments properly!';
END $$;
