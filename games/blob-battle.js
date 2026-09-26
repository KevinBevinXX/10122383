// Eat pellets to grow. Eat the other blob when you're bigger.
GAME({
  title: "Blob Battle",
  players: 2,
  controls: "Move ◀ ▲ ▼ ▶ (or drag). Eat dots to grow. Touch a smaller blob to eat it. A = split boost.",
  aLabel: "Boost", bLabel: false,
  init() {
    const food = Array.from({ length: 90 }, () => [E.rand(10, 790), E.rand(10, 440)]);
    return { b: [{ x: 150, y: 225, r: 18, cd: 0, boost: 0 }, { x: 650, y: 225, r: 18, cd: 0, boost: 0 }], food, time: 90 };
  },
  update(s, inp, dt) {
    s.time -= dt;
    s.b.forEach((b, i) => {
      const k = inp[i];
      let dx = (k.right ? 1 : 0) - (k.left ? 1 : 0), dy = (k.down ? 1 : 0) - (k.up ? 1 : 0);
      if (k.pdown && E.mode() !== "local") { dx = k.px - b.x; dy = k.py - b.y; if (Math.hypot(dx, dy) < 8) dx = dy = 0; }
      const m = Math.hypot(dx, dy) || 1;
      b.cd = Math.max(0, b.cd - dt); b.boost = Math.max(0, b.boost - dt);
      if (k.pa && !b.cd && b.r > 22) { b.boost = 0.35; b.cd = 3; b.r *= 0.92; E.sfx("jump"); }
      const sp = (230 * 18 ** 0.4) / b.r ** 0.4 * (b.boost ? 2.6 : 1);
      b.x = E.clamp(b.x + (dx / m) * sp * dt, b.r, 800 - b.r); b.y = E.clamp(b.y + (dy / m) * sp * dt, b.r, 450 - b.r);
      s.food = s.food.filter(([fx, fy]) => { if (E.dist(fx, fy, b.x, b.y) < b.r) { b.r = Math.sqrt(b.r * b.r + 16); return false; } return true; });
      b.r = Math.max(14, b.r - b.r * 0.002 * dt);
    });
    while (s.food.length < 90) s.food.push([E.rand(10, 790), E.rand(10, 440)]);
    const [a, c] = s.b, d = E.dist(a.x, a.y, c.x, c.y);
    if (d < Math.max(a.r, c.r) - Math.min(a.r, c.r) * 0.3 && Math.abs(a.r - c.r) > 3) { s.over = true; s.winner = a.r > c.r ? 0 : 1; E.sfx("boom"); }
    if (s.time <= 0) { s.over = true; s.winner = Math.abs(a.r - c.r) < 1 ? -1 : a.r > c.r ? 0 : 1; }
  },
  ai(s, i) {
    const me = s.b[i], o = s.b[1 - i];
    let tx, ty;
    if (me.r > o.r + 5) [tx, ty] = [o.x, o.y];
    else if (o.r > me.r + 5 && E.dist(me.x, me.y, o.x, o.y) < 200) [tx, ty] = [me.x + (me.x - o.x), me.y + (me.y - o.y)];
    else { const f = s.food.reduce((b, f) => (E.dist(f[0], f[1], me.x, me.y) < E.dist(b[0], b[1], me.x, me.y) ? f : b)); [tx, ty] = f; }
    return { left: me.x > tx + 5, right: me.x < tx - 5, up: me.y > ty + 5, down: me.y < ty - 5, pa: me.r > o.r + 5 && E.dist(me.x, me.y, o.x, o.y) < 150 && Math.random() < 0.1 };
  },
  draw(c, s) {
    E.clear(c, "#f5f5f5");
    for (let x = 0; x < 800; x += 40) E.line(c, x, 0, x, 450, "#e0e0e0", 1);
    for (let y = 0; y < 450; y += 40) E.line(c, 0, y, 800, y, "#e0e0e0", 1);
    s.food.forEach(([x, y], k) => E.circle(c, x, y, 4, ["#ef5350", "#ab47bc", "#66bb6a", "#ffa726", "#29b6f6"][k % 5]));
    const cols = [["#1e88e5", "#1565c0"], ["#e53935", "#b71c1c"]];
    [...s.b.keys()].sort((a, b) => s.b[a].r - s.b[b].r).forEach((i) => {
      const b = s.b[i]; E.circle(c, b.x, b.y, b.r + 3, cols[i][1]); E.circle(c, b.x, b.y, b.r, cols[i][0]);
      E.text(c, E.name(i), b.x, b.y, Math.max(10, b.r / 2.2));
    });
    E.text(c, `${Math.max(0, Math.ceil(s.time))}s · ${Math.round(s.b[0].r)} vs ${Math.round(s.b[1].r)}`, 400, 15, 14, "#555");
  },
});
