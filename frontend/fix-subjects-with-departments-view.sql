-- ==============================================
-- FIX: UPDATE SUBJECTS_WITH_DEPARTMENTS VIEW
-- ==============================================
-- This script updates the view to properly show many-to-many department relationships

-- ==============================================
-- 1. DROP EXISTING VIEW
-- ==============================================

DROP VIEW IF EXISTS subjects_with_departments;

-- ==============================================
-- 2. CREATE UPDATED VIEW WITH JUNCTION TABLE
-- ==============================================

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
-- 3. VERIFY THE VIEW
-- ==============================================

-- Test the view with sample data
SELECT 
    id,
    name,
    code,
    departments,
    primary_department,
    department_name
FROM subjects_with_departments
LIMIT 3;

-- ==============================================
-- 4. CHECK DEPARTMENT RELATIONSHIPS
-- ==============================================

-- Show current subject-department relationships
SELECT 
    s.name as subject_name,
    s.code as subject_code,
    d.name as department_name,
    sd.is_primary_department,
    sd.is_active
FROM subjects s
JOIN subject_departments sd ON s.id = sd.subject_id
JOIN departments d ON d.id = sd.department_id
ORDER BY s.name, sd.is_primary_department DESC;

-- ==============================================
-- FIX COMPLETE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '✅ subjects_with_departments view updated successfully!';
    RAISE NOTICE '📊 View now includes: departments (JSON array), primary_department (JSON object)';
    RAISE NOTICE '🔗 View uses subject_departments junction table for many-to-many relationships';
    RAISE NOTICE '🎯 Subjects should now display their linked departments properly';
END $$;
