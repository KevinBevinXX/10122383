// Bonk the moles before they duck. 45 seconds.
GAME({
  title: "Whack-a-Mole",
  players: 1, touch: "pointer",
  controls: "Tap or click the moles. Don't hit the bunnies! 45 seconds.",
  init() { return { holes: Array.from({ length: 9 }, () => ({ up: 0, t: 0, bunny: false, hit: 0 })), time: 45, score: 0, next: 0.6 }; },
  pos(i) { return [220 + (i % 3) * 180, 150 + Math.floor(i / 3) * 115]; },
  update(s, inp, dt) {
    s.time -= dt; if (s.time <= 0) { s.over = true; return; }
    s.next -= dt;
    const pace = 0.3 + (s.time / 45) * 0.5;
    if (s.next <= 0) { const h = E.pick(s.holes.filter((h) => !h.t)); if (h) { h.t = E.rand(0.6, 1.1) * (0.6 + s.time / 90); h.bunny = Math.random() < 0.15; h.hit = 0; } s.next = E.rand(0.4, 0.9) * pace; }
    s.holes.forEach((h) => { if (h.t > 0) { h.t = Math.max(0, h.t - dt); h.up = Math.min(1, h.up + dt * 8); } else h.up = Math.max(0, h.up - dt * 8); h.hit = Math.max(0, h.hit - dt); });
    for (const t of inp[0].taps) s.holes.forEach((h, i) => {
      const [x, y] = this.pos(i);
      if (h.up > 0.5 && h.t > 0 && E.dist(t.x, t.y, x, y - 35) < 55) { h.t = 0; h.hit = 0.3; if (h.bunny) { s.score = Math.max(0, s.score - 3); E.sfx("lose"); } else { s.score++; E.sfx("hit"); } }
    });
  },
  draw(c, s) {
    E.clear(c, "#8bc34a");
    for (let i = 0; i < 40; i++) E.rect(c, (i * 97) % 800, (i * 53) % 450, 4, 10, "#7cb342");
    s.holes.forEach((h, i) => {
      const [x, y] = this.pos(i);
      c.fillStyle = "#4e342e"; c.beginPath(); c.ellipse(x, y, 58, 18, 0, 0, Math.PI * 2); c.fill();
      if (h.up > 0) {
        c.save(); c.beginPath(); c.rect(x - 60, y - 110, 120, 110); c.ellipse(x, y, 58, 18, 0, 0, Math.PI); c.clip();
        const my = y + 40 - h.up * 75, col = h.bunny ? "#f5f5f5" : "#795548";
        E.circle(c, x, my, 34, col); E.rect(c, x - 34, my, 68, 60, col);
        if (h.bunny) { E.rrect(c, x - 18, my - 60, 12, 36, 6, col); E.rrect(c, x + 6, my - 60, 12, 36, 6, col); }
        E.text(c, h.hit ? "✖ ✖" : "● ●", x, my - 6, 14, "#111"); E.circle(c, x, my + 8, 6, h.bunny ? "#f48fb1" : "#3e2723");
        c.restore();
      }
      c.strokeStyle = "#6d4c41"; c.lineWidth = 4; c.beginPath(); c.ellipse(x, y, 58, 18, 0, 0, Math.PI); c.stroke();
    });
    E.text(c, `Score ${s.score}`, 20, 20, 24, "#1b5e20", "left", "top");
    E.text(c, `${Math.ceil(s.time)}s`, 780, 20, 24, "#1b5e20", "right", "top");
  },
});
