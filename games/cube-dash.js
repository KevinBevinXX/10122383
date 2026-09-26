// Auto-running cube: jump over spikes, land on blocks. One touch = restart.
GAME({
  title: "Cube Dash",
  players: 1,
  controls: "A / ▲ / tap (hold to keep jumping). Jump spikes, land on blocks.",
  aLabel: "Jump", bLabel: false,
  FLOOR: 360, U: 40,
  init() { const s = { x: 0, y: 0, vy: 0, rot: 0, ground: true, obs: [], gen: 600, score: 0, att: 0 }; this.more(s); return s; },
  more(s) {
    const U = this.U;
    while (s.gen < s.x + 1400) {
      const p = E.randi(0, 5);
      const g = s.gen;
      if (p === 0) s.obs.push({ t: "spike", x: g, y: 0 });
      else if (p === 1) { s.obs.push({ t: "spike", x: g, y: 0 }, { t: "spike", x: g + U, y: 0 }); }
      else if (p === 2) { s.obs.push({ t: "block", x: g, y: 0, w: U * 3, h: U }); s.obs.push({ t: "spike", x: g + U * 4, y: 0 }); }
      else if (p === 3) { s.obs.push({ t: "block", x: g, y: 0, w: U, h: U }, { t: "block", x: g + U * 3, y: 0, w: U, h: U * 2 }, { t: "block", x: g + U * 6, y: 0, w: U * 2, h: U * 2 }); }
      else if (p === 4) { s.obs.push({ t: "block", x: g, y: 0, w: U * 4, h: U }); s.obs.push({ t: "spike", x: g + U, y: U }); }
      else s.obs.push({ t: "pad", x: g, y: 0 }, { t: "spike", x: g + U * 3, y: 0 }, { t: "spike", x: g + U * 4, y: 0 }, { t: "spike", x: g + U * 5, y: 0 });
      s.gen += U * E.randi(8, 13);
    }
  },
  update(s, inp, dt) {
    const k = inp[0], U = this.U;
    const spd = 330 + Math.min(150, s.x / 200);
    s.x += spd * dt; s.score = Math.floor(s.x / U);
    s.vy -= 2600 * dt; s.y += s.vy * dt;
    const px = s.x + 150;
    let floor = 0;
    for (const o of s.obs) if (o.t === "block" && px + U > o.x + 4 && px < o.x + o.w - 4 && s.y >= o.h - 12) floor = Math.max(floor, o.h);
    if (s.y <= floor) { s.y = floor; s.vy = 0; s.ground = true; s.rot = Math.round(s.rot / (Math.PI / 2)) * (Math.PI / 2); } else { s.ground = false; s.rot += 6.5 * dt; }
    if (s.ground && (k.a || k.up || k.pdown || k.taps.length)) { s.vy = 760; s.ground = false; E.sfx("jump"); }
    for (const o of s.obs) {
      if (o.x > px + U || o.x + (o.w || U) < px) continue;
      if (o.t === "spike" && s.y < o.y + U * 0.6 && s.y + U > o.y + 6 && px + U - 10 > o.x + 8 && px + 10 < o.x + U - 8) s.over = true;
      if (o.t === "block" && s.y < o.h - 14 && s.y + U > 4 && px + U > o.x + 2 && px < o.x + o.w - 2) s.over = true;
      if (o.t === "pad" && s.y < 10 && px + U > o.x && px < o.x + U) { s.vy = 1100; E.sfx("coin"); }
    }
    if (s.over) E.sfx("boom");
    s.obs = s.obs.filter((o) => o.x + (o.w || U) > s.x - 100);
    this.more(s);
  },
  draw(c, s) {
    const hue = (s.x / 20) % 360;
    E.clear(c, `hsl(${hue},60%,30%)`);
    for (let i = 0; i < 10; i++) E.rect(c, ((i * 120 - s.x * 0.3) % 1200 + 1200) % 1200 - 100, 100, 80, 80, `hsla(${hue},60%,40%,.5)`);
    const F = this.FLOOR, U = this.U, sx = (x) => x - s.x;
    E.rect(c, 0, F, 800, 450 - F, `hsl(${hue},60%,18%)`); E.rect(c, 0, F, 800, 3, "#fff");
    for (const o of s.obs) {
      const x = sx(o.x); if (x > 820 || x < -300) continue;
      if (o.t === "spike") { c.fillStyle = "#111"; c.strokeStyle = "#fff"; c.lineWidth = 2; c.beginPath(); c.moveTo(x, F - o.y); c.lineTo(x + U / 2, F - o.y - U); c.lineTo(x + U, F - o.y); c.closePath(); c.fill(); c.stroke(); }
      if (o.t === "block") { E.rect(c, x, F - o.h, o.w, o.h, "#111"); c.strokeStyle = "#fff"; c.strokeRect(x + 1, F - o.h + 1, o.w - 2, o.h - 2); }
      if (o.t === "pad") E.rect(c, x + 4, F - 8, U - 8, 8, "#fde047");
    }
    c.save(); c.translate(150 + U / 2, F - s.y - U / 2); c.rotate(s.rot);
    E.rect(c, -U / 2, -U / 2, U, U, "#facc15"); E.rect(c, -U / 2 + 6, -U / 2 + 6, U - 12, U - 12, "#22d3ee"); E.rect(c, -6, -8, 5, 5, "#111"); E.rect(c, 4, -8, 5, 5, "#111"); E.rect(c, -8, 6, 16, 4, "#111");
    c.restore();
    E.text(c, s.score, 400, 40, 28);
  },
});
