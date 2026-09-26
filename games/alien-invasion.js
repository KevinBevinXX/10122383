// Space invaders: stop the marching aliens before they land.
GAME({
  title: "Alien Invasion",
  players: 1,
  controls: "◀ ▶ move · A = fire. Hide behind the bunkers.",
  aLabel: "Fire", bLabel: false,
  init() { const s = { x: 400, shots: [], bombs: [], score: 0, lives: 3, wave: 0, cool: 0 }; this.wave(s); return s; },
  wave(s) {
    s.wave++; s.al = []; s.dir = 1; s.step = 0; s.stepT = 0;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 11; c++) s.al.push({ x: 140 + c * 48, y: 60 + r * 36 + Math.min(4, s.wave - 1) * 10, t: r === 0 ? 2 : r < 3 ? 1 : 0 });
    s.bunk = [];
    for (let b = 0; b < 4; b++) for (let y = 0; y < 4; y++) for (let x = 0; x < 8; x++) if (!(y === 3 && x > 1 && x < 6)) s.bunk.push([120 + b * 170 + x * 8, 340 + y * 8]);
  },
  update(s, inp, dt) {
    const k = inp[0];
    if (k.pdown) s.x += E.clamp(k.px - s.x, -300 * dt, 300 * dt); else s.x += ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 300 * dt;
    s.x = E.clamp(s.x, 20, 780);
    s.cool = Math.max(0, s.cool - dt);
    if ((k.a || k.taps.length) && !s.cool && s.shots.length < 2) { s.shots.push({ x: s.x, y: 400 }); s.cool = 0.3; E.sfx("shoot"); }
    s.stepT += dt;
    const interval = 0.05 + (s.al.length / 55) * 0.6;
    if (s.stepT > interval) {
      s.stepT = 0;
      const edge = s.al.some((a) => (s.dir > 0 && a.x > 770) || (s.dir < 0 && a.x < 30));
      if (edge) { s.dir = -s.dir; s.al.forEach((a) => (a.y += 16)); } else s.al.forEach((a) => (a.x += s.dir * 10));
      s.step++;
      E.sfx("click");
    }
    if (Math.random() < 0.02 + s.wave * 0.005 && s.al.length) { const a = E.pick(s.al); s.bombs.push({ x: a.x, y: a.y + 10 }); }
    const hitBunk = (o) => { const i = s.bunk.findIndex(([x, y]) => o.x > x - 1 && o.x < x + 9 && o.y > y - 1 && o.y < y + 9); if (i >= 0) { s.bunk.splice(i, 1); return true; } return false; };
    s.shots = s.shots.filter((b) => {
      b.y -= 520 * dt;
      if (hitBunk(b)) return false;
      const i = s.al.findIndex((a) => Math.abs(a.x - b.x) < 16 && Math.abs(a.y - b.y) < 12);
      if (i >= 0) { s.score += [10, 20, 30][s.al[i].t]; s.al.splice(i, 1); E.sfx("pop"); return false; }
      return b.y > 0;
    });
    s.bombs = s.bombs.filter((b) => {
      b.y += 220 * dt;
      if (hitBunk(b)) return false;
      if (Math.abs(b.x - s.x) < 18 && b.y > 395 && b.y < 420) { s.lives--; E.sfx("boom"); if (s.lives <= 0) s.over = true; return false; }
      return b.y < 450;
    });
    s.al.forEach((a) => { s.bunk = s.bunk.filter(([x, y]) => !(Math.abs(a.x - x) < 18 && Math.abs(a.y - y) < 14)); });
    if (s.al.some((a) => a.y > 390)) s.over = true;
    if (!s.al.length) this.wave(s);
  },
  draw(c, s) {
    E.clear(c, "#05051a");
    const cols = ["#4ade80", "#60a5fa", "#f472b6"];
    s.al.forEach((a) => {
      const f = s.step % 2;
      E.rect(c, a.x - 12, a.y - 8, 24, 14, cols[a.t]);
      E.rect(c, a.x - 7, a.y - 4, 4, 4, "#05051a"); E.rect(c, a.x + 3, a.y - 4, 4, 4, "#05051a");
      E.rect(c, a.x - 14 + (f ? 2 : 0), a.y + 6, 5, 5, cols[a.t]); E.rect(c, a.x + 9 - (f ? 2 : 0), a.y + 6, 5, 5, cols[a.t]);
    });
    s.bunk.forEach(([x, y]) => E.rect(c, x, y, 8, 8, "#22c55e"));
    E.rect(c, s.x - 18, 405, 36, 12, "#e5e7eb"); E.rect(c, s.x - 4, 397, 8, 8, "#e5e7eb");
    s.shots.forEach((b) => E.rect(c, b.x - 2, b.y - 8, 4, 12, "#fff"));
    s.bombs.forEach((b) => E.rect(c, b.x - 2, b.y - 6, 4, 10, "#f87171"));
    E.rect(c, 0, 430, 800, 2, "#22c55e");
    E.text(c, `Score ${s.score}   Wave ${s.wave}   ${"♥".repeat(Math.max(0, s.lives))}`, 400, 15, 16);
  },
});
