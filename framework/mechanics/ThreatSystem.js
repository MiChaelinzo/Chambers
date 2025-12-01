/**
 * ThreatSystem - Detects and alerts player to nearby dangers
 * Tracks threat entities and calculates overall threat levels
 */
export class ThreatSystem {
  /**
   * @param {Object} config - Configuration object
   * @param {number} config.radius - Detection radius (default: 10)
   */
  constructor(config = {}) {
    this.detectionRadius = config.radius || 10;
    this.threatLevels = new Map(); // entity ID -> threat level
  }

  /**
   * Register an entity as a threat with a specific level
   * @param {Object} entity - Entity to mark as threat (must have id property)
   * @param {number} level - Threat level (higher = more dangerous)
   */
  registerThreat(entity, level) {
    if (!entity || !entity.id) {
      throw new Error('Entity must have an id property');
    }
    if (typeof level !== 'number' || level < 0) {
      throw new Error('Threat level must be a non-negative number');
    }

    this.threatLevels.set(entity.id, level);
  }

  /**
   * Get all threats near the player within detection radius
   * @param {Object} player - Player entity with position {x, y}
   * @param {Array} entities - Array of all entities to check
   * @returns {Array} Array of nearby threat entities
   */
  getNearbyThreats(player, entities) {
    if (!player || !player.position) {
      return [];
    }
    if (!entities || !Array.isArray(entities)) {
      return [];
    }

    const nearbyThreats = [];

    for (const entity of entities) {
      // Check if entity is registered as a threat
      if (!this.threatLevels.has(entity.id)) {
        continue;
      }

      // Check if entity is within detection radius
      if (!entity.position) {
        continue;
      }

      const distance = this._calculateDistance(player.position, entity.position);
      if (distance <= this.detectionRadius) {
        nearbyThreats.push(entity);
      }
    }

    return nearbyThreats;
  }

  /**
   * Calculate overall threat level from nearby threats
   * @param {Object} player - Player entity with position {x, y}
   * @param {Array} entities - Array of all entities to check
   * @returns {number} Total threat level (sum of all nearby threat levels)
   */
  getThreatLevel(player, entities) {
    const nearbyThreats = this.getNearbyThreats(player, entities);
    
    let totalThreat = 0;
    for (const threat of nearbyThreats) {
      const level = this.threatLevels.get(threat.id);
      if (level !== undefined) {
        totalThreat += level;
      }
    }

    return totalThreat;
  }

  /**
   * Remove a threat registration
   * @param {string|Object} entityOrId - Entity object or entity ID
   * @returns {boolean} True if threat was removed
   */
  unregisterThreat(entityOrId) {
    const id = typeof entityOrId === 'string' ? entityOrId : entityOrId?.id;
    return this.threatLevels.delete(id);
  }

  /**
   * Check if an entity is registered as a threat
   * @param {string|Object} entityOrId - Entity object or entity ID
   * @returns {boolean} True if entity is a registered threat
   */
  isThreat(entityOrId) {
    const id = typeof entityOrId === 'string' ? entityOrId : entityOrId?.id;
    return this.threatLevels.has(id);
  }

  /**
   * Get the threat level of a specific entity
   * @param {string|Object} entityOrId - Entity object or entity ID
   * @returns {number|null} Threat level or null if not a threat
   */
  getThreatLevelForEntity(entityOrId) {
    const id = typeof entityOrId === 'string' ? entityOrId : entityOrId?.id;
    return this.threatLevels.get(id) ?? null;
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
