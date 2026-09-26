// Eat all the dots, dodge the ghosts. Power pellets let you eat them.
GAME({
  title: "Maze Muncher",
  players: 1,
  controls: "Steer with ◀ ▲ ▼ ▶. Eat every dot. Big dots make ghosts edible for a few seconds.",
  aLabel: "·", bLabel: false,
  MAP: [
    "###################",
    "#o.......#.......o#",
    "#.##.###.#.###.##.#",
    "#.................#",
    "#.##.#.#####.#.##.#",
    "#....#...#...#....#",
    "####.### # ###.####",
    "   #.#   G   #.#   ",
    "####.# ##-## #.####",
    "    .  #GGG#  .    ",
    "####.# ##### #.####",
    "   #.#   P   #.#   ",
    "####.# ##### #.####",
    "#........#........#",
    "#o##.###.#.###.##o#",
    "###################",
  ],
  T: 26, OX: 153, OY: 17,
  init() {
    const dots = [], ghosts = [];
    let pac;
    this.MAP.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === "." || ch === "o") dots.push([x, y, ch === "o" ? 1 : 0]);
      if (ch === "G") ghosts.push({ x, y, px: x, py: y, d: [0, -1], home: [x, y], dead: false });
      if (ch === "P") pac = { x, y, px: x, py: y, d: [0, 0], nd: [-1, 0] };
    }));
    return { dots, ghosts, pac, t: 0, move: 0, fright: 0, score: 0, lives: 3, level: 1 };
  },
  wall(x, y, ghost) { const row = this.MAP[y]; if (!row) return true; x = (x + 19) % 19; const ch = row[x]; return ch === "#" || (ch === "-" && !ghost); },
  update(s, inp, dt) {
    const k = inp[0], p = s.pac;
    const want = k.up ? [0, -1] : k.down ? [0, 1] : k.left ? [-1, 0] : k.right ? [1, 0] : null;
    if (want) p.nd = want;
    s.fright = Math.max(0, s.fright - dt);
    s.move += dt;
    const step = 0.14 - Math.min(0.05, s.level * 0.008);
    if (s.move < step) return;
    s.move = 0; s.t++;
    if (!this.wall(p.x + p.nd[0], p.y + p.nd[1])) p.d = p.nd;
    p.px = p.x; p.py = p.y;
    if (!this.wall(p.x + p.d[0], p.y + p.d[1])) { p.x = (p.x + p.d[0] + 19) % 19; p.y += p.d[1]; }
    const di = s.dots.findIndex(([x, y]) => x === p.x && y === p.y);
    if (di >= 0) { const [, , big] = s.dots[di]; s.dots.splice(di, 1); s.score += big ? 50 : 10; E.sfx(big ? "coin" : "pop"); if (big) { s.fright = 7; s.ghosts.forEach((g) => (g.d = [-g.d[0], -g.d[1]])); } }
    s.ghosts.forEach((g, gi) => {
      if (s.fright && s.t % 2 && !g.dead) return; // frightened ghosts are slower
      const target = g.dead ? g.home : s.fright ? [E.randi(0, 18), E.randi(0, 15)] : gi % 2 ? [p.x + p.d[0] * 4, p.y + p.d[1] * 4] : [p.x, p.y];
      const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => !(dx === -g.d[0] && dy === -g.d[1]) && !this.wall(g.x + dx, g.y + dy, true));
      if (opts.length) { opts.sort((a, b) => E.dist(g.x + a[0], g.y + a[1], ...target) - E.dist(g.x + b[0], g.y + b[1], ...target)); g.d = s.t < 20 + gi * 15 && !g.dead ? [0, 0] : opts[Math.random() < 0.15 ? opts.length - 1 : 0]; }
      else g.d = [-g.d[0], -g.d[1]];
      g.px = g.x; g.py = g.y;
      g.x = (g.x + g.d[0] + 19) % 19; g.y += g.d[1];
      if (g.dead && g.x === g.home[0] && g.y === g.home[1]) g.dead = false;
    });
    for (const g of s.ghosts) {
      const touch = (g.x === p.x && g.y === p.y) || (g.x === p.px && g.y === p.py && g.px === p.x && g.py === p.y);
      if (!touch || g.dead) continue;
      if (s.fright) { g.dead = true; s.score += 200; E.sfx("score"); }
      else {
        s.lives--; E.sfx("lose");
        if (s.lives <= 0) { s.over = true; return; }
        const fresh = this.init(); s.pac = fresh.pac; s.ghosts = fresh.ghosts; s.t = 0; return;
      }
    }
    if (!s.dots.length) { const fresh = this.init(); Object.assign(s, { dots: fresh.dots, ghosts: fresh.ghosts, pac: fresh.pac, t: 0, level: s.level + 1 }); E.sfx("win"); }
  },
  draw(c, s) {
    E.clear(c, "#000");
    const T = this.T, X = this.OX, Y = this.OY;
    this.MAP.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === "#") E.rrect(c, X + x * T + 2, Y + y * T + 2, T - 4, T - 4, 5, "#1e3a8a"); if (ch === "-") E.rect(c, X + x * T, Y + y * T + 11, T, 4, "#f9a8d4"); }));
    s.dots.forEach(([x, y, big]) => E.circle(c, X + x * T + T / 2, Y + y * T + T / 2, big ? 7 : 3, "#fde68a"));
    const p = s.pac, mouth = 0.25 + 0.25 * Math.abs(Math.sin(s.t * 1.5)), ang = Math.atan2(p.d[1], p.d[0]);
    c.fillStyle = "#facc15"; c.beginPath(); c.moveTo(X + p.x * T + T / 2, Y + p.y * T + T / 2); c.arc(X + p.x * T + T / 2, Y + p.y * T + T / 2, T / 2 - 2, ang + mouth, ang + Math.PI * 2 - mouth); c.fill();
    const gc = ["#ef4444", "#f472b6", "#22d3ee", "#fb923c"];
    s.ghosts.forEach((g, i) => {
      const gx = X + g.x * T + T / 2, gy = Y + g.y * T + T / 2;
      if (!g.dead) { const col = s.fright ? (s.fright < 2 && s.t % 2 ? "#fff" : "#3b82f6") : gc[i % 4]; E.circle(c, gx, gy - 2, 11, col); E.rect(c, gx - 11, gy - 2, 22, 12, col); }
      E.circle(c, gx - 4, gy - 3, 3.5, "#fff"); E.circle(c, gx + 4, gy - 3, 3.5, "#fff");
    });
    E.text(c, `Score ${s.score}`, 75, 30, 16); E.text(c, `Level ${s.level}`, 75, 60, 14, "#aaa"); E.text(c, "●".repeat(s.lives), 75, 90, 16, "#facc15");
  },
});
