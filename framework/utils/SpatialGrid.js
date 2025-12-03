/**
 * SpatialGrid - Spatial partitioning system for efficient collision detection and queries
 * Divides the game world into a grid for O(1) spatial queries
 */
export class SpatialGrid {
  /**
   * @param {Object} config - Grid configuration
   * @param {number} config.cellSize - Size of each grid cell
   * @param {number} config.worldWidth - Width of the game world
   * @param {number} config.worldHeight - Height of the game world
   */
  constructor(config) {
    this.cellSize = config.cellSize || 100;
    this.worldWidth = config.worldWidth || 1000;
    this.worldHeight = config.worldHeight || 1000;
    
    this.cols = Math.ceil(this.worldWidth / this.cellSize);
    this.rows = Math.ceil(this.worldHeight / this.cellSize);
    
    this.grid = new Map();
    this.entityCells = new Map(); // Track which cells each entity is in
  }

  /**
   * Get grid cell key for a position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {string} Cell key
   * @private
   */
  getCellKey(x, y) {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    return `${col},${row}`;
  }

  /**
   * Get all cell keys that an entity occupies
   * @param {Object} entity - Entity with position and size
   * @returns {Array<string>} Array of cell keys
   * @private
   */
  getEntityCells(entity) {
    const cells = [];
    const size = entity.config?.width || 32;
    const halfSize = size / 2;
    
    const minX = entity.position.x - halfSize;
    const maxX = entity.position.x + halfSize;
    const minY = entity.position.y - halfSize;
    const maxY = entity.position.y + halfSize;
    
    const minCol = Math.floor(minX / this.cellSize);
    const maxCol = Math.floor(maxX / this.cellSize);
    const minRow = Math.floor(minY / this.cellSize);
    const maxRow = Math.floor(maxY / this.cellSize);
    
    for (let col = minCol; col <= maxCol; col++) {
      for (let row = minRow; row <= maxRow; row++) {
        cells.push(`${col},${row}`);
      }
    }
    
    return cells;
  }

  /**
   * Insert an entity into the grid
   * @param {Object} entity - Entity to insert
   */
  insert(entity) {
    if (!entity.id) {
      console.warn('Entity must have an id to be inserted into spatial grid');
      return;
    }

    // Remove from old cells if already tracked
    this.remove(entity);
    
    const cells = this.getEntityCells(entity);
    this.entityCells.set(entity.id, cells);
    
    for (const cellKey of cells) {
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, new Set());
      }
      this.grid.get(cellKey).add(entity);
    }
  }

  /**
   * Remove an entity from the grid
   * @param {Object} entity - Entity to remove
   */
  remove(entity) {
    const cells = this.entityCells.get(entity.id);
    if (!cells) return;
    
    for (const cellKey of cells) {
      const cell = this.grid.get(cellKey);
      if (cell) {
        cell.delete(entity);
        if (cell.size === 0) {
          this.grid.delete(cellKey);
        }
      }
    }
    
    this.entityCells.delete(entity.id);
  }

  /**
   * Update an entity's position in the grid
   * @param {Object} entity - Entity to update
   */
  update(entity) {
    this.insert(entity); // insert handles removal of old cells
  }

  /**
   * Get all entities near a position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} radius - Search radius
   * @returns {Set<Object>} Set of nearby entities
   */
  getNearby(x, y, radius) {
    const nearby = new Set();
    
    // Calculate which cells to check
    const minCol = Math.floor((x - radius) / this.cellSize);
    const maxCol = Math.floor((x + radius) / this.cellSize);
    const minRow = Math.floor((y - radius) / this.cellSize);
    const maxRow = Math.floor((y + radius) / this.cellSize);
    
    for (let col = minCol; col <= maxCol; col++) {
      for (let row = minRow; row <= maxRow; row++) {
        const cellKey = `${col},${row}`;
        const cell = this.grid.get(cellKey);
        if (cell) {
          for (const entity of cell) {
            // Additional distance check for accuracy
            const dx = entity.position.x - x;
            const dy = entity.position.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= radius) {
              nearby.add(entity);
            }
          }
        }
      }
    }
    
    return nearby;
  }

  /**
   * Get all entities in a rectangular area
   * @param {number} x - X coordinate of top-left corner
   * @param {number} y - Y coordinate of top-left corner
   * @param {number} width - Width of rectangle
   * @param {number} height - Height of rectangle
   * @returns {Set<Object>} Set of entities in area
   */
  getInRect(x, y, width, height) {
    const entities = new Set();
    
    const minCol = Math.floor(x / this.cellSize);
    const maxCol = Math.floor((x + width) / this.cellSize);
    const minRow = Math.floor(y / this.cellSize);
    const maxRow = Math.floor((y + height) / this.cellSize);
    
    for (let col = minCol; col <= maxCol; col++) {
      for (let row = minRow; row <= maxRow; row++) {
        const cellKey = `${col},${row}`;
        const cell = this.grid.get(cellKey);
        if (cell) {
          for (const entity of cell) {
            // Check if entity is actually in rectangle
            if (entity.position.x >= x && entity.position.x <= x + width &&
                entity.position.y >= y && entity.position.y <= y + height) {
              entities.add(entity);
            }
          }
        }
      }
    }
    
    return entities;
  }

  /**
   * Get potential collision pairs (entities in same cells)
   * @returns {Array<Array<Object>>} Array of entity pairs
   */
  getPotentialCollisions() {
    const pairs = [];
    const checked = new Set();
    
    for (const [cellKey, entities] of this.grid) {
      const entityArray = Array.from(entities);
      for (let i = 0; i < entityArray.length; i++) {
        for (let j = i + 1; j < entityArray.length; j++) {
          const pairKey = `${entityArray[i].id}-${entityArray[j].id}`;
          if (!checked.has(pairKey)) {
            pairs.push([entityArray[i], entityArray[j]]);
            checked.add(pairKey);
          }
        }
      }
    }
    
    return pairs;
  }

  /**
   * Clear the entire grid
   */
  clear() {
    this.grid.clear();
    this.entityCells.clear();
  }

  /**
   * Get statistics about the grid
   * @returns {Object} Grid statistics
   */
  getStats() {
    let totalEntities = 0;
    let maxEntitiesPerCell = 0;
    let occupiedCells = 0;
    
    for (const [cellKey, entities] of this.grid) {
      occupiedCells++;
      const count = entities.size;
      totalEntities += count;
      maxEntitiesPerCell = Math.max(maxEntitiesPerCell, count);
    }
    
    return {
      totalCells: this.cols * this.rows,
      occupiedCells,
      totalEntities,
      maxEntitiesPerCell,
      averageEntitiesPerCell: occupiedCells > 0 ? totalEntities / occupiedCells : 0
    };
  }

  /**
   * Debug render the grid
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} camera - Camera object
   */
  debugRender(ctx, camera) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
    ctx.lineWidth = 1;
    
    // Draw grid lines
    for (let col = 0; col <= this.cols; col++) {
      const x = (col * this.cellSize - camera.x) * camera.zoom;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.worldHeight * camera.zoom);
      ctx.stroke();
    }
    
    for (let row = 0; row <= this.rows; row++) {
      const y = (row * this.cellSize - camera.y) * camera.zoom;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.worldWidth * camera.zoom, y);
      ctx.stroke();
    }
    
    // Highlight occupied cells
    ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
    for (const [cellKey, entities] of this.grid) {
      if (entities.size > 0) {
        const [col, row] = cellKey.split(',').map(Number);
        const x = (col * this.cellSize - camera.x) * camera.zoom;
        const y = (row * this.cellSize - camera.y) * camera.zoom;
        const size = this.cellSize * camera.zoom;
        ctx.fillRect(x, y, size, size);
        
        // Draw entity count
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '12px monospace';
        ctx.fillText(entities.size.toString(), x + 5, y + 15);
        ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
      }
    }
    
    ctx.restore();
  }
}
