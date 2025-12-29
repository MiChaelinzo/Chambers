/**
 * SaveSystem - Framework utility for game state persistence
 * Provides save/load functionality with localStorage backend
 */

// Save file format version (for backward compatibility)
const SAVE_FORMAT_VERSION = '1.0.0';

export class SaveSystem {
  /**
   * @param {Object} config - Save system configuration
   * @param {string} config.gameId - Unique identifier for this game (required)
   * @param {number} config.maxSlots - Maximum number of save slots (default: 3)
   * @param {boolean} config.autoSave - Enable auto-save (default: false)
   * @param {number} config.autoSaveInterval - Auto-save interval in ms (default: 60000)
   */
  constructor(config = {}) {
    if (!config.gameId) {
      throw new Error('gameId is required in SaveSystem config');
    }

    this.gameId = config.gameId;
    this.maxSlots = config.maxSlots || 3;
    this.autoSave = config.autoSave || false;
    this.autoSaveInterval = config.autoSaveInterval || 60000; // 1 minute default
    this.autoSaveTimer = null;

    // Check localStorage availability
    this.storageAvailable = this._checkStorageAvailable();
    
    if (!this.storageAvailable) {
      console.warn('localStorage is not available. Save system will not persist data.');
    }
  }

  /**
   * Check if localStorage is available
   * @private
   * @returns {boolean} True if localStorage is available
   */
  _checkStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Generate storage key for a save slot
   * @private
   * @param {number} slot - Save slot number
   * @returns {string} Storage key
   */
  _getStorageKey(slot) {
    return `${this.gameId}_save_slot_${slot}`;
  }

  /**
   * Save game state to a slot
   * @param {number} slot - Save slot number (0 to maxSlots-1)
   * @param {Object} gameState - Game state to save
   * @param {Object} metadata - Optional metadata (timestamp, level, etc.)
   * @returns {boolean} True if save was successful
   */
  save(slot, gameState, metadata = {}) {
    if (!this.storageAvailable) {
      return false;
    }

    if (slot < 0 || slot >= this.maxSlots) {
      console.error(`Invalid save slot ${slot}. Must be between 0 and ${this.maxSlots - 1}`);
      return false;
    }

    try {
      const saveData = {
        version: SAVE_FORMAT_VERSION,
        timestamp: Date.now(),
        metadata: metadata,
        gameState: gameState
      };

      const key = this._getStorageKey(slot);
      localStorage.setItem(key, JSON.stringify(saveData));
      return true;
    } catch (error) {
      console.error(`Failed to save to slot ${slot}:`, error);
      return false;
    }
  }

  /**
   * Load game state from a slot
   * @param {number} slot - Save slot number (0 to maxSlots-1)
   * @returns {Object|null} Loaded save data or null if not found/error
   */
  load(slot) {
    if (!this.storageAvailable) {
      return null;
    }

    if (slot < 0 || slot >= this.maxSlots) {
      console.error(`Invalid save slot ${slot}. Must be between 0 and ${this.maxSlots - 1}`);
      return null;
    }

    try {
      const key = this._getStorageKey(slot);
      const data = localStorage.getItem(key);
      
      if (!data) {
        return null;
      }

      return JSON.parse(data);
    } catch (error) {
      console.error(`Failed to load from slot ${slot}:`, error);
      return null;
    }
  }

  /**
   * Delete save data from a slot
   * @param {number} slot - Save slot number (0 to maxSlots-1)
   * @returns {boolean} True if deletion was successful
   */
  deleteSave(slot) {
    if (!this.storageAvailable) {
      return false;
    }

    if (slot < 0 || slot >= this.maxSlots) {
      console.error(`Invalid save slot ${slot}. Must be between 0 and ${this.maxSlots - 1}`);
      return false;
    }

    try {
      const key = this._getStorageKey(slot);
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to delete slot ${slot}:`, error);
      return false;
    }
  }

  /**
   * Check if a save exists in a slot
   * @param {number} slot - Save slot number (0 to maxSlots-1)
   * @returns {boolean} True if save exists
   */
  hasSave(slot) {
    if (!this.storageAvailable) {
      return false;
    }

    if (slot < 0 || slot >= this.maxSlots) {
      return false;
    }

    const key = this._getStorageKey(slot);
    return localStorage.getItem(key) !== null;
  }

  /**
   * Get metadata for all save slots
   * @returns {Array} Array of save metadata objects (null for empty slots)
   */
  getAllSaveMetadata() {
    if (!this.storageAvailable) {
      return Array(this.maxSlots).fill(null);
    }

    const metadata = [];
    for (let i = 0; i < this.maxSlots; i++) {
      if (this.hasSave(i)) {
        const saveData = this.load(i);
        metadata.push({
          slot: i,
          timestamp: saveData.timestamp,
          metadata: saveData.metadata
        });
      } else {
        metadata.push(null);
      }
    }
    return metadata;
  }

  /**
   * Delete all saves for this game
   * @returns {boolean} True if all deletions were successful
   */
  deleteAllSaves() {
    if (!this.storageAvailable) {
      return false;
    }

    let success = true;
    for (let i = 0; i < this.maxSlots; i++) {
      if (!this.deleteSave(i)) {
        success = false;
      }
    }
    return success;
  }

  /**
   * Start auto-save timer
   * @param {Function} saveCallback - Callback to get current game state
   * @param {number} slot - Save slot for auto-save (default: 0)
   */
  startAutoSave(saveCallback, slot = 0) {
    if (!this.autoSave) {
      return;
    }

    this.stopAutoSave();

    this.autoSaveTimer = setInterval(() => {
      try {
        const gameState = saveCallback();
        this.save(slot, gameState, { autoSave: true });
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, this.autoSaveInterval);
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Export save data as JSON string for backup
   * @param {number} slot - Save slot number
   * @returns {string|null} JSON string of save data or null
   */
  exportSave(slot) {
    const saveData = this.load(slot);
    if (!saveData) {
      return null;
    }
    return JSON.stringify(saveData);
  }

  /**
   * Import save data from JSON string
   * @param {number} slot - Target save slot number
   * @param {string} jsonData - JSON string of save data
   * @returns {boolean} True if import was successful
   */
  importSave(slot, jsonData) {
    if (!this.storageAvailable) {
      return false;
    }

    try {
      const saveData = JSON.parse(jsonData);
      
      // Validate save data structure
      if (!saveData.version || !saveData.gameState) {
        console.error('Invalid save data format');
        return false;
      }

      const key = this._getStorageKey(slot);
      localStorage.setItem(key, jsonData);
      return true;
    } catch (error) {
      console.error('Failed to import save:', error);
      return false;
    }
  }

  /**
   * Get storage usage statistics
   * @returns {Object} Storage statistics
   */
  getStorageStats() {
    if (!this.storageAvailable) {
      return { available: false };
    }

    try {
      let totalSize = 0;
      const saves = [];

      for (let i = 0; i < this.maxSlots; i++) {
        const key = this._getStorageKey(i);
        const data = localStorage.getItem(key);
        if (data) {
          const size = new Blob([data]).size;
          totalSize += size;
          saves.push({ slot: i, size });
        }
      }

      return {
        available: true,
        totalSize,
        saves,
        slotsUsed: saves.length,
        slotsAvailable: this.maxSlots - saves.length
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { available: false };
    }
  }
}
