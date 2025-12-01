import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as fc from 'fast-check';
import { InputHandler } from '../../../framework/systems/InputHandler.js';

describe('InputHandler Property Tests', () => {
  // Helper function to simulate key presses directly on the handler
  const simulateKeyPress = (handler, key) => {
    handler.keys.add(key.toLowerCase());
  };

  const simulateKeyRelease = (handler, key) => {
    handler.keys.delete(key.toLowerCase());
  };

  /**
   * Feature: skeleton-crew-framework, Property 4: Input movement vector calculation
   * Validates: Requirements 1.4, 6.1
   * 
   * For any combination of directional key presses (WASD/arrows), the resulting 
   * movement vector should have magnitude <= 1 and point in the correct direction.
   */
  test('movement vector magnitude is always <= 1 for any key combination', () => {
    fc.assert(
      fc.property(
        // Generate random combinations of directional keys
        fc.record({
          w: fc.boolean(),
          a: fc.boolean(),
          s: fc.boolean(),
          d: fc.boolean(),
          arrowUp: fc.boolean(),
          arrowDown: fc.boolean(),
          arrowLeft: fc.boolean(),
          arrowRight: fc.boolean()
        }),
        (keyStates) => {
          // Create fresh input handler for each iteration
          const testHandler = new InputHandler();

          // Simulate key presses based on generated states
          if (keyStates.w) simulateKeyPress(testHandler, 'w');
          if (keyStates.a) simulateKeyPress(testHandler, 'a');
          if (keyStates.s) simulateKeyPress(testHandler, 's');
          if (keyStates.d) simulateKeyPress(testHandler, 'd');
          if (keyStates.arrowUp) simulateKeyPress(testHandler, 'ArrowUp');
          if (keyStates.arrowDown) simulateKeyPress(testHandler, 'ArrowDown');
          if (keyStates.arrowLeft) simulateKeyPress(testHandler, 'ArrowLeft');
          if (keyStates.arrowRight) simulateKeyPress(testHandler, 'ArrowRight');

          // Get movement vector
          const vector = testHandler.getMovementVector();

          // Calculate magnitude
          const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);

          // Property 1: Magnitude should always be <= 1
          expect(magnitude).toBeLessThanOrEqual(1.0);

          // Property 2: Magnitude should be >= 0
          expect(magnitude).toBeGreaterThanOrEqual(0);

          // Property 3: If magnitude > 0, it should be close to 1 (normalized) or exactly 1
          if (magnitude > 0) {
            // For diagonal movement, should be normalized to 1
            // For cardinal movement, should be exactly 1
            const isCardinal = (vector.x === 0 || vector.y === 0);
            if (isCardinal) {
              expect(Math.abs(magnitude - 1.0)).toBeLessThan(0.0001);
            } else {
              // Diagonal should be normalized
              expect(Math.abs(magnitude - 1.0)).toBeLessThan(0.0001);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('movement vector direction matches pressed keys', () => {
    fc.assert(
      fc.property(
        // Generate single direction or combination
        fc.record({
          up: fc.boolean(),
          down: fc.boolean(),
          left: fc.boolean(),
          right: fc.boolean()
        }),
        (directions) => {
          // Create fresh input handler for each iteration
          const testHandler = new InputHandler();

          // Simulate key presses
          if (directions.up) simulateKeyPress(testHandler, 'w');
          if (directions.down) simulateKeyPress(testHandler, 's');
          if (directions.left) simulateKeyPress(testHandler, 'a');
          if (directions.right) simulateKeyPress(testHandler, 'd');

          const vector = testHandler.getMovementVector();

          // Property: Vector components should match the pressed directions
          // Up means negative Y
          if (directions.up && !directions.down) {
            expect(vector.y).toBeLessThan(0);
          }
          // Down means positive Y
          if (directions.down && !directions.up) {
            expect(vector.y).toBeGreaterThan(0);
          }
          // Left means negative X
          if (directions.left && !directions.right) {
            expect(vector.x).toBeLessThan(0);
          }
          // Right means positive X
          if (directions.right && !directions.left) {
            expect(vector.x).toBeGreaterThan(0);
          }

          // Opposite directions should cancel out
          if (directions.up && directions.down) {
            expect(vector.y).toBe(0);
          }
          if (directions.left && directions.right) {
            expect(vector.x).toBe(0);
          }

          // No keys pressed should result in zero vector
          if (!directions.up && !directions.down && !directions.left && !directions.right) {
            expect(vector.x).toBe(0);
            expect(vector.y).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('arrow keys produce same vectors as WASD keys', () => {
    fc.assert(
      fc.property(
        fc.record({
          up: fc.boolean(),
          down: fc.boolean(),
          left: fc.boolean(),
          right: fc.boolean()
        }),
        (directions) => {
          // Test with WASD
          const testHandler1 = new InputHandler();
          if (directions.up) simulateKeyPress(testHandler1, 'w');
          if (directions.down) simulateKeyPress(testHandler1, 's');
          if (directions.left) simulateKeyPress(testHandler1, 'a');
          if (directions.right) simulateKeyPress(testHandler1, 'd');
          const wasdVector = testHandler1.getMovementVector();

          // Test with arrow keys
          const testHandler2 = new InputHandler();
          if (directions.up) simulateKeyPress(testHandler2, 'ArrowUp');
          if (directions.down) simulateKeyPress(testHandler2, 'ArrowDown');
          if (directions.left) simulateKeyPress(testHandler2, 'ArrowLeft');
          if (directions.right) simulateKeyPress(testHandler2, 'ArrowRight');
          const arrowVector = testHandler2.getMovementVector();

          // Property: WASD and arrow keys should produce identical vectors
          expect(wasdVector.x).toBeCloseTo(arrowVector.x, 5);
          expect(wasdVector.y).toBeCloseTo(arrowVector.y, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('key release removes key from active set', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('w', 'a', 's', 'd', 'e', 'q', 'space'), { minLength: 1, maxLength: 10 }),
        (keys) => {
          // Create fresh input handler for each iteration
          const testHandler = new InputHandler();

          // Press all keys
          keys.forEach(key => {
            simulateKeyPress(testHandler, key);
          });

          // All keys should be pressed
          keys.forEach(key => {
            expect(testHandler.isKeyPressed(key)).toBe(true);
          });

          // Release all keys
          keys.forEach(key => {
            simulateKeyRelease(testHandler, key);
          });

          // Property: No keys should be pressed after release
          keys.forEach(key => {
            expect(testHandler.isKeyPressed(key)).toBe(false);
          });

          // Movement vector should be zero
          const vector = testHandler.getMovementVector();
          expect(vector.x).toBe(0);
          expect(vector.y).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('diagonal movement is normalized correctly', () => {
    // Test specific diagonal cases to ensure normalization
    const diagonalCases = [
      { keys: ['w', 'a'], expectedX: -1, expectedY: -1 },
      { keys: ['w', 'd'], expectedX: 1, expectedY: -1 },
      { keys: ['s', 'a'], expectedX: -1, expectedY: 1 },
      { keys: ['s', 'd'], expectedX: 1, expectedY: 1 }
    ];

    diagonalCases.forEach(({ keys, expectedX, expectedY }) => {
      // Create fresh input handler for each case
      const testHandler = new InputHandler();
      
      keys.forEach(key => {
        simulateKeyPress(testHandler, key);
      });

      const vector = testHandler.getMovementVector();
      const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);

      // Property: Diagonal movement should have magnitude of 1 (normalized)
      expect(magnitude).toBeCloseTo(1.0, 5);

      // Property: Direction should be correct
      expect(Math.sign(vector.x)).toBe(Math.sign(expectedX));
      expect(Math.sign(vector.y)).toBe(Math.sign(expectedY));
    });
  });
});
