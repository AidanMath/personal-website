import { SandGrain } from '../models/sand-grain.model';
import { SandGrid } from '../models/sand-grid.model';

export interface PhysicsConfig {
  gravity: number;
  terminalVelocity: number;
  passesPerFrame: number;
  gapSearchDistance: number;
  enableGapFilling: boolean;
  gapFillChance: number;
}

const DEFAULT_CONFIG: PhysicsConfig = {
  gravity: 0.4,
  terminalVelocity: 6,
  passesPerFrame: 3,
  gapSearchDistance: 3,
  enableGapFilling: true,
  gapFillChance: 0.3,  // Chance per frame for a settled grain to check for gaps
};

export class SandPhysicsService {
  private config: PhysicsConfig;

  constructor(config: Partial<PhysicsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  updateGrains(grains: SandGrain[], grid: SandGrid, currentTime: number): void {
    // First pass: check if settled grains should fall into gaps
    if (this.config.enableGapFilling) {
      this.checkGapFilling(grains, grid);
    }

    // Normal physics passes
    for (let pass = 0; pass < this.config.passesPerFrame; pass++) {
      for (const grain of grains) {
        this.updateGrain(grain, grid, currentTime, pass);
      }
    }
  }

  private checkGapFilling(grains: SandGrain[], grid: SandGrid): void {
    // Shuffle check order to avoid bias
    const settledGrains = grains.filter(g => g.settled && g.active);

    for (const grain of settledGrains) {
      // Random chance to check (performance optimization)
      if (Math.random() > this.config.gapFillChance) continue;

      // Check if there's a gap below this grain that it could fall into
      const belowRow = grain.row + 1;
      if (belowRow >= grid.rows) continue;

      // Check directly below
      if (grid.isEmpty(grain.col, belowRow)) {
        grid.removeGrain(grain);
        grain.unsettle(0.3);
        continue;
      }

      // Check diagonally below - grains should flow diagonally into gaps
      const canFlowLeft = grain.col > 0 &&
        grid.isEmpty(grain.col - 1, belowRow) &&
        grid.isEmpty(grain.col - 1, grain.row);
      const canFlowRight = grain.col < grid.cols - 1 &&
        grid.isEmpty(grain.col + 1, belowRow) &&
        grid.isEmpty(grain.col + 1, grain.row);

      if (canFlowLeft || canFlowRight) {
        grid.removeGrain(grain);
        grain.unsettle(0.2);
      }
    }
  }

  private updateGrain(grain: SandGrain, grid: SandGrid, currentTime: number, pass: number): void {
    // Activate grain after delay
    if (!grain.active && currentTime >= grain.delay) {
      grain.activate();
    }

    if (!grain.active || grain.settled) return;

    // Apply gravity on first pass only
    if (pass === 0) {
      grain.vy += this.config.gravity;
      grain.vy = Math.min(grain.vy, this.config.terminalVelocity);
    }

    const rowsToMove = pass === 0 ? Math.max(1, Math.floor(grain.vy)) : 1;
    this.moveGrain(grain, grid, rowsToMove);
  }

  private moveGrain(grain: SandGrain, grid: SandGrid, rowsToMove: number): void {
    const maxRow = grid.getMaxRow();

    for (let i = 0; i < rowsToMove; i++) {
      // Already at bottom
      if (grain.row >= maxRow) {
        grain.row = maxRow;
        this.settleGrain(grain, grid);
        break;
      }

      const nextRow = grain.row + 1;

      // Try to move straight down
      if (grid.isEmpty(grain.col, nextRow)) {
        grain.row = nextRow;
        if (grain.row >= maxRow) {
          this.settleGrain(grain, grid);
          break;
        }
        continue;
      }

      // Try diagonal flow
      if (this.tryDiagonalFlow(grain, grid, nextRow)) {
        continue;
      }

      // Try horizontal gap search
      const gapCol = grid.findGapWithinDistance(
        grain.col,
        grain.row,
        this.config.gapSearchDistance
      );

      if (gapCol !== null) {
        grain.col = gapCol;
        continue;
      }

      // Can't move - settle
      this.settleGrain(grain, grid);
      break;
    }
  }

  private tryDiagonalFlow(grain: SandGrain, grid: SandGrid, nextRow: number): boolean {
    const canFlowLeft = grid.canFlowDiagonalLeft(grain.col, grain.row);
    const canFlowRight = grid.canFlowDiagonalRight(grain.col, grain.row);

    if (canFlowLeft && canFlowRight) {
      grain.col += Math.random() > 0.5 ? -1 : 1;
      grain.row = nextRow;
      return true;
    }

    if (canFlowLeft) {
      grain.col -= 1;
      grain.row = nextRow;
      return true;
    }

    if (canFlowRight) {
      grain.col += 1;
      grain.row = nextRow;
      return true;
    }

    return false;
  }

  private settleGrain(grain: SandGrain, grid: SandGrid): void {
    grain.settle();
    grid.placeGrain(grain);
  }
}
