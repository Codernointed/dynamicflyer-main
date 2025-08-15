/**
 * Export System
 * Handles template exports with watermarking and format options
 */

import { addWatermarkToCanvas, shouldApplyWatermark } from './watermark';
import { checkFeatureAccess } from './featureGating';
import { trackUsage } from './usageTracking';
import { toast } from 'sonner';

export interface ExportOptions {
  format: 'png' | 'jpg' | 'pdf' | 'webp';
  quality: number; // 0-100
  resolution: 'low' | 'medium' | 'high' | 'ultra';
  watermark: boolean;
  filename?: string;
}

export interface ExportResult {
  success: boolean;
  data?: Blob | string;
  error?: string;
  filename?: string;
}

export const EXPORT_RESOLUTIONS = {
  low: { width: 600, height: 400, scale: 0.5 },
  medium: { width: 1200, height: 800, scale: 1.0 },
  high: { width: 2400, height: 1600, scale: 2.0 },
  ultra: { width: 4800, height: 3200, scale: 4.0 },
};

/**
 * Export template with options
 */
export async function exportTemplate(
  canvas: HTMLCanvasElement,
  options: ExportOptions,
  subscriptionTier: string,
  userId: string
): Promise<ExportResult> {
  try {
    // Check if user can export
    if (!checkFeatureAccess('export_template', subscriptionTier)) {
      return {
        success: false,
        error: 'Export not allowed with current plan'
      };
    }

    // Check high-resolution export access
    if (options.resolution === 'high' || options.resolution === 'ultra') {
      if (!checkFeatureAccess('high_res_export', subscriptionTier)) {
        return {
          success: false,
          error: 'High-resolution export requires Student Pro or higher'
        };
      }
    }

    // Check PDF export access
    if (options.format === 'pdf') {
      if (!checkFeatureAccess('pdf_export', subscriptionTier)) {
        return {
          success: false,
          error: 'PDF export requires Creator Pro or higher'
        };
      }
    }

    // Create export canvas with proper resolution
    const exportCanvas = createExportCanvas(canvas, options.resolution);
    
    // Apply watermark if needed
    let finalCanvas = exportCanvas;
    if (options.watermark && shouldApplyWatermark(subscriptionTier)) {
      finalCanvas = addWatermarkToCanvas(exportCanvas, subscriptionTier);
    }

    // Export based on format
    let exportData: Blob | string;
    let filename: string;

    switch (options.format) {
      case 'png':
        exportData = await exportToPNG(finalCanvas, options.quality);
        filename = `${options.filename || 'template'}.png`;
        break;
        
      case 'jpg':
        exportData = await exportToJPG(finalCanvas, options.quality);
        filename = `${options.filename || 'template'}.jpg`;
        break;
        
      case 'webp':
        exportData = await exportToWebP(finalCanvas, options.quality);
        filename = `${options.filename || 'template'}.webp`;
        break;
        
      case 'pdf':
        exportData = await exportToPDF(finalCanvas, options);
        filename = `${options.filename || 'template'}.pdf`;
        break;
        
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    // Track usage
    await trackUsage(userId, {
      action: 'template_exported',
      metadata: {
        format: options.format,
        resolution: options.resolution,
        quality: options.quality,
        watermark: options.watermark,
      }
    }, subscriptionTier, {} as any);

    return {
      success: true,
      data: exportData,
      filename
    };

  } catch (error: any) {
    console.error('Export failed:', error);
    return {
      success: false,
      error: error.message || 'Export failed'
    };
  }
}

/**
 * Create export canvas with proper resolution
 */
function createExportCanvas(
  sourceCanvas: HTMLCanvasElement,
  resolution: keyof typeof EXPORT_RESOLUTIONS
): HTMLCanvasElement {
  const res = EXPORT_RESOLUTIONS[resolution];
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = res.width;
  exportCanvas.height = res.height;
  
  const ctx = exportCanvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  
  // Enable image smoothing for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Draw source canvas scaled to target resolution
  ctx.drawImage(
    sourceCanvas,
    0, 0, sourceCanvas.width, sourceCanvas.height,
    0, 0, res.width, res.height
  );
  
  return exportCanvas;
}

/**
 * Export to PNG
 */
async function exportToPNG(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create PNG blob'));
        },
        'image/png',
        quality / 100
      );
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Export to JPG
 */
async function exportToJPG(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create JPG blob'));
        },
        'image/jpeg',
        quality / 100
      );
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Export to WebP
 */
async function exportToWebP(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create WebP blob'));
        },
        'image/webp',
        quality / 100
      );
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Export to PDF
 */
async function exportToPDF(canvas: HTMLCanvasElement, options: ExportOptions): Promise<string> {
  // This is a simplified PDF export
  // In production, you'd use a proper PDF library like jsPDF or pdfmake
  
  try {
    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL('image/png', options.quality / 100);
    
    // For now, return the data URL
    // You can implement proper PDF generation here
    return dataUrl;
  } catch (error) {
    throw new Error('PDF export not implemented yet');
  }
}

/**
 * Download exported file
 */
export function downloadExport(
  data: Blob | string,
  filename: string,
  format: string
): void {
  try {
    if (data instanceof Blob) {
      // Download blob
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (typeof data === 'string') {
      // Download data URL
      const link = document.createElement('a');
      link.href = data;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    toast.success(`Template exported successfully as ${format.toUpperCase()}`);
  } catch (error) {
    console.error('Download failed:', error);
    toast.error('Failed to download exported file');
  }
}

/**
 * Get available export formats for subscription tier
 */
export function getAvailableExportFormats(subscriptionTier: string): string[] {
  const formats = ['png', 'jpg', 'webp'];
  
  if (subscriptionTier === 'creator_pro' || 
      subscriptionTier === 'department' || 
      subscriptionTier === 'church' || 
      subscriptionTier === 'faculty') {
    formats.push('pdf');
  }
  
  return formats;
}

/**
 * Get available resolutions for subscription tier
 */
export function getAvailableResolutions(subscriptionTier: string): string[] {
  const resolutions = ['low', 'medium'];
  
  if (subscriptionTier === 'student_pro' || 
      subscriptionTier === 'creator_pro' || 
      subscriptionTier === 'department' || 
      subscriptionTier === 'church' || 
      subscriptionTier === 'faculty') {
    resolutions.push('high');
  }
  
  if (subscriptionTier === 'creator_pro' || 
      subscriptionTier === 'department' || 
      subscriptionTier === 'church' || 
      subscriptionTier === 'faculty') {
    resolutions.push('ultra');
  }
  
  return resolutions;
}

/**
 * Get default export options for subscription tier
 */
export function getDefaultExportOptions(subscriptionTier: string): ExportOptions {
  return {
    format: 'png',
    quality: subscriptionTier === 'free' ? 80 : 95,
    resolution: subscriptionTier === 'free' ? 'medium' : 'high',
    watermark: subscriptionTier === 'free',
    filename: 'template',
  };
}

/**
 * Validate export options
 */
export function validateExportOptions(
  options: ExportOptions,
  subscriptionTier: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check format availability
  const availableFormats = getAvailableExportFormats(subscriptionTier);
  if (!availableFormats.includes(options.format)) {
    errors.push(`${options.format.toUpperCase()} export not available with your plan`);
  }
  
  // Check resolution availability
  const availableResolutions = getAvailableResolutions(subscriptionTier);
  if (!availableResolutions.includes(options.resolution)) {
    errors.push(`${options.resolution} resolution not available with your plan`);
  }
  
  // Check quality range
  if (options.quality < 1 || options.quality > 100) {
    errors.push('Quality must be between 1 and 100');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
