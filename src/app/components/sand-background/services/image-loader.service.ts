import { RGBAColor } from '../models/sand-grain.model';

export interface ImageGrainData {
  x: number;
  y: number;
  color: RGBAColor;
}

export interface ImageSampleResult {
  grains: ImageGrainData[];
  cols: number;
  rows: number;
}

export class ImageLoaderService {
  /**
   * Load an image and sample it at the target resolution to create grain data
   */
  async loadImageAsGrains(imageSrc: string, targetWidth: number): Promise<ImageSampleResult> {
    const img = await this.loadImage(imageSrc);

    const aspectRatio = img.width / img.height;
    const targetHeight = Math.round(targetWidth / aspectRatio);

    // Create offscreen canvas to sample pixels
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Draw image scaled to target size
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Sample pixels
    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const grains: ImageGrainData[] = [];

    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const idx = (y * targetWidth + x) * 4;

        const r = imageData.data[idx] / 255;
        const g = imageData.data[idx + 1] / 255;
        const b = imageData.data[idx + 2] / 255;

        grains.push({
          x,
          y,
          color: [
            Math.round(r * 1000) / 1000,
            Math.round(g * 1000) / 1000,
            Math.round(b * 1000) / 1000,
            1
          ] as RGBAColor
        });
      }
    }

    return {
      grains,
      cols: targetWidth,
      rows: targetHeight
    };
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }
}
