/**
 * Effects — efek gambar sekali-jalan (bintang, silang, kembang api, konfeti).
 * Setiap elemen dihapus sendiri setelah animasinya selesai, jadi tidak menumpuk.
 */
class Effects {
  static CONFETTI = ['item/bintang', 'item/kilau', 'item/hati', 'item/daun_hijau', 'item/daun_gugur', 'item/bintang_biru'];

  /**
   * @param {HTMLElement} layer  lapisan .fx
   * @param {{display:HTMLElement, badge:HTMLElement, mascot:HTMLElement}} anchors  posisi acuan efek
   */
  constructor(layer, anchors) {
    this.layer = layer;
    this.anchors = anchors;
  }

  /** Jawaban berhasil: bintang di sudut layar LCD. */
  success() { this.#imageAt(this.anchors.display, .86, .3, 'efek/jawaban_bintang.png', 63, 'fx-pop'); }

  /** Error: silang di tengah layar LCD. */
  error() { this.#imageAt(this.anchors.display, .5, .45, 'efek/error_silang.png', 68, 'fx-pop'); }

  /** Layar dihapus: sapuan. */
  clear() { this.#imageAt(this.anchors.display, .5, .5, 'efek/transisi_sapuan.png', 140, 'fx-burst'); }

  /** Suasana berganti: kilau di lencana waktu. */
  periodChange() { this.#imageAt(this.anchors.badge, .2, .5, 'efek/transisi_kilau.png', 52, 'fx-spin'); }

  /** Perayaan: kembang api + konfeti dari maskot. */
  celebrate() {
    if (Util.reduceMotion) return;
    const [cx, cy] = Effects.#point(this.anchors.mascot, .5, .45);
    this.#image('efek/jawaban_kembang_api.png', cx, cy, 145, 'fx-burst');
    const { rand } = Util;
    for (let i = 0; i < 24; i++) {
      const p = this.#spawn('confetti-piece', Effects.CONFETTI[i % Effects.CONFETTI.length] + '.png');
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.setProperty('--s', (i % 2 ? 18 : 27) + 'px');
      p.style.setProperty('--tx', rand(-170, 170) + 'px');
      p.style.setProperty('--ty', rand(-190, -50) + 'px');
      p.style.setProperty('--r', rand(-540, 540) + 'deg');
      p.style.animationDelay = rand(0, .12) + 's';
    }
  }

  /* ---------- internal ---------- */

  static #point(el, fx, fy) {
    const r = el.getBoundingClientRect();
    return [r.left + r.width * fx, r.top + r.height * fy];
  }

  #imageAt(anchor, fx, fy, src, size, anim) {
    const [x, y] = Effects.#point(anchor, fx, fy);
    this.#image(src, x, y, size, anim);
  }

  #image(src, x, y, size, anim) {
    if (Util.reduceMotion) return;
    const im = this.#spawn('fx-img ' + anim, src);
    im.style.left = x + 'px';
    im.style.top = y + 'px';
    im.style.width = size + 'px';
  }

  #spawn(className, src) {
    const im = document.createElement('img');
    im.className = className;
    im.src = Util.ASSET + src;
    im.alt = '';
    im.addEventListener('animationend', () => im.remove(), { once: true });
    this.layer.appendChild(im);
    return im;
  }
}
