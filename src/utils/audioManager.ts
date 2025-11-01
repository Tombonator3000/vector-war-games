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
      
      audioClone.play().catch(() => {
        // Silently fail - user might not have interacted with page yet
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
  // UI Sounds
  audioManager.preload('ui-click', '/sfx/ui-click.mp3');
  audioManager.preload('ui-hover', '/sfx/ui-hover.mp3');
  audioManager.preload('ui-success', '/sfx/ui-success.mp3');
  audioManager.preload('ui-error', '/sfx/ui-error.mp3');
  audioManager.preload('ui-open', '/sfx/ui-open.mp3');
  audioManager.preload('ui-close', '/sfx/ui-close.mp3');

  // Explosions
  audioManager.preload('nuclear-explosion', '/sfx/nuclear-explosion.mp3');
  audioManager.preload('explosion-shockwave', '/sfx/explosion-shockwave.mp3');
  audioManager.preload('explosion-blast', '/sfx/explosion-blast.mp3');

  // Military
  audioManager.preload('missile-launch', '/sfx/missile-launch.mp3');
  audioManager.preload('rocket-whoosh', '/sfx/rocket-whoosh.mp3');
  audioManager.preload('bomber-flyby', '/sfx/bomber-flyby.mp3');

  // Alerts & Warnings
  audioManager.preload('alert-warning', '/sfx/alert-warning.mp3');
  audioManager.preload('alert-critical', '/sfx/alert-critical.mp3');
  audioManager.preload('defcon-change', '/sfx/defcon-change.mp3');
  audioManager.preload('siren', '/sfx/siren.mp3');

  // Game Events
  audioManager.preload('research-complete', '/sfx/research-complete.mp3');
  audioManager.preload('build-complete', '/sfx/build-complete.mp3');
  audioManager.preload('victory', '/sfx/victory.mp3');
  audioManager.preload('defeat', '/sfx/defeat.mp3');
  audioManager.preload('turn-start', '/sfx/turn-start.mp3');

  // Diplomacy
  audioManager.preload('diplomacy-message', '/sfx/diplomacy-message.mp3');
  audioManager.preload('treaty-signed', '/sfx/treaty-signed.mp3');

  // Economy
  audioManager.preload('resource-gain', '/sfx/resource-gain.mp3');
  audioManager.preload('construction', '/sfx/construction.mp3');
}
