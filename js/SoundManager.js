/**
 * SoundManager — semua efek suara dibuat langsung dengan Web Audio API
 * (tidak ada file audio).
 *
 * - AudioContext baru dibuat setelah interaksi pertama (aturan autoplay browser).
 * - Bunyi panjang (hasil, error, perayaan) diputar di "bus" sendiri; bunyi panjang
 *   baru memudarkan yang lama supaya tidak bertumpuk.
 * - Bunyi yang sama tidak diputar dua kali dalam 40 ms.
 */
class SoundManager {
  static PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];

  constructor() {
    const saved = Settings.load();
    this.enabled = saved.sound !== false;
    this.volume = typeof saved.volume === 'number' ? saved.volume : 0.6;
    this.ctx = null;
    this.master = null;
    this.longBus = null;
    this.lastPlayed = {};
  }

  /* ---------- API publik ---------- */

  /** Putar bunyi berdasarkan nama preset (lihat #presets). */
  play(name, arg) {
    const preset = this.#presets[name];
    if (!this.enabled || this.volume <= 0 || !preset) return;
    if (!this.unlock()) return;
    const now = performance.now();
    if (this.lastPlayed[name] && now - this.lastPlayed[name] < 40) return;
    this.lastPlayed[name] = now;
    preset(arg);
  }

  /** Buat / lanjutkan AudioContext. Dipanggil pada interaksi pertama. */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC({ latencyHint: 'interactive' });
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.#applyVolume(true);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  setEnabled(on) {
    this.enabled = on;
    if (this.ctx) this.#applyVolume();
    this.#persist();
  }

  setVolume(v) {
    this.volume = v;
    if (this.ctx) this.#applyVolume();
    this.#persist();
  }

  get muted() {
    return !this.enabled || this.volume === 0;
  }

  /* ---------- internal ---------- */

  #persist() {
    Settings.save({ sound: this.enabled, volume: this.volume });
  }

  #applyVolume(instant) {
    if (!this.master) return;
    const target = this.enabled ? this.volume * this.volume * 0.7 : 0; // kurva lebih alami
    if (instant) this.master.gain.value = target;
    else this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.02);
  }

  /** Satu nada pendek dengan selubung halus (tanpa bunyi "klik"). */
  #tone(out, { freq, type = 'sine', start = 0, dur = 0.12, gain = 0.25, slideTo = null, attack = 0.006 }) {
    const t = this.ctx.currentTime + start;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.03);
    osc.onended = () => { osc.disconnect(); g.disconnect(); };
  }

  #newLongBus() {
    if (this.longBus) {
      const old = this.longBus;
      old.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.03);
      setTimeout(() => old.disconnect(), 300);
    }
    this.longBus = this.ctx.createGain();
    this.longBus.connect(this.master);
    return this.longBus;
  }

  /** Daftar bunyi. Kunci = nama yang dipakai di play(). */
  #presets = {
    digit: (d) => {
      const f = SoundManager.PENTATONIC[d] || 660;
      this.#tone(this.master, { freq: f, dur: .09, gain: .2 });
      this.#tone(this.master, { freq: f * 2, dur: .05, gain: .04 });
    },
    add: () => {
      this.#tone(this.master, { freq: 587, type: 'triangle', dur: .08, gain: .18 });
      this.#tone(this.master, { freq: 880, type: 'triangle', start: .06, dur: .11, gain: .18 });
    },
    sub: () => {
      this.#tone(this.master, { freq: 880, type: 'triangle', dur: .08, gain: .18 });
      this.#tone(this.master, { freq: 587, type: 'triangle', start: .06, dur: .11, gain: .18 });
    },
    mul: () => {
      [1175, 1480, 1760].forEach((f, i) => this.#tone(this.master, { freq: f, type: 'triangle', start: i * .04, dur: .07, gain: .12 }));
    },
    div: () => {
      this.#tone(this.master, { freq: 440, type: 'triangle', dur: .07, gain: .2 });
      this.#tone(this.master, { freq: 440, type: 'triangle', start: .1, dur: .07, gain: .16 });
    },
    percent: () => this.#tone(this.master, { freq: 700, slideTo: 1150, dur: .13, gain: .14 }),
    dot: () => this.#tone(this.master, { freq: 1400, dur: .04, gain: .09 }),
    back: () => this.#tone(this.master, { freq: 520, slideTo: 360, type: 'triangle', dur: .08, gain: .14 }),
    clear: () => this.#tone(this.master, { freq: 820, slideTo: 220, dur: .24, gain: .14 }),
    toggle: () => {
      this.#tone(this.master, { freq: 990, dur: .06, gain: .12 });
      this.#tone(this.master, { freq: 1320, start: .05, dur: .07, gain: .1 });
    },
    equals: () => {
      const bus = this.#newLongBus();
      [740, 880, 1047].forEach((f, i) => this.#tone(bus, { freq: f, start: i * .07, dur: .07, gain: .1 }));
    },
    success: () => {
      const bus = this.#newLongBus();
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.#tone(bus, { freq: f, type: 'triangle', start: i * .075, dur: .28, gain: .16 }));
    },
    error: () => {
      const bus = this.#newLongBus();
      this.#tone(bus, { freq: 330, slideTo: 300, type: 'triangle', dur: .18, gain: .2 });
      this.#tone(bus, { freq: 247, slideTo: 208, type: 'triangle', start: .17, dur: .32, gain: .2 });
    },
    celebrate: () => {
      const bus = this.#newLongBus();
      [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98].forEach((f, i) => this.#tone(bus, { freq: f, type: 'triangle', start: i * .07, dur: .3, gain: .14 }));
      for (let i = 0; i < 6; i++) this.#tone(bus, { freq: Util.rand(1800, 3200), start: .45 + i * .06, dur: .08, gain: .05 });
    },
  };
}
