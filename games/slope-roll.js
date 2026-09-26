// Roll a ball down an endless neon slope. Stay on the track.
GAME({
  title: "Slope Roll",
  players: 1,
  controls: "◀ ▶ (or hold left/right half of the screen) to steer. Avoid red blocks and don't fall off.",
  aLabel: "·", bLabel: false,
  init() {
    const s = { x: 0, vx: 0, z: 0, spd: 12, segs: [], score: 0, fall: 0 };
    for (let i = 0; i < 60; i++) this.seg(s, i);
    return s;
  },
  seg(s, i) {
    const prev = s.segs[i - 1] || { cx: 0, w: 3 };
    const cx = i < 8 ? 0 : E.clamp(prev.cx + E.rand(-0.35, 0.35), -3, 3);
    const w = i < 8 ? 3 : E.clamp(prev.w + E.rand(-0.2, 0.2), 1.6, 3.2);
    const gap = i > 15 && Math.random() < 0.04;
    const block = i > 12 && !gap && Math.random() < 0.18 ? E.rand(cx - w + 0.4, cx + w - 0.4) : null;
    s.segs[i] = { cx, w, gap, block };
  },
  update(s, inp, dt) {
    const k = inp[0];
    let d = (k.right ? 1 : 0) - (k.left ? 1 : 0);
    if (k.pdown) d = k.px > 400 ? 1 : -1;
    s.vx = E.lerp(s.vx, d * 5, 0.12); s.x += s.vx * dt;
    s.spd += dt * 0.25; s.z += s.spd * dt; s.score = Math.floor(s.z);
    const i = Math.floor(s.z / 2);
    while (s.segs.length < i + 60) this.seg(s, s.segs.length);
    const sg = s.segs[i];
    if (s.fall) { s.fall += dt; if (s.fall > 0.6) s.over = true; return; }
    if (sg.gap || Math.abs(s.x - sg.cx) > sg.w) { s.fall = 0.01; E.sfx("lose"); }
    if (sg.block !== null && Math.abs(s.x - sg.block) < 0.55 && (s.z / 2) % 1 > 0.3 && (s.z / 2) % 1 < 0.7) { s.over = true; E.sfx("boom"); }
  },
  draw(c, s) {
    const g = c.createLinearGradient(0, 0, 0, 450); g.addColorStop(0, "#020617"); g.addColorStop(1, "#1e1b4b"); c.fillStyle = g; c.fillRect(0, 0, 800, 450);
    const i0 = Math.floor(s.z / 2), camX = s.x;
    const P = (x, z) => { const dz = z - s.z + 3; const sc = 300 / dz; return [400 + (x - camX) * sc, 150 + sc * 1.2]; };
    for (let i = i0 + 40; i >= i0; i--) {
      const sg = s.segs[i]; if (!sg || sg.gap) continue;
      const z0 = i * 2, z1 = z0 + 2;
      const nx = s.segs[i + 1] || sg;
      const a = P(sg.cx - sg.w, z0), b = P(sg.cx + sg.w, z0), cc = P(nx.cx + nx.w, z1), d = P(nx.cx - nx.w, z1);
      c.fillStyle = i % 2 ? "#111827" : "#0f172a"; c.strokeStyle = "#22c55e"; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.lineTo(...cc); c.lineTo(...d); c.closePath(); c.fill(); c.stroke();
      if (sg.block !== null) { const [bx, by] = P(sg.block, z0 + 1), sc = 300 / (z0 + 1 - s.z + 3); E.rect(c, bx - 0.5 * sc, by - 0.9 * sc, sc, 0.9 * sc, "#ef4444"); }
    }
    const [bx, by] = P(s.x, s.z);
    E.circle(c, bx, by - 14 + s.fall * 300, 14, "#22c55e"); E.circle(c, bx - 4, by - 18 + s.fall * 300, 4, "#bbf7d0");
    E.text(c, s.score, 400, 30, 26, "#22c55e");
  },
});
