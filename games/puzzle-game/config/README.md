# Puzzle Game Configuration

This directory contains the configuration files for the Skeleton Crew Puzzle Game.

## Configuration Files

### game.json
Main game configuration including:
- Game title and starting scene
- Visibility system settings (circular, radius 8)
- Resource management (sanity system)
- Game mechanics (checkpoints, inventory, interactions, puzzles)
- Audio settings for ambient and effect sounds
- Sanity system with threshold-based effects
- UI configuration for inventory and interaction prompts
- Save/load progression system

### entities.json
Entity type definitions for all interactive objects:
- **player**: Main character with inventory and sanity
- **door**: Lockable doors with scene transitions
- **key**: Collectible keys for unlocking doors
- **clue**: Examinable text objects that reveal story
- **interactive_object**: General objects with custom interactions
- **checkpoint**: Save points for progress
- **wall/floor**: Basic environment tiles
- **bookshelf**: Searchable furniture
- **table**: Surface for placing items
- **torch**: Light sources
- **crystal_orb**: Magical puzzle objects
- **telescope/star_chart**: Astronomy puzzle components

### scenes.json
Fixed scene layouts with pre-designed puzzles:
- **entrance_hall**: Starting area with basic key/door puzzle
- **library**: Book-filled room with hidden key puzzle
- **study**: Scholar's room with constellation alignment puzzle
- **secret_chamber**: Final room with game completion

## Scene Layout Format

Scenes use ASCII layout representation:
- `#` = Wall
- `.` = Floor
- `P` = Player spawn point
- `D` = Door
- `K` = Key
- `C` = Clue/Checkpoint
- `O` = Interactive Object
- `B` = Bookshelf
- `T` = Table/Telescope
- `E` = Exit/Entrance

## Puzzle System

Each scene can contain puzzles with:
- **conditions**: Requirements to solve the puzzle
- **rewards**: What happens when solved (unlock doors, reveal items, etc.)
- **types**: sequence, alignment, completion

## Entity Interactions

Interactive objects support multiple interaction types:
- **examine**: Look at object for clues
- **open/close**: Change object state
- **move/adjust**: Manipulate puzzle components
- **collect**: Add items to inventory

## Audio Configuration

Sound effects are configured for:
- Ambient background music
- Interaction feedback (examine, collect, unlock)
- Puzzle completion sounds
- Checkpoint/save sounds

## Sanity System

The puzzle game uses a sanity mechanic that:
- Slowly depletes over time (0.5 per second)
- Triggers atmospheric effects at thresholds:
  - 75%: Subtle whispers
  - 50%: Shadow movement
  - 25%: Hallucinations

## Save System

Checkpoint-based progression with:
- Auto-save at checkpoints
- 3 save slots available
- Complete game state preservation (inventory, puzzle progress, scene state)