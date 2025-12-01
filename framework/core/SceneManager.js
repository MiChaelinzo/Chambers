/**
 * SceneManager manages loading, unloading, and transitioning between scenes.
 * It maintains a registry of available scenes and tracks the currently active scene.
 */
export class SceneManager {
  constructor() {
    this.scenes = new Map(); // Map of scene ID -> scene
    this.currentScene = null;
    this.transitionInProgress = false;
  }

  /**
   * Register a scene with the manager
   * @param {string} id - Scene identifier
   * @param {Scene} scene - Scene instance to register
   * @throws {Error} If a scene with this ID is already registered
   */
  registerScene(id, scene) {
    if (this.scenes.has(id)) {
      throw new Error(`Scene with id "${id}" is already registered`);
    }
    this.scenes.set(id, scene);
  }

  /**
   * Load a scene by ID, unloading the current scene if one is active
   * @param {string} id - Scene ID to load
   * @param {Object} transitionData - Optional data to pass to the new scene
   * @throws {Error} If scene ID is not registered
   * @returns {Scene} The loaded scene
   */
  loadScene(id, transitionData = {}) {
    if (this.transitionInProgress) {
      throw new Error('Scene transition already in progress');
    }

    const newScene = this.scenes.get(id);
    if (!newScene) {
      throw new Error(`Scene with id "${id}" is not registered`);
    }

    this.transitionInProgress = true;

    try {
      // Unload current scene if one exists
      if (this.currentScene) {
        this.currentScene.unload();
      }

      // Load the new scene
      newScene.load();

      // Set as current scene
      this.currentScene = newScene;

      // Store transition data if needed (can be used by scene)
      if (transitionData && Object.keys(transitionData).length > 0) {
        this.currentScene._transitionData = transitionData;
      }

      return this.currentScene;
    } finally {
      this.transitionInProgress = false;
    }
  }

  /**
   * Get the currently active scene
   * @returns {Scene|null} The current scene, or null if no scene is loaded
   */
  getCurrentScene() {
    return this.currentScene;
  }

  /**
   * Get a registered scene by ID (without loading it)
   * @param {string} id - Scene ID
   * @returns {Scene|undefined} The scene, or undefined if not registered
   */
  getScene(id) {
    return this.scenes.get(id);
  }

  /**
   * Check if a scene is registered
   * @param {string} id - Scene ID
   * @returns {boolean} True if scene is registered
   */
  hasScene(id) {
    return this.scenes.has(id);
  }

  /**
   * Unregister a scene
   * @param {string} id - Scene ID to unregister
   * @returns {boolean} True if scene was unregistered, false if not found
   */
  unregisterScene(id) {
    // Don't unregister the current scene
    if (this.currentScene && this.currentScene.getId() === id) {
      throw new Error('Cannot unregister the currently active scene');
    }
    return this.scenes.delete(id);
  }

  /**
   * Get all registered scene IDs
   * @returns {Array<string>} Array of scene IDs
   */
  getAllSceneIds() {
    return Array.from(this.scenes.keys());
  }

  /**
   * Unload the current scene without loading a new one
   */
  unloadCurrentScene() {
    if (this.currentScene) {
      this.currentScene.unload();
      this.currentScene = null;
    }
  }

  /**
   * Check if a transition is currently in progress
   * @returns {boolean}
   */
  isTransitioning() {
    return this.transitionInProgress;
  }
}
