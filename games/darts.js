// 301 darts: the sight wobbles — tap to throw. Hit exactly zero, finishing on a double.
GAME({
  title: "Darts 301",
  players: 1, touch: "pointer",
  controls: "The sight drifts around your aim point. Tap / click / A to throw at the moment it's on target.\nStart at 301, reach exactly 0. The last dart must be a double. Fewest darts wins.",
  lowScore: true,
  ORDER: [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5],
  init() { return { left: 301, darts: 0, turnStart: 301, inTurn: 0, stuck: [], aim: { x: 400, y: 225 }, t: 0, msg: "" }; },
  scoreAt(x, y) {
    const dx = x - 400, dy = y - 225, r = Math.hypot(dx, dy);
    if (r < 8) return [50, true]; if (r < 18) return [25, false]; if (r > 180) return [0, false];
    const a = (Math.atan2(dy, dx) * 180) / Math.PI + 90 + 9, seg = this.ORDER[Math.floor((((a % 360) + 360) % 360) / 18)];
    if (r > 162) return [seg * 2, true]; if (r > 100 && r < 112) return [seg * 3, false]; return [seg, false];
  },
  update(s, inp, dt) {
    const k = inp[0];
    s.t += dt;
    if (k.px || k.py) { s.aim.x = k.px; s.aim.y = k.py; }
    s.aim.x = E.clamp(s.aim.x + ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 150 * dt, 200, 600);
    s.aim.y = E.clamp(s.aim.y + ((k.down ? 1 : 0) - (k.up ? 1 : 0)) * 150 * dt, 30, 420);
    const sx = s.aim.x + Math.sin(s.t * 2.3) * 24 + Math.sin(s.t * 5.1) * 8, sy = s.aim.y + Math.cos(s.t * 1.9) * 24 + Math.sin(s.t * 4.3) * 8;
    s.sight = [sx, sy];
    if (k.pa || k.taps.length) {
      const [pts, dbl] = this.scoreAt(sx, sy);
      s.darts++; s.inTurn++; s.stuck.push([sx, sy]); E.sfx("hit");
      const after = s.left - pts;
      if (after < 0 || after === 1 || (after === 0 && !dbl)) { s.msg = `Bust! (${pts})`; s.left = s.turnStart; s.inTurn = 3; E.sfx("lose"); }
      else { s.left = after; s.msg = pts ? `${pts}` : "Miss"; }
      if (s.left === 0) { s.over = true; s.score = s.darts; s.overText = `Checked out in ${s.darts} darts!`; return; }
      if (s.inTurn >= 3) { s.inTurn = 0; s.turnStart = s.left; s.stuck = []; }
    }
  },
  draw(c, s) {
    E.clear(c, "#14532d");
    E.circle(c, 400, 225, 200, "#111");
    for (let i = 0; i < 20; i++) {
      const a0 = ((i * 18 - 90 - 9) * Math.PI) / 180, a1 = a0 + Math.PI / 10, dark = i % 2 === 0;
      const ring = (r0, r1, col) => { c.fillStyle = col; c.beginPath(); c.arc(400, 225, r1, a0, a1); c.arc(400, 225, r0, a1, a0, true); c.fill(); };
      ring(18, 100, dark ? "#1c1917" : "#fef3c7"); ring(100, 112, dark ? "#dc2626" : "#16a34a"); ring(112, 162, dark ? "#1c1917" : "#fef3c7"); ring(162, 180, dark ? "#dc2626" : "#16a34a");
      const am = a0 + Math.PI / 20; E.text(c, this.ORDER[i], 400 + Math.cos(am) * 191, 225 + Math.sin(am) * 191, 12, "#fff");
    }
    E.circle(c, 400, 225, 18, "#16a34a"); E.circle(c, 400, 225, 8, "#dc2626");
    s.stuck.forEach(([x, y]) => { E.circle(c, x, y, 4, "#60a5fa"); E.line(c, x, y, x + 10, y - 14, "#93c5fd", 2); });
    if (s.sight) { E.ring(c, s.sight[0], s.sight[1], 10, "#fde047", 2); E.line(c, s.sight[0] - 14, s.sight[1], s.sight[0] + 14, s.sight[1], "#fde047", 1); E.line(c, s.sight[0], s.sight[1] - 14, s.sight[0], s.sight[1] + 14, "#fde047", 1); }
    E.text(c, s.left, 100, 80, 48, "#fde047"); E.text(c, "remaining", 100, 115, 14);
    E.text(c, `Darts: ${s.darts}`, 100, 160, 16); E.text(c, `This turn: ${s.inTurn}/3`, 100, 185, 14, "#bbf7d0");
    E.text(c, s.msg, 700, 225, 26, "#fff");
  },
});
