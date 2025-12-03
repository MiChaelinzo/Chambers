import { Entity } from '../../../framework/core/Entity.js';

/**
 * Key entity for puzzle game
 * Can be collected and used to unlock doors
 */
export class Key extends Entity {
  /**
   * Create a new Key entity
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} config - Key configuration
   */
  constructor(x, y, config = {}) {
    super(null, 'key', x, y, config);
    
    // Key-specific state
    this.state.keyType = config.keyType || 'generic'; // Type of key (matches door requirements)
    this.state.name = config.name || `${this.state.keyType} key`;
    this.state.description = config.description || `A ${this.state.keyType} key.`;
    this.state.collectionRadius = config.collectionRadius || 40;
    this.state.collected = false;
    
    // Keys don't block movement
    this.config.collides = false;
  }

  /**
   * Update key state - check for player collection
   * @param {number} deltaTime - Time elapsed since last update (in seconds)
   * @param {Object} context - Game context with scene, player, etc.
   */
  update(deltaTime, context) {
    // Skip if already collected or deleted
    if (this.state.collected || this.isDeleted()) return;
    
    if (!context.scene) return;

    // Find player entity
    const player = this.findPlayer(context.scene);
    if (!player) return;

    // Calculate distance to player
    const dx = player.position.x - this.position.x;
    const dy = player.position.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if player is close enough to collect
    if (distance <= this.state.collectionRadius) {
      this.collect(player);
    }
  }

  /**
   * Find player entity in scene
   * @param {Object} scene - Scene containing entities
   * @returns {Entity|null} Player entity or null
   */
  findPlayer(scene) {
    const entities = scene.getAllEntities ? scene.getAllEntities() : [];
    return entities.find(e => e.type === 'player' && !e.isDeleted());
  }

  /**
   * Collect this key
   * @param {Entity} player - Player entity collecting the key
   */
  collect(player) {
    if (this.state.collected || this.isDeleted()) return;
    
    this.state.collected = true;
    
    // Add to player inventory
    if (player.addToInventory) {
      player.addToInventory({
        type: 'key',
        keyType: this.state.keyType,
        name: this.state.name,
        description: this.state.description
      });
    }
    
    // Remove key from scene
    this.delete();
  }

  /**
   * Handle interaction with this key
   * @param {Entity} player - Player entity interacting with this key
   * @param {Object} context - Game context
   * @returns {Object} Result of interaction
   */
  onInteract(player, context) {
    if (this.state.collected) {
      return {
        success: false,
        message: 'Key already collected',
        action: 'interact'
      };
    }
    
    this.collect(player);
    return {
      success: true,
      message: `Collected ${this.state.name}`,
      action: 'collect'
    };
  }

  /**
   * Render key
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} camera - Camera object
   */
  render(ctx, camera) {
    if (this.state.collected) return;
    
    const screenX = (this.position.x - camera.x) * camera.zoom;
    const screenY = (this.position.y - camera.y) * camera.zoom;
    const size = (this.config.width || 20) * camera.zoom;
    
    // Draw key as a golden shape
    ctx.fillStyle = '#FFD700'; // Gold
    
    // Draw key head (circle)
    ctx.beginPath();
    ctx.arc(screenX - size / 4, screenY, size / 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw key shaft (rectangle)
    ctx.fillRect(screenX - size / 4, screenY - size / 8, size / 2, size / 4);
    
    // Draw key teeth (small rectangles)
    ctx.fillRect(screenX + size / 4 - size / 8, screenY - size / 8, size / 16, size / 6);
    ctx.fillRect(screenX + size / 4, screenY - size / 8, size / 16, size / 6);
    
    // Draw outline
    ctx.strokeStyle = '#DAA520'; // Darker gold
    ctx.lineWidth = 2 * camera.zoom;
    ctx.beginPath();
    ctx.arc(screenX - size / 4, screenY, size / 3, 0, Math.PI * 2);
    ctx.stroke();
  }
}
