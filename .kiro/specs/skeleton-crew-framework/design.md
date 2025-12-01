# Design Document

## Overview

Skeleton Crew is a minimal horror game framework built with JavaScript/TypeScript for web browsers. The framework follows a component-based architecture where game systems are modular and reusable. The design emphasizes clarity through minimal abstractions while maintaining flexibility through configuration and extension points.

The framework will be demonstrated through two complete game implementations:
1. **Dungeon Crawler**: A roguelike with procedural generation, combat, and permadeath
2. **Puzzle Game**: A narrative-driven exploration game with fixed puzzles and checkpoints

Both games will run in the browser using HTML5 Canvas for rendering and will share 100% of the framework code.

## Architecture

### High-Level Structure

```
skeleton-crew/
├── framework/           # Core reusable framework
│   ├── core/           # Game loop, entity system, scene manager
│   ├── systems/        # Input, rendering, audio, visibility
│   ├── mechanics/      # Horror-specific systems (resources, threats, sanity)
│   └── utils/          # Configuration loader, validation, helpers
├── games/
│   ├── dungeon-crawler/  # Roguelike implementation
│   │   ├── config/       # Game-specific configuration
│   │   ├── entities/     # Custom entity behaviors
│   │   ├── generation/   # Procedural generation logic
│   │   └── main.js       # Game entry point
│   └── puzzle-game/      # Puzzle game implementation
│       ├── config/       # Game-specific configuration
│       ├── entities/     # Custom entity behaviors
│       ├── puzzles/      # Puzzle logic
│       └── main.js       # Game entry point
└── shared/
    └── assets/         # Shared sprites, sounds, fonts
```

### Technology Stack

- **Language**: JavaScript (ES6+) with optional TypeScript for type safety
- **Rendering**: HTML5 Canvas 2D Context
- **Audio**: Web Audio API
- **Build**: Simple ES modules (no complex bundler required for MVP)
- **Testing**: Jest for unit tests, fast-check for property-based testing

## Components and Interfaces

### Core Framework Components

#### 1. Game Loop (framework/core/GameLoop.js)

The game loop manages the continuous update-render cycle.

```javascript
class GameLoop {
  constructor(updateFn, renderFn, targetFPS = 60) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
    this.targetFPS = targetFPS;
    this.isRunning = false;
    this.lastTime = 0;
  }

  start() { /* RAF-based loop */ }
  stop() { /* Stop loop */ }
  pause() { /* Pause without stopping */ }
  resume() { /* Resume from pause */ }
}
```

#### 2. Entity System (framework/core/Entity.js)

Entities represent all game objects with position, state, and behavior.

```javascript
class Entity {
  constructor(id, type, x, y, config = {}) {
    this.id = id;
    this.type = type;
    this.position = { x, y };
    this.state = {};
    this.config = config;
  }

  update(deltaTime, context) { /* Override in subclasses */ }
  render(ctx, camera) { /* Override in subclasses */ }
  onInteract(player, context) { /* Override in subclasses */ }
}
```

#### 3. Scene Manager (framework/core/SceneManager.js)

Manages loading, unloading, and transitioning between scenes.

```javascript
class SceneManager {
  constructor() {
    this.scenes = new Map();
    this.currentScene = null;
  }

  registerScene(id, scene) { /* Add scene */ }
  loadScene(id, transitionData) { /* Switch scenes */ }
  getCurrentScene() { /* Get active scene */ }
}

class Scene {
  constructor(id, config) {
    this.id = id;
    this.entities = [];
    this.config = config;
  }

  load() { /* Initialize scene */ }
  unload() { /* Cleanup */ }
  update(deltaTime) { /* Update all entities */ }
  render(ctx, camera) { /* Render all entities */ }
}
```

#### 4. Input Handler (framework/systems/InputHandler.js)

Captures and processes keyboard/mouse input.

```javascript
class InputHandler {
  constructor() {
    this.keys = new Set();
    this.mousePos = { x: 0, y: 0 };
    this.mouseButtons = new Set();
  }

  isKeyPressed(key) { /* Check key state */ }
  getMovementVector() { /* Get WASD/arrow movement */ }
  onKeyDown(callback) { /* Register callback */ }
  onMouseClick(callback) { /* Register callback */ }
}
```

### Horror Mechanics Components

#### 5. Visibility System (framework/mechanics/VisibilitySystem.js)

Limits what the player can see based on distance and obstacles.

```javascript
class VisibilitySystem {
  constructor(config) {
    this.visibilityRadius = config.radius || 5;
    this.mode = config.mode || 'circular'; // circular, cone, none
  }

  getVisibleEntities(player, entities, scene) {
    /* Return entities within visibility range */
  }

  isVisible(player, entity, scene) {
    /* Check if specific entity is visible */
  }
}
```

#### 6. Resource Manager (framework/mechanics/ResourceManager.js)

Tracks consumable resources with scarcity mechanics.

```javascript
class ResourceManager {
  constructor(config) {
    this.resources = new Map(); // name -> { current, max, depleteRate }
  }

  addResource(name, current, max, depleteRate = 0) { /* Add resource */ }
  consume(name, amount) { /* Use resource */ }
  restore(name, amount) { /* Restore resource */ }
  update(deltaTime) { /* Auto-deplete resources */ }
  getResource(name) { /* Get resource state */ }
}
```

#### 7. Audio System (framework/systems/AudioSystem.js)

Plays ambient sounds and triggered effects.

```javascript
class AudioSystem {
  constructor() {
    this.audioContext = new AudioContext();
    this.sounds = new Map();
    this.ambientTrack = null;
  }

  loadSound(id, url) { /* Load audio file */ }
  playSound(id, volume = 1.0, loop = false) { /* Play effect */ }
  playAmbient(id, volume = 0.5) { /* Play background */ }
  stopAmbient() { /* Stop background */ }
}
```

#### 8. Threat System (framework/mechanics/ThreatSystem.js)

Detects and alerts player to nearby dangers.

```javascript
class ThreatSystem {
  constructor(config) {
    this.detectionRadius = config.radius || 10;
    this.threatLevels = new Map(); // entity -> threat level
  }

  registerThreat(entity, level) { /* Mark entity as threat */ }
  getNearbyThreats(player, entities) { /* Get threats in range */ }
  getThreatLevel(player, entities) { /* Calculate overall threat */ }
}
```

#### 9. Sanity System (framework/mechanics/SanitySystem.js)

Tracks player mental state affecting gameplay.

```javascript
class SanitySystem {
  constructor(maxSanity = 100) {
    this.current = maxSanity;
    this.max = maxSanity;
    this.effects = [];
  }

  decrease(amount, reason) { /* Reduce sanity */ }
  increase(amount) { /* Restore sanity */ }
  addEffect(threshold, effect) { /* Add sanity-based effect */ }
  getActiveEffects() { /* Get current effects */ }
  update(deltaTime) { /* Apply effects */ }
}
```

### Utility Components

#### 10. Configuration Loader (framework/utils/ConfigLoader.js)

Loads and validates JSON configuration files.

```javascript
class ConfigLoader {
  static async loadConfig(path) {
    /* Load and parse JSON */
  }

  static validateConfig(config, schema) {
    /* Validate against schema */
  }

  static mergeConfigs(base, override) {
    /* Deep merge configurations */
  }
}
```

#### 11. Renderer (framework/systems/Renderer.js)

Handles all canvas drawing operations.

```javascript
class Renderer {
  constructor(canvas) {
    this.ctx = canvas.getContext('2d');
    this.canvas = canvas;
    this.camera = { x: 0, y: 0, zoom: 1 };
  }

  clear() { /* Clear canvas */ }
  drawEntity(entity, visible) { /* Draw entity sprite/shape */ }
  drawUI(uiData) { /* Draw HUD elements */ }
  setCamera(x, y, zoom) { /* Update camera */ }
}
```

## Data Models

### Entity Configuration Schema

```json
{
  "entityTypes": {
    "player": {
      "sprite": "player.png",
      "width": 32,
      "height": 32,
      "speed": 100,
      "health": 100,
      "collides": true
    },
    "enemy": {
      "sprite": "enemy.png",
      "width": 32,
      "height": 32,
      "speed": 50,
      "damage": 10,
      "health": 30,
      "ai": "chase"
    }
  }
}
```

### Scene Configuration Schema

```json
{
  "scenes": {
    "dungeon_1": {
      "type": "procedural",
      "width": 50,
      "height": 50,
      "generator": "dungeon",
      "entities": [
        { "type": "player", "spawn": "random" },
        { "type": "enemy", "count": 5, "spawn": "random" }
      ]
    },
    "puzzle_room": {
      "type": "fixed",
      "layout": "layouts/room1.json",
      "entities": [
        { "type": "player", "x": 5, "y": 5 },
        { "type": "door", "x": 10, "y": 5, "locked": true },
        { "type": "key", "x": 15, "y": 8 }
      ]
    }
  }
}
```

### Game Configuration Schema

```json
{
  "game": {
    "title": "Dungeon Crawler",
    "startScene": "dungeon_1",
    "visibility": {
      "mode": "circular",
      "radius": 5
    },
    "resources": [
      { "name": "health", "max": 100, "start": 100 },
      { "name": "stamina", "max": 100, "start": 100, "depleteRate": 1 }
    ],
    "mechanics": {
      "permadeath": true,
      "checkpoints": false,
      "combat": true
    }
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Game loop timing consistency
*For any* game loop configuration with a target FPS, the actual time between update calls should be within a reasonable tolerance of the expected interval (1000ms / targetFPS ± 10%).
**Validates: Requirements 1.1**

### Property 2: Entity lifecycle management
*For any* entity added to a scene, the entity should be retrievable by ID, should maintain its configured properties, and should be removed when deleted.
**Validates: Requirements 1.2, 3.2**

### Property 3: Scene transition state consistency
*For any* scene transition, loading a new scene should unload the previous scene, set the new scene as current, and initialize all entities defined in the scene configuration.
**Validates: Requirements 1.3**

### Property 4: Input movement vector calculation
*For any* combination of directional key presses (WASD/arrows), the resulting movement vector should have magnitude ≤ 1 and point in the correct direction.
**Validates: Requirements 1.4, 6.1**

### Property 5: Visibility radius filtering
*For any* player position and visibility radius, entities within the radius should be marked visible and entities outside should be marked invisible.
**Validates: Requirements 2.1, 7.5**

### Property 6: Resource bounds enforcement
*For any* resource with max and min values, consuming or restoring the resource should never result in values outside the [0, max] range.
**Validates: Requirements 2.2**

### Property 7: Audio system sound tracking
*For any* sound loaded into the audio system, the sound should be retrievable by ID and play requests should be tracked correctly.
**Validates: Requirements 2.3**

### Property 8: Threat detection radius
*For any* player position and threat detection radius, all entities marked as threats within the radius should be included in the nearby threats list.
**Validates: Requirements 2.4**

### Property 9: Sanity threshold effects
*For any* sanity system with threshold-based effects, when sanity drops below a threshold, the corresponding effect should activate, and when sanity rises above the threshold, the effect should deactivate.
**Validates: Requirements 2.5**

### Property 10: Configuration round-trip consistency
*For any* valid game configuration object, serializing to JSON and then parsing should produce an equivalent configuration.
**Validates: Requirements 3.1**

### Property 11: Configuration validation error messages
*For any* invalid configuration (missing required fields, invalid types, out-of-range values), the validation should fail and return a clear error message indicating the specific problem.
**Validates: Requirements 3.5**

### Property 12: Dungeon generation connectivity
*For any* generated dungeon layout, all rooms should be reachable from the starting room through corridors (the dungeon graph should be connected).
**Validates: Requirements 4.1**

### Property 13: Combat damage application
*For any* combat interaction where an attacker deals damage to a target, the target's health should decrease by the damage amount, and when health reaches zero, the entity should be marked as dead.
**Validates: Requirements 4.3**

### Property 14: Item collection inventory addition
*For any* collectible item that a player picks up, the item should be added to the player's inventory and the item entity should be removed from the scene.
**Validates: Requirements 4.4**

### Property 15: Puzzle state validation
*For any* puzzle with defined solution conditions, the puzzle should only be marked as solved when all solution conditions are met.
**Validates: Requirements 5.3**

### Property 16: Save/load state round-trip
*For any* game state, saving the state and then loading it should restore all player properties, inventory, scene, and progress to their exact values at save time.
**Validates: Requirements 5.5**

### Property 17: Interaction range validation
*For any* interactive entity, the interaction should only trigger when the player is within the configured interaction range, and should be rejected with an error message when out of range.
**Validates: Requirements 6.2, 6.5**

### Property 18: Inventory state accuracy
*For any* player inventory, the inventory data structure should contain exactly the items the player has collected, with correct quantities and properties.
**Validates: Requirements 6.3**

### Property 19: Render call coverage
*For any* scene with entities, the render function should be called exactly once per visible entity per frame.
**Validates: Requirements 7.1, 7.4**

### Property 20: UI data completeness
*For any* player state, the UI data structure should include all required status information: current health, all tracked resources, and complete inventory contents.
**Validates: Requirements 7.2**

### Property 21: Scene system flexibility
*For any* scene configuration marked as "procedural" or "fixed", the scene system should correctly handle both types, generating content for procedural scenes and loading exact layouts for fixed scenes.
**Validates: Requirements 9.4**

### Property 22: Game loop mode flexibility
*For any* game loop configured for "continuous" or "turn-based" mode, the loop should update at the appropriate rate (continuous: every frame, turn-based: only on player action).
**Validates: Requirements 9.5**

## Error Handling

### Framework-Level Error Handling

1. **Configuration Errors**: Invalid or missing configuration files should throw descriptive errors during initialization, preventing the game from starting in an invalid state.

2. **Asset Loading Errors**: Missing sprites, sounds, or other assets should log warnings and use fallback placeholders rather than crashing.

3. **Entity Errors**: Invalid entity operations (e.g., interacting with non-existent entities) should return error results without crashing the game loop.

4. **Scene Errors**: Failed scene transitions should revert to the previous scene and log the error.

5. **Input Errors**: Invalid input commands should be ignored silently to prevent disrupting gameplay.

### Game-Specific Error Handling

1. **Dungeon Generation Failures**: If procedural generation fails to create a valid dungeon after N attempts, fall back to a pre-designed emergency layout.

2. **Puzzle State Corruption**: If puzzle state becomes invalid, reset the puzzle to its initial state and notify the player.

3. **Save/Load Errors**: Failed save operations should notify the player but allow continued play. Failed load operations should fall back to a new game.

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

- **Empty state handling**: Test that systems handle empty collections (no entities, no resources, no threats)
- **Boundary values**: Test resource limits (0, max), visibility at exact radius, movement at world edges
- **Error conditions**: Test invalid configurations, missing assets, out-of-bounds positions
- **Integration points**: Test that systems interact correctly (e.g., visibility system with renderer)

Example unit tests:
- Empty scene renders without errors
- Resource consumption at exactly 0 prevents further consumption
- Entity at exact visibility radius boundary is handled consistently
- Invalid JSON configuration throws appropriate error

### Property-Based Testing

Property-based tests will verify universal properties across many randomly generated inputs using **fast-check** (JavaScript property testing library). Each test will run a minimum of 100 iterations.

Each property-based test will:
1. Generate random valid inputs (entities, configurations, game states)
2. Execute the system under test
3. Assert that the correctness property holds
4. Report any failing examples for debugging

Example property tests:
- Generate random entity positions and verify visibility calculations
- Generate random resource operations and verify bounds are maintained
- Generate random dungeon seeds and verify connectivity
- Generate random game states and verify save/load round-trips

**Test Tagging Convention**: Each property-based test will include a comment tag in this format:
```javascript
// Feature: skeleton-crew-framework, Property 6: Resource bounds enforcement
test('resource values stay within bounds', () => { ... });
```

### Testing Tools

- **Jest**: Unit test framework for JavaScript
- **fast-check**: Property-based testing library for JavaScript
- **Canvas Mock**: Mock HTML5 Canvas for rendering tests
- **Web Audio Mock**: Mock Web Audio API for audio tests

### Test Organization

```
tests/
├── unit/
│   ├── core/           # Game loop, entity, scene tests
│   ├── systems/        # Input, rendering, audio tests
│   └── mechanics/      # Horror mechanics tests
├── property/
│   ├── core/           # Property tests for core systems
│   ├── systems/        # Property tests for systems
│   └── mechanics/      # Property tests for mechanics
└── integration/
    ├── dungeon-crawler/  # End-to-end dungeon crawler tests
    └── puzzle-game/      # End-to-end puzzle game tests
```

## Implementation Notes

### Performance Considerations

1. **Entity Updates**: Use spatial partitioning (grid-based) for efficient entity queries in large scenes
2. **Visibility Calculations**: Cache visibility results per frame to avoid redundant calculations
3. **Rendering**: Only render entities within camera view + visibility range
4. **Audio**: Limit concurrent sound effects to prevent audio context overload

### Browser Compatibility

- Target modern browsers with ES6+ support (Chrome 90+, Firefox 88+, Safari 14+)
- Use Canvas 2D context (widely supported)
- Gracefully degrade audio if Web Audio API unavailable

### Extensibility Points

Games can extend the framework through:
1. **Custom Entity Classes**: Extend base Entity class with game-specific behavior
2. **Custom Generators**: Implement procedural generation algorithms
3. **Custom Puzzle Logic**: Implement puzzle validation and state management
4. **Configuration Files**: Define all game content through JSON without code changes

### Development Workflow

1. Develop framework core systems first
2. Create dungeon crawler as first implementation to validate framework
3. Create puzzle game as second implementation to verify flexibility
4. Refactor framework based on learnings from both implementations
5. Document patterns and best practices for future game implementations
