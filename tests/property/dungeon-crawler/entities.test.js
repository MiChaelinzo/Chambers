import fc from 'fast-check';
import { Player } from '../../../games/dungeon-crawler/entities/Player.js';
import { Enemy } from '../../../games/dungeon-crawler/entities/Enemy.js';
import { Item } from '../../../games/dungeon-crawler/entities/Item.js';
import { Entity } from '../../../framework/core/Entity.js';

describe('Dungeon Crawler Entities - Property Tests', () => {
  beforeEach(() => {
    Entity.resetIdCounter();
  });

  // Feature: skeleton-crew-framework, Property 13: Combat damage application
  describe('Property 13: Combat damage application', () => {
    test('for any combat interaction, target health should decrease by damage amount and entity should be marked dead at zero health', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 200 }), // initial health
          fc.integer({ min: 1, max: 100 }), // damage amount
          (initialHealth, damageAmount) => {
            // Create an enemy with the generated health
            const enemy = new Enemy(100, 100, { health: initialHealth });
            
            // Verify initial state
            expect(enemy.state.health).toBe(initialHealth);
            expect(enemy.state.maxHealth).toBe(initialHealth);
            expect(enemy.isDead()).toBe(false);
            expect(enemy.isDeleted()).toBe(false);
            
            // Apply damage
            const expectedHealth = Math.max(0, initialHealth - damageAmount);
            enemy.takeDamage(damageAmount);
            
            // Verify health decreased correctly
            expect(enemy.state.health).toBe(expectedHealth);
            
            // Verify death state
            if (expectedHealth === 0) {
              expect(enemy.isDead()).toBe(true);
              expect(enemy.isDeleted()).toBe(true);
            } else {
              expect(enemy.isDead()).toBe(false);
              expect(enemy.isDeleted()).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('for any player taking damage, health should decrease correctly and death state should be tracked', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 200 }), // initial health
          fc.integer({ min: 1, max: 100 }), // damage amount
          (initialHealth, damageAmount) => {
            // Create a player with the generated health
            const player = new Player(100, 100, { health: initialHealth });
            
            // Verify initial state
            expect(player.state.health).toBe(initialHealth);
            expect(player.state.maxHealth).toBe(initialHealth);
            expect(player.isDead()).toBe(false);
            
            // Apply damage
            const expectedHealth = Math.max(0, initialHealth - damageAmount);
            player.takeDamage(damageAmount);
            
            // Verify health decreased correctly
            expect(player.state.health).toBe(expectedHealth);
            
            // Verify death state
            if (expectedHealth === 0) {
              expect(player.isDead()).toBe(true);
            } else {
              expect(player.isDead()).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('for any sequence of damage applications, health should never go below zero', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 200 }), // initial health
          fc.array(fc.integer({ min: 1, max: 50 }), { minLength: 1, maxLength: 10 }), // sequence of damage amounts
          (initialHealth, damageSequence) => {
            // Create an enemy with the generated health
            const enemy = new Enemy(100, 100, { health: initialHealth });
            
            let expectedHealth = initialHealth;
            
            // Apply each damage in sequence
            for (const damage of damageSequence) {
              if (!enemy.isDead()) {
                enemy.takeDamage(damage);
                expectedHealth = Math.max(0, expectedHealth - damage);
                
                // Health should match expected and never be negative
                expect(enemy.state.health).toBe(expectedHealth);
                expect(enemy.state.health).toBeGreaterThanOrEqual(0);
                
                // Once dead, should stay dead
                if (expectedHealth === 0) {
                  expect(enemy.isDead()).toBe(true);
                  expect(enemy.isDeleted()).toBe(true);
                }
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('for any enemy attacking player, player health should decrease by enemy damage', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 50, max: 200 }), // player health
          fc.integer({ min: 5, max: 50 }), // enemy damage
          fc.integer({ min: 10, max: 100 }), // attack radius
          (playerHealth, enemyDamage, attackRadius) => {
            // Create player and enemy close together
            const player = new Player(100, 100, { health: playerHealth });
            const enemy = new Enemy(100, 100, { 
              damage: enemyDamage, 
              attackRadius: attackRadius,
              attackRate: 10 // High attack rate to ensure attack happens
            });
            
            const scene = { entities: [player, enemy] };
            
            const initialPlayerHealth = player.state.health;
            
            // Update enemy (should attack player since they're at same position)
            enemy.update(0.1, { scene });
            
            // Player health should have decreased by enemy damage
            expect(player.state.health).toBe(initialPlayerHealth - enemyDamage);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: skeleton-crew-framework, Property 14: Item collection inventory addition
  describe('Property 14: Item collection inventory addition', () => {
    test('for any collectible item that a player picks up, the item should be added to inventory and removed from scene', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 500 }), // player x position
          fc.integer({ min: 0, max: 500 }), // player y position
          fc.integer({ min: 0, max: 500 }), // item x position
          fc.integer({ min: 0, max: 500 }), // item y position
          fc.constantFrom('health', 'weapon', 'speed', 'generic'), // item type
          fc.integer({ min: 1, max: 100 }), // item value
          fc.integer({ min: 10, max: 100 }), // collection radius
          (playerX, playerY, itemX, itemY, itemType, itemValue, collectionRadius) => {
            // Create player and item
            const player = new Player(playerX, playerY, { health: 100 });
            const item = new Item(itemX, itemY, { 
              itemType: itemType, 
              value: itemValue,
              collectionRadius: collectionRadius,
              name: `Test ${itemType}`
            });
            
            // Calculate distance between player and item
            const dx = playerX - itemX;
            const dy = playerY - itemY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Store initial state
            const initialInventorySize = player.state.inventory.length;
            const initialPlayerHealth = player.state.health;
            const initialPlayerDamage = player.state.damage || 10;
            const initialPlayerSpeed = player.state.speed || 100;
            
            // Create scene with both entities
            const scene = { entities: [player, item] };
            
            // Update item (triggers collection check)
            item.update(0.1, { scene });
            
            // Verify collection behavior based on distance
            if (distance <= collectionRadius) {
              // Item should be collected
              expect(item.state.collected).toBe(true);
              expect(item.isDeleted()).toBe(true);
              
              // Item should be added to inventory
              expect(player.state.inventory.length).toBe(initialInventorySize + 1);
              
              // Verify inventory contains the item
              const addedItem = player.state.inventory[player.state.inventory.length - 1];
              expect(addedItem.type).toBe(itemType);
              expect(addedItem.value).toBe(itemValue);
              expect(addedItem.name).toBe(`Test ${itemType}`);
              
              // Verify item effect was applied
              switch (itemType) {
                case 'health':
                  expect(player.state.health).toBe(Math.min(player.state.maxHealth, initialPlayerHealth + itemValue));
                  break;
                case 'weapon':
                  expect(player.state.damage).toBe(initialPlayerDamage + itemValue);
                  break;
                case 'speed':
                  expect(player.state.speed).toBe(initialPlayerSpeed + itemValue);
                  break;
                case 'generic':
                  // Generic items don't apply effects, just added to inventory
                  break;
              }
            } else {
              // Item should not be collected
              expect(item.state.collected).toBe(false);
              expect(item.isDeleted()).toBe(false);
              
              // Inventory should be unchanged
              expect(player.state.inventory.length).toBe(initialInventorySize);
              
              // Player stats should be unchanged
              expect(player.state.health).toBe(initialPlayerHealth);
              expect(player.state.damage).toBe(initialPlayerDamage);
              expect(player.state.speed).toBe(initialPlayerSpeed);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('for any sequence of item collections, all items should be added to inventory in order', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 500 }), // player position
          fc.array(
            fc.record({
              itemType: fc.constantFrom('health', 'weapon', 'speed', 'generic'),
              value: fc.integer({ min: 1, max: 50 }),
              offset: fc.integer({ min: 0, max: 20 }) // Small offset from player
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (playerPos, itemConfigs) => {
            // Create player
            const player = new Player(playerPos, playerPos, { health: 100 });
            const initialInventorySize = player.state.inventory.length;
            
            // Create items near player
            const items = itemConfigs.map((config, index) => {
              return new Item(
                playerPos + config.offset,
                playerPos + config.offset,
                {
                  itemType: config.itemType,
                  value: config.value,
                  collectionRadius: 50, // Large enough to collect all
                  name: `Item ${index}`
                }
              );
            });
            
            // Create scene
            const scene = { entities: [player, ...items] };
            
            // Update each item (triggers collection)
            items.forEach(item => {
              if (!item.isDeleted()) {
                item.update(0.1, { scene });
              }
            });
            
            // All items should be collected
            items.forEach(item => {
              expect(item.state.collected).toBe(true);
              expect(item.isDeleted()).toBe(true);
            });
            
            // Inventory should contain all items
            expect(player.state.inventory.length).toBe(initialInventorySize + itemConfigs.length);
            
            // Verify each item is in inventory
            for (let i = 0; i < itemConfigs.length; i++) {
              const inventoryItem = player.state.inventory[initialInventorySize + i];
              expect(inventoryItem.type).toBe(itemConfigs[i].itemType);
              expect(inventoryItem.value).toBe(itemConfigs[i].value);
              expect(inventoryItem.name).toBe(`Item ${i}`);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('for any item already collected, attempting to collect again should not add duplicate to inventory', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('health', 'weapon', 'speed', 'generic'), // item type
          fc.integer({ min: 1, max: 100 }), // item value
          (itemType, itemValue) => {
            // Create player and item at same position
            const player = new Player(100, 100);
            const item = new Item(100, 100, { 
              itemType: itemType, 
              value: itemValue,
              collectionRadius: 50
            });
            
            const scene = { entities: [player, item] };
            
            // Collect item first time
            item.update(0.1, { scene });
            
            expect(item.state.collected).toBe(true);
            expect(item.isDeleted()).toBe(true);
            expect(player.state.inventory.length).toBe(1);
            
            // Try to collect again
            item.collect(player);
            
            // Should still only have one item in inventory
            expect(player.state.inventory.length).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
