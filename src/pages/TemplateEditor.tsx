/**
 * Template Editor Page
 * Canvas-based editor for creating and editing templates with Fabric.js
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Layers,
  Palette,
  Layout,
  Plus,
  Undo2,
  Redo2,
  Cloud,
  Check,
  ChevronDown,
  Monitor,
  Maximize2,
  Minimize2,
  Search,
  FolderOpen,
  Settings,
  Upload,
  Type,
  Image as ImageIcon,
  Home,
  Hand,
  MousePointer2,
  Grid3X3,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
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
import LayersPanel from '@/components/editor/LayersPanel';
import EnhancedPropertiesPanel from '@/components/editor/EnhancedPropertiesPanel';
import { toast } from 'sonner';
import QRCodeGenerator from '@/components/shared/QRCodeGenerator';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { useCanvasHistory } from '@/hooks/useCanvasHistory';
import PreviewModal from '@/components/editor/PreviewModal';
import { NameTemplateModal } from '@/components/editor/NameTemplateModal';


interface EditorStateSnapshot {
  frames: FrameData[];
  metadata: {
    name: string;
    description: string;
    type: string;
    tags: string[];
    backgroundUrl: string;
  };
}

export default function TemplateEditor() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackTemplateCreation } = useUsageTracking();

  // Unified Template State with History
  const { 
    state: editorState, 
    setState: setEditorState, 
    undo, 
    redo, 
    canUndo, 
    canRedo,
    resetHistory 
  } = useCanvasHistory<EditorStateSnapshot>({
    frames: [],
    metadata: {
      name: '',
      description: '',
      type: 'flyer',
      tags: [],
      backgroundUrl: ''
    }
  });

  const frames = editorState.frames;
  const metrics = editorState.metadata;
  
  // Helper to update specific parts of the state
  const updateState = (
    updater: (prev: EditorStateSnapshot) => EditorStateSnapshot, 
    saveToHistory: boolean = true
  ) => {
    setEditorState(updater, saveToHistory);
  };

  const setFrames = (updater: FrameData[] | ((prev: FrameData[]) => FrameData[]), saveToHistory: boolean = true) => {
    updateState(prev => ({
      ...prev,
      frames: typeof updater === 'function' ? updater(prev.frames) : updater
    }), saveToHistory);
  };

  const setMetadata = (updates: Partial<EditorStateSnapshot['metadata']>, saveToHistory: boolean = true) => {
    updateState(prev => ({
      ...prev,
      metadata: { ...prev.metadata, ...updates }
    }), saveToHistory);
  };

  const [template, setTemplate] = useState<TemplateWithFrames | null>(null);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  
  // Get selected frame object
  const selectedFrame = frames.find(f => f.id === selectedFrameId) || null;

  // UI state
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activePanel, setActivePanel] = useState<'metadata' | 'frames' | 'properties' | 'uploads' | 'elements' | 'text'>('metadata');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [saveInProgress, setSaveInProgress] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'save' | 'share' | null>(null);
  
  // Interaction & View State
  const [interactionMode, setInteractionMode] = useState<'select' | 'pan'>('select');
  const [showGrid, setShowGrid] = useState(false);
  const [showGuides, setShowGuides] = useState(true);

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

  // Keyboard shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        if (e.key === 'z') {
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          e.preventDefault();
        } else if (e.key === 'y') {
          redo();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

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
        
        let templateFrames: FrameData[] = [];
        // Parse frames from JSON and ensure they have the new structure
        if (templateData.frames && Array.isArray(templateData.frames)) {
          templateFrames = templateData.frames.map((frame: any) => ({
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
          })) as FrameData[];
        }

        resetHistory({
          frames: templateFrames,
          metadata: {
            name: templateData.name,
            type: templateData.template_type || 'flyer',
            description: templateData.description || '',
            tags: templateData.tags && Array.isArray(templateData.tags) ? templateData.tags : [],
            backgroundUrl: templateData.background_url || ''
          }
        });
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
      navigate('/dashboard');
    }
  };

  const handleSave = async (overrides?: Partial<EditorStateSnapshot['metadata']>) => {
    const metadata = { ...editorState.metadata, ...overrides };
    const { name, description, backgroundUrl, type, tags } = metadata;
    
    console.log('🚀 handleSave called');
    console.log('📊 Current state:', { 
      user: user?.id, 
      templateName: name, 
      isNewTemplate, 
      templateId: template?.id,
      framesCount: frames.length 
    });

    if (!user) {
      toast.error('Please log in to save your template');
      return;
    }

    // Trigger naming modal if project is untitled (and not being overridden right now)
    if (!name.trim() || name === 'Untitled Flyer') {
      if (!overrides?.name) { // Only prompt if we don't already have one in overrides
        setPendingAction('save');
        setIsNameModalOpen(true);
        return;
      }
    }

    if (!backgroundUrl) {
      console.warn('⚠️ No background image uploaded, proceeding anyway');
      // We don't block save anymore, but we log it
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
      // Build payload with only core fields to avoid check constraint issues
      const templatePayload: any = {
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        background_url: backgroundUrl || null,
        frames: frames as any, 
      };

      console.log('📝 Final template payload:', JSON.stringify(templatePayload, null, 2));

      let savedTemplate;
      if (isNewTemplate) {
        console.log('🆕 Creating new template...');
        savedTemplate = await createTemplate(templatePayload);
        console.log('✅ Template created:', savedTemplate);
        
        // Track template creation usage
        if (savedTemplate.id) {
          await trackTemplateCreation(savedTemplate.id);
        }
        
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
            savedTemplate = await updateTemplate(template.id, templatePayload);
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
      return savedTemplate; // Return the saved template for chaining actions (like share)
    } catch (error: any) {
      // Supabase errors are often objects with message/code, not always Error instances
      const errorMsg = error?.message || error?.error_description || (typeof error === 'string' ? error : 'Unknown error');
      const errorCode = error?.code || 'No code';
      const errorDetails = error?.details || '';
      
      console.error('❌ Detailed save failure:', { error, errorCode, message: errorMsg, details: errorDetails });
      toast.error(`Failed to save: ${errorMsg} (${errorCode}) ${errorDetails}`);
      return null;
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
    // If not saved yet, we MUST save first (and potentially prompt for name)
    let currentTemplate = template;
    
    if (!currentTemplate?.id) {
      if (!editorState.metadata.name || editorState.metadata.name === 'Untitled Flyer') {
        setPendingAction('share');
        setIsNameModalOpen(true);
        return;
      }
      
      // If named but not saved, save it first
      const saved = await handleSave();
      if (!saved) return;
      currentTemplate = saved;
    }

    if (!currentTemplate) return;

    if (!currentTemplate.is_public) {
      try {
        setSaving(true);
        await updateTemplate(currentTemplate.id, { is_public: true });
        // We update the local template state so the UI knows it's shared
        setTemplate({ ...currentTemplate, is_public: true });
        toast.success('Template made public!');
      } catch (error) {
        toast.error('Failed to make template public for sharing');
        setSaving(false);
        return;
      } finally {
        setSaving(false);
      }
    }

    const shareUrl = `${window.location.origin}/flyer/${currentTemplate.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleNameConfirm = async (name: string) => {
    setIsNameModalOpen(false);
    
    // Update local state first
    setMetadata({ name });
    
    const action = pendingAction;
    setPendingAction(null);

    // Proceed with the intended action
    if (action === 'save') {
      // Trigger save immediately with fresh value
      handleSave({ name });
    } else if (action === 'share') {
      // For share, we save with override THEN share
      const saved = await handleSave({ name });
      if (saved) {
        handleShare();
      }
    }
  };



  return (
    <div className="h-screen flex flex-col bg-[#F3F4F6] text-[#0E1318] font-sans overflow-hidden select-none">
      {/* --- ELITE HEADER --- */}
      <header className="h-14 bg-[#0E1318] text-white flex items-center justify-between px-4 z-[100] border-b border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
            onClick={() => navigate('/dashboard')}
            title="Go to Dashboard"
          >
            <Home className="h-5 w-5" />
          </Button>
          <div className="h-6 w-[1px] bg-white/20 mx-1" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2 group cursor-pointer">
              <span className="text-sm font-semibold tracking-tight text-white/90 group-hover:text-white transition-colors">
                {editorState.metadata.name || 'Untitled Flyer'}
              </span>
              <ChevronDown className="h-3 w-3 text-white/50 group-hover:text-white transition-colors" />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-none text-[9px] py-0 h-4 uppercase tracking-tighter">
                {editorState.metadata.type}
              </Badge>
              <div className="flex items-center gap-1 text-[10px] text-white/40">
                {saving ? (
                  <>
                    <div className="h-1 w-1 rounded-full bg-amber-400 animate-pulse" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="h-2.5 w-2.5 text-emerald-400/60" />
                    <span>All changes saved</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Global Toolbar Controls */}
        <div className="hidden md:flex items-center gap-2 bg-white/5 backdrop-blur-md rounded-xl p-1 border border-white/10">
          <div className="flex items-center gap-0.5 px-0.5">
            <Button
              variant={interactionMode === 'select' ? 'secondary' : 'ghost'}
              size="sm"
              className={`h-8 px-3 rounded-lg transition-all ${interactionMode === 'select' ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              onClick={() => setInteractionMode('select')}
              title="Select Tool (V)"
            >
              <MousePointer2 className="h-4 w-4 mr-1.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Select</span>
            </Button>
            <Button
              variant={interactionMode === 'pan' ? 'secondary' : 'ghost'}
              size="sm"
              className={`h-8 px-3 rounded-lg transition-all ${interactionMode === 'pan' ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              onClick={() => setInteractionMode('pan')}
              title="Hand Tool (H)"
            >
              <Hand className="h-4 w-4 mr-1.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Hand</span>
            </Button>
          </div>

          <Separator orientation="vertical" className="h-4 bg-white/10" />

          <div className="flex items-center gap-0.5 px-0.5">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-3 rounded-lg transition-all ${showGrid ? 'text-amber-400 bg-amber-400/10' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              onClick={() => setShowGrid(!showGrid)}
              title="Toggle Grid"
            >
              <Grid3X3 className="h-4 w-4 mr-1.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Grid</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-3 rounded-lg transition-all ${showGuides ? 'text-amber-400 bg-amber-400/10' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              onClick={() => setShowGuides(!showGuides)}
              title="Toggle Guides"
            >
              {showGuides ? <Eye className="h-4 w-4 mr-1.5" /> : <EyeOff className="h-4 w-4 mr-1.5" />}
              <span className="text-[10px] font-bold uppercase tracking-wider">Guides</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white/5 rounded-full p-0.5 border border-white/10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30"
              onClick={undo}
              disabled={!canUndo}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30"
              onClick={redo}
              disabled={!canRedo}
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-[1px] bg-white/10" />

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-4 text-sm font-medium hover:bg-white/10 rounded-full border border-white/10 transition-all active:scale-95 text-white/90"
              onClick={handlePreview}
            >
              <Monitor className="mr-2 h-4 w-4" />
              Preview
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-4 text-sm font-medium hover:bg-white/10 rounded-full border border-white/10 transition-all active:scale-95 text-white/90"
              onClick={handleSave}
              disabled={saving || !canEditTemplate}
            >
              <Cloud className="mr-2 h-4 w-4" />
              Save
            </Button>
            
            <Button
              className="h-9 px-6 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold rounded-full shadow-xl shadow-amber-900/20 border border-white/10 transition-all active:scale-95 ml-2"
              onClick={handleShare}
              disabled={saving || !canEditTemplate}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {saving ? 'Publishing...' : 'Share'}
            </Button>
          </div>
        </div>
      </header>

      {/* --- MAIN WORKSPACE --- */}
      <div className="flex-1 flex overflow-hidden">
        {/* NARROW ICON SIDEBAR */}
        <aside className="w-[72px] bg-[#18191B] flex flex-col items-center py-4 z-40 border-r border-[#252627] shadow-2xl">
          {[
            { id: 'metadata', icon: Settings, label: 'Design' },
            { id: 'elements', icon: Layout, label: 'Elements' },
            { id: 'text', icon: Type, label: 'Text' },
            { id: 'uploads', icon: Upload, label: 'Uploads' },
            { id: 'frames', icon: Layers, label: 'Layers' },
            { id: 'properties', icon: Palette, label: 'Styles', disabled: !selectedFrameId }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActivePanel(item.id as any);
                setSidebarOpen(true);
              }}
              disabled={item.disabled}
              className={`w-full py-4 flex flex-col items-center justify-center gap-1.5 transition-all group relative ${
                activePanel === item.id 
                  ? 'text-white' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              } ${item.disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              {activePanel === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-amber-500 rounded-r-full" />
              )}
              <item.icon className="h-6 w-6 transition-transform group-hover:scale-110" />
              <span className="text-[10px] font-medium tracking-tight opacity-90 group-hover:opacity-100 uppercase">{item.label}</span>
            </button>
          ))}
          
          <div className="mt-auto pt-4 border-t border-white/5 w-full">
            <button className="w-full py-4 flex flex-col items-center justify-center gap-1 text-white/50 hover:text-white hover:bg-white/5 transition-all group">
              <FolderOpen className="h-5 w-5" />
              <span className="text-[10px] font-medium uppercase">Projects</span>
            </button>
          </div>
        </aside>

        {/* SECONDARY PANEL (DRAWER) */}
        {sidebarOpen && (
          <aside className="w-[360px] bg-white border-r border-[#D2D5D9] flex flex-col z-30 shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="h-full flex flex-col pt-6 pb-4">
              <div className="flex items-center justify-between px-6 mb-6">
                <h2 className="text-xl font-bold text-[#0E1318] capitalize">
                  {activePanel === 'metadata' ? 'Design' : 
                   activePanel === 'frames' ? 'Layers' : 
                   activePanel === 'properties' ? 'Layer Styles' : activePanel}
                </h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-xl text-black/20 hover:text-black hover:bg-black/5"
                  onClick={() => setSidebarOpen(false)}
                >
                  <ChevronDown className="h-5 w-5 rotate-90" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 scrollbar-thin scrollbar-thumb-slate-200">
                {activePanel === 'metadata' && (
                  <TemplateMetadataPanel
                    name={editorState.metadata.name}
                    type={editorState.metadata.type}
                    description={editorState.metadata.description}
                    tags={editorState.metadata.tags}
                    backgroundUrl={editorState.metadata.backgroundUrl}
                    onNameChange={(name) => setMetadata({ name }, false)}
                    onTypeChange={(type) => setMetadata({ type })}
                    onDescriptionChange={(description) => setMetadata({ description }, false)}
                    onTagsChange={(tags) => setMetadata({ tags })}
                    onBackgroundChange={(backgroundUrl) => setMetadata({ backgroundUrl })}
                  />
                )}

                {(activePanel === 'frames' || activePanel === 'elements') && (
                  <LayersPanel
                    frames={frames}
                    selectedFrameId={selectedFrameId}
                    onFramesChange={canEditTemplate ? setFrames : () => {}}
                    onFrameSelect={setSelectedFrameId}
                    onAddFrame={(type) => {
                      const frameWidth = type === 'image' ? 200 : 300;
                      const frameHeight = type === 'image' ? 200 : 80;
                      
                      // Calculate center position (1200x800 canvas)
                      const centerX = 1200 / 2 - frameWidth / 2;
                      const centerY = 800 / 2 - frameHeight / 2;
                      const stagger = (frames.length % 10) * 20;

                      const newFrame: FrameData = {
                        id: `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        type,
                        x: centerX + stagger,
                        y: centerY + stagger,
                        width: frameWidth,
                        height: frameHeight,
                        rotation: 0,
                        shape: 'rectangle',
                        visible: true,
                        locked: false,
                        properties: type === 'text' ? {
                          fontSize: 24,
                          fontFamily: 'Arial',
                          color: '#000000',
                          textAlign: 'center',
                          placeholder: 'Enter your text here',
                        } : undefined,
                      };
                      handleAddFrame(newFrame);
                    }}
                  />
                )}

                {activePanel === 'properties' && selectedFrame && (
                  <EnhancedPropertiesPanel
                    frame={selectedFrame}
                    onFrameUpdate={canEditTemplate ? (frameId, updates) => handleFrameUpdate(frameId, updates) : undefined}
                    onFrameDelete={canEditTemplate ? (frameId: string) => handleDeleteFrame(frameId) : undefined}
                    onFrameDuplicate={canEditTemplate ? (frameId: string) => {
                      const frame = frames.find(f => f.id === frameId);
                      if (frame) handleDuplicateFrame(frame);
                    } : undefined}
                  />
                )}

                {activePanel === 'text' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 shadow-sm mb-4">
                      <p className="text-sm font-semibold text-indigo-900 mb-1">Typography</p>
                      <p className="text-xs text-indigo-600/80 leading-relaxed">Add customized text layers to your flyer design.</p>
                    </div>
                    
                    <Button 
                      className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/10 flex items-center justify-center gap-3 active:scale-95 transition-all"
                      onClick={() => {
                        const newFrame: FrameData = {
                          id: `text_${Date.now()}`,
                          type: 'text',
                          x: 1200 / 2 - 400 / 2 + (frames.length % 10) * 20,
                          y: 800 / 2 - 100 / 2 + (frames.length % 10) * 20,
                          width: 400,
                          height: 100,
                          rotation: 0,
                          shape: 'rectangle',
                          visible: true,
                          locked: false,
                          properties: {
                            fontSize: 48,
                            fontFamily: 'Inter',
                            color: '#000000',
                            textAlign: 'center',
                            placeholder: 'ADD A HEADING',
                          },
                        };
                        handleAddFrame(newFrame);
                      }}
                    >
                      <Plus className="h-5 w-5" />
                      ADD A HEADING
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="w-full h-12 bg-white hover:bg-slate-50 border-[#D2D5D9] text-[#0E1318] font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                      onClick={() => {
                        const newFrame: FrameData = {
                          id: `text_${Date.now()}`,
                          type: 'text',
                          x: 1200 / 2 - 300 / 2 + (frames.length % 10) * 20,
                          y: 800 / 2 - 60 + (frames.length % 10) * 20,
                          width: 300,
                          height: 60,
                          rotation: 0,
                          shape: 'rectangle',
                          visible: true,
                          locked: false,
                          properties: {
                            fontSize: 24,
                            fontFamily: 'Inter',
                            color: '#000000',
                            textAlign: 'center',
                            placeholder: 'Add a subheading',
                          },
                        };
                        handleAddFrame(newFrame);
                      }}
                    >
                      Add a subheading
                    </Button>
                  </div>
                )}
                
                {activePanel === 'uploads' && (
                  <div className="py-20 text-center flex flex-col items-center gap-4">
                    <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                      <Upload className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Use Setup Panel</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
                        To maintain template structure, background images are currently managed in the <strong>Setup</strong> panel.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* CANVAS AREA */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#F0F2F5] relative">
          <div className="flex-1 flex items-center justify-center relative min-h-0 overflow-hidden">
            {/* CANVAS WRAPPER with Elite Padding for spacious feel */}
            <div className="h-full w-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
              <EnhancedCanvasEditor
                backgroundUrl={editorState.metadata.backgroundUrl}
                frames={frames}
                selectedFrameId={selectedFrameId}
                onFramesChange={canEditTemplate ? (newFrames) => setFrames(newFrames, false) : undefined}
                onFramesChangeEnd={canEditTemplate ? (newFrames) => setFrames(newFrames, true) : undefined}
                onFrameSelect={setSelectedFrameId}
                onCanvasReady={setCanvasReady}
                readOnly={!canEditTemplate}
                externalZoom={zoom}
                onZoomChange={setZoom}
                interactionMode={interactionMode}
                onInteractionModeChange={setInteractionMode}
                showGrid={showGrid}
                onShowGridChange={setShowGrid}
                showGuides={showGuides}
                onShowGuidesChange={setShowGuides}
              />
            </div>
          </div>

          {/* ELITE FOOTER / STATUS BAR */}
          <footer className="h-12 bg-white border-t border-[#D2D5D9] flex items-center justify-between px-6 z-50">
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-black uppercase tracking-widest transition-colors">
                Notes
              </button>
              <div className="h-4 w-[1px] bg-slate-200" />
              <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                <span className="bg-slate-100 px-2 py-0.5 rounded text-black">1</span>
                <span>Page 1 of 1</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 min-w-[200px]">
                <button 
                  className="text-slate-400 hover:text-black transition-colors"
                  onClick={() => setZoom(prev => Math.max(0.1, prev - 0.1))}
                >
                  <Undo2 className="h-4 w-4 rotate-90" />
                </button>
                <Slider
                  value={[zoom]}
                  min={0.1}
                  max={3}
                  step={0.01}
                  onValueChange={(val) => setZoom(val[0])}
                  className="flex-1 cursor-pointer"
                />
                <button 
                  className="text-slate-400 hover:text-black transition-colors"
                  onClick={() => setZoom(prev => Math.min(3, prev + 0.1))}
                >
                  <Undo2 className="h-4 w-4 -rotate-90" />
                </button>
              </div>
              
              <div className="h-4 w-[1px] bg-slate-200" />
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold w-10 text-center">{Math.round(zoom * 100)}%</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-400 hover:text-black rounded-lg"
                  onClick={() => setZoom(1)}
                  title="Fit to screen"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </footer>
        </main>
      </div>

      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        backgroundUrl={editorState.metadata.backgroundUrl}
        frames={frames}
        templateName={editorState.metadata.name}
      />

      <NameTemplateModal
        isOpen={isNameModalOpen}
        onClose={() => {
          setIsNameModalOpen(false);
          setPendingAction(null);
        }}
        onConfirm={handleNameConfirm}
        initialName={editorState.metadata.name}
        isSaving={saving}
      />
    </div>
  );
}