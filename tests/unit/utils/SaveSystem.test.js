/**
 * Unit tests for SaveSystem
 */
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { SaveSystem } from '../../../framework/utils/SaveSystem.js';

// Save file format version should match SaveSystem
const SAVE_FORMAT_VERSION = '1.0.0';

describe('SaveSystem', () => {
  let saveSystem;
  const gameId = 'test_game';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    saveSystem = new SaveSystem({ gameId });
  });

  afterEach(() => {
    // Clean up
    localStorage.clear();
  });

  describe('Constructor', () => {
    test('should require gameId', () => {
      expect(() => new SaveSystem({})).toThrow('gameId is required');
    });

    test('should initialize with default values', () => {
      expect(saveSystem.gameId).toBe(gameId);
      expect(saveSystem.maxSlots).toBe(3);
      expect(saveSystem.autoSave).toBe(false);
      expect(saveSystem.storageAvailable).toBe(true);
    });

    test('should accept custom configuration', () => {
      const customSaveSystem = new SaveSystem({
        gameId: 'custom_game',
        maxSlots: 5,
        autoSave: true,
        autoSaveInterval: 30000
      });

      expect(customSaveSystem.maxSlots).toBe(5);
      expect(customSaveSystem.autoSave).toBe(true);
      expect(customSaveSystem.autoSaveInterval).toBe(30000);
    });
  });

  describe('save() and load()', () => {
    test('should save and load game state', () => {
      const gameState = {
        player: { x: 100, y: 200, health: 80 },
        level: 5,
        inventory: ['sword', 'shield']
      };

      const metadata = {
        playerName: 'TestPlayer',
        playtime: 3600
      };

      const saved = saveSystem.save(0, gameState, metadata);
      expect(saved).toBe(true);

      const loaded = saveSystem.load(0);
      expect(loaded).not.toBeNull();
      expect(loaded.gameState).toEqual(gameState);
      expect(loaded.metadata).toEqual(metadata);
      expect(loaded.version).toBe(SAVE_FORMAT_VERSION);
      expect(loaded.timestamp).toBeGreaterThan(0);
    });

    test('should return null when loading non-existent save', () => {
      const loaded = saveSystem.load(1);
      expect(loaded).toBeNull();
    });

    test('should reject invalid slot numbers', () => {
      const gameState = { test: 'data' };

      expect(saveSystem.save(-1, gameState)).toBe(false);
      expect(saveSystem.save(3, gameState)).toBe(false);
      expect(saveSystem.load(-1)).toBeNull();
      expect(saveSystem.load(3)).toBeNull();
    });

    test('should handle saving without metadata', () => {
      const gameState = { test: 'data' };
      
      saveSystem.save(0, gameState);
      const loaded = saveSystem.load(0);
      
      expect(loaded.gameState).toEqual(gameState);
      expect(loaded.metadata).toEqual({});
    });
  });

  describe('hasSave()', () => {
    test('should check if save exists', () => {
      expect(saveSystem.hasSave(0)).toBe(false);

      saveSystem.save(0, { test: 'data' });
      expect(saveSystem.hasSave(0)).toBe(true);
    });

    test('should return false for invalid slots', () => {
      expect(saveSystem.hasSave(-1)).toBe(false);
      expect(saveSystem.hasSave(5)).toBe(false);
    });
  });

  describe('deleteSave()', () => {
    test('should delete existing save', () => {
      saveSystem.save(0, { test: 'data' });
      expect(saveSystem.hasSave(0)).toBe(true);

      const deleted = saveSystem.deleteSave(0);
      expect(deleted).toBe(true);
      expect(saveSystem.hasSave(0)).toBe(false);
    });

    test('should handle deleting non-existent save', () => {
      const deleted = saveSystem.deleteSave(1);
      expect(deleted).toBe(true);
    });

    test('should reject invalid slot numbers', () => {
      expect(saveSystem.deleteSave(-1)).toBe(false);
      expect(saveSystem.deleteSave(5)).toBe(false);
    });
  });

  describe('getAllSaveMetadata()', () => {
    test('should return metadata for all slots', () => {
      saveSystem.save(0, { test: 'data1' }, { level: 1 });
      saveSystem.save(2, { test: 'data2' }, { level: 3 });

      const metadata = saveSystem.getAllSaveMetadata();
      
      expect(metadata.length).toBe(3);
      expect(metadata[0]).not.toBeNull();
      expect(metadata[0].slot).toBe(0);
      expect(metadata[0].metadata.level).toBe(1);
      expect(metadata[1]).toBeNull();
      expect(metadata[2]).not.toBeNull();
      expect(metadata[2].slot).toBe(2);
      expect(metadata[2].metadata.level).toBe(3);
    });
  });

  describe('deleteAllSaves()', () => {
    test('should delete all saves', () => {
      saveSystem.save(0, { test: 'data1' });
      saveSystem.save(1, { test: 'data2' });
      saveSystem.save(2, { test: 'data3' });

      const deleted = saveSystem.deleteAllSaves();
      expect(deleted).toBe(true);

      expect(saveSystem.hasSave(0)).toBe(false);
      expect(saveSystem.hasSave(1)).toBe(false);
      expect(saveSystem.hasSave(2)).toBe(false);
    });
  });

  describe('exportSave() and importSave()', () => {
    test('should export save as JSON', () => {
      const gameState = { player: { x: 100, y: 200 } };
      saveSystem.save(0, gameState);

      const exported = saveSystem.exportSave(0);
      expect(exported).not.toBeNull();
      
      const parsed = JSON.parse(exported);
      expect(parsed.gameState).toEqual(gameState);
    });

    test('should import save from JSON', () => {
      const gameState = { player: { x: 100, y: 200 } };
      saveSystem.save(0, gameState);

      const exported = saveSystem.exportSave(0);
      saveSystem.deleteSave(0);

      const imported = saveSystem.importSave(1, exported);
      expect(imported).toBe(true);

      const loaded = saveSystem.load(1);
      expect(loaded.gameState).toEqual(gameState);
    });

    test('should return null when exporting non-existent save', () => {
      const exported = saveSystem.exportSave(0);
      expect(exported).toBeNull();
    });

    test('should reject invalid JSON on import', () => {
      const imported = saveSystem.importSave(0, 'invalid json');
      expect(imported).toBe(false);
    });
  });

  describe('getStorageStats()', () => {
    test('should return storage statistics', () => {
      saveSystem.save(0, { test: 'data1' });
      saveSystem.save(1, { test: 'data2' });

      const stats = saveSystem.getStorageStats();
      
      expect(stats.available).toBe(true);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.saves.length).toBe(2);
      expect(stats.slotsUsed).toBe(2);
      expect(stats.slotsAvailable).toBe(1);
    });
  });

  describe('Auto-save', () => {
    test('should start and stop auto-save', (done) => {
      const autoSaveSystem = new SaveSystem({
        gameId: 'autosave_test',
        autoSave: true,
        autoSaveInterval: 100
      });

      let saveCount = 0;
      const saveCallback = () => {
        saveCount++;
        return { counter: saveCount };
      };

      autoSaveSystem.startAutoSave(saveCallback, 0);

      setTimeout(() => {
        autoSaveSystem.stopAutoSave();
        
        expect(saveCount).toBeGreaterThan(0);
        
        const loaded = autoSaveSystem.load(0);
        expect(loaded).not.toBeNull();
        expect(loaded.metadata.autoSave).toBe(true);
        
        localStorage.clear();
        done();
      }, 250);
    });

    test('should not start auto-save if disabled', () => {
      const saveCallback = () => ({ test: 'data' });
      saveSystem.startAutoSave(saveCallback, 0);
      
      expect(saveSystem.autoSaveTimer).toBeNull();
    });
  });

  describe('Multiple save slots', () => {
    test('should support multiple independent save slots', () => {
      const save1 = { level: 1, player: 'Alice' };
      const save2 = { level: 5, player: 'Bob' };
      const save3 = { level: 10, player: 'Charlie' };

      saveSystem.save(0, save1);
      saveSystem.save(1, save2);
      saveSystem.save(2, save3);

      expect(saveSystem.load(0).gameState).toEqual(save1);
      expect(saveSystem.load(1).gameState).toEqual(save2);
      expect(saveSystem.load(2).gameState).toEqual(save3);
    });
  });
});
