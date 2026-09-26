// SameGame: pop groups of 2+ same-coloured blocks. Bigger groups score way more.
GAME({
  title: "Block Pop",
  players: 1, touch: "pointer",
  controls: "Tap a group of 2 or more touching blocks of the same colour. Blocks fall down and columns slide left. Big groups score (n−2)².",
  W: 16, H: 10, S: 38,
  COLS: ["#f43f5e", "#3b82f6", "#22c55e", "#facc15"],
  init() { return { g: Array.from({ length: 16 }, () => Array.from({ length: 10 }, () => E.randi(0, 3))), score: 0 }; },
  group(s, x, y) {
    const col = s.g[x] && s.g[x][y]; if (col === undefined || col < 0) return [];
    const out = [[x, y]], seen = new Set([x + "," + y]);
    for (let i = 0; i < out.length; i++) { const [a, b] = out[i]; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = a + dx, ny = b + dy; if (s.g[nx] && s.g[nx][ny] === col && !seen.has(nx + "," + ny)) { seen.add(nx + "," + ny); out.push([nx, ny]); } } }
    return out;
  },
  update(s, inp) {
    for (const t of inp[0].taps) {
      const x = Math.floor((t.x - 96) / this.S), y = this.H - 1 - Math.floor((t.y - 40) / this.S);
      const grp = this.group(s, x, y);
      if (grp.length < 2) { E.sfx("hit"); continue; }
      grp.forEach(([a, b]) => (s.g[a][b] = -1));
      s.g = s.g.map((col) => col.filter((v) => v >= 0)).filter((col) => col.length);
      s.score += (grp.length - 2) ** 2 + grp.length; E.sfx(grp.length > 6 ? "coin" : "pop");
      let moves = false;
      for (let a = 0; a < s.g.length && !moves; a++) for (let b = 0; b < s.g[a].length && !moves; b++) if (this.group(s, a, b).length > 1) moves = true;
      if (!moves) { if (!s.g.length) s.score += 1000; s.over = true; s.overText = s.g.length ? `No moves left · ${s.g.flat().length} blocks remain` : "Board cleared! +1000"; }
    }
  },
  draw(c, s) {
    E.clear(c, "#0f172a");
    s.g.forEach((col, x) => col.forEach((v, y) => E.rrect(c, 96 + x * this.S + 2, 40 + (this.H - 1 - y) * this.S + 2, this.S - 4, this.S - 4, 7, this.COLS[v])));
    E.text(c, `Score ${s.score}`, 400, 20, 18);
  },
});
