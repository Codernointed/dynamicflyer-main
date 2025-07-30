
export const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: { width: number; height: number; x: number; y: number }
): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg');
};

// Helper function to create an image element from a URL
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', error => reject(error));
    image.src = url;
  });

// Calculate the proper scale to fit an image within a container while maintaining aspect ratio
export const calculateFitToContainer = (
  imageWidth: number,
  imageHeight: number,
  containerWidth: number,
  containerHeight: number
): number => {
  const imageRatio = imageWidth / imageHeight;
  const containerRatio = containerWidth / containerHeight;
  
  if (imageRatio > containerRatio) {
    // Image is wider than container relative to height
    return containerWidth / imageWidth;
  } else {
    // Image is taller than container relative to width
    return containerHeight / imageHeight;
  }
};

/**
 * Image utilities for consistent rendering across components
 */

/**
 * Draws a background image with consistent aspect ratio preservation
 * This ensures frame positions match between editor and public generator
 */
export const drawBackgroundImage = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number
) => {
  const imgAspectRatio = image.width / image.height;
  const canvasAspectRatio = canvasWidth / canvasHeight;
  
  let drawWidth, drawHeight, drawX, drawY;
  
  if (imgAspectRatio > canvasAspectRatio) {
    // Image is wider than canvas - fit to width
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imgAspectRatio;
    drawX = 0;
    drawY = (canvasHeight - drawHeight) / 2;
  } else {
    // Image is taller than canvas - fit to height
    drawHeight = canvasHeight;
    drawWidth = canvasHeight * imgAspectRatio;
    drawX = (canvasWidth - drawWidth) / 2;
    drawY = 0;
  }
  
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  
  return { drawX, drawY, drawWidth, drawHeight };
};

/**
 * Gets the actual content bounds of the background image (without white space)
 * This is used for cropping the final download to remove white space
 */
export const getContentBounds = (
  image: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number
) => {
  const imgAspectRatio = image.width / image.height;
  const canvasAspectRatio = canvasWidth / canvasHeight;
  
  let drawWidth, drawHeight, drawX, drawY;
  
  if (imgAspectRatio > canvasAspectRatio) {
    // Image is wider than canvas - fit to width
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imgAspectRatio;
    drawX = 0;
    drawY = (canvasHeight - drawHeight) / 2;
  } else {
    // Image is taller than canvas - fit to height
    drawHeight = canvasHeight;
    drawWidth = canvasHeight * imgAspectRatio;
    drawX = (canvasWidth - drawWidth) / 2;
    drawY = 0;
  }
  
  return {
    x: drawX,
    y: drawY,
    width: drawWidth,
    height: drawHeight
  };
};

/**
 * Creates a cropped canvas that removes white space and preserves actual template dimensions
 */
export const createCroppedCanvas = (
  sourceCanvas: HTMLCanvasElement,
  backgroundImage: HTMLImageElement
): HTMLCanvasElement => {
  const bounds = getContentBounds(backgroundImage, sourceCanvas.width, sourceCanvas.height);
  
  // Create new canvas with actual content dimensions
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');
  
  if (!croppedCtx) throw new Error('Failed to get cropped canvas context');
  
  // Set dimensions to actual content size
  croppedCanvas.width = bounds.width;
  croppedCanvas.height = bounds.height;
  
  // Draw the cropped portion
  croppedCtx.drawImage(
    sourceCanvas,
    bounds.x, bounds.y, bounds.width, bounds.height,
    0, 0, bounds.width, bounds.height
  );
  
  return croppedCanvas;
};

/**
 * Loads an image with proper error handling
 */
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Crops and scales an image to fit within a frame while maintaining aspect ratio
 */
export const cropImageToFrame = (
  image: HTMLImageElement,
  frameWidth: number,
  frameHeight: number
) => {
  const frameAspect = frameWidth / frameHeight;
  const imageAspect = image.width / image.height;
  
  let drawWidth = frameWidth;
  let drawHeight = frameHeight;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.width;
  let sourceHeight = image.height;

  if (imageAspect > frameAspect) {
    // Image is wider, crop sides
    sourceWidth = image.height * frameAspect;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    // Image is taller, crop top/bottom
    sourceHeight = image.width / frameAspect;
    sourceY = (image.height - sourceHeight) / 2;
  }

  return {
    drawWidth,
    drawHeight,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight
  };
};
