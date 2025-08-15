/**
 * Watermark System
 * Adds watermarks to exports based on subscription tier
 */

export interface WatermarkConfig {
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  opacity: number;
  rotation: number;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'diagonal';
  spacing: number;
}

export const DEFAULT_WATERMARK: WatermarkConfig = {
  text: 'Generated with GenEdit',
  fontSize: 24,
  fontFamily: 'Arial, sans-serif',
  color: '#000000',
  opacity: 0.3,
  rotation: -45,
  position: 'diagonal',
  spacing: 100,
};

export const SUBSCRIPTION_WATERMARKS = {
  free: {
    ...DEFAULT_WATERMARK,
    text: 'Infinity Generation',
    fontSize: 10,
    opacity: 0.2,
    position: 'bottom-right',
    rotation: 0,
    spacing: 20,
  },
  student_pro: {
    ...DEFAULT_WATERMARK,
    text: 'Generated with GenEdit - Student Pro',
    fontSize: 20,
    opacity: 0.2,
    spacing: 120,
  },
  creator_pro: {
    ...DEFAULT_WATERMARK,
    text: 'Generated with GenEdit - Creator Pro',
    fontSize: 16,
    opacity: 0.15,
    spacing: 150,
  },
  department: {
    ...DEFAULT_WATERMARK,
    text: 'Generated with GenEdit - Department',
    fontSize: 18,
    opacity: 0.18,
    spacing: 130,
  },
  church: {
    ...DEFAULT_WATERMARK,
    text: 'Generated with GenEdit - Church',
    fontSize: 18,
    opacity: 0.18,
    spacing: 130,
  },
  faculty: {
    ...DEFAULT_WATERMARK,
    text: 'Generated with GenEdit - Faculty',
    fontSize: 18,
    opacity: 0.18,
    spacing: 130,
  },
};

/**
 * Add watermark to canvas
 */
export function addWatermarkToCanvas(
  canvas: HTMLCanvasElement,
  subscriptionTier: keyof typeof SUBSCRIPTION_WATERMARKS = 'free',
  customText?: string
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const watermark = SUBSCRIPTION_WATERMARKS[subscriptionTier];
  const text = customText || watermark.text;
  
  // Create a new canvas with watermark
  const watermarkedCanvas = document.createElement('canvas');
  watermarkedCanvas.width = canvas.width;
  watermarkedCanvas.height = canvas.height;
  const watermarkedCtx = watermarkedCanvas.getContext('2d');
  
  if (!watermarkedCtx) return canvas;

  // Draw original content
  watermarkedCtx.drawImage(canvas, 0, 0);

  // Apply watermark
  applyWatermark(watermarkedCtx, text, watermark as WatermarkConfig, canvas.width, canvas.height);

  return watermarkedCanvas;
}

/**
 * Apply watermark to context
 */
function applyWatermark(
  ctx: CanvasRenderingContext2D,
  text: string,
  config: WatermarkConfig,
  width: number,
  height: number
): void {
  ctx.save();
  
  // Set watermark properties
  ctx.font = `${config.fontSize}px ${config.fontFamily}`;
  ctx.fillStyle = config.color;
  ctx.globalAlpha = config.opacity;
  
  // Calculate positions based on config
  const positions = calculateWatermarkPositions(config, width, height, config.spacing);
  
  // Draw watermarks at each position
  positions.forEach(pos => {
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate((config.rotation * Math.PI) / 180);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  });
  
  ctx.restore();
}

/**
 * Calculate watermark positions
 */
function calculateWatermarkPositions(
  config: WatermarkConfig,
  width: number,
  height: number,
  spacing: number
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  
  switch (config.position) {
    case 'center':
      positions.push({ x: width / 2, y: height / 2 });
      break;
      
    case 'top-left':
      positions.push({ x: spacing, y: spacing });
      break;
      
    case 'top-right':
      positions.push({ x: width - spacing, y: spacing });
      break;
      
    case 'bottom-left':
      positions.push({ x: spacing, y: height - spacing });
      break;
      
    case 'bottom-right':
      positions.push({ x: width - spacing, y: height - spacing });
      break;
      
    case 'diagonal':
    default:
      // Create diagonal pattern
      for (let x = -width; x < width * 2; x += spacing) {
        for (let y = -height; y < height * 2; y += spacing) {
          if (Math.abs(x - y) < spacing / 2) {
            positions.push({ x, y });
          }
        }
      }
      break;
  }
  
  return positions;
}

/**
 * Add watermark to image data
 */
export function addWatermarkToImageData(
  imageData: ImageData,
  subscriptionTier: keyof typeof SUBSCRIPTION_WATERMARKS = 'free',
  customText?: string
): ImageData {
  // Convert ImageData to canvas for watermarking
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return imageData;
  
  // Put image data on canvas
  ctx.putImageData(imageData, 0, 0);
  
  // Add watermark
  const watermarkedCanvas = addWatermarkToCanvas(canvas, subscriptionTier, customText);
  
  // Get watermarked image data
  const watermarkedCtx = watermarkedCanvas.getContext('2d');
  if (!watermarkedCtx) return imageData;
  
  return watermarkedCtx.getImageData(0, 0, imageData.width, imageData.height);
}

/**
 * Check if watermark should be applied
 */
export function shouldApplyWatermark(subscriptionTier: string): boolean {
  return subscriptionTier === 'free';
}

/**
 * Get watermark text for subscription tier
 */
export function getWatermarkText(subscriptionTier: string): string {
  const watermark = SUBSCRIPTION_WATERMARKS[subscriptionTier as keyof typeof SUBSCRIPTION_WATERMARKS];
  return watermark ? watermark.text : DEFAULT_WATERMARK.text;
}

/**
 * Create subtle pattern watermark for free users
 */
export function createPatternWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  subscriptionTier: string
): void {
  if (subscriptionTier !== 'free') return;
  
  ctx.save();
  ctx.globalAlpha = 0.05;
  
  // Create subtle diagonal lines
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  
  for (let i = 0; i < width + height; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(0, i);
    ctx.stroke();
  }
  
  ctx.restore();
}
