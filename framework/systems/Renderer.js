/**
 * Renderer - Handles all canvas drawing operations
 * Manages camera, entity rendering, and UI display
 */
export class Renderer {
  /**
   * @param {HTMLCanvasElement} canvas - Canvas element to render to
   */
  constructor(canvas) {
    if (!canvas) {
      throw new Error('Canvas element is required');
    }
    
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    if (!this.ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }
    
    this.camera = {
      x: 0,
      y: 0,
      zoom: 1
    };
    
    // Track render calls per frame for testing
    this.renderCallsThisFrame = 0;
    this.lastFrameRenderCalls = 0;
  }

  /**
   * Clear the canvas
   */
  clear() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    
    // Reset render call counter at start of frame
    this.lastFrameRenderCalls = this.renderCallsThisFrame;
    this.renderCallsThisFrame = 0;
  }

  /**
   * Draw an entity on the canvas
   * @param {Object} entity - Entity to draw with position, type, and config
   * @param {boolean} visible - Whether the entity is visible (affects rendering)
   */
  drawEntity(entity, visible = true) {
    if (!entity || !entity.position) {
      return;
    }
    
    // Track render call
    this.renderCallsThisFrame++;
    
    // Don't render invisible entities (or render them dimmed/hidden)
    if (!visible) {
      return;
    }
    
    this.ctx.save();
    
    // Apply camera transformation
    this.ctx.translate(-this.camera.x, -this.camera.y);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    
    // Get entity dimensions from config or use defaults
    const width = entity.config?.width || 32;
    const height = entity.config?.height || 32;
    
    // If entity has a sprite, we would draw it here
    // For now, draw a colored rectangle based on entity type
    const color = this._getEntityColor(entity.type);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      entity.position.x - width / 2,
      entity.position.y - height / 2,
      width,
      height
    );
    
    // Draw entity type label for debugging
    this.ctx.fillStyle = 'white';
    this.ctx.font = '10px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      entity.type,
      entity.position.x,
      entity.position.y - height / 2 - 5
    );
    
    this.ctx.restore();
  }

  /**
   * Draw UI elements (HUD, status bars, inventory, etc.)
   * @param {Object} uiData - UI data structure containing all display information
   */
  drawUI(uiData) {
    if (!uiData) {
      return;
    }
    
    // Update HTML UI if elements exist
    this._updateHTMLUI(uiData);
    
    this.ctx.save();
    
    // UI is drawn in screen space (not affected by camera)
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    const padding = 10;
    let yOffset = padding;
    
    // Draw health if present
    if (uiData.health !== undefined) {
      this._drawStatusBar('Health', uiData.health, uiData.maxHealth || 100, padding, yOffset, '#ff0000');
      yOffset += 30;
    }
    
    // Draw resources if present
    if (uiData.resources && Array.isArray(uiData.resources)) {
      uiData.resources.forEach(resource => {
        this._drawStatusBar(
          resource.name,
          resource.current,
          resource.max,
          padding,
          yOffset,
          '#00aaff'
        );
        yOffset += 30;
      });
    }
    
    // Draw inventory if present
    if (uiData.inventory && Array.isArray(uiData.inventory)) {
      this.ctx.fillStyle = 'white';
      this.ctx.font = '14px Arial';
      this.ctx.fillText('Inventory:', padding, yOffset);
      yOffset += 20;
      
      if (uiData.inventory.length === 0) {
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#888';
        this.ctx.fillText('(empty)', padding + 10, yOffset);
      } else {
        uiData.inventory.forEach((item, index) => {
          this.ctx.font = '12px Arial';
          
          // Highlight selected item
          const isSelected = uiData.inventorySelection === index;
          if (isSelected) {
            // Draw selection background
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            this.ctx.fillRect(padding + 5, yOffset - 12, 200, 16);
            this.ctx.fillStyle = '#ffff00';
          } else {
            this.ctx.fillStyle = 'white';
          }
          
          const itemText = typeof item === 'string' ? item : (item.name || item.type || 'Item');
          const prefix = isSelected ? '> ' : '- ';
          this.ctx.fillText(`${prefix}${itemText}`, padding + 10, yOffset);
          yOffset += 18;
        });
      }
    }
    
    this.ctx.restore();
  }

  /**
   * Update HTML UI elements if they exist
   * @param {Object} uiData - UI data structure
   * @private
   */
  _updateHTMLUI(uiData) {
    // Update health bar
    if (uiData.health !== undefined) {
      const healthBar = document.getElementById('health-bar');
      const healthText = document.getElementById('health-text');
      
      if (healthBar && healthText) {
        const maxHealth = uiData.maxHealth || 100;
        const percentage = (uiData.health / maxHealth) * 100;
        healthBar.style.width = percentage + '%';
        healthText.textContent = `${Math.round(uiData.health)} / ${maxHealth}`;
        
        // Change color if health is low
        if (percentage < 30) {
          healthBar.classList.add('low');
        } else {
          healthBar.classList.remove('low');
        }
      }
    }
    
    // Update resources
    if (uiData.resources && Array.isArray(uiData.resources)) {
      const resourcesContainer = document.getElementById('resources-container');
      
      if (resourcesContainer) {
        // Clear existing resources
        resourcesContainer.innerHTML = '';
        
        // Add each resource
        uiData.resources.forEach(resource => {
          const resourceDiv = document.createElement('div');
          resourceDiv.className = 'stat';
          
          const label = document.createElement('div');
          label.className = 'stat-label';
          label.textContent = resource.name.charAt(0).toUpperCase() + resource.name.slice(1);
          
          const barContainer = document.createElement('div');
          barContainer.className = 'stat-bar';
          
          const barFill = document.createElement('div');
          barFill.className = 'stat-bar-fill';
          const percentage = (resource.current / resource.max) * 100;
          barFill.style.width = percentage + '%';
          
          if (percentage < 30) {
            barFill.classList.add('low');
          }
          
          const barText = document.createElement('div');
          barText.className = 'stat-bar-text';
          barText.textContent = `${resource.current} / ${resource.max}`;
          
          barContainer.appendChild(barFill);
          barContainer.appendChild(barText);
          resourceDiv.appendChild(label);
          resourceDiv.appendChild(barContainer);
          resourcesContainer.appendChild(resourceDiv);
        });
      }
    }
    
    // Update inventory
    if (uiData.inventory && Array.isArray(uiData.inventory)) {
      const inventoryList = document.getElementById('inventory-list');
      
      if (inventoryList) {
        // Clear existing items
        inventoryList.innerHTML = '';
        
        if (uiData.inventory.length === 0) {
          const emptyItem = document.createElement('li');
          emptyItem.className = 'empty-message';
          emptyItem.textContent = 'No items';
          inventoryList.appendChild(emptyItem);
        } else {
          uiData.inventory.forEach((item, index) => {
            const itemElement = document.createElement('li');
            const itemText = typeof item === 'string' ? item : (item.name || item.type || 'Item');
            itemElement.textContent = itemText;
            
            // Add selection class if this item is selected
            if (uiData.inventorySelection === index) {
              itemElement.classList.add('selected');
            }
            
            inventoryList.appendChild(itemElement);
          });
        }
      }
    }
  }

  /**
   * Set camera position and zoom
   * @param {number} x - Camera X position
   * @param {number} y - Camera Y position
   * @param {number} zoom - Camera zoom level (default: 1)
   */
  setCamera(x, y, zoom = 1) {
    this.camera.x = x;
    this.camera.y = y;
    this.camera.zoom = zoom;
  }

  /**
   * Get the number of render calls from the last completed frame
   * @returns {number} Number of entities rendered in last frame
   */
  getLastFrameRenderCalls() {
    return this.lastFrameRenderCalls;
  }

  /**
   * Get entity color based on type
   * @param {string} type - Entity type
   * @returns {string} Color string
   * @private
   */
  _getEntityColor(type) {
    const colorMap = {
      'player': '#00ff00',
      'enemy': '#ff0000',
      'item': '#ffff00',
      'door': '#8b4513',
      'key': '#ffd700',
      'obstacle': '#808080'
    };
    
    return colorMap[type] || '#ffffff';
  }

  /**
   * Draw a status bar (health, resources, etc.)
   * @param {string} label - Status bar label
   * @param {number} current - Current value
   * @param {number} max - Maximum value
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} color - Bar color
   * @private
   */
  _drawStatusBar(label, current, max, x, y, color) {
    const barWidth = 200;
    const barHeight = 20;
    
    // Draw label
    this.ctx.fillStyle = 'white';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${label}: ${current}/${max}`, x, y + 12);
    
    // Draw background
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x, y + 15, barWidth, barHeight);
    
    // Draw filled portion
    const fillWidth = (current / max) * barWidth;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y + 15, fillWidth, barHeight);
    
    // Draw border
    this.ctx.strokeStyle = 'white';
    this.ctx.strokeRect(x, y + 15, barWidth, barHeight);
  }
}
