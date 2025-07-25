/**
 * Template Editor Page
 * Canvas-based editor for creating and editing templates with Fabric.js
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Save, 
  Eye, 
  Share2, 
  ArrowLeft, 
  Settings,
  Upload,
  Type,
  Image as ImageIcon,
  Layers,
  Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { getTemplate, createTemplate, updateTemplate } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Template, TemplateWithFrames } from '@/integrations/supabase/types';
import EnhancedCanvasEditor, { FrameData } from '@/components/editor/EnhancedCanvasEditor';
import TemplateMetadataPanel from '@/components/editor/TemplateMetadataPanel';
import EnhancedFrameToolbar from '@/components/editor/EnhancedFrameToolbar';
import EnhancedPropertiesPanel from '@/components/editor/EnhancedPropertiesPanel';
import { toast } from 'sonner';
import QRCodeGenerator from '@/components/shared/QRCodeGenerator';



export default function TemplateEditor() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Template state
  const [template, setTemplate] = useState<TemplateWithFrames | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState<string>('flyer');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateTags, setTemplateTags] = useState<string[]>([]);
  
  // Canvas state
  const [backgroundUrl, setBackgroundUrl] = useState<string>('');
  const [frames, setFrames] = useState<FrameData[]>([]);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  
  // Get selected frame object
  const selectedFrame = frames.find(f => f.id === selectedFrameId) || null;

  // UI state
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activePanel, setActivePanel] = useState<'metadata' | 'frames' | 'properties'>('metadata');
  const [saveInProgress, setSaveInProgress] = useState(false);

  // Frame management functions
  const handleAddFrame = (frame: FrameData) => {
    setFrames(prev => [...prev, frame]);
    setSelectedFrameId(frame.id);
    setActivePanel('properties');
  };

  const handleDeleteFrame = (frameId: string) => {
    setFrames(prev => prev.filter(f => f.id !== frameId));
    if (selectedFrameId === frameId) {
      setSelectedFrameId(null);
    }
  };

  const handleDuplicateFrame = (frame: FrameData) => {
    const duplicatedFrame = {
      ...frame,
      id: `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x: frame.x + 20,
      y: frame.y + 20,
    };
    setFrames(prev => [...prev, duplicatedFrame]);
    setSelectedFrameId(duplicatedFrame.id);
  };

  const handleFrameUpdate = (frameId: string, updates: Partial<FrameData>) => {
    setFrames(prev => prev.map(f => 
      f.id === frameId ? { ...f, ...updates } : f
    ));
  };

  const isNewTemplate = templateId === 'new';
  const canEditTemplate = !template || template.user_id === user?.id;

  // Load existing template
  useEffect(() => {
    if (!isNewTemplate && templateId) {
      loadTemplate();
    }
  }, [templateId, isNewTemplate]);

  // Check template ownership when template loads
  useEffect(() => {
    if (template && user && template.user_id !== user.id) {
      console.warn('⚠️ Template ownership mismatch detected');
      toast.error('This template belongs to a different account. You can view it but cannot edit it.');
    }
  }, [template, user]);

  const loadTemplate = async () => {
    if (!templateId) return;
    
    try {
      const templateData = await getTemplate(templateId);
      if (templateData) {
        setTemplate(templateData);
        setTemplateName(templateData.name);
        setTemplateType(templateData.template_type || 'flyer');
        setTemplateDescription(templateData.description || '');
        setTemplateTags(templateData.tags && Array.isArray(templateData.tags) ? templateData.tags : []);
        setBackgroundUrl(templateData.background_url || '');
        
        // Parse frames from JSON and ensure they have the new structure
        if (templateData.frames && Array.isArray(templateData.frames)) {
          const parsedFrames = templateData.frames.map((frame: any) => ({
            ...frame,
            rotation: frame.rotation || 0,
            shape: frame.shape || 'rectangle',
            properties: {
              fontSize: 16,
              fontFamily: 'Arial',
              color: '#000000',
              textAlign: 'center',
              placeholder: frame.type === 'text' ? 'Enter text here' : 'Image placeholder',
              ...frame.properties,
            },
          }));
          setFrames(parsedFrames as FrameData[]);
        }
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
      navigate('/dashboard');
    }
  };

  const handleSave = async () => {
    console.log('🚀 handleSave called');
    console.log('📊 Current state:', { 
      user: user?.id, 
      templateName, 
      isNewTemplate, 
      templateId: template?.id,
      framesCount: frames.length 
    });

    if (!user || !templateName.trim()) {
      console.error('❌ Validation failed:', { hasUser: !!user, templateName });
      toast.error('Please enter a template name');
      return;
    }

    // Prevent multiple simultaneous saves
    if (saveInProgress) {
      console.log('⚠️ Save already in progress, ignoring request');
      return;
    }

    setSaveInProgress(true);
    setSaving(true);
    console.log('⏳ Starting save process...');
    
    // Check session before starting
    console.log('🔐 Checking session before save...');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('❌ No active session found');
      toast.error('Session expired. Please log in again.');
      setSaving(false);
      return;
    }
    console.log('✅ Session is valid');
    
    // Add timeout to prevent hanging
    const saveTimeout = setTimeout(() => {
      console.error('⏰ Save operation timed out after 30 seconds');
      toast.error('Save operation timed out. Please try again.');
      setSaving(false);
    }, 30000);
    
    try {
      const templateData: any = {
        user_id: user.id,
        name: templateName.trim(),
        description: templateDescription.trim(),
        background_url: backgroundUrl,
        frames: frames as any, // Ensure proper JSON serialization
      };

      console.log('📝 Template data prepared:', templateData);

      // Only add new fields if they exist in the database
      if (templateType) {
        templateData.template_type = templateType;
        console.log('🏷️ Added template type:', templateType);
      }
      if (templateTags && templateTags.length > 0) {
        templateData.tags = templateTags;
        console.log('🏷️ Added template tags:', templateTags);
      }

      let savedTemplate;
      if (isNewTemplate) {
        console.log('🆕 Creating new template...');
        savedTemplate = await createTemplate(templateData);
        console.log('✅ Template created:', savedTemplate);
        toast.success('Template created successfully!');
        // Navigate to the new template ID
        navigate(`/dashboard/editor/${savedTemplate.id}`, { replace: true });
      } else if (template) {
        console.log('🔄 Updating existing template:', template.id);
        
        // Retry mechanism for update operations
        let retryCount = 0;
        const maxRetries = 2;
        
        while (retryCount <= maxRetries) {
          try {
            savedTemplate = await updateTemplate(template.id, templateData);
            console.log('✅ Template updated:', savedTemplate);
            toast.success('Template saved successfully!');
            break;
          } catch (error) {
            retryCount++;
            console.error(`❌ Update attempt ${retryCount} failed:`, error);
            
            if (retryCount > maxRetries) {
              throw error;
            }
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            console.log(`🔄 Retrying update (attempt ${retryCount + 1}/${maxRetries + 1})...`);
          }
        }
      } else {
        console.error('❌ No template to save');
        toast.error('No template to save');
        return;
      }

      if (savedTemplate) {
        console.log('💾 Setting saved template in state');
        setTemplate(savedTemplate);
      }
      
      console.log('🎉 Save process completed successfully');
            } catch (error) {
          console.error('❌ Error saving template:', error);
          console.error('❌ Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          });

          if (error instanceof Error) {
            // Check for specific ownership error
            if (error.message.includes('permission to edit this template')) {
              toast.error('This template belongs to a different account. Please log in with the correct account or create a new template.');
            } else if (error.message.includes('Session expired')) {
              toast.error('Session expired. Please log in again.');
            } else {
              toast.error(`Failed to save template: ${error.message}`);
            }
          } else {
            toast.error('Failed to save template');
          }
    } finally {
      console.log('🏁 Save process finished, setting saving to false');
      clearTimeout(saveTimeout);
      setSaving(false);
      setSaveInProgress(false);
    }
  };

  const handlePreview = () => {
    if (!template?.id && !isNewTemplate) {
      toast.error('Please save the template first');
      return;
    }
    setShowPreview(true);
  };

  const handleShare = async () => {
    console.log('🔗 handleShare called');
    console.log('📊 Template state:', { 
      hasTemplate: !!template, 
      templateId: template?.id,
      isNewTemplate,
      isPublic: template?.is_public 
    });

    if (!template?.id) {
      console.error('❌ No template ID available for sharing');
      toast.error('Please save the template first');
      return;
    }

    // Check if template is public
    if (!template.is_public) {
      console.warn('⚠️ Template is not public, making it public first...');
      try {
        await updateTemplate(template.id, { is_public: true });
        console.log('✅ Template made public');
        toast.success('Template made public and share link copied!');
      } catch (error) {
        console.error('❌ Failed to make template public:', error);
        toast.error('Failed to make template public for sharing');
        return;
      }
    }

    const shareUrl = `${window.location.origin}/flyer/${template.id}`;
    console.log('🔗 Generated share URL:', shareUrl);

    try {
      await navigator.clipboard.writeText(shareUrl);
      console.log('✅ Share URL copied to clipboard');
      toast.success('Share link copied to clipboard!');
    } catch (error) {
      console.error('❌ Failed to copy share URL:', error);
      toast.error('Failed to copy link');
    }
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">
                {isNewTemplate ? 'Create Template' : 'Edit Template'}
              </h1>
              {templateName && (
                <Badge variant="secondary">{templateName}</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={!backgroundUrl}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            
            <QRCodeGenerator 
              url={`${window.location.origin}/flyer/${template?.id}`}
              templateName={templateName}
            />
            
            <Button
              variant="outline" 
              size="sm"
              onClick={handleShare}
              disabled={isNewTemplate || !template?.id}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !backgroundUrl || !templateName.trim() || !canEditTemplate}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : !canEditTemplate ? 'Read Only' : 'Save'}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Sidebar - Tools and Properties */}
        <div className="w-80 border-r bg-white">
          <div className="flex border-b">
            <button
              onClick={() => setActivePanel('metadata')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activePanel === 'metadata' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings className="mx-auto h-4 w-4 mb-1" />
              Setup
            </button>
            <button
              onClick={() => setActivePanel('frames')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activePanel === 'frames' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Layers className="mx-auto h-4 w-4 mb-1" />
              Frames
            </button>
            <button
              onClick={() => setActivePanel('properties')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activePanel === 'properties' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              disabled={!selectedFrameId}
            >
              <Palette className="mx-auto h-4 w-4 mb-1" />
              Style
            </button>
          </div>

          <div className="p-4 h-[calc(100vh-8rem)] overflow-y-auto">
            {activePanel === 'metadata' && (
              <TemplateMetadataPanel
                name={templateName}
                type={templateType}
                description={templateDescription}
              tags={templateTags}
                backgroundUrl={backgroundUrl}
                onNameChange={setTemplateName}
                onTypeChange={setTemplateType}
                onDescriptionChange={setTemplateDescription}
              onTagsChange={setTemplateTags}
                onBackgroundChange={setBackgroundUrl}
              />
            )}

            {activePanel === 'frames' && (
              <EnhancedFrameToolbar
                frames={frames}
                selectedFrame={selectedFrame}
                onAddFrame={canEditTemplate ? handleAddFrame : undefined}
                onDeleteFrame={canEditTemplate ? handleDeleteFrame : undefined}
                onDuplicateFrame={canEditTemplate ? handleDuplicateFrame : undefined}
              />
            )}

            {activePanel === 'properties' && selectedFrame && (
              <EnhancedPropertiesPanel
                frame={selectedFrame}
                onFrameUpdate={canEditTemplate ? handleFrameUpdate : undefined}
                onFrameDelete={canEditTemplate ? handleDeleteFrame : undefined}
                onFrameDuplicate={canEditTemplate ? handleDuplicateFrame : undefined}
              />
            )}
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 p-6 bg-gray-100 min-h-0">

          
          <EnhancedCanvasEditor
            backgroundUrl={backgroundUrl}
            frames={frames}
            selectedFrameId={selectedFrameId}
            onFramesChange={canEditTemplate ? setFrames : undefined}
            onFrameSelect={setSelectedFrameId}
            onCanvasReady={setCanvasReady}
            readOnly={!canEditTemplate}
          />
        </div>
      </div>
    </div>
  );
} 