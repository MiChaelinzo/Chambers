/**
 * DungeonGenerator creates procedural dungeon layouts with rooms and corridors.
 * Ensures all rooms are connected in a reachable graph structure.
 */
export class DungeonGenerator {
  /**
   * Create a new dungeon generator
   * @param {Object} config - Configuration for dungeon generation
   * @param {number} config.width - Dungeon width in tiles
   * @param {number} config.height - Dungeon height in tiles
   * @param {number} config.minRooms - Minimum number of rooms
   * @param {number} config.maxRooms - Maximum number of rooms
   * @param {number} config.minRoomSize - Minimum room dimension
   * @param {number} config.maxRoomSize - Maximum room dimension
   */
  constructor(config = {}) {
    this.width = config.width || 50;
    this.height = config.height || 50;
    this.minRooms = config.minRooms || 5;
    this.maxRooms = config.maxRooms || 10;
    this.minRoomSize = config.minRoomSize || 4;
    this.maxRoomSize = config.maxRoomSize || 10;
  }

  /**
   * Generate a dungeon layout
   * @param {number} seed - Random seed for generation (optional)
   * @returns {Object} Dungeon data with rooms, corridors, and tile map
   */
  generate(seed) {
    // Use seed for deterministic generation if provided
    const rng = seed !== undefined ? this._createSeededRNG(seed) : Math.random;

    // Initialize empty tile map (0 = wall, 1 = floor)
    const tiles = Array(this.height).fill(0).map(() => Array(this.width).fill(0));

    // Generate rooms
    const rooms = this._generateRooms(rng);

    // Place rooms on tile map
    for (const room of rooms) {
      this._carveRoom(tiles, room);
    }

    // Generate corridors connecting rooms
    const corridors = this._generateCorridors(rooms, rng);

    // Carve corridors on tile map
    for (const corridor of corridors) {
      this._carveCorridor(tiles, corridor);
    }

    return {
      width: this.width,
      height: this.height,
      tiles,
      rooms,
      corridors
    };
  }

  /**
   * Generate rooms with collision detection
   * @private
   */
  _generateRooms(rng) {
    const rooms = [];
    const numRooms = Math.floor(rng() * (this.maxRooms - this.minRooms + 1)) + this.minRooms;
    const maxAttempts = 100;

    for (let i = 0; i < numRooms; i++) {
      let attempts = 0;
      let room = null;

      while (attempts < maxAttempts) {
        // Generate random room dimensions
        const width = Math.floor(rng() * (this.maxRoomSize - this.minRoomSize + 1)) + this.minRoomSize;
        const height = Math.floor(rng() * (this.maxRoomSize - this.minRoomSize + 1)) + this.minRoomSize;

        // Generate random position
        const x = Math.floor(rng() * (this.width - width - 2)) + 1;
        const y = Math.floor(rng() * (this.height - height - 2)) + 1;

        room = { x, y, width, height };

        // Check for collisions with existing rooms
        if (!this._roomCollides(room, rooms)) {
          break;
        }

        attempts++;
        room = null;
      }

      if (room) {
        rooms.push(room);
      }
    }

    return rooms;
  }

  /**
   * Check if a room collides with existing rooms
   * @private
   */
  _roomCollides(room, existingRooms) {
    const padding = 1; // Minimum space between rooms

    for (const other of existingRooms) {
      if (
        room.x < other.x + other.width + padding &&
        room.x + room.width + padding > other.x &&
        room.y < other.y + other.height + padding &&
        room.y + room.height + padding > other.y
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate corridors connecting all rooms
   * Uses minimum spanning tree approach to ensure connectivity
   * @private
   */
  _generateCorridors(rooms, rng) {
    if (rooms.length === 0) {
      return [];
    }

    const corridors = [];
    const connected = new Set([0]); // Start with first room
    const unconnected = new Set(rooms.map((_, i) => i).slice(1));

    // Connect rooms using a greedy approach (similar to Prim's algorithm)
    while (unconnected.size > 0) {
      let bestConnection = null;
      let bestDistance = Infinity;

      // Find closest unconnected room to any connected room
      for (const connectedIdx of connected) {
        for (const unconnectedIdx of unconnected) {
          const distance = this._roomDistance(rooms[connectedIdx], rooms[unconnectedIdx]);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestConnection = { from: connectedIdx, to: unconnectedIdx };
          }
        }
      }

      if (bestConnection) {
        // Create corridor between rooms
        const fromRoom = rooms[bestConnection.from];
        const toRoom = rooms[bestConnection.to];
        const corridor = this._createCorridor(fromRoom, toRoom);
        corridors.push(corridor);

        // Mark room as connected
        connected.add(bestConnection.to);
        unconnected.delete(bestConnection.to);
      } else {
        // Safety: shouldn't happen, but break if no connection found
        break;
      }
    }

    return corridors;
  }

  /**
   * Calculate distance between room centers
   * @private
   */
  _roomDistance(room1, room2) {
    const center1 = this._getRoomCenter(room1);
    const center2 = this._getRoomCenter(room2);
    const dx = center2.x - center1.x;
    const dy = center2.y - center1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get the center point of a room
   * @private
   */
  _getRoomCenter(room) {
    return {
      x: Math.floor(room.x + room.width / 2),
      y: Math.floor(room.y + room.height / 2)
    };
  }

  /**
   * Create a corridor between two rooms
   * Uses L-shaped corridors (horizontal then vertical, or vice versa)
   * @private
   */
  _createCorridor(room1, room2) {
    const center1 = this._getRoomCenter(room1);
    const center2 = this._getRoomCenter(room2);

    // Create L-shaped corridor
    return {
      start: center1,
      end: center2,
      segments: [
        { x1: center1.x, y1: center1.y, x2: center2.x, y2: center1.y }, // Horizontal
        { x1: center2.x, y1: center1.y, x2: center2.x, y2: center2.y }  // Vertical
      ]
    };
  }

  /**
   * Carve a room into the tile map
   * @private
   */
  _carveRoom(tiles, room) {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
          tiles[y][x] = 1; // 1 = floor
        }
      }
    }
  }

  /**
   * Carve a corridor into the tile map
   * @private
   */
  _carveCorridor(tiles, corridor) {
    for (const segment of corridor.segments) {
      const x1 = Math.min(segment.x1, segment.x2);
      const x2 = Math.max(segment.x1, segment.x2);
      const y1 = Math.min(segment.y1, segment.y2);
      const y2 = Math.max(segment.y1, segment.y2);

      for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
          if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
            tiles[y][x] = 1; // 1 = floor
          }
        }
      }
    }
  }

  /**
   * Create a seeded random number generator
   * @private
   */
  _createSeededRNG(seed) {
    let state = seed;
    return function() {
      // Simple LCG (Linear Congruential Generator)
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }

  /**
   * Check if all rooms are reachable (for testing/validation)
   * @param {Object} dungeon - Generated dungeon data
   * @returns {boolean} True if all rooms are connected
   */
  static isFullyConnected(dungeon) {
    if (!dungeon.rooms || dungeon.rooms.length === 0) {
      return true;
    }

    // Build adjacency graph from corridors
    const graph = new Map();
    for (let i = 0; i < dungeon.rooms.length; i++) {
      graph.set(i, new Set());
    }

    // Add edges based on corridors
    // For simplicity, we'll use a flood fill on the tile map
    const visited = new Set();
    const queue = [];

    // Start from first room's center
    const firstRoom = dungeon.rooms[0];
    const startX = Math.floor(firstRoom.x + firstRoom.width / 2);
    const startY = Math.floor(firstRoom.y + firstRoom.height / 2);

    queue.push({ x: startX, y: startY });
    visited.add(`${startX},${startY}`);

    // Flood fill to find all reachable tiles
    while (queue.length > 0) {
      const { x, y } = queue.shift();

      // Check all 4 directions
      const directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 }
      ];

      for (const { dx, dy } of directions) {
        const nx = x + dx;
        const ny = y + dy;
        const key = `${nx},${ny}`;

        if (
          nx >= 0 && nx < dungeon.width &&
          ny >= 0 && ny < dungeon.height &&
          dungeon.tiles[ny][nx] === 1 &&
          !visited.has(key)
        ) {
          visited.add(key);
          queue.push({ x: nx, y: ny });
        }
      }
    }

    // Check if all room centers are reachable
    for (const room of dungeon.rooms) {
      const centerX = Math.floor(room.x + room.width / 2);
      const centerY = Math.floor(room.y + room.height / 2);
      const key = `${centerX},${centerY}`;

      if (!visited.has(key)) {
        return false;
      }
    }

    return true;
  }
}
