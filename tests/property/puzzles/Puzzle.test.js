import { describe, test, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { Puzzle } from '../../../games/puzzle-game/puzzles/Puzzle.js';

describe('Puzzle Property-Based Tests', () => {
  // Feature: skeleton-crew-framework, Property 15: Puzzle state validation
  // Validates: Requirements 5.3
  test('puzzle should only be marked as solved when all solution conditions are met', () => {
    fc.assert(
      fc.property(
        // Generate random puzzle configurations with unique keys
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          numConditions: fc.integer({ min: 1, max: 5 })
        }),
        ({ id, numConditions }) => {
          // Create conditions with unique keys
          const conditions = [];
          const initialState = {};
          const solutionState = {};

          for (let i = 0; i < numConditions; i++) {
            const key = `key_${i}`; // Ensure unique keys
            const targetValue = i + 100; // Use distinct values
            
            conditions.push({
              key,
              value: targetValue,
              operator: 'equals'
            });

            initialState[key] = i; // Start with wrong values
            solutionState[key] = targetValue; // Solution values
          }

          const puzzle = new Puzzle(id, {
            conditions,
            initialState
          });

          // Property 1: Puzzle should not be solved initially (conditions not met)
          expect(puzzle.isSolved()).toBe(false);

          // Property 2: Puzzle should not be solved with partial conditions met
          if (numConditions > 1) {
            const partialState = { ...initialState };
            // Only satisfy first condition
            partialState['key_0'] = solutionState['key_0'];
            puzzle.setState(partialState);
            expect(puzzle.isSolved()).toBe(false);
          }

          // Property 3: Puzzle should be solved when ALL conditions are met
          puzzle.setState(solutionState);
          expect(puzzle.isSolved()).toBe(true);

          // Property 4: Once solved, puzzle stays solved
          puzzle.setState({ ...solutionState, extraKey: 'extraValue' });
          expect(puzzle.isSolved()).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('puzzle with no conditions should not be marked as solved', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.record({
          key1: fc.integer(),
          key2: fc.string(),
          key3: fc.boolean()
        }),
        (id, state) => {
          // Puzzle with no conditions
          const puzzle = new Puzzle(id, {
            conditions: [],
            initialState: state
          });

          // Should never be solved without conditions
          expect(puzzle.isSolved()).toBe(false);
          
          puzzle.setState({ newKey: 'newValue' });
          expect(puzzle.isSolved()).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('puzzle condition operators work correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 1, max: 100 }), // Avoid 0 to prevent edge cases with greaterThan
        (id, value) => {
          // Test different operators - each puzzle needs to check solution
          const testCases = [
            { op: 'equals', stateValue: value, conditionValue: value, shouldMatch: true },
            { op: 'equals', stateValue: value, conditionValue: value + 1, shouldMatch: false },
            { op: 'notEquals', stateValue: value, conditionValue: value + 1, shouldMatch: true },
            { op: 'notEquals', stateValue: value, conditionValue: value, shouldMatch: false },
            { op: 'greaterThan', stateValue: value, conditionValue: value - 1, shouldMatch: true },
            { op: 'greaterThan', stateValue: value, conditionValue: value, shouldMatch: false },
            { op: 'lessThan', stateValue: value, conditionValue: value + 1, shouldMatch: true },
            { op: 'lessThan', stateValue: value, conditionValue: value, shouldMatch: false }
          ];

          testCases.forEach(({ op, stateValue, conditionValue, shouldMatch }, idx) => {
            const puzzle = new Puzzle(`${id}_${idx}`, {
              conditions: [{
                key: 'testKey',
                value: conditionValue,
                operator: op
              }],
              initialState: { testKey: stateValue }
            });

            expect(puzzle.isSolved()).toBe(shouldMatch);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('puzzle serialization round-trip preserves state', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          state: fc.record({
            key1: fc.integer(),
            key2: fc.string(),
            key3: fc.boolean()
          }),
          solved: fc.boolean()
        }),
        ({ id, state, solved }) => {
          const puzzle = new Puzzle(id, {
            conditions: [{ key: 'key1', value: state.key1, operator: 'equals' }],
            initialState: state
          });

          if (solved) {
            puzzle.markSolved();
          }

          // Serialize and deserialize
          const serialized = puzzle.serialize();
          const newPuzzle = new Puzzle(id, {
            conditions: [{ key: 'key1', value: state.key1, operator: 'equals' }],
            initialState: {}
          });
          newPuzzle.deserialize(serialized);

          // State should be preserved
          expect(newPuzzle.getState()).toEqual(puzzle.getState());
          expect(newPuzzle.isSolved()).toBe(puzzle.isSolved());
        }
      ),
      { numRuns: 100 }
    );
  });

  test('puzzle array conditions work correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 1, maxLength: 5 }),
        (id, items) => {
          // Test 'contains' operator - need to call checkSolution after setting initial state
          const puzzle1 = new Puzzle(id + '_contains', {
            conditions: [{
              key: 'inventory',
              value: items[0],
              operator: 'contains'
            }],
            initialState: { inventory: items }
          });
          // Trigger solution check
          puzzle1.checkSolution();
          expect(puzzle1.isSolved()).toBe(true);

          // Test with missing item
          const puzzle2 = new Puzzle(id + '_missing', {
            conditions: [{
              key: 'inventory',
              value: 999,
              operator: 'contains'
            }],
            initialState: { inventory: items }
          });
          puzzle2.checkSolution();
          expect(puzzle2.isSolved()).toBe(false);

          // Test 'hasAll' operator
          if (items.length >= 2) {
            const requiredItems = items.slice(0, 2);
            const puzzle3 = new Puzzle(id + '_hasAll', {
              conditions: [{
                key: 'inventory',
                value: requiredItems,
                operator: 'hasAll'
              }],
              initialState: { inventory: items }
            });
            puzzle3.checkSolution();
            expect(puzzle3.isSolved()).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('puzzle completion callback is triggered exactly once', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 1, max: 100 }),
        (id, targetValue) => {
          let callCount = 0;
          const puzzle = new Puzzle(id, {
            conditions: [{
              key: 'value',
              value: targetValue,
              operator: 'equals'
            }],
            initialState: { value: 0 },
            onComplete: () => { callCount++; }
          });

          // Not solved yet
          expect(callCount).toBe(0);

          // Solve the puzzle
          puzzle.setState({ value: targetValue });
          expect(callCount).toBe(1);

          // Update state again - callback should not fire again
          puzzle.setState({ value: targetValue, extra: 'data' });
          expect(callCount).toBe(1);

          // Manually mark solved - should not fire again
          puzzle.markSolved();
          expect(callCount).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
