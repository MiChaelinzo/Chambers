# Puzzle System

The Puzzle system provides state tracking, solution validation, and completion callbacks for puzzle-based gameplay.

## Features

- **State Management**: Track puzzle state with key-value pairs
- **Condition Validation**: Define solution conditions with multiple operators
- **Completion Callbacks**: Trigger actions when puzzles are solved
- **Serialization**: Save and load puzzle state for checkpoints
- **Progress Tracking**: Monitor how many conditions are met

## Usage

### Creating a Puzzle

```javascript
import { Puzzle } from './puzzles/Puzzle.js';

const puzzle = new Puzzle('door-puzzle', {
  conditions: [
    { key: 'hasKey', value: true, operator: 'equals' },
    { key: 'switchesFlipped', value: 3, operator: 'greaterThanOrEqual' }
  ],
  initialState: {
    hasKey: false,
    switchesFlipped: 0
  },
  onComplete: (puzzle) => {
    console.log('Puzzle solved! Door unlocked.');
  }
});
```

### Updating State

```javascript
// Update puzzle state
puzzle.setState({ switchesFlipped: 1 });

// Check if solved
if (puzzle.isSolved()) {
  console.log('Puzzle complete!');
}
```

### Condition Operators

- `equals`: State value equals target value
- `notEquals`: State value does not equal target value
- `greaterThan`: State value is greater than target value
- `lessThan`: State value is less than target value
- `greaterThanOrEqual`: State value is >= target value
- `lessThanOrEqual`: State value is <= target value
- `contains`: Array state contains target value
- `hasAll`: Array state contains all values in target array

### Serialization

```javascript
// Save puzzle state
const savedData = puzzle.serialize();
localStorage.setItem('puzzle-state', JSON.stringify(savedData));

// Load puzzle state
const loadedData = JSON.parse(localStorage.getItem('puzzle-state'));
puzzle.deserialize(loadedData);
```

### Progress Tracking

```javascript
const progress = puzzle.getProgress();
console.log(`Progress: ${progress.met}/${progress.total} (${progress.percentage}%)`);
```

## Example: Multi-Step Puzzle

```javascript
const complexPuzzle = new Puzzle('ritual-puzzle', {
  conditions: [
    { key: 'candlesLit', value: 4, operator: 'equals' },
    { key: 'symbolsDrawn', value: ['circle', 'triangle', 'star'], operator: 'hasAll' },
    { key: 'bookOpen', value: true, operator: 'equals' }
  ],
  initialState: {
    candlesLit: 0,
    symbolsDrawn: [],
    bookOpen: false
  },
  onComplete: (puzzle) => {
    // Trigger story event
    revealSecretPassage();
  }
});

// Player actions update state
function lightCandle() {
  const state = complexPuzzle.getState();
  complexPuzzle.setState({ candlesLit: state.candlesLit + 1 });
}

function drawSymbol(symbol) {
  const state = complexPuzzle.getState();
  complexPuzzle.setState({ 
    symbolsDrawn: [...state.symbolsDrawn, symbol] 
  });
}
```
