// Battleship with randomly placed fleets. Sink all enemy ships to win.
GAME({
  title: "Battleship",
  players: 2, touch: "pointer",
  controls: "Tap a square on the enemy grid (right) to fire. Hits let you fire again.",
  SHIPS: [5, 4, 3, 3, 2],
  init() { return { f: [this.fleet(), this.fleet()], shots: [E.grid(10, 10, 0), E.grid(10, 10, 0)], turn: 0, t: 0, done: 0, msg: "" }; },
  fleet() {
    const g = E.grid(10, 10, -1);
    this.SHIPS.forEach((len, id) => {
      for (;;) {
        const h = Math.random() < 0.5, r = E.randi(0, h ? 9 : 10 - len), c = E.randi(0, h ? 10 - len : 9);
        const cells = Array.from({ length: len }, (_, k) => (h ? [r, c + k] : [r + k, c]));
        if (cells.every(([y, x]) => g[y][x] < 0)) { cells.forEach(([y, x]) => (g[y][x] = id)); break; }
      }
    });
    return g;
  },
  // shots[p][r][c]: 0 unknown, 1 miss, 2 hit (shots fired BY player p)
  sunk(s, p, id) { const g = s.f[1 - p]; for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) if (g[r][c] === id && s.shots[p][r][c] !== 2) return false; return true; },
  viewer(s) { return E.mode() === "online" ? E.me() : E.mode() === "local" ? s.turn : 0; },
  update(s, inp, dt) {
    s.t += dt;
    if (s.done) { if ((s.done -= dt) <= 0) s.over = true; return; }
    for (const t of inp[s.turn].taps) {
      const c = Math.floor((t.x - 430) / 34), r = Math.floor((t.y - 70) / 34);
      if (r < 0 || r > 9 || c < 0 || c > 9 || s.shots[s.turn][r][c]) continue;
      const id = s.f[1 - s.turn][r][c];
      s.shots[s.turn][r][c] = id >= 0 ? 2 : 1;
      if (id >= 0) {
        E.sfx("boom");
        s.msg = this.sunk(s, s.turn, id) ? `Sunk a ship of length ${this.SHIPS[id]}!` : "Hit!";
        if (this.SHIPS.every((_, k) => this.sunk(s, s.turn, k))) { s.winner = s.turn; s.done = 1.5; }
      } else { E.sfx("pop"); s.msg = "Miss."; s.turn = 1 - s.turn; }
      s.t = 0; break;
    }
  },
  ai(s, i) {
    if (s.turn !== i || s.t < 0.6 || s.done) return {};
    const sh = s.shots[i], cand = [];
    for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) if (sh[r][c] === 2) {
      const id = s.f[1 - i][r][c];
      if (this.sunk(s, i, id)) continue;
      for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) { const y = r + dr, x = c + dc; if (y >= 0 && y < 10 && x >= 0 && x < 10 && !sh[y][x]) cand.push([y, x]); }
    }
    if (!cand.length) for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) if (!sh[r][c] && (r + c) % 2 === 0) cand.push([r, c]);
    if (!cand.length) for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) if (!sh[r][c]) cand.push([r, c]);
    const [r, c] = E.pick(cand);
    return { taps: [{ x: 430 + c * 34 + 17, y: 70 + r * 34 + 17 }] };
  },
  grid(c, x0, fleet, shots, showShips) {
    for (let r = 0; r < 10; r++) for (let col = 0; col < 10; col++) {
      const x = x0 + col * 34, y = 70 + r * 34, sh = shots[r][col];
      E.rect(c, x, y, 33, 33, "#1565c0");
      if (showShips && fleet[r][col] >= 0) E.rect(c, x + 3, y + 3, 27, 27, "#90a4ae");
      if (sh === 1) E.circle(c, x + 16, y + 16, 5, "#e3f2fd");
      if (sh === 2) { E.circle(c, x + 16, y + 16, 11, "#ff5722"); E.circle(c, x + 16, y + 16, 5, "#ffeb3b"); }
    }
  },
  draw(c, s) {
    E.clear(c, "#0a1929");
    const v = this.viewer(s);
    this.grid(c, 30, s.f[v], s.shots[1 - v], true);
    this.grid(c, 430, s.f[1 - v], s.shots[v], s.done > 0);
    E.text(c, E.name(v) === "You" ? "Your fleet" : `${E.name(v)}'s fleet`, 200, 50, 16, "#90caf9");
    E.text(c, `Enemy waters — fire here`, 600, 50, 16, "#ffab91");
    const hot = E.mode() === "local" && !s.done;
    E.text(c, s.done ? "" : E.turnText(s.turn), 400, 20, 18);
    E.text(c, s.msg + (hot ? "  (pass the device!)" : ""), 400, 430, 15, "#ffe082");
  },
});
