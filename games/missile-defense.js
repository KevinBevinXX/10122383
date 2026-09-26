// Protect your cities: tap to fire interceptors that explode in the air.
GAME({
  title: "Missile Defense",
  players: 1, touch: "pointer",
  controls: "Tap/click where you want an interceptor to explode. Protect the six cities.",
  init() { return { cities: [140, 220, 300, 500, 580, 660].map((x) => ({ x, alive: true })), inc: [], mine: [], exp: [], wave: 1, left: 10, next: 1, score: 0, ammo: 30 }; },
  update(s, inp, dt) {
    for (const t of inp[0].taps) if (s.ammo > 0 && t.y < 400) {
      const bx = t.x < 400 ? 60 : 740; s.ammo--;
      s.mine.push({ x: bx, y: 410, tx: t.x, ty: t.y, sx: bx, sy: 410 }); E.sfx("shoot");
    }
    s.next -= dt;
    if (s.next <= 0 && s.left > 0) {
      const targets = s.cities.filter((c) => c.alive).map((c) => c.x).concat([60, 740]);
      s.inc.push({ sx: E.rand(0, 800), sy: 0, x: 0, y: 0, tx: E.pick(targets), ty: 420, sp: 35 + s.wave * 8, t: 0 });
      s.left--; s.next = E.rand(0.4, 1.4) / (1 + s.wave * 0.1);
    }
    s.mine = s.mine.filter((m) => {
      const dx = m.tx - m.x, dy = m.ty - m.y, d = Math.hypot(dx, dy);
      if (d < 12) { s.exp.push({ x: m.tx, y: m.ty, r: 0, t: 0 }); E.sfx("boom"); return false; }
      m.x += (dx / d) * 500 * dt; m.y += (dy / d) * 500 * dt; return true;
    });
    s.exp.forEach((e) => { e.t += dt; e.r = e.t < 0.5 ? e.t * 90 : Math.max(0, 45 - (e.t - 0.5) * 60); });
    s.exp = s.exp.filter((e) => e.t < 1.25);
    s.inc = s.inc.filter((m) => {
      const L = E.dist(m.sx, m.sy, m.tx, m.ty); m.t += (m.sp * dt) / L;
      m.x = E.lerp(m.sx, m.tx, m.t); m.y = E.lerp(m.sy, m.ty, m.t);
      if (s.exp.some((e) => E.dist(e.x, e.y, m.x, m.y) < e.r)) { s.score += 25; s.exp.push({ x: m.x, y: m.y, r: 0, t: 0.2 }); return false; }
      if (m.t >= 1) { const c = s.cities.find((c) => c.alive && Math.abs(c.x - m.tx) < 30); if (c) c.alive = false; s.exp.push({ x: m.tx, y: 415, r: 0, t: 0 }); E.sfx("boom"); return false; }
      return true;
    });
    if (!s.cities.some((c) => c.alive)) { s.over = true; return; }
    if (!s.left && !s.inc.length && !s.exp.length) {
      s.score += s.cities.filter((c) => c.alive).length * 100 + s.ammo * 5;
      s.wave++; s.left = 8 + s.wave * 2; s.ammo = 30; s.next = 1.5; E.sfx("win");
    }
  },
  draw(c, s) {
    E.clear(c, "#0b1026");
    E.rect(c, 0, 420, 800, 30, "#a16207");
    [60, 740].forEach((x) => { c.fillStyle = "#ca8a04"; c.beginPath(); c.moveTo(x - 40, 420); c.lineTo(x, 390); c.lineTo(x + 40, 420); c.fill(); });
    s.cities.forEach((ct) => { if (ct.alive) { E.rect(c, ct.x - 25, 400, 50, 20, "#38bdf8"); E.rect(c, ct.x - 15, 388, 12, 14, "#38bdf8"); E.rect(c, ct.x + 5, 392, 10, 10, "#38bdf8"); } else E.rect(c, ct.x - 25, 414, 50, 6, "#444"); });
    s.inc.forEach((m) => { E.line(c, m.sx, m.sy, m.x, m.y, "rgba(248,113,113,.6)", 2); E.circle(c, m.x, m.y, 3, "#fff"); });
    s.mine.forEach((m) => { E.line(c, m.sx, m.sy, m.x, m.y, "rgba(96,165,250,.7)", 2); E.text(c, "×", m.tx, m.ty, 14, "#60a5fa"); });
    s.exp.forEach((e) => { E.circle(c, e.x, e.y, e.r, `hsla(${40 + e.t * 100},100%,60%,.85)`); });
    E.text(c, `Score ${s.score}   Wave ${s.wave}   Ammo ${s.ammo}`, 400, 18, 16);
  },
});
