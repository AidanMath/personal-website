import { SandGrain } from './sand-grain.model';

export interface WallConfig {
  left: number;   // Wall thickness in grid cells
  right: number;
  bottom: number;
  top: number;
}

export class SandGrid {
  private grid: (SandGrain | null)[][] = [];
  readonly cols: number;
  readonly rows: number;
  private walls: WallConfig = { left: 0, right: 0, bottom: 0, top: 0 };
  private pileHeightCache: Map<number, number> = new Map();
  private cacheFrame: number = 0;

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    this.grid = Array(cols)
      .fill(null)
      .map(() => Array(rows).fill(null));
  }

  setWalls(walls: Partial<WallConfig>): void {
    this.walls = { ...this.walls, ...walls };
  }

  getWalls(): WallConfig {
    return this.walls;
  }

  // Returns the playable area bounds (inside walls)
  getPlayableArea(): { minCol: number; maxCol: number; minRow: number; maxRow: number } {
    return {
      minCol: this.walls.left,
      maxCol: this.cols - 1 - this.walls.right,
      minRow: this.walls.top,
      maxRow: this.rows - 1 - this.walls.bottom
    };
  }

  isWall(col: number, row: number): boolean {
    if (col < this.walls.left) return true;
    if (col >= this.cols - this.walls.right) return true;
    if (row >= this.rows - this.walls.bottom) return true;
    if (row < this.walls.top) return true;
    return false;
  }

  isValidPosition(col: number, row: number): boolean {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  isEmpty(col: number, row: number): boolean {
    if (!this.isValidPosition(col, row)) return false;
    if (this.isWall(col, row)) return false;
    return this.grid[col][row] === null;
  }

  getMaxRow(): number {
    return this.rows - 1 - this.walls.bottom;
  }

  placeGrain(grain: SandGrain): void {
    const col = Math.floor(grain.x);
    const row = Math.floor(grain.y);
    if (this.isValidPosition(col, row) && !this.isWall(col, row)) {
      this.grid[col][row] = grain;
    }
  }

  removeGrain(grain: SandGrain): void {
    const col = Math.floor(grain.x);
    const row = Math.floor(grain.y);
    if (this.isValidPosition(col, row)) {
      this.grid[col][row] = null;
    }
  }

  canFlowDiagonalLeft(col: number, row: number): boolean {
    return col > this.walls.left && this.isEmpty(col - 1, row + 1);
  }

  canFlowDiagonalRight(col: number, row: number): boolean {
    return col < this.cols - 1 - this.walls.right && this.isEmpty(col + 1, row + 1);
  }

  findGapWithinDistance(col: number, row: number, maxDist: number): number | null {
    const area = this.getPlayableArea();
    for (let dist = 1; dist <= maxDist; dist++) {
      const leftCol = col - dist;
      if (leftCol >= area.minCol && this.isEmpty(leftCol, row) && this.isEmpty(leftCol, row + 1)) {
        return leftCol;
      }
      const rightCol = col + dist;
      if (rightCol <= area.maxCol && this.isEmpty(rightCol, row) && this.isEmpty(rightCol, row + 1)) {
        return rightCol;
      }
    }
    return null;
  }

  /**
   * Count how many supporting neighbors a grain has.
   * Support comes from grains directly below, diagonally below, and to the sides.
   */
  countSupport(col: number, row: number): number {
    let support = 0;
    const belowRow = row + 1;

    // Direct support from below (strongest)
    if (!this.isEmpty(col, belowRow) || belowRow >= this.rows - this.walls.bottom) {
      support += 3;  // Strong support
    }

    // Diagonal support from below-left
    if (col > 0 && !this.isEmpty(col - 1, belowRow)) {
      support += 2;
    }

    // Diagonal support from below-right
    if (col < this.cols - 1 && !this.isEmpty(col + 1, belowRow)) {
      support += 2;
    }

    // Side support (for arches/tunnels)
    if (col > 0 && !this.isEmpty(col - 1, row)) {
      support += 1;
    }
    if (col < this.cols - 1 && !this.isEmpty(col + 1, row)) {
      support += 1;
    }

    return support;
  }

  /**
   * Check if a grain has enough support to stay stable.
   * Returns true if grain should stay put, false if it should fall.
   */
  hasAdequateSupport(col: number, row: number): boolean {
    const support = this.countSupport(col, row);
    // Need at least 3 support points to be stable
    // (either direct below, or diagonal on both sides, etc.)
    return support >= 3;
  }

  /**
   * Clear pile height cache at start of each frame.
   * Call this once per frame before physics updates.
   */
  clearPileHeightCache(frame: number): void {
    if (frame !== this.cacheFrame) {
      this.pileHeightCache.clear();
      this.cacheFrame = frame;
    }
  }

  /**
   * Get the height of the sand pile at a given column.
   * Used for angle of repose calculations.
   * Results are cached per frame for performance.
   */
  getPileHeight(col: number): number {
    const cached = this.pileHeightCache.get(col);
    if (cached !== undefined) {
      return cached;
    }

    for (let row = 0; row < this.rows; row++) {
      if (!this.isEmpty(col, row)) {
        const height = this.rows - row;
        this.pileHeightCache.set(col, height);
        return height;
      }
    }
    this.pileHeightCache.set(col, 0);
    return 0;
  }
}
