/**
 * Template Metadata Panel
 * Panel for setting template name, type, description, and background image
 */

import { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { uploadImage } from '@/lib/supabase';
import { toast } from 'sonner';

interface TemplateMetadataPanelProps {
  name: string;
  type: string;
  description: string;
  backgroundUrl: string;
  onNameChange: (name: string) => void;
  onTypeChange: (type: string) => void;
  onDescriptionChange: (description: string) => void;
  onBackgroundChange: (url: string) => void;
}

const templateTypes = [
  { value: 'flyer', label: 'Flyer' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'brochure', label: 'Brochure' },
  { value: 'business-card', label: 'Business Card' },
  { value: 'invitation', label: 'Invitation' },
  { value: 'social', label: 'Social Media' },
  { value: 'poster', label: 'Poster' },
  { value: 'banner', label: 'Banner' },
];

export default function TemplateMetadataPanel({
  name,
  type,
  description,
  backgroundUrl,
  onNameChange,
  onTypeChange,
  onDescriptionChange,
  onBackgroundChange,
}: TemplateMetadataPanelProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📁 File selected:', { 
      name: file.name, 
      size: file.size, 
      type: file.type 
    });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    
    // Show initial upload toast
    const uploadToast = toast.loading('Uploading image...', {
      description: 'This may take a moment for larger files',
    });

    try {
      console.log('🚀 Starting image upload...');
      const imageUrl = await uploadImage(file, 'template-backgrounds');
      console.log('✅ Image upload successful:', imageUrl);
      
      onBackgroundChange(imageUrl);
      console.log('🔄 Background URL updated in parent component');
      
      toast.dismiss(uploadToast);
      toast.success('Background image uploaded successfully!');
    } catch (error: any) {
      console.error('❌ Error uploading image:', error);
      
      toast.dismiss(uploadToast);
      
      // Show specific error messages
      if (error?.message?.includes('timed out') || error?.message?.includes('timeout')) {
        toast.error('Upload timed out. Try a smaller image or check your internet connection.');
      } else if (error?.message?.includes('File size must be less than')) {
        toast.error('Image is too large. Please use an image smaller than 10MB.');
      } else if (error?.message?.includes('valid image file')) {
        toast.error('Invalid file type. Please upload JPG, PNG, or WebP images only.');
      } else if (error?.message?.includes('Permission denied')) {
        toast.error('Upload permission denied. Please try again or contact support.');
      } else {
        toast.error(`Upload failed: ${error?.message || 'Unknown error'}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveBackground = () => {
    onBackgroundChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };



  return (
    <div className="space-y-6">
      {/* Template Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Template Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              placeholder="Enter template name..."
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-type">Template Type</Label>
            <Select value={type} onValueChange={onTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select template type" />
              </SelectTrigger>
              <SelectContent>
                {templateTypes.map((templateType) => (
                  <SelectItem key={templateType.value} value={templateType.value}>
                    {templateType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              placeholder="Describe your template..."
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Background Image */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Background Image *</CardTitle>
        </CardHeader>
        <CardContent>
          {!backgroundUrl ? (
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Upload Background Image
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  PNG, JPG up to 10MB
                </p>
                <Button variant="outline" size="sm" disabled={uploading}>
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Choose File'}
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={backgroundUrl}
                  alt="Template background"
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveBackground}
                  className="absolute top-2 right-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Replace Image
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-gray-600 space-y-2">
          <p>• Use high-resolution images (min 1200px width)</p>
          <p>• Keep important content away from edges</p>
          <p>• Consider where users will place their content</p>
          <p>• Test with different text lengths</p>
        </CardContent>
      </Card>
    </div>
  );
} 