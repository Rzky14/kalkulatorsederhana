/**
 * CalculatorEngine — logika hitung murni (tanpa tampilan).
 * Mudah diuji terpisah: CalculatorEngine.evaluate('7+8') === 15
 */
class CalculatorEngine {
  /** Ganti simbol tampilan (× ÷ −) menjadi operator JavaScript. */
  static sanitize(expr) {
    return expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  }

  /**
   * Hitung ekspresi dengan aman.
   * @param {string} expr
   * @returns {number|'Error'}
   */
  static evaluate(expr) {
    const e = CalculatorEngine.sanitize(expr);
    if (!/^[0-9()+\-*/.%\s]*$/.test(e)) return 'Error';
    try {
      // hapus nol di depan angka ("010" -> "10") agar tidak dibaca sebagai oktal
      let cleaned = e.replace(/(?<![\d.])0+(?=\d)/g, '');
      // angka diikuti % -> dibagi 100 (50% -> 0.5)
      cleaned = cleaned.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
      // eslint-disable-next-line no-new-func
      const val = Function('"use strict"; return (' + cleaned + ')')();
      if (typeof val !== 'number' || !isFinite(val)) return 'Error';
      return +val.toFixed(10); // buang sisa pembulatan floating point
    } catch (err) {
      return 'Error';
    }
  }
}
