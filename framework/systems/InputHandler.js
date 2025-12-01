/**
 * InputHandler - Captures and processes keyboard and mouse input
 */
export class InputHandler {
  constructor() {
    this.keys = new Set();
    this.mousePos = { x: 0, y: 0 };
    this.mouseButtons = new Set();
    this.keyCallbacks = [];
    this.mouseCallbacks = [];
    this.isListening = false;
  }

  /**
   * Start listening to input events
   */
  startListening() {
    if (this.isListening) return;

    this.keyDownHandler = (e) => {
      this.keys.add(e.key.toLowerCase());
      this.keyCallbacks.forEach(cb => cb('keydown', e.key.toLowerCase()));
    };

    this.keyUpHandler = (e) => {
      this.keys.delete(e.key.toLowerCase());
      this.keyCallbacks.forEach(cb => cb('keyup', e.key.toLowerCase()));
    };

    this.mouseMoveHandler = (e) => {
      this.mousePos.x = e.clientX;
      this.mousePos.y = e.clientY;
    };

    this.mouseDownHandler = (e) => {
      this.mouseButtons.add(e.button);
      this.mouseCallbacks.forEach(cb => cb('mousedown', e.button, this.mousePos));
    };

    this.mouseUpHandler = (e) => {
      this.mouseButtons.delete(e.button);
      this.mouseCallbacks.forEach(cb => cb('mouseup', e.button, this.mousePos));
    };

    this.clickHandler = (e) => {
      this.mouseCallbacks.forEach(cb => cb('click', e.button, this.mousePos));
    };

    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);
    window.addEventListener('mousemove', this.mouseMoveHandler);
    window.addEventListener('mousedown', this.mouseDownHandler);
    window.addEventListener('mouseup', this.mouseUpHandler);
    window.addEventListener('click', this.clickHandler);

    this.isListening = true;
  }

  /**
   * Stop listening to input events
   */
  stopListening() {
    if (!this.isListening) return;

    window.removeEventListener('keydown', this.keyDownHandler);
    window.removeEventListener('keyup', this.keyUpHandler);
    window.removeEventListener('mousemove', this.mouseMoveHandler);
    window.removeEventListener('mousedown', this.mouseDownHandler);
    window.removeEventListener('mouseup', this.mouseUpHandler);
    window.removeEventListener('click', this.clickHandler);

    this.isListening = false;
  }

  /**
   * Check if a specific key is currently pressed
   * @param {string} key - The key to check (case-insensitive)
   * @returns {boolean}
   */
  isKeyPressed(key) {
    return this.keys.has(key.toLowerCase());
  }

  /**
   * Get movement vector from WASD or arrow keys
   * Returns normalized vector with magnitude <= 1
   * @returns {{x: number, y: number}}
   */
  getMovementVector() {
    let x = 0;
    let y = 0;

    // Check WASD keys
    if (this.isKeyPressed('w') || this.isKeyPressed('arrowup')) {
      y -= 1;
    }
    if (this.isKeyPressed('s') || this.isKeyPressed('arrowdown')) {
      y += 1;
    }
    if (this.isKeyPressed('a') || this.isKeyPressed('arrowleft')) {
      x -= 1;
    }
    if (this.isKeyPressed('d') || this.isKeyPressed('arrowright')) {
      x += 1;
    }

    // Normalize diagonal movement to prevent faster diagonal speed
    if (x !== 0 && y !== 0) {
      const magnitude = Math.sqrt(x * x + y * y);
      x /= magnitude;
      y /= magnitude;
    }

    return { x, y };
  }

  /**
   * Register a callback for keyboard events
   * @param {Function} callback - Function called with (eventType, key)
   */
  onKeyDown(callback) {
    this.keyCallbacks.push(callback);
  }

  /**
   * Register a callback for mouse click events
   * @param {Function} callback - Function called with (eventType, button, position)
   */
  onMouseClick(callback) {
    this.mouseCallbacks.push(callback);
  }

  /**
   * Get current mouse position
   * @returns {{x: number, y: number}}
   */
  getMousePosition() {
    return { ...this.mousePos };
  }

  /**
   * Check if a mouse button is currently pressed
   * @param {number} button - Mouse button (0=left, 1=middle, 2=right)
   * @returns {boolean}
   */
  isMouseButtonPressed(button) {
    return this.mouseButtons.has(button);
  }

  /**
   * Clear all input state (useful for scene transitions)
   */
  clear() {
    this.keys.clear();
    this.mouseButtons.clear();
  }
}
