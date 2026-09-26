// Flick the ball into the hoop. The hoop moves as you score.
GAME({
  title: "Hoop Shot",
  players: 1, touch: "pointer",
  controls: "Drag from the ball and release to throw (like a slingshot, pull back). 60 seconds.",
  init() { return { b: this.newBall(), hoop: { x: 560, y: 180, vx: 0 }, score: 0, streak: 0, time: 60, drag: null, msg: "", msgT: 0 }; },
  newBall() { return { x: 160, y: 360, vx: 0, vy: 0, fly: false, scored: false, t: 0 }; },
  update(s, inp, dt) {
    const k = inp[0], b = s.b, h = s.hoop;
    s.time -= dt; if (s.time <= 0 && !b.fly) { s.over = true; return; }
    s.msgT = Math.max(0, s.msgT - dt);
    h.x += h.vx * dt; if (h.x < 420 || h.x > 720) h.vx = -h.vx;
    if (!b.fly) {
      for (const t of k.taps) if (E.dist(t.x, t.y, b.x, b.y) < 80) s.drag = true;
      if (s.drag && !k.pdown) {
        s.drag = null;
        const dx = b.x - k.px, dy = b.y - k.py;
        if (Math.hypot(dx, dy) > 15) { b.vx = dx * 4.2; b.vy = dy * 4.2; b.fly = true; E.sfx("jump"); }
      }
      return;
    }
    b.t += dt;
    const oy = b.y;
    b.vy += 900 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
    for (const rx of [h.x - 36, h.x + 36]) {
      const dx = b.x - rx, dy = b.y - h.y, d = Math.hypot(dx, dy);
      if (d < 18 && d > 0) { const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny; if (dot < 0) { b.vx -= 1.6 * dot * nx; b.vy -= 1.6 * dot * ny; } b.x = rx + nx * 18; b.y = h.y + ny * 18; b.rim = true; E.sfx("pop"); }
    }
    if (Math.abs(b.x - (h.x + 44)) < 16 && b.y > h.y - 90 && b.y < h.y + 10) { b.vx = -Math.abs(b.vx) * 0.6; E.sfx("hit"); }
    if (!b.scored && oy < h.y && b.y >= h.y && Math.abs(b.x - h.x) < 30) {
      b.scored = true; s.streak++; const pts = b.rim ? 2 : 3; s.score += pts * Math.min(3, s.streak);
      s.msg = b.rim ? "Score!" : "SWISH!"; s.msgT = 1; E.sfx("score");
      if (s.score > 10) h.vx = h.vx || 80 + s.score;
    }
    if (b.y > 470 || b.x < -30 || b.x > 830 || b.t > 4) { if (!b.scored) s.streak = 0; s.b = this.newBall(); s.b.x = E.rand(120, 260); }
  },
  draw(c, s) {
    E.clear(c, "#1e293b"); E.rect(c, 0, 390, 800, 60, "#b45309");
    const h = s.hoop, b = s.b;
    E.rect(c, h.x + 44, h.y - 95, 8, 110, "#e2e8f0"); E.rect(c, h.x + 48, h.y + 10, 8, 380, "#64748b");
    c.strokeStyle = "#fff"; c.lineWidth = 2; for (let n = -3; n <= 3; n++) { c.beginPath(); c.moveTo(h.x + n * 11, h.y); c.lineTo(h.x + n * 6, h.y + 44); c.stroke(); }
    E.line(c, h.x - 38, h.y, h.x + 38, h.y, "#f97316", 5);
    E.circle(c, b.x, b.y, 16, "#f97316"); E.line(c, b.x - 16, b.y, b.x + 16, b.y, "#7c2d12", 2); E.line(c, b.x, b.y - 16, b.x, b.y + 16, "#7c2d12", 2);
    E.text(c, `Score ${s.score}`, 20, 25, 22, "#fff", "left"); E.text(c, `${Math.max(0, Math.ceil(s.time))}s`, 780, 25, 22, "#fff", "right");
    if (s.streak > 1) E.text(c, `Streak ×${Math.min(3, s.streak)}`, 20, 55, 16, "#fde047", "left");
    if (s.msgT) E.text(c, s.msg, 400, 90, 40, "#fde047");
    if (!b.fly) E.text(c, "Drag back from the ball and let go", 200, 430, 13, "#fde68a");
  },
});
