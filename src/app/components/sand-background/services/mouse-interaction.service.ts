import { SandGrain } from '../models/sand-grain.model';
import { SandGrid } from '../models/sand-grid.model';

// Interaction constants - tuned for fluid, brushstroke feel
const INTERACTION_RADIUS_DESKTOP = 30;
const INTERACTION_RADIUS_MOBILE = 40; // Larger for touch
const VELOCITY_DECAY = 0.92;
const MIN_SPEED_THRESHOLD = 0.2;
const INTERACTION_STRENGTH = 1.8;
const SCATTER_RANDOMNESS = 0.15;
const INITIAL_MOUSE_POSITION = -1000;

// Detect if touch device
const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

const getInteractionRadius = (): number => {
  return isTouchDevice() ? INTERACTION_RADIUS_MOBILE : INTERACTION_RADIUS_DESKTOP;
};

export interface MouseState {
  x: number;
  y: number;
  velX: number;
  velY: number;
  speed: number;
  isMoving: boolean;
}

export interface InteractionConfig {
  interactionRadius: number;
  velocityDecay: number;
  minSpeedThreshold: number;
  interactionStrength: number;
}

const DEFAULT_CONFIG: InteractionConfig = {
  interactionRadius: getInteractionRadius(),
  velocityDecay: VELOCITY_DECAY,
  minSpeedThreshold: MIN_SPEED_THRESHOLD,
  interactionStrength: INTERACTION_STRENGTH,
};

export class MouseInteractionService {
  private config: InteractionConfig;
  private mouseX = INITIAL_MOUSE_POSITION;
  private mouseY = INITIAL_MOUSE_POSITION;
  private lastMouseX = INITIAL_MOUSE_POSITION;
  private lastMouseY = INITIAL_MOUSE_POSITION;
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

    const radius = this.config.interactionRadius;
    const radiusSq = radius * radius;

    for (const grain of grains) {
      if (!grain.settled || !grain.active) continue;

      // Calculate grain center in pixel coordinates
      const grainCenterX = grain.x * pixelSize + pixelSize / 2;
      const grainCenterY = grain.y * pixelSize + pixelSize / 2;

      const dx = grainCenterX - state.x;
      const dy = grainCenterY - state.y;
      const distSq = dx * dx + dy * dy;

      if (distSq >= radiusSq) continue;

      const dist = Math.sqrt(distSq);
      // Smooth cubic falloff for fluid feel
      const t = dist / radius;
      const falloff = 1 - (t * t * (3 - 2 * t)); // Smoothstep
      const strength = falloff * this.config.interactionStrength;

      // Direction away from mouse with slight scatter
      const pushAngle = Math.atan2(dy, dx);
      const scatter = (Math.random() - 0.5) * Math.PI * SCATTER_RANDOMNESS;

      // Blend radial push with mouse movement direction for flowing feel
      const mouseAngle = Math.atan2(state.velY, state.velX);
      const blendedAngle = pushAngle * 0.6 + mouseAngle * 0.4 + scatter;

      // Calculate push - mainly horizontal with gentle lift
      const pushX = Math.cos(blendedAngle) * strength;
      const pushY = Math.sin(blendedAngle) * strength - strength * 0.3;

      const col = Math.floor(grain.x);
      const row = Math.floor(grain.y);

      // Apply push gradually (don't teleport)
      const newCol = Math.max(0, Math.min(grid.cols - 1, col + Math.round(pushX)));
      const newRow = Math.max(0, Math.min(grid.rows - 1, row + Math.round(pushY)));

      if (newCol !== col || newRow !== row) {
        grid.removeGrain(grain);
        // Give grain velocity for fluid continuation
        grain.unsettle(strength * 0.5 + Math.random() * 0.3);
        grain.x = newCol;
        grain.y = newRow;
      }
    }
  }
}
