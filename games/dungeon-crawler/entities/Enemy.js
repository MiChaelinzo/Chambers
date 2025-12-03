import { Entity } from '../../../framework/core/Entity.js';

/**
 * Enemy entity for dungeon crawler game
 * Implements chase AI behavior and combat
 */
export class Enemy extends Entity {
  /**
   * Create a new Enemy entity
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} config - Enemy configuration
   */
  constructor(x, y, config = {}) {
    super(null, 'enemy', x, y, config);
    
    // Enemy-specific state
    this.state.health = config.health || 30;
    this.state.maxHealth = config.health || 30;
    this.state.speed = config.speed || 50; // pixels per second
    this.state.damage = config.damage || 10;
    this.state.chaseRadius = config.chaseRadius || 200; // Distance at which enemy starts chasing
    this.state.attackRadius = config.attackRadius || 32; // Distance at which enemy can attack
    this.state.attackCooldown = 0; // Time until next attack
    this.state.attackRate = config.attackRate || 1.0; // Attacks per second
  }

  /**
   * Update enemy state - chase player and attack
   * @param {number} deltaTime - Time elapsed since last update (in seconds)
   * @param {Object} context - Game context with scene, player, etc.
   */
  update(deltaTime, context) {
    // Update attack cooldown
    if (this.state.attackCooldown > 0) {
      this.state.attackCooldown -= deltaTime;
    }

    if (!context.scene) return;

    // Find player entity
    const player = this.findPlayer(context.scene);
    if (!player) return;

    // Calculate distance to player
    const dx = player.position.x - this.position.x;
    const dy = player.position.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if player is within chase radius
    if (distance <= this.state.chaseRadius) {
      // Check if within attack radius
      if (distance <= this.state.attackRadius) {
        // Attack player if cooldown is ready
        if (this.state.attackCooldown <= 0) {
          this.attackPlayer(player);
          this.state.attackCooldown = 1.0 / this.state.attackRate;
        }
      } else {
        // Move towards player
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        const newX = this.position.x + dirX * this.state.speed * deltaTime;
        const newY = this.position.y + dirY * this.state.speed * deltaTime;
        
        // Check for collisions before moving
        const collision = this.checkCollision(newX, newY, context.scene, player);
        if (!collision) {
          this.position.x = newX;
          this.position.y = newY;
        }
      }
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
   * Attack player
   * @param {Entity} player - Player entity to attack
   */
  attackPlayer(player) {
    if (player.takeDamage) {
      player.takeDamage(this.state.damage);
    }
  }

  /**
   * Check if moving to a position would cause a collision (excluding player)
   * @param {number} x - Target X position
   * @param {number} y - Target Y position
   * @param {Object} scene - Scene containing entities
   * @param {Entity} player - Player entity to exclude from collision check
   * @returns {Entity|null} Colliding entity or null
   */
  checkCollision(x, y, scene, player) {
    const entities = scene.getAllEntities ? scene.getAllEntities() : (scene.entities || []);
    
    for (const entity of entities) {
      if (entity === this || entity === player || entity.isDeleted()) continue;
      
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
   * Take damage
   * @param {number} amount - Damage amount
   */
  takeDamage(amount) {
    this.state.health = Math.max(0, this.state.health - amount);
    if (this.state.health <= 0) {
      this.delete();
    }
  }

  /**
   * Check if enemy is dead
   * @returns {boolean}
   */
  isDead() {
    return this.state.health <= 0;
  }

  /**
   * Render enemy
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} camera - Camera object
   */
  render(ctx, camera) {
    const screenX = (this.position.x - camera.x) * camera.zoom;
    const screenY = (this.position.y - camera.y) * camera.zoom;
    const size = (this.config.width || 32) * camera.zoom;
    
    // Draw enemy as a red circle
    ctx.fillStyle = '#ff4444';
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
