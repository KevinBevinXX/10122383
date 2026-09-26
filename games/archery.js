// Archery: pull back, account for wind, hit the bullseye. 10 arrows.
GAME({
  title: "Archery",
  players: 1, touch: "pointer",
  controls: "Hold the mouse / finger (or A) to draw the bow, aim up/down by moving it (or ▲ ▼), release to shoot. Watch the wind. 10 arrows.",
  init() { return { arrows: 10, score: 0, ang: -0.1, draw: 0, fly: null, stuck: [], wind: E.rand(-30, 30), tx: 700, msg: "", msgT: 0 }; },
  update(s, inp, dt) {
    const k = inp[0];
    s.msgT = Math.max(0, s.msgT - dt);
    if (s.fly) {
      const f = s.fly;
      f.vy += 250 * dt; f.vx += s.wind * dt * 0.5; f.vy += s.wind * dt * 0.3;
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.x >= s.tx - 6) {
        const d = Math.abs(f.y - 225), pts = d < 8 ? 10 : d < 20 ? 8 : d < 34 ? 6 : d < 48 ? 4 : d < 62 ? 2 : 0;
        s.score += pts; s.msg = pts === 10 ? "BULLSEYE!" : pts ? `+${pts}` : "Miss"; s.msgT = 1.2; E.sfx(pts >= 8 ? "win" : pts ? "hit" : "lose");
        if (pts) s.stuck.push(f.y);
        s.fly = null; s.arrows--; s.wind = E.rand(-40, 40);
        if (!s.arrows) s.over = true;
      } else if (f.y > 460 || f.y < -200) { s.fly = null; s.arrows--; s.msg = "Miss"; s.msgT = 1; s.wind = E.rand(-40, 40); if (!s.arrows) s.over = true; }
      return;
    }
    const holding = k.a || k.pdown;
    if (k.pdown && (k.px || k.py)) s.ang = E.clamp(Math.atan2(k.py - 260, 200) * 0.6, -0.6, 0.4);
    s.ang = E.clamp(s.ang + ((k.down ? 1 : 0) - (k.up ? 1 : 0)) * 0.5 * dt, -0.6, 0.4);
    if (holding) s.draw = Math.min(1, s.draw + dt * 0.9);
    else if (s.draw > 0.1) { const v = 300 + s.draw * 500; s.fly = { x: 110, y: 260, vx: Math.cos(s.ang) * v, vy: Math.sin(s.ang) * v }; s.draw = 0; E.sfx("shoot"); }
    else s.draw = 0;
  },
  draw(c, s) {
    E.clear(c, "#bae6fd"); E.rect(c, 0, 330, 800, 120, "#65a30d");
    const tx = s.tx;
    [[70, "#fff"], [56, "#111"], [42, "#2563eb"], [28, "#dc2626"], [14, "#facc15"]].forEach(([r, col]) => { c.fillStyle = col; c.beginPath(); c.ellipse(tx, 225, 14, r, 0, 0, Math.PI * 2); c.fill(); });
    E.rect(c, tx - 3, 290, 6, 60, "#78350f");
    s.stuck.forEach((y) => E.line(c, tx - 30, y, tx, y, "#78350f", 3));
    c.save(); c.translate(100, 260); c.rotate(s.ang);
    c.strokeStyle = "#78350f"; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 50, -1.2, 1.2); c.stroke();
    const pull = -s.draw * 40;
    E.line(c, Math.cos(-1.2) * 50, Math.sin(-1.2) * 50, pull, 0, "#e5e7eb", 1.5); E.line(c, Math.cos(1.2) * 50, Math.sin(1.2) * 50, pull, 0, "#e5e7eb", 1.5);
    if (!s.fly) E.line(c, pull, 0, pull + 70, 0, "#1f2937", 3);
    c.restore();
    if (s.fly) { const a = Math.atan2(s.fly.vy, s.fly.vx); E.line(c, s.fly.x - Math.cos(a) * 40, s.fly.y - Math.sin(a) * 40, s.fly.x, s.fly.y, "#1f2937", 3); }
    E.text(c, `Wind ${s.wind > 0 ? "→" : "←"} ${Math.abs(Math.round(s.wind))}`, 400, 30, 18, "#0c4a6e");
    E.text(c, `Score ${s.score}   Arrows ${s.arrows}`, 400, 60, 18, "#0c4a6e");
    if (s.draw) { E.rect(c, 60, 360, 100, 10, "#1f2937"); E.rect(c, 60, 360, 100 * s.draw, 10, "#f97316"); }
    if (s.msgT) E.text(c, s.msg, 400, 150, 36, "#dc2626");
  },
});
