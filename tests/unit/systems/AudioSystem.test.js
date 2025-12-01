import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { AudioSystem } from '../../../framework/systems/AudioSystem.js';

describe('AudioSystem - Unit Tests', () => {
  let audioSystem;

  beforeEach(() => {
    audioSystem = new AudioSystem();
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('creates audio system with empty sound map', () => {
      expect(audioSystem.sounds).toBeDefined();
      expect(audioSystem.sounds.size).toBe(0);
      expect(audioSystem.audioContext).toBeNull();
      expect(audioSystem.ambientSource).toBeNull();
      expect(audioSystem.currentAmbientId).toBeNull();
    });
  });

  describe('initializeContext', () => {
    test('creates audio context on first call', () => {
      audioSystem.initializeContext();
      expect(audioSystem.audioContext).toBeDefined();
      expect(audioSystem.audioContext).not.toBeNull();
    });

    test('does not recreate context if already initialized', () => {
      audioSystem.initializeContext();
      const firstContext = audioSystem.audioContext;
      audioSystem.initializeContext();
      expect(audioSystem.audioContext).toBe(firstContext);
    });
  });

  describe('loadSound', () => {
    test('throws error for empty id', async () => {
      await expect(audioSystem.loadSound('', 'test.mp3')).rejects.toThrow('Sound id must be a non-empty string');
    });

    test('throws error for non-string id', async () => {
      await expect(audioSystem.loadSound(123, 'test.mp3')).rejects.toThrow('Sound id must be a non-empty string');
    });

    test('throws error for empty url', async () => {
      await expect(audioSystem.loadSound('test', '')).rejects.toThrow('Sound url must be a non-empty string');
    });

    test('throws error for non-string url', async () => {
      await expect(audioSystem.loadSound('test', 123)).rejects.toThrow('Sound url must be a non-empty string');
    });

    test('initializes audio context when loading sound', async () => {
      // Mock fetch to return valid audio data
      global.fetch = jest.fn().mockResolvedValue({
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
      });

      await audioSystem.loadSound('test', 'test.mp3');
      expect(audioSystem.audioContext).not.toBeNull();
    });

    test('stores sound in map on successful load', async () => {
      const mockBuffer = { duration: 2.5 };
      
      global.fetch = jest.fn().mockResolvedValue({
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
      });

      audioSystem.audioContext = {
        decodeAudioData: jest.fn().mockResolvedValue(mockBuffer)
      };

      const result = await audioSystem.loadSound('test', 'test.mp3');
      
      expect(result).toBe(true);
      expect(audioSystem.sounds.has('test')).toBe(true);
      expect(audioSystem.sounds.get('test').url).toBe('test.mp3');
      expect(audioSystem.sounds.get('test').buffer).toBe(mockBuffer);
    });

    test('returns false on fetch failure', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await audioSystem.loadSound('test', 'test.mp3');
      
      expect(result).toBe(false);
      expect(audioSystem.sounds.has('test')).toBe(false);
    });
  });

  describe('playSound', () => {
    beforeEach(() => {
      // Set up a loaded sound
      audioSystem.sounds.set('effect', {
        buffer: { duration: 1.0 },
        url: 'effect.mp3'
      });
      audioSystem.initializeContext();
    });

    test('returns null for non-existent sound', () => {
      const result = audioSystem.playSound('nonexistent');
      expect(result).toBeNull();
    });

    test('returns null for invalid volume (negative)', () => {
      const result = audioSystem.playSound('effect', -0.5);
      expect(result).toBeNull();
    });

    test('returns null for invalid volume (> 1)', () => {
      const result = audioSystem.playSound('effect', 1.5);
      expect(result).toBeNull();
    });

    test('creates and returns source node for valid sound', () => {
      const result = audioSystem.playSound('effect', 0.8);
      
      expect(result).not.toBeNull();
      expect(audioSystem.audioContext.createBufferSource).toHaveBeenCalled();
      expect(audioSystem.audioContext.createGain).toHaveBeenCalled();
    });

    test('uses default volume of 1.0 when not specified', () => {
      const mockGainNode = { gain: { value: 0 }, connect: jest.fn() };
      audioSystem.audioContext.createGain = jest.fn().mockReturnValue(mockGainNode);

      audioSystem.playSound('effect');
      
      expect(mockGainNode.gain.value).toBe(1.0);
    });

    test('sets loop property when specified', () => {
      const mockSource = { 
        buffer: null, 
        loop: false, 
        connect: jest.fn(), 
        start: jest.fn() 
      };
      audioSystem.audioContext.createBufferSource = jest.fn().mockReturnValue(mockSource);

      audioSystem.playSound('effect', 1.0, true);
      
      expect(mockSource.loop).toBe(true);
    });

    test('starts playback', () => {
      const mockSource = { 
        buffer: null, 
        loop: false, 
        connect: jest.fn(), 
        start: jest.fn() 
      };
      audioSystem.audioContext.createBufferSource = jest.fn().mockReturnValue(mockSource);

      audioSystem.playSound('effect');
      
      expect(mockSource.start).toHaveBeenCalledWith(0);
    });
  });

  describe('playAmbient', () => {
    beforeEach(() => {
      audioSystem.sounds.set('music', {
        buffer: { duration: 120.0 },
        url: 'music.mp3'
      });
      audioSystem.initializeContext();
    });

    test('returns false for non-existent sound', () => {
      const result = audioSystem.playAmbient('nonexistent');
      expect(result).toBe(false);
    });

    test('returns false for invalid volume (negative)', () => {
      const result = audioSystem.playAmbient('music', -0.5);
      expect(result).toBe(false);
    });

    test('returns false for invalid volume (> 1)', () => {
      const result = audioSystem.playAmbient('music', 1.5);
      expect(result).toBe(false);
    });

    test('creates looping source for ambient music', () => {
      const mockSource = { 
        buffer: null, 
        loop: false, 
        connect: jest.fn(), 
        start: jest.fn() 
      };
      audioSystem.audioContext.createBufferSource = jest.fn().mockReturnValue(mockSource);

      const result = audioSystem.playAmbient('music', 0.5);
      
      expect(result).toBe(true);
      expect(mockSource.loop).toBe(true);
      expect(audioSystem.currentAmbientId).toBe('music');
    });

    test('uses default volume of 0.5 when not specified', () => {
      const mockGainNode = { gain: { value: 0 }, connect: jest.fn() };
      audioSystem.audioContext.createGain = jest.fn().mockReturnValue(mockGainNode);

      audioSystem.playAmbient('music');
      
      expect(mockGainNode.gain.value).toBe(0.5);
    });

    test('stops previous ambient before playing new one', () => {
      const mockSource1 = { 
        buffer: null, 
        loop: false, 
        connect: jest.fn(), 
        start: jest.fn(),
        stop: jest.fn()
      };
      const mockSource2 = { 
        buffer: null, 
        loop: false, 
        connect: jest.fn(), 
        start: jest.fn(),
        stop: jest.fn()
      };

      audioSystem.audioContext.createBufferSource = jest.fn()
        .mockReturnValueOnce(mockSource1)
        .mockReturnValueOnce(mockSource2);

      audioSystem.playAmbient('music');
      audioSystem.playAmbient('music');
      
      expect(mockSource1.stop).toHaveBeenCalled();
    });
  });

  describe('stopAmbient', () => {
    test('does nothing when no ambient is playing', () => {
      expect(() => audioSystem.stopAmbient()).not.toThrow();
    });

    test('stops ambient source and clears state', () => {
      audioSystem.sounds.set('music', {
        buffer: { duration: 120.0 },
        url: 'music.mp3'
      });
      audioSystem.initializeContext();

      const mockSource = { 
        buffer: null, 
        loop: false, 
        connect: jest.fn(), 
        start: jest.fn(),
        stop: jest.fn()
      };
      audioSystem.audioContext.createBufferSource = jest.fn().mockReturnValue(mockSource);

      audioSystem.playAmbient('music');
      audioSystem.stopAmbient();
      
      expect(mockSource.stop).toHaveBeenCalled();
      expect(audioSystem.ambientSource).toBeNull();
      expect(audioSystem.currentAmbientId).toBeNull();
    });

    test('handles already stopped source gracefully', () => {
      audioSystem.sounds.set('music', {
        buffer: { duration: 120.0 },
        url: 'music.mp3'
      });
      audioSystem.initializeContext();

      const mockSource = { 
        buffer: null, 
        loop: false, 
        connect: jest.fn(), 
        start: jest.fn(),
        stop: jest.fn().mockImplementation(() => { throw new Error('Already stopped'); })
      };
      audioSystem.audioContext.createBufferSource = jest.fn().mockReturnValue(mockSource);

      audioSystem.playAmbient('music');
      
      expect(() => audioSystem.stopAmbient()).not.toThrow();
      expect(audioSystem.ambientSource).toBeNull();
    });
  });

  describe('hasSound', () => {
    test('returns true for loaded sound', () => {
      audioSystem.sounds.set('test', { buffer: {}, url: 'test.mp3' });
      expect(audioSystem.hasSound('test')).toBe(true);
    });

    test('returns false for non-existent sound', () => {
      expect(audioSystem.hasSound('nonexistent')).toBe(false);
    });
  });

  describe('getSound', () => {
    test('returns sound info for loaded sound', () => {
      audioSystem.sounds.set('test', {
        buffer: { duration: 2.5 },
        url: 'test.mp3'
      });

      const info = audioSystem.getSound('test');
      
      expect(info).toEqual({
        url: 'test.mp3',
        duration: 2.5
      });
    });

    test('returns null for non-existent sound', () => {
      expect(audioSystem.getSound('nonexistent')).toBeNull();
    });

    test('returns 0 duration if buffer is missing', () => {
      audioSystem.sounds.set('test', {
        buffer: null,
        url: 'test.mp3'
      });

      const info = audioSystem.getSound('test');
      
      expect(info.duration).toBe(0);
    });
  });

  describe('getAllSoundIds', () => {
    test('returns empty array when no sounds loaded', () => {
      expect(audioSystem.getAllSoundIds()).toEqual([]);
    });

    test('returns all sound IDs', () => {
      audioSystem.sounds.set('sound1', { buffer: {}, url: 'sound1.mp3' });
      audioSystem.sounds.set('sound2', { buffer: {}, url: 'sound2.mp3' });
      audioSystem.sounds.set('sound3', { buffer: {}, url: 'sound3.mp3' });

      const ids = audioSystem.getAllSoundIds();
      
      expect(ids).toHaveLength(3);
      expect(ids).toContain('sound1');
      expect(ids).toContain('sound2');
      expect(ids).toContain('sound3');
    });
  });

  describe('removeSound', () => {
    test('removes existing sound', () => {
      audioSystem.sounds.set('test', { buffer: {}, url: 'test.mp3' });

      const result = audioSystem.removeSound('test');
      
      expect(result).toBe(true);
      expect(audioSystem.hasSound('test')).toBe(false);
    });

    test('returns false for non-existent sound', () => {
      const result = audioSystem.removeSound('nonexistent');
      expect(result).toBe(false);
    });

    test('stops ambient if removing currently playing ambient', () => {
      audioSystem.sounds.set('music', {
        buffer: { duration: 120.0 },
        url: 'music.mp3'
      });
      audioSystem.initializeContext();

      const mockSource = { 
        buffer: null, 
        loop: false, 
        connect: jest.fn(), 
        start: jest.fn(),
        stop: jest.fn()
      };
      audioSystem.audioContext.createBufferSource = jest.fn().mockReturnValue(mockSource);

      audioSystem.playAmbient('music');
      audioSystem.removeSound('music');
      
      expect(mockSource.stop).toHaveBeenCalled();
      expect(audioSystem.currentAmbientId).toBeNull();
    });
  });

  describe('getCurrentAmbient', () => {
    test('returns null when no ambient playing', () => {
      expect(audioSystem.getCurrentAmbient()).toBeNull();
    });

    test('returns current ambient ID', () => {
      audioSystem.sounds.set('music', {
        buffer: { duration: 120.0 },
        url: 'music.mp3'
      });
      audioSystem.initializeContext();

      audioSystem.playAmbient('music');
      
      expect(audioSystem.getCurrentAmbient()).toBe('music');
    });
  });

  describe('clearAllSounds', () => {
    test('clears all sounds and stops ambient', () => {
      audioSystem.sounds.set('sound1', { buffer: {}, url: 'sound1.mp3' });
      audioSystem.sounds.set('sound2', { buffer: {}, url: 'sound2.mp3' });
      audioSystem.sounds.set('music', {
        buffer: { duration: 120.0 },
        url: 'music.mp3'
      });
      audioSystem.initializeContext();

      const mockSource = { 
        buffer: null, 
        loop: false, 
        connect: jest.fn(), 
        start: jest.fn(),
        stop: jest.fn()
      };
      audioSystem.audioContext.createBufferSource = jest.fn().mockReturnValue(mockSource);

      audioSystem.playAmbient('music');
      audioSystem.clearAllSounds();
      
      expect(audioSystem.sounds.size).toBe(0);
      expect(audioSystem.currentAmbientId).toBeNull();
      expect(mockSource.stop).toHaveBeenCalled();
    });
  });
});
