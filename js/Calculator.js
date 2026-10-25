/**
 * Calculator — mengatur alur kalkulator: input, tampilan LCD, hasil, streak,
 * serta memicu suara, reaksi maskot, dan efek gambar.
 * Perhitungan sendiri dikerjakan oleh CalculatorEngine.
 */
class Calculator {
  static OP_SOUND = { '+': 'add', '-': 'sub', '*': 'mul', '/': 'div', '%': 'percent', '.': 'dot', '(': 'dot', ')': 'dot' };
  static OP_SYMBOL = { '+': '+', '-': '−', '*': '×', '/': '÷', '%': '%' };
  static THINK_MS = 450;        // jeda "berpikir" sebelum hasil muncul
  static CELEBRATE_EVERY = 3;   // rayakan setiap 3 hitungan berhasil berturut-turut

  /**
   * @param {object} ui       elemen tampilan
   * @param {HTMLInputElement} ui.expressionEl
   * @param {HTMLElement} ui.resultEl
   * @param {HTMLElement} ui.displayEl
   * @param {HTMLElement} ui.streakEl
   * @param {NodeListOf<HTMLButtonElement>} ui.buttons
   * @param {object} deps     layanan lain
   * @param {SoundManager} deps.sound
   * @param {Mascot} deps.mascot
   * @param {Effects} deps.fx
   */
  constructor(ui, { sound, mascot, fx }) {
    Object.assign(this, ui);
    this.sound = sound;
    this.mascot = mascot;
    this.fx = fx;

    this.expression = '';
    this.justCalculated = false;
    this.streak = 0;
    this.errorStreak = 0;
    this.pending = null; // hasil yang sedang "dipikirkan"
  }

  /* ---------- aksi dari pengguna ---------- */

  /**
   * Tambah angka/operator ke ekspresi.
   * @returns {boolean} false bila input ditolak (mis. operator dobel, titik dobel)
   */
  append(v) {
    this.#finalize();
    // setelah "=", angka baru memulai hitungan baru; operator melanjutkan hasil
    const start = this.justCalculated && /[0-9.(]/.test(v) ? '' : this.expression;
    const next = CalculatorEngine.applyInput(start, v);
    if (next === null) {
      Util.restartAnim(this.expressionEl, 'nope'); // tanda halus: input tidak sah
      return false;
    }
    this.justCalculated = false;
    this.expression = next;
    this.render();

    if (/[0-9]/.test(v)) {
      this.sound.play('digit', +v);
      this.mascot.react('watching', { duration: 1500 });
    } else {
      this.sound.play(Calculator.OP_SOUND[v]);
      const sym = Calculator.OP_SYMBOL[v];
      if (sym) this.mascot.react('curious', { duration: 1600, bubble: sym, restart: true });
    }
    return true;
  }

  /** Tombol "=": hitung, tampilkan "berpikir" sebentar, lalu hasil. */
  calculate() {
    if (this.pending) return;                  // cegah "=" ganda
    if (this.expression.trim() === '') return; // tidak ada yang dihitung
    const res = CalculatorEngine.evaluate(this.expression);
    this.sound.play('equals');
    this.mascot.react('thinking');
    this.#setComputing(true);
    this.pending = { res, timer: setTimeout(() => this.#finalize(), Calculator.THINK_MS) };
  }

  /** Tombol C: kosongkan semuanya. */
  clear() {
    const hadContent = this.expression !== '' || this.resultEl.textContent !== '0';
    this.#cancelPending();
    this.expression = '';
    this.justCalculated = false;
    this.resultEl.classList.remove('error', 'long');
    this.resultEl.textContent = '0';
    this.render();
    this.sound.play('clear');
    if (hadContent) this.fx.clear();
    this.mascot.reset();
  }

  /** Tombol DEL: hapus satu karakter. */
  backspace() {
    this.#finalize();
    this.expression = this.expression.slice(0, -1);
    this.justCalculated = false;
    this.render();
    this.sound.play('back');
    this.mascot.reset();
  }

  /** Perbarui baris ekspresi & sorotan operator. */
  render() {
    this.expressionEl.value = CalculatorEngine.pretty(this.expression) || '0';
    this.expressionEl.scrollLeft = this.expressionEl.scrollWidth;
    const last = this.expression.slice(-1);
    this.buttons.forEach((b) => b.classList.toggle('active',
      b.classList.contains('op') && b.getAttribute('data-value') === last));
  }

  /* ---------- internal ---------- */

  /** Tampilkan hasil yang sedang dipikirkan (oleh timer, atau segera jika ada input baru). */
  #finalize() {
    if (!this.pending) return;
    clearTimeout(this.pending.timer);
    const res = this.pending.res;
    this.pending = null;
    this.#setComputing(false);

    this.#showResult(res);
    this.expression = res === 'Error' ? '' : String(res);
    this.justCalculated = res !== 'Error';
    this.render();

    if (res === 'Error') this.#onError();
    else this.#onSuccess();
  }

  #onError() {
    this.#setStreak(0);
    this.errorStreak++;
    this.sound.play('error');
    this.fx.error();
    // error pertama: bingung; error berulang: sedih ringan (mengajak mencoba lagi)
    this.mascot.react(this.errorStreak >= 2 ? 'sad' : 'confused', { duration: 2200, restart: true });
  }

  #onSuccess() {
    this.errorStreak = 0;
    this.#setStreak(this.streak + 1);
    if (this.streak % Calculator.CELEBRATE_EVERY === 0) {
      this.sound.play('celebrate');
      this.mascot.react('celebrating', { duration: 2400, restart: true });
      this.fx.celebrate();
    } else {
      this.sound.play('success');
      this.mascot.react('happy', { duration: 1800, restart: true });
      this.fx.success();
    }
  }

  #cancelPending() {
    if (!this.pending) return;
    clearTimeout(this.pending.timer);
    this.pending = null;
    this.#setComputing(false);
  }

  #setComputing(on) {
    this.resultEl.classList.toggle('computing', on);
    this.displayEl.classList.toggle('computing', on);
  }

  #showResult(value) {
    this.resultEl.textContent = value;
    this.resultEl.classList.toggle('error', value === 'Error');
    this.resultEl.classList.toggle('long', String(value).length > 9);
    Util.restartAnim(this.resultEl, 'reveal');
    if (value === 'Error') {
      Util.restartAnim(this.displayEl, 'shake');
      if (navigator.vibrate) navigator.vibrate(60);
    }
  }

  #setStreak(n) {
    const changed = n !== this.streak;
    this.streak = n;
    this.streakEl.querySelector('b').textContent = n;
    if (changed && n > 0) Util.restartAnim(this.streakEl, 'bump');
  }
}
