// 1v1 side-view basketball: jump shots, dunks, steals and blocks.
GAME({
  title: "Hoop Brawl",
  w: 800, h: 450, players: 2,
  controls: "Move ◀ ▶ · Jump ▲ · A = shoot (or steal when defending)\nJump near the rim with the ball and press A to dunk. First to 11 or most points when the clock runs out.",
  aLabel: "Shoot",
  bLabel: false,
  init() {
    const s = {
      p: [this.player(200, 0), this.player(600, 1)],
      ball: { x: 400, y: 200, vx: 0, vy: 0, holder: -1, shooter: -1, noGrab: [0, 0], flash: 0 },
      score: [0, 0], time: 120, pause: 1.2, msg: "Tip-off!", over: false,
    };
    return s;
  },
  player(x, team) { return { x, y: 390, vx: 0, vy: 0, ground: true, face: team ? -1 : 1, cool: 0, stun: 0 }; },
  G: 1500, FLOOR: 390, HOOP: [{ x: 70, y: 190 }, { x: 730, y: 190 }],
  target(team) { return this.HOOP[team === 0 ? 1 : 0]; },

  update(s, inp, dt) {
    if (s.pause > 0) {
      s.pause -= dt;
      if (s.pause <= 0) s.msg = "";
      return;
    }
    s.time -= dt;
    const b = s.ball;
    s.p.forEach((pl, i) => {
      const k = inp[i];
      pl.cool = Math.max(0, pl.cool - dt);
      pl.stun = Math.max(0, pl.stun - dt);
      const speed = b.holder === i ? 250 : 290;
      const dir = pl.stun ? 0 : (k.right ? 1 : 0) - (k.left ? 1 : 0);
      pl.vx = E.lerp(pl.vx, dir * speed, 0.25);
      if (dir) pl.face = dir;
      if (k.up && pl.ground && !pl.stun) { pl.vy = -640; pl.ground = false; E.sfx("jump"); }
      pl.vy += this.G * dt;
      pl.x = E.clamp(pl.x + pl.vx * dt, 20, 780);
      pl.y += pl.vy * dt;
      if (pl.y >= this.FLOOR) { pl.y = this.FLOOR; pl.vy = 0; pl.ground = true; }
      if (k.pa && !pl.stun) this.action(s, i);
    });
    // players bump each other
    const [a, c] = s.p;
    if (Math.abs(a.x - c.x) < 36 && Math.abs(a.y - c.y) < 60) {
      const push = (36 - Math.abs(a.x - c.x)) / 2, sgn = a.x < c.x ? -1 : 1;
      a.x += sgn * push; c.x -= sgn * push;
    }
    b.noGrab = b.noGrab.map((t) => Math.max(0, t - dt));
    b.flash = Math.max(0, b.flash - dt);
    if (b.holder >= 0) {
      const h = s.p[b.holder];
      b.x = h.x + h.face * 22; b.y = h.y - 50 + (h.ground ? Math.abs(Math.sin(s.time * 9)) * 30 : -10);
      b.vx = b.vy = 0;
    } else this.ballPhysics(s, dt);
    if ((s.time <= 0 && s.score[0] !== s.score[1]) || s.score[0] >= 11 || s.score[1] >= 11) {
      s.over = true; s.winner = s.score[0] > s.score[1] ? 0 : 1;
    } else if (s.time <= 0 && !s.msg) s.msg = "Next basket wins!";
  },

  action(s, i) {
    const pl = s.p[i], b = s.ball, h = this.target(i);
    if (b.holder === i) {
      const dx = h.x - pl.x;
      if (!pl.ground && Math.abs(dx) < 110 && pl.y < 330) {
        // dunk
        b.holder = -1; b.shooter = i; b.x = h.x; b.y = h.y - 14; b.vx = 0; b.vy = 300; b.noGrab[i] = 0.4;
        s.msg = "SLAM DUNK!"; E.sfx("boom");
        return;
      }
      const sx = pl.x + pl.face * 10, sy = pl.y - 70;
      const d = Math.abs(h.x - sx);
      const T = 0.75 + d / 1100;
      const acc = pl.ground ? 1 : 0.6;
      const err = (Math.random() - 0.5) * (8 + d * 0.09) * acc;
      b.holder = -1; b.shooter = i; b.x = sx; b.y = sy; b.noGrab[i] = 0.35;
      b.three = d > 330;
      b.vx = (h.x - sx + err) / T;
      b.vy = (h.y - 6 - sy - 0.5 * this.G * T * T) / T;
      E.sfx("shoot");
    } else if (!pl.cool) {
      pl.cool = 0.45;
      const other = s.p[1 - i];
      if (b.holder === 1 - i && Math.abs(other.x - pl.x) < 60 && Math.abs(other.y - pl.y) < 70) {
        if (Math.random() < 0.45) {
          b.holder = -1; b.vx = pl.face * 180 + E.rand(-60, 60); b.vy = -350; b.noGrab[1 - i] = 0.5;
          other.stun = 0.35; E.sfx("hit");
        }
      }
    }
  },

  ballPhysics(s, dt) {
    const b = s.ball, R = 11;
    const py = b.y;
    b.vy += this.G * dt;
    b.x += b.vx * dt; b.y += b.vy * dt;
    this.HOOP.forEach((h, hi) => {
      const dir = hi === 0 ? -1 : 1; // backboard sits behind the rim
      const board = h.x + dir * 34;
      if (Math.abs(b.x - board) < R + 3 && b.y > h.y - 80 && b.y < h.y + 10) { b.vx = -b.vx * 0.6; b.x = board - dir * (R + 3); E.sfx("hit"); }
      for (const rx of [h.x - 26, h.x + 26]) {
        const dx = b.x - rx, dy = b.y - h.y, d = Math.hypot(dx, dy);
        if (d < R + 3 && d > 0) {
          const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny;
          if (dot < 0) { b.vx -= 1.6 * dot * nx; b.vy -= 1.6 * dot * ny; }
          b.x = rx + nx * (R + 3); b.y = h.y + ny * (R + 3);
        }
      }
      if (py < h.y && b.y >= h.y && Math.abs(b.x - h.x) < 22 && b.vy > 0) {
        const scorer = hi === 1 ? 0 : 1;
        this.scored(s, scorer, b.three && b.shooter === scorer ? 3 : 2);
      }
    });
    // blocks: a defender in the air touching a rising shot
    s.p.forEach((pl, i) => {
      if (i !== b.shooter && !pl.ground && E.dist(b.x, b.y, pl.x, pl.y - 75) < 34 && b.vy < 0) {
        b.vx = -b.vx * 0.5 + (i === 0 ? 150 : -150); b.vy = 120; b.shooter = -1; s.msg = "BLOCKED!"; s.pause = 0; b.flash = 0.6; E.sfx("boom");
      }
    });
    if (b.y > this.FLOOR + 10 - R) { b.y = this.FLOOR + 10 - R; b.vy = -Math.abs(b.vy) * 0.62; b.vx *= 0.85; if (Math.abs(b.vy) < 60) b.vy = 0; }
    if (b.x < R || b.x > 800 - R) { b.vx = -b.vx * 0.7; b.x = E.clamp(b.x, R, 800 - R); }
    if (b.y < R) { b.y = R; b.vy = Math.abs(b.vy); }
    s.p.forEach((pl, i) => {
      if (!b.noGrab[i] && E.dist(b.x, b.y, pl.x, pl.y - 45) < 42) { b.holder = i; b.shooter = -1; if (s.msg === "BLOCKED!") s.msg = ""; }
    });
  },

  scored(s, team, pts) {
    s.score[team] += pts;
    s.msg = pts === 3 ? "THREE!" : s.msg === "SLAM DUNK!" ? s.msg : "Score!";
    E.sfx("score");
    s.pause = 1.1;
    s.p[0] = this.player(200, 0); s.p[1] = this.player(600, 1);
    const other = 1 - team;
    Object.assign(s.ball, { holder: other, shooter: -1, vx: 0, vy: 0, three: false });
    if (s.time <= 0) s.time = 0;
  },

  ai(s, i) {
    const me = s.p[i], b = s.ball, opp = s.p[1 - i], h = this.target(i);
    const k = {};
    const go = (x, tol = 12) => { if (me.x < x - tol) k.right = true; else if (me.x > x + tol) k.left = true; };
    if (b.holder === i) {
      const d = Math.abs(h.x - me.x);
      const shootAt = 160 + (s.time % 7) * 30;
      if (d > shootAt) go(h.x);
      else {
        if (d < 120 && me.ground) { k.up = true; go(h.x); }
        else if (me.ground && Math.random() < 0.03) k.up = true;
        if (!me.ground && me.vy > -120) k.pa = true;
      }
    } else if (b.holder === 1 - i) {
      go(opp.x + (h.x < 400 ? 40 : -40), 6);
      if (Math.abs(opp.x - me.x) < 60 && Math.random() < 0.08) k.pa = true;
      if (!opp.ground && me.ground && Math.abs(opp.x - me.x) < 90 && Math.random() < 0.3) k.up = true;
    } else {
      go(b.x, 4);
      if (b.y < me.y - 110 && Math.abs(b.x - me.x) < 60 && me.ground) k.up = true;
    }
    return k;
  },

  draw(c, s) {
    const g = c.createLinearGradient(0, 0, 0, 450);
    g.addColorStop(0, "#1c2340"); g.addColorStop(1, "#303a66");
    c.fillStyle = g; c.fillRect(0, 0, 800, 450);
    for (let i = 0; i < 40; i++) E.circle(c, (i * 97) % 800, 60 + ((i * 53) % 90), 9, ["#3d4675", "#475283", "#2e3663"][i % 3]);
    E.rect(c, 0, 400, 800, 50, "#c98a4b");
    for (let x = 0; x < 800; x += 40) E.rect(c, x, 400, 2, 50, "#b67a3e");
    E.line(c, 400, 400, 400, 450, "#fff", 3);
    E.ring(c, 400, 425, 30, "#fff", 3);
    this.HOOP.forEach((h, hi) => {
      const dir = hi === 0 ? -1 : 1;
      E.line(c, h.x + dir * 330, 400, h.x + dir * 330, 450, "rgba(255,255,255,.5)", 2);
      E.rect(c, h.x + dir * 34 - 3 + dir * 12, h.y - 20, 8, 230, "#888");
      E.rect(c, h.x + dir * 34 - 3, h.y - 85, 6, 100, "#eee");
      E.line(c, h.x - 26, h.y, h.x + 26, h.y, "#ff5a1f", 4);
      c.strokeStyle = "rgba(255,255,255,.8)"; c.lineWidth = 1.5;
      for (let n = -2; n <= 2; n++) { c.beginPath(); c.moveTo(h.x + n * 12, h.y); c.lineTo(h.x + n * 7, h.y + 36); c.stroke(); }
    });
    const cols = [["#3b82f6", "#1e40af"], ["#ef4444", "#991b1b"]];
    s.p.forEach((pl, i) => {
      const [c1, c2] = cols[i];
      E.rect(c, pl.x - 14, pl.y - 40, 28, 30, c1);
      E.rect(c, pl.x - 12, pl.y - 10, 9, 20, c2); E.rect(c, pl.x + 3, pl.y - 10, 9, 20, c2);
      E.circle(c, pl.x, pl.y - 62, 24, "#f2c9a0");
      E.rect(c, pl.x - 24, pl.y - 86, 48, 12, c2);
      E.circle(c, pl.x + pl.face * 9, pl.y - 64, 4, "#111");
      if (pl.stun) E.text(c, "✦", pl.x, pl.y - 100, 18, "#ffd23f");
      E.text(c, E.name(i), pl.x, pl.y + 32, 12, "#fff");
    });
    const b = s.ball;
    E.circle(c, b.x, b.y, 11, b.flash ? "#fff" : "#f97316");
    E.line(c, b.x - 11, b.y, b.x + 11, b.y, "#7c2d12", 1.5);
    E.line(c, b.x, b.y - 11, b.x, b.y + 11, "#7c2d12", 1.5);
    E.rrect(c, 300, 8, 200, 44, 8, "rgba(0,0,0,.6)");
    E.text(c, s.score[0], 335, 30, 28, cols[0][0]);
    E.text(c, s.score[1], 465, 30, 28, cols[1][0]);
    const t = Math.max(0, Math.ceil(s.time));
    E.text(c, `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`, 400, 30, 20, "#fff");
    if (s.msg) E.text(c, s.msg, 400, 110, 40, "#ffd23f");
  },
});
