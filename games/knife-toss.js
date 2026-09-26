// Throw knives into the spinning log without hitting other knives.
GAME({
  title: "Knife Toss",
  players: 1, touch: "pointer",
  controls: "Tap / click / A to throw. Don't hit a knife that's already stuck in the log.",
  init() { const s = { level: 1, score: 0 }; this.lvl(s); return s; },
  lvl(s) { s.knives = []; s.left = 5 + s.level; s.rot = 0; s.spd = 1.8 + s.level * 0.25; s.fly = null; s.t = 0; s.apples = [E.rand(0, 6.28)]; for (let i = 0; i < Math.min(3, s.level - 1); i++) s.knives.push(E.rand(0, 6.28)); },
  update(s, inp, dt) {
    s.t += dt;
    const wobble = s.level > 2 ? Math.sin(s.t * 1.3) * 1.5 : 0;
    s.rot += (s.spd + wobble) * dt;
    const k = inp[0];
    if ((k.pa || k.taps.length) && !s.fly && s.left > 0) { s.fly = { y: 400 }; E.sfx("shoot"); }
    if (s.fly) {
      s.fly.y -= 1400 * dt;
      if (s.fly.y <= 150 + 80) {
        const ang = ((Math.PI / 2 - s.rot) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const clash = s.knives.some((a) => Math.abs(Math.atan2(Math.sin(a - ang), Math.cos(a - ang))) < 0.2);
        s.fly = null;
        if (clash) { s.over = true; E.sfx("boom"); return; }
        s.knives.push(ang); s.left--; s.score++; E.sfx("hit");
        const ap = s.apples.findIndex((a) => Math.abs(Math.atan2(Math.sin(a - ang), Math.cos(a - ang))) < 0.25);
        if (ap >= 0) { s.apples.splice(ap, 1); s.score += 5; E.sfx("coin"); }
        if (!s.left) { s.level++; this.lvl(s); E.sfx("win"); }
      }
    }
  },
  knife(c, x, y, a) { c.save(); c.translate(x, y); c.rotate(a); E.rect(c, -3, 0, 6, 50, "#cfd8dc"); E.rect(c, -4, 50, 8, 30, "#5d4037"); c.restore(); },
  draw(c, s) {
    E.clear(c, "#263238");
    const cx = 400, cy = 150;
    s.knives.forEach((a) => { const t = a + s.rot; this.knife(c, cx + Math.cos(t) * 70, cy + Math.sin(t) * 70, t - Math.PI / 2); });
    s.apples.forEach((a) => { const t = a + s.rot; E.circle(c, cx + Math.cos(t) * 92, cy + Math.sin(t) * 92, 12, "#e53935"); });
    E.circle(c, cx, cy, 80, "#8d6e63"); E.ring(c, cx, cy, 60, "#6d4c41", 3); E.ring(c, cx, cy, 35, "#6d4c41", 3);
    if (s.fly) this.knife(c, cx, s.fly.y, 0);
    else if (s.left) this.knife(c, cx, 360, 0);
    for (let i = 0; i < s.left; i++) E.rect(c, 40, 420 - i * 22, 6, 18, "#cfd8dc");
    E.text(c, `Level ${s.level}`, 700, 30, 18); E.text(c, s.score, 700, 60, 30, "#ffca28");
  },
});
