// Volleyball with slimes. Don't let the ball land on your side.
GAME({
  title: "Slime Volley",
  players: 2,
  controls: "Move ◀ ▶ · Jump ▲ (or A). First to 7.",
  aLabel: "Jump", bLabel: false,
  FLOOR: 400, G: 900,
  init() { return { p: [this.sl(200), this.sl(600)], b: { x: 200, y: 120, vx: 0, vy: 0 }, score: [0, 0], wait: 1 }; },
  sl(x) { return { x, y: this.FLOOR, vy: 0 }; },
  update(s, inp, dt) {
    s.p.forEach((p, i) => {
      const k = inp[i], lo = i === 0 ? 40 : 440, hi = i === 0 ? 360 : 760;
      p.x = E.clamp(p.x + ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 330 * dt, lo, hi);
      if ((k.up || k.a) && p.y >= this.FLOOR) { p.vy = -470; E.sfx("jump"); }
      p.vy += this.G * 1.6 * dt; p.y = Math.min(this.FLOOR, p.y + p.vy * dt);
    });
    if (s.wait > 0) { s.wait -= dt; return; }
    const b = s.b, R = 12;
    b.vy += this.G * dt; b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < R || b.x > 800 - R) { b.vx = -b.vx; b.x = E.clamp(b.x, R, 800 - R); }
    // net
    if (b.y > 300 - R && Math.abs(b.x - 400) < 6 + R) {
      if (b.y < 300) { b.vy = -Math.abs(b.vy); b.y = 300 - R; } else { b.vx = -b.vx; b.x = 400 + Math.sign(b.x - 400 || 1) * (6 + R); }
    }
    s.p.forEach((p) => {
      const dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy);
      if (d < 40 + R && dy < 0) {
        const nx = dx / d, ny = dy / d;
        b.x = p.x + nx * (40 + R); b.y = p.y + ny * (40 + R);
        const sp = Math.max(420, Math.hypot(b.vx, b.vy));
        b.vx = nx * sp * 0.95; b.vy = ny * sp + Math.min(0, p.vy) * 0.4;
        E.sfx("pop");
      }
    });
    if (b.y > this.FLOOR - R) {
      const w = b.x < 400 ? 1 : 0; s.score[w]++; E.sfx("score");
      if (s.score[w] >= 7) { s.over = true; s.winner = w; }
      s.b = { x: w === 0 ? 200 : 600, y: 120, vx: 0, vy: 0 }; s.wait = 1;
      s.p = [this.sl(200), this.sl(600)];
    }
  },
  ai(s, i) {
    const p = s.p[i], b = s.b;
    const onMySide = i === 1 ? b.x > 400 : b.x < 400;
    const tx = onMySide ? b.x + (i === 1 ? 14 : -14) : i === 1 ? 600 : 200;
    return { left: p.x > tx + 6, right: p.x < tx - 6, up: onMySide && Math.abs(b.x - p.x) < 60 && b.y > 220 && b.y < 330 };
  },
  draw(c, s) {
    E.clear(c, "#1d2b53");
    E.rect(c, 0, 400, 800, 50, "#7e5c3a");
    E.rect(c, 395, 300, 10, 100, "#eee");
    [["#29b6f6"], ["#ff7043"]].forEach(([col], i) => {
      const p = s.p[i];
      c.fillStyle = col; c.beginPath(); c.arc(p.x, p.y, 40, Math.PI, 0); c.fill();
      const ex = p.x + (i === 0 ? 16 : -16), ey = p.y - 22;
      E.circle(c, ex, ey, 8, "#fff");
      const a = Math.atan2(s.b.y - ey, s.b.x - ex);
      E.circle(c, ex + Math.cos(a) * 4, ey + Math.sin(a) * 4, 4, "#000");
    });
    E.circle(c, s.b.x, s.b.y, 12, "#ffeb3b");
    E.text(c, s.score[0], 200, 40, 36, "#29b6f6"); E.text(c, s.score[1], 600, 40, 36, "#ff7043");
    E.text(c, E.name(0), 200, 430, 13); E.text(c, E.name(1), 600, 430, 13);
  },
});
