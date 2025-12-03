import { Entity } from '../../../framework/core/Entity.js';

/**
 * Player entity for puzzle game
 * Handles player movement, inventory, and interactions
 */
export class Player extends Entity {
  /**
   * Create a new Player entity
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} config - Player configuration
   */
  constructor(x, y, config = {}) {
    super(null, 'player', x, y, config);
    
    // Player-specific state
    this.state.speed = config.speed || 100; // pixels per second
    this.state.inventory = [];
    this.state.selectedItemIndex = -1; // Index of currently selected item
    this.state.interactionRadius = config.interactionRadius || 50;
    
    // Player doesn't block movement by default
    this.config.collides = config.collides !== false;
  }

  /**
   * Update player state based on input
   * @param {number} deltaTime - Time elapsed since last update (in seconds)
   * @param {Object} context - Game context with input, scene, etc.
   */
  update(deltaTime, context) {
    if (!context.input) return;

    // Handle inventory input
    this.handleInventoryInput(context.input);

    // Get movement vector from input
    const movement = context.input.getMovementVector();
    
    if (movement.x !== 0 || movement.y !== 0) {
      // Calculate new position
      const newX = this.position.x + movement.x * this.state.speed * deltaTime;
      const newY = this.position.y + movement.y * this.state.speed * deltaTime;
      
      // Check for collisions before moving
      if (context.scene) {
        const collision = this.checkCollision(newX, newY, context.scene);
        if (!collision) {
          this.position.x = newX;
          this.position.y = newY;
        }
      } else {
        // No scene context, just move
        this.position.x = newX;
        this.position.y = newY;
      }
    }
  }

  /**
   * Handle inventory-related input
   * @param {InputHandler} input - Input handler
   */
  handleInventoryInput(input) {
    // Handle number keys for item selection (1-9)
    for (let i = 1; i <= 9; i++) {
      if (input.isKeyPressed(i.toString())) {
        const index = i - 1; // Convert to 0-based index
        if (index < this.state.inventory.length) {
          this.selectItem(index);
        }
      }
    }
    
    // Handle 0 key to deselect
    if (input.isKeyPressed('0')) {
      this.selectItem(-1);
    }
    
    // Handle Tab key to cycle through inventory
    if (input.isKeyPressed('tab')) {
      this.cycleInventorySelection();
    }
  }

  /**
   * Cycle to the next item in inventory
   */
  cycleInventorySelection() {
    if (this.state.inventory.length === 0) {
      this.state.selectedItemIndex = -1;
      return;
    }
    
    this.state.selectedItemIndex = (this.state.selectedItemIndex + 1) % this.state.inventory.length;
  }

  /**
   * Check if moving to a position would cause a collision
   * @param {number} x - Target X position
   * @param {number} y - Target Y position
   * @param {Object} scene - Scene containing entities
   * @returns {Entity|null} Colliding entity or null
   */
  checkCollision(x, y, scene) {
    const entities = scene.getEntities ? scene.getEntities() : scene.entities || [];
    
    for (const entity of entities) {
      if (entity === this || entity.isDeleted()) continue;
      
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
   * Get player inventory
   * @returns {Array} Copy of inventory array
   */
  getInventory() {
    return [...this.state.inventory];
  }

  /**
   * Add item to player inventory
   * @param {Object} item - Item to add
   */
  addToInventory(item) {
    if (!item) return;
    
    // Create a copy of the item to avoid reference issues
    const itemCopy = {
      type: item.type,
      name: item.name || item.type,
      description: item.description || '',
      ...item // Include any additional properties
    };
    
    this.state.inventory.push(itemCopy);
  }

  /**
   * Remove item from inventory by index
   * @param {number} index - Index of item to remove
   * @returns {Object|null} Removed item or null if invalid index
   */
  removeFromInventory(index) {
    if (index < 0 || index >= this.state.inventory.length) {
      return null;
    }
    
    const removedItem = this.state.inventory.splice(index, 1)[0];
    
    // Adjust selected item index if necessary
    if (this.state.selectedItemIndex >= index) {
      this.state.selectedItemIndex = Math.max(-1, this.state.selectedItemIndex - 1);
    }
    
    return removedItem;
  }

  /**
   * Select an item in the inventory
   * @param {number} index - Index of item to select (-1 for no selection)
   */
  selectItem(index) {
    if (index < -1 || index >= this.state.inventory.length) {
      return;
    }
    
    this.state.selectedItemIndex = index;
  }

  /**
   * Get currently selected item
   * @returns {Object|null} Selected item or null if none selected
   */
  getSelectedItem() {
    if (this.state.selectedItemIndex < 0 || this.state.selectedItemIndex >= this.state.inventory.length) {
      return null;
    }
    
    return this.state.inventory[this.state.selectedItemIndex];
  }

  /**
   * Use the currently selected item
   * @param {Object} context - Game context
   * @returns {Object} Result of item usage
   */
  useSelectedItem(context) {
    const selectedItem = this.getSelectedItem();
    if (!selectedItem) {
      return {
        success: false,
        message: 'No item selected',
        action: 'use'
      };
    }
    
    // For now, just return success - specific item usage logic would be implemented per item type
    return {
      success: true,
      message: `Used ${selectedItem.name}`,
      action: 'use',
      item: selectedItem
    };
  }

  /**
   * Get inventory display data
   * @returns {Object} Inventory display information
   */
  getInventoryDisplay() {
    return {
      items: this.getInventory(),
      selectedIndex: this.state.selectedItemIndex,
      count: this.state.inventory.length
    };
  }

  /**
   * Find nearby interactive entities
   * @param {Object} scene - Scene containing entities
   * @returns {Array} Array of nearby interactive entities
   */
  getNearbyInteractives(scene) {
    if (!scene) return [];
    
    const entities = scene.getEntities ? scene.getEntities() : scene.entities || [];
    const nearby = [];
    
    for (const entity of entities) {
      if (entity === this || entity.isDeleted()) continue;
      
      // Check if entity has interaction capability
      if (typeof entity.onInteract !== 'function') continue;
      
      // Calculate distance
      const dx = entity.position.x - this.position.x;
      const dy = entity.position.y - this.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check if within interaction radius
      const entityRadius = entity.state?.interactionRadius || 50;
      if (distance <= Math.max(this.state.interactionRadius, entityRadius)) {
        nearby.push(entity);
      }
    }
    
    return nearby;
  }

  /**
   * Render player
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Object} camera - Camera object
   */
  render(ctx, camera) {
    const screenX = (this.position.x - camera.x) * camera.zoom;
    const screenY = (this.position.y - camera.y) * camera.zoom;
    const size = (this.config.width || 32) * camera.zoom;
    
    // Draw player as a green circle
    ctx.fillStyle = '#44ff44';
    ctx.beginPath();
    ctx.arc(screenX, screenY, size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * camera.zoom;
    ctx.stroke();
  }
}