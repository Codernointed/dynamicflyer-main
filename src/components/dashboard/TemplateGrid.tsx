/**
 * Template Grid Component
 * Displays user templates in a responsive grid layout with loading and empty states
 */

import { motion } from 'framer-motion';
import { Plus, Search, Filter } from 'lucide-react';
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
import TemplateCard from './TemplateCard';
import { Template } from '@/integrations/supabase/types';

interface TemplateGridProps {
  templates: Template[];
  loading: boolean;
  selectedCategory?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onCreateNew: () => void;
}

const templateTypes = [
  { value: 'all', label: 'All Templates' },
  { value: 'flyer', label: 'Flyers' },
  { value: 'certificate', label: 'Certificates' },
  { value: 'brochure', label: 'Brochures' },
  { value: 'business-card', label: 'Business Cards' },
  { value: 'invitation', label: 'Invitations' },
  { value: 'social', label: 'Social Media' },
];

const sortOptions = [
  { value: 'recent', label: 'Recently Modified' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'type', label: 'Template Type' },
  { value: 'oldest', label: 'Oldest First' },
];

export default function TemplateGrid({ 
  templates, 
  loading, 
  selectedCategory = 'all',
  searchQuery,
  onSearchChange,
  onCategoryChange,
  onCreateNew 
}: TemplateGridProps) {
  
  // Filter templates based on search and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.template_type?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.template_type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Templates</h2>
          <p className="text-gray-600">
            Create and manage your design templates
          </p>
        </div>
        <Button onClick={onCreateNew} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Create New Template
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {templateTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select defaultValue="recent">
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      {!loading && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
          </Badge>
          {selectedCategory !== 'all' && (
            <Badge variant="outline">
              {templateTypes.find(t => t.value === selectedCategory)?.label}
            </Badge>
          )}
        </div>
      )}

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] rounded-lg bg-gray-200" />
              <div className="mt-3 space-y-2">
                <div className="h-4 rounded bg-gray-200" />
                <div className="h-3 w-3/4 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTemplates.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {filteredTemplates.map((template) => (
            <motion.div key={template.id} variants={itemVariants}>
              <TemplateCard template={template} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          onCreateNew={onCreateNew}
          onClearFilters={() => {
            onSearchChange('');
            onCategoryChange('all');
          }}
        />
      )}
    </div>
  );
}

// Empty state component
interface EmptyStateProps {
  searchQuery: string;
  selectedCategory: string;
  onCreateNew: () => void;
  onClearFilters: () => void;
}

function EmptyState({ searchQuery, selectedCategory, onCreateNew, onClearFilters }: EmptyStateProps) {
  const hasFilters = searchQuery || selectedCategory !== 'all';

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-gray-100 p-6 mb-4">
        <Plus className="h-12 w-12 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {hasFilters ? 'No templates found' : 'No templates yet'}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-sm">
        {hasFilters 
          ? 'Try adjusting your search or filters to find what you\'re looking for.'
          : 'Create your first template to get started with personalized designs.'
        }
      </p>

      <div className="flex gap-3">
        {hasFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
        <Button onClick={onCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>
    </div>
  );
} 