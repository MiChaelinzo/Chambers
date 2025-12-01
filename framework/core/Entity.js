/**
 * Entity represents any game object that exists in the game world.
 * All entities have position, state, and configuration.
 */
export class Entity {
  // Static counter for generating unique IDs
  static _nextId = 1;

  /**
   * Generate a unique entity ID
   * @returns {number} Unique entity ID
   */
  static generateId() {
    return Entity._nextId++;
  }

  /**
   * Reset the ID counter (useful for testing)
   */
  static resetIdCounter() {
    Entity._nextId = 1;
  }

  /**
   * Create a new entity
   * @param {number|null} id - Entity ID (auto-generated if null)
   * @param {string} type - Entity type (e.g., 'player', 'enemy', 'item')
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} config - Configuration object with entity-specific properties
   */
  constructor(id, type, x, y, config = {}) {
    this.id = id !== null && id !== undefined ? id : Entity.generateId();
    this.type = type;
    this.position = { x, y };
    this.state = {};
    this.config = { ...config };
    this._isDeleted = false;
  }

  /**
   * Update entity state
   * Override in subclasses to implement entity-specific behavior
   * @param {number} deltaTime - Time elapsed since last update (in seconds)
   * @param {Object} context - Game context (scene, input, etc.)
   */
  update(deltaTime, context) {
    // Base implementation does nothing
    // Subclasses should override this method
  }

  /**
   * Render entity
   * Override in subclasses to implement entity-specific rendering
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} camera - Camera object with position and zoom
   */
  render(ctx, camera) {
    // Base implementation does nothing
    // Subclasses should override this method
  }

  /**
   * Handle interaction with this entity
   * Override in subclasses to implement entity-specific interaction behavior
   * @param {Entity} player - The player entity interacting with this entity
   * @param {Object} context - Game context
   * @returns {Object} Result of interaction (success, message, etc.)
   */
  onInteract(player, context) {
    // Base implementation returns no interaction
    return {
      success: false,
      message: `Cannot interact with ${this.type}`
    };
  }

  /**
   * Mark this entity for deletion
   */
  delete() {
    this._isDeleted = true;
  }

  /**
   * Check if this entity is marked for deletion
   * @returns {boolean}
   */
  isDeleted() {
    return this._isDeleted;
  }

  /**
   * Get entity position
   * @returns {Object} Position object with x and y
   */
  getPosition() {
    return { ...this.position };
  }

  /**
   * Set entity position
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  setPosition(x, y) {
    this.position.x = x;
    this.position.y = y;
  }

  /**
   * Get entity type
   * @returns {string}
   */
  getType() {
    return this.type;
  }

  /**
   * Get entity ID
   * @returns {number}
   */
  getId() {
    return this.id;
  }

  /**
   * Get entity state
   * @returns {Object}
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Set entity state property
   * @param {string} key - State property key
   * @param {*} value - State property value
   */
  setState(key, value) {
    this.state[key] = value;
  }

  /**
   * Get entity config
   * @returns {Object}
   */
  getConfig() {
    return { ...this.config };
  }
}
