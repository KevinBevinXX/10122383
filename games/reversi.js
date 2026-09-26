// Reversi: outflank discs to flip them. Most discs wins.
GAME({
  title: "Reversi",
  players: 2, touch: "pointer",
  controls: "Tap a highlighted square to place a disc and flip the ones you trap.",
  X: 220, Y: 45, S: 45,
  init() {
    const b = E.grid(8, 8, -1); b[3][3] = b[4][4] = 1; b[3][4] = b[4][3] = 0;
    return { b, turn: 0, t: 0, done: 0, passed: false };
  },
  flips(b, r, c, p) {
    if (b[r][c] >= 0) return [];
    const out = [];
    for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) {
      const line = []; let y = r + dr, x = c + dc;
      while (y >= 0 && y < 8 && x >= 0 && x < 8 && b[y][x] === 1 - p) { line.push([y, x]); y += dr; x += dc; }
      if (line.length && y >= 0 && y < 8 && x >= 0 && x < 8 && b[y][x] === p) out.push(...line);
    }
    return out;
  },
  moves(b, p) { const m = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const f = this.flips(b, r, c, p); if (f.length) m.push([r, c, f.length]); } return m; },
  count(b, p) { return b.flat().filter((v) => v === p).length; },
  update(s, inp, dt) {
    s.t += dt;
    if (s.done) { if ((s.done -= dt) <= 0) s.over = true; return; }
    if (!this.moves(s.b, s.turn).length) {
      if (!this.moves(s.b, 1 - s.turn).length) {
        const a = this.count(s.b, 0), b = this.count(s.b, 1);
        s.winner = a === b ? -1 : a > b ? 0 : 1; s.done = 1.2; return;
      }
      s.turn = 1 - s.turn; s.t = 0; s.passed = true; return;
    }
    for (const t of inp[s.turn].taps) {
      const c = Math.floor((t.x - this.X) / this.S), r = Math.floor((t.y - this.Y) / this.S);
      if (r < 0 || r > 7 || c < 0 || c > 7) continue;
      const f = this.flips(s.b, r, c, s.turn);
      if (!f.length) continue;
      s.b[r][c] = s.turn; f.forEach(([y, x]) => (s.b[y][x] = s.turn)); E.sfx("click");
      s.turn = 1 - s.turn; s.t = 0; s.passed = false;
      break;
    }
  },
  W: [[100, -20, 10, 5, 5, 10, -20, 100], [-20, -50, -2, -2, -2, -2, -50, -20], [10, -2, 1, 1, 1, 1, -2, 10], [5, -2, 1, 0, 0, 1, -2, 5]],
  ai(s, i) {
    if (s.turn !== i || s.t < 0.6 || s.done) return {};
    const m = this.moves(s.b, i);
    if (!m.length) return {};
    const w = (r, c) => this.W[r < 4 ? r : 7 - r][c];
    m.sort((a, b) => w(b[0], b[1]) + b[2] - (w(a[0], a[1]) + a[2]) + (Math.random() - 0.5));
    return { taps: [{ x: this.X + m[0][1] * this.S + 20, y: this.Y + m[0][0] * this.S + 20 }] };
  },
  draw(c, s) {
    E.clear(c, "#1b1b1b");
    E.rect(c, this.X - 6, this.Y - 6, 8 * this.S + 12, 8 * this.S + 12, "#3e2723");
    const legal = s.done ? [] : this.moves(s.b, s.turn);
    const showHints = E.mode() !== "online" || s.turn === E.me();
    for (let r = 0; r < 8; r++) for (let col = 0; col < 8; col++) {
      const x = this.X + col * this.S, y = this.Y + r * this.S;
      E.rect(c, x + 1, y + 1, this.S - 2, this.S - 2, "#2e7d32");
      const v = s.b[r][col];
      if (v >= 0) E.circle(c, x + this.S / 2, y + this.S / 2, 18, v ? "#fafafa" : "#111");
      else if (showHints && legal.some(([a, b]) => a === r && b === col)) E.circle(c, x + this.S / 2, y + this.S / 2, 5, "rgba(255,255,255,.4)");
    }
    E.circle(c, 110, 180, 20, "#111"); E.ring(c, 110, 180, 20, "#666", 2); E.text(c, this.count(s.b, 0), 110, 225, 26); E.text(c, E.name(0), 110, 255, 14);
    E.circle(c, 690, 180, 20, "#fafafa"); E.text(c, this.count(s.b, 1), 690, 225, 26); E.text(c, E.name(1), 690, 255, 14);
    E.text(c, s.done ? "" : E.turnText(s.turn), 400, 22, 18);
  },
});
