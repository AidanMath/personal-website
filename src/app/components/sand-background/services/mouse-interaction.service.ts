import { SandGrain } from '../models/sand-grain.model';
import { SandGrid } from '../models/sand-grid.model';

export interface MouseState {
  x: number;
  y: number;
  velX: number;
  velY: number;
  speed: number;
  isMoving: boolean;
}

export interface InteractionConfig {
  trailRadius: number;
  velocityDecay: number;
  minSpeedThreshold: number;
  pushStrength: number;
  liftStrength: number;
}

const DEFAULT_CONFIG: InteractionConfig = {
  trailRadius: 12,           // Smaller, more precise trail
  velocityDecay: 0.9,
  minSpeedThreshold: 0.3,
  pushStrength: 2.5,         // How hard grains push to the side
  liftStrength: 1.5,         // How much grains lift up
};

export class MouseInteractionService {
  private config: InteractionConfig;
  private mouseX = -1000;
  private mouseY = -1000;
  private lastMouseX = -1000;
  private lastMouseY = -1000;
  private velX = 0;
  private velY = 0;

  constructor(config: Partial<InteractionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  updateMousePosition(clientX: number, clientY: number, scrollY: number): void {
    this.lastMouseX = this.mouseX;
    this.lastMouseY = this.mouseY;
    this.mouseX = clientX;
    this.mouseY = clientY + scrollY;

    this.velX = this.mouseX - this.lastMouseX;
    this.velY = this.mouseY - this.lastMouseY;
  }

  getState(): MouseState {
    const speed = Math.sqrt(this.velX * this.velX + this.velY * this.velY);
    return {
      x: this.mouseX,
      y: this.mouseY,
      velX: this.velX,
      velY: this.velY,
      speed,
      isMoving: speed > this.config.minSpeedThreshold,
    };
  }

  decayVelocity(): void {
    this.velX *= this.config.velocityDecay;
    this.velY *= this.config.velocityDecay;
  }

  processInteraction(grains: SandGrain[], grid: SandGrid, pixelSize: number): void {
    const state = this.getState();
    if (!state.isMoving) return;

    const trailRadiusCells = Math.ceil(this.config.trailRadius / pixelSize);

    // Normalize mouse velocity for direction
    const mouseLen = state.speed;
    if (mouseLen < 0.1) return;

    const normVelX = state.velX / mouseLen;
    const normVelY = state.velY / mouseLen;

    // Perpendicular direction (rotate 90 degrees) - this is the "push to side" direction
    const perpX = -normVelY;
    const perpY = normVelX;

    for (const grain of grains) {
      if (!grain.settled) continue;

      // Calculate distance from grain center to mouse
      const grainCenterX = grain.col * pixelSize + pixelSize / 2;
      const grainCenterY = grain.row * pixelSize + pixelSize / 2;
      const dx = grainCenterX - state.x;
      const dy = grainCenterY - state.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Check if within trail radius
      if (dist >= this.config.trailRadius) continue;

      // Determine which side of the mouse path the grain is on (cross product)
      const crossProduct = dx * normVelY - dy * normVelX;
      const side = Math.sign(crossProduct) || 1;

      // Calculate push strength based on distance (closer = stronger)
      const distanceFactor = 1 - (dist / this.config.trailRadius);
      const strength = distanceFactor * this.config.pushStrength;

      // Calculate target position: push perpendicular + slight lift
      const pushColDelta = Math.round(perpX * side * strength);
      const pushRowDelta = Math.round(perpY * side * strength - this.config.liftStrength * distanceFactor);

      const targetCol = Math.max(0, Math.min(grid.cols - 1, grain.col + pushColDelta));
      const targetRow = Math.max(0, Math.min(grid.rows - 1, grain.row + pushRowDelta));

      // Only move if there's actually a change
      if (targetCol === grain.col && targetRow === grain.row) continue;

      // Remove from grid and unsettle - let physics handle finding a new spot
      grid.removeGrain(grain);
      grain.unsettle(0.5);

      // Move to target position (or nearby if occupied)
      if (grid.isEmpty(targetCol, targetRow)) {
        grain.moveTo(targetCol, targetRow);
      } else {
        // Try to find nearby empty spot, prioritizing upward
        const newPos = this.findNearbyEmpty(grid, targetCol, targetRow, grain.col, grain.row);
        if (newPos) {
          grain.moveTo(newPos.col, newPos.row);
        }
        // If no spot found, grain stays at original position but unsettled
        // Physics will make it fall and find a new home
      }
    }
  }

  private findNearbyEmpty(
    grid: SandGrid,
    targetCol: number,
    targetRow: number,
    fromCol: number,
    fromRow: number
  ): { col: number; row: number } | null {
    // Search in expanding radius, prioritizing positions above (lower row numbers)
    for (let radius = 1; radius <= 5; radius++) {
      // Check upward first (negative row delta)
      for (let dRow = -radius; dRow <= radius; dRow++) {
        for (let dCol = -radius; dCol <= radius; dCol++) {
          if (Math.abs(dCol) !== radius && Math.abs(dRow) !== radius) continue;

          const checkCol = targetCol + dCol;
          const checkRow = targetRow + dRow;

          if (checkCol === fromCol && checkRow === fromRow) continue;
          if (!grid.isValidPosition(checkCol, checkRow)) continue;
          if (grid.isEmpty(checkCol, checkRow)) {
            return { col: checkCol, row: checkRow };
          }
        }
      }
    }
    return null;
  }
}
