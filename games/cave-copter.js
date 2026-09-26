// Hold to climb, release to fall. Don't touch the cave.
GAME({
  title: "Cave Copter",
  players: 1,
  controls: "Hold A / ▲ / the screen to rise. Let go to drop.",
  aLabel: "Lift", bLabel: false,
  init() { const cave = []; for (let x = 0; x <= 820; x += 20) cave.push([60, 390]); return { y: 225, vy: 0, cave, off: 0, dist: 0, score: 0, blocks: [], trail: [] }; },
  update(s, inp, dt) {
    const k = inp[0], hold = k.a || k.up || k.pdown;
    s.vy += (hold ? -900 : 700) * dt; s.vy = E.clamp(s.vy, -300, 350); s.y += s.vy * dt;
    const spd = 220 + s.dist / 60;
    s.dist += spd * dt; s.score = Math.floor(s.dist / 10);
    s.off += spd * dt;
    while (s.off >= 20) {
      s.off -= 20; s.cave.shift();
      const [t, b] = s.cave[s.cave.length - 1], gap = Math.max(150, 330 - s.dist / 60);
      let nt = E.clamp(t + E.rand(-22, 22), 10, 440 - gap - 10);
      s.cave.push([nt, nt + gap]);
      s.blocks.forEach((bl) => (bl.x -= 20));
      if (Math.random() < 0.05) s.blocks.push({ x: 820, y: E.rand(nt + 30, nt + gap - 90), h: 60 });
    }
    s.blocks = s.blocks.filter((b) => b.x > -40);
    const i = Math.floor((150 + s.off) / 20), [t, b] = s.cave[i] || [0, 450];
    if (s.y - 10 < t || s.y + 10 > b || s.blocks.some((bl) => 150 + 20 > bl.x - s.off && 150 - 20 < bl.x - s.off + 22 && s.y + 8 > bl.y && s.y - 8 < bl.y + bl.h)) { s.over = true; E.sfx("boom"); }
  },
  draw(c, s) {
    E.clear(c, "#1b1b1b");
    c.fillStyle = "#3f9b0b";
    c.beginPath(); c.moveTo(0, 0); s.cave.forEach(([t], i) => c.lineTo(i * 20 - s.off, t)); c.lineTo(820, 0); c.fill();
    c.beginPath(); c.moveTo(0, 450); s.cave.forEach(([, b], i) => c.lineTo(i * 20 - s.off, b)); c.lineTo(820, 450); c.fill();
    s.blocks.forEach((b) => E.rect(c, b.x - s.off, b.y, 22, b.h, "#3f9b0b"));
    const y = s.y;
    E.rrect(c, 128, y - 9, 40, 18, 8, "#e53935"); E.rect(c, 108, y - 3, 24, 5, "#e53935"); E.rect(c, 150, y - 5, 12, 8, "#90caf9");
    E.line(c, 125, y - 14, 170, y - 14, "#ddd", 3); E.line(c, 148, y - 14, 148, y - 9, "#ddd", 2);
    E.text(c, "Distance " + s.score, 20, 20, 18, "#fff", "left", "top");
  },
});
