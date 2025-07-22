/**
 * QR Code Generator Component
 * Generates QR codes for template sharing
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCode, Download } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeGeneratorProps {
  url: string;
  templateName?: string;
}

export default function QRCodeGenerator({ url, templateName }: QRCodeGeneratorProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      // Dynamic import of qrcode library
      const QRCode = (await import('qrcode')).default;
      
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `${templateName || 'template'}-qr-code.png`;
    link.href = qrCodeDataUrl;
    link.click();
    
    toast.success('QR code downloaded successfully!');
  };

  useEffect(() => {
    if (url) {
      generateQRCode();
    }
  }, [url]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="mr-2 h-4 w-4" />
          QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code for Sharing</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Scan to Access Template</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {isGenerating ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : qrCodeDataUrl ? (
                <div className="space-y-4">
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code"
                    className="mx-auto border rounded-lg"
                    style={{ width: '200px', height: '200px' }}
                  />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Scan this QR code to access the template
                    </p>
                    <Button onClick={downloadQRCode} size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download QR Code
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500">Failed to generate QR code</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="text-xs text-gray-500 text-center">
            <p>Share this QR code to let others easily access your template</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 