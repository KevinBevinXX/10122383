// Five in a row on a 15x15 board.
GAME({
  title: "Five in a Row",
  players: 2, touch: "pointer",
  controls: "Tap an intersection. Get five stones in a row to win.",
  N: 15, X: 190, Y: 12, S: 28,
  init() { return { b: E.grid(15, 15, -1), turn: 0, t: 0, done: 0, win: null, last: null }; },
  line(b, r, c, dr, dc, p) { let n = 0, y = r + dr, x = c + dc; while (y >= 0 && y < 15 && x >= 0 && x < 15 && b[y][x] === p) { n++; y += dr; x += dc; } return n; },
  five(b, r, c) {
    const p = b[r][c];
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) if (1 + this.line(b, r, c, dr, dc, p) + this.line(b, r, c, -dr, -dc, p) >= 5) return true;
    return false;
  },
  update(s, inp, dt) {
    s.t += dt;
    if (s.done) { if ((s.done -= dt) <= 0) s.over = true; return; }
    for (const t of inp[s.turn].taps) {
      const c = Math.round((t.x - this.X - 14) / this.S), r = Math.round((t.y - this.Y - 14) / this.S);
      if (r < 0 || r >= 15 || c < 0 || c >= 15 || s.b[r][c] >= 0) continue;
      s.b[r][c] = s.turn; s.last = [r, c]; E.sfx("click");
      if (this.five(s.b, r, c)) { s.winner = s.turn; s.done = 1.2; }
      else if (s.b.every((row) => row.every((v) => v >= 0))) { s.winner = -1; s.done = 1; }
      s.turn = 1 - s.turn; s.t = 0; break;
    }
  },
  ai(s, i) {
    if (s.turn !== i || s.t < 0.5 || s.done) return {};
    let best = [7, 7], bv = -1;
    for (let r = 0; r < 15; r++) for (let c = 0; c < 15; c++) {
      if (s.b[r][c] >= 0) continue;
      let v = 0;
      for (const p of [i, 1 - i]) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
        const n = this.line(s.b, r, c, dr, dc, p) + this.line(s.b, r, c, -dr, -dc, p);
        v += [0, 2, 12, 80, 2000][Math.min(4, n)] * (p === i ? 1.1 : 1);
      }
      v += Math.random() * 1.5 - E.dist(r, c, 7, 7) * 0.05;
      if (v > bv) { bv = v; best = [r, c]; }
    }
    return { taps: [{ x: this.X + 14 + best[1] * this.S, y: this.Y + 14 + best[0] * this.S }] };
  },
  draw(c, s) {
    E.clear(c, "#2b2118");
    E.rect(c, this.X, this.Y, 14 * this.S + 28, 14 * this.S + 28, "#deb887");
    for (let k = 0; k < 15; k++) {
      E.line(c, this.X + 14, this.Y + 14 + k * this.S, this.X + 14 + 14 * this.S, this.Y + 14 + k * this.S, "#6d4c2f", 1);
      E.line(c, this.X + 14 + k * this.S, this.Y + 14, this.X + 14 + k * this.S, this.Y + 14 + 14 * this.S, "#6d4c2f", 1);
    }
    for (let r = 0; r < 15; r++) for (let col = 0; col < 15; col++) if (s.b[r][col] >= 0) E.circle(c, this.X + 14 + col * this.S, this.Y + 14 + r * this.S, 13, s.b[r][col] ? "#fafafa" : "#111");
    if (s.last) E.circle(c, this.X + 14 + s.last[1] * this.S, this.Y + 14 + s.last[0] * this.S, 4, "#e53935");
    E.circle(c, 95, 200, 16, "#111"); E.text(c, E.name(0), 95, 230, 14);
    E.circle(c, 705, 200, 16, "#fafafa"); E.text(c, E.name(1), 705, 230, 14);
    E.text(c, s.done ? "" : E.turnText(s.turn), 95, 120, 14, "#fff");
  },
});
