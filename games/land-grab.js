// Paper.io-style: leave your land to draw a trail, return to claim the area. Bots do the same.
GAME({
  title: "Land Grab",
  players: 1,
  controls: "Steer with ◀ ▲ ▼ ▶ (or swipe). Leave your land, loop back to claim everything inside. If anyone crosses your trail, you're out.",
  aLabel: "·", bLabel: false,
  CW: 60, CH: 34,
  init() {
    const s = { g: E.grid(this.CW, this.CH, -1), tr: E.grid(this.CW, this.CH, -1), p: [], acc: 0, score: 0, swipe: null, t: 0 };
    const spots = [[30, 17], [10, 8], [50, 8], [10, 26], [50, 26]];
    spots.forEach(([x, y], i) => { s.p.push({ x, y, d: [1, 0], nd: [1, 0], alive: true, col: i, trail: [], turnT: 0 }); for (let yy = y - 2; yy <= y + 2; yy++) for (let xx = x - 2; xx <= x + 2; xx++) s.g[yy][xx] = i; });
    return s;
  },
  COLS: ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#a855f7"], TRAIL: ["#93c5fd", "#fca5a5", "#86efac", "#fcd34d", "#d8b4fe"],
  kill(s, i) {
    const p = s.p[i]; p.alive = false;
    for (let y = 0; y < this.CH; y++) for (let x = 0; x < this.CW; x++) { if (s.g[y][x] === i) s.g[y][x] = -1; if (s.tr[y][x] === i) s.tr[y][x] = -1; }
    if (i === 0) { s.over = true; E.sfx("boom"); } else E.sfx("coin");
  },
  claim(s, i) {
    const W = this.CW, H = this.CH, out = E.grid(W, H, false), q = [];
    for (let x = 0; x < W; x++) { q.push([x, 0], [x, H - 1]); } for (let y = 0; y < H; y++) { q.push([0, y], [W - 1, y]); }
    while (q.length) { const [x, y] = q.pop(); if (x < 0 || y < 0 || x >= W || y >= H || out[y][x] || s.g[y][x] === i || s.tr[y][x] === i) continue; out[y][x] = true; q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!out[y][x] || s.tr[y][x] === i) { if (s.g[y][x] >= 0 && s.g[y][x] !== i) {} s.g[y][x] = i; if (s.tr[y][x] === i) s.tr[y][x] = -1; }
    s.p[i].trail = [];
    if (i === 0) E.sfx("score");
  },
  update(s, inp, dt) {
    const k = inp[0], me = s.p[0];
    let w = k.up ? [0, -1] : k.down ? [0, 1] : k.left ? [-1, 0] : k.right ? [1, 0] : null;
    for (const t of k.taps) s.swipe = { x: t.x, y: t.y };
    if (s.swipe && !k.pdown) { const dx = k.px - s.swipe.x, dy = k.py - s.swipe.y; if (Math.hypot(dx, dy) > 20) w = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]; s.swipe = null; }
    if (w && !(w[0] === -me.d[0] && w[1] === -me.d[1])) me.nd = w;
    s.t += dt;
    if ((s.acc += dt) < 0.09) return;
    s.acc = 0;
    s.p.forEach((p, i) => {
      if (!p.alive) return;
      if (i > 0) this.bot(s, p, i);
      p.d = p.nd;
      const nx = p.x + p.d[0], ny = p.y + p.d[1];
      if (nx < 0 || ny < 0 || nx >= this.CW || ny >= this.CH) { this.kill(s, i); return; }
      const tr = s.tr[ny][nx];
      if (tr === i) { this.kill(s, i); return; }
      if (tr >= 0) this.kill(s, tr);
      p.x = nx; p.y = ny;
      if (s.g[ny][nx] === i) { if (p.trail.length) this.claim(s, i); }
      else { s.tr[ny][nx] = i; p.trail.push([nx, ny]); }
    });
    for (let i = 1; i < s.p.length; i++) if (!s.p[i].alive && Math.random() < 0.02) {
      const x = E.randi(5, this.CW - 6), y = E.randi(5, this.CH - 6);
      if (s.g.slice(y - 2, y + 3).every((r) => r.slice(x - 2, x + 3).every((v) => v < 0))) { Object.assign(s.p[i], { x, y, alive: true, trail: [], d: [1, 0], nd: [1, 0] }); for (let yy = y - 2; yy <= y + 2; yy++) for (let xx = x - 2; xx <= x + 2; xx++) s.g[yy][xx] = i; }
    }
    s.score = s.g.flat().filter((v) => v === 0).length;
  },
  bot(s, p, i) {
    p.turnT--;
    const home = s.g[p.y][p.x] === i;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => !(dx === -p.d[0] && dy === -p.d[1]));
    const safe = dirs.filter(([dx, dy]) => { const x = p.x + dx, y = p.y + dy; return x >= 1 && y >= 1 && x < this.CW - 1 && y < this.CH - 1 && s.tr[y][x] !== i; });
    if (!safe.length) return;
    if (p.trail.length > 10 + i * 2 || (!home && p.turnT < -30)) {
      // head home: nearest own cell
      let best = null, bd = Infinity;
      for (let y = 0; y < this.CH; y++) for (let x = 0; x < this.CW; x++) if (s.g[y][x] === i) { const d = Math.abs(x - p.x) + Math.abs(y - p.y); if (d < bd) { bd = d; best = [x, y]; } }
      if (best) { safe.sort((a, b) => Math.abs(p.x + a[0] - best[0]) + Math.abs(p.y + a[1] - best[1]) - (Math.abs(p.x + b[0] - best[0]) + Math.abs(p.y + b[1] - best[1]))); p.nd = safe[0]; return; }
    }
    const me = s.p[0];
    if (me.alive && me.trail.length) { const t = me.trail[me.trail.length - 1]; if (Math.abs(t[0] - p.x) + Math.abs(t[1] - p.y) < 8) { safe.sort((a, b) => Math.abs(p.x + a[0] - t[0]) + Math.abs(p.y + a[1] - t[1]) - (Math.abs(p.x + b[0] - t[0]) + Math.abs(p.y + b[1] - t[1]))); p.nd = safe[0]; return; } }
    if (p.turnT <= 0 || !safe.some(([dx, dy]) => dx === p.d[0] && dy === p.d[1])) { p.nd = E.pick(safe); p.turnT = E.randi(3, 8); }
  },
  draw(c, s) {
    E.clear(c, "#f1f5f9");
    const T = 800 / this.CW, TY = 450 / this.CH;
    for (let y = 0; y < this.CH; y++) for (let x = 0; x < this.CW; x++) {
      if (s.g[y][x] >= 0) E.rect(c, x * T, y * TY, T + 0.5, TY + 0.5, this.COLS[s.g[y][x]]);
      else if (s.tr[y][x] >= 0) E.rect(c, x * T, y * TY, T + 0.5, TY + 0.5, this.TRAIL[s.tr[y][x]]);
    }
    s.p.forEach((p, i) => { if (p.alive) { E.rect(c, p.x * T - 2, p.y * TY - 2, T + 4, TY + 4, "#fff"); E.rect(c, p.x * T, p.y * TY, T, TY, this.COLS[i]); } });
    E.text(c, `${((s.score / (this.CW * this.CH)) * 100).toFixed(1)}%`, 10, 10, 20, "#1e3a8a", "left", "top");
  },
});
