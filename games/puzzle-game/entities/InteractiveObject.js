import { Entity } from '../../../framework/core/Entity.js';

/**
 * InteractiveObject entity for puzzle game
 * Base class for objects that can be examined and manipulated
 */
export class InteractiveObject extends Entity {
  /**
   * Create a new InteractiveObject entity
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} config - Object configuration
   */
  constructor(x, y, config = {}) {
    super(null, 'interactive', x, y, config);
    
    // Interactive object state
    this.state.name = config.name || 'Object';
    this.state.description = config.description || 'An interactive object.';
    this.state.examineText = config.examineText || this.state.description;
    this.state.manipulateText = config.manipulateText || 'You manipulate the object.';
    this.state.canManipulate = config.canManipulate !== false;
    this.state.manipulated = false;
    this.state.interactionRadius = config.interactionRadius || 50;
    
    // Interactive objects block movement by default
    this.config.collides = config.collides !== false;
  }

  /**
   * Examine this object
   * @returns {Object} Examination result with text
   */
  examine() {
    return {
      success: true,
      message: this.state.examineText,
      action: 'examine'
    };
  }

  /**
   * Manipulate this object
   * @param {Entity} player - Player entity manipulating the object
   * @returns {Object} Manipulation result
   */
  manipulate(player) {
    if (!this.state.canManipulate) {
      return {
        success: false,
        message: `The ${this.state.name} cannot be manipulated.`,
        action: 'manipulate'
      };
    }

    if (this.state.manipulated) {
      return {
        success: false,
        message: `The ${this.state.name} has already been manipulated.`,
        action: 'manipulate'
      };
    }

    this.state.manipulated = true;
    return {
      success: true,
      message: this.state.manipulateText,
      action: 'manipulate'
    };
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
   * Handle interaction with this object
   * @param {Entity} player - Player entity interacting with this object
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
    } else if (action === 'manipulate') {
      return this.manipulate(player);
    }

    return {
      success: false,
      message: `Cannot perform action '${action}' on ${this.state.name}.`,
      action
    };
  }

  /**
   * Render interactive object
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} camera - Camera object
   */
  render(ctx, camera) {
    const screenX = (this.position.x - camera.x) * camera.zoom;
    const screenY = (this.position.y - camera.y) * camera.zoom;
    const size = (this.config.width || 32) * camera.zoom;
    
    // Draw object as a gray square
    ctx.fillStyle = this.state.manipulated ? '#888888' : '#aaaaaa';
    ctx.fillRect(screenX - size / 2, screenY - size / 2, size, size);
    
    // Draw outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * camera.zoom;
    ctx.strokeRect(screenX - size / 2, screenY - size / 2, size, size);
  }
}
