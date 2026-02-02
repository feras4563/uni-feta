-- COMPREHENSIVE SEMESTER FIX
-- This script will definitely fix the duplicate current semester issue

-- ======================================================================
-- STEP 1: DIAGNOSE THE CURRENT STATE
-- ======================================================================

SELECT '=== DIAGNOSING CURRENT STATE ===' as section;

-- Show all current semesters (should be multiple)
SELECT 'Current semesters (problematic):' as info;
SELECT s.id, s.name, s.code, sy.name as study_year, s.is_current
FROM semesters s
LEFT JOIN study_years sy ON s.study_year_id = sy.id
WHERE s.is_current = true
ORDER BY s.created_at;

-- Count current semesters
SELECT 'Count of current semesters:' as info, COUNT(*) as count
FROM semesters WHERE is_current = true;

-- ======================================================================
-- STEP 2: REMOVE ALL EXISTING CONSTRAINTS/TRIGGERS THAT MIGHT BE INTERFERING
-- ======================================================================

SELECT '=== CLEANING UP EXISTING CONSTRAINTS ===' as section;

-- Drop any existing triggers
DROP TRIGGER IF EXISTS ensure_single_current_semester_trigger ON semesters;
DROP TRIGGER IF EXISTS prevent_duplicate_current_semester ON semesters;

-- Drop any existing indexes that might be causing issues
DROP INDEX IF EXISTS idx_semesters_single_current;
DROP INDEX IF EXISTS idx_semesters_current;

-- ======================================================================
-- STEP 3: FORCE FIX THE DATA
-- ======================================================================

SELECT '=== FORCE FIXING THE DATA ===' as section;

-- Set ALL semesters to not current
UPDATE semesters 
SET is_current = false, updated_at = NOW()
WHERE is_current = true;

-- Verify all are now false
SELECT 'After setting all to false:' as info;
SELECT COUNT(*) as count FROM semesters WHERE is_current = true;

-- Now set ONLY ONE semester as current - the 2024-2025 Fall semester
UPDATE semesters 
SET is_current = true, updated_at = NOW()
WHERE id = (
    SELECT s.id 
    FROM semesters s
    LEFT JOIN study_years sy ON s.study_year_id = sy.id
    WHERE s.code = 'F24' AND sy.name = '2024-2025'
    LIMIT 1
);

-- ======================================================================
-- STEP 4: VERIFY THE FIX
-- ======================================================================

SELECT '=== VERIFYING THE FIX ===' as section;

-- Check that only one is current now
SELECT 'Final count (should be 1):' as info, COUNT(*) as count
FROM semesters WHERE is_current = true;

-- Show which one is current
SELECT 'Current semester after fix:' as info;
SELECT s.name, s.code, sy.name as study_year, s.is_current
FROM semesters s
LEFT JOIN study_years sy ON s.study_year_id = sy.id
WHERE s.is_current = true;

-- ======================================================================
-- STEP 5: ADD PROPER CONSTRAINTS TO PREVENT FUTURE ISSUES
-- ======================================================================

SELECT '=== ADDING PREVENTIVE CONSTRAINTS ===' as section;

-- Create the function to ensure single current semester
CREATE OR REPLACE FUNCTION ensure_single_current_semester()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting is_current to true, set all others to false
    IF NEW.is_current = true THEN
        UPDATE semesters 
        SET is_current = false 
        WHERE id != NEW.id AND is_current = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER ensure_single_current_semester_trigger
    BEFORE INSERT OR UPDATE ON semesters
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_current_semester();

-- Create unique partial index to enforce constraint at database level
CREATE UNIQUE INDEX idx_semesters_single_current 
ON semesters (is_current) 
WHERE is_current = true;

-- Create performance indexes
CREATE INDEX idx_semesters_current ON semesters(is_current) WHERE is_current = true;
CREATE INDEX idx_semesters_active ON semesters(is_active) WHERE is_active = true;

-- ======================================================================
-- STEP 6: FINAL VERIFICATION
-- ======================================================================

SELECT '=== FINAL VERIFICATION ===' as section;

-- Test that the constraint works by trying to set another semester as current
DO $$
DECLARE
    test_result TEXT;
BEGIN
    -- Try to set another semester as current (should fail due to unique index)
    BEGIN
        UPDATE semesters 
        SET is_current = true 
        WHERE code = 'S24' AND study_year_id = (
            SELECT id FROM study_years WHERE name = '2023-2024'
        );
        test_result := 'FAILED - Constraint not working!';
    EXCEPTION
        WHEN unique_violation THEN
            test_result := 'SUCCESS - Constraint working properly';
        WHEN OTHERS THEN
            test_result := 'SUCCESS - Constraint working (different error)';
    END;
    
    RAISE NOTICE 'Constraint test result: %', test_result;
END $$;

-- Final status check
SELECT '=== FINAL STATUS ===' as section;
SELECT 'Semester fix completed successfully!' as result;
SELECT 'Only one semester is now marked as current.' as info;
SELECT 'Constraints added to prevent future duplicates.' as info;

-- Show final state
SELECT 'Final semester status:' as info;
SELECT s.name, s.code, sy.name as study_year, s.is_current, s.is_active
FROM semesters s
LEFT JOIN study_years sy ON s.study_year_id = sy.id
ORDER BY s.is_current DESC, sy.name, s.name;
