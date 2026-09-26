// Slither-style: eat glowing dots, grow long, make bots crash into you.
GAME({
  title: "Slither",
  players: 1,
  controls: "Steer with ◀ ▶ or point with the mouse / finger. A = boost (costs length). Bots that hit your body die.",
  aLabel: "Boost", bLabel: false,
  WW: 2400, WH: 1600,
  init() {
    const s = { snakes: [], food: [], score: 0 };
    s.snakes.push(this.snake(1200, 800, 0, "#22d3ee", true));
    for (let i = 0; i < 8; i++) s.snakes.push(this.snake(E.rand(200, 2200), E.rand(200, 1400), E.rand(0, 7), `hsl(${i * 45},80%,60%)`, false));
    for (let i = 0; i < 300; i++) s.food.push(this.dot());
    return s;
  },
  dot(x, y, v = 1) { return { x: x ?? E.rand(0, this.WW), y: y ?? E.rand(0, this.WH), v, c: E.randi(0, 5) }; },
  snake(x, y, a, col, me) { return { pts: Array.from({ length: 20 }, (_, i) => [x - Math.cos(a) * i * 6, y - Math.sin(a) * i * 6]), a, len: 20, col, me, want: a, boost: false, t: E.rand(0, 5) }; },
  update(s, inp, dt) {
    const k = inp[0], me = s.snakes.find((n) => n.me);
    if (!me) { s.over = true; return; }
    if (k.pdown || k.px) me.want = Math.atan2(k.py - 225, k.px - 400); 
    if (k.left) me.want = me.a - 1; if (k.right) me.want = me.a + 1;
    me.boost = (k.a || (k.pdown && E.dist(k.px, k.py, 400, 225) > 300)) && me.len > 25;
    for (const n of s.snakes) {
      if (!n.me) {
        n.t -= dt;
        const [hx, hy] = n.pts[0];
        const f = s.food.reduce((b, d) => (E.dist(d.x, d.y, hx, hy) < E.dist(b.x, b.y, hx, hy) ? d : b), s.food[0]);
        if (n.t < 0) { n.t = E.rand(0.2, 0.6); n.want = f ? Math.atan2(f.y - hy, f.x - hx) : n.a + E.rand(-1, 1); }
        if (hx < 100 || hy < 100 || hx > this.WW - 100 || hy > this.WH - 100) n.want = Math.atan2(this.WH / 2 - hy, this.WW / 2 - hx);
      }
      const d = Math.atan2(Math.sin(n.want - n.a), Math.cos(n.want - n.a));
      n.a += E.clamp(d, -4 * dt, 4 * dt);
      const sp = n.boost ? 260 : 140;
      const [hx, hy] = n.pts[0];
      n.pts.unshift([hx + Math.cos(n.a) * sp * dt, hy + Math.sin(n.a) * sp * dt]);
      if (n.boost && Math.random() < 0.3) { n.len -= 0.5; const t = n.pts[n.pts.length - 1]; s.food.push(this.dot(t[0], t[1], 1)); }
      const keep = Math.floor(n.len * (6 / (sp * dt)));
      while (n.pts.length > keep) n.pts.pop();
    }
    for (const n of s.snakes) {
      const [hx, hy] = n.pts[0], r = 6 + n.len / 40;
      s.food = s.food.filter((f) => { if (E.dist(f.x, f.y, hx, hy) < r + 8) { n.len += f.v; if (n.me) { s.score += f.v; E.sfx("pop"); } return false; } return true; });
    }
    const dead = [];
    for (const n of s.snakes) {
      const [hx, hy] = n.pts[0];
      if (hx < 0 || hy < 0 || hx > this.WW || hy > this.WH) { dead.push(n); continue; }
      for (const o of s.snakes) if (o !== n && o.pts.some(([x, y], i) => i % 2 === 0 && E.dist(x, y, hx, hy) < 6 + o.len / 40 + 4)) { dead.push(n); break; }
    }
    for (const n of dead) {
      n.pts.forEach(([x, y], i) => { if (i % 3 === 0) s.food.push(this.dot(x + E.rand(-8, 8), y + E.rand(-8, 8), 2)); });
      s.snakes.splice(s.snakes.indexOf(n), 1);
      if (n.me) { s.over = true; E.sfx("boom"); return; }
      E.sfx("coin");
      const a = E.rand(0, 7); s.snakes.push(this.snake(E.rand(200, 2200), E.rand(200, 1400), a, n.col, false));
    }
    while (s.food.length < 300) s.food.push(this.dot());
  },
  draw(c, s) {
    const me = s.snakes.find((n) => n.me) || s.snakes[0];
    const [cx, cy] = me.pts[0];
    E.clear(c, "#111");
    c.save(); c.translate(400 - cx, 225 - cy);
    for (let x = 0; x <= this.WW; x += 60) E.line(c, x, 0, x, this.WH, "#1c1c1c", 1);
    for (let y = 0; y <= this.WH; y += 60) E.line(c, 0, y, this.WW, y, "#1c1c1c", 1);
    c.strokeStyle = "#ef4444"; c.lineWidth = 6; c.strokeRect(0, 0, this.WW, this.WH);
    const cols = ["#f87171", "#fbbf24", "#34d399", "#60a5fa", "#c084fc", "#f472b6"];
    s.food.forEach((f) => { if (Math.abs(f.x - cx) < 420 && Math.abs(f.y - cy) < 250) E.circle(c, f.x, f.y, 3 + f.v, cols[f.c]); });
    for (const n of s.snakes) {
      const r = 6 + n.len / 40;
      for (let i = n.pts.length - 1; i >= 0; i -= 2) { const [x, y] = n.pts[i]; if (Math.abs(x - cx) < 440 && Math.abs(y - cy) < 270) E.circle(c, x, y, r, i % 4 ? n.col : "#fff3"); }
      const [hx, hy] = n.pts[0];
      E.circle(c, hx, hy, r, n.col);
      E.circle(c, hx + Math.cos(n.a - 0.5) * r * 0.6, hy + Math.sin(n.a - 0.5) * r * 0.6, r * 0.35, "#fff");
      E.circle(c, hx + Math.cos(n.a + 0.5) * r * 0.6, hy + Math.sin(n.a + 0.5) * r * 0.6, r * 0.35, "#fff");
    }
    c.restore();
    E.text(c, `Length ${Math.floor(me.len)}`, 10, 10, 18, "#fff", "left", "top");
  },
});
