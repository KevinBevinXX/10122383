// Two ships, wraparound space, a sun in the middle that pulls you in.
GAME({
  title: "Space Duel",
  players: 2,
  controls: "◀ ▶ rotate · ▲ thrust · A = fire. Avoid the sun. First to 5.",
  aLabel: "Fire", bLabel: false,
  init() { return { sh: this.ships(), bul: [], score: [0, 0], wait: 1 }; },
  ships() { return [{ x: 150, y: 225, vx: 0, vy: 60, a: -Math.PI / 2, cool: 0 }, { x: 650, y: 225, vx: 0, vy: -60, a: Math.PI / 2, cool: 0 }]; },
  update(s, inp, dt) {
    if (s.wait > 0) { s.wait -= dt; return; }
    const wrap = (o) => { o.x = (o.x + 800) % 800; o.y = (o.y + 450) % 450; };
    const pull = (o, k) => { const dx = 400 - o.x, dy = 225 - o.y, d2 = Math.max(900, dx * dx + dy * dy), f = (k * 1e6) / d2; const d = Math.sqrt(d2); o.vx += (dx / d) * f * dt; o.vy += (dy / d) * f * dt; };
    let hit = [false, false];
    s.sh.forEach((p, i) => {
      const k = inp[i];
      p.a += ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 4 * dt;
      if (k.up) { p.vx += Math.cos(p.a) * 260 * dt; p.vy += Math.sin(p.a) * 260 * dt; }
      pull(p, 0.06);
      const sp = Math.hypot(p.vx, p.vy); if (sp > 320) { p.vx *= 320 / sp; p.vy *= 320 / sp; }
      p.x += p.vx * dt; p.y += p.vy * dt; wrap(p);
      p.cool = Math.max(0, p.cool - dt);
      if (k.pa && !p.cool) { s.bul.push({ x: p.x + Math.cos(p.a) * 16, y: p.y + Math.sin(p.a) * 16, vx: p.vx + Math.cos(p.a) * 420, vy: p.vy + Math.sin(p.a) * 420, o: i, life: 1.6 }); p.cool = 0.3; E.sfx("shoot"); }
      if (E.dist(p.x, p.y, 400, 225) < 34) hit[i] = true;
    });
    s.bul = s.bul.filter((b) => {
      b.x += b.vx * dt; b.y += b.vy * dt; wrap(b); b.life -= dt;
      if (E.dist(b.x, b.y, 400, 225) < 30) return false;
      for (let i = 0; i < 2; i++) if (i !== b.o && E.dist(b.x, b.y, s.sh[i].x, s.sh[i].y) < 15) { hit[i] = true; return false; }
      return b.life > 0;
    });
    if (hit[0] || hit[1]) {
      E.sfx("boom");
      if (hit[0] !== hit[1]) s.score[hit[0] ? 1 : 0]++;
      const w = s.score.findIndex((v) => v >= 5);
      if (w >= 0) { s.over = true; s.winner = w; return; }
      s.sh = this.ships(); s.bul = []; s.wait = 1;
    }
  },
  ai(s, i) {
    const p = s.sh[i], o = s.sh[1 - i];
    const dSun = E.dist(p.x, p.y, 400, 225);
    const want = dSun < 130 ? Math.atan2(p.y - 225, p.x - 400) : Math.atan2(o.y - p.y, o.x - p.x);
    const d = ((want - p.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    return { left: d < -0.1, right: d > 0.1, up: dSun < 130 ? Math.abs(d) < 0.6 : Math.hypot(p.vx, p.vy) < 90, pa: dSun >= 130 && Math.abs(d) < 0.2 && Math.random() < 0.15 };
  },
  draw(c, s) {
    E.clear(c, "#02030a");
    for (let i = 0; i < 120; i++) E.rect(c, (i * 193) % 800, (i * 97) % 450, 2, 2, i % 3 ? "#445" : "#aab");
    E.circle(c, 400, 225, 44, "rgba(255,160,0,.25)"); E.circle(c, 400, 225, 30, "#ffb300"); E.circle(c, 400, 225, 20, "#fff3c4");
    const cols = ["#4fc3f7", "#ff8a65"];
    s.sh.forEach((p, i) => {
      c.save(); c.translate(p.x, p.y); c.rotate(p.a);
      c.fillStyle = cols[i]; c.beginPath(); c.moveTo(16, 0); c.lineTo(-12, -10); c.lineTo(-6, 0); c.lineTo(-12, 10); c.closePath(); c.fill();
      c.restore();
    });
    s.bul.forEach((b) => E.circle(c, b.x, b.y, 3, cols[b.o]));
    E.text(c, `${E.name(0)} ${s.score[0]} — ${s.score[1]} ${E.name(1)}`, 400, 18, 16);
  },
});
