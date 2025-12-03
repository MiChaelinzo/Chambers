/**
 * Unit tests for puzzle game entity types
 */

import { InteractiveObject } from '../../../games/puzzle-game/entities/InteractiveObject.js';
import { Door } from '../../../games/puzzle-game/entities/Door.js';
import { Key } from '../../../games/puzzle-game/entities/Key.js';
import { Clue } from '../../../games/puzzle-game/entities/Clue.js';
import { Player } from '../../../games/dungeon-crawler/entities/Player.js';
import { Scene } from '../../../framework/core/Scene.js';

describe('Puzzle Game Entity Types', () => {
  describe('InteractiveObject Entity', () => {
    test('should create interactive object with default properties', () => {
      const obj = new InteractiveObject(100, 100, { name: 'Lever' });
      
      expect(obj.type).toBe('interactive');
      expect(obj.position.x).toBe(100);
      expect(obj.position.y).toBe(100);
      expect(obj.state.name).toBe('Lever');
      expect(obj.state.manipulated).toBe(false);
    });

    test('should allow examination', () => {
      const obj = new InteractiveObject(100, 100, {
        name: 'Statue',
        examineText: 'An ancient statue.'
      });
      
      const result = obj.examine();
      expect(result.success).toBe(true);
      expect(result.message).toBe('An ancient statue.');
      expect(result.action).toBe('examine');
    });

    test('should allow manipulation when enabled', () => {
      const obj = new InteractiveObject(100, 100, {
        name: 'Lever',
        canManipulate: true,
        manipulateText: 'You pull the lever.'
      });
      
      const player = new Player(100, 100);
      const result = obj.manipulate(player);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('You pull the lever.');
      expect(obj.state.manipulated).toBe(true);
    });

    test('should prevent manipulation when disabled', () => {
      const obj = new InteractiveObject(100, 100, {
        name: 'Statue',
        canManipulate: false
      });
      
      const player = new Player(100, 100);
      const result = obj.manipulate(player);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('cannot be manipulated');
    });

    test('should check interaction range', () => {
      const obj = new InteractiveObject(100, 100, {
        interactionRadius: 50
      });
      
      const nearPlayer = new Player(120, 100);
      const farPlayer = new Player(200, 100);
      
      expect(obj.isInRange(nearPlayer)).toBe(true);
      expect(obj.isInRange(farPlayer)).toBe(false);
    });
  });

  describe('Door Entity', () => {
    test('should create locked door by default', () => {
      const door = new Door(100, 100, { name: 'Wooden Door' });
      
      expect(door.type).toBe('door');
      expect(door.state.locked).toBe(true);
      expect(door.config.collides).toBe(true);
    });

    test('should examine locked door', () => {
      const door = new Door(100, 100, {
        lockedText: 'The door is locked tight.'
      });
      
      const result = door.examine();
      expect(result.success).toBe(true);
      expect(result.message).toBe('The door is locked tight.');
    });

    test('should unlock door without key requirement', () => {
      const door = new Door(100, 100, {
        locked: true,
        keyRequired: null
      });
      
      const player = new Player(100, 100);
      const result = door.unlock(player);
      
      expect(result.success).toBe(true);
      expect(door.state.locked).toBe(false);
      expect(door.config.collides).toBe(false);
    });

    test('should unlock door with correct key', () => {
      const door = new Door(100, 100, {
        locked: true,
        keyRequired: 'red'
      });
      
      const player = new Player(100, 100);
      player.state.inventory = [
        { type: 'key', keyType: 'red', name: 'Red Key' }
      ];
      
      const result = door.unlock(player);
      
      expect(result.success).toBe(true);
      expect(door.state.locked).toBe(false);
    });

    test('should not unlock door without correct key', () => {
      const door = new Door(100, 100, {
        locked: true,
        keyRequired: 'red'
      });
      
      const player = new Player(100, 100);
      player.state.inventory = [
        { type: 'key', keyType: 'blue', name: 'Blue Key' }
      ];
      
      const result = door.unlock(player);
      
      expect(result.success).toBe(false);
      expect(door.state.locked).toBe(true);
    });

    test('should handle interaction with range check', () => {
      const door = new Door(100, 100, {
        interactionRadius: 50
      });
      
      const farPlayer = new Player(200, 100);
      const result = door.onInteract(farPlayer, { action: 'examine' });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('too far');
    });
  });

  describe('Key Entity', () => {
    test('should create key with type', () => {
      const key = new Key(100, 100, {
        keyType: 'red',
        name: 'Red Key'
      });
      
      expect(key.type).toBe('key');
      expect(key.state.keyType).toBe('red');
      expect(key.state.collected).toBe(false);
      expect(key.config.collides).toBe(false);
    });

    test('should be collected by player when in range', () => {
      const key = new Key(100, 100, {
        keyType: 'red',
        collectionRadius: 40
      });
      
      const player = new Player(110, 100);
      const scene = new Scene('test', {});
      scene.entities = [player, key];
      
      key.update(0.1, { scene });
      
      expect(key.state.collected).toBe(true);
      expect(key.isDeleted()).toBe(true);
      expect(player.state.inventory.length).toBe(1);
      expect(player.state.inventory[0].type).toBe('key');
      expect(player.state.inventory[0].keyType).toBe('red');
    });

    test('should not be collected when out of range', () => {
      const key = new Key(100, 100, {
        keyType: 'red',
        collectionRadius: 40
      });
      
      const player = new Player(200, 100);
      const scene = new Scene('test', {});
      scene.entities = [player, key];
      
      key.update(0.1, { scene });
      
      expect(key.state.collected).toBe(false);
      expect(key.isDeleted()).toBe(false);
    });

    test('should handle interaction', () => {
      const key = new Key(100, 100, {
        keyType: 'red',
        name: 'Red Key'
      });
      
      const player = new Player(100, 100);
      const result = key.onInteract(player, {});
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Collected');
      expect(key.state.collected).toBe(true);
    });
  });

  describe('Clue Entity', () => {
    test('should create clue with story text', () => {
      const clue = new Clue(100, 100, {
        name: 'Note',
        storyText: 'A mysterious message.'
      });
      
      expect(clue.type).toBe('clue');
      expect(clue.state.storyText).toBe('A mysterious message.');
      expect(clue.state.examined).toBe(false);
    });

    test('should reveal story text when examined', () => {
      const clue = new Clue(100, 100, {
        name: 'Note',
        storyText: 'The key is hidden in the garden.',
        hintText: 'Look near the fountain.'
      });
      
      const result = clue.examine();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('The key is hidden in the garden.');
      expect(result.message).toContain('Look near the fountain.');
      expect(clue.state.examined).toBe(true);
    });

    test('should disappear after examination if configured', () => {
      const clue = new Clue(100, 100, {
        storyText: 'A fleeting memory.',
        disappearOnExamine: true
      });
      
      clue.examine();
      
      expect(clue.isDeleted()).toBe(true);
    });

    test('should persist after examination by default', () => {
      const clue = new Clue(100, 100, {
        storyText: 'A permanent inscription.'
      });
      
      clue.examine();
      
      expect(clue.isDeleted()).toBe(false);
    });

    test('should check interaction range', () => {
      const clue = new Clue(100, 100, {
        interactionRadius: 50
      });
      
      const nearPlayer = new Player(120, 100);
      const farPlayer = new Player(200, 100);
      
      expect(clue.isInRange(nearPlayer)).toBe(true);
      expect(clue.isInRange(farPlayer)).toBe(false);
    });

    test('should handle interaction with range check', () => {
      const clue = new Clue(100, 100, {
        name: 'Note',
        interactionRadius: 50
      });
      
      const farPlayer = new Player(200, 100);
      const result = clue.onInteract(farPlayer, {});
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('too far');
    });
  });
});
