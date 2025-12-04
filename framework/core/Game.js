/**
 * Game - Main game class that integrates all framework systems
 * Wires together game loop, scene management, input, rendering, and game mechanics
 */
import { GameLoop } from './GameLoop.js';
import { SceneManager } from './SceneManager.js';
import { InputHandler } from '../systems/InputHandler.js';
import { Renderer } from '../systems/Renderer.js';
import { VisibilitySystem } from '../mechanics/VisibilitySystem.js';
import { ResourceManager } from '../mechanics/ResourceManager.js';
import { SanitySystem } from '../mechanics/SanitySystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { ThreatSystem } from '../mechanics/ThreatSystem.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { AnimationSystem } from '../systems/AnimationSystem.js';
import { SpatialGrid } from '../utils/SpatialGrid.js';
import { LightingSystem } from '../systems/LightingSystem.js';
import { DialogueSystem } from '../systems/DialogueSystem.js';
import { QuestSystem } from '../systems/QuestSystem.js';
import { Pathfinding } from '../ai/Pathfinding.js';

/**
 * Game class - Central coordinator for all framework systems
 */
export class Game {
  /**
   * @param {Object} config - Game configuration
   * @param {HTMLCanvasElement} config.canvas - Canvas element for rendering
   * @param {number} config.targetFPS - Target frames per second (default: 60)
   * @param {Object} config.visibility - Visibility system configuration
   * @param {Array} config.resources - Initial resources configuration
   * @param {number} config.maxSanity - Maximum sanity value
   */
  constructor(config = {}) {
    if (!config.canvas) {
      throw new Error('Canvas element is required in config');
    }

    // Initialize core systems
    this.sceneManager = new SceneManager();
    this.inputHandler = new InputHandler();
    this.renderer = new Renderer(config.canvas);

    // Initialize game loop with bound update and render methods
    this.gameLoop = new GameLoop(
      this._update.bind(this),
      this._render.bind(this),
      config.targetFPS || 60
    );

    // Initialize horror mechanics systems
    this.visibilitySystem = new VisibilitySystem(config.visibility || {});
    this.resourceManager = new ResourceManager();
    this.sanitySystem = new SanitySystem(config.maxSanity || 100);
    this.audioSystem = new AudioSystem();
    this.threatSystem = new ThreatSystem(config.threat || {});
    
    // Initialize new systems (v2.0)
    this.particleSystem = new ParticleSystem(config.particles || {});
    this.animationSystem = new AnimationSystem();
    this.spatialGrid = new SpatialGrid({
      cellSize: config.spatialGridCellSize || 100,
      worldWidth: config.worldWidth || 2000,
      worldHeight: config.worldHeight || 2000
    });
    
    // Initialize advanced systems (v3.0)
    this.lightingSystem = new LightingSystem(config.lighting || {});
    this.dialogueSystem = new DialogueSystem();
    this.questSystem = new QuestSystem();
    this.pathfinding = new Pathfinding({
      gridSize: config.pathfindingGridSize || 32,
      worldWidth: config.worldWidth || 2000,
      worldHeight: config.worldHeight || 2000
    });

    // Initialize resources from config
    if (config.resources && Array.isArray(config.resources)) {
      config.resources.forEach(res => {
        this.resourceManager.addResource(
          res.name,
          res.start || res.max,
          res.max,
          res.depleteRate || 0
        );
      });
    }

    // Game state
    this.player = null;
    this.isInitialized = false;
    this.playerDeathCallback = null;
  }

  /**
   * Initialize the game and start listening for input
   */
  initialize() {
    if (this.isInitialized) {
      return;
    }

    this.inputHandler.startListening();
    this.isInitialized = true;
  }

  /**
   * Start the game loop
   */
  start() {
    if (!this.isInitialized) {
      this.initialize();
    }

    this.gameLoop.start();
  }

  /**
   * Stop the game loop
   */
  stop() {
    this.gameLoop.stop();
  }

  /**
   * Pause the game
   */
  pause() {
    this.gameLoop.pause();
  }

  /**
   * Resume the game
   */
  resume() {
    this.gameLoop.resume();
  }

  /**
   * Internal update method called by game loop
   * @param {number} deltaTime - Time elapsed since last update in seconds
   * @private
   */
  _update(deltaTime) {
    const currentScene = this.sceneManager.getCurrentScene();
    if (!currentScene) {
      return;
    }

    // Update resource manager (auto-depletion)
    this.resourceManager.update(deltaTime);

    // Update sanity system
    this.sanitySystem.update(deltaTime);

    // Process input and update player
    this._updatePlayer(deltaTime, currentScene);

    // Build context object for entities
    const context = {
      input: this.inputHandler,
      game: this,
      scene: currentScene
    };

    // Update the current scene (which updates all entities)
    currentScene.update(deltaTime, context);
    
    // Update spatial grid with entity positions
    this.spatialGrid.clear();
    const entities = currentScene.getAllEntities();
    for (const entity of entities) {
      if (!entity.isDeleted()) {
        this.spatialGrid.insert(entity);
      }
    }
    
    // Update particle system
    this.particleSystem.update(deltaTime);
    
    // Update animation system
    this.animationSystem.update(deltaTime);
    
    // Update lighting system
    this.lightingSystem.update(deltaTime);
    
    // Update quest system
    this.questSystem.update(deltaTime);

    // Check for player death (permadeath)
    if (this.player && this.player.isDead && this.player.isDead()) {
      this._handlePlayerDeath();
    }
  }

  /**
   * Update player based on input
   * @param {number} deltaTime - Time elapsed in seconds
   * @param {Object} scene - Current scene
   * @private
   */
  _updatePlayer(deltaTime, scene) {
    // Find player entity in the scene
    this.player = this._findPlayerEntity(scene);
    
    if (!this.player) {
      return;
    }

    // Safety check for deltaTime
    if (typeof deltaTime !== 'number' || !isFinite(deltaTime) || deltaTime < 0) {
      return;
    }

    // Get movement input
    const movement = this.inputHandler.getMovementVector();

    // Apply movement to player
    if (movement.x !== 0 || movement.y !== 0) {
      const speed = this.player.config?.speed || 100;
      this.player.position.x += movement.x * speed * deltaTime;
      this.player.position.y += movement.y * speed * deltaTime;
    }
  }

  /**
   * Find the player entity in the current scene
   * @param {Object} scene - Scene to search
   * @returns {Object|null} Player entity or null
   * @private
   */
  _findPlayerEntity(scene) {
    if (!scene) {
      return null;
    }

    // Scene.entities is a Map, so we need to iterate through values
    const entities = scene.getAllEntities();
    return entities.find(entity => entity.type === 'player') || null;
  }

  /**
   * Internal render method called by game loop
   * @private
   */
  _render() {
    const currentScene = this.sceneManager.getCurrentScene();
    if (!currentScene) {
      return;
    }

    // Clear the canvas
    this.renderer.clear();

    // Update camera to follow player
    if (this.player) {
      this.renderer.setCamera(
        this.player.position.x,
        this.player.position.y,
        1
      );
    }

    // Get all entities from the scene
    const allEntities = currentScene.getAllEntities();

    // Get visible entities using visibility system
    const visibleEntities = this.player
      ? this.visibilitySystem.getVisibleEntities(this.player, allEntities, currentScene)
      : allEntities;

    // Render all entities with visibility information
    allEntities.forEach(entity => {
      const isVisible = visibleEntities.includes(entity);
      this.renderer.drawEntity(entity, isVisible);
    });
    
    // Render particles
    this.particleSystem.render(this.renderer.ctx, this.renderer.camera);

    // Prepare and render UI data
    const uiData = this._prepareUIData();
    this.renderer.drawUI(uiData);
  }

  /**
   * Prepare UI data structure from game state
   * @returns {Object} UI data for rendering
   * @private
   */
  _prepareUIData() {
    const uiData = {};

    // Add player health if available
    if (this.player && this.player.state?.health !== undefined) {
      uiData.health = this.player.state.health;
      uiData.maxHealth = this.player.config?.maxHealth || 100;
    }

    // Add resources
    const allResources = this.resourceManager.getAllResources();
    uiData.resources = Object.keys(allResources).map(name => ({
      name: name,
      current: Math.round(allResources[name].current),
      max: allResources[name].max
    }));

    // Add inventory if player has one
    if (this.player && this.player.getInventoryDisplay) {
      // Use the player's inventory display method if available (puzzle game)
      const inventoryDisplay = this.player.getInventoryDisplay();
      uiData.inventory = inventoryDisplay.items;
      uiData.inventorySelection = inventoryDisplay.selectedIndex;
      uiData.inventoryCount = inventoryDisplay.count;
    } else if (this.player && this.player.state?.inventory) {
      // Fallback to basic inventory (dungeon crawler)
      uiData.inventory = this.player.state.inventory;
      uiData.inventorySelection = -1;
      uiData.inventoryCount = this.player.state.inventory.length;
    } else {
      uiData.inventory = [];
      uiData.inventorySelection = -1;
      uiData.inventoryCount = 0;
    }

    return uiData;
  }

  /**
   * Load a scene by ID
   * @param {string} sceneId - Scene ID to load
   * @param {Object} transitionData - Optional transition data
   */
  loadScene(sceneId, transitionData = {}) {
    this.sceneManager.loadScene(sceneId, transitionData);
    
    // Clear input state on scene transition
    this.inputHandler.clear();
    
    // Reset player reference
    this.player = null;
  }

  /**
   * Register a scene with the scene manager
   * @param {string} id - Scene ID
   * @param {Object} scene - Scene instance
   */
  registerScene(id, scene) {
    this.sceneManager.registerScene(id, scene);
  }

  /**
   * Get the scene manager
   * @returns {SceneManager}
   */
  getSceneManager() {
    return this.sceneManager;
  }

  /**
   * Get the input handler
   * @returns {InputHandler}
   */
  getInputHandler() {
    return this.inputHandler;
  }

  /**
   * Get the renderer
   * @returns {Renderer}
   */
  getRenderer() {
    return this.renderer;
  }

  /**
   * Get the visibility system
   * @returns {VisibilitySystem}
   */
  getVisibilitySystem() {
    return this.visibilitySystem;
  }

  /**
   * Get the resource manager
   * @returns {ResourceManager}
   */
  getResourceManager() {
    return this.resourceManager;
  }

  /**
   * Get the sanity system
   * @returns {SanitySystem}
   */
  getSanitySystem() {
    return this.sanitySystem;
  }

  /**
   * Get the audio system
   * @returns {AudioSystem}
   */
  getAudioSystem() {
    return this.audioSystem;
  }

  /**
   * Get the threat system
   * @returns {ThreatSystem}
   */
  getThreatSystem() {
    return this.threatSystem;
  }

  /**
   * Get the particle system
   * @returns {ParticleSystem}
   */
  getParticleSystem() {
    return this.particleSystem;
  }

  /**
   * Get the animation system
   * @returns {AnimationSystem}
   */
  getAnimationSystem() {
    return this.animationSystem;
  }

  /**
   * Get the spatial grid
   * @returns {SpatialGrid}
   */
  getSpatialGrid() {
    return this.spatialGrid;
  }

  /**
   * Get the lighting system
   * @returns {LightingSystem}
   */
  getLightingSystem() {
    return this.lightingSystem;
  }

  /**
   * Get the dialogue system
   * @returns {DialogueSystem}
   */
  getDialogueSystem() {
    return this.dialogueSystem;
  }

  /**
   * Get the quest system
   * @returns {QuestSystem}
   */
  getQuestSystem() {
    return this.questSystem;
  }

  /**
   * Get the pathfinding system
   * @returns {Pathfinding}
   */
  getPathfinding() {
    return this.pathfinding;
  }

  /**
   * Register a callback for player death events
   * This allows game-specific implementations to handle permadeath
   * @param {Function} callback - Function to call when player dies
   */
  onPlayerDeathCallback(callback) {
    this.playerDeathCallback = callback;
  }

  /**
   * Handle player death - call registered callback
   * @private
   */
  _handlePlayerDeath() {
    if (this.playerDeathCallback) {
      this.playerDeathCallback();
    }
  }

  /**
   * Reset the game to initial state
   * This is typically called after player death in permadeath games
   * @param {Object} initialConfig - Initial game configuration to restore
   */
  resetGame(initialConfig = {}) {
    // Unload current scene
    this.sceneManager.unloadCurrentScene();

    // Reset resources to initial values
    if (initialConfig.resources && Array.isArray(initialConfig.resources)) {
      // Clear existing resources
      const allResources = this.resourceManager.getAllResources();
      for (const name of Object.keys(allResources)) {
        this.resourceManager.resources.delete(name);
      }

      // Re-add resources with initial values
      initialConfig.resources.forEach(res => {
        this.resourceManager.addResource(
          res.name,
          res.start || res.max,
          res.max,
          res.depleteRate || 0
        );
      });
    }

    // Reset sanity system
    const maxSanity = initialConfig.maxSanity || 100;
    this.sanitySystem.current = maxSanity;
    this.sanitySystem.max = maxSanity;

    // Clear player reference
    this.player = null;

    // Clear input state
    this.inputHandler.clear();
  }

  /**
   * Cleanup and shutdown the game
   */
  shutdown() {
    this.stop();
    this.inputHandler.stopListening();
    this.sceneManager.unloadCurrentScene();
    this.isInitialized = false;
  }
}
