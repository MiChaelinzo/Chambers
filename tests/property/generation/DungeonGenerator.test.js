import { describe, test, expect } from '@jest/globals';
import fc from 'fast-check';
import { DungeonGenerator } from '../../../games/dungeon-crawler/generation/DungeonGenerator.js';

describe('DungeonGenerator Property Tests', () => {
  // Feature: skeleton-crew-framework, Property 12: Dungeon generation connectivity
  // Validates: Requirements 4.1
  test('all generated dungeons have fully connected rooms', () => {
    fc.assert(
      fc.property(
        // Generate random dungeon configuration
        fc.record({
          width: fc.integer({ min: 30, max: 100 }),
          height: fc.integer({ min: 30, max: 100 }),
          minRooms: fc.integer({ min: 3, max: 8 }),
          maxRooms: fc.integer({ min: 8, max: 15 }),
          minRoomSize: fc.integer({ min: 3, max: 6 }),
          maxRoomSize: fc.integer({ min: 6, max: 12 }),
          seed: fc.integer({ min: 0, max: 1000000 })
        }),
        (config) => {
          // Ensure maxRooms >= minRooms and maxRoomSize >= minRoomSize
          const validConfig = {
            width: config.width,
            height: config.height,
            minRooms: Math.min(config.minRooms, config.maxRooms),
            maxRooms: Math.max(config.minRooms, config.maxRooms),
            minRoomSize: Math.min(config.minRoomSize, config.maxRoomSize),
            maxRoomSize: Math.max(config.minRoomSize, config.maxRoomSize)
          };

          // Generate dungeon
          const generator = new DungeonGenerator(validConfig);
          const dungeon = generator.generate(config.seed);

          // Property: All rooms should be reachable from any other room
          const isConnected = DungeonGenerator.isFullyConnected(dungeon);

          // Additional checks
          expect(dungeon.rooms).toBeDefined();
          expect(dungeon.corridors).toBeDefined();
          expect(dungeon.tiles).toBeDefined();
          expect(dungeon.width).toBe(validConfig.width);
          expect(dungeon.height).toBe(validConfig.height);

          // If there are rooms, they must all be connected
          if (dungeon.rooms.length > 0) {
            expect(isConnected).toBe(true);
          }

          return isConnected || dungeon.rooms.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('dungeons with same seed produce identical layouts', () => {
    fc.assert(
      fc.property(
        fc.record({
          width: fc.integer({ min: 30, max: 60 }),
          height: fc.integer({ min: 30, max: 60 }),
          minRooms: fc.integer({ min: 3, max: 5 }),
          maxRooms: fc.integer({ min: 5, max: 8 }),
          minRoomSize: fc.integer({ min: 3, max: 5 }),
          maxRoomSize: fc.integer({ min: 5, max: 8 }),
          seed: fc.integer({ min: 0, max: 1000000 })
        }),
        (config) => {
          const validConfig = {
            width: config.width,
            height: config.height,
            minRooms: Math.min(config.minRooms, config.maxRooms),
            maxRooms: Math.max(config.minRooms, config.maxRooms),
            minRoomSize: Math.min(config.minRoomSize, config.maxRoomSize),
            maxRoomSize: Math.max(config.minRoomSize, config.maxRoomSize)
          };

          const generator1 = new DungeonGenerator(validConfig);
          const generator2 = new DungeonGenerator(validConfig);

          const dungeon1 = generator1.generate(config.seed);
          const dungeon2 = generator2.generate(config.seed);

          // Same seed should produce same number of rooms
          expect(dungeon1.rooms.length).toBe(dungeon2.rooms.length);

          // Same seed should produce same room positions
          for (let i = 0; i < dungeon1.rooms.length; i++) {
            expect(dungeon1.rooms[i]).toEqual(dungeon2.rooms[i]);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('all rooms are within dungeon bounds', () => {
    fc.assert(
      fc.property(
        fc.record({
          width: fc.integer({ min: 30, max: 80 }),
          height: fc.integer({ min: 30, max: 80 }),
          minRooms: fc.integer({ min: 3, max: 6 }),
          maxRooms: fc.integer({ min: 6, max: 10 }),
          minRoomSize: fc.integer({ min: 3, max: 5 }),
          maxRoomSize: fc.integer({ min: 5, max: 10 }),
          seed: fc.integer({ min: 0, max: 1000000 })
        }),
        (config) => {
          const validConfig = {
            width: config.width,
            height: config.height,
            minRooms: Math.min(config.minRooms, config.maxRooms),
            maxRooms: Math.max(config.minRooms, config.maxRooms),
            minRoomSize: Math.min(config.minRoomSize, config.maxRoomSize),
            maxRoomSize: Math.max(config.minRoomSize, config.maxRoomSize)
          };

          const generator = new DungeonGenerator(validConfig);
          const dungeon = generator.generate(config.seed);

          // All rooms should be within bounds
          for (const room of dungeon.rooms) {
            expect(room.x).toBeGreaterThanOrEqual(0);
            expect(room.y).toBeGreaterThanOrEqual(0);
            expect(room.x + room.width).toBeLessThanOrEqual(validConfig.width);
            expect(room.y + room.height).toBeLessThanOrEqual(validConfig.height);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('rooms do not overlap', () => {
    fc.assert(
      fc.property(
        fc.record({
          width: fc.integer({ min: 40, max: 80 }),
          height: fc.integer({ min: 40, max: 80 }),
          minRooms: fc.integer({ min: 3, max: 6 }),
          maxRooms: fc.integer({ min: 6, max: 10 }),
          minRoomSize: fc.integer({ min: 3, max: 5 }),
          maxRoomSize: fc.integer({ min: 5, max: 8 }),
          seed: fc.integer({ min: 0, max: 1000000 })
        }),
        (config) => {
          const validConfig = {
            width: config.width,
            height: config.height,
            minRooms: Math.min(config.minRooms, config.maxRooms),
            maxRooms: Math.max(config.minRooms, config.maxRooms),
            minRoomSize: Math.min(config.minRoomSize, config.maxRoomSize),
            maxRoomSize: Math.max(config.minRoomSize, config.maxRoomSize)
          };

          const generator = new DungeonGenerator(validConfig);
          const dungeon = generator.generate(config.seed);

          // Check all pairs of rooms for overlap
          for (let i = 0; i < dungeon.rooms.length; i++) {
            for (let j = i + 1; j < dungeon.rooms.length; j++) {
              const room1 = dungeon.rooms[i];
              const room2 = dungeon.rooms[j];

              // Rooms should not overlap (with at least 1 tile padding)
              const overlaps = !(
                room1.x + room1.width < room2.x ||
                room2.x + room2.width < room1.x ||
                room1.y + room1.height < room2.y ||
                room2.y + room2.height < room1.y
              );

              expect(overlaps).toBe(false);
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
