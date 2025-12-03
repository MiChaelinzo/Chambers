/**
 * Unit tests for DungeonScene - Permadeath and regeneration
 */
import { DungeonScene } from '../../../games/dungeon-crawler/DungeonScene.js';
import { Entity } from '../../../framework/core/Entity.js';

describe('DungeonScene - Permadeath and Regeneration', () => {
  beforeEach(() => {
    Entity.resetIdCounter();
  });

  describe('Scene Generation', () => {
    test('generates dungeon on load', () => {
      const config = {
        generator: {
          width: 30,
          height: 30,
          minRooms: 3,
          maxRooms: 5
        },
        player: { health: 100, speed: 100 },
        enemies: { count: 2, config: {} },
        items: { count: 1, config: {} }
      };

      const scene = new DungeonScene('test-dungeon', config);
      scene.load();

      expect(scene.dungeon).toBeDefined();
      expect(scene.dungeon.rooms).toBeDefined();
      expect(scene.dungeon.rooms.length).toBeGreaterThanOrEqual(3);
      expect(scene.dungeon.rooms.length).toBeLessThanOrEqual(5);
    });

    test('spawns player in first room', () => {
      const config = {
        generator: { width: 30, height: 30, minRooms: 2, maxRooms: 3 },
        player: { health: 100, speed: 100 },
        enemies: { count: 0, config: {} },
        items: { count: 0, config: {} }
      };

      const scene = new DungeonScene('test-dungeon', config);
      scene.load();

      const players = scene.getEntitiesByType('player');
      expect(players.length).toBe(1);

      const player = players[0];
      const firstRoom = scene.dungeon.rooms[0];

      // Player should be in the first room
      expect(player.position.x).toBeGreaterThanOrEqual(firstRoom.x);
      expect(player.position.x).toBeLessThan(firstRoom.x + firstRoom.width);
      expect(player.position.y).toBeGreaterThanOrEqual(firstRoom.y);
      expect(player.position.y).toBeLessThan(firstRoom.y + firstRoom.height);
    });

    test('spawns enemies in rooms', () => {
      const config = {
        generator: { width: 30, height: 30, minRooms: 5, maxRooms: 5 },
        player: { health: 100, speed: 100 },
        enemies: { count: 3, config: { health: 30 } },
        items: { count: 0, config: {} }
      };

      const scene = new DungeonScene('test-dungeon', config);
      scene.load();

      const enemies = scene.getEntitiesByType('enemy');
      expect(enemies.length).toBe(3);

      // Each enemy should be in a room
      enemies.forEach(enemy => {
        const inRoom = scene.dungeon.rooms.some(room => {
          return (
            enemy.position.x >= room.x &&
            enemy.position.x < room.x + room.width &&
            enemy.position.y >= room.y &&
            enemy.position.y < room.y + room.height
          );
        });
        expect(inRoom).toBe(true);
      });
    });

    test('spawns items in rooms', () => {
      const config = {
        generator: { width: 30, height: 30, minRooms: 5, maxRooms: 5 },
        player: { health: 100, speed: 100 },
        enemies: { count: 0, config: {} },
        items: { count: 2, config: { type: 'health_potion' } }
      };

      const scene = new DungeonScene('test-dungeon', config);
      scene.load();

      const items = scene.getEntitiesByType('item');
      expect(items.length).toBe(2);
    });
  });

  describe('Regeneration', () => {
    test('regenerate creates new dungeon with different seed', () => {
      const config = {
        generator: { width: 30, height: 30, minRooms: 3, maxRooms: 5 },
        player: { health: 100, speed: 100 },
        enemies: { count: 2, config: {} },
        items: { count: 1, config: {} },
        seed: 12345
      };

      const scene = new DungeonScene('test-dungeon', config);
      scene.load();

      const firstSeed = scene.getSeed();
      const firstDungeon = scene.getDungeon();
      const firstRoomCount = firstDungeon.rooms.length;

      // Regenerate with new seed
      scene.regenerate(67890);

      const secondSeed = scene.getSeed();
      const secondDungeon = scene.getDungeon();

      // Seeds should be different
      expect(secondSeed).not.toBe(firstSeed);
      expect(secondSeed).toBe(67890);

      // Dungeons should be different (different object references)
      expect(secondDungeon).not.toBe(firstDungeon);

      // Both should have valid room counts
      expect(secondDungeon.rooms.length).toBeGreaterThanOrEqual(3);
      expect(secondDungeon.rooms.length).toBeLessThanOrEqual(5);
    });

    test('regenerate without seed uses timestamp', () => {
      const config = {
        generator: { width: 30, height: 30, minRooms: 3, maxRooms: 5 },
        player: { health: 100, speed: 100 },
        enemies: { count: 0, config: {} },
        items: { count: 0, config: {} },
        seed: 12345
      };

      const scene = new DungeonScene('test-dungeon', config);
      scene.load();

      const firstSeed = scene.getSeed();
      expect(firstSeed).toBe(12345);

      // Regenerate without providing seed
      const beforeRegen = Date.now();
      scene.regenerate();
      const afterRegen = Date.now();

      const newSeed = scene.getSeed();

      // New seed should be a timestamp
      expect(newSeed).toBeGreaterThanOrEqual(beforeRegen);
      expect(newSeed).toBeLessThanOrEqual(afterRegen);
      expect(newSeed).not.toBe(firstSeed);
    });

    test('regenerate clears old entities and spawns new ones', () => {
      const config = {
        generator: { width: 30, height: 30, minRooms: 5, maxRooms: 5 },
        player: { health: 100, speed: 100 },
        enemies: { count: 3, config: {} },
        items: { count: 2, config: {} }
      };

      const scene = new DungeonScene('test-dungeon', config);
      scene.load();

      const firstPlayer = scene.getEntitiesByType('player')[0];
      const firstPlayerId = firstPlayer.getId();

      // Regenerate
      scene.regenerate();

      const secondPlayer = scene.getEntitiesByType('player')[0];
      const secondPlayerId = secondPlayer.getId();

      // Should have new entities (different IDs)
      expect(secondPlayerId).not.toBe(firstPlayerId);

      // Should still have correct counts
      expect(scene.getEntitiesByType('player').length).toBe(1);
      expect(scene.getEntitiesByType('enemy').length).toBe(3);
      expect(scene.getEntitiesByType('item').length).toBe(2);
    });

    test('regenerate respawns player at starting position', () => {
      const config = {
        generator: { width: 30, height: 30, minRooms: 3, maxRooms: 5 },
        player: { health: 100, speed: 100 },
        enemies: { count: 0, config: {} },
        items: { count: 0, config: {} }
      };

      const scene = new DungeonScene('test-dungeon', config);
      scene.load();

      // Regenerate multiple times
      for (let i = 0; i < 3; i++) {
        scene.regenerate();

        const player = scene.getEntitiesByType('player')[0];
        const firstRoom = scene.dungeon.rooms[0];

        // Player should always be in first room after regeneration
        expect(player.position.x).toBeGreaterThanOrEqual(firstRoom.x);
        expect(player.position.x).toBeLessThan(firstRoom.x + firstRoom.width);
        expect(player.position.y).toBeGreaterThanOrEqual(firstRoom.y);
        expect(player.position.y).toBeLessThan(firstRoom.y + firstRoom.height);
      }
    });

    test('regenerate maintains scene configuration', () => {
      const config = {
        generator: { width: 40, height: 40, minRooms: 4, maxRooms: 6 },
        player: { health: 100, speed: 100 },
        enemies: { count: 5, config: { health: 30 } },
        items: { count: 3, config: { type: 'potion' } }
      };

      const scene = new DungeonScene('test-dungeon', config);
      scene.load();

      // Regenerate
      scene.regenerate();

      // Configuration should be maintained
      expect(scene.dungeon.width).toBe(40);
      expect(scene.dungeon.height).toBe(40);
      expect(scene.getEntitiesByType('enemy').length).toBe(5);
      expect(scene.getEntitiesByType('item').length).toBe(3);
    });
  });

  describe('Seed Determinism', () => {
    test('same seed produces same dungeon layout', () => {
      const config = {
        generator: { width: 30, height: 30, minRooms: 3, maxRooms: 5 },
        player: { health: 100, speed: 100 },
        enemies: { count: 0, config: {} },
        items: { count: 0, config: {} },
        seed: 99999
      };

      const scene1 = new DungeonScene('dungeon1', config);
      scene1.load();

      const scene2 = new DungeonScene('dungeon2', config);
      scene2.load();

      // Both should have same room count
      expect(scene1.dungeon.rooms.length).toBe(scene2.dungeon.rooms.length);

      // Rooms should be in same positions
      for (let i = 0; i < scene1.dungeon.rooms.length; i++) {
        expect(scene1.dungeon.rooms[i].x).toBe(scene2.dungeon.rooms[i].x);
        expect(scene1.dungeon.rooms[i].y).toBe(scene2.dungeon.rooms[i].y);
        expect(scene1.dungeon.rooms[i].width).toBe(scene2.dungeon.rooms[i].width);
        expect(scene1.dungeon.rooms[i].height).toBe(scene2.dungeon.rooms[i].height);
      }
    });
  });
});
