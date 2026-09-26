// Leave a wall behind you. Don't crash into any wall.
GAME({
  title: "Light Cycles",
  players: 2,
  controls: "Turn with ◀ ▲ ▼ ▶. Don't hit a trail. First to 3 rounds.",
  touch: "pad", aLabel: "·", bLabel: false,
  CW: 80, CH: 45,
  init() { return { ...this.round(), wins: [0, 0] }; },
  round() {
    const g = E.grid(this.CW, this.CH, 0);
    return { g, c: [{ x: 10, y: 22, dx: 1, dy: 0, nd: [1, 0] }, { x: 69, y: 22, dx: -1, dy: 0, nd: [-1, 0] }], acc: 0, wait: 1 };
  },
  update(s, inp, dt) {
    s.c.forEach((c, i) => {
      const k = inp[i];
      const want = k.up ? [0, -1] : k.down ? [0, 1] : k.left ? [-1, 0] : k.right ? [1, 0] : null;
      if (want && !(want[0] === -c.dx && want[1] === -c.dy)) c.nd = want;
    });
    if (s.wait > 0) { s.wait -= dt; return; }
    s.acc += dt;
    if (s.acc < 0.055) return;
    s.acc = 0;
    const dead = [false, false];
    s.c.forEach((c, i) => {
      [c.dx, c.dy] = c.nd;
      s.g[c.y][c.x] = i + 1;
      c.x += c.dx; c.y += c.dy;
      if (c.x < 0 || c.y < 0 || c.x >= this.CW || c.y >= this.CH || s.g[c.y][c.x]) dead[i] = true;
    });
    if (s.c[0].x === s.c[1].x && s.c[0].y === s.c[1].y) dead[0] = dead[1] = true;
    if (dead[0] || dead[1]) {
      E.sfx("boom");
      if (dead[0] !== dead[1]) s.wins[dead[0] ? 1 : 0]++;
      const w = s.wins.findIndex((v) => v >= 3);
      if (w >= 0) { s.over = true; s.winner = w; return; }
      Object.assign(s, this.round());
    }
  },
  ai(s, i) {
    const c = s.c[i];
    const free = (x, y) => x >= 0 && y >= 0 && x < this.CW && y < this.CH && !s.g[y][x];
    const room = (dx, dy) => { let n = 0, x = c.x, y = c.y; while (n < 12 && free((x += dx), (y += dy))) n++; return n; };
    const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => !(dx === -c.dx && dy === -c.dy));
    opts.sort((a, b) => room(...b) - room(...a) + (Math.random() - 0.5) * 2);
    if (room(c.dx, c.dy) > 6 && Math.random() < 0.9) return {};
    const [dx, dy] = opts[0];
    return { right: dx > 0, left: dx < 0, down: dy > 0, up: dy < 0 };
  },
  draw(c, s) {
    E.clear(c, "#050814");
    c.strokeStyle = "#0d1a33"; c.lineWidth = 1;
    for (let x = 0; x <= 800; x += 40) E.line(c, x, 0, x, 450, "#0d1a33", 1);
    for (let y = 0; y <= 450; y += 40) E.line(c, 0, y, 800, y, "#0d1a33", 1);
    const cols = ["#00e5ff", "#ff9100"];
    for (let y = 0; y < this.CH; y++) for (let x = 0; x < this.CW; x++) if (s.g[y][x]) E.rect(c, x * 10, y * 10, 10, 10, cols[s.g[y][x] - 1]);
    s.c.forEach((cy, i) => { E.rect(c, cy.x * 10 - 2, cy.y * 10 - 2, 14, 14, "#fff"); });
    E.text(c, `${E.name(0)} ${s.wins[0]} — ${s.wins[1]} ${E.name(1)}`, 400, 20, 18);
  },
});
