import { describe, test, expect } from '@jest/globals';
import { Puzzle } from '../../../games/puzzle-game/puzzles/Puzzle.js';

describe('Puzzle Unit Tests', () => {
  test('creates puzzle with initial state', () => {
    const puzzle = new Puzzle('test-puzzle', {
      conditions: [{ key: 'switch', value: true, operator: 'equals' }],
      initialState: { switch: false }
    });

    expect(puzzle.id).toBe('test-puzzle');
    expect(puzzle.isSolved()).toBe(false);
    expect(puzzle.getState()).toEqual({ switch: false });
  });

  test('marks puzzle as solved when conditions are met', () => {
    const puzzle = new Puzzle('test-puzzle', {
      conditions: [
        { key: 'key1', value: 'red', operator: 'equals' },
        { key: 'key2', value: 10, operator: 'greaterThan' }
      ],
      initialState: { key1: 'blue', key2: 5 }
    });

    expect(puzzle.isSolved()).toBe(false);

    puzzle.setState({ key1: 'red', key2: 15 });
    expect(puzzle.isSolved()).toBe(true);
  });

  test('triggers completion callback when solved', () => {
    let callbackFired = false;
    let callbackPuzzle = null;

    const puzzle = new Puzzle('test-puzzle', {
      conditions: [{ key: 'done', value: true, operator: 'equals' }],
      initialState: { done: false },
      onComplete: (p) => {
        callbackFired = true;
        callbackPuzzle = p;
      }
    });

    expect(callbackFired).toBe(false);

    puzzle.setState({ done: true });
    expect(callbackFired).toBe(true);
    expect(callbackPuzzle).toBe(puzzle);
  });

  test('serializes and deserializes puzzle state', () => {
    const puzzle = new Puzzle('test-puzzle', {
      conditions: [{ key: 'value', value: 42, operator: 'equals' }],
      initialState: { value: 10, extra: 'data' }
    });

    puzzle.setState({ value: 42, extra: 'data' });

    const serialized = puzzle.serialize();
    expect(serialized).toEqual({
      id: 'test-puzzle',
      state: { value: 42, extra: 'data' },
      solved: true,
      completedAt: expect.any(Number)
    });

    const newPuzzle = new Puzzle('test-puzzle', {
      conditions: [{ key: 'value', value: 42, operator: 'equals' }],
      initialState: {}
    });

    newPuzzle.deserialize(serialized);
    expect(newPuzzle.getState()).toEqual({ value: 42, extra: 'data' });
    expect(newPuzzle.isSolved()).toBe(true);
  });

  test('resets puzzle to initial state', () => {
    const puzzle = new Puzzle('test-puzzle', {
      conditions: [{ key: 'value', value: 100, operator: 'equals' }],
      initialState: { value: 0 }
    });

    puzzle.setState({ value: 100 });
    expect(puzzle.isSolved()).toBe(true);

    puzzle.reset({ value: 0 });
    expect(puzzle.isSolved()).toBe(false);
    expect(puzzle.getState()).toEqual({ value: 0 });
  });

  test('tracks puzzle progress', () => {
    const puzzle = new Puzzle('test-puzzle', {
      conditions: [
        { key: 'key1', value: 1, operator: 'equals' },
        { key: 'key2', value: 2, operator: 'equals' },
        { key: 'key3', value: 3, operator: 'equals' }
      ],
      initialState: { key1: 0, key2: 0, key3: 0 }
    });

    let progress = puzzle.getProgress();
    expect(progress).toEqual({ total: 3, met: 0, percentage: 0, solved: false });

    puzzle.setState({ key1: 1, key2: 0, key3: 0 });
    progress = puzzle.getProgress();
    expect(progress.total).toBe(3);
    expect(progress.met).toBe(1);
    expect(progress.percentage).toBeCloseTo(33.33, 2);
    expect(progress.solved).toBe(false);

    puzzle.setState({ key1: 1, key2: 2, key3: 3 });
    progress = puzzle.getProgress();
    expect(progress).toEqual({ total: 3, met: 3, percentage: 100, solved: true });
  });

  test('handles array contains operator', () => {
    const puzzle = new Puzzle('test-puzzle', {
      conditions: [{ key: 'inventory', value: 'key', operator: 'contains' }],
      initialState: { inventory: [] }
    });

    expect(puzzle.isSolved()).toBe(false);

    puzzle.setState({ inventory: ['sword', 'key', 'potion'] });
    expect(puzzle.isSolved()).toBe(true);
  });

  test('handles array hasAll operator', () => {
    const puzzle = new Puzzle('test-puzzle', {
      conditions: [{ key: 'items', value: ['a', 'b'], operator: 'hasAll' }],
      initialState: { items: ['a'] }
    });

    expect(puzzle.isSolved()).toBe(false);

    puzzle.setState({ items: ['a', 'b', 'c'] });
    expect(puzzle.isSolved()).toBe(true);
  });

  test('throws error when deserializing with mismatched ID', () => {
    const puzzle = new Puzzle('puzzle-1', {
      conditions: [],
      initialState: {}
    });

    const wrongData = {
      id: 'puzzle-2',
      state: {},
      solved: false,
      completedAt: null
    };

    expect(() => puzzle.deserialize(wrongData)).toThrow('Cannot deserialize puzzle data: ID mismatch');
  });
});
