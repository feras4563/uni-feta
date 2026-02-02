-- Comprehensive fix for duplicate current academic data
-- This script fixes both study years and semesters to ensure only one current entry each

-- ======================================================================
-- 1. FIX STUDY YEARS - DUPLICATE CURRENT YEAR ISSUE
-- ======================================================================

SELECT '=== FIXING STUDY YEARS ===' as section;

-- Check current state of study years
SELECT 'Current state of study_years table:' as info;
SELECT id, name, is_current, is_active, description 
FROM study_years 
ORDER BY start_date DESC;

-- Check how many years are marked as current
SELECT 'Number of years marked as current:' as info;
SELECT COUNT(*) as current_years_count 
FROM study_years 
WHERE is_current = true;

-- Fix: Set all years to not current first
UPDATE study_years 
SET is_current = false 
WHERE is_current = true;

-- Then set only the most recent active year as current
UPDATE study_years 
SET is_current = true 
WHERE id = (
    SELECT id 
    FROM study_years 
    WHERE is_active = true 
    ORDER BY start_date DESC 
    LIMIT 1
);

-- Verify study years fix
SELECT 'After study years fix:' as info;
SELECT id, name, is_current, is_active, description 
FROM study_years 
ORDER BY start_date DESC;

SELECT 'Study years verification - should be 1:' as info;
SELECT COUNT(*) as current_years_count 
FROM study_years 
WHERE is_current = true;

-- ======================================================================
-- 2. FIX SEMESTERS - DUPLICATE CURRENT SEMESTER ISSUE
-- ======================================================================

SELECT '=== FIXING SEMESTERS ===' as section;

-- Check current state of semesters
SELECT 'Current state of semesters table:' as info;
SELECT s.id, s.name, s.code, sy.name as study_year, s.is_current, s.is_active, s.description 
FROM semesters s
LEFT JOIN study_years sy ON s.study_year_id = sy.id
ORDER BY s.start_date DESC;

-- Check how many semesters are marked as current
SELECT 'Number of semesters marked as current:' as info;
SELECT COUNT(*) as current_semesters_count 
FROM semesters 
WHERE is_current = true;

-- Fix: Set all semesters to not current first
UPDATE semesters 
SET is_current = false 
WHERE is_current = true;

-- Then set only the most recent active semester as current
UPDATE semesters 
SET is_current = true 
WHERE id = (
    SELECT s.id 
    FROM semesters s
    LEFT JOIN study_years sy ON s.study_year_id = sy.id
    WHERE s.is_active = true 
    ORDER BY sy.start_date DESC, s.start_date DESC
    LIMIT 1
);

-- Verify semesters fix
SELECT 'After semesters fix:' as info;
SELECT s.id, s.name, s.code, sy.name as study_year, s.is_current, s.is_active, s.description 
FROM semesters s
LEFT JOIN study_years sy ON s.study_year_id = sy.id
ORDER BY s.start_date DESC;

SELECT 'Semesters verification - should be 1:' as info;
SELECT COUNT(*) as current_semesters_count 
FROM semesters 
WHERE is_current = true;

-- ======================================================================
-- 3. CREATE PREVENTIVE MEASURES
-- ======================================================================

SELECT '=== CREATING PREVENTIVE MEASURES ===' as section;

-- Create function to ensure single current study year
CREATE OR REPLACE FUNCTION ensure_single_current_study_year()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting is_current to true, set all others to false
    IF NEW.is_current = true THEN
        UPDATE study_years 
        SET is_current = false 
        WHERE id != NEW.id AND is_current = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to ensure single current semester
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

-- Create triggers for study years
DROP TRIGGER IF EXISTS ensure_single_current_study_year_trigger ON study_years;
CREATE TRIGGER ensure_single_current_study_year_trigger
    BEFORE INSERT OR UPDATE ON study_years
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_current_study_year();

-- Create triggers for semesters
DROP TRIGGER IF EXISTS ensure_single_current_semester_trigger ON semesters;
CREATE TRIGGER ensure_single_current_semester_trigger
    BEFORE INSERT OR UPDATE ON semesters
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_current_semester();

-- Create unique partial indexes to enforce constraints at database level
CREATE UNIQUE INDEX IF NOT EXISTS idx_study_years_single_current 
ON study_years (is_current) 
WHERE is_current = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_semesters_single_current 
ON semesters (is_current) 
WHERE is_current = true;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_study_years_current ON study_years(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_study_years_active ON study_years(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_semesters_current ON semesters(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_semesters_active ON semesters(is_active) WHERE is_active = true;

-- ======================================================================
-- 4. FINAL VERIFICATION
-- ======================================================================

SELECT '=== FINAL VERIFICATION ===' as section;

SELECT 'Current academic year:' as info;
SELECT name, description FROM study_years WHERE is_current = true;

SELECT 'Current semester:' as info;
SELECT s.name, sy.name as study_year 
FROM semesters s
LEFT JOIN study_years sy ON s.study_year_id = sy.id
WHERE s.is_current = true;

SELECT 'Fix completed successfully!' as result;
SELECT 'Both study years and semesters now have proper single current entries.' as info;
SELECT 'Triggers and constraints created to prevent future duplicates.' as info;
