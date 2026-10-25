/**
 * CalculatorEngine — logika hitung murni (tanpa tampilan).
 * Mudah diuji terpisah, mis. CalculatorEngine.evaluate('200+10%') === 220
 *
 * Dua tugas:
 *  1. applyInput(): menjaga ekspresi selalu sah saat diketik
 *     (tidak ada operator dobel, titik dobel, nol di depan, dll.)
 *  2. evaluate(): menghitung ekspresi dengan aman.
 */
class CalculatorEngine {
  static OPS = '+-*/';
  static MAX_LENGTH = 40;

  /** Ganti simbol tampilan (× ÷ −) menjadi operator JavaScript. */
  static sanitize(expr) {
    return expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  }

  /** Ubah operator JavaScript menjadi simbol yang enak dibaca di layar. */
  static pretty(expr) {
    return expr.replace(/\*/g, '×').replace(/\//g, '÷').replace(/(?<!e)-/g, '−');
  }

  /** Angka terakhir yang sedang diketik (setelah operator terakhir). */
  static currentNumber(expr) {
    const m = expr.match(/(\d*\.?\d*(?:e[+-]?\d+)?)$/);
    return m ? m[1] : '';
  }

  /**
   * Tambahkan satu input ke ekspresi, atau tolak bila hasilnya tidak sah.
   * @param {string} expr  ekspresi saat ini (memakai operator JS)
   * @param {string} v     satu karakter: 0-9 + - * / . % ( )
   * @returns {string|null}  ekspresi baru, atau null jika input ditolak
   */
  static applyInput(expr, v) {
    const { OPS } = CalculatorEngine;
    const last = expr.slice(-1);
    const num = CalculatorEngine.currentNumber(expr);

    if (expr.length >= CalculatorEngine.MAX_LENGTH && v !== ')') return null;

    // --- operator + - * / ---
    if (OPS.includes(v)) {
      if (expr === '' || last === '(') return v === '-' ? expr + '-' : null; // hanya minus di awal
      if (expr === '-' || expr.endsWith('(-')) return null;
      if (OPS.includes(last)) {
        // izinkan angka negatif setelah × atau ÷ (mis. 5×−3)
        if (v === '-' && (last === '*' || last === '/')) return expr + v;
        // selain itu: ganti operator terakhir (5+ lalu × -> 5×)
        const base = expr.replace(/[+\-*/]+$/, '');
        return base === '' ? null : base + v;
      }
      return expr + v;
    }

    // --- titik desimal ---
    if (v === '.') {
      if (last === '%' || last === ')') return null;
      if (num.includes('.') || num.includes('e')) return null;   // sudah ada titik
      return expr + (num === '' ? '0.' : '.');                   // ".5" -> "0.5"
    }

    // --- persen ---
    if (v === '%') {
      return /[\d.)]$/.test(expr) && last !== '%' ? expr + '%' : null;
    }

    // --- kurung ---
    if (v === '(') {
      if (expr === '' || OPS.includes(last) || last === '(') return expr + '(';
      return expr + '*(';                                         // 2( -> 2×(
    }
    if (v === ')') {
      const open = (expr.match(/\(/g) || []).length - (expr.match(/\)/g) || []).length;
      return open > 0 && /[\d.)%]$/.test(expr) ? expr + ')' : null;
    }

    // --- angka ---
    if (/^\d$/.test(v)) {
      if (last === '%' || last === ')') return expr + '*' + v;     // 50%2 -> 50%×2
      if (num.includes('e')) return null;
      if (num === '0') return expr.slice(0, -1) + v;               // hindari "007"
      return expr + v;
    }
    return null;
  }

  /**
   * Hitung ekspresi dengan aman.
   * @param {string} expr
   * @returns {number|'Error'}
   */
  static evaluate(expr) {
    let e = CalculatorEngine.sanitize(expr).replace(/\s+/g, '');
    if (!/^[0-9()+\-*/.%e]*$/.test(e)) return 'Error';
    if (/e(?![+-]?\d)/.test(e)) return 'Error';            // huruf e hanya untuk notasi ilmiah
    e = e.replace(/[+\-*/(]+$/, '');                        // abaikan operator di akhir: "5+" -> "5"
    if (e === '') return 'Error';
    // tutup kurung yang lupa ditutup
    const open = (e.match(/\(/g) || []).length - (e.match(/\)/g) || []).length;
    if (open > 0) e += ')'.repeat(open);
    try {
      // hapus nol di depan angka ("010" -> "10") agar tidak dibaca sebagai oktal
      let c = e.replace(/(?<![\d.e])0+(?=\d)/g, '');
      // persen seperti kalkulator pada umumnya:
      //   a + b%  ->  a + (a × b / 100)     (200+10% = 220)
      //   a − b%  ->  a − (a × b / 100)     (200−10% = 180)
      c = c.replace(/(?<![\d.e])(\d+(?:\.\d+)?)([+-])(\d+(?:\.\d+)?)%/g, '$1$2($1*$3/100)');
      //   sisanya: b% -> b / 100          (50×10% = 5, (5+5)% = 0.1)
      c = c.replace(/\)%/g, ')/100');
      c = c.replace(/(\d+(?:\.\d+)?(?:e[+-]?\d+)?)%/g, '($1/100)');
      // eslint-disable-next-line no-new-func
      const val = Function('"use strict"; return (' + c + ')')();
      if (typeof val !== 'number' || !isFinite(val)) return 'Error';
      return CalculatorEngine.round(val);
    } catch (err) {
      return 'Error';
    }
  }

  /** Bulatkan sisa floating point (0.1+0.2 -> 0.3) tanpa menghilangkan angka sangat kecil. */
  static round(val) {
    const r = Number(val.toPrecision(12));
    return Object.is(r, -0) ? 0 : r;
  }
}
