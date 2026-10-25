# Kalkulator Sederhana — Hutan Pixel

Kalkulator bergaya pixel art 8-bit dengan latar hutan yang berubah mengikuti jam,
maskot kelinci yang bereaksi, efek suara, dan hewan yang berbeda tiap waktu.

Buka `index.html` langsung di browser — tidak perlu server atau instalasi.

## Struktur

```
index.html            halaman utama
css/
  base.css            font, warna dasar, variabel suasana per waktu
  forest.css          latar hutan, bintang, dekorasi, hewan dasar, daun
  effects.css         efek sekali-jalan (konfeti, bintang, silang)
  calculator.css      panel, toolbar, layar LCD, tombol
  mascot.css          maskot kelinci & gelembung bicara
  responsive.css      penyesuaian HP / landscape / layar kecil
  animals.css         hewan tambahan & jadwal hewan per waktu
  decorations.css     gambar dekorasi depan per waktu
js/                   satu class per file, dimuat berurutan
  Util.js             fungsi bantu
  Settings.js         simpan pengaturan di localStorage
  SoundManager.js     efek suara (Web Audio API)
  Mascot.js           pose & reaksi maskot
  TimeOfDay.js        suasana otomatis dari jam perangkat
  Scene.js            kunang-kunang, bintang, daun berguguran
  Effects.js          efek gambar (bintang, silang, kembang api)
  CalculatorEngine.js logika hitung murni
  Calculator.js       alur kalkulator: input, hasil, streak
  SoundControls.js    tombol mute & slider volume
  InputController.js  tombol layar & keyboard
  App.js              menghubungkan semua class (titik masuk)
assets/pixel/         semua gambar pixel art + font (lisensi SIL OFL)
```

## Waktu & hewan

| Waktu | Jam | Hewan |
|---|---|---|
| Pagi | 05.00–10.59 | burung, kupu-kupu, tupai, kelinci, rusa |
| Siang | 11.00–14.59 | burung, kupu-kupu, tupai, katak |
| Sore | 15.00–17.59 | burung, kelinci, rusa, rubah, landak |
| Malam | 18.00–21.59 | burung hantu, kelelawar, rubah, landak, katak, siput |
| Larut | 22.00–04.59 | burung hantu, kelelawar, landak, siput |

Coba jam tertentu dengan menambahkan `?jam=16:30` di akhir alamat.

## Keyboard

`0–9 + - * / % .` input · `Enter` hitung · `Esc`/`C` hapus · `Backspace` hapus satu · `M` suara
