// Rotate the tower so the ball falls through the gaps. Red is deadly.
GAME({
  title: "Helix Fall",
  players: 1,
  controls: "◀ ▶ (or drag sideways) to spin the tower. Fall through the gaps; avoid red sections.",
  aLabel: "·", bLabel: false,
  init() {
    const s = { rot: 0, y: 0, vy: 0, cam: 0, levels: [], score: 0, streak: 0, dragX: null };
    for (let i = 0; i < 40; i++) s.levels.push(this.level(i));
    return s;
  },
  level(i) {
    const gap = E.randi(0, 7), segs = Array.from({ length: 8 }, (_, k) => (k === gap || (k === (gap + 1) % 8 && Math.random() < 0.4) ? 0 : i > 1 && Math.random() < 0.15 + Math.min(0.2, i / 100) ? 2 : 1));
    return { y: 120 + i * 110, segs, broken: false };
  },
  update(s, inp, dt) {
    const k = inp[0];
    s.rot += ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 3.5 * dt;
    if (k.pdown) { if (s.dragX !== null) s.rot += (k.px - s.dragX) * 0.012; s.dragX = k.px; } else s.dragX = null;
    const oy = s.y; s.vy = Math.min(900, s.vy + 1400 * dt); s.y += s.vy * dt;
    for (const L of s.levels) {
      if (L.broken || !(oy <= L.y && s.y >= L.y)) continue;
      // ball is at screen angle π/2 (front); which segment is under it?
      const a = (((Math.PI / 2 - s.rot) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), seg = L.segs[Math.floor(a / (Math.PI / 4))];
      if (seg === 0) { L.broken = true; s.streak++; s.score += s.streak; E.sfx("pop"); continue; }
      if (s.streak >= 3) { L.broken = true; s.streak = 0; s.score += 3; E.sfx("boom"); continue; }
      if (seg === 2) { s.over = true; E.sfx("lose"); return; }
      s.y = L.y; s.vy = -430; s.streak = 0; E.sfx("jump");
    }
    s.cam = Math.max(s.cam, s.y - 150);
    const last = s.levels[s.levels.length - 1];
    if (last.y < s.cam + 700) s.levels.push(this.level(s.levels.length));
    s.levels = s.levels.filter((L) => L.y > s.cam - 200);
  },
  draw(c, s) {
    E.clear(c, "#fef3c7");
    E.rect(c, 385, 0, 30, 450, "#fde68a");
    for (let i = s.levels.length - 1; i >= 0; i--) {
      const L = s.levels[i], y = L.y - s.cam; if (L.broken || y > 470 || y < -30) continue;
      for (let k = 0; k < 8; k++) {
        if (!L.segs[k]) continue;
        const a0 = k * (Math.PI / 4) + s.rot, a1 = a0 + Math.PI / 4;
        c.fillStyle = L.segs[k] === 2 ? "#dc2626" : ["#0ea5e9", "#6366f1", "#10b981"][i % 3];
        c.beginPath(); c.ellipse(400, y, 170, 50, 0, a0, a1); c.ellipse(400, y, 40, 12, 0, a1, a0, true); c.closePath(); c.fill();
      }
    }
    E.circle(c, 400, 150 + (s.y - s.cam - 150) + 38, 12, s.streak >= 3 ? "#f97316" : "#ef4444");
    E.text(c, s.score, 400, 30, 30, "#78350f");
  },
});
