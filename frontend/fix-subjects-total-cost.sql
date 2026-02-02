-- Fix subjects table total_cost column
-- Run this in Supabase SQL Editor

-- Check if total_cost column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'subjects' 
AND column_name = 'total_cost';

-- Add total_cost column if it doesn't exist
ALTER TABLE subjects 
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0;

-- Update total_cost for existing subjects (cost_per_credit * credits)
UPDATE subjects 
SET total_cost = COALESCE(cost_per_credit, 0) * COALESCE(credits, 0)
WHERE total_cost IS NULL OR total_cost = 0;

-- Create a trigger to automatically calculate total_cost when cost_per_credit or credits change
CREATE OR REPLACE FUNCTION calculate_subject_total_cost()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_cost = COALESCE(NEW.cost_per_credit, 0) * COALESCE(NEW.credits, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_calculate_subject_total_cost ON subjects;

-- Create the trigger
CREATE TRIGGER trigger_calculate_subject_total_cost
    BEFORE INSERT OR UPDATE ON subjects
    FOR EACH ROW
    EXECUTE FUNCTION calculate_subject_total_cost();

-- Test the trigger by updating a subject
UPDATE subjects 
SET cost_per_credit = 100, credits = 3
WHERE id = (SELECT id FROM subjects LIMIT 1);

-- Verify the total_cost was calculated
SELECT id, code, name, cost_per_credit, credits, total_cost
FROM subjects 
WHERE id = (SELECT id FROM subjects LIMIT 1);

SELECT 'SUCCESS: subjects total_cost column fixed!' as result;
