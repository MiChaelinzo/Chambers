import { Entity } from '../../../framework/core/Entity.js';

/**
 * Item entity for dungeon crawler game
 * Implements collection behavior and item effects
 */
export class Item extends Entity {
  /**
   * Create a new Item entity
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} config - Item configuration
   */
  constructor(x, y, config = {}) {
    super(null, 'item', x, y, config);
    
    // Item-specific state
    // Support both itemType/value and type/healAmount formats for compatibility
    this.state.itemType = config.itemType || config.type || 'health'; // health, weapon, key, etc.
    this.state.value = config.value || config.healAmount || 10; // Effect value (heal amount, damage bonus, etc.)
    this.state.collectionRadius = config.collectionRadius || 32; // Distance at which item can be collected
    this.state.collected = false;
    
    // Items don't block movement by default
    this.config.collides = config.collides !== undefined ? config.collides : false;
  }

  /**
   * Update item state - check for player collection
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
    const entities = scene.getAllEntities ? scene.getAllEntities() : (scene.entities || []);
    return entities.find(e => e.type === 'player' && !e.isDeleted());
  }

  /**
   * Collect this item
   * @param {Entity} player - Player entity collecting the item
   */
  collect(player) {
    if (this.state.collected || this.isDeleted()) return;
    
    this.state.collected = true;
    
    // Apply item effect first
    this.applyEffect(player);
    
    // Add to player inventory
    if (player.addToInventory) {
      player.addToInventory({
        type: this.state.itemType,
        value: this.state.value,
        name: this.config.name || this.state.itemType
      });
    }
    
    // Remove item from scene
    this.delete();
  }

  /**
   * Apply item effect to player
   * @param {Entity} player - Player entity
   */
  applyEffect(player) {
    // Normalize item type (handle both 'health' and 'health_potion', etc.)
    const itemType = this.state.itemType.toLowerCase();
    
    if (itemType.includes('health') || itemType === 'health') {
      if (player.heal) {
        player.heal(this.state.value);
      }
    } else if (itemType.includes('weapon') || itemType === 'weapon') {
      if (player.state) {
        player.state.damage = (player.state.damage || 10) + this.state.value;
      }
    } else if (itemType.includes('speed') || itemType === 'speed') {
      if (player.state) {
        player.state.speed = (player.state.speed || 100) + this.state.value;
      }
    }
    // For other item types (keys, etc.), just add to inventory without effect
  }

  /**
   * Handle interaction with this item
   * @param {Entity} player - Player entity interacting with this item
   * @param {Object} context - Game context
   * @returns {Object} Result of interaction
   */
  onInteract(player, context) {
    if (this.state.collected) {
      return {
        success: false,
        message: 'Item already collected'
      };
    }
    
    this.collect(player);
    return {
      success: true,
      message: `Collected ${this.config.name || this.state.itemType}`
    };
  }

  /**
   * Render item
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} camera - Camera object
   */
  render(ctx, camera) {
    if (this.state.collected) return;
    
    const screenX = (this.position.x - camera.x) * camera.zoom;
    const screenY = (this.position.y - camera.y) * camera.zoom;
    const size = (this.config.width || 24) * camera.zoom;
    
    // Draw item based on type
    let color = '#ffff44'; // Default yellow
    switch (this.state.itemType) {
      case 'health':
        color = '#44ff44'; // Green
        break;
      case 'weapon':
        color = '#ff8844'; // Orange
        break;
      case 'speed':
        color = '#44ffff'; // Cyan
        break;
    }
    
    // Draw item as a diamond
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY - size / 2);
    ctx.lineTo(screenX + size / 2, screenY);
    ctx.lineTo(screenX, screenY + size / 2);
    ctx.lineTo(screenX - size / 2, screenY);
    ctx.closePath();
    ctx.fill();
    
    // Draw outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * camera.zoom;
    ctx.stroke();
  }
}
