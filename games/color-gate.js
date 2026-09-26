// Tap to hop up. Only pass through the part of each ring that matches your colour.
GAME({
  title: "Color Gate",
  players: 1,
  controls: "Tap / A / ▲ to hop. Pass through gates only on your ball's colour. Stars score, switchers change colour.",
  aLabel: "Hop", bLabel: false,
  COLS: ["#fde047", "#a855f7", "#ec4899", "#22d3ee"],
  init() { const s = { y: 380, vy: 0, col: 0, cam: 0, items: [], top: 150, score: 0, t: 0, started: false }; for (let i = 0; i < 4; i++) this.add(s); return s; },
  add(s) { s.items.push({ y: s.top, t: "ring", r: 70, spin: E.pick([-1.6, 1.6, 2.1, -2.1]) }, { y: s.top, t: "star" }, { y: s.top - 130, t: "switch" }); s.top -= 260; },
  update(s, inp, dt) {
    const k = inp[0];
    s.t += dt;
    if (k.pa || k.pu || k.taps.length) { s.vy = -330; s.started = true; E.sfx("jump"); }
    if (!s.started) return;
    s.vy += 1000 * dt; const oy = s.y; s.y += s.vy * dt;
    if (s.y < s.cam + 220) s.cam = s.y - 220;
    if (s.y > s.cam + 470) { s.over = true; E.sfx("lose"); return; }
    for (const it of s.items) {
      if (it.done) continue;
      if (it.t === "star" && Math.abs(s.y - it.y) < 20) { it.done = true; s.score++; E.sfx("coin"); }
      if (it.t === "switch" && Math.abs(s.y - it.y) < 16) { it.done = true; s.col = (s.col + E.randi(1, 3)) % 4; E.sfx("pop"); }
      if (it.t === "ring") {
        for (const edge of [it.y - it.r, it.y + it.r]) {
          if (Math.abs(s.y - edge) < 18) {
            // which quarter of the ring is at this point (top edge: angle -π/2, bottom: π/2)
            const ang = (edge < it.y ? -Math.PI / 2 : Math.PI / 2) - s.t * it.spin;
            const q = Math.floor((((ang % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / (Math.PI / 2));
            if (q !== s.col) { s.over = true; E.sfx("boom"); return; }
          }
        }
      }
    }
    s.items = s.items.filter((it) => it.y < s.cam + 600);
    while (s.top > s.cam - 300) this.add(s);
  },
  draw(c, s) {
    E.clear(c, "#18181b");
    const Y = (y) => y - s.cam;
    for (const it of s.items) {
      if (it.t === "ring") for (let q = 0; q < 4; q++) { c.strokeStyle = this.COLS[q]; c.lineWidth = 14; c.beginPath(); c.arc(400, Y(it.y), it.r, q * Math.PI / 2 + s.t * it.spin, (q + 1) * Math.PI / 2 + s.t * it.spin); c.stroke(); }
      if (it.t === "star" && !it.done) E.text(c, "★", 400, Y(it.y), 28, "#fff");
      if (it.t === "switch" && !it.done) for (let q = 0; q < 4; q++) { c.fillStyle = this.COLS[q]; c.beginPath(); c.moveTo(400, Y(it.y)); c.arc(400, Y(it.y), 12, q * Math.PI / 2, (q + 1) * Math.PI / 2); c.fill(); }
    }
    E.circle(c, 400, Y(s.y), 11, this.COLS[s.col]);
    E.text(c, s.score, 30, 30, 28, "#fff", "left");
    if (!s.started) E.text(c, "Tap to start", 400, 420, 18, "#aaa");
  },
});
