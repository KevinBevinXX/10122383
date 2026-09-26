// Drop the sliding block. Overhangs get chopped off.
GAME({
  title: "Tower Stack",
  players: 1, touch: "pointer",
  controls: "Tap, click, or press A to drop the moving block. Line it up perfectly!",
  init() { return { stack: [{ x: 300, w: 200 }], cur: { x: 0, w: 200, dir: 1 }, spd: 220, score: 0, cam: 0, chop: [], perfect: 0 }; },
  update(s, inp, dt) {
    const k = inp[0], c = s.cur;
    c.x += c.dir * s.spd * dt;
    if (c.x < -c.w * 0.5 || c.x + c.w > 800 + c.w * 0.5) c.dir = -c.dir;
    s.chop.forEach((p) => { p.vy += 900 * dt; p.y += p.vy * dt; });
    s.chop = s.chop.filter((p) => p.y < 900);
    const n = s.stack.length;
    s.cam = E.lerp(s.cam, Math.max(0, n - 8) * 30, 0.1);
    if (k.pa || k.taps.length) {
      const top = s.stack[n - 1];
      let l = Math.max(c.x, top.x), r = Math.min(c.x + c.w, top.x + top.w);
      if (r - l <= 0) { s.over = true; E.sfx("lose"); s.chop.push({ x: c.x, w: c.w, y: 420 - n * 30, vy: 0, col: n }); return; }
      if (Math.abs(c.x - top.x) < 5) { l = top.x; r = top.x + top.w; s.perfect++; E.sfx("coin"); }
      else {
        s.perfect = 0; E.sfx("click");
        if (c.x < l) s.chop.push({ x: c.x, w: l - c.x, y: 420 - n * 30, vy: 0, col: n });
        if (c.x + c.w > r) s.chop.push({ x: r, w: c.x + c.w - r, y: 420 - n * 30, vy: 0, col: n });
      }
      s.stack.push({ x: l, w: r - l }); s.score++;
      s.spd = Math.min(520, s.spd + 8);
      s.cur = { x: s.score % 2 ? 800 : -(r - l), w: r - l, dir: s.score % 2 ? -1 : 1 };
    }
  },
  col(i) { return `hsl(${(i * 12) % 360},70%,60%)`; },
  draw(c, s) {
    const g = c.createLinearGradient(0, 0, 0, 450); g.addColorStop(0, `hsl(${(s.score * 12 + 180) % 360},50%,25%)`); g.addColorStop(1, `hsl(${(s.score * 12 + 200) % 360},50%,12%)`);
    c.fillStyle = g; c.fillRect(0, 0, 800, 450);
    const Y = (i) => 420 - i * 30 + s.cam;
    s.stack.forEach((b, i) => { E.rect(c, b.x, Y(i), b.w, 30, this.col(i)); E.rect(c, b.x, Y(i), b.w, 4, "rgba(255,255,255,.25)"); });
    if (!s.over) E.rect(c, s.cur.x, Y(s.stack.length), s.cur.w, 30, this.col(s.stack.length));
    s.chop.forEach((p) => E.rect(c, p.x, p.y + s.cam, p.w, 30, this.col(p.col)));
    E.text(c, s.score, 400, 60, 54);
    if (s.perfect > 1) E.text(c, `Perfect ×${s.perfect}`, 400, 105, 20, "#fde047");
  },
});
