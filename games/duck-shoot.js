// Shoot the flying ducks. 3 shots per duck.
GAME({
  title: "Duck Shoot",
  players: 1, touch: "pointer",
  controls: "Tap / click the ducks. You get 3 shots per round of 2 ducks. Miss too many and it's over.",
  init() { const s = { round: 0, hit: 0, missed: 0, score: 0, flash: 0 }; this.next(s); return s; },
  next(s) { s.round++; s.shots = 3; s.ducks = [0, 1].map(() => ({ x: E.rand(200, 600), y: 400, vx: E.pick([-1, 1]) * E.rand(120, 180) * (1 + s.round * 0.08), vy: -E.rand(120, 180) * (1 + s.round * 0.08), alive: true, fall: false, gone: false, t: 0 })); s.wait = 0; },
  update(s, inp, dt) {
    s.flash = Math.max(0, s.flash - dt);
    for (const t of inp[0].taps) {
      if (s.shots <= 0) break;
      s.shots--; s.flash = 0.05; E.sfx("shoot");
      const d = s.ducks.find((d) => d.alive && Math.abs(t.x - d.x) < 30 && Math.abs(t.y - d.y) < 24);
      if (d) { d.alive = false; d.fall = true; s.hit++; s.score += 100 * s.round; E.sfx("hit"); }
    }
    s.ducks.forEach((d) => {
      d.t += dt;
      if (d.fall) { d.y += 300 * dt; if (d.y > 380) d.gone = true; return; }
      if (!d.alive) return;
      d.x += d.vx * dt; d.y += d.vy * dt;
      if (d.x < 30 || d.x > 770) d.vx = -d.vx;
      if (d.y < 30 || d.y > 360) d.vy = -d.vy;
      if (d.t > 6 || (s.shots === 0 && d.t > 1)) { d.alive = false; d.flee = true; }
      if (d.flee) { d.y -= 400 * dt; }
    });
    s.ducks.forEach((d) => { if (d.flee) { d.y -= 300 * dt; if (d.y < -40) { d.gone = true; } } });
    if (s.ducks.every((d) => d.gone || (!d.alive && !d.fall && d.flee && d.y < -40))) {
      s.missed += s.ducks.filter((d) => d.flee).length;
      if (s.missed >= 5) { s.over = true; return; }
      this.next(s);
    }
  },
  draw(c, s) {
    E.clear(c, s.flash ? "#fff" : "#60a5fa");
    E.rect(c, 0, 360, 800, 90, "#65a30d");
    for (let x = 0; x < 800; x += 30) { c.fillStyle = "#4d7c0f"; c.beginPath(); c.moveTo(x, 370); c.lineTo(x + 15, 330); c.lineTo(x + 30, 370); c.fill(); }
    s.ducks.forEach((d) => {
      if (d.gone) return;
      c.save(); c.translate(d.x, d.y); if (d.vx < 0) c.scale(-1, 1); if (d.fall) c.rotate(Math.PI / 2);
      E.circle(c, 0, 0, 16, "#78350f"); E.circle(c, 14, -10, 9, "#166534"); c.fillStyle = "#f59e0b"; c.beginPath(); c.moveTo(21, -10); c.lineTo(30, -7); c.lineTo(21, -5); c.fill();
      const flap = Math.floor(d.t * 10) % 2; E.rect(c, -10, flap ? -20 : 0, 18, 8, "#a16207");
      c.restore();
    });
    E.text(c, `Round ${s.round}   Score ${s.score}`, 400, 20, 18);
    E.text(c, "🔫".repeat(s.shots), 60, 420, 22); E.text(c, `Missed ${s.missed}/5`, 700, 420, 16);
  },
});
