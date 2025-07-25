/**
 * Template Grid Component
 * Displays user templates in a responsive grid layout with loading and empty states
 */

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TemplateCard from './TemplateCard';
import { Template } from '@/integrations/supabase/types';

interface TemplateGridProps {
  templates: Template[];
  loading: boolean;
  viewMode?: 'grid' | 'list';
  onCreateNew: () => void;
  onEditTemplate?: (template: Template) => void;
  onDeleteTemplate?: (template: Template) => void;
  onDuplicateTemplate?: (template: Template) => void;
  onViewAnalytics?: (template: Template) => void;
}



export default function TemplateGrid({ 
  templates, 
  loading, 
  viewMode = 'grid',
  onCreateNew,
  onEditTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
  onViewAnalytics
}: TemplateGridProps) {

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

      {/* Templates Grid */}
      {loading ? (
        <div className={`grid gap-6 ${
          viewMode === 'list' 
            ? 'grid-cols-1' 
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}>
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
      ) : templates.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={`grid gap-6 ${
            viewMode === 'list' 
              ? 'grid-cols-1' 
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}
        >
          {templates.map((template) => (
            <motion.div key={template.id} variants={itemVariants}>
              <TemplateCard 
                template={template}
                onEdit={onEditTemplate}
                onDelete={onDeleteTemplate}
                onDuplicate={onDuplicateTemplate}
                onViewAnalytics={onViewAnalytics}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState onCreateNew={onCreateNew} />
      )}
    </div>
  );
}

// Empty state component
interface EmptyStateProps {
  onCreateNew: () => void;
}

function EmptyState({ onCreateNew }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-gray-100 p-6 mb-4">
        <Plus className="h-12 w-12 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No templates yet
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-sm">
        Create your first template to get started with personalized designs.
      </p>

        <Button onClick={onCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
    </div>
  );
} 