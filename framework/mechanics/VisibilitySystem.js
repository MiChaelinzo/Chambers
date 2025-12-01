/**
 * VisibilitySystem - Limits what the player can see based on distance and obstacles
 * Supports different visibility modes for horror game atmosphere
 */
export class VisibilitySystem {
  /**
   * @param {Object} config - Configuration object
   * @param {number} config.radius - Visibility radius (default: 5)
   * @param {string} config.mode - Visibility mode: 'circular', 'cone', 'none' (default: 'circular')
   */
  constructor(config = {}) {
    this.visibilityRadius = config.radius || 5;
    this.mode = config.mode || 'circular';
  }

  /**
   * Get all entities visible to the player
   * @param {Object} player - Player entity with position {x, y}
   * @param {Array} entities - Array of entities to check
   * @param {Object} scene - Scene object (for future obstacle checking)
   * @returns {Array} Array of visible entities
   */
  getVisibleEntities(player, entities, scene = null) {
    if (!player || !entities) {
      return [];
    }

    if (this.mode === 'none') {
      return entities;
    }

    return entities.filter(entity => this.isVisible(player, entity, scene));
  }

  /**
   * Check if a specific entity is visible to the player
   * @param {Object} player - Player entity with position {x, y}
   * @param {Object} entity - Entity to check with position {x, y}
   * @param {Object} scene - Scene object (for future obstacle checking)
   * @returns {boolean} True if entity is visible
   */
  isVisible(player, entity, scene = null) {
    if (!player || !entity) {
      return false;
    }

    if (this.mode === 'none') {
      return true;
    }

    // Circular visibility based on distance
    if (this.mode === 'circular') {
      const distance = this._calculateDistance(player.position, entity.position);
      return distance <= this.visibilityRadius;
    }

    // Future: cone mode would check angle and distance
    // For now, default to circular
    return false;
  }

  /**
   * Calculate Euclidean distance between two positions
   * @param {Object} pos1 - Position {x, y}
   * @param {Object} pos2 - Position {x, y}
   * @returns {number} Distance between positions
   * @private
   */
  _calculateDistance(pos1, pos2) {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
