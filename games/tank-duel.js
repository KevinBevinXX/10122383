// Top-down tanks in a walled arena. Bullets bounce off walls.
GAME({
  title: "Tank Duel",
  players: 2,
  controls: "◀ ▶ turn · ▲ ▼ drive · A = fire. Shells bounce once. First to 5 hits.",
  aLabel: "Fire", bLabel: false,
  WALLS: [[380, 80, 40, 110], [380, 260, 40, 110], [150, 200, 120, 40], [530, 200, 120, 40], [120, 60, 40, 80], [640, 310, 40, 80]],
  init() { return { t: [this.tank(70, 225, 0), this.tank(730, 225, Math.PI)], shells: [], score: [0, 0], wait: 0.8 }; },
  tank(x, y, a) { return { x, y, a, cool: 0, hitT: 0 }; },
  solid(x, y, r) {
    if (x < r || y < r || x > 800 - r || y > 450 - r) return true;
    return this.WALLS.some(([wx, wy, ww, wh]) => x + r > wx && x - r < wx + ww && y + r > wy && y - r < wy + wh);
  },
  update(s, inp, dt) {
    if (s.wait > 0) { s.wait -= dt; return; }
    s.t.forEach((t, i) => {
      const k = inp[i];
      t.a += ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 3 * dt;
      const v = ((k.up ? 1 : 0) - (k.down ? 0.6 : 0)) * 150 * dt;
      const nx = t.x + Math.cos(t.a) * v, ny = t.y + Math.sin(t.a) * v;
      if (!this.solid(nx, t.y, 18)) t.x = nx;
      if (!this.solid(t.x, ny, 18)) t.y = ny;
      t.cool = Math.max(0, t.cool - dt); t.hitT = Math.max(0, t.hitT - dt);
      if (k.pa && !t.cool && s.shells.filter((b) => b.o === i).length < 3) {
        s.shells.push({ x: t.x + Math.cos(t.a) * 26, y: t.y + Math.sin(t.a) * 26, vx: Math.cos(t.a) * 380, vy: Math.sin(t.a) * 380, o: i, bounces: 1, life: 3 });
        t.cool = 0.45; E.sfx("shoot");
      }
    });
    s.shells = s.shells.filter((b) => {
      b.life -= dt;
      const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
      if (this.solid(nx, ny, 4)) {
        if (b.bounces-- <= 0) return false;
        if (this.solid(nx, b.y, 4)) b.vx = -b.vx; else b.vy = -b.vy;
        E.sfx("pop");
      } else { b.x = nx; b.y = ny; }
      for (let i = 0; i < 2; i++) {
        const t = s.t[i];
        if (E.dist(b.x, b.y, t.x, t.y) < 20 && !(b.o === i && b.life > 2.9)) {
          const w = 1 - i; s.score[w]++; t.hitT = 0.5; E.sfx("boom");
          if (s.score[w] >= 5) { s.over = true; s.winner = w; }
          else { s.t = [this.tank(70, 225, 0), this.tank(730, 225, Math.PI)]; s.shells = []; s.wait = 0.8; }
          return false;
        }
      }
      return b.life > 0;
    });
  },
  los(ax, ay, bx, by) {
    for (let f = 0.05; f < 1; f += 0.05) if (this.solid(E.lerp(ax, bx, f), E.lerp(ay, by, f), 3)) return false;
    return true;
  },
  ai(s, i) {
    const me = s.t[i], o = s.t[1 - i];
    let tx = o.x, ty = o.y;
    const clear = this.los(me.x, me.y, o.x, o.y);
    if (!clear) {
      // head for the nearest open spot that can see the opponent
      let best = Infinity;
      for (let x = 40; x < 800; x += 40) for (let y = 40; y < 450; y += 40) {
        if (this.solid(x, y, 22) || !this.los(x, y, o.x, o.y)) continue;
        const d = E.dist(me.x, me.y, x, y) + (this.los(me.x, me.y, x, y) ? 0 : 400);
        if (d < best) { best = d; tx = x; ty = y; }
      }
    }
    const want = Math.atan2(ty - me.y, tx - me.x);
    const d = ((want - me.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    const k = { left: d < -0.08, right: d > 0.08 };
    if (clear) { k.up = E.dist(me.x, me.y, o.x, o.y) > 250 && Math.abs(d) < 0.5; k.pa = Math.abs(d) < 0.12 && Math.random() < 0.1; }
    else k.up = Math.abs(d) < 0.7;
    return k;
  },
  draw(c, s) {
    E.clear(c, "#5d6b3a");
    for (let x = 0; x < 800; x += 50) for (let y = 0; y < 450; y += 50) if ((x + y) % 100 === 0) E.rect(c, x, y, 50, 50, "#56643a");
    this.WALLS.forEach(([x, y, w, h]) => { E.rect(c, x, y, w, h, "#795548"); E.rect(c, x + 3, y + 3, w - 6, h - 6, "#8d6e63"); });
    const cols = ["#1e88e5", "#e53935"];
    s.t.forEach((t, i) => {
      c.save(); c.translate(t.x, t.y); c.rotate(t.a);
      E.rect(c, -18, -16, 36, 32, t.hitT ? "#fff" : cols[i]);
      E.rect(c, -20, -18, 40, 6, "#333"); E.rect(c, -20, 12, 40, 6, "#333");
      E.circle(c, 0, 0, 10, "#222"); E.rect(c, 0, -3, 28, 6, "#222");
      c.restore();
    });
    s.shells.forEach((b) => E.circle(c, b.x, b.y, 4, "#ffeb3b"));
    E.text(c, `${E.name(0)} ${s.score[0]}  :  ${s.score[1]} ${E.name(1)}`, 400, 20, 18);
  },
});
