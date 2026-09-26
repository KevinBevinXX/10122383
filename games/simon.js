// Simon: repeat the growing colour sequence.
GAME({
  title: "Simon Says",
  players: 1, touch: "pointer",
  controls: "Watch the sequence, then tap the pads in the same order (or ▲ ▶ ▼ ◀).",
  init() { return { seq: [E.randi(0, 3)], pos: 0, show: 0, showT: 0.8, lit: -1, litT: 0, phase: "show", score: 0 }; },
  PADS: [[400, 110, "#22c55e", "#86efac"], [520, 225, "#ef4444", "#fca5a5"], [400, 340, "#3b82f6", "#93c5fd"], [280, 225, "#eab308", "#fde047"]],
  update(s, inp, dt) {
    s.litT -= dt; if (s.litT <= 0) s.lit = -1;
    if (s.phase === "show") {
      s.showT -= dt;
      if (s.showT <= 0) {
        if (s.show >= s.seq.length) { s.phase = "input"; s.pos = 0; return; }
        s.lit = s.seq[s.show]; s.litT = Math.max(0.2, 0.5 - s.seq.length * 0.02); s.showT = s.litT + 0.15; s.show++;
        E.sfx(["coin", "pop", "hit", "click"][s.lit]);
      }
      return;
    }
    const k = inp[0];
    let p = k.pu ? 0 : k.pr ? 1 : k.pd ? 2 : k.pl ? 3 : -1;
    for (const t of k.taps) this.PADS.forEach(([x, y], i) => { if (E.dist(t.x, t.y, x, y) < 60) p = i; });
    if (p < 0) return;
    s.lit = p; s.litT = 0.2; E.sfx(["coin", "pop", "hit", "click"][p]);
    if (p !== s.seq[s.pos]) { s.over = true; E.sfx("lose"); return; }
    s.pos++;
    if (s.pos >= s.seq.length) { s.score = s.seq.length; s.seq.push(E.randi(0, 3)); s.phase = "show"; s.show = 0; s.showT = 0.9; }
  },
  draw(c, s) {
    E.clear(c, "#18181b");
    E.circle(c, 400, 225, 200, "#27272a");
    this.PADS.forEach(([x, y, col, lit], i) => E.circle(c, x, y, 60, s.lit === i ? lit : col));
    E.circle(c, 400, 225, 50, "#18181b");
    E.text(c, s.score, 400, 225, 30);
    E.text(c, s.phase === "show" ? "Watch…" : "Your turn", 400, 430, 18, "#a1a1aa");
  },
});
