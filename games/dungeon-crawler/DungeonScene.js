import { Scene } from '../../framework/core/Scene.js';
import { DungeonGenerator } from './generation/DungeonGenerator.js';
import { Player } from './entities/Player.js';
import { Enemy } from './entities/Enemy.js';
import { Item } from './entities/Item.js';

/**
 * DungeonScene - A procedurally generated dungeon scene for the dungeon crawler game
 * Supports regeneration with new seeds for permadeath functionality
 */
export class DungeonScene extends Scene {
  /**
   * Create a new dungeon scene
   * @param {string} id - Scene identifier
   * @param {Object} config - Scene configuration
   * @param {Object} config.generator - Dungeon generator configuration
   * @param {Object} config.player - Player configuration
   * @param {Object} config.enemies - Enemy spawn configuration
   * @param {Object} config.items - Item spawn configuration
   */
  constructor(id, config = {}) {
    super(id, config);
    
    this.generatorConfig = config.generator || {};
    this.playerConfig = config.player || {};
    this.enemyConfig = config.enemies || {};
    this.itemConfig = config.items || {};
    
    this.currentSeed = config.seed || Date.now();
    this.dungeon = null;
  }

  /**
   * Load the scene - generate dungeon and spawn entities
   */
  load() {
    if (this.isLoaded) {
      return;
    }

    // Generate the dungeon
    this._generateDungeon(this.currentSeed);

    // Spawn entities
    this._spawnPlayer();
    this._spawnEnemies();
    this._spawnItems();

    this.isLoaded = true;
  }

  /**
   * Regenerate the dungeon with a new seed
   * This is used for permadeath - creates a completely new dungeon
   * @param {number} newSeed - Optional seed for generation (defaults to timestamp)
   */
  regenerate(newSeed) {
    // Generate new seed if not provided
    this.currentSeed = newSeed !== undefined ? newSeed : Date.now();

    // Unload current scene
    this.unload();

    // Reload with new dungeon
    this.load();
  }

  /**
   * Generate the dungeon layout
   * @private
   */
  _generateDungeon(seed) {
    const generator = new DungeonGenerator(this.generatorConfig);
    this.dungeon = generator.generate(seed);
  }

  /**
   * Spawn the player at the starting position
   * @private
   */
  _spawnPlayer() {
    if (!this.dungeon || !this.dungeon.rooms || this.dungeon.rooms.length === 0) {
      throw new Error('Cannot spawn player: no rooms in dungeon');
    }

    // Spawn player in the center of the first room
    const startRoom = this.dungeon.rooms[0];
    const spawnX = startRoom.x + Math.floor(startRoom.width / 2);
    const spawnY = startRoom.y + Math.floor(startRoom.height / 2);

    const player = new Player(spawnX, spawnY, this.playerConfig);
    this.addEntity(player);
  }

  /**
   * Spawn enemies in random rooms
   * @private
   */
  _spawnEnemies() {
    if (!this.dungeon || !this.dungeon.rooms) {
      return;
    }

    const count = this.enemyConfig.count || 5;
    const enemyConfig = this.enemyConfig.config || {};

    // Skip the first room (player spawn)
    const spawnRooms = this.dungeon.rooms.slice(1);

    // If no rooms available (only 1 room total), use all rooms
    const availableRooms = spawnRooms.length > 0 ? spawnRooms : this.dungeon.rooms;

    for (let i = 0; i < count; i++) {
      const room = availableRooms[i % availableRooms.length];
      
      // Random position within the room
      const x = room.x + Math.floor(Math.random() * room.width);
      const y = room.y + Math.floor(Math.random() * room.height);

      const enemy = new Enemy(x, y, enemyConfig);
      this.addEntity(enemy);
    }
  }

  /**
   * Spawn items in random rooms
   * @private
   */
  _spawnItems() {
    if (!this.dungeon || !this.dungeon.rooms) {
      return;
    }

    const count = this.itemConfig.count || 3;
    const itemConfig = this.itemConfig.config || {};

    // Can spawn in any room including first
    const spawnRooms = this.dungeon.rooms;

    for (let i = 0; i < count; i++) {
      const room = spawnRooms[i % spawnRooms.length];
      
      // Random position within the room
      const x = room.x + Math.floor(Math.random() * room.width);
      const y = room.y + Math.floor(Math.random() * room.height);

      const item = new Item(x, y, itemConfig);
      this.addEntity(item);
    }
  }

  /**
   * Get the current dungeon data
   * @returns {Object} Dungeon layout data
   */
  getDungeon() {
    return this.dungeon;
  }

  /**
   * Get the current seed
   * @returns {number} Current generation seed
   */
  getSeed() {
    return this.currentSeed;
  }

  /**
   * Update scene - handle entity updates and player combat
   * @param {number} deltaTime - Time elapsed since last update (in seconds)
   * @param {Object} context - Game context
   */
  update(deltaTime, context) {
    // Call parent update to update all entities
    super.update(deltaTime, context);

    // Handle player attacking enemies
    this._handlePlayerCombat();
  }

  /**
   * Handle player attacking enemies on collision
   * Enemies handle their own attacks via their update method
   * @private
   */
  _handlePlayerCombat() {
    const entities = this.getAllEntities();
    const player = entities.find(e => e.type === 'player' && !e.isDeleted());
    
    if (!player) return;

    // Check player collisions with enemies
    for (const entity of entities) {
      if (entity.type !== 'enemy' || entity.isDeleted()) continue;

      const distance = this._getDistance(player.position, entity.position);
      const playerRadius = player.config.width ? player.config.width / 2 : 16;
      const entityRadius = entity.config.width ? entity.config.width / 2 : 16;

      if (distance < playerRadius + entityRadius) {
        // Player attacks enemy on collision
        if (entity.takeDamage && player.state.damage) {
          entity.takeDamage(player.state.damage);
        }
      }
    }
  }

  /**
   * Calculate distance between two positions
   * @param {Object} pos1 - First position {x, y}
   * @param {Object} pos2 - Second position {x, y}
   * @returns {number} Distance
   * @private
   */
  _getDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
