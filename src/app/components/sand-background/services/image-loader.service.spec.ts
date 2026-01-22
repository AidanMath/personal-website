import { ImageLoaderService, ImageSampleResult } from './image-loader.service';

describe('ImageLoaderService', () => {
  let service: ImageLoaderService;

  beforeEach(() => {
    service = new ImageLoaderService();
  });

  describe('loadImageAsGrains', () => {
    let mockCanvas: jasmine.SpyObj<HTMLCanvasElement>;
    let mockCtx: jasmine.SpyObj<CanvasRenderingContext2D>;
    let mockImage: HTMLImageElement;

    beforeEach(() => {
      // Mock canvas context
      mockCtx = jasmine.createSpyObj('CanvasRenderingContext2D', ['drawImage', 'getImageData']);

      // Mock canvas
      mockCanvas = jasmine.createSpyObj('HTMLCanvasElement', ['getContext']);
      mockCanvas.getContext.and.returnValue(mockCtx);

      // Override document.createElement for canvas
      spyOn(document, 'createElement').and.callFake((tagName: string) => {
        if (tagName === 'canvas') {
          return mockCanvas as unknown as HTMLElement;
        }
        return document.createElement(tagName);
      });
    });

    it('should sample image pixels and return grain data', async () => {
      // Mock image with 2x2 dimensions
      const imageWidth = 4;
      const imageHeight = 4;

      // Create mock image data (2x2 red pixels)
      const mockImageData = {
        data: new Uint8ClampedArray([
          255, 0, 0, 255,   // Red pixel (0,0)
          0, 255, 0, 255,   // Green pixel (1,0)
          0, 0, 255, 255,   // Blue pixel (0,1)
          255, 255, 0, 255  // Yellow pixel (1,1)
        ]),
        width: 2,
        height: 2
      };

      mockCtx.getImageData.and.returnValue(mockImageData as ImageData);

      // Mock the loadImage private method
      spyOn(service as any, 'loadImage').and.returnValue(
        Promise.resolve({ width: imageWidth, height: imageHeight } as HTMLImageElement)
      );

      const result = await service.loadImageAsGrains('test.png', 2);

      expect(result.cols).toBe(2);
      expect(result.rows).toBe(2);
      expect(result.grains.length).toBe(4);

      // Check first grain (red)
      expect(result.grains[0].x).toBe(0);
      expect(result.grains[0].y).toBe(0);
      expect(result.grains[0].color[0]).toBe(1); // R
      expect(result.grains[0].color[1]).toBe(0); // G
      expect(result.grains[0].color[2]).toBe(0); // B

      // Check second grain (green)
      expect(result.grains[1].x).toBe(1);
      expect(result.grains[1].y).toBe(0);
      expect(result.grains[1].color[0]).toBe(0); // R
      expect(result.grains[1].color[1]).toBe(1); // G
      expect(result.grains[1].color[2]).toBe(0); // B
    });

    it('should calculate correct aspect ratio', async () => {
      // Image with 2:1 aspect ratio (100x50)
      spyOn(service as any, 'loadImage').and.returnValue(
        Promise.resolve({ width: 100, height: 50 } as HTMLImageElement)
      );

      const mockImageData = {
        data: new Uint8ClampedArray(20 * 10 * 4).fill(128),
        width: 20,
        height: 10
      };
      mockCtx.getImageData.and.returnValue(mockImageData as ImageData);

      const result = await service.loadImageAsGrains('test.png', 20);

      expect(result.cols).toBe(20);
      expect(result.rows).toBe(10); // 20 / 2 = 10
    });

    it('should throw error when canvas context is unavailable', async () => {
      mockCanvas.getContext.and.returnValue(null);

      spyOn(service as any, 'loadImage').and.returnValue(
        Promise.resolve({ width: 100, height: 100 } as HTMLImageElement)
      );

      await expectAsync(service.loadImageAsGrains('test.png', 10))
        .toBeRejectedWithError('Could not get canvas context');
    });

    it('should normalize color values to 0-1 range with 3 decimal precision', async () => {
      spyOn(service as any, 'loadImage').and.returnValue(
        Promise.resolve({ width: 1, height: 1 } as HTMLImageElement)
      );

      // RGB value of 128 should become ~0.502
      const mockImageData = {
        data: new Uint8ClampedArray([128, 128, 128, 255]),
        width: 1,
        height: 1
      };
      mockCtx.getImageData.and.returnValue(mockImageData as ImageData);

      const result = await service.loadImageAsGrains('test.png', 1);

      expect(result.grains[0].color[0]).toBe(0.502);
      expect(result.grains[0].color[1]).toBe(0.502);
      expect(result.grains[0].color[2]).toBe(0.502);
      expect(result.grains[0].color[3]).toBe(1);
    });
  });

  describe('loadImage (private)', () => {
    it('should resolve with image element on successful load', async () => {
      // Access the private method
      const loadImage = (service as any).loadImage.bind(service);

      // Create a mock that simulates successful image load
      const originalImage = window.Image;
      let capturedOnload: (() => void) | null = null;

      (window as any).Image = class MockImage {
        crossOrigin = '';
        src = '';
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;

        constructor() {
          setTimeout(() => {
            capturedOnload = this.onload;
            if (this.onload) this.onload();
          }, 0);
        }
      };

      const promise = loadImage('test.png');
      const result = await promise;

      expect(result).toBeTruthy();

      window.Image = originalImage;
    });

    it('should reject on image load error', async () => {
      const loadImage = (service as any).loadImage.bind(service);

      const originalImage = window.Image;

      (window as any).Image = class MockImage {
        crossOrigin = '';
        src = '';
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;

        constructor() {
          setTimeout(() => {
            if (this.onerror) this.onerror();
          }, 0);
        }
      };

      await expectAsync(loadImage('invalid.png'))
        .toBeRejectedWithError('Failed to load image: invalid.png');

      window.Image = originalImage;
    });
  });
});
