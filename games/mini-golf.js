// Mini golf: 6 holes. Fewest total strokes wins. Players take turns.
GAME({
  title: "Mini Golf",
  players: 2,
  controls: "Aim with ◀ ▶, set power with ▲ ▼, A to putt — or drag back from the ball and release.",
  aLabel: "Putt", bLabel: false,
  HOLES: [
    { tee: [120, 225], cup: [680, 225], walls: [] },
    { tee: [120, 360], cup: [680, 90], walls: [[380, 150, 40, 300]] },
    { tee: [120, 90], cup: [120, 360], walls: [[40, 200, 520, 40]] },
    { tee: [400, 400], cup: [400, 70], walls: [[250, 180, 120, 30], [430, 180, 120, 30], [340, 290, 120, 30]] },
    { tee: [100, 225], cup: [700, 225], walls: [[250, 40, 30, 250], [400, 160, 30, 250], [550, 40, 30, 250]] },
    { tee: [700, 380], cup: [110, 80], walls: [[180, 140, 440, 30], [180, 280, 440, 30]], sand: [[300, 170, 200, 110]] },
  ],
  init() { return { hole: 0, strokes: [[], []], cur: [0, 0], turn: 0, ball: this.balls(0), aim: [0, 0], pow: [0.5, 0.5], t: 0, msg: "", drag: null }; },
  balls(h) { const [x, y] = this.HOLES[h].tee; return [{ x, y: y - 10, vx: 0, vy: 0, in: false }, { x, y: y + 10, vx: 0, vy: 0, in: false }]; },
  moving(s) { return s.ball.some((b) => Math.hypot(b.vx, b.vy) > 1); },
  update(s, inp, dt) {
    s.t += dt;
    const H = this.HOLES[s.hole];
    if (this.moving(s)) {
      s.ball.forEach((b, i) => {
        if (b.in) return;
        const steps = 4;
        for (let k = 0; k < steps; k++) {
          b.x += (b.vx * dt) / steps; b.y += (b.vy * dt) / steps;
          if (b.x < 30 || b.x > 770) { b.vx = -b.vx; b.x = E.clamp(b.x, 30, 770); E.sfx("pop"); }
          if (b.y < 30 || b.y > 420) { b.vy = -b.vy; b.y = E.clamp(b.y, 30, 420); E.sfx("pop"); }
          for (const [wx, wy, ww, wh] of H.walls) {
            if (b.x > wx - 7 && b.x < wx + ww + 7 && b.y > wy - 7 && b.y < wy + wh + 7) {
              const dl = b.x - (wx - 7), dr = wx + ww + 7 - b.x, dtp = b.y - (wy - 7), db = wy + wh + 7 - b.y, m = Math.min(dl, dr, dtp, db);
              if (m === dl) { b.x = wx - 7; b.vx = -Math.abs(b.vx); } else if (m === dr) { b.x = wx + ww + 7; b.vx = Math.abs(b.vx); }
              else if (m === dtp) { b.y = wy - 7; b.vy = -Math.abs(b.vy); } else { b.y = wy + wh + 7; b.vy = Math.abs(b.vy); }
              E.sfx("pop");
            }
          }
        }
        const sand = (H.sand || []).some(([x, y, w, h]) => E.inRect(b, x, y, w, h));
        const f = sand ? 0.94 : 0.985; b.vx *= f; b.vy *= f;
        const sp = Math.hypot(b.vx, b.vy);
        if (E.dist(b.x, b.y, ...H.cup) < 12 && sp < 420) { b.in = true; b.vx = b.vy = 0; E.sfx("score"); s.msg = `${E.name(i)} sinks it!`; }
        if (sp < 6) b.vx = b.vy = 0;
      });
      if (!this.moving(s)) this.nextTurn(s);
      return;
    }
    const k = inp[s.turn], b = s.ball[s.turn];
    if (b.in) return this.nextTurn(s);
    s.aim[s.turn] += ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 2.2 * dt;
    s.pow[s.turn] = E.clamp(s.pow[s.turn] + ((k.up ? 1 : 0) - (k.down ? 1 : 0)) * 0.8 * dt, 0.05, 1);
    for (const t of k.taps) if (E.dist(t.x, t.y, b.x, b.y) < 60) s.drag = { x: t.x, y: t.y };
    if (s.drag && k.pdown) {
      const dx = b.x - k.px, dy = b.y - k.py;
      s.aim[s.turn] = Math.atan2(dy, dx); s.pow[s.turn] = E.clamp(Math.hypot(dx, dy) / 150, 0.05, 1);
    }
    const release = s.drag && !k.pdown;
    if (k.pa || release) {
      s.drag = null;
      const a = s.aim[s.turn], p = s.pow[s.turn] * 850;
      b.vx = Math.cos(a) * p; b.vy = Math.sin(a) * p; s.cur[s.turn]++; E.sfx("hit"); s.msg = "";
    }
  },
  nextTurn(s) {
    if (s.cur.some((v) => v >= 8)) s.ball.forEach((b, i) => { if (s.cur[i] >= 8) b.in = true; });
    if (s.ball.every((b) => b.in)) {
      s.strokes[0].push(s.cur[0]); s.strokes[1].push(s.cur[1]);
      if (s.hole === this.HOLES.length - 1) {
        const t = s.strokes.map((a) => a.reduce((x, y) => x + y, 0));
        if (E.mode() === "solo" && !E.cpu()) { s.over = true; s.score = t[0]; }
        else { s.over = true; s.winner = t[0] === t[1] ? -1 : t[0] < t[1] ? 0 : 1; s.overText = `${E.name(0)} ${t[0]} · ${E.name(1)} ${t[1]} strokes`; }
        return;
      }
      s.hole++; s.ball = this.balls(s.hole); s.cur = [0, 0]; s.turn = 0; s.t = 0; return;
    }
    const other = 1 - s.turn;
    if (!s.ball[other].in) s.turn = other;
    s.t = 0;
  },
  ai(s, i) {
    if (s.turn !== i || this.moving(s) || s.t < 0.7) return {};
    const b = s.ball[i], H = this.HOLES[s.hole];
    // try shots in simulation once per stroke, keep the one that ends closest to the cup
    const key = `${s.hole}:${i}:${b.x.toFixed(1)}:${b.y.toFixed(1)}`;
    if (!this._plan || this._plan.key !== key) {
      let best = null, bd = Infinity;
      for (let k = 0; k < 60; k++) {
        const a = k < 20 ? Math.atan2(H.cup[1] - b.y, H.cup[0] - b.x) + E.rand(-0.15, 0.15) : E.rand(0, Math.PI * 2), p = E.rand(0.1, 1);
        const sim = { ...s, ball: s.ball.map((x) => ({ ...x })), turn: i, cur: [0, 0], strokes: [[], []] };
        const sb = sim.ball[i]; sb.vx = Math.cos(a) * p * 850; sb.vy = Math.sin(a) * p * 850;
        sim.ball[1 - i].in = true;
        const saved = E.sfx; E.sfx = () => {};
        let n = 0; while (Math.hypot(sb.vx, sb.vy) > 1 && !sb.in && n++ < 600) this.update(sim, [{}, {}], 1 / 60);
        E.sfx = saved;
        const d = sb.in ? 0 : E.dist(sb.x, sb.y, ...H.cup);
        if (d < bd) { bd = d; best = [a, p]; }
      }
      this._plan = { key, best: [best[0] + E.rand(-0.02, 0.02), best[1]] };
    }
    const best = this._plan.best;
    const want = best[0], cur = s.aim[i];
    const diff = Math.atan2(Math.sin(want - cur), Math.cos(want - cur));
    if (Math.abs(diff) > 0.03) return { right: diff > 0, left: diff < 0 };
    if (Math.abs(best[1] - s.pow[i]) > 0.03) return { up: best[1] > s.pow[i], down: best[1] < s.pow[i] };
    return { pa: true };
  },
  draw(c, s) {
    const H = this.HOLES[s.hole];
    E.clear(c, "#33691e");
    E.rrect(c, 20, 20, 760, 410, 18, "#7cb342");
    (H.sand || []).forEach(([x, y, w, h]) => E.rrect(c, x, y, w, h, 30, "#f0d9a0"));
    H.walls.forEach(([x, y, w, h]) => E.rect(c, x, y, w, h, "#5d4037"));
    E.circle(c, ...H.cup, 11, "#111"); E.line(c, H.cup[0], H.cup[1], H.cup[0], H.cup[1] - 45, "#eee", 2);
    c.fillStyle = "#e53935"; c.beginPath(); c.moveTo(H.cup[0], H.cup[1] - 45); c.lineTo(H.cup[0] + 22, H.cup[1] - 38); c.lineTo(H.cup[0], H.cup[1] - 31); c.fill();
    const cols = ["#fff", "#ffeb3b"];
    s.ball.forEach((b, i) => { if (!b.in) { E.circle(c, b.x, b.y, 7, cols[i]); E.ring(c, b.x, b.y, 7, "#333", 1); } });
    if (!this.moving(s) && !s.ball[s.turn].in) {
      const b = s.ball[s.turn], a = s.aim[s.turn], p = s.pow[s.turn];
      E.line(c, b.x, b.y, b.x + Math.cos(a) * (30 + p * 120), b.y + Math.sin(a) * (30 + p * 120), "rgba(255,255,255,.7)", 3);
    }
    const tot = (i) => s.strokes[i].reduce((x, y) => x + y, 0) + s.cur[i];
    E.text(c, `Hole ${s.hole + 1}/6`, 400, 10, 14, "#fff", "center", "top");
    E.text(c, `⚪ ${E.name(0)}: ${tot(0)}`, 110, 10, 14, "#fff", "center", "top");
    if (E.cpu() || E.mode() !== "solo") E.text(c, `🟡 ${E.name(1)}: ${tot(1)}`, 690, 10, 14, "#fff", "center", "top");
    E.text(c, s.msg || E.turnText(s.turn), 400, 440, 14, "#fff", "center", "bottom");
  },
});
