// Break all the bricks. Catch power-ups.
GAME({
  title: "Brick Breaker",
  players: 1,
  controls: "Move the paddle with ◀ ▶ or the mouse/finger. A launches the ball.",
  aLabel: "Launch", bLabel: false,
  init() { const s = { px: 400, pw: 100, balls: [], level: 1, lives: 3, score: 0, pups: [] }; this.build(s); this.reset(s); return s; },
  build(s) {
    s.bricks = [];
    const rows = Math.min(8, 4 + s.level);
    for (let r = 0; r < rows; r++) for (let c = 0; c < 12; c++) if ((s.level + r * c) % 7 !== 3 || s.level === 1) s.bricks.push({ x: 42 + c * 60, y: 50 + r * 24, hp: r < s.level - 1 ? 2 : 1, col: r });
  },
  reset(s) { s.balls = [{ x: s.px, y: 400, vx: 0, vy: 0, stuck: true }]; },
  update(s, inp, dt) {
    const k = inp[0];
    if (k.pdown || k.taps.length) s.px = k.px; else s.px += ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 520 * dt;
    s.px = E.clamp(s.px, s.pw / 2, 800 - s.pw / 2);
    s.balls.forEach((b) => {
      if (b.stuck) { b.x = s.px; b.y = 408; if (k.pa || k.taps.length) { b.stuck = false; b.vx = E.rand(-150, 150); b.vy = -380; } return; }
      const sub = 3;
      for (let n = 0; n < sub; n++) {
        b.x += (b.vx * dt) / sub; b.y += (b.vy * dt) / sub;
        if (b.x < 8 || b.x > 792) { b.vx = -b.vx; b.x = E.clamp(b.x, 8, 792); }
        if (b.y < 8) { b.vy = Math.abs(b.vy); }
        if (b.vy > 0 && b.y > 410 && b.y < 425 && Math.abs(b.x - s.px) < s.pw / 2 + 8) {
          const off = (b.x - s.px) / (s.pw / 2), sp = Math.min(700, Math.hypot(b.vx, b.vy) * 1.01);
          b.vx = off * sp * 0.8; b.vy = -Math.sqrt(Math.max(1, sp * sp - b.vx * b.vx)); E.sfx("hit");
        }
        for (const br of s.bricks) {
          if (br.hp <= 0) continue;
          if (b.x > br.x - 8 && b.x < br.x + 56 + 8 && b.y > br.y - 8 && b.y < br.y + 20 + 8) {
            const ox = Math.min(b.x - (br.x - 8), br.x + 64 - b.x), oy = Math.min(b.y - (br.y - 8), br.y + 28 - b.y);
            if (ox < oy) b.vx = -b.vx; else b.vy = -b.vy;
            br.hp--; s.score += 10; E.sfx("pop");
            if (br.hp <= 0 && Math.random() < 0.12) s.pups.push({ x: br.x + 28, y: br.y + 10, k: E.randi(0, 2) });
            break;
          }
        }
      }
    });
    s.bricks = s.bricks.filter((b) => b.hp > 0);
    s.balls = s.balls.filter((b) => b.y < 470);
    s.pups = s.pups.filter((p) => {
      p.y += 150 * dt;
      if (p.y > 405 && p.y < 430 && Math.abs(p.x - s.px) < s.pw / 2 + 10) {
        E.sfx("coin");
        if (p.k === 0) s.pw = Math.min(180, s.pw + 30);
        else if (p.k === 1) { const b = s.balls[0]; if (b) s.balls.push({ ...b, vx: -b.vx || 200, vy: b.vy || -380, stuck: false }); }
        else s.lives++;
        return false;
      }
      return p.y < 460;
    });
    if (!s.balls.length) { s.lives--; E.sfx("lose"); s.pw = 100; if (s.lives <= 0) { s.over = true; return; } this.reset(s); }
    if (!s.bricks.length) { s.level++; this.build(s); this.reset(s); E.sfx("win"); }
  },
  draw(c, s) {
    E.clear(c, "#0f172a");
    const cols = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];
    s.bricks.forEach((b) => { E.rrect(c, b.x, b.y, 56, 20, 4, cols[b.col % 8]); if (b.hp > 1) E.rect(c, b.x + 4, b.y + 8, 48, 4, "rgba(255,255,255,.5)"); });
    E.rrect(c, s.px - s.pw / 2, 415, s.pw, 12, 6, "#e2e8f0");
    s.balls.forEach((b) => E.circle(c, b.x, b.y, 8, "#fff"));
    s.pups.forEach((p) => E.text(c, ["↔", "●●", "♥"][p.k], p.x, p.y, 16, ["#22c55e", "#fff", "#ef4444"][p.k]));
    E.text(c, `Score ${s.score}   Level ${s.level}   ${"♥".repeat(s.lives)}`, 400, 20, 16);
  },
});
