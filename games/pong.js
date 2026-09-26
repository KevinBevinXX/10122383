// Classic paddle tennis.
GAME({
  title: "Pong",
  players: 2,
  controls: "Move your paddle ▲ ▼ (or drag). First to 7.",
  bLabel: false, aLabel: "Serve",
  init() { return { y: [175, 175], b: this.serve(1), score: [0, 0], wait: 1 }; },
  serve(dir) { const a = E.rand(-0.5, 0.5); return { x: 400, y: 225, vx: Math.cos(a) * 330 * dir, vy: Math.sin(a) * 330 }; },
  update(s, inp, dt) {
    for (let i = 0; i < 2; i++) {
      const k = inp[i];
      let v = (k.down ? 1 : 0) - (k.up ? 1 : 0);
      if (k.pdown && (E.mode() !== "local" || (i === 0) === (k.px < 400))) v = E.clamp((k.py - 50 - s.y[i]) / 10, -1, 1);
      s.y[i] = E.clamp(s.y[i] + v * 420 * dt, 0, 350);
    }
    if (s.wait > 0) { s.wait -= dt; return; }
    const b = s.b;
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.y < 8 || b.y > 442) { b.vy = -b.vy; b.y = E.clamp(b.y, 8, 442); E.sfx("pop"); }
    for (const [i, px] of [[0, 30], [1, 770]]) {
      const side = i === 0 ? b.x - 8 < px + 10 && b.vx < 0 : b.x + 8 > px - 10 && b.vx > 0;
      if (side && b.y > s.y[i] - 8 && b.y < s.y[i] + 108 && Math.abs(b.x - px) < 24) {
        const off = (b.y - (s.y[i] + 50)) / 50, sp = Math.min(900, Math.hypot(b.vx, b.vy) * 1.06);
        b.vx = Math.cos(off * 1.0) * sp * (i === 0 ? 1 : -1); b.vy = Math.sin(off * 1.0) * sp;
        E.sfx("hit");
      }
    }
    if (b.x < -20 || b.x > 820) {
      const w = b.x < 0 ? 1 : 0;
      s.score[w]++; E.sfx("score");
      if (s.score[w] >= 7) { s.over = true; s.winner = w; }
      s.b = this.serve(w === 0 ? 1 : -1); s.wait = 0.8;
    }
  },
  ai(s, i) {
    const t = s.b.vx > 0 ? s.b.y : 225, mid = s.y[i] + 50;
    return { up: t < mid - 20, down: t > mid + 20 };
  },
  draw(c, s) {
    E.clear(c, "#0b0f1a");
    for (let y = 0; y < 450; y += 30) E.rect(c, 398, y, 4, 16, "#334");
    E.rect(c, 20, s.y[0], 12, 100, "#4fc3f7"); E.rect(c, 768, s.y[1], 12, 100, "#ff8a65");
    E.circle(c, s.b.x, s.b.y, 8, "#fff");
    E.text(c, s.score[0], 340, 50, 48, "#4fc3f7"); E.text(c, s.score[1], 460, 50, 48, "#ff8a65");
    E.text(c, E.name(0), 200, 430, 14, "#556"); E.text(c, E.name(1), 600, 430, 14, "#556");
  },
});
