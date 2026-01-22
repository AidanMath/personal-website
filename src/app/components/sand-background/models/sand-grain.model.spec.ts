import { SandGrain, RGBAColor } from './sand-grain.model';

describe('SandGrain', () => {
  const defaultColor: RGBAColor = [0.5, 0.5, 0.5, 1];

  describe('constructor', () => {
    it('should create a grain with basic properties', () => {
      const grain = new SandGrain({
        x: 10,
        y: 20,
        color: defaultColor
      });

      expect(grain.x).toBe(10);
      expect(grain.y).toBe(20);
      expect(grain.color).toEqual(defaultColor);
      expect(grain.settled).toBe(false);
      expect(grain.active).toBe(true);
      expect(grain.delay).toBe(0);
    });

    it('should use startY when provided', () => {
      const grain = new SandGrain({
        x: 10,
        y: 100,
        color: defaultColor,
        startY: -10
      });

      expect(grain.y).toBe(-10);
      expect(grain.targetY).toBe(100);
    });

    it('should set active to false when delay is provided', () => {
      const grain = new SandGrain({
        x: 10,
        y: 20,
        color: defaultColor,
        delay: 50
      });

      expect(grain.active).toBe(false);
      expect(grain.delay).toBe(50);
    });

    it('should set initial velocity when startVy is provided', () => {
      const grain = new SandGrain({
        x: 10,
        y: 20,
        color: defaultColor,
        startVy: 2.5
      });

      expect(grain.vy).toBe(2.5);
    });

    it('should set settled state when provided', () => {
      const grain = new SandGrain({
        x: 10,
        y: 20,
        color: defaultColor,
        settled: true
      });

      expect(grain.settled).toBe(true);
    });
  });

  describe('activate', () => {
    it('should set active to true', () => {
      const grain = new SandGrain({
        x: 10,
        y: 20,
        color: defaultColor,
        delay: 50
      });

      expect(grain.active).toBe(false);
      grain.activate();
      expect(grain.active).toBe(true);
    });
  });

  describe('settle', () => {
    it('should set settled to true and reset velocity', () => {
      const grain = new SandGrain({
        x: 10,
        y: 20,
        color: defaultColor,
        startVy: 5
      });

      grain.settle();

      expect(grain.settled).toBe(true);
      expect(grain.vy).toBe(0);
    });
  });

  describe('unsettle', () => {
    it('should set settled to false with default velocity', () => {
      const grain = new SandGrain({
        x: 10,
        y: 20,
        color: defaultColor,
        settled: true
      });

      grain.unsettle();

      expect(grain.settled).toBe(false);
      expect(grain.vy).toBe(0.5);
    });

    it('should set settled to false with custom velocity', () => {
      const grain = new SandGrain({
        x: 10,
        y: 20,
        color: defaultColor,
        settled: true
      });

      grain.unsettle(2.0);

      expect(grain.settled).toBe(false);
      expect(grain.vy).toBe(2.0);
    });
  });
});
