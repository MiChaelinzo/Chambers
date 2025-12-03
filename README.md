# Skeleton Crew Framework 👻

A minimal horror game framework for building browser-based games with atmospheric tension and fear elements.

[![License](https://img.shields.io/github/license/MiChaelinzo/Chambers?style=for-the-badge)](LICENSE)

## 🎯 Overview

Skeleton Crew is a flexible, configuration-driven game framework designed specifically for horror games. It provides core game systems and horror-specific mechanics that can be extended to create different types of games - from roguelike dungeon crawlers to narrative puzzle games.

**Key Features:**
- 🎮 Complete game loop with entity and scene management
- 👁️ Limited visibility system for atmospheric tension
- 🔊 Audio system for ambient sounds and effects
- 😱 Horror mechanics: sanity, threats, resource scarcity
- ⚙️ Configuration-driven design (no code changes needed)
- 🧪 Comprehensive test suite with property-based testing
- 🎨 Two complete example games included

## 📦 What's Included

This repository contains:

1. **Core Framework** (`framework/`) - Reusable game systems
2. **Dungeon Crawler** (`games/dungeon-crawler/`) - Roguelike with procedural generation
3. **Puzzle Game** (`games/puzzle-game/`) - Narrative exploration with fixed puzzles

Both games use 100% of the same framework code, demonstrating the framework's flexibility.

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/MiChaelinzo/Chambers.git
cd Chambers

# Install dependencies
npm install
```

### Running the Games

**Dungeon Crawler:**
```bash
# Open in browser
open games/dungeon-crawler/index.html
```

**Puzzle Game:**
```bash
# Open in browser
open games/puzzle-game/index.html
```

### Running Tests

```bash
# Run all tests (unit + property-based)
npm test

# Run tests in watch mode
npm run test:watch
```

## 🏗️ Framework Architecture

### Core Systems

The framework is organized into modular systems:

```
framework/
├── core/              # Game loop, entities, scenes
│   ├── GameLoop.js    # RAF-based update/render cycle
│   ├── Entity.js      # Base class for all game objects
│   ├── Scene.js       # Scene container and lifecycle
│   ├── SceneManager.js # Scene loading and transitions
│   └── Game.js        # Main game orchestrator
├── systems/           # Input, rendering, audio
│   ├── InputHandler.js  # Keyboard/mouse input
│   ├── Renderer.js      # Canvas 2D rendering
│   └── AudioSystem.js   # Web Audio API wrapper
├── mechanics/         # Horror-specific systems
│   ├── VisibilitySystem.js  # Limited sight radius
│   ├── ResourceManager.js   # Consumable resources
│   ├── ThreatSystem.js      # Danger detection
│   └── SanitySystem.js      # Mental state tracking
└── utils/
    └── ConfigLoader.js  # JSON configuration loading
```

### Key Concepts

**Entity System**: Everything in the game world is an Entity with position, state, and behavior.

**Scene Management**: Games are organized into Scenes that can be loaded, unloaded, and transitioned between.

**Configuration-Driven**: Game behavior is defined through JSON files, not code changes.

**Horror Mechanics**: Built-in systems for visibility, resources, threats, and sanity create atmospheric tension.

## 🎮 Example Games

### 1. Dungeon Crawler

A roguelike with procedural generation, combat, and permadeath.

**Features:**
- Procedurally generated dungeons
- Enemy AI with chase behavior
- Combat system with health and damage
- Collectible items
- Permadeath mechanics

**Controls:**
- WASD/Arrow Keys: Move
- Mouse: Attack enemies
- Space: Collect items

**Try it:** Open `games/dungeon-crawler/index.html`

### 2. Puzzle Game

A narrative exploration game with fixed puzzles and checkpoints.

**Features:**
- Hand-crafted puzzle rooms
- Interactive objects (doors, keys, clues)
- Inventory system
- Story progression
- Save/load system

**Controls:**
- WASD/Arrow Keys: Move
- E: Interact with objects
- I: Open inventory
- ESC: Save game

**Try it:** Open `games/puzzle-game/index.html`

## 📝 Creating Your Own Game

### Step 1: Set Up Game Directory

```bash
mkdir -p games/my-game/config
mkdir -p games/my-game/entities
```

### Step 2: Create Configuration Files

**game.json** - Main game configuration:

```json
{
  "game": {
    "title": "My Horror Game",
    "startScene": "first_scene",
    "visibility": {
      "mode": "circular",
      "radius": 150
    },
    "resources": [
      { "name": "health", "max": 100, "start": 100 }
    ],
    "mechanics": {
      "permadeath": false,
      "checkpoints": true,
      "combat": false
    }
  }
}
```

**entities.json** - Define entity types:

```json
{
  "entityTypes": {
    "player": {
      "sprite": "player.png",
      "width": 32,
      "height": 32,
      "speed": 100,
      "health": 100
    },
    "enemy": {
      "sprite": "enemy.png",
      "width": 32,
      "height": 32,
      "speed": 50,
      "damage": 10
    }
  }
}
```

**scenes.json** - Define game scenes:

```json
{
  "scenes": {
    "first_scene": {
      "type": "fixed",
      "width": 800,
      "height": 600,
      "entities": [
        { "type": "player", "x": 100, "y": 100 },
        { "type": "enemy", "x": 400, "y": 300 }
      ]
    }
  }
}
```

### Step 3: Create Custom Entities (Optional)

Extend the base Entity class for custom behavior:

```javascript
// games/my-game/entities/CustomEnemy.js
import { Entity } from '../../../framework/core/Entity.js';

export class CustomEnemy extends Entity {
  constructor(id, x, y, config) {
    super(id, 'custom_enemy', x, y, config);
    this.health = config.health || 50;
  }

  update(deltaTime, context) {
    // Custom AI logic
    const player = context.scene.getEntityByType('player');
    if (player) {
      // Move towards player
      const dx = player.position.x - this.position.x;
      const dy = player.position.y - this.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        this.position.x += (dx / distance) * this.config.speed * deltaTime;
        this.position.y += (dy / distance) * this.config.speed * deltaTime;
      }
    }
  }

  render(ctx, camera) {
    ctx.fillStyle = 'red';
    ctx.fillRect(
      this.position.x - camera.x,
      this.position.y - camera.y,
      this.config.width,
      this.config.height
    );
  }
}
```

### Step 4: Create Entry Point

```javascript
// games/my-game/main.js
import { Game } from '../../framework/core/Game.js';
import { ConfigLoader } from '../../framework/utils/ConfigLoader.js';
import { CustomEnemy } from './entities/CustomEnemy.js';

async function init() {
  // Load configurations
  const gameConfig = await ConfigLoader.loadConfig('./config/game.json');
  const entityConfig = await ConfigLoader.loadConfig('./config/entities.json');
  const sceneConfig = await ConfigLoader.loadConfig('./config/scenes.json');

  // Merge configurations
  const config = ConfigLoader.mergeConfigs(gameConfig, {
    entities: entityConfig.entityTypes,
    scenes: sceneConfig.scenes
  });

  // Register custom entities
  const entityRegistry = {
    'custom_enemy': CustomEnemy
  };

  // Initialize game
  const canvas = document.getElementById('gameCanvas');
  const game = new Game(canvas, config, entityRegistry);
  
  game.start();
}

init();
```

### Step 5: Create HTML Page

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Horror Game</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
    canvas {
      border: 2px solid #333;
    }
  </style>
</head>
<body>
  <canvas id="gameCanvas" width="800" height="600"></canvas>
  <script type="module" src="main.js"></script>
</body>
</html>
```

## ⚙️ Configuration Reference

### Game Configuration

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Game title |
| `startScene` | string | Initial scene ID |
| `visibility.mode` | string | "circular", "cone", or "none" |
| `visibility.radius` | number | Visibility range in pixels |
| `resources` | array | Tracked resources (health, stamina, etc.) |
| `mechanics.permadeath` | boolean | Restart on death |
| `mechanics.checkpoints` | boolean | Enable save points |
| `mechanics.combat` | boolean | Enable combat system |

### Entity Configuration

| Property | Type | Description |
|----------|------|-------------|
| `sprite` | string | Image file path |
| `width` | number | Entity width in pixels |
| `height` | number | Entity height in pixels |
| `speed` | number | Movement speed |
| `health` | number | Hit points |
| `damage` | number | Attack damage |
| `collides` | boolean | Enable collision detection |

### Scene Configuration

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | "fixed" or "procedural" |
| `width` | number | Scene width in pixels |
| `height` | number | Scene height in pixels |
| `generator` | string | Generator type (for procedural) |
| `entities` | array | Entity spawn definitions |

## 🧪 Testing

The framework includes comprehensive test coverage:

### Test Structure

```
tests/
├── unit/              # Unit tests for specific functions
├── property/          # Property-based tests (fast-check)
└── integration/       # End-to-end game flow tests
```

### Property-Based Testing

The framework uses property-based testing to verify correctness across many random inputs:

```javascript
// Example: Testing visibility system
test('entities within radius are visible', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 1000 }),
      fc.integer({ min: 0, max: 1000 }),
      fc.integer({ min: 50, max: 200 }),
      (playerX, playerY, radius) => {
        const visibility = new VisibilitySystem({ radius });
        const player = { position: { x: playerX, y: playerY } };
        
        // Entity exactly at radius should be visible
        const entity = {
          position: {
            x: playerX + radius,
            y: playerY
          }
        };
        
        expect(visibility.isVisible(player, entity)).toBe(true);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Running Specific Tests

```bash
# Run only unit tests
npm test -- tests/unit

# Run only property tests
npm test -- tests/property

# Run tests for specific system
npm test -- tests/unit/core/GameLoop.test.js
```

## 📚 API Documentation

### GameLoop

```javascript
const loop = new GameLoop(updateFn, renderFn, targetFPS);
loop.start();    // Start the game loop
loop.stop();     // Stop the game loop
loop.pause();    // Pause without stopping
loop.resume();   // Resume from pause
```

### Entity

```javascript
class MyEntity extends Entity {
  update(deltaTime, context) {
    // Update logic (called every frame)
  }
  
  render(ctx, camera) {
    // Rendering logic
  }
  
  onInteract(player, context) {
    // Interaction logic
  }
}
```

### SceneManager

```javascript
sceneManager.registerScene('scene_id', scene);
sceneManager.loadScene('scene_id', transitionData);
const current = sceneManager.getCurrentScene();
```

### VisibilitySystem

```javascript
const visibility = new VisibilitySystem({ radius: 150, mode: 'circular' });
const visibleEntities = visibility.getVisibleEntities(player, allEntities, scene);
const isVisible = visibility.isVisible(player, entity, scene);
```

### ResourceManager

```javascript
resources.addResource('health', 100, 100, 0);
resources.consume('health', 10);
resources.restore('health', 20);
const health = resources.getResource('health');
```

### AudioSystem

```javascript
audio.loadSound('effect_id', 'path/to/sound.mp3');
audio.playSound('effect_id', volume, loop);
audio.playAmbient('ambient_id', volume);
audio.stopAmbient();
```

## 🔧 Development Workflow

### Adding a New Feature

1. **Update Design**: Document the feature in `.kiro/specs/skeleton-crew-framework/design.md`
2. **Write Tests**: Create property-based and unit tests
3. **Implement**: Add the feature to the framework
4. **Verify**: Run tests to ensure correctness
5. **Document**: Update this README with usage examples

### Debugging

Enable debug mode in your game configuration:

```json
{
  "game": {
    "debug": true
  }
}
```

This will:
- Show entity bounding boxes
- Display FPS counter
- Log system events to console

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Areas for Contribution

- Additional horror mechanics (fog of war, sound propagation)
- More example games
- Performance optimizations
- Additional generators (maze, cave, building)
- Mobile touch controls
- Multiplayer support

## 📄 License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.

## 🙏 Acknowledgments

- Inspired by classic horror games and roguelikes
- Built with modern web technologies
- Tested with Jest and fast-check

## 📞 Support

- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Ask questions in GitHub Discussions
- **Documentation**: See `.kiro/specs/` for detailed specifications

---

**Built with 👻 by the Skeleton Crew team**
