// 10-pin bowling, 10 frames. Aim, curve, and power.
GAME({
  title: "Bowling",
  players: 1,
  controls: "◀ ▶ move · A to start aiming, A again to set power · or drag up from the ball and release. ◀ ▶ while rolling adds curve.",
  aLabel: "Bowl", bLabel: false,
  init() { return { frame: 1, roll: 1, frames: [], pins: this.rack(), ball: this.ball(), phase: "pos", pow: 0, powDir: 1, t: 0, score: 0, msg: "" }; },
  rack() { const p = []; for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++) p.push({ x: 400 + (i - r / 2) * 34, y: 110 - r * 26, vx: 0, vy: 0, down: false, gone: false }); return p; },
  ball() { return { x: 400, y: 410, vx: 0, vy: 0, spin: 0 }; },
  update(s, inp, dt) {
    const k = inp[0], b = s.ball;
    s.t += dt;
    if (s.phase === "pos") {
      b.x = E.clamp(b.x + ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 150 * dt, 320, 480);
      for (const t of k.taps) s.drag = { x: t.x, y: t.y };
      if (s.drag && !k.pdown) { const dx = k.px - s.drag.x, dy = k.py - s.drag.y; if (dy < -20) { const p = E.clamp(-dy / 200, 0.3, 1); b.vy = -520 * p; b.vx = dx * 0.8; s.phase = "roll"; E.sfx("jump"); } else b.x = E.clamp(k.px, 320, 480); s.drag = null; }
      if (k.pa) { s.phase = "power"; s.pow = 0; }
    } else if (s.phase === "power") {
      s.pow += s.powDir * dt * 1.4; if (s.pow > 1) { s.pow = 1; s.powDir = -1; } if (s.pow < 0.2) { s.pow = 0.2; s.powDir = 1; }
      if (k.pa) { b.vy = -520 * s.pow; b.vx = 0; s.phase = "roll"; E.sfx("jump"); }
    } else if (s.phase === "roll") {
      b.spin += ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 200 * dt;
      b.vx += b.spin * dt * 0.6;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < 322 || b.x > 478) { b.vx = 0; b.vy *= 0.97; b.x = E.clamp(b.x, 318, 482); }
      const objs = [b, ...s.pins.filter((p) => !p.gone)];
      for (const p of s.pins) {
        if (p.gone) continue;
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.97; p.vy *= 0.97;
        if (p.x < 315 || p.x > 485 || p.y < 20) { p.gone = true; p.down = true; }
      }
      for (let i = 0; i < objs.length; i++) for (let j = i + 1; j < objs.length; j++) {
        const a = objs[i], o = objs[j], ra = i === 0 ? 16 : 9, dx = o.x - a.x, dy = o.y - a.y, d = Math.hypot(dx, dy);
        if (d < ra + 9 && d > 0) {
          const nx = dx / d, ny = dy / d, rel = (a.vx - o.vx) * nx + (a.vy - o.vy) * ny;
          if (rel > 0) { const m = i === 0 ? 0.3 : 1; o.vx += rel * nx * (i === 0 ? 1.5 : 1); o.vy += rel * ny * (i === 0 ? 1.5 : 1); a.vx -= rel * nx * m; a.vy -= rel * ny * m; }
          o.down = true; E.sfx("hit");
        }
      }
      if (b.y < -30 || (Math.hypot(b.vx, b.vy) < 20 && b.y < 400)) { s.phase = "settle"; s.t = 0; }
    } else if (s.phase === "settle") {
      s.pins.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.95; p.vy *= 0.95; });
      if (s.t > 1.2) this.endRoll(s);
    }
  },
  endRoll(s) {
    const down = s.pins.filter((p) => p.down).length;
    const f = s.frames[s.frame - 1] || (s.frames[s.frame - 1] = []);
    const prev = f.reduce((a, b) => a + b, 0) % 10 === 0 && s.frame === 10 ? 0 : f.reduce((a, b) => a + b, 0);
    const knocked = s.frame === 10 ? down - (f.length && prev % 10 !== 0 ? prev : 0) : down - prev;
    f.push(Math.max(0, knocked));
    s.msg = down === 10 && f.length === 1 ? "STRIKE!" : down === 10 ? "SPARE!" : `${knocked} pins`;
    E.sfx(down === 10 ? "win" : "coin");
    const total = f.reduce((a, b) => a + b, 0);
    let next = false, reset = false;
    if (s.frame < 10) { if (f.length === 2 || f[0] === 10) next = true; }
    else { if (f.length === 3 || (f.length === 2 && f[0] + f[1] < 10)) { s.score = this.total(s); s.over = true; return; } if (down === 10) reset = true; }
    s.score = this.total(s);
    if (next) { s.frame++; s.pins = this.rack(); }
    else if (reset) s.pins = this.rack();
    else s.pins = s.pins.filter((p) => !p.down).map((p) => ({ ...p, vx: 0, vy: 0 })).concat(s.pins.filter((p) => p.down).map((p) => ({ ...p, gone: true })));
    s.ball = this.ball(); s.phase = "pos";
  },
  total(s) {
    const rolls = s.frames.flat(); let sc = 0, i = 0;
    for (let f = 0; f < 10 && i < rolls.length; f++) {
      if (rolls[i] === 10) { sc += 10 + (rolls[i + 1] || 0) + (rolls[i + 2] || 0); i++; }
      else if ((rolls[i] || 0) + (rolls[i + 1] || 0) === 10) { sc += 10 + (rolls[i + 2] || 0); i += 2; }
      else { sc += (rolls[i] || 0) + (rolls[i + 1] || 0); i += 2; }
    }
    return sc;
  },
  draw(c, s) {
    E.clear(c, "#1c1917");
    E.rect(c, 300, 0, 200, 450, "#d6a86b"); for (let x = 310; x < 500; x += 16) E.line(c, x, 0, x, 450, "#c79a5f", 1);
    E.rect(c, 290, 0, 10, 450, "#57534e"); E.rect(c, 500, 0, 10, 450, "#57534e");
    for (let i = 0; i < 7; i++) E.text(c, "▲", 331 + i * 23, 300, 10, "#92400e");
    s.pins.forEach((p) => { if (p.gone) return; E.circle(c, p.x, p.y, 9, p.down ? "#d6d3d1" : "#fff"); E.circle(c, p.x, p.y, 4, "#dc2626"); });
    const b = s.ball; E.circle(c, b.x, b.y, 16, "#1d4ed8"); E.circle(c, b.x - 5, b.y - 5, 3, "#0f172a"); E.circle(c, b.x + 3, b.y - 7, 3, "#0f172a");
    if (s.phase === "power") { E.rect(c, 540, 150, 24, 200, "#292524"); E.rect(c, 540, 350 - 200 * s.pow, 24, 200 * s.pow, s.pow > 0.8 ? "#ef4444" : "#22c55e"); }
    E.text(c, `Frame ${s.frame}/10`, 150, 40, 20); E.text(c, `Score ${s.score}`, 150, 75, 24, "#fde047");
    s.frames.forEach((f, i) => E.text(c, `${i + 1}: ${f.map((v, j) => (v === 10 && (j === 0 || i === 9) ? "X" : j && f[j - 1] + v === 10 && f[j - 1] !== 10 ? "/" : v)).join(" ")}`, 660, 30 + i * 22, 13, "#e7e5e4", "left"));
    if (s.msg && s.phase === "pos") E.text(c, s.msg, 150, 200, 26, "#fb923c");
  },
});
