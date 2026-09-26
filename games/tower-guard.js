// Tower defense: place towers along the path to stop the creeps.
GAME({
  title: "Tower Guard",
  players: 1, touch: "pointer",
  controls: "Tap a grass tile to build (cost shown). Tap a tower to upgrade it. Tap ▶ to send the next wave early.",
  PATH: [[0, 3], [4, 3], [4, 1], [9, 1], [9, 6], [3, 6], [3, 8], [12, 8], [12, 3], [15, 3]],
  T: 50,
  init() {
    const road = new Set();
    for (let i = 0; i < this.PATH.length - 1; i++) {
      const [x0, y0] = this.PATH[i], [x1, y1] = this.PATH[i + 1];
      for (let t = 0; t <= Math.abs(x1 - x0) + Math.abs(y1 - y0); t++) road.add([x0 + Math.sign(x1 - x0) * t, y0 + Math.sign(y1 - y0) * t].join());
    }
    return { road: [...road], towers: [], creeps: [], shots: [], gold: 120, lives: 20, wave: 0, spawn: 0, left: 0, pause: 5, score: 0 };
  },
  pt(d) {
    let rem = d;
    for (let i = 0; i < this.PATH.length - 1; i++) {
      const [x0, y0] = this.PATH[i], [x1, y1] = this.PATH[i + 1], len = Math.abs(x1 - x0) + Math.abs(y1 - y0);
      if (rem <= len) { const f = rem / len; return [(x0 + (x1 - x0) * f + 0.5) * this.T, (y0 + (y1 - y0) * f + 0.5) * this.T]; }
      rem -= len;
    }
    return null;
  },
  update(s, inp, dt) {
    for (const t of inp[0].taps) {
      if (E.inRect(t, 740, 395, 55, 50)) { s.pause = 0; continue; }
      const gx = Math.floor(t.x / this.T), gy = Math.floor(t.y / this.T);
      if (gx < 0 || gx > 15 || gy < 0 || gy > 8) continue;
      const tw = s.towers.find((w) => w.x === gx && w.y === gy);
      if (tw) { const cost = 40 * tw.lv; if (s.gold >= cost && tw.lv < 4) { s.gold -= cost; tw.lv++; E.sfx("coin"); } }
      else if (!s.road.includes(gx + "," + gy) && s.gold >= 50) { s.towers.push({ x: gx, y: gy, lv: 1, cd: 0 }); s.gold -= 50; E.sfx("click"); }
    }
    if (!s.left && !s.creeps.length) { s.pause -= dt; if (s.pause <= 0) { s.wave++; s.left = 6 + s.wave * 2; s.spawn = 0; s.pause = 8; } }
    if (s.left) { s.spawn -= dt; if (s.spawn <= 0) { const hp = 4 + s.wave * 3 + Math.floor(s.wave ** 1.5); s.creeps.push({ d: 0, hp, max: hp, sp: 1.4 + (s.wave % 4 === 0 ? 0.8 : 0) + s.wave * 0.03 }); s.left--; s.spawn = 0.8; } }
    s.creeps = s.creeps.filter((c) => { c.d += c.sp * dt; if (!this.pt(c.d)) { s.lives--; E.sfx("lose"); if (s.lives <= 0) s.over = true; return false; } return c.hp > 0; });
    s.towers.forEach((w) => {
      w.cd -= dt; if (w.cd > 0) return;
      const wx = (w.x + 0.5) * this.T, wy = (w.y + 0.5) * this.T, range = 90 + w.lv * 20;
      const target = s.creeps.filter((c) => { const p = this.pt(c.d); return p && E.dist(p[0], p[1], wx, wy) < range; }).sort((a, b) => b.d - a.d)[0];
      if (target) { target.hp -= 1 + w.lv * 1.2; w.cd = 0.6 - w.lv * 0.08; const p = this.pt(target.d); s.shots.push({ x0: wx, y0: wy, x1: p[0], y1: p[1], t: 0.08 }); if (target.hp <= 0) { s.gold += 4 + Math.floor(s.wave / 2); s.score += 10; E.sfx("pop"); } }
    });
    s.shots.forEach((x) => (x.t -= dt)); s.shots = s.shots.filter((x) => x.t > 0);
  },
  draw(c, s) {
    const T = this.T;
    for (let y = 0; y < 9; y++) for (let x = 0; x < 16; x++) E.rect(c, x * T, y * T, T, T, s.road.includes(x + "," + y) ? "#d6b98c" : (x + y) % 2 ? "#4d7c0f" : "#558b2f");
    s.towers.forEach((w) => { const x = w.x * T, y = w.y * T; E.rrect(c, x + 8, y + 8, T - 16, T - 16, 6, ["#64748b", "#2563eb", "#7c3aed", "#dc2626"][w.lv - 1]); E.circle(c, x + T / 2, y + T / 2, 8, "#e2e8f0"); E.text(c, "★".repeat(w.lv), x + T / 2, y + T - 6, 9, "#fde047"); });
    s.shots.forEach((x) => E.line(c, x.x0, x.y0, x.x1, x.y1, "#fde047", 3));
    s.creeps.forEach((cr) => { const p = this.pt(cr.d); if (!p) return; E.circle(c, p[0], p[1], 12, "#b91c1c"); E.rect(c, p[0] - 14, p[1] - 20, 28 * (cr.hp / cr.max), 4, "#22c55e"); });
    E.rect(c, 0, 450 - 0, 800, 0, "#000");
    E.rrect(c, 5, 405, 520, 40, 8, "rgba(0,0,0,.6)");
    E.text(c, `💰 ${s.gold}   ❤ ${s.lives}   Wave ${s.wave}   Build 50 · Upgrade 40×level`, 15, 425, 15, "#fff", "left");
    E.rrect(c, 740, 395, 55, 50, 8, "#16a34a"); E.text(c, s.left || s.creeps.length ? "…" : "▶", 767, 420, 22);
  },
});
