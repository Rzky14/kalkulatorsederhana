/**
 * SoundControls — tombol mute & slider volume di toolbar.
 */
class SoundControls {
  /**
   * @param {SoundManager} sound
   * @param {HTMLButtonElement} muteBtn
   * @param {HTMLInputElement} volumeEl
   */
  constructor(sound, muteBtn, volumeEl) {
    this.sound = sound;
    this.muteBtn = muteBtn;
    this.volumeEl = volumeEl;

    muteBtn.addEventListener('click', () => { this.toggle(); muteBtn.blur(); });
    volumeEl.addEventListener('input', () => { sound.setVolume(volumeEl.value / 100); this.sync(); });
    volumeEl.addEventListener('change', () => { sound.play('digit', 4); volumeEl.blur(); });
    this.sync();
  }

  /** Nyalakan/matikan suara (juga dipakai tombol M di keyboard). */
  toggle() {
    if (this.sound.enabled && this.sound.volume === 0) this.sound.setVolume(0.6);
    else this.sound.setEnabled(!this.sound.enabled);
    this.sync();
    this.sound.play('toggle');
  }

  /** Samakan tampilan tombol & slider dengan keadaan suara. */
  sync() {
    const muted = this.sound.muted;
    this.muteBtn.setAttribute('aria-pressed', String(muted));
    this.muteBtn.setAttribute('aria-label', muted ? 'Nyalakan suara' : 'Matikan suara');
    this.volumeEl.value = Math.round(this.sound.volume * 100);
    this.volumeEl.style.setProperty('--v', this.volumeEl.value + '%');
    this.volumeEl.disabled = !this.sound.enabled;
  }
}
