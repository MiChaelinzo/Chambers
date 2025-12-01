import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { GameLoop } from '../../../framework/core/GameLoop.js';

describe('GameLoop Unit Tests', () => {
  let mockUpdate;
  let mockRender;
  let mockTime;

  beforeEach(() => {
    mockUpdate = jest.fn();
    mockRender = jest.fn();
    mockTime = 0;
    
    // Mock performance.now
    global.performance.now = jest.fn(() => {
      mockTime += 16.67; // Simulate ~60 FPS
      return mockTime;
    });
    
    jest.clearAllMocks();
  });

  test('should create a game loop with default target FPS', () => {
    const gameLoop = new GameLoop(mockUpdate, mockRender);
    expect(gameLoop.targetFPS).toBe(60);
    expect(gameLoop.targetFrameTime).toBeCloseTo(16.67, 1);
  });

  test('should create a game loop with custom target FPS', () => {
    const gameLoop = new GameLoop(mockUpdate, mockRender, 30);
    expect(gameLoop.targetFPS).toBe(30);
    expect(gameLoop.targetFrameTime).toBeCloseTo(33.33, 1);
  });

  test('should start the game loop', () => {
    const gameLoop = new GameLoop(mockUpdate, mockRender);
    expect(gameLoop.getIsRunning()).toBe(false);
    
    gameLoop.start();
    expect(gameLoop.getIsRunning()).toBe(true);
    expect(gameLoop.getIsPaused()).toBe(false);
  });

  test('should not start if already running', () => {
    const gameLoop = new GameLoop(mockUpdate, mockRender);
    gameLoop.start();
    const firstAnimationId = gameLoop.animationFrameId;
    
    gameLoop.start(); // Try to start again
    expect(gameLoop.animationFrameId).toBe(firstAnimationId);
  });

  test('should stop the game loop', () => {
    const gameLoop = new GameLoop(mockUpdate, mockRender);
    gameLoop.start();
    expect(gameLoop.getIsRunning()).toBe(true);
    
    gameLoop.stop();
    expect(gameLoop.getIsRunning()).toBe(false);
    expect(gameLoop.getIsPaused()).toBe(false);
  });

  test('should pause the game loop', () => {
    const gameLoop = new GameLoop(mockUpdate, mockRender);
    gameLoop.start();
    
    gameLoop.pause();
    expect(gameLoop.getIsRunning()).toBe(true);
    expect(gameLoop.getIsPaused()).toBe(true);
  });

  test('should not pause if not running', () => {
    const gameLoop = new GameLoop(mockUpdate, mockRender);
    gameLoop.pause();
    expect(gameLoop.getIsPaused()).toBe(false);
  });

  test('should resume from pause', () => {
    const gameLoop = new GameLoop(mockUpdate, mockRender);
    gameLoop.start();
    gameLoop.pause();
    
    gameLoop.resume();
    expect(gameLoop.getIsRunning()).toBe(true);
    expect(gameLoop.getIsPaused()).toBe(false);
  });

  test('should not resume if not paused', () => {
    const gameLoop = new GameLoop(mockUpdate, mockRender);
    gameLoop.start();
    
    const wasPaused = gameLoop.getIsPaused();
    gameLoop.resume();
    expect(gameLoop.getIsPaused()).toBe(wasPaused);
  });

  test('should call update and render functions when running', (done) => {
    const gameLoop = new GameLoop(mockUpdate, mockRender);
    gameLoop.start();

    setTimeout(() => {
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockRender).toHaveBeenCalled();
      gameLoop.stop();
      done();
    }, 50);
  });

  test('should not call update and render when paused', (done) => {
    const gameLoop = new GameLoop(mockUpdate, mockRender);
    gameLoop.start();
    
    // Let it run briefly
    setTimeout(() => {
      mockUpdate.mockClear();
      mockRender.mockClear();
      
      gameLoop.pause();
      
      // Wait and check that functions weren't called
      setTimeout(() => {
        expect(mockUpdate).not.toHaveBeenCalled();
        expect(mockRender).not.toHaveBeenCalled();
        gameLoop.stop();
        done();
      }, 50);
    }, 20);
  });

  test('should pass delta time to update function', () => {
    const gameLoop = new GameLoop(mockUpdate, mockRender);
    
    // Manually trigger the loop once
    gameLoop.start();
    const currentTime = global.performance.now();
    gameLoop._loop(currentTime);
    
    expect(mockUpdate).toHaveBeenCalled();
    const deltaTime = mockUpdate.mock.calls[0][0];
    expect(typeof deltaTime).toBe('number');
    expect(deltaTime).toBeGreaterThanOrEqual(0);
    
    gameLoop.stop();
  });

  test('should track frame times for smoothing', () => {
    const gameLoop = new GameLoop(mockUpdate, mockRender);
    gameLoop.start();
    
    // Manually trigger several frames
    for (let i = 0; i < 5; i++) {
      const currentTime = global.performance.now();
      gameLoop._loop(currentTime);
    }
    
    const avgFrameTime = gameLoop.getAverageFrameTime();
    expect(avgFrameTime).toBeGreaterThan(0);
    
    const currentFPS = gameLoop.getCurrentFPS();
    expect(currentFPS).toBeGreaterThan(0);
    
    gameLoop.stop();
  });

  test('should return target frame time when no frames recorded', () => {
    const gameLoop = new GameLoop(mockUpdate, mockRender, 60);
    expect(gameLoop.getAverageFrameTime()).toBeCloseTo(16.67, 1);
  });

  test('should return 0 FPS when average frame time is 0', () => {
    const gameLoop = new GameLoop(mockUpdate, mockRender);
    gameLoop.frameTimes = [0];
    expect(gameLoop.getCurrentFPS()).toBe(0);
  });
});
