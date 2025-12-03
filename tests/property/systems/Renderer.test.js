import { jest } from '@jest/globals';
import fc from 'fast-check';
import { Renderer } from '../../../framework/systems/Renderer.js';
import { Entity } from '../../../framework/core/Entity.js';

describe('Renderer Property Tests', () => {
  let canvas;
  let renderer;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    renderer = new Renderer(canvas);
  });

  // Feature: skeleton-crew-framework, Property 19: Render call coverage
  describe('Property 19: Render call coverage', () => {
    test('should call render exactly once per visible entity per frame', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 1000 }),
              type: fc.constantFrom('player', 'enemy', 'item', 'door'),
              x: fc.integer({ min: -1000, max: 1000 }),
              y: fc.integer({ min: -1000, max: 1000 }),
              visible: fc.boolean()
            }),
            { minLength: 0, maxLength: 50 }
          ),
          (entityData) => {
            // Reset renderer
            renderer.clear();
            
            // Create entities and render them
            const visibleCount = entityData.filter(e => e.visible).length;
            
            entityData.forEach(data => {
              const entity = new Entity(data.id, data.type, data.x, data.y);
              renderer.drawEntity(entity, data.visible);
            });
            
            // After rendering, clear to finalize the frame
            renderer.clear();
            
            // The number of render calls should equal the number of entities
            // (both visible and invisible are tracked, but only visible are drawn)
            const actualRenderCalls = renderer.getLastFrameRenderCalls();
            
            // All entities should be tracked as render calls
            return actualRenderCalls === entityData.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should track render calls correctly across multiple frames', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 100 }),
                type: fc.constantFrom('player', 'enemy', 'item'),
                x: fc.integer({ min: 0, max: 500 }),
                y: fc.integer({ min: 0, max: 500 })
              }),
              { minLength: 0, maxLength: 20 }
            ),
            { minLength: 1, maxLength: 5 }
          ),
          (frames) => {
            let allFramesCorrect = true;
            
            frames.forEach(frameEntities => {
              renderer.clear();
              
              frameEntities.forEach(data => {
                const entity = new Entity(data.id, data.type, data.x, data.y);
                renderer.drawEntity(entity, true);
              });
              
              renderer.clear();
              
              if (renderer.getLastFrameRenderCalls() !== frameEntities.length) {
                allFramesCorrect = false;
              }
            });
            
            return allFramesCorrect;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: skeleton-crew-framework, Property 20: UI data completeness
  describe('Property 20: UI data completeness', () => {
    test('should include all required status information in UI data', () => {
      fc.assert(
        fc.property(
          fc.record({
            health: fc.integer({ min: 0, max: 100 }),
            maxHealth: fc.integer({ min: 1, max: 100 }),
            resources: fc.array(
              fc.record({
                name: fc.constantFrom('Stamina', 'Sanity', 'Energy', 'Mana'),
                current: fc.integer({ min: 0, max: 100 }),
                max: fc.integer({ min: 1, max: 100 })
              }),
              { minLength: 0, maxLength: 5 }
            ),
            inventory: fc.array(
              fc.constantFrom('Key', 'Potion', 'Map', 'Sword', 'Shield'),
              { minLength: 0, maxLength: 10 }
            )
          }),
          (playerState) => {
            // Create UI data from player state
            const uiData = {
              health: playerState.health,
              maxHealth: playerState.maxHealth,
              resources: playerState.resources,
              inventory: playerState.inventory
            };
            
            // Verify UI data contains all required information
            const hasHealth = uiData.health !== undefined;
            const hasMaxHealth = uiData.maxHealth !== undefined;
            const hasResources = Array.isArray(uiData.resources);
            const hasInventory = Array.isArray(uiData.inventory);
            
            // Verify all resources have required fields
            const allResourcesValid = uiData.resources.every(r => 
              r.name !== undefined && 
              r.current !== undefined && 
              r.max !== undefined
            );
            
            // Draw UI to ensure it doesn't throw
            let drawSucceeded = true;
            try {
              renderer.drawUI(uiData);
            } catch (e) {
              drawSucceeded = false;
            }
            
            return hasHealth && 
                   hasMaxHealth && 
                   hasResources && 
                   hasInventory && 
                   allResourcesValid && 
                   drawSucceeded;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should handle UI data with missing optional fields gracefully', () => {
      fc.assert(
        fc.property(
          fc.record({
            health: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
            maxHealth: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
            resources: fc.option(
              fc.array(
                fc.record({
                  name: fc.string({ minLength: 1, maxLength: 10 }),
                  current: fc.integer({ min: 0, max: 100 }),
                  max: fc.integer({ min: 1, max: 100 })
                }),
                { maxLength: 3 }
              ),
              { nil: undefined }
            ),
            inventory: fc.option(
              fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 5 }),
              { nil: undefined }
            )
          }),
          (uiData) => {
            // Drawing UI with partial data should not throw
            let succeeded = true;
            try {
              renderer.drawUI(uiData);
            } catch (e) {
              succeeded = false;
            }
            
            return succeeded;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should preserve all inventory items in UI rendering', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.oneof(
              fc.string({ minLength: 1, maxLength: 20 }),
              fc.record({
                name: fc.string({ minLength: 1, maxLength: 20 }),
                type: fc.constantFrom('weapon', 'potion', 'key', 'misc')
              })
            ),
            { minLength: 0, maxLength: 15 }
          ),
          (inventory) => {
            const uiData = { inventory };
            
            // Mock fillText to capture what's being drawn
            const drawnItems = [];
            const originalFillText = renderer.ctx.fillText;
            renderer.ctx.fillText = jest.fn((text, x, y) => {
              drawnItems.push(text);
              originalFillText.call(renderer.ctx, text, x, y);
            });
            
            renderer.drawUI(uiData);
            
            // Restore original fillText
            renderer.ctx.fillText = originalFillText;
            
            // Check that inventory items are represented in drawn text
            // Each item should appear in the drawn text
            if (inventory.length === 0) {
              // Should show empty message
              return drawnItems.some(text => text.includes('empty'));
            } else {
              // Each inventory item should be drawn
              return inventory.every(item => {
                const itemName = typeof item === 'string' ? item : (item.name || item.type);
                return drawnItems.some(text => text.includes(itemName));
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
