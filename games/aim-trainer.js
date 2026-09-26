// Click targets as fast as you can. 30 seconds.
GAME({
  title: "Aim Trainer",
  players: 1, touch: "pointer",
  controls: "Tap / click the targets before they shrink away. 30 seconds. Accuracy counts.",
  init() { return { tg: [], time: 30, hits: 0, shots: 0, score: 0, next: 0 }; },
  update(s, inp, dt) {
    s.time -= dt; if (s.time <= 0) { s.over = true; s.score = Math.round(s.hits * 10 * (s.shots ? s.hits / s.shots : 0)); s.overText = `${s.hits} hits · ${s.shots ? Math.round((100 * s.hits) / s.shots) : 0}% accuracy`; return; }
    s.next -= dt;
    if (s.next <= 0 && s.tg.length < 4) { s.tg.push({ x: E.rand(40, 760), y: E.rand(60, 420), r: 32, t: 0 }); s.next = E.rand(0.3, 0.7); }
    s.tg.forEach((t) => { t.t += dt; t.r = 32 * (1 - t.t / 2.2); });
    s.tg = s.tg.filter((t) => t.r > 3);
    for (const p of inp[0].taps) {
      s.shots++;
      const i = s.tg.findIndex((t) => E.dist(p.x, p.y, t.x, t.y) < t.r);
      if (i >= 0) { s.hits++; s.tg.splice(i, 1); E.sfx("pop"); } else E.sfx("click");
    }
  },
  draw(c, s) {
    E.clear(c, "#111827");
    s.tg.forEach((t) => { E.circle(c, t.x, t.y, t.r, "#ef4444"); E.circle(c, t.x, t.y, t.r * 0.66, "#fff"); E.circle(c, t.x, t.y, t.r * 0.33, "#ef4444"); });
    E.text(c, `${Math.ceil(s.time)}s   Hits ${s.hits}   Accuracy ${s.shots ? Math.round((100 * s.hits) / s.shots) : 100}%`, 400, 22, 18);
  },
});
