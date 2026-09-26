// Minesweeper. First click is always safe.
GAME({
  title: "Minesweeper",
  players: 1, touch: "pointer", lowScore: true,
  controls: "Tap / click to reveal. B + tap, right-click, or long-press to flag. Tap the 🚩/⛏ button to switch tap mode on phones.",
  W: 20, H: 11, MINES: 32, S: 36, X: 40, Y: 25,
  init() { return { g: E.grid(20, 11, 0), open: E.grid(20, 11, 0), flag: E.grid(20, 11, 0), placed: false, t: 0, mode: "dig", holdT: 0, holdCell: null, score: 0 }; },
  place(s, sx, sy) {
    let n = 0;
    while (n < this.MINES) { const x = E.randi(0, this.W - 1), y = E.randi(0, this.H - 1); if (s.g[y][x] === -1 || (Math.abs(x - sx) <= 1 && Math.abs(y - sy) <= 1)) continue; s.g[y][x] = -1; n++; }
    for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) if (s.g[y][x] !== -1) s.g[y][x] = this.nb(x, y).filter(([a, b]) => s.g[b][a] === -1).length;
    s.placed = true;
  },
  nb(x, y) { const o = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const a = x + dx, b = y + dy; if ((dx || dy) && a >= 0 && b >= 0 && a < this.W && b < this.H) o.push([a, b]); } return o; },
  reveal(s, x, y) {
    if (s.open[y][x] || s.flag[y][x]) return;
    if (!s.placed) this.place(s, x, y);
    s.open[y][x] = 1;
    if (s.g[y][x] === -1) { s.over = true; s.overText = "💥 Boom!"; s.lost = true; E.sfx("boom"); return; }
    if (s.g[y][x] === 0) this.nb(x, y).forEach(([a, b]) => this.reveal(s, a, b));
  },
  update(s, inp, dt) {
    const k = inp[0];
    if (s.placed) s.t += dt;
    for (const t of k.taps) {
      if (E.inRect(t, 760, 180, 36, 80)) { s.mode = s.mode === "dig" ? "flag" : "dig"; continue; }
      const x = Math.floor((t.x - this.X) / this.S), y = Math.floor((t.y - this.Y) / this.S);
      if (x < 0 || y < 0 || x >= this.W || y >= this.H) continue;
      if (k.b || s.mode === "flag") { if (!s.open[y][x]) { s.flag[y][x] ^= 1; E.sfx("click"); } }
      else if (s.open[y][x] && s.g[y][x] > 0) {
        // chord: reveal neighbours if flags match
        const nb = this.nb(x, y);
        if (nb.filter(([a, b]) => s.flag[b][a]).length === s.g[y][x]) nb.forEach(([a, b]) => this.reveal(s, a, b));
      } else { this.reveal(s, x, y); E.sfx("pop"); }
      s.holdCell = [x, y]; s.holdT = 0;
    }
    if (k.pdown && s.holdCell) { s.holdT += dt; if (s.holdT > 0.45) { const [x, y] = s.holdCell; if (!s.open[y][x]) { s.flag[y][x] ^= 1; E.sfx("click"); } s.holdCell = null; } } else s.holdCell = null;
    if (!s.over && s.placed) {
      let closed = 0; for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) if (!s.open[y][x]) closed++;
      if (closed === this.MINES) { s.over = true; s.score = Math.round(s.t); s.overText = `Cleared in ${Math.round(s.t)}s!`; E.sfx("win"); }
    }
  },
  NUM: ["", "#2563eb", "#16a34a", "#dc2626", "#7c3aed", "#b45309", "#0891b2", "#111", "#6b7280"],
  draw(c, s) {
    E.clear(c, "#e5e7eb");
    for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) {
      const px = this.X + x * this.S, py = this.Y + y * this.S;
      if (s.open[y][x] || (s.over && s.g[y][x] === -1)) {
        E.rect(c, px, py, this.S - 1, this.S - 1, s.g[y][x] === -1 ? "#fca5a5" : "#f9fafb");
        if (s.g[y][x] === -1) E.text(c, "💣", px + 18, py + 19, 20);
        else if (s.g[y][x]) E.text(c, s.g[y][x], px + 18, py + 19, 20, this.NUM[s.g[y][x]]);
      } else { E.rect(c, px, py, this.S - 1, this.S - 1, (x + y) % 2 ? "#86efac" : "#4ade80"); if (s.flag[y][x]) E.text(c, "🚩", px + 18, py + 19, 18); }
    }
    const flags = s.flag.flat().filter(Boolean).length;
    E.text(c, `💣 ${this.MINES - flags}   ⏱ ${Math.floor(s.t)}`, 400, 12, 15, "#111");
    E.rrect(c, 760, 180, 36, 80, 8, s.mode === "flag" ? "#f87171" : "#9ca3af"); E.text(c, s.mode === "flag" ? "🚩" : "⛏", 778, 220, 20);
  },
});
