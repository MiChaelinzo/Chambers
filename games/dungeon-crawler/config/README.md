# Dungeon Crawler Configuration

This directory contains all configuration files for the Skeleton Crew Dungeon Crawler game.

## Configuration Files

### game.json
Main game configuration including:
- **Game metadata**: Title and starting scene
- **Visibility settings**: Circular visibility with 150px radius
- **Resources**: Health and stamina tracking with depletion rates
- **Mechanics**: Permadeath enabled, no checkpoints, combat enabled
- **Audio**: Ambient sounds and effect mappings
- **Threat system**: Detection radius for nearby enemies
- **Sanity system**: Mental state tracking with threshold-based effects

### entities.json
Entity type definitions including:
- **player**: Player character with movement, health, and combat stats
- **enemy**: Enemy entities with chase AI, attack behavior, and health
- **item_health**: Health potions that restore 25 HP
- **item_weapon**: Weapon upgrades that increase damage by 5
- **item_speed**: Speed boosts that increase movement speed by 20
- **item_key**: Keys for unlocking doors or special areas

### scenes.json
Scene configurations including:
- **dungeon_1**: Starter dungeon (50x50, 8 rooms, 5 enemies, 8 items)
- **dungeon_2**: Advanced dungeon (60x60, 12 rooms, 8 enemies, 10 items)

Each scene defines:
- Procedural generation parameters (room count, size ranges)
- Player spawn configuration
- Enemy spawn configuration (count and stats)
- Item spawn configuration (count, types, and weighted distribution)

## Configuration Schema

### Game Configuration
```json
{
  "game": {
    "title": "string",
    "startScene": "string (scene ID)",
    "visibility": {
      "mode": "circular | cone | none",
      "radius": "number (pixels)"
    },
    "resources": [
      {
        "name": "string",
        "max": "number",
        "start": "number",
        "depleteRate": "number (optional, per second)"
      }
    ],
    "mechanics": {
      "permadeath": "boolean",
      "checkpoints": "boolean",
      "combat": "boolean"
    }
  }
}
```

### Entity Configuration
```json
{
  "entityTypes": {
    "entity_id": {
      "sprite": "string (filename)",
      "width": "number (pixels)",
      "height": "number (pixels)",
      "speed": "number (pixels/second)",
      "health": "number",
      "damage": "number",
      "collides": "boolean",
      "name": "string (display name)"
    }
  }
}
```

### Scene Configuration
```json
{
  "scenes": {
    "scene_id": {
      "type": "procedural | fixed",
      "generator": {
        "width": "number (tiles)",
        "height": "number (tiles)",
        "roomCount": "number",
        "minRoomSize": "number (tiles)",
        "maxRoomSize": "number (tiles)",
        "maxAttempts": "number"
      },
      "player": {
        "health": "number",
        "speed": "number",
        "damage": "number"
      },
      "enemies": {
        "count": "number",
        "config": { /* enemy properties */ }
      },
      "items": {
        "count": "number",
        "config": { /* default item properties */ },
        "types": [
          {
            "itemType": "string",
            "value": "number",
            "weight": "number (spawn probability)",
            "name": "string"
          }
        ]
      }
    }
  }
}
```

## Customization Guide

### Adding New Enemy Types
1. Add entity definition to `entities.json`
2. Set appropriate stats (health, speed, damage, chase/attack radius)
3. Reference in scene configuration

### Creating New Scenes
1. Add scene definition to `scenes.json`
2. Configure generator parameters for desired difficulty
3. Set enemy count and stats
4. Define item distribution with weighted types
5. Update `game.json` to set as start scene if desired

### Adjusting Difficulty
- **Easier**: Increase player health/damage, decrease enemy count/stats
- **Harder**: Decrease player health/damage, increase enemy count/stats, reduce item spawns
- **Larger dungeons**: Increase width/height and roomCount
- **More complex layouts**: Increase roomCount, adjust room size ranges

### Item Distribution
Items use weighted random selection:
- Higher weight = more likely to spawn
- Total weight doesn't need to sum to 100
- Example: weight 40 is twice as likely as weight 20

## Requirements Validation

This configuration satisfies the following requirements:

- **3.1**: Game configuration loaded from JSON files
- **3.2**: Entity types, behaviors, and attributes defined through JSON
- **3.3**: Scene layouts and content configured through data files
- **3.4**: Game rules (permadeath, combat) configured through parameters
- **4.1**: Procedural dungeon generation parameters defined
- **4.2**: Enemy spawn configuration with chase AI
- **4.3**: Combat mechanics enabled with damage values
- **4.4**: Collectible items with various effects defined
- **4.5**: Permadeath mechanic enabled in game configuration
