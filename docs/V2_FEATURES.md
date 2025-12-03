# Skeleton Crew Framework v2.0 - New Features Guide

## Overview

Version 2.0 introduces three major systems that significantly enhance the framework's capabilities for creating atmospheric horror games with professional visual effects and optimized performance.

## 🎨 Particle System

### What It Does
Creates atmospheric particle effects that enhance the horror atmosphere with visual feedback for events like damage, environmental effects, and ambiance.

### Key Features
- **5 Built-in Particle Types**: blood, dust, fog, sparks, smoke
- **Physics Simulation**: Gravity, velocity, and acceleration
- **Emitter System**: Continuous particle generation
- **Efficient Rendering**: Particle pooling and alpha blending
- **Customizable**: Full control over color, size, lifetime, and behavior

### Quick Start

```javascript
// Get the particle system
const particles = game.getParticleSystem();

// One-time burst
particles.emit({
  position: { x: 100, y: 100 },
  type: 'blood',
  count: 50
});

// Continuous emitter
particles.createEmitter('fog_id', {
  x: 400,
  y: 300,
  rate: 20,
  lifetime: 5,
  particle: { type: 'fog' }
});
```

### Use Cases
- **Blood splatter** when player/enemy takes damage
- **Dust clouds** when moving or colliding
- **Fog effects** for atmospheric areas
- **Sparks** for electrical effects or impacts
- **Smoke** for fire, explosions, or mysterious areas

### Performance
- Supports up to 2000 particles (configurable)
- Automatic particle recycling
- Efficient rendering with minimal overhead

---

## ✨ Animation System

### What It Does
Provides smooth animations and transitions for entities, creating professional-looking visual effects without manual frame-by-frame coding.

### Key Features
- **Property Tweening**: Animate any numeric property
- **10+ Easing Functions**: Linear, ease in/out, cubic, elastic, bounce
- **Built-in Effects**: Fade in/out, shake
- **Frame-based Animations**: Sprite animation support
- **Multi-property Tweening**: Animate multiple properties simultaneously
- **Callbacks**: Execute code when animations complete

### Quick Start

```javascript
// Get the animation system
const anim = game.getAnimationSystem();

// Fade effects
anim.fadeIn(entity, 1.0);
anim.fadeOut(entity, 1.0);

// Shake (for damage/impact)
anim.shake(entity, 10, 0.3);

// Tween position
anim.tween({
  target: entity.position,
  property: 'x',
  to: 500,
  duration: 2.0,
  easing: 'easeInOut'
});

// Multiple properties
anim.tweenMultiple(
  entity.position,
  { x: 500, y: 300 },
  1.5,
  'easeInOut'
);
```

### Easing Functions
- **linear**: Constant speed
- **easeIn/Out/InOut**: Smooth acceleration/deceleration
- **easeInCubic/OutCubic/InOutCubic**: More pronounced curves
- **elastic**: Bouncy spring effect
- **bounce**: Bouncing ball effect

### Use Cases
- **Damage feedback**: Shake and flash red when hit
- **UI transitions**: Smooth menu animations
- **Entity movement**: Smooth pathfinding or scripted movement
- **Visual polish**: Fade in/out for spawning/despawning
- **Camera effects**: Screen shake for explosions

---

## ⚡ Spatial Grid

### What It Does
Optimizes performance by organizing entities into a grid structure, enabling O(1) spatial queries instead of checking every entity against every other entity (O(n²)).

### Key Features
- **Efficient Queries**: Find nearby entities instantly
- **Collision Optimization**: Only check entities in nearby cells
- **Rectangular Queries**: Get all entities in an area
- **Debug Visualization**: See grid structure and entity distribution
- **Configurable**: Adjust cell size for your game's scale

### Quick Start

```javascript
// Get the spatial grid (automatically updated each frame)
const grid = game.getSpatialGrid();

// Find entities near a position
const nearby = grid.getNearby(x, y, radius);

// Find entities in a rectangle
const inArea = grid.getInRect(x, y, width, height);

// Get potential collision pairs
const pairs = grid.getPotentialCollisions();

// Debug render
grid.debugRender(ctx, camera);
```

### Performance Impact

**Without Spatial Grid:**
- 100 entities: 10,000 collision checks per frame
- 500 entities: 250,000 collision checks per frame
- 1000 entities: 1,000,000 collision checks per frame

**With Spatial Grid:**
- 100 entities: ~400 collision checks per frame
- 500 entities: ~2,000 collision checks per frame
- 1000 entities: ~4,000 collision checks per frame

**Result**: 25-250x performance improvement for collision detection!

### Use Cases
- **Collision detection**: Only check nearby entities
- **AI perception**: Find enemies/items in range
- **Area effects**: Damage/heal entities in radius
- **Optimization**: Handle hundreds of entities smoothly

---

## 🔧 Integration Examples

### Complete Damage System

```javascript
class Player extends Entity {
  takeDamage(amount, attacker) {
    this.health -= amount;
    
    const game = this.game;
    
    // Blood splatter
    game.getParticleSystem().emit({
      position: this.position,
      type: 'blood',
      count: 30,
      speed: Math.random() * 100 + 50
    });
    
    // Shake effect
    game.getAnimationSystem().shake(this, 8, 0.3);
    
    // Flash red
    const anim = game.getAnimationSystem();
    this.state.tint = '#ff0000';
    this.state.tintAlpha = 1;
    
    anim.tween({
      target: this.state,
      property: 'tintAlpha',
      to: 0,
      duration: 0.3,
      onComplete: () => {
        this.state.tint = null;
      }
    });
  }
}
```

### Efficient Enemy AI

```javascript
class Enemy extends Entity {
  update(deltaTime, context) {
    const grid = context.game.getSpatialGrid();
    
    // Only check nearby entities (efficient!)
    const nearby = grid.getNearby(
      this.position.x,
      this.position.y,
      this.detectionRadius
    );
    
    // Find player
    const player = nearby.find(e => e.type === 'player');
    
    if (player) {
      this.chasePlayer(player);
    }
  }
}
```

### Atmospheric Environment

```javascript
class FoggyRoom extends Scene {
  load() {
    super.load();
    
    const particles = this.game.getParticleSystem();
    
    // Create fog emitters around the room
    for (let i = 0; i < 5; i++) {
      particles.createEmitter(`fog_${i}`, {
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        rate: 10,
        lifetime: -1, // infinite
        particle: {
          type: 'fog',
          lifetime: 4.0
        }
      });
    }
  }
}
```

---

## 📊 Configuration

Add these options to your game configuration:

```json
{
  "game": {
    "particles": {
      "maxParticles": 2000
    },
    "spatialGridCellSize": 100,
    "worldWidth": 2000,
    "worldHeight": 2000
  }
}
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `particles.maxParticles` | 1000 | Maximum number of particles |
| `spatialGridCellSize` | 100 | Size of each grid cell in pixels |
| `worldWidth` | 2000 | Width of game world for spatial grid |
| `worldHeight` | 2000 | Height of game world for spatial grid |

---

## 🎮 Try It Out

Open `examples/new-features-demo.html` in your browser to see an interactive demonstration of all new features.

The demo includes:
- Buttons to spawn different particle types
- Animation effect demonstrations
- Performance testing with many entities
- Spatial grid visualization

---

## 🔄 Migration Guide

### From v1.0 to v2.0

**Good news**: v2.0 is 100% backward compatible! No changes needed to existing code.

**To use new features**:

1. Access systems through the Game instance:
```javascript
const particles = game.getParticleSystem();
const anim = game.getAnimationSystem();
const grid = game.getSpatialGrid();
```

2. Add configuration (optional):
```json
{
  "particles": { "maxParticles": 2000 },
  "spatialGridCellSize": 100
}
```

3. Start using the new features in your entities!

---

## 📈 Performance Tips

### Particle System
- Use emitters for continuous effects instead of spawning many particles at once
- Clear particles when changing scenes
- Adjust `maxParticles` based on your target hardware

### Animation System
- Reuse tweens instead of creating new ones each frame
- Use callbacks to chain animations instead of polling
- Stop unused animations with `stopTweens(target)`

### Spatial Grid
- Adjust `cellSize` based on your entity sizes (2-3x average entity size works well)
- Use `getNearby()` instead of checking all entities
- Enable debug rendering during development to visualize distribution

---

## 🐛 Troubleshooting

### Particles not appearing
- Check that particle position is within camera view
- Verify particle lifetime is > 0
- Ensure `maxParticles` isn't reached

### Animations not smooth
- Check that `deltaTime` is being passed correctly
- Verify easing function name is correct
- Ensure target object and property exist

### Spatial grid not improving performance
- Adjust `cellSize` (too small = overhead, too large = no benefit)
- Verify entities have unique IDs
- Check that entities are being inserted into grid

---

## 📚 API Reference

See the main README.md for complete API documentation.

---

## 🎯 Next Steps

1. **Try the demo**: Open `examples/new-features-demo.html`
2. **Read the examples**: Check integration examples above
3. **Experiment**: Add particles to your game's damage system
4. **Optimize**: Use spatial grid for collision detection
5. **Polish**: Add animations for smooth transitions

Happy game development! 👻
