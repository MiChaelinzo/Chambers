import { describe, test, expect } from '@jest/globals';
import { DungeonGenerator } from '../../../games/dungeon-crawler/generation/DungeonGenerator.js';

describe('DungeonGenerator Unit Tests', () => {
  test('generates a dungeon with basic configuration', () => {
    const generator = new DungeonGenerator({
      width: 50,
      height: 50,
      minRooms: 5,
      maxRooms: 10,
      minRoomSize: 4,
      maxRoomSize: 10
    });

    const dungeon = generator.generate(12345);

    expect(dungeon).toBeDefined();
    expect(dungeon.width).toBe(50);
    expect(dungeon.height).toBe(50);
    expect(dungeon.rooms).toBeDefined();
    expect(dungeon.corridors).toBeDefined();
    expect(dungeon.tiles).toBeDefined();
    expect(dungeon.rooms.length).toBeGreaterThanOrEqual(0);
  });

  test('generates connected dungeon', () => {
    const generator = new DungeonGenerator({
      width: 40,
      height: 40,
      minRooms: 5,
      maxRooms: 8,
      minRoomSize: 4,
      maxRoomSize: 8
    });

    const dungeon = generator.generate(54321);

    // Check connectivity
    const isConnected = DungeonGenerator.isFullyConnected(dungeon);
    expect(isConnected).toBe(true);
  });

  test('handles small dungeon configuration', () => {
    const generator = new DungeonGenerator({
      width: 30,
      height: 30,
      minRooms: 3,
      maxRooms: 5,
      minRoomSize: 3,
      maxRoomSize: 6
    });

    const dungeon = generator.generate(99999);

    expect(dungeon.rooms.length).toBeGreaterThanOrEqual(0);
    expect(DungeonGenerator.isFullyConnected(dungeon)).toBe(true);
  });

  test('same seed produces same dungeon', () => {
    const config = {
      width: 40,
      height: 40,
      minRooms: 5,
      maxRooms: 8,
      minRoomSize: 4,
      maxRoomSize: 8
    };

    const generator1 = new DungeonGenerator(config);
    const generator2 = new DungeonGenerator(config);

    const dungeon1 = generator1.generate(42);
    const dungeon2 = generator2.generate(42);

    expect(dungeon1.rooms.length).toBe(dungeon2.rooms.length);
    expect(dungeon1.rooms).toEqual(dungeon2.rooms);
  });

  test('rooms are within bounds', () => {
    const generator = new DungeonGenerator({
      width: 50,
      height: 50,
      minRooms: 5,
      maxRooms: 10,
      minRoomSize: 4,
      maxRoomSize: 10
    });

    const dungeon = generator.generate(777);

    for (const room of dungeon.rooms) {
      expect(room.x).toBeGreaterThanOrEqual(0);
      expect(room.y).toBeGreaterThanOrEqual(0);
      expect(room.x + room.width).toBeLessThanOrEqual(50);
      expect(room.y + room.height).toBeLessThanOrEqual(50);
    }
  });

  test('handles empty dungeon (no rooms fit)', () => {
    const generator = new DungeonGenerator({
      width: 10,
      height: 10,
      minRooms: 5,
      maxRooms: 10,
      minRoomSize: 8,
      maxRoomSize: 12
    });

    const dungeon = generator.generate(123);

    // Should handle gracefully even if no rooms fit
    expect(dungeon).toBeDefined();
    expect(DungeonGenerator.isFullyConnected(dungeon)).toBe(true);
  });
});
