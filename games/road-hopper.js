// Hop across roads and rivers. How far can you get?
GAME({
  title: "Road Hopper",
  players: 1,
  controls: "Hop with ◀ ▲ ▼ ▶ (or tap ahead). Ride logs over water, dodge cars, don't dawdle.",
  aLabel: "Hop", bLabel: false,
  T: 40,
  init() {
    const s = { rows: {}, x: 10, y: 0, best: 0, cam: 0, score: 0, idle: 0, log: 0 };
    for (let r = -5; r < 20; r++) this.row(s, r);
    return s;
  },
  row(s, r) {
    if (s.rows[r]) return;
    let type = r < 3 ? "grass" : E.pick(["road", "road", "water", "grass", "road", "water"]);
    const dir = Math.random() < 0.5 ? -1 : 1, spd = E.rand(60, 130 + r * 1.5) * dir;
    const obj = [];
    if (type === "road") for (let x = E.rand(0, 200); x < 900; x += E.rand(180, 380)) obj.push({ x, w: E.pick([60, 60, 100]) });
    if (type === "water") for (let x = E.rand(0, 100); x < 900; x += E.rand(200, 300)) obj.push({ x, w: E.pick([120, 160, 200]) });
    const trees = type === "grass" && r > 2 ? Array.from({ length: 20 }, (_, i) => i).filter((i) => i !== 10 && Math.random() < 0.15) : [];
    s.rows[r] = { type, spd, obj, trees };
  },
  update(s, inp, dt) {
    const k = inp[0];
    let mv = k.pu ? [0, 1] : k.pd ? [0, -1] : k.pl ? [-1, 0] : k.pr ? [1, 0] : k.pa ? [0, 1] : null;
    for (const t of k.taps) { const px = s.x * this.T + 20, py = 450 - (s.y - s.cam) * this.T - 60; const dx = t.x - px, dy = t.y - py; mv = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, dy < 0 ? 1 : -1]; }
    if (mv) {
      const nx = Math.round(s.x) + mv[0], ny = s.y + mv[1];
      this.row(s, ny + 20);
      const row = s.rows[ny];
      if (nx >= 0 && nx < 20 && ny >= s.cam - 1 && !(row && row.trees.includes(nx))) { s.x = nx; s.y = ny; s.idle = 0; E.sfx("jump"); }
      if (s.y > s.best) { s.best = s.y; s.score = s.best; }
    }
    s.idle += dt;
    Object.values(s.rows).forEach((r) => r.obj.forEach((o) => { o.x += r.spd * dt; if (r.spd > 0 && o.x > 850) o.x -= 1000; if (r.spd < 0 && o.x + o.w < -50) o.x += 1000; }));
    const row = s.rows[s.y], px = s.x * this.T + 20;
    if (row.type === "road" && row.obj.some((o) => px + 14 > o.x && px - 14 < o.x + o.w)) { s.over = true; E.sfx("boom"); }
    if (row.type === "water") {
      const log = row.obj.find((o) => px > o.x - 6 && px < o.x + o.w + 6);
      if (!log) { s.over = true; E.sfx("lose"); } else { s.x += (row.spd * dt) / this.T; if (s.x < -0.4 || s.x > 19.4) { s.over = true; E.sfx("lose"); } }
    }
    s.cam = Math.max(s.cam + dt * (0.25 + s.best * 0.004), s.y - 6);
    if (s.y < s.cam - 1.5 || s.idle > 12) { s.over = true; E.sfx("lose"); }
  },
  draw(c, s) {
    const T = this.T;
    for (let r = Math.floor(s.cam) - 2; r < s.cam + 13; r++) {
      const row = s.rows[r]; if (!row) continue;
      const y = 450 - (r - s.cam) * T - 80;
      const col = { grass: r % 2 ? "#8bc34a" : "#7cb342", road: "#546e7a", water: "#4fc3f7" }[row.type];
      E.rect(c, 0, y, 800, T, col);
      if (row.type === "road") for (let x = 0; x < 800; x += 60) E.rect(c, x, y + T / 2 - 1, 30, 2, "#cfd8dc");
      row.trees.forEach((tx) => { E.rect(c, tx * T + 16, y + 22, 8, 14, "#6d4c41"); E.circle(c, tx * T + 20, y + 16, 14, "#2e7d32"); });
      row.obj.forEach((o, i) => {
        if (row.type === "road") { E.rrect(c, o.x, y + 6, o.w, T - 12, 6, ["#e53935", "#fdd835", "#8e24aa", "#1e88e5"][(i + r) % 4]); E.rect(c, o.x + (row.spd > 0 ? o.w - 16 : 6), y + 10, 10, T - 20, "#b3e5fc"); }
        else { E.rrect(c, o.x, y + 8, o.w, T - 16, 8, "#8d6e63"); E.rect(c, o.x + 10, y + 16, o.w - 20, 3, "#6d4c41"); }
      });
    }
    const px = s.x * T + 20, py = 450 - (s.y - s.cam) * T - 60;
    E.rect(c, px - 12, py - 10, 24, 22, "#fff"); E.rect(c, px - 5, py - 16, 10, 8, "#fff"); E.rect(c, px - 2, py - 20, 4, 5, "#e53935"); E.rect(c, px + 6, py - 12, 5, 3, "#ff9800");
    E.text(c, "Score " + s.score, 10, 10, 20, "#fff", "left", "top");
  },
});
