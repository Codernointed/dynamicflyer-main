-- Dynamic Flyer Platform - Initial Database Schema
-- Version 2.0 - Multi-tenant SaaS Platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
-- Store user profile information and metadata
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Subscription and limits
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    templates_limit INTEGER DEFAULT 5, -- Free tier gets 5 templates
    monthly_exports INTEGER DEFAULT 0, -- Track monthly export usage
    monthly_exports_limit INTEGER DEFAULT 100 -- Free tier gets 100 exports/month
);

-- =====================================================
-- TEMPLATES TABLE  
-- =====================================================
-- Store flyer templates created by users
CREATE TABLE public.templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Template metadata
    name TEXT NOT NULL,
    description TEXT,
    background_url TEXT NOT NULL, -- URL to background image in storage
    thumbnail_url TEXT, -- Generated thumbnail for grid view
    
    -- Template configuration
    frames JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of frame objects
    canvas_width INTEGER NOT NULL DEFAULT 1080,
    canvas_height INTEGER NOT NULL DEFAULT 1080,
    
    -- Analytics and usage
    view_count INTEGER DEFAULT 0,
    generation_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TEMPLATE GENERATIONS TABLE (For Analytics)
-- =====================================================
-- Track when public users generate flyers from templates
CREATE TABLE public.template_generations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE NOT NULL,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_generations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Templates policies
CREATE POLICY "Users can view own templates" ON public.templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates" ON public.templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.templates
    FOR DELETE USING (auth.uid() = user_id);

-- Public can view public templates (for the public generator)
CREATE POLICY "Anyone can view public templates" ON public.templates
    FOR SELECT USING (is_public = true);

-- Template generations policies (analytics)
CREATE POLICY "Users can view generations for their templates" ON public.template_generations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.templates 
            WHERE templates.id = template_generations.template_id 
            AND templates.user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can insert template generations" ON public.template_generations
    FOR INSERT WITH CHECK (true); -- Allow public tracking

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON public.templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment view/generation counts
CREATE OR REPLACE FUNCTION public.increment_template_view(template_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.templates 
    SET view_count = view_count + 1
    WHERE id = template_uuid AND is_public = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_template_generation(template_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.templates 
    SET generation_count = generation_count + 1
    WHERE id = template_uuid AND is_public = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for common queries
CREATE INDEX idx_templates_user_id ON public.templates(user_id);
CREATE INDEX idx_templates_public ON public.templates(is_public) WHERE is_public = true;
CREATE INDEX idx_templates_created_at ON public.templates(created_at DESC);
CREATE INDEX idx_template_generations_template_id ON public.template_generations(template_id);
CREATE INDEX idx_template_generations_created_at ON public.template_generations(created_at DESC);

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('template-backgrounds', 'template-backgrounds', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('user-uploads', 'user-uploads', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-flyers', 'generated-flyers', true);

-- Storage policies for template backgrounds (public read, authenticated write)
CREATE POLICY "Template backgrounds are publicly viewable" ON storage.objects
    FOR SELECT USING (bucket_id = 'template-backgrounds');

CREATE POLICY "Users can upload template backgrounds" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'template-backgrounds' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update own template backgrounds" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'template-backgrounds' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policies for user uploads (private)
CREATE POLICY "Users can view own uploads" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'user-uploads' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can upload own files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'user-uploads' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policies for generated flyers (public read, anyone can insert)
CREATE POLICY "Generated flyers are publicly viewable" ON storage.objects
    FOR SELECT USING (bucket_id = 'generated-flyers');

CREATE POLICY "Anyone can insert generated flyers" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'generated-flyers'); 