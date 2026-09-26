// Tap to flap through the gaps.
GAME({
  title: "Flappy Flight",
  players: 1,
  controls: "Tap, click, or press A / ▲ to flap.",
  aLabel: "Flap", bLabel: false,
  init() { return { y: 200, vy: 0, pipes: [], t: 0, score: 0, started: false }; },
  update(s, inp, dt) {
    const k = inp[0], flap = k.pa || k.pu || k.taps.length;
    if (!s.started) { if (flap) s.started = true; else { s.y = 200 + Math.sin((s.t += dt) * 4) * 8; return; } }
    if (flap) { s.vy = -330; E.sfx("jump"); }
    s.vy += 1100 * dt; s.y += s.vy * dt;
    s.t += dt;
    if (!s.pipes.length || s.pipes[s.pipes.length - 1].x < 560) s.pipes.push({ x: 820, gap: E.rand(110, 300), passed: false });
    s.pipes.forEach((p) => {
      p.x -= 170 * dt;
      if (!p.passed && p.x + 60 < 200) { p.passed = true; s.score++; E.sfx("coin"); }
      if (200 + 16 > p.x && 200 - 16 < p.x + 60 && (s.y - 14 < p.gap - 70 || s.y + 14 > p.gap + 70)) s.over = true;
    });
    s.pipes = s.pipes.filter((p) => p.x > -70);
    if (s.y > 410 || s.y < -20) s.over = true;
    if (s.over) E.sfx("boom");
  },
  draw(c, s) {
    E.clear(c, "#70c5ce");
    for (let i = 0; i < 6; i++) E.circle(c, ((i * 170 - s.t * 20) % 900 + 900) % 900 - 50, 90 + (i % 3) * 30, 36, "#fff");
    s.pipes.forEach((p) => {
      E.rect(c, p.x, 0, 60, p.gap - 70, "#5ec639"); E.rect(c, p.x - 5, p.gap - 94, 70, 24, "#4caf50");
      E.rect(c, p.x, p.gap + 70, 60, 450, "#5ec639"); E.rect(c, p.x - 5, p.gap + 70, 70, 24, "#4caf50");
    });
    E.rect(c, 0, 420, 800, 30, "#ded895"); E.rect(c, 0, 420, 800, 6, "#7ac943");
    c.save(); c.translate(200, s.y); c.rotate(E.clamp(s.vy / 600, -0.5, 1.2));
    E.circle(c, 0, 0, 16, "#fdd835"); E.circle(c, 7, -5, 5, "#fff"); E.circle(c, 8, -5, 2.5, "#000");
    c.fillStyle = "#ff7043"; c.beginPath(); c.moveTo(12, 1); c.lineTo(24, 4); c.lineTo(12, 8); c.fill();
    E.circle(c, -6, 4, 7, "#fbc02d");
    c.restore();
    E.text(c, s.score, 400, 50, 44, "#fff");
    if (!s.started) E.text(c, "Tap to start", 400, 300, 24, "#fff");
  },
});
