import { describe, test, expect, jest } from '@jest/globals';
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
      const inputHandler = new InputHandler();
      
      // Spy on window.addEventListener
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      inputHandler.startListening();

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(inputHandler.isListening).toBe(true);
      
      inputHandler.stopListening();
      addEventListenerSpy.mockRestore();
    });

    test('should not add duplicate listeners if already listening', () => {
      const inputHandler = new InputHandler();
      
      // Spy on window.addEventListener
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      inputHandler.startListening();
      const callCount = addEventListenerSpy.mock.calls.length;
      
      inputHandler.startListening();
      
      expect(addEventListenerSpy.mock.calls.length).toBe(callCount);
      
      inputHandler.stopListening();
      addEventListenerSpy.mockRestore();
    });

    test('should stop listening to events', () => {
      const inputHandler = new InputHandler();
      
      // Spy on window.removeEventListener
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      inputHandler.startListening();
      inputHandler.stopListening();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
      expect(inputHandler.isListening).toBe(false);
      
      removeEventListenerSpy.mockRestore();
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
      const inputHandler = new InputHandler();
      inputHandler.startListening();
      
      // Dispatch a mousemove event
      const event = new MouseEvent('mousemove', { clientX: 100, clientY: 200 });
      window.dispatchEvent(event);
      
      const pos = inputHandler.getMousePosition();
      expect(pos.x).toBe(100);
      expect(pos.y).toBe(200);
      
      inputHandler.stopListening();
    });

    test('should track mouse button press', () => {
      const inputHandler = new InputHandler();
      inputHandler.startListening();
      
      // Dispatch a mousedown event
      const event = new MouseEvent('mousedown', { button: 0 });
      window.dispatchEvent(event);
      
      expect(inputHandler.isMouseButtonPressed(0)).toBe(true);
      
      inputHandler.stopListening();
    });

    test('should track mouse button release', () => {
      const inputHandler = new InputHandler();
      inputHandler.startListening();
      
      // Dispatch mousedown then mouseup
      const downEvent = new MouseEvent('mousedown', { button: 0 });
      window.dispatchEvent(downEvent);
      expect(inputHandler.isMouseButtonPressed(0)).toBe(true);
      
      const upEvent = new MouseEvent('mouseup', { button: 0 });
      window.dispatchEvent(upEvent);
      expect(inputHandler.isMouseButtonPressed(0)).toBe(false);
      
      inputHandler.stopListening();
    });
  });

  describe('Callbacks', () => {
    test('should call keyboard callbacks on key events', () => {
      const inputHandler = new InputHandler();
      inputHandler.startListening();
      
      const callback = jest.fn();
      inputHandler.onKeyDown(callback);
      
      // Dispatch keydown event
      const downEvent = new KeyboardEvent('keydown', { key: 'w' });
      window.dispatchEvent(downEvent);
      expect(callback).toHaveBeenCalledWith('keydown', 'w');
      
      // Dispatch keyup event
      const upEvent = new KeyboardEvent('keyup', { key: 'w' });
      window.dispatchEvent(upEvent);
      expect(callback).toHaveBeenCalledWith('keyup', 'w');
      
      inputHandler.stopListening();
    });

    test('should call mouse callbacks on click events', () => {
      const inputHandler = new InputHandler();
      inputHandler.startListening();
      
      const callback = jest.fn();
      inputHandler.onMouseClick(callback);
      
      // Set mouse position first
      const moveEvent = new MouseEvent('mousemove', { clientX: 100, clientY: 200 });
      window.dispatchEvent(moveEvent);
      
      // Dispatch click event
      const clickEvent = new MouseEvent('click', { button: 0 });
      window.dispatchEvent(clickEvent);
      
      expect(callback).toHaveBeenCalledWith('click', 0, { x: 100, y: 200 });
      
      inputHandler.stopListening();
    });

    test('should support multiple callbacks', () => {
      const inputHandler = new InputHandler();
      inputHandler.startListening();
      
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      inputHandler.onKeyDown(callback1);
      inputHandler.onKeyDown(callback2);
      
      // Dispatch keydown event
      const event = new KeyboardEvent('keydown', { key: 'w' });
      window.dispatchEvent(event);
      
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
      const inputHandler = new InputHandler();
      inputHandler.startListening();
      
      // Dispatch mousedown events
      const event0 = new MouseEvent('mousedown', { button: 0 });
      window.dispatchEvent(event0);
      const event1 = new MouseEvent('mousedown', { button: 1 });
      window.dispatchEvent(event1);
      
      expect(inputHandler.isMouseButtonPressed(0)).toBe(true);
      expect(inputHandler.isMouseButtonPressed(1)).toBe(true);
      
      inputHandler.clear();
      
      expect(inputHandler.isMouseButtonPressed(0)).toBe(false);
      expect(inputHandler.isMouseButtonPressed(1)).toBe(false);
      
      inputHandler.stopListening();
    });
  });
});
