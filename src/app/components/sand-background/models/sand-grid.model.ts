import { SandGrain } from './sand-grain.model';

export class SandGrid {
  private grid: (SandGrain | null)[][] = [];
  readonly cols: number;
  readonly rows: number;

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    this.initialize();
  }

  private initialize(): void {
    this.grid = Array(this.cols)
      .fill(null)
      .map(() => Array(this.rows).fill(null));
  }

  clear(): void {
    this.initialize();
  }

  get(col: number, row: number): SandGrain | null {
    if (!this.isValidPosition(col, row)) return null;
    return this.grid[col][row];
  }

  set(col: number, row: number, grain: SandGrain | null): void {
    if (this.isValidPosition(col, row)) {
      this.grid[col][row] = grain;
    }
  }

  isEmpty(col: number, row: number): boolean {
    if (!this.isValidPosition(col, row)) return false;
    return this.grid[col][row] === null;
  }

  isValidPosition(col: number, row: number): boolean {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  isAtBottom(row: number): boolean {
    return row >= this.rows - 1;
  }

  getMaxRow(): number {
    return this.rows - 1;
  }

  placeGrain(grain: SandGrain): void {
    if (this.isValidPosition(grain.col, grain.row)) {
      this.grid[grain.col][grain.row] = grain;
    }
  }

  removeGrain(grain: SandGrain): void {
    if (this.isValidPosition(grain.col, grain.row)) {
      this.grid[grain.col][grain.row] = null;
    }
  }

  canFlowDown(col: number, row: number): boolean {
    return this.isEmpty(col, row + 1);
  }

  canFlowDiagonalLeft(col: number, row: number): boolean {
    return col > 0 && this.isEmpty(col - 1, row + 1);
  }

  canFlowDiagonalRight(col: number, row: number): boolean {
    return col < this.cols - 1 && this.isEmpty(col + 1, row + 1);
  }

  findGapWithinDistance(col: number, row: number, maxDist: number): number | null {
    for (let dist = 1; dist <= maxDist; dist++) {
      // Check left
      const leftCol = col - dist;
      if (leftCol >= 0 && this.isEmpty(leftCol, row) && this.isEmpty(leftCol, row + 1)) {
        return leftCol;
      }
      // Check right
      const rightCol = col + dist;
      if (rightCol < this.cols && this.isEmpty(rightCol, row) && this.isEmpty(rightCol, row + 1)) {
        return rightCol;
      }
    }
    return null;
  }

  findEmptyRowInColumn(col: number, startRow: number, maxLift: number): number | null {
    for (let lift = 0; lift <= maxLift; lift++) {
      const checkRow = startRow - lift;
      if (checkRow >= 0 && this.isEmpty(col, checkRow)) {
        return checkRow;
      }
    }
    return null;
  }
}
