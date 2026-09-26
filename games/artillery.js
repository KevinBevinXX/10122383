// Turn-based artillery. Adjust angle and power, account for wind, destroy the other tank.
GAME({
  title: "Artillery",
  players: 2,
  controls: "◀ ▶ angle · ▲ ▼ power · A = fire. The wind changes every turn. 3 hits wins.",
  aLabel: "Fire", bLabel: false,
  init() {
    const h = []; let y = 330, v = 0;
    for (let x = 0; x <= 800; x += 4) { v = E.clamp(v + E.rand(-1.2, 1.2), -3, 3); y = E.clamp(y + v, 200, 420); h.push(y); }
    const flat = (x0) => { const i = x0 / 4; for (let k = i - 6; k <= i + 6; k++) h[k] = h[i]; };
    flat(100); flat(700);
    return { h, tanks: [{ x: 100, ang: -0.8, pow: 0.6, hp: 3 }, { x: 700, ang: -2.34, pow: 0.6, hp: 3 }], turn: 0, shell: null, wind: E.rand(-60, 60), t: 0, boom: null };
  },
  ground(s, x) { return s.h[E.clamp(Math.round(x / 4), 0, 200)]; },
  update(s, inp, dt) {
    s.t += dt;
    if (s.boom) { s.boom.t -= dt; if (s.boom.t <= 0) s.boom = null; }
    if (s.shell) {
      const b = s.shell;
      for (let k = 0; k < 3; k++) {
        b.vx += s.wind * (dt / 3); b.vy += 300 * (dt / 3);
        b.x += (b.vx * dt) / 3; b.y += (b.vy * dt) / 3;
        const hitTank = s.tanks.findIndex((t) => E.dist(t.x, this.ground(s, t.x) - 8, b.x, b.y) < 16);
        if (b.x < -50 || b.x > 850 || b.y > this.ground(s, b.x) || hitTank >= 0) {
          s.shell = null; s.boom = { x: b.x, y: b.y, t: 0.5 }; E.sfx("boom");
          for (let i = 0; i < s.h.length; i++) { const d = Math.abs(i * 4 - b.x); if (d < 30) s.h[i] = Math.min(440, Math.max(s.h[i], b.y + Math.sqrt(900 - d * d) * 0.8)); }
          s.tanks.forEach((t) => { if (E.dist(t.x, this.ground(s, t.x) - 8, b.x, b.y) < 34) t.hp--; });
          if (s.tanks.some((t) => t.hp <= 0)) { s.over = true; const d = s.tanks.map((t) => t.hp <= 0); s.winner = d[0] && d[1] ? -1 : d[0] ? 1 : 0; return; }
          s.turn = 1 - s.turn; s.wind = E.rand(-60, 60); s.t = 0;
          return;
        }
      }
      return;
    }
    const k = inp[s.turn], t = s.tanks[s.turn];
    t.ang = E.clamp(t.ang + ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 1.2 * dt, -Math.PI, 0);
    t.pow = E.clamp(t.pow + ((k.up ? 1 : 0) - (k.down ? 1 : 0)) * 0.5 * dt, 0.1, 1);
    if (k.pa) { const y = this.ground(s, t.x) - 14, p = t.pow * 620; s.shell = { x: t.x + Math.cos(t.ang) * 20, y: y + Math.sin(t.ang) * 20, vx: Math.cos(t.ang) * p, vy: Math.sin(t.ang) * p }; E.sfx("shoot"); }
  },
  ai(s, i) {
    if (s.turn !== i || s.shell || s.t < 0.5) return {};
    // plan once per turn (wind changes every turn), by simulating shots
    const key = i + ":" + s.wind;
    if (!this._plan || this._plan.key !== key) {
      const me = s.tanks[i], o = s.tanks[1 - i]; let best = null, bd = Infinity;
      for (let a = -Math.PI + 0.2; a < -0.2; a += 0.05) for (let p = 0.2; p <= 1; p += 0.04) {
        let x = me.x + Math.cos(a) * 20, y = this.ground(s, me.x) - 14 + Math.sin(a) * 20, vx = Math.cos(a) * p * 620, vy = Math.sin(a) * p * 620;
        for (let n = 0; n < 900; n++) { vx += s.wind / 180; vy += 300 / 180; x += vx / 180; y += vy / 180; if (x < -50 || x > 850 || y > this.ground(s, x)) break; }
        const d = Math.abs(x - o.x); if (d < bd) { bd = d; best = [a, p]; }
      }
      this._plan = { key, a: best[0] + E.rand(-0.05, 0.05), p: best[1] };
    }
    const t = s.tanks[i], { a, p } = this._plan;
    if (Math.abs(a - t.ang) > 0.03) return { right: a > t.ang, left: a < t.ang };
    if (Math.abs(p - t.pow) > 0.02) return { up: p > t.pow, down: p < t.pow };
    return { pa: true };
  },
  draw(c, s) {
    const g = c.createLinearGradient(0, 0, 0, 450); g.addColorStop(0, "#0b132b"); g.addColorStop(1, "#5bc0be");
    c.fillStyle = g; c.fillRect(0, 0, 800, 450);
    c.fillStyle = "#3a5a40"; c.beginPath(); c.moveTo(0, 450); s.h.forEach((y, i) => c.lineTo(i * 4, y)); c.lineTo(800, 450); c.fill();
    const cols = ["#4cc9f0", "#f72585"];
    s.tanks.forEach((t, i) => {
      const y = this.ground(s, t.x);
      E.rect(c, t.x - 16, y - 14, 32, 12, cols[i]); E.circle(c, t.x, y - 14, 8, cols[i]);
      E.line(c, t.x, y - 14, t.x + Math.cos(t.ang) * 22, y - 14 + Math.sin(t.ang) * 22, cols[i], 4);
      E.text(c, E.name(i) + " " + "♥".repeat(Math.max(0, t.hp)), t.x, y + 22, 13);
    });
    if (s.shell) E.circle(c, s.shell.x, s.shell.y, 4, "#fff");
    if (s.boom) E.circle(c, s.boom.x, s.boom.y, 34 * (1 - s.boom.t), "rgba(255,170,0,.8)");
    const t = s.tanks[s.turn];
    E.text(c, `${E.turnText(s.turn)} · angle ${Math.round(-t.ang * 57.3)}° · power ${Math.round(t.pow * 100)}`, 400, 20, 15);
    E.text(c, `Wind ${s.wind > 0 ? "→" : "←"} ${Math.abs(Math.round(s.wind))}`, 400, 45, 15, "#ffd166");
  },
});
