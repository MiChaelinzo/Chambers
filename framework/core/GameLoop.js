/**
 * GameLoop manages the continuous update-render cycle for the game.
 * Uses requestAnimationFrame for smooth, browser-optimized timing.
 */
export class GameLoop {
  constructor(updateFn, renderFn, targetFPS = 60) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
    this.targetFPS = targetFPS;
    this.targetFrameTime = 1000 / targetFPS; // milliseconds per frame
    
    this.isRunning = false;
    this.isPaused = false;
    this.lastTime = 0;
    this.animationFrameId = null;
    
    // Frame time smoothing
    this.frameTimes = [];
    this.maxFrameTimeSamples = 10;
    
    // Bind the loop method to maintain context
    this._loop = this._loop.bind(this);
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this._loop);
  }

  /**
   * Stop the game loop completely
   */
  stop() {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    this.isPaused = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Pause the game loop without stopping it
   */
  pause() {
    if (!this.isRunning || this.isPaused) {
      return;
    }
    
    this.isPaused = true;
  }

  /**
   * Resume the game loop from pause
   */
  resume() {
    if (!this.isRunning || !this.isPaused) {
      return;
    }
    
    this.isPaused = false;
    this.lastTime = performance.now(); // Reset time to avoid large delta
  }

  /**
   * Internal loop method called by requestAnimationFrame
   * @private
   */
  _loop(currentTime) {
    if (!this.isRunning) {
      return;
    }

    // Calculate delta time in seconds
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Store frame time for smoothing
    const frameTime = deltaTime * 1000;
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.maxFrameTimeSamples) {
      this.frameTimes.shift();
    }

    // Only update and render if not paused
    if (!this.isPaused) {
      // Call update function with delta time
      if (this.updateFn) {
        this.updateFn(deltaTime);
      }

      // Call render function
      if (this.renderFn) {
        this.renderFn();
      }
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this._loop);
  }

  /**
   * Get the average frame time (smoothed)
   * @returns {number} Average frame time in milliseconds
   */
  getAverageFrameTime() {
    if (this.frameTimes.length === 0) {
      return this.targetFrameTime;
    }
    
    const sum = this.frameTimes.reduce((acc, time) => acc + time, 0);
    return sum / this.frameTimes.length;
  }

  /**
   * Get the current FPS based on smoothed frame time
   * @returns {number} Current FPS
   */
  getCurrentFPS() {
    const avgFrameTime = this.getAverageFrameTime();
    return avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
  }

  /**
   * Check if the loop is currently running
   * @returns {boolean}
   */
  getIsRunning() {
    return this.isRunning;
  }

  /**
   * Check if the loop is currently paused
   * @returns {boolean}
   */
  getIsPaused() {
    return this.isPaused;
  }
}
