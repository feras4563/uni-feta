-- Quick fix: Remove the NOT NULL constraint from semester_id
-- Run this immediately to fix the error

ALTER TABLE department_semester_subjects 
ALTER COLUMN semester_id DROP NOT NULL;
