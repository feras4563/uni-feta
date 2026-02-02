-- Create storage bucket for subject PDF files
INSERT INTO storage.buckets (id, name, public)
VALUES ('subject-files', 'subject-files', true);

-- Create storage policies for subject files
CREATE POLICY "Users can view subject files" ON storage.objects FOR SELECT USING (bucket_id = 'subject-files');
CREATE POLICY "Managers can upload subject files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'subject-files' AND
  EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'manager')
);
CREATE POLICY "Managers can update subject files" ON storage.objects FOR UPDATE USING (
  bucket_id = 'subject-files' AND
  EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'manager')
);
CREATE POLICY "Managers can delete subject files" ON storage.objects FOR DELETE USING (
  bucket_id = 'subject-files' AND
  EXISTS (SELECT 1 FROM app_users WHERE auth_user_id = auth.uid() AND role = 'manager')
);



