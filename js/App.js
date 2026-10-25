/**
 * App — titik masuk aplikasi. Membuat semua class dan menghubungkannya.
 *
 *   SoundManager ─┐
 *   Mascot ───────┼─> Calculator <── InputController (tombol & keyboard)
 *   Effects ──────┘        ▲
 *   SoundControls ─────────┘ (mute/volume)
 *   TimeOfDay ──> Mascot.setBase() + Effects.periodChange()
 *   Scene  (kunang-kunang, bintang, daun)
 *
 * Objek aplikasi tersedia di window.app (berguna untuk debug di console).
 */
class App {
  constructor() {
    const $ = Util.$;

    this.sound = new SoundManager();
    this.mascot = new Mascot($('#mascot'), $('#bubble'));
    this.fx = new Effects($('.fx'), {
      display: $('.display'),
      badge: $('.period-badge'),
      mascot: $('#mascot'),
    });
    this.scene = new Scene($('.forest'));

    const buttons = document.querySelectorAll('.buttons button');
    this.calculator = new Calculator({
      expressionEl: $('#expression'),
      resultEl: $('#result'),
      displayEl: $('.display'),
      streakEl: $('#streak'),
      buttons,
    }, { sound: this.sound, mascot: this.mascot, fx: this.fx });

    this.soundControls = new SoundControls(this.sound, $('#muteBtn'), $('#volume'));
    this.input = new InputController(this.calculator, this.soundControls, buttons);

    this.time = new TimeOfDay({
      clockEl: $('#clock'),
      labelEl: $('#periodLabel'),
      iconEl: $('#periodIcon'),
      onChange: (period, first) => {
        this.mascot.setBase(period === 'larut' ? 'sleepy' : 'idle', period);
        if (!first) this.fx.periodChange();
      },
    });
  }

  start() {
    // buka kunci audio pada interaksi pertama (kebijakan autoplay browser)
    ['pointerdown', 'keydown', 'touchstart'].forEach((ev) =>
      window.addEventListener(ev, () => this.sound.unlock(), { once: true, capture: true, passive: true }));

    this.scene.build();
    this.time.start();
    this.calculator.render();
    // aktifkan transisi suasana setelah tampilan pertama tergambar
    requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('no-transition')));
  }
}

window.app = new App();
window.app.start();
