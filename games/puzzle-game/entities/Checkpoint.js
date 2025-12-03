import { Entity } from '../../../framework/core/Entity.js';

/**
 * Checkpoint entity that triggers save when player interacts with it
 */
export class Checkpoint extends Entity {
  /**
   * Create a new Checkpoint entity
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} config - Checkpoint configuration
   */
  constructor(x, y, config = {}) {
    super(null, 'checkpoint', x, y, config);
    
    this.state.activated = config.activated || false;
    this.state.name = config.name || 'Checkpoint';
    this.state.interactionRadius = config.interactionRadius || 50;
    this.state.autoTrigger = config.autoTrigger !== false; // Default to true
    this.state.message = config.message || 'Progress saved!';
    
    // Checkpoints don't block movement
    this.config.collides = false;
  }

  /**
   * Update checkpoint - check for auto-trigger
   * @param {number} deltaTime - Time elapsed since last update
   * @param {Object} context - Game context
   */
  update(deltaTime, context) {
    if (!this.state.autoTrigger || this.state.activated) {
      return;
    }

    // Check if player is nearby for auto-trigger
    if (context.scene) {
      const player = this.findPlayer(context.scene);
      if (player && this.isPlayerNearby(player)) {
        this.triggerCheckpoint(context);
      }
    }
  }

  /**
   * Handle interaction with checkpoint
   * @param {Player} player - Player entity
   * @param {Object} context - Game context
   * @returns {Object} Interaction result
   */
  onInteract(player, context) {
    if (this.state.activated) {
      return {
        success: false,
        message: 'Checkpoint already activated',
        action: 'interact'
      };
    }

    return this.triggerCheckpoint(context);
  }

  /**
   * Trigger the checkpoint save
   * @param {Object} context - Game context
   * @returns {Object} Trigger result
   */
  triggerCheckpoint(context) {
    if (this.state.activated) {
      return {
        success: false,
        message: 'Checkpoint already activated',
        action: 'checkpoint'
      };
    }

    // Mark as activated
    this.state.activated = true;

    // Trigger save through context if available
    if (context.saveSystem && typeof context.saveSystem.saveCheckpoint === 'function') {
      const gameState = this.gatherGameState(context);
      const success = context.saveSystem.saveCheckpoint(gameState, this.state.name);
      
      return {
        success: success,
        message: success ? this.state.message : 'Failed to save progress',
        action: 'checkpoint',
        checkpointName: this.state.name
      };
    }

    return {
      success: false,
      message: 'Save system not available',
      action: 'checkpoint'
    };
  }

  /**
   * Gather current game state for saving
   * @param {Object} context - Game context
   * @returns {Object} Game state data
   */
  gatherGameState(context) {
    const gameState = {};

    // Get player state
    if (context.scene) {
      const player = this.findPlayer(context.scene);
      if (player && context.saveSystem) {
        gameState.player = context.saveSystem.serializePlayer(player);
      }
    }

    // Get scene state
    if (context.scene && context.saveSystem) {
      gameState.scene = context.saveSystem.serializeScene(context.scene);
    }

    // Get puzzle states if available
    if (context.puzzles && context.saveSystem) {
      gameState.puzzles = context.saveSystem.serializePuzzles(context.puzzles);
    }

    // Add progress data
    gameState.progress = {
      currentScene: context.scene ? context.scene.getId() : null,
      checkpointName: this.state.name,
      timestamp: Date.now()
    };

    return gameState;
  }

  /**
   * Find player entity in scene
   * @param {Scene} scene - Scene to search
   * @returns {Player|null} Player entity or null
   */
  findPlayer(scene) {
    const players = scene.getEntitiesByType('player');
    return players.length > 0 ? players[0] : null;
  }

  /**
   * Check if player is nearby
   * @param {Player} player - Player entity
   * @returns {boolean} True if player is within interaction radius
   */
  isPlayerNearby(player) {
    const dx = player.position.x - this.position.x;
    const dy = player.position.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance <= this.state.interactionRadius;
  }

  /**
   * Check if checkpoint is activated
   * @returns {boolean} True if activated
   */
  isActivated() {
    return this.state.activated;
  }

  /**
   * Reset checkpoint to inactive state
   */
  reset() {
    this.state.activated = false;
  }

  /**
   * Render checkpoint
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} camera - Camera object
   */
  render(ctx, camera) {
    const screenX = (this.position.x - camera.x) * camera.zoom;
    const screenY = (this.position.y - camera.y) * camera.zoom;
    const size = (this.config.width || 40) * camera.zoom;
    
    // Draw checkpoint as a crystal/diamond shape
    ctx.save();
    ctx.translate(screenX, screenY);
    
    // Choose color based on activation state
    const color = this.state.activated ? '#44ff44' : '#4444ff';
    const glowColor = this.state.activated ? '#88ff88' : '#8888ff';
    
    // Draw glow effect
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10 * camera.zoom;
    
    // Draw diamond shape
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(size / 3, 0);
    ctx.lineTo(0, size / 2);
    ctx.lineTo(-size / 3, 0);
    ctx.closePath();
    ctx.fill();
    
    // Draw outline
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * camera.zoom;
    ctx.stroke();
    
    ctx.restore();
  }
}