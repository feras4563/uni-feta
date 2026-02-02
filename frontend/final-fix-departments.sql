-- FINAL FIX: Clean orphaned data and fix foreign keys
-- This will solve the department display issue permanently

-- Step 1: Remove ALL orphaned data
DELETE FROM subject_departments 
WHERE subject_id NOT IN (SELECT id FROM subjects);

-- Step 2: Remove any department references that don't exist
DELETE FROM subject_departments 
WHERE department_id NOT IN (SELECT id FROM departments);

-- Step 3: Add foreign keys (should work now)
ALTER TABLE subject_departments DROP CONSTRAINT IF EXISTS fk_subject_departments_subject_id;
ALTER TABLE subject_departments DROP CONSTRAINT IF EXISTS fk_subject_departments_department_id;

ALTER TABLE subject_departments 
ADD CONSTRAINT fk_subject_departments_subject_id 
FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;

ALTER TABLE subject_departments 
ADD CONSTRAINT fk_subject_departments_department_id 
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE;

-- Step 4: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Step 5: Test that it works
SELECT 
    sd.id,
    s.name as subject_name,
    d.name as department_name,
    sd.is_primary_department
FROM subject_departments sd
JOIN subjects s ON s.id = sd.subject_id
JOIN departments d ON d.id = sd.department_id
WHERE sd.is_active = true
LIMIT 3;

SELECT 'SUCCESS: Foreign keys fixed and relationships working!' as result;
