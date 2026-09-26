// Rotate pipe tiles until water flows from the tap to every pipe.
GAME({
  title: "Pipe Connect",
  players: 1, touch: "pointer", lowScore: true,
  controls: "Tap a tile to rotate it. Connect every pipe to the water source in the middle so the whole network lights up.",
  init() { const s = { lvl: 1, moves: 0, total: 0 }; this.gen(s); return s; },
  // connections as bitmask: 1 up, 2 right, 4 down, 8 left
  gen(s) {
    const N = 4 + s.lvl, g = E.grid(N, N, 0), seen = E.grid(N, N, false), c = Math.floor(N / 2), st = [[c, c]];
    seen[c][c] = true;
    const D = [[0, -1, 1, 4], [1, 0, 2, 8], [0, 1, 4, 1], [-1, 0, 8, 2]];
    while (st.length) {
      const i = E.randi(0, st.length - 1), [x, y] = st[i];
      const opts = D.filter(([dx, dy]) => x + dx >= 0 && y + dy >= 0 && x + dx < N && y + dy < N && !seen[y + dy][x + dx]);
      if (!opts.length) { st.splice(i, 1); continue; }
      const [dx, dy, a, b] = E.pick(opts);
      g[y][x] |= a; g[y + dy][x + dx] |= b; seen[y + dy][x + dx] = true; st.push([x + dx, y + dy]);
    }
    s.N = N; s.src = [c, c]; s.moves = 0;
    s.g = g.map((row) => row.map((v) => { let r = v; for (let k = E.randi(0, 3); k > 0; k--) r = this.rot(r); return r; }));
  },
  rot(v) { return ((v << 1) | (v >> 3)) & 15; },
  lit(s) {
    const L = E.grid(s.N, s.N, false), q = [s.src]; L[s.src[1]][s.src[0]] = true;
    const D = [[0, -1, 1, 4], [1, 0, 2, 8], [0, 1, 4, 1], [-1, 0, 8, 2]];
    while (q.length) { const [x, y] = q.pop(); for (const [dx, dy, a, b] of D) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < s.N && ny < s.N && !L[ny][nx] && s.g[y][x] & a && s.g[ny][nx] & b) { L[ny][nx] = true; q.push([nx, ny]); } } }
    return L;
  },
  update(s, inp) {
    const T = Math.min(60, 400 / s.N), ox = 400 - (s.N * T) / 2, oy = 225 - (s.N * T) / 2 + 10;
    for (const t of inp[0].taps) {
      const x = Math.floor((t.x - ox) / T), y = Math.floor((t.y - oy) / T);
      if (x < 0 || y < 0 || x >= s.N || y >= s.N) continue;
      s.g[y][x] = this.rot(s.g[y][x]); s.moves++; E.sfx("click");
      if (this.lit(s).every((r) => r.every(Boolean))) {
        s.total += s.moves; E.sfx("win");
        if (s.lvl >= 4) { s.over = true; s.score = s.total; s.overText = `All connected in ${s.total} taps!`; return; }
        s.lvl++; this.gen(s);
      }
    }
  },
  draw(c, s) {
    E.clear(c, "#0c4a6e");
    const T = Math.min(60, 400 / s.N), ox = 400 - (s.N * T) / 2, oy = 225 - (s.N * T) / 2 + 10, L = this.lit(s);
    for (let y = 0; y < s.N; y++) for (let x = 0; x < s.N; x++) {
      const px = ox + x * T, py = oy + y * T, v = s.g[y][x], col = L[y][x] ? "#38bdf8" : "#64748b";
      E.rrect(c, px + 2, py + 2, T - 4, T - 4, 6, "#082f49");
      const cx = px + T / 2, cy = py + T / 2;
      [[1, 0, -1], [2, 1, 0], [4, 0, 1], [8, -1, 0]].forEach(([b, dx, dy]) => { if (v & b) E.line(c, cx, cy, cx + (dx * T) / 2, cy + (dy * T) / 2, col, T * 0.22); });
      E.circle(c, cx, cy, T * 0.13, col);
      if (x === s.src[0] && y === s.src[1]) E.circle(c, cx, cy, T * 0.22, "#fde047");
    }
    E.text(c, `Level ${s.lvl}/4   Taps ${s.moves}`, 400, 18, 16);
  },
});
