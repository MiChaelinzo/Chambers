/**
 * SanitySystem - Tracks player mental state affecting gameplay
 * Manages sanity with threshold-based effects that activate/deactivate
 */
export class SanitySystem {
  /**
   * @param {number} maxSanity - Maximum sanity value (default: 100)
   */
  constructor(maxSanity = 100) {
    if (typeof maxSanity !== 'number' || maxSanity <= 0) {
      throw new Error('Max sanity must be a positive number');
    }

    this.current = maxSanity;
    this.max = maxSanity;
    this.effects = []; // Array of {threshold, effect, active}
  }

  /**
   * Decrease sanity by a specified amount
   * @param {number} amount - Amount to decrease
   * @param {string} reason - Optional reason for the decrease
   * @returns {boolean} True if decrease succeeded
   */
  decrease(amount, reason = '') {
    if (typeof amount !== 'number' || amount < 0) {
      return false;
    }

    const oldSanity = this.current;
    this.current = Math.max(0, this.current - amount);

    // Check for threshold crossings (going down)
    this._updateEffects(oldSanity, this.current);

    return true;
  }

  /**
   * Increase sanity by a specified amount
   * @param {number} amount - Amount to increase
   * @returns {boolean} True if increase succeeded
   */
  increase(amount) {
    if (typeof amount !== 'number' || amount < 0) {
      return false;
    }

    const oldSanity = this.current;
    this.current = Math.min(this.max, this.current + amount);

    // Check for threshold crossings (going up)
    this._updateEffects(oldSanity, this.current);

    return true;
  }

  /**
   * Add a threshold-based effect
   * @param {number} threshold - Sanity level at which effect activates (effect active when sanity < threshold)
   * @param {Object} effect - Effect object with any properties
   * @returns {boolean} True if effect was added
   */
  addEffect(threshold, effect) {
    if (typeof threshold !== 'number' || threshold < 0 || threshold > this.max) {
      return false;
    }
    if (!effect || typeof effect !== 'object') {
      return false;
    }

    // Check if effect is already active based on current sanity
    const active = this.current < threshold;

    this.effects.push({
      threshold: threshold,
      effect: effect,
      active: active
    });

    return true;
  }

  /**
   * Get all currently active effects
   * @returns {Array} Array of active effect objects
   */
  getActiveEffects() {
    return this.effects
      .filter(e => e.active)
      .map(e => e.effect);
  }

  /**
   * Update effect activation based on sanity changes
   * @param {number} oldSanity - Previous sanity value
   * @param {number} newSanity - New sanity value
   * @private
   */
  _updateEffects(oldSanity, newSanity) {
    for (const effectEntry of this.effects) {
      const threshold = effectEntry.threshold;
      const wasActive = effectEntry.active;
      const shouldBeActive = newSanity < threshold;

      // Update active state if it changed
      if (wasActive !== shouldBeActive) {
        effectEntry.active = shouldBeActive;
      }
    }
  }

  /**
   * Update sanity system (for future time-based effects)
   * @param {number} deltaTime - Time elapsed in seconds
   */
  update(deltaTime) {
    if (typeof deltaTime !== 'number' || deltaTime < 0 || !isFinite(deltaTime)) {
      return;
    }

    // Apply active effects (placeholder for future implementation)
    // This could be used for effects that modify sanity over time
  }

  /**
   * Get current sanity value
   * @returns {number} Current sanity
   */
  getCurrent() {
    return this.current;
  }

  /**
   * Get maximum sanity value
   * @returns {number} Maximum sanity
   */
  getMax() {
    return this.max;
  }

  /**
   * Get all effects (active and inactive)
   * @returns {Array} Array of effect entries with threshold, effect, and active status
   */
  getAllEffects() {
    return this.effects.map(e => ({
      threshold: e.threshold,
      effect: e.effect,
      active: e.active
    }));
  }

  /**
   * Remove all effects
   */
  clearEffects() {
    this.effects = [];
  }

  /**
   * Set sanity to a specific value (for testing/debugging)
   * @param {number} value - New sanity value
   * @returns {boolean} True if value was set
   */
  setSanity(value) {
    if (typeof value !== 'number' || value < 0 || value > this.max) {
      return false;
    }

    const oldSanity = this.current;
    this.current = value;
    this._updateEffects(oldSanity, this.current);

    return true;
  }
}
