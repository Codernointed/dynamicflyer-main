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
import QRCodeGenerator from '@/components/shared/QRCodeGenerator';

interface TemplateCardProps {
  template: Template;
  onEdit?: (template: Template) => void;
  onDelete?: (template: Template) => void;
  onDuplicate?: (template: Template) => void;
  onViewAnalytics?: (template: Template) => void;
}

const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  flyer: 'Flyer',
  certificate: 'Certificate',
  brochure: 'Brochure',
  business_card: 'Business Card',
  invitation: 'Invitation',
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

const getTemplateIcon = (type: string) => {
  switch (type) {
    case 'flyer': return FileImage;
    case 'certificate': return Award;
    case 'brochure': return FileText;
    case 'business_card': return CreditCard;
    case 'invitation': return Mail;
    case 'social_media': return Share;
    case 'marketing': return FileImage;
    case 'other': return FileText;
    default: return FileImage;
  }
};

const getTemplateTypeLabel = (type: string) => {
  return TEMPLATE_TYPE_LABELS[type] || 'Template';
};

export default function TemplateCard({ 
  template, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onViewAnalytics 
}: TemplateCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const IconComponent = getTemplateIcon(template.template_type || 'flyer');
  const typeLabel = getTemplateTypeLabel(template.template_type || 'flyer');

  const handleShare = async () => {
            const shareUrl = `${window.location.origin}/flyer/${template.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleGenerateQR = () => {
    setIsQrDialogOpen(true);
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
        whileHover={{ y: -6 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="group h-full"
      >
        <Card className="h-full overflow-hidden border-slate-200/60 bg-white transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50 rounded-2xl flex flex-col">
          {/* Template Preview Section */}
          <div className="relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden bg-slate-50">
            {template.background_url ? (
              <img
                src={template.background_url}
                alt={template.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-slate-100">
                <IconComponent className="h-10 w-10 text-slate-300" />
              </div>
            )}
            
            {/* Premium Glassmorphic Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] transition-all duration-300 flex items-center justify-center gap-3"
            >
              <div className="flex gap-2 p-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
                <Button size="icon" variant="ghost" onClick={handleEdit} className="h-10 w-10 rounded-xl hover:bg-amber-50 hover:text-amber-600 transition-colors">
                  <Edit3 className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="ghost" onClick={handleShare} className="h-10 w-10 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors">
                  <Share2 className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="ghost" onClick={handleViewAnalytics} className="h-10 w-10 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                  <BarChart3 className="h-5 w-5" />
                </Button>
              </div>
            </motion.div>

            {/* Template type badge - Premium Style */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <Badge className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-slate-900 border-0 shadow-sm">
                <IconComponent className="mr-1.5 h-3 w-3 text-amber-500" />
                {typeLabel}
              </Badge>
              {template.is_public && (
                <Badge variant="secondary" className="px-2 py-1 text-[10px] bg-emerald-500 text-white border-0 shadow-sm font-bold uppercase tracking-wider">
                  Live
                </Badge>
              )}
            </div>

            {/* Actions dropdown */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="white" size="icon" className="h-8 w-8 rounded-full shadow-md">
                    <MoreVertical className="h-4 w-4 text-slate-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-2xl border-slate-100">
                  <DropdownMenuItem onClick={handleEdit} className="rounded-lg py-2.5 focus:bg-slate-50">
                    <Edit3 className="mr-3 h-4 w-4 text-slate-400" />
                    <span className="font-medium">Edit Template</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare} className="rounded-lg py-2.5 focus:bg-slate-50">
                    <Share2 className="mr-3 h-4 w-4 text-slate-400" />
                    <span className="font-medium">Share Link</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleGenerateQR} className="rounded-lg py-2.5 focus:bg-slate-50">
                    <QrCode className="mr-3 h-4 w-4 text-slate-400" />
                    <span className="font-medium">QR Code</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 bg-slate-100" />
                  <DropdownMenuItem onClick={handleDuplicate} className="rounded-lg py-2.5 focus:bg-slate-50">
                    <Copy className="mr-3 h-4 w-4 text-slate-400" />
                    <span className="font-medium">Duplicate</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="rounded-lg py-2.5 text-red-600 focus:text-red-700 focus:bg-red-50"
                  >
                    <Trash2 className="mr-3 h-4 w-4" />
                    <span className="font-bold">Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Template Info Section */}
          <CardContent className="p-5 flex-1 flex flex-col">
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1">
                  {template.name}
                </h3>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  <Eye className="h-3 w-3" />
                  {template.view_count || 0}
                </div>
              </div>
              
              {template.description && (
                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed h-[2.5rem]">
                  {template.description}
                </p>
              )}
              
              {/* Tags - Visual Polish */}
              <div className="flex flex-wrap gap-1.5 h-[1.5rem] overflow-hidden">
                {template.tags && Array.isArray(template.tags) && template.tags.length > 0 ? (
                  template.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] font-medium text-slate-300 italic">No tags</span>
                )}
                {template.tags && template.tags.length > 2 && (
                  <span className="text-[10px] font-bold text-slate-400 px-2 py-1">
                    +{template.tags.length - 2}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-4 mt-auto border-t border-slate-50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Last edited</span>
                <span className="text-xs font-medium text-slate-600">
                  {formatDistanceToNow(new Date(template.updated_at), { addSuffix: true })}
                </span>
              </div>
              
              <div className="flex gap-1.5">
                <Button 
                  size="sm" 
                  className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-100/50 hover:bg-amber-100 p-0"
                  onClick={handleEdit}
                  title="Quick Edit"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  size="sm" 
                  className="h-8 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all font-bold text-xs px-3"
                  onClick={handleShare}
                >
                  <Share2 className="mr-2 h-3 w-3 text-amber-400" />
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

      {/* QR Code dialog */}
      <QRCodeGenerator 
        url={`${window.location.origin}/flyer/${template.id}`}
        templateName={template.name}
        open={isQrDialogOpen}
        onOpenChange={setIsQrDialogOpen}
      />
    </>
  );
} 