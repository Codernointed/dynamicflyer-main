import jsPDF from 'jspdf';

interface PDFExportOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'A4' | 'A3' | 'Letter' | 'Custom';
  orientation?: 'portrait' | 'landscape';
  margin?: number;
  filename?: string;
}

/**
 * Convert canvas to PDF with high quality
 */
export const exportCanvasToPDF = async (
  canvas: HTMLCanvasElement,
  options: PDFExportOptions = {}
): Promise<void> => {
  const {
    width = 800,
    height = 600,
    quality = 1.0,
    format = 'A4',
    orientation = 'portrait',
    margin = 20,
    filename = 'flyer.pdf'
  } = options;

  try {
    // Get canvas data URL with high quality
    const dataURL = canvas.toDataURL('image/png', quality);
    
    // Create PDF document
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    });

    // Get PDF dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Calculate image dimensions to fit within margins
    const maxWidth = pdfWidth - (margin * 2);
    const maxHeight = pdfHeight - (margin * 2);

    // Calculate scaling to maintain aspect ratio
    const scaleX = maxWidth / width;
    const scaleY = maxHeight / height;
    const scale = Math.min(scaleX, scaleY);

    // Calculate final dimensions
    const finalWidth = width * scale;
    const finalHeight = height * scale;

    // Center the image on the page
    const x = (pdfWidth - finalWidth) / 2;
    const y = (pdfHeight - finalHeight) / 2;

    // Add image to PDF
    pdf.addImage(dataURL, 'PNG', x, y, finalWidth, finalHeight);

    // Save the PDF
    pdf.save(filename);

  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Failed to export PDF');
  }
};

/**
 * Export multiple canvases to a single PDF
 */
export const exportMultipleCanvasesToPDF = async (
  canvases: HTMLCanvasElement[],
  options: PDFExportOptions = {}
): Promise<void> => {
  const {
    width = 800,
    height = 600,
    quality = 1.0,
    format = 'A4',
    orientation = 'portrait',
    margin = 20,
    filename = 'flyers.pdf'
  } = options;

  try {
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const maxWidth = pdfWidth - (margin * 2);
    const maxHeight = pdfHeight - (margin * 2);
    const scaleX = maxWidth / width;
    const scaleY = maxHeight / height;
    const scale = Math.min(scaleX, scaleY);
    const finalWidth = width * scale;
    const finalHeight = height * scale;
    const x = (pdfWidth - finalWidth) / 2;
    const y = (pdfHeight - finalHeight) / 2;

    for (let i = 0; i < canvases.length; i++) {
      if (i > 0) {
        pdf.addPage();
      }

      const dataURL = canvases[i].toDataURL('image/png', quality);
      pdf.addImage(dataURL, 'PNG', x, y, finalWidth, finalHeight);
    }

    pdf.save(filename);

  } catch (error) {
    console.error('Error exporting multiple canvases to PDF:', error);
    throw new Error('Failed to export PDF');
  }
};

/**
 * Export canvas with custom dimensions
 */
export const exportCanvasToCustomPDF = async (
  canvas: HTMLCanvasElement,
  customWidth: number,
  customHeight: number,
  options: Omit<PDFExportOptions, 'format'> = {}
): Promise<void> => {
  const {
    quality = 1.0,
    orientation = 'portrait',
    margin = 20,
    filename = 'flyer.pdf'
  } = options;

  try {
    const dataURL = canvas.toDataURL('image/png', quality);
    
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: [customWidth, customHeight]
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const maxWidth = pdfWidth - (margin * 2);
    const maxHeight = pdfHeight - (margin * 2);

    const scaleX = maxWidth / canvas.width;
    const scaleY = maxHeight / canvas.height;
    const scale = Math.min(scaleX, scaleY);

    const finalWidth = canvas.width * scale;
    const finalHeight = canvas.height * scale;
    const x = (pdfWidth - finalWidth) / 2;
    const y = (pdfHeight - finalHeight) / 2;

    pdf.addImage(dataURL, 'PNG', x, y, finalWidth, finalHeight);
    pdf.save(filename);

  } catch (error) {
    console.error('Error exporting to custom PDF:', error);
    throw new Error('Failed to export PDF');
  }
};

/**
 * Get PDF export options for different formats
 */
export const getPDFExportOptions = (format: string) => {
  const options: Record<string, PDFExportOptions> = {
    'A4-Portrait': {
      format: 'A4',
      orientation: 'portrait',
      margin: 20
    },
    'A4-Landscape': {
      format: 'A4',
      orientation: 'landscape',
      margin: 20
    },
    'A3-Portrait': {
      format: 'A3',
      orientation: 'portrait',
      margin: 25
    },
    'A3-Landscape': {
      format: 'A3',
      orientation: 'landscape',
      margin: 25
    },
    'Letter-Portrait': {
      format: 'Letter',
      orientation: 'portrait',
      margin: 20
    },
    'Letter-Landscape': {
      format: 'Letter',
      orientation: 'landscape',
      margin: 20
    }
  };

  return options[format] || options['A4-Portrait'];
}; 