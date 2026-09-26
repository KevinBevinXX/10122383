// Tap to switch direction and stay on the zigzag path.
GAME({
  title: "Zig Zag",
  players: 1, touch: "pointer",
  controls: "Tap / click / A to switch direction. Stay on the path. Grab gems.",
  init() {
    const s = { x: 0, y: 0, dir: 0, path: [], gems: [], score: 0, spd: 150, fall: 0 };
    let x = 0, y = 0, d = 0;
    for (let i = 0; i < 6; i++) { s.path.push([x, y]); y -= 1; }
    s.tip = [x, y + 1]; s.tipDir = 0;
    this.extend(s, 80);
    return s;
  },
  extend(s, n) {
    let [x, y] = s.tip;
    for (let i = 0; i < n; i++) {
      if (Math.random() < 0.3) s.tipDir = 1 - s.tipDir;
      if (s.tipDir === 0) y -= 1; else x += 1;
      s.path.push([x, y]);
      if (Math.random() < 0.06) s.gems.push([x, y]);
    }
    s.tip = [x, y];
  },
  update(s, inp, dt) {
    const k = inp[0];
    if (s.fall) { s.fall += dt; if (s.fall > 0.8) s.over = true; return; }
    if (k.pa || k.taps.length) { s.dir = 1 - s.dir; s.score++; E.sfx("click"); }
    s.spd += dt * 2;
    const v = (s.spd / 50) * dt;
    if (s.dir === 0) s.y -= v; else s.x += v;
    const cx = Math.round(s.x), cy = Math.round(s.y);
    if (!s.path.some(([x, y]) => Math.abs(x - s.x) < 0.55 && Math.abs(y - s.y) < 0.55)) { s.fall = 0.01; E.sfx("lose"); }
    const g = s.gems.findIndex(([x, y]) => x === cx && y === cy);
    if (g >= 0) { s.gems.splice(g, 1); s.score += 2; E.sfx("coin"); }
    s.path = s.path.filter(([x, y]) => x > s.x - 12 && y < s.y + 12);
    if (s.path.length < 60) this.extend(s, 40);
  },
  draw(c, s) {
    E.clear(c, "#e0f2fe");
    // isometric: +x goes right-down, -y goes right-up... path runs toward the top-right
    const proj = (x, y) => { const dx = x - s.x, dy = y - s.y; return [400 + (dx - dy) * 26, 300 + (dx + dy) * 15]; };
    const tiles = [...s.path].sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
    for (const [x, y] of tiles) {
      const [px, py] = proj(x, y);
      c.fillStyle = "#38bdf8"; c.beginPath(); c.moveTo(px, py - 15); c.lineTo(px + 26, py); c.lineTo(px, py + 15); c.lineTo(px - 26, py); c.fill();
      c.fillStyle = "#0284c7"; c.beginPath(); c.moveTo(px - 26, py); c.lineTo(px, py + 15); c.lineTo(px, py + 45); c.lineTo(px - 26, py + 30); c.fill();
      c.fillStyle = "#0369a1"; c.beginPath(); c.moveTo(px + 26, py); c.lineTo(px, py + 15); c.lineTo(px, py + 45); c.lineTo(px + 26, py + 30); c.fill();
    }
    s.gems.forEach(([x, y]) => { const [px, py] = proj(x, y); E.text(c, "💎", px, py - 12, 18); });
    const [bx, by] = proj(s.x, s.y);
    E.circle(c, bx, by - 10 + s.fall * 400, 10, "#f43f5e");
    E.text(c, s.score, 400, 40, 36, "#0c4a6e");
  },
});
