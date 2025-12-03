/**
 * Scene represents a distinct game area or level that contains entities.
 * Scenes manage entity collections and provide lifecycle methods for loading/unloading.
 */
export class Scene {
  /**
   * Create a new scene
   * @param {string} id - Unique scene identifier
   * @param {Object} config - Scene configuration
   */
  constructor(id, config = {}) {
    this.id = id;
    this.config = { ...config };
    this.entities = new Map(); // Map of entity ID -> entity
    this.isLoaded = false;
  }

  /**
   * Load the scene - initialize and prepare for gameplay
   * This is called when the scene becomes active
   */
  load() {
    if (this.isLoaded) {
      return;
    }

    // Initialize scene-specific setup
    // Subclasses can override to add custom loading logic
    this.isLoaded = true;
  }

  /**
   * Unload the scene - cleanup and release resources
   * This is called when transitioning away from this scene
   */
  unload() {
    if (!this.isLoaded) {
      return;
    }

    // Clear all entities
    this.entities.clear();
    this.isLoaded = false;
  }

  /**
   * Update all entities in the scene
   * @param {number} deltaTime - Time elapsed since last update (in seconds)
   * @param {Object} context - Game context (input, systems, etc.)
   */
  update(deltaTime, context) {
    if (!this.isLoaded) {
      return;
    }

    // Update all entities
    for (const entity of this.entities.values()) {
      if (!entity.isDeleted()) {
        entity.update(deltaTime, context);
      }
    }

    // Remove deleted entities
    for (const [id, entity] of this.entities.entries()) {
      if (entity.isDeleted()) {
        this.entities.delete(id);
      }
    }
  }

  /**
   * Render all entities in the scene
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} camera - Camera object with position and zoom
   */
  render(ctx, camera) {
    if (!this.isLoaded) {
      return;
    }

    // Render all entities
    for (const entity of this.entities.values()) {
      if (!entity.isDeleted()) {
        entity.render(ctx, camera);
      }
    }
  }

  /**
   * Add an entity to the scene
   * @param {Entity} entity - Entity to add
   */
  addEntity(entity) {
    this.entities.set(entity.getId(), entity);
  }

  /**
   * Remove an entity from the scene by ID
   * @param {number} id - Entity ID to remove
   * @returns {boolean} True if entity was removed, false if not found
   */
  removeEntity(id) {
    return this.entities.delete(id);
  }

  /**
   * Get an entity by ID
   * @param {number} id - Entity ID
   * @returns {Entity|undefined} The entity, or undefined if not found
   */
  getEntityById(id) {
    return this.entities.get(id);
  }

  /**
   * Get all entities in the scene
   * @returns {Array<Entity>} Array of all entities (excluding deleted ones)
   */
  getAllEntities() {
    return Array.from(this.entities.values()).filter(e => !e.isDeleted());
  }

  /**
   * Get entities by type
   * @param {string} type - Entity type to filter by
   * @returns {Array<Entity>} Array of entities matching the type
   */
  getEntitiesByType(type) {
    return this.getAllEntities().filter(entity => entity.getType() === type);
  }

  /**
   * Get the scene ID
   * @returns {string}
   */
  getId() {
    return this.id;
  }

  /**
   * Get the scene configuration
   * @returns {Object}
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Check if the scene is loaded
   * @returns {boolean}
   */
  getIsLoaded() {
    return this.isLoaded;
  }

  /**
   * Get the number of entities in the scene
   * @returns {number}
   */
  getEntityCount() {
    return this.entities.size;
  }
}
