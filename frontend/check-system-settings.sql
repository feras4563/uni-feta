-- Check System Settings Table Structure
-- Run this to see what's currently in your database

-- 1. Check if the table exists
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'system_settings';

-- 2. If table exists, show its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'system_settings'
ORDER BY ordinal_position;

-- 3. Check if there's any data
SELECT COUNT(*) as row_count FROM system_settings;

-- 4. Show any existing data
SELECT * FROM system_settings;

-- 5. Check storage buckets
SELECT id, name, public FROM storage.buckets WHERE id = 'system-assets';
