import { describe, test, expect } from '@jest/globals';
import { ThreatSystem } from '../../../framework/mechanics/ThreatSystem.js';

describe('ThreatSystem - Unit Tests', () => {
  describe('constructor', () => {
    test('creates threat system with default radius', () => {
      const system = new ThreatSystem();
      expect(system.detectionRadius).toBe(10);
      expect(system.threatLevels).toBeDefined();
      expect(system.threatLevels.size).toBe(0);
    });

    test('creates threat system with custom radius', () => {
      const system = new ThreatSystem({ radius: 15 });
      expect(system.detectionRadius).toBe(15);
    });
  });

  describe('registerThreat', () => {
    test('registers entity as threat with level', () => {
      const system = new ThreatSystem();
      const entity = { id: 'enemy1', position: { x: 0, y: 0 } };
      
      system.registerThreat(entity, 5);
      
      expect(system.isThreat(entity)).toBe(true);
      expect(system.getThreatLevelForEntity(entity)).toBe(5);
    });

    test('throws error for entity without id', () => {
      const system = new ThreatSystem();
      const entity = { position: { x: 0, y: 0 } };
      
      expect(() => system.registerThreat(entity, 5)).toThrow('Entity must have an id property');
    });

    test('throws error for null entity', () => {
      const system = new ThreatSystem();
      
      expect(() => system.registerThreat(null, 5)).toThrow('Entity must have an id property');
    });

    test('throws error for negative threat level', () => {
      const system = new ThreatSystem();
      const entity = { id: 'enemy1', position: { x: 0, y: 0 } };
      
      expect(() => system.registerThreat(entity, -5)).toThrow('Threat level must be a non-negative number');
    });

    test('throws error for non-number threat level', () => {
      const system = new ThreatSystem();
      const entity = { id: 'enemy1', position: { x: 0, y: 0 } };
      
      expect(() => system.registerThreat(entity, '5')).toThrow('Threat level must be a non-negative number');
    });

    test('allows zero threat level', () => {
      const system = new ThreatSystem();
      const entity = { id: 'enemy1', position: { x: 0, y: 0 } };
      
      system.registerThreat(entity, 0);
      
      expect(system.getThreatLevelForEntity(entity)).toBe(0);
    });

    test('overwrites existing threat level', () => {
      const system = new ThreatSystem();
      const entity = { id: 'enemy1', position: { x: 0, y: 0 } };
      
      system.registerThreat(entity, 5);
      system.registerThreat(entity, 10);
      
      expect(system.getThreatLevelForEntity(entity)).toBe(10);
    });
  });

  describe('getNearbyThreats', () => {
    test('returns empty array for no entities', () => {
      const system = new ThreatSystem({ radius: 10 });
      const player = { id: 'player', position: { x: 0, y: 0 } };
      
      const threats = system.getNearbyThreats(player, []);
      
      expect(threats).toEqual([]);
    });

    test('returns empty array for null player', () => {
      const system = new ThreatSystem({ radius: 10 });
      const entity = { id: 'enemy1', position: { x: 5, y: 0 } };
      
      const threats = system.getNearbyThreats(null, [entity]);
      
      expect(threats).toEqual([]);
    });

    test('returns empty array for player without position', () => {
      const system = new ThreatSystem({ radius: 10 });
      const player = { id: 'player' };
      const entity = { id: 'enemy1', position: { x: 5, y: 0 } };
      
      const threats = system.getNearbyThreats(player, [entity]);
      
      expect(threats).toEqual([]);
    });

    test('returns threats within detection radius', () => {
      const system = new ThreatSystem({ radius: 10 });
      const player = { id: 'player', position: { x: 0, y: 0 } };
      const enemy1 = { id: 'enemy1', position: { x: 5, y: 0 } };
      const enemy2 = { id: 'enemy2', position: { x: 0, y: 8 } };
      
      system.registerThreat(enemy1, 5);
      system.registerThreat(enemy2, 3);
      
      const threats = system.getNearbyThreats(player, [enemy1, enemy2]);
      
      expect(threats).toHaveLength(2);
      expect(threats).toContain(enemy1);
      expect(threats).toContain(enemy2);
    });

    test('excludes threats outside detection radius', () => {
      const system = new ThreatSystem({ radius: 10 });
      const player = { id: 'player', position: { x: 0, y: 0 } };
      const nearEnemy = { id: 'enemy1', position: { x: 5, y: 0 } };
      const farEnemy = { id: 'enemy2', position: { x: 20, y: 0 } };
      
      system.registerThreat(nearEnemy, 5);
      system.registerThreat(farEnemy, 10);
      
      const threats = system.getNearbyThreats(player, [nearEnemy, farEnemy]);
      
      expect(threats).toHaveLength(1);
      expect(threats).toContain(nearEnemy);
      expect(threats).not.toContain(farEnemy);
    });

    test('includes threat at exact detection radius', () => {
      const system = new ThreatSystem({ radius: 10 });
      const player = { id: 'player', position: { x: 0, y: 0 } };
      const enemy = { id: 'enemy1', position: { x: 10, y: 0 } };
      
      system.registerThreat(enemy, 5);
      
      const threats = system.getNearbyThreats(player, [enemy]);
      
      expect(threats).toHaveLength(1);
      expect(threats).toContain(enemy);
    });

    test('excludes non-threat entities', () => {
      const system = new ThreatSystem({ radius: 10 });
      const player = { id: 'player', position: { x: 0, y: 0 } };
      const enemy = { id: 'enemy1', position: { x: 5, y: 0 } };
      const item = { id: 'item1', position: { x: 3, y: 0 } };
      
      system.registerThreat(enemy, 5);
      // item is not registered as threat
      
      const threats = system.getNearbyThreats(player, [enemy, item]);
      
      expect(threats).toHaveLength(1);
      expect(threats).toContain(enemy);
      expect(threats).not.toContain(item);
    });

    test('handles entities without position', () => {
      const system = new ThreatSystem({ radius: 10 });
      const player = { id: 'player', position: { x: 0, y: 0 } };
      const enemy1 = { id: 'enemy1', position: { x: 5, y: 0 } };
      const enemy2 = { id: 'enemy2' }; // no position
      
      system.registerThreat(enemy1, 5);
      system.registerThreat(enemy2, 3);
      
      const threats = system.getNearbyThreats(player, [enemy1, enemy2]);
      
      expect(threats).toHaveLength(1);
      expect(threats).toContain(enemy1);
    });
  });

  describe('getThreatLevel', () => {
    test('returns 0 for no nearby threats', () => {
      const system = new ThreatSystem({ radius: 10 });
      const player = { id: 'player', position: { x: 0, y: 0 } };
      
      const level = system.getThreatLevel(player, []);
      
      expect(level).toBe(0);
    });

    test('returns sum of nearby threat levels', () => {
      const system = new ThreatSystem({ radius: 10 });
      const player = { id: 'player', position: { x: 0, y: 0 } };
      const enemy1 = { id: 'enemy1', position: { x: 5, y: 0 } };
      const enemy2 = { id: 'enemy2', position: { x: 0, y: 8 } };
      
      system.registerThreat(enemy1, 5);
      system.registerThreat(enemy2, 3);
      
      const level = system.getThreatLevel(player, [enemy1, enemy2]);
      
      expect(level).toBe(8);
    });

    test('excludes threats outside radius from calculation', () => {
      const system = new ThreatSystem({ radius: 10 });
      const player = { id: 'player', position: { x: 0, y: 0 } };
      const nearEnemy = { id: 'enemy1', position: { x: 5, y: 0 } };
      const farEnemy = { id: 'enemy2', position: { x: 20, y: 0 } };
      
      system.registerThreat(nearEnemy, 5);
      system.registerThreat(farEnemy, 10);
      
      const level = system.getThreatLevel(player, [nearEnemy, farEnemy]);
      
      expect(level).toBe(5);
    });

    test('handles multiple threats with different levels', () => {
      const system = new ThreatSystem({ radius: 15 });
      const player = { id: 'player', position: { x: 0, y: 0 } };
      const enemy1 = { id: 'enemy1', position: { x: 5, y: 0 } };
      const enemy2 = { id: 'enemy2', position: { x: 0, y: 10 } };
      const enemy3 = { id: 'enemy3', position: { x: 7, y: 7 } };
      
      system.registerThreat(enemy1, 10);
      system.registerThreat(enemy2, 5);
      system.registerThreat(enemy3, 3);
      
      const level = system.getThreatLevel(player, [enemy1, enemy2, enemy3]);
      
      expect(level).toBe(18);
    });
  });

  describe('unregisterThreat', () => {
    test('removes threat by entity object', () => {
      const system = new ThreatSystem();
      const entity = { id: 'enemy1', position: { x: 0, y: 0 } };
      
      system.registerThreat(entity, 5);
      const result = system.unregisterThreat(entity);
      
      expect(result).toBe(true);
      expect(system.isThreat(entity)).toBe(false);
    });

    test('removes threat by entity id', () => {
      const system = new ThreatSystem();
      const entity = { id: 'enemy1', position: { x: 0, y: 0 } };
      
      system.registerThreat(entity, 5);
      const result = system.unregisterThreat('enemy1');
      
      expect(result).toBe(true);
      expect(system.isThreat('enemy1')).toBe(false);
    });

    test('returns false for non-existent threat', () => {
      const system = new ThreatSystem();
      
      const result = system.unregisterThreat('nonexistent');
      
      expect(result).toBe(false);
    });
  });

  describe('isThreat', () => {
    test('returns true for registered threat by entity', () => {
      const system = new ThreatSystem();
      const entity = { id: 'enemy1', position: { x: 0, y: 0 } };
      
      system.registerThreat(entity, 5);
      
      expect(system.isThreat(entity)).toBe(true);
    });

    test('returns true for registered threat by id', () => {
      const system = new ThreatSystem();
      const entity = { id: 'enemy1', position: { x: 0, y: 0 } };
      
      system.registerThreat(entity, 5);
      
      expect(system.isThreat('enemy1')).toBe(true);
    });

    test('returns false for non-registered entity', () => {
      const system = new ThreatSystem();
      const entity = { id: 'enemy1', position: { x: 0, y: 0 } };
      
      expect(system.isThreat(entity)).toBe(false);
    });
  });

  describe('getThreatLevelForEntity', () => {
    test('returns threat level for registered threat by entity', () => {
      const system = new ThreatSystem();
      const entity = { id: 'enemy1', position: { x: 0, y: 0 } };
      
      system.registerThreat(entity, 7);
      
      expect(system.getThreatLevelForEntity(entity)).toBe(7);
    });

    test('returns threat level for registered threat by id', () => {
      const system = new ThreatSystem();
      const entity = { id: 'enemy1', position: { x: 0, y: 0 } };
      
      system.registerThreat(entity, 7);
      
      expect(system.getThreatLevelForEntity('enemy1')).toBe(7);
    });

    test('returns null for non-registered entity', () => {
      const system = new ThreatSystem();
      
      expect(system.getThreatLevelForEntity('nonexistent')).toBeNull();
    });
  });
});
