
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
