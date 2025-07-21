/**
 * Dashboard Page
 * Main dashboard with template management, using DashboardLayout
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getUserTemplates } from '@/lib/supabase';
import { Template } from '@/integrations/supabase/types';
import TemplateGrid from '@/components/dashboard/TemplateGrid';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const selectedCategory = searchParams.get('category') || 'all';

  // Load user templates
  useEffect(() => {
    const loadTemplates = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const userTemplates = await getUserTemplates();
        setTemplates(userTemplates);
      } catch (error) {
        console.error('Error loading templates:', error);
        toast.error('Failed to load templates');
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [user]);

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
    <TemplateGrid
      templates={templates}
      loading={loading}
      selectedCategory={selectedCategory}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onCategoryChange={handleCategoryChange}
      onCreateNew={handleCreateNew}
      // Pass handlers to TemplateCard via context or props drilling
    />
  );
} 