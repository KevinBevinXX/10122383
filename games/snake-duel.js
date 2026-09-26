// Two snakes, one arena. Eat apples to grow; make the other snake crash.
GAME({
  title: "Snake Duel",
  players: 2,
  controls: "Steer with ◀ ▲ ▼ ▶. Crash into anything and you lose the round. First to 3.",
  aLabel: "·", bLabel: false,
  CW: 40, CH: 22,
  init() { return { ...this.round(), wins: [0, 0] }; },
  round() {
    return { sn: [{ b: [[6, 11], [5, 11], [4, 11]], d: [1, 0], nd: [1, 0], grow: 0 }, { b: [[33, 11], [34, 11], [35, 11]], d: [-1, 0], nd: [-1, 0], grow: 0 }],
      apples: [[20, 5], [20, 16], [12, 11], [28, 11]], acc: 0, wait: 1 };
  },
  update(s, inp, dt) {
    s.sn.forEach((n, i) => {
      const k = inp[i], w = k.up ? [0, -1] : k.down ? [0, 1] : k.left ? [-1, 0] : k.right ? [1, 0] : null;
      if (w && !(w[0] === -n.d[0] && w[1] === -n.d[1])) n.nd = w;
    });
    if (s.wait > 0) { s.wait -= dt; return; }
    if ((s.acc += dt) < 0.1) return;
    s.acc = 0;
    const heads = s.sn.map((n) => { n.d = n.nd; return [n.b[0][0] + n.d[0], n.b[0][1] + n.d[1]]; });
    const dead = heads.map(([x, y], i) => x < 0 || y < 0 || x >= this.CW || y >= this.CH ||
      s.sn.some((n) => n.b.slice(0, n.b.length - (n.grow ? 0 : 1)).some(([bx, by]) => bx === x && by === y)));
    if (heads[0][0] === heads[1][0] && heads[0][1] === heads[1][1]) dead[0] = dead[1] = true;
    if (dead[0] || dead[1]) {
      E.sfx("boom");
      if (dead[0] !== dead[1]) s.wins[dead[0] ? 1 : 0]++;
      const w = s.wins.findIndex((v) => v >= 3);
      if (w >= 0) { s.over = true; s.winner = w; return; }
      return Object.assign(s, this.round());
    }
    s.sn.forEach((n, i) => {
      n.b.unshift(heads[i]);
      const ai = s.apples.findIndex(([x, y]) => x === heads[i][0] && y === heads[i][1]);
      if (ai >= 0) { n.grow += 3; E.sfx("coin"); s.apples[ai] = this.freeCell(s); }
      if (n.grow > 0) n.grow--; else n.b.pop();
    });
  },
  freeCell(s) {
    for (;;) {
      const x = E.randi(0, this.CW - 1), y = E.randi(0, this.CH - 1);
      if (!s.sn.some((n) => n.b.some(([a, b]) => a === x && b === y))) return [x, y];
    }
  },
  ai(s, i) {
    const n = s.sn[i], [hx, hy] = n.b[0];
    const blocked = (x, y) => x < 0 || y < 0 || x >= this.CW || y >= this.CH || s.sn.some((m) => m.b.some(([a, b]) => a === x && b === y));
    const target = s.apples.reduce((best, a) => (Math.abs(a[0] - hx) + Math.abs(a[1] - hy) < Math.abs(best[0] - hx) + Math.abs(best[1] - hy) ? a : best));
    const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => !(dx === -n.d[0] && dy === -n.d[1]) && !blocked(hx + dx, hy + dy));
    if (!opts.length) return {};
    opts.sort((a, b) => Math.abs(hx + a[0] - target[0]) + Math.abs(hy + a[1] - target[1]) - (Math.abs(hx + b[0] - target[0]) + Math.abs(hy + b[1] - target[1])));
    const [dx, dy] = opts[0];
    return { right: dx > 0, left: dx < 0, down: dy > 0, up: dy < 0 };
  },
  draw(c, s) {
    E.clear(c, "#1b3a1b");
    for (let y = 0; y < this.CH; y++) for (let x = 0; x < this.CW; x++) if ((x + y) % 2) E.rect(c, x * 20, y * 20 + 10, 20, 20, "#1f421f");
    s.apples.forEach(([x, y]) => E.circle(c, x * 20 + 10, y * 20 + 20, 8, "#e53935"));
    const cols = [["#42a5f5", "#1565c0"], ["#ffca28", "#f57f17"]];
    s.sn.forEach((n, i) => n.b.forEach(([x, y], j) => E.rrect(c, x * 20 + 1, y * 20 + 11, 18, 18, 5, j ? cols[i][0] : cols[i][1])));
    E.text(c, `${E.name(0)} ${s.wins[0]} — ${s.wins[1]} ${E.name(1)}`, 400, 6, 11, "#fff", "center", "top");
  },
});
