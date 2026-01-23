import { SandGrain } from '../models/sand-grain.model';
import { SandGrid } from '../models/sand-grid.model';

// Physics constants - balanced for stable structures AND fluid falling
const GRAVITY = 0.5;
const TERMINAL_VELOCITY = 6;
const PASSES_PER_FRAME = 1;

// Stability constants - these control how sand piles up
// Tuned for stable tunnels but isolated pieces should fall
const GAP_FILL_CHANCE = 0.003;  // 0.3% chance per frame for supported grains (very stable)
const GAP_FILL_CHANCE_UNSUPPORTED = 0.4;  // 40% for floating grains (fall quickly when isolated)
const STABILITY_THRESHOLD = 15;  // Frames before "stable"
const MIN_SUPPORT_TO_STAY = 1;  // Low threshold - supported grains stay easily
const MIN_SUPPORT_FLOATING = 2;  // Floating grains need side support to stay
const ANGLE_OF_REPOSE = 3.0;  // Higher = more stable slopes

// Velocities when disturbed
const UNSETTLE_VELOCITY_BELOW = 0.4;
const UNSETTLE_VELOCITY_DIAGONAL = 0.3;
const UNSETTLE_VELOCITY_FORCED = 0.6;  // When pushed by mouse or collapse

export interface PhysicsConfig {
  gravity: number;
  terminalVelocity: number;
  passesPerFrame: number;
  enableGapFilling: boolean;
  gapFillChance: number;
  gapFillChanceUnsupported: number;
  stabilityThreshold: number;
  angleOfRepose: number;
}

const DEFAULT_CONFIG: PhysicsConfig = {
  gravity: GRAVITY,
  terminalVelocity: TERMINAL_VELOCITY,
  passesPerFrame: PASSES_PER_FRAME,
  enableGapFilling: true,
  gapFillChance: GAP_FILL_CHANCE,
  gapFillChanceUnsupported: GAP_FILL_CHANCE_UNSUPPORTED,
  stabilityThreshold: STABILITY_THRESHOLD,
  angleOfRepose: ANGLE_OF_REPOSE,
};

export class SandPhysicsService {
  private config: PhysicsConfig;

  constructor(config: Partial<PhysicsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  updateGrains(grains: SandGrain[], grid: SandGrid, currentTime: number): void {
    // Clear pile height cache for this frame
    grid.clearPileHeightCache(currentTime);

    // Count grains still in initial fall-in (not yet reached target)
    let initialFallingCount = 0;
    for (const grain of grains) {
      if (!grain.settled && grain.active && grain.y < grain.targetY) {
        initialFallingCount++;
      }
    }
    const isFallInPhase = initialFallingCount > 100;

    // Increment stability counters for settled grains
    if (!isFallInPhase) {
      for (const grain of grains) {
        if (grain.settled && grain.active) {
          grain.incrementSettledFrames();
        }
      }
    }

    // Support-based gap filling (only after initial animation)
    if (this.config.enableGapFilling && !isFallInPhase) {
      this.checkGapFilling(grains, grid);
    }

    // Physics passes
    const passes = isFallInPhase ? 1 : this.config.passesPerFrame;
    for (let pass = 0; pass < passes; pass++) {
      for (const grain of grains) {
        this.updateGrain(grain, grid, currentTime, pass);
      }
    }
  }

  /**
   * Check if settled grains should fall based on support.
   * Key changes from original:
   * - Lower chance to check for well-supported grains
   * - Higher chance to check for "floating" grains (nothing directly below)
   * - Grains with adequate support don't fall
   * - Stable grains (settled for many frames) are harder to dislodge
   * - Angle of repose prevents overly steep slopes
   */
  private checkGapFilling(grains: SandGrain[], grid: SandGrid): void {
    for (const grain of grains) {
      if (!grain.settled || !grain.active) continue;

      const col = Math.floor(grain.x);
      const row = Math.floor(grain.y);
      const belowRow = row + 1;

      if (belowRow >= grid.rows) continue;

      // Check if there's anything directly below
      const hasDirectSupport = !grid.isEmpty(col, belowRow);

      // Use higher check chance for "floating" grains (nothing directly below)
      const checkChance = hasDirectSupport
        ? this.config.gapFillChance
        : this.config.gapFillChanceUnsupported;

      // Random chance to even check (performance + stability)
      if (Math.random() > checkChance) continue;

      // Check support - if grain has good support, it stays
      const support = grid.countSupport(col, row);

      // Stable grains need less support to stay put
      const isStable = grain.settledFrames >= this.config.stabilityThreshold;

      // Floating grains need MORE support to stay (must be held by neighbors)
      const requiredSupport = hasDirectSupport
        ? (isStable ? MIN_SUPPORT_TO_STAY - 1 : MIN_SUPPORT_TO_STAY)
        : MIN_SUPPORT_FLOATING;

      if (support >= requiredSupport) {
        // Grain is supported, don't fall
        continue;
      }

      // Check directly below - fall if nothing there and not enough side support
      if (!hasDirectSupport) {
        // No support below AND not enough side support - fall
        grid.removeGrain(grain);
        grain.unsettle(UNSETTLE_VELOCITY_BELOW);
        continue;
      }

      // Check diagonal flow with angle of repose
      // Only flow diagonally if the slope is too steep
      const canFlowLeft = this.canFlowDiagonalWithAngle(grain, grid, col, row, -1);
      const canFlowRight = this.canFlowDiagonalWithAngle(grain, grid, col, row, 1);

      if (canFlowLeft || canFlowRight) {
        // Only unsettle if the grain isn't very stable
        if (!isStable || Math.random() < 0.15) {
          grid.removeGrain(grain);
          grain.unsettle(UNSETTLE_VELOCITY_DIAGONAL);
        }
      }
    }
  }

  /**
   * Check if a grain can flow diagonally based on angle of repose.
   * This prevents sand from trying to become perfectly flat.
   */
  private canFlowDiagonalWithAngle(
    grain: SandGrain,
    grid: SandGrid,
    col: number,
    row: number,
    direction: number  // -1 for left, 1 for right
  ): boolean {
    const targetCol = col + direction;
    const belowRow = row + 1;

    // Check basic diagonal flow possibility
    if (direction < 0) {
      if (!grid.canFlowDiagonalLeft(col, row)) return false;
    } else {
      if (!grid.canFlowDiagonalRight(col, row)) return false;
    }

    // Also need the adjacent cell to be empty (can't flow through walls)
    if (!grid.isEmpty(targetCol, row)) return false;

    // Angle of repose check: compare pile heights
    // Only flow if the height difference exceeds the angle of repose
    const currentHeight = grid.getPileHeight(col);
    const targetHeight = grid.getPileHeight(targetCol);
    const heightDiff = currentHeight - targetHeight;

    // If target pile is nearly as high, don't flow (angle of repose)
    return heightDiff > this.config.angleOfRepose;
  }

  private updateGrain(grain: SandGrain, grid: SandGrid, currentTime: number, pass: number): void {
    // Activate grain after delay
    if (!grain.active && currentTime >= grain.delay) {
      grain.activate();
    }

    if (!grain.active || grain.settled) return;

    // Clamp X to bounds, but allow Y to be negative (for fall-in animation)
    grain.x = Math.max(0, Math.min(grid.cols - 1, grain.x));

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
    // Check if this grain is still in its initial fall animation
    const isFallingIn = !grain.settled && grain.y < grain.targetY;

    // During fall-in, smooth acceleration to target
    if (isFallingIn) {
      const distance = grain.targetY - grain.y;
      // Smooth easing - start slow, speed up, slow down at end
      const progress = 1 - (distance / (grain.targetY + 10));
      const easeSpeed = 4 + progress * 6; // 4-10 based on progress
      const speed = Math.min(distance, Math.max(3, Math.ceil(easeSpeed)));
      grain.y += speed;
      if (grain.y >= grain.targetY) {
        grain.y = grain.targetY;
        this.settleGrain(grain, grid);
      }
      return;
    }

    for (let i = 0; i < rowsToMove; i++) {
      const col = Math.floor(grain.x);
      const row = Math.floor(grain.y);

      // Already at bottom
      if (row >= maxRow) {
        grain.y = maxRow;
        this.settleGrain(grain, grid);
        break;
      }

      const nextRow = row + 1;

      // Try to move straight down
      if (grid.isEmpty(col, nextRow)) {
        grain.y = nextRow;
        if (grain.y >= maxRow) {
          this.settleGrain(grain, grid);
          break;
        }
        continue;
      }

      // Try diagonal flow (with angle of repose for active grains)
      if (this.tryDiagonalFlow(grain, grid, col, nextRow)) {
        continue;
      }

      // Can't move - settle
      this.settleGrain(grain, grid);
      break;
    }
  }

  private tryDiagonalFlow(grain: SandGrain, grid: SandGrid, col: number, nextRow: number): boolean {
    const canFlowLeft = grid.canFlowDiagonalLeft(col, Math.floor(grain.y));
    const canFlowRight = grid.canFlowDiagonalRight(col, Math.floor(grain.y));

    if (canFlowLeft && canFlowRight) {
      grain.x = col + (Math.random() > 0.5 ? -1 : 1);
      grain.y = nextRow;
      return true;
    }

    if (canFlowLeft) {
      grain.x = col - 1;
      grain.y = nextRow;
      return true;
    }

    if (canFlowRight) {
      grain.x = col + 1;
      grain.y = nextRow;
      return true;
    }

    return false;
  }

  private settleGrain(grain: SandGrain, grid: SandGrid): void {
    grain.settle();
    // Clear targetY so grain behaves normally after settling
    grain.targetY = grain.y;
    grid.placeGrain(grain);
  }
}
