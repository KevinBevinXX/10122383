// Swipe through flying fruit. Don't hit the bombs.
GAME({
  title: "Fruit Slash",
  players: 1, touch: "pointer",
  controls: "Drag (or hold the mouse button) and swipe across fruit. Avoid bombs. Missing 3 fruit ends the game.",
  EMO: ["🍉", "🍎", "🍊", "🍌", "🍍", "🥝", "🍑", "🍋"],
  init() { return { items: [], halves: [], trail: [], score: 0, miss: 0, next: 0.5, t: 0 }; },
  update(s, inp, dt) {
    const k = inp[0];
    s.t += dt; s.next -= dt;
    if (s.next <= 0) {
      const n = E.randi(1, 2 + Math.min(3, Math.floor(s.t / 20)));
      for (let i = 0; i < n; i++) s.items.push({ x: E.rand(120, 680), y: 470, vx: E.rand(-120, 120), vy: E.rand(-700, -560), bomb: Math.random() < 0.12 + Math.min(0.1, s.t / 600), e: E.randi(0, 7), rot: 0 });
      s.next = E.rand(0.8, 1.6);
    }
    if (k.pdown) s.trail.push([k.px, k.py]); else s.trail = [];
    if (s.trail.length > 8) s.trail.shift();
    s.items = s.items.filter((it) => {
      it.vy += 600 * dt; it.x += it.vx * dt; it.y += it.vy * dt; it.rot += dt * 3;
      if (s.trail.length > 1) {
        const [x1, y1] = s.trail[s.trail.length - 2], [x2, y2] = s.trail[s.trail.length - 1];
        const len = Math.hypot(x2 - x1, y2 - y1);
        if (len > 4) {
          const t = E.clamp(((it.x - x1) * (x2 - x1) + (it.y - y1) * (y2 - y1)) / (len * len), 0, 1);
          if (E.dist(it.x, it.y, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t) < 34) {
            if (it.bomb) { s.over = true; E.sfx("boom"); return false; }
            s.score++; E.sfx("pop");
            s.halves.push({ ...it, vx: -120, vy: it.vy * 0.3, side: -1 }, { ...it, vx: 120, vy: it.vy * 0.3, side: 1 });
            return false;
          }
        }
      }
      if (it.y > 480 && it.vy > 0) { if (!it.bomb) { s.miss++; E.sfx("lose"); if (s.miss >= 3) s.over = true; } return false; }
      return true;
    });
    s.halves = s.halves.filter((h) => { h.vy += 600 * dt; h.x += h.vx * dt; h.y += h.vy * dt; return h.y < 500; });
  },
  draw(c, s) {
    E.clear(c, "#5d4037");
    for (let x = 0; x < 800; x += 80) E.rect(c, x, 0, 3, 450, "#4e342e");
    s.halves.forEach((h) => { c.save(); c.beginPath(); c.rect(h.side < 0 ? h.x - 40 : h.x, h.y - 40, 40, 80); c.clip(); E.text(c, this.EMO[h.e], h.x, h.y, 50); c.restore(); });
    s.items.forEach((it) => { c.save(); c.translate(it.x, it.y); c.rotate(it.rot); E.text(c, it.bomb ? "💣" : this.EMO[it.e], 0, 0, 54); c.restore(); });
    if (s.trail.length > 1) { c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = 5; c.lineCap = "round"; c.beginPath(); s.trail.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); }
    E.text(c, s.score, 20, 20, 36, "#ffeb3b", "left", "top");
    E.text(c, "✖".repeat(s.miss) + "✕".repeat(3 - s.miss), 780, 25, 26, "#ef5350", "right", "top");
  },
});
