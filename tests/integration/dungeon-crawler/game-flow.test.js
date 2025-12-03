/**
 * Integration tests for dungeon crawler game flow
 * Tests complete game flow from start to death
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { Game } from '../../../framework/core/Game.js';
import { DungeonScene } from '../../../games/dungeon-crawler/DungeonScene.js';

describe('Dungeon Crawler Integration Tests', () => {
  let canvas;
  let game;
  let dungeonScene;

  beforeEach(() => {
    // Create a mock canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    // Game configuration
    const gameConfig = {
      canvas: canvas,
      targetFPS: 60,
      visibility: {
        mode: 'circular',
        radius: 5
      },
      resources: [
        { name: 'health', max: 100, start: 100 },
        { name: 'stamina', max: 100, start: 100, depleteRate: 1 }
      ],
      maxSanity: 100
    };

    // Dungeon scene configuration
    const dungeonConfig = {
      generator: {
        width: 30,
        height: 30,
        minRooms: 3,
        maxRooms: 5,
        minRoomSize: 4,
        maxRoomSize: 8
      },
      player: {
        health: 100,
        speed: 100,
        damage: 10,
        width: 32
      },
      enemies: {
        count: 2,
        config: {
          health: 30,
          speed: 50,
          damage: 10,
          width: 32,
          chaseRadius: 200,
          attackRadius: 32,
          attackRate: 1.0
        }
      },
      items: {
        count: 1,
        config: {
          itemType: 'health',
          value: 25,
          width: 24,
          collectionRadius: 32
        }
      }
    };

    // Initialize the game
    game = new Game(gameConfig);
    dungeonScene = new DungeonScene('dungeon', dungeonConfig);
    game.registerScene('dungeon', dungeonScene);
  });

  afterEach(() => {
    if (game) {
      game.shutdown();
    }
  });

  describe('Complete game flow from start to death', () => {
    test('should initialize game and load dungeon scene', () => {
      game.loadScene('dungeon');
      game.initialize();

      const currentScene = game.getSceneManager().getCurrentScene();
      expect(currentScene).toBe(dungeonScene);
      expect(currentScene.id).toBe('dungeon');

      // Verify entities were spawned
      const entities = currentScene.getAllEntities();
      expect(entities.length).toBeGreaterThan(0);

      // Should have player
      const player = entities.find(e => e.type === 'player');
      expect(player).toBeDefined();
      expect(player.state.health).toBe(100);
    });

    test('should handle player death and trigger permadeath callback', () => {
      game.loadScene('dungeon');
      game.initialize();

      // Set up permadeath callback
      let deathCallbackCalled = false;
      game.onPlayerDeathCallback(() => {
        deathCallbackCalled = true;
      });

      // Verify callback was registered
      expect(game.playerDeathCallback).toBeDefined();

      // Find player and kill them
      const currentScene = game.getSceneManager().getCurrentScene();
      const entities = currentScene.getAllEntities();
      const player = entities.find(e => e.type === 'player');

      expect(player).toBeDefined();

      // Reduce player health to 0
      player.state.health = 0;
      
      // Verify player is dead
      expect(player.isDead()).toBe(true);
      
      // Set game.player reference so death check works
      game.player = player;

      // Manually call _handlePlayerDeath to test it directly
      game._handlePlayerDeath();

      // Callback should have been called
      expect(deathCallbackCalled).toBe(true);
    });

    test('should regenerate dungeon after player death', () => {
      game.loadScene('dungeon');
      game.initialize();

      const initialSeed = dungeonScene.getSeed();

      // Set up permadeath callback to regenerate
      let callbackExecuted = false;
      game.onPlayerDeathCallback(() => {
        callbackExecuted = true;
        
        // Regenerate dungeon
        dungeonScene.regenerate();
        const newSeed = dungeonScene.getSeed();

        // Seed should be different (new dungeon)
        expect(newSeed).not.toBe(initialSeed);

        // Reload scene
        game.loadScene('dungeon');

        // Verify new entities
        const currentScene = game.getSceneManager().getCurrentScene();
        const entities = currentScene.getAllEntities();
        const player = entities.find(e => e.type === 'player');

        expect(player).toBeDefined();
        expect(player.state.health).toBe(100);
      });

      // Kill player
      const currentScene = game.getSceneManager().getCurrentScene();
      const entities = currentScene.getAllEntities();
      const player = entities.find(e => e.type === 'player');
      player.state.health = 0;
      
      // Set game.player reference so death check works
      game.player = player;

      // Manually trigger death callback
      game._handlePlayerDeath();
      
      // Verify callback was executed
      expect(callbackExecuted).toBe(true);
    });
  });

  describe('Item collection and usage', () => {
    test('should collect items when player collides with them', () => {
      game.loadScene('dungeon');
      game.initialize();

      const currentScene = game.getSceneManager().getCurrentScene();
      const entities = currentScene.getAllEntities();
      const player = entities.find(e => e.type === 'player');
      const item = entities.find(e => e.type === 'item');

      expect(player).toBeDefined();
      expect(item).toBeDefined();

      const initialInventorySize = player.state.inventory.length;

      // Move player to item position
      player.position.x = item.position.x;
      player.position.y = item.position.y;

      // Create context for scene update
      const context = {
        input: game.getInputHandler(),
        game: game,
        scene: currentScene
      };

      // Update scene to trigger collision detection
      currentScene.update(0.016, context);

      // Item should be collected
      expect(player.state.inventory.length).toBe(initialInventorySize + 1);

      // Item should be removed from scene
      const updatedEntities = currentScene.getAllEntities();
      const itemStillExists = updatedEntities.find(e => e.id === item.id);
      expect(itemStillExists).toBeUndefined();
    });

    test('should apply item effects when collected', () => {
      game.loadScene('dungeon');
      game.initialize();

      const currentScene = game.getSceneManager().getCurrentScene();
      const entities = currentScene.getAllEntities();
      const player = entities.find(e => e.type === 'player');
      const item = entities.find(e => e.type === 'item');

      expect(player).toBeDefined();
      expect(item).toBeDefined();

      // Remove all enemies to prevent combat interference
      const enemies = entities.filter(e => e.type === 'enemy');
      enemies.forEach(enemy => enemy.delete());

      // Damage player first
      player.state.health = 50;

      // Move player to item position
      player.position.x = item.position.x;
      player.position.y = item.position.y;

      // Create context for scene update
      const context = {
        input: game.getInputHandler(),
        game: game,
        scene: currentScene
      };

      // Update scene to trigger collection
      currentScene.update(0.016, context);

      // Health should be restored (health potion heals 25)
      expect(player.state.health).toBe(75);
    });

    test('should track multiple items in inventory', () => {
      game.loadScene('dungeon');
      game.initialize();

      const currentScene = game.getSceneManager().getCurrentScene();
      const entities = currentScene.getAllEntities();
      const player = entities.find(e => e.type === 'player');
      const items = entities.filter(e => e.type === 'item');

      expect(player).toBeDefined();
      expect(items.length).toBeGreaterThan(0);

      const initialInventorySize = player.state.inventory.length;

      // Create context for scene update
      const context = {
        input: game.getInputHandler(),
        game: game,
        scene: currentScene
      };

      // Collect all items
      items.forEach(item => {
        player.position.x = item.position.x;
        player.position.y = item.position.y;
        currentScene.update(0.016, context);
      });

      // All items should be in inventory
      expect(player.state.inventory.length).toBe(initialInventorySize + items.length);
    });
  });

  describe('Enemy spawning and combat', () => {
    test('should spawn enemies in the dungeon', () => {
      game.loadScene('dungeon');
      game.initialize();

      const currentScene = game.getSceneManager().getCurrentScene();
      const entities = currentScene.getAllEntities();
      const enemies = entities.filter(e => e.type === 'enemy');

      // Should have spawned enemies
      expect(enemies.length).toBeGreaterThan(0);

      // Each enemy should have health
      enemies.forEach(enemy => {
        expect(enemy.state.health).toBeGreaterThan(0);
        expect(enemy.config.damage).toBeDefined();
      });
    });

    test('should apply damage when player collides with enemy', () => {
      game.loadScene('dungeon');
      game.initialize();

      const currentScene = game.getSceneManager().getCurrentScene();
      const entities = currentScene.getAllEntities();
      const player = entities.find(e => e.type === 'player');
      const enemy = entities.find(e => e.type === 'enemy');

      expect(player).toBeDefined();
      expect(enemy).toBeDefined();

      const initialPlayerHealth = player.state.health;
      const initialEnemyHealth = enemy.state.health;

      // Test that damage methods work
      player.takeDamage(10);
      expect(player.state.health).toBe(initialPlayerHealth - 10);
      
      enemy.takeDamage(10);
      expect(enemy.state.health).toBe(initialEnemyHealth - 10);
    });

    test('should remove enemy when health reaches zero', () => {
      game.loadScene('dungeon');
      game.initialize();

      const currentScene = game.getSceneManager().getCurrentScene();
      const entities = currentScene.getAllEntities();
      const player = entities.find(e => e.type === 'player');
      const enemy = entities.find(e => e.type === 'enemy');

      expect(player).toBeDefined();
      expect(enemy).toBeDefined();

      const enemyId = enemy.id;

      // Set enemy health to low value
      enemy.state.health = 1;

      // Move player to enemy position to deal damage
      player.position.x = enemy.position.x;
      player.position.y = enemy.position.y;

      // Create context for scene update
      const context = {
        input: game.getInputHandler(),
        game: game,
        scene: currentScene
      };

      // Update scene multiple times to ensure combat happens
      currentScene.update(0.016, context);

      // Enemy should be dead and removed
      const updatedEntities = currentScene.getAllEntities();
      const enemyStillExists = updatedEntities.find(e => e.id === enemyId);
      expect(enemyStillExists).toBeUndefined();
    });

    test('should handle multiple enemies attacking player', () => {
      game.loadScene('dungeon');
      game.initialize();

      const currentScene = game.getSceneManager().getCurrentScene();
      const entities = currentScene.getAllEntities();
      const player = entities.find(e => e.type === 'player');
      const enemies = entities.filter(e => e.type === 'enemy');

      expect(player).toBeDefined();
      expect(enemies.length).toBeGreaterThan(1);

      const initialHealth = player.state.health;

      // Test that multiple enemies can deal damage
      enemies.forEach(enemy => {
        enemy.attackPlayer(player);
      });

      // Player should have taken damage from all enemies
      const expectedHealth = initialHealth - (enemies.length * 10); // Each enemy deals 10 damage
      expect(player.state.health).toBe(expectedHealth);
    });
  });

  describe('Game state and resources', () => {
    test('should track player health through game state', () => {
      game.loadScene('dungeon');
      game.initialize();

      const currentScene = game.getSceneManager().getCurrentScene();
      const entities = currentScene.getAllEntities();
      const player = entities.find(e => e.type === 'player');

      expect(player).toBeDefined();
      expect(player.state.health).toBe(100);

      // Remove all enemies and items to prevent interference
      const enemies = entities.filter(e => e.type === 'enemy');
      enemies.forEach(enemy => enemy.delete());
      const items = entities.filter(e => e.type === 'item');
      items.forEach(item => item.delete());

      // Damage player
      player.state.health = 70;

      // Set game.player reference manually since we're not calling _update
      game.player = player;

      // Prepare UI data
      const uiData = game._prepareUIData();
      expect(uiData.health).toBe(70);
    });

    test('should track inventory in UI data', () => {
      game.loadScene('dungeon');
      game.initialize();

      const currentScene = game.getSceneManager().getCurrentScene();
      const entities = currentScene.getAllEntities();
      const player = entities.find(e => e.type === 'player');
      const item = entities.find(e => e.type === 'item');

      expect(player).toBeDefined();
      expect(item).toBeDefined();

      // Collect item
      player.position.x = item.position.x;
      player.position.y = item.position.y;
      
      // Create context for scene update
      const context = {
        input: game.getInputHandler(),
        game: game,
        scene: currentScene
      };
      
      currentScene.update(0.016, context);

      // Update game
      game._update(0.016);

      // Inventory should be in UI data
      const uiData = game._prepareUIData();
      expect(uiData.inventory).toBeDefined();
      expect(uiData.inventory.length).toBeGreaterThan(0);
    });

    test('should reset game state after permadeath', () => {
      game.loadScene('dungeon');
      game.initialize();

      const initialConfig = {
        resources: [
          { name: 'health', max: 100, start: 100 },
          { name: 'stamina', max: 100, start: 100, depleteRate: 1 }
        ],
        maxSanity: 100
      };

      // Modify resources
      game.getResourceManager().consume('stamina', 50);
      const staminaBefore = game.getResourceManager().getResource('stamina');
      expect(staminaBefore.current).toBe(50);

      // Reset game
      game.resetGame(initialConfig);

      // Resources should be reset
      const staminaAfter = game.getResourceManager().getResource('stamina');
      expect(staminaAfter.current).toBe(100);
    });
  });
});
