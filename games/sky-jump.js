// Bounce up the platforms. Don't fall.
GAME({
  title: "Sky Jump",
  players: 1,
  controls: "◀ ▶ (or tilt your finger left/right of the jumper) to steer. You bounce automatically.",
  aLabel: "·", bLabel: false,
  init() {
    const plats = [];
    for (let y = 430; y > -300; y -= 55) plats.push(this.plat(y, y === 430));
    return { x: 400, y: 380, vy: -600, plats, cam: 0, score: 0, face: 1 };
  },
  plat(y, solid) { const r = Math.random(); return { x: E.rand(20, 700), y, w: 80, kind: solid ? 0 : r < 0.12 ? 1 : r < 0.2 ? 2 : r < 0.25 ? 3 : 0, vx: E.pick([-80, 80]), gone: false }; },
  update(s, inp, dt) {
    const k = inp[0];
    let dir = (k.right ? 1 : 0) - (k.left ? 1 : 0);
    if (k.pdown) dir = E.clamp((k.px - s.x) / 40, -1, 1);
    if (dir) s.face = Math.sign(dir);
    s.x += dir * 380 * dt; if (s.x < -20) s.x = 820; if (s.x > 820) s.x = -20;
    const oy = s.y; s.vy += 1300 * dt; s.y += s.vy * dt;
    for (const p of s.plats) {
      if (p.kind === 1) { p.x += p.vx * dt; if (p.x < 0 || p.x > 720) p.vx = -p.vx; }
      if (!p.gone && s.vy > 0 && oy + 20 <= p.y && s.y + 20 >= p.y && s.x > p.x - 10 && s.x < p.x + p.w + 10) {
        if (p.kind === 2) { p.gone = true; continue; }
        s.vy = p.kind === 3 ? -1050 : -640; E.sfx(p.kind === 3 ? "coin" : "jump");
      }
    }
    const top = Math.min(...s.plats.map((p) => p.y));
    if (s.y < s.cam + 200) s.cam = s.y - 200;
    s.score = Math.max(s.score, Math.floor(-s.cam / 10));
    s.plats = s.plats.filter((p) => p.y < s.cam + 500);
    const gap = 55 + Math.min(45, s.score / 60);
    for (let y = top - gap; y > s.cam - 100; y -= gap) s.plats.push(this.plat(y));
    if (s.y > s.cam + 480) { s.over = true; E.sfx("lose"); }
  },
  draw(c, s) {
    E.clear(c, "#fffbeb");
    for (let y = -((s.cam % 20 + 20) % 20); y < 450; y += 20) E.line(c, 0, y, 800, y, "#fde68a", 1);
    s.plats.forEach((p) => { if (p.gone) return; const y = p.y - s.cam; E.rrect(c, p.x, y, p.w, 12, 6, ["#65a30d", "#0284c7", "#a16207", "#65a30d"][p.kind]); if (p.kind === 3) E.rect(c, p.x + 30, y - 10, 20, 10, "#9ca3af"); });
    const y = s.y - s.cam;
    E.rrect(c, s.x - 16, y - 16, 32, 36, 10, "#84cc16"); E.circle(c, s.x + s.face * 6, y - 4, 4, "#111"); E.rect(c, s.x - 12, y + 18, 6, 6, "#4d7c0f"); E.rect(c, s.x + 6, y + 18, 6, 6, "#4d7c0f");
    E.text(c, s.score, 20, 20, 24, "#92400e", "left", "top");
  },
});
