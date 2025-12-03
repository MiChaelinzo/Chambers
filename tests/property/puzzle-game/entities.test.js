/**
 * Property-based tests for puzzle game entity interaction system
 * Feature: skeleton-crew-framework, Property 17: Interaction range validation
 * Validates: Requirements 6.2, 6.5
 */

import fc from 'fast-check';
import { InteractiveObject } from '../../../games/puzzle-game/entities/InteractiveObject.js';
import { Door } from '../../../games/puzzle-game/entities/Door.js';
import { Clue } from '../../../games/puzzle-game/entities/Clue.js';
import { Player } from '../../../games/puzzle-game/entities/Player.js';

describe('Puzzle Game Entity Interaction Properties', () => {
  describe('Property 17: Interaction range validation', () => {
    /**
     * For any interactive entity, the interaction should only trigger when the player 
     * is within the configured interaction range, and should be rejected with an error 
     * message when out of range.
     */
    test('InteractiveObject interactions respect range boundaries', () => {
      fc.assert(
        fc.property(
          fc.record({
            entityX: fc.integer({ min: 0, max: 1000 }),
            entityY: fc.integer({ min: 0, max: 1000 }),
            playerX: fc.integer({ min: 0, max: 1000 }),
            playerY: fc.integer({ min: 0, max: 1000 }),
            interactionRadius: fc.integer({ min: 10, max: 200 }),
            action: fc.constantFrom('examine', 'manipulate')
          }),
          ({ entityX, entityY, playerX, playerY, interactionRadius, action }) => {
            // Create interactive object with specified radius
            const obj = new InteractiveObject(entityX, entityY, {
              name: 'TestObject',
              interactionRadius,
              canManipulate: true
            });
            
            // Create player at specified position
            const player = new Player(playerX, playerY);
            
            // Calculate actual distance
            const dx = playerX - entityX;
            const dy = playerY - entityY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Attempt interaction
            const result = obj.onInteract(player, { action });
            
            // Property: interaction succeeds if and only if within range
            if (distance <= interactionRadius) {
              // Within range: interaction should succeed (or fail for valid game reasons, not range)
              expect(result.success).toBeDefined();
              expect(result.message).not.toContain('too far');
            } else {
              // Out of range: interaction should fail with range error
              expect(result.success).toBe(false);
              expect(result.message).toContain('too far');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Door interactions respect range boundaries', () => {
      fc.assert(
        fc.property(
          fc.record({
            entityX: fc.integer({ min: 0, max: 1000 }),
            entityY: fc.integer({ min: 0, max: 1000 }),
            playerX: fc.integer({ min: 0, max: 1000 }),
            playerY: fc.integer({ min: 0, max: 1000 }),
            interactionRadius: fc.integer({ min: 10, max: 200 }),
            action: fc.constantFrom('examine', 'unlock', 'use')
          }),
          ({ entityX, entityY, playerX, playerY, interactionRadius, action }) => {
            // Create door with specified radius
            const door = new Door(entityX, entityY, {
              name: 'TestDoor',
              interactionRadius,
              locked: true,
              keyRequired: null // No key required for simplicity
            });
            
            // Create player at specified position
            const player = new Player(playerX, playerY);
            
            // Calculate actual distance
            const dx = playerX - entityX;
            const dy = playerY - entityY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Attempt interaction
            const result = door.onInteract(player, { action });
            
            // Property: interaction succeeds if and only if within range
            if (distance <= interactionRadius) {
              // Within range: interaction should succeed (or fail for valid game reasons, not range)
              expect(result.success).toBeDefined();
              expect(result.message).not.toContain('too far');
            } else {
              // Out of range: interaction should fail with range error
              expect(result.success).toBe(false);
              expect(result.message).toContain('too far');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Clue interactions respect range boundaries', () => {
      fc.assert(
        fc.property(
          fc.record({
            entityX: fc.integer({ min: 0, max: 1000 }),
            entityY: fc.integer({ min: 0, max: 1000 }),
            playerX: fc.integer({ min: 0, max: 1000 }),
            playerY: fc.integer({ min: 0, max: 1000 }),
            interactionRadius: fc.integer({ min: 10, max: 200 })
          }),
          ({ entityX, entityY, playerX, playerY, interactionRadius }) => {
            // Create clue with specified radius
            const clue = new Clue(entityX, entityY, {
              name: 'TestClue',
              interactionRadius,
              storyText: 'Test story'
            });
            
            // Create player at specified position
            const player = new Player(playerX, playerY);
            
            // Calculate actual distance
            const dx = playerX - entityX;
            const dy = playerY - entityY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Attempt interaction
            const result = clue.onInteract(player, {});
            
            // Property: interaction succeeds if and only if within range
            if (distance <= interactionRadius) {
              // Within range: interaction should succeed
              expect(result.success).toBe(true);
              expect(result.message).not.toContain('too far');
            } else {
              // Out of range: interaction should fail with range error
              expect(result.success).toBe(false);
              expect(result.message).toContain('too far');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Interaction range validation provides clear error messages', () => {
      fc.assert(
        fc.property(
          fc.record({
            entityX: fc.integer({ min: 0, max: 500 }),
            entityY: fc.integer({ min: 0, max: 500 }),
            interactionRadius: fc.integer({ min: 10, max: 100 }),
            entityType: fc.constantFrom('interactive', 'door', 'clue')
          }),
          ({ entityX, entityY, interactionRadius, entityType }) => {
            // Create entity based on type
            let entity;
            if (entityType === 'interactive') {
              entity = new InteractiveObject(entityX, entityY, {
                name: 'TestObject',
                interactionRadius
              });
            } else if (entityType === 'door') {
              entity = new Door(entityX, entityY, {
                name: 'TestDoor',
                interactionRadius
              });
            } else {
              entity = new Clue(entityX, entityY, {
                name: 'TestClue',
                interactionRadius
              });
            }
            
            // Create player far outside interaction range
            const player = new Player(entityX + interactionRadius + 100, entityY);
            
            // Attempt interaction
            const result = entity.onInteract(player, { action: 'examine' });
            
            // Property: out-of-range interactions provide clear error messages
            expect(result.success).toBe(false);
            expect(result.message).toBeDefined();
            expect(typeof result.message).toBe('string');
            expect(result.message.length).toBeGreaterThan(0);
            expect(result.message).toContain('too far');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Interaction range is consistent with isInRange method', () => {
      fc.assert(
        fc.property(
          fc.record({
            entityX: fc.integer({ min: 0, max: 1000 }),
            entityY: fc.integer({ min: 0, max: 1000 }),
            playerX: fc.integer({ min: 0, max: 1000 }),
            playerY: fc.integer({ min: 0, max: 1000 }),
            interactionRadius: fc.integer({ min: 10, max: 200 })
          }),
          ({ entityX, entityY, playerX, playerY, interactionRadius }) => {
            // Create interactive object
            const obj = new InteractiveObject(entityX, entityY, {
              interactionRadius
            });
            
            // Create player
            const player = new Player(playerX, playerY);
            
            // Check isInRange method
            const inRange = obj.isInRange(player);
            
            // Attempt interaction
            const result = obj.onInteract(player, { action: 'examine' });
            
            // Property: isInRange should match interaction success/failure
            if (inRange) {
              expect(result.message).not.toContain('too far');
            } else {
              expect(result.success).toBe(false);
              expect(result.message).toContain('too far');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 18: Inventory state accuracy', () => {
    /**
     * For any player inventory, the inventory data structure should contain exactly 
     * the items the player has collected, with correct quantities and properties.
     */
    test('inventory accurately tracks added items', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              type: fc.constantFrom('key', 'clue', 'item', 'tool'),
              name: fc.string({ minLength: 1, maxLength: 20 }),
              description: fc.string({ maxLength: 100 }),
              keyType: fc.option(fc.constantFrom('red', 'blue', 'gold', 'silver')),
              value: fc.option(fc.integer({ min: 1, max: 100 }))
            }),
            { minLength: 0, maxLength: 20 }
          ),
          (itemsToAdd) => {
            // Create player
            const player = new Player(100, 100);
            
            // Track what we expect to be in inventory
            const expectedItems = [];
            
            // Add items one by one
            for (const item of itemsToAdd) {
              player.addToInventory(item);
              expectedItems.push({
                type: item.type,
                name: item.name || item.type,
                description: item.description || '',
                ...item
              });
            }
            
            // Get inventory
            const inventory = player.getInventory();
            
            // Property: inventory should contain exactly the items we added
            expect(inventory).toHaveLength(expectedItems.length);
            
            for (let i = 0; i < expectedItems.length; i++) {
              const expected = expectedItems[i];
              const actual = inventory[i];
              
              expect(actual.type).toBe(expected.type);
              expect(actual.name).toBe(expected.name);
              expect(actual.description).toBe(expected.description);
              
              // Check optional properties
              if (expected.keyType !== undefined) {
                expect(actual.keyType).toBe(expected.keyType);
              }
              if (expected.value !== undefined) {
                expect(actual.value).toBe(expected.value);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('inventory removal maintains accuracy', () => {
      fc.assert(
        fc.property(
          fc.record({
            initialItems: fc.array(
              fc.record({
                type: fc.constantFrom('key', 'clue', 'item'),
                name: fc.string({ minLength: 1, maxLength: 10 })
              }),
              { minLength: 1, maxLength: 10 }
            ),
            removeIndices: fc.array(fc.nat(), { maxLength: 5 })
          }),
          ({ initialItems, removeIndices }) => {
            // Create player and add items
            const player = new Player(100, 100);
            
            for (const item of initialItems) {
              player.addToInventory(item);
            }
            
            // Track expected state after removals
            const expectedItems = [...initialItems];
            
            // Remove items in reverse order to maintain index validity
            const validIndices = removeIndices
              .filter(index => index < expectedItems.length)
              .sort((a, b) => b - a); // Sort descending
            
            for (const index of validIndices) {
              const removedItem = player.removeFromInventory(index);
              const expectedRemoved = expectedItems.splice(index, 1)[0];
              
              // Verify removed item matches expected
              if (removedItem) {
                expect(removedItem.type).toBe(expectedRemoved.type);
                expect(removedItem.name).toBe(expectedRemoved.name);
              }
            }
            
            // Verify final inventory state
            const finalInventory = player.getInventory();
            expect(finalInventory).toHaveLength(expectedItems.length);
            
            for (let i = 0; i < expectedItems.length; i++) {
              expect(finalInventory[i].type).toBe(expectedItems[i].type);
              expect(finalInventory[i].name).toBe(expectedItems[i].name);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('inventory selection maintains consistency', () => {
      fc.assert(
        fc.property(
          fc.record({
            items: fc.array(
              fc.record({
                type: fc.constantFrom('key', 'clue', 'item'),
                name: fc.string({ minLength: 1, maxLength: 10 })
              }),
              { minLength: 0, maxLength: 10 }
            ),
            selections: fc.array(fc.integer({ min: -2, max: 15 }), { maxLength: 10 })
          }),
          ({ items, selections }) => {
            // Create player and add items
            const player = new Player(100, 100);
            
            for (const item of items) {
              player.addToInventory(item);
            }
            
            let expectedSelectedIndex = -1;
            
            // Apply selections
            for (const selection of selections) {
              player.selectItem(selection);
              
              // Update expected selection (only valid selections should take effect)
              if (selection >= -1 && selection < items.length) {
                expectedSelectedIndex = selection;
              }
              
              // Verify selection state
              const displayData = player.getInventoryDisplay();
              expect(displayData.selectedIndex).toBe(expectedSelectedIndex);
              
              const selectedItem = player.getSelectedItem();
              if (expectedSelectedIndex === -1) {
                expect(selectedItem).toBeNull();
              } else {
                expect(selectedItem).not.toBeNull();
                expect(selectedItem.type).toBe(items[expectedSelectedIndex].type);
                expect(selectedItem.name).toBe(items[expectedSelectedIndex].name);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('inventory display data is complete and accurate', () => {
      fc.assert(
        fc.property(
          fc.record({
            items: fc.array(
              fc.record({
                type: fc.constantFrom('key', 'clue', 'item'),
                name: fc.string({ minLength: 1, maxLength: 10 }),
                description: fc.string({ maxLength: 50 })
              }),
              { minLength: 0, maxLength: 15 }
            ),
            selectedIndex: fc.integer({ min: -1, max: 20 })
          }),
          ({ items, selectedIndex }) => {
            // Create player and add items
            const player = new Player(100, 100);
            
            for (const item of items) {
              player.addToInventory(item);
            }
            
            // Set selection
            player.selectItem(selectedIndex);
            
            // Get display data
            const displayData = player.getInventoryDisplay();
            
            // Property: display data should be complete and accurate
            expect(displayData.count).toBe(items.length);
            expect(displayData.items).toHaveLength(items.length);
            
            // Verify each item in display
            for (let i = 0; i < items.length; i++) {
              expect(displayData.items[i].type).toBe(items[i].type);
              expect(displayData.items[i].name).toBe(items[i].name);
              expect(displayData.items[i].description).toBe(items[i].description);
            }
            
            // Verify selected index
            const expectedSelectedIndex = (selectedIndex >= -1 && selectedIndex < items.length) ? selectedIndex : -1;
            expect(displayData.selectedIndex).toBe(expectedSelectedIndex);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
