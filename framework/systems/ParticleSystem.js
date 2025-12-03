/**
 * ParticleSystem - Manages particle effects for atmospheric and visual feedback
 * Supports various particle types: blood, dust, fog, sparks, etc.
 */
export class ParticleSystem {
  /**
   * @param {Object} config - Particle system configuration
   * @param {number} config.maxParticles - Maximum number of particles (default: 1000)
   */
  constructor(config = {}) {
    this.maxParticles = config.maxParticles || 1000;
    this.particles = [];
    this.emitters = new Map();
    this.particlePool = [];
  }

  /**
   * Create a particle emitter at a position
   * @param {string} id - Emitter identifier
   * @param {Object} config - Emitter configuration
   * @returns {Object} Emitter instance
   */
  createEmitter(id, config) {
    const emitter = {
      id,
      position: { x: config.x || 0, y: config.y || 0 },
      rate: config.rate || 10, // particles per second
      lifetime: config.lifetime || -1, // -1 = infinite
      particleConfig: config.particle || {},
      active: true,
      timeSinceEmit: 0,
      timeAlive: 0
    };

    this.emitters.set(id, emitter);
    return emitter;
  }

  /**
   * Emit particles from a position
   * @param {Object} config - Emission configuration
   */
  emit(config) {
    const count = config.count || 1;
    const position = config.position || { x: 0, y: 0 };
    const type = config.type || 'default';

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        // Reuse oldest particle
        const particle = this.particles.shift();
        this.initializeParticle(particle, position, type, config);
        this.particles.push(particle);
      } else {
        // Create new particle
        const particle = this.createParticle(position, type, config);
        this.particles.push(particle);
      }
    }
  }

  /**
   * Create a new particle
   * @private
   */
  createParticle(position, type, config) {
    const particle = {
      position: { x: position.x, y: position.y },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      lifetime: 1.0,
      age: 0,
      size: 4,
      color: '#ffffff',
      alpha: 1.0,
      type: type
    };

    this.initializeParticle(particle, position, type, config);
    return particle;
  }

  /**
   * Initialize particle properties based on type
   * @private
   */
  initializeParticle(particle, position, type, config) {
    particle.position.x = position.x;
    particle.position.y = position.y;
    particle.age = 0;

    // Apply configuration overrides
    particle.lifetime = config.lifetime || this.getDefaultLifetime(type);
    particle.size = config.size || this.getDefaultSize(type);
    particle.color = config.color || this.getDefaultColor(type);
    particle.alpha = config.alpha !== undefined ? config.alpha : 1.0;

    // Set velocity based on type and config
    const angle = config.angle !== undefined ? config.angle : Math.random() * Math.PI * 2;
    const speed = config.speed !== undefined ? config.speed : this.getDefaultSpeed(type);
    
    particle.velocity.x = Math.cos(angle) * speed;
    particle.velocity.y = Math.sin(angle) * speed;

    // Set acceleration (gravity, wind, etc.)
    particle.acceleration.x = config.accelerationX || 0;
    particle.acceleration.y = config.accelerationY || this.getDefaultGravity(type);
  }

  /**
   * Get default lifetime for particle type
   * @private
   */
  getDefaultLifetime(type) {
    const lifetimes = {
      'blood': 2.0,
      'dust': 1.5,
      'fog': 3.0,
      'spark': 0.5,
      'smoke': 2.5,
      'default': 1.0
    };
    return lifetimes[type] || lifetimes['default'];
  }

  /**
   * Get default size for particle type
   * @private
   */
  getDefaultSize(type) {
    const sizes = {
      'blood': 3,
      'dust': 2,
      'fog': 20,
      'spark': 2,
      'smoke': 10,
      'default': 4
    };
    return sizes[type] || sizes['default'];
  }

  /**
   * Get default color for particle type
   * @private
   */
  getDefaultColor(type) {
    const colors = {
      'blood': '#8B0000',
      'dust': '#8B7355',
      'fog': '#CCCCCC',
      'spark': '#FFD700',
      'smoke': '#555555',
      'default': '#FFFFFF'
    };
    return colors[type] || colors['default'];
  }

  /**
   * Get default speed for particle type
   * @private
   */
  getDefaultSpeed(type) {
    const speeds = {
      'blood': 100,
      'dust': 30,
      'fog': 10,
      'spark': 200,
      'smoke': 20,
      'default': 50
    };
    return speeds[type] || speeds['default'];
  }

  /**
   * Get default gravity for particle type
   * @private
   */
  getDefaultGravity(type) {
    const gravities = {
      'blood': 200,
      'dust': 50,
      'fog': -10, // rises
      'spark': 100,
      'smoke': -30, // rises
      'default': 0
    };
    return gravities[type] || gravities['default'];
  }

  /**
   * Update all particles
   * @param {number} deltaTime - Time elapsed since last update (in seconds)
   */
  update(deltaTime) {
    // Update emitters
    for (const [id, emitter] of this.emitters) {
      if (!emitter.active) continue;

      emitter.timeAlive += deltaTime;
      emitter.timeSinceEmit += deltaTime;

      // Check if emitter should die
      if (emitter.lifetime > 0 && emitter.timeAlive >= emitter.lifetime) {
        emitter.active = false;
        continue;
      }

      // Emit particles based on rate
      const emitInterval = 1.0 / emitter.rate;
      while (emitter.timeSinceEmit >= emitInterval) {
        this.emit({
          position: emitter.position,
          ...emitter.particleConfig
        });
        emitter.timeSinceEmit -= emitInterval;
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      particle.age += deltaTime;

      // Remove dead particles
      if (particle.age >= particle.lifetime) {
        this.particles.splice(i, 1);
        continue;
      }

      // Update velocity with acceleration
      particle.velocity.x += particle.acceleration.x * deltaTime;
      particle.velocity.y += particle.acceleration.y * deltaTime;

      // Update position
      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;

      // Update alpha (fade out over lifetime)
      const lifePercent = particle.age / particle.lifetime;
      particle.alpha = 1.0 - lifePercent;
    }
  }

  /**
   * Render all particles
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} camera - Camera object with x, y, zoom
   */
  render(ctx, camera) {
    for (const particle of this.particles) {
      const screenX = (particle.position.x - camera.x) * camera.zoom;
      const screenY = (particle.position.y - camera.y) * camera.zoom;
      const size = particle.size * camera.zoom;

      ctx.save();
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      
      // Draw particle based on type
      if (particle.type === 'fog' || particle.type === 'smoke') {
        // Soft circle for fog/smoke
        const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, size);
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX - size, screenY - size, size * 2, size * 2);
      } else {
        // Simple circle for other particles
        ctx.beginPath();
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
  }

  /**
   * Remove an emitter
   * @param {string} id - Emitter identifier
   */
  removeEmitter(id) {
    this.emitters.delete(id);
  }

  /**
   * Clear all particles
   */
  clear() {
    this.particles = [];
  }

  /**
   * Get particle count
   * @returns {number} Number of active particles
   */
  getParticleCount() {
    return this.particles.length;
  }

  /**
   * Get emitter count
   * @returns {number} Number of active emitters
   */
  getEmitterCount() {
    return Array.from(this.emitters.values()).filter(e => e.active).length;
  }
}
