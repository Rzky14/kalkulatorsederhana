/**
 * Util — fungsi bantu kecil yang dipakai banyak class.
 * Dimuat paling awal (lihat urutan <script> di index.html).
 */
class Util {
  /** Lokasi folder aset pixel. */
  static ASSET = 'assets/pixel/';

  /** Pengguna meminta animasi dikurangi (pengaturan aksesibilitas OS). */
  static reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Ambil satu elemen dengan selector CSS. */
  static $(selector) {
    return document.querySelector(selector);
  }

  /** Angka acak di antara a dan b. */
  static rand(a, b) {
    return a + Math.random() * (b - a);
  }

  /** Ulang animasi CSS dengan melepas lalu memasang lagi sebuah kelas. */
  static restartAnim(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth; // paksa reflow
    el.classList.add(cls);
  }

  /** Tambah nol di depan angka satu digit (7 -> "07"). */
  static pad2(n) {
    return String(n).padStart(2, '0');
  }
}
