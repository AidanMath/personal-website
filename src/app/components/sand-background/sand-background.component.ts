import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  HostListener,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SandGrain, SandGrid } from './models';
import { SunsetColorService, SandPhysicsService, MouseInteractionService } from './services';

interface SimulationConfig {
  pixelSize: number;
  rowsPerWave: number;
  waveDelayMs: number;
  backgroundColor: string;
}

const DEFAULT_CONFIG: SimulationConfig = {
  pixelSize: 5,
  rowsPerWave: 5,
  waveDelayMs: 150,
  backgroundColor: '#010105',
};

@Component({
  selector: 'app-sand-background',
  imports: [CommonModule],
  templateUrl: './sand-background.component.html',
  styleUrl: './sand-background.component.scss'
})
export class SandBackgroundComponent implements AfterViewInit, OnDestroy {
  @ViewChild('sandCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private grains: SandGrain[] = [];
  private grid!: SandGrid;
  private animationId: number | null = null;
  private startTime = 0;

  private readonly config = DEFAULT_CONFIG;
  private readonly colorService = new SunsetColorService();
  private readonly physicsService = new SandPhysicsService();
  private readonly mouseService = new MouseInteractionService();

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.initCanvas();
    this.startTime = performance.now();
    this.createScene();
    this.startAnimation();
  }

  ngOnDestroy(): void {
    this.stopAnimation();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.initCanvas();
    this.createScene();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    this.mouseService.updateMousePosition(event.clientX, event.clientY, window.scrollY);
  }

  private initCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    this.ctx = canvas.getContext('2d')!;
    this.ctx.scale(dpr, dpr);
  }

  private createScene(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Initialize grid
    const cols = Math.ceil(width / this.config.pixelSize);
    const rows = Math.ceil(height / this.config.pixelSize);
    this.grid = new SandGrid(cols, rows);

    // Initialize color service
    this.colorService.initialize(width, height);

    // Create grains
    this.grains = this.createGrains(cols, rows);
  }

  private createGrains(cols: number, rows: number): SandGrain[] {
    const grains: SandGrain[] = [];

    for (let targetRow = 0; targetRow < rows; targetRow++) {
      for (let col = 0; col < cols; col++) {
        const x = col * this.config.pixelSize;
        const y = targetRow * this.config.pixelSize;
        const color = this.colorService.getColorAt(x, y);
        const delay = this.calculateDelay(targetRow, rows);

        grains.push(new SandGrain({ col, targetRow, color, delay }));
      }
    }

    return grains;
  }

  private calculateDelay(targetRow: number, totalRows: number): number {
    // Bottom rows fall first
    const rowFromBottom = totalRows - 1 - targetRow;
    const waveNumber = Math.floor(rowFromBottom / this.config.rowsPerWave);
    return waveNumber * this.config.waveDelayMs + Math.random() * 80;
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
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(this.animate);
  };

  private update(): void {
    const currentTime = performance.now() - this.startTime;

    // Process mouse interaction first
    this.mouseService.processInteraction(this.grains, this.grid, this.config.pixelSize);
    this.mouseService.decayVelocity();

    // Update physics
    this.physicsService.updateGrains(this.grains, this.grid, currentTime);
  }

  private draw(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Clear with background color
    this.ctx.fillStyle = this.config.backgroundColor;
    this.ctx.fillRect(0, 0, width, height);

    // Draw visible grains
    for (const grain of this.grains) {
      if (!grain.isVisible()) continue;

      this.ctx.fillStyle = grain.color;
      this.ctx.fillRect(
        grain.col * this.config.pixelSize,
        grain.row * this.config.pixelSize,
        this.config.pixelSize,
        this.config.pixelSize
      );
    }
  }
}
