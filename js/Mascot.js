/**
 * Mascot — kelinci di atas kalkulator.
 *
 * Dua lapis state:
 * - base     : state dasar dari waktu ('idle' atau 'sleepy')
 * - reaction : state sementara dari interaksi pengguna
 * Yang tampil = reaction || base. Hanya ada SATU timer reaksi, jadi reaksi
 * tidak pernah bertabrakan. Setiap state memakai gambar pose (sprite) sendiri.
 */
class Mascot {
  /** Pose saat diam, berbeda tiap waktu. */
  static IDLE_POSE = { pagi: 'menyapa', siang: 'idle', sore: 'membaca', malam: 'duduk', larut: 'tidur' };

  /** Pose untuk tiap reaksi. */
  static REACTION_POSE = {
    watching: 'idle', curious: 'siap', thinking: 'berpikir',
    confused: 'bingung', sad: 'sedih', celebrating: 'menyemangati', sleepy: 'tidur',
  };

  /** Pose "senang" dipilih acak supaya tidak monoton. */
  static HAPPY_POSES = ['thumbs_up', 'senang', 'lompat'];

  /**
   * @param {HTMLElement} el      elemen #mascot (berisi <img data-pose>)
   * @param {HTMLElement} bubble  gelembung teks
   */
  constructor(el, bubble) {
    this.el = el;
    this.bubble = bubble;
    this.poses = {};
    el.querySelectorAll('img[data-pose]').forEach((img) => { this.poses[img.dataset.pose] = img; });

    this.base = 'idle';
    this.period = 'malam';
    this.reaction = null;
    this.reactionPose = null;
    this.bubbleText = null;
    this.timer = null;
  }

  /**
   * Tampilkan reaksi sementara.
   * @param {string} state  watching | curious | thinking | happy | confused | sad | celebrating
   * @param {{duration?:number, bubble?:string, restart?:boolean}} opts
   */
  react(state, { duration = 0, bubble = null, restart = false } = {}) {
    clearTimeout(this.timer);
    this.reaction = state;
    this.reactionPose = state === 'happy'
      ? Mascot.HAPPY_POSES[Math.floor(Math.random() * Mascot.HAPPY_POSES.length)]
      : Mascot.REACTION_POSE[state] || null;
    this.bubbleText = bubble;
    this.#render(restart);
    if (duration) {
      this.timer = setTimeout(() => this.reset(), duration);
    }
  }

  /** Hentikan reaksi, kembali ke state dasar. */
  reset() {
    clearTimeout(this.timer);
    this.reaction = null;
    this.reactionPose = null;
    this.bubbleText = null;
    this.#render();
  }

  /**
   * Ganti state dasar (dipanggil saat waktu berganti). Reaksi yang sedang
   * berjalan tidak diputus; state dasar dipakai setelah reaksi selesai.
   */
  setBase(state, period) {
    this.base = state;
    if (period) this.period = period;
    this.#render();
  }

  get state() { return this.el.dataset.state; }

  get pose() {
    const on = this.el.querySelector('img.on');
    return on ? on.dataset.pose : null;
  }

  /* ---------- internal ---------- */

  #poseFor(state) {
    if (this.reaction && this.reactionPose) return this.reactionPose;
    if (state === 'idle') return Mascot.IDLE_POSE[this.period] || 'idle';
    return Mascot.REACTION_POSE[state] || 'idle';
  }

  #render(restart = false) {
    const state = this.reaction || this.base;
    const cssState = state === 'sad' ? 'confused' : state; // gerakan "sedih" = gerakan bingung
    if (restart || this.el.dataset.state !== cssState) {
      if (restart) { this.el.removeAttribute('data-state'); void this.el.offsetWidth; }
      this.el.dataset.state = cssState;
    }

    const pose = this.#poseFor(state);
    for (const [name, img] of Object.entries(this.poses)) {
      const on = name === pose || (pose === 'duduk' && name === 'duduk_kedip');
      img.classList.toggle('on', on && name !== 'duduk_kedip');
      img.classList.toggle('blink', on && name === 'duduk_kedip'); // malam: sesekali berkedip
    }

    const text = (this.reaction && this.bubbleText) || '';
    this.bubble.textContent = text;
    this.bubble.classList.toggle('show', !!text);
  }
}
