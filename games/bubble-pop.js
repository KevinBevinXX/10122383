// Bubble shooter: match 3+ of a colour to pop them. Don't let them reach the bottom.
GAME({
  title: "Bubble Pop",
  players: 1, touch: "pointer",
  controls: "Aim with the mouse / finger (or ◀ ▶) and tap / A to shoot. Match 3 or more.",
  R: 18, COLS: ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316"],
  init() {
    const g = [];
    for (let r = 0; r < 6; r++) g.push(Array.from({ length: 12 - (r % 2) }, () => E.randi(0, 4)));
    return { g, cur: E.randi(0, 4), nxt: E.randi(0, 4), aim: -Math.PI / 2, shot: null, shots: 0, score: 0, top: 0 };
  },
  pos(r, c, s) { return [184 + c * 36 + (r % 2 ? 18 : 0) + this.R, 20 + s.top + r * 31 + this.R]; },
  update(s, inp, dt) {
    const k = inp[0];
    if (k.px || k.py) { if (k.py < 410) s.aim = Math.atan2(k.py - 420, k.px - 400); }
    s.aim += ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 1.5 * dt;
    s.aim = E.clamp(s.aim, -Math.PI + 0.15, -0.15);
    if ((k.pa || k.taps.length) && !s.shot) { s.shot = { x: 400, y: 420, vx: Math.cos(s.aim) * 700, vy: Math.sin(s.aim) * 700, c: s.cur }; s.cur = s.nxt; s.nxt = this.pickColor(s); E.sfx("shoot"); }
    if (!s.shot) return;
    const b = s.shot;
    for (let n = 0; n < 4; n++) {
      b.x += (b.vx * dt) / 4; b.y += (b.vy * dt) / 4;
      if (b.x < 184 + this.R || b.x > 616 - this.R) { b.vx = -b.vx; b.x = E.clamp(b.x, 184 + this.R, 616 - this.R); }
      let hit = b.y < 20 + s.top + this.R;
      for (let r = 0; r < s.g.length && !hit; r++) for (let c = 0; c < s.g[r].length; c++) if (s.g[r][c] >= 0 && E.dist(b.x, b.y, ...this.pos(r, c, s)) < this.R * 1.8) { hit = true; break; }
      if (hit) { this.place(s, b); return; }
    }
  },
  pickColor(s) { const present = [...new Set(s.g.flat().filter((v) => v >= 0))]; return present.length ? E.pick(present) : E.randi(0, 4); },
  place(s, b) {
    let best = null, bd = Infinity;
    s.g.push(Array(12 - (s.g.length % 2)).fill(-1));
    for (let r = 0; r < s.g.length; r++) {
      for (let c = 0; c < s.g[r].length; c++) if (s.g[r][c] < 0) { const d = E.dist(b.x, b.y, ...this.pos(r, c, s)); if (d < bd) { bd = d; best = [r, c]; } }
    }
    const [r, c] = best; s.g[r][c] = b.c; s.shot = null; s.shots++;
    const nb = (r, c) => (r % 2 ? [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]] : [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]]).map(([dr, dc]) => [r + dr, c + dc]).filter(([a, bb]) => s.g[a] && bb >= 0 && bb < s.g[a].length);
    const group = [[r, c]], seen = new Set([r + "," + c]);
    for (let i = 0; i < group.length; i++) for (const [a, bb] of nb(...group[i])) if (!seen.has(a + "," + bb) && s.g[a][bb] === b.c) { seen.add(a + "," + bb); group.push([a, bb]); }
    if (group.length >= 3) {
      group.forEach(([a, bb]) => (s.g[a][bb] = -1)); s.score += group.length * 10; E.sfx("pop");
      const keep = new Set(), q = [];
      s.g[0].forEach((v, cc) => { if (v >= 0) { keep.add("0," + cc); q.push([0, cc]); } });
      while (q.length) { const cur = q.pop(); for (const [a, bb] of nb(...cur)) if (s.g[a][bb] >= 0 && !keep.has(a + "," + bb)) { keep.add(a + "," + bb); q.push([a, bb]); } }
      s.g.forEach((row, a) => row.forEach((v, bb) => { if (v >= 0 && !keep.has(a + "," + bb)) { row[bb] = -1; s.score += 20; } }));
    } else E.sfx("click");
    if (s.shots % 6 === 0) s.top += 31;
    while (s.g.length && s.g[s.g.length - 1].every((v) => v < 0)) s.g.pop();
    if (!s.g.length) { s.score += 500; Object.assign(s, this.init(), { score: s.score }); E.sfx("win"); return; }
    if (20 + s.top + (s.g.length - 1) * 31 + this.R * 2 > 390) { s.over = true; E.sfx("lose"); }
  },
  draw(c, s) {
    E.clear(c, "#1e1b4b");
    E.rect(c, 184, 0, 432, 450, "#312e81"); E.rect(c, 184, 385, 432, 2, "rgba(255,255,255,.3)");
    s.g.forEach((row, r) => row.forEach((v, cc) => { if (v >= 0) { const [x, y] = this.pos(r, cc, s); E.circle(c, x, y, this.R - 1, this.COLS[v]); E.circle(c, x - 5, y - 5, 5, "rgba(255,255,255,.35)"); } }));
    c.setLineDash([6, 8]); E.line(c, 400, 420, 400 + Math.cos(s.aim) * 160, 420 + Math.sin(s.aim) * 160, "rgba(255,255,255,.5)", 2); c.setLineDash([]);
    if (s.shot) E.circle(c, s.shot.x, s.shot.y, this.R - 1, this.COLS[s.shot.c]);
    E.circle(c, 400, 420, this.R, this.COLS[s.cur]); E.circle(c, 460, 430, 11, this.COLS[s.nxt]);
    E.text(c, "Score", 90, 40, 16); E.text(c, s.score, 90, 70, 26, "#fde047");
    E.text(c, `Drops in ${6 - (s.shots % 6)}`, 710, 40, 14, "#c7d2fe");
  },
});
