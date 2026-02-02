-- Add PDF attachment fields to subjects table
ALTER TABLE subjects 
ADD COLUMN IF NOT EXISTS pdf_file_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_file_name TEXT,
ADD COLUMN IF NOT EXISTS pdf_file_size INTEGER;
