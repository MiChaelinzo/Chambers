import { jest } from '@jest/globals';
import { Renderer } from '../../../framework/systems/Renderer.js';
import { Entity } from '../../../framework/core/Entity.js';

describe('Renderer', () => {
  let canvas;
  let renderer;

  beforeEach(() => {
    // Create a mock canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    renderer = new Renderer(canvas);
  });

  describe('constructor', () => {
    test('should create renderer with canvas', () => {
      expect(renderer.canvas).toBe(canvas);
      expect(renderer.ctx).toBeTruthy();
      expect(renderer.camera).toEqual({ x: 0, y: 0, zoom: 1 });
    });

    test('should throw error if no canvas provided', () => {
      expect(() => new Renderer(null)).toThrow('Canvas element is required');
    });
  });

  describe('clear', () => {
    test('should clear the canvas', () => {
      const clearRectSpy = jest.spyOn(renderer.ctx, 'clearRect');
      renderer.clear();
      expect(clearRectSpy).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    test('should reset render call counter', () => {
      renderer.renderCallsThisFrame = 5;
      renderer.clear();
      expect(renderer.lastFrameRenderCalls).toBe(5);
      expect(renderer.renderCallsThisFrame).toBe(0);
    });
  });

  describe('drawEntity', () => {
    test('should draw visible entity', () => {
      const entity = new Entity(1, 'player', 100, 100, { width: 32, height: 32 });
      const fillRectSpy = jest.spyOn(renderer.ctx, 'fillRect');
      
      renderer.drawEntity(entity, true);
      
      expect(fillRectSpy).toHaveBeenCalled();
      expect(renderer.renderCallsThisFrame).toBe(1);
    });

    test('should not draw invisible entity', () => {
      const entity = new Entity(1, 'player', 100, 100);
      const fillRectSpy = jest.spyOn(renderer.ctx, 'fillRect');
      
      renderer.drawEntity(entity, false);
      
      // Render call is tracked but entity is not drawn
      expect(renderer.renderCallsThisFrame).toBe(1);
    });

    test('should handle null entity gracefully', () => {
      expect(() => renderer.drawEntity(null, true)).not.toThrow();
      expect(renderer.renderCallsThisFrame).toBe(0);
    });

    test('should use default dimensions if not in config', () => {
      const entity = new Entity(1, 'player', 100, 100);
      expect(() => renderer.drawEntity(entity, true)).not.toThrow();
    });
  });

  describe('drawUI', () => {
    test('should draw health bar', () => {
      const uiData = {
        health: 75,
        maxHealth: 100
      };
      
      const fillTextSpy = jest.spyOn(renderer.ctx, 'fillText');
      renderer.drawUI(uiData);
      
      expect(fillTextSpy).toHaveBeenCalledWith('Health: 75/100', expect.any(Number), expect.any(Number));
    });

    test('should draw resources', () => {
      const uiData = {
        resources: [
          { name: 'Stamina', current: 50, max: 100 },
          { name: 'Sanity', current: 80, max: 100 }
        ]
      };
      
      const fillTextSpy = jest.spyOn(renderer.ctx, 'fillText');
      renderer.drawUI(uiData);
      
      expect(fillTextSpy).toHaveBeenCalledWith('Stamina: 50/100', expect.any(Number), expect.any(Number));
      expect(fillTextSpy).toHaveBeenCalledWith('Sanity: 80/100', expect.any(Number), expect.any(Number));
    });

    test('should draw inventory', () => {
      const uiData = {
        inventory: ['Key', 'Potion', 'Map']
      };
      
      const fillTextSpy = jest.spyOn(renderer.ctx, 'fillText');
      renderer.drawUI(uiData);
      
      expect(fillTextSpy).toHaveBeenCalledWith('Inventory:', expect.any(Number), expect.any(Number));
      expect(fillTextSpy).toHaveBeenCalledWith('- Key', expect.any(Number), expect.any(Number));
      expect(fillTextSpy).toHaveBeenCalledWith('- Potion', expect.any(Number), expect.any(Number));
      expect(fillTextSpy).toHaveBeenCalledWith('- Map', expect.any(Number), expect.any(Number));
    });

    test('should show empty inventory message', () => {
      const uiData = {
        inventory: []
      };
      
      const fillTextSpy = jest.spyOn(renderer.ctx, 'fillText');
      renderer.drawUI(uiData);
      
      expect(fillTextSpy).toHaveBeenCalledWith('(empty)', expect.any(Number), expect.any(Number));
    });

    test('should handle null uiData gracefully', () => {
      expect(() => renderer.drawUI(null)).not.toThrow();
    });

    test('should draw complete UI with all elements', () => {
      const uiData = {
        health: 75,
        maxHealth: 100,
        resources: [
          { name: 'Stamina', current: 50, max: 100 }
        ],
        inventory: ['Key']
      };
      
      expect(() => renderer.drawUI(uiData)).not.toThrow();
    });
  });

  describe('setCamera', () => {
    test('should set camera position and zoom', () => {
      renderer.setCamera(100, 200, 1.5);
      
      expect(renderer.camera.x).toBe(100);
      expect(renderer.camera.y).toBe(200);
      expect(renderer.camera.zoom).toBe(1.5);
    });

    test('should default zoom to 1 if not provided', () => {
      renderer.setCamera(50, 75);
      
      expect(renderer.camera.x).toBe(50);
      expect(renderer.camera.y).toBe(75);
      expect(renderer.camera.zoom).toBe(1);
    });
  });

  describe('getLastFrameRenderCalls', () => {
    test('should return render calls from last frame', () => {
      const entity = new Entity(1, 'player', 100, 100);
      
      renderer.drawEntity(entity, true);
      renderer.drawEntity(entity, true);
      expect(renderer.getLastFrameRenderCalls()).toBe(0); // Not cleared yet
      
      renderer.clear();
      expect(renderer.getLastFrameRenderCalls()).toBe(2);
    });
  });
});
