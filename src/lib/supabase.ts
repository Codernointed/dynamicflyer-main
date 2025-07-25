/**
 * Supabase API Functions
 * Centralized API layer for all database and storage operations
 */

import { supabase } from "@/integrations/supabase/client";
import type { 
  Profile, 
  Template, 
  TemplateWithFrames, 
  Frame,
  TablesInsert,
  TablesUpdate 
} from "@/integrations/supabase/types";

// =====================================================
// AUTHENTICATION
// =====================================================

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string, fullName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get current session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

// =====================================================
// PROFILES
// =====================================================

/**
 * Get user profile by ID
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string, 
  updates: TablesUpdate<'profiles'>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create profile for current user if it doesn't exist
 */
export async function createProfileForUser(user: any): Promise<Profile> {
  const profileData = {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.email.split('@')[0],
    avatar_url: user.user_metadata?.avatar_url || null,
  };

  const { data, error } = await supabase
    .from('profiles')
    .insert(profileData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get current user's profile (create if doesn't exist)
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const session = await getSession();
  if (!session?.user) return null;
  
  try {
    // Try to get existing profile
    const profile = await getProfile(session.user.id);
    if (profile) return profile;
    
    // Profile doesn't exist, create it
    console.log('Profile not found, creating new profile for user:', session.user.email);
    return await createProfileForUser(session.user);
  } catch (error: any) {
    console.error('Error in getCurrentProfile:', error);
    
    // If profile doesn't exist, try to create it
    if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
      try {
        console.log('Creating profile for existing user:', session.user.email);
        return await createProfileForUser(session.user);
      } catch (createError: any) {
        console.error('Failed to create profile:', createError);
        throw createError;
      }
    }
    
    throw error;
  }
}

// =====================================================
// TEMPLATES
// =====================================================

/**
 * Get all templates for the current user
 */
export async function getUserTemplates(): Promise<Template[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Search templates with advanced filtering
 */
export async function searchTemplates(
  searchQuery?: string,
  templateType?: string,
  userId?: string
): Promise<Template[]> {
  try {
    // Try to use the database function first
    let query = supabase
      .rpc('search_templates', {
        search_query: searchQuery || null,
        template_type_filter: templateType || null,
        user_id_filter: userId || null
      });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (dbError) {
    // Fallback to client-side filtering if database function doesn't exist
    console.warn('Database search function not available, using client-side filtering');
    
    const { data: templates, error: fallbackError } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_public', true);

    if (fallbackError) throw fallbackError;
    
    return (templates || []).filter(template => {
      const matchesSearch = !searchQuery || 
        template.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = !templateType || template.template_type === templateType;
      
      return matchesSearch && matchesType;
    });
  }
}

/**
 * Get template statistics by type
 */
export async function getTemplateStatsByType(userId?: string) {
  try {
    const { data, error } = await supabase
      .rpc('get_template_stats_by_type', {
        user_id_filter: userId || null
      });

    if (error) throw error;
    return data || [];
  } catch (dbError) {
    // Fallback to client-side calculation
    console.warn('Database stats function not available, using client-side calculation');
    
    const { data: templates, error: fallbackError } = await supabase
      .from('templates')
      .select('template_type')
      .eq('user_id', userId);

    if (fallbackError) throw fallbackError;
    
    const stats = (templates || []).reduce((acc: any[], template) => {
      const existing = acc.find(stat => stat.template_type === template.template_type);
      if (existing) {
        existing.count++;
      } else {
        acc.push({
          template_type: template.template_type || 'other',
          count: 1,
          total_views: 0,
          total_generations: 0
        });
      }
      return acc;
    }, []);
    
    return stats.sort((a, b) => b.count - a.count);
  }
}

/**
 * Get popular tags
 */
export async function getPopularTags(limit: number = 20) {
  try {
    const { data, error } = await supabase
      .rpc('get_popular_tags', {
        limit_count: limit
      });

    if (error) throw error;
    return data || [];
  } catch (dbError) {
    // Fallback to client-side calculation
    console.warn('Database tags function not available, using client-side calculation');
    
    const { data: templates, error: fallbackError } = await supabase
      .from('templates')
      .select('tags')
      .eq('is_public', true);

    if (fallbackError) throw fallbackError;
    
    const tagCounts: Record<string, number> = {};
    (templates || []).forEach(template => {
      if (template.tags && Array.isArray(template.tags)) {
        template.tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}

/**
 * Get a specific template by ID (with proper permissions check)
 */
export async function getTemplate(templateId: string): Promise<TemplateWithFrames | null> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;

  // Parse the frames JSON into typed Frame objects
  const template: TemplateWithFrames = {
    ...data,
    frames: (data.frames as Frame[]) || []
  };

  return template;
}

/**
 * Get a public template by ID (for public flyer generation)
 */
export async function getPublicTemplate(templateId: string): Promise<TemplateWithFrames | null> {
  try {
    console.log('Fetching public template:', templateId);
    
    // First, check if template exists at all
    const { data: allTemplates, error: checkError } = await supabase
      .from('templates')
      .select('id, is_public')
      .eq('id', templateId);
    
    if (checkError) {
      console.error('Error checking template existence:', checkError);
      throw checkError;
    }
    
    if (!allTemplates || allTemplates.length === 0) {
      console.log('Template does not exist');
      return null;
    }
    
    const templateCheck = allTemplates[0];
    if (!templateCheck.is_public) {
      console.log('Template exists but is not public');
      // For development/testing, allow access to non-public templates
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: allowing access to non-public template');
      } else {
        return null;
      }
    }
    
    console.log('Template exists and is public, fetching full data...');
    
    // Now fetch the full template data
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) {
      console.log('Template not found after public check');
      return null;
    }

    console.log('Template found:', data);

    // Try to increment view count, but don't fail if it doesn't work
    try {
      await supabase.rpc('increment_template_view', { template_uuid: templateId });
      console.log('View count incremented');
    } catch (viewError) {
      console.warn('Failed to increment view count:', viewError);
      // Don't throw - this is not critical
    }

    const template: TemplateWithFrames = {
      ...data,
      frames: (data.frames as Frame[]) || []
    };

    console.log('Returning template with frames:', template.frames?.length || 0);
    return template;
  } catch (error) {
    console.error('Error in getPublicTemplate:', error);
    throw error;
  }
}

/**
 * Create a new template
 */
export async function createTemplate(
  templateData: TablesInsert<'templates'>
): Promise<Template> {
  const { data, error } = await supabase
    .from('templates')
    .insert(templateData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing template
 */
export async function updateTemplate(
  templateId: string,
  updates: TablesUpdate<'templates'>
): Promise<Template> {
  // Get the current user to ensure RLS policy works
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Add user_id to updates to satisfy RLS policy
  const updatesWithUserId = {
    ...updates,
    user_id: user.id
  };

  const { data, error } = await supabase
    .from('templates')
    .update(updatesWithUserId)
    .eq('id', templateId)
    .eq('user_id', user.id) // Additional check for RLS
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', templateId);

  if (error) throw error;
}

/**
 * Update template frames
 */
export async function updateTemplateFrames(
  templateId: string, 
  frames: Frame[]
): Promise<Template> {
  return updateTemplate(templateId, { frames: frames as any });
}

// =====================================================
// TEMPLATE ANALYTICS
// =====================================================

/**
 * Track a template generation (for analytics)
 */
export async function trackTemplateGeneration(templateId: string): Promise<void> {
  // Increment the generation count
  await supabase.rpc('increment_template_generation', { template_uuid: templateId });

  // Track the generation event
  const { error } = await supabase
    .from('template_generations')
    .insert({
      template_id: templateId,
      user_agent: navigator.userAgent,
      // Note: IP address will be handled by the database if needed
    });

  if (error) console.warn('Failed to track generation:', error);
}

/**
 * Get template analytics for user's templates
 */
export async function getTemplateAnalytics(templateId: string) {
  const { data: template, error: templateError } = await supabase
    .from('templates')
    .select('view_count, generation_count')
    .eq('id', templateId)
    .single();

  if (templateError) throw templateError;

  const { data: generations, error: generationsError } = await supabase
    .from('template_generations')
    .select('created_at')
    .eq('template_id', templateId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (generationsError) throw generationsError;

  return {
    viewCount: template.view_count,
    generationCount: template.generation_count,
    recentGenerations: generations || []
  };
}

// =====================================================
// FILE STORAGE
// =====================================================

/**
 * Upload a file to Supabase Storage with timeout handling
 */
export async function uploadFile(
  bucket: 'template-backgrounds' | 'user-uploads' | 'generated-flyers',
  filePath: string,
  file: File,
  options?: { cacheControl?: string; upsert?: boolean; timeoutMs?: number }
): Promise<string> {
  const timeoutMs = options?.timeoutMs || 30000; // 30 second default timeout
  
  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Upload timed out. Please try again with a smaller image.'));
    }, timeoutMs);
  });

  // Create upload promise
  const uploadPromise = supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: options?.cacheControl || '3600',
      upsert: options?.upsert || false,
    });

  try {
    // Race between upload and timeout
    const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);

    if (error) throw error;

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error: any) {
    // Enhanced error messaging
    if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
      throw new Error('Upload timed out. Please try a smaller image or check your connection.');
    } else if (error.statusCode === 413) {
      throw new Error('File is too large. Please use an image smaller than 10MB.');
    } else if (error.statusCode === 403) {
      throw new Error('Permission denied. Please check your storage policies.');
    } else if (error.statusCode === 404) {
      throw new Error('Storage bucket not found. Please contact support.');
    }
    
    throw error;
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(
  bucket: 'template-backgrounds' | 'user-uploads' | 'generated-flyers',
  filePath: string
): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) throw error;
}

/**
 * Upload template background image
 */
export async function uploadTemplateBackground(
  userId: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  
  return uploadFile('template-backgrounds', fileName, file);
}

/**
 * Upload user image for flyer generation
 */
export async function uploadUserImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `temp/${Date.now()}.${fileExt}`;
  
  return uploadFile('user-uploads', fileName, file);
}

/**
 * Generic image upload function with size optimization
 */
export async function uploadImage(
  file: File,
  bucket: 'template-backgrounds' | 'user-uploads' | 'generated-flyers'
): Promise<string> {
  // Validate file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File size must be less than 10MB');
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Please upload a valid image file (JPG, PNG, or WebP)');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  
  // Set shorter timeout for smaller files
  const timeoutMs = file.size > 5 * 1024 * 1024 ? 45000 : 20000; // 45s for large files, 20s for smaller
  
  return uploadFile(bucket, fileName, file, { timeoutMs });
}

/**
 * Upload generated flyer
 */
export async function uploadGeneratedFlyer(
  templateId: string,
  imageBlob: Blob
): Promise<string> {
  const fileName = `${templateId}/${Date.now()}.png`;
  const file = new File([imageBlob], fileName, { type: 'image/png' });
  
  return uploadFile('generated-flyers', fileName, file);
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Test Supabase connection and storage setup
 */
export async function testSupabaseConnection() {
  try {
    // Test database connection
    const { data: user } = await supabase.auth.getUser();
    const authStatus = user?.user ? 'Connected' : 'Not authenticated';
    console.log('Auth test:', authStatus);

    // Test storage by trying to access each bucket
    const requiredBuckets = ['template-backgrounds', 'user-uploads', 'generated-flyers'];
    const bucketTests: { [key: string]: boolean } = {};
    
    for (const bucketName of requiredBuckets) {
      try {
        // Try to list files in the bucket (this tests if bucket exists and is accessible)
        const { data, error } = await supabase.storage
          .from(bucketName)
          .list('', { limit: 1 });
        
        bucketTests[bucketName] = !error;
        if (error) {
          console.log(`Bucket ${bucketName}:`, error.message);
        } else {
          console.log(`Bucket ${bucketName}: ✅ Accessible`);
        }
      } catch (error: any) {
        bucketTests[bucketName] = false;
        console.log(`Bucket ${bucketName}: ❌ ${error.message}`);
      }
    }

    const workingBuckets = Object.entries(bucketTests)
      .filter(([_, works]) => works)
      .map(([name, _]) => name);
    
    const failingBuckets = Object.entries(bucketTests)
      .filter(([_, works]) => !works)
      .map(([name, _]) => name);

    const allWorking = failingBuckets.length === 0;
    
    return {
      success: allWorking,
      authStatus,
      workingBuckets,
      failingBuckets,
      message: allWorking 
        ? `✅ All storage buckets are working correctly! (${workingBuckets.length}/3)`
        : `⚠️ Issues with buckets: ${failingBuckets.join(', ')}`
    };

  } catch (error: any) {
    console.error('Connection test failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate a shareable public URL for a template
 */
export function getTemplateShareUrl(templateId: string): string {
  return `${window.location.origin}/flyer/${templateId}`;
}

/**
 * Check if user has reached their template limit
 */
export async function checkTemplateLimit(): Promise<boolean> {
  const profile = await getCurrentProfile();
  if (!profile) return false;

  const templates = await getUserTemplates();
  return templates.length >= profile.templates_limit;
}

/**
 * Check if user has reached their monthly export limit
 */
export async function checkExportLimit(): Promise<boolean> {
  const profile = await getCurrentProfile();
  if (!profile) return false;

  return profile.monthly_exports >= profile.monthly_exports_limit;
}

/**
 * Increment user's monthly export count
 */
export async function incrementExportCount(): Promise<void> {
  const session = await getSession();
  if (!session?.user) return;

  const { error } = await supabase
    .from('profiles')
    .update({ 
      monthly_exports: supabase.raw('monthly_exports + 1') 
    })
    .eq('id', session.user.id);

  if (error) console.warn('Failed to increment export count:', error);
} 