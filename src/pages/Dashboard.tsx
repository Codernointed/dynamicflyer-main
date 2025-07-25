/**
 * Dashboard Page
 * Main dashboard with template management, using DashboardLayout
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getUserTemplates, searchTemplates, getPopularTags, getTemplateStatsByType } from '@/lib/supabase';
import { Template } from '@/integrations/supabase/types';
import TemplateGrid from '@/components/dashboard/TemplateGrid';
import TemplateSearch, { TemplateSearchFilters } from '@/components/dashboard/TemplateSearch';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [templateTypes, setTemplateTypes] = useState<string[]>([]);
  
  const [filters, setFilters] = useState<TemplateSearchFilters>({
    searchQuery: '',
    templateType: '',
    tags: [],
    sortBy: 'newest',
    viewMode: 'grid'
  });

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Load popular tags
        try {
          const tags = await getPopularTags(50);
          setAvailableTags(tags.map(tag => tag.tag));
        } catch (error) {
          console.warn('Could not load popular tags:', error);
          setAvailableTags([]);
        }
        
        // Load template types from stats
        try {
          const stats = await getTemplateStatsByType(user.id);
          setTemplateTypes(stats.map(stat => stat.template_type));
        } catch (error) {
          console.warn('Could not load template stats:', error);
          setTemplateTypes(['flyer', 'certificate', 'brochure', 'business_card', 'invitation', 'social_media', 'marketing', 'other']);
        }
        
        // Load user templates
        const userTemplates = await getUserTemplates();
        setTemplates(userTemplates);
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user]);

  // Search templates when filters change
  const searchTemplatesWithFilters = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const searchResults = await searchTemplates(
        filters.searchQuery || undefined,
        filters.templateType || undefined,
        user.id
      );
      setTemplates(searchResults);
    } catch (error) {
      console.error('Error searching templates:', error);
      toast.error('Failed to search templates');
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  useEffect(() => {
    searchTemplatesWithFilters();
  }, [searchTemplatesWithFilters]);

  const handleCategoryChange = (category: string) => {
    setSearchParams(category === 'all' ? {} : { category });
  };

  const handleCreateNew = () => {
    // TODO: Open template creation modal/flow
    navigate('/dashboard/editor/new');
  };

  const handleEditTemplate = (template: Template) => {
    navigate(`/dashboard/editor/${template.id}`);
  };

  const handleDeleteTemplate = async (template: Template) => {
    try {
      // TODO: Implement template deletion
      toast.success(`Template "${template.name}" deleted successfully`);
      // Refresh templates
      const userTemplates = await getUserTemplates();
      setTemplates(userTemplates);
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const handleDuplicateTemplate = async (template: Template) => {
    try {
      // TODO: Implement template duplication
      toast.success(`Template "${template.name}" duplicated successfully`);
    } catch (error) {
      toast.error('Failed to duplicate template');
    }
  };

  const handleViewAnalytics = (template: Template) => {
    navigate(`/dashboard/analytics?template=${template.id}`);
  };

  return (
    <div className="space-y-6">
      <TemplateSearch
        filters={filters}
        onFiltersChange={setFilters}
        availableTags={availableTags}
        templateTypes={templateTypes}
        totalResults={templates.length}
      />
      
    <TemplateGrid
      templates={templates}
      loading={loading}
        viewMode={filters.viewMode}
      onCreateNew={handleCreateNew}
        onEditTemplate={handleEditTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        onDuplicateTemplate={handleDuplicateTemplate}
        onViewAnalytics={handleViewAnalytics}
    />
    </div>
  );
} 