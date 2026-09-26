// Wait for DRAW!, then press A first. Too early and you lose the round.
GAME({
  title: "Quick Draw",
  players: 2,
  controls: "Wait for “DRAW!” then press A (or tap) as fast as you can. Too early = you lose the round. First to 3.",
  aLabel: "Fire", bLabel: false,
  init() { return { score: [0, 0], phase: "wait", t: 0, go: E.rand(1.5, 4), res: "", rt: 0 }; },
  update(s, inp, dt) {
    s.t += dt;
    const fired = (i) => inp[i].pa || inp[i].taps.length > 0;
    if (s.phase === "wait") {
      for (let i = 0; i < 2; i++) if (fired(i)) return this.point(s, 1 - i, `${E.name(i)} fired too early!`);
      if (s.t >= s.go) { s.phase = "draw"; s.t = 0; s.aiRt = E.rand(0.22, 0.45); E.sfx("shoot"); }
    } else if (s.phase === "draw") {
      const f = [fired(0), fired(1)];
      if (f[0] || f[1]) { const w = f[0] && f[1] ? E.randi(0, 1) : f[0] ? 0 : 1; this.point(s, w, `${E.name(w)} was faster! (${Math.round(s.t * 1000)} ms)`); }
    } else if (s.t > 2) {
      if (s.score.some((v) => v >= 3)) { s.over = true; s.winner = s.score[0] >= 3 ? 0 : 1; return; }
      Object.assign(s, { phase: "wait", t: 0, go: E.rand(1.5, 4), res: "" });
    }
  },
  point(s, w, msg) { s.score[w]++; s.res = msg; s.phase = "show"; s.t = 0; s.win = w; E.sfx("boom"); },
  ai(s, i) { return { pa: s.phase === "draw" && s.t > s.aiRt }; },
  draw(c, s) {
    const sky = s.phase === "draw" ? "#b71c1c" : "#f4a261";
    E.clear(c, sky); E.rect(c, 0, 330, 800, 120, "#8d6e63");
    E.circle(c, 400, 330, 60, "#ffd166");
    [0, 1].forEach((i) => {
      const x = i ? 640 : 160, dead = s.phase === "show" && s.win !== i;
      c.save(); c.translate(x, 330); if (dead) c.rotate(i ? 1.2 : -1.2);
      E.rect(c, -12, -80, 24, 60, "#3e2723"); E.circle(c, 0, -92, 14, "#f1c27d"); E.rect(c, -22, -110, 44, 8, "#5d4037"); E.rect(c, -12, -124, 24, 16, "#5d4037");
      E.rect(c, -10, -20, 8, 20, "#3e2723"); E.rect(c, 2, -20, 8, 20, "#3e2723");
      c.restore();
      E.text(c, `${E.name(i)}: ${s.score[i]}`, x, 400, 20);
    });
    if (s.phase === "wait") E.text(c, "Wait for it…", 400, 120, 40, "#3d405b");
    if (s.phase === "draw") E.text(c, "DRAW!", 400, 120, 90, "#fff");
    if (s.phase === "show") E.text(c, s.res, 400, 120, 26, "#1d3557");
  },
});
