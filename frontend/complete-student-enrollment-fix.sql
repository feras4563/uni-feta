-- Complete fix for student_subject_enrollments table
-- Run this in Supabase SQL Editor

-- 1. Check if table exists, if not create it
CREATE TABLE IF NOT EXISTS student_subject_enrollments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    semester_id TEXT,
    department_id TEXT,
    subject_cost DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'enrolled',
    payment_status TEXT DEFAULT 'unpaid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add missing columns if they don't exist
DO $$
BEGIN
    -- Add department_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_subject_enrollments' 
        AND column_name = 'department_id'
    ) THEN
        ALTER TABLE student_subject_enrollments ADD COLUMN department_id TEXT;
    END IF;

    -- Add subject_cost column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_subject_enrollments' 
        AND column_name = 'subject_cost'
    ) THEN
        ALTER TABLE student_subject_enrollments ADD COLUMN subject_cost DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_subject_enrollments' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE student_subject_enrollments ADD COLUMN status TEXT DEFAULT 'enrolled';
    END IF;

    -- Add payment_status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'student_subject_enrollments' 
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE student_subject_enrollments ADD COLUMN payment_status TEXT DEFAULT 'unpaid';
    END IF;
END $$;

-- 3. Add foreign key constraints
DO $$
BEGIN
    -- Add student_id foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'student_subject_enrollments_student_id_fkey'
        AND table_name = 'student_subject_enrollments'
    ) THEN
        ALTER TABLE student_subject_enrollments 
        ADD CONSTRAINT student_subject_enrollments_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES students(id);
    END IF;

    -- Add subject_id foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'student_subject_enrollments_subject_id_fkey'
        AND table_name = 'student_subject_enrollments'
    ) THEN
        ALTER TABLE student_subject_enrollments 
        ADD CONSTRAINT student_subject_enrollments_subject_id_fkey 
        FOREIGN KEY (subject_id) REFERENCES subjects(id);
    END IF;

    -- Add semester_id foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'student_subject_enrollments_semester_id_fkey'
        AND table_name = 'student_subject_enrollments'
    ) THEN
        ALTER TABLE student_subject_enrollments 
        ADD CONSTRAINT student_subject_enrollments_semester_id_fkey 
        FOREIGN KEY (semester_id) REFERENCES semesters(id);
    END IF;

    -- Add department_id foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'student_subject_enrollments_department_id_fkey'
        AND table_name = 'student_subject_enrollments'
    ) THEN
        ALTER TABLE student_subject_enrollments 
        ADD CONSTRAINT student_subject_enrollments_department_id_fkey 
        FOREIGN KEY (department_id) REFERENCES departments(id);
    END IF;
END $$;

-- 4. Update existing records with department_id
UPDATE student_subject_enrollments 
SET department_id = s.department_id
FROM subjects s
WHERE student_subject_enrollments.subject_id = s.id
AND student_subject_enrollments.department_id IS NULL;

-- 5. Disable RLS for testing
ALTER TABLE student_subject_enrollments DISABLE ROW LEVEL SECURITY;

-- 6. Verify the table structure
SELECT 
    'Final table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'student_subject_enrollments'
ORDER BY ordinal_position;
