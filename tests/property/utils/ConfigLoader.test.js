import { describe, test, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { ConfigLoader } from '../../../framework/utils/ConfigLoader.js';

describe('ConfigLoader Property Tests', () => {
  /**
   * Feature: skeleton-crew-framework, Property 10: Configuration round-trip consistency
   * Validates: Requirements 3.1
   * 
   * For any valid game configuration object, serializing to JSON and then parsing
   * should produce an equivalent configuration.
   */
  test('configuration round-trip consistency - serialize then parse produces equivalent config', () => {
    fc.assert(
      fc.property(
        // Generate random valid game configurations
        fc.record({
          game: fc.record({
            title: fc.string({ minLength: 1, maxLength: 50 }),
            startScene: fc.constantFrom('dungeon_1', 'puzzle_room', 'main_menu', 'level_1'),
            visibility: fc.record({
              mode: fc.constantFrom('circular', 'cone', 'none'),
              radius: fc.integer({ min: 1, max: 20 })
            }),
            resources: fc.array(
              fc.record({
                name: fc.constantFrom('health', 'stamina', 'mana', 'sanity', 'oxygen'),
                max: fc.integer({ min: 10, max: 1000 }),
                start: fc.integer({ min: 0, max: 1000 }),
                depleteRate: fc.option(fc.integer({ min: 0, max: 10 }), { nil: undefined })
              }),
              { minLength: 0, maxLength: 5 }
            ),
            mechanics: fc.record({
              permadeath: fc.boolean(),
              checkpoints: fc.boolean(),
              combat: fc.boolean()
            })
          }),
          entityTypes: fc.option(
            fc.dictionary(
              fc.constantFrom('player', 'enemy', 'item', 'door', 'key'),
              fc.record({
                sprite: fc.string({ minLength: 1, maxLength: 30 }),
                width: fc.integer({ min: 8, max: 128 }),
                height: fc.integer({ min: 8, max: 128 }),
                speed: fc.option(fc.integer({ min: 1, max: 200 }), { nil: undefined }),
                health: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
                damage: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
                collides: fc.option(fc.boolean(), { nil: undefined })
              })
            ),
            { nil: undefined }
          ),
          scenes: fc.option(
            fc.dictionary(
              fc.constantFrom('dungeon_1', 'puzzle_room', 'boss_room'),
              fc.record({
                type: fc.constantFrom('procedural', 'fixed'),
                width: fc.option(fc.integer({ min: 10, max: 100 }), { nil: undefined }),
                height: fc.option(fc.integer({ min: 10, max: 100 }), { nil: undefined }),
                generator: fc.option(fc.constantFrom('dungeon', 'cave', 'maze'), { nil: undefined }),
                entities: fc.array(
                  fc.record({
                    type: fc.constantFrom('player', 'enemy', 'item'),
                    x: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
                    y: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
                    spawn: fc.option(fc.constantFrom('random', 'fixed'), { nil: undefined }),
                    count: fc.option(fc.integer({ min: 1, max: 20 }), { nil: undefined })
                  }),
                  { minLength: 0, maxLength: 10 }
                )
              })
            ),
            { nil: undefined }
          )
        }),
        (originalConfig) => {
          // Ensure resource start values don't exceed max
          if (originalConfig.game.resources) {
            for (const resource of originalConfig.game.resources) {
              if (resource.start > resource.max) {
                resource.start = resource.max;
              }
            }
          }

          // Perform round-trip: serialize then parse
          const serialized = ConfigLoader.serializeConfig(originalConfig);
          const parsed = ConfigLoader.parseConfig(serialized);

          // Property 1: Parsed config should be deeply equal to original
          expect(parsed).toEqual(originalConfig);

          // Property 2: Game section should be preserved
          expect(parsed.game).toBeDefined();
          expect(parsed.game.title).toBe(originalConfig.game.title);
          expect(parsed.game.startScene).toBe(originalConfig.game.startScene);
          expect(parsed.game.visibility.mode).toBe(originalConfig.game.visibility.mode);
          expect(parsed.game.visibility.radius).toBe(originalConfig.game.visibility.radius);
          expect(parsed.game.mechanics.permadeath).toBe(originalConfig.game.mechanics.permadeath);
          expect(parsed.game.mechanics.checkpoints).toBe(originalConfig.game.mechanics.checkpoints);
          expect(parsed.game.mechanics.combat).toBe(originalConfig.game.mechanics.combat);

          // Property 3: Resources array should be preserved
          expect(parsed.game.resources).toEqual(originalConfig.game.resources);
          expect(parsed.game.resources.length).toBe(originalConfig.game.resources.length);
          
          for (let i = 0; i < originalConfig.game.resources.length; i++) {
            expect(parsed.game.resources[i].name).toBe(originalConfig.game.resources[i].name);
            expect(parsed.game.resources[i].max).toBe(originalConfig.game.resources[i].max);
            expect(parsed.game.resources[i].start).toBe(originalConfig.game.resources[i].start);
            expect(parsed.game.resources[i].depleteRate).toBe(originalConfig.game.resources[i].depleteRate);
          }

          // Property 4: Optional sections should be preserved if present
          if (originalConfig.entityTypes !== undefined) {
            expect(parsed.entityTypes).toBeDefined();
            expect(parsed.entityTypes).toEqual(originalConfig.entityTypes);
          } else {
            expect(parsed.entityTypes).toBeUndefined();
          }

          if (originalConfig.scenes !== undefined) {
            expect(parsed.scenes).toBeDefined();
            expect(parsed.scenes).toEqual(originalConfig.scenes);
          } else {
            expect(parsed.scenes).toBeUndefined();
          }

          // Property 5: Double round-trip should produce same result
          const serialized2 = ConfigLoader.serializeConfig(parsed);
          const parsed2 = ConfigLoader.parseConfig(serialized2);
          expect(parsed2).toEqual(originalConfig);
          expect(parsed2).toEqual(parsed);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  test('configuration round-trip preserves nested structures', () => {
    fc.assert(
      fc.property(
        // Generate deeply nested configuration structures
        fc.record({
          level1: fc.record({
            level2: fc.record({
              level3: fc.record({
                value: fc.integer(),
                array: fc.array(fc.integer(), { maxLength: 5 }),
                nested: fc.record({
                  deep: fc.string()
                })
              })
            })
          })
        }),
        (config) => {
          const serialized = ConfigLoader.serializeConfig(config);
          const parsed = ConfigLoader.parseConfig(serialized);

          // Property: Deep equality should hold for nested structures
          expect(parsed).toEqual(config);
          expect(parsed.level1.level2.level3.value).toBe(config.level1.level2.level3.value);
          expect(parsed.level1.level2.level3.array).toEqual(config.level1.level2.level3.array);
          expect(parsed.level1.level2.level3.nested.deep).toBe(config.level1.level2.level3.nested.deep);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('configuration round-trip handles special values correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          nullValue: fc.constant(null),
          boolTrue: fc.constant(true),
          boolFalse: fc.constant(false),
          zeroNumber: fc.constant(0),
          emptyString: fc.constant(''),
          emptyArray: fc.constant([]),
          emptyObject: fc.constant({}),
          negativeNumber: fc.integer({ min: -1000, max: -1 }),
          floatNumber: fc.double({ min: -100, max: 100, noNaN: true })
        }),
        (config) => {
          const serialized = ConfigLoader.serializeConfig(config);
          const parsed = ConfigLoader.parseConfig(serialized);

          // Property: Special values should be preserved exactly
          expect(parsed.nullValue).toBe(null);
          expect(parsed.boolTrue).toBe(true);
          expect(parsed.boolFalse).toBe(false);
          expect(parsed.zeroNumber).toBe(0);
          expect(parsed.emptyString).toBe('');
          expect(parsed.emptyArray).toEqual([]);
          expect(parsed.emptyObject).toEqual({});
          expect(parsed.negativeNumber).toBe(config.negativeNumber);
          expect(parsed.floatNumber).toBeCloseTo(config.floatNumber, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('configuration round-trip preserves array order', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.integer(),
            name: fc.string(),
            priority: fc.integer({ min: 0, max: 10 })
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (items) => {
          const config = { items };
          const serialized = ConfigLoader.serializeConfig(config);
          const parsed = ConfigLoader.parseConfig(serialized);

          // Property: Array order should be preserved
          expect(parsed.items.length).toBe(items.length);
          for (let i = 0; i < items.length; i++) {
            expect(parsed.items[i]).toEqual(items[i]);
            expect(parsed.items[i].id).toBe(items[i].id);
            expect(parsed.items[i].name).toBe(items[i].name);
            expect(parsed.items[i].priority).toBe(items[i].priority);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('configuration serialization produces valid JSON', () => {
    fc.assert(
      fc.property(
        fc.record({
          game: fc.record({
            title: fc.string(),
            settings: fc.record({
              volume: fc.integer({ min: 0, max: 100 }),
              difficulty: fc.constantFrom('easy', 'normal', 'hard')
            })
          })
        }),
        (config) => {
          const serialized = ConfigLoader.serializeConfig(config);

          // Property: Serialized output should be valid JSON string
          expect(typeof serialized).toBe('string');
          expect(serialized.length).toBeGreaterThan(0);

          // Property: Should be parseable by standard JSON.parse
          const parsed = JSON.parse(serialized);
          expect(parsed).toEqual(config);

          // Property: Should not throw when parsing
          expect(() => JSON.parse(serialized)).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: skeleton-crew-framework, Property 11: Configuration validation error messages
   * Validates: Requirements 3.5
   * 
   * For any invalid configuration (missing required fields, invalid types, out-of-range values),
   * the validation should fail and return a clear error message indicating the specific problem.
   */
  test('configuration validation produces clear error messages for invalid configs', () => {
    // Define a schema for game configuration
    const gameSchema = {
      properties: {
        game: {
          type: 'object',
          required: true,
          properties: {
            title: {
              type: 'string',
              required: true,
              minLength: 1,
              maxLength: 100
            },
            startScene: {
              type: 'string',
              required: true,
              enum: ['dungeon_1', 'puzzle_room', 'main_menu']
            },
            visibility: {
              type: 'object',
              required: true,
              properties: {
                mode: {
                  type: 'string',
                  required: true,
                  enum: ['circular', 'cone', 'none']
                },
                radius: {
                  type: 'number',
                  required: true,
                  min: 1,
                  max: 20
                }
              }
            }
          }
        }
      }
    };

    fc.assert(
      fc.property(
        // Generate various types of invalid configurations
        fc.oneof(
          // Missing required field (game)
          fc.constant({}),
          
          // Missing required field (title)
          fc.record({
            game: fc.record({
              startScene: fc.constantFrom('dungeon_1', 'puzzle_room'),
              visibility: fc.record({
                mode: fc.constantFrom('circular', 'cone', 'none'),
                radius: fc.integer({ min: 1, max: 20 })
              })
            })
          }),
          
          // Invalid type for title (number instead of string)
          fc.record({
            game: fc.record({
              title: fc.integer(),
              startScene: fc.constantFrom('dungeon_1', 'puzzle_room'),
              visibility: fc.record({
                mode: fc.constantFrom('circular', 'cone', 'none'),
                radius: fc.integer({ min: 1, max: 20 })
              })
            })
          }),
          
          // Invalid enum value for startScene
          fc.record({
            game: fc.record({
              title: fc.string({ minLength: 1, maxLength: 50 }),
              startScene: fc.string({ minLength: 1, maxLength: 20 }).filter(s => !['dungeon_1', 'puzzle_room', 'main_menu'].includes(s)),
              visibility: fc.record({
                mode: fc.constantFrom('circular', 'cone', 'none'),
                radius: fc.integer({ min: 1, max: 20 })
              })
            })
          }),
          
          // Out of range value for radius (too small)
          fc.record({
            game: fc.record({
              title: fc.string({ minLength: 1, maxLength: 50 }),
              startScene: fc.constantFrom('dungeon_1', 'puzzle_room'),
              visibility: fc.record({
                mode: fc.constantFrom('circular', 'cone', 'none'),
                radius: fc.integer({ min: -100, max: 0 })
              })
            })
          }),
          
          // Out of range value for radius (too large)
          fc.record({
            game: fc.record({
              title: fc.string({ minLength: 1, maxLength: 50 }),
              startScene: fc.constantFrom('dungeon_1', 'puzzle_room'),
              visibility: fc.record({
                mode: fc.constantFrom('circular', 'cone', 'none'),
                radius: fc.integer({ min: 21, max: 1000 })
              })
            })
          }),
          
          // String too long for title
          fc.record({
            game: fc.record({
              title: fc.string({ minLength: 101, maxLength: 200 }),
              startScene: fc.constantFrom('dungeon_1', 'puzzle_room'),
              visibility: fc.record({
                mode: fc.constantFrom('circular', 'cone', 'none'),
                radius: fc.integer({ min: 1, max: 20 })
              })
            })
          }),
          
          // Invalid type for visibility (string instead of object)
          fc.record({
            game: fc.record({
              title: fc.string({ minLength: 1, maxLength: 50 }),
              startScene: fc.constantFrom('dungeon_1', 'puzzle_room'),
              visibility: fc.string()
            })
          })
        ),
        (invalidConfig) => {
          const result = ConfigLoader.validateConfig(invalidConfig, gameSchema);

          // Property 1: Validation should fail for invalid configs
          expect(result.valid).toBe(false);

          // Property 2: Errors array should not be empty
          expect(result.errors).toBeDefined();
          expect(Array.isArray(result.errors)).toBe(true);
          expect(result.errors.length).toBeGreaterThan(0);

          // Property 3: Each error message should be a non-empty string
          for (const error of result.errors) {
            expect(typeof error).toBe('string');
            expect(error.length).toBeGreaterThan(0);
          }

          // Property 4: Error messages should contain field path information
          const hasFieldPath = result.errors.some(error => 
            error.includes('game') || 
            error.includes('title') || 
            error.includes('startScene') || 
            error.includes('visibility') || 
            error.includes('mode') || 
            error.includes('radius')
          );
          expect(hasFieldPath).toBe(true);

          // Property 5: Error messages should indicate the type of problem
          const hasErrorType = result.errors.some(error => 
            error.includes('Missing') || 
            error.includes('Invalid') || 
            error.includes('expected') || 
            error.includes('exceeds') || 
            error.includes('below') ||
            error.includes('must be')
          );
          expect(hasErrorType).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('configuration validation provides specific error details', () => {
    const schema = {
      properties: {
        resources: {
          type: 'array',
          required: true,
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                required: true
              },
              max: {
                type: 'number',
                required: true,
                min: 1,
                max: 1000
              },
              depleteRate: {
                type: 'number',
                min: 0,
                max: 100
              }
            }
          }
        }
      }
    };

    fc.assert(
      fc.property(
        // Generate arrays with invalid resource configurations
        fc.array(
          fc.oneof(
            // Missing required name field
            fc.record({
              max: fc.integer({ min: 1, max: 1000 })
            }),
            // Invalid max value (out of range)
            fc.record({
              name: fc.string({ minLength: 1 }),
              max: fc.integer({ min: 1001, max: 10000 })
            }),
            // Invalid depleteRate (negative)
            fc.record({
              name: fc.string({ minLength: 1 }),
              max: fc.integer({ min: 1, max: 1000 }),
              depleteRate: fc.integer({ min: -100, max: -1 })
            }),
            // Wrong type for max
            fc.record({
              name: fc.string({ minLength: 1 }),
              max: fc.string()
            })
          ),
          { minLength: 1, maxLength: 5 }
        ),
        (invalidResources) => {
          const config = { resources: invalidResources };
          const result = ConfigLoader.validateConfig(config, schema);

          // Property: Validation should fail
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);

          // Property: Error messages should include array indices
          const hasArrayIndex = result.errors.some(error => error.includes('[') && error.includes(']'));
          expect(hasArrayIndex).toBe(true);

          // Property: Error messages should specify the problematic field
          const mentionsField = result.errors.some(error => 
            error.includes('name') || 
            error.includes('max') || 
            error.includes('depleteRate')
          );
          expect(mentionsField).toBe(true);

          // Property: Each error should provide actionable information
          for (const error of result.errors) {
            // Should mention what's wrong
            const isActionable = 
              error.includes('Missing') || 
              error.includes('Invalid') || 
              error.includes('expected') || 
              error.includes('exceeds') || 
              error.includes('below');
            expect(isActionable).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('valid configurations pass validation without errors', () => {
    const schema = {
      properties: {
        game: {
          type: 'object',
          required: true,
          properties: {
            title: {
              type: 'string',
              required: true,
              minLength: 1,
              maxLength: 100
            },
            difficulty: {
              type: 'string',
              enum: ['easy', 'normal', 'hard']
            }
          }
        }
      }
    };

    fc.assert(
      fc.property(
        // Generate valid configurations
        fc.record({
          game: fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }),
            difficulty: fc.option(fc.constantFrom('easy', 'normal', 'hard'), { nil: undefined })
          })
        }),
        (validConfig) => {
          const result = ConfigLoader.validateConfig(validConfig, schema);

          // Property: Valid configs should pass validation
          expect(result.valid).toBe(true);

          // Property: Errors array should be empty
          expect(result.errors).toBeDefined();
          expect(Array.isArray(result.errors)).toBe(true);
          expect(result.errors.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
