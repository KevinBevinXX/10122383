// Ride a bike over the hills. Don't flip over. Collect fuel.
GAME({
  title: "Hill Rider",
  players: 1,
  controls: "▲ / A = gas · ▼ / B = brake · ◀ ▶ lean (in the air). Touch: hold right side for gas, left for brake. Land on your wheels, grab ⛽.",
  aLabel: "Gas", bLabel: "Brake",
  init() { return { x: 100, y: this.ground(100), vx: 0, vy: 0, a: 0, va: 0, fuel: 100, ground: true, score: 0, cans: [1200, 4000, 7500] }; },
  ground(x) { const amp = 1 + Math.min(2, x / 4000); return 330 - amp * (45 * Math.sin(x / 300) + 30 * Math.sin(x / 130 + 1)) - Math.min(120, x / 80) * Math.sin(x / 700) ** 2; },
  slope(x) { return Math.atan2(this.ground(x + 5) - this.ground(x - 5), 10); },
  update(s, inp, dt) {
    const k = inp[0];
    const gas = (k.up || k.a || (k.pdown && k.px > 400)) && s.fuel > 0, brake = k.down || k.b || (k.pdown && k.px <= 400);
    s.fuel = Math.max(0, s.fuel - dt * (gas ? 6 : 1.5));
    s.vy += 900 * dt;
    if (s.ground) {
      const sl = this.slope(s.x), tx = Math.cos(sl), ty = Math.sin(sl);
      const along = s.vx * tx + s.vy * ty;
      const acc = (gas && along < 650 ? 420 : 0) - (brake ? 600 * Math.sign(along) : 0);
      s.vx += tx * acc * dt; s.vy += ty * acc * dt;
      s.vx *= 0.997; s.vy *= 0.997;
    } else {
      s.va += ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 8 * dt; s.va *= 0.98; s.a += s.va * dt;
    }
    s.x += s.vx * dt; s.y += s.vy * dt;
    if (s.x < 0) { s.x = 0; s.vx = Math.max(0, s.vx); }
    const g = this.ground(s.x), sl = this.slope(s.x);
    if (s.y >= g) {
      if (!s.ground) {
        const d = Math.atan2(Math.sin(s.a - sl), Math.cos(s.a - sl));
        if (Math.abs(d) > 1.1) { s.over = true; E.sfx("boom"); s.overText = `Wipeout! ${s.score} m`; return; }
        E.sfx("hit");
      }
      const tx = Math.cos(sl), ty = Math.sin(sl), along = s.vx * tx + s.vy * ty;
      s.vx = tx * along; s.vy = ty * along; s.y = g; s.ground = true; s.va = 0;
      s.a = E.lerp(s.a, sl, 0.35);
    } else if (s.y < g - 3) s.ground = false;
    const c = s.cans.findIndex((x) => Math.abs(x - s.x) < 25);
    if (c >= 0) { s.fuel = 100; s.cans[c] = Math.max(...s.cans) + E.rand(2500, 4000); E.sfx("coin"); }
    s.score = Math.max(s.score, Math.floor(s.x / 10));
    if (s.fuel <= 0 && Math.hypot(s.vx, s.vy) < 5 && s.ground) { s.over = true; s.overText = `Out of fuel! ${s.score} m`; }
  },
  draw(c, s) {
    E.clear(c, "#bae6fd");
    for (let i = 0; i < 5; i++) E.circle(c, ((i * 240 - s.x * 0.1) % 1200 + 1200) % 1200 - 200, 100 + (i % 2) * 30, 40, "#fff");
    const cam = s.x - 250, camY = Math.min(0, s.y - 280);
    c.fillStyle = "#65a30d"; c.beginPath(); c.moveTo(0, 450);
    for (let x = 0; x <= 800; x += 8) c.lineTo(x, this.ground(cam + x) - camY);
    c.lineTo(800, 450); c.fill();
    c.strokeStyle = "#3f6212"; c.lineWidth = 4; c.beginPath(); for (let x = 0; x <= 800; x += 8) c.lineTo(x, this.ground(cam + x) - camY); c.stroke();
    s.cans.forEach((x) => { if (x - cam > -20 && x - cam < 820) E.text(c, "⛽", x - cam, this.ground(x) - camY - 20, 24); });
    c.save(); c.translate(250, s.y - camY - 14); c.rotate(s.a);
    E.circle(c, -22, 4, 12, "#111"); E.circle(c, 22, 4, 12, "#111"); E.circle(c, -22, 4, 5, "#999"); E.circle(c, 22, 4, 5, "#999");
    E.line(c, -22, 4, 0, -10, "#dc2626", 5); E.line(c, 0, -10, 22, 4, "#dc2626", 5); E.line(c, 0, -10, 18, -18, "#dc2626", 4);
    E.line(c, 0, -12, 4, -30, "#1d4ed8", 6); E.circle(c, 6, -38, 8, "#facc15");
    c.restore();
    E.text(c, `${s.score} m`, 20, 20, 22, "#0c4a6e", "left", "top");
    E.rect(c, 600, 20, 180, 14, "#334155"); E.rect(c, 600, 20, 1.8 * s.fuel, 14, s.fuel < 25 ? "#ef4444" : "#22c55e"); E.text(c, "Fuel", 590, 27, 12, "#0c4a6e", "right");
  },
});
