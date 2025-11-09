/**
 * Audio Manager for game sound effects
 */

class AudioManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private volume: number = 0.5;
  private enabled: boolean = true;
  private uiVolume: number = 0.3;
  private sfxVolume: number = 0.5;
  private criticalVolume: number = 0.7;

  /**
   * Preload a sound effect
   */
  preload(key: string, path: string): void {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') {
      return;
    }

    if (this.sounds.has(key)) return;

    try {
      const audio = new Audio(path);
      audio.volume = this.volume;
      audio.preload = 'auto';
      this.sounds.set(key, audio);
    } catch (err) {
      console.warn(`Failed to preload sound "${key}":`, err);
    }
  }

  /**
   * Play a sound effect
   */
  play(key: string, volumeOverride?: number): void {
    if (!this.enabled) return;

    const sound = this.sounds.get(key);
    if (!sound) {
      return; // Silently fail if sound not found
    }

    try {
      // Clone the audio to allow overlapping plays
      const audioClone = sound.cloneNode(true) as HTMLAudioElement;
      audioClone.volume = volumeOverride !== undefined ? volumeOverride : this.volume;

      // Clean up audio element after playback to prevent memory leak
      const cleanup = () => {
        audioClone.removeEventListener('ended', cleanup);
        audioClone.removeEventListener('error', cleanup);
        audioClone.src = '';
        audioClone.load();
      };

      audioClone.addEventListener('ended', cleanup);
      audioClone.addEventListener('error', cleanup);

      audioClone.play().catch(() => {
        // Silently fail - user might not have interacted with page yet
        cleanup();
      });
    } catch (err) {
      // Silently fail
    }
  }

  /**
   * Play UI sound (button clicks, etc.)
   */
  playUI(key: string): void {
    this.play(key, this.uiVolume);
  }

  /**
   * Play SFX sound (missiles, explosions, etc.)
   */
  playSFX(key: string): void {
    this.play(key, this.sfxVolume);
  }

  /**
   * Play critical alert sound
   */
  playCritical(key: string): void {
    this.play(key, this.criticalVolume);
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
   * Set UI sounds volume
   */
  setUIVolume(volume: number): void {
    this.uiVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Set SFX volume
   */
  setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Set critical alerts volume
   */
  setCriticalVolume(volume: number): void {
    this.criticalVolume = Math.max(0, Math.min(1, volume));
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

// ==================== PRELOAD ALL SOUND EFFECTS ====================

if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
  // Only preload sounds that actually exist in public/sfx/
  // Explosions
  audioManager.preload('nuclear-explosion', '/sfx/nuclear-explosion.mp3');
  audioManager.preload('explosion-blast', '/sfx/explosion-blast.mp3');

  // Military
  audioManager.preload('rocket-whoosh', '/sfx/rocket-whoosh.mp3');
}
