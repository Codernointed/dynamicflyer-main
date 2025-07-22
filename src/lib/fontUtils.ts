/**
 * Font Management Utilities
 * Handle custom font upload, loading, and application
 */

export interface CustomFont {
  id: string;
  name: string;
  family: string;
  url: string;
  weight?: string;
  style?: string;
  isLoaded: boolean;
  file?: File;
}

export interface FontValidationResult {
  isValid: boolean;
  error?: string;
  fontFamily?: string;
  weight?: string;
  style?: string;
}

/**
 * Validate font file
 */
export const validateFontFile = (file: File): FontValidationResult => {
  const validTypes = [
    'font/woff',
    'font/woff2',
    'font/ttf',
    'font/otf',
    'application/font-woff',
    'application/font-woff2',
    'application/x-font-ttf',
    'application/x-font-otf'
  ];

  const validExtensions = ['.woff', '.woff2', '.ttf', '.otf'];

  // Check file type
  if (!validTypes.includes(file.type) && !validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
    return {
      isValid: false,
      error: 'Invalid font file type. Please upload WOFF, WOFF2, TTF, or OTF files.'
    };
  }

  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return {
      isValid: false,
      error: 'Font file is too large. Please upload a file smaller than 10MB.'
    };
  }

  // Extract font family name from filename
  const fontFamily = file.name
    .replace(/\.(woff|woff2|ttf|otf)$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return {
    isValid: true,
    fontFamily,
    weight: 'normal',
    style: 'normal'
  };
};

/**
 * Load custom font into the document
 */
export const loadCustomFont = async (font: CustomFont): Promise<boolean> => {
  try {
    // Create font face
    const fontFace = new FontFace(font.family, `url(${font.url})`, {
      weight: font.weight || 'normal',
      style: font.style || 'normal'
    });

    // Load the font
    const loadedFont = await fontFace.load();
    
    // Add to document fonts
    document.fonts.add(loadedFont);
    
    return true;
  } catch (error) {
    console.error('Error loading font:', error);
    return false;
  }
};

/**
 * Load font from file and create object URL
 */
export const loadFontFromFile = async (file: File): Promise<CustomFont> => {
  const validation = validateFontFile(file);
  
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const fontId = `custom-font-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const url = URL.createObjectURL(file);

  const font: CustomFont = {
    id: fontId,
    name: file.name,
    family: validation.fontFamily!,
    url,
    weight: validation.weight,
    style: validation.style,
    isLoaded: false,
    file
  };

  // Load the font
  const success = await loadCustomFont(font);
  font.isLoaded = success;

  return font;
};

/**
 * Get all available fonts (system + custom)
 */
export const getAvailableFonts = (): string[] => {
  const systemFonts = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Verdana',
    'Tahoma',
    'Trebuchet MS',
    'Impact',
    'Comic Sans MS',
    'Courier New',
    'Lucida Console',
    'Palatino',
    'Garamond',
    'Bookman',
    'Avant Garde',
    'Arial Black',
    'Arial Narrow',
    'Century Gothic',
    'Franklin Gothic Medium',
    'Gill Sans'
  ];

  // Get custom fonts from localStorage
  const customFonts = getCustomFonts();
  const customFontNames = customFonts.map(font => font.family);

  return [...systemFonts, ...customFontNames];
};

/**
 * Save custom font to localStorage
 */
export const saveCustomFont = (font: CustomFont): void => {
  try {
    const existingFonts = getCustomFonts();
    const updatedFonts = [...existingFonts.filter(f => f.id !== font.id), font];
    localStorage.setItem('customFonts', JSON.stringify(updatedFonts));
  } catch (error) {
    console.error('Error saving font:', error);
  }
};

/**
 * Get custom fonts from localStorage
 */
export const getCustomFonts = (): CustomFont[] => {
  try {
    const fonts = localStorage.getItem('customFonts');
    return fonts ? JSON.parse(fonts) : [];
  } catch (error) {
    console.error('Error loading fonts:', error);
    return [];
  }
};

/**
 * Delete custom font
 */
export const deleteCustomFont = (fontId: string): void => {
  try {
    const fonts = getCustomFonts();
    const fontToDelete = fonts.find(f => f.id === fontId);
    
    if (fontToDelete) {
      // Revoke object URL to free memory
      URL.revokeObjectURL(fontToDelete.url);
    }

    const updatedFonts = fonts.filter(f => f.id !== fontId);
    localStorage.setItem('customFonts', JSON.stringify(updatedFonts));
  } catch (error) {
    console.error('Error deleting font:', error);
  }
};

/**
 * Apply font to canvas context
 */
export const applyFontToContext = (
  ctx: CanvasRenderingContext2D,
  fontFamily: string,
  fontSize: number,
  fontWeight: string = 'normal',
  fontStyle: string = 'normal'
): void => {
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}"`;
};

/**
 * Check if font is loaded
 */
export const isFontLoaded = (fontFamily: string): boolean => {
  return document.fonts.check(`12px "${fontFamily}"`);
};

/**
 * Wait for font to load
 */
export const waitForFontLoad = (fontFamily: string, timeout: number = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    if (isFontLoaded(fontFamily)) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    const checkFont = () => {
      if (isFontLoaded(fontFamily)) {
        resolve(true);
        return;
      }

      if (Date.now() - startTime > timeout) {
        resolve(false);
        return;
      }

      setTimeout(checkFont, 100);
    };

    checkFont();
  });
};

/**
 * Get font preview text
 */
export const getFontPreviewText = (): string => {
  return 'The quick brown fox jumps over the lazy dog 0123456789';
};

/**
 * Generate font CSS
 */
export const generateFontCSS = (font: CustomFont): string => {
  return `
@font-face {
  font-family: "${font.family}";
  src: url("${font.url}") format("${getFontFormat(font.url)}");
  font-weight: ${font.weight || 'normal'};
  font-style: ${font.style || 'normal'};
}`;
};

/**
 * Get font format from URL
 */
const getFontFormat = (url: string): string => {
  if (url.includes('.woff2')) return 'woff2';
  if (url.includes('.woff')) return 'woff';
  if (url.includes('.ttf')) return 'truetype';
  if (url.includes('.otf')) return 'opentype';
  return 'woff2';
}; 