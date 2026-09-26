// Wait for green, then tap. Average of 5 tries (lower is better).
GAME({
  title: "Reaction Test",
  players: 1, touch: "pointer",
  lowScore: true,
  controls: "When the screen turns green, tap / click / press A as fast as you can. 5 tries; your score is the average in ms (lower is better).",
  init() { return { phase: "wait", t: 0, go: E.rand(1.5, 4), times: [], msg: "" }; },
  update(s, inp, dt) {
    s.t += dt;
    const press = inp[0].pa || inp[0].taps.length;
    if (s.phase === "wait") {
      if (press) { s.phase = "early"; s.t = 0; E.sfx("lose"); }
      else if (s.t >= s.go) { s.phase = "go"; s.t = 0; }
    } else if (s.phase === "go") {
      if (press) { s.times.push(Math.round(s.t * 1000)); s.phase = "show"; s.t = 0; E.sfx("coin"); }
    } else if (s.t > 1.2 && (press || s.t > 2.5)) {
      if (s.times.length >= 5) { s.over = true; s.score = Math.round(s.times.reduce((a, b) => a + b, 0) / 5); return; }
      Object.assign(s, { phase: "wait", t: 0, go: E.rand(1.5, 4) });
    }
  },
  draw(c, s) {
    const bg = { wait: "#b91c1c", go: "#16a34a", early: "#1e3a8a", show: "#1e3a8a" }[s.phase];
    E.clear(c, bg);
    const msg = { wait: "Wait for green…", go: "TAP!", early: "Too early! Tap to try again", show: `${s.times[s.times.length - 1]} ms` }[s.phase];
    E.text(c, msg, 400, 200, s.phase === "go" ? 90 : 40);
    E.text(c, `Try ${Math.min(5, s.times.length + (s.phase === "show" ? 0 : 1))} of 5   ${s.times.join(" · ")}`, 400, 380, 18);
  },
});
