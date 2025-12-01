import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { InputHandler } from '../../../framework/systems/InputHandler.js';

describe('InputHandler Unit Tests', () => {
  // Helper functions to simulate key presses directly
  const simulateKeyPress = (handler, key) => {
    handler.keys.add(key.toLowerCase());
  };

  const simulateKeyRelease = (handler, key) => {
    handler.keys.delete(key.toLowerCase());
  };

  describe('Event Listener Management', () => {
    test('should start listening to events', () => {
      const mockAddEventListener = jest.fn();
      const mockWindow = {
        addEventListener: mockAddEventListener,
        removeEventListener: jest.fn()
      };
      global.window = mockWindow;
      // Also set window directly for the InputHandler
      globalThis.window = mockWindow;

      const inputHandler = new InputHandler();
      inputHandler.startListening();

      expect(mockAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      expect(inputHandler.isListening).toBe(true);
    });

    test('should not add duplicate listeners if already listening', () => {
      const mockAddEventListener = jest.fn();
      const mockWindow = {
        addEventListener: mockAddEventListener,
        removeEventListener: jest.fn()
      };
      globalThis.window = mockWindow;

      const inputHandler = new InputHandler();
      inputHandler.startListening();
      const callCount = mockAddEventListener.mock.calls.length;
      
      inputHandler.startListening();
      
      expect(mockAddEventListener.mock.calls.length).toBe(callCount);
    });

    test('should stop listening to events', () => {
      const mockRemoveEventListener = jest.fn();
      const mockWindow = {
        addEventListener: jest.fn(),
        removeEventListener: mockRemoveEventListener
      };
      globalThis.window = mockWindow;

      const inputHandler = new InputHandler();
      inputHandler.startListening();
      inputHandler.stopListening();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
      expect(inputHandler.isListening).toBe(false);
    });
  });

  describe('Keyboard Input', () => {
    test('should track key press', () => {
      const inputHandler = new InputHandler();
      simulateKeyPress(inputHandler, 'w');
      
      expect(inputHandler.isKeyPressed('w')).toBe(true);
      expect(inputHandler.isKeyPressed('W')).toBe(true); // Case insensitive
    });

    test('should track key release', () => {
      const inputHandler = new InputHandler();
      simulateKeyPress(inputHandler, 'w');
      expect(inputHandler.isKeyPressed('w')).toBe(true);
      
      simulateKeyRelease(inputHandler, 'w');
      expect(inputHandler.isKeyPressed('w')).toBe(false);
    });

    test('should handle multiple simultaneous key presses', () => {
      const inputHandler = new InputHandler();
      simulateKeyPress(inputHandler, 'w');
      simulateKeyPress(inputHandler, 'a');
      simulateKeyPress(inputHandler, 'd');

      expect(inputHandler.isKeyPressed('w')).toBe(true);
      expect(inputHandler.isKeyPressed('a')).toBe(true);
      expect(inputHandler.isKeyPressed('d')).toBe(true);
    });

    test('should be case insensitive for key checks', () => {
      const inputHandler = new InputHandler();
      simulateKeyPress(inputHandler, 'W');
      
      expect(inputHandler.isKeyPressed('w')).toBe(true);
      expect(inputHandler.isKeyPressed('W')).toBe(true);
    });
  });

  describe('Movement Vector Calculation', () => {
    test('should return zero vector when no keys pressed', () => {
      const inputHandler = new InputHandler();
      const vector = inputHandler.getMovementVector();
      
      expect(vector.x).toBe(0);
      expect(vector.y).toBe(0);
    });

    test('should return correct vector for W key (up)', () => {
      const inputHandler = new InputHandler();
      simulateKeyPress(inputHandler, 'w');
      const vector = inputHandler.getMovementVector();
      
      expect(vector.x).toBe(0);
      expect(vector.y).toBe(-1);
    });

    test('should return correct vector for S key (down)', () => {
      const inputHandler = new InputHandler();
      simulateKeyPress(inputHandler, 's');
      const vector = inputHandler.getMovementVector();
      
      expect(vector.x).toBe(0);
      expect(vector.y).toBe(1);
    });

    test('should return correct vector for A key (left)', () => {
      const inputHandler = new InputHandler();
      simulateKeyPress(inputHandler, 'a');
      const vector = inputHandler.getMovementVector();
      
      expect(vector.x).toBe(-1);
      expect(vector.y).toBe(0);
    });

    test('should return correct vector for D key (right)', () => {
      const inputHandler = new InputHandler();
      simulateKeyPress(inputHandler, 'd');
      const vector = inputHandler.getMovementVector();
      
      expect(vector.x).toBe(1);
      expect(vector.y).toBe(0);
    });

    test('should normalize diagonal movement (W+D)', () => {
      const inputHandler = new InputHandler();
      simulateKeyPress(inputHandler, 'w');
      simulateKeyPress(inputHandler, 'd');
      const vector = inputHandler.getMovementVector();
      
      const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
      expect(magnitude).toBeCloseTo(1.0, 5);
      expect(vector.x).toBeCloseTo(Math.SQRT1_2, 5);
      expect(vector.y).toBeCloseTo(-Math.SQRT1_2, 5);
    });

    test('should handle arrow keys same as WASD', () => {
      const inputHandler = new InputHandler();
      simulateKeyPress(inputHandler, 'ArrowUp');
      const vector1 = inputHandler.getMovementVector();
      
      inputHandler.clear();
      simulateKeyPress(inputHandler, 'w');
      const vector2 = inputHandler.getMovementVector();
      
      expect(vector1.x).toBe(vector2.x);
      expect(vector1.y).toBe(vector2.y);
    });

    test('should cancel opposite directions (W+S)', () => {
      const inputHandler = new InputHandler();
      simulateKeyPress(inputHandler, 'w');
      simulateKeyPress(inputHandler, 's');
      const vector = inputHandler.getMovementVector();
      
      expect(vector.y).toBe(0);
    });

    test('should cancel opposite directions (A+D)', () => {
      const inputHandler = new InputHandler();
      simulateKeyPress(inputHandler, 'a');
      simulateKeyPress(inputHandler, 'd');
      const vector = inputHandler.getMovementVector();
      
      expect(vector.x).toBe(0);
    });
  });

  describe('Mouse Input', () => {
    test('should track mouse position', () => {
      const mockEventListeners = {};
      const mockWindow = {
        addEventListener: jest.fn((event, handler) => {
          mockEventListeners[event] = handler;
        }),
        removeEventListener: jest.fn()
      };
      globalThis.window = mockWindow;

      const inputHandler = new InputHandler();
      inputHandler.startListening();
      mockEventListeners.mousemove({ clientX: 100, clientY: 200 });
      
      const pos = inputHandler.getMousePosition();
      expect(pos.x).toBe(100);
      expect(pos.y).toBe(200);
      
      inputHandler.stopListening();
    });

    test('should track mouse button press', () => {
      const mockEventListeners = {};
      const mockWindow = {
        addEventListener: jest.fn((event, handler) => {
          mockEventListeners[event] = handler;
        }),
        removeEventListener: jest.fn()
      };
      globalThis.window = mockWindow;

      const inputHandler = new InputHandler();
      inputHandler.startListening();
      mockEventListeners.mousedown({ button: 0 });
      
      expect(inputHandler.isMouseButtonPressed(0)).toBe(true);
      
      inputHandler.stopListening();
    });

    test('should track mouse button release', () => {
      const mockEventListeners = {};
      const mockWindow = {
        addEventListener: jest.fn((event, handler) => {
          mockEventListeners[event] = handler;
        }),
        removeEventListener: jest.fn()
      };
      globalThis.window = mockWindow;

      const inputHandler = new InputHandler();
      inputHandler.startListening();
      mockEventListeners.mousedown({ button: 0 });
      expect(inputHandler.isMouseButtonPressed(0)).toBe(true);
      
      mockEventListeners.mouseup({ button: 0 });
      expect(inputHandler.isMouseButtonPressed(0)).toBe(false);
      
      inputHandler.stopListening();
    });
  });

  describe('Callbacks', () => {
    test('should call keyboard callbacks on key events', () => {
      const mockEventListeners = {};
      const mockWindow = {
        addEventListener: jest.fn((event, handler) => {
          mockEventListeners[event] = handler;
        }),
        removeEventListener: jest.fn()
      };
      globalThis.window = mockWindow;

      const inputHandler = new InputHandler();
      inputHandler.startListening();
      
      const callback = jest.fn();
      inputHandler.onKeyDown(callback);
      
      mockEventListeners.keydown({ key: 'w' });
      expect(callback).toHaveBeenCalledWith('keydown', 'w');
      
      mockEventListeners.keyup({ key: 'w' });
      expect(callback).toHaveBeenCalledWith('keyup', 'w');
      
      inputHandler.stopListening();
    });

    test('should call mouse callbacks on click events', () => {
      const mockEventListeners = {};
      const mockWindow = {
        addEventListener: jest.fn((event, handler) => {
          mockEventListeners[event] = handler;
        }),
        removeEventListener: jest.fn()
      };
      globalThis.window = mockWindow;

      const inputHandler = new InputHandler();
      inputHandler.startListening();
      
      const callback = jest.fn();
      inputHandler.onMouseClick(callback);
      
      const mockPos = { x: 100, y: 200 };
      inputHandler.mousePos = mockPos;
      mockEventListeners.click({ button: 0 });
      
      expect(callback).toHaveBeenCalledWith('click', 0, mockPos);
      
      inputHandler.stopListening();
    });

    test('should support multiple callbacks', () => {
      const mockEventListeners = {};
      const mockWindow = {
        addEventListener: jest.fn((event, handler) => {
          mockEventListeners[event] = handler;
        }),
        removeEventListener: jest.fn()
      };
      globalThis.window = mockWindow;

      const inputHandler = new InputHandler();
      inputHandler.startListening();
      
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      inputHandler.onKeyDown(callback1);
      inputHandler.onKeyDown(callback2);
      
      mockEventListeners.keydown({ key: 'w' });
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
      
      inputHandler.stopListening();
    });
  });

  describe('Clear State', () => {
    test('should clear all key states', () => {
      const inputHandler = new InputHandler();
      simulateKeyPress(inputHandler, 'w');
      simulateKeyPress(inputHandler, 'a');
      
      expect(inputHandler.isKeyPressed('w')).toBe(true);
      expect(inputHandler.isKeyPressed('a')).toBe(true);
      
      inputHandler.clear();
      
      expect(inputHandler.isKeyPressed('w')).toBe(false);
      expect(inputHandler.isKeyPressed('a')).toBe(false);
    });

    test('should clear all mouse button states', () => {
      const mockEventListeners = {};
      const mockWindow = {
        addEventListener: jest.fn((event, handler) => {
          mockEventListeners[event] = handler;
        }),
        removeEventListener: jest.fn()
      };
      globalThis.window = mockWindow;

      const inputHandler = new InputHandler();
      inputHandler.startListening();
      mockEventListeners.mousedown({ button: 0 });
      mockEventListeners.mousedown({ button: 1 });
      
      expect(inputHandler.isMouseButtonPressed(0)).toBe(true);
      expect(inputHandler.isMouseButtonPressed(1)).toBe(true);
      
      inputHandler.clear();
      
      expect(inputHandler.isMouseButtonPressed(0)).toBe(false);
      expect(inputHandler.isMouseButtonPressed(1)).toBe(false);
      
      inputHandler.stopListening();
    });
  });
});
