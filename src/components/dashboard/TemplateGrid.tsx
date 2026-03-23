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
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Templates Grid - High Density */}
      {loading ? (
        <div className={`grid gap-4 sm:gap-6 ${
          viewMode === 'list' 
            ? 'grid-cols-1' 
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
        }`}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-4">
              <div className="aspect-[4/5] rounded-2xl bg-slate-100" />
              <div className="space-y-2 px-1">
                <div className="h-4 w-2/3 rounded bg-slate-100" />
                <div className="h-3 w-1/2 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : templates.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          layout
          className={`grid gap-4 sm:gap-6 ${
            viewMode === 'list' 
              ? 'grid-cols-1' 
              : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
          }`}
        >
          {templates.map((template) => (
            <motion.div key={template.id} variants={itemVariants} layout>
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

// Empty state component - Premium Refinement
interface EmptyStateProps {
  onCreateNew: () => void;
}

function EmptyState({ onCreateNew }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-slate-100 rounded-[2rem] shadow-sm">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-amber-100 blur-3xl rounded-full opacity-50" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 shadow-inner">
          <Plus className="h-10 w-10 text-amber-600" />
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-slate-900 mb-2">
        Start Your First Design
      </h3>
      
      <p className="text-slate-500 mb-8 max-w-sm leading-relaxed">
        Choose from our professionally crafted layouts or start from scratch to create something unique.
      </p>

      <Button 
        onClick={onCreateNew}
        className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xl shadow-slate-200"
      >
        <Plus className="mr-2 h-5 w-5" />
        Create Template
      </Button>
    </div>
  );
}
 