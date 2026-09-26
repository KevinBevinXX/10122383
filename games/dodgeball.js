// Grab a ball, throw it at your rival. Catch throws with good timing.
GAME({
  title: "Dodgeball",
  players: 2,
  controls: "Move ◀ ▲ ▼ ▶ · A = throw (at your rival) · B = catch (press just before it hits). 3 hits wins.",
  aLabel: "Throw", bLabel: "Catch",
  init() { return { p: [this.pl(150), this.pl(650)], balls: [this.ball(320, 140), this.ball(320, 310), this.ball(480, 140), this.ball(480, 310)], hits: [0, 0] }; },
  pl(x) { return { x, y: 225, hold: -1, catchT: 0, cool: 0, inv: 0 }; },
  ball(x, y) { return { x, y, vx: 0, vy: 0, live: -1 }; },
  update(s, inp, dt) {
    s.p.forEach((p, i) => {
      const k = inp[i], lo = i === 0 ? 30 : 430, hi = i === 0 ? 370 : 770;
      p.x = E.clamp(p.x + ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 240 * dt, lo, hi);
      p.y = E.clamp(p.y + ((k.down ? 1 : 0) - (k.up ? 1 : 0)) * 240 * dt, 40, 420);
      p.catchT = Math.max(0, p.catchT - dt); p.cool = Math.max(0, p.cool - dt); p.inv = Math.max(0, p.inv - dt);
      if (k.pb && !p.cool) { p.catchT = 0.25; p.cool = 0.7; }
      if (k.pa && p.hold >= 0) {
        const o = s.p[1 - i], b = s.balls[p.hold], d = E.dist(p.x, p.y, o.x, o.y) || 1;
        b.vx = ((o.x - p.x) / d) * 520; b.vy = ((o.y - p.y) / d) * 520; b.live = i; b.x = p.x; b.y = p.y; p.hold = -1; E.sfx("shoot");
      }
    });
    s.balls.forEach((b, bi) => {
      const holder = s.p.findIndex((p) => p.hold === bi);
      if (holder >= 0) { b.x = s.p[holder].x + (holder === 0 ? 18 : -18); b.y = s.p[holder].y; return; }
      b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= 0.993; b.vy *= 0.993;
      if (b.y < 30 || b.y > 430) { b.vy = -b.vy; b.y = E.clamp(b.y, 30, 430); }
      if (b.x < 10 || b.x > 790) { b.vx = -b.vx; b.x = E.clamp(b.x, 10, 790); }
      if (Math.hypot(b.vx, b.vy) < 120) b.live = -1;
      s.p.forEach((p, i) => {
        if (E.dist(b.x, b.y, p.x, p.y) > 26) return;
        if (b.live === 1 - i) {
          if (p.catchT > 0 && p.hold < 0) { p.hold = bi; b.live = -1; E.sfx("coin"); return; }
          if (p.inv) return;
          s.hits[1 - i]++; p.inv = 1; b.vx *= -0.3; b.vy *= -0.3; b.live = -1; E.sfx("boom");
          if (s.hits[1 - i] >= 3) { s.over = true; s.winner = 1 - i; }
        } else if (b.live < 0 && p.hold < 0 && ((i === 0 && b.x < 400) || (i === 1 && b.x > 400))) { p.hold = bi; E.sfx("pop"); }
      });
    });
  },
  ai(s, i) {
    const me = s.p[i], o = s.p[1 - i], k = {};
    const incoming = s.balls.find((b) => b.live === 1 - i && E.dist(b.x, b.y, me.x, me.y) < 90);
    let tx = i === 1 ? 650 : 150, ty = 225;
    if (me.hold < 0) {
      const free = s.balls.find((b) => b.live < 0 && !s.p.some((p) => s.balls[p.hold] === b) && (i === 1 ? b.x > 400 : b.x < 400));
      if (free) { tx = free.x; ty = free.y; }
    } else { ty = o.y + 60 * Math.sin(me.x); if (Math.random() < 0.03) k.pa = true; }
    if (incoming) { if (Math.random() < 0.5) k.pb = true; ty = me.y + (incoming.y < me.y ? 80 : -80); }
    Object.assign(k, { left: me.x > tx + 6, right: me.x < tx - 6, up: me.y > ty + 6, down: me.y < ty - 6 });
    return k;
  },
  draw(c, s) {
    E.clear(c, "#8d6e63");
    E.rect(c, 10, 20, 780, 420, "#d7a86e");
    E.line(c, 400, 20, 400, 440, "#fff", 4);
    const cols = ["#1e88e5", "#e53935"];
    s.p.forEach((p, i) => {
      if (p.inv && Math.floor(p.inv * 10) % 2) return;
      E.circle(c, p.x, p.y, 20, cols[i]); E.circle(c, p.x, p.y - 4, 10, "#f1c27d");
      if (p.catchT) E.ring(c, p.x, p.y, 28, "#fff", 3);
    });
    s.balls.forEach((b) => E.circle(c, b.x, b.y, 10, b.live >= 0 ? "#ffeb3b" : "#f4511e"));
    E.text(c, `Hits: ${E.name(0)} ${s.hits[0]} — ${s.hits[1]} ${E.name(1)}`, 400, 10, 14, "#fff", "center", "top");
  },
});
