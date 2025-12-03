import { Entity } from '../../../framework/core/Entity.js';

/**
 * Clue entity for puzzle game
 * Reveals story text and hints when examined
 */
export class Clue extends Entity {
  /**
   * Create a new Clue entity
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} config - Clue configuration
   */
  constructor(x, y, config = {}) {
    super(null, 'clue', x, y, config);
    
    // Clue-specific state
    this.state.name = config.name || 'Clue';
    this.state.storyText = config.storyText || 'You found a clue.';
    this.state.hintText = config.hintText || null; // Optional hint text
    this.state.examined = false;
    this.state.interactionRadius = config.interactionRadius || 50;
    this.state.disappearOnExamine = config.disappearOnExamine || false;
    
    // Clues don't block movement by default
    this.config.collides = config.collides || false;
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
   * Examine this clue
   * @returns {Object} Examination result with story text
   */
  examine() {
    this.state.examined = true;
    
    let message = this.state.storyText;
    if (this.state.hintText) {
      message += `\n\n${this.state.hintText}`;
    }
    
    // Optionally remove clue after examination
    if (this.state.disappearOnExamine) {
      this.delete();
    }
    
    return {
      success: true,
      message,
      action: 'examine',
      storyText: this.state.storyText,
      hintText: this.state.hintText
    };
  }

  /**
   * Handle interaction with this clue
   * @param {Entity} player - Player entity interacting with this clue
   * @param {Object} context - Game context
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

    // Clues can only be examined
    return this.examine();
  }

  /**
   * Check if clue has been examined
   * @returns {boolean}
   */
  isExamined() {
    return this.state.examined;
  }

  /**
   * Render clue
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} camera - Camera object
   */
  render(ctx, camera) {
    const screenX = (this.position.x - camera.x) * camera.zoom;
    const screenY = (this.position.y - camera.y) * camera.zoom;
    const size = (this.config.width || 24) * camera.zoom;
    
    // Draw clue as a paper/document icon
    ctx.fillStyle = this.state.examined ? '#cccccc' : '#ffffff'; // Gray if examined, white if not
    
    // Draw paper shape
    ctx.beginPath();
    ctx.moveTo(screenX - size / 2, screenY - size / 2);
    ctx.lineTo(screenX + size / 3, screenY - size / 2);
    ctx.lineTo(screenX + size / 2, screenY - size / 3);
    ctx.lineTo(screenX + size / 2, screenY + size / 2);
    ctx.lineTo(screenX - size / 2, screenY + size / 2);
    ctx.closePath();
    ctx.fill();
    
    // Draw folded corner
    ctx.fillStyle = this.state.examined ? '#aaaaaa' : '#dddddd';
    ctx.beginPath();
    ctx.moveTo(screenX + size / 3, screenY - size / 2);
    ctx.lineTo(screenX + size / 3, screenY - size / 3);
    ctx.lineTo(screenX + size / 2, screenY - size / 3);
    ctx.closePath();
    ctx.fill();
    
    // Draw text lines
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1 * camera.zoom;
    const lineSpacing = size / 6;
    for (let i = 0; i < 3; i++) {
      const y = screenY - size / 4 + i * lineSpacing;
      ctx.beginPath();
      ctx.moveTo(screenX - size / 3, y);
      ctx.lineTo(screenX + size / 3, y);
      ctx.stroke();
    }
    
    // Draw outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2 * camera.zoom;
    ctx.beginPath();
    ctx.moveTo(screenX - size / 2, screenY - size / 2);
    ctx.lineTo(screenX + size / 3, screenY - size / 2);
    ctx.lineTo(screenX + size / 2, screenY - size / 3);
    ctx.lineTo(screenX + size / 2, screenY + size / 2);
    ctx.lineTo(screenX - size / 2, screenY + size / 2);
    ctx.closePath();
    ctx.stroke();
  }
}
