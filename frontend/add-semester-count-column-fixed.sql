-- Add semester_count column to departments table (Fixed version)
-- This fixes the "Could not find the 'semester_count' column" error

-- Add semester_count column to departments table
ALTER TABLE departments ADD COLUMN IF NOT EXISTS semester_count INTEGER DEFAULT 2;

-- Drop existing constraint if it exists, then add new one
DO $$
BEGIN
    -- Drop constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_semester_count_positive' 
        AND table_name = 'departments'
    ) THEN
        ALTER TABLE departments DROP CONSTRAINT check_semester_count_positive;
    END IF;
    
    -- Add the constraint
    ALTER TABLE departments ADD CONSTRAINT check_semester_count_positive 
        CHECK (semester_count > 0 AND semester_count <= 10);
END $$;

-- Update existing departments to have default semester count of 2
UPDATE departments SET semester_count = 2 WHERE semester_count IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_departments_semester_count ON departments(semester_count);

-- Verify the changes
SELECT 'Semester count column added to departments table successfully' as status;

-- Show the updated table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'departments' AND column_name = 'semester_count';

-- Show current departments with their semester counts
SELECT 
    name,
    semester_count,
    is_active
FROM departments
ORDER BY name;
