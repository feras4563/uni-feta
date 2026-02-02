-- ======================================================================
-- FIX ORPHANED DATA IN SUBJECT_DEPARTMENTS
-- ======================================================================
-- This fixes the foreign key error by cleaning up orphaned data

-- ======================================================================
-- 1. IDENTIFY THE PROBLEM
-- ======================================================================

-- Check for orphaned subject_departments records
SELECT 
    'Orphaned subject_departments records:' as issue,
    COUNT(*) as count
FROM subject_departments sd
WHERE NOT EXISTS (
    SELECT 1 FROM subjects s WHERE s.id = sd.subject_id
);

-- Show the specific orphaned records
SELECT 
    sd.id,
    sd.subject_id as orphaned_subject_id,
    sd.department_id,
    sd.is_primary_department,
    'Subject does not exist' as issue
FROM subject_departments sd
WHERE NOT EXISTS (
    SELECT 1 FROM subjects s WHERE s.id = sd.subject_id
)
LIMIT 10;

-- ======================================================================
-- 2. CLEAN UP ORPHANED DATA
-- ======================================================================

-- Delete orphaned subject_departments records that reference non-existent subjects
DELETE FROM subject_departments 
WHERE subject_id NOT IN (SELECT id FROM subjects);

-- Check for orphaned department references too
DELETE FROM subject_departments 
WHERE department_id NOT IN (SELECT id FROM departments);

-- ======================================================================
-- 3. VERIFY DATA CONSISTENCY
-- ======================================================================

-- Verify no orphaned records remain
SELECT 
    'Orphaned records after cleanup:' as status,
    COUNT(*) as count
FROM subject_departments sd
WHERE NOT EXISTS (
    SELECT 1 FROM subjects s WHERE s.id = sd.subject_id
)
OR NOT EXISTS (
    SELECT 1 FROM departments d WHERE d.id = sd.department_id
);

-- ======================================================================
-- 4. NOW ADD FOREIGN KEYS (SAFELY)
-- ======================================================================

-- Drop existing foreign keys if any
ALTER TABLE subject_departments DROP CONSTRAINT IF EXISTS fk_subject_departments_subject_id;
ALTER TABLE subject_departments DROP CONSTRAINT IF EXISTS fk_subject_departments_department_id;

-- Add foreign key constraints (this should work now)
ALTER TABLE subject_departments 
ADD CONSTRAINT fk_subject_departments_subject_id 
FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;

ALTER TABLE subject_departments 
ADD CONSTRAINT fk_subject_departments_department_id 
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE;

-- ======================================================================
-- 5. REFRESH SUPABASE SCHEMA CACHE
-- ======================================================================

NOTIFY pgrst, 'reload schema';

-- ======================================================================
-- 6. TEST THE FIXED RELATIONSHIPS
-- ======================================================================

-- Test that joins work now
SELECT 
    'Testing relationships:' as test,
    sd.id,
    sd.subject_id,
    s.name as subject_name,
    sd.department_id,
    d.name as department_name,
    sd.is_primary_department
FROM subject_departments sd
JOIN subjects s ON s.id = sd.subject_id
JOIN departments d ON d.id = sd.department_id
WHERE sd.is_active = true
LIMIT 5;

-- Count valid relationships
SELECT 
    'Valid relationships:' as status,
    COUNT(*) as total_relationships
FROM subject_departments sd
JOIN subjects s ON s.id = sd.subject_id
JOIN departments d ON d.id = sd.department_id
WHERE sd.is_active = true;

-- ======================================================================
-- SUCCESS MESSAGE
-- ======================================================================

SELECT 'Data cleaned and foreign keys fixed successfully!' as result;
