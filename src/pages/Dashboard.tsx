/**
 * Dashboard Page Component
 * Main dashboard page with proper session persistence and data management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Grid3X3, LayoutList, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { Template } from '@/integrations/supabase/types';
import { 
  getUserTemplates,
  searchTemplates,
  deleteTemplate as apiDeleteTemplate,
  createTemplate,
  getPopularTags
} from '@/lib/supabase';
import TemplateGrid from '@/components/dashboard/TemplateGrid';
import { toast } from 'sonner';

type ViewMode = 'grid' | 'list';

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, initializing } = useAuth();
  
  // Data state with persistence
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [popularTags, setPopularTags] = useState<Array<{tag: string, count: number}>>([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Refs for data persistence and deduplication
  const dataLoadedRef = useRef(false);
  const lastLoadTimeRef = useRef<number>(0);
  const isLoadingRef = useRef(false);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Load initial data with caching and deduplication
   */
  const loadInitialData = useCallback(async (forceReload = false) => {
    if (!user || !profile) {
      console.log('🔄 No user/profile, skipping data load');
      return;
    }

    // Prevent multiple concurrent loads
    if (isLoadingRef.current && !forceReload) {
      console.log('⏳ Data loading already in progress, skipping...');
      return;
    }

    // Check if we recently loaded data (within 30 seconds) unless forced
    const now = Date.now();
    const timeSinceLastLoad = now - lastLoadTimeRef.current;
    if (dataLoadedRef.current && timeSinceLastLoad < 30000 && !forceReload) {
      console.log('📊 Using cached data (loaded', Math.round(timeSinceLastLoad / 1000), 'seconds ago)');
      setLoading(false);
      return;
    }

    isLoadingRef.current = true;

    try {
      console.log('📊 Loading dashboard data...');
      setLoading(true);

      // Load templates and popular tags in parallel
      const [templatesData, tagsData] = await Promise.all([
        getUserTemplates().catch(error => {
          console.error('Failed to load templates:', error);
          return [];
        }),
        getPopularTags(10).catch(error => {
          console.error('Failed to load tags:', error);
          return [];
        })
      ]);

      if (isMountedRef.current) {
        setTemplates(templatesData);
        setPopularTags(tagsData);
        dataLoadedRef.current = true;
        lastLoadTimeRef.current = now;
        console.log('✅ Dashboard data loaded:', templatesData.length, 'templates');
      }
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      if (isMountedRef.current) {
        toast.error('Failed to load dashboard data. Please try refreshing.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      isLoadingRef.current = false;
    }
  }, [user, profile]);

  /**
   * Handle tab focus/visibility changes
   */
  const handleFocusOrVisible = useCallback(() => {
    if (user && profile && dataLoadedRef.current) {
      console.log('📊 Dashboard: Tab became visible/focused, checking if refresh needed...');
      
      // Only refresh if data is older than 2 minutes or templates are empty
      const timeSinceLastLoad = Date.now() - lastLoadTimeRef.current;
      const shouldRefresh = timeSinceLastLoad > 120000 || templates.length === 0;
      
      if (shouldRefresh) {
        console.log('🔄 Refreshing dashboard data after tab focus');
        loadInitialData(true);
      }
    }
  }, [user, profile, templates.length, loadInitialData]);

  /**
   * Set up tab visibility and focus listeners
   */
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleFocusOrVisible();
      }
    };

    const onFocus = () => {
      handleFocusOrVisible();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [handleFocusOrVisible]);

  /**
   * Load initial data when user/profile changes
   */
  useEffect(() => {
    if (!initializing && user && profile) {
      loadInitialData();
    }
  }, [user, profile, initializing, loadInitialData]);

  /**
   * Filter templates based on search and category
   */
  useEffect(() => {
    let filtered = [...templates];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => 
        template.template_type === selectedCategory ||
        (selectedCategory === 'flyers' && template.template_type === 'flyer')
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(template =>
        template.name?.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query) ||
        template.tags?.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory]);

  /**
   * Handle template creation
   */
  const handleCreateTemplate = useCallback(async () => {
    if (!user) {
      toast.error('Please sign in to create templates');
      return;
    }

    try {
      const newTemplate = await createTemplate({
        name: 'Untitled Template',
        description: 'A new template',
        template_type: 'flyer',
        is_public: false,
        frames: [],
        user_id: user.id,
      });

      // Update local state immediately
      setTemplates(prev => [newTemplate, ...prev]);
      
      // Navigate to editor
      navigate(`/dashboard/editor/${newTemplate.id}`);
      toast.success('Template created successfully!');
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template. Please try again.');
    }
  }, [user, navigate]);

  /**
   * Handle template editing
   */
  const handleEditTemplate = useCallback((template: Template) => {
    navigate(`/dashboard/editor/${template.id}`);
  }, [navigate]);

  /**
   * Handle template deletion
   */
  const handleDeleteTemplate = useCallback(async (template: Template) => {
    try {
      await apiDeleteTemplate(template.id);
      
      // Update local state immediately
      setTemplates(prev => prev.filter(t => t.id !== template.id));
      toast.success('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  }, []);

  /**
   * Handle template duplication
   */
  const handleDuplicateTemplate = useCallback(async (template: Template) => {
    if (!user) {
      toast.error('Please sign in to duplicate templates');
      return;
    }

    try {
      const duplicatedTemplate = await createTemplate({
        name: `${template.name} (Copy)`,
        description: template.description,
        template_type: template.template_type,
        is_public: false,
        frames: template.frames,
        tags: template.tags,
        background_url: template.background_url,
        user_id: user.id,
      });

      // Update local state immediately
      setTemplates(prev => [duplicatedTemplate, ...prev]);
      toast.success('Template duplicated successfully!');
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate template');
    }
  }, [user]);

  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
        <p className="text-gray-600 mb-6">You need to be signed in to access the dashboard.</p>
        <Button onClick={() => navigate('/login')}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-900"
          >
            <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Dashboard
            </span>
          </motion.h1>
          <p className="text-gray-600">Manage your templates and designs</p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <Button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            variant="outline"
            size="sm"
          >
            {viewMode === 'grid' ? <LayoutList className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
          </Button>
          
          <Button 
            onClick={handleCreateTemplate}
            className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white border-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Templates</SelectItem>
            <SelectItem value="flyers">Flyers</SelectItem>
            <SelectItem value="certificates">Certificates</SelectItem>
            <SelectItem value="brochures">Brochures</SelectItem>
            <SelectItem value="business-cards">Business Cards</SelectItem>
            <SelectItem value="invitations">Invitations</SelectItem>
            <SelectItem value="social">Social Media</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Popular Tags */}
      {popularTags.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center gap-2"
        >
          <span className="text-sm font-medium text-gray-700">Popular:</span>
          {popularTags.slice(0, 8).map((tag) => (
            <Badge
              key={tag.tag}
              variant="secondary"
              className="cursor-pointer hover:bg-amber-100 hover:text-amber-700"
              onClick={() => setSearchQuery(tag.tag)}
            >
              {tag.tag}
            </Badge>
          ))}
        </motion.div>
      )}

      {/* Templates Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <TemplateGrid
          templates={filteredTemplates}
          loading={loading}
          viewMode={viewMode}
          onCreateNew={handleCreateTemplate}
          onEditTemplate={handleEditTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          onDuplicateTemplate={handleDuplicateTemplate}
        />
      </motion.div>

      {/* Stats */}
      {!loading && templates.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-gray-500"
        >
          Showing {filteredTemplates.length} of {templates.length} templates
        </motion.div>
      )}
    </div>
  );
}
