import { Game } from '../../framework/core/Game.js';
import { DungeonScene } from './DungeonScene.js';
import { ConfigLoader } from '../../framework/utils/ConfigLoader.js';

/**
 * Dungeon Crawler Game - Main entry point
 * Demonstrates permadeath functionality with procedural dungeon generation
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

let game = null;
let dungeonScene = null;
let initialConfig = null;

/**
 * Initialize and start the dungeon crawler game
 */
async function initGame() {
  try {
    // Load game configuration from JSON files
    const gameConfig = await ConfigLoader.loadConfig('./games/dungeon-crawler/config/game.json');
    const entitiesConfig = await ConfigLoader.loadConfig('./games/dungeon-crawler/config/entities.json');
    const scenesConfig = await ConfigLoader.loadConfig('./games/dungeon-crawler/config/scenes.json');

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

    // Build dungeon scene configuration from loaded configs
    const dungeonSceneConfig = scenesConfig.scenes.dungeon_1;
    const dungeonConfig = {
      generator: dungeonSceneConfig.generator,
      player: entitiesConfig.entityTypes.player,
      enemies: {
        count: dungeonSceneConfig.entities.find(e => e.type === 'enemy')?.count || 5,
        config: entitiesConfig.entityTypes.enemy
      },
      items: {
        count: dungeonSceneConfig.entities.find(e => e.type === 'item')?.count || 3,
        config: entitiesConfig.entityTypes.item
      }
    };

    // Create the dungeon scene
    dungeonScene = new DungeonScene('dungeon', dungeonConfig);
    game.registerScene('dungeon', dungeonScene);

    // Set up permadeath handler
    game.onPlayerDeathCallback(() => {
      console.log('Player died! Regenerating dungeon...');
      
      // Update UI to show death message
      updateDeathMessage(true);
      
      // Wait a moment before resetting
      setTimeout(() => {
        // Reset game state
        game.resetGame(initialConfig);
        
        // Regenerate dungeon with new seed
        dungeonScene.regenerate();
        
        // Reload the scene
        game.loadScene('dungeon');
        
        // Clear death message
        updateDeathMessage(false);
        
        console.log('New dungeon generated with seed:', dungeonScene.getSeed());
      }, 2000);
    });

    // Load the initial scene
    game.loadScene('dungeon');

    // Start the game
    game.initialize();
    game.start();

    console.log('Dungeon Crawler initialized successfully');
    console.log('Use WASD or Arrow keys to move');
    console.log('Initial dungeon seed:', dungeonScene.getSeed());

  } catch (error) {
    console.error('Failed to initialize game:', error);
    displayError('Failed to load game: ' + error.message);
  }
}

/**
 * Update the death message display
 * @param {boolean} show - Whether to show or hide the message
 */
function updateDeathMessage(show) {
  const deathMessage = document.getElementById('death-message');
  if (deathMessage) {
    deathMessage.style.display = show ? 'block' : 'none';
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
export { game, dungeonScene, initGame };
