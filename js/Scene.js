/**
 * Scene — mengisi latar hutan dengan elemen acak:
 * kunang-kunang, bintang berkelip, dan daun berguguran.
 * (Hewan & dekorasi sudah ada di HTML; jadwalnya diatur di css/animals.css.)
 */
class Scene {
  static LEAVES = ['daun_hijau', 'daun_tua', 'daun_gugur', 'daun_hijau', 'daun_gugur'];

  /** @param {HTMLElement} root  elemen .forest */
  constructor(root) {
    this.fireflies = root.querySelector('.fireflies');
    this.stars = root.querySelector('.stars');
    this.leaves = root.querySelector('.leaves');
    this.small = window.innerWidth < 600; // HP: jumlah elemen dikurangi
  }

  build() {
    if (Util.reduceMotion) return;
    this.#addFireflies(this.small ? 14 : 26);
    this.#addStars(this.small ? 20 : 40);
    this.#addLeaves(this.small ? 7 : 12);
  }

  #addFireflies(count) {
    const { rand } = Util;
    for (let i = 0; i < count; i++) {
      const f = document.createElement('span');
      f.className = 'firefly';
      f.style.left = rand(0, 100) + 'vw';
      f.style.top = rand(35, 92) + 'vh';
      f.style.setProperty('--dx', rand(-60, 60) + 'px');
      f.style.setProperty('--dy', rand(-50, 30) + 'px');
      f.style.setProperty('--dur', rand(4, 9) + 's');
      f.style.setProperty('--blink', rand(1.5, 3.5) + 's');
      f.style.setProperty('--delay', -rand(0, 9) + 's');
      this.fireflies.appendChild(f);
    }
  }

  #addStars(count) {
    const { rand } = Util;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = 'star';
      s.style.left = rand(0, 100) + '%';
      s.style.top = rand(0, 100) + '%';
      s.style.setProperty('--tw', rand(2, 5) + 's');
      s.style.setProperty('--delay', -rand(0, 5) + 's');
      this.stars.appendChild(s);
    }
  }

  #addLeaves(count) {
    const { rand } = Util;
    for (let i = 0; i < count; i++) {
      const l = document.createElement('img');
      l.className = 'leaf-fall';
      l.src = Util.ASSET + 'item/' + Scene.LEAVES[i % Scene.LEAVES.length] + '.png';
      l.alt = '';
      l.style.left = rand(0, 100) + 'vw';
      l.style.setProperty('--size', (Math.random() < .5 ? 16 : 24) + 'px');
      l.style.setProperty('--dur', rand(10, 18) + 's');
      l.style.setProperty('--delay', -rand(0, 18) + 's');
      this.leaves.appendChild(l);
    }
  }
}
