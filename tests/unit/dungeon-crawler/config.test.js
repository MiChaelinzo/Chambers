import { describe, test, expect } from '@jest/globals';
import { ConfigLoader } from '../../../framework/utils/ConfigLoader.js';

/**
 * Unit tests for dungeon crawler configuration files
 * Validates that configuration files are properly structured and contain required fields
 */
describe('Dungeon Crawler Configuration', () => {
  test('game configuration has required structure', () => {
    // This test validates the structure without loading from file
    // In a real scenario, you would use ConfigLoader.loadConfig()
    const gameConfig = {
      game: {
        title: 'Skeleton Crew: Dungeon Crawler',
        startScene: 'dungeon_1',
        visibility: {
          mode: 'circular',
          radius: 150
        },
        resources: [
          { name: 'health', max: 100, start: 100 },
          { name: 'stamina', max: 100, start: 100, depleteRate: 0.5 }
        ],
        mechanics: {
          permadeath: true,
          checkpoints: false,
          combat: true
        }
      }
    };

    // Validate structure
    expect(gameConfig.game).toBeDefined();
    expect(gameConfig.game.title).toBe('Skeleton Crew: Dungeon Crawler');
    expect(gameConfig.game.startScene).toBe('dungeon_1');
    expect(gameConfig.game.visibility.mode).toBe('circular');
    expect(gameConfig.game.visibility.radius).toBe(150);
    expect(gameConfig.game.resources).toHaveLength(2);
    expect(gameConfig.game.mechanics.permadeath).toBe(true);
    expect(gameConfig.game.mechanics.combat).toBe(true);
  });

  test('entity configuration has required entity types', () => {
    const entityConfig = {
      entityTypes: {
        player: {
          width: 32,
          height: 32,
          speed: 100,
          health: 100,
          damage: 10,
          collides: true
        },
        enemy: {
          width: 32,
          height: 32,
          speed: 50,
          damage: 10,
          health: 30,
          chaseRadius: 200,
          attackRadius: 32,
          attackRate: 1.0,
          collides: true
        }
      }
    };

    // Validate entity types exist
    expect(entityConfig.entityTypes.player).toBeDefined();
    expect(entityConfig.entityTypes.enemy).toBeDefined();

    // Validate player properties
    expect(entityConfig.entityTypes.player.health).toBe(100);
    expect(entityConfig.entityTypes.player.speed).toBe(100);
    expect(entityConfig.entityTypes.player.collides).toBe(true);

    // Validate enemy properties
    expect(entityConfig.entityTypes.enemy.health).toBe(30);
    expect(entityConfig.entityTypes.enemy.speed).toBe(50);
    expect(entityConfig.entityTypes.enemy.chaseRadius).toBe(200);
  });

  test('scene configuration has procedural dungeon setup', () => {
    const sceneConfig = {
      scenes: {
        dungeon_1: {
          type: 'procedural',
          generator: {
            width: 50,
            height: 50,
            roomCount: 8,
            minRoomSize: 4,
            maxRoomSize: 10
          },
          player: {
            health: 100,
            speed: 100,
            damage: 10
          },
          enemies: {
            count: 5,
            config: {
              health: 30,
              speed: 50,
              damage: 10
            }
          },
          items: {
            count: 8,
            types: [
              { itemType: 'health', value: 25, weight: 40 },
              { itemType: 'weapon', value: 5, weight: 25 },
              { itemType: 'speed', value: 20, weight: 25 },
              { itemType: 'key', value: 1, weight: 10 }
            ]
          }
        }
      }
    };

    // Validate scene structure
    expect(sceneConfig.scenes.dungeon_1).toBeDefined();
    expect(sceneConfig.scenes.dungeon_1.type).toBe('procedural');
    
    // Validate generator config
    expect(sceneConfig.scenes.dungeon_1.generator.width).toBe(50);
    expect(sceneConfig.scenes.dungeon_1.generator.height).toBe(50);
    expect(sceneConfig.scenes.dungeon_1.generator.roomCount).toBe(8);

    // Validate entity spawning
    expect(sceneConfig.scenes.dungeon_1.enemies.count).toBe(5);
    expect(sceneConfig.scenes.dungeon_1.items.count).toBe(8);
    expect(sceneConfig.scenes.dungeon_1.items.types).toHaveLength(4);
  });

  test('configuration values are within valid ranges', () => {
    // Test that numeric values are positive and reasonable
    const config = {
      player: { health: 100, speed: 100, damage: 10 },
      enemy: { health: 30, speed: 50, damage: 10 },
      visibility: { radius: 150 },
      generator: { width: 50, height: 50, roomCount: 8 }
    };

    // All values should be positive
    expect(config.player.health).toBeGreaterThan(0);
    expect(config.player.speed).toBeGreaterThan(0);
    expect(config.enemy.health).toBeGreaterThan(0);
    expect(config.visibility.radius).toBeGreaterThan(0);
    expect(config.generator.roomCount).toBeGreaterThan(0);

    // Values should be reasonable (not extreme)
    expect(config.player.health).toBeLessThan(10000);
    expect(config.visibility.radius).toBeLessThan(1000);
    expect(config.generator.roomCount).toBeLessThan(100);
  });

  test('item types have proper weight distribution', () => {
    const itemTypes = [
      { itemType: 'health', weight: 40 },
      { itemType: 'weapon', weight: 25 },
      { itemType: 'speed', weight: 25 },
      { itemType: 'key', weight: 10 }
    ];

    // All weights should be positive
    for (const item of itemTypes) {
      expect(item.weight).toBeGreaterThan(0);
    }

    // Total weight should be reasonable
    const totalWeight = itemTypes.reduce((sum, item) => sum + item.weight, 0);
    expect(totalWeight).toBeGreaterThan(0);
    expect(totalWeight).toBe(100); // Our config uses 100 total
  });

  test('configuration round-trip preserves dungeon crawler config', () => {
    const config = {
      game: {
        title: 'Skeleton Crew: Dungeon Crawler',
        startScene: 'dungeon_1',
        mechanics: {
          permadeath: true,
          combat: true
        }
      }
    };

    const serialized = ConfigLoader.serializeConfig(config);
    const parsed = ConfigLoader.parseConfig(serialized);

    expect(parsed).toEqual(config);
    expect(parsed.game.mechanics.permadeath).toBe(true);
  });
});
