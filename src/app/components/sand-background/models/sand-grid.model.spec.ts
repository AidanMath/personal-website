import { SandGrid } from './sand-grid.model';
import { SandGrain } from './sand-grain.model';

describe('SandGrid', () => {
  let grid: SandGrid;

  beforeEach(() => {
    grid = new SandGrid(100, 50);
  });

  describe('constructor', () => {
    it('should create a grid with correct dimensions', () => {
      expect(grid.cols).toBe(100);
      expect(grid.rows).toBe(50);
    });
  });

  describe('setWalls and getWalls', () => {
    it('should set and get wall configuration', () => {
      grid.setWalls({ left: 10, right: 10, bottom: 5, top: 0 });
      const walls = grid.getWalls();

      expect(walls.left).toBe(10);
      expect(walls.right).toBe(10);
      expect(walls.bottom).toBe(5);
      expect(walls.top).toBe(0);
    });

    it('should partially update walls', () => {
      grid.setWalls({ left: 5 });
      const walls = grid.getWalls();

      expect(walls.left).toBe(5);
      expect(walls.right).toBe(0);
    });
  });

  describe('getPlayableArea', () => {
    it('should return correct playable area with no walls', () => {
      const area = grid.getPlayableArea();

      expect(area.minCol).toBe(0);
      expect(area.maxCol).toBe(99);
      expect(area.minRow).toBe(0);
      expect(area.maxRow).toBe(49);
    });

    it('should return correct playable area with walls', () => {
      grid.setWalls({ left: 10, right: 10, bottom: 5, top: 5 });
      const area = grid.getPlayableArea();

      expect(area.minCol).toBe(10);
      expect(area.maxCol).toBe(89);
      expect(area.minRow).toBe(5);
      expect(area.maxRow).toBe(44);
    });
  });

  describe('isWall', () => {
    beforeEach(() => {
      grid.setWalls({ left: 10, right: 10, bottom: 5, top: 5 });
    });

    it('should return true for left wall positions', () => {
      expect(grid.isWall(0, 25)).toBe(true);
      expect(grid.isWall(9, 25)).toBe(true);
    });

    it('should return true for right wall positions', () => {
      expect(grid.isWall(90, 25)).toBe(true);
      expect(grid.isWall(99, 25)).toBe(true);
    });

    it('should return true for bottom wall positions', () => {
      expect(grid.isWall(50, 45)).toBe(true);
      expect(grid.isWall(50, 49)).toBe(true);
    });

    it('should return true for top wall positions', () => {
      expect(grid.isWall(50, 0)).toBe(true);
      expect(grid.isWall(50, 4)).toBe(true);
    });

    it('should return false for playable area', () => {
      expect(grid.isWall(50, 25)).toBe(false);
    });
  });

  describe('isValidPosition', () => {
    it('should return true for valid positions', () => {
      expect(grid.isValidPosition(0, 0)).toBe(true);
      expect(grid.isValidPosition(50, 25)).toBe(true);
      expect(grid.isValidPosition(99, 49)).toBe(true);
    });

    it('should return false for invalid positions', () => {
      expect(grid.isValidPosition(-1, 0)).toBe(false);
      expect(grid.isValidPosition(0, -1)).toBe(false);
      expect(grid.isValidPosition(100, 0)).toBe(false);
      expect(grid.isValidPosition(0, 50)).toBe(false);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty cells', () => {
      expect(grid.isEmpty(50, 25)).toBe(true);
    });

    it('should return false for invalid positions', () => {
      expect(grid.isEmpty(-1, 0)).toBe(false);
    });

    it('should return false for wall positions', () => {
      grid.setWalls({ left: 10 });
      expect(grid.isEmpty(5, 25)).toBe(false);
    });

    it('should return false for occupied cells', () => {
      const grain = new SandGrain({ x: 50, y: 25, color: [1, 1, 1, 1] });
      grid.placeGrain(grain);
      expect(grid.isEmpty(50, 25)).toBe(false);
    });
  });

  describe('placeGrain and removeGrain', () => {
    it('should place and remove grains correctly', () => {
      const grain = new SandGrain({ x: 50, y: 25, color: [1, 1, 1, 1] });

      expect(grid.isEmpty(50, 25)).toBe(true);

      grid.placeGrain(grain);
      expect(grid.isEmpty(50, 25)).toBe(false);

      grid.removeGrain(grain);
      expect(grid.isEmpty(50, 25)).toBe(true);
    });
  });

  describe('getMaxRow', () => {
    it('should return correct max row with no bottom wall', () => {
      expect(grid.getMaxRow()).toBe(49);
    });

    it('should return correct max row with bottom wall', () => {
      grid.setWalls({ bottom: 5 });
      expect(grid.getMaxRow()).toBe(44);
    });
  });

  describe('canFlowDiagonalLeft', () => {
    it('should return true when diagonal left is empty', () => {
      expect(grid.canFlowDiagonalLeft(50, 25)).toBe(true);
    });

    it('should return false at left edge', () => {
      expect(grid.canFlowDiagonalLeft(0, 25)).toBe(false);
    });

    it('should return false when blocked by wall', () => {
      grid.setWalls({ left: 50 });
      expect(grid.canFlowDiagonalLeft(50, 25)).toBe(false);
    });
  });

  describe('canFlowDiagonalRight', () => {
    it('should return true when diagonal right is empty', () => {
      expect(grid.canFlowDiagonalRight(50, 25)).toBe(true);
    });

    it('should return false at right edge', () => {
      expect(grid.canFlowDiagonalRight(99, 25)).toBe(false);
    });

    it('should return false when blocked by wall', () => {
      grid.setWalls({ right: 50 });
      expect(grid.canFlowDiagonalRight(50, 25)).toBe(false);
    });
  });
});
