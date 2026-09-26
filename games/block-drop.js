// Falling blocks: complete rows to clear them.
GAME({
  title: "Block Drop",
  players: 1,
  controls: "◀ ▶ move · ▲ rotate · ▼ soft drop · A = hard drop · B = hold",
  aLabel: "Drop", bLabel: "Hold",
  SHAPES: [[[0, 1], [1, 1], [2, 1], [3, 1]], [[0, 0], [1, 0], [0, 1], [1, 1]], [[1, 0], [0, 1], [1, 1], [2, 1]], [[0, 0], [0, 1], [1, 1], [2, 1]], [[2, 0], [0, 1], [1, 1], [2, 1]], [[1, 0], [2, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [1, 1], [2, 1]]],
  COLS: ["#00bcd4", "#ffeb3b", "#9c27b0", "#2196f3", "#ff9800", "#4caf50", "#f44336"],
  init() { const s = { g: E.grid(10, 20, -1), bag: [], score: 0, lines: 0, fall: 0, hold: -1, held: false, das: 0 }; this.spawn(s); return s; },
  next(s) { if (!s.bag.length) s.bag = E.shuffle([0, 1, 2, 3, 4, 5, 6]); return s.bag.pop(); },
  spawn(s, t) {
    s.cur = { t: t ?? (s.nxt ?? this.next(s)), r: 0, x: 3, y: 0 };
    if (t === undefined) s.nxt = this.next(s);
    if (!this.fits(s, s.cur)) s.over = true;
  },
  cells(p) {
    return this.SHAPES[p.t].map(([x, y]) => {
      const n = p.t === 0 ? 4 : p.t === 1 ? 2 : 3;
      for (let k = 0; k < p.r; k++) [x, y] = [n - 1 - y, x];
      return [p.x + x, p.y + y];
    });
  },
  fits(s, p) { return this.cells(p).every(([x, y]) => x >= 0 && x < 10 && y < 20 && (y < 0 || s.g[y][x] < 0)); },
  lock(s) {
    this.cells(s.cur).forEach(([x, y]) => { if (y >= 0) s.g[y][x] = s.cur.t; });
    const full = s.g.map((row, y) => (row.every((v) => v >= 0) ? y : -1)).filter((y) => y >= 0);
    full.forEach((y) => { s.g.splice(y, 1); s.g.unshift(Array(10).fill(-1)); });
    if (full.length) { s.lines += full.length; s.score += [0, 100, 300, 500, 800][full.length]; E.sfx("score"); } else E.sfx("click");
    s.held = false;
    this.spawn(s);
  },
  update(s, inp, dt) {
    const k = inp[0], p = s.cur;
    const tryMove = (dx, dy, dr = 0) => {
      const n = { ...p, x: p.x + dx, y: p.y + dy, r: (p.r + dr) % 4 };
      for (const kick of dr ? [0, -1, 1, -2, 2] : [0]) { n.x = p.x + dx + kick; if (this.fits(s, n)) { Object.assign(p, n); return true; } }
      return false;
    };
    if (k.pl) { tryMove(-1, 0); s.das = -0.18; } if (k.pr) { tryMove(1, 0); s.das = -0.18; }
    if (k.left || k.right) { s.das += dt; if (s.das > 0.05) { tryMove(k.left ? -1 : 1, 0); s.das = 0; } }
    if (k.pu) tryMove(0, 0, 1);
    for (const t of k.taps) { if (t.x < 267) tryMove(-1, 0); else if (t.x > 533) tryMove(1, 0); else tryMove(0, 0, 1); }
    if (k.pb && !s.held) { const t = s.cur.t; if (s.hold < 0) { s.hold = t; this.spawn(s); } else { const h = s.hold; s.hold = t; this.spawn(s, h); } s.held = true; return; }
    if (k.pa) { while (tryMove(0, 1)); this.lock(s); return; }
    s.fall += dt * (k.down ? 12 : 1);
    const speed = Math.max(0.08, 0.8 - Math.floor(s.lines / 10) * 0.07);
    if (s.fall >= speed) { s.fall = 0; if (!tryMove(0, 1)) this.lock(s); }
  },
  mini(c, t, x, y) { if (t < 0) return; this.SHAPES[t].forEach(([a, b]) => E.rect(c, x + a * 16, y + b * 16, 15, 15, this.COLS[t])); },
  draw(c, s) {
    E.clear(c, "#111827");
    const X = 300, S = 21;
    E.rect(c, X - 4, 0, 10 * S + 8, 450, "#374151"); E.rect(c, X, 0, 10 * S, 20 * S + 30, "#0b0f19");
    for (let y = 0; y < 20; y++) for (let x = 0; x < 10; x++) if (s.g[y][x] >= 0) E.rect(c, X + x * S, y * S + 15, S - 1, S - 1, this.COLS[s.g[y][x]]);
    if (s.cur) {
      const ghost = { ...s.cur }; while (this.fits(s, { ...ghost, y: ghost.y + 1 })) ghost.y++;
      this.cells(ghost).forEach(([x, y]) => y >= 0 && E.rect(c, X + x * S, y * S + 15, S - 1, S - 1, "rgba(255,255,255,.12)"));
      this.cells(s.cur).forEach(([x, y]) => y >= 0 && E.rect(c, X + x * S, y * S + 15, S - 1, S - 1, this.COLS[s.cur.t]));
    }
    E.text(c, "NEXT", 600, 40, 16); this.mini(c, s.nxt, 570, 60);
    E.text(c, "HOLD", 200, 40, 16); this.mini(c, s.hold, 170, 60);
    E.text(c, "Score " + s.score, 620, 200, 20); E.text(c, "Lines " + s.lines, 620, 235, 18, "#9ca3af");
    E.text(c, "Tap left/right side to move, middle to rotate", 400, 440, 11, "#6b7280");
  },
});
