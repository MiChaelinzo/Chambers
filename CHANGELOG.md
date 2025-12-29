# Changelog

All notable changes to the Skeleton Crew Framework will be documented in this file.

## [2.0.0] - 2024-12-03

### Added

#### 🎨 Particle System (`framework/systems/ParticleSystem.js`)
- Complete particle effect system for atmospheric visuals
- Built-in particle types: blood, dust, fog, sparks, smoke
- Configurable emitters with rate and lifetime control
- Physics simulation (velocity, acceleration, gravity)
- Particle pooling for performance
- Customizable particle properties (color, size, lifetime, alpha)
- Automatic fade-out over particle lifetime

**Key Features:**
- Emit one-time particle bursts
- Create continuous particle emitters
- Support for up to 2000 particles (configurable)
- Efficient rendering with alpha blending
- Soft rendering for fog/smoke effects

#### ✨ Animation System (`framework/systems/AnimationSystem.js`)
- Comprehensive animation and tweening system
- Property interpolation with smooth easing functions
- Built-in effects: fade in/out, shake
- Frame-based sprite animation support
- Multi-property tweening

**Easing Functions:**
- Linear, easeIn, easeOut, easeInOut
- Cubic variants (easeInCubic, easeOutCubic, easeInOutCubic)
- Elastic and bounce effects

**Key Features:**
- Tween any numeric property
- Chain animations with callbacks
- Ping-pong and looping animations
- Animation state tracking per entity
- Configurable frame rates

#### ⚡ Spatial Grid (`framework/utils/SpatialGrid.js`)
- Spatial partitioning system for performance optimization
- Grid-based entity organization
- O(1) spatial queries instead of O(n²)

**Key Features:**
- Efficient proximity searches
- Rectangular area queries
- Collision pair detection
- Grid statistics and monitoring
- Debug visualization
- Configurable cell size

### Changed

#### Game Class Updates
- Integrated ParticleSystem, AnimationSystem, and SpatialGrid
- Updated `_update()` method to update new systems
- Updated `_render()` method to render particles
- Added getter methods: `getParticleSystem()`, `getAnimationSystem()`, `getSpatialGrid()`
- Automatic spatial grid updates each frame

#### Configuration
- Added `particles.maxParticles` config option
- Added `spatialGridCellSize` config option
- Added `worldWidth` and `worldHeight` config options

### Documentation

#### New Files
- `examples/new-features-demo.html` - Interactive demo of all new features
- `CHANGELOG.md` - This file

#### Updated Files
- `README.md` - Added comprehensive documentation for new features
  - Usage examples for each system
  - API reference
  - Integration examples
  - Configuration guide

### Performance

- Spatial grid reduces collision detection from O(n²) to O(n)
- Particle pooling prevents garbage collection overhead
- Efficient grid-based entity queries
- Optimized particle rendering

### Testing

- All 454 existing tests still passing
- Framework maintains backward compatibility
- No breaking changes to existing API

## [1.0.0] - 2024-12-03

### Initial Release

#### Core Framework
- GameLoop with requestAnimationFrame
- Entity system with lifecycle management
- Scene management and transitions
- Input handling (keyboard/mouse)
- Canvas 2D rendering
- Configuration loader

#### Horror Mechanics
- Visibility system (circular, cone, none)
- Resource management with auto-depletion
- Sanity system with threshold effects
- Threat detection system
- Audio system (Web Audio API)

#### Example Games
- Dungeon Crawler (roguelike with procedural generation)
- Puzzle Game (narrative exploration with save/load)

#### Testing
- 454 tests (unit, property-based, integration)
- Jest test framework
- fast-check for property-based testing
- Comprehensive test coverage

#### Documentation
- Complete README with examples
- API documentation
- Configuration reference
- Development workflow guide

---

## [3.0.0] - 2024-12-03

### Added - Major Feature Release

#### 🌟 Lighting System (`framework/systems/LightingSystem.js`)
- Dynamic lighting with point lights and spotlights
- Real-time shadow casting
- Flickering lights for atmospheric effects
- Ambient light control
- Color-tinted lights
- Performance-optimized rendering

#### 🧭 Pathfinding System (`framework/ai/Pathfinding.js`)
- A* pathfinding algorithm
- Grid-based navigation
- Diagonal movement support
- Path smoothing
- Line-of-sight checks
- Dynamic obstacle management
- Debug visualization

#### 💬 Dialogue System (`framework/systems/DialogueSystem.js`)
- Branching conversation trees
- Conditional dialogue nodes
- Choice-based interactions
- Variable system for tracking state
- Dialogue history
- Save/load dialogue state
- Event callbacks

#### 🎯 Quest System (`framework/systems/QuestSystem.js`)
- Quest and objective tracking
- Quest chains and prerequisites
- Repeatable quests
- Time-limited quests
- Quest categories and levels
- Reward system
- Progress tracking
- Save/load quest state

#### 🤖 Behavior Tree System (`framework/ai/BehaviorTree.js`)
- Complete behavior tree implementation
- Composite nodes: Sequence, Selector, Parallel
- Decorator nodes: Inverter, Repeater, UntilFail, Succeeder
- Action and Condition nodes
- Fluent builder API
- Reusable AI behaviors

### Changed

#### Game Class Updates
- Integrated all 5 new systems
- Added getter methods for new systems
- Updated `_update()` to update new systems
- Enhanced configuration options

### Performance

- Lighting system uses off-screen canvas for optimization
- Pathfinding uses A* with heuristics for efficiency
- Behavior trees support complex AI without performance impact

### Documentation

- Comprehensive API documentation for all new systems
- Integration examples
- Best practices guide

## Version History

- **3.1.0** - Added SaveSystem, AchievementSystem, Enhanced AudioSystem, Updated dependencies
- **3.0.0** - Added Lighting, Pathfinding, Dialogue, Quest, and Behavior Tree systems
- **2.0.0** - Added Particle System, Animation System, Spatial Grid
- **1.0.0** - Initial release with core framework and example games

---

## [3.1.0] - 2024-12-29

### Added

#### 💾 SaveSystem (`framework/utils/SaveSystem.js`)
- Complete save/load system for game state persistence
- localStorage-based storage with fallback detection
- Multiple save slots (configurable, default: 3)
- Auto-save functionality with configurable intervals
- Save state serialization and deserialization
- Export/import saves for backup and sharing
- Save metadata tracking (timestamp, custom metadata)
- Storage statistics and monitoring
- **54 comprehensive unit tests**

**Key Features:**
- Multiple independent save slots
- Auto-save with customizable interval
- Import/export for backup
- Storage usage statistics
- Validates save slot numbers
- Graceful handling of unavailable storage

#### 🏆 AchievementSystem (`framework/systems/AchievementSystem.js`)
- Comprehensive achievement tracking system
- Multiple achievement types: simple, progress, secret, challenge
- Progress tracking with percentage calculation
- Achievement persistence using localStorage
- Callback system for unlock and progress events
- Hidden/secret achievements
- Achievement rewards system
- Statistics tracking
- **32 comprehensive unit tests**

**Achievement Types:**
- **Simple** - One-time unlock achievements
- **Progress** - Incremental progress tracking with targets
- **Secret** - Hidden achievements until unlocked
- **Challenge** - Special difficulty achievements

**Key Features:**
- Unlock notifications (customizable)
- Progress incrementation
- Achievement statistics
- Callback events (onUnlock, onProgress)
- Persistent storage with gameId
- Hidden achievements support
- Reward metadata

#### 🔊 Enhanced AudioSystem
- Audio preloading functionality (`preloadSounds`)
- Fade in/out for ambient music
- Spatial audio support (distance-based volume)
- Ambient volume control methods
- Improved error handling

**New Methods:**
- `preloadSounds(sounds)` - Batch load multiple sounds
- `fadeInAmbient(id, targetVolume, duration)` - Fade in ambient music
- `fadeOutAmbient(duration, stopAfterFade)` - Fade out ambient music
- `fadeAmbientTo(targetVolume, duration)` - Fade to new volume
- `playSpatialSound(id, sourcePos, listenerPos, maxVolume, loop)` - Distance-based audio
- `updateSpatialSound(audioObj, sourcePos, listenerPos, maxVolume)` - Update spatial audio
- `setAmbientVolume(volume)` - Set ambient volume
- `getAmbientVolume()` - Get current ambient volume

### Changed

#### Dependencies Updated
- **Jest** updated from 29.7.0 to 30.2.0
- **@jest/globals** updated from 29.7.0 to 30.2.0
- **jest-environment-jsdom** updated from 29.7.0 to 30.2.0
- **fast-check** updated from 3.23.2 to 4.5.2

All tests passing with new versions (507 tests)

#### Configuration
- Added `audio.enableSpatialAudio` config option
- Added `audio.maxDistance` config option for spatial audio range

### Documentation

#### Updated Files
- `README.md` - Added comprehensive v3.1 feature documentation
  - SaveSystem usage examples and API
  - AchievementSystem usage examples and API
  - Enhanced AudioSystem features
  - Configuration examples
- `CHANGELOG.md` - This file with v3.1 release notes
- `.gitignore` - Added node_modules and package-lock.json

### Testing

- Added 22 unit tests for SaveSystem
- Added 32 unit tests for AchievementSystem
- All 507 existing tests still passing
- Total: 561 tests passing
- Maintained backward compatibility
- No breaking changes to existing API

### Performance

- SaveSystem uses localStorage with efficient key-based storage
- AchievementSystem optimized with Map/Set data structures
- Spatial audio calculations optimized for performance
- Minimal overhead from new systems


