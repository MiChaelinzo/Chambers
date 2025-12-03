/**
 * Property-based tests for puzzle game save/load system
 * Feature: skeleton-crew-framework, Property 16: Save/load state round-trip
 */

import fc from 'fast-check';
import { SaveSystem } from '../../../games/puzzle-game/SaveSystem.js';
import { Player } from '../../../games/puzzle-game/entities/Player.js';
import { Puzzle } from '../../../games/puzzle-game/puzzles/Puzzle.js';
import { Scene } from '../../../framework/core/Scene.js';

// Mock localStorage for testing
const mockLocalStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

// Replace global localStorage with mock
global.localStorage = mockLocalStorage;

describe('SaveSystem Property Tests', () => {
  let saveSystem;

  beforeEach(() => {
    mockLocalStorage.clear();
    saveSystem = new SaveSystem('test-game');
  });

  describe('Property 16: Save/load state round-trip', () => {
    /**
     * Feature: skeleton-crew-framework, Property 16: Save/load state round-trip
     * For any game state, saving the state and then loading it should restore 
     * all player properties, inventory, scene, and progress to their exact values at save time.
     * Validates: Requirements 5.5
     */
    test('save then load preserves all game state properties', () => {
      fc.assert(fc.property(
        // Generate random game state
        fc.record({
          player: fc.record({
            position: fc.record({
              x: fc.float({ min: -1000, max: 1000 }).filter(n => !isNaN(n) && isFinite(n)),
              y: fc.float({ min: -1000, max: 1000 }).filter(n => !isNaN(n) && isFinite(n))
            }),
            state: fc.record({
              inventory: fc.array(fc.record({
                type: fc.string({ minLength: 1, maxLength: 20 }),
                name: fc.string({ minLength: 1, maxLength: 30 }),
                description: fc.string({ maxLength: 100 })
              }), { maxLength: 10 }),
              selectedItemIndex: fc.integer({ min: -1, max: 9 }),
              speed: fc.float({ min: 1, max: 500 }).filter(n => !isNaN(n) && isFinite(n)),
              interactionRadius: fc.float({ min: 10, max: 200 }).filter(n => !isNaN(n) && isFinite(n))
            }),
            config: fc.record({
              width: fc.integer({ min: 16, max: 64 }),
              height: fc.integer({ min: 16, max: 64 }),
              collides: fc.boolean()
            })
          }),
          scene: fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            config: fc.record({
              width: fc.integer({ min: 100, max: 2000 }),
              height: fc.integer({ min: 100, max: 2000 })
            }),
            entities: fc.array(fc.record({
              id: fc.integer({ min: 1, max: 1000 }),
              type: fc.constantFrom('door', 'key', 'clue', 'interactive'),
              position: fc.record({
                x: fc.float({ min: 0, max: 1000 }).filter(n => !isNaN(n) && isFinite(n)),
                y: fc.float({ min: 0, max: 1000 }).filter(n => !isNaN(n) && isFinite(n))
              }),
              state: fc.record({
                locked: fc.boolean(),
                collected: fc.boolean(),
                activated: fc.boolean()
              }),
              config: fc.record({
                width: fc.integer({ min: 16, max: 64 }),
                collides: fc.boolean()
              })
            }), { maxLength: 20 }),
            isLoaded: fc.boolean()
          }),
          puzzles: fc.array(fc.record({
            id: fc.string({ minLength: 1, maxLength: 30 }),
            state: fc.record({
              switch1: fc.boolean(),
              switch2: fc.boolean(),
              counter: fc.integer({ min: 0, max: 100 }),
              code: fc.string({ minLength: 3, maxLength: 10 })
            }),
            solved: fc.boolean(),
            completedAt: fc.option(fc.integer({ min: 1000000000000, max: 2000000000000 }))
          }), { maxLength: 5 }),
          progress: fc.record({
            currentSceneId: fc.string({ minLength: 1, maxLength: 50 }),
            checkpointName: fc.string({ minLength: 1, maxLength: 30 }),
            timestamp: fc.integer({ min: 1000000000000, max: 2000000000000 })
          })
        }),
        (originalGameState) => {
          // Save the game state
          const saveSuccess = saveSystem.saveGame(originalGameState);
          expect(saveSuccess).toBe(true);

          // Load the game state
          const loadedGameState = saveSystem.loadGame();
          expect(loadedGameState).not.toBeNull();

          // Verify all properties are preserved
          
          // Check player state
          if (originalGameState.player) {
            expect(loadedGameState.player).toBeDefined();
            // Use custom comparison for position to handle -0 vs 0
            expect(loadedGameState.player.position.x).toBeCloseTo(originalGameState.player.position.x, 10);
            expect(loadedGameState.player.position.y).toBeCloseTo(originalGameState.player.position.y, 10);
            expect(loadedGameState.player.state.inventory).toEqual(originalGameState.player.state.inventory);
            expect(loadedGameState.player.state.selectedItemIndex).toBe(originalGameState.player.state.selectedItemIndex);
            expect(loadedGameState.player.state.speed).toBeCloseTo(originalGameState.player.state.speed, 10);
            expect(loadedGameState.player.state.interactionRadius).toBeCloseTo(originalGameState.player.state.interactionRadius, 10);
            expect(loadedGameState.player.config).toEqual(originalGameState.player.config);
          }

          // Check scene state
          if (originalGameState.scene) {
            expect(loadedGameState.scene).toBeDefined();
            expect(loadedGameState.scene.id).toBe(originalGameState.scene.id);
            expect(loadedGameState.scene.config).toEqual(originalGameState.scene.config);
            expect(loadedGameState.scene.entities).toEqual(originalGameState.scene.entities);
            expect(loadedGameState.scene.isLoaded).toBe(originalGameState.scene.isLoaded);
          }

          // Check puzzle states
          if (originalGameState.puzzles) {
            expect(loadedGameState.puzzles).toBeDefined();
            expect(loadedGameState.puzzles).toHaveLength(originalGameState.puzzles.length);
            
            for (let i = 0; i < originalGameState.puzzles.length; i++) {
              const original = originalGameState.puzzles[i];
              const loaded = loadedGameState.puzzles[i];
              
              expect(loaded.id).toBe(original.id);
              expect(loaded.state).toEqual(original.state);
              expect(loaded.solved).toBe(original.solved);
              expect(loaded.completedAt).toBe(original.completedAt);
            }
          }

          // Check progress state
          if (originalGameState.progress) {
            expect(loadedGameState.progress).toBeDefined();
            expect(loadedGameState.progress.currentSceneId).toBe(originalGameState.progress.currentSceneId);
            expect(loadedGameState.progress.checkpointName).toBe(originalGameState.progress.checkpointName);
            expect(loadedGameState.progress.timestamp).toBe(originalGameState.progress.timestamp);
          }

          // Verify metadata is added correctly
          expect(loadedGameState.version).toBeDefined();
          expect(loadedGameState.timestamp).toBeDefined();
          expect(loadedGameState.gameId).toBe('test-game');
        }
      ), { numRuns: 100 });
    });

    test('player serialization round-trip preserves all properties', () => {
      fc.assert(fc.property(
        fc.record({
          x: fc.float({ min: -1000, max: 1000 }).filter(n => !isNaN(n) && isFinite(n)),
          y: fc.float({ min: -1000, max: 1000 }).filter(n => !isNaN(n) && isFinite(n)),
          inventory: fc.array(fc.record({
            type: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 30 }),
            description: fc.string({ maxLength: 100 })
          }), { maxLength: 10 }),
          selectedItemIndex: fc.integer({ min: -1, max: 9 }),
          speed: fc.float({ min: 1, max: 500 }).filter(n => !isNaN(n) && isFinite(n)),
          interactionRadius: fc.float({ min: 10, max: 200 }).filter(n => !isNaN(n) && isFinite(n)),
          config: fc.record({
            width: fc.integer({ min: 16, max: 64 }),
            height: fc.integer({ min: 16, max: 64 }),
            collides: fc.boolean()
          })
        }),
        (playerData) => {
          // Create player with generated data
          const originalPlayer = new Player(playerData.x, playerData.y, playerData.config);
          originalPlayer.state.inventory = [...playerData.inventory];
          originalPlayer.state.selectedItemIndex = playerData.selectedItemIndex;
          originalPlayer.state.speed = playerData.speed;
          originalPlayer.state.interactionRadius = playerData.interactionRadius;

          // Serialize player
          const serializedData = saveSystem.serializePlayer(originalPlayer);

          // Create new player and deserialize
          const newPlayer = new Player(0, 0);
          saveSystem.deserializePlayer(serializedData, newPlayer);

          // Verify all properties are preserved
          expect(newPlayer.position.x).toBe(originalPlayer.position.x);
          expect(newPlayer.position.y).toBe(originalPlayer.position.y);
          expect(newPlayer.state.inventory).toEqual(originalPlayer.state.inventory);
          expect(newPlayer.state.selectedItemIndex).toBe(originalPlayer.state.selectedItemIndex);
          expect(newPlayer.state.speed).toBe(originalPlayer.state.speed);
          expect(newPlayer.state.interactionRadius).toBe(originalPlayer.state.interactionRadius);
          expect(newPlayer.config).toEqual(originalPlayer.config);
        }
      ), { numRuns: 100 });
    });

    test('puzzle serialization round-trip preserves all properties', () => {
      fc.assert(fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 30 }),
          state: fc.record({
            switch1: fc.boolean(),
            switch2: fc.boolean(),
            counter: fc.integer({ min: 0, max: 100 }),
            code: fc.string({ minLength: 3, maxLength: 10 })
          }),
          solved: fc.boolean(),
          completedAt: fc.option(fc.integer({ min: 1000000000000, max: 2000000000000 }))
        }),
        (puzzleData) => {
          // Create puzzle with generated data
          const originalPuzzle = new Puzzle(puzzleData.id, {
            initialState: puzzleData.state,
            conditions: [
              { key: 'switch1', value: true },
              { key: 'counter', value: 50, operator: 'greaterThan' }
            ]
          });
          
          // Set solved state and completion time
          if (puzzleData.solved) {
            originalPuzzle.solved = true;
            originalPuzzle.completedAt = puzzleData.completedAt;
          }

          // Serialize puzzle
          const serializedData = originalPuzzle.serialize();

          // Create new puzzle and deserialize
          const newPuzzle = new Puzzle(puzzleData.id, {
            initialState: {},
            conditions: [
              { key: 'switch1', value: true },
              { key: 'counter', value: 50, operator: 'greaterThan' }
            ]
          });
          newPuzzle.deserialize(serializedData);

          // Verify all properties are preserved
          expect(newPuzzle.id).toBe(originalPuzzle.id);
          expect(newPuzzle.state).toEqual(originalPuzzle.state);
          expect(newPuzzle.solved).toBe(originalPuzzle.solved);
          expect(newPuzzle.completedAt).toBe(originalPuzzle.completedAt);
        }
      ), { numRuns: 100 });
    });

    test('scene serialization preserves entity data', () => {
      fc.assert(fc.property(
        fc.record({
          sceneId: fc.string({ minLength: 1, maxLength: 30 }),
          entities: fc.array(fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            type: fc.constantFrom('door', 'key', 'clue'),
            x: fc.float({ min: 0, max: 1000 }).filter(n => !isNaN(n) && isFinite(n)),
            y: fc.float({ min: 0, max: 1000 }).filter(n => !isNaN(n) && isFinite(n)),
            state: fc.record({
              locked: fc.boolean(),
              collected: fc.boolean()
            }),
            config: fc.record({
              width: fc.integer({ min: 16, max: 64 }),
              collides: fc.boolean()
            })
          }), { maxLength: 10 })
        }),
        (sceneData) => {
          // Create scene with entities
          const scene = new Scene(sceneData.sceneId);
          
          // Add entities to scene (mock entities for serialization test)
          const mockEntities = sceneData.entities.map(entityData => ({
            getId: () => entityData.id,
            getType: () => entityData.type,
            position: { x: entityData.x, y: entityData.y },
            state: { ...entityData.state },
            config: { ...entityData.config },
            isDeleted: () => false
          }));

          // Mock the getAllEntities method
          scene.getAllEntities = () => mockEntities.filter(e => e.getType() !== 'player');

          // Serialize scene
          const serializedData = saveSystem.serializeScene(scene);

          // Verify serialization preserves all entity data
          expect(serializedData.id).toBe(sceneData.sceneId);
          expect(serializedData.entities).toHaveLength(sceneData.entities.length);

          for (let i = 0; i < sceneData.entities.length; i++) {
            const original = sceneData.entities[i];
            const serialized = serializedData.entities[i];

            expect(serialized.id).toBe(original.id);
            expect(serialized.type).toBe(original.type);
            expect(serialized.position).toEqual({ x: original.x, y: original.y });
            expect(serialized.state).toEqual(original.state);
            expect(serialized.config).toEqual(original.config);
          }
        }
      ), { numRuns: 100 });
    });
  });

  describe('Save System Edge Cases', () => {
    test('handles empty game state', () => {
      const emptyState = {};
      const saveSuccess = saveSystem.saveGame(emptyState);
      expect(saveSuccess).toBe(true);

      const loadedState = saveSystem.loadGame();
      expect(loadedState).not.toBeNull();
      expect(loadedState.version).toBeDefined();
      expect(loadedState.gameId).toBe('test-game');
    });
  });
});