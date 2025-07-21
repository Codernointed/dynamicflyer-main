/**
 * Template Card Component
 * Displays individual template with preview, metadata, and action buttons
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { 
  MoreVertical, 
  Eye, 
  Edit3, 
  Share2, 
  Copy, 
  Trash2,
  QrCode,
  BarChart3,
  FileImage,
  Award,
  FileText,
  CreditCard,
  Mail,
  Share
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Template } from '@/integrations/supabase/types';
import { toast } from 'sonner';

interface TemplateCardProps {
  template: Template;
  onEdit?: (template: Template) => void;
  onDelete?: (template: Template) => void;
  onDuplicate?: (template: Template) => void;
  onViewAnalytics?: (template: Template) => void;
}

const getTemplateIcon = (type: string) => {
  switch (type) {
    case 'flyer': return FileImage;
    case 'certificate': return Award;
    case 'brochure': return FileText;
    case 'business-card': return CreditCard;
    case 'invitation': return Mail;
    case 'social': return Share;
    default: return FileImage;
  }
};

const getTemplateTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    'flyer': 'Flyer',
    'certificate': 'Certificate',
    'brochure': 'Brochure',
    'business-card': 'Business Card',
    'invitation': 'Invitation',
    'social': 'Social Media',
  };
  return types[type] || 'Template';
};

export default function TemplateCard({ 
  template, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onViewAnalytics 
}: TemplateCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const IconComponent = getTemplateIcon(template.template_type || 'flyer');
  const typeLabel = getTemplateTypeLabel(template.template_type || 'flyer');

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/generate/${template.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleGenerateQR = () => {
    // TODO: Implement QR code generation
    toast.info('QR code generation coming soon!');
  };

  const handleViewAnalytics = () => {
    if (onViewAnalytics) {
      onViewAnalytics(template);
    } else {
      toast.info('Analytics coming soon!');
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(template);
    } else {
      // Navigate to editor
      window.location.href = `/dashboard/editor/${template.id}`;
    }
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate(template);
    } else {
      toast.info('Duplicate feature coming soon!');
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(template);
      setIsDeleteDialogOpen(false);
    } else {
      toast.info('Delete feature coming soon!');
    }
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="group"
      >
        <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg">
          {/* Template Preview */}
          <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200">
            {template.background_url ? (
              <img
                src={template.background_url}
                alt={template.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <IconComponent className="h-12 w-12 text-gray-400" />
              </div>
            )}
            
            {/* Overlay actions - show on hover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center gap-2"
            >
              <Button size="sm" variant="secondary" onClick={handleEdit}>
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="secondary" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="secondary" onClick={handleViewAnalytics}>
                <BarChart3 className="h-4 w-4" />
              </Button>
            </motion.div>

            {/* Template type badge */}
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="text-xs">
                <IconComponent className="mr-1 h-3 w-3" />
                {typeLabel}
              </Badge>
            </div>

            {/* Actions dropdown */}
            <div className="absolute top-3 right-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Template
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Copy Share Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleGenerateQR}>
                    <QrCode className="mr-2 h-4 w-4" />
                    Generate QR Code
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleViewAnalytics}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Analytics
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Template Info */}
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 truncate">
                {template.name}
              </h3>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  Updated {formatDistanceToNow(new Date(template.updated_at), { addSuffix: true })}
                </span>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>0</span> {/* TODO: Add actual view count */}
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={handleEdit}>
                  <Edit3 className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={handleShare}>
                  <Share2 className="mr-1 h-3 w-3" />
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{template.name}"? This action cannot be undone.
              All generated flyers from this template will still be accessible to users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 