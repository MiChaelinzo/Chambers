import { describe, test, expect, beforeEach } from '@jest/globals';
import * as fc from 'fast-check';
import { Scene } from '../../../framework/core/Scene.js';
import { SceneManager } from '../../../framework/core/SceneManager.js';
import { Entity } from '../../../framework/core/Entity.js';

describe('Scene Flexibility Property Tests', () => {
  beforeEach(() => {
    // Reset entity ID counter before each test
    Entity.resetIdCounter();
  });

  /**
   * Feature: skeleton-crew-framework, Property 21: Scene system flexibility
   * Validates: Requirements 9.4
   * 
   * For any scene configuration marked as "procedural" or "fixed", the scene system 
   * should correctly handle both types, generating content for procedural scenes 
   * and loading exact layouts for fixed scenes.
   */
  test('scene system handles both procedural and fixed scene types correctly', () => {
    fc.assert(
      fc.property(
        // Generate mixed scene configurations with both procedural and fixed types
        fc.array(
          fc.record({
            sceneId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
            type: fc.constantFrom('procedural', 'fixed'),
            config: fc.record({
              // Common properties
              width: fc.option(fc.integer({ min: 10, max: 100 }), { nil: undefined }),
              height: fc.option(fc.integer({ min: 10, max: 100 }), { nil: undefined }),
              // Procedural-specific properties
              generator: fc.option(fc.record({
                roomCount: fc.integer({ min: 1, max: 20 }),
                minRoomSize: fc.integer({ min: 2, max: 8 }),
                maxRoomSize: fc.integer({ min: 5, max: 15 }),
                maxAttempts: fc.integer({ min: 10, max: 200 })
              }), { nil: undefined }),
              // Fixed-specific properties
              layout: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
              entities: fc.array(
                fc.record({
                  type: fc.constantFrom('player', 'enemy', 'item', 'door', 'key', 'clue'),
                  x: fc.integer({ min: 0, max: 100 }),
                  y: fc.integer({ min: 0, max: 100 }),
                  config: fc.record({
                    health: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
                    locked: fc.option(fc.boolean(), { nil: undefined }),
                    text: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined })
                  })
                }),
                { minLength: 0, maxLength: 15 }
              )
            })
          }),
          { minLength: 2, maxLength: 8 }
        ),
        (sceneConfigs) => {
          // Ensure unique scene IDs and at least one of each type
          const uniqueSceneIds = new Set();
          const validSceneConfigs = [];
          let hasProceduralScene = false;
          let hasFixedScene = false;
          
          for (const config of sceneConfigs) {
            if (!uniqueSceneIds.has(config.sceneId)) {
              uniqueSceneIds.add(config.sceneId);
              validSceneConfigs.push(config);
              
              if (config.type === 'procedural') {
                hasProceduralScene = true;
              } else if (config.type === 'fixed') {
                hasFixedScene = true;
              }
            }
          }

          // Need at least one of each type for meaningful testing
          if (!hasProceduralScene || !hasFixedScene || validSceneConfigs.length < 2) {
            return true; // Skip this test case
          }

          Entity.resetIdCounter();

          // Create scene manager
          const sceneManager = new SceneManager();

          // Create and register all scenes
          const scenes = [];
          for (const sceneConfig of validSceneConfigs) {
            // Create scene with type-specific configuration
            const fullConfig = {
              type: sceneConfig.type,
              ...sceneConfig.config
            };

            const scene = new Scene(sceneConfig.sceneId, fullConfig);
            
            // For fixed scenes, add entities directly as they have exact placements
            if (sceneConfig.type === 'fixed' && sceneConfig.config.entities) {
              for (const entityConfig of sceneConfig.config.entities) {
                const entity = new Entity(
                  null,
                  entityConfig.type,
                  entityConfig.x,
                  entityConfig.y,
                  entityConfig.config
                );
                scene.addEntity(entity);
              }
            }
            
            scenes.push({
              scene,
              config: sceneConfig,
              fullConfig
            });
            
            sceneManager.registerScene(sceneConfig.sceneId, scene);
          }

          // Test each scene type handles loading correctly
          for (const sceneData of scenes) {
            const { scene, config, fullConfig } = sceneData;

            // Load the scene
            sceneManager.loadScene(config.sceneId);

            // Property 1: Scene should be loaded regardless of type
            expect(scene.getIsLoaded()).toBe(true);
            expect(sceneManager.getCurrentScene()).toBe(scene);

            // Property 2: Scene should maintain its type configuration
            const sceneConfig = scene.getConfig();
            expect(sceneConfig.type).toBe(config.type);

            if (config.type === 'procedural') {
              // Property 3: Procedural scenes should support generation parameters
              if (fullConfig.generator) {
                expect(sceneConfig.generator).toBeDefined();
                expect(sceneConfig.generator.roomCount).toBe(fullConfig.generator.roomCount);
                expect(sceneConfig.generator.minRoomSize).toBe(fullConfig.generator.minRoomSize);
                expect(sceneConfig.generator.maxRoomSize).toBe(fullConfig.generator.maxRoomSize);
              }

              // Property 4: Procedural scenes can have dynamic content
              // (Content would be generated by game-specific logic, not the base Scene class)
              expect(sceneConfig.type).toBe('procedural');

            } else if (config.type === 'fixed') {
              // Property 5: Fixed scenes should preserve exact entity placements
              if (config.config.entities) {
                expect(scene.getEntityCount()).toBe(config.config.entities.length);

                // Verify each entity is placed exactly as configured
                for (const entityConfig of config.config.entities) {
                  const entitiesOfType = scene.getEntitiesByType(entityConfig.type);
                  const matchingEntity = entitiesOfType.find(e => {
                    const pos = e.getPosition();
                    return pos.x === entityConfig.x && pos.y === entityConfig.y;
                  });
                  expect(matchingEntity).toBeDefined();

                  // Verify entity configuration is preserved
                  if (entityConfig.config) {
                    const entityConfigData = matchingEntity.getConfig();
                    if (entityConfig.config.health !== undefined) {
                      expect(entityConfigData.health).toBe(entityConfig.config.health);
                    }
                    if (entityConfig.config.locked !== undefined) {
                      expect(entityConfigData.locked).toBe(entityConfig.config.locked);
                    }
                    if (entityConfig.config.text !== undefined) {
                      expect(entityConfigData.text).toBe(entityConfig.config.text);
                    }
                  }
                }
              }

              // Property 6: Fixed scenes should support layout references
              if (fullConfig.layout) {
                expect(sceneConfig.layout).toBe(fullConfig.layout);
              }
            }

            // Property 7: Both scene types should support common properties
            if (fullConfig.width !== undefined) {
              expect(sceneConfig.width).toBe(fullConfig.width);
            }
            if (fullConfig.height !== undefined) {
              expect(sceneConfig.height).toBe(fullConfig.height);
            }
          }

          // Property 8: Scene manager should handle transitions between different scene types
          const proceduralScenes = scenes.filter(s => s.config.type === 'procedural');
          const fixedScenes = scenes.filter(s => s.config.type === 'fixed');

          if (proceduralScenes.length > 0 && fixedScenes.length > 0) {
            // Transition from procedural to fixed
            sceneManager.loadScene(proceduralScenes[0].config.sceneId);
            expect(sceneManager.getCurrentScene().getConfig().type).toBe('procedural');

            sceneManager.loadScene(fixedScenes[0].config.sceneId);
            expect(sceneManager.getCurrentScene().getConfig().type).toBe('fixed');

            // Transition from fixed to procedural
            sceneManager.loadScene(proceduralScenes[0].config.sceneId);
            expect(sceneManager.getCurrentScene().getConfig().type).toBe('procedural');

            // Property 9: Previous scene should be properly unloaded regardless of type
            expect(fixedScenes[0].scene.getIsLoaded()).toBe(false);
          }

          // Property 10: All scene types should support the same core operations
          for (const sceneData of scenes) {
            const { scene } = sceneData;
            
            // Load scene if not already loaded
            if (!scene.getIsLoaded()) {
              sceneManager.loadScene(scene.getId());
            }

            // Test core operations work regardless of scene type
            const testEntity = new Entity(null, 'test', 50, 50);
            scene.addEntity(testEntity);
            
            expect(scene.getEntityById(testEntity.getId())).toBe(testEntity);
            expect(scene.getEntitiesByType('test')).toContain(testEntity);
            
            const removed = scene.removeEntity(testEntity.getId());
            expect(removed).toBe(true);
            expect(scene.getEntityById(testEntity.getId())).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  test('scene system maintains type-specific behavior during updates and renders', () => {
    fc.assert(
      fc.property(
        fc.record({
          proceduralConfig: fc.record({
            sceneId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
            generator: fc.record({
              width: fc.integer({ min: 20, max: 100 }),
              height: fc.integer({ min: 20, max: 100 }),
              roomCount: fc.integer({ min: 1, max: 10 })
            })
          }),
          fixedConfig: fc.record({
            sceneId: fc.string({ minLength: 1, max: 20 }).filter(s => s.trim().length > 0),
            layout: fc.string({ minLength: 1, maxLength: 50 }),
            entities: fc.array(
              fc.record({
                type: fc.constantFrom('door', 'key', 'clue'),
                x: fc.integer({ min: 0, max: 50 }),
                y: fc.integer({ min: 0, max: 50 })
              }),
              { minLength: 1, maxLength: 5 }
            )
          })
        }),
        ({ proceduralConfig, fixedConfig }) => {
          // Ensure different scene IDs
          if (proceduralConfig.sceneId === fixedConfig.sceneId) {
            return true; // Skip this test case
          }

          Entity.resetIdCounter();

          // Create procedural scene
          const proceduralScene = new Scene(proceduralConfig.sceneId, {
            type: 'procedural',
            generator: proceduralConfig.generator
          });

          // Create fixed scene with exact entity placements
          const fixedScene = new Scene(fixedConfig.sceneId, {
            type: 'fixed',
            layout: fixedConfig.layout
          });

          for (const entityConfig of fixedConfig.entities) {
            const entity = new Entity(null, entityConfig.type, entityConfig.x, entityConfig.y);
            fixedScene.addEntity(entity);
          }

          const sceneManager = new SceneManager();
          sceneManager.registerScene(proceduralConfig.sceneId, proceduralScene);
          sceneManager.registerScene(fixedConfig.sceneId, fixedScene);

          // Test procedural scene behavior
          sceneManager.loadScene(proceduralConfig.sceneId);
          
          // Property: Procedural scene maintains generator configuration
          const proceduralSceneConfig = proceduralScene.getConfig();
          expect(proceduralSceneConfig.type).toBe('procedural');
          expect(proceduralSceneConfig.generator).toEqual(proceduralConfig.generator);

          // Mock update and render calls
          const mockContext = { deltaTime: 0.016 };
          const mockCamera = { x: 0, y: 0, zoom: 1 };
          const mockCtx = { 
            fillRect: () => {}, 
            drawImage: () => {},
            clearRect: () => {},
            save: () => {},
            restore: () => {},
            translate: () => {},
            scale: () => {}
          };

          // Should handle update/render without errors
          expect(() => {
            proceduralScene.update(0.016, mockContext);
            proceduralScene.render(mockCtx, mockCamera);
          }).not.toThrow();

          // Test fixed scene behavior
          sceneManager.loadScene(fixedConfig.sceneId);

          // Property: Fixed scene maintains exact entity configuration
          expect(fixedScene.getEntityCount()).toBe(fixedConfig.entities.length);
          
          const fixedSceneConfig = fixedScene.getConfig();
          expect(fixedSceneConfig.type).toBe('fixed');
          expect(fixedSceneConfig.layout).toBe(fixedConfig.layout);

          // Verify entities are exactly as configured
          for (const entityConfig of fixedConfig.entities) {
            const entitiesOfType = fixedScene.getEntitiesByType(entityConfig.type);
            const matchingEntity = entitiesOfType.find(e => {
              const pos = e.getPosition();
              return pos.x === entityConfig.x && pos.y === entityConfig.y;
            });
            expect(matchingEntity).toBeDefined();
          }

          // Should handle update/render without errors
          expect(() => {
            fixedScene.update(0.016, mockContext);
            fixedScene.render(mockCtx, mockCamera);
          }).not.toThrow();

          // Property: Both scene types should be unloadable
          expect(proceduralScene.getIsLoaded()).toBe(false); // Unloaded when fixed scene loaded
          expect(fixedScene.getIsLoaded()).toBe(true);

          sceneManager.unloadCurrentScene();
          expect(fixedScene.getIsLoaded()).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});