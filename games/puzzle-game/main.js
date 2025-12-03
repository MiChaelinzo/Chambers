import { Game } from '../../framework/core/Game.js';
import { Scene } from '../../framework/core/Scene.js';
import { ConfigLoader } from '../../framework/utils/ConfigLoader.js';
import { GameStateManager } from './GameStateManager.js';
import { Puzzle } from './puzzles/Puzzle.js';

// Import puzzle game entities
import { Player } from './entities/Player.js';
import { Door } from './entities/Door.js';
import { Key } from './entities/Key.js';
import { Clue } from './entities/Clue.js';
import { InteractiveObject } from './entities/InteractiveObject.js';
import { Checkpoint } from './entities/Checkpoint.js';

/**
 * Puzzle Game - Main entry point
 * Demonstrates checkpoint-based progression with fixed scenes and puzzles
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

let game = null;
let gameStateManager = null;
let puzzles = [];
let initialConfig = null;
let currentStoryText = '';
let interactionPrompt = '';

/**
 * Initialize and start the puzzle game
 */
async function initGame() {
  try {
    // Load game configuration from JSON files
    const gameConfig = await ConfigLoader.loadConfig('./games/puzzle-game/config/game.json');
    const entitiesConfig = await ConfigLoader.loadConfig('./games/puzzle-game/config/entities.json');
    const scenesConfig = await ConfigLoader.loadConfig('./games/puzzle-game/config/scenes.json');

    // Get canvas element
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
      throw new Error('Canvas element not found');
    }

    // Build framework game configuration
    const frameworkConfig = {
      canvas: canvas,
      targetFPS: 60,
      visibility: gameConfig.game.visibility,
      resources: gameConfig.game.resources,
      maxSanity: gameConfig.game.sanity?.max || 100,
      threat: gameConfig.game.threat
    };

    // Store initial config for reset
    initialConfig = JSON.parse(JSON.stringify(frameworkConfig));

    // Initialize the game
    game = new Game(frameworkConfig);

    // Initialize game state manager
    gameStateManager = new GameStateManager(game, puzzles);

    // Create scenes from configuration
    await createScenesFromConfig(scenesConfig, entitiesConfig);

    // Set up input handlers for puzzle game interactions
    setupInputHandlers();

    // Set up UI update handlers
    setupUIHandlers();

    // Check for existing save data
    if (gameStateManager.hasSaveData()) {
      const saveInfo = gameStateManager.getSaveInfo();
      console.log('Found existing save data from:', new Date(saveInfo.timestamp));
      
      // Ask user if they want to load or start new
      if (confirm('Found existing save data. Load saved game?')) {
        if (gameStateManager.loadGame()) {
          console.log('Save game loaded successfully');
        } else {
          console.log('Failed to load save game, starting new game');
          startNewGame(gameConfig);
        }
      } else {
        startNewGame(gameConfig);
      }
    } else {
      startNewGame(gameConfig);
    }

    // Start the game
    game.initialize();
    game.start();

    console.log('Puzzle Game initialized successfully');
    console.log('Use WASD or Arrow keys to move');
    console.log('Press E to interact with objects');
    console.log('Press I to toggle inventory');
    console.log('Press S to save game');

  } catch (error) {
    console.error('Failed to initialize game:', error);
    displayError('Failed to load game: ' + error.message);
  }
}

/**
 * Start a new game
 * @param {Object} gameConfig - Game configuration
 */
function startNewGame(gameConfig) {
  // Load the starting scene
  game.loadScene(gameConfig.game.startScene);
  
  // Update UI
  updateStoryText('Welcome to Blackwood Manor. Explore carefully and uncover its secrets...');
  updateUI();
}

/**
 * Create scenes from configuration
 * @param {Object} scenesConfig - Scenes configuration
 * @param {Object} entitiesConfig - Entities configuration
 */
async function createScenesFromConfig(scenesConfig, entitiesConfig) {
  for (const [sceneId, sceneData] of Object.entries(scenesConfig.scenes)) {
    const scene = new Scene(sceneId, sceneData);
    
    // Create entities for this scene
    if (sceneData.entities) {
      for (const entityData of sceneData.entities) {
        const entityType = entitiesConfig.entityTypes[entityData.type];
        if (!entityType) {
          console.warn(`Unknown entity type: ${entityData.type}`);
          continue;
        }

        // Merge entity config with instance config
        const config = { ...entityType, ...entityData.config };
        
        // Create entity based on type
        let entity = null;
        switch (entityData.type) {
          case 'player':
            entity = new Player(entityData.id, entityData.x, entityData.y, config);
            break;
          case 'door':
            entity = new Door(entityData.id, entityData.x, entityData.y, config);
            break;
          case 'key':
            entity = new Key(entityData.id, entityData.x, entityData.y, config);
            break;
          case 'clue':
            entity = new Clue(entityData.id, entityData.x, entityData.y, config);
            break;
          case 'interactive_object':
            entity = new InteractiveObject(entityData.id, entityData.x, entityData.y, config);
            break;
          case 'checkpoint':
            entity = new Checkpoint(entityData.id, entityData.x, entityData.y, config);
            break;
          default:
            // Create generic entity for walls, floors, etc.
            entity = await createGenericEntity(entityData.id, entityData.type, entityData.x, entityData.y, config);
            break;
        }

        if (entity) {
          scene.addEntity(entity);
        }
      }
    }

    // Create puzzles for this scene
    if (sceneData.puzzles) {
      for (const puzzleData of sceneData.puzzles) {
        const puzzle = new Puzzle(puzzleData.id, puzzleData.type, puzzleData);
        puzzles.push(puzzle);
        gameStateManager.addPuzzle(puzzle);
      }
    }

    // Register scene with game
    game.registerScene(sceneId, scene);
  }
}

/**
 * Create a generic entity for simple types like walls, floors
 * @param {string} id - Entity ID
 * @param {string} type - Entity type
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Object} config - Entity configuration
 * @returns {Entity} Created entity
 */
async function createGenericEntity(id, type, x, y, config) {
  // Import Entity class dynamically
  const { Entity } = await import('../../framework/core/Entity.js');
  return new Entity(id, type, x, y, config);
}

/**
 * Set up input handlers for puzzle game interactions
 */
function setupInputHandlers() {
  const inputHandler = game.getInputHandler();
  
  // Interaction key (E)
  inputHandler.onKeyDown('KeyE', () => {
    handleInteraction();
  });

  // Inventory toggle (I)
  inputHandler.onKeyDown('KeyI', () => {
    toggleInventoryDisplay();
  });

  // Save game (S)
  inputHandler.onKeyDown('KeyS', () => {
    if (gameStateManager.saveGame()) {
      updateStoryText('Game saved successfully.');
    } else {
      updateStoryText('Failed to save game.');
    }
  });

  // Load game (L)
  inputHandler.onKeyDown('KeyL', () => {
    if (gameStateManager.loadGame()) {
      updateStoryText('Game loaded successfully.');
      updateUI();
    } else {
      updateStoryText('No save data found.');
    }
  });
}

/**
 * Handle player interaction with nearby objects
 */
function handleInteraction() {
  const currentScene = game.getSceneManager().getCurrentScene();
  if (!currentScene) return;

  const player = findPlayer(currentScene);
  if (!player) return;

  // Find nearby interactive entities
  const entities = currentScene.getAllEntities();
  const interactiveEntities = entities.filter(entity => {
    if (entity === player) return false;
    
    const distance = Math.sqrt(
      Math.pow(entity.position.x - player.position.x, 2) +
      Math.pow(entity.position.y - player.position.y, 2)
    );
    
    const interactionRadius = entity.config?.interactionRadius || 32;
    return distance <= interactionRadius && entity.onInteract;
  });

  if (interactiveEntities.length > 0) {
    // Interact with the closest entity
    const closestEntity = interactiveEntities.reduce((closest, entity) => {
      const distanceToEntity = Math.sqrt(
        Math.pow(entity.position.x - player.position.x, 2) +
        Math.pow(entity.position.y - player.position.y, 2)
      );
      const distanceToClosest = Math.sqrt(
        Math.pow(closest.position.x - player.position.x, 2) +
        Math.pow(closest.position.y - player.position.y, 2)
      );
      return distanceToEntity < distanceToClosest ? entity : closest;
    });

    // Call the entity's interaction method
    const context = {
      player: player,
      game: game,
      scene: currentScene,
      gameStateManager: gameStateManager,
      updateStoryText: updateStoryText,
      updateUI: updateUI
    };

    const result = closestEntity.onInteract(player, context);
    
    if (result && result.message) {
      updateStoryText(result.message);
    }

    // Update UI after interaction
    updateUI();
  } else {
    updateStoryText('Nothing to interact with here.');
  }
}

/**
 * Toggle inventory display
 */
function toggleInventoryDisplay() {
  const currentScene = game.getSceneManager().getCurrentScene();
  if (!currentScene) return;

  const player = findPlayer(currentScene);
  if (!player || !player.toggleInventoryDisplay) return;

  player.toggleInventoryDisplay();
  updateUI();
}

/**
 * Find player entity in scene
 * @param {Scene} scene - Scene to search
 * @returns {Player|null} Player entity or null
 */
function findPlayer(scene) {
  const entities = scene.getAllEntities();
  return entities.find(entity => entity.getType() === 'player') || null;
}

/**
 * Set up UI update handlers
 */
function setupUIHandlers() {
  // Update UI every frame
  const originalRender = game._render.bind(game);
  game._render = function() {
    originalRender();
    updateUI();
  };
}

/**
 * Update the story text display
 * @param {string} text - Text to display
 */
function updateStoryText(text) {
  currentStoryText = text;
  const storyElement = document.getElementById('story-text');
  if (storyElement) {
    storyElement.textContent = text;
  }
}

/**
 * Update the interaction prompt
 * @param {string} prompt - Prompt text to display
 */
function updateInteractionPrompt(prompt) {
  interactionPrompt = prompt;
  const promptElement = document.getElementById('interaction-prompt');
  if (promptElement) {
    promptElement.textContent = prompt;
    promptElement.style.display = prompt ? 'block' : 'none';
  }
}

/**
 * Update the UI with current game state
 */
function updateUI() {
  const currentScene = game.getSceneManager().getCurrentScene();
  if (!currentScene) return;

  const player = findPlayer(currentScene);
  if (!player) return;

  // Update sanity display
  updateSanityDisplay();

  // Update inventory display
  updateInventoryDisplay(player);

  // Update interaction prompts
  updateInteractionPrompts(player, currentScene);

  // Update scene info
  updateSceneInfo(currentScene);
}

/**
 * Update sanity display
 */
function updateSanityDisplay() {
  const sanitySystem = game.getSanitySystem();
  const sanityBar = document.getElementById('sanity-bar');
  const sanityText = document.getElementById('sanity-text');
  
  if (sanityBar && sanityText) {
    const percentage = (sanitySystem.current / sanitySystem.max) * 100;
    sanityBar.style.width = percentage + '%';
    sanityText.textContent = `${Math.round(sanitySystem.current)} / ${sanitySystem.max}`;
    
    // Change color based on sanity level
    if (percentage < 25) {
      sanityBar.className = 'stat-bar-fill low';
    } else {
      sanityBar.className = 'stat-bar-fill';
    }
  }
}

/**
 * Update inventory display
 * @param {Player} player - Player entity
 */
function updateInventoryDisplay(player) {
  const inventoryList = document.getElementById('inventory-list');
  if (!inventoryList || !player.getInventoryDisplay) return;

  const inventoryDisplay = player.getInventoryDisplay();
  
  // Clear current inventory display
  inventoryList.innerHTML = '';

  if (inventoryDisplay.items.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'empty-message';
    emptyItem.textContent = 'No items';
    inventoryList.appendChild(emptyItem);
  } else {
    inventoryDisplay.items.forEach((item, index) => {
      const listItem = document.createElement('li');
      listItem.textContent = item.name || item.type || 'Unknown Item';
      
      if (index === inventoryDisplay.selectedIndex) {
        listItem.className = 'selected';
      }
      
      inventoryList.appendChild(listItem);
    });
  }
}

/**
 * Update interaction prompts
 * @param {Player} player - Player entity
 * @param {Scene} scene - Current scene
 */
function updateInteractionPrompts(player, scene) {
  const entities = scene.getAllEntities();
  const nearbyInteractables = entities.filter(entity => {
    if (entity === player || !entity.onInteract) return false;
    
    const distance = Math.sqrt(
      Math.pow(entity.position.x - player.position.x, 2) +
      Math.pow(entity.position.y - player.position.y, 2)
    );
    
    const interactionRadius = entity.config?.interactionRadius || 32;
    return distance <= interactionRadius;
  });

  if (nearbyInteractables.length > 0) {
    const entity = nearbyInteractables[0];
    const name = entity.config?.name || entity.getType();
    updateInteractionPrompt(`Press E to interact with ${name}`);
  } else {
    updateInteractionPrompt('');
  }
}

/**
 * Update scene information display
 * @param {Scene} scene - Current scene
 */
function updateSceneInfo(scene) {
  const sceneNameElement = document.getElementById('scene-name');
  const sceneDescElement = document.getElementById('scene-description');
  
  if (sceneNameElement) {
    sceneNameElement.textContent = scene.config?.name || scene.getId();
  }
  
  if (sceneDescElement) {
    sceneDescElement.textContent = scene.config?.description || '';
  }
}

/**
 * Display an error message to the user
 * @param {string} message - Error message to display
 */
function displayError(message) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', initGame);

// Export for testing/debugging
export { game, gameStateManager, puzzles, initGame, updateStoryText, updateUI };