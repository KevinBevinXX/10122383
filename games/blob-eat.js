// Agar-style: eat pellets and smaller blobs, avoid bigger ones.
GAME({
  title: "Blob Eat",
  players: 1,
  controls: "Point where to go with the mouse / finger, or use ◀ ▲ ▼ ▶. Eat smaller blobs, flee from bigger ones.",
  aLabel: "·", bLabel: false,
  WW: 2000, WH: 1400,
  init() {
    const s = { blobs: [], pel: [], score: 0 };
    s.blobs.push({ x: 1000, y: 700, r: 20, me: true, col: "#22d3ee", name: "You", tx: 1000, ty: 700 });
    for (let i = 0; i < 14; i++) s.blobs.push(this.bot(s));
    for (let i = 0; i < 400; i++) s.pel.push([E.rand(0, this.WW), E.rand(0, this.WH), E.randi(0, 5)]);
    return s;
  },
  NAMES: ["Zed", "Mochi", "Blobby", "Nova", "Pixel", "Tank", "Kiwi", "Rex", "Luna", "Bean", "Orbit", "Jelly"],
  bot(s) {
    // spawn away from the player so nobody gets eaten the instant they appear
    const me = s && s.blobs.find((b) => b.me);
    let x, y;
    do { x = E.rand(0, this.WW); y = E.rand(0, this.WH); } while (me && E.dist(x, y, me.x, me.y) < 350);
    return { x, y, r: E.rand(10, 34), me: false, col: `hsl(${E.randi(0, 360)},70%,55%)`, name: E.pick(this.NAMES), tx: x, ty: y, t: 0 };
  },
  update(s, inp, dt) {
    const k = inp[0], me = s.blobs.find((b) => b.me);
    if (!me) { s.over = true; return; }
    if (k.px || k.py) { me.tx = me.x + (k.px - 400) * 3; me.ty = me.y + (k.py - 225) * 3; }
    const kd = [(k.right ? 1 : 0) - (k.left ? 1 : 0), (k.down ? 1 : 0) - (k.up ? 1 : 0)];
    if (kd[0] || kd[1]) { me.tx = me.x + kd[0] * 500; me.ty = me.y + kd[1] * 500; }
    for (const b of s.blobs) {
      if (!b.me) {
        b.t -= dt;
        if (b.t <= 0) {
          b.t = E.rand(0.3, 1);
          const threat = s.blobs.find((o) => o !== b && o.r > b.r * 1.15 && E.dist(o.x, o.y, b.x, b.y) < 250);
          const prey = s.blobs.find((o) => o !== b && o.r * 1.15 < b.r && E.dist(o.x, o.y, b.x, b.y) < 220);
          if (threat) { b.tx = b.x + (b.x - threat.x) * 3; b.ty = b.y + (b.y - threat.y) * 3; }
          else if (prey) { b.tx = prey.x; b.ty = prey.y; }
          else { const p = s.pel[E.randi(0, s.pel.length - 1)]; b.tx = p[0]; b.ty = p[1]; }
        }
      }
      const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy);
      const sp = 240 * Math.pow(20 / b.r, 0.45) * (b.me ? 1 : 0.85);
      if (d > 3) { const step = Math.min(d, sp * dt); b.x += (dx / d) * step; b.y += (dy / d) * step; }
      b.x = E.clamp(b.x, b.r, this.WW - b.r); b.y = E.clamp(b.y, b.r, this.WH - b.r);
      s.pel = s.pel.filter((p) => { if (E.dist(p[0], p[1], b.x, b.y) < b.r) { b.r = Math.sqrt(b.r * b.r + 12); if (b.me) s.score++; return false; } return true; });
    }
    for (const a of s.blobs) for (const b of s.blobs) {
      if (a === b || a.dead || b.dead) continue;
      if (a.r > b.r * 1.15 && E.dist(a.x, a.y, b.x, b.y) < a.r - b.r * 0.4) { a.r = Math.sqrt(a.r * a.r + b.r * b.r); b.dead = true; if (a.me) { s.score += Math.round(b.r); E.sfx("coin"); } if (b.me) E.sfx("boom"); }
    }
    if (me.dead) { s.over = true; s.score = Math.round(me.r); return; }
    s.blobs = s.blobs.filter((b) => !b.dead);
    while (s.blobs.length < 15) s.blobs.push(this.bot(s));
    while (s.pel.length < 400) s.pel.push([E.rand(0, this.WW), E.rand(0, this.WH), E.randi(0, 5)]);
    s.score = Math.round(me.r);
  },
  draw(c, s) {
    const me = s.blobs.find((b) => b.me) || { x: 1000, y: 700, r: 20 };
    const z = Math.max(0.45, Math.min(1, 30 / me.r));
    E.clear(c, "#f8fafc");
    c.save(); c.translate(400, 225); c.scale(z, z); c.translate(-me.x, -me.y);
    for (let x = 0; x <= this.WW; x += 50) E.line(c, x, 0, x, this.WH, "#e2e8f0", 1);
    for (let y = 0; y <= this.WH; y += 50) E.line(c, 0, y, this.WW, y, "#e2e8f0", 1);
    const cols = ["#f87171", "#fbbf24", "#34d399", "#60a5fa", "#c084fc", "#f472b6"];
    s.pel.forEach(([x, y, k]) => E.circle(c, x, y, 5, cols[k]));
    [...s.blobs].sort((a, b) => a.r - b.r).forEach((b) => { E.circle(c, b.x, b.y, b.r + 3, "rgba(0,0,0,.15)"); E.circle(c, b.x, b.y, b.r, b.col); E.text(c, b.name, b.x, b.y, Math.max(10, b.r / 2.5), "#fff"); });
    c.restore();
    E.text(c, `Mass ${s.score}`, 10, 10, 18, "#334155", "left", "top");
    const top = [...s.blobs].sort((a, b) => b.r - a.r).slice(0, 5);
    E.rrect(c, 640, 8, 150, 20 + top.length * 18, 8, "rgba(0,0,0,.4)");
    top.forEach((b, i) => E.text(c, `${i + 1}. ${b.name} ${Math.round(b.r)}`, 650, 26 + i * 18, 13, b.me ? "#67e8f9" : "#fff", "left"));
  },
});
