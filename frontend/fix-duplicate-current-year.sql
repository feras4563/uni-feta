-- Fix duplicate current year entries in study_years table
-- This script ensures only one academic year is marked as current

-- First, let's see the current state
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
-- (or you can manually specify which year should be current)
UPDATE study_years 
SET is_current = true 
WHERE id = (
    SELECT id 
    FROM study_years 
    WHERE is_active = true 
    ORDER BY start_date DESC 
    LIMIT 1
);

-- Alternative: Set a specific year as current (uncomment and modify as needed)
-- UPDATE study_years 
-- SET is_current = true 
-- WHERE name = '2024-2025';

-- Verify the fix
SELECT 'After fix - current state:' as info;
SELECT id, name, is_current, is_active, description 
FROM study_years 
ORDER BY start_date DESC;

-- Verify only one year is current
SELECT 'Verification - should be 1:' as info;
SELECT COUNT(*) as current_years_count 
FROM study_years 
WHERE is_current = true;

-- Create a function to prevent future duplicates (if not already exists)
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

-- Create trigger to automatically prevent duplicates (if not already exists)
DROP TRIGGER IF EXISTS ensure_single_current_study_year_trigger ON study_years;
CREATE TRIGGER ensure_single_current_study_year_trigger
    BEFORE INSERT OR UPDATE ON study_years
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_current_study_year();

-- Also create a unique partial index to enforce the constraint at database level
CREATE UNIQUE INDEX IF NOT EXISTS idx_study_years_single_current 
ON study_years (is_current) 
WHERE is_current = true;

SELECT 'Fix completed successfully!' as result;
SELECT 'Trigger created to prevent future duplicates.' as info;
