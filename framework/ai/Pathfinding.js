/**
 * Pathfinding - A* pathfinding implementation for AI navigation
 * Supports grid-based and waypoint-based pathfinding
 */
export class Pathfinding {
  /**
   * @param {Object} config - Pathfinding configuration
   */
  constructor(config = {}) {
    this.gridSize = config.gridSize || 32;
    this.worldWidth = config.worldWidth || 1000;
    this.worldHeight = config.worldHeight || 1000;
    this.diagonalMovement = config.diagonalMovement !== false;
    this.grid = null;
    this.obstacles = [];
  }

  /**
   * Initialize pathfinding grid
   */
  initializeGrid() {
    const cols = Math.ceil(this.worldWidth / this.gridSize);
    const rows = Math.ceil(this.worldHeight / this.gridSize);
    
    this.grid = [];
    for (let y = 0; y < rows; y++) {
      this.grid[y] = [];
      for (let x = 0; x < cols; x++) {
        this.grid[y][x] = {
          x, y,
          walkable: true,
          cost: 1
        };
      }
    }
  }

  /**
   * Add obstacle to grid
   * @param {Object} obstacle - Obstacle entity
   */
  addObstacle(obstacle) {
    if (!this.grid) this.initializeGrid();

    const size = obstacle.config?.width || 32;
    const minX = Math.floor((obstacle.position.x - size / 2) / this.gridSize);
    const maxX = Math.ceil((obstacle.position.x + size / 2) / this.gridSize);
    const minY = Math.floor((obstacle.position.y - size / 2) / this.gridSize);
    const maxY = Math.ceil((obstacle.position.y + size / 2) / this.gridSize);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (this.grid[y] && this.grid[y][x]) {
          this.grid[y][x].walkable = false;
        }
      }
    }

    this.obstacles.push(obstacle);
  }

  /**
   * Remove obstacle from grid
   * @param {Object} obstacle - Obstacle entity
   */
  removeObstacle(obstacle) {
    const index = this.obstacles.indexOf(obstacle);
    if (index > -1) {
      this.obstacles.splice(index, 1);
    }
    // Rebuild grid
    this.initializeGrid();
    for (const obs of this.obstacles) {
      this.addObstacle(obs);
    }
  }

  /**
   * Find path from start to goal using A* algorithm
   * @param {Object} start - Start position {x, y}
   * @param {Object} goal - Goal position {x, y}
   * @returns {Array} Array of positions forming the path
   */
  findPath(start, goal) {
    if (!this.grid) this.initializeGrid();

    const startNode = this.worldToGrid(start.x, start.y);
    const goalNode = this.worldToGrid(goal.x, goal.y);

    if (!this.isWalkable(startNode.x, startNode.y) || 
        !this.isWalkable(goalNode.x, goalNode.y)) {
      return [];
    }

    const openSet = [startNode];
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    const key = (node) => `${node.x},${node.y}`;
    
    gScore.set(key(startNode), 0);
    fScore.set(key(startNode), this.heuristic(startNode, goalNode));

    while (openSet.length > 0) {
      // Get node with lowest fScore
      let current = openSet[0];
      let currentIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (fScore.get(key(openSet[i])) < fScore.get(key(current))) {
          current = openSet[i];
          currentIndex = i;
        }
      }

      // Check if we reached the goal
      if (current.x === goalNode.x && current.y === goalNode.y) {
        return this.reconstructPath(cameFrom, current);
      }

      openSet.splice(currentIndex, 1);
      closedSet.add(key(current));

      // Check neighbors
      const neighbors = this.getNeighbors(current);
      for (const neighbor of neighbors) {
        const neighborKey = key(neighbor);
        
        if (closedSet.has(neighborKey)) continue;

        const tentativeGScore = gScore.get(key(current)) + neighbor.cost;

        if (!openSet.some(n => key(n) === neighborKey)) {
          openSet.push(neighbor);
        } else if (tentativeGScore >= (gScore.get(neighborKey) || Infinity)) {
          continue;
        }

        cameFrom.set(neighborKey, current);
        gScore.set(neighborKey, tentativeGScore);
        fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, goalNode));
      }
    }

    return []; // No path found
  }

  /**
   * Get neighbors of a node
   * @private
   */
  getNeighbors(node) {
    const neighbors = [];
    const directions = [
      { x: 0, y: -1 },  // North
      { x: 1, y: 0 },   // East
      { x: 0, y: 1 },   // South
      { x: -1, y: 0 }   // West
    ];

    if (this.diagonalMovement) {
      directions.push(
        { x: 1, y: -1 },  // NE
        { x: 1, y: 1 },   // SE
        { x: -1, y: 1 },  // SW
        { x: -1, y: -1 }  // NW
      );
    }

    for (const dir of directions) {
      const newX = node.x + dir.x;
      const newY = node.y + dir.y;

      if (this.isWalkable(newX, newY)) {
        const cost = (dir.x !== 0 && dir.y !== 0) ? 1.414 : 1; // Diagonal cost
        neighbors.push({
          x: newX,
          y: newY,
          cost: this.grid[newY][newX].cost * cost
        });
      }
    }

    return neighbors;
  }

  /**
   * Check if grid position is walkable
   * @private
   */
  isWalkable(x, y) {
    if (y < 0 || y >= this.grid.length || x < 0 || x >= this.grid[0].length) {
      return false;
    }
    return this.grid[y][x].walkable;
  }

  /**
   * Heuristic function (Manhattan distance)
   * @private
   */
  heuristic(a, b) {
    if (this.diagonalMovement) {
      // Diagonal distance
      const dx = Math.abs(a.x - b.x);
      const dy = Math.abs(a.y - b.y);
      return Math.max(dx, dy) + (1.414 - 1) * Math.min(dx, dy);
    } else {
      // Manhattan distance
      return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
  }

  /**
   * Reconstruct path from came_from map
   * @private
   */
  reconstructPath(cameFrom, current) {
    const path = [this.gridToWorld(current.x, current.y)];
    const key = (node) => `${node.x},${node.y}`;

    while (cameFrom.has(key(current))) {
      current = cameFrom.get(key(current));
      path.unshift(this.gridToWorld(current.x, current.y));
    }

    return this.smoothPath(path);
  }

  /**
   * Smooth path by removing unnecessary waypoints
   * @private
   */
  smoothPath(path) {
    if (path.length <= 2) return path;

    const smoothed = [path[0]];
    let current = 0;

    while (current < path.length - 1) {
      let farthest = current + 1;
      
      for (let i = current + 2; i < path.length; i++) {
        if (this.hasLineOfSight(path[current], path[i])) {
          farthest = i;
        } else {
          break;
        }
      }

      smoothed.push(path[farthest]);
      current = farthest;
    }

    return smoothed;
  }

  /**
   * Check if there's line of sight between two points
   * @private
   */
  hasLineOfSight(start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(distance / (this.gridSize / 2));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = start.x + dx * t;
      const y = start.y + dy * t;
      const gridPos = this.worldToGrid(x, y);

      if (!this.isWalkable(gridPos.x, gridPos.y)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Convert world coordinates to grid coordinates
   * @private
   */
  worldToGrid(x, y) {
    return {
      x: Math.floor(x / this.gridSize),
      y: Math.floor(y / this.gridSize)
    };
  }

  /**
   * Convert grid coordinates to world coordinates
   * @private
   */
  gridToWorld(x, y) {
    return {
      x: x * this.gridSize + this.gridSize / 2,
      y: y * this.gridSize + this.gridSize / 2
    };
  }

  /**
   * Set cost for a grid cell
   * @param {number} x - Grid X
   * @param {number} y - Grid Y
   * @param {number} cost - Movement cost
   */
  setCellCost(x, y, cost) {
    if (this.grid && this.grid[y] && this.grid[y][x]) {
      this.grid[y][x].cost = cost;
    }
  }

  /**
   * Debug render the grid
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} camera - Camera object
   */
  debugRender(ctx, camera) {
    if (!this.grid) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.lineWidth = 1;

    for (let y = 0; y < this.grid.length; y++) {
      for (let x = 0; x < this.grid[y].length; x++) {
        const worldPos = this.gridToWorld(x, y);
        const screenX = (worldPos.x - camera.x) * camera.zoom;
        const screenY = (worldPos.y - camera.y) * camera.zoom;
        const size = this.gridSize * camera.zoom;

        // Draw grid cell
        ctx.strokeRect(
          screenX - size / 2,
          screenY - size / 2,
          size,
          size
        );

        // Highlight unwalkable cells
        if (!this.grid[y][x].walkable) {
          ctx.fillRect(
            screenX - size / 2,
            screenY - size / 2,
            size,
            size
          );
        }
      }
    }

    ctx.restore();
  }

  /**
   * Clear all obstacles
   */
  clear() {
    this.obstacles = [];
    this.initializeGrid();
  }
}
