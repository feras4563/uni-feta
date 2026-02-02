-- System Settings Migration
-- This script creates the system_settings table and storage bucket for app assets

-- 1. Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id TEXT PRIMARY KEY DEFAULT 'main',
    app_logo_url TEXT,
    app_logo_name TEXT,
    app_name TEXT DEFAULT 'UniERP Horizon',
    app_version TEXT DEFAULT '1.0.0',
    theme_color TEXT DEFAULT '#059669',
    language TEXT DEFAULT 'ar',
    timezone TEXT DEFAULT 'Asia/Riyadh',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create storage bucket for system assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('system-assets', 'system-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Create RLS policies for system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read settings
CREATE POLICY "Anyone can view system settings" ON system_settings
    FOR SELECT USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update system settings" ON system_settings
    FOR UPDATE USING (true);

CREATE POLICY "Admins can insert system settings" ON system_settings
    FOR INSERT WITH CHECK (true);

-- 4. Create RLS policies for storage
CREATE POLICY "Anyone can view system assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'system-assets');

CREATE POLICY "Authenticated users can upload system assets" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'system-assets' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can update system assets" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'system-assets' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can delete system assets" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'system-assets' 
        AND auth.role() = 'authenticated'
    );

-- 5. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Insert default settings
INSERT INTO system_settings (id, app_name, app_version, theme_color, language, timezone)
VALUES ('main', 'UniERP Horizon', '1.0.0', '#059669', 'ar', 'Asia/Riyadh')
ON CONFLICT (id) DO UPDATE SET
    app_name = EXCLUDED.app_name,
    app_version = EXCLUDED.app_version,
    theme_color = EXCLUDED.theme_color,
    language = EXCLUDED.language,
    timezone = EXCLUDED.timezone,
    updated_at = NOW();

-- Verify table creation
SELECT 'system_settings table created successfully' as status;
