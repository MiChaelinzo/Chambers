import { describe, test, beforeEach, jest } from '@jest/globals';
import fc from 'fast-check';
import { AudioSystem } from '../../../framework/systems/AudioSystem.js';

describe('AudioSystem - Property-Based Tests', () => {
  let audioSystem;

  beforeEach(() => {
    audioSystem = new AudioSystem();
    jest.clearAllMocks();
  });

  // Feature: skeleton-crew-framework, Property 7: Audio system sound tracking
  // **Validates: Requirements 2.3**
  test('loaded sounds are retrievable by ID and tracked correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate array of unique sound IDs and URLs
        fc.uniqueArray(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            url: fc.webUrl()
          }),
          { 
            minLength: 0, 
            maxLength: 20,
            selector: (item) => item.id
          }
        ),
        async (sounds) => {
          const system = new AudioSystem();
          
          // Mock the audio loading
          const mockBuffer = { duration: 2.5 };
          global.fetch = jest.fn().mockResolvedValue({
            arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
          });
          
          if (!system.audioContext) {
            system.audioContext = {
              decodeAudioData: jest.fn().mockResolvedValue(mockBuffer),
              createBufferSource: jest.fn(() => ({
                connect: jest.fn(),
                start: jest.fn(),
                stop: jest.fn()
              })),
              createGain: jest.fn(() => ({
                connect: jest.fn(),
                gain: { value: 1 }
              })),
              destination: {}
            };
          }

          // Load all sounds
          const loadResults = await Promise.all(
            sounds.map(sound => system.loadSound(sound.id, sound.url))
          );

          // Property 1: All loads should succeed
          const allLoaded = loadResults.every(result => result === true);
          if (!allLoaded) {
            return false;
          }

          // Property 2: All loaded sounds should be retrievable by ID
          for (const sound of sounds) {
            if (!system.hasSound(sound.id)) {
              return false;
            }

            const retrieved = system.getSound(sound.id);
            if (!retrieved || retrieved.url !== sound.url) {
              return false;
            }
          }

          // Property 3: getAllSoundIds should return exactly the loaded IDs
          const allIds = system.getAllSoundIds();
          if (allIds.length !== sounds.length) {
            return false;
          }

          for (const sound of sounds) {
            if (!allIds.includes(sound.id)) {
              return false;
            }
          }

          // Property 4: Non-existent IDs should not be found
          const nonExistentId = 'definitely-not-loaded-' + Math.random();
          if (system.hasSound(nonExistentId)) {
            return false;
          }
          if (system.getSound(nonExistentId) !== null) {
            return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('sound removal maintains tracking consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate sounds to load
        fc.uniqueArray(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            url: fc.webUrl()
          }),
          { 
            minLength: 1, 
            maxLength: 20,
            selector: (item) => item.id
          }
        ),
        // Generate indices of sounds to remove
        fc.array(fc.nat(), { minLength: 0, maxLength: 10 }),
        async (sounds, removeIndices) => {
          const system = new AudioSystem();
          
          // Mock the audio loading
          const mockBuffer = { duration: 2.5 };
          global.fetch = jest.fn().mockResolvedValue({
            arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
          });
          
          if (!system.audioContext) {
            system.audioContext = {
              decodeAudioData: jest.fn().mockResolvedValue(mockBuffer),
              createBufferSource: jest.fn(() => ({
                connect: jest.fn(),
                start: jest.fn(),
                stop: jest.fn()
              })),
              createGain: jest.fn(() => ({
                connect: jest.fn(),
                gain: { value: 1 }
              })),
              destination: {}
            };
          }

          // Load all sounds
          await Promise.all(
            sounds.map(sound => system.loadSound(sound.id, sound.url))
          );

          // Remove some sounds
          const removedIds = new Set();
          for (const idx of removeIndices) {
            if (idx < sounds.length) {
              const soundToRemove = sounds[idx];
              system.removeSound(soundToRemove.id);
              removedIds.add(soundToRemove.id);
            }
          }

          // Property: Removed sounds should not be retrievable
          for (const id of removedIds) {
            if (system.hasSound(id)) {
              return false;
            }
            if (system.getSound(id) !== null) {
              return false;
            }
          }

          // Property: Non-removed sounds should still be retrievable
          for (const sound of sounds) {
            if (!removedIds.has(sound.id)) {
              if (!system.hasSound(sound.id)) {
                return false;
              }
              const retrieved = system.getSound(sound.id);
              if (!retrieved || retrieved.url !== sound.url) {
                return false;
              }
            }
          }

          // Property: getAllSoundIds should match remaining sounds
          const allIds = system.getAllSoundIds();
          const expectedCount = sounds.length - removedIds.size;
          if (allIds.length !== expectedCount) {
            return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('playSound requests are tracked correctly for loaded sounds', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate sounds to load
        fc.uniqueArray(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            url: fc.webUrl()
          }),
          { 
            minLength: 1, 
            maxLength: 10,
            selector: (item) => item.id
          }
        ),
        // Generate play requests (indices into sounds array)
        fc.array(
          fc.record({
            soundIndex: fc.nat(),
            volume: fc.float({ min: 0, max: 1 }),
            loop: fc.boolean()
          }),
          { minLength: 0, maxLength: 20 }
        ),
        async (sounds, playRequests) => {
          const system = new AudioSystem();
          
          // Mock the audio loading and playback
          const mockBuffer = { duration: 2.5 };
          const mockSources = [];
          
          global.fetch = jest.fn().mockResolvedValue({
            arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
          });
          
          if (!system.audioContext) {
            system.audioContext = {
              decodeAudioData: jest.fn().mockResolvedValue(mockBuffer),
              createBufferSource: jest.fn(() => {
                const source = {
                  buffer: null,
                  loop: false,
                  connect: jest.fn(),
                  start: jest.fn(),
                  stop: jest.fn()
                };
                mockSources.push(source);
                return source;
              }),
              createGain: jest.fn(() => ({
                connect: jest.fn(),
                gain: { value: 1 }
              })),
              destination: {}
            };
          }

          // Load all sounds
          await Promise.all(
            sounds.map(sound => system.loadSound(sound.id, sound.url))
          );

          // Play sounds
          for (const request of playRequests) {
            const soundIndex = request.soundIndex % sounds.length;
            const sound = sounds[soundIndex];
            
            const source = system.playSound(sound.id, request.volume, request.loop);
            
            // Property: playSound should return a source for loaded sounds
            if (source === null) {
              return false;
            }
          }

          // Property: All sounds should still be tracked after playing
          for (const sound of sounds) {
            if (!system.hasSound(sound.id)) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('ambient tracking maintains single active ambient', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate sounds to load
        fc.uniqueArray(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            url: fc.webUrl()
          }),
          { 
            minLength: 1, 
            maxLength: 10,
            selector: (item) => item.id
          }
        ),
        // Generate sequence of ambient play requests
        fc.array(fc.nat(), { minLength: 0, maxLength: 10 }),
        async (sounds, ambientSequence) => {
          const system = new AudioSystem();
          
          // Mock the audio loading and playback
          const mockBuffer = { duration: 120.0 };
          
          global.fetch = jest.fn().mockResolvedValue({
            arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
          });
          
          if (!system.audioContext) {
            system.audioContext = {
              decodeAudioData: jest.fn().mockResolvedValue(mockBuffer),
              createBufferSource: jest.fn(() => ({
                buffer: null,
                loop: false,
                connect: jest.fn(),
                start: jest.fn(),
                stop: jest.fn()
              })),
              createGain: jest.fn(() => ({
                connect: jest.fn(),
                gain: { value: 1 }
              })),
              destination: {}
            };
          }

          // Load all sounds
          await Promise.all(
            sounds.map(sound => system.loadSound(sound.id, sound.url))
          );

          let lastPlayedId = null;

          // Play ambient sounds in sequence
          for (const idx of ambientSequence) {
            const soundIndex = idx % sounds.length;
            const sound = sounds[soundIndex];
            
            const result = system.playAmbient(sound.id, 0.5);
            
            // Property: playAmbient should succeed for loaded sounds
            if (!result) {
              return false;
            }

            lastPlayedId = sound.id;

            // Property: Only one ambient should be active at a time
            const currentAmbient = system.getCurrentAmbient();
            if (currentAmbient !== lastPlayedId) {
              return false;
            }
          }

          // Property: After sequence, current ambient should match last played
          if (ambientSequence.length > 0) {
            const currentAmbient = system.getCurrentAmbient();
            if (currentAmbient !== lastPlayedId) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('clearAllSounds removes all tracked sounds', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate sounds to load
        fc.uniqueArray(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            url: fc.webUrl()
          }),
          { 
            minLength: 0, 
            maxLength: 20,
            selector: (item) => item.id
          }
        ),
        async (sounds) => {
          const system = new AudioSystem();
          
          // Mock the audio loading
          const mockBuffer = { duration: 2.5 };
          global.fetch = jest.fn().mockResolvedValue({
            arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
          });
          
          if (!system.audioContext) {
            system.audioContext = {
              decodeAudioData: jest.fn().mockResolvedValue(mockBuffer),
              createBufferSource: jest.fn(() => ({
                connect: jest.fn(),
                start: jest.fn(),
                stop: jest.fn()
              })),
              createGain: jest.fn(() => ({
                connect: jest.fn(),
                gain: { value: 1 }
              })),
              destination: {}
            };
          }

          // Load all sounds
          await Promise.all(
            sounds.map(sound => system.loadSound(sound.id, sound.url))
          );

          // Clear all sounds
          system.clearAllSounds();

          // Property: No sounds should be tracked after clear
          if (system.getAllSoundIds().length !== 0) {
            return false;
          }

          // Property: No previously loaded sound should be retrievable
          for (const sound of sounds) {
            if (system.hasSound(sound.id)) {
              return false;
            }
            if (system.getSound(sound.id) !== null) {
              return false;
            }
          }

          // Property: No ambient should be playing
          if (system.getCurrentAmbient() !== null) {
            return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
