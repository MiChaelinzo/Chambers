import { describe, test, expect, beforeEach } from '@jest/globals';
import * as fc from 'fast-check';
import { Entity } from '../../../framework/core/Entity.js';

describe('Entity Property Tests', () => {
  beforeEach(() => {
    // Reset ID counter before each test
    Entity.resetIdCounter();
  });

  /**
   * Feature: skeleton-crew-framework, Property 2: Entity lifecycle management
   * Validates: Requirements 1.2, 3.2
   * 
   * For any entity added to a scene, the entity should be retrievable by ID,
   * should maintain its configured properties, and should be removed when deleted.
   */
  test('entity lifecycle management - entities maintain properties and can be tracked by ID', () => {
    fc.assert(
      fc.property(
        // Generate random entity configurations
        fc.array(
          fc.record({
            type: fc.constantFrom('player', 'enemy', 'item', 'obstacle', 'npc'),
            x: fc.integer({ min: -1000, max: 1000 }),
            y: fc.integer({ min: -1000, max: 1000 }),
            config: fc.record({
              health: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
              speed: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
              damage: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
            })
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (entityConfigs) => {
          // Reset ID counter for consistent test
          Entity.resetIdCounter();

          // Simulate a simple scene with entity tracking
          const scene = {
            entities: new Map(),
            addEntity(entity) {
              this.entities.set(entity.getId(), entity);
            },
            getEntityById(id) {
              return this.entities.get(id);
            },
            removeEntity(id) {
              this.entities.delete(id);
            },
            getAllEntities() {
              return Array.from(this.entities.values());
            }
          };

          // Create entities and add to scene
          const createdEntities = [];
          for (const config of entityConfigs) {
            const entity = new Entity(null, config.type, config.x, config.y, config.config);
            scene.addEntity(entity);
            createdEntities.push({
              entity,
              originalType: config.type,
              originalX: config.x,
              originalY: config.y,
              originalConfig: { ...config.config }
            });
          }

          // Property 1: All entities should be retrievable by ID
          for (const { entity } of createdEntities) {
            const retrieved = scene.getEntityById(entity.getId());
            expect(retrieved).toBeDefined();
            expect(retrieved).toBe(entity);
          }

          // Property 2: Entities should maintain their configured properties
          for (const { entity, originalType, originalX, originalY, originalConfig } of createdEntities) {
            expect(entity.getType()).toBe(originalType);
            
            const position = entity.getPosition();
            expect(position.x).toBe(originalX);
            expect(position.y).toBe(originalY);
            
            const config = entity.getConfig();
            if (originalConfig.health !== undefined) {
              expect(config.health).toBe(originalConfig.health);
            }
            if (originalConfig.speed !== undefined) {
              expect(config.speed).toBe(originalConfig.speed);
            }
            if (originalConfig.damage !== undefined) {
              expect(config.damage).toBe(originalConfig.damage);
            }
          }

          // Property 3: Entities should be removable when deleted
          // Mark some entities for deletion (every other one)
          const entitiesToDelete = [];
          const entitiesRemaining = [];
          
          for (let i = 0; i < createdEntities.length; i++) {
            if (i % 2 === 0) {
              createdEntities[i].entity.delete();
              entitiesToDelete.push(createdEntities[i].entity);
            } else {
              entitiesRemaining.push(createdEntities[i].entity);
            }
          }

          // Remove deleted entities from scene
          for (const entity of entitiesToDelete) {
            expect(entity.isDeleted()).toBe(true);
            scene.removeEntity(entity.getId());
          }

          // Verify deleted entities are no longer in scene
          for (const entity of entitiesToDelete) {
            const retrieved = scene.getEntityById(entity.getId());
            expect(retrieved).toBeUndefined();
          }

          // Verify remaining entities are still in scene
          for (const entity of entitiesRemaining) {
            expect(entity.isDeleted()).toBe(false);
            const retrieved = scene.getEntityById(entity.getId());
            expect(retrieved).toBeDefined();
            expect(retrieved).toBe(entity);
          }

          // Property 4: Scene should accurately report all remaining entities
          const allEntities = scene.getAllEntities();
          expect(allEntities.length).toBe(entitiesRemaining.length);
          
          for (const entity of entitiesRemaining) {
            expect(allEntities).toContain(entity);
          }
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  test('entity IDs are unique across multiple entity creations', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        (numEntities) => {
          Entity.resetIdCounter();
          
          const entities = [];
          for (let i = 0; i < numEntities; i++) {
            entities.push(new Entity(null, 'test', 0, 0));
          }

          // Property: All IDs should be unique
          const ids = entities.map(e => e.getId());
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);

          // Property: IDs should be sequential starting from 1
          for (let i = 0; i < entities.length; i++) {
            expect(entities[i].getId()).toBe(i + 1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('entity position updates are reflected correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 1000 }),
        fc.integer({ min: -1000, max: 1000 }),
        fc.integer({ min: -1000, max: 1000 }),
        fc.integer({ min: -1000, max: 1000 }),
        (initialX, initialY, newX, newY) => {
          const entity = new Entity(null, 'test', initialX, initialY);
          
          // Property: Initial position should match constructor args
          const initialPos = entity.getPosition();
          expect(initialPos.x).toBe(initialX);
          expect(initialPos.y).toBe(initialY);

          // Property: Position updates should be reflected
          entity.setPosition(newX, newY);
          const updatedPos = entity.getPosition();
          expect(updatedPos.x).toBe(newX);
          expect(updatedPos.y).toBe(newY);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('entity state modifications are isolated and persistent', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            key: fc.constantFrom('health', 'mana', 'stamina', 'alive', 'speed'),
            value: fc.oneof(
              fc.integer({ min: 0, max: 1000 }),
              fc.boolean(),
              fc.string()
            )
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (stateUpdates) => {
          const entity = new Entity(null, 'test', 0, 0);

          // Apply all state updates
          for (const { key, value } of stateUpdates) {
            entity.setState(key, value);
          }

          // Property: Final state should match last value for each key
          // Build expected state by taking last value for each key
          const expectedState = {};
          for (const { key, value } of stateUpdates) {
            expectedState[key] = value;
          }

          const state = entity.getState();
          for (const key in expectedState) {
            expect(state[key]).toBe(expectedState[key]);
          }

          // Property: Getting state returns a copy (modifications don't affect entity)
          const stateCopy = entity.getState();
          stateCopy.newKey = 'should not affect entity';
          
          const stateAfter = entity.getState();
          expect(stateAfter.newKey).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('entity config is immutable after creation', () => {
    fc.assert(
      fc.property(
        fc.record({
          health: fc.integer({ min: 1, max: 1000 }),
          speed: fc.integer({ min: 1, max: 100 }),
          damage: fc.integer({ min: 1, max: 100 })
        }),
        (config) => {
          const entity = new Entity(null, 'test', 0, 0, config);

          // Property: Config should match initial values
          const retrievedConfig = entity.getConfig();
          expect(retrievedConfig.health).toBe(config.health);
          expect(retrievedConfig.speed).toBe(config.speed);
          expect(retrievedConfig.damage).toBe(config.damage);

          // Property: Modifying retrieved config doesn't affect entity
          retrievedConfig.health = 0;
          retrievedConfig.speed = 0;
          retrievedConfig.damage = 0;

          const configAfter = entity.getConfig();
          expect(configAfter.health).toBe(config.health);
          expect(configAfter.speed).toBe(config.speed);
          expect(configAfter.damage).toBe(config.damage);
        }
      ),
      { numRuns: 100 }
    );
  });
});
