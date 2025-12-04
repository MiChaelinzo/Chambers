/**
 * LightingSystem - Dynamic lighting with shadows and ambient occlusion
 * Creates atmospheric lighting effects for horror games
 */
export class LightingSystem {
  /**
   * @param {Object} config - Lighting configuration
   */
  constructor(config = {}) {
    this.lights = new Map();
    this.ambientLight = config.ambientLight || 0.1;
    this.shadowQuality = config.shadowQuality || 'medium'; // low, medium, high
    this.enableShadows = config.enableShadows !== false;
    this.lightCanvas = null;
    this.lightCtx = null;
  }

  /**
   * Initialize lighting canvas
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  initialize(width, height) {
    this.lightCanvas = document.createElement('canvas');
    this.lightCanvas.width = width;
    this.lightCanvas.height = height;
    this.lightCtx = this.lightCanvas.getContext('2d');
  }

  /**
   * Add a light source
   * @param {string} id - Light identifier
   * @param {Object} config - Light configuration
   */
  addLight(id, config) {
    this.lights.set(id, {
      id,
      position: config.position || { x: 0, y: 0 },
      radius: config.radius || 100,
      intensity: config.intensity || 1.0,
      color: config.color || '#ffffff',
      flicker: config.flicker || false,
      flickerSpeed: config.flickerSpeed || 0.1,
      flickerAmount: config.flickerAmount || 0.2,
      castShadows: config.castShadows !== false,
      type: config.type || 'point', // point, spot, directional
      angle: config.angle || 0, // for spotlights
      spread: config.spread || Math.PI / 4, // for spotlights
      enabled: true,
      _flickerTime: 0
    });
  }

  /**
   * Remove a light source
   * @param {string} id - Light identifier
   */
  removeLight(id) {
    this.lights.delete(id);
  }

  /**
   * Update light position
   * @param {string} id - Light identifier
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  updateLightPosition(id, x, y) {
    const light = this.lights.get(id);
    if (light) {
      light.position.x = x;
      light.position.y = y;
    }
  }

  /**
   * Toggle light on/off
   * @param {string} id - Light identifier
   * @param {boolean} enabled - Enable state
   */
  setLightEnabled(id, enabled) {
    const light = this.lights.get(id);
    if (light) {
      light.enabled = enabled;
    }
  }

  /**
   * Update lighting system
   * @param {number} deltaTime - Time elapsed in seconds
   */
  update(deltaTime) {
    // Update flickering lights
    for (const [id, light] of this.lights) {
      if (light.flicker && light.enabled) {
        light._flickerTime += deltaTime * light.flickerSpeed;
        const flicker = Math.sin(light._flickerTime * 10) * light.flickerAmount;
        light._currentIntensity = Math.max(0, light.intensity + flicker);
      } else {
        light._currentIntensity = light.intensity;
      }
    }
  }

  /**
   * Render lighting to canvas
   * @param {CanvasRenderingContext2D} ctx - Target canvas context
   * @param {Object} camera - Camera object
   * @param {Array} obstacles - Array of obstacle entities for shadows
   */
  render(ctx, camera, obstacles = []) {
    if (!this.lightCtx) {
      this.initialize(ctx.canvas.width, ctx.canvas.height);
    }

    // Clear light canvas
    this.lightCtx.fillStyle = `rgba(0, 0, 0, ${1 - this.ambientLight})`;
    this.lightCtx.fillRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);

    // Render each light
    for (const [id, light] of this.lights) {
      if (!light.enabled) continue;

      const screenX = (light.position.x - camera.x) * camera.zoom + this.lightCanvas.width / 2;
      const screenY = (light.position.y - camera.y) * camera.zoom + this.lightCanvas.height / 2;
      const radius = light.radius * camera.zoom;

      this.lightCtx.save();

      if (light.type === 'point') {
        this.renderPointLight(screenX, screenY, radius, light);
      } else if (light.type === 'spot') {
        this.renderSpotLight(screenX, screenY, radius, light);
      }

      // Render shadows if enabled
      if (this.enableShadows && light.castShadows && obstacles.length > 0) {
        this.renderShadows(screenX, screenY, obstacles, camera, light);
      }

      this.lightCtx.restore();
    }

    // Apply lighting to main canvas
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(this.lightCanvas, 0, 0);
    ctx.restore();
  }

  /**
   * Render a point light
   * @private
   */
  renderPointLight(x, y, radius, light) {
    const gradient = this.lightCtx.createRadialGradient(x, y, 0, x, y, radius);
    
    const intensity = light._currentIntensity || light.intensity;
    const color = this.hexToRgb(light.color);
    
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`);
    gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity * 0.5})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.lightCtx.globalCompositeOperation = 'lighter';
    this.lightCtx.fillStyle = gradient;
    this.lightCtx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  /**
   * Render a spotlight
   * @private
   */
  renderSpotLight(x, y, radius, light) {
    this.lightCtx.save();
    
    // Create cone shape
    this.lightCtx.translate(x, y);
    this.lightCtx.rotate(light.angle);
    
    this.lightCtx.beginPath();
    this.lightCtx.moveTo(0, 0);
    this.lightCtx.arc(0, 0, radius, -light.spread / 2, light.spread / 2);
    this.lightCtx.closePath();
    this.lightCtx.clip();

    // Draw gradient
    const gradient = this.lightCtx.createRadialGradient(0, 0, 0, 0, 0, radius);
    const intensity = light._currentIntensity || light.intensity;
    const color = this.hexToRgb(light.color);
    
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.lightCtx.globalCompositeOperation = 'lighter';
    this.lightCtx.fillStyle = gradient;
    this.lightCtx.fillRect(-radius, -radius, radius * 2, radius * 2);
    
    this.lightCtx.restore();
  }

  /**
   * Render shadows cast by obstacles
   * @private
   */
  renderShadows(lightX, lightY, obstacles, camera, light) {
    this.lightCtx.globalCompositeOperation = 'destination-out';
    this.lightCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';

    for (const obstacle of obstacles) {
      if (!obstacle.config?.castsShadow) continue;

      const obstacleX = (obstacle.position.x - camera.x) * camera.zoom + this.lightCanvas.width / 2;
      const obstacleY = (obstacle.position.y - camera.y) * camera.zoom + this.lightCanvas.height / 2;
      const size = (obstacle.config.width || 32) * camera.zoom;

      // Calculate shadow projection
      const dx = obstacleX - lightX;
      const dy = obstacleY - lightY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > light.radius * camera.zoom) continue;

      const shadowLength = light.radius * camera.zoom * 2;
      const angle = Math.atan2(dy, dx);

      // Draw shadow polygon
      this.lightCtx.beginPath();
      this.lightCtx.moveTo(
        obstacleX - Math.sin(angle) * size / 2,
        obstacleY + Math.cos(angle) * size / 2
      );
      this.lightCtx.lineTo(
        obstacleX + Math.sin(angle) * size / 2,
        obstacleY - Math.cos(angle) * size / 2
      );
      this.lightCtx.lineTo(
        obstacleX + Math.sin(angle) * size / 2 + Math.cos(angle) * shadowLength,
        obstacleY - Math.cos(angle) * size / 2 + Math.sin(angle) * shadowLength
      );
      this.lightCtx.lineTo(
        obstacleX - Math.sin(angle) * size / 2 + Math.cos(angle) * shadowLength,
        obstacleY + Math.cos(angle) * size / 2 + Math.sin(angle) * shadowLength
      );
      this.lightCtx.closePath();
      this.lightCtx.fill();
    }
  }

  /**
   * Convert hex color to RGB
   * @private
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  }

  /**
   * Get light at position
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {number} Light intensity at position (0-1)
   */
  getLightAtPosition(x, y) {
    let totalLight = this.ambientLight;

    for (const [id, light] of this.lights) {
      if (!light.enabled) continue;

      const dx = x - light.position.x;
      const dy = y - light.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < light.radius) {
        const falloff = 1 - (distance / light.radius);
        const intensity = light._currentIntensity || light.intensity;
        totalLight += falloff * intensity;
      }
    }

    return Math.min(1, totalLight);
  }

  /**
   * Clear all lights
   */
  clear() {
    this.lights.clear();
  }

  /**
   * Get statistics
   * @returns {Object} Lighting statistics
   */
  getStats() {
    return {
      lightCount: this.lights.size,
      enabledLights: Array.from(this.lights.values()).filter(l => l.enabled).length,
      shadowsEnabled: this.enableShadows,
      ambientLight: this.ambientLight
    };
  }
}
