-- Migration: Allow teachers to be associated with multiple departments
-- This creates a many-to-many relationship between teachers and departments

-- 1. Create the junction table for teacher-department relationships
CREATE TABLE IF NOT EXISTS teacher_departments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    
    -- Additional metadata for the relationship
    is_primary_department BOOLEAN DEFAULT false, -- Primary department for this teacher
    is_active BOOLEAN DEFAULT true,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate relationships
    UNIQUE(teacher_id, department_id)
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teacher_departments_teacher_id ON teacher_departments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_departments_department_id ON teacher_departments(department_id);
CREATE INDEX IF NOT EXISTS idx_teacher_departments_primary ON teacher_departments(teacher_id, is_primary_department);

-- 3. Enable RLS (Row Level Security)
ALTER TABLE teacher_departments ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can view teacher-department relationships" ON teacher_departments FOR SELECT USING (true);

CREATE POLICY "Managers can manage teacher-department relationships" ON teacher_departments FOR ALL USING (
    EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'manager')
);

CREATE POLICY "Staff can manage teacher-department relationships" ON teacher_departments FOR ALL USING (
    EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'staff')
);

-- 5. Migrate existing data from teachers.department_id to the new junction table
INSERT INTO teacher_departments (teacher_id, department_id, is_primary_department, is_active)
SELECT 
    id as teacher_id,
    department_id,
    true as is_primary_department, -- Mark existing department as primary
    true as is_active
FROM teachers 
WHERE department_id IS NOT NULL;

-- 6. Create a view for teachers with their departments
CREATE OR REPLACE VIEW teachers_with_departments AS
SELECT 
    t.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', td.id,
                'department_id', td.department_id,
                'department_name', d.name,
                'department_name_en', d.name_en,
                'is_primary_department', td.is_primary_department,
                'is_active', td.is_active,
                'start_date', td.start_date,
                'end_date', td.end_date
            ) ORDER BY td.is_primary_department DESC, d.name
        ) FILTER (WHERE td.id IS NOT NULL),
        '[]'::json
    ) as departments
FROM teachers t
LEFT JOIN teacher_departments td ON t.id = td.teacher_id AND td.is_active = true
LEFT JOIN departments d ON td.department_id = d.id
GROUP BY t.id;

-- 7. Grant permissions on the view
GRANT SELECT ON teachers_with_departments TO authenticated;

-- 8. Add comment for documentation
COMMENT ON TABLE teacher_departments IS 'Junction table for many-to-many relationship between teachers and departments';
COMMENT ON VIEW teachers_with_departments IS 'View that provides teachers with their associated departments in JSON format';


