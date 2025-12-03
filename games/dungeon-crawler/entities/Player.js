import { Entity } from '../../../framework/core/Entity.js';

/**
 * Player entity for dungeon crawler game
 * Handles player movement, health, inventory, and combat
 */
export class Player extends Entity {
  /**
   * Create a new Player entity
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} config - Player configuration
   */
  constructor(x, y, config = {}) {
    super(null, 'player', x, y, config);
    
    // Player-specific state
    this.state.health = config.health || 100;
    this.state.maxHealth = config.health || 100;
    this.state.speed = config.speed || 100; // pixels per second
    this.state.inventory = [];
    this.state.damage = config.damage || 10;
  }

  /**
   * Update player state based on input
   * @param {number} deltaTime - Time elapsed since last update (in seconds)
   * @param {Object} context - Game context with input, scene, etc.
   */
  update(deltaTime, context) {
    if (!context.input) return;

    // Get movement vector from input
    const movement = context.input.getMovementVector();
    
    if (movement.x !== 0 || movement.y !== 0) {
      // Calculate new position
      const newX = this.position.x + movement.x * this.state.speed * deltaTime;
      const newY = this.position.y + movement.y * this.state.speed * deltaTime;
      
      // Check for collisions before moving
      if (context.scene) {
        const collision = this.checkCollision(newX, newY, context.scene);
        if (!collision) {
          this.position.x = newX;
          this.position.y = newY;
        }
      } else {
        // No scene context, just move
        this.position.x = newX;
        this.position.y = newY;
      }
    }
  }

  /**
   * Check if moving to a position would cause a collision
   * @param {number} x - Target X position
   * @param {number} y - Target Y position
   * @param {Object} scene - Scene containing entities
   * @returns {Entity|null} Colliding entity or null
   */
  checkCollision(x, y, scene) {
    const entities = scene.getAllEntities ? scene.getAllEntities() : (scene.entities || []);
    
    for (const entity of entities) {
      if (entity === this || entity.isDeleted()) continue;
      
      // Check if entity has collision enabled
      const collides = entity.config.collides !== false;
      if (!collides) continue;
      
      // Simple circle collision detection
      const dx = x - entity.position.x;
      const dy = y - entity.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const radius1 = this.config.width ? this.config.width / 2 : 16;
      const radius2 = entity.config.width ? entity.config.width / 2 : 16;
      
      if (distance < radius1 + radius2) {
        return entity;
      }
    }
    
    return null;
  }

  /**
   * Add item to player inventory
   * @param {Object} item - Item to add
   */
  addToInventory(item) {
    this.state.inventory.push(item);
  }

  /**
   * Take damage
   * @param {number} amount - Damage amount
   */
  takeDamage(amount) {
    this.state.health = Math.max(0, this.state.health - amount);
  }

  /**
   * Heal player
   * @param {number} amount - Heal amount
   */
  heal(amount) {
    this.state.health = Math.min(this.state.maxHealth, this.state.health + amount);
  }

  /**
   * Check if player is dead
   * @returns {boolean}
   */
  isDead() {
    return this.state.health <= 0;
  }

  /**
   * Get player inventory
   * @returns {Array}
   */
  getInventory() {
    return [...this.state.inventory];
  }

  /**
   * Render player
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} camera - Camera object
   */
  render(ctx, camera) {
    const screenX = (this.position.x - camera.x) * camera.zoom;
    const screenY = (this.position.y - camera.y) * camera.zoom;
    const size = (this.config.width || 32) * camera.zoom;
    
    // Draw player as a blue circle
    ctx.fillStyle = '#4444ff';
    ctx.beginPath();
    ctx.arc(screenX, screenY, size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw health bar
    const barWidth = size;
    const barHeight = 4 * camera.zoom;
    const healthPercent = this.state.health / this.state.maxHealth;
    
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(screenX - barWidth / 2, screenY - size / 2 - 10 * camera.zoom, barWidth, barHeight);
    
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(screenX - barWidth / 2, screenY - size / 2 - 10 * camera.zoom, barWidth * healthPercent, barHeight);
  }
}
