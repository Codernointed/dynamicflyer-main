import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Eye, Plus, FileText, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CustomFont,
  loadFontFromFile,
  getCustomFonts,
  saveCustomFont,
  deleteCustomFont,
  getFontPreviewText,
  getAvailableFonts
} from '@/lib/fontUtils';

export default function FontManager() {
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  const [systemFonts] = useState<string[]>(getAvailableFonts());
  const [uploading, setUploading] = useState(false);
  const [selectedFont, setSelectedFont] = useState<CustomFont | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFonts();
  }, []);

  const loadFonts = () => {
    const fonts = getCustomFonts();
    setCustomFonts(fonts);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const font = await loadFontFromFile(file);
      saveCustomFont(font);
      loadFonts();
      toast.success(`Font "${font.family}" uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading font:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload font');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFont = (font: CustomFont) => {
    try {
      deleteCustomFont(font.id);
      loadFonts();
      toast.success(`Font "${font.family}" deleted successfully!`);
    } catch (error) {
      console.error('Error deleting font:', error);
      toast.error('Failed to delete font');
    }
  };

  const handlePreviewFont = (font: CustomFont) => {
    setSelectedFont(font);
    setShowPreview(true);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFontFormat = (filename: string): string => {
    const ext = filename.split('.').pop()?.toUpperCase();
    return ext || 'Unknown';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Font Manager</h1>
          <p className="text-gray-600 mt-1">Upload and manage custom fonts for your templates</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()}>
          <Plus className="mr-2 h-4 w-4" />
          Upload Font
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".woff,.woff2,.ttf,.otf"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custom Fonts</CardTitle>
            <Type className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customFonts.length}</div>
            <p className="text-xs text-muted-foreground">Uploaded fonts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Fonts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemFonts.length}</div>
            <p className="text-xs text-muted-foreground">Available fonts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fonts</CardTitle>
            <Type className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customFonts.length + systemFonts.length}</div>
            <p className="text-xs text-muted-foreground">Available for templates</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custom Fonts</CardTitle>
          <p className="text-sm text-gray-600">
            Upload your own fonts to use in templates. Supported formats: WOFF, WOFF2, TTF, OTF
          </p>
        </CardHeader>
        <CardContent>
          {customFonts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                <Type className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No custom fonts yet</h3>
              <p className="text-gray-600 mb-4">Upload your first custom font to get started</p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Font
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customFonts.map((font) => (
                <div key={font.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 
                        className="font-medium text-gray-900 mb-1"
                        style={{ fontFamily: font.family }}
                      >
                        {font.family}
                      </h4>
                      <p className="text-sm text-gray-500">{font.name}</p>
                    </div>
                    <Badge variant={font.isLoaded ? "default" : "secondary"}>
                      {font.isLoaded ? "Loaded" : "Loading..."}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Format:</span> {getFontFormat(font.name)}
                    </div>
                    {font.file && (
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Size:</span> {formatFileSize(font.file.size)}
                      </div>
                    )}
                  </div>

                  <div 
                    className="text-sm mb-4 p-2 bg-gray-50 rounded border"
                    style={{ fontFamily: font.family }}
                  >
                    {getFontPreviewText()}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewFont(font)}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFont(font)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Fonts</CardTitle>
          <p className="text-sm text-gray-600">Pre-installed fonts available on all devices</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {systemFonts.slice(0, 24).map((font, index) => (
              <div key={index} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                <div 
                  className="text-sm font-medium text-gray-900 mb-2"
                  style={{ fontFamily: font }}
                >
                  {font}
                </div>
                <div 
                  className="text-xs text-gray-500"
                  style={{ fontFamily: font }}
                >
                  Aa Bb Cc
                </div>
              </div>
            ))}
          </div>
          {systemFonts.length > 24 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Showing 24 of {systemFonts.length} system fonts
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Font Preview</DialogTitle>
            <DialogDescription>
              Preview how your custom font looks in different sizes and styles
            </DialogDescription>
          </DialogHeader>
          
          {selectedFont && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 
                    className="text-xl font-bold"
                    style={{ fontFamily: selectedFont.family }}
                  >
                    {selectedFont.family}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedFont.name}</p>
                </div>
                <Badge variant={selectedFont.isLoaded ? "default" : "secondary"}>
                  {selectedFont.isLoaded ? "Loaded" : "Loading..."}
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Sample Text</h4>
                  <div 
                    className="text-lg leading-relaxed"
                    style={{ fontFamily: selectedFont.family }}
                  >
                    {getFontPreviewText()}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Different Sizes</h4>
                  <div className="space-y-2">
                    {[12, 16, 20, 24, 32, 48].map((size) => (
                      <div
                        key={size}
                        style={{ 
                          fontFamily: selectedFont.family,
                          fontSize: `${size}px`
                        }}
                        className="text-gray-900"
                      >
                        {size}px - The quick brown fox jumps over the lazy dog
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Numbers & Symbols</h4>
                  <div 
                    className="text-lg"
                    style={{ fontFamily: selectedFont.family }}
                  >
                    0123456789 !@#$%^&*()_+-=[]{}|;':",./&lt;&gt;?
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {uploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <div>
                <h3 className="text-lg font-medium">Uploading Font</h3>
                <p className="text-sm text-gray-500">Please wait...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 