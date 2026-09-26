// Drop discs; get four in a row.
GAME({
  title: "Four in a Row",
  players: 2, touch: "pointer",
  controls: "Tap a column to drop a disc. Four in a row (any direction) wins.",
  init() { return { b: E.grid(7, 6, -1), turn: 0, t: 0, win: null, done: 0, last: null }; },
  X: 190, Y: 50, S: 60,
  drop(b, col) { for (let r = 5; r >= 0; r--) if (b[r][col] < 0) return r; return -1; },
  four(b) {
    for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) {
      const p = b[r][c]; if (p < 0) continue;
      for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
        const cells = [0, 1, 2, 3].map((k) => [r + dr * k, c + dc * k]);
        if (cells.every(([y, x]) => y >= 0 && y < 6 && x >= 0 && x < 7 && b[y][x] === p)) return cells;
      }
    }
    return null;
  },
  update(s, inp, dt) {
    s.t += dt;
    if (s.done) { if ((s.done -= dt) <= 0) s.over = true; return; }
    for (const t of inp[s.turn].taps) {
      const col = Math.floor((t.x - this.X) / this.S);
      if (col < 0 || col > 6) continue;
      const r = this.drop(s.b, col);
      if (r < 0) continue;
      s.b[r][col] = s.turn; s.last = [r, col]; E.sfx("click");
      const w = this.four(s.b);
      if (w) { s.win = w; s.winner = s.turn; s.done = 1.2; }
      else if (s.b[0].every((v) => v >= 0)) { s.winner = -1; s.done = 1; }
      s.turn = 1 - s.turn; s.t = 0;
      break;
    }
  },
  score(b, me) {
    let sc = 0;
    for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      let m = 0, o = 0;
      for (let k = 0; k < 4; k++) { const y = r + dr * k, x = c + dc * k; if (y < 0 || y > 5 || x < 0 || x > 6) { m = o = -1; break; } if (b[y][x] === me) m++; else if (b[y][x] === 1 - me) o++; }
      if (m < 0) continue;
      if (!o) sc += [0, 1, 4, 20, 1000][m]; if (!m) sc -= [0, 1, 5, 30, 1000][o];
    }
    return sc;
  },
  search(b, p, me, depth, a, bt) {
    const w = this.four(b);
    if (w) return b[w[0][0]][w[0][1]] === me ? 1e5 + depth : -1e5 - depth;
    if (!depth) return this.score(b, me);
    let best = p === me ? -Infinity : Infinity, any = false;
    for (const col of [3, 2, 4, 1, 5, 0, 6]) {
      const r = this.drop(b, col); if (r < 0) continue; any = true;
      b[r][col] = p; const v = this.search(b, 1 - p, me, depth - 1, a, bt); b[r][col] = -1;
      if (p === me) { best = Math.max(best, v); a = Math.max(a, v); } else { best = Math.min(best, v); bt = Math.min(bt, v); }
      if (a >= bt) break;
    }
    return any ? best : 0;
  },
  ai(s, i) {
    if (s.turn !== i || s.t < 0.5 || s.done) return {};
    const b = s.b.map((r) => r.slice());
    let best = 3, bv = -Infinity;
    for (const col of [3, 2, 4, 1, 5, 0, 6]) {
      const r = this.drop(b, col); if (r < 0) continue;
      b[r][col] = i; const v = this.search(b, 1 - i, i, 4, -Infinity, Infinity) + Math.random(); b[r][col] = -1;
      if (v > bv) { bv = v; best = col; }
    }
    return { taps: [{ x: this.X + best * this.S + 30, y: 200 }] };
  },
  draw(c, s) {
    E.clear(c, "#0d1b2a");
    E.rrect(c, this.X - 10, this.Y - 10, 7 * this.S + 20, 6 * this.S + 20, 16, "#1565c0");
    const cols = ["#ef233c", "#ffd60a"];
    for (let r = 0; r < 6; r++) for (let col = 0; col < 7; col++) {
      const v = s.b[r][col], x = this.X + col * this.S + 30, y = this.Y + r * this.S + 30;
      E.circle(c, x, y, 25, v < 0 ? "#0d1b2a" : cols[v]);
      if (s.win && s.win.some(([a, b]) => a === r && b === col)) E.ring(c, x, y, 25, "#fff", 4);
    }
    E.text(c, s.done ? "" : E.turnText(s.turn), 400, 22, 18, cols[s.turn]);
    E.circle(c, 90, 200, 18, cols[0]); E.text(c, E.name(0), 90, 235, 14);
    E.circle(c, 710, 200, 18, cols[1]); E.text(c, E.name(1), 710, 235, 14);
  },
});
