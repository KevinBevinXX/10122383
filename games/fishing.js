// Drop the hook, catch fish on the way up, avoid jellyfish. 90 seconds.
GAME({
  title: "Deep Fishing",
  players: 1,
  controls: "A / tap to drop the hook. Steer with ◀ ▶ (or drag) on the way down and up. Hooks catch on the way UP. Avoid jellyfish.",
  aLabel: "Drop", bLabel: false,
  init() { return { fish: Array.from({ length: 40 }, (_, i) => this.fish(i)), hook: null, x: 400, score: 0, time: 90, caught: [], boatX: 400 }; },
  fish(i) { const d = E.rand(0, 1); return { x: E.rand(0, 800), y: 180 + d * 1600, vx: E.pick([-1, 1]) * E.rand(30, 90), kind: Math.random() < 0.12 ? "jelly" : d > 0.7 ? "big" : d > 0.35 ? "mid" : "small" }; },
  update(s, inp, dt) {
    const k = inp[0];
    s.time -= dt; if (s.time <= 0 && !s.hook) { s.over = true; return; }
    s.fish.forEach((f) => { f.x += f.vx * dt; if (f.x < 0 || f.x > 800) f.vx = -f.vx; });
    if (!s.hook) { if (k.pa || k.taps.length) { s.hook = { x: 400, y: 150, dir: 1, got: [] }; E.sfx("click"); } return; }
    const h = s.hook;
    if (k.pdown) h.x = E.lerp(h.x, k.px, 0.2); else h.x += ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 280 * dt;
    h.x = E.clamp(h.x, 10, 790);
    h.y += h.dir * (h.dir > 0 ? 260 : 320) * dt;
    if (h.dir > 0) {
      if (h.y > 1800) h.dir = -1;
      if (s.fish.some((f) => f.kind === "jelly" && E.dist(f.x, f.y, h.x, h.y) < 26)) { h.dir = -1; E.sfx("hit"); }
    } else {
      s.fish = s.fish.filter((f) => { if (h.got.length < 6 && E.dist(f.x, f.y, h.x, h.y) < 28) { if (f.kind === "jelly") { h.got = []; E.sfx("lose"); return true; } h.got.push(f.kind); E.sfx("pop"); return false; } return true; });
      if (h.y <= 150) { const pts = h.got.reduce((a, k2) => a + { small: 1, mid: 3, big: 8 }[k2], 0); s.score += pts; if (pts) E.sfx("coin"); s.hook = null; while (s.fish.length < 40) s.fish.push(this.fish()); }
    }
  },
  draw(c, s) {
    const cam = s.hook ? E.clamp(s.hook.y - 225, 0, 1600) : 0;
    const g = c.createLinearGradient(0, 0, 0, 450); g.addColorStop(0, `hsl(200,70%,${Math.max(8, 45 - cam / 50)}%)`); g.addColorStop(1, `hsl(215,70%,${Math.max(4, 30 - cam / 50)}%)`);
    c.fillStyle = g; c.fillRect(0, 0, 800, 450);
    c.save(); c.translate(0, -cam);
    E.rect(c, 0, 0, 800, 140, "#7dd3fc");
    E.rrect(c, 340, 110, 120, 30, 10, "#92400e"); E.rect(c, 395, 70, 6, 45, "#78350f");
    s.fish.forEach((f) => {
      if (Math.abs(f.y - cam - 225) > 260) return;
      if (f.kind === "jelly") { E.circle(c, f.x, f.y, 14, "rgba(244,114,182,.8)"); for (let t = -2; t <= 2; t++) E.line(c, f.x + t * 5, f.y, f.x + t * 5 + Math.sin(s.time * 5 + t) * 3, f.y + 20, "rgba(244,114,182,.8)", 2); return; }
      const sz = { small: 10, mid: 16, big: 26 }[f.kind], col = { small: "#fde047", mid: "#fb923c", big: "#a78bfa" }[f.kind];
      c.save(); c.translate(f.x, f.y); if (f.vx < 0) c.scale(-1, 1);
      c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, sz, sz * 0.55, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(-sz, 0); c.lineTo(-sz * 1.6, -sz * 0.5); c.lineTo(-sz * 1.6, sz * 0.5); c.fill(); E.circle(c, sz * 0.5, -sz * 0.15, 2, "#111");
      c.restore();
    });
    if (s.hook) {
      E.line(c, 398, 75, s.hook.x, s.hook.y, "#e5e7eb", 1);
      c.strokeStyle = "#9ca3af"; c.lineWidth = 3; c.beginPath(); c.arc(s.hook.x, s.hook.y + 6, 7, 0, Math.PI); c.stroke();
      s.hook.got.forEach((k2, i) => E.circle(c, s.hook.x + 8, s.hook.y + 14 + i * 10, 5, { small: "#fde047", mid: "#fb923c", big: "#a78bfa" }[k2]));
    }
    c.restore();
    E.text(c, `Score ${s.score}   ${Math.max(0, Math.ceil(s.time))}s${s.hook ? `   depth ${Math.round((s.hook.y - 150) / 10)} m` : ""}`, 10, 10, 16, "#fff", "left", "top");
    if (!s.hook) E.text(c, "Tap / A to drop the hook", 400, 300, 20, "#fff");
  },
});
