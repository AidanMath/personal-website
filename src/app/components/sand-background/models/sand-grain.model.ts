export class SandGrain {
  col: number;
  row: number;
  targetRow: number;
  vy: number;
  color: string;
  settled: boolean;
  delay: number;
  active: boolean;

  constructor(config: {
    col: number;
    targetRow: number;
    color: string;
    delay: number;
  }) {
    this.col = config.col;
    this.row = -1;  // Start off-screen
    this.targetRow = config.targetRow;
    this.vy = 0;
    this.color = config.color;
    this.settled = false;
    this.delay = config.delay;
    this.active = false;
  }

  activate(): void {
    this.active = true;
    this.row = 0;
    this.vy = 2;
  }

  settle(): void {
    this.settled = true;
    this.vy = 0;
  }

  unsettle(newVy: number = 0.5): void {
    this.settled = false;
    this.vy = newVy;
  }

  moveTo(col: number, row: number): void {
    this.col = col;
    this.row = row;
  }

  isVisible(): boolean {
    return this.active && this.row >= 0;
  }
}
