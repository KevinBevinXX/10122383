// Drop balls through the pegs. Aim for the high-value slots.
GAME({
  title: "Plinko",
  players: 1, touch: "pointer",
  controls: "Tap where to drop (or ◀ ▶ + A). 20 balls — score as much as you can.",
  SLOTS: [10, 50, 5, 100, 5, 50, 10, 500, 10, 50, 5, 100, 5, 50, 10],
  init() {
    const pegs = [];
    for (let r = 0; r < 9; r++) for (let c = 0; c < 15 - (r % 2); c++) pegs.push([150 + c * 34 + (r % 2 ? 17 : 0) + 17, 80 + r * 34]);
    return { pegs, balls: [], left: 20, x: 400, score: 0, last: null };
  },
  update(s, inp, dt) {
    const k = inp[0];
    s.x = E.clamp(s.x + ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 300 * dt, 160, 640);
    let drop = k.pa ? s.x : null;
    for (const t of k.taps) drop = E.clamp(t.x, 160, 640);
    if (drop !== null && s.left > 0) { s.balls.push({ x: drop + E.rand(-1, 1), y: 40, vx: 0, vy: 0 }); s.left--; E.sfx("click"); }
    s.balls = s.balls.filter((b) => {
      for (let n = 0; n < 3; n++) {
        b.vy += (900 * dt) / 3; b.x += (b.vx * dt) / 3; b.y += (b.vy * dt) / 3;
        for (const [px, py] of s.pegs) {
          const dx = b.x - px, dy = b.y - py, d = Math.hypot(dx, dy);
          if (d < 12 && d > 0) { const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny; if (dot < 0) { b.vx -= 1.5 * dot * nx; b.vy -= 1.5 * dot * ny; } b.x = px + nx * 12; b.y = py + ny * 12; b.vx += E.rand(-8, 8); }
        }
        if (b.x < 155) { b.x = 155; b.vx = Math.abs(b.vx); } if (b.x > 645) { b.x = 645; b.vx = -Math.abs(b.vx); }
      }
      if (b.y > 400) { const i = E.clamp(Math.floor((b.x - 145) / 34), 0, 14); s.score += this.SLOTS[i]; s.last = { i, t: 1 }; E.sfx(this.SLOTS[i] >= 100 ? "win" : "coin"); return false; }
      return true;
    });
    if (s.last) s.last.t -= dt;
    if (!s.left && !s.balls.length) s.over = true;
  },
  draw(c, s) {
    E.clear(c, "#0f172a");
    s.pegs.forEach(([x, y]) => E.circle(c, x, y, 5, "#cbd5e1"));
    this.SLOTS.forEach((v, i) => {
      const x = 145 + i * 34;
      E.rect(c, x, 400, 33, 40, s.last && s.last.i === i && s.last.t > 0 ? "#fde047" : v >= 500 ? "#dc2626" : v >= 100 ? "#ea580c" : v >= 50 ? "#2563eb" : "#334155");
      E.text(c, v, x + 17, 420, v >= 100 ? 12 : 13, "#fff");
    });
    s.balls.forEach((b) => E.circle(c, b.x, b.y, 7, "#f472b6"));
    if (s.left) { E.circle(c, s.x, 40, 7, "rgba(244,114,182,.5)"); E.line(c, s.x, 50, s.x, 65, "rgba(244,114,182,.5)", 2); }
    E.text(c, "Score", 70, 60, 16); E.text(c, s.score, 70, 90, 28, "#fde047");
    E.text(c, "Balls", 730, 60, 16); E.text(c, s.left, 730, 90, 28, "#f472b6");
  },
});
