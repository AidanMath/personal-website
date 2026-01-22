import { SandPhysicsService } from './sand-physics.service';
import { SandGrain } from '../models/sand-grain.model';
import { SandGrid } from '../models/sand-grid.model';

describe('SandPhysicsService', () => {
  let service: SandPhysicsService;
  let grid: SandGrid;

  beforeEach(() => {
    service = new SandPhysicsService();
    grid = new SandGrid(100, 50);
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      expect(service).toBeTruthy();
    });

    it('should accept custom config', () => {
      const customService = new SandPhysicsService({
        gravity: 1.0,
        terminalVelocity: 10
      });
      expect(customService).toBeTruthy();
    });
  });

  describe('updateGrains', () => {
    it('should activate grains after their delay', () => {
      const grain = new SandGrain({
        x: 50,
        y: 25,
        color: [1, 1, 1, 1],
        delay: 5,
        startY: -10
      });

      expect(grain.active).toBe(false);

      // Update with time before delay
      service.updateGrains([grain], grid, 3);
      expect(grain.active).toBe(false);

      // Update with time at delay
      service.updateGrains([grain], grid, 5);
      expect(grain.active).toBe(true);
    });

    it('should not update inactive grains', () => {
      const grain = new SandGrain({
        x: 50,
        y: 25,
        color: [1, 1, 1, 1],
        delay: 100,
        startY: -10
      });

      const initialY = grain.y;
      service.updateGrains([grain], grid, 0);

      expect(grain.y).toBe(initialY);
    });

    it('should not update settled grains at bottom row', () => {
      // Create service with gap filling disabled
      const noGapService = new SandPhysicsService({
        enableGapFilling: false
      });

      const maxRow = grid.getMaxRow();
      const grain = new SandGrain({
        x: 50,
        y: maxRow,
        color: [1, 1, 1, 1],
        settled: true
      });
      grain.targetY = maxRow;
      grid.placeGrain(grain);

      const initialY = grain.y;
      noGapService.updateGrains([grain], grid, 100);

      expect(grain.y).toBe(initialY);
      expect(grain.settled).toBe(true);
    });

    it('should move active unsettled grains downward', () => {
      const grain = new SandGrain({
        x: 50,
        y: 10,
        color: [1, 1, 1, 1],
        settled: false,
        startY: 10
      });
      // Set targetY equal to y so it uses normal physics
      grain.targetY = 10;

      service.updateGrains([grain], grid, 100);

      expect(grain.y).toBeGreaterThan(10);
    });
  });

  describe('gap filling', () => {
    it('should unsettle grains when there is space below', () => {
      const service = new SandPhysicsService({
        enableGapFilling: true,
        gapFillChance: 1.0 // Always check
      });

      const grain = new SandGrain({
        x: 50,
        y: 25,
        color: [1, 1, 1, 1],
        settled: true
      });
      grain.targetY = 25; // Ensure it's past initial fall
      grid.placeGrain(grain);

      // Space below is empty
      service.updateGrains([grain], grid, 200);

      expect(grain.settled).toBe(false);
    });
  });

  describe('settling', () => {
    it('should settle grains at the bottom', () => {
      const maxRow = grid.getMaxRow();
      const grain = new SandGrain({
        x: 50,
        y: maxRow - 1,
        color: [1, 1, 1, 1],
        settled: false,
        startY: maxRow - 1
      });
      grain.targetY = maxRow - 1;
      grain.vy = 2;

      service.updateGrains([grain], grid, 100);

      // Grain should have reached bottom and settled
      expect(grain.y).toBe(maxRow);
      expect(grain.settled).toBe(true);
    });
  });
});
