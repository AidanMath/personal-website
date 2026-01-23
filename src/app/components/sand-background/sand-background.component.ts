import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  HostListener,
  NgZone,
  Input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SandGrain, SandGrid } from './models';
import { SandPhysicsService, MouseInteractionService, ImageLoaderService } from './services';
import { SandRenderer } from './webgl/sand-renderer';

const BACKGROUND_COLOR: [number, number, number, number] = [0, 0, 0, 0]; // Transparent
const IMAGE_PATH = 'images/great-wave.jpg';
const WALL_BOTTOM = 0;  // No bottom wall - sand falls through

// Entrance animation settings
const FALL_IN_ENABLED = true;
const FALL_DURATION_FRAMES = 120; // ~2 seconds at 60fps

// Responsive breakpoints
const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1200,
  largeDesktop: 1920
};

@Component({
  selector: 'app-sand-background',
  imports: [CommonModule],
  templateUrl: './sand-background.component.html',
  styleUrl: './sand-background.component.scss'
})
export class SandBackgroundComponent implements AfterViewInit, OnDestroy {
  @ViewChild('sandCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() width: number = 0;
  @Input() height: number = 0;

  isLoaded = false;

  private renderer!: SandRenderer;
  private grains: SandGrain[] = [];
  private grid!: SandGrid;
  private animationId: number | null = null;
  private frameCount = 0;
  private currentPixelSize = 2;
  private resizeTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastWidth = 0;
  private lastHeight = 0;

  // Physics with support-based stability for tunnels and cliffs
  // Tuned: stable tunnels, but isolated pieces (circled) fall
  private readonly physicsService = new SandPhysicsService({
    enableGapFilling: true,
    gapFillChance: 0.003,  // 0.3% for supported grains (very stable)
    gapFillChanceUnsupported: 0.4,  // 40% for floating grains (fall when isolated)
    gravity: 0.5,
    terminalVelocity: 6,
    stabilityThreshold: 15,
    angleOfRepose: 3.0  // Higher = more stable slopes
  });
  private readonly mouseService = new MouseInteractionService();
  private readonly imageLoader = new ImageLoaderService();

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initialize();
    }, 100);
  }

  ngOnDestroy(): void {
    this.stopAnimation();
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    this.handlePointerMove(event.clientX, event.clientY);
  }

  @HostListener('document:touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.handlePointerMove(touch.clientX, touch.clientY);
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    // Debounce resize to avoid excessive redraws
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.resizeTimeout = setTimeout(() => {
      this.handleResize();
    }, 250);
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (document.hidden) {
      this.stopAnimation();
    } else {
      this.startAnimation();
    }
  }

  private handlePointerMove(clientX: number, clientY: number): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      this.mouseService.updateMousePosition(x, y, 0);
    }
  }

  private handleResize(): void {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement;
    const newWidth = this.width || container?.clientWidth || 800;
    const newHeight = this.height || container?.clientHeight || 600;

    // Only reinitialize if size changed significantly (more than 50px)
    if (Math.abs(newWidth - this.lastWidth) > 50 || Math.abs(newHeight - this.lastHeight) > 50) {
      this.lastWidth = newWidth;
      this.lastHeight = newHeight;
      this.reinitialize();
    }
  }

  private async reinitialize(): Promise<void> {
    this.stopAnimation();
    if (this.renderer) {
      this.renderer.dispose();
    }
    await this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const canvas = this.canvasRef.nativeElement;
      const container = canvas.parentElement;
      this.lastWidth = this.width || container?.clientWidth || 800;
      this.lastHeight = this.height || container?.clientHeight || 600;

      this.initRenderer();
      await this.createScene();
      this.startAnimation();
      this.isLoaded = true;
    } catch (error) {
      console.error('Failed to initialize sand:', error);
    }
  }

  private initRenderer(): void {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement;

    const width = this.width || container?.clientWidth || 800;
    const height = this.height || container?.clientHeight || 600;

    if (width === 0 || height === 0) return;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    if (this.renderer) {
      this.renderer.dispose();
    }

    this.currentPixelSize = this.getResponsivePixelSize();

    this.renderer = new SandRenderer(canvas, {
      pixelSize: this.currentPixelSize,
      backgroundColor: BACKGROUND_COLOR,
    });

    this.renderer.resize(width, height);
  }

  private getResponsivePixelSize(): number {
    const width = this.width || window.innerWidth;
    const height = this.height || window.innerHeight;
    const minDimension = Math.min(width, height);

    // Scale pixel size based on screen size for consistent grain density
    if (width < BREAKPOINTS.mobile || minDimension < 400) {
      return 4; // Larger pixels for small mobile screens
    }
    if (width < BREAKPOINTS.tablet) {
      return 3; // Medium pixels for tablets/large phones
    }
    if (width < BREAKPOINTS.desktop) {
      return 2; // Standard pixels for small desktops
    }
    if (width < BREAKPOINTS.largeDesktop) {
      return 2; // Standard for most desktops
    }
    return 2; // Keep consistent for very large screens
  }

  private async createScene(): Promise<void> {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement;

    const width = this.width || container?.clientWidth || 400;
    const height = this.height || container?.clientHeight || 400;

    if (width === 0 || height === 0) return;

    const cols = Math.ceil(width / this.currentPixelSize);
    const rows = Math.ceil(height / this.currentPixelSize);
    this.grid = new SandGrid(cols, rows);

    // Load image and set up walls at image edge
    this.grains = await this.createGrainsFromImage(cols, rows);
    this.frameCount = 0;
  }

  private async createGrainsFromImage(
    cols: number,
    rows: number
  ): Promise<SandGrain[]> {
    // Sample image at canvas resolution
    const result = await this.imageLoader.loadImageAsGrains(IMAGE_PATH, cols);
    const grains: SandGrain[] = [];

    // Calculate scaling to fit image to canvas
    const imageAspect = result.cols / result.rows;
    const canvasAspect = cols / rows;

    let scale: number;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasAspect > imageAspect) {
      // Canvas is wider than image - fit to height, center horizontally
      scale = rows / result.rows;
      const scaledWidth = Math.floor(result.cols * scale);
      offsetX = Math.floor((cols - scaledWidth) / 2);
    } else {
      // Canvas is taller than image - fit to width, center vertically
      scale = cols / result.cols;
      const scaledHeight = Math.floor(result.rows * scale);
      offsetY = Math.floor((rows - scaledHeight) / 2);
    }

    // Calculate actual image bounds
    const scaledWidth = Math.floor(result.cols * scale);
    const scaledHeight = Math.floor(result.rows * scale);
    const imageMinCol = offsetX;
    const imageMaxCol = offsetX + scaledWidth - 1;
    const imageMinRow = offsetY;
    const imageMaxRow = offsetY + scaledHeight - 1;

    // Set walls to be exactly at image edge
    this.grid.setWalls({
      left: imageMinCol,
      right: cols - 1 - imageMaxCol,
      bottom: WALL_BOTTOM,
      top: 0
    });

    // Pass wall config to renderer
    this.renderer.setWalls(this.grid.getWalls());

    const occupied = new Set<string>();

    for (const data of result.grains) {
      const col = Math.floor(data.x * scale) + offsetX;
      const row = Math.floor(data.y * scale) + offsetY;

      // Skip if outside image bounds
      if (col < imageMinCol || col > imageMaxCol || row < imageMinRow || row > imageMaxRow) continue;

      const key = `${col},${row}`;
      if (occupied.has(key)) continue;
      occupied.add(key);

      if (FALL_IN_ENABLED) {
        // Create smooth cascading wave pattern
        const normalizedY = (row - imageMinRow) / scaledHeight;
        const normalizedX = (col - imageMinCol) / scaledWidth;
        const invertedY = 1 - normalizedY;  // Bottom = low delay, Top = high delay

        // Multiple wave frequencies for organic ripple effect
        const wave1 = Math.sin(normalizedX * Math.PI * 2) * 0.08;
        const wave2 = Math.sin(normalizedX * Math.PI * 5 + normalizedY * 2) * 0.05;
        // Subtle randomness
        const randomness = Math.random() * 0.15;

        // Main delay based on Y position (bottom first) with wave modulation
        const delay = Math.floor((invertedY * 0.7 + wave1 + wave2 + randomness) * FALL_DURATION_FRAMES);

        const grain = new SandGrain({
          x: col,
          y: row,
          color: data.color,
          delay: Math.max(0, delay),
          startY: -5 - Math.random() * 10,
          startVy: 0,
          settled: false
        });

        grains.push(grain);
      } else {
        const grain = new SandGrain({
          x: col,
          y: row,
          color: data.color,
          delay: 0,
          startY: row,
          startVy: 0,
          settled: true
        });

        this.grid.placeGrain(grain);
        grains.push(grain);
      }
    }

    console.log(`Created ${grains.length} grains, scale: ${scale.toFixed(2)}, walls: left=${imageMinCol}, right=${cols - 1 - imageMaxCol}`);
    return grains;
  }

  private startAnimation(): void {
    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
  }

  private stopAnimation(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate = (): void => {
    this.frameCount++;
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(this.animate);
  };

  private update(): void {
    this.mouseService.processInteraction(this.grains, this.grid, this.currentPixelSize);
    this.mouseService.decayVelocity();
    this.physicsService.updateGrains(this.grains, this.grid, this.frameCount);
  }

  private draw(): void {
    this.renderer.updateGrains(this.grains);
    this.renderer.render();
  }
}
