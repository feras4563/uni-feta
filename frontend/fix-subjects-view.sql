-- ==============================================
-- FIX SUBJECTS_WITH_DEPARTMENTS VIEW
-- Add the missing cost fields to the view
-- ==============================================

-- Drop and recreate the view with cost fields
DROP VIEW IF EXISTS subjects_with_departments;

CREATE OR REPLACE VIEW subjects_with_departments AS
SELECT 
    s.id,
    s.code,
    s.name,
    s.name_en,
    s.credits,
    s.teacher_id,
    s.semester,
    s.max_students,
    s.created_at,
    s.updated_at,
    -- Add cost fields
    s.cost_per_credit,
    s.total_cost,
    s.is_required,
    s.semester_number,
    -- Aggregate department information
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
    ) as primary_department
FROM subjects s
LEFT JOIN subject_departments sd ON s.id = sd.subject_id AND sd.is_active = true
LEFT JOIN departments d ON d.id = sd.department_id
GROUP BY s.id, s.code, s.name, s.name_en, s.credits, s.teacher_id, s.semester, s.max_students, s.created_at, s.updated_at, s.cost_per_credit, s.total_cost, s.is_required, s.semester_number;

-- Grant permissions on the view
GRANT SELECT ON subjects_with_departments TO authenticated;

-- Add comment
COMMENT ON VIEW subjects_with_departments IS 'View that provides subjects with their associated departments and cost information in JSON format';

-- ==============================================
-- SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'SUBJECTS_WITH_DEPARTMENTS VIEW UPDATED!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Added fields:';
    RAISE NOTICE '✅ cost_per_credit';
    RAISE NOTICE '✅ total_cost';
    RAISE NOTICE '✅ is_required';
    RAISE NOTICE '✅ semester_number';
    RAISE NOTICE '';
    RAISE NOTICE 'The 400 error should now be resolved!';
    RAISE NOTICE '==============================================';
END $$;







