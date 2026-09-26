// Push the other player out of the ring. Best of 5 rounds.
GAME({
  title: "Sumo Push",
  players: 2,
  controls: "Move ◀ ▲ ▼ ▶ · A = dash. Push your opponent off the ring. First to 3 rounds.",
  aLabel: "Dash", bLabel: false,
  init() { return { p: this.spawn(), wins: [0, 0], wait: 1, msg: "Round 1" }; },
  spawn() { return [{ x: 300, y: 225, vx: 0, vy: 0, dash: 0 }, { x: 500, y: 225, vx: 0, vy: 0, dash: 0 }]; },
  update(s, inp, dt) {
    if (s.wait > 0) { s.wait -= dt; if (s.wait <= 0) s.msg = ""; return; }
    s.p.forEach((p, i) => {
      const k = inp[i];
      let ax = (k.right ? 1 : 0) - (k.left ? 1 : 0), ay = (k.down ? 1 : 0) - (k.up ? 1 : 0);
      p.vx += ax * 900 * dt; p.vy += ay * 900 * dt;
      p.dash = Math.max(0, p.dash - dt);
      if (k.pa && !p.dash) {
        const l = Math.hypot(ax, ay) || 1;
        if (!ax && !ay) { const o = s.p[1 - i]; ax = o.x - p.x; ay = o.y - p.y; }
        const m = Math.hypot(ax, ay) || 1;
        p.vx += (ax / m) * 520; p.vy += (ay / m) * 520; p.dash = 1.2; E.sfx("jump");
      }
      p.vx *= 0.93; p.vy *= 0.93;
      p.x += p.vx * dt; p.y += p.vy * dt;
    });
    const [a, b] = s.p, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    if (d < 60 && d > 0) {
      const nx = dx / d, ny = dy / d, rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      if (rel > 0) { a.vx -= rel * nx * 1.1; a.vy -= rel * ny * 1.1; b.vx += rel * nx * 1.1; b.vy += rel * ny * 1.1; E.sfx("hit"); }
      const push = (60 - d) / 2; a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
    }
    const out = s.p.map((p) => E.dist(p.x, p.y, 400, 225) > 200);
    if (out[0] || out[1]) {
      const w = out[0] && out[1] ? -1 : out[0] ? 1 : 0;
      if (w >= 0) s.wins[w]++;
      E.sfx("score");
      if (w >= 0 && s.wins[w] >= 3) { s.over = true; s.winner = w; return; }
      s.p = this.spawn(); s.wait = 1.2; s.msg = w < 0 ? "Both out!" : E.name(w) + " takes the round";
    }
  },
  ai(s, i) {
    const me = s.p[i], o = s.p[1 - i];
    let tx = o.x + (o.x - 400) * 0.2, ty = o.y + (o.y - 225) * 0.2;
    if (E.dist(me.x, me.y, 400, 225) > 150) { tx = 400; ty = 225; }
    return { left: me.x > tx + 5, right: me.x < tx - 5, up: me.y > ty + 5, down: me.y < ty - 5, pa: E.dist(me.x, me.y, o.x, o.y) < 130 && Math.random() < 0.05 };
  },
  draw(c, s) {
    E.clear(c, "#2b1d14");
    E.circle(c, 400, 225, 215, "#c8a26b"); E.circle(c, 400, 225, 200, "#e8cf9f"); E.ring(c, 400, 225, 200, "#8b5a2b", 6);
    E.line(c, 370, 205, 370, 245, "#8b5a2b", 4); E.line(c, 430, 205, 430, 245, "#8b5a2b", 4);
    const cols = ["#1e88e5", "#e53935"];
    s.p.forEach((p, i) => {
      E.circle(c, p.x, p.y, 30, cols[i]); E.circle(c, p.x, p.y, 20, "#f1c27d");
      if (p.dash > 0.9) E.ring(c, p.x, p.y, 36, "#fff", 3);
      E.text(c, E.name(i), p.x, p.y - 42, 12);
    });
    E.text(c, `${s.wins[0]} - ${s.wins[1]}`, 400, 25, 26);
    if (s.msg) E.text(c, s.msg, 400, 225, 34, "#fff");
  },
});
