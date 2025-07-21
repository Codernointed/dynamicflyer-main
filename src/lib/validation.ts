
export const validateImage = (file: File): Promise<{ valid: boolean; error?: string }> => {
  return new Promise((resolve) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      resolve({ valid: false, error: 'Please upload an image file' });
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      resolve({ valid: false, error: 'Image size should be less than 10MB' });
      return;
    }
    
    // Check dimensions
    const img = new Image();
    
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      if (img.width < 800 || img.height < 980) {
        resolve({ 
          valid: false, 
          error: `Image dimensions are ${img.width}x${img.height}px. Minimum required is 800x980px.` 
        });
        return;
      }
      
      // Image is valid
      resolve({ valid: true });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve({ valid: false, error: 'Failed to load image' });
    };
    
    img.src = URL.createObjectURL(file);
  });
};
