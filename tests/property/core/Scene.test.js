import { describe, test, expect, beforeEach } from '@jest/globals';
import * as fc from 'fast-check';
import { Scene } from '../../../framework/core/Scene.js';
import { SceneManager } from '../../../framework/core/SceneManager.js';
import { Entity } from '../../../framework/core/Entity.js';

describe('Scene Property Tests', () => {
  beforeEach(() => {
    // Reset entity ID counter before each test
    Entity.resetIdCounter();
  });

  /**
   * Feature: skeleton-crew-framework, Property 3: Scene transition state consistency
   * Validates: Requirements 1.3
   * 
   * For any scene transition, loading a new scene should unload the previous scene,
   * set the new scene as current, and initialize all entities defined in the scene configuration.
   */
  test('scene transition state consistency - transitions properly unload old scene and load new scene', () => {
    fc.assert(
      fc.property(
        // Generate multiple scenes with entity configurations
        fc.array(
          fc.record({
            sceneId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
            config: fc.record({
              type: fc.constantFrom('procedural', 'fixed', 'puzzle', 'dungeon'),
              width: fc.option(fc.integer({ min: 10, max: 100 }), { nil: undefined }),
              height: fc.option(fc.integer({ min: 10, max: 100 }), { nil: undefined })
            }),
            entities: fc.array(
              fc.record({
                type: fc.constantFrom('player', 'enemy', 'item', 'obstacle'),
                x: fc.integer({ min: 0, max: 100 }),
                y: fc.integer({ min: 0, max: 100 }),
                config: fc.record({
                  health: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined })
                })
              }),
              { minLength: 0, maxLength: 10 }
            )
          }),
          { minLength: 2, maxLength: 5 }
        ),
        (sceneConfigs) => {
          // Ensure unique scene IDs
          const uniqueSceneIds = new Set();
          const validSceneConfigs = [];
          
          for (const config of sceneConfigs) {
            if (!uniqueSceneIds.has(config.sceneId)) {
              uniqueSceneIds.add(config.sceneId);
              validSceneConfigs.push(config);
            }
          }

          // Need at least 2 unique scenes for transition testing
          if (validSceneConfigs.length < 2) {
            return true; // Skip this test case
          }

          Entity.resetIdCounter();

          // Create scene manager
          const sceneManager = new SceneManager();

          // Create and register all scenes
          const scenes = [];
          for (const sceneConfig of validSceneConfigs) {
            const scene = new Scene(sceneConfig.sceneId, sceneConfig.config);
            
            // Add entities to scene configuration
            for (const entityConfig of sceneConfig.entities) {
              const entity = new Entity(
                null,
                entityConfig.type,
                entityConfig.x,
                entityConfig.y,
                entityConfig.config
              );
              scene.addEntity(entity);
            }
            
            scenes.push({
              scene,
              config: sceneConfig
            });
            
            sceneManager.registerScene(sceneConfig.sceneId, scene);
          }

          // Property 1: Initially, no scene should be loaded
          expect(sceneManager.getCurrentScene()).toBeNull();

          // Load first scene
          const firstScene = scenes[0];
          const loadedScene = sceneManager.loadScene(firstScene.config.sceneId);

          // Property 2: After loading, the scene should be current and loaded
          expect(sceneManager.getCurrentScene()).toBe(firstScene.scene);
          expect(loadedScene).toBe(firstScene.scene);
          expect(firstScene.scene.getIsLoaded()).toBe(true);

          // Property 3: All entities should be present in the loaded scene
          expect(firstScene.scene.getEntityCount()).toBe(firstScene.config.entities.length);

          // Verify each entity is present and has correct properties
          for (const entityConfig of firstScene.config.entities) {
            const entities = firstScene.scene.getEntitiesByType(entityConfig.type);
            const matchingEntity = entities.find(e => {
              const pos = e.getPosition();
              return pos.x === entityConfig.x && pos.y === entityConfig.y;
            });
            expect(matchingEntity).toBeDefined();
          }

          // Transition to each subsequent scene
          for (let i = 1; i < scenes.length; i++) {
            const previousScene = scenes[i - 1];
            const nextScene = scenes[i];

            // Load next scene
            const transitionData = { from: previousScene.config.sceneId };
            sceneManager.loadScene(nextScene.config.sceneId, transitionData);

            // Property 4: Previous scene should be unloaded
            expect(previousScene.scene.getIsLoaded()).toBe(false);
            expect(previousScene.scene.getEntityCount()).toBe(0); // Entities cleared on unload

            // Property 5: New scene should be current and loaded
            expect(sceneManager.getCurrentScene()).toBe(nextScene.scene);
            expect(nextScene.scene.getIsLoaded()).toBe(true);

            // Property 6: New scene should have all its entities initialized
            expect(nextScene.scene.getEntityCount()).toBe(nextScene.config.entities.length);

            // Verify entities in new scene
            for (const entityConfig of nextScene.config.entities) {
              const entities = nextScene.scene.getEntitiesByType(entityConfig.type);
              const matchingEntity = entities.find(e => {
                const pos = e.getPosition();
                return pos.x === entityConfig.x && pos.y === entityConfig.y;
              });
              expect(matchingEntity).toBeDefined();
            }
          }

          // Property 7: Only the last loaded scene should be loaded
          for (let i = 0; i < scenes.length - 1; i++) {
            expect(scenes[i].scene.getIsLoaded()).toBe(false);
          }
          expect(scenes[scenes.length - 1].scene.getIsLoaded()).toBe(true);

          // Property 8: Current scene should be the last one loaded
          expect(sceneManager.getCurrentScene()).toBe(scenes[scenes.length - 1].scene);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  test('scene entity lifecycle - entities can be added, retrieved, and removed', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constantFrom('player', 'enemy', 'item'),
            x: fc.integer({ min: 0, max: 100 }),
            y: fc.integer({ min: 0, max: 100 })
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (entityConfigs) => {
          Entity.resetIdCounter();
          
          const scene = new Scene('test-scene');
          scene.load();

          // Add all entities
          const entities = [];
          for (const config of entityConfigs) {
            const entity = new Entity(null, config.type, config.x, config.y);
            scene.addEntity(entity);
            entities.push(entity);
          }

          // Property: All entities should be retrievable
          expect(scene.getEntityCount()).toBe(entities.length);
          
          for (const entity of entities) {
            const retrieved = scene.getEntityById(entity.getId());
            expect(retrieved).toBe(entity);
          }

          // Property: Entities can be filtered by type
          const typeGroups = {};
          for (const entity of entities) {
            const type = entity.getType();
            if (!typeGroups[type]) {
              typeGroups[type] = [];
            }
            typeGroups[type].push(entity);
          }

          for (const type in typeGroups) {
            const entitiesOfType = scene.getEntitiesByType(type);
            expect(entitiesOfType.length).toBe(typeGroups[type].length);
            
            for (const entity of typeGroups[type]) {
              expect(entitiesOfType).toContain(entity);
            }
          }

          // Property: Removing entities decreases count
          const entitiesToRemove = entities.filter((_, i) => i % 2 === 0);
          const entitiesRemaining = entities.filter((_, i) => i % 2 !== 0);

          for (const entity of entitiesToRemove) {
            const removed = scene.removeEntity(entity.getId());
            expect(removed).toBe(true);
          }

          expect(scene.getEntityCount()).toBe(entitiesRemaining.length);

          // Property: Removed entities are no longer retrievable
          for (const entity of entitiesToRemove) {
            expect(scene.getEntityById(entity.getId())).toBeUndefined();
          }

          // Property: Remaining entities are still retrievable
          for (const entity of entitiesRemaining) {
            expect(scene.getEntityById(entity.getId())).toBe(entity);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('scene update and render delegate to entities', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.float({ min: Math.fround(0.001), max: Math.fround(1.0) }),
        (numEntities, deltaTime) => {
          Entity.resetIdCounter();

          const scene = new Scene('test-scene');
          scene.load();

          // Track update and render calls
          const updateCalls = [];
          const renderCalls = [];

          // Create custom entity class that tracks calls
          class TestEntity extends Entity {
            update(dt, context) {
              updateCalls.push({ id: this.getId(), deltaTime: dt, context });
            }

            render(ctx, camera) {
              renderCalls.push({ id: this.getId(), ctx, camera });
            }
          }

          // Add entities
          const entities = [];
          for (let i = 0; i < numEntities; i++) {
            const entity = new TestEntity(null, 'test', i, i);
            scene.addEntity(entity);
            entities.push(entity);
          }

          const context = { test: 'context' };
          const camera = { x: 0, y: 0, zoom: 1 };
          const ctx = { canvas: 'mock' };

          // Update scene
          scene.update(deltaTime, context);

          // Property: Update should be called for each entity
          expect(updateCalls.length).toBe(numEntities);
          
          for (const entity of entities) {
            const call = updateCalls.find(c => c.id === entity.getId());
            expect(call).toBeDefined();
            expect(call.deltaTime).toBe(deltaTime);
            expect(call.context).toBe(context);
          }

          // Render scene
          scene.render(ctx, camera);

          // Property: Render should be called for each entity
          expect(renderCalls.length).toBe(numEntities);
          
          for (const entity of entities) {
            const call = renderCalls.find(c => c.id === entity.getId());
            expect(call).toBeDefined();
            expect(call.ctx).toBe(ctx);
            expect(call.camera).toBe(camera);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('scene automatically removes deleted entities during update', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constantFrom('enemy', 'item'),
            x: fc.integer({ min: 0, max: 100 }),
            y: fc.integer({ min: 0, max: 100 })
          }),
          { minLength: 2, maxLength: 20 }
        ),
        (entityConfigs) => {
          Entity.resetIdCounter();

          const scene = new Scene('test-scene');
          scene.load();

          // Add entities
          const entities = [];
          for (const config of entityConfigs) {
            const entity = new Entity(null, config.type, config.x, config.y);
            scene.addEntity(entity);
            entities.push(entity);
          }

          const initialCount = scene.getEntityCount();
          expect(initialCount).toBe(entities.length);

          // Mark some entities for deletion (every other one)
          const entitiesToDelete = entities.filter((_, i) => i % 2 === 0);
          const entitiesRemaining = entities.filter((_, i) => i % 2 !== 0);

          for (const entity of entitiesToDelete) {
            entity.delete();
          }

          // Property: Before update, deleted entities are still in scene
          expect(scene.getEntityCount()).toBe(initialCount);

          // Update scene (should remove deleted entities)
          scene.update(0.016, {});

          // Property: After update, deleted entities are removed
          expect(scene.getEntityCount()).toBe(entitiesRemaining.length);

          // Property: Deleted entities are no longer retrievable
          for (const entity of entitiesToDelete) {
            expect(scene.getEntityById(entity.getId())).toBeUndefined();
          }

          // Property: Remaining entities are still present
          for (const entity of entitiesRemaining) {
            expect(scene.getEntityById(entity.getId())).toBe(entity);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
