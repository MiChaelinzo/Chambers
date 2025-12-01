import { describe, test, expect } from '@jest/globals';
import { VisibilitySystem } from '../../../framework/mechanics/VisibilitySystem.js';

describe('VisibilitySystem - Unit Tests', () => {
  describe('constructor', () => {
    test('creates system with default values', () => {
      const system = new VisibilitySystem();
      expect(system.visibilityRadius).toBe(5);
      expect(system.mode).toBe('circular');
    });

    test('creates system with custom radius', () => {
      const system = new VisibilitySystem({ radius: 10 });
      expect(system.visibilityRadius).toBe(10);
    });

    test('creates system with custom mode', () => {
      const system = new VisibilitySystem({ mode: 'none' });
      expect(system.mode).toBe('none');
    });
  });

  describe('isVisible', () => {
    test('returns true for entity within radius', () => {
      const system = new VisibilitySystem({ radius: 5 });
      const player = { position: { x: 0, y: 0 } };
      const entity = { position: { x: 3, y: 0 } };

      expect(system.isVisible(player, entity)).toBe(true);
    });

    test('returns false for entity outside radius', () => {
      const system = new VisibilitySystem({ radius: 5 });
      const player = { position: { x: 0, y: 0 } };
      const entity = { position: { x: 10, y: 0 } };

      expect(system.isVisible(player, entity)).toBe(false);
    });

    test('returns true for entity at exact radius boundary', () => {
      const system = new VisibilitySystem({ radius: 5 });
      const player = { position: { x: 0, y: 0 } };
      const entity = { position: { x: 3, y: 4 } }; // distance = 5

      expect(system.isVisible(player, entity)).toBe(true);
    });

    test('returns true for entity at same position as player', () => {
      const system = new VisibilitySystem({ radius: 5 });
      const player = { position: { x: 5, y: 5 } };
      const entity = { position: { x: 5, y: 5 } };

      expect(system.isVisible(player, entity)).toBe(true);
    });

    test('returns false for null player', () => {
      const system = new VisibilitySystem({ radius: 5 });
      const entity = { position: { x: 0, y: 0 } };

      expect(system.isVisible(null, entity)).toBe(false);
    });

    test('returns false for null entity', () => {
      const system = new VisibilitySystem({ radius: 5 });
      const player = { position: { x: 0, y: 0 } };

      expect(system.isVisible(player, null)).toBe(false);
    });

    test('returns true for any entity when mode is "none"', () => {
      const system = new VisibilitySystem({ mode: 'none' });
      const player = { position: { x: 0, y: 0 } };
      const entity = { position: { x: 1000, y: 1000 } };

      expect(system.isVisible(player, entity)).toBe(true);
    });
  });

  describe('getVisibleEntities', () => {
    test('returns empty array for empty entity list', () => {
      const system = new VisibilitySystem({ radius: 5 });
      const player = { position: { x: 0, y: 0 } };

      expect(system.getVisibleEntities(player, [])).toEqual([]);
    });

    test('returns only entities within radius', () => {
      const system = new VisibilitySystem({ radius: 5 });
      const player = { position: { x: 0, y: 0 } };
      const entities = [
        { id: 'e1', position: { x: 2, y: 0 } },  // within
        { id: 'e2', position: { x: 10, y: 0 } }, // outside
        { id: 'e3', position: { x: 0, y: 3 } },  // within
        { id: 'e4', position: { x: 8, y: 8 } }   // outside
      ];

      const visible = system.getVisibleEntities(player, entities);

      expect(visible).toHaveLength(2);
      expect(visible).toContain(entities[0]);
      expect(visible).toContain(entities[2]);
    });

    test('returns all entities when mode is "none"', () => {
      const system = new VisibilitySystem({ mode: 'none' });
      const player = { position: { x: 0, y: 0 } };
      const entities = [
        { id: 'e1', position: { x: 2, y: 0 } },
        { id: 'e2', position: { x: 100, y: 100 } },
        { id: 'e3', position: { x: -50, y: -50 } }
      ];

      const visible = system.getVisibleEntities(player, entities);

      expect(visible).toHaveLength(3);
      expect(visible).toEqual(entities);
    });

    test('returns empty array for null player', () => {
      const system = new VisibilitySystem({ radius: 5 });
      const entities = [{ id: 'e1', position: { x: 0, y: 0 } }];

      expect(system.getVisibleEntities(null, entities)).toEqual([]);
    });

    test('returns empty array for null entities', () => {
      const system = new VisibilitySystem({ radius: 5 });
      const player = { position: { x: 0, y: 0 } };

      expect(system.getVisibleEntities(player, null)).toEqual([]);
    });

    test('handles negative coordinates correctly', () => {
      const system = new VisibilitySystem({ radius: 5 });
      const player = { position: { x: -10, y: -10 } };
      const entities = [
        { id: 'e1', position: { x: -12, y: -10 } }, // within (distance = 2)
        { id: 'e2', position: { x: 0, y: 0 } }      // outside (distance > 14)
      ];

      const visible = system.getVisibleEntities(player, entities);

      expect(visible).toHaveLength(1);
      expect(visible[0].id).toBe('e1');
    });
  });
});
