/**
 * Audio Manager for game sound effects
 */

class AudioManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private volume: number = 0.5;
  private enabled: boolean = true;

  /**
   * Preload a sound effect
   */
  preload(key: string, path: string): void {
    if (this.sounds.has(key)) return;
    
    const audio = new Audio(path);
    audio.volume = this.volume;
    audio.preload = 'auto';
    this.sounds.set(key, audio);
  }

  /**
   * Play a sound effect
   */
  play(key: string, volumeOverride?: number): void {
    if (!this.enabled) return;

    const sound = this.sounds.get(key);
    if (!sound) {
      console.warn(`Sound "${key}" not found. Did you preload it?`);
      return;
    }

    // Clone the audio to allow overlapping plays
    const audioClone = sound.cloneNode(true) as HTMLAudioElement;
    audioClone.volume = volumeOverride !== undefined ? volumeOverride : this.volume;
    
    audioClone.play().catch(err => {
      console.warn(`Failed to play sound "${key}":`, err);
    });
  }

  /**
   * Set global volume
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(sound => {
      sound.volume = this.volume;
    });
  }

  /**
   * Enable or disable sound
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Check if sound is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export singleton instance
export const audioManager = new AudioManager();

// Preload explosion sounds
audioManager.preload('nuclear-explosion', '/sfx/nuclear-explosion.mp3');
audioManager.preload('explosion-shockwave', '/sfx/explosion-shockwave.mp3');
audioManager.preload('explosion-blast', '/sfx/explosion-blast.mp3');
