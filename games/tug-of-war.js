// Mash the button to pull the rope to your side.
GAME({
  title: "Tug of War",
  players: 2,
  controls: "Mash A (or tap fast) to pull. Get the flag to your side!",
  aLabel: "Pull!", bLabel: false,
  init() { return { pos: 0, go: 3, v: 0 }; },
  update(s, inp, dt) {
    if (s.go > 0) { s.go -= dt; return; }
    const pulls = (i) => (inp[i].pa ? 1 : 0) + inp[i].taps.length;
    s.v += (pulls(1) - pulls(0)) * 7;
    s.v *= 0.9; s.pos += s.v * dt;
    if (Math.abs(s.pos) > 200) { s.over = true; s.winner = s.pos < 0 ? 0 : 1; }
  },
  ai(s, i) { return { pa: s.go <= 0 && Math.random() < 0.13 }; },
  draw(c, s) {
    E.clear(c, "#a8dadc");
    E.rect(c, 0, 320, 800, 130, "#6a994e");
    E.rect(c, 395, 300, 10, 40, "#fff");
    const cx = 400 + s.pos;
    E.line(c, 60 + s.pos, 260, 740 + s.pos, 260, "#8d6e63", 8);
    c.fillStyle = "#e63946"; c.beginPath(); c.moveTo(cx, 260); c.lineTo(cx, 220); c.lineTo(cx + 30, 232); c.lineTo(cx, 244); c.fill();
    [0, 1].forEach((i) => {
      for (let k = 0; k < 3; k++) {
        const x = (i ? 560 + k * 50 : 240 - k * 50) + s.pos, lean = i ? 8 : -8;
        E.rect(c, x - 10, 250, 20, 70, i ? "#e76f51" : "#457b9d");
        E.circle(c, x + lean, 238, 14, "#f1c27d");
      }
      E.text(c, E.name(i), i ? 650 : 150, 400, 22);
    });
    if (s.go > 0) E.text(c, Math.ceil(s.go), 400, 120, 80, "#1d3557");
    else E.text(c, "PULL!", 400, 120, 50, "#1d3557");
  },
});
