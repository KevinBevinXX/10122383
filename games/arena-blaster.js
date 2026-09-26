// Twin-stick-style arena shooter. Survive as long as you can.
GAME({
  title: "Arena Blaster",
  players: 1,
  controls: "Move with W A S D / arrows. Aim with the mouse (or it auto-aims). Fire is automatic.",
  aLabel: "·", bLabel: false,
  init() { return { x: 400, y: 225, hp: 5, en: [], b: [], parts: [], t: 0, cool: 0, score: 0, inv: 0, aim: 0, next: 1 }; },
  update(s, inp, dt) {
    const k = inp[0];
    s.t += dt;
    s.x = E.clamp(s.x + ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 260 * dt, 12, 788);
    s.y = E.clamp(s.y + ((k.down ? 1 : 0) - (k.up ? 1 : 0)) * 260 * dt, 12, 438);
    const near = s.en.reduce((b, e) => (!b || E.dist(e.x, e.y, s.x, s.y) < E.dist(b.x, b.y, s.x, s.y) ? e : b), null);
    if ((k.px || k.py) && !matchMedia("(pointer: coarse)").matches) s.aim = Math.atan2(k.py - s.y, k.px - s.x); else if (near) s.aim = Math.atan2(near.y - s.y, near.x - s.x);
    s.cool -= dt; s.inv = Math.max(0, s.inv - dt);
    if (s.cool <= 0) { s.cool = 0.12; s.b.push({ x: s.x, y: s.y, vx: Math.cos(s.aim) * 620, vy: Math.sin(s.aim) * 620 }); }
    s.next -= dt;
    if (s.next <= 0) {
      const a = E.rand(0, 7), type = Math.random() < Math.min(0.4, s.t / 200) ? 1 : Math.random() < 0.15 ? 2 : 0;
      s.en.push({ x: 400 + Math.cos(a) * 480, y: 225 + Math.sin(a) * 480, hp: [1, 3, 1][type], type, sp: [110, 70, 190][type] + s.t * 0.8 });
      s.next = Math.max(0.15, 0.9 - s.t / 120);
    }
    s.b = s.b.filter((b) => { b.x += b.vx * dt; b.y += b.vy * dt; return b.x > -10 && b.x < 810 && b.y > -10 && b.y < 460; });
    s.en = s.en.filter((e) => {
      const d = E.dist(e.x, e.y, s.x, s.y) || 1;
      e.x += ((s.x - e.x) / d) * e.sp * dt; e.y += ((s.y - e.y) / d) * e.sp * dt;
      const hit = s.b.findIndex((b) => E.dist(b.x, b.y, e.x, e.y) < (e.type === 1 ? 18 : 12));
      if (hit >= 0) { s.b.splice(hit, 1); e.hp--; }
      if (e.hp <= 0) { s.score += [10, 30, 20][e.type]; for (let i = 0; i < 6; i++) s.parts.push({ x: e.x, y: e.y, vx: E.rand(-150, 150), vy: E.rand(-150, 150), t: 0.4, c: ["#f472b6", "#fb923c", "#a3e635"][e.type] }); E.sfx("pop"); return false; }
      if (d < 20 && !s.inv) { s.hp--; s.inv = 1; E.sfx("hit"); if (s.hp <= 0) s.over = true; return false; }
      return true;
    });
    s.parts.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt; }); s.parts = s.parts.filter((p) => p.t > 0);
  },
  draw(c, s) {
    E.clear(c, "#0a0a0a");
    for (let x = 0; x < 800; x += 40) E.line(c, x, 0, x, 450, "#171717", 1);
    for (let y = 0; y < 450; y += 40) E.line(c, 0, y, 800, y, "#171717", 1);
    s.parts.forEach((p) => E.rect(c, p.x, p.y, 3, 3, p.c));
    s.en.forEach((e) => {
      const col = ["#f472b6", "#fb923c", "#a3e635"][e.type], r = e.type === 1 ? 18 : 12;
      c.save(); c.translate(e.x, e.y); c.rotate(s.t * 3); c.strokeStyle = col; c.lineWidth = 3; c.strokeRect(-r, -r, r * 2, r * 2); c.restore();
    });
    s.b.forEach((b) => E.circle(c, b.x, b.y, 3, "#67e8f9"));
    if (!(s.inv && Math.floor(s.inv * 10) % 2)) { E.ring(c, s.x, s.y, 12, "#67e8f9", 3); E.line(c, s.x, s.y, s.x + Math.cos(s.aim) * 20, s.y + Math.sin(s.aim) * 20, "#67e8f9", 3); }
    E.text(c, `${s.score}   ${"♥".repeat(Math.max(0, s.hp))}   ${Math.floor(s.t)}s`, 10, 10, 16, "#fff", "left", "top");
  },
});
