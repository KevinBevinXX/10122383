// Classic snake. Eat, grow, don't bite yourself.
GAME({
  title: "Snake",
  players: 1,
  controls: "Steer with ◀ ▲ ▼ ▶ (or swipe/tap the side you want to turn to).",
  aLabel: "·", bLabel: false,
  CW: 32, CH: 18,
  init() { return { b: [[8, 9], [7, 9], [6, 9]], d: [1, 0], q: [], food: [20, 9], acc: 0, score: 0 }; },
  update(s, inp, dt) {
    const k = inp[0];
    let w = k.pu ? [0, -1] : k.pd ? [0, 1] : k.pl ? [-1, 0] : k.pr ? [1, 0] : null;
    for (const t of k.taps) { const [hx, hy] = s.b[0], dx = t.x - (hx * 25 + 12), dy = t.y - (hy * 25 + 12); w = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]; }
    const last = s.q.length ? s.q[s.q.length - 1] : s.d;
    if (w && !(w[0] === -last[0] && w[1] === -last[1]) && !(w[0] === last[0] && w[1] === last[1]) && s.q.length < 3) s.q.push(w);
    s.acc += dt;
    const speed = Math.max(0.05, 0.12 - s.score * 0.0015);
    if (s.acc < speed) return;
    s.acc = 0;
    if (s.q.length) s.d = s.q.shift();
    const h = [s.b[0][0] + s.d[0], s.b[0][1] + s.d[1]];
    if (h[0] < 0 || h[1] < 0 || h[0] >= this.CW || h[1] >= this.CH || s.b.slice(0, -1).some(([x, y]) => x === h[0] && y === h[1])) { s.over = true; E.sfx("boom"); return; }
    s.b.unshift(h);
    if (h[0] === s.food[0] && h[1] === s.food[1]) {
      s.score++; E.sfx("coin");
      do s.food = [E.randi(0, this.CW - 1), E.randi(0, this.CH - 1)]; while (s.b.some(([x, y]) => x === s.food[0] && y === s.food[1]));
    } else s.b.pop();
  },
  draw(c, s) {
    E.clear(c, "#aad751");
    for (let y = 0; y < this.CH; y++) for (let x = 0; x < this.CW; x++) if ((x + y) % 2) E.rect(c, x * 25, y * 25, 25, 25, "#a2d149");
    E.circle(c, s.food[0] * 25 + 12.5, s.food[1] * 25 + 12.5, 10, "#e7471d");
    s.b.forEach(([x, y], i) => E.rrect(c, x * 25 + 1, y * 25 + 1, 23, 23, 7, i ? "#4674e9" : "#2c55c4"));
    const [hx, hy] = s.b[0];
    E.circle(c, hx * 25 + 8 + s.d[0] * 4, hy * 25 + 9 + s.d[1] * 4, 3, "#fff"); E.circle(c, hx * 25 + 17 + s.d[0] * 4, hy * 25 + 9 + s.d[1] * 4, 3, "#fff");
    E.text(c, "🍎 " + s.score, 10, 10, 18, "#fff", "left", "top");
  },
});
