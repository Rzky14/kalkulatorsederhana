// =========================================================
// Kalkulator Sederhana — tema hutan
// Bagian:
//   1. Pengaturan (disimpan di browser)
//   2. Suara      (Web Audio API, tanpa file audio)
//   3. Maskot     (state reaksi + state dasar sesuai waktu)
//   4. Waktu      (suasana otomatis dari jam perangkat)
//   5. Pemandangan (kunang-kunang, bintang, daun, konfeti)
//   6. Kalkulator (logika hitung)
//   7. Input      (tombol layar, keyboard, pengaturan suara)
// =========================================================

const $ = (s) => document.querySelector(s);
const rand = (a, b) => a + Math.random() * (b - a);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------
   1. PENGATURAN
--------------------------------------------------------- */
const Settings = {
  KEY: 'kalkulator-hutan',
  load(){
    try{ return JSON.parse(localStorage.getItem(this.KEY)) || {}; }
    catch(e){ return {}; }
  },
  save(data){
    try{ localStorage.setItem(this.KEY, JSON.stringify(data)); }catch(e){ /* mode privat: abaikan */ }
  }
};

/* ---------------------------------------------------------
   2. SUARA — semua bunyi dibuat langsung dengan Web Audio API
--------------------------------------------------------- */
const Sound = (() => {
  const saved = Settings.load();
  let enabled = saved.sound !== false;
  let volume = typeof saved.volume === 'number' ? saved.volume : 0.6;
  let ctx = null, master = null, longBus = null;
  const lastPlayed = {};

  // AudioContext hanya boleh dibuat/dilanjutkan setelah interaksi pengguna
  function ensure(){
    if(!ctx){
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return null;
      ctx = new AC({ latencyHint: 'interactive' });
      master = ctx.createGain();
      master.connect(ctx.destination);
      applyVolume(true);
    }
    if(ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function applyVolume(instant){
    if(!master) return;
    const target = enabled ? volume * volume * 0.7 : 0; // kurva lebih alami
    if(instant) master.gain.value = target;
    else master.gain.setTargetAtTime(target, ctx.currentTime, 0.02);
  }

  // satu nada pendek dengan selubung halus (tanpa bunyi "klik")
  function tone(out, { freq, type = 'sine', start = 0, dur = 0.12, gain = 0.25, slideTo = null, attack = 0.006 }){
    const t = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if(slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(out);
    osc.start(t); osc.stop(t + dur + 0.03);
    osc.onended = () => { osc.disconnect(); g.disconnect(); };
  }

  // bunyi panjang (hasil, error, perayaan) diputar di "bus" sendiri;
  // bunyi panjang baru memudarkan yang lama agar tidak bertumpuk
  function newLongBus(){
    if(longBus){
      const old = longBus;
      old.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03);
      setTimeout(() => old.disconnect(), 300);
    }
    longBus = ctx.createGain();
    longBus.connect(master);
    return longBus;
  }

  const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];

  const presets = {
    digit(d){ const f = PENTA[d] || 660; tone(master, { freq: f, dur: .09, gain: .2 }); tone(master, { freq: f * 2, dur: .05, gain: .04 }); },
    add(){ tone(master, { freq: 587, type: 'triangle', dur: .08, gain: .18 }); tone(master, { freq: 880, type: 'triangle', start: .06, dur: .11, gain: .18 }); },
    sub(){ tone(master, { freq: 880, type: 'triangle', dur: .08, gain: .18 }); tone(master, { freq: 587, type: 'triangle', start: .06, dur: .11, gain: .18 }); },
    mul(){ [1175, 1480, 1760].forEach((f, i) => tone(master, { freq: f, type: 'triangle', start: i * .04, dur: .07, gain: .12 })); },
    div(){ tone(master, { freq: 440, type: 'triangle', dur: .07, gain: .2 }); tone(master, { freq: 440, type: 'triangle', start: .1, dur: .07, gain: .16 }); },
    percent(){ tone(master, { freq: 700, slideTo: 1150, dur: .13, gain: .14 }); },
    dot(){ tone(master, { freq: 1400, dur: .04, gain: .09 }); },
    back(){ tone(master, { freq: 520, slideTo: 360, type: 'triangle', dur: .08, gain: .14 }); },
    clear(){ tone(master, { freq: 820, slideTo: 220, dur: .24, gain: .14 }); },
    toggle(){ tone(master, { freq: 990, dur: .06, gain: .12 }); tone(master, { freq: 1320, start: .05, dur: .07, gain: .1 }); },
    equals(){ const bus = newLongBus(); [740, 880, 1047].forEach((f, i) => tone(bus, { freq: f, start: i * .07, dur: .07, gain: .1 })); },
    success(){
      const bus = newLongBus();
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(bus, { freq: f, type: 'triangle', start: i * .075, dur: .28, gain: .16 }));
    },
    error(){
      const bus = newLongBus();
      tone(bus, { freq: 330, slideTo: 300, type: 'triangle', dur: .18, gain: .2 });
      tone(bus, { freq: 247, slideTo: 208, type: 'triangle', start: .17, dur: .32, gain: .2 });
    },
    celebrate(){
      const bus = newLongBus();
      [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98].forEach((f, i) => tone(bus, { freq: f, type: 'triangle', start: i * .07, dur: .3, gain: .14 }));
      for(let i = 0; i < 6; i++) tone(bus, { freq: rand(1800, 3200), start: .45 + i * .06, dur: .08, gain: .05 });
    }
  };

  function play(name, arg){
    if(!enabled || volume <= 0 || !presets[name]) return;
    if(!ensure()) return;
    const now = performance.now();
    if(lastPlayed[name] && now - lastPlayed[name] < 40) return; // cegah bunyi dobel tak sengaja
    lastPlayed[name] = now;
    presets[name](arg);
  }

  function persist(){ Settings.save({ sound: enabled, volume }); }

  return {
    play,
    unlock: () => ensure(),
    get enabled(){ return enabled; },
    get volume(){ return volume; },
    setEnabled(v){ enabled = v; if(ctx) applyVolume(); persist(); },
    setVolume(v){ volume = v; if(ctx) applyVolume(); persist(); }
  };
})();

/* ---------------------------------------------------------
   3. MASKOT
   - base     : state dasar dari waktu (idle / sleepy)
   - reaction : state sementara dari interaksi
   Yang tampil = reaction || base. Hanya ada SATU timer reaksi,
   jadi reaksi tidak pernah bertabrakan.
--------------------------------------------------------- */
const Mascot = (() => {
  const el = $('#mascot');
  const bubble = $('#bubble');
  let base = 'idle';
  let reaction = null;
  let bubbleText = null;
  let timer = null;

  const BUBBLES = {
    thinking: '<span class="dots"><i></i><i></i><i></i></span>',
    happy: '👍',
    confused: '?',
    celebrating: '🎉',
    sleepy: 'Zz'
  };

  function render(restart){
    const state = reaction || base;
    if(restart || el.dataset.state !== state){
      if(restart){ el.removeAttribute('data-state'); void el.offsetWidth; } // ulang animasi
      el.dataset.state = state;
    }
    const content = (reaction && bubbleText) || BUBBLES[state] || '';
    bubble.innerHTML = content;
    bubble.classList.toggle('show', !!content);
    bubble.classList.toggle('zz', state === 'sleepy');
  }

  return {
    react(state, { duration = 0, bubble: text = null, restart = false } = {}){
      clearTimeout(timer);
      reaction = state;
      bubbleText = text;
      render(restart);
      if(duration){
        timer = setTimeout(() => { reaction = null; bubbleText = null; render(); }, duration);
      }
    },
    reset(){
      clearTimeout(timer);
      reaction = null; bubbleText = null;
      render();
    },
    setBase(state){
      base = state;
      render(); // jika sedang bereaksi, reaksi tetap jalan; base dipakai setelahnya
    },
    get state(){ return el.dataset.state; }
  };
})();

/* ---------------------------------------------------------
   4. WAKTU — suasana mengikuti jam lokal perangkat
   Uji coba: tambahkan ?jam=16:30 di alamat untuk mensimulasikan
   jam tertentu (jam tetap berjalan maju dari titik itu).
--------------------------------------------------------- */
const TimeOfDay = (() => {
  const INFO = {
    pagi:  { label: 'Pagi',        icon: '🌅', theme: '#7cc4e8' },
    siang: { label: 'Siang',       icon: '☀️', theme: '#3aa4e4' },
    sore:  { label: 'Sore',        icon: '🌇', theme: '#d9745a' },
    malam: { label: 'Malam',       icon: '🌙', theme: '#0a1f38' },
    larut: { label: 'Larut',       icon: '🌌', theme: '#020617' }
  };

  let offset = 0;
  const q = new URLSearchParams(location.search).get('jam');
  if(q && /^\d{1,2}[:.]\d{2}$/.test(q)){
    const [h, m] = q.split(/[:.]/).map(Number);
    const n = new Date(), t = new Date(n);
    t.setHours(h, m, 0, 0);
    offset = t - n;
  }
  const now = () => new Date(Date.now() + offset);

  function periodOf(d){
    const h = d.getHours();
    if(h >= 5  && h < 11) return 'pagi';
    if(h >= 11 && h < 15) return 'siang';
    if(h >= 15 && h < 18) return 'sore';
    if(h >= 18 && h < 22) return 'malam';
    return 'larut';
  }

  const pad = (n) => String(n).padStart(2, '0');
  const clockEl = $('#clock'), labelEl = $('#periodLabel'), iconEl = $('#periodIcon');
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  let current = null, lastClock = '', timer = null;

  function check(){
    const d = now();
    const clock = pad(d.getHours()) + '.' + pad(d.getMinutes());
    if(clock !== lastClock){ clockEl.textContent = clock; lastClock = clock; }
    const p = periodOf(d);
    if(p === current) return; // tidak ada perubahan → tidak ada render ulang
    current = p;
    document.body.dataset.period = p;
    labelEl.textContent = INFO[p].label;
    labelEl.parentElement.title = (p === 'larut' ? 'Larut malam' : INFO[p].label) + ' — suasana mengikuti jam perangkat';
    iconEl.textContent = INFO[p].icon;
    if(metaTheme) metaTheme.setAttribute('content', INFO[p].theme);
    Mascot.setBase(p === 'larut' ? 'sleepy' : 'idle');
  }

  // satu timer saja, disetel tepat ke pergantian menit berikutnya
  function schedule(){
    clearTimeout(timer);
    const d = now();
    const ms = (60 - d.getSeconds()) * 1000 - d.getMilliseconds() + 50;
    timer = setTimeout(() => { check(); schedule(); }, ms);
  }

  function refresh(){ check(); schedule(); }

  return {
    start(){
      refresh();
      document.addEventListener('visibilitychange', () => {
        if(document.visibilityState === 'visible') refresh();
        else clearTimeout(timer); // hemat baterai saat tab tidak terlihat
      });
      window.addEventListener('focus', refresh);
      window.addEventListener('pageshow', refresh);
    },
    get period(){ return current; }
  };
})();

/* ---------------------------------------------------------
   5. PEMANDANGAN
--------------------------------------------------------- */
const Scene = {
  build(){
    if(reduceMotion) return;
    const small = window.innerWidth < 600;

    const ff = $('.fireflies');
    for(let i = 0; i < (small ? 14 : 26); i++){
      const f = document.createElement('span');
      f.className = 'firefly';
      f.style.left = rand(0, 100) + 'vw';
      f.style.top = rand(35, 92) + 'vh';
      f.style.setProperty('--dx', rand(-60, 60) + 'px');
      f.style.setProperty('--dy', rand(-50, 30) + 'px');
      f.style.setProperty('--dur', rand(4, 9) + 's');
      f.style.setProperty('--blink', rand(1.5, 3.5) + 's');
      f.style.setProperty('--delay', -rand(0, 9) + 's');
      ff.appendChild(f);
    }

    const st = $('.stars');
    for(let i = 0; i < (small ? 28 : 55); i++){
      const s = document.createElement('span');
      s.className = 'star';
      s.style.left = rand(0, 100) + '%';
      s.style.top = rand(0, 100) + '%';
      if(Math.random() < .2){ s.style.width = s.style.height = '3px'; }
      s.style.setProperty('--tw', rand(2, 5) + 's');
      s.style.setProperty('--delay', -rand(0, 5) + 's');
      st.appendChild(s);
    }

    const lv = $('.leaves');
    const colors = ['#4ade80', '#a3e635', '#facc15', '#65a30d', '#f59e0b'];
    for(let i = 0; i < (small ? 8 : 14); i++){
      const l = document.createElement('span');
      l.className = 'leaf-fall';
      l.style.left = rand(0, 100) + 'vw';
      l.style.setProperty('--size', rand(10, 18) + 'px');
      l.style.setProperty('--color', colors[i % colors.length]);
      l.style.setProperty('--dur', rand(10, 18) + 's');
      l.style.setProperty('--delay', -rand(0, 18) + 's');
      lv.appendChild(l);
    }
  },

  // konfeti daun & bintang keluar dari maskot; setiap kepingan dihapus setelah selesai
  confetti(){
    if(reduceMotion) return;
    const layer = $('.confetti');
    const r = $('#mascot').getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const colors = ['#4ade80', '#a3e635', '#facc15', '#f472b6', '#38bdf8', '#fb923c'];
    for(let i = 0; i < 30; i++){
      const p = document.createElement('span');
      p.className = 'confetti-piece' + (i % 3 === 0 ? ' star-piece' : '');
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.setProperty('--s', rand(8, 15) + 'px');
      p.style.setProperty('--c', colors[i % colors.length]);
      p.style.setProperty('--tx', rand(-170, 170) + 'px');
      p.style.setProperty('--ty', rand(-190, -50) + 'px');
      p.style.setProperty('--r', rand(-540, 540) + 'deg');
      p.style.animationDelay = rand(0, .12) + 's';
      p.addEventListener('animationend', () => p.remove(), { once: true });
      layer.appendChild(p);
    }
  }
};

/* ---------------------------------------------------------
   6. KALKULATOR
--------------------------------------------------------- */
const expressionEl = $('#expression');
const resultEl = $('#result');
const displayEl = $('.display');
const streakEl = $('#streak');
const buttons = document.querySelectorAll('.buttons button');

const OP_SOUND = { '+': 'add', '-': 'sub', '*': 'mul', '/': 'div', '%': 'percent', '.': 'dot', '(': 'dot', ')': 'dot' };
const OP_SYMBOL = { '+': '+', '-': '−', '*': '×', '/': '÷', '%': '%' };
const THINK_MS = 450;          // jeda "berpikir" sebelum hasil muncul
const CELEBRATE_EVERY = 3;     // rayakan setiap 3 hitungan berhasil berturut-turut

let expression = '';
let justCalculated = false;
let streak = 0;
let pending = null;            // hasil yang sedang "dipikirkan"

function updateDisplay(){
  expressionEl.value = expression || '0';
  expressionEl.scrollLeft = expressionEl.scrollWidth;
  highlightOperator();
}

function sanitizeExpression(expr){
  return expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
}

function safeEval(expr){
  if(!/^[0-9()+\-*/.%\s]*$/.test(expr)) return 'Error';
  try{
    // hapus nol di depan angka (mis. "010" -> "10") agar tidak dibaca sebagai oktal
    let cleaned = expr.replace(/(?<![\d.])0+(?=\d)/g, '');
    // angka diikuti % -> dibagi 100 (mis. 50% -> 0.5)
    cleaned = cleaned.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
    // eslint-disable-next-line no-new-func
    const val = Function('"use strict"; return (' + cleaned + ')')();
    if(typeof val !== 'number' || !isFinite(val)) return 'Error';
    return +val.toFixed(10);
  }catch(e){
    return 'Error';
  }
}

function restartAnim(el, cls){
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

function setStreak(n){
  const changed = n !== streak;
  streak = n;
  streakEl.querySelector('b').textContent = n;
  if(changed && n > 0) restartAnim(streakEl, 'bump');
}

function showResult(value){
  resultEl.textContent = value;
  resultEl.classList.toggle('error', value === 'Error');
  resultEl.classList.toggle('long', String(value).length > 9);
  restartAnim(resultEl, 'reveal');
  if(value === 'Error'){
    restartAnim(displayEl, 'shake');
    if(navigator.vibrate) navigator.vibrate(60);
  }
}

function highlightOperator(){
  const last = expression.slice(-1);
  buttons.forEach(b => b.classList.toggle('active',
    b.classList.contains('op') && b.getAttribute('data-value') === last));
}

// tampilkan hasil yang sedang dipikirkan (dipanggil oleh timer, atau
// langsung jika pengguna menekan tombol lain sebelum timer selesai)
function finalize(){
  if(!pending) return;
  clearTimeout(pending.timer);
  const res = pending.res;
  pending = null;
  resultEl.classList.remove('computing');
  displayEl.classList.remove('computing');

  showResult(res);
  expression = res === 'Error' ? '' : String(res);
  justCalculated = res !== 'Error';
  updateDisplay();

  if(res === 'Error'){
    setStreak(0);
    Sound.play('error');
    Mascot.react('confused', { duration: 2200, restart: true });
  } else {
    setStreak(streak + 1);
    if(streak % CELEBRATE_EVERY === 0){
      Sound.play('celebrate');
      Mascot.react('celebrating', { duration: 2400, restart: true });
      Scene.confetti();
    } else {
      Sound.play('success');
      Mascot.react('happy', { duration: 1800, restart: true });
    }
  }
}

function cancelPending(){
  if(!pending) return;
  clearTimeout(pending.timer);
  pending = null;
  resultEl.classList.remove('computing');
  displayEl.classList.remove('computing');
}

function calculate(){
  if(pending) return;                     // cegah "=" ganda
  if(expression.trim() === '') return;    // tidak ada yang dihitung
  const res = safeEval(sanitizeExpression(expression));
  Sound.play('equals');
  Mascot.react('thinking');
  resultEl.classList.add('computing');
  displayEl.classList.add('computing');
  pending = { res, timer: setTimeout(finalize, THINK_MS) };
}

function append(v){
  finalize();
  if(justCalculated && /[0-9.(]/.test(v)) expression = '';
  justCalculated = false;
  expression += v;
  updateDisplay();

  if(/[0-9]/.test(v)){
    Sound.play('digit', +v);
    Mascot.react('watching', { duration: 1500 });
  } else {
    Sound.play(OP_SOUND[v]);
    if(OP_SYMBOL[v]) Mascot.react('curious', { duration: 1600, bubble: OP_SYMBOL[v], restart: true });
  }
}

function clearAll(){
  cancelPending();
  expression = '';
  justCalculated = false;
  resultEl.classList.remove('error', 'long');
  resultEl.textContent = '0';
  updateDisplay();
  Sound.play('clear');
  Mascot.reset();
}

function backspace(){
  finalize();
  expression = expression.slice(0, -1);
  justCalculated = false;
  updateDisplay();
  Sound.play('back');
  Mascot.reset();
}

/* ---------------------------------------------------------
   7. INPUT
--------------------------------------------------------- */
function addRipple(btn, x, y){
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

function flashButton(selector){
  const btn = document.querySelector(selector);
  if(!btn) return;
  const rect = btn.getBoundingClientRect();
  addRipple(btn, rect.left + rect.width / 2, rect.top + rect.height / 2);
  btn.classList.add('pressed');
  setTimeout(() => btn.classList.remove('pressed'), 120);
}

buttons.forEach(btn => {
  btn.addEventListener('pointerdown', e => addRipple(btn, e.clientX, e.clientY));
  btn.addEventListener('click', () => {
    const v = btn.getAttribute('data-value');
    const action = btn.getAttribute('data-action');
    if(action === 'clear') clearAll();
    else if(action === 'back') backspace();
    else if(action === 'calculate') calculate();
    else if(v !== null) append(v);
    btn.blur();
  });
});

// --- pengaturan suara ---
const muteBtn = $('#muteBtn');
const volumeEl = $('#volume');

function syncSoundUI(){
  const muted = !Sound.enabled || Sound.volume === 0;
  muteBtn.setAttribute('aria-pressed', String(muted));
  muteBtn.setAttribute('aria-label', muted ? 'Nyalakan suara' : 'Matikan suara');
  volumeEl.value = Math.round(Sound.volume * 100);
  volumeEl.disabled = !Sound.enabled;
}

function toggleSound(){
  if(Sound.enabled && Sound.volume === 0){ Sound.setVolume(0.6); }
  else Sound.setEnabled(!Sound.enabled);
  syncSoundUI();
  Sound.play('toggle');
}

muteBtn.addEventListener('click', () => { toggleSound(); muteBtn.blur(); });
volumeEl.addEventListener('input', () => { Sound.setVolume(volumeEl.value / 100); syncSoundUI(); });
volumeEl.addEventListener('change', () => { Sound.play('digit', 4); volumeEl.blur(); });

// buka kunci audio pada interaksi pertama (kebijakan autoplay browser)
['pointerdown', 'keydown', 'touchstart'].forEach(ev =>
  window.addEventListener(ev, Sound.unlock, { once: true, capture: true, passive: true }));

// --- keyboard ---
window.addEventListener('keydown', (e) => {
  if(e.ctrlKey || e.metaKey || e.altKey) return;
  const allowed = '0123456789+-*/().%';
  if(allowed.includes(e.key)){
    e.preventDefault();
    append(e.key);
    flashButton(`.buttons button[data-value="${CSS.escape(e.key)}"]`);
  } else if(e.key === 'Enter' || e.key === '='){
    e.preventDefault();
    if(e.repeat) return;
    calculate();
    flashButton('.buttons button[data-action="calculate"]');
  } else if(e.key === 'Backspace'){
    e.preventDefault();
    backspace();
    flashButton('.buttons button[data-action="back"]');
  } else if(e.key === 'Escape' || e.key.toLowerCase() === 'c'){
    e.preventDefault();
    clearAll();
    flashButton('.buttons button[data-action="clear"]');
  } else if(e.key.toLowerCase() === 'm' && !e.repeat){
    e.preventDefault();
    toggleSound();
  }
});

/* ---------- mulai ---------- */
Scene.build();
syncSoundUI();
TimeOfDay.start();
updateDisplay();
// aktifkan transisi suasana setelah tampilan pertama tergambar
requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('no-transition')));
