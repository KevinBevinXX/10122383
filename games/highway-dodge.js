// Weave through highway traffic. Speed up for more points.
GAME({
  title: "Highway Dodge",
  players: 1,
  controls: "◀ ▶ steer · ▲ speed up · ▼ slow down (or drag). Near-misses score bonus.",
  aLabel: "Boost", bLabel: false,
  init() { return { x: 400, spd: 300, cars: [], dist: 0, score: 0, next: 0.5, lines: 0 }; },
  LANES: [220, 307, 393, 480, 567],
  update(s, inp, dt) {
    const k = inp[0];
    if (k.pdown) s.x = E.lerp(s.x, k.px, 0.2); else s.x += ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 320 * dt;
    s.x = E.clamp(s.x, 190, 610);
    s.spd = E.clamp(s.spd + ((k.up || k.a ? 1 : 0) - (k.down ? 1 : 0)) * 200 * dt, 200, 700);
    s.dist += s.spd * dt; s.score = Math.floor(s.dist / 50) + (s.bonus || 0);
    s.lines = (s.lines + s.spd * dt) % 60;
    s.next -= dt;
    if (s.next <= 0) { const lane = E.pick(this.LANES); if (!s.cars.some((c) => c.x === lane && c.y < 40)) s.cars.push({ x: lane, y: -80, v: E.rand(120, 220), col: E.pick(["#ef4444", "#3b82f6", "#eab308", "#a855f7", "#f97316", "#e5e7eb"]), passed: false }); s.next = E.rand(0.25, 0.7) * (300 / s.spd); }
    s.cars.forEach((c) => { c.y += (s.spd - c.v) * dt; if (!c.passed && c.y > 380) { c.passed = true; if (Math.abs(c.x - s.x) < 60) { s.bonus = (s.bonus || 0) + 5; E.sfx("coin"); } } if (Math.abs(c.x - s.x) < 34 && Math.abs(c.y - 360) < 62) { s.over = true; E.sfx("boom"); } });
    s.cars = s.cars.filter((c) => c.y < 520);
  },
  car(c, x, y, col) { E.rrect(c, x - 22, y - 38, 44, 76, 10, col); E.rect(c, x - 16, y - 24, 32, 14, "#1e293b"); E.rect(c, x - 16, y + 14, 32, 10, "#1e293b"); },
  draw(c, s) {
    E.clear(c, "#15803d"); E.rect(c, 176, 0, 448, 450, "#374151");
    E.rect(c, 176, 0, 6, 450, "#fff"); E.rect(c, 618, 0, 6, 450, "#fff");
    for (let l = 1; l < 5; l++) for (let y = -60 + s.lines; y < 450; y += 60) E.rect(c, 176 + l * 89.6 - 2, y, 4, 30, "#e5e7eb");
    s.cars.forEach((cr) => this.car(c, cr.x, cr.y, cr.col));
    this.car(c, s.x, 360, "#22d3ee");
    E.text(c, s.score, 90, 40, 30); E.text(c, Math.round(s.spd / 4) + " km/h", 710, 40, 20);
  },
});
