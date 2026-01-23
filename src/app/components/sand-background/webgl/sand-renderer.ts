import { SandGrain } from '../models/sand-grain.model';
import { WallConfig } from '../models/sand-grid.model';
import { SAND_VERTEX_SHADER, SAND_FRAGMENT_SHADER, createProgram } from './shaders';

export interface RendererConfig {
  pixelSize: number;
  backgroundColor: [number, number, number, number];
  wallColor: [number, number, number, number];
}

const DEFAULT_CONFIG: RendererConfig = {
  pixelSize: 2,
  backgroundColor: [0.004, 0.004, 0.02, 1.0],
  wallColor: [0.039, 0.039, 0.039, 1.0], // #0a0a0a - matches content background
};

export class SandRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private quadBuffer: WebGLBuffer;
  private offsetBuffer: WebGLBuffer;
  private colorBuffer: WebGLBuffer;
  private grainCount = 0;
  private config: RendererConfig;
  private walls: WallConfig = { left: 0, right: 0, bottom: 0, top: 0 };
  private wallGrains: { x: number; y: number }[] = [];

  // Pre-allocated buffers to avoid GC stuttering
  private offsetData: Float32Array;
  private colorData: Float32Array;
  private bufferCapacity = 0;

  // Uniform locations
  private resolutionLocation: WebGLUniformLocation;
  private pixelSizeLocation: WebGLUniformLocation;

  constructor(canvas: HTMLCanvasElement, config: Partial<RendererConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    const gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });

    if (!gl) {
      throw new Error('WebGL 2 not supported');
    }

    this.gl = gl;

    // Create shader program
    this.program = createProgram(gl, SAND_VERTEX_SHADER, SAND_FRAGMENT_SHADER);

    // Get uniform locations
    this.resolutionLocation = gl.getUniformLocation(this.program, 'u_resolution')!;
    this.pixelSizeLocation = gl.getUniformLocation(this.program, 'u_pixelSize')!;

    // Create VAO
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);

    // Create quad buffer (unit square, will be scaled by pixel size)
    this.quadBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    const quadVertices = new Float32Array([
      0, 0,  // bottom-left
      1, 0,  // bottom-right
      0, 1,  // top-left
      0, 1,  // top-left
      1, 0,  // bottom-right
      1, 1,  // top-right
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    // Set up quad attribute
    const positionLoc = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Create instance buffers
    this.offsetBuffer = gl.createBuffer()!;
    this.colorBuffer = gl.createBuffer()!;

    // Set up offset attribute (per-instance)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.offsetBuffer);
    const offsetLoc = gl.getAttribLocation(this.program, 'a_offset');
    gl.enableVertexAttribArray(offsetLoc);
    gl.vertexAttribPointer(offsetLoc, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(offsetLoc, 1);

    // Set up color attribute (per-instance)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    const colorLoc = gl.getAttribLocation(this.program, 'a_color');
    gl.enableVertexAttribArray(colorLoc);
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(colorLoc, 1);

    gl.bindVertexArray(null);

    // Set clear color to transparent so elements below canvas show through
    gl.clearColor(0, 0, 0, 0);

    // Initialize buffers with reasonable capacity
    this.bufferCapacity = 50000;
    this.offsetData = new Float32Array(this.bufferCapacity * 2);
    this.colorData = new Float32Array(this.bufferCapacity * 4);
  }

  setWalls(walls: WallConfig): void {
    this.walls = walls;
    this.generateWallGrains();
  }

  private generateWallGrains(): void {
    this.wallGrains = [];
    const cols = Math.ceil(this.gl.canvas.width / this.config.pixelSize);
    const rows = Math.ceil(this.gl.canvas.height / this.config.pixelSize);

    console.log(`Generating walls: cols=${cols}, rows=${rows}, walls=`, this.walls);

    // Left wall
    for (let col = 0; col < this.walls.left; col++) {
      for (let row = 0; row < rows; row++) {
        this.wallGrains.push({ x: col, y: row });
      }
    }

    // Right wall
    for (let col = cols - this.walls.right; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        this.wallGrains.push({ x: col, y: row });
      }
    }

    // Bottom wall (between left and right)
    for (let col = this.walls.left; col < cols - this.walls.right; col++) {
      for (let row = rows - this.walls.bottom; row < rows; row++) {
        this.wallGrains.push({ x: col, y: row });
      }
    }

    // Top wall if needed (between left and right)
    for (let col = this.walls.left; col < cols - this.walls.right; col++) {
      for (let row = 0; row < this.walls.top; row++) {
        this.wallGrains.push({ x: col, y: row });
      }
    }

    console.log(`Generated ${this.wallGrains.length} wall grains`);
  }

  resize(width: number, height: number): void {
    const gl = this.gl;
    gl.canvas.width = width;
    gl.canvas.height = height;
    gl.viewport(0, 0, width, height);
    // Regenerate wall grains for new size
    if (this.walls.left || this.walls.right || this.walls.bottom || this.walls.top) {
      this.generateWallGrains();
    }
  }

  updateGrains(grains: SandGrain[]): void {
    const gl = this.gl;
    const pixelSize = this.config.pixelSize;

    // Count visible grains and wall grains
    let visibleCount = 0;
    for (let i = 0; i < grains.length; i++) {
      if (grains[i].active && grains[i].y >= 0) visibleCount++;
    }

    const totalCount = visibleCount + this.wallGrains.length;
    this.grainCount = totalCount;
    if (this.grainCount === 0) return;

    // Grow buffers if needed
    if (this.grainCount > this.bufferCapacity) {
      this.bufferCapacity = Math.ceil(this.grainCount * 1.5);
      this.offsetData = new Float32Array(this.bufferCapacity * 2);
      this.colorData = new Float32Array(this.bufferCapacity * 4);
    }

    let idx = 0;

    // Add wall grains first (render behind sand)
    const wallColor = this.config.wallColor;
    for (const wall of this.wallGrains) {
      const offset2 = idx * 2;
      const offset4 = idx * 4;

      this.offsetData[offset2] = wall.x * pixelSize;
      this.offsetData[offset2 + 1] = wall.y * pixelSize;

      this.colorData[offset4] = wallColor[0];
      this.colorData[offset4 + 1] = wallColor[1];
      this.colorData[offset4 + 2] = wallColor[2];
      this.colorData[offset4 + 3] = wallColor[3];
      idx++;
    }

    // Add sand grains
    for (let i = 0; i < grains.length; i++) {
      const grain = grains[i];
      if (!grain.active || grain.y < 0) continue;

      const offset2 = idx * 2;
      const offset4 = idx * 4;

      // Convert grid position to pixel position
      this.offsetData[offset2] = grain.x * pixelSize;
      this.offsetData[offset2 + 1] = grain.y * pixelSize;

      this.colorData[offset4] = grain.color[0];
      this.colorData[offset4 + 1] = grain.color[1];
      this.colorData[offset4 + 2] = grain.color[2];
      this.colorData[offset4 + 3] = grain.color[3];
      idx++;
    }

    // Upload buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, this.offsetBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.offsetData.subarray(0, this.grainCount * 2), gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.colorData.subarray(0, this.grainCount * 4), gl.DYNAMIC_DRAW);
  }

  render(): void {
    const gl = this.gl;

    gl.clear(gl.COLOR_BUFFER_BIT);

    if (this.grainCount === 0) return;

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    // Set uniforms
    gl.uniform2f(this.resolutionLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(this.pixelSizeLocation, this.config.pixelSize);

    // Draw all grains with instancing
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.grainCount);

    gl.bindVertexArray(null);
  }

  dispose(): void {
    const gl = this.gl;
    gl.deleteBuffer(this.quadBuffer);
    gl.deleteBuffer(this.offsetBuffer);
    gl.deleteBuffer(this.colorBuffer);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.program);
  }
}
