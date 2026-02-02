-- Simple script to create subject_titles table
CREATE TABLE IF NOT EXISTS subject_titles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_en TEXT,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subject_titles_subject_id ON subject_titles(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_titles_order ON subject_titles(subject_id, order_index);

-- Enable RLS
ALTER TABLE subject_titles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view subject titles" ON subject_titles FOR SELECT USING (true);
CREATE POLICY "Managers can manage subject titles" ON subject_titles FOR ALL USING (
  EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'manager')
);
CREATE POLICY "Staff can manage subject titles" ON subject_titles FOR ALL USING (
  EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'staff')
);



