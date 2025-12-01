/**
 * AudioSystem - Manages audio playback using Web Audio API
 * Handles sound effects and ambient background music
 */
export class AudioSystem {
  /**
   * @param {Object} config - Configuration object (optional)
   */
  constructor(config = {}) {
    this.audioContext = null;
    this.sounds = new Map(); // id -> { buffer, url }
    this.ambientSource = null;
    this.ambientGain = null;
    this.currentAmbientId = null;
  }

  /**
   * Initialize the audio context (must be called after user interaction)
   */
  initializeContext() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
  }

  /**
   * Load a sound from a URL
   * @param {string} id - Unique identifier for the sound
   * @param {string} url - URL to the audio file
   * @returns {Promise<boolean>} True if loading succeeded
   */
  async loadSound(id, url) {
    if (typeof id !== 'string' || id.length === 0) {
      throw new Error('Sound id must be a non-empty string');
    }
    if (typeof url !== 'string' || url.length === 0) {
      throw new Error('Sound url must be a non-empty string');
    }

    this.initializeContext();

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.sounds.set(id, {
        buffer: audioBuffer,
        url: url
      });

      return true;
    } catch (error) {
      console.error(`Failed to load sound ${id} from ${url}:`, error);
      return false;
    }
  }

  /**
   * Play a sound effect
   * @param {string} id - Sound identifier
   * @param {number} volume - Volume level (0.0 to 1.0, default: 1.0)
   * @param {boolean} loop - Whether to loop the sound (default: false)
   * @returns {Object|null} Source node for the playing sound, or null if failed
   */
  playSound(id, volume = 1.0, loop = false) {
    if (!this.sounds.has(id)) {
      console.warn(`Sound ${id} not loaded`);
      return null;
    }

    if (typeof volume !== 'number' || volume < 0 || volume > 1) {
      console.warn(`Invalid volume ${volume}, must be between 0 and 1`);
      return null;
    }

    this.initializeContext();

    const sound = this.sounds.get(id);
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = sound.buffer;
    source.loop = loop;
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    source.start(0);

    return source;
  }

  /**
   * Play ambient background music
   * @param {string} id - Sound identifier
   * @param {number} volume - Volume level (0.0 to 1.0, default: 0.5)
   * @returns {boolean} True if playback started successfully
   */
  playAmbient(id, volume = 0.5) {
    if (!this.sounds.has(id)) {
      console.warn(`Sound ${id} not loaded`);
      return false;
    }

    if (typeof volume !== 'number' || volume < 0 || volume > 1) {
      console.warn(`Invalid volume ${volume}, must be between 0 and 1`);
      return false;
    }

    // Stop current ambient if playing
    this.stopAmbient();

    this.initializeContext();

    const sound = this.sounds.get(id);
    this.ambientSource = this.audioContext.createBufferSource();
    this.ambientGain = this.audioContext.createGain();

    this.ambientSource.buffer = sound.buffer;
    this.ambientSource.loop = true;
    this.ambientGain.gain.value = volume;

    this.ambientSource.connect(this.ambientGain);
    this.ambientGain.connect(this.audioContext.destination);

    this.ambientSource.start(0);
    this.currentAmbientId = id;

    return true;
  }

  /**
   * Stop ambient background music
   */
  stopAmbient() {
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
      } catch (error) {
        // Source may already be stopped
      }
      this.ambientSource = null;
      this.ambientGain = null;
      this.currentAmbientId = null;
    }
  }

  /**
   * Check if a sound is loaded
   * @param {string} id - Sound identifier
   * @returns {boolean} True if sound is loaded
   */
  hasSound(id) {
    return this.sounds.has(id);
  }

  /**
   * Get information about a loaded sound
   * @param {string} id - Sound identifier
   * @returns {Object|null} Sound info {url, duration} or null if not found
   */
  getSound(id) {
    if (!this.sounds.has(id)) {
      return null;
    }

    const sound = this.sounds.get(id);
    return {
      url: sound.url,
      duration: sound.buffer ? sound.buffer.duration : 0
    };
  }

  /**
   * Get all loaded sound IDs
   * @returns {Array<string>} Array of sound IDs
   */
  getAllSoundIds() {
    return Array.from(this.sounds.keys());
  }

  /**
   * Remove a sound from the system
   * @param {string} id - Sound identifier
   * @returns {boolean} True if sound was removed
   */
  removeSound(id) {
    // Stop ambient if it's the one being removed
    if (this.currentAmbientId === id) {
      this.stopAmbient();
    }

    return this.sounds.delete(id);
  }

  /**
   * Get current ambient track ID
   * @returns {string|null} Current ambient track ID or null
   */
  getCurrentAmbient() {
    return this.currentAmbientId;
  }

  /**
   * Clear all loaded sounds
   */
  clearAllSounds() {
    this.stopAmbient();
    this.sounds.clear();
  }
}
