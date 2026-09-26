// Hole.io-style: swallow things smaller than you to grow. 2 minutes.
GAME({
  title: "Sinkhole",
  players: 1,
  controls: "Move with ◀ ▲ ▼ ▶ or drag. Swallow anything that fits into the hole. Bigger things need a bigger hole. 2 minutes.",
  aLabel: "·", bLabel: false,
  WW: 1600, WH: 1000,
  init() {
    const items = [];
    const add = (n, size, emo, pts) => { for (let i = 0; i < n; i++) items.push({ x: E.rand(40, this.WW - 40), y: E.rand(40, this.WH - 40), size, emo, pts }); };
    add(120, 14, "🧍", 1); add(60, 18, "🌳", 2); add(40, 24, "🚗", 4); add(25, 34, "🚌", 8); add(20, 50, "🏠", 15); add(10, 70, "🏢", 30); add(4, 100, "🏟️", 60);
    return { x: 800, y: 500, r: 22, items, time: 120, score: 0, fall: [] };
  },
  update(s, inp, dt) {
    const k = inp[0];
    s.time -= dt; if (s.time <= 0) { s.over = true; return; }
    let dx = (k.right ? 1 : 0) - (k.left ? 1 : 0), dy = (k.down ? 1 : 0) - (k.up ? 1 : 0);
    if (k.pdown) { dx = k.px - 400; dy = k.py - 225; }
    const m = Math.hypot(dx, dy);
    if (m > 5) { s.x += (dx / m) * 200 * dt; s.y += (dy / m) * 200 * dt; }
    s.x = E.clamp(s.x, s.r, this.WW - s.r); s.y = E.clamp(s.y, s.r, this.WH - s.r);
    s.items = s.items.filter((it) => {
      if (it.size < s.r * 0.9 && E.dist(it.x, it.y, s.x, s.y) < s.r - it.size * 0.3) { s.score += it.pts; s.r = Math.sqrt(s.r * s.r + it.pts * 9); s.fall.push({ ...it, t: 0.4 }); E.sfx("pop"); return false; }
      return true;
    });
    s.fall.forEach((f) => { f.t -= dt; f.x = E.lerp(f.x, s.x, 0.2); f.y = E.lerp(f.y, s.y, 0.2); });
    s.fall = s.fall.filter((f) => f.t > 0);
  },
  draw(c, s) {
    const z = Math.max(0.35, Math.min(1, 50 / s.r));
    E.clear(c, "#94a3b8");
    c.save(); c.translate(400, 225); c.scale(z, z); c.translate(-s.x, -s.y);
    E.rect(c, 0, 0, this.WW, this.WH, "#86efac");
    for (let x = 0; x < this.WW; x += 200) E.rect(c, x + 90, 0, 24, this.WH, "#64748b");
    for (let y = 0; y < this.WH; y += 200) E.rect(c, 0, y + 90, this.WW, 24, "#64748b");
    c.fillStyle = "#0f172a"; c.beginPath(); c.ellipse(s.x, s.y, s.r, s.r * 0.8, 0, 0, Math.PI * 2); c.fill();
    s.fall.forEach((f) => E.text(c, f.emo, f.x, f.y, f.size * 1.4 * (f.t / 0.4)));
    s.items.forEach((it) => E.text(c, it.emo, it.x, it.y, it.size * 1.4));
    c.restore();
    E.text(c, `Score ${s.score}   ${Math.ceil(s.time)}s`, 10, 10, 18, "#0f172a", "left", "top");
  },
});
