/**
 * TimeOfDay — menentukan suasana dari jam lokal perangkat dan
 * memberi tahu bagian lain saat waktu berganti.
 *
 *  pagi 05.00–10.59 · siang 11.00–14.59 · sore 15.00–17.59
 *  malam 18.00–21.59 · larut 22.00–04.59
 *
 * Hanya memakai SATU timer yang disetel tepat ke pergantian menit berikutnya.
 * Uji coba: tambahkan ?jam=16:30 di alamat (jam tetap berjalan dari titik itu).
 */
class TimeOfDay {
  static INFO = {
    pagi:  { label: 'Pagi',  title: 'Pagi',        theme: '#7cc4e8' },
    siang: { label: 'Siang', title: 'Siang',       theme: '#3aa4e4' },
    sore:  { label: 'Sore',  title: 'Sore',        theme: '#d9745a' },
    malam: { label: 'Malam', title: 'Malam',       theme: '#0a1f38' },
    larut: { label: 'Larut', title: 'Larut malam', theme: '#020617' },
  };

  /** @param {string} jam  waktu dari URL, mis. "16:30" (opsional) */
  static offsetFromQuery(jam) {
    if (!jam || !/^\d{1,2}[:.]\d{2}$/.test(jam)) return 0;
    const [h, m] = jam.split(/[:.]/).map(Number);
    const now = new Date();
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    return target - now;
  }

  /** @param {Date} d */
  static periodOf(d) {
    const h = d.getHours();
    if (h >= 5 && h < 11) return 'pagi';
    if (h >= 11 && h < 15) return 'siang';
    if (h >= 15 && h < 18) return 'sore';
    if (h >= 18 && h < 22) return 'malam';
    return 'larut';
  }

  /**
   * @param {object} opts
   * @param {HTMLElement} opts.clockEl  tempat jam (hh.mm)
   * @param {HTMLElement} opts.labelEl  nama waktu
   * @param {HTMLImageElement} opts.iconEl  ikon waktu
   * @param {(period:string, first:boolean) => void} opts.onChange  dipanggil saat waktu berganti
   */
  constructor({ clockEl, labelEl, iconEl, onChange }) {
    this.clockEl = clockEl;
    this.labelEl = labelEl;
    this.iconEl = iconEl;
    this.onChange = onChange;
    this.metaTheme = document.querySelector('meta[name="theme-color"]');
    this.offset = TimeOfDay.offsetFromQuery(new URLSearchParams(location.search).get('jam'));
    this.current = null;
    this.lastClock = '';
    this.timer = null;
  }

  get period() { return this.current; }

  now() { return new Date(Date.now() + this.offset); }

  start() {
    const refresh = () => this.refresh();
    this.refresh();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') refresh();
      else clearTimeout(this.timer); // hemat baterai saat tab tidak terlihat
    });
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
  }

  refresh() {
    this.#check();
    this.#schedule();
  }

  /* ---------- internal ---------- */

  #check() {
    const d = this.now();
    const clock = Util.pad2(d.getHours()) + '.' + Util.pad2(d.getMinutes());
    if (clock !== this.lastClock) {
      this.clockEl.textContent = clock;
      this.lastClock = clock;
    }

    const p = TimeOfDay.periodOf(d);
    if (p === this.current) return; // tidak berubah → tidak ada render ulang
    const first = this.current === null;
    this.current = p;

    const info = TimeOfDay.INFO[p];
    document.body.dataset.period = p;
    this.labelEl.textContent = info.label;
    this.labelEl.parentElement.title = info.title + ' — suasana mengikuti jam perangkat';
    this.iconEl.src = Util.ASSET + 'item/ikon_' + p + '.png';
    if (this.metaTheme) this.metaTheme.setAttribute('content', info.theme);

    this.onChange(p, first);
  }

  #schedule() {
    clearTimeout(this.timer);
    const d = this.now();
    const ms = (60 - d.getSeconds()) * 1000 - d.getMilliseconds() + 50;
    this.timer = setTimeout(() => this.refresh(), ms);
  }
}
