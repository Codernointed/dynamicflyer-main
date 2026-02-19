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

    // Navigate directly to the editor - template will be created when user uploads background
    navigate('/dashboard/editor/new');
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
    <div className="space-y-10 pb-12 p-8 md:p-12">
      {/* Dashboard Top Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <LayoutList className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Workspace</span>
          </div>
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black text-slate-900 tracking-tight"
          >
            My <span className="bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent">Templates</span>
          </motion.h1>
          <p className="mt-2 text-slate-500 font-medium">Create, manage and distribute your modular designs.</p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
            <Button
              onClick={() => setViewMode('grid')}
              variant={viewMode === 'grid' ? 'white' : 'ghost'}
              size="sm"
              className={`h-9 px-3 rounded-lg ${viewMode === 'grid' ? 'shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setViewMode('list')}
              variant={viewMode === 'list' ? 'white' : 'ghost'}
              size="sm"
              className={`h-9 px-3 rounded-lg ${viewMode === 'list' ? 'shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            onClick={handleCreateTemplate}
            className="h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white border-0 shadow-lg shadow-slate-200 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="mr-2 h-5 w-5 text-amber-400" />
            <span className="font-bold">New Template</span>
          </Button>
        </motion.div>
      </div>

      {/* Filters & Discovery Section */}
      <div className="space-y-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
            <Input
              placeholder="Search by name, description or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-11 bg-white border-slate-200 rounded-2xl focus-visible:ring-amber-500/20 focus-visible:border-amber-500 shadow-sm transition-all"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-12 w-full sm:w-[220px] bg-white border-slate-200 rounded-2xl font-medium focus:ring-amber-500/20">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="Category" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100">
                <SelectItem value="all">All Designs</SelectItem>
                <SelectItem value="flyers">Marketing Flyers</SelectItem>
                <SelectItem value="certificates">Academic Certificates</SelectItem>
                <SelectItem value="brochures">Corporate Brochures</SelectItem>
                <SelectItem value="business-cards">Business Cards</SelectItem>
                <SelectItem value="invitations">Event Invitations</SelectItem>
                <SelectItem value="social">Social Assets</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="h-12 rounded-2xl px-5 border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium">
              Sort By: Recent
            </Button>
          </div>
        </div>
        
        {/* Popular Exploration */}
        {popularTags.length > 0 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Trending:</span>
            {popularTags.slice(0, 10).map((tag) => (
              <Badge
                key={tag.tag}
                variant="secondary"
                className={`cursor-pointer px-3 py-1.5 rounded-full text-xs transition-all whitespace-nowrap border ${
                  searchQuery === tag.tag 
                    ? 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm shadow-amber-100' 
                    : 'bg-white text-slate-600 border-slate-100 hover:border-amber-200 hover:text-amber-600'
                }`}
                onClick={() => setSearchQuery(tag.tag === searchQuery ? '' : tag.tag)}
              >
                #{tag.tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid Section */}
      <div className="min-h-[400px]">
        <TemplateGrid
          templates={filteredTemplates}
          loading={loading}
          viewMode={viewMode}
          onCreateNew={handleCreateTemplate}
          onEditTemplate={handleEditTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          onDuplicateTemplate={handleDuplicateTemplate}
        />
      </div>

      {/* Persistence Info & Count */}
      {!loading && templates.length > 0 && (
        <div className="flex items-center justify-between pt-10 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {filteredTemplates.length} matches found
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Auto-Sync Active
          </div>
        </div>
      )}
    </div>
  );
}
