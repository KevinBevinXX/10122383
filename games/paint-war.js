// Paint the floor your colour. Most coverage after 60 seconds wins.
GAME({
  title: "Paint War",
  players: 2,
  controls: "Move ◀ ▲ ▼ ▶ and paint the floor. A = splat bomb (paints a big circle, recharges). Most paint in 60s wins.",
  aLabel: "Splat", bLabel: false,
  CW: 40, CH: 22,
  init() { return { g: E.grid(40, 22, -1), p: [{ x: 100, y: 225, cd: 0 }, { x: 700, y: 225, cd: 0 }], time: 60, wait: 1 }; },
  paint(s, x, y, r, i) {
    for (let gy = Math.max(0, Math.floor((y - r) / 20)); gy <= Math.min(21, Math.floor((y + r - 10) / 20)); gy++)
      for (let gx = Math.max(0, Math.floor((x - r) / 20)); gx <= Math.min(39, Math.floor((x + r) / 20)); gx++)
        if (E.dist(gx * 20 + 10, gy * 20 + 15, x, y) <= r) s.g[gy][gx] = i;
  },
  count(s, i) { return s.g.flat().filter((v) => v === i).length; },
  update(s, inp, dt) {
    if (s.wait > 0) { s.wait -= dt; return; }
    s.time -= dt;
    s.p.forEach((p, i) => {
      const k = inp[i];
      p.x = E.clamp(p.x + ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 230 * dt, 10, 790);
      p.y = E.clamp(p.y + ((k.down ? 1 : 0) - (k.up ? 1 : 0)) * 230 * dt, 15, 445);
      this.paint(s, p.x, p.y, 18, i);
      p.cd = Math.max(0, p.cd - dt);
      if (k.pa && !p.cd) { this.paint(s, p.x, p.y, 70, i); p.cd = 5; E.sfx("pop"); }
    });
    const [a, b] = s.p;
    if (E.dist(a.x, a.y, b.x, b.y) < 30) { const d = E.dist(a.x, a.y, b.x, b.y) || 1; a.x -= ((b.x - a.x) / d) * 3; a.y -= ((b.y - a.y) / d) * 3; b.x += ((b.x - a.x) / d) * 3; b.y += ((b.y - a.y) / d) * 3; }
    if (s.time <= 0) { const x = this.count(s, 0), y = this.count(s, 1); s.over = true; s.winner = x === y ? -1 : x > y ? 0 : 1; }
  },
  ai(s, i) {
    const p = s.p[i];
    const gx = Math.floor(p.x / 20), gy = Math.floor((p.y - 5) / 20);
    let best = null, bd = Infinity;
    for (let y = 0; y < 22; y++) for (let x = 0; x < 40; x++) if (s.g[y][x] !== i) { const d = Math.abs(x - gx) + Math.abs(y - gy) + (s.g[y][x] === 1 - i ? -3 : 0); if (d < bd && d > 0) { bd = d; best = [x, y]; } }
    if (!best) return {};
    const tx = best[0] * 20 + 10, ty = best[1] * 20 + 15;
    return { left: p.x > tx + 4, right: p.x < tx - 4, up: p.y > ty + 4, down: p.y < ty - 4, pa: !p.cd && Math.random() < 0.02 };
  },
  draw(c, s) {
    E.clear(c, "#eceff1");
    const cols = ["#2979ff", "#ff4081"];
    for (let y = 0; y < 22; y++) for (let x = 0; x < 40; x++) if (s.g[y][x] >= 0) E.rect(c, x * 20, y * 20 + 5, 20, 20, cols[s.g[y][x]]);
    s.p.forEach((p, i) => { E.circle(c, p.x, p.y, 14, "#fff"); E.circle(c, p.x, p.y, 10, cols[i]); if (!p.cd) E.ring(c, p.x, p.y, 18, cols[i], 2); });
    const a = this.count(s, 0), b = this.count(s, 1), tot = 880;
    E.rect(c, 200, 0, 400 * (a / tot), 10, cols[0]); E.rect(c, 600 - 400 * (b / tot), 0, 400 * (b / tot), 10, cols[1]);
    E.text(c, `${E.name(0)} ${Math.round((a / tot) * 100)}%`, 100, 5, 13, cols[0], "center", "top");
    E.text(c, `${Math.round((b / tot) * 100)}% ${E.name(1)}`, 700, 5, 13, cols[1], "center", "top");
    E.text(c, Math.max(0, Math.ceil(s.time)), 400, 30, 24, "#263238");
  },
});
