import { describe, test } from '@jest/globals';
import fc from 'fast-check';
import { VisibilitySystem } from '../../../framework/mechanics/VisibilitySystem.js';

describe('VisibilitySystem - Property-Based Tests', () => {
  // Feature: skeleton-crew-framework, Property 5: Visibility radius filtering
  // **Validates: Requirements 2.1, 7.5**
  test('entities within radius are visible, entities outside are invisible', () => {
    fc.assert(
      fc.property(
        // Generate random visibility radius (1-20)
        fc.integer({ min: 1, max: 20 }),
        // Generate random player position
        fc.record({
          x: fc.integer({ min: -100, max: 100 }),
          y: fc.integer({ min: -100, max: 100 })
        }),
        // Generate array of random entities with positions
        fc.array(
          fc.record({
            id: fc.string(),
            position: fc.record({
              x: fc.integer({ min: -100, max: 100 }),
              y: fc.integer({ min: -100, max: 100 })
            })
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (radius, playerPos, entities) => {
          const player = { position: playerPos };
          const visibilitySystem = new VisibilitySystem({ radius, mode: 'circular' });

          const visibleEntities = visibilitySystem.getVisibleEntities(player, entities);

          // Check that all visible entities are within radius
          for (const entity of visibleEntities) {
            const dx = entity.position.x - player.position.x;
            const dy = entity.position.y - player.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > radius) {
              return false; // Entity outside radius should not be visible
            }
          }

          // Check that all entities within radius are in visible list
          for (const entity of entities) {
            const dx = entity.position.x - player.position.x;
            const dy = entity.position.y - player.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= radius) {
              if (!visibleEntities.includes(entity)) {
                return false; // Entity within radius should be visible
              }
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('isVisible returns true for entities within radius', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.record({
          x: fc.integer({ min: -100, max: 100 }),
          y: fc.integer({ min: -100, max: 100 })
        }),
        fc.record({
          x: fc.integer({ min: -100, max: 100 }),
          y: fc.integer({ min: -100, max: 100 })
        }),
        (radius, playerPos, entityPos) => {
          const player = { position: playerPos };
          const entity = { position: entityPos };
          const visibilitySystem = new VisibilitySystem({ radius, mode: 'circular' });

          const dx = entityPos.x - playerPos.x;
          const dy = entityPos.y - playerPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          const isVisible = visibilitySystem.isVisible(player, entity);

          // Property: isVisible should match distance check
          if (distance <= radius) {
            return isVisible === true;
          } else {
            return isVisible === false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('mode "none" makes all entities visible', () => {
    fc.assert(
      fc.property(
        fc.record({
          x: fc.integer({ min: -100, max: 100 }),
          y: fc.integer({ min: -100, max: 100 })
        }),
        fc.array(
          fc.record({
            id: fc.string(),
            position: fc.record({
              x: fc.integer({ min: -100, max: 100 }),
              y: fc.integer({ min: -100, max: 100 })
            })
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (playerPos, entities) => {
          const player = { position: playerPos };
          const visibilitySystem = new VisibilitySystem({ mode: 'none' });

          const visibleEntities = visibilitySystem.getVisibleEntities(player, entities);

          // All entities should be visible when mode is 'none'
          return visibleEntities.length === entities.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('empty entity list returns empty visible list', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.record({
          x: fc.integer({ min: -100, max: 100 }),
          y: fc.integer({ min: -100, max: 100 })
        }),
        (radius, playerPos) => {
          const player = { position: playerPos };
          const visibilitySystem = new VisibilitySystem({ radius, mode: 'circular' });

          const visibleEntities = visibilitySystem.getVisibleEntities(player, []);

          return visibleEntities.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});
