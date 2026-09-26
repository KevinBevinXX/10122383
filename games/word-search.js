// Word search: find the hidden words. Drag across letters.
GAME({
  title: "Word Search",
  players: 1, touch: "pointer", lowScore: true,
  controls: "Drag across a word (any direction, including diagonal) to mark it. Find them all.",
  THEMES: {
    Animals: "TIGER ZEBRA HORSE MOUSE SHARK WHALE EAGLE SNAKE KOALA OTTER PANDA RABBIT MONKEY TURTLE PARROT BEAVER",
    Food: "PIZZA PASTA BREAD APPLE MANGO LEMON GRAPE ONION BACON SALAD TACO BURGER COOKIE CHEESE NOODLE WAFFLE",
    Space: "COMET ORBIT MOON STAR SUN PLANET ROCKET GALAXY METEOR SATURN VENUS MARS ALIEN NEBULA LUNAR SOLAR",
    Sports: "GOLF POLO SKI SURF DIVE SWIM RUN TENNIS SOCCER HOCKEY RUGBY BOXING KARATE CHESS DARTS ROWING",
  },
  N: 12, S: 34, X: 60, Y: 20,
  init() {
    const theme = E.pick(Object.keys(this.THEMES)), words = E.shuffle(this.THEMES[theme].split(" ")).slice(0, 8);
    const g = E.grid(this.N, this.N, ""), placed = [];
    const dirs = [[1, 0], [0, 1], [1, 1], [-1, 1], [-1, 0], [0, -1], [-1, -1], [1, -1]];
    for (const w of words) {
      for (let tries = 0; tries < 200; tries++) {
        const [dx, dy] = E.pick(dirs), x = E.randi(0, this.N - 1), y = E.randi(0, this.N - 1);
        const cells = [...w].map((_, i) => [x + dx * i, y + dy * i]);
        if (cells.every(([a, b], i) => a >= 0 && b >= 0 && a < this.N && b < this.N && (g[b][a] === "" || g[b][a] === w[i]))) { cells.forEach(([a, b], i) => (g[b][a] = w[i])); placed.push({ w, cells, found: false }); break; }
      }
    }
    for (let y = 0; y < this.N; y++) for (let x = 0; x < this.N; x++) if (!g[y][x]) g[y][x] = String.fromCharCode(65 + E.randi(0, 25));
    return { g, words: placed, theme, start: null, cur: null, t: 0 };
  },
  cell(p) { const x = Math.floor((p.x - this.X) / this.S), y = Math.floor((p.y - this.Y) / this.S); return x >= 0 && y >= 0 && x < this.N && y < this.N ? [x, y] : null; },
  line(a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], n = Math.max(Math.abs(dx), Math.abs(dy));
    if (!(dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy))) return null;
    return Array.from({ length: n + 1 }, (_, i) => [a[0] + Math.sign(dx) * i, a[1] + Math.sign(dy) * i]);
  },
  update(s, inp, dt) {
    const k = inp[0]; s.t += dt;
    for (const t of k.taps) s.start = this.cell(t);
    if (s.start && k.pdown) { const c = this.cell({ x: k.px, y: k.py }); if (c) s.cur = c; }
    if (s.start && !k.pdown) {
      const ln = s.cur && this.line(s.start, s.cur);
      if (ln) {
        const str = ln.map(([x, y]) => s.g[y][x]).join("");
        const hit = s.words.find((w) => !w.found && (w.w === str || w.w === [...str].reverse().join("")) && w.cells.length === ln.length);
        if (hit) { hit.found = true; hit.cells = ln; E.sfx("coin"); if (s.words.every((w) => w.found)) { s.over = true; s.score = Math.round(s.t); s.overText = `All found in ${Math.round(s.t)}s!`; E.sfx("win"); } }
      }
      s.start = s.cur = null;
    }
  },
  draw(c, s) {
    E.clear(c, "#f0f9ff");
    const cols = ["#fca5a5", "#fdba74", "#fde047", "#86efac", "#67e8f9", "#a5b4fc", "#f0abfc", "#fda4af"];
    const band = (cells, col) => { const [a, b] = [cells[0], cells[cells.length - 1]]; c.strokeStyle = col; c.lineWidth = 26; c.lineCap = "round"; c.beginPath(); c.moveTo(this.X + a[0] * this.S + 17, this.Y + a[1] * this.S + 17); c.lineTo(this.X + b[0] * this.S + 17, this.Y + b[1] * this.S + 17); c.stroke(); };
    s.words.forEach((w, i) => w.found && band(w.cells, cols[i % 8]));
    if (s.start && s.cur) { const ln = this.line(s.start, s.cur); if (ln) band(ln, "rgba(59,130,246,.35)"); }
    for (let y = 0; y < this.N; y++) for (let x = 0; x < this.N; x++) E.text(c, s.g[y][x], this.X + x * this.S + 17, this.Y + y * this.S + 18, 20, "#0f172a");
    E.text(c, s.theme, 620, 40, 24, "#0369a1");
    s.words.forEach((w, i) => { E.text(c, w.w, 620, 85 + i * 36, 20, w.found ? "#94a3b8" : "#0f172a"); if (w.found) E.line(c, 620 - w.w.length * 7, 85 + i * 36, 620 + w.w.length * 7, 85 + i * 36, "#94a3b8", 2); });
    E.text(c, `${Math.floor(s.t)}s`, 620, 420, 16, "#64748b");
  },
});
