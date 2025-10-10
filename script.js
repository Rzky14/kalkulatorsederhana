// Kalkulator sederhana
const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');
const buttons = document.querySelectorAll('.buttons button');

let expression = '';

function updateDisplay(){
  expressionEl.value = expression || '0';
}

function sanitizeExpression(expr){
  // ganti simbol × ÷ − dengan operator JS
  return expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/%/g, '%');
}

function safeEval(expr){
  // Very small safe evaluator: only allow digits, parentheses, operators and dot and percent
  if(!/^[0-9()+\-*/.%\s]*$/.test(expr)) return 'Error';
  try{
    // Handle percent: convert a%b style to (a/100)*b? Simpler: treat trailing % as divide by 100
    // We'll replace occurrences like number% with (number/100)
    const withPercent = expr.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
    // eslint-disable-next-line no-eval
    const val = eval(withPercent);
    if(!isFinite(val)) return 'Error';
    return +val.toFixed(10); // trim floating noise
  }catch(e){
    return 'Error';
  }
}

buttons.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const v = btn.getAttribute('data-value');
    const action = btn.getAttribute('data-action');
    if(action==='clear'){
      expression='';
      resultEl.textContent='0';
      updateDisplay();
      return;
    }
    if(action==='back'){
      expression = expression.slice(0,-1);
      updateDisplay();
      return;
    }
    if(action==='calculate'){
      const res = safeEval(sanitizeExpression(expression));
      resultEl.textContent = res;
      expression = String(res==='Error' ? '' : res);
      updateDisplay();
      return;
    }
    // append value
    expression += v;
    updateDisplay();
  })
});

// keyboard support
window.addEventListener('keydown', (e)=>{
  const allowed = '0123456789+-*/().%';
  if(allowed.includes(e.key)){
    expression += e.key;
    updateDisplay();
    return;
  }
  if(e.key==='Enter'){
    const res = safeEval(sanitizeExpression(expression));
    resultEl.textContent = res;
    expression = String(res==='Error' ? '' : res);
    updateDisplay();
  }
  if(e.key==='Backspace'){
    expression = expression.slice(0,-1);
    updateDisplay();
  }
  if(e.key.toLowerCase()==='c'){
    expression=''; resultEl.textContent='0'; updateDisplay();
  }
});

updateDisplay();
