/**
 * Unit tests for Game class - System integration tests
 * Tests that game loop triggers scene updates, input affects player entity,
 * and visibility affects rendering
 */
import { Game } from '../../../framework/core/Game.js';
import { Scene } from '../../../framework/core/Scene.js';
import { Entity } from '../../../framework/core/Entity.js';

describe('Game - System Integration', () => {
  let canvas;
  let game;

  beforeEach(() => {
    // Create a mock canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    // Reset entity ID counter
    Entity.resetIdCounter();
  });

  afterEach(() => {
    if (game) {
      game.shutdown();
    }
  });

  describe('Game Loop Integration', () => {
    test('game loop triggers scene updates', (done) => {
      // Create game
      game = new Game({ canvas });

      // Create a test scene with an entity
      const scene = new Scene('test-scene');
      let updateCount = 0;

      // Create entity with custom update that tracks calls
      const entity = new Entity(null, 'test', 100, 100);
      entity.update = (deltaTime) => {
        updateCount++;
      };

      scene.addEntity(entity);
      game.registerScene('test-scene', scene);
      game.loadScene('test-scene');

      // Start the game loop
      game.start();

      // Wait for a few frames
      setTimeout(() => {
        game.stop();

        // Verify that update was called multiple times
        expect(updateCount).toBeGreaterThan(0);

        done();
      }, 100); // Wait 100ms for several frames
    });

    test('game loop calls update and render in sequence', (done) => {
      game = new Game({ canvas });

      const scene = new Scene('test-scene');
      const entity = new Entity(null, 'test', 100, 100);
      scene.addEntity(entity);

      game.registerScene('test-scene', scene);
      game.loadScene('test-scene');

      // Track the order of operations
      const operations = [];

      // Spy on scene update
      const originalUpdate = scene.update.bind(scene);
      scene.update = (deltaTime) => {
        operations.push('update');
        originalUpdate(deltaTime);
      };

      // Spy on renderer clear (happens at start of render)
      const originalClear = game.renderer.clear.bind(game.renderer);
      game.renderer.clear = () => {
        operations.push('render');
        originalClear();
      };

      game.start();

      setTimeout(() => {
        game.stop();

        // Verify update and render were both called
        expect(operations.filter(op => op === 'update').length).toBeGreaterThan(0);
        expect(operations.filter(op => op === 'render').length).toBeGreaterThan(0);

        // Verify they happened in the right order (update before render)
        const firstUpdate = operations.indexOf('update');
        const firstRender = operations.indexOf('render');
        expect(firstUpdate).toBeGreaterThanOrEqual(0);
        expect(firstRender).toBeGreaterThan(firstUpdate);

        done();
      }, 100);
    });

    test('pausing game loop stops updates', (done) => {
      game = new Game({ canvas });

      const scene = new Scene('test-scene');
      const entity = new Entity(null, 'test', 100, 100);
      let updateCalls = 0;
      entity.update = () => {
        updateCalls++;
      };

      scene.addEntity(entity);
      game.registerScene('test-scene', scene);
      game.loadScene('test-scene');

      game.start();

      // Let it run for a bit
      setTimeout(() => {
        const callsBeforePause = updateCalls;
        
        // Pause the game
        game.pause();

        // Wait a bit more
        setTimeout(() => {
          const callsAfterPause = updateCalls;

          // Should not have increased (or increased very little due to timing)
          expect(callsAfterPause).toBeLessThanOrEqual(callsBeforePause + 1);

          game.stop();
          done();
        }, 50);
      }, 50);
    });
  });

  describe('Input and Player Integration', () => {
    test('input affects player entity position', () => {
      game = new Game({ canvas });

      const scene = new Scene('test-scene');
      
      // Create a player entity
      const player = new Entity(null, 'player', 100, 100, { speed: 100 });
      scene.addEntity(player);

      game.registerScene('test-scene', scene);
      game.loadScene('test-scene');

      // Store initial position
      const initialX = player.position.x;
      const initialY = player.position.y;

      // Simulate key press (move right)
      game.inputHandler.keys.add('d');

      // Manually trigger update with a fixed deltaTime
      game._update(0.1); // 100ms

      // Player should have moved to the right
      // Movement = direction (1, 0) * speed (100) * deltaTime (0.1) = 10 units
      expect(player.position.x).toBe(initialX + 10);
      expect(player.position.y).toBe(initialY); // Y should not change
    });

    test('diagonal movement is normalized', () => {
      game = new Game({ canvas });

      const scene = new Scene('test-scene');
      const player = new Entity(null, 'player', 100, 100, { speed: 100 });
      scene.addEntity(player);

      game.registerScene('test-scene', scene);
      game.loadScene('test-scene');

      const initialX = player.position.x;
      const initialY = player.position.y;

      // Simulate diagonal movement (right and down)
      game.inputHandler.keys.add('d');
      game.inputHandler.keys.add('s');

      // Manually trigger update
      game._update(0.1); // 100ms

      // Calculate distance moved
      const dx = player.position.x - initialX;
      const dy = player.position.y - initialY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // With normalization, diagonal movement should be same speed as straight
      // Expected distance = speed * time = 100 * 0.1 = 10 units
      expect(distance).toBeCloseTo(10, 1);

      // Both x and y should have changed
      expect(player.position.x).toBeGreaterThan(initialX);
      expect(player.position.y).toBeGreaterThan(initialY);

      // Diagonal components should be equal (45 degree angle)
      expect(Math.abs(dx - dy)).toBeLessThan(0.01);
    });

    test('input is cleared on scene transition', () => {
      game = new Game({ canvas });

      const scene1 = new Scene('scene1');
      const scene2 = new Scene('scene2');

      game.registerScene('scene1', scene1);
      game.registerScene('scene2', scene2);
      game.loadScene('scene1');

      // Simulate key press
      game.inputHandler.keys.add('w');
      game.inputHandler.keys.add('a');

      expect(game.inputHandler.isKeyPressed('w')).toBe(true);
      expect(game.inputHandler.isKeyPressed('a')).toBe(true);

      // Transition to new scene
      game.loadScene('scene2');

      // Input should be cleared
      expect(game.inputHandler.isKeyPressed('w')).toBe(false);
      expect(game.inputHandler.isKeyPressed('a')).toBe(false);
    });

    test('player reference is updated when scene changes', () => {
      game = new Game({ canvas });

      const scene1 = new Scene('scene1');
      const player1 = new Entity(null, 'player', 50, 50);
      scene1.addEntity(player1);

      const scene2 = new Scene('scene2');
      const player2 = new Entity(null, 'player', 200, 200);
      scene2.addEntity(player2);

      game.registerScene('scene1', scene1);
      game.registerScene('scene2', scene2);

      // Load first scene
      game.loadScene('scene1');
      game.start();

      // Player reference should be null initially (set during first update)
      expect(game.player).toBeNull();

      // Stop and manually trigger update to set player
      game.stop();
      game._update(0.016);

      expect(game.player).toBe(player1);

      // Load second scene
      game.loadScene('scene2');
      expect(game.player).toBeNull(); // Reset on scene change

      game._update(0.016);
      expect(game.player).toBe(player2);
    });
  });

  describe('Visibility and Rendering Integration', () => {
    test('visibility system filters entities for rendering', () => {
      game = new Game({
        canvas,
        visibility: { radius: 5, mode: 'circular' }
      });

      const scene = new Scene('test-scene');
      
      // Create player at origin
      const player = new Entity(null, 'player', 0, 0);
      
      // Create entities at different distances
      const nearEntity = new Entity(null, 'near', 3, 0); // Within radius
      const farEntity = new Entity(null, 'far', 10, 0); // Outside radius

      scene.addEntity(player);
      scene.addEntity(nearEntity);
      scene.addEntity(farEntity);

      game.registerScene('test-scene', scene);
      game.loadScene('test-scene');

      // Manually trigger update and render
      game._update(0.016);

      // Spy on drawEntity to track what gets rendered
      const renderedEntities = [];
      const originalDrawEntity = game.renderer.drawEntity.bind(game.renderer);
      game.renderer.drawEntity = (entity, visible) => {
        renderedEntities.push({ entity, visible });
        originalDrawEntity(entity, visible);
      };

      game._render();

      // All entities should be drawn
      expect(renderedEntities.length).toBe(3);

      // Check visibility flags
      const playerRender = renderedEntities.find(r => r.entity.type === 'player');
      const nearRender = renderedEntities.find(r => r.entity.type === 'near');
      const farRender = renderedEntities.find(r => r.entity.type === 'far');

      // Player and near entity should be visible
      expect(playerRender.visible).toBe(true);
      expect(nearRender.visible).toBe(true);

      // Far entity should not be visible
      expect(farRender.visible).toBe(false);
    });

    test('camera follows player', () => {
      game = new Game({ canvas });

      const scene = new Scene('test-scene');
      const player = new Entity(null, 'player', 150, 200);
      scene.addEntity(player);

      game.registerScene('test-scene', scene);
      game.loadScene('test-scene');

      // Trigger update to set player reference
      game._update(0.016);

      // Trigger render to update camera
      game._render();

      // Camera should be centered on player
      expect(game.renderer.camera.x).toBe(150);
      expect(game.renderer.camera.y).toBe(200);
    });

    test('render count matches visible entities', () => {
      game = new Game({
        canvas,
        visibility: { radius: 5, mode: 'circular' }
      });

      const scene = new Scene('test-scene');
      
      const player = new Entity(null, 'player', 0, 0);
      const entity1 = new Entity(null, 'test1', 2, 0);
      const entity2 = new Entity(null, 'test2', 3, 0);
      const entity3 = new Entity(null, 'test3', 10, 0); // Outside visibility

      scene.addEntity(player);
      scene.addEntity(entity1);
      scene.addEntity(entity2);
      scene.addEntity(entity3);

      game.registerScene('test-scene', scene);
      game.loadScene('test-scene');

      game._update(0.016);
      game._render();
      // Need to render twice - first render sets the count, second render moves it to "last frame"
      game._render();

      // Should render all 4 entities (3 visible + 1 invisible)
      expect(game.renderer.getLastFrameRenderCalls()).toBe(4);
    });
  });

  describe('Resource and Sanity Integration', () => {
    test('resources are updated each frame', () => {
      game = new Game({
        canvas,
        resources: [
          { name: 'stamina', max: 100, start: 100, depleteRate: 10 }
        ]
      });

      const scene = new Scene('test-scene');
      game.registerScene('test-scene', scene);
      game.loadScene('test-scene');

      const initialStamina = game.resourceManager.getResource('stamina').current;

      // Manually trigger update with fixed deltaTime
      game._update(1.0); // 1 second

      const finalStamina = game.resourceManager.getResource('stamina').current;

      // Stamina should have decreased by depleteRate * deltaTime = 10 * 1 = 10
      expect(finalStamina).toBe(initialStamina - 10);
    });

    test('UI displays player health and resources', () => {
      game = new Game({
        canvas,
        resources: [
          { name: 'health', max: 100, start: 75 },
          { name: 'stamina', max: 50, start: 30 }
        ]
      });

      const scene = new Scene('test-scene');
      const player = new Entity(null, 'player', 0, 0);
      player.state.health = 80;
      player.config.maxHealth = 100;

      scene.addEntity(player);
      game.registerScene('test-scene', scene);
      game.loadScene('test-scene');

      game._update(0.016);

      const uiData = game._prepareUIData();

      // Check health
      expect(uiData.health).toBe(80);
      expect(uiData.maxHealth).toBe(100);

      // Check resources
      expect(uiData.resources).toHaveLength(2);
      expect(uiData.resources[0].name).toBe('health');
      expect(uiData.resources[0].current).toBe(75);
      expect(uiData.resources[1].name).toBe('stamina');
      expect(uiData.resources[1].current).toBe(30);
    });

    test('UI displays player inventory', () => {
      game = new Game({ canvas });

      const scene = new Scene('test-scene');
      const player = new Entity(null, 'player', 0, 0);
      player.state.inventory = ['key', 'potion', 'map'];

      scene.addEntity(player);
      game.registerScene('test-scene', scene);
      game.loadScene('test-scene');

      game._update(0.016);

      const uiData = game._prepareUIData();

      expect(uiData.inventory).toEqual(['key', 'potion', 'map']);
    });

    test('UI handles empty inventory', () => {
      game = new Game({ canvas });

      const scene = new Scene('test-scene');
      const player = new Entity(null, 'player', 0, 0);
      // No inventory set

      scene.addEntity(player);
      game.registerScene('test-scene', scene);
      game.loadScene('test-scene');

      game._update(0.016);

      const uiData = game._prepareUIData();

      expect(uiData.inventory).toEqual([]);
    });
  });

  describe('System Accessor Methods', () => {
    test('provides access to all systems', () => {
      game = new Game({ canvas });

      expect(game.getSceneManager()).toBeDefined();
      expect(game.getInputHandler()).toBeDefined();
      expect(game.getRenderer()).toBeDefined();
      expect(game.getVisibilitySystem()).toBeDefined();
      expect(game.getResourceManager()).toBeDefined();
      expect(game.getSanitySystem()).toBeDefined();
      expect(game.getAudioSystem()).toBeDefined();
      expect(game.getThreatSystem()).toBeDefined();
    });
  });

  describe('Game Lifecycle', () => {
    test('initialize starts input listening', () => {
      game = new Game({ canvas });

      expect(game.inputHandler.isListening).toBe(false);

      game.initialize();

      expect(game.inputHandler.isListening).toBe(true);
    });

    test('shutdown stops game and cleans up', () => {
      game = new Game({ canvas });

      const scene = new Scene('test-scene');
      game.registerScene('test-scene', scene);
      game.loadScene('test-scene');

      game.start();
      expect(game.gameLoop.getIsRunning()).toBe(true);
      expect(game.inputHandler.isListening).toBe(true);

      game.shutdown();

      expect(game.gameLoop.getIsRunning()).toBe(false);
      expect(game.inputHandler.isListening).toBe(false);
      expect(game.sceneManager.getCurrentScene()).toBeNull();
    });
  });

  describe('Permadeath Functionality', () => {
    test('detects player death and calls callback', () => {
      game = new Game({ canvas });

      const scene = new Scene('test-scene');
      const player = new Entity(null, 'player', 0, 0);
      player.state.health = 0;
      player.isDead = () => player.state.health <= 0;

      scene.addEntity(player);
      game.registerScene('test-scene', scene);
      game.loadScene('test-scene');

      // Set up death callback
      let deathCallbackCalled = false;
      game.onPlayerDeathCallback(() => {
        deathCallbackCalled = true;
      });

      // Trigger update to find player
      game._update(0.016);

      // Death callback should have been called
      expect(deathCallbackCalled).toBe(true);
    });

    test('does not call death callback when player is alive', () => {
      game = new Game({ canvas });

      const scene = new Scene('test-scene');
      const player = new Entity(null, 'player', 0, 0);
      player.state.health = 50;
      player.isDead = () => player.state.health <= 0;

      scene.addEntity(player);
      game.registerScene('test-scene', scene);
      game.loadScene('test-scene');

      let deathCallbackCalled = false;
      game.onPlayerDeathCallback(() => {
        deathCallbackCalled = true;
      });

      game._update(0.016);

      expect(deathCallbackCalled).toBe(false);
    });

    test('resetGame clears scene and resets resources', () => {
      const initialConfig = {
        resources: [
          { name: 'health', max: 100, start: 100 },
          { name: 'stamina', max: 50, start: 50 }
        ],
        maxSanity: 100
      };

      game = new Game({ canvas, ...initialConfig });

      const scene = new Scene('test-scene');
      const player = new Entity(null, 'player', 0, 0);
      scene.addEntity(player);

      game.registerScene('test-scene', scene);
      game.loadScene('test-scene');

      // Modify resources
      game.resourceManager.consume('health', 50);
      game.resourceManager.consume('stamina', 30);
      game.sanitySystem.decrease(40);

      expect(game.resourceManager.getResource('health').current).toBe(50);
      expect(game.resourceManager.getResource('stamina').current).toBe(20);
      expect(game.sanitySystem.current).toBe(60);

      // Reset the game
      game.resetGame(initialConfig);

      // Resources should be restored
      expect(game.resourceManager.getResource('health').current).toBe(100);
      expect(game.resourceManager.getResource('stamina').current).toBe(50);
      expect(game.sanitySystem.current).toBe(100);

      // Scene should be unloaded
      expect(game.sceneManager.getCurrentScene()).toBeNull();

      // Player reference should be cleared
      expect(game.player).toBeNull();
    });

    test('resetGame clears input state', () => {
      game = new Game({ canvas });

      const scene = new Scene('test-scene');
      game.registerScene('test-scene', scene);
      game.loadScene('test-scene');

      // Simulate input
      game.inputHandler.keys.add('w');
      game.inputHandler.keys.add('a');

      expect(game.inputHandler.isKeyPressed('w')).toBe(true);

      // Reset game
      game.resetGame({});

      // Input should be cleared
      expect(game.inputHandler.isKeyPressed('w')).toBe(false);
      expect(game.inputHandler.isKeyPressed('a')).toBe(false);
    });
  });
});
