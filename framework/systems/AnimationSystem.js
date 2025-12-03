/**
 * AnimationSystem - Manages sprite animations and tweening
 * Supports frame-based animations and property interpolation
 */
export class AnimationSystem {
  constructor() {
    this.animations = new Map();
    this.activeAnimations = new Map();
    this.tweens = [];
  }

  /**
   * Register an animation definition
   * @param {string} id - Animation identifier
   * @param {Object} config - Animation configuration
   */
  registerAnimation(id, config) {
    this.animations.set(id, {
      frames: config.frames || [],
      frameRate: config.frameRate || 10,
      loop: config.loop !== undefined ? config.loop : true,
      pingPong: config.pingPong || false
    });
  }

  /**
   * Play an animation on an entity
   * @param {Object} entity - Entity to animate
   * @param {string} animationId - Animation to play
   * @param {Function} onComplete - Callback when animation completes
   */
  playAnimation(entity, animationId, onComplete) {
    const animDef = this.animations.get(animationId);
    if (!animDef) {
      console.warn(`Animation ${animationId} not found`);
      return;
    }

    this.activeAnimations.set(entity.id, {
      entity,
      animationId,
      currentFrame: 0,
      timeAccumulator: 0,
      direction: 1, // 1 for forward, -1 for reverse (ping-pong)
      onComplete
    });
  }

  /**
   * Stop an animation on an entity
   * @param {Object} entity - Entity to stop animating
   */
  stopAnimation(entity) {
    this.activeAnimations.delete(entity.id);
  }

  /**
   * Create a tween (smooth property interpolation)
   * @param {Object} config - Tween configuration
   * @returns {Object} Tween instance
   */
  tween(config) {
    const tween = {
      target: config.target,
      property: config.property,
      from: config.from !== undefined ? config.from : config.target[config.property],
      to: config.to,
      duration: config.duration || 1.0,
      easing: config.easing || 'linear',
      elapsed: 0,
      onUpdate: config.onUpdate,
      onComplete: config.onComplete,
      active: true
    };

    this.tweens.push(tween);
    return tween;
  }

  /**
   * Tween multiple properties at once
   * @param {Object} target - Object to tween
   * @param {Object} properties - Properties to tween {prop: toValue}
   * @param {number} duration - Duration in seconds
   * @param {string} easing - Easing function name
   * @param {Function} onComplete - Callback when complete
   */
  tweenMultiple(target, properties, duration, easing, onComplete) {
    const tweens = [];
    let completedCount = 0;
    const totalCount = Object.keys(properties).length;

    for (const [prop, toValue] of Object.entries(properties)) {
      const tween = this.tween({
        target,
        property: prop,
        to: toValue,
        duration,
        easing,
        onComplete: () => {
          completedCount++;
          if (completedCount === totalCount && onComplete) {
            onComplete();
          }
        }
      });
      tweens.push(tween);
    }

    return tweens;
  }

  /**
   * Fade in an entity
   * @param {Object} entity - Entity to fade in
   * @param {number} duration - Duration in seconds
   * @param {Function} onComplete - Callback when complete
   */
  fadeIn(entity, duration = 1.0, onComplete) {
    if (!entity.state) entity.state = {};
    entity.state.alpha = 0;
    
    return this.tween({
      target: entity.state,
      property: 'alpha',
      from: 0,
      to: 1,
      duration,
      easing: 'easeInOut',
      onComplete
    });
  }

  /**
   * Fade out an entity
   * @param {Object} entity - Entity to fade out
   * @param {number} duration - Duration in seconds
   * @param {Function} onComplete - Callback when complete
   */
  fadeOut(entity, duration = 1.0, onComplete) {
    if (!entity.state) entity.state = {};
    if (entity.state.alpha === undefined) entity.state.alpha = 1;
    
    return this.tween({
      target: entity.state,
      property: 'alpha',
      from: entity.state.alpha,
      to: 0,
      duration,
      easing: 'easeInOut',
      onComplete
    });
  }

  /**
   * Shake an entity (for hit effects, etc.)
   * @param {Object} entity - Entity to shake
   * @param {number} intensity - Shake intensity
   * @param {number} duration - Duration in seconds
   */
  shake(entity, intensity = 5, duration = 0.3) {
    const originalX = entity.position.x;
    const originalY = entity.position.y;
    const startTime = Date.now();

    const shakeInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= duration) {
        entity.position.x = originalX;
        entity.position.y = originalY;
        clearInterval(shakeInterval);
        return;
      }

      const progress = elapsed / duration;
      const currentIntensity = intensity * (1 - progress);
      
      entity.position.x = originalX + (Math.random() - 0.5) * currentIntensity * 2;
      entity.position.y = originalY + (Math.random() - 0.5) * currentIntensity * 2;
    }, 16); // ~60fps
  }

  /**
   * Update all active animations and tweens
   * @param {number} deltaTime - Time elapsed since last update (in seconds)
   */
  update(deltaTime) {
    // Update frame-based animations
    for (const [entityId, anim] of this.activeAnimations) {
      const animDef = this.animations.get(anim.animationId);
      if (!animDef) continue;

      anim.timeAccumulator += deltaTime;
      const frameDuration = 1.0 / animDef.frameRate;

      while (anim.timeAccumulator >= frameDuration) {
        anim.timeAccumulator -= frameDuration;
        anim.currentFrame += anim.direction;

        // Handle animation completion
        if (anim.currentFrame >= animDef.frames.length) {
          if (animDef.loop) {
            if (animDef.pingPong) {
              anim.direction = -1;
              anim.currentFrame = animDef.frames.length - 2;
            } else {
              anim.currentFrame = 0;
            }
          } else {
            anim.currentFrame = animDef.frames.length - 1;
            if (anim.onComplete) anim.onComplete();
            this.activeAnimations.delete(entityId);
            break;
          }
        } else if (anim.currentFrame < 0) {
          if (animDef.pingPong) {
            anim.direction = 1;
            anim.currentFrame = 1;
          } else {
            anim.currentFrame = 0;
          }
        }

        // Update entity sprite frame
        if (anim.entity.state) {
          anim.entity.state.currentFrame = animDef.frames[anim.currentFrame];
        }
      }
    }

    // Update tweens
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tween = this.tweens[i];
      if (!tween.active) {
        this.tweens.splice(i, 1);
        continue;
      }

      tween.elapsed += deltaTime;
      const progress = Math.min(tween.elapsed / tween.duration, 1.0);
      const easedProgress = this.applyEasing(progress, tween.easing);

      // Interpolate value
      const value = tween.from + (tween.to - tween.from) * easedProgress;
      tween.target[tween.property] = value;

      if (tween.onUpdate) {
        tween.onUpdate(value, progress);
      }

      // Complete tween
      if (progress >= 1.0) {
        tween.active = false;
        if (tween.onComplete) {
          tween.onComplete();
        }
        this.tweens.splice(i, 1);
      }
    }
  }

  /**
   * Apply easing function to progress value
   * @param {number} t - Progress (0-1)
   * @param {string} easing - Easing function name
   * @returns {number} Eased progress value
   * @private
   */
  applyEasing(t, easing) {
    switch (easing) {
      case 'linear':
        return t;
      case 'easeIn':
        return t * t;
      case 'easeOut':
        return t * (2 - t);
      case 'easeInOut':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      case 'easeInCubic':
        return t * t * t;
      case 'easeOutCubic':
        return (--t) * t * t + 1;
      case 'easeInOutCubic':
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      case 'elastic':
        return Math.sin(-13 * (t + 1) * Math.PI / 2) * Math.pow(2, -10 * t) + 1;
      case 'bounce':
        if (t < 1 / 2.75) {
          return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
          return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        } else if (t < 2.5 / 2.75) {
          return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        } else {
          return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
      default:
        return t;
    }
  }

  /**
   * Get current frame for an entity's animation
   * @param {Object} entity - Entity to check
   * @returns {number|null} Current frame index or null
   */
  getCurrentFrame(entity) {
    const anim = this.activeAnimations.get(entity.id);
    if (!anim) return null;
    return anim.currentFrame;
  }

  /**
   * Check if entity is animating
   * @param {Object} entity - Entity to check
   * @returns {boolean} True if animating
   */
  isAnimating(entity) {
    return this.activeAnimations.has(entity.id);
  }

  /**
   * Stop all tweens on a target
   * @param {Object} target - Target object
   */
  stopTweens(target) {
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      if (this.tweens[i].target === target) {
        this.tweens.splice(i, 1);
      }
    }
  }

  /**
   * Clear all animations and tweens
   */
  clear() {
    this.activeAnimations.clear();
    this.tweens = [];
  }
}
