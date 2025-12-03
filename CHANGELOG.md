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

## Version History

- **2.0.0** - Added Particle System, Animation System, Spatial Grid
- **1.0.0** - Initial release with core framework and example games
