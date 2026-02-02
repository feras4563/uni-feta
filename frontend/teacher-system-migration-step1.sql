-- ============================================================================
-- TEACHER SYSTEM DATABASE MIGRATION - STEP 1
-- Add teacher role to enum (must be run separately first)
-- Run this SQL in your Supabase SQL Editor FIRST
-- ============================================================================

-- 1. Add teacher role to existing user_role enum
DO $$ BEGIN
    -- Add teacher role if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'teacher' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE 'teacher';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Verify the enum was added
SELECT 'Teacher role added successfully!' as status;
SELECT enumlabel as available_roles FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumlabel;
