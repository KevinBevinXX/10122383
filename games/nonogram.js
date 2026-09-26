// Nonogram (picross): fill cells so each row and column matches its clues.
GAME({
  title: "Nonogram",
  players: 1, touch: "pointer", lowScore: true,
  controls: "Tap to fill a cell. B + tap (or switch to ✖ mode) to mark a cell empty. Numbers show the runs of filled cells in each row / column.",
  N: 10,
  init() {
    const sol = E.grid(10, 10, 0);
    // blobby random picture: smooth noise so it looks like a shape, not static
    const cx = E.rand(3, 6), cy = E.rand(3, 6);
    for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) sol[y][x] = Math.random() < 0.8 - E.dist(x, y, cx, cy) * 0.12 + Math.sin(x * 1.3 + y) * 0.1 ? 1 : 0;
    return { sol, g: E.grid(10, 10, 0), rows: sol.map(this.clue), cols: sol[0].map((_, x) => this.clue(sol.map((r) => r[x]))), mode: 1, t: 0 };
  },
  clue(arr) { const r = []; let n = 0; for (const v of arr) { if (v === 1) n++; else if (n) { r.push(n); n = 0; } } if (n) r.push(n); return r.length ? r : [0]; },
  X: 300, Y: 90, S: 34,
  update(s, inp, dt) {
    s.t += dt;
    for (const t of inp[0].taps) {
      if (E.inRect(t, 90, 330, 120, 50)) { s.mode = s.mode === 1 ? 2 : 1; continue; }
      const x = Math.floor((t.x - this.X) / this.S), y = Math.floor((t.y - this.Y) / this.S);
      if (x < 0 || y < 0 || x > 9 || y > 9) continue;
      const m = inp[0].b ? 2 : s.mode;
      s.g[y][x] = s.g[y][x] === m ? 0 : m; E.sfx("click");
    }
    // any grid that satisfies every clue counts, even if it differs from the generated picture
    const same = (a, b) => a.join() === b.join();
    if (s.g.every((row, y) => same(this.clue(row), s.rows[y])) && s.cols.every((cl, x) => same(this.clue(s.g.map((r) => r[x])), cl))) { s.over = true; s.score = Math.round(s.t); s.overText = `Solved in ${Math.round(s.t)}s!`; E.sfx("win"); }
  },
  draw(c, s) {
    E.clear(c, "#fafaf9");
    s.rows.forEach((r, y) => E.text(c, r.join(" "), this.X - 8, this.Y + y * this.S + 18, 15, "#44403c", "right"));
    s.cols.forEach((col, x) => col.forEach((n, i) => E.text(c, n, this.X + x * this.S + 17, this.Y - 10 - (col.length - 1 - i) * 16, 14, "#44403c")));
    for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) {
      const px = this.X + x * this.S, py = this.Y + y * this.S, v = s.g[y][x];
      E.rect(c, px, py, this.S - 1, this.S - 1, v === 1 ? "#1c1917" : "#fff");
      if (v === 2) E.text(c, "✖", px + 17, py + 18, 16, "#a8a29e");
    }
    for (let k = 0; k <= 10; k += 5) { E.line(c, this.X + k * this.S, this.Y, this.X + k * this.S, this.Y + 340, "#57534e", 2); E.line(c, this.X, this.Y + k * this.S, this.X + 340, this.Y + k * this.S, "#57534e", 2); }
    E.rrect(c, 90, 330, 120, 50, 10, s.mode === 1 ? "#1c1917" : "#d6d3d1"); E.text(c, s.mode === 1 ? "■ Fill" : "✖ Mark", 150, 355, 18, s.mode === 1 ? "#fff" : "#1c1917");
    E.text(c, `${Math.floor(s.t)}s`, 150, 300, 18, "#57534e");
  },
});
