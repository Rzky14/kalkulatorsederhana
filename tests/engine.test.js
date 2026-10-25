// Tes logika kalkulator. Jalankan: node tests/engine.test.js
const fs=require('fs'),vm=require('vm');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'..','js','CalculatorEngine.js'),'utf8')+';this.E=CalculatorEngine;',ctx);
const E=ctx.E;let fail=0;const ok=(c,m)=>{console.log((c?'✅ ':'❌ ')+m);if(!c)fail++;};
const type=s=>{let e='';for(const ch of s){const n=E.applyInput(e,ch);if(n!==null)e=n;}return e;};
// --- evaluasi ---
const EV=[['7+8',15],['0.1+0.2',0.3],['1/3',0.333333333333],['200+10%',220],['200-10%',180],['50*10%',5],['10%',0.1],
 ['(5+5)%',0.1],['1e-11*1',1e-11],['9.9999999998e+21*10',9.9999999998e+22],['0/0','Error'],['7/0','Error'],['-5+2',-3],
 ['5*-3',-15],['08+2',10],['.5+1',1.5],['5+',5],['5*',5],['(2+3)*4',20],['(2+3',5],['2*(3+4',14],['abc','Error'],['',' Error'.trim()],['-0*5',0]];
for(const [x,want] of EV){const got=E.evaluate(x);ok(got===want||(typeof want==='number'&&Math.abs(got-want)<1e-12*Math.max(1,Math.abs(want))),`evaluate(${JSON.stringify(x)}) = ${got}`);}
// --- input ---
const IN=[['5++3','5+3'],['5+*3','5*3'],['5*-3','5*-3'],['1.2.3','1.23'],['.5','0.5'],['*5','5'],['-5','-5'],['007','7'],
 ['5%%','5%'],['%5','5'],['50%2','50%*2'],['2(3)','2*(3)'],[')5','5'],['(((','((('],['5+-','5-'],['5--3','5-3']];
for(const [keys,want] of IN){const got=type(keys);ok(got===want,`ketik ${keys.padEnd(6)} -> ${got}`);}
ok(E.pretty('5*-3/2')==='5×−3÷2','tampilan memakai simbol: '+E.pretty('5*-3/2'));
ok(E.pretty('1e-11')==='1e-11','notasi ilmiah tetap utuh di tampilan');
ok(type('9'.repeat(60)).length===40,'panjang ekspresi dibatasi 40 karakter');
console.log(fail?fail+' GAGAL':'SEMUA LULUS');
process.exitCode = fail ? 1 : 0;
