// 1v1 big-head soccer: jump, head the ball, kick it into the other goal.
GAME({
  title: "Header Heroes",
  players: 2,
  controls: "Move ◀ ▶ · Jump ▲ · A = kick (standing still = high lob, running = hard drive)\nMost goals in 90 seconds wins.",
  aLabel: "Kick", bLabel: false,
  FLOOR: 400, G: 1300, GOAL_TOP: 250,
  init() {
    return { p: [this.pl(220, 1), this.pl(580, -1)], b: this.ball(), score: [0, 0], time: 90, pause: 1, msg: "Kick off!" };
  },
  pl(x, face) { return { x, y: this.FLOOR, vx: 0, vy: 0, ground: true, face, kick: 0, lob: false }; },
  ball() { return { x: 400, y: 150, vx: E.rand(-40, 40), vy: 0 }; },
  update(s, inp, dt) {
    if (s.pause > 0) { s.pause -= dt; if (s.pause <= 0) s.msg = ""; return; }
    s.time -= dt;
    s.p.forEach((p, i) => {
      const k = inp[i], dir = (k.right ? 1 : 0) - (k.left ? 1 : 0);
      p.vx = E.lerp(p.vx, dir * 300, 0.3);
      if (k.up && p.ground) { p.vy = -600; p.ground = false; E.sfx("jump"); }
      p.vy += this.G * dt; p.x = E.clamp(p.x + p.vx * dt, 60, 740); p.y += p.vy * dt;
      if (p.y > this.FLOOR) { p.y = this.FLOOR; p.vy = 0; p.ground = true; }
      p.kick = Math.max(0, p.kick - dt);
      if (k.pa && !p.kick) { p.kick = 0.25; p.lob = !dir; }
    });
    const b = s.b, R = 14;
    b.vy += this.G * 0.8 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
    b.vx *= 0.995;
    if (b.y > this.FLOOR + 10 - R) { b.y = this.FLOOR + 10 - R; b.vy = -Math.abs(b.vy) * 0.7; b.vx *= 0.92; }
    if (b.y < R) { b.y = R; b.vy = Math.abs(b.vy); }
    // crossbars
    for (const gx of [0, 800]) {
      const inX = gx === 0 ? b.x < 60 : b.x > 740;
      if (inX && Math.abs(b.y - this.GOAL_TOP) < R) { b.vy = -b.vy * 0.8; b.y = this.GOAL_TOP + (b.vy < 0 ? -R : R); }
    }
    if (b.x < R) { if (b.y > this.GOAL_TOP) return this.goal(s, 1); b.x = R; b.vx = Math.abs(b.vx) * 0.8; }
    if (b.x > 800 - R) { if (b.y > this.GOAL_TOP) return this.goal(s, 0); b.x = 800 - R; b.vx = -Math.abs(b.vx) * 0.8; }
    s.p.forEach((p, i) => {
      // head (circle) and body
      for (const [cx, cy, r] of [[p.x, p.y - 58, 30], [p.x, p.y - 15, 18]]) {
        const dx = b.x - cx, dy = b.y - cy, d = Math.hypot(dx, dy);
        if (d < r + R && d > 0) {
          const nx = dx / d, ny = dy / d;
          b.x = cx + nx * (r + R); b.y = cy + ny * (r + R);
          const rel = (b.vx - p.vx) * nx + (b.vy - p.vy) * ny;
          if (rel < 0) { b.vx -= 1.7 * rel * nx; b.vy -= 1.7 * rel * ny; }
          b.vx += p.vx * 0.3; E.sfx("pop");
        }
      }
      const footX = p.x + p.face * 22;
      if (p.kick > 0.15 && E.dist(b.x, b.y, footX, p.y - 5) < 40) {
        const dir = i === 0 ? 1 : -1;
        if (p.lob) { b.vx = dir * 450; b.vy = -560; } else { b.vx = dir * 700; b.vy = -260; }
        p.kick = 0.15; E.sfx("hit");
      }
    });
    if (s.time <= 0 && s.score[0] !== s.score[1]) { s.over = true; s.winner = s.score[0] > s.score[1] ? 0 : 1; }
    else if (s.time <= 0) s.msg = "Golden goal!";
  },
  goal(s, team) {
    s.score[team]++; E.sfx("score");
    s.msg = "GOAL!"; s.pause = 1.2;
    s.p = [this.pl(220, 1), this.pl(580, -1)]; s.b = this.ball();
    if (s.time < 0) s.time = 0;
  },
  ai(s, i) {
    const p = s.p[i], b = s.b, o = s.p[1 - i], k = {}, own = i === 0 ? 0 : 800, dir = i === 0 ? 1 : -1;
    const behind = b.x - dir * 30;
    const near = Math.abs(b.x - p.x) < 45 && b.y > p.y - 50;
    const defenderAhead = Math.sign(o.x - p.x) === dir && Math.abs(o.x - p.x) < 320;
    if (near && defenderAhead) k.pa = true; // stand still: lob over them
    else {
      if (p.x < behind - 10) k.right = true; else if (p.x > behind + 10) k.left = true;
      if (near) k.pa = true;
    }
    if (Math.abs(b.x - p.x) < 90 && b.y < p.y - 80 && p.ground) k.up = true;
    if (Math.abs(b.x - own) < 200 && Math.sign(b.x - p.x) === -dir) { k.right = dir < 0; k.left = dir > 0; }
    return k;
  },
  draw(c, s) {
    E.clear(c, "#7cc4f2");
    E.rect(c, 0, 120, 800, 60, "#5a6b8c");
    for (let i = 0; i < 50; i++) E.circle(c, i * 17 + 5, 135 + (i % 3) * 14, 7, ["#e25", "#fd3", "#fff", "#36f"][i % 4]);
    E.rect(c, 0, 180, 800, 230, "#4caf50");
    for (let x = 0; x < 800; x += 80) E.rect(c, x, 180, 40, 230, "#47a54b");
    E.line(c, 400, 180, 400, 410, "#fff", 3);
    E.rect(c, 0, 410, 800, 40, "#3a8c3e");
    for (const [x, d] of [[0, 1], [800, -1]]) {
      c.fillStyle = "rgba(255,255,255,.35)"; c.fillRect(d > 0 ? 0 : 740, this.GOAL_TOP, 60, this.FLOOR + 10 - this.GOAL_TOP);
      E.rect(c, d > 0 ? 0 : 740, this.GOAL_TOP - 5, 60, 8, "#fff");
      E.rect(c, d > 0 ? 56 : 740, this.GOAL_TOP, 4, 160, "#fff");
    }
    const kit = [["#1e88e5", "#0d47a1"], ["#e53935", "#8e0000"]];
    s.p.forEach((p, i) => {
      E.rect(c, p.x - 15, p.y - 32, 30, 30, kit[i][0]);
      const kick = p.kick > 0.1 ? p.face * 14 : 0;
      E.rect(c, p.x - 12 + (p.face < 0 ? kick : 0), p.y - 4, 10, 14, kit[i][1]);
      E.rect(c, p.x + 2 + (p.face > 0 ? kick : 0), p.y - 4, 10, 14, kit[i][1]);
      E.circle(c, p.x, p.y - 58, 30, "#f1c27d");
      E.rect(c, p.x - 30, p.y - 90, 60, 14, kit[i][1]);
      E.circle(c, p.x + p.face * 12, p.y - 60, 5, "#222");
      E.text(c, E.name(i), p.x, p.y + 25, 12, "#fff");
    });
    E.circle(c, s.b.x, s.b.y, 14, "#fff");
    E.circle(c, s.b.x, s.b.y, 5, "#222");
    E.rrect(c, 310, 8, 180, 40, 8, "rgba(0,0,0,.55)");
    E.text(c, s.score[0], 340, 28, 26, "#64b5f6"); E.text(c, s.score[1], 460, 28, 26, "#ef9a9a");
    E.text(c, Math.max(0, Math.ceil(s.time)), 400, 28, 20);
    if (s.msg) E.text(c, s.msg, 400, 90, 42, "#ffeb3b");
  },
});
