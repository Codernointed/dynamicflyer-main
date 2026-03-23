import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Monitor, Download, Share2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import EnhancedCanvasEditor, { FrameData } from './EnhancedCanvasEditor';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  backgroundUrl: string;
  frames: FrameData[];
  templateName: string;
}

export default function PreviewModal({
  isOpen,
  onClose,
  backgroundUrl,
  frames,
  templateName
}: PreviewModalProps) {
  const [device, setDevice] = useState<'mobile' | 'desktop'>('desktop');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-xl">
                <Smartphone className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Live Preview</h2>
                <p className="text-xs text-slate-500">Previewing: {templateName || 'Untitled Template'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <Button
                variant={device === 'mobile' ? 'white' : 'ghost'}
                size="sm"
                className={`h-8 gap-2 rounded-lg ${device === 'mobile' ? 'shadow-sm text-slate-900' : 'text-slate-500'}`}
                onClick={() => setDevice('mobile')}
              >
                <Smartphone className="h-4 w-4" />
                <span className="hidden sm:inline">Mobile</span>
              </Button>
              <Button
                variant={device === 'desktop' ? 'white' : 'ghost'}
                size="sm"
                className={`h-8 gap-2 rounded-lg ${device === 'desktop' ? 'shadow-sm text-slate-900' : 'text-slate-500'}`}
                onClick={() => setDevice('desktop')}
              >
                <Monitor className="h-4 w-4" />
                <span className="hidden sm:inline">Desktop</span>
              </Button>
            </div>

            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto bg-slate-50 flex items-center justify-center p-4 sm:p-12 relative">
            <div className={`transition-all duration-500 ease-in-out ${
              device === 'mobile' 
                ? 'w-[320px] h-[640px] border-[12px] border-slate-900 rounded-[3rem] shadow-2xl overflow-hidden relative' 
                : 'w-full max-w-5xl aspect-video bg-white rounded-xl shadow-xl overflow-hidden'
            }`}>
              {/* Device Notch for mobile */}
              {device === 'mobile' && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-slate-900 rounded-b-2xl z-20 flex items-center justify-center">
                  <div className="w-12 h-1.5 bg-slate-800 rounded-full" />
                </div>
              )}

              <div className="w-full h-full overflow-y-auto overflow-x-hidden bg-white">
                <EnhancedCanvasEditor
                  backgroundUrl={backgroundUrl}
                  frames={frames}
                  selectedFrameId={null}
                  onFrameSelect={() => {}}
                  onCanvasReady={() => {}}
                  readOnly={true}
                />
                
                {/* Mock End-User UI overlay components */}
                <div className="p-4 space-y-4">
                  <div className="h-8 bg-slate-100 rounded w-3/4 animate-pulse" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-slate-100 rounded animate-pulse" />
                    <div className="h-20 bg-slate-100 rounded animate-pulse" />
                  </div>
                  <Button className="w-full h-12 bg-amber-500 hover:bg-amber-600 rounded-xl pointer-events-none">
                    Download Final Flyer
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Info Badge */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/20">
              <Info className="h-3.5 w-3.5 text-slate-600" />
              <span className="text-[10px] font-medium text-slate-600 uppercase tracking-widest">
                Simulated Viewport: {device === 'mobile' ? '320px' : 'Responsive Desktop'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
