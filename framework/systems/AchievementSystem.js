/**
 * AchievementSystem - Framework system for tracking player accomplishments
 * Supports multiple achievement types, progress tracking, and persistence
 */
export class AchievementSystem {
  /**
   * @param {Object} config - Achievement system configuration
   * @param {string} config.gameId - Unique identifier for this game (required for persistence)
   * @param {boolean} config.enableNotifications - Show achievement unlock notifications (default: true)
   * @param {number} config.notificationDuration - Notification display duration in ms (default: 3000)
   */
  constructor(config = {}) {
    this.gameId = config.gameId;
    this.enableNotifications = config.enableNotifications !== false;
    this.notificationDuration = config.notificationDuration || 3000;

    // Achievement storage
    this.achievements = new Map(); // id -> achievement definition
    this.unlockedAchievements = new Set(); // Set of unlocked achievement IDs
    this.progressData = new Map(); // id -> current progress value

    // Event callbacks
    this.onUnlockCallbacks = [];
    this.onProgressCallbacks = [];

    // Notification queue
    this.notificationQueue = [];
    this.activeNotification = null;

    // Check localStorage availability
    this.storageAvailable = this._checkStorageAvailable();

    // Load saved achievements
    if (this.storageAvailable && this.gameId) {
      this._loadFromStorage();
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
   * Get storage key
   * @private
   * @returns {string} Storage key
   */
  _getStorageKey() {
    return `${this.gameId}_achievements`;
  }

  /**
   * Load achievements from localStorage
   * @private
   */
  _loadFromStorage() {
    try {
      const key = this._getStorageKey();
      const data = localStorage.getItem(key);
      if (data) {
        const saved = JSON.parse(data);
        this.unlockedAchievements = new Set(saved.unlocked || []);
        this.progressData = new Map(Object.entries(saved.progress || {}));
      }
    } catch (error) {
      console.error('Failed to load achievements from storage:', error);
    }
  }

  /**
   * Save achievements to localStorage
   * @private
   */
  _saveToStorage() {
    if (!this.storageAvailable || !this.gameId) {
      return;
    }

    try {
      const key = this._getStorageKey();
      const data = {
        unlocked: Array.from(this.unlockedAchievements),
        progress: Object.fromEntries(this.progressData)
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save achievements to storage:', error);
    }
  }

  /**
   * Register an achievement
   * @param {Object} achievement - Achievement definition
   * @param {string} achievement.id - Unique achievement identifier
   * @param {string} achievement.name - Display name
   * @param {string} achievement.description - Achievement description
   * @param {string} achievement.type - Achievement type: 'simple', 'progress', 'secret', 'challenge'
   * @param {number} achievement.target - Target value for progress achievements
   * @param {boolean} achievement.hidden - Hide achievement until unlocked (default: false)
   * @param {Object} achievement.reward - Optional reward data
   */
  registerAchievement(achievement) {
    if (!achievement.id) {
      throw new Error('Achievement must have an id');
    }

    if (!achievement.name) {
      throw new Error('Achievement must have a name');
    }

    if (!achievement.type) {
      achievement.type = 'simple';
    }

    // Validate achievement type
    const validTypes = ['simple', 'progress', 'secret', 'challenge'];
    if (!validTypes.includes(achievement.type)) {
      throw new Error(`Invalid achievement type: ${achievement.type}`);
    }

    // Validate progress achievement has target
    if (achievement.type === 'progress' && !achievement.target) {
      throw new Error('Progress achievements must have a target value');
    }

    this.achievements.set(achievement.id, {
      ...achievement,
      hidden: achievement.hidden || false,
      reward: achievement.reward || null
    });

    // Initialize progress for progress achievements
    if (achievement.type === 'progress' && !this.progressData.has(achievement.id)) {
      this.progressData.set(achievement.id, 0);
    }
  }

  /**
   * Unlock an achievement
   * @param {string} id - Achievement ID
   * @returns {boolean} True if achievement was newly unlocked
   */
  unlock(id) {
    if (!this.achievements.has(id)) {
      console.warn(`Achievement ${id} not registered`);
      return false;
    }

    if (this.unlockedAchievements.has(id)) {
      return false; // Already unlocked
    }

    const achievement = this.achievements.get(id);
    this.unlockedAchievements.add(id);
    this._saveToStorage();

    // Trigger callbacks
    this.onUnlockCallbacks.forEach(callback => {
      try {
        callback(achievement);
      } catch (error) {
        console.error('Error in unlock callback:', error);
      }
    });

    // Show notification
    if (this.enableNotifications) {
      this._queueNotification(achievement);
    }

    return true;
  }

  /**
   * Update progress for a progress-type achievement
   * @param {string} id - Achievement ID
   * @param {number} value - New progress value
   * @param {boolean} increment - If true, add to current progress instead of setting (default: false)
   */
  updateProgress(id, value, increment = false) {
    if (!this.achievements.has(id)) {
      console.warn(`Achievement ${id} not registered`);
      return;
    }

    const achievement = this.achievements.get(id);
    if (achievement.type !== 'progress') {
      console.warn(`Achievement ${id} is not a progress achievement`);
      return;
    }

    if (this.unlockedAchievements.has(id)) {
      return; // Already unlocked
    }

    const currentProgress = this.progressData.get(id) || 0;
    const newProgress = increment ? currentProgress + value : value;
    const clampedProgress = Math.max(0, Math.min(newProgress, achievement.target));

    this.progressData.set(id, clampedProgress);
    this._saveToStorage();

    // Trigger progress callbacks
    this.onProgressCallbacks.forEach(callback => {
      try {
        callback(achievement, clampedProgress, achievement.target);
      } catch (error) {
        console.error('Error in progress callback:', error);
      }
    });

    // Check if target reached
    if (clampedProgress >= achievement.target) {
      this.unlock(id);
    }
  }

  /**
   * Increment progress for a progress-type achievement
   * @param {string} id - Achievement ID
   * @param {number} amount - Amount to increment (default: 1)
   */
  incrementProgress(id, amount = 1) {
    this.updateProgress(id, amount, true);
  }

  /**
   * Check if an achievement is unlocked
   * @param {string} id - Achievement ID
   * @returns {boolean} True if unlocked
   */
  isUnlocked(id) {
    return this.unlockedAchievements.has(id);
  }

  /**
   * Get achievement progress
   * @param {string} id - Achievement ID
   * @returns {Object|null} Object with current and target, or null
   */
  getProgress(id) {
    if (!this.achievements.has(id)) {
      return null;
    }

    const achievement = this.achievements.get(id);
    if (achievement.type !== 'progress') {
      return null;
    }

    return {
      current: this.progressData.get(id) || 0,
      target: achievement.target,
      percentage: ((this.progressData.get(id) || 0) / achievement.target) * 100
    };
  }

  /**
   * Get all registered achievements
   * @param {boolean} includeHidden - Include hidden/secret achievements (default: false)
   * @returns {Array} Array of achievement objects with unlock status
   */
  getAllAchievements(includeHidden = false) {
    const achievements = [];
    
    for (const [id, achievement] of this.achievements) {
      const isUnlocked = this.unlockedAchievements.has(id);
      
      // Skip hidden achievements unless unlocked or includeHidden is true
      if (achievement.hidden && !isUnlocked && !includeHidden) {
        continue;
      }

      const achievementData = {
        id,
        name: achievement.name,
        description: achievement.description,
        type: achievement.type,
        unlocked: isUnlocked,
        reward: achievement.reward
      };

      // Add progress for progress achievements
      if (achievement.type === 'progress') {
        achievementData.progress = this.getProgress(id);
      }

      achievements.push(achievementData);
    }

    return achievements;
  }

  /**
   * Get unlocked achievements
   * @returns {Array} Array of unlocked achievement objects
   */
  getUnlockedAchievements() {
    return this.getAllAchievements(true).filter(a => a.unlocked);
  }

  /**
   * Get locked achievements
   * @param {boolean} includeHidden - Include hidden/secret achievements (default: false)
   * @returns {Array} Array of locked achievement objects
   */
  getLockedAchievements(includeHidden = false) {
    return this.getAllAchievements(includeHidden).filter(a => !a.unlocked);
  }

  /**
   * Get achievement statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    const total = this.achievements.size;
    const unlocked = this.unlockedAchievements.size;
    const locked = total - unlocked;
    const percentage = total > 0 ? (unlocked / total) * 100 : 0;

    return {
      total,
      unlocked,
      locked,
      percentage: Math.round(percentage * 100) / 100
    };
  }

  /**
   * Reset all achievements
   * @param {boolean} keepDefinitions - Keep achievement definitions (default: true)
   */
  reset(keepDefinitions = true) {
    this.unlockedAchievements.clear();
    this.progressData.clear();
    
    if (!keepDefinitions) {
      this.achievements.clear();
    } else {
      // Reset progress for progress achievements
      for (const [id, achievement] of this.achievements) {
        if (achievement.type === 'progress') {
          this.progressData.set(id, 0);
        }
      }
    }

    this._saveToStorage();
  }

  /**
   * Register callback for achievement unlock events
   * @param {Function} callback - Callback function(achievement)
   */
  onUnlock(callback) {
    this.onUnlockCallbacks.push(callback);
  }

  /**
   * Register callback for achievement progress events
   * @param {Function} callback - Callback function(achievement, current, target)
   */
  onProgress(callback) {
    this.onProgressCallbacks.push(callback);
  }

  /**
   * Queue achievement notification
   * @private
   * @param {Object} achievement - Achievement object
   */
  _queueNotification(achievement) {
    this.notificationQueue.push(achievement);
    
    if (!this.activeNotification) {
      this._showNextNotification();
    }
  }

  /**
   * Show next notification in queue
   * @private
   */
  _showNextNotification() {
    if (this.notificationQueue.length === 0) {
      this.activeNotification = null;
      return;
    }

    const achievement = this.notificationQueue.shift();
    this.activeNotification = achievement;

    // Create notification element
    this._displayNotification(achievement);

    // Auto-hide after duration
    setTimeout(() => {
      this._hideNotification();
      this._showNextNotification();
    }, this.notificationDuration);
  }

  /**
   * Display notification (can be overridden for custom UI)
   * @private
   * @param {Object} achievement - Achievement object
   */
  _displayNotification(achievement) {
    // Default implementation - log to console
    console.log(`🏆 Achievement Unlocked: ${achievement.name}`);
    console.log(`   ${achievement.description}`);
    
    // Custom notification UI can be implemented by games
    // This is just a fallback
  }

  /**
   * Hide notification (can be overridden for custom UI)
   * @private
   */
  _hideNotification() {
    // Default implementation - no-op
    // Custom notification UI can be implemented by games
  }

  /**
   * Update system (call each frame if using notification UI)
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    // Can be used for animating notifications
    // Currently not needed for basic implementation
  }
}
