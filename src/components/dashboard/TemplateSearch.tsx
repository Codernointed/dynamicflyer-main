import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, Tag, Grid, List } from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export interface TemplateSearchFilters {
  searchQuery: string;
  templateType: string;
  tags: string[];
  sortBy: 'newest' | 'oldest' | 'popular' | 'name';
  viewMode: 'grid' | 'list';
}

interface TemplateSearchProps {
  filters: TemplateSearchFilters;
  onFiltersChange: (filters: TemplateSearchFilters) => void;
  availableTags: string[];
  templateTypes: string[];
  totalResults: number;
}

const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  flyer: 'Flyers',
  certificate: 'Certificates',
  brochure: 'Brochures',
  business_card: 'Business Cards',
  invitation: 'Invitations',
  social_media: 'Social Media',
  marketing: 'Marketing',
  other: 'Other'
};

const TEMPLATE_TYPE_ICONS: Record<string, string> = {
  flyer: '📄',
  certificate: '🏆',
  brochure: '📋',
  business_card: '💼',
  invitation: '🎉',
  social_media: '📱',
  marketing: '📢',
  other: '📁'
};

export default function TemplateSearch({
  filters,
  onFiltersChange,
  availableTags,
  templateTypes,
  totalResults
}: TemplateSearchProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags);

  const updateFilters = useCallback((updates: Partial<TemplateSearchFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  }, [filters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    const clearedFilters: TemplateSearchFilters = {
      searchQuery: '',
      templateType: '',
      tags: [],
      sortBy: 'newest',
      viewMode: 'grid'
    };
    onFiltersChange(clearedFilters);
    setSelectedTags([]);
  }, [onFiltersChange]);

  const toggleTag = useCallback((tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    updateFilters({ tags: newTags });
  }, [selectedTags, updateFilters]);

  const removeTag = useCallback((tag: string) => {
    const newTags = selectedTags.filter(t => t !== tag);
    setSelectedTags(newTags);
    updateFilters({ tags: newTags });
  }, [selectedTags, updateFilters]);

  const hasActiveFilters = filters.searchQuery || filters.templateType || filters.tags.length > 0;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search templates by name, description, or tags..."
            value={filters.searchQuery}
            onChange={(e) => updateFilters({ searchQuery: e.target.value })}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1">
                    {filters.tags.length + (filters.templateType ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filters</h4>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-xs"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
                
                <Separator />
                
                {/* Template Type Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Template Type</Label>
                  <Select
                    value={filters.templateType}
                    onValueChange={(value) => updateFilters({ templateType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      {templateTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          <span className="flex items-center gap-2">
                            <span>{TEMPLATE_TYPE_ICONS[type]}</span>
                            <span>{TEMPLATE_TYPE_LABELS[type]}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {availableTags.map((tag) => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          id={tag}
                          checked={selectedTags.includes(tag)}
                          onCheckedChange={() => toggleTag(tag)}
                        />
                        <Label
                          htmlFor={tag}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {tag}
                        </Label>
                      </div>
                    ))}
                    {availableTags.length === 0 && (
                      <p className="text-sm text-gray-500">No tags available</p>
                    )}
                  </div>
                </div>

                {/* Sort Options */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sort By</Label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value: any) => updateFilters({ sortBy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="name">Name A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* View Mode Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={filters.viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => updateFilters({ viewMode: 'grid' })}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={filters.viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => updateFilters({ viewMode: 'list' })}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-500">Active filters:</span>
          
          {filters.templateType && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <span>{TEMPLATE_TYPE_ICONS[filters.templateType]}</span>
              {TEMPLATE_TYPE_LABELS[filters.templateType]}
              <button
                onClick={() => updateFilters({ templateType: '' })}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs h-6 px-2"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {totalResults} template{totalResults !== 1 ? 's' : ''} found
        </span>
        <span className="capitalize">
          {filters.sortBy.replace('_', ' ')} • {filters.viewMode} view
        </span>
      </div>
    </div>
  );
} 