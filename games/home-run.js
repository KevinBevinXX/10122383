// Home run derby: time your swing. 10 outs.
GAME({
  title: "Home Run Derby",
  players: 1, touch: "pointer",
  controls: "Tap / click / A to swing when the ball reaches the plate. Perfect timing = home run. 10 outs and you're done.",
  init() { return { pitch: null, wait: 1, swing: 0, outs: 0, hrs: 0, score: 0, hit: null, msg: "", msgT: 0 }; },
  update(s, inp, dt) {
    const k = inp[0];
    s.msgT = Math.max(0, s.msgT - dt); s.swing = Math.max(0, s.swing - dt);
    if (s.hit) { const h = s.hit; h.x += h.vx * dt; h.y += h.vy * dt; h.vy += 300 * dt; h.t += dt; if (h.t > 2.5) { s.hit = null; s.wait = 0.8; } return; }
    if (!s.pitch) { s.wait -= dt; if (s.wait <= 0) { const sp = E.rand(380, 520) + s.hrs * 8; s.pitch = { y: 120, sp, curve: E.rand(-40, 40), x: 400 }; } return; }
    const p = s.pitch;
    p.y += p.sp * dt; p.x = 400 + p.curve * Math.sin(((p.y - 120) / 250) * Math.PI);
    if ((k.pa || k.taps.length) && !s.swing) {
      s.swing = 0.25; E.sfx("jump");
      const off = p.y - 370;
      if (Math.abs(off) < 45) {
        const q = 1 - Math.abs(off) / 45, hr = q > 0.7;
        s.hit = { x: p.x, y: p.y, vx: off * 6 + E.rand(-60, 60), vy: -300 - q * 400, t: 0 };
        if (hr) { s.hrs++; s.score += 100 + Math.round(q * 50); s.msg = "HOME RUN!"; E.sfx("win"); } else { s.score += 10; s.outs++; s.msg = q > 0.4 ? "Fly out" : "Grounder"; E.sfx("hit"); }
        s.msgT = 1.5; s.pitch = null;
      }
    }
    if (p && p.y > 430) { s.outs++; s.msg = "Strike!"; s.msgT = 1; s.pitch = null; s.wait = 0.8; E.sfx("lose"); }
    if (s.outs >= 10) s.over = true;
  },
  draw(c, s) {
    E.clear(c, "#15803d");
    c.fillStyle = "#a16207"; c.beginPath(); c.moveTo(400, 80); c.lineTo(620, 330); c.lineTo(400, 450); c.lineTo(180, 330); c.fill();
    c.fillStyle = "#16a34a"; c.beginPath(); c.moveTo(400, 150); c.lineTo(540, 300); c.lineTo(400, 400); c.lineTo(260, 300); c.fill();
    E.circle(c, 400, 150, 20, "#a16207"); E.rect(c, 385, 360, 30, 20, "#fff");
    E.circle(c, 400, 130, 12, "#1e3a8a"); E.rect(c, 392, 138, 16, 20, "#1e3a8a");
    const sw = s.swing ? (1 - s.swing / 0.25) * 2.4 : 0;
    c.save(); c.translate(455, 380); c.rotate(-2.2 + sw); E.rect(c, 0, -4, 80, 8, "#92400e"); c.restore();
    E.circle(c, 470, 390, 14, "#dc2626");
    if (s.pitch) E.circle(c, s.pitch.x, s.pitch.y, 6 + (s.pitch.y - 120) / 60, "#fff");
    if (s.hit) E.circle(c, s.hit.x, s.hit.y, Math.max(2, 10 - s.hit.t * 3), "#fff");
    E.text(c, `HR ${s.hrs}   Score ${s.score}   Outs ${s.outs}/10`, 400, 25, 18);
    if (s.msgT) E.text(c, s.msg, 400, 80, 36, "#fde047");
  },
});
