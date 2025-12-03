import { Entity } from '../../../framework/core/Entity.js';

/**
 * Door entity for puzzle game
 * Implements locked/unlocked states and key requirements
 */
export class Door extends Entity {
  /**
   * Create a new Door entity
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} config - Door configuration
   */
  constructor(x, y, config = {}) {
    super(null, 'door', x, y, config);
    
    // Door-specific state
    this.state.locked = config.locked !== false; // Locked by default
    this.state.keyRequired = config.keyRequired || null; // Key type needed to unlock
    this.state.name = config.name || 'Door';
    this.state.lockedText = config.lockedText || 'The door is locked.';
    this.state.unlockedText = config.unlockedText || 'The door is unlocked.';
    this.state.unlockSuccessText = config.unlockSuccessText || 'You unlock the door.';
    this.state.wrongKeyText = config.wrongKeyText || 'This key does not fit.';
    this.state.interactionRadius = config.interactionRadius || 50;
    
    // Locked doors block movement, unlocked doors don't
    this.config.collides = this.state.locked;
  }

  /**
   * Check if player is within interaction range
   * @param {Entity} player - Player entity
   * @returns {boolean} True if within range
   */
  isInRange(player) {
    const dx = player.position.x - this.position.x;
    const dy = player.position.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= this.state.interactionRadius;
  }

  /**
   * Attempt to unlock the door with a key
   * @param {Entity} player - Player entity with inventory
   * @param {string} keyType - Type of key to use (optional)
   * @returns {Object} Unlock result
   */
  unlock(player, keyType = null) {
    if (!this.state.locked) {
      return {
        success: false,
        message: 'The door is already unlocked.',
        action: 'unlock'
      };
    }

    // If no key required, just unlock
    if (!this.state.keyRequired) {
      this.state.locked = false;
      this.config.collides = false;
      return {
        success: true,
        message: this.state.unlockSuccessText,
        action: 'unlock'
      };
    }

    // Check if player has the required key
    if (!player.getInventory) {
      return {
        success: false,
        message: 'You need a key to unlock this door.',
        action: 'unlock'
      };
    }

    const inventory = player.getInventory();
    const hasKey = inventory.some(item => 
      item.type === 'key' && 
      (item.keyType === this.state.keyRequired || item.name === this.state.keyRequired)
    );

    if (!hasKey) {
      return {
        success: false,
        message: keyType ? this.state.wrongKeyText : 'You need a key to unlock this door.',
        action: 'unlock'
      };
    }

    // Unlock the door
    this.state.locked = false;
    this.config.collides = false;
    return {
      success: true,
      message: this.state.unlockSuccessText,
      action: 'unlock'
    };
  }

  /**
   * Examine the door
   * @returns {Object} Examination result
   */
  examine() {
    const message = this.state.locked ? this.state.lockedText : this.state.unlockedText;
    return {
      success: true,
      message,
      action: 'examine'
    };
  }

  /**
   * Handle interaction with this door
   * @param {Entity} player - Player entity interacting with this door
   * @param {Object} context - Game context with action type
   * @returns {Object} Result of interaction
   */
  onInteract(player, context) {
    // Check if player is in range
    if (!this.isInRange(player)) {
      return {
        success: false,
        message: `You are too far from the ${this.state.name}.`,
        action: context.action || 'interact'
      };
    }

    // Determine action type
    const action = context.action || 'examine';
    
    if (action === 'examine') {
      return this.examine();
    } else if (action === 'unlock' || action === 'use') {
      return this.unlock(player, context.keyType);
    }

    return {
      success: false,
      message: `Cannot perform action '${action}' on ${this.state.name}.`,
      action
    };
  }

  /**
   * Check if door is locked
   * @returns {boolean}
   */
  isLocked() {
    return this.state.locked;
  }

  /**
   * Render door
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} camera - Camera object
   */
  render(ctx, camera) {
    const screenX = (this.position.x - camera.x) * camera.zoom;
    const screenY = (this.position.y - camera.y) * camera.zoom;
    const width = (this.config.width || 40) * camera.zoom;
    const height = (this.config.height || 60) * camera.zoom;
    
    // Draw door
    ctx.fillStyle = this.state.locked ? '#8B4513' : '#DEB887'; // Brown when locked, tan when unlocked
    ctx.fillRect(screenX - width / 2, screenY - height / 2, width, height);
    
    // Draw door frame
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 3 * camera.zoom;
    ctx.strokeRect(screenX - width / 2, screenY - height / 2, width, height);
    
    // Draw lock indicator if locked
    if (this.state.locked) {
      ctx.fillStyle = '#FFD700'; // Gold
      ctx.beginPath();
      ctx.arc(screenX + width / 4, screenY, 6 * camera.zoom, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
