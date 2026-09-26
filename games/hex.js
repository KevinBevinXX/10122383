// Hex: connect your two sides of the rhombus. Someone always wins.
GAME({
  title: "Hex",
  players: 2, touch: "pointer",
  controls: "Blue connects the left and right edges. Red connects the top and bottom edges. Tap a cell to claim it.",
  N: 9, R: 19,
  init() { return { b: E.grid(9, 9, -1), turn: 0, t: 0, done: 0 }; },
  pos(r, c) { return [175 + c * this.R * 1.732 + r * this.R * 0.866, 65 + r * this.R * 1.5]; },
  NB: [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0]],
  // cost to connect p's sides: 0 per own stone, 1 per empty (0-1 BFS)
  dist(b, p) {
    const N = 9, D = E.grid(N, N, 1e9), dq = [];
    for (let k = 0; k < N; k++) {
      const [r, c] = p === 0 ? [k, 0] : [0, k];
      if (b[r][c] === 1 - p) continue;
      D[r][c] = b[r][c] === p ? 0 : 1; dq.push([r, c]);
    }
    dq.sort((a, bb) => D[a[0]][a[1]] - D[bb[0]][bb[1]]);
    while (dq.length) {
      const [r, c] = dq.shift();
      for (const [dr, dc] of this.NB) {
        const y = r + dr, x = c + dc;
        if (y < 0 || y >= N || x < 0 || x >= N || b[y][x] === 1 - p) continue;
        const nd = D[r][c] + (b[y][x] === p ? 0 : 1);
        if (nd < D[y][x]) { D[y][x] = nd; if (b[y][x] === p) dq.unshift([y, x]); else dq.push([y, x]); }
      }
    }
    let best = 1e9;
    for (let k = 0; k < N; k++) best = Math.min(best, p === 0 ? D[k][N - 1] : D[N - 1][k]);
    return best;
  },
  update(s, inp, dt) {
    s.t += dt;
    if (s.done) { if ((s.done -= dt) <= 0) s.over = true; return; }
    for (const t of inp[s.turn].taps) {
      let best = null, bd = this.R;
      for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) { const [x, y] = this.pos(r, c), d = E.dist(x, y, t.x, t.y); if (d < bd) { bd = d; best = [r, c]; } }
      if (!best || s.b[best[0]][best[1]] >= 0) continue;
      s.b[best[0]][best[1]] = s.turn; E.sfx("click");
      if (this.dist(s.b, s.turn) === 0) { s.winner = s.turn; s.done = 1.2; }
      s.turn = 1 - s.turn; s.t = 0; break;
    }
  },
  ai(s, i) {
    if (s.turn !== i || s.t < 0.5 || s.done) return {};
    let best = null, bv = Infinity;
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      if (s.b[r][c] >= 0) continue;
      s.b[r][c] = i; const v = this.dist(s.b, i) - this.dist(s.b, 1 - i) + Math.random() * 0.5; s.b[r][c] = -1;
      if (v < bv) { bv = v; best = [r, c]; }
    }
    const [x, y] = this.pos(best[0], best[1]);
    return { taps: [{ x, y }] };
  },
  hex(c, x, y, r, col) {
    c.fillStyle = col; c.beginPath();
    for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + (k * Math.PI) / 3; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    c.closePath(); c.fill();
  },
  draw(c, s) {
    E.clear(c, "#1a1a2e");
    const [x0, y0] = this.pos(0, 0), [x1] = this.pos(0, 8), [x2, y2] = this.pos(8, 0), [x3, y3] = this.pos(8, 8);
    E.line(c, x0 - 20, y0 - 20, x1 + 10, y0 - 20, "#e53935", 6); E.line(c, x2 - 10, y2 + 20, x3 + 20, y3 + 20, "#e53935", 6);
    E.line(c, x0 - 22, y0 - 16, x2 - 22, y2 + 16, "#1e88e5", 6); E.line(c, x1 + 22, y0 - 16, x3 + 22, y3 + 16, "#1e88e5", 6);
    for (let r = 0; r < 9; r++) for (let col = 0; col < 9; col++) {
      const [x, y] = this.pos(r, col);
      this.hex(c, x, y, this.R, "#2d2d44");
      this.hex(c, x, y, this.R - 2, s.b[r][col] < 0 ? "#e8e8f0" : s.b[r][col] ? "#e53935" : "#1e88e5");
    }
    E.text(c, `${E.name(0)}: blue, left–right`, 110, 380, 14, "#64b5f6");
    E.text(c, `${E.name(1)}: red, top–bottom`, 690, 60, 14, "#ef9a9a");
    E.text(c, s.done ? "" : E.turnText(s.turn), 690, 400, 16, s.turn ? "#ef9a9a" : "#64b5f6");
  },
});
