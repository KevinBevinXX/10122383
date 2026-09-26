// Sudoku with a generator. Tap a cell, then a number.
GAME({
  title: "Sudoku",
  players: 1, touch: "pointer", lowScore: true,
  controls: "Tap a cell, then tap a number (or type 1–9, Backspace to clear). Arrows move the selection. Mistakes turn red.",
  init() {
    const sol = this.solve(Array(81).fill(0), true);
    const puz = sol.slice();
    const cells = E.shuffle([...Array(81).keys()]);
    let removed = 0;
    for (const i of cells) {
      if (removed >= 48) break;
      const keep = puz[i]; puz[i] = 0;
      if (this.count(puz.slice(), 0) !== 1) puz[i] = keep; else removed++;
    }
    return { sol, puz, cur: puz.slice(), sel: 40, t: 0, mistakes: 0 };
  },
  ok(b, i, v) { const r = Math.floor(i / 9), c = i % 9, br = r - (r % 3), bc = c - (c % 3); for (let k = 0; k < 9; k++) if (b[r * 9 + k] === v || b[k * 9 + c] === v || b[(br + Math.floor(k / 3)) * 9 + bc + (k % 3)] === v) return false; return true; },
  solve(b, rand) {
    const i = b.indexOf(0); if (i < 0) return b;
    for (const v of rand ? E.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]) : [1, 2, 3, 4, 5, 6, 7, 8, 9]) if (this.ok(b, i, v)) { b[i] = v; if (this.solve(b, rand)) return b; b[i] = 0; }
    return null;
  },
  count(b, n) {
    const i = b.indexOf(0); if (i < 0) return n + 1;
    for (let v = 1; v <= 9; v++) if (this.ok(b, i, v)) { b[i] = v; n = this.count(b, n); b[i] = 0; if (n > 1) return n; }
    return n;
  },
  X: 175, Y: 15, S: 46,
  update(s, inp, dt) {
    const k = inp[0];
    s.t += dt;
    if (k.pl) s.sel = s.sel % 9 ? s.sel - 1 : s.sel; if (k.pr) s.sel = s.sel % 9 < 8 ? s.sel + 1 : s.sel;
    if (k.pu && s.sel >= 9) s.sel -= 9; if (k.pd && s.sel < 72) s.sel += 9;
    const put = (v) => { if (s.puz[s.sel]) return; s.cur[s.sel] = v; if (v && v !== s.sol[s.sel]) { s.mistakes++; E.sfx("lose"); } else E.sfx("click"); };
    for (const t of k.taps) {
      const c = Math.floor((t.x - this.X) / this.S), r = Math.floor((t.y - this.Y) / this.S);
      if (c >= 0 && c < 9 && r >= 0 && r < 9) s.sel = r * 9 + c;
      for (let v = 1; v <= 9; v++) if (E.inRect(t, 620 + ((v - 1) % 3) * 58, 110 + Math.floor((v - 1) / 3) * 58, 52, 52)) put(v);
      if (E.inRect(t, 620, 290, 168, 44)) put(0);
    }
    for (const key of k.keys) { if (/^[1-9]$/.test(key)) put(+key); if (key === "Backspace" || key === "0") put(0); }
    if (s.cur.every((v, i) => v === s.sol[i])) { s.over = true; s.score = Math.round(s.t); s.overText = `Solved in ${Math.floor(s.t / 60)}:${String(Math.floor(s.t % 60)).padStart(2, "0")} with ${s.mistakes} mistakes`; E.sfx("win"); }
  },
  draw(c, s) {
    E.clear(c, "#f8fafc");
    const sr = Math.floor(s.sel / 9), sc = s.sel % 9, sv = s.cur[s.sel];
    for (let i = 0; i < 81; i++) {
      const r = Math.floor(i / 9), col = i % 9, x = this.X + col * this.S, y = this.Y + r * this.S;
      const rel = r === sr || col === sc || (Math.floor(r / 3) === Math.floor(sr / 3) && Math.floor(col / 3) === Math.floor(sc / 3));
      E.rect(c, x, y, this.S, this.S, i === s.sel ? "#bfdbfe" : sv && s.cur[i] === sv ? "#dbeafe" : rel ? "#eef2ff" : "#fff");
      const v = s.cur[i];
      if (v) E.text(c, v, x + 23, y + 25, 24, s.puz[i] ? "#111827" : v === s.sol[i] ? "#2563eb" : "#dc2626");
    }
    for (let k = 0; k <= 9; k++) { const w = k % 3 ? 1 : 3; E.line(c, this.X + k * this.S, this.Y, this.X + k * this.S, this.Y + 9 * this.S, "#334155", w); E.line(c, this.X, this.Y + k * this.S, this.X + 9 * this.S, this.Y + k * this.S, "#334155", w); }
    for (let v = 1; v <= 9; v++) { const x = 620 + ((v - 1) % 3) * 58, y = 110 + Math.floor((v - 1) / 3) * 58; E.rrect(c, x, y, 52, 52, 8, "#e0e7ff"); E.text(c, v, x + 26, y + 27, 24, "#3730a3"); }
    E.rrect(c, 620, 290, 168, 44, 8, "#fee2e2"); E.text(c, "Erase", 704, 312, 18, "#991b1b");
    E.text(c, `⏱ ${Math.floor(s.t / 60)}:${String(Math.floor(s.t % 60)).padStart(2, "0")}`, 704, 60, 20, "#334155");
    E.text(c, `Mistakes: ${s.mistakes}`, 90, 60, 16, "#334155");
  },
});
