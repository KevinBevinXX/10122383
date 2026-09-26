// 8-ball pool (simplified): pot your group, then the 8.
GAME({
  title: "Pool",
  players: 2,
  controls: "Aim with ◀ ▶ (hold B for fine aim), power ▲ ▼, A to shoot — or drag back from the cue ball and release.\nPot all your balls (solids or stripes), then the 8.",
  aLabel: "Shoot", bLabel: "Fine",
  X0: 70, Y0: 60, X1: 730, Y1: 390, R: 10,
  init() {
    const balls = [{ n: 0, x: 230, y: 225, vx: 0, vy: 0, in: false }];
    const order = [1, 9, 2, 10, 8, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15];
    let k = 0;
    for (let col = 0; col < 5; col++) for (let row = 0; row <= col; row++) balls.push({ n: order[k++], x: 520 + col * 18, y: 225 + (row - col / 2) * 21, vx: 0, vy: 0, in: false });
    return { balls, turn: 0, group: [null, null], aim: 0, pow: 0.6, t: 0, msg: "Break!", potted: [], scratch: false, firstHit: null, drag: false };
  },
  moving(s) { return s.balls.some((b) => !b.in && Math.hypot(b.vx, b.vy) > 2); },
  POCKETS() { return [[this.X0, this.Y0], [400, this.Y0 - 4], [this.X1, this.Y0], [this.X0, this.Y1], [400, this.Y1 + 4], [this.X1, this.Y1]]; },
  isGroup(n, g) { return g === "solids" ? n >= 1 && n <= 7 : n >= 9; },
  physics(s, dt) {
    const R = this.R, sub = 4, P = this.POCKETS();
    for (let k = 0; k < sub; k++) {
      for (const b of s.balls) {
        if (b.in) continue;
        b.x += (b.vx * dt) / sub; b.y += (b.vy * dt) / sub;
        if (b.x < this.X0 + R) { b.x = this.X0 + R; b.vx = Math.abs(b.vx) * 0.8; }
        if (b.x > this.X1 - R) { b.x = this.X1 - R; b.vx = -Math.abs(b.vx) * 0.8; }
        if (b.y < this.Y0 + R) { b.y = this.Y0 + R; b.vy = Math.abs(b.vy) * 0.8; }
        if (b.y > this.Y1 - R) { b.y = this.Y1 - R; b.vy = -Math.abs(b.vy) * 0.8; }
        if (P.some(([px, py]) => E.dist(b.x, b.y, px, py) < 20)) { b.in = true; b.vx = b.vy = 0; s.potted.push(b.n); E.sfx("coin"); }
      }
      for (let i = 0; i < s.balls.length; i++) for (let j = i + 1; j < s.balls.length; j++) {
        const a = s.balls[i], b = s.balls[j]; if (a.in || b.in) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        if (d < 2 * R && d > 0) {
          const nx = dx / d, ny = dy / d, ov = (2 * R - d) / 2;
          a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov;
          const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
          if (rel > 0) { a.vx -= rel * nx; a.vy -= rel * ny; b.vx += rel * nx; b.vy += rel * ny; if (rel > 40) E.sfx("pop"); }
          if (s.firstHit === null && (a.n === 0 || b.n === 0)) s.firstHit = a.n === 0 ? b.n : a.n;
        }
      }
    }
    for (const b of s.balls) { b.vx *= 0.988; b.vy *= 0.988; if (Math.hypot(b.vx, b.vy) < 4) b.vx = b.vy = 0; }
  },
  endShot(s) {
    const me = s.turn, cue = s.balls[0], pot = s.potted;
    let foul = cue.in || s.firstHit === null;
    if (s.group[me] && s.firstHit !== null && s.firstHit !== 8 && !this.isGroup(s.firstHit, s.group[me])) foul = true;
    const mineLeft = (g) => s.balls.some((b) => !b.in && b.n !== 0 && b.n !== 8 && this.isGroup(b.n, g));
    if (pot.includes(8)) {
      const legal = s.group[me] && !mineLeft(s.group[me]) && !cue.in;
      s.over = true; s.winner = legal ? me : 1 - me; s.overText = legal ? null : `${E.name(me)} potted the 8 early — ${E.name(1 - me)} wins`;
      return;
    }
    if (!s.group[me]) { const first = pot.find((n) => n !== 0); if (first) { s.group[me] = first < 8 ? "solids" : "stripes"; s.group[1 - me] = first < 8 ? "stripes" : "solids"; } }
    const good = s.group[me] ? pot.some((n) => this.isGroup(n, s.group[me])) : pot.some((n) => n);
    if (cue.in) { cue.in = false; cue.x = 230; cue.y = 225; while (s.balls.some((b) => b !== cue && !b.in && E.dist(b.x, b.y, cue.x, cue.y) < 22)) cue.x -= 22; }
    s.msg = foul ? "Foul! " + E.name(1 - me) + "'s turn" : good ? "Nice shot — go again" : "";
    if (foul || !good) s.turn = 1 - me;
    s.potted = []; s.firstHit = null; s.t = 0;
  },
  update(s, inp, dt) {
    s.t += dt;
    if (this.moving(s)) { this.physics(s, dt); if (!this.moving(s)) this.endShot(s); return; }
    const k = inp[s.turn], cue = s.balls[0];
    s.aim += ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * (k.b ? 0.15 : 1.2) * dt;
    s.pow = E.clamp(s.pow + ((k.up ? 1 : 0) - (k.down ? 1 : 0)) * 0.6 * dt, 0.05, 1);
    if (k.taps.some((t) => E.dist(t.x, t.y, cue.x, cue.y) < 200)) s.drag = true;
    if (s.drag && k.pdown) { const dx = cue.x - k.px, dy = cue.y - k.py; s.aim = Math.atan2(dy, dx); s.pow = E.clamp(Math.hypot(dx, dy) / 180, 0.05, 1); }
    if (k.pa || (s.drag && !k.pdown)) {
      s.drag = false;
      cue.vx = Math.cos(s.aim) * s.pow * 1100; cue.vy = Math.sin(s.aim) * s.pow * 1100; s.msg = ""; E.sfx("hit");
      this.physics(s, dt);
    }
  },
  ai(s, i) {
    if (s.turn !== i || this.moving(s) || s.t < 0.8) return {};
    const cue = s.balls[0], P = this.POCKETS(), g = s.group[i];
    const key = s.balls.map((b) => (b.in ? "x" : b.x.toFixed(0) + b.y.toFixed(0))).join();
    if (!this._plan || this._plan.key !== key) {
      let best = null, bs = -Infinity;
      const targets = s.balls.filter((b) => !b.in && b.n && (g ? (this.isGroup(b.n, g) || (b.n === 8 && !s.balls.some((o) => !o.in && o.n && o.n !== 8 && this.isGroup(o.n, g)))) : b.n !== 8));
      for (const b of targets) for (const [px, py] of P) {
        const dx = px - b.x, dy = py - b.y, d = Math.hypot(dx, dy);
        const gx = b.x - (dx / d) * 2 * this.R, gy = b.y - (dy / d) * 2 * this.R; // ghost ball
        const a = Math.atan2(gy - cue.y, gx - cue.x);
        const cut = Math.abs(Math.atan2(Math.sin(a - Math.atan2(dy, dx)), Math.cos(a - Math.atan2(dy, dx))));
        if (cut > 1.2) continue;
        const score = -cut * 3 - d / 300 - E.dist(cue.x, cue.y, gx, gy) / 400 + Math.random() * 0.3;
        if (score > bs) { bs = score; best = [a + E.rand(-0.015, 0.015), E.clamp((d + E.dist(cue.x, cue.y, gx, gy)) / 700, 0.3, 0.95)]; }
      }
      if (!best) best = [Math.atan2(225 - cue.y, 520 - cue.x), 0.8];
      this._plan = { key, best };
    }
    const [a, p] = this._plan.best, d = Math.atan2(Math.sin(a - s.aim), Math.cos(a - s.aim));
    if (Math.abs(d) > 0.004) return { right: d > 0, left: d < 0, b: Math.abs(d) < 0.08 };
    if (Math.abs(p - s.pow) > 0.02) return { up: p > s.pow, down: p < s.pow };
    return { pa: true };
  },
  COLORS: ["#fff", "#fdd835", "#1e88e5", "#e53935", "#8e24aa", "#fb8c00", "#43a047", "#6d4c41", "#111"],
  draw(c, s) {
    E.clear(c, "#3e2723");
    E.rrect(c, this.X0 - 26, this.Y0 - 26, this.X1 - this.X0 + 52, this.Y1 - this.Y0 + 52, 20, "#5d4037");
    E.rect(c, this.X0, this.Y0, this.X1 - this.X0, this.Y1 - this.Y0, "#1b7a3d");
    this.POCKETS().forEach(([x, y]) => E.circle(c, x, y, 16, "#0a0a0a"));
    E.line(c, 230, this.Y0, 230, this.Y1, "rgba(255,255,255,.15)", 1);
    for (const b of s.balls) {
      if (b.in) continue;
      const base = this.COLORS[b.n > 8 ? b.n - 8 : b.n];
      if (b.n > 8) { E.circle(c, b.x, b.y, this.R, "#fff"); c.save(); c.beginPath(); c.arc(b.x, b.y, this.R, 0, 7); c.clip(); E.rect(c, b.x - this.R, b.y - 5, 2 * this.R, 10, base); c.restore(); }
      else E.circle(c, b.x, b.y, this.R, base);
      if (b.n) { E.circle(c, b.x, b.y, 4.5, "#fff"); E.text(c, b.n, b.x, b.y + 0.5, 6, "#000"); }
    }
    if (!this.moving(s) && !s.over) {
      const cue = s.balls[0], a = s.aim;
      c.setLineDash([4, 6]); E.line(c, cue.x, cue.y, cue.x + Math.cos(a) * 300, cue.y + Math.sin(a) * 300, "rgba(255,255,255,.5)", 1.5); c.setLineDash([]);
      const back = 20 + s.pow * 60;
      E.line(c, cue.x - Math.cos(a) * back, cue.y - Math.sin(a) * back, cue.x - Math.cos(a) * (back + 220), cue.y - Math.sin(a) * (back + 220), "#d7b377", 6);
    }
    const g = (i) => (s.group[i] ? ` (${s.group[i]})` : "");
    E.text(c, `${E.name(0)}${g(0)}`, 150, 16, 14, s.turn === 0 ? "#ffeb3b" : "#ccc");
    E.text(c, `${E.name(1)}${g(1)}`, 650, 16, 14, s.turn === 1 ? "#ffeb3b" : "#ccc");
    E.text(c, s.msg || E.turnText(s.turn), 400, 16, 14);
    E.rect(c, 330, 425, 140, 10, "#222"); E.rect(c, 330, 425, 140 * s.pow, 10, "#ff7043");
  },
});
