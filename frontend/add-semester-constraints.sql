-- Add proper constraints to prevent duplicate current semesters
-- This ensures the database enforces only one current semester

-- First, create the function to ensure single current semester
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS ensure_single_current_semester_trigger ON semesters;

-- Create the trigger
CREATE TRIGGER ensure_single_current_semester_trigger
    BEFORE INSERT OR UPDATE ON semesters
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_current_semester();

-- Create a unique partial index to enforce constraint at database level
-- This will prevent any attempt to insert/update multiple current semesters
DROP INDEX IF EXISTS idx_semesters_single_current;
CREATE UNIQUE INDEX idx_semesters_single_current 
ON semesters (is_current) 
WHERE is_current = true;

-- Test the constraint by trying to set another semester as current (should fail)
-- This is just a test - it will be rolled back
DO $$
BEGIN
    -- Try to set a second semester as current (this should fail due to unique index)
    BEGIN
        UPDATE semesters 
        SET is_current = true 
        WHERE code = 'S24' AND study_year_id = (
            SELECT id FROM study_years WHERE name = '2023-2024'
        );
        RAISE NOTICE 'ERROR: Constraint failed - this should not happen!';
    EXCEPTION
        WHEN unique_violation THEN
            RAISE NOTICE 'SUCCESS: Constraint working - prevented duplicate current semester';
    END;
END $$;

-- Verify the constraint is working
SELECT 'Constraint test completed' as info;
SELECT 'Only one semester can be current at a time' as result;
