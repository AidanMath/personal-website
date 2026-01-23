export type RGBAColor = [number, number, number, number];

export class SandGrain {
  x: number;
  y: number;
  vy: number;
  color: RGBAColor;
  settled: boolean;
  delay: number;
  active: boolean;
  targetY: number;  // Target row for fall-in animation
  settledFrames: number;  // How many frames this grain has been settled (stability)

  constructor(config: {
    x: number;
    y: number;
    color: RGBAColor;
    delay?: number;
    startY?: number;
    startVy?: number;
    settled?: boolean;
  }) {
    this.x = config.x;
    this.targetY = config.y;  // Remember target position
    this.y = config.startY ?? config.y;
    this.vy = config.startVy ?? 0;
    this.color = config.color;
    this.settled = config.settled ?? false;
    this.delay = config.delay ?? 0;
    this.active = this.delay === 0;
    this.settledFrames = config.settled ? 60 : 0;  // Start stable if pre-settled
  }

  activate(): void {
    this.active = true;
  }

  settle(): void {
    this.settled = true;
    this.vy = 0;
    // Don't reset settledFrames - it accumulates
  }

  unsettle(newVy: number = 0.5): void {
    this.settled = false;
    this.vy = newVy;
    this.settledFrames = 0;  // Reset stability when disturbed
  }

  incrementSettledFrames(): void {
    if (this.settled && this.settledFrames < 120) {
      this.settledFrames++;
    }
  }
}
