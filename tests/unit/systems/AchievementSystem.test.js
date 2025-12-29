/**
 * Unit tests for AchievementSystem
 */
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { AchievementSystem } from '../../../framework/systems/AchievementSystem.js';

describe('AchievementSystem', () => {
  let achievementSystem;
  const gameId = 'test_game_achievements';

  beforeEach(() => {
    localStorage.clear();
    achievementSystem = new AchievementSystem({ gameId });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Constructor', () => {
    test('should initialize with default values', () => {
      expect(achievementSystem.gameId).toBe(gameId);
      expect(achievementSystem.enableNotifications).toBe(true);
      expect(achievementSystem.notificationDuration).toBe(3000);
    });

    test('should work without gameId (no persistence)', () => {
      const system = new AchievementSystem({});
      expect(system.gameId).toBeUndefined();
    });
  });

  describe('registerAchievement()', () => {
    test('should register simple achievement', () => {
      achievementSystem.registerAchievement({
        id: 'first_kill',
        name: 'First Blood',
        description: 'Defeat your first enemy',
        type: 'simple'
      });

      expect(achievementSystem.achievements.has('first_kill')).toBe(true);
    });

    test('should register progress achievement', () => {
      achievementSystem.registerAchievement({
        id: 'kill_100',
        name: 'Centurion',
        description: 'Defeat 100 enemies',
        type: 'progress',
        target: 100
      });

      expect(achievementSystem.achievements.has('kill_100')).toBe(true);
      expect(achievementSystem.progressData.get('kill_100')).toBe(0);
    });

    test('should register secret achievement', () => {
      achievementSystem.registerAchievement({
        id: 'secret_room',
        name: 'Secret Room',
        description: 'Find the hidden chamber',
        type: 'secret',
        hidden: true
      });

      const achievement = achievementSystem.achievements.get('secret_room');
      expect(achievement.hidden).toBe(true);
    });

    test('should require id', () => {
      expect(() => {
        achievementSystem.registerAchievement({
          name: 'Test',
          description: 'Test'
        });
      }).toThrow('Achievement must have an id');
    });

    test('should require name', () => {
      expect(() => {
        achievementSystem.registerAchievement({
          id: 'test'
        });
      }).toThrow('Achievement must have a name');
    });

    test('should require target for progress achievements', () => {
      expect(() => {
        achievementSystem.registerAchievement({
          id: 'test',
          name: 'Test',
          type: 'progress'
        });
      }).toThrow('Progress achievements must have a target value');
    });

    test('should reject invalid achievement type', () => {
      expect(() => {
        achievementSystem.registerAchievement({
          id: 'test',
          name: 'Test',
          type: 'invalid_type'
        });
      }).toThrow('Invalid achievement type');
    });
  });

  describe('unlock()', () => {
    beforeEach(() => {
      achievementSystem.registerAchievement({
        id: 'test_achievement',
        name: 'Test Achievement',
        description: 'Test description',
        type: 'simple'
      });
    });

    test('should unlock achievement', () => {
      const unlocked = achievementSystem.unlock('test_achievement');
      
      expect(unlocked).toBe(true);
      expect(achievementSystem.isUnlocked('test_achievement')).toBe(true);
    });

    test('should return false for already unlocked achievement', () => {
      achievementSystem.unlock('test_achievement');
      const unlocked = achievementSystem.unlock('test_achievement');
      
      expect(unlocked).toBe(false);
    });

    test('should warn for non-existent achievement', () => {
      const unlocked = achievementSystem.unlock('nonexistent');
      expect(unlocked).toBe(false);
    });

    test('should trigger callback on unlock', () => {
      let callbackTriggered = false;
      let unlockedAchievement = null;

      achievementSystem.onUnlock((achievement) => {
        callbackTriggered = true;
        unlockedAchievement = achievement;
      });

      achievementSystem.unlock('test_achievement');

      expect(callbackTriggered).toBe(true);
      expect(unlockedAchievement.id).toBe('test_achievement');
    });

    test('should persist unlocked state', () => {
      achievementSystem.unlock('test_achievement');

      // Create new instance to test persistence
      const newSystem = new AchievementSystem({ gameId });
      newSystem.registerAchievement({
        id: 'test_achievement',
        name: 'Test Achievement',
        description: 'Test description',
        type: 'simple'
      });

      expect(newSystem.isUnlocked('test_achievement')).toBe(true);
    });
  });

  describe('updateProgress()', () => {
    beforeEach(() => {
      achievementSystem.registerAchievement({
        id: 'progress_test',
        name: 'Progress Test',
        description: 'Test progress achievement',
        type: 'progress',
        target: 10
      });
    });

    test('should update progress', () => {
      achievementSystem.updateProgress('progress_test', 5);
      
      const progress = achievementSystem.getProgress('progress_test');
      expect(progress.current).toBe(5);
      expect(progress.target).toBe(10);
      expect(progress.percentage).toBe(50);
    });

    test('should unlock when target reached', () => {
      achievementSystem.updateProgress('progress_test', 10);
      
      expect(achievementSystem.isUnlocked('progress_test')).toBe(true);
    });

    test('should clamp progress to target', () => {
      achievementSystem.updateProgress('progress_test', 15);
      
      const progress = achievementSystem.getProgress('progress_test');
      expect(progress.current).toBe(10);
    });

    test('should trigger progress callback', () => {
      let callbackTriggered = false;
      let currentProgress = 0;

      achievementSystem.onProgress((achievement, current, target) => {
        callbackTriggered = true;
        currentProgress = current;
      });

      achievementSystem.updateProgress('progress_test', 3);

      expect(callbackTriggered).toBe(true);
      expect(currentProgress).toBe(3);
    });

    test('should not update already unlocked achievement', () => {
      achievementSystem.updateProgress('progress_test', 10);
      achievementSystem.updateProgress('progress_test', 5);
      
      const progress = achievementSystem.getProgress('progress_test');
      expect(progress.current).toBe(10);
    });

    test('should warn for non-progress achievement', () => {
      achievementSystem.registerAchievement({
        id: 'simple_test',
        name: 'Simple Test',
        description: 'Test',
        type: 'simple'
      });

      achievementSystem.updateProgress('simple_test', 5);
      expect(achievementSystem.getProgress('simple_test')).toBeNull();
    });
  });

  describe('incrementProgress()', () => {
    beforeEach(() => {
      achievementSystem.registerAchievement({
        id: 'increment_test',
        name: 'Increment Test',
        description: 'Test increment',
        type: 'progress',
        target: 10
      });
    });

    test('should increment progress', () => {
      achievementSystem.incrementProgress('increment_test', 2);
      achievementSystem.incrementProgress('increment_test', 3);
      
      const progress = achievementSystem.getProgress('increment_test');
      expect(progress.current).toBe(5);
    });

    test('should increment by 1 by default', () => {
      achievementSystem.incrementProgress('increment_test');
      
      const progress = achievementSystem.getProgress('increment_test');
      expect(progress.current).toBe(1);
    });
  });

  describe('getAllAchievements()', () => {
    beforeEach(() => {
      achievementSystem.registerAchievement({
        id: 'visible1',
        name: 'Visible 1',
        description: 'Test',
        type: 'simple'
      });

      achievementSystem.registerAchievement({
        id: 'hidden1',
        name: 'Hidden 1',
        description: 'Test',
        type: 'secret',
        hidden: true
      });

      achievementSystem.unlock('visible1');
    });

    test('should return all achievements by default (excluding hidden)', () => {
      const achievements = achievementSystem.getAllAchievements();
      
      expect(achievements.length).toBe(1);
      expect(achievements[0].id).toBe('visible1');
    });

    test('should include hidden achievements when requested', () => {
      const achievements = achievementSystem.getAllAchievements(true);
      
      expect(achievements.length).toBe(2);
    });

    test('should show hidden achievements after unlock', () => {
      achievementSystem.unlock('hidden1');
      
      const achievements = achievementSystem.getAllAchievements(false);
      expect(achievements.length).toBe(2);
    });
  });

  describe('getUnlockedAchievements()', () => {
    beforeEach(() => {
      achievementSystem.registerAchievement({
        id: 'unlocked',
        name: 'Unlocked',
        description: 'Test',
        type: 'simple'
      });

      achievementSystem.registerAchievement({
        id: 'locked',
        name: 'Locked',
        description: 'Test',
        type: 'simple'
      });

      achievementSystem.unlock('unlocked');
    });

    test('should return only unlocked achievements', () => {
      const unlocked = achievementSystem.getUnlockedAchievements();
      
      expect(unlocked.length).toBe(1);
      expect(unlocked[0].id).toBe('unlocked');
      expect(unlocked[0].unlocked).toBe(true);
    });
  });

  describe('getLockedAchievements()', () => {
    beforeEach(() => {
      achievementSystem.registerAchievement({
        id: 'unlocked',
        name: 'Unlocked',
        description: 'Test',
        type: 'simple'
      });

      achievementSystem.registerAchievement({
        id: 'locked',
        name: 'Locked',
        description: 'Test',
        type: 'simple'
      });

      achievementSystem.unlock('unlocked');
    });

    test('should return only locked achievements', () => {
      const locked = achievementSystem.getLockedAchievements();
      
      expect(locked.length).toBe(1);
      expect(locked[0].id).toBe('locked');
      expect(locked[0].unlocked).toBe(false);
    });
  });

  describe('getStats()', () => {
    beforeEach(() => {
      for (let i = 0; i < 5; i++) {
        achievementSystem.registerAchievement({
          id: `achievement_${i}`,
          name: `Achievement ${i}`,
          description: 'Test',
          type: 'simple'
        });
      }

      achievementSystem.unlock('achievement_0');
      achievementSystem.unlock('achievement_1');
    });

    test('should return achievement statistics', () => {
      const stats = achievementSystem.getStats();
      
      expect(stats.total).toBe(5);
      expect(stats.unlocked).toBe(2);
      expect(stats.locked).toBe(3);
      expect(stats.percentage).toBe(40);
    });
  });

  describe('reset()', () => {
    beforeEach(() => {
      achievementSystem.registerAchievement({
        id: 'test1',
        name: 'Test 1',
        description: 'Test',
        type: 'simple'
      });

      achievementSystem.registerAchievement({
        id: 'test2',
        name: 'Test 2',
        description: 'Test',
        type: 'progress',
        target: 10
      });

      achievementSystem.unlock('test1');
      achievementSystem.updateProgress('test2', 5);
    });

    test('should reset unlocked status and progress', () => {
      achievementSystem.reset();

      expect(achievementSystem.isUnlocked('test1')).toBe(false);
      
      const progress = achievementSystem.getProgress('test2');
      expect(progress.current).toBe(0);
    });

    test('should keep achievement definitions by default', () => {
      achievementSystem.reset();

      expect(achievementSystem.achievements.has('test1')).toBe(true);
      expect(achievementSystem.achievements.has('test2')).toBe(true);
    });

    test('should clear definitions when requested', () => {
      achievementSystem.reset(false);

      expect(achievementSystem.achievements.size).toBe(0);
    });
  });

  describe('Achievement with rewards', () => {
    test('should store reward data', () => {
      achievementSystem.registerAchievement({
        id: 'reward_test',
        name: 'Reward Test',
        description: 'Test',
        type: 'simple',
        reward: {
          gold: 100,
          item: 'legendary_sword'
        }
      });

      const achievements = achievementSystem.getAllAchievements();
      expect(achievements[0].reward).toEqual({
        gold: 100,
        item: 'legendary_sword'
      });
    });
  });
});
