/**
 * Puzzle class for managing puzzle state, solution validation, and completion callbacks
 */
export class Puzzle {
  /**
   * Create a new puzzle
   * @param {string} id - Unique puzzle identifier
   * @param {Object} config - Puzzle configuration
   * @param {Array<Object>} config.conditions - Solution conditions to check
   * @param {Function} config.onComplete - Callback when puzzle is solved
   * @param {Object} config.initialState - Initial puzzle state
   */
  constructor(id, config = {}) {
    this.id = id;
    this.conditions = config.conditions || [];
    this.onComplete = config.onComplete || (() => {});
    this.state = { ...config.initialState } || {};
    this.solved = false;
    this.completedAt = null;
    
    // Check if puzzle is already solved with initial state
    this.checkSolution();
  }

  /**
   * Update puzzle state
   * @param {Object} updates - State updates to apply
   */
  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.checkSolution();
  }

  /**
   * Get current puzzle state
   * @returns {Object} Current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Check if all solution conditions are met
   * @returns {boolean} True if puzzle is solved
   */
  checkSolution() {
    if (this.solved) {
      return true;
    }

    // All conditions must be met for puzzle to be solved
    const allConditionsMet = this.conditions.every(condition => {
      return this.evaluateCondition(condition);
    });

    if (allConditionsMet && this.conditions.length > 0) {
      this.markSolved();
      return true;
    }

    return false;
  }

  /**
   * Evaluate a single condition against current state
   * @param {Object} condition - Condition to evaluate
   * @returns {boolean} True if condition is met
   */
  evaluateCondition(condition) {
    const { type, key, value, operator = 'equals' } = condition;

    if (!key || !(key in this.state)) {
      return false;
    }

    const stateValue = this.state[key];

    switch (operator) {
      case 'equals':
        return stateValue === value;
      case 'notEquals':
        return stateValue !== value;
      case 'greaterThan':
        return stateValue > value;
      case 'lessThan':
        return stateValue < value;
      case 'greaterThanOrEqual':
        return stateValue >= value;
      case 'lessThanOrEqual':
        return stateValue <= value;
      case 'contains':
        return Array.isArray(stateValue) && stateValue.includes(value);
      case 'hasAll':
        return Array.isArray(stateValue) && Array.isArray(value) && 
               value.every(v => stateValue.includes(v));
      default:
        return stateValue === value;
    }
  }

  /**
   * Mark puzzle as solved and trigger completion callback
   */
  markSolved() {
    if (!this.solved) {
      this.solved = true;
      this.completedAt = Date.now();
      this.onComplete(this);
    }
  }

  /**
   * Check if puzzle is solved
   * @returns {boolean} True if solved
   */
  isSolved() {
    return this.solved;
  }

  /**
   * Reset puzzle to initial state
   * @param {Object} initialState - State to reset to
   */
  reset(initialState = {}) {
    this.state = { ...initialState };
    this.solved = false;
    this.completedAt = null;
  }

  /**
   * Serialize puzzle state for save/load
   * @returns {Object} Serialized puzzle data
   */
  serialize() {
    return {
      id: this.id,
      state: { ...this.state },
      solved: this.solved,
      completedAt: this.completedAt
    };
  }

  /**
   * Deserialize puzzle state from saved data
   * @param {Object} data - Serialized puzzle data
   */
  deserialize(data) {
    if (data.id !== this.id) {
      throw new Error(`Cannot deserialize puzzle data: ID mismatch (expected ${this.id}, got ${data.id})`);
    }
    this.state = { ...data.state };
    this.solved = data.solved || false;
    this.completedAt = data.completedAt || null;
  }

  /**
   * Get puzzle progress information
   * @returns {Object} Progress data
   */
  getProgress() {
    const metConditions = this.conditions.filter(c => this.evaluateCondition(c)).length;
    return {
      total: this.conditions.length,
      met: metConditions,
      percentage: this.conditions.length > 0 ? (metConditions / this.conditions.length) * 100 : 0,
      solved: this.solved
    };
  }
}
