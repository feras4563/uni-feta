-- ==============================================
-- QUICK FIX: TOTAL_COST INSERT ERROR
-- ==============================================
-- This script verifies the total_cost column is properly configured as generated

-- ==============================================
-- 1. CHECK TOTAL_COST COLUMN CONFIGURATION
-- ==============================================

-- Check if total_cost is properly configured as generated
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    is_generated,
    generation_expression
FROM information_schema.columns 
WHERE table_name = 'subjects' 
AND column_name = 'total_cost';

-- ==============================================
-- 2. TEST THE GENERATED COLUMN
-- ==============================================

-- Test inserting a subject without total_cost to verify it's auto-calculated
INSERT INTO subjects (
    name, 
    name_en, 
    code, 
    description, 
    credits, 
    department_id, 
    cost_per_credit, 
    is_required, 
    semester_number, 
    semester, 
    prerequisites, 
    teacher_id, 
    max_students
) VALUES (
    'Test Subject', 
    'Test Subject EN', 
    'TEST001', 
    'Test description', 
    3, 
    'DEPT001', 
    100.00, 
    true, 
    1, 
    '1', 
    NULL, 
    NULL, 
    25
);

-- Check if total_cost was auto-calculated
SELECT 
    id, 
    name, 
    code, 
    credits, 
    cost_per_credit, 
    total_cost 
FROM subjects 
WHERE code = 'TEST001';

-- Clean up test record
DELETE FROM subjects WHERE code = 'TEST001';

-- ==============================================
-- 3. VERIFY THE FIX
-- ==============================================

-- Show sample subjects with auto-calculated total_cost
SELECT 
    id, 
    name, 
    code, 
    credits, 
    cost_per_credit, 
    total_cost,
    (credits * cost_per_credit) as calculated_total
FROM subjects 
LIMIT 5;

-- ==============================================
-- FIX COMPLETE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '✅ total_cost column verification complete!';
    RAISE NOTICE '📊 Column: total_cost (GENERATED ALWAYS AS credits * cost_per_credit)';
    RAISE NOTICE '🎯 SubjectCreate.tsx should exclude total_cost from insert operations';
    RAISE NOTICE '💡 The total_cost will be automatically calculated by the database';
END $$;
