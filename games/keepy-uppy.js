// Tap the ball to keep it in the air. Each tap is a point.
GAME({
  title: "Keepy Uppy",
  players: 1, touch: "pointer",
  controls: "Tap / click the ball to kick it up. Where you tap changes the direction. Don't let it drop!",
  init() { return { x: 400, y: 200, vx: 0, vy: 0, rot: 0, score: 0, started: false, fx: [] }; },
  update(s, inp, dt) {
    for (const t of inp[0].taps) {
      if (E.dist(t.x, t.y, s.x, s.y) < 60) {
        s.started = true; s.vy = -560 - Math.min(200, s.score * 6); s.vx = (s.x - t.x) * 9 + E.rand(-40, 40); s.score++; E.sfx("hit");
        s.fx.push({ x: t.x, y: t.y, t: 0.4 });
      }
    }
    s.fx.forEach((f) => (f.t -= dt)); s.fx = s.fx.filter((f) => f.t > 0);
    if (!s.started) return;
    s.vy += 1100 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.vx * dt * 0.02;
    if (s.x < 40 || s.x > 760) { s.vx = -s.vx * 0.8; s.x = E.clamp(s.x, 40, 760); }
    if (s.y > 480) { s.over = true; E.sfx("lose"); }
  },
  draw(c, s) {
    E.clear(c, "#60a5fa"); E.rect(c, 0, 400, 800, 50, "#22c55e");
    s.fx.forEach((f) => E.ring(c, f.x, f.y, 40 * (1 - f.t / 0.4) + 10, `rgba(255,255,255,${f.t * 2})`, 3));
    c.save(); c.translate(s.x, s.y); c.rotate(s.rot);
    E.circle(c, 0, 0, 40, "#fff"); for (let k = 0; k < 5; k++) { const a = (k * 2 * Math.PI) / 5; E.circle(c, Math.cos(a) * 26, Math.sin(a) * 26, 9, "#111"); } E.circle(c, 0, 0, 10, "#111");
    c.restore();
    E.text(c, s.score, 400, 60, 54, "#fff");
    if (!s.started) E.text(c, "Tap the ball!", 400, 300, 24, "#fff");
  },
});
