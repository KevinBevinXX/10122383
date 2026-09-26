// Top-down racing. 3 laps around the track.
GAME({
  title: "Turbo Laps",
  players: 2,
  controls: "▲ accelerate · ▼ brake/reverse · ◀ ▶ steer. 3 laps. Grass slows you down.",
  aLabel: "Gas", bLabel: "Brake",
  // track centreline (closed loop)
  PATH: [[120, 110], [400, 70], [680, 110], [740, 225], [680, 340], [520, 370], [400, 280], [280, 370], [120, 340], [60, 225]],
  W: 46,
  init() {
    const [x0, y0] = this.PATH[0], [x1, y1] = this.PATH[1], a = Math.atan2(y1 - y0, x1 - x0);
    const car = (off) => ({ x: x0 + Math.cos(a + Math.PI / 2) * off, y: y0 + Math.sin(a + Math.PI / 2) * off, a, v: 0, seg: 0, lap: 0, done: false });
    return { cars: [car(-16), car(16)], go: 2.5, t: 0 };
  },
  near(x, y) {
    let best = { d: Infinity, seg: 0, f: 0 };
    const P = this.PATH;
    for (let i = 0; i < P.length; i++) {
      const [ax, ay] = P[i], [bx, by] = P[(i + 1) % P.length], dx = bx - ax, dy = by - ay;
      const f = E.clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy), 0, 1), d = E.dist(x, y, ax + dx * f, ay + dy * f);
      if (d < best.d) best = { d, seg: i, f };
    }
    return best;
  },
  update(s, inp, dt) {
    if (s.go > 0) { s.go -= dt; return; }
    s.t += dt;
    s.cars.forEach((c, i) => {
      if (c.done) { c.v *= 0.95; }
      const k = c.done ? {} : inp[i];
      const n = this.near(c.x, c.y), grass = n.d > this.W;
      const max = grass ? 110 : 290;
      if (k.up || k.a) c.v += 260 * dt; else if (k.down || k.b) c.v -= 380 * dt; else c.v *= 0.99;
      c.v = E.clamp(c.v, -90, max); if (grass && c.v > max) c.v *= 0.95;
      c.a += ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 2.8 * dt * E.clamp(c.v / 150, -1, 1);
      c.x = E.clamp(c.x + Math.cos(c.a) * c.v * dt, 10, 790); c.y = E.clamp(c.y + Math.sin(c.a) * c.v * dt, 10, 440);
      // lap tracking: must pass segments in order
      const L = this.PATH.length;
      if (n.seg === (c.seg + 1) % L) { c.seg = n.seg; if (c.seg === 0) { c.lap++; E.sfx("coin"); if (c.lap >= 3 && !c.done) { c.done = true; c.place = s.cars.filter((o) => o.done).length; } } }
    });
    const [a, b] = s.cars, d = E.dist(a.x, a.y, b.x, b.y);
    if (d < 22 && d > 0) { const nx = (b.x - a.x) / d, ny = (b.y - a.y) / d, p = (22 - d) / 2; a.x -= nx * p; a.y -= ny * p; b.x += nx * p; b.y += ny * p; a.v *= 0.9; b.v *= 0.9; E.sfx("pop"); }
    const fin = s.cars.findIndex((c) => c.done && c.place === 1);
    if (fin >= 0 && (s.cars.every((c) => c.done) || (s.finT = (s.finT || 0) + dt) > 3)) { s.over = true; s.winner = fin; }
    if (E.mode() === "solo" && !E.cpu() && s.cars[0].done) { s.over = true; s.score = Math.round(s.t * 10) / 10; }
  },
  ai(s, i) {
    const c = s.cars[i], n = this.near(c.x, c.y), L = this.PATH.length;
    const t = this.PATH[(n.seg + 1 + (n.f > 0.6 ? 1 : 0)) % L];
    const want = Math.atan2(t[1] - c.y, t[0] - c.x), d = Math.atan2(Math.sin(want - c.a), Math.cos(want - c.a));
    return { left: d < -0.08, right: d > 0.08, up: Math.abs(d) < 0.9 || c.v < 80, down: Math.abs(d) > 1.2 && c.v > 150 };
  },
  draw(c, s) {
    E.clear(c, "#4caf50");
    for (let i = 0; i < 60; i++) E.circle(c, (i * 137) % 800, (i * 71) % 450, 3, "#43a047");
    c.lineJoin = "round"; c.lineCap = "round";
    const loop = (w, col) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); this.PATH.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.stroke(); };
    loop(this.W * 2 + 10, "#e53935"); loop(this.W * 2 + 4, "#fff"); loop(this.W * 2, "#555");
    c.setLineDash([14, 14]); loop(2, "#ddd"); c.setLineDash([]);
    const [x0, y0] = this.PATH[0];
    for (let k = -3; k < 3; k++) E.rect(c, x0 - 3, y0 + k * 15, 6, 15, k % 2 ? "#fff" : "#111");
    const cols = ["#2196f3", "#ff9800"];
    s.cars.forEach((car, i) => {
      c.save(); c.translate(car.x, car.y); c.rotate(car.a);
      E.rrect(c, -13, -8, 26, 16, 4, cols[i]); E.rect(c, 2, -6, 6, 12, "#222"); E.rect(c, -12, -9, 6, 3, "#111"); E.rect(c, -12, 6, 6, 3, "#111"); E.rect(c, 6, -9, 6, 3, "#111"); E.rect(c, 6, 6, 6, 3, "#111");
      c.restore();
    });
    const two = E.mode() !== "solo" || E.cpu();
    E.text(c, `${E.name(0)}: lap ${Math.min(3, s.cars[0].lap + 1)}/3`, 10, 10, 14, cols[0], "left", "top");
    if (two) E.text(c, `${E.name(1)}: lap ${Math.min(3, s.cars[1].lap + 1)}/3`, 790, 10, 14, cols[1], "right", "top");
    E.text(c, s.t.toFixed(1) + "s", 400, 225, 18);
    if (s.go > 0) E.text(c, Math.ceil(s.go), 400, 180, 60);
  },
});
