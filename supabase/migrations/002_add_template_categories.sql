-- Add template categories and improve template organization
-- Version 2.1 - Template Categories & Advanced Search

-- Add template_type column to templates table
ALTER TABLE public.templates 
ADD COLUMN template_type TEXT DEFAULT 'flyer' 
CHECK (template_type IN ('flyer', 'certificate', 'brochure', 'business_card', 'invitation', 'social_media', 'marketing', 'other'));

-- Add tags column for better categorization
ALTER TABLE public.templates 
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Add search_vector column for full-text search
ALTER TABLE public.templates 
ADD COLUMN search_vector tsvector 
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', array_to_string(coalesce(tags, '{}'), ' ')), 'C')
) STORED;

-- Create indexes for better performance
CREATE INDEX idx_templates_type ON public.templates(template_type);
CREATE INDEX idx_templates_tags ON public.templates USING GIN(tags);
CREATE INDEX idx_templates_search ON public.templates USING GIN(search_vector);

-- Create a function to search templates
CREATE OR REPLACE FUNCTION search_templates(
  search_query TEXT,
  template_type_filter TEXT DEFAULT NULL,
  user_id_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  description TEXT,
  background_url TEXT,
  thumbnail_url TEXT,
  template_type TEXT,
  tags TEXT[],
  view_count INTEGER,
  generation_count INTEGER,
  is_public BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.user_id,
    t.name,
    t.description,
    t.background_url,
    t.thumbnail_url,
    t.template_type,
    t.tags,
    t.view_count,
    t.generation_count,
    t.is_public,
    t.created_at,
    t.updated_at,
    ts_rank(t.search_vector, plainto_tsquery('english', search_query)) as similarity
  FROM public.templates t
  WHERE 
    (search_query IS NULL OR search_query = '' OR t.search_vector @@ plainto_tsquery('english', search_query))
    AND (template_type_filter IS NULL OR t.template_type = template_type_filter)
    AND (user_id_filter IS NULL OR t.user_id = user_id_filter)
    AND t.is_public = true
  ORDER BY similarity DESC NULLS LAST, t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get template statistics by type
CREATE OR REPLACE FUNCTION get_template_stats_by_type(user_id_filter UUID DEFAULT NULL)
RETURNS TABLE (
  template_type TEXT,
  count BIGINT,
  total_views BIGINT,
  total_generations BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.template_type,
    COUNT(*) as count,
    SUM(t.view_count) as total_views,
    SUM(t.generation_count) as total_generations
  FROM public.templates t
  WHERE (user_id_filter IS NULL OR t.user_id = user_id_filter)
  GROUP BY t.template_type
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get popular tags
CREATE OR REPLACE FUNCTION get_popular_tags(limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  tag TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest(t.tags) as tag,
    COUNT(*) as count
  FROM public.templates t
  WHERE t.is_public = true
  GROUP BY tag
  ORDER BY count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing templates to have a default type
UPDATE public.templates 
SET template_type = 'flyer' 
WHERE template_type IS NULL;

-- Add some default tags to existing templates based on their names
UPDATE public.templates 
SET tags = ARRAY['flyer', 'template']
WHERE tags IS NULL OR array_length(tags, 1) IS NULL; 