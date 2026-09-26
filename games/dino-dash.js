// Endless runner: jump cacti, duck birds.
GAME({
  title: "Dino Dash",
  players: 1,
  controls: "A / ▲ / tap = jump · ▼ = duck",
  aLabel: "Jump", bLabel: false,
  init() { return { y: 0, vy: 0, duck: false, obs: [], spd: 330, dist: 0, next: 1, score: 0, t: 0 }; },
  update(s, inp, dt) {
    const k = inp[0];
    s.t += dt; s.spd += dt * 6; s.dist += s.spd * dt; s.score = Math.floor(s.dist / 10);
    if ((k.pa || k.pu || k.taps.length) && s.y === 0) { s.vy = 620; E.sfx("jump"); }
    s.duck = k.down && s.y === 0;
    if (k.down && s.y > 0) s.vy -= 3000 * dt;
    s.vy -= 2000 * dt; s.y = Math.max(0, s.y + s.vy * dt); if (s.y === 0) s.vy = 0;
    s.next -= dt;
    if (s.next <= 0) {
      const bird = s.score > 200 && Math.random() < 0.3;
      s.obs.push(bird ? { x: 820, w: 40, h: 26, y: E.pick([12, 50, 90]), bird: true } : { x: 820, w: E.pick([18, 34, 50]), h: E.pick([36, 50]), y: 0, bird: false });
      s.next = E.rand(0.7, 1.6) * (330 / s.spd) + 0.35;
    }
    s.obs.forEach((o) => (o.x -= s.spd * dt));
    s.obs = s.obs.filter((o) => o.x > -60);
    const h = s.duck ? 26 : 46, dx = 100, dw = s.duck ? 54 : 40;
    for (const o of s.obs) if (dx + dw - 6 > o.x && dx + 6 < o.x + o.w && s.y + 4 < o.y + o.h && s.y + h - 4 > o.y) { s.over = true; E.sfx("boom"); }
  },
  draw(c, s) {
    const night = Math.floor(s.score / 700) % 2;
    E.clear(c, night ? "#1f2937" : "#f7f7f7");
    const ink = night ? "#e5e7eb" : "#535353", G = 360;
    E.rect(c, 0, G, 800, 2, ink);
    for (let i = 0; i < 30; i++) E.rect(c, ((i * 67 - s.dist * 0.99) % 800 + 800) % 800, G + 8 + (i % 3) * 6, 6 + (i % 4) * 3, 2, ink);
    for (let i = 0; i < 4; i++) E.rrect(c, ((i * 230 - s.dist * 0.2) % 900 + 900) % 900 - 50, 80 + (i % 2) * 40, 70, 18, 9, night ? "#374151" : "#e5e7eb");
    const dy = G - s.y;
    if (s.duck) { E.rect(c, 100, dy - 26, 54, 26, ink); E.rect(c, 140, dy - 30, 22, 14, ink); E.rect(c, 150, dy - 27, 3, 3, night ? "#1f2937" : "#fff"); }
    else {
      E.rect(c, 106, dy - 46, 26, 34, ink); E.rect(c, 120, dy - 58, 26, 18, ink); E.rect(c, 138, dy - 54, 3, 3, night ? "#1f2937" : "#fff");
      E.rect(c, 100, dy - 36, 8, 14, ink);
      const leg = Math.floor(s.t * 12) % 2 && !s.y;
      E.rect(c, 110, dy - 12, 6, leg ? 8 : 12, ink); E.rect(c, 122, dy - 12, 6, leg ? 12 : 8, ink);
    }
    s.obs.forEach((o) => {
      if (o.bird) { const flap = Math.floor(s.t * 8) % 2; E.rect(c, o.x, G - o.y - 16, o.w, 10, ink); E.rect(c, o.x + 10, G - o.y - (flap ? 30 : 8), 16, flap ? 14 : 14, ink); }
      else { E.rect(c, o.x, G - o.h, o.w, o.h, "#16a34a"); if (o.w > 20) { E.rect(c, o.x - 6, G - o.h + 10, 6, 14, "#16a34a"); E.rect(c, o.x + o.w, G - o.h + 16, 6, 12, "#16a34a"); } }
    });
    E.text(c, String(s.score).padStart(5, "0"), 780, 30, 20, ink, "right");
  },
});
