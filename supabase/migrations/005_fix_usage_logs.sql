-- Fix usage_logs table and ensure template_exported action is properly tracked

-- Make sure usage_logs table exists
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('template_created', 'template_exported', 'font_uploaded', 'api_call')),
  resource_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups on template exports
CREATE INDEX IF NOT EXISTS idx_usage_logs_template_exports 
ON usage_logs(resource_id) 
WHERE action = 'template_exported';

-- Create function to log template export
CREATE OR REPLACE FUNCTION log_template_export(
  template_id UUID,
  user_id UUID
) RETURNS VOID AS $$
BEGIN
  INSERT INTO usage_logs (user_id, action, resource_id, metadata)
  VALUES (
    user_id,
    'template_exported',
    template_id::text,
    jsonb_build_object('export_type', 'png')
  );
  
  -- Also increment the template's generation count
  UPDATE templates
  SET generation_count = generation_count + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure download_limit column exists in templates table
ALTER TABLE templates
ADD COLUMN IF NOT EXISTS download_limit INTEGER DEFAULT 200;

-- Create function to check if download limit is reached
CREATE OR REPLACE FUNCTION check_download_limit(
  template_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  download_count INTEGER;
  limit_value INTEGER;
BEGIN
  -- Get the download limit for the template
  SELECT download_limit INTO limit_value
  FROM templates
  WHERE id = template_id;
  
  -- Count the number of exports
  SELECT COUNT(*) INTO download_count
  FROM usage_logs
  WHERE resource_id = template_id::text
  AND action = 'template_exported';
  
  -- Return true if limit is reached
  RETURN download_count >= limit_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
