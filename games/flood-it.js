// Flood-It: change the top-left region's colour to flood the whole board in 25 moves.
GAME({
  title: "Flood It",
  players: 1, touch: "pointer", lowScore: true,
  controls: "Tap a colour (or a cell of that colour). The flood from the top-left corner takes that colour and grows. Fill the board in 25 moves.",
  COLS: ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316"],
  N: 14,
  init() { return { g: Array.from({ length: 14 }, () => Array.from({ length: 14 }, () => E.randi(0, 5))), moves: 0 }; },
  flood(s, col) {
    const old = s.g[0][0]; if (old === col) return false;
    const q = [[0, 0]], seen = new Set(["0,0"]);
    while (q.length) { const [x, y] = q.pop(); s.g[y][x] = col; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = x + dx, b = y + dy; if (a >= 0 && b >= 0 && a < 14 && b < 14 && !seen.has(a + "," + b) && s.g[b][a] === old) { seen.add(a + "," + b); q.push([a, b]); } } }
    return true;
  },
  update(s, inp) {
    for (const t of inp[0].taps) {
      let col = -1;
      this.COLS.forEach((_, i) => { if (E.dist(t.x, t.y, 650 + (i % 2) * 70, 130 + Math.floor(i / 2) * 70) < 28) col = i; });
      const x = Math.floor((t.x - 170) / 29), y = Math.floor((t.y - 20) / 29);
      if (col < 0 && x >= 0 && y >= 0 && x < 14 && y < 14) col = s.g[y][x];
      if (col >= 0 && this.flood(s, col)) {
        s.moves++; E.sfx("pop");
        if (s.g.every((r) => r.every((v) => v === col))) { s.over = true; s.score = s.moves; s.overText = `Flooded in ${s.moves} moves!`; E.sfx("win"); }
        else if (s.moves >= 25) { s.over = true; s.lost = true; s.overText = "Out of moves!"; E.sfx("lose"); }
      }
    }
  },
  draw(c, s) {
    E.clear(c, "#1e293b");
    for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) E.rect(c, 170 + x * 29, 20 + y * 29, 29, 29, this.COLS[s.g[y][x]]);
    this.COLS.forEach((col, i) => E.circle(c, 650 + (i % 2) * 70, 130 + Math.floor(i / 2) * 70, 28, col));
    E.text(c, `${s.moves} / 25`, 685, 70, 26);
  },
});
