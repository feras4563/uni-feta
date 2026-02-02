-- ==============================================
-- FIX SUBJECTS TABLE ID CONSTRAINT
-- This fixes the null value in column "id" error
-- ==============================================

-- Check current subjects table structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'subjects' 
ORDER BY ordinal_position;

-- Fix the subjects table ID column
ALTER TABLE subjects 
ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- If the id column doesn't exist or is not properly set up, recreate it
DO $$
BEGIN
    -- Check if id column exists and has proper default
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subjects' 
        AND column_name = 'id' 
        AND column_default IS NOT NULL
    ) THEN
        -- Drop and recreate the id column with proper default
        ALTER TABLE subjects DROP COLUMN IF EXISTS id;
        ALTER TABLE subjects ADD COLUMN id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text;
        
        RAISE NOTICE 'Recreated subjects.id column with proper default';
    ELSE
        RAISE NOTICE 'subjects.id column already has proper default';
    END IF;
END $$;

-- Verify the fix
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable,
    is_identity
FROM information_schema.columns 
WHERE table_name = 'subjects' 
AND column_name = 'id';

-- Test creating a subject to verify the fix
INSERT INTO subjects (code, name, credits, cost_per_credit, total_cost, is_required, semester_number)
VALUES ('TEST001', 'Test Subject', 3, 150.00, 450.00, true, 1);

-- Clean up test record
DELETE FROM subjects WHERE code = 'TEST001';

-- ==============================================
-- SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'SUBJECTS TABLE ID CONSTRAINT FIXED!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Fixed:';
    RAISE NOTICE '✅ Added proper default value for subjects.id';
    RAISE NOTICE '✅ Tested subject creation successfully';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now create subjects without the null id error!';
    RAISE NOTICE '==============================================';
END $$;







