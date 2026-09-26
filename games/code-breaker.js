// Mastermind: guess the secret 4-colour code in 10 tries.
GAME({
  title: "Code Breaker",
  players: 1, touch: "pointer", lowScore: true,
  controls: "Tap colours to fill your guess, then ✔. ● = right colour, right spot · ○ = right colour, wrong spot.",
  COLS: ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316"],
  NAMES: ["red", "blue", "green", "yellow", "purple", "orange"],
  init() { return { code: Array.from({ length: 4 }, () => E.randi(0, 5)), rows: [], cur: [] }; },
  update(s, inp) {
    for (const t of inp[0].taps) {
      this.COLS.forEach((_, i) => { if (E.dist(t.x, t.y, 580 + (i % 3) * 60, 150 + Math.floor(i / 3) * 60) < 25 && s.cur.length < 4) { s.cur.push(i); E.sfx("click"); } });
      if (E.inRect(t, 555, 260, 70, 44) && s.cur.length) s.cur.pop();
      if (E.inRect(t, 635, 260, 70, 44) && s.cur.length === 4) {
        const g = s.cur, black = g.filter((v, i) => v === s.code[i]).length;
        let white = 0; for (let c = 0; c < 6; c++) white += Math.min(g.filter((v) => v === c).length, s.code.filter((v) => v === c).length);
        white -= black;
        s.rows.push({ g, black, white }); s.cur = []; E.sfx(black === 4 ? "win" : "pop");
        if (black === 4) { s.over = true; s.score = s.rows.length; s.overText = `Cracked in ${s.rows.length} tries!`; }
        else if (s.rows.length >= 10) { s.over = true; s.lost = true; s.overText = "Out of tries! The code was " + s.code.map((v) => this.NAMES[v]).join(", "); }
      }
    }
  },
  draw(c, s) {
    E.clear(c, "#44403c");
    E.rrect(c, 150, 10, 330, 430, 12, "#292524");
    for (let r = 0; r < 10; r++) {
      const y = 420 - r * 41, row = s.rows[r], g = row ? row.g : r === s.rows.length ? s.cur : [];
      for (let i = 0; i < 4; i++) E.circle(c, 200 + i * 50, y, 15, g[i] !== undefined ? this.COLS[g[i]] : "#1c1917");
      if (row) for (let p = 0; p < 4; p++) E.circle(c, 420 + (p % 2) * 16, y - 8 + Math.floor(p / 2) * 16, 5, p < row.black ? "#fff" : p < row.black + row.white ? "#a8a29e" : "#1c1917");
    }
    this.COLS.forEach((col, i) => E.circle(c, 580 + (i % 3) * 60, 150 + Math.floor(i / 3) * 60, 24, col));
    E.rrect(c, 555, 260, 70, 44, 8, "#78716c"); E.text(c, "⌫", 590, 282, 20);
    E.rrect(c, 635, 260, 70, 44, 8, s.cur.length === 4 ? "#16a34a" : "#57534e"); E.text(c, "✔", 670, 282, 22);
    E.text(c, `Try ${Math.min(10, s.rows.length + 1)}/10`, 640, 60, 20);
  },
});
