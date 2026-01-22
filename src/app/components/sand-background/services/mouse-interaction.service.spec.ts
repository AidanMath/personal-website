import { MouseInteractionService } from './mouse-interaction.service';
import { SandGrain } from '../models/sand-grain.model';
import { SandGrid } from '../models/sand-grid.model';

describe('MouseInteractionService', () => {
  let service: MouseInteractionService;
  let grid: SandGrid;

  beforeEach(() => {
    service = new MouseInteractionService();
    grid = new SandGrid(100, 50);
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      expect(service).toBeTruthy();
    });

    it('should accept custom config', () => {
      const customService = new MouseInteractionService({
        interactionRadius: 50,
        interactionStrength: 5
      });
      expect(customService).toBeTruthy();
    });
  });

  describe('updateMousePosition', () => {
    it('should update mouse position and calculate velocity', () => {
      service.updateMousePosition(100, 100, 0);
      service.updateMousePosition(110, 105, 0);

      const state = service.getState();
      expect(state.x).toBe(110);
      expect(state.y).toBe(105);
      expect(state.velX).toBe(10);
      expect(state.velY).toBe(5);
    });

    it('should account for scroll offset', () => {
      service.updateMousePosition(100, 100, 50);

      const state = service.getState();
      expect(state.y).toBe(150);
    });
  });

  describe('getState', () => {
    it('should calculate speed correctly', () => {
      service.updateMousePosition(0, 0, 0);
      service.updateMousePosition(3, 4, 0);

      const state = service.getState();
      expect(state.speed).toBe(5); // 3-4-5 triangle
    });

    it('should detect when mouse is moving', () => {
      service.updateMousePosition(0, 0, 0);
      service.updateMousePosition(10, 10, 0);

      const state = service.getState();
      expect(state.isMoving).toBe(true);
    });

    it('should detect when mouse is stationary', () => {
      service.updateMousePosition(100, 100, 0);
      service.updateMousePosition(100, 100, 0);

      const state = service.getState();
      expect(state.isMoving).toBe(false);
    });
  });

  describe('decayVelocity', () => {
    it('should reduce velocity over time', () => {
      service.updateMousePosition(0, 0, 0);
      service.updateMousePosition(100, 100, 0);

      const initialState = service.getState();
      const initialSpeed = initialState.speed;

      service.decayVelocity();

      const decayedState = service.getState();
      expect(decayedState.speed).toBeLessThan(initialSpeed);
    });
  });

  describe('processInteraction', () => {
    it('should not affect grains when mouse is not moving', () => {
      const grain = new SandGrain({
        x: 50,
        y: 25,
        color: [1, 1, 1, 1],
        settled: true
      });
      grid.placeGrain(grain);

      // Mouse not moving (same position twice)
      service.updateMousePosition(50, 25, 0);
      service.updateMousePosition(50, 25, 0);

      service.processInteraction([grain], grid, 2);

      expect(grain.settled).toBe(true);
      expect(grain.x).toBe(50);
      expect(grain.y).toBe(25);
    });

    it('should not affect inactive grains', () => {
      const grain = new SandGrain({
        x: 50,
        y: 25,
        color: [1, 1, 1, 1],
        delay: 100
      });

      service.updateMousePosition(0, 0, 0);
      service.updateMousePosition(50, 25, 0);

      const initialX = grain.x;
      const initialY = grain.y;

      service.processInteraction([grain], grid, 2);

      expect(grain.x).toBe(initialX);
      expect(grain.y).toBe(initialY);
    });

    it('should not affect grains outside interaction radius', () => {
      const grain = new SandGrain({
        x: 50,
        y: 25,
        color: [1, 1, 1, 1],
        settled: true
      });
      grid.placeGrain(grain);

      // Mouse far from grain (at 0,0, grain at 50,25 in grid coords = 100,50 in pixels with pixelSize=2)
      service.updateMousePosition(0, 0, 0);
      service.updateMousePosition(10, 10, 0);

      const initialX = grain.x;
      const initialY = grain.y;

      service.processInteraction([grain], grid, 2);

      expect(grain.x).toBe(initialX);
      expect(grain.y).toBe(initialY);
    });

    it('should affect grains within interaction radius', () => {
      const grain = new SandGrain({
        x: 10,
        y: 10,
        color: [1, 1, 1, 1],
        settled: true
      });
      grid.placeGrain(grain);

      // Mouse moving near grain (grain at 10,10 in grid = 21,21 pixels with pixelSize=2)
      service.updateMousePosition(15, 15, 0);
      service.updateMousePosition(21, 21, 0);

      service.processInteraction([grain], grid, 2);

      // Grain should be unsettled or moved
      expect(grain.settled).toBe(false);
    });
  });
});
