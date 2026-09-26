// Flap to fly. Hit your opponent from above to score.
GAME({
  title: "Sky Joust",
  players: 2,
  controls: "◀ ▶ steer · A or ▲ = flap. Land on top of your rival to score. First to 5.",
  aLabel: "Flap", bLabel: false,
  PLAT: [[0, 420, 800, 30], [80, 300, 160, 14], [560, 300, 160, 14], [300, 190, 200, 14], [0, 120, 120, 14], [680, 120, 120, 14]],
  init() { return { b: this.birds(), score: [0, 0], wait: 1 }; },
  birds() { return [{ x: 160, y: 280, vx: 0, vy: 0, f: 1, inv: 1 }, { x: 640, y: 280, vx: 0, vy: 0, f: -1, inv: 1 }]; },
  update(s, inp, dt) {
    if (s.wait > 0) { s.wait -= dt; return; }
    s.b.forEach((b, i) => {
      const k = inp[i];
      const dir = (k.right ? 1 : 0) - (k.left ? 1 : 0);
      b.vx = E.clamp(b.vx + dir * 500 * dt, -260, 260); if (dir) b.f = dir; else b.vx *= 0.98;
      if (k.pa || k.pu) { b.vy = Math.min(b.vy, 0) - 250; E.sfx("jump"); }
      b.vy = Math.min(420, b.vy + 700 * dt);
      b.inv = Math.max(0, b.inv - dt);
      const oy = b.y;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < -15) b.x = 815; if (b.x > 815) b.x = -15;
      if (b.y < 15) { b.y = 15; b.vy = 0; }
      for (const [px, py, pw] of this.PLAT) if (b.vy >= 0 && oy + 16 <= py && b.y + 16 >= py && b.x > px - 10 && b.x < px + pw + 10) { b.y = py - 16; b.vy = 0; b.vx *= 0.9; }
    });
    const [a, c] = s.b;
    if (Math.abs(a.x - c.x) < 34 && Math.abs(a.y - c.y) < 30 && !a.inv && !c.inv) {
      const dy = a.y - c.y;
      if (Math.abs(dy) > 6) {
        const w = dy < 0 ? 0 : 1; s.score[w]++; E.sfx("score");
        if (s.score[w] >= 5) { s.over = true; s.winner = w; return; }
        s.b = this.birds(); s.wait = 0.8;
      } else {
        const sgn = Math.sign(a.x - c.x) || 1; a.vx = sgn * 250; c.vx = -sgn * 250; E.sfx("hit");
      }
    }
  },
  ai(s, i) {
    const me = s.b[i], o = s.b[1 - i];
    const above = me.y < o.y - 30;
    return { right: o.x > me.x + 10, left: o.x < me.x - 10, pa: (!above || me.y > o.y - 50) && me.vy > -40 && Math.random() < 0.35 };
  },
  draw(c, s) {
    E.clear(c, "#12081f");
    E.rect(c, 0, 435, 800, 15, "#ff5722");
    this.PLAT.forEach(([x, y, w, h]) => { E.rect(c, x, y, w, h, "#6d4c41"); E.rect(c, x, y, w, 4, "#a1887f"); });
    const cols = ["#29b6f6", "#ef5350"];
    s.b.forEach((b, i) => {
      if (b.inv && Math.floor(b.inv * 10) % 2) return;
      E.circle(c, b.x, b.y, 14, "#fdd835");
      const flap = b.vy < 0 ? -10 : 6;
      c.fillStyle = "#fbc02d"; c.beginPath(); c.moveTo(b.x - 4, b.y); c.lineTo(b.x - b.f * 22, b.y + flap); c.lineTo(b.x + 6, b.y + 4); c.fill();
      E.rect(c, b.x - 6, b.y - 30, 12, 18, cols[i]); E.circle(c, b.x, b.y - 34, 7, "#f1c27d");
      E.rect(c, b.x, b.y - 26, b.f * 26, 3, "#ddd");
    });
    E.text(c, `${E.name(0)} ${s.score[0]} — ${s.score[1]} ${E.name(1)}`, 400, 20, 18);
  },
});
