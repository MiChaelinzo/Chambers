/**
 * ResourceManager - Tracks consumable resources with scarcity mechanics
 * Manages resources like health, stamina, ammo with bounds checking and auto-depletion
 */
export class ResourceManager {
  /**
   * @param {Object} config - Configuration object (optional)
   */
  constructor(config = {}) {
    this.resources = new Map(); // name -> { current, max, depleteRate }
  }

  /**
   * Add a new resource to track
   * @param {string} name - Resource name
   * @param {number} current - Current amount
   * @param {number} max - Maximum amount
   * @param {number} depleteRate - Amount to deplete per second (default: 0)
   */
  addResource(name, current, max, depleteRate = 0) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new Error('Resource name must be a non-empty string');
    }
    if (typeof current !== 'number' || typeof max !== 'number') {
      throw new Error('Current and max must be numbers');
    }
    if (max <= 0) {
      throw new Error('Max must be greater than 0');
    }
    if (current < 0 || current > max) {
      throw new Error('Current must be between 0 and max');
    }
    if (typeof depleteRate !== 'number' || depleteRate < 0) {
      throw new Error('Deplete rate must be a non-negative number');
    }

    this.resources.set(name, {
      current: current,
      max: max,
      depleteRate: depleteRate
    });
  }

  /**
   * Consume (reduce) a resource
   * @param {string} name - Resource name
   * @param {number} amount - Amount to consume
   * @returns {boolean} True if consumption succeeded, false if insufficient resources
   */
  consume(name, amount) {
    if (!this.resources.has(name)) {
      return false;
    }
    if (typeof amount !== 'number' || amount < 0) {
      return false;
    }

    const resource = this.resources.get(name);
    const newValue = resource.current - amount;

    // Clamp to minimum of 0
    resource.current = Math.max(0, newValue);

    return true;
  }

  /**
   * Restore (increase) a resource
   * @param {string} name - Resource name
   * @param {number} amount - Amount to restore
   * @returns {boolean} True if restoration succeeded
   */
  restore(name, amount) {
    if (!this.resources.has(name)) {
      return false;
    }
    if (typeof amount !== 'number' || amount < 0) {
      return false;
    }

    const resource = this.resources.get(name);
    const newValue = resource.current + amount;

    // Clamp to maximum
    resource.current = Math.min(resource.max, newValue);

    return true;
  }

  /**
   * Update resources with auto-depletion
   * @param {number} deltaTime - Time elapsed in seconds
   */
  update(deltaTime) {
    if (typeof deltaTime !== 'number' || deltaTime < 0 || !isFinite(deltaTime)) {
      return;
    }

    for (const [name, resource] of this.resources) {
      if (resource.depleteRate > 0) {
        const depleteAmount = resource.depleteRate * deltaTime;
        resource.current = Math.max(0, resource.current - depleteAmount);
      }
    }
  }

  /**
   * Get current state of a resource
   * @param {string} name - Resource name
   * @returns {Object|null} Resource state {current, max, depleteRate} or null if not found
   */
  getResource(name) {
    if (!this.resources.has(name)) {
      return null;
    }

    const resource = this.resources.get(name);
    // Return a copy to prevent external modification
    return {
      current: resource.current,
      max: resource.max,
      depleteRate: resource.depleteRate
    };
  }

  /**
   * Get all resources
   * @returns {Object} Object with resource names as keys and their states as values
   */
  getAllResources() {
    const result = {};
    for (const [name, resource] of this.resources) {
      result[name] = {
        current: resource.current,
        max: resource.max,
        depleteRate: resource.depleteRate
      };
    }
    return result;
  }

  /**
   * Remove a resource
   * @param {string} name - Resource name
   * @returns {boolean} True if resource was removed
   */
  removeResource(name) {
    return this.resources.delete(name);
  }

  /**
   * Check if a resource exists
   * @param {string} name - Resource name
   * @returns {boolean} True if resource exists
   */
  hasResource(name) {
    return this.resources.has(name);
  }
}
