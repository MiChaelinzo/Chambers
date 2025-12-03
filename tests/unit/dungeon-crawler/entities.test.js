import { Player } from '../../../games/dungeon-crawler/entities/Player.js';
import { Enemy } from '../../../games/dungeon-crawler/entities/Enemy.js';
import { Item } from '../../../games/dungeon-crawler/entities/Item.js';
import { Entity } from '../../../framework/core/Entity.js';

describe('Dungeon Crawler Entity Types', () => {
  beforeEach(() => {
    Entity.resetIdCounter();
  });

  describe('Player Entity', () => {
    test('should create player with correct initial state', () => {
      const player = new Player(100, 200, { health: 100, speed: 150 });
      
      expect(player.type).toBe('player');
      expect(player.position.x).toBe(100);
      expect(player.position.y).toBe(200);
      expect(player.state.health).toBe(100);
      expect(player.state.maxHealth).toBe(100);
      expect(player.state.speed).toBe(150);
      expect(player.state.inventory).toEqual([]);
    });

    test('should move based on input', () => {
      const player = new Player(100, 100);
      const mockInput = {
        getMovementVector: () => ({ x: 1, y: 0 })
      };
      
      player.update(0.1, { input: mockInput });
      
      expect(player.position.x).toBeGreaterThan(100);
      expect(player.position.y).toBe(100);
    });

    test('should take damage and track health', () => {
      const player = new Player(100, 100, { health: 100 });
      
      player.takeDamage(30);
      expect(player.state.health).toBe(70);
      
      player.takeDamage(80);
      expect(player.state.health).toBe(0);
      expect(player.isDead()).toBe(true);
    });

    test('should heal but not exceed max health', () => {
      const player = new Player(100, 100, { health: 100 });
      player.state.health = 50;
      
      player.heal(30);
      expect(player.state.health).toBe(80);
      
      player.heal(50);
      expect(player.state.health).toBe(100);
    });

    test('should add items to inventory', () => {
      const player = new Player(100, 100);
      
      player.addToInventory({ type: 'health', value: 20 });
      player.addToInventory({ type: 'weapon', value: 5 });
      
      expect(player.state.inventory.length).toBe(2);
      expect(player.getInventory()).toHaveLength(2);
    });

    test('should detect collision with other entities', () => {
      const player = new Player(100, 100, { width: 32 });
      const obstacle = new Entity(null, 'wall', 120, 100, { width: 32, collides: true });
      const scene = { entities: [player, obstacle] };
      
      const collision = player.checkCollision(120, 100, scene);
      expect(collision).toBe(obstacle);
    });
  });

  describe('Enemy Entity', () => {
    test('should create enemy with correct initial state', () => {
      const enemy = new Enemy(100, 200, { health: 50, speed: 75, damage: 15 });
      
      expect(enemy.type).toBe('enemy');
      expect(enemy.position.x).toBe(100);
      expect(enemy.position.y).toBe(200);
      expect(enemy.state.health).toBe(50);
      expect(enemy.state.maxHealth).toBe(50);
      expect(enemy.state.speed).toBe(75);
      expect(enemy.state.damage).toBe(15);
    });

    test('should chase player when in range', () => {
      const player = new Player(200, 100);
      const enemy = new Enemy(100, 100, { chaseRadius: 200, speed: 100 });
      const scene = { entities: [player, enemy] };
      
      const initialX = enemy.position.x;
      enemy.update(0.1, { scene });
      
      // Enemy should move towards player
      expect(enemy.position.x).toBeGreaterThan(initialX);
    });

    test('should not chase player when out of range', () => {
      const player = new Player(500, 100);
      const enemy = new Enemy(100, 100, { chaseRadius: 200, speed: 100 });
      const scene = { entities: [player, enemy] };
      
      const initialX = enemy.position.x;
      enemy.update(0.1, { scene });
      
      // Enemy should not move
      expect(enemy.position.x).toBe(initialX);
    });

    test('should attack player when in attack range', () => {
      const player = new Player(110, 100, { health: 100 });
      const initialHealth = player.state.health;
      
      const enemy = new Enemy(100, 100, { attackRadius: 32, damage: 10, attackRate: 1 });
      const scene = { entities: [player, enemy] };
      
      enemy.update(0.1, { scene });
      
      // Player should have taken damage
      expect(player.state.health).toBe(initialHealth - 10);
    });

    test('should take damage and die when health reaches zero', () => {
      const enemy = new Enemy(100, 100, { health: 30 });
      
      enemy.takeDamage(15);
      expect(enemy.state.health).toBe(15);
      expect(enemy.isDead()).toBe(false);
      
      enemy.takeDamage(20);
      expect(enemy.state.health).toBe(0);
      expect(enemy.isDead()).toBe(true);
      expect(enemy.isDeleted()).toBe(true);
    });

    test('should find player in scene', () => {
      const player = new Player(200, 100);
      const enemy = new Enemy(100, 100);
      const scene = { entities: [player, enemy] };
      
      const foundPlayer = enemy.findPlayer(scene);
      expect(foundPlayer).toBe(player);
    });
  });

  describe('Item Entity', () => {
    test('should create item with correct initial state', () => {
      const item = new Item(100, 200, { itemType: 'health', value: 25 });
      
      expect(item.type).toBe('item');
      expect(item.position.x).toBe(100);
      expect(item.position.y).toBe(200);
      expect(item.state.itemType).toBe('health');
      expect(item.state.value).toBe(25);
      expect(item.state.collected).toBe(false);
      expect(item.config.collides).toBe(false);
    });

    test('should be collected by player when in range', () => {
      const player = new Player(100, 100);
      const item = new Item(110, 100, { itemType: 'health', value: 20, collectionRadius: 32 });
      const scene = { entities: [player, item] };
      
      item.update(0.1, { scene });
      
      expect(item.state.collected).toBe(true);
      expect(item.isDeleted()).toBe(true);
      expect(player.state.inventory.length).toBe(1);
    });

    test('should not be collected when out of range', () => {
      const player = new Player(100, 100);
      const item = new Item(200, 100, { itemType: 'health', value: 20, collectionRadius: 32 });
      const scene = { entities: [player, item] };
      
      item.update(0.1, { scene });
      
      expect(item.state.collected).toBe(false);
      expect(item.isDeleted()).toBe(false);
    });

    test('should apply health effect when collected', () => {
      const player = new Player(100, 100, { health: 100 });
      player.state.health = 50;
      
      const item = new Item(100, 100, { itemType: 'health', value: 30 });
      item.collect(player);
      
      expect(player.state.health).toBe(80);
      expect(item.state.collected).toBe(true);
    });

    test('should apply weapon effect when collected', () => {
      const player = new Player(100, 100);
      player.state.damage = 10;
      
      const item = new Item(100, 100, { itemType: 'weapon', value: 5 });
      item.collect(player);
      
      expect(player.state.damage).toBe(15);
    });

    test('should apply speed effect when collected', () => {
      const player = new Player(100, 100);
      player.state.speed = 100;
      
      const item = new Item(100, 100, { itemType: 'speed', value: 20 });
      item.collect(player);
      
      expect(player.state.speed).toBe(120);
    });

    test('should handle interaction', () => {
      const player = new Player(100, 100);
      const item = new Item(100, 100, { itemType: 'health', value: 20, name: 'Health Potion' });
      
      const result = item.onInteract(player, {});
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Health Potion');
      expect(item.state.collected).toBe(true);
    });
  });

  describe('Collision Detection', () => {
    test('player should not collide with non-collidable entities', () => {
      const player = new Player(100, 100, { width: 32 });
      const item = new Item(110, 100, { width: 24, collides: false });
      const scene = { entities: [player, item] };
      
      const collision = player.checkCollision(110, 100, scene);
      expect(collision).toBeNull();
    });

    test('enemy should not collide with player during chase', () => {
      const player = new Player(200, 100, { width: 32 });
      const enemy = new Enemy(100, 100, { width: 32 });
      const scene = { entities: [player, enemy] };
      
      // Enemy should be able to move towards player position
      const collision = enemy.checkCollision(200, 100, scene, player);
      expect(collision).toBeNull();
    });

    test('entities should collide when overlapping', () => {
      const player = new Player(100, 100, { width: 32 });
      const wall = new Entity(null, 'wall', 120, 100, { width: 32, collides: true });
      const scene = { entities: [player, wall] };
      
      const collision = player.checkCollision(120, 100, scene);
      expect(collision).toBe(wall);
    });
  });
});
