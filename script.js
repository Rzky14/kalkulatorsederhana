// Kalkulator sederhana
const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');
const displayEl = document.querySelector('.display');
const buttons = document.querySelectorAll('.buttons button');

let expression = '';
let justCalculated = false; // true setelah "=" ditekan

function updateDisplay(){
  expressionEl.value = expression || '0';
  expressionEl.scrollLeft = expressionEl.scrollWidth; // selalu tampilkan bagian akhir
  highlightOperator();
}

function sanitizeExpression(expr){
  // ganti simbol × ÷ − dengan operator JS
  return expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
}

function safeEval(expr){
  // Hanya izinkan angka, kurung, operator, titik, dan persen
  if(!/^[0-9()+\-*/.%\s]*$/.test(expr)) return 'Error';
  try{
    // Hapus nol di depan angka (mis. "010" -> "10") agar tidak dibaca sebagai oktal
    let cleaned = expr.replace(/(?<![\d.])0+(?=\d)/g, '');
    // Angka diikuti % -> dibagi 100 (mis. 50% -> 0.5)
    cleaned = cleaned.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
    // eslint-disable-next-line no-new-func
    const val = Function('"use strict"; return (' + cleaned + ')')();
    if(typeof val !== 'number' || !isFinite(val)) return 'Error';
    return +val.toFixed(10); // buang sisa pembulatan floating point
  }catch(e){
    return 'Error';
  }
}

/* ---------- animasi ---------- */
function restartAnim(el, cls){
  el.classList.remove(cls);
  void el.offsetWidth; // paksa reflow agar animasi bisa diulang
  el.classList.add(cls);
}

function showResult(value){
  resultEl.textContent = value;
  resultEl.classList.toggle('long', String(value).length > 9);
  resultEl.classList.toggle('error', value === 'Error');
  restartAnim(resultEl, 'pop');
  if(value === 'Error'){
    restartAnim(displayEl, 'shake');
    if(navigator.vibrate) navigator.vibrate(60);
  }
}

// sorot tombol operator terakhir yang dipilih
function highlightOperator(){
  const last = expression.slice(-1);
  buttons.forEach(b => b.classList.toggle('active',
    b.classList.contains('op') && b.getAttribute('data-value') === last));
}

function addRipple(btn, x, y){
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const r = document.createElement('span');
  r.className = 'ripple';
  r.style.width = r.style.height = size + 'px';
  r.style.left = (x - rect.left - size / 2) + 'px';
  r.style.top = (y - rect.top - size / 2) + 'px';
  btn.appendChild(r);
  r.addEventListener('animationend', () => r.remove());
}

// animasikan tombol di layar saat keyboard fisik dipakai
function flashButton(selector){
  const btn = document.querySelector(selector);
  if(!btn) return;
  const rect = btn.getBoundingClientRect();
  addRipple(btn, rect.left + rect.width / 2, rect.top + rect.height / 2);
  btn.classList.add('pressed');
  setTimeout(() => btn.classList.remove('pressed'), 120);
}

/* ---------- logika ---------- */
function clearAll(){
  expression = '';
  justCalculated = false;
  resultEl.classList.remove('error', 'long');
  resultEl.textContent = '0';
  updateDisplay();
}

function backspace(){
  expression = expression.slice(0, -1);
  justCalculated = false;
  updateDisplay();
}

function calculate(){
  if(expression.trim() === '') return; // tidak ada yang dihitung
  const res = safeEval(sanitizeExpression(expression));
  showResult(res);
  expression = res === 'Error' ? '' : String(res);
  justCalculated = res !== 'Error';
  updateDisplay();
}

function append(v){
  // Setelah "=", mengetik angka memulai perhitungan baru;
  // mengetik operator melanjutkan dari hasil sebelumnya
  if(justCalculated && /[0-9.(]/.test(v)) expression = '';
  justCalculated = false;
  expression += v;
  updateDisplay();
}

buttons.forEach(btn=>{
  btn.addEventListener('pointerdown', e => addRipple(btn, e.clientX, e.clientY));
  btn.addEventListener('click', ()=>{
    const v = btn.getAttribute('data-value');
    const action = btn.getAttribute('data-action');
    if(action === 'clear') clearAll();
    else if(action === 'back') backspace();
    else if(action === 'calculate') calculate();
    else if(v !== null) append(v);
    btn.blur(); // agar tombol Enter tidak "mengklik" ulang tombol terakhir
  });
});

// dukungan keyboard
window.addEventListener('keydown', (e)=>{
  if(e.ctrlKey || e.metaKey || e.altKey) return; // biarkan Ctrl+C dll.
  const allowed = '0123456789+-*/().%';
  if(allowed.includes(e.key)){
    e.preventDefault();
    append(e.key);
    flashButton(`button[data-value="${CSS.escape(e.key)}"]`);
  } else if(e.key === 'Enter' || e.key === '='){
    e.preventDefault();
    calculate();
    flashButton('button[data-action="calculate"]');
  } else if(e.key === 'Backspace'){
    e.preventDefault();
    backspace();
    flashButton('button[data-action="back"]');
  } else if(e.key === 'Escape' || e.key.toLowerCase() === 'c'){
    e.preventDefault();
    clearAll();
    flashButton('button[data-action="clear"]');
  }
});

/* ---------- hutan: kunang-kunang & daun berguguran ---------- */
function buildForest(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce) return;
  const rand = (a, b) => a + Math.random() * (b - a);
  const small = window.innerWidth < 600;

  const ff = document.querySelector('.fireflies');
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

  const lv = document.querySelector('.leaves');
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
}

buildForest();
updateDisplay();
