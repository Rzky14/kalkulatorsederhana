/**
 * InputController — menghubungkan tombol di layar dan keyboard ke Calculator.
 * Juga membuat efek "riak" & tombol tertekan.
 */
class InputController {
  static KEYS = '0123456789+-*/().%';

  /**
   * @param {Calculator} calc
   * @param {SoundControls} soundControls
   * @param {NodeListOf<HTMLButtonElement>} buttons
   */
  constructor(calc, soundControls, buttons) {
    this.calc = calc;
    this.soundControls = soundControls;
    buttons.forEach((btn) => this.#bindButton(btn));
    window.addEventListener('keydown', (e) => this.#onKey(e));
  }

  #bindButton(btn) {
    btn.addEventListener('pointerdown', (e) => InputController.ripple(btn, e.clientX, e.clientY));
    btn.addEventListener('click', () => {
      const value = btn.getAttribute('data-value');
      const action = btn.getAttribute('data-action');
      if (action === 'clear') this.calc.clear();
      else if (action === 'back') this.calc.backspace();
      else if (action === 'calculate') this.calc.calculate();
      else if (value !== null) this.calc.append(value);
      btn.blur(); // agar tombol Enter tidak "mengklik" ulang tombol terakhir
    });
  }

  #onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return; // biarkan Ctrl+C dll.
    const key = e.key;
    if (InputController.KEYS.includes(key)) {
      e.preventDefault();
      this.calc.append(key);
      InputController.flash(`.buttons button[data-value="${CSS.escape(key)}"]`);
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      if (e.repeat) return;
      this.calc.calculate();
      InputController.flash('.buttons button[data-action="calculate"]');
    } else if (key === 'Backspace') {
      e.preventDefault();
      this.calc.backspace();
      InputController.flash('.buttons button[data-action="back"]');
    } else if (key === 'Escape' || key.toLowerCase() === 'c') {
      e.preventDefault();
      this.calc.clear();
      InputController.flash('.buttons button[data-action="clear"]');
    } else if (key.toLowerCase() === 'm' && !e.repeat) {
      e.preventDefault();
      this.soundControls.toggle();
    }
  }

  /** Efek riak di posisi sentuhan/klik. */
  static ripple(btn, x, y) {
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const r = document.createElement('span');
    r.className = 'ripple';
    r.style.width = r.style.height = size + 'px';
    r.style.left = (x - rect.left - size / 2) + 'px';
    r.style.top = (y - rect.top - size / 2) + 'px';
    btn.appendChild(r);
    r.addEventListener('animationend', () => r.remove(), { once: true });
  }

  /** Animasikan tombol di layar saat keyboard fisik dipakai. */
  static flash(selector) {
    const btn = document.querySelector(selector);
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    InputController.ripple(btn, rect.left + rect.width / 2, rect.top + rect.height / 2);
    btn.classList.add('pressed');
    setTimeout(() => btn.classList.remove('pressed'), 120);
  }
}
