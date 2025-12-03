import { SaveSystem } from './SaveSystem.js';

/**
 * Game State Manager for puzzle game
 * Manages game state, save/load operations, and scene restoration
 */
export class GameStateManager {
  constructor(game, puzzles = []) {
    this.game = game;
    this.puzzles = puzzles;
    this.saveSystem = new SaveSystem('puzzle-game');
    this.currentCheckpoint = null;
  }

  /**
   * Save current game state
   * @param {string} checkpointName - Optional checkpoint name
   * @returns {boolean} True if save was successful
   */
  saveGame(checkpointName = 'manual') {
    const gameState = this.gatherCurrentGameState();
    
    if (checkpointName === 'manual') {
      return this.saveSystem.saveGame(gameState);
    } else {
      return this.saveSystem.saveCheckpoint(gameState, checkpointName);
    }
  }

  /**
   * Load saved game state
   * @returns {boolean} True if load was successful
   */
  loadGame() {
    const saveData = this.saveSystem.loadGame();
    
    if (!saveData) {
      return false;
    }

    return this.restoreGameState(saveData);
  }

  /**
   * Check if save data exists
   * @returns {boolean} True if save data exists
   */
  hasSaveData() {
    return this.saveSystem.hasSaveData();
  }

  /**
   * Delete save data
   * @returns {boolean} True if deletion was successful
   */
  deleteSave() {
    return this.saveSystem.deleteSave();
  }

  /**
   * Get save file information
   * @returns {Object|null} Save file metadata
   */
  getSaveInfo() {
    return this.saveSystem.getSaveInfo();
  }

  /**
   * Gather current game state for saving
   * @returns {Object} Complete game state
   */
  gatherCurrentGameState() {
    const gameState = {};

    // Get current scene
    const currentScene = this.game.sceneManager ? this.game.sceneManager.getCurrentScene() : null;
    
    if (currentScene) {
      // Get player state
      const player = this.findPlayer(currentScene);
      if (player) {
        gameState.player = this.saveSystem.serializePlayer(player);
      }

      // Get scene state
      gameState.scene = this.saveSystem.serializeScene(currentScene);
    }

    // Get puzzle states
    if (this.puzzles.length > 0) {
      gameState.puzzles = this.saveSystem.serializePuzzles(this.puzzles);
    }

    // Add progress information
    gameState.progress = {
      currentSceneId: currentScene ? currentScene.getId() : null,
      checkpoint: this.currentCheckpoint,
      timestamp: Date.now(),
      gameVersion: '1.0'
    };

    return gameState;
  }

  /**
   * Restore game state from save data
   * @param {Object} saveData - Loaded save data
   * @returns {boolean} True if restoration was successful
   */
  restoreGameState(saveData) {
    try {
      // Restore scene if specified
      if (saveData.progress && saveData.progress.currentSceneId) {
        const sceneId = saveData.progress.currentSceneId;
        
        // Load the scene through scene manager
        if (this.game.sceneManager) {
          this.game.sceneManager.loadScene(sceneId);
          const currentScene = this.game.sceneManager.getCurrentScene();
          
          if (currentScene) {
            // Restore player state
            if (saveData.player) {
              const player = this.findPlayer(currentScene);
              if (player) {
                this.saveSystem.deserializePlayer(saveData.player, player);
              }
            }

            // Restore entity states (excluding player)
            if (saveData.scene && saveData.scene.entities) {
              this.restoreEntityStates(currentScene, saveData.scene.entities);
            }
          }
        }
      }

      // Restore puzzle states
      if (saveData.puzzles && this.puzzles.length > 0) {
        this.restorePuzzleStates(saveData.puzzles);
      }

      // Restore progress information
      if (saveData.progress) {
        this.currentCheckpoint = saveData.progress.checkpoint;
      }

      console.log('Game state restored successfully');
      return true;
    } catch (error) {
      console.error('Failed to restore game state:', error);
      return false;
    }
  }

  /**
   * Restore entity states in the current scene
   * @param {Scene} scene - Scene to restore entities in
   * @param {Array} entityData - Array of entity state data
   */
  restoreEntityStates(scene, entityData) {
    for (const data of entityData) {
      const entity = scene.getEntityById(data.id);
      
      if (entity) {
        // Restore position
        if (data.position) {
          entity.position.x = data.position.x;
          entity.position.y = data.position.y;
        }

        // Restore state
        if (data.state) {
          Object.assign(entity.state, data.state);
        }

        // Restore config if needed
        if (data.config) {
          Object.assign(entity.config, data.config);
        }
      }
    }
  }

  /**
   * Restore puzzle states from save data
   * @param {Array} puzzleData - Array of puzzle state data
   */
  restorePuzzleStates(puzzleData) {
    for (const data of puzzleData) {
      const puzzle = this.puzzles.find(p => p.id === data.id);
      
      if (puzzle) {
        try {
          puzzle.deserialize(data);
        } catch (error) {
          console.error(`Failed to restore puzzle ${data.id}:`, error);
        }
      }
    }
  }

  /**
   * Find player entity in scene
   * @param {Scene} scene - Scene to search
   * @returns {Player|null} Player entity or null
   */
  findPlayer(scene) {
    const players = scene.getEntitiesByType('player');
    return players.length > 0 ? players[0] : null;
  }

  /**
   * Add a puzzle to be managed
   * @param {Puzzle} puzzle - Puzzle to add
   */
  addPuzzle(puzzle) {
    if (!this.puzzles.includes(puzzle)) {
      this.puzzles.push(puzzle);
    }
  }

  /**
   * Remove a puzzle from management
   * @param {Puzzle} puzzle - Puzzle to remove
   */
  removePuzzle(puzzle) {
    const index = this.puzzles.indexOf(puzzle);
    if (index !== -1) {
      this.puzzles.splice(index, 1);
    }
  }

  /**
   * Set current checkpoint
   * @param {string} checkpointName - Name of the checkpoint
   */
  setCurrentCheckpoint(checkpointName) {
    this.currentCheckpoint = checkpointName;
  }

  /**
   * Get current checkpoint
   * @returns {string|null} Current checkpoint name
   */
  getCurrentCheckpoint() {
    return this.currentCheckpoint;
  }

  /**
   * Create a quick save
   * @returns {boolean} True if quick save was successful
   */
  quickSave() {
    return this.saveGame('quicksave');
  }

  /**
   * Load quick save
   * @returns {boolean} True if quick load was successful
   */
  quickLoad() {
    return this.loadGame();
  }
}