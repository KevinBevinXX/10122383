// Rush-hour style: slide cars to let the red car out.
GAME({
  title: "Unblock",
  players: 1, touch: "pointer", lowScore: true,
  controls: "Drag a car along its direction (or tap it, then use arrows). Get the red car out the exit on the right.",
  // each level: cars as [x, y, len, horizontal]; car 0 is the red car on row 2
  LEVELS: [
    [[0, 2, 2, 1], [5, 3, 2, 0], [3, 2, 3, 0], [2, 1, 2, 0], [0, 1, 2, 1], [4, 1, 2, 0]],
    [[1, 2, 2, 1], [1, 1, 2, 1], [4, 0, 3, 0], [5, 4, 2, 0], [5, 1, 2, 0], [0, 3, 3, 1], [2, 5, 3, 1], [1, 4, 2, 0]],
    [[1, 2, 2, 1], [3, 4, 3, 1], [1, 1, 2, 1], [0, 1, 2, 0], [2, 3, 2, 1], [3, 0, 3, 0], [2, 4, 2, 0], [4, 1, 2, 1], [5, 2, 2, 0], [0, 0, 3, 1]],
    [[0, 2, 2, 1], [3, 4, 2, 1], [1, 0, 3, 1], [3, 3, 2, 1], [2, 4, 2, 0], [4, 5, 2, 1], [5, 1, 2, 0], [1, 4, 2, 0], [2, 1, 2, 1], [2, 2, 2, 0], [4, 0, 2, 0]],
  ],
  init() { const s = { lv: 0, moves: 0, total: 0 }; this.load(s); return s; },
  load(s) { s.cars = this.LEVELS[s.lv].map(([x, y, len, h]) => ({ x, y, len, h: !!h })); s.sel = -1; s.drag = null; s.moves = 0; },
  occ(s, skip) { const g = E.grid(6, 6, false); s.cars.forEach((c, i) => { if (i === skip) return; for (let k = 0; k < c.len; k++) g[c.y + (c.h ? 0 : k)][c.x + (c.h ? k : 0)] = true; }); return g; },
  step(s, i, d) {
    const c = s.cars[i], g = this.occ(s, i), nx = c.x + (c.h ? d : 0), ny = c.y + (c.h ? 0 : d);
    if (i === 0 && c.h && nx + c.len > 6) { s.moves++; return "exit"; }
    for (let k = 0; k < c.len; k++) { const x = nx + (c.h ? k : 0), y = ny + (c.h ? 0 : k); if (x < 0 || y < 0 || x > 5 || y > 5 || g[y][x]) return false; }
    c.x = nx; c.y = ny; return true;
  },
  X: 250, Y: 25, S: 66,
  update(s, inp) {
    const k = inp[0];
    const cellAt = (p) => [Math.floor((p.x - this.X) / this.S), Math.floor((p.y - this.Y) / this.S)];
    for (const t of k.taps) {
      const [x, y] = cellAt(t);
      s.sel = s.cars.findIndex((c) => x >= c.x && y >= c.y && x < c.x + (c.h ? c.len : 1) && y < c.y + (c.h ? 1 : c.len));
      s.drag = s.sel >= 0 ? { x: t.x, y: t.y, moved: false } : null;
    }
    let res = null;
    if (s.drag && k.pdown && s.sel >= 0) {
      const c = s.cars[s.sel], delta = c.h ? k.px - s.drag.x : k.py - s.drag.y;
      if (Math.abs(delta) > this.S * 0.6) { const d = Math.sign(delta); res = this.step(s, s.sel, d); if (res) { if (c.h) s.drag.x += d * this.S; else s.drag.y += d * this.S; if (!s.drag.moved) { s.moves++; s.drag.moved = true; } E.sfx("click"); } }
    }
    if (!k.pdown && s.drag) s.drag = null;
    if (s.sel >= 0) { const c = s.cars[s.sel], d = c.h ? (k.pr ? 1 : k.pl ? -1 : 0) : k.pd ? 1 : k.pu ? -1 : 0; if (d) { res = this.step(s, s.sel, d); if (res) { s.moves++; E.sfx("click"); } } }
    if (res === "exit") {
      s.total += s.moves; E.sfx("win"); s.lv++;
      if (s.lv >= this.LEVELS.length) { s.over = true; s.score = s.total; s.overText = `All ${this.LEVELS.length} puzzles cleared in ${s.total} moves!`; return; }
      this.load(s);
    }
  },
  draw(c, s) {
    E.clear(c, "#1f2937");
    E.rrect(c, this.X - 8, this.Y - 8, 6 * this.S + 16, 6 * this.S + 16, 12, "#374151");
    E.rect(c, this.X + 6 * this.S + 6, this.Y + 2 * this.S + 6, 20, this.S - 12, "#22c55e");
    for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) E.rect(c, this.X + x * this.S + 2, this.Y + y * this.S + 2, this.S - 4, this.S - 4, "#4b5563");
    const cols = ["#dc2626", "#3b82f6", "#eab308", "#a855f7", "#14b8a6", "#f97316", "#84cc16", "#ec4899", "#6366f1"];
    s.cars.forEach((car, i) => {
      const w = car.h ? car.len * this.S : this.S, h = car.h ? this.S : car.len * this.S;
      E.rrect(c, this.X + car.x * this.S + 5, this.Y + car.y * this.S + 5, w - 10, h - 10, 10, cols[i % cols.length]);
      if (i === s.sel) { c.strokeStyle = "#fff"; c.lineWidth = 3; c.strokeRect(this.X + car.x * this.S + 5, this.Y + car.y * this.S + 5, w - 10, h - 10); }
    });
    E.text(c, `Puzzle ${s.lv + 1}/${this.LEVELS.length}`, 125, 180, 20); E.text(c, `Moves ${s.moves}`, 125, 215, 16, "#9ca3af");
  },
});
