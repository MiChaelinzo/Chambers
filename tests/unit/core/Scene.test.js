import { describe, test, expect, beforeEach } from '@jest/globals';
import { Scene } from '../../../framework/core/Scene.js';
import { SceneManager } from '../../../framework/core/SceneManager.js';
import { Entity } from '../../../framework/core/Entity.js';

describe('Scene Unit Tests', () => {
  beforeEach(() => {
    Entity.resetIdCounter();
  });

  describe('Scene', () => {
    test('creates scene with id and config', () => {
      const config = { type: 'dungeon', width: 50, height: 50 };
      const scene = new Scene('test-scene', config);

      expect(scene.getId()).toBe('test-scene');
      expect(scene.getConfig()).toEqual(config);
      expect(scene.getIsLoaded()).toBe(false);
      expect(scene.getEntityCount()).toBe(0);
    });

    test('load sets scene as loaded', () => {
      const scene = new Scene('test-scene');
      
      expect(scene.getIsLoaded()).toBe(false);
      scene.load();
      expect(scene.getIsLoaded()).toBe(true);
    });

    test('load is idempotent', () => {
      const scene = new Scene('test-scene');
      
      scene.load();
      expect(scene.getIsLoaded()).toBe(true);
      
      scene.load(); // Load again
      expect(scene.getIsLoaded()).toBe(true);
    });

    test('unload clears entities and sets loaded to false', () => {
      const scene = new Scene('test-scene');
      scene.load();

      const entity = new Entity(null, 'player', 10, 10);
      scene.addEntity(entity);
      expect(scene.getEntityCount()).toBe(1);

      scene.unload();
      expect(scene.getIsLoaded()).toBe(false);
      expect(scene.getEntityCount()).toBe(0);
    });

    test('unload is idempotent', () => {
      const scene = new Scene('test-scene');
      scene.load();
      
      scene.unload();
      expect(scene.getIsLoaded()).toBe(false);
      
      scene.unload(); // Unload again
      expect(scene.getIsLoaded()).toBe(false);
    });

    test('addEntity and getEntityById work correctly', () => {
      const scene = new Scene('test-scene');
      const entity = new Entity(null, 'player', 5, 5);

      scene.addEntity(entity);
      
      const retrieved = scene.getEntityById(entity.getId());
      expect(retrieved).toBe(entity);
    });

    test('removeEntity removes entity and returns true', () => {
      const scene = new Scene('test-scene');
      const entity = new Entity(null, 'player', 5, 5);

      scene.addEntity(entity);
      expect(scene.getEntityCount()).toBe(1);

      const removed = scene.removeEntity(entity.getId());
      expect(removed).toBe(true);
      expect(scene.getEntityCount()).toBe(0);
      expect(scene.getEntityById(entity.getId())).toBeUndefined();
    });

    test('removeEntity returns false for non-existent entity', () => {
      const scene = new Scene('test-scene');
      
      const removed = scene.removeEntity(999);
      expect(removed).toBe(false);
    });

    test('getAllEntities returns all entities', () => {
      const scene = new Scene('test-scene');
      const entity1 = new Entity(null, 'player', 0, 0);
      const entity2 = new Entity(null, 'enemy', 10, 10);
      const entity3 = new Entity(null, 'item', 20, 20);

      scene.addEntity(entity1);
      scene.addEntity(entity2);
      scene.addEntity(entity3);

      const allEntities = scene.getAllEntities();
      expect(allEntities.length).toBe(3);
      expect(allEntities).toContain(entity1);
      expect(allEntities).toContain(entity2);
      expect(allEntities).toContain(entity3);
    });

    test('getEntitiesByType filters entities correctly', () => {
      const scene = new Scene('test-scene');
      const player = new Entity(null, 'player', 0, 0);
      const enemy1 = new Entity(null, 'enemy', 10, 10);
      const enemy2 = new Entity(null, 'enemy', 20, 20);
      const item = new Entity(null, 'item', 30, 30);

      scene.addEntity(player);
      scene.addEntity(enemy1);
      scene.addEntity(enemy2);
      scene.addEntity(item);

      const enemies = scene.getEntitiesByType('enemy');
      expect(enemies.length).toBe(2);
      expect(enemies).toContain(enemy1);
      expect(enemies).toContain(enemy2);

      const players = scene.getEntitiesByType('player');
      expect(players.length).toBe(1);
      expect(players).toContain(player);
    });

    test('update does nothing when scene is not loaded', () => {
      const scene = new Scene('test-scene');
      
      let updateCalled = false;
      class TestEntity extends Entity {
        update() {
          updateCalled = true;
        }
      }

      const entity = new TestEntity(null, 'test', 0, 0);
      scene.addEntity(entity);

      scene.update(0.016, {});
      expect(updateCalled).toBe(false);
    });

    test('update calls update on all entities when loaded', () => {
      const scene = new Scene('test-scene');
      scene.load();

      const updateCalls = [];
      class TestEntity extends Entity {
        update(deltaTime, context) {
          updateCalls.push({ id: this.getId(), deltaTime, context });
        }
      }

      const entity1 = new TestEntity(null, 'test', 0, 0);
      const entity2 = new TestEntity(null, 'test', 10, 10);
      scene.addEntity(entity1);
      scene.addEntity(entity2);

      const context = { input: 'test' };
      scene.update(0.016, context);

      expect(updateCalls.length).toBe(2);
      expect(updateCalls[0].deltaTime).toBe(0.016);
      expect(updateCalls[0].context).toBe(context);
      expect(updateCalls[1].deltaTime).toBe(0.016);
      expect(updateCalls[1].context).toBe(context);
    });

    test('update removes deleted entities', () => {
      const scene = new Scene('test-scene');
      scene.load();

      const entity1 = new Entity(null, 'test', 0, 0);
      const entity2 = new Entity(null, 'test', 10, 10);
      scene.addEntity(entity1);
      scene.addEntity(entity2);

      expect(scene.getEntityCount()).toBe(2);

      entity1.delete();
      scene.update(0.016, {});

      expect(scene.getEntityCount()).toBe(1);
      expect(scene.getEntityById(entity1.getId())).toBeUndefined();
      expect(scene.getEntityById(entity2.getId())).toBe(entity2);
    });

    test('render does nothing when scene is not loaded', () => {
      const scene = new Scene('test-scene');
      
      let renderCalled = false;
      class TestEntity extends Entity {
        render() {
          renderCalled = true;
        }
      }

      const entity = new TestEntity(null, 'test', 0, 0);
      scene.addEntity(entity);

      scene.render({}, {});
      expect(renderCalled).toBe(false);
    });

    test('render calls render on all entities when loaded', () => {
      const scene = new Scene('test-scene');
      scene.load();

      const renderCalls = [];
      class TestEntity extends Entity {
        render(ctx, camera) {
          renderCalls.push({ id: this.getId(), ctx, camera });
        }
      }

      const entity1 = new TestEntity(null, 'test', 0, 0);
      const entity2 = new TestEntity(null, 'test', 10, 10);
      scene.addEntity(entity1);
      scene.addEntity(entity2);

      const ctx = { canvas: 'mock' };
      const camera = { x: 0, y: 0 };
      scene.render(ctx, camera);

      expect(renderCalls.length).toBe(2);
      expect(renderCalls[0].ctx).toBe(ctx);
      expect(renderCalls[0].camera).toBe(camera);
      expect(renderCalls[1].ctx).toBe(ctx);
      expect(renderCalls[1].camera).toBe(camera);
    });
  });

  describe('SceneManager', () => {
    test('creates empty scene manager', () => {
      const manager = new SceneManager();
      
      expect(manager.getCurrentScene()).toBeNull();
      expect(manager.getAllSceneIds()).toEqual([]);
      expect(manager.isTransitioning()).toBe(false);
    });

    test('registerScene adds scene to registry', () => {
      const manager = new SceneManager();
      const scene = new Scene('test-scene');

      manager.registerScene('test-scene', scene);

      expect(manager.hasScene('test-scene')).toBe(true);
      expect(manager.getScene('test-scene')).toBe(scene);
      expect(manager.getAllSceneIds()).toEqual(['test-scene']);
    });

    test('registerScene throws error for duplicate ID', () => {
      const manager = new SceneManager();
      const scene1 = new Scene('test-scene');
      const scene2 = new Scene('test-scene');

      manager.registerScene('test-scene', scene1);

      expect(() => {
        manager.registerScene('test-scene', scene2);
      }).toThrow('Scene with id "test-scene" is already registered');
    });

    test('loadScene loads scene and sets as current', () => {
      const manager = new SceneManager();
      const scene = new Scene('test-scene');
      manager.registerScene('test-scene', scene);

      expect(scene.getIsLoaded()).toBe(false);

      const loaded = manager.loadScene('test-scene');

      expect(loaded).toBe(scene);
      expect(scene.getIsLoaded()).toBe(true);
      expect(manager.getCurrentScene()).toBe(scene);
    });

    test('loadScene throws error for unregistered scene', () => {
      const manager = new SceneManager();

      expect(() => {
        manager.loadScene('non-existent');
      }).toThrow('Scene with id "non-existent" is not registered');
    });

    test('loadScene unloads previous scene', () => {
      const manager = new SceneManager();
      const scene1 = new Scene('scene1');
      const scene2 = new Scene('scene2');

      manager.registerScene('scene1', scene1);
      manager.registerScene('scene2', scene2);

      manager.loadScene('scene1');
      expect(scene1.getIsLoaded()).toBe(true);

      manager.loadScene('scene2');
      expect(scene1.getIsLoaded()).toBe(false);
      expect(scene2.getIsLoaded()).toBe(true);
      expect(manager.getCurrentScene()).toBe(scene2);
    });

    test('loadScene passes transition data', () => {
      const manager = new SceneManager();
      const scene = new Scene('test-scene');
      manager.registerScene('test-scene', scene);

      const transitionData = { from: 'previous-scene', score: 100 };
      manager.loadScene('test-scene', transitionData);

      expect(scene._transitionData).toEqual(transitionData);
    });

    test('unregisterScene removes scene from registry', () => {
      const manager = new SceneManager();
      const scene = new Scene('test-scene');
      manager.registerScene('test-scene', scene);

      expect(manager.hasScene('test-scene')).toBe(true);

      const removed = manager.unregisterScene('test-scene');
      expect(removed).toBe(true);
      expect(manager.hasScene('test-scene')).toBe(false);
    });

    test('unregisterScene returns false for non-existent scene', () => {
      const manager = new SceneManager();
      
      const removed = manager.unregisterScene('non-existent');
      expect(removed).toBe(false);
    });

    test('unregisterScene throws error for current scene', () => {
      const manager = new SceneManager();
      const scene = new Scene('test-scene');
      manager.registerScene('test-scene', scene);
      manager.loadScene('test-scene');

      expect(() => {
        manager.unregisterScene('test-scene');
      }).toThrow('Cannot unregister the currently active scene');
    });

    test('unloadCurrentScene unloads and clears current scene', () => {
      const manager = new SceneManager();
      const scene = new Scene('test-scene');
      manager.registerScene('test-scene', scene);
      manager.loadScene('test-scene');

      expect(manager.getCurrentScene()).toBe(scene);
      expect(scene.getIsLoaded()).toBe(true);

      manager.unloadCurrentScene();

      expect(manager.getCurrentScene()).toBeNull();
      expect(scene.getIsLoaded()).toBe(false);
    });

    test('unloadCurrentScene does nothing when no scene is loaded', () => {
      const manager = new SceneManager();
      
      expect(manager.getCurrentScene()).toBeNull();
      manager.unloadCurrentScene(); // Should not throw
      expect(manager.getCurrentScene()).toBeNull();
    });
  });
});
