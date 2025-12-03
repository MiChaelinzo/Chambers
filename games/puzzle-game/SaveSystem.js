/**
 * Save/Load system for puzzle game
 * Handles serialization of game state to localStorage and restoration
 */
export class SaveSystem {
  constructor(gameId = 'puzzle-game') {
    this.gameId = gameId;
    this.storageKey = `${gameId}-save`;
  }

  /**
   * Save complete game state to localStorage
   * @param {Object} gameState - Complete game state to save
   * @param {Object} gameState.player - Player entity state
   * @param {Object} gameState.scene - Current scene state
   * @param {Array} gameState.puzzles - Array of puzzle states
   * @param {Object} gameState.progress - Game progress data
   * @returns {boolean} True if save was successful
   */
  saveGame(gameState) {
    try {
      const saveData = {
        version: '1.0',
        timestamp: Date.now(),
        gameId: this.gameId,
        ...gameState
      };

      const serializedData = JSON.stringify(saveData);
      localStorage.setItem(this.storageKey, serializedData);
      
      console.log('Game saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  /**
   * Load game state from localStorage
   * @returns {Object|null} Loaded game state or null if no save exists
   */
  loadGame() {
    try {
      const serializedData = localStorage.getItem(this.storageKey);
      
      if (!serializedData) {
        console.log('No save data found');
        return null;
      }

      const saveData = JSON.parse(serializedData);
      
      // Validate save data
      if (!this.validateSaveData(saveData)) {
        console.error('Invalid save data format');
        return null;
      }

      console.log('Game loaded successfully');
      return saveData;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  /**
   * Check if a save file exists
   * @returns {boolean} True if save data exists
   */
  hasSaveData() {
    return localStorage.getItem(this.storageKey) !== null;
  }

  /**
   * Delete save data
   * @returns {boolean} True if deletion was successful
   */
  deleteSave() {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('Save data deleted');
      return true;
    } catch (error) {
      console.error('Failed to delete save data:', error);
      return false;
    }
  }

  /**
   * Validate save data structure
   * @param {Object} saveData - Save data to validate
   * @returns {boolean} True if valid
   */
  validateSaveData(saveData) {
    if (!saveData || typeof saveData !== 'object') {
      return false;
    }

    // Check required fields
    const requiredFields = ['version', 'timestamp', 'gameId'];
    for (const field of requiredFields) {
      if (!(field in saveData)) {
        return false;
      }
    }

    // Check game ID matches
    if (saveData.gameId !== this.gameId) {
      return false;
    }

    return true;
  }

  /**
   * Serialize player state
   * @param {Player} player - Player entity
   * @returns {Object} Serialized player data
   */
  serializePlayer(player) {
    return {
      position: { ...player.position },
      state: {
        inventory: [...player.state.inventory],
        selectedItemIndex: player.state.selectedItemIndex,
        speed: player.state.speed,
        interactionRadius: player.state.interactionRadius
      },
      config: { ...player.config }
    };
  }

  /**
   * Deserialize player state
   * @param {Object} playerData - Serialized player data
   * @param {Player} player - Player entity to restore state to
   */
  deserializePlayer(playerData, player) {
    if (!playerData) return;

    // Restore position
    if (playerData.position) {
      player.position.x = playerData.position.x;
      player.position.y = playerData.position.y;
    }

    // Restore state
    if (playerData.state) {
      player.state.inventory = [...(playerData.state.inventory || [])];
      player.state.selectedItemIndex = playerData.state.selectedItemIndex !== undefined ? playerData.state.selectedItemIndex : -1;
      player.state.speed = playerData.state.speed !== undefined ? playerData.state.speed : player.state.speed;
      player.state.interactionRadius = playerData.state.interactionRadius !== undefined ? playerData.state.interactionRadius : player.state.interactionRadius;
    }

    // Restore config if needed
    if (playerData.config) {
      Object.assign(player.config, playerData.config);
    }
  }

  /**
   * Serialize scene state
   * @param {Scene} scene - Scene to serialize
   * @returns {Object} Serialized scene data
   */
  serializeScene(scene) {
    const entities = [];
    
    // Serialize all entities except player (player is handled separately)
    for (const entity of scene.getAllEntities()) {
      if (entity.getType() !== 'player') {
        entities.push({
          id: entity.getId(),
          type: entity.getType(),
          position: { ...entity.position },
          state: { ...entity.state },
          config: { ...entity.config }
        });
      }
    }

    return {
      id: scene.getId(),
      config: scene.getConfig(),
      entities: entities,
      isLoaded: scene.getIsLoaded()
    };
  }

  /**
   * Serialize puzzle states
   * @param {Array<Puzzle>} puzzles - Array of puzzles to serialize
   * @returns {Array} Serialized puzzle data
   */
  serializePuzzles(puzzles) {
    return puzzles.map(puzzle => puzzle.serialize());
  }

  /**
   * Create a checkpoint save
   * @param {Object} gameState - Current game state
   * @param {string} checkpointName - Name/ID of the checkpoint
   * @returns {boolean} True if checkpoint was saved
   */
  saveCheckpoint(gameState, checkpointName = 'auto') {
    const checkpointData = {
      ...gameState,
      checkpoint: {
        name: checkpointName,
        timestamp: Date.now()
      }
    };

    return this.saveGame(checkpointData);
  }

  /**
   * Get save file info without loading the full data
   * @returns {Object|null} Save file metadata
   */
  getSaveInfo() {
    try {
      const serializedData = localStorage.getItem(this.storageKey);
      
      if (!serializedData) {
        return null;
      }

      const saveData = JSON.parse(serializedData);
      
      return {
        version: saveData.version,
        timestamp: saveData.timestamp,
        gameId: saveData.gameId,
        checkpoint: saveData.checkpoint || null,
        hasData: true
      };
    } catch (error) {
      console.error('Failed to get save info:', error);
      return null;
    }
  }
}