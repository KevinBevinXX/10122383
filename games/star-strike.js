// Vertical shooter: waves of enemies, power-ups, a boss every 5 waves.
GAME({
  title: "Star Strike",
  players: 1,
  controls: "Move ◀ ▲ ▼ ▶ (or drag). Fire is automatic. Grab ⚡ for more guns.",
  aLabel: "·", bLabel: false,
  init() { return { x: 400, y: 380, shots: [], en: [], eb: [], pups: [], wave: 0, next: 1, score: 0, hp: 5, pow: 1, cool: 0, inv: 0, stars: Array.from({ length: 60 }, () => [E.rand(0, 800), E.rand(0, 450), E.rand(40, 160)]) }; },
  spawn(s) {
    s.wave++;
    if (s.wave % 5 === 0) { s.en.push({ x: 400, y: -60, hp: 40 + s.wave * 6, max: 40 + s.wave * 6, boss: true, vx: 90, t: 0 }); return; }
    const n = 6 + s.wave, pat = s.wave % 3;
    for (let i = 0; i < n; i++) s.en.push({ x: pat === 0 ? 100 + (i % 7) * 100 : pat === 1 ? 400 + Math.cos(i) * 300 : E.rand(60, 740), y: -30 - i * 40, hp: 1 + Math.floor(s.wave / 4), vx: pat === 2 ? E.rand(-60, 60) : 0, t: i });
  },
  update(s, inp, dt) {
    const k = inp[0];
    s.stars.forEach((st) => { st[1] += st[2] * dt; if (st[1] > 450) st[1] -= 450; });
    if (k.pdown) { s.x = E.lerp(s.x, k.px, 0.25); s.y = E.lerp(s.y, k.py - 40, 0.25); }
    else { s.x += ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 360 * dt; s.y += ((k.down ? 1 : 0) - (k.up ? 1 : 0)) * 360 * dt; }
    s.x = E.clamp(s.x, 20, 780); s.y = E.clamp(s.y, 40, 430);
    s.cool -= dt; s.inv = Math.max(0, s.inv - dt);
    if (s.cool <= 0) { s.cool = 0.14; for (let g = 0; g < s.pow; g++) { const off = (g - (s.pow - 1) / 2) * 12; s.shots.push({ x: s.x + off, y: s.y - 18, vx: off * 4 }); } E.sfx("shoot"); }
    s.shots = s.shots.filter((b) => { b.y -= 620 * dt; b.x += b.vx * dt; return b.y > -10; });
    s.en.forEach((e) => {
      e.t += dt;
      if (e.boss) { e.y = Math.min(80, e.y + 40 * dt); e.x += e.vx * dt; if (e.x < 100 || e.x > 700) e.vx = -e.vx; if (Math.random() < 0.08) for (let a = -2; a <= 2; a++) s.eb.push({ x: e.x, y: e.y + 30, vx: a * 70, vy: 220 }); }
      else { e.y += (70 + s.wave * 4) * dt; e.x += Math.sin(e.t * 2) * 60 * dt + e.vx * dt; if (Math.random() < 0.004 + s.wave * 0.0008) s.eb.push({ x: e.x, y: e.y, vx: (s.x - e.x) * 0.4, vy: 240 }); }
      s.shots = s.shots.filter((b) => { if (Math.abs(b.x - e.x) < (e.boss ? 60 : 18) && Math.abs(b.y - e.y) < (e.boss ? 30 : 16)) { e.hp--; return false; } return true; });
    });
    s.en = s.en.filter((e) => {
      if (e.hp <= 0) { s.score += e.boss ? 500 : 10; E.sfx("boom"); if (Math.random() < (e.boss ? 1 : 0.06)) s.pups.push({ x: e.x, y: e.y, k: Math.random() < 0.6 ? 0 : 1 }); return false; }
      if (!s.inv && Math.abs(e.x - s.x) < 22 && Math.abs(e.y - s.y) < 22) { s.hp--; s.inv = 1.5; E.sfx("hit"); if (!e.boss) return false; }
      return e.y < 480;
    });
    s.eb = s.eb.filter((b) => { b.x += b.vx * dt; b.y += b.vy * dt; if (!s.inv && E.dist(b.x, b.y, s.x, s.y) < 12) { s.hp--; s.inv = 1.5; E.sfx("hit"); return false; } return b.y < 460 && b.x > -10 && b.x < 810; });
    s.pups = s.pups.filter((p) => { p.y += 90 * dt; if (E.dist(p.x, p.y, s.x, s.y) < 26) { if (p.k === 0) s.pow = Math.min(5, s.pow + 1); else s.hp = Math.min(8, s.hp + 1); E.sfx("coin"); return false; } return p.y < 460; });
    if (s.hp <= 0) s.over = true;
    if (!s.en.length) { s.next -= dt; if (s.next <= 0) { this.spawn(s); s.next = 1.5; } }
  },
  draw(c, s) {
    E.clear(c, "#030712");
    s.stars.forEach(([x, y, v]) => E.rect(c, x, y, v > 120 ? 2 : 1, v > 120 ? 3 : 1, v > 120 ? "#fff" : "#6b7280"));
    s.shots.forEach((b) => E.rect(c, b.x - 2, b.y - 8, 4, 12, "#fde047"));
    s.eb.forEach((b) => E.circle(c, b.x, b.y, 5, "#f43f5e"));
    s.en.forEach((e) => {
      if (e.boss) { E.rrect(c, e.x - 60, e.y - 30, 120, 60, 16, "#7c3aed"); E.circle(c, e.x, e.y, 18, "#f43f5e"); E.rect(c, e.x - 60, e.y - 44, 120 * (e.hp / e.max), 6, "#f43f5e"); }
      else { c.fillStyle = "#ef4444"; c.beginPath(); c.moveTo(e.x, e.y + 16); c.lineTo(e.x - 16, e.y - 12); c.lineTo(e.x + 16, e.y - 12); c.fill(); E.circle(c, e.x, e.y - 4, 5, "#fca5a5"); }
    });
    s.pups.forEach((p) => E.text(c, p.k ? "❤" : "⚡", p.x, p.y, 22, p.k ? "#f43f5e" : "#fde047"));
    if (!(s.inv && Math.floor(s.inv * 10) % 2)) {
      c.fillStyle = "#38bdf8"; c.beginPath(); c.moveTo(s.x, s.y - 20); c.lineTo(s.x - 16, s.y + 14); c.lineTo(s.x, s.y + 6); c.lineTo(s.x + 16, s.y + 14); c.fill();
      E.circle(c, s.x, s.y + 12, 4, "#f97316");
    }
    E.text(c, `Score ${s.score}   Wave ${s.wave}   ${"♥".repeat(Math.max(0, s.hp))}`, 10, 10, 15, "#fff", "left", "top");
  },
});
