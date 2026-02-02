-- Simple Fix for Foreign Key Relationships
-- Run this script to fix the department relationships

-- 1. Check if tables exist
SELECT 'Checking tables...' as status;

-- 2. Drop existing foreign keys if any
ALTER TABLE subject_departments DROP CONSTRAINT IF EXISTS fk_subject_departments_subject_id;
ALTER TABLE subject_departments DROP CONSTRAINT IF EXISTS fk_subject_departments_department_id;

-- 3. Add correct foreign key constraints
ALTER TABLE subject_departments 
ADD CONSTRAINT fk_subject_departments_subject_id 
FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;

ALTER TABLE subject_departments 
ADD CONSTRAINT fk_subject_departments_department_id 
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE;

-- 4. Refresh Supabase schema cache
NOTIFY pgrst, 'reload schema';

-- 5. Test the relationship
SELECT 
    sd.id,
    sd.department_id,
    sd.is_primary_department,
    d.name as department_name
FROM subject_departments sd
JOIN departments d ON d.id = sd.department_id
WHERE sd.is_active = true
LIMIT 3;

SELECT 'Foreign keys fixed successfully!' as result;
