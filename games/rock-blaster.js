// Asteroids: shoot rocks, they split. Don't get hit.
GAME({
  title: "Rock Blaster",
  players: 1,
  controls: "◀ ▶ rotate · ▲ thrust · A = fire · B = hyperspace",
  aLabel: "Fire", bLabel: "Warp",
  init() { const s = { sh: { x: 400, y: 225, vx: 0, vy: 0, a: -Math.PI / 2, inv: 2 }, bul: [], rocks: [], wave: 0, score: 0, lives: 3, cool: 0 }; this.wave(s); return s; },
  wave(s) {
    s.wave++;
    for (let i = 0; i < 3 + s.wave; i++) {
      const a = E.rand(0, 7), side = Math.random() < 0.5;
      s.rocks.push({ x: side ? 0 : E.rand(0, 800), y: side ? E.rand(0, 450) : 0, vx: Math.cos(a) * E.rand(40, 90), vy: Math.sin(a) * E.rand(40, 90), r: 42, seed: E.rand(0, 100) });
    }
  },
  update(s, inp, dt) {
    const k = inp[0], p = s.sh, wrap = (o) => { o.x = (o.x + 800) % 800; o.y = (o.y + 450) % 450; };
    p.a += ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 4.5 * dt;
    if (k.up) { p.vx += Math.cos(p.a) * 300 * dt; p.vy += Math.sin(p.a) * 300 * dt; }
    p.vx *= 0.99; p.vy *= 0.99; p.x += p.vx * dt; p.y += p.vy * dt; wrap(p);
    p.inv = Math.max(0, p.inv - dt); s.cool = Math.max(0, s.cool - dt);
    if (k.a && !s.cool) { s.bul.push({ x: p.x + Math.cos(p.a) * 14, y: p.y + Math.sin(p.a) * 14, vx: Math.cos(p.a) * 520 + p.vx, vy: Math.sin(p.a) * 520 + p.vy, life: 1 }); s.cool = 0.18; E.sfx("shoot"); }
    if (k.pb) { p.x = E.rand(40, 760); p.y = E.rand(40, 410); p.vx = p.vy = 0; p.inv = 0.6; }
    s.bul = s.bul.filter((b) => { b.x += b.vx * dt; b.y += b.vy * dt; wrap(b); return (b.life -= dt) > 0; });
    const born = [];
    s.rocks = s.rocks.filter((r) => {
      r.x += r.vx * dt; r.y += r.vy * dt; wrap(r);
      const hit = s.bul.findIndex((b) => E.dist(b.x, b.y, r.x, r.y) < r.r);
      if (hit >= 0) {
        s.bul.splice(hit, 1); s.score += r.r > 30 ? 20 : r.r > 15 ? 50 : 100; E.sfx("boom");
        if (r.r > 15) for (let k2 = 0; k2 < 2; k2++) { const a = E.rand(0, 7); born.push({ x: r.x, y: r.y, vx: Math.cos(a) * 110, vy: Math.sin(a) * 110, r: r.r / 2, seed: E.rand(0, 100) }); }
        return false;
      }
      if (!p.inv && E.dist(p.x, p.y, r.x, r.y) < r.r + 10) {
        s.lives--; E.sfx("lose"); Object.assign(p, { x: 400, y: 225, vx: 0, vy: 0, inv: 2.5 });
        if (s.lives <= 0) s.over = true;
      }
      return true;
    });
    s.rocks.push(...born);
    if (!s.rocks.length) this.wave(s);
  },
  draw(c, s) {
    E.clear(c, "#000");
    c.strokeStyle = "#ddd"; c.lineWidth = 2;
    s.rocks.forEach((r) => {
      c.beginPath();
      for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2, rr = r.r * (0.8 + 0.2 * Math.sin(r.seed + k * 2.3)); c.lineTo(r.x + Math.cos(a) * rr, r.y + Math.sin(a) * rr); }
      c.closePath(); c.stroke();
    });
    const p = s.sh;
    if (!(p.inv && Math.floor(p.inv * 8) % 2)) {
      c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.strokeStyle = "#fff"; c.beginPath(); c.moveTo(14, 0); c.lineTo(-10, -9); c.lineTo(-6, 0); c.lineTo(-10, 9); c.closePath(); c.stroke(); c.restore();
    }
    s.bul.forEach((b) => E.circle(c, b.x, b.y, 2, "#fff"));
    E.text(c, `${s.score}   ${"▲".repeat(s.lives)}   wave ${s.wave}`, 10, 10, 16, "#fff", "left", "top");
  },
});
