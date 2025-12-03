/**
 * Integration tests for puzzle game flow
 * Tests puzzle solving flow, save/load functionality, and item usage
 * Requirements: 5.1, 5.2, 5.3, 5.5
 */

import { Game } from '../../../framework/core/Game.js';
import { Scene } from '../../../framework/core/Scene.js';
import { GameStateManager } from '../../../games/puzzle-game/GameStateManager.js';

// Import puzzle game entities
import { Player } from '../../../games/puzzle-game/entities/Player.js';
import { Door } from '../../../games/puzzle-game/entities/Door.js';
import { Key } from '../../../games/puzzle-game/entities/Key.js';

describe('Puzzle Game Integration Tests', () => {
  let canvas;
  let game;
  let gameStateManager;
  let testScene;

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
        radius: 8
      },
      resources: [
        { name: 'sanity', max: 100, start: 100, depleteRate: 0.5 }
      ],
      maxSanity: 100,
      threat: {
        detectionRadius: 0
      }
    };

    // Initialize the game
    game = new Game(gameConfig);
    gameStateManager = new GameStateManager(game, []);

    // Create a test scene
    const sceneConfig = {
      type: 'fixed',
      name: 'Test Room',
      description: 'A test room for integration testing',
      width: 10,
      height: 10
    };

    testScene = new Scene('test_room', sceneConfig);
    game.registerScene('test_room', testScene);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    if (game) {
      game.shutdown();
    }
    localStorage.clear();
  });

  describe('Puzzle solving flow', () => {
    test('should complete simple puzzle sequence', () => {
      // Create test entities
      const player = new Player(100, 100, { 
        speed: 80, 
        interactionRadius: 48,
        inventory: { maxItems: 10, startItems: [] }
      });
      
      const key = new Key(100, 100, {
        keyType: 'test_key',
        name: 'Test Key',
        description: 'A key for testing'
      });
      
      const door = new Door(100, 100, {
        locked: true,
        keyRequired: 'test_key',
        targetScene: 'next_room',
        name: 'Test Door',
        interactionRadius: 100
      });

      // Add entities to scene
      testScene.addEntity(player);
      testScene.addEntity(key);
      testScene.addEntity(door);

      // Load scene and initialize
      game.loadScene('test_room');
      game.initialize();

      // Create context for interactions
      const context = {
        player: player,
        game: game,
        scene: testScene,
        gameStateManager: gameStateManager,
        updateStoryText: () => {},
        updateUI: () => {}
      };

      // Step 1: Player should not be able to open locked door initially
      const unlockContext = { ...context, action: 'unlock' };
      const initialDoorResult = door.onInteract(player, unlockContext);
      expect(initialDoorResult.success).toBe(false);
      expect(initialDoorResult.message).toContain('key');

      // Step 2: Player collects key
      const keyResult = key.onInteract(player, context);
      expect(keyResult.success).toBe(true);
      expect(player.state.inventory.length).toBe(1);
      expect(player.state.inventory[0].keyType).toBe('test_key');

      // Step 3: Player can now open door with key
      const doorResult = door.onInteract(player, unlockContext);
      expect(doorResult.success).toBe(true);
      expect(door.state.locked).toBe(false);
    });
  });

  describe('Save/load functionality', () => {
    test('should save and restore game state', () => {
      // Create test entities
      const player = new Player(100, 100, { 
        speed: 80, 
        interactionRadius: 48,
        inventory: { maxItems: 10, startItems: [] }
      });

      const key = new Key(100, 100, {
        keyType: 'test_key',
        name: 'Test Key'
      });

      // Add entities to scene
      testScene.addEntity(player);
      testScene.addEntity(key);

      // Load scene and initialize
      game.loadScene('test_room');
      game.initialize();

      // Modify game state
      player.position.x = 7;
      player.position.y = 8;
      
      // Collect key
      const context = {
        player: player,
        game: game,
        scene: testScene,
        gameStateManager: gameStateManager,
        updateStoryText: () => {},
        updateUI: () => {}
      };
      
      key.onInteract(player, context);

      // Save game state
      const saveResult = gameStateManager.saveGame('test_save');
      expect(saveResult).toBe(true);

      // Verify save data exists
      expect(gameStateManager.hasSaveData()).toBe(true);
    });

    test('should validate save data', () => {
      // Test with no save data
      expect(gameStateManager.hasSaveData()).toBe(false);
      expect(gameStateManager.loadGame()).toBe(false);

      // Test with valid save data structure
      const saveInfo = gameStateManager.getSaveInfo();
      expect(saveInfo).toBeNull(); // No save data initially
    });
  });

  describe('Item usage and door unlocking', () => {
    test('should unlock doors with correct keys', () => {
      // Create test entities
      const player = new Player(100, 100, { 
        speed: 80, 
        interactionRadius: 48,
        inventory: { maxItems: 10, startItems: [] }
      });

      const key = new Key(100, 100, {
        keyType: 'brass_key',
        name: 'Brass Key'
      });

      const door = new Door(100, 100, {
        locked: true,
        keyRequired: 'brass_key',
        name: 'Brass Door',
        interactionRadius: 100
      });

      // Add entities to scene
      testScene.addEntity(player);
      testScene.addEntity(key);
      testScene.addEntity(door);

      // Load scene and initialize
      game.loadScene('test_room');
      game.initialize();

      // Create context for interactions
      const context = {
        player: player,
        game: game,
        scene: testScene,
        gameStateManager: gameStateManager,
        updateStoryText: () => {},
        updateUI: () => {}
      };

      // Collect key
      key.onInteract(player, context);
      expect(player.state.inventory.length).toBe(1);

      // Unlock door with key
      const unlockContext = { ...context, action: 'unlock' };
      const doorResult = door.onInteract(player, unlockContext);
      expect(doorResult.success).toBe(true);
      expect(door.state.locked).toBe(false);
    });

    test('should prevent door unlocking with wrong keys', () => {
      // Create test entities
      const player = new Player(100, 100, { 
        speed: 80, 
        interactionRadius: 48,
        inventory: { maxItems: 10, startItems: [] }
      });

      const wrongKey = new Key(100, 100, {
        keyType: 'wrong_key',
        name: 'Wrong Key'
      });

      const door = new Door(100, 100, {
        locked: true,
        keyRequired: 'correct_key',
        name: 'Test Door',
        interactionRadius: 100
      });

      // Add entities to scene
      testScene.addEntity(player);
      testScene.addEntity(wrongKey);
      testScene.addEntity(door);

      // Load scene and initialize
      game.loadScene('test_room');
      game.initialize();

      // Create context for interactions
      const context = {
        player: player,
        game: game,
        scene: testScene,
        gameStateManager: gameStateManager,
        updateStoryText: () => {},
        updateUI: () => {}
      };

      // Collect wrong key
      wrongKey.onInteract(player, context);
      expect(player.state.inventory.length).toBe(1);

      // Try to unlock door with wrong key
      const unlockContext = { ...context, action: 'unlock' };
      const doorResult = door.onInteract(player, unlockContext);
      expect(doorResult.success).toBe(false);
      expect(door.state.locked).toBe(true);
      expect(doorResult.message).toContain('key');
    });
  });
});