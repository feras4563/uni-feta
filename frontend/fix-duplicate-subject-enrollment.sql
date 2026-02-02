-- Fix duplicate subject enrollment by adding unique constraints
-- Run this in Supabase SQL Editor

-- ======================================================================
-- 1. ADD UNIQUE CONSTRAINT TO PREVENT DUPLICATE ENROLLMENTS
-- ======================================================================

-- First, let's clean up any existing duplicates
WITH duplicates AS (
  SELECT student_id, subject_id, semester_id, department_id, 
         ROW_NUMBER() OVER (PARTITION BY student_id, subject_id, semester_id ORDER BY created_at) as rn
  FROM student_subject_enrollments
)
DELETE FROM student_subject_enrollments 
WHERE (student_id, subject_id, semester_id) IN (
  SELECT student_id, subject_id, semester_id 
  FROM duplicates 
  WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE student_subject_enrollments 
ADD CONSTRAINT unique_student_subject_semester 
UNIQUE (student_id, subject_id, semester_id);

-- ======================================================================
-- 2. CREATE INDEX FOR BETTER PERFORMANCE
-- ======================================================================

CREATE INDEX IF NOT EXISTS idx_student_subject_enrollments_lookup 
ON student_subject_enrollments (student_id, semester_id);

-- ======================================================================
-- 3. ADD CHECK CONSTRAINT FOR VALID STATUS
-- ======================================================================

ALTER TABLE student_subject_enrollments 
ADD CONSTRAINT check_valid_status 
CHECK (status IN ('enrolled', 'completed', 'dropped', 'failed'));

ALTER TABLE student_subject_enrollments 
ADD CONSTRAINT check_valid_payment_status 
CHECK (payment_status IN ('unpaid', 'paid', 'partial', 'refunded'));

-- ======================================================================
-- 4. CREATE FUNCTION TO CHECK FOR EXISTING ENROLLMENTS
-- ======================================================================

CREATE OR REPLACE FUNCTION check_student_subject_enrollment(
  p_student_id TEXT,
  p_subject_id TEXT,
  p_semester_id TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM student_subject_enrollments 
    WHERE student_id = p_student_id 
    AND subject_id = p_subject_id 
    AND semester_id = p_semester_id
  );
END;
$$ LANGUAGE plpgsql;

-- ======================================================================
-- 5. CREATE FUNCTION TO GET ENROLLED SUBJECTS FOR A STUDENT
-- ======================================================================

CREATE OR REPLACE FUNCTION get_student_enrolled_subjects(
  p_student_id TEXT,
  p_semester_id TEXT DEFAULT NULL
) RETURNS TABLE (
  subject_id TEXT,
  subject_code TEXT,
  subject_name TEXT,
  enrollment_date TIMESTAMP WITH TIME ZONE,
  status TEXT,
  payment_status TEXT
) AS $$
BEGIN
  IF p_semester_id IS NULL THEN
    RETURN QUERY
    SELECT 
      sse.subject_id,
      s.code,
      s.name,
      sse.enrollment_date,
      sse.status,
      sse.payment_status
    FROM student_subject_enrollments sse
    JOIN subjects s ON s.id = sse.subject_id
    WHERE sse.student_id = p_student_id
    ORDER BY sse.enrollment_date DESC;
  ELSE
    RETURN QUERY
    SELECT 
      sse.subject_id,
      s.code,
      s.name,
      sse.enrollment_date,
      sse.status,
      sse.payment_status
    FROM student_subject_enrollments sse
    JOIN subjects s ON s.id = sse.subject_id
    WHERE sse.student_id = p_student_id 
    AND sse.semester_id = p_semester_id
    ORDER BY sse.enrollment_date DESC;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ======================================================================
-- 6. TEST THE FUNCTIONS
-- ======================================================================

-- Test getting enrolled subjects for a student
SELECT * FROM get_student_enrolled_subjects('ST259570');

-- Test checking if a student is enrolled in a specific subject
SELECT check_student_subject_enrollment('ST259570', 'SUB1_CS_001', (SELECT id FROM semesters LIMIT 1));

SELECT 'SUCCESS: Duplicate enrollment prevention implemented!' as result;
