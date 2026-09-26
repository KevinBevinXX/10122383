// Top-down air hockey. Drag your mallet or use the arrows.
GAME({
  title: "Air Hockey",
  players: 2,
  controls: "Move your mallet with ◀ ▲ ▼ ▶ or by dragging. First to 7.",
  bLabel: false, aLabel: "·",
  init() { return { m: [{ x: 120, y: 225, vx: 0, vy: 0 }, { x: 680, y: 225, vx: 0, vy: 0 }], p: { x: 400, y: 225, vx: 0, vy: 0 }, score: [0, 0], wait: 0.6 }; },
  update(s, inp, dt) {
    s.m.forEach((m, i) => {
      const k = inp[i], ox = m.x, oy = m.y;
      const minX = i === 0 ? 30 : 430, maxX = i === 0 ? 370 : 770;
      const usePtr = k.pdown && (E.mode() !== "local" || (i === 0) === (k.px < 400));
      if (usePtr) { m.x = E.lerp(m.x, k.px, 0.5); m.y = E.lerp(m.y, k.py, 0.5); }
      else {
        m.x += ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 420 * dt;
        m.y += ((k.down ? 1 : 0) - (k.up ? 1 : 0)) * 420 * dt;
      }
      m.x = E.clamp(m.x, minX, maxX); m.y = E.clamp(m.y, 30, 420);
      m.vx = (m.x - ox) / dt; m.vy = (m.y - oy) / dt;
    });
    if (s.wait > 0) { s.wait -= dt; return; }
    const p = s.p, R = 16;
    p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.997; p.vy *= 0.997;
    if (p.y < 15 + R || p.y > 435 - R) { p.vy = -p.vy; p.y = E.clamp(p.y, 15 + R, 435 - R); E.sfx("pop"); }
    const inGoal = p.y > 160 && p.y < 290;
    if (p.x < 15 + R && !inGoal) { p.vx = Math.abs(p.vx); p.x = 15 + R; E.sfx("pop"); }
    if (p.x > 785 - R && !inGoal) { p.vx = -Math.abs(p.vx); p.x = 785 - R; E.sfx("pop"); }
    if (p.x < 0 || p.x > 800) {
      const w = p.x < 0 ? 1 : 0; s.score[w]++; E.sfx("score");
      if (s.score[w] >= 7) { s.over = true; s.winner = w; }
      s.p = { x: w === 0 ? 480 : 320, y: 225, vx: 0, vy: 0 }; s.wait = 0.6;
      return;
    }
    s.m.forEach((m) => {
      const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy);
      if (d < R + 26 && d > 0) {
        const nx = dx / d, ny = dy / d;
        p.x = m.x + nx * (R + 26); p.y = m.y + ny * (R + 26);
        const rel = (p.vx - m.vx) * nx + (p.vy - m.vy) * ny;
        if (rel < 0) { p.vx -= 2 * rel * nx; p.vy -= 2 * rel * ny; }
        const sp = Math.hypot(p.vx, p.vy);
        if (sp > 1100) { p.vx *= 1100 / sp; p.vy *= 1100 / sp; }
        E.sfx("hit");
      }
    });
  },
  ai(s, i) {
    const m = s.m[i], p = s.p, o = s.m[1 - i], home = i === 0 ? 100 : 700;
    const mine = i === 1 ? p.x >= 390 : p.x <= 410;
    let tx, ty;
    if (!mine) { tx = home; ty = E.clamp(p.y, 170, 280); }
    else {
      // aim at the side of the goal the defender isn't covering
      const gx = i === 1 ? 0 : 800, gy = o.y > 225 ? 180 : 270;
      const dx = p.x - gx, dy = p.y - gy, d = Math.hypot(dx, dy) || 1;
      const bx = p.x + (dx / d) * 40, by = p.y + (dy / d) * 40;
      const behind = E.dist(m.x, m.y, gx, gy) > E.dist(p.x, p.y, gx, gy) + 20;
      [tx, ty] = behind && E.dist(m.x, m.y, bx, by) < 30 ? [p.x, p.y] : [bx, by];
    }
    return { left: m.x > tx + 6, right: m.x < tx - 6, up: m.y > ty + 6, down: m.y < ty - 6 };
  },
  draw(c, s) {
    E.clear(c, "#1b2735");
    E.rrect(c, 15, 15, 770, 420, 30, "#e8f4fb");
    E.line(c, 400, 15, 400, 435, "#e57373", 3);
    E.ring(c, 400, 225, 60, "#e57373", 3);
    E.rect(c, 5, 160, 12, 130, "#263238"); E.rect(c, 783, 160, 12, 130, "#263238");
    E.ring(c, 15, 225, 80, "#90caf9", 3); E.ring(c, 785, 225, 80, "#90caf9", 3);
    E.circle(c, s.p.x, s.p.y, 16, "#212121"); E.circle(c, s.p.x, s.p.y, 10, "#424242");
    [["#1e88e5", "#64b5f6"], ["#e53935", "#ef9a9a"]].forEach(([a, b], i) => {
      E.circle(c, s.m[i].x, s.m[i].y, 26, a); E.circle(c, s.m[i].x, s.m[i].y, 12, b);
    });
    E.text(c, s.score[0], 360, 40, 30, "#1e88e5"); E.text(c, s.score[1], 440, 40, 30, "#e53935");
  },
});
