import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { Entity } from '../../../framework/core/Entity.js';

describe('Entity Unit Tests', () => {
  beforeEach(() => {
    // Reset ID counter before each test
    Entity.resetIdCounter();
  });

  test('should create an entity with auto-generated ID', () => {
    const entity = new Entity(null, 'player', 10, 20);
    expect(entity.getId()).toBe(1);
    expect(entity.getType()).toBe('player');
    expect(entity.getPosition()).toEqual({ x: 10, y: 20 });
  });

  test('should create an entity with specified ID', () => {
    const entity = new Entity(42, 'enemy', 5, 15);
    expect(entity.getId()).toBe(42);
    expect(entity.getType()).toBe('enemy');
  });

  test('should generate unique IDs for multiple entities', () => {
    const entity1 = new Entity(null, 'player', 0, 0);
    const entity2 = new Entity(null, 'enemy', 0, 0);
    const entity3 = new Entity(null, 'item', 0, 0);
    
    expect(entity1.getId()).toBe(1);
    expect(entity2.getId()).toBe(2);
    expect(entity3.getId()).toBe(3);
  });

  test('should store configuration', () => {
    const config = { health: 100, speed: 5 };
    const entity = new Entity(null, 'player', 0, 0, config);
    
    const retrievedConfig = entity.getConfig();
    expect(retrievedConfig).toEqual(config);
    expect(retrievedConfig).not.toBe(config); // Should be a copy
  });

  test('should handle empty configuration', () => {
    const entity = new Entity(null, 'player', 0, 0);
    expect(entity.getConfig()).toEqual({});
  });

  test('should set and get position', () => {
    const entity = new Entity(null, 'player', 10, 20);
    expect(entity.getPosition()).toEqual({ x: 10, y: 20 });
    
    entity.setPosition(30, 40);
    expect(entity.getPosition()).toEqual({ x: 30, y: 40 });
  });

  test('should set and get state properties', () => {
    const entity = new Entity(null, 'player', 0, 0);
    expect(entity.getState()).toEqual({});
    
    entity.setState('health', 100);
    entity.setState('alive', true);
    
    const state = entity.getState();
    expect(state.health).toBe(100);
    expect(state.alive).toBe(true);
  });

  test('should mark entity for deletion', () => {
    const entity = new Entity(null, 'player', 0, 0);
    expect(entity.isDeleted()).toBe(false);
    
    entity.delete();
    expect(entity.isDeleted()).toBe(true);
  });

  test('should have update method stub', () => {
    const entity = new Entity(null, 'player', 0, 0);
    const context = { scene: 'test' };
    
    // Should not throw
    expect(() => entity.update(0.016, context)).not.toThrow();
  });

  test('should have render method stub', () => {
    const entity = new Entity(null, 'player', 0, 0);
    const mockCtx = {};
    const camera = { x: 0, y: 0, zoom: 1 };
    
    // Should not throw
    expect(() => entity.render(mockCtx, camera)).not.toThrow();
  });

  test('should have onInteract method with default behavior', () => {
    const entity = new Entity(null, 'item', 0, 0);
    const player = new Entity(null, 'player', 0, 0);
    const context = {};
    
    const result = entity.onInteract(player, context);
    expect(result.success).toBe(false);
    expect(result.message).toContain('item');
  });

  test('should return position copy, not reference', () => {
    const entity = new Entity(null, 'player', 10, 20);
    const pos1 = entity.getPosition();
    pos1.x = 999;
    
    const pos2 = entity.getPosition();
    expect(pos2.x).toBe(10); // Original position unchanged
  });

  test('should return state copy, not reference', () => {
    const entity = new Entity(null, 'player', 0, 0);
    entity.setState('health', 100);
    
    const state1 = entity.getState();
    state1.health = 0;
    
    const state2 = entity.getState();
    expect(state2.health).toBe(100); // Original state unchanged
  });

  test('should return config copy, not reference', () => {
    const config = { speed: 5 };
    const entity = new Entity(null, 'player', 0, 0, config);
    
    const config1 = entity.getConfig();
    config1.speed = 999;
    
    const config2 = entity.getConfig();
    expect(config2.speed).toBe(5); // Original config unchanged
  });
});
