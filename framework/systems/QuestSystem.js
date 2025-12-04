/**
 * QuestSystem - Mission and objective tracking
 * Supports quest chains, objectives, rewards, and progression
 */
export class QuestSystem {
  constructor() {
    this.quests = new Map();
    this.activeQuests = new Map();
    this.completedQuests = new Set();
    this.callbacks = {
      onQuestStarted: null,
      onQuestCompleted: null,
      onQuestFailed: null,
      onObjectiveCompleted: null,
      onObjectiveUpdated: null
    };
  }

  /**
   * Register a quest definition
   * @param {string} id - Quest identifier
   * @param {Object} quest - Quest definition
   */
  registerQuest(id, quest) {
    this.quests.set(id, {
      id,
      title: quest.title || id,
      description: quest.description || '',
      objectives: quest.objectives || [],
      rewards: quest.rewards || {},
      prerequisites: quest.prerequisites || [],
      followUp: quest.followUp || null,
      repeatable: quest.repeatable || false,
      timeLimit: quest.timeLimit || null,
      category: quest.category || 'main',
      level: quest.level || 1,
      hidden: quest.hidden || false
    });
  }

  /**
   * Start a quest
   * @param {string} questId - Quest to start
   * @returns {boolean} Success
   */
  startQuest(questId) {
    const questDef = this.quests.get(questId);
    if (!questDef) {
      console.warn(`Quest ${questId} not found`);
      return false;
    }

    // Check if already active or completed
    if (this.activeQuests.has(questId)) {
      return false;
    }

    if (this.completedQuests.has(questId) && !questDef.repeatable) {
      return false;
    }

    // Check prerequisites
    for (const prereq of questDef.prerequisites) {
      if (!this.completedQuests.has(prereq)) {
        console.warn(`Quest ${questId} requires ${prereq} to be completed first`);
        return false;
      }
    }

    // Initialize quest state
    const questState = {
      id: questId,
      ...questDef,
      startTime: Date.now(),
      objectives: questDef.objectives.map(obj => ({
        ...obj,
        current: 0,
        completed: false
      })),
      status: 'active'
    };

    this.activeQuests.set(questId, questState);

    if (this.callbacks.onQuestStarted) {
      this.callbacks.onQuestStarted(questState);
    }

    return true;
  }

  /**
   * Update quest objective progress
   * @param {string} questId - Quest identifier
   * @param {string} objectiveId - Objective identifier
   * @param {number} amount - Amount to add (default: 1)
   */
  updateObjective(questId, objectiveId, amount = 1) {
    const quest = this.activeQuests.get(questId);
    if (!quest) return false;

    const objective = quest.objectives.find(obj => obj.id === objectiveId);
    if (!objective || objective.completed) return false;

    objective.current = Math.min(objective.current + amount, objective.target);

    if (this.callbacks.onObjectiveUpdated) {
      this.callbacks.onObjectiveUpdated(quest, objective);
    }

    // Check if objective is completed
    if (objective.current >= objective.target) {
      objective.completed = true;

      if (this.callbacks.onObjectiveCompleted) {
        this.callbacks.onObjectiveCompleted(quest, objective);
      }

      // Check if all objectives are completed
      if (quest.objectives.every(obj => obj.completed)) {
        this.completeQuest(questId);
      }
    }

    return true;
  }

  /**
   * Set objective progress directly
   * @param {string} questId - Quest identifier
   * @param {string} objectiveId - Objective identifier
   * @param {number} value - New value
   */
  setObjectiveProgress(questId, objectiveId, value) {
    const quest = this.activeQuests.get(questId);
    if (!quest) return false;

    const objective = quest.objectives.find(obj => obj.id === objectiveId);
    if (!objective) return false;

    const oldValue = objective.current;
    objective.current = Math.min(value, objective.target);

    if (objective.current !== oldValue) {
      if (this.callbacks.onObjectiveUpdated) {
        this.callbacks.onObjectiveUpdated(quest, objective);
      }

      if (objective.current >= objective.target && !objective.completed) {
        objective.completed = true;

        if (this.callbacks.onObjectiveCompleted) {
          this.callbacks.onObjectiveCompleted(quest, objective);
        }

        if (quest.objectives.every(obj => obj.completed)) {
          this.completeQuest(questId);
        }
      }
    }

    return true;
  }

  /**
   * Complete a quest
   * @param {string} questId - Quest identifier
   */
  completeQuest(questId) {
    const quest = this.activeQuests.get(questId);
    if (!quest) return false;

    quest.status = 'completed';
    quest.completionTime = Date.now();

    this.activeQuests.delete(questId);
    this.completedQuests.add(questId);

    if (this.callbacks.onQuestCompleted) {
      this.callbacks.onQuestCompleted(quest);
    }

    // Start follow-up quest if exists
    if (quest.followUp) {
      this.startQuest(quest.followUp);
    }

    return true;
  }

  /**
   * Fail a quest
   * @param {string} questId - Quest identifier
   */
  failQuest(questId) {
    const quest = this.activeQuests.get(questId);
    if (!quest) return false;

    quest.status = 'failed';
    quest.failTime = Date.now();

    this.activeQuests.delete(questId);

    if (this.callbacks.onQuestFailed) {
      this.callbacks.onQuestFailed(quest);
    }

    return true;
  }

  /**
   * Abandon a quest
   * @param {string} questId - Quest identifier
   */
  abandonQuest(questId) {
    const quest = this.activeQuests.get(questId);
    if (!quest) return false;

    this.activeQuests.delete(questId);
    return true;
  }

  /**
   * Get quest by ID
   * @param {string} questId - Quest identifier
   * @returns {Object|null} Quest state
   */
  getQuest(questId) {
    return this.activeQuests.get(questId) || null;
  }

  /**
   * Get all active quests
   * @returns {Array} Array of active quests
   */
  getActiveQuests() {
    return Array.from(this.activeQuests.values());
  }

  /**
   * Get completed quests
   * @returns {Array} Array of completed quest IDs
   */
  getCompletedQuests() {
    return Array.from(this.completedQuests);
  }

  /**
   * Get available quests (not started, prerequisites met)
   * @returns {Array} Array of available quests
   */
  getAvailableQuests() {
    const available = [];

    for (const [id, quest] of this.quests) {
      // Skip if already active or completed (and not repeatable)
      if (this.activeQuests.has(id)) continue;
      if (this.completedQuests.has(id) && !quest.repeatable) continue;
      if (quest.hidden) continue;

      // Check prerequisites
      const prereqsMet = quest.prerequisites.every(prereq => 
        this.completedQuests.has(prereq)
      );

      if (prereqsMet) {
        available.push(quest);
      }
    }

    return available;
  }

  /**
   * Check if quest is completed
   * @param {string} questId - Quest identifier
   * @returns {boolean} True if completed
   */
  isQuestCompleted(questId) {
    return this.completedQuests.has(questId);
  }

  /**
   * Check if quest is active
   * @param {string} questId - Quest identifier
   * @returns {boolean} True if active
   */
  isQuestActive(questId) {
    return this.activeQuests.has(questId);
  }

  /**
   * Get quest progress percentage
   * @param {string} questId - Quest identifier
   * @returns {number} Progress (0-100)
   */
  getQuestProgress(questId) {
    const quest = this.activeQuests.get(questId);
    if (!quest) return 0;

    if (quest.objectives.length === 0) return 0;

    const totalProgress = quest.objectives.reduce((sum, obj) => {
      return sum + (obj.current / obj.target);
    }, 0);

    return (totalProgress / quest.objectives.length) * 100;
  }

  /**
   * Update all quests (check time limits, etc.)
   * @param {number} deltaTime - Time elapsed in seconds
   */
  update(deltaTime) {
    const now = Date.now();

    for (const [id, quest] of this.activeQuests) {
      // Check time limit
      if (quest.timeLimit) {
        const elapsed = (now - quest.startTime) / 1000;
        if (elapsed >= quest.timeLimit) {
          this.failQuest(id);
        }
      }
    }
  }

  /**
   * Register callback
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    const callbackKey = `on${event.charAt(0).toUpperCase()}${event.slice(1)}`;
    if (this.callbacks.hasOwnProperty(callbackKey)) {
      this.callbacks[callbackKey] = callback;
    }
  }

  /**
   * Save quest system state
   * @returns {Object} Serializable state
   */
  saveState() {
    return {
      activeQuests: Array.from(this.activeQuests.entries()),
      completedQuests: Array.from(this.completedQuests)
    };
  }

  /**
   * Load quest system state
   * @param {Object} state - Saved state
   */
  loadState(state) {
    this.activeQuests.clear();
    this.completedQuests.clear();

    if (state.activeQuests) {
      for (const [id, quest] of state.activeQuests) {
        this.activeQuests.set(id, quest);
      }
    }

    if (state.completedQuests) {
      for (const id of state.completedQuests) {
        this.completedQuests.add(id);
      }
    }
  }

  /**
   * Clear all quest data
   */
  clear() {
    this.activeQuests.clear();
    this.completedQuests.clear();
  }

  /**
   * Get statistics
   * @returns {Object} Quest statistics
   */
  getStats() {
    return {
      totalQuests: this.quests.size,
      activeQuests: this.activeQuests.size,
      completedQuests: this.completedQuests.size,
      availableQuests: this.getAvailableQuests().length
    };
  }
}
