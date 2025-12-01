import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as fc from 'fast-check';
import { GameLoop } from '../../../framework/core/GameLoop.js';

describe('GameLoop Property Tests', () => {
  let originalRAF;
  let originalCAF;
  let originalPerformanceNow;

  beforeEach(() => {
    // Save original functions
    originalRAF = global.requestAnimationFrame;
    originalCAF = global.cancelAnimationFrame;
    originalPerformanceNow = global.performance.now;
  });

  afterEach(() => {
    // Restore original functions
    global.requestAnimationFrame = originalRAF;
    global.cancelAnimationFrame = originalCAF;
    global.performance.now = originalPerformanceNow;
  });

  /**
   * Feature: skeleton-crew-framework, Property 1: Game loop timing consistency
   * Validates: Requirements 1.1
   * 
   * For any game loop configuration with a target FPS, the actual time between 
   * update calls should be within a reasonable tolerance of the expected interval 
   * (1000ms / targetFPS ± 10%).
   */
  test('game loop timing consistency - delta times should be within tolerance of target FPS', () => {
    fc.assert(
      fc.property(
        // Generate random target FPS between 30 and 120
        fc.integer({ min: 30, max: 120 }),
        // Generate number of frames to simulate (5-20)
        fc.integer({ min: 5, max: 20 }),
        (targetFPS, numFrames) => {
          const expectedFrameTime = 1000 / targetFPS;
          const tolerance = 0.10; // 10% tolerance
          const minFrameTime = expectedFrameTime * (1 - tolerance);
          const maxFrameTime = expectedFrameTime * (1 + tolerance);

          // Track update calls and their delta times
          const deltaTimes = [];
          let updateCallCount = 0;

          const updateFn = (deltaTime) => {
            deltaTimes.push(deltaTime * 1000); // Convert to ms
            updateCallCount++;
          };

          const renderFn = jest.fn();

          // Create game loop
          const gameLoop = new GameLoop(updateFn, renderFn, targetFPS);

          // Mock performance.now to simulate consistent frame timing
          let currentTime = 0;
          global.performance.now = jest.fn(() => currentTime);

          // Mock requestAnimationFrame to simulate frames
          const rafCallbacks = [];
          global.requestAnimationFrame = jest.fn((callback) => {
            rafCallbacks.push(callback);
            return rafCallbacks.length;
          });

          global.cancelAnimationFrame = jest.fn();

          // Start the loop
          gameLoop.start();

          // Simulate frames with consistent timing
          for (let i = 0; i < numFrames; i++) {
            currentTime += expectedFrameTime;
            
            // Execute all pending RAF callbacks
            const callbacks = [...rafCallbacks];
            rafCallbacks.length = 0;
            callbacks.forEach(cb => cb(currentTime));
          }

          // Stop the loop
          gameLoop.stop();

          // Verify we got the expected number of updates (skip first frame as it has no delta)
          expect(updateCallCount).toBeGreaterThan(0);

          // Check that all delta times (except possibly the first) are within tolerance
          // Skip the first delta time as it might be affected by initialization
          const deltaTimesToCheck = deltaTimes.slice(1);
          
          if (deltaTimesToCheck.length > 0) {
            const allWithinTolerance = deltaTimesToCheck.every(dt => {
              return dt >= minFrameTime && dt <= maxFrameTime;
            });

            // Property: All frame times should be within tolerance
            expect(allWithinTolerance).toBe(true);

            // Additional check: average frame time should be close to target
            const avgFrameTime = deltaTimesToCheck.reduce((a, b) => a + b, 0) / deltaTimesToCheck.length;
            expect(avgFrameTime).toBeGreaterThanOrEqual(minFrameTime);
            expect(avgFrameTime).toBeLessThanOrEqual(maxFrameTime);
          }
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  test('game loop maintains consistent timing across pause/resume cycles', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 30, max: 120 }),
        fc.integer({ min: 3, max: 10 }),
        (targetFPS, numFrames) => {
          const expectedFrameTime = 1000 / targetFPS;
          const deltaTimes = [];

          const updateFn = (deltaTime) => {
            deltaTimes.push(deltaTime * 1000);
          };

          const gameLoop = new GameLoop(updateFn, jest.fn(), targetFPS);

          let currentTime = 0;
          global.performance.now = jest.fn(() => currentTime);

          const rafCallbacks = [];
          global.requestAnimationFrame = jest.fn((callback) => {
            rafCallbacks.push(callback);
            return rafCallbacks.length;
          });

          gameLoop.start();

          // Run some frames
          for (let i = 0; i < numFrames; i++) {
            currentTime += expectedFrameTime;
            const callbacks = [...rafCallbacks];
            rafCallbacks.length = 0;
            callbacks.forEach(cb => cb(currentTime));
          }

          // Pause
          gameLoop.pause();
          const deltaCountBeforePause = deltaTimes.length;

          // Advance time while paused (should not create updates)
          currentTime += expectedFrameTime * 5;
          const callbacks = [...rafCallbacks];
          rafCallbacks.length = 0;
          callbacks.forEach(cb => cb(currentTime));

          // Should not have added new delta times while paused
          expect(deltaTimes.length).toBe(deltaCountBeforePause);

          // Resume
          gameLoop.resume();

          // Run more frames
          for (let i = 0; i < numFrames; i++) {
            currentTime += expectedFrameTime;
            const callbacks = [...rafCallbacks];
            rafCallbacks.length = 0;
            callbacks.forEach(cb => cb(currentTime));
          }

          gameLoop.stop();

          // Property: After resume, timing should still be consistent
          const deltaTimesAfterResume = deltaTimes.slice(deltaCountBeforePause + 1);
          if (deltaTimesAfterResume.length > 0) {
            const tolerance = 0.10;
            const minFrameTime = expectedFrameTime * (1 - tolerance);
            const maxFrameTime = expectedFrameTime * (1 + tolerance);

            const allWithinTolerance = deltaTimesAfterResume.every(dt => {
              return dt >= minFrameTime && dt <= maxFrameTime;
            });

            expect(allWithinTolerance).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
