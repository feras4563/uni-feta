-- IMMEDIATE FIX: Force only one semester to be current
-- This script will definitively fix the duplicate current semester issue

-- First, let's see the current problematic state
SELECT '=== CURRENT PROBLEMATIC STATE ===' as info;
SELECT s.id, s.name, s.code, sy.name as study_year, s.is_current, s.is_active 
FROM semesters s
LEFT JOIN study_years sy ON s.study_year_id = sy.id
WHERE s.is_current = true
ORDER BY s.created_at;

-- Count how many are currently marked as current (should be more than 1)
SELECT 'Current count (should be > 1):' as info, COUNT(*) as current_count 
FROM semesters 
WHERE is_current = true;

-- STEP 1: FORCE ALL SEMESTERS TO NOT CURRENT
UPDATE semesters 
SET is_current = false, updated_at = NOW();

-- Verify all are now false
SELECT 'After setting all to false:' as info;
SELECT COUNT(*) as current_count 
FROM semesters 
WHERE is_current = true;

-- STEP 2: Set ONLY the 2024-2025 Fall Semester as current (most logical choice)
-- First, let's find the correct semester ID
SELECT 'Finding 2024-2025 Fall Semester:' as info;
SELECT s.id, s.name, s.code, sy.name as study_year
FROM semesters s
LEFT JOIN study_years sy ON s.study_year_id = sy.id
WHERE s.code = 'F24' AND sy.name = '2024-2025';

-- Set ONLY the 2024-2025 Fall Semester as current
UPDATE semesters 
SET is_current = true, updated_at = NOW()
WHERE id = (
    SELECT s.id 
    FROM semesters s
    LEFT JOIN study_years sy ON s.study_year_id = sy.id
    WHERE s.code = 'F24' AND sy.name = '2024-2025'
    LIMIT 1
);

-- STEP 3: VERIFY THE FIX
SELECT '=== FINAL VERIFICATION ===' as info;

-- Check that only one is current
SELECT 'Final count (should be exactly 1):' as info, COUNT(*) as current_count 
FROM semesters 
WHERE is_current = true;

-- Show which one is current
SELECT 'Current semester details:' as info;
SELECT s.id, s.name, s.code, sy.name as study_year, s.is_current, s.is_active 
FROM semesters s
LEFT JOIN study_years sy ON s.study_year_id = sy.id
WHERE s.is_current = true;

-- Show all semesters for comparison
SELECT 'All semesters status:' as info;
SELECT s.name, s.code, sy.name as study_year, s.is_current, s.is_active 
FROM semesters s
LEFT JOIN study_years sy ON s.study_year_id = sy.id
ORDER BY sy.name, s.name;

SELECT '=== FIX COMPLETED ===' as result;
SELECT 'Only one semester should now be marked as current.' as info;
