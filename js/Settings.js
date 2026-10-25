/**
 * Settings — menyimpan & membaca pengaturan pengguna di localStorage.
 * Aman dipakai di mode privat (kesalahan penyimpanan diabaikan).
 */
class Settings {
  static KEY = 'kalkulator-hutan';

  /** @returns {object} pengaturan tersimpan, atau {} bila belum ada. */
  static load() {
    try {
      return JSON.parse(localStorage.getItem(Settings.KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  /** @param {object} data pengaturan yang akan disimpan. */
  static save(data) {
    try {
      localStorage.setItem(Settings.KEY, JSON.stringify(data));
    } catch (e) {
      /* mode privat / penyimpanan penuh: abaikan */
    }
  }
}
