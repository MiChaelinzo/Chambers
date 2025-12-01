import { describe, test, expect } from '@jest/globals';
import { ResourceManager } from '../../../framework/mechanics/ResourceManager.js';

describe('ResourceManager - Unit Tests', () => {
  describe('constructor', () => {
    test('creates empty resource manager', () => {
      const manager = new ResourceManager();
      expect(manager.resources).toBeDefined();
      expect(manager.resources.size).toBe(0);
    });
  });

  describe('addResource', () => {
    test('adds resource with valid parameters', () => {
      const manager = new ResourceManager();
      manager.addResource('health', 100, 100, 0);
      
      const resource = manager.getResource('health');
      expect(resource).toEqual({ current: 100, max: 100, depleteRate: 0 });
    });

    test('adds resource with deplete rate', () => {
      const manager = new ResourceManager();
      manager.addResource('stamina', 50, 100, 5);
      
      const resource = manager.getResource('stamina');
      expect(resource).toEqual({ current: 50, max: 100, depleteRate: 5 });
    });

    test('throws error for empty name', () => {
      const manager = new ResourceManager();
      expect(() => manager.addResource('', 100, 100)).toThrow('Resource name must be a non-empty string');
    });

    test('throws error for non-string name', () => {
      const manager = new ResourceManager();
      expect(() => manager.addResource(123, 100, 100)).toThrow('Resource name must be a non-empty string');
    });

    test('throws error for non-number current', () => {
      const manager = new ResourceManager();
      expect(() => manager.addResource('health', '100', 100)).toThrow('Current and max must be numbers');
    });

    test('throws error for non-number max', () => {
      const manager = new ResourceManager();
      expect(() => manager.addResource('health', 100, '100')).toThrow('Current and max must be numbers');
    });

    test('throws error for max <= 0', () => {
      const manager = new ResourceManager();
      expect(() => manager.addResource('health', 0, 0)).toThrow('Max must be greater than 0');
      expect(() => manager.addResource('health', 0, -10)).toThrow('Max must be greater than 0');
    });

    test('throws error for current < 0', () => {
      const manager = new ResourceManager();
      expect(() => manager.addResource('health', -10, 100)).toThrow('Current must be between 0 and max');
    });

    test('throws error for current > max', () => {
      const manager = new ResourceManager();
      expect(() => manager.addResource('health', 150, 100)).toThrow('Current must be between 0 and max');
    });

    test('throws error for negative deplete rate', () => {
      const manager = new ResourceManager();
      expect(() => manager.addResource('health', 100, 100, -5)).toThrow('Deplete rate must be a non-negative number');
    });
  });

  describe('consume', () => {
    test('reduces resource by amount', () => {
      const manager = new ResourceManager();
      manager.addResource('health', 100, 100);
      
      manager.consume('health', 30);
      
      expect(manager.getResource('health').current).toBe(70);
    });

    test('clamps to 0 when consuming more than available', () => {
      const manager = new ResourceManager();
      manager.addResource('health', 50, 100);
      
      manager.consume('health', 80);
      
      expect(manager.getResource('health').current).toBe(0);
    });

    test('consuming exactly current amount sets to 0', () => {
      const manager = new ResourceManager();
      manager.addResource('health', 50, 100);
      
      manager.consume('health', 50);
      
      expect(manager.getResource('health').current).toBe(0);
    });

    test('returns false for non-existent resource', () => {
      const manager = new ResourceManager();
      
      const result = manager.consume('nonexistent', 10);
      
      expect(result).toBe(false);
    });

    test('returns false for negative amount', () => {
      const manager = new ResourceManager();
      manager.addResource('health', 100, 100);
      
      const result = manager.consume('health', -10);
      
      expect(result).toBe(false);
      expect(manager.getResource('health').current).toBe(100);
    });

    test('returns true on successful consumption', () => {
      const manager = new ResourceManager();
      manager.addResource('health', 100, 100);
      
      const result = manager.consume('health', 10);
      
      expect(result).toBe(true);
    });

    test('consuming 0 leaves resource unchanged', () => {
      const manager = new ResourceManager();
      manager.addResource('health', 100, 100);
      
      manager.consume('health', 0);
      
      expect(manager.getResource('health').current).toBe(100);
    });
  });

  describe('restore', () => {
    test('increases resource by amount', () => {
      const manager = new ResourceManager();
      manager.addResource('health', 50, 100);
      
      manager.restore('health', 30);
      
      expect(manager.getResource('health').current).toBe(80);
    });

    test('clamps to max when restoring beyond maximum', () => {
      const manager = new ResourceManager();
      manager.addResource('health', 80, 100);
      
      manager.restore('health', 50);
      
      expect(manager.getResource('health').current).toBe(100);
    });

    test('restoring exactly to max works correctly', () => {
      const manager = new ResourceManager();
      manager.addResource('health', 80, 100);
      
      manager.restore('health', 20);
      
      expect(manager.getResource('health').current).toBe(100);
    });

    test('returns false for non-existent resource', () => {
      const manager = new ResourceManager();
      
      const result = manager.restore('nonexistent', 10);
      
      expect(result).toBe(false);
    });

    test('returns false for negative amount', () => {
      const manager = new ResourceManager();
      manager.addResource('health', 50, 100);
      
      const result = manager.restore('health', -10);
      
      expect(result).toBe(false);
      expect(manager.getResource('health').current).toBe(50);
    });

    test('returns true on successful restoration', () => {
      const manager = new ResourceManager();
      manager.addResource('health', 50, 100);
      
      const result = manager.restore('health', 10);
      
      expect(result).toBe(true);
    });

    test('restoring 0 leaves resource unchanged', () => {
      const manager = new ResourceManager();
      manager.addResource('health', 50, 100);
      
      manager.restore('health', 0);
      
      expect(manager.getResource('health').current).toBe(50);
    });
  });

  describe('update', () => {
    test('depletes resources with deplete rate', () => {
      const manager = new ResourceManager();
      manager.addResource('stamina', 100, 100, 10); // 10 per second
      
      manager.update(1); // 1 second
      
      expect(manager.getResource('stamina').current).toBe(90);
    });

    test('depletes multiple resources', () => {
      const manager = new ResourceManager();
      manager.addResource('stamina', 100, 100, 10);
      manager.addResource('oxygen', 50, 50, 5);
      
      manager.update(2); // 2 seconds
      
      expect(manager.getResource('stamina').current).toBe(80);
      expect(manager.getResource('oxygen').current).toBe(40);
    });

    test('does not deplete resources with 0 deplete rate', () => {
      const manager = new ResourceManager();
      manager.addResource('health', 100, 100, 0);
      
      manager.update(5);
      
      expect(manager.getResource('health').current).toBe(100);
    });

    test('clamps depleted resources to 0', () => {
      const manager = new ResourceManager();
      manager.addResource('stamina', 30, 100, 10);
      
      manager.update(5); // Would deplete 50, but only 30 available
      
      expect(manager.getResource('stamina').current).toBe(0);
    });

    test('handles fractional delta time', () => {
      const manager = new ResourceManager();
      manager.addResource('stamina', 100, 100, 10);
      
      manager.update(0.5); // 0.5 seconds
      
      expect(manager.getResource('stamina').current).toBe(95);
    });

    test('ignores negative delta time', () => {
      const manager = new ResourceManager();
      manager.addResource('stamina', 100, 100, 10);
      
      manager.update(-1);
      
      expect(manager.getResource('stamina').current).toBe(100);
    });

    test('handles 0 delta time', () => {
      const manager = new ResourceManager();
      manager.addResource('stamina', 100, 100, 10);
      
      manager.update(0);
      
      expect(manager.getResource('stamina').current).toBe(100);
    });
  });

  describe('getResource', () => {
    test('returns resource state', () => {
      const manager = new ResourceManager();
      manager.addResource('health', 75, 100, 0);
      
      const resource = manager.getResource('health');
      
      expect(resource).toEqual({ current: 75, max: 100, depleteRate: 0 });
    });

    test('returns null for non-existent resource', () => {
      const manager = new ResourceManager();
      
      const resource = manager.getResource('nonexistent');
      
      expect(resource).toBeNull();
    });

    test('returns copy that does not affect internal state', () => {
      const manager = new ResourceManager();
      manager.addResource('health', 100, 100);
      
      const resource = manager.getResource('health');
      resource.current = 50;
      
      expect(manager.getResource('health').current).toBe(100);
    });
  });

  describe('getAllResources', () => {
    test('returns empty object for no resources', () => {
      const manager = new ResourceManager();
      
      const all = manager.getAllResources();
      
      expect(all).toEqual({});
    });

    test('returns all resources', () => {
      const manager = new ResourceManager();
      manager.addResource('health', 100, 100, 0);
      manager.addResource('stamina', 50, 100, 5);
      
      const all = manager.getAllResources();
      
      expect(all).toEqual({
        health: { current: 100, max: 100, depleteRate: 0 },
        stamina: { current: 50, max: 100, depleteRate: 5 }
      });
    });
  });

  describe('removeResource', () => {
    test('removes existing resource', () => {
      const manager = new ResourceManager();
      manager.addResource('health', 100, 100);
      
      const result = manager.removeResource('health');
      
      expect(result).toBe(true);
      expect(manager.getResource('health')).toBeNull();
    });

    test('returns false for non-existent resource', () => {
      const manager = new ResourceManager();
      
      const result = manager.removeResource('nonexistent');
      
      expect(result).toBe(false);
    });
  });

  describe('hasResource', () => {
    test('returns true for existing resource', () => {
      const manager = new ResourceManager();
      manager.addResource('health', 100, 100);
      
      expect(manager.hasResource('health')).toBe(true);
    });

    test('returns false for non-existent resource', () => {
      const manager = new ResourceManager();
      
      expect(manager.hasResource('health')).toBe(false);
    });
  });
});
