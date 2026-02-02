-- Fix duplicate current semester entries in semesters table
-- This script ensures only one semester is marked as current

-- First, let's see the current state
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
-- (or you can manually specify which semester should be current)
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

-- Alternative: Set a specific semester as current (uncomment and modify as needed)
-- UPDATE semesters 
-- SET is_current = true 
-- WHERE code = 'F24' AND study_year_id = (
--     SELECT id FROM study_years WHERE name = '2024-2025'
-- );

-- Verify the fix
SELECT 'After fix - current state:' as info;
SELECT s.id, s.name, s.code, sy.name as study_year, s.is_current, s.is_active, s.description 
FROM semesters s
LEFT JOIN study_years sy ON s.study_year_id = sy.id
ORDER BY s.start_date DESC;

-- Verify only one semester is current
SELECT 'Verification - should be 1:' as info;
SELECT COUNT(*) as current_semesters_count 
FROM semesters 
WHERE is_current = true;

-- Create a function to prevent future duplicates (if not already exists)
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

-- Create trigger to automatically prevent duplicates (if not already exists)
DROP TRIGGER IF EXISTS ensure_single_current_semester_trigger ON semesters;
CREATE TRIGGER ensure_single_current_semester_trigger
    BEFORE INSERT OR UPDATE ON semesters
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_current_semester();

-- Also create a unique partial index to enforce the constraint at database level
CREATE UNIQUE INDEX IF NOT EXISTS idx_semesters_single_current 
ON semesters (is_current) 
WHERE is_current = true;

-- Create an index for better performance on current semester queries
CREATE INDEX IF NOT EXISTS idx_semesters_current ON semesters(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_semesters_active ON semesters(is_active) WHERE is_active = true;

SELECT 'Semester fix completed successfully!' as result;
SELECT 'Trigger created to prevent future duplicates.' as info;
