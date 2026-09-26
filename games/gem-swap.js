// Match-3: swap neighbouring gems to make lines of 3+. 60 seconds.
GAME({
  title: "Gem Swap",
  players: 1, touch: "pointer",
  controls: "Tap a gem, then a neighbouring gem to swap (or swipe). Make lines of 3 or more. 60 seconds.",
  N: 8, S: 50, X: 200, Y: 25,
  GEMS: ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316"],
  init() {
    const g = E.grid(8, 8, 0);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) do g[y][x] = E.randi(0, 5); while ((x > 1 && g[y][x] === g[y][x - 1] && g[y][x] === g[y][x - 2]) || (y > 1 && g[y][x] === g[y - 1][x] && g[y][x] === g[y - 2][x]));
    return { g, sel: null, score: 0, time: 60, busy: 0, combo: 0, swipe: null };
  },
  matches(g) {
    const m = E.grid(8, 8, false);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 6; x++) if (g[y][x] >= 0 && g[y][x] === g[y][x + 1] && g[y][x] === g[y][x + 2]) m[y][x] = m[y][x + 1] = m[y][x + 2] = true;
    for (let x = 0; x < 8; x++) for (let y = 0; y < 6; y++) if (g[y][x] >= 0 && g[y][x] === g[y + 1][x] && g[y][x] === g[y + 2][x]) m[y][x] = m[y + 1][x] = m[y + 2][x] = true;
    return m;
  },
  swap(s, a, b) { const t = s.g[a[1]][a[0]]; s.g[a[1]][a[0]] = s.g[b[1]][b[0]]; s.g[b[1]][b[0]] = t; },
  tryMove(s, a, b) {
    if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) !== 1) return false;
    this.swap(s, a, b);
    if (!this.matches(s.g).flat().some(Boolean)) { this.swap(s, a, b); E.sfx("hit"); return true; }
    s.combo = 0; s.busy = 0.01; E.sfx("click"); return true;
  },
  update(s, inp, dt) {
    const k = inp[0];
    s.time -= dt; if (s.time <= 0 && !s.busy) { s.over = true; return; }
    if (s.busy) {
      s.busy += dt; if (s.busy < 0.18) return;
      const m = this.matches(s.g), n = m.flat().filter(Boolean).length;
      if (n) {
        s.combo++; s.score += n * 10 * s.combo; E.sfx(s.combo > 1 ? "coin" : "pop");
        for (let x = 0; x < 8; x++) { const col = []; for (let y = 7; y >= 0; y--) if (!m[y][x]) col.push(s.g[y][x]); while (col.length < 8) col.push(E.randi(0, 5)); for (let y = 7; y >= 0; y--) s.g[y][x] = col[7 - y]; }
        s.busy = 0.01;
      } else s.busy = 0;
      return;
    }
    const cell = (t) => { const x = Math.floor((t.x - this.X) / this.S), y = Math.floor((t.y - this.Y) / this.S); return x >= 0 && y >= 0 && x < 8 && y < 8 ? [x, y] : null; };
    for (const t of k.taps) {
      const c = cell(t); if (!c) continue;
      s.swipe = c;
      if (s.sel && this.tryMove(s, s.sel, c)) { s.sel = null; s.swipe = null; } else s.sel = c;
    }
    if (s.swipe && k.pdown) {
      const c = cell({ x: k.px, y: k.py });
      if (c && (c[0] !== s.swipe[0] || c[1] !== s.swipe[1])) { const d = [Math.sign(c[0] - s.swipe[0]), Math.sign(c[1] - s.swipe[1])]; const tgt = Math.abs(c[0] - s.swipe[0]) > Math.abs(c[1] - s.swipe[1]) ? [s.swipe[0] + d[0], s.swipe[1]] : [s.swipe[0], s.swipe[1] + d[1]]; if (tgt[0] >= 0 && tgt[0] < 8 && tgt[1] >= 0 && tgt[1] < 8) this.tryMove(s, s.swipe, tgt); s.swipe = null; s.sel = null; }
    }
    if (!k.pdown) s.swipe = null;
  },
  draw(c, s) {
    E.clear(c, "#1e1b4b");
    E.rrect(c, this.X - 6, this.Y - 6, 412, 412, 12, "#312e81");
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const px = this.X + x * this.S + 25, py = this.Y + y * this.S + 25, v = s.g[y][x];
      if (s.sel && s.sel[0] === x && s.sel[1] === y) E.rrect(c, px - 24, py - 24, 48, 48, 8, "rgba(255,255,255,.25)");
      c.fillStyle = this.GEMS[v]; c.beginPath();
      for (let k2 = 0; k2 < 6; k2++) { const a = (k2 * Math.PI) / 3 + v; c.lineTo(px + Math.cos(a) * 19, py + Math.sin(a) * 19); }
      c.fill(); E.circle(c, px - 5, py - 6, 5, "rgba(255,255,255,.45)");
    }
    E.text(c, "Score", 100, 150, 18); E.text(c, s.score, 100, 185, 30, "#fde047");
    E.text(c, `${Math.max(0, Math.ceil(s.time))}s`, 700, 170, 30);
    if (s.combo > 1 && s.busy) E.text(c, `Combo ×${s.combo}!`, 700, 230, 20, "#f472b6");
  },
});
