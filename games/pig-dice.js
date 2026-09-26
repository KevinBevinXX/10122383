// Pig: roll as long as you dare. A 1 loses everything you rolled this turn.
GAME({
  title: "Pig Dice",
  players: 2,
  controls: "A = roll · B = hold (bank your points). Roll a 1 and lose this turn's points. First to 50.",
  aLabel: "Roll", bLabel: "Hold",
  init() { return { score: [0, 0], turnPts: 0, turn: 0, die: 0, t: 0, roll: 0, msg: "" }; },
  update(s, inp, dt) {
    s.t += dt;
    if (s.roll > 0) {
      s.roll -= dt; s.die = E.randi(1, 6);
      if (s.roll <= 0) {
        if (s.die === 1) { s.msg = "Rolled a 1! Turn over."; s.turnPts = 0; E.sfx("lose"); this.next(s); }
        else { s.turnPts += s.die; s.msg = ""; E.sfx("click"); if (s.score[s.turn] + s.turnPts >= 50) { s.score[s.turn] += s.turnPts; s.over = true; s.winner = s.turn; } }
      }
      return;
    }
    const k = inp[s.turn];
    const tap = (x, y, w, h) => k.taps.some((t) => E.inRect(t, x, y, w, h));
    if (k.pa || tap(250, 330, 140, 60)) { s.roll = 0.5; E.sfx("pop"); }
    else if ((k.pb || tap(410, 330, 140, 60)) && s.turnPts) { s.score[s.turn] += s.turnPts; s.msg = `Banked ${s.turnPts}.`; s.turnPts = 0; E.sfx("coin"); this.next(s); }
  },
  next(s) { s.turn = 1 - s.turn; s.t = 0; },
  ai(s, i) {
    if (s.turn !== i || s.roll > 0 || s.t < 0.6) return {};
    const need = 50 - s.score[i];
    return s.turnPts >= Math.min(need, 20) ? { pb: true } : { pa: true };
  },
  PIPS: { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] },
  draw(c, s) {
    E.clear(c, "#1b4332");
    const cols = ["#90e0ef", "#ffb4a2"];
    [0, 1].forEach((i) => {
      const x = i ? 650 : 150;
      E.rrect(c, x - 110, 60, 220, 120, 16, s.turn === i ? "rgba(255,255,255,.15)" : "rgba(0,0,0,.2)");
      E.text(c, E.name(i), x, 90, 20, cols[i]); E.text(c, s.score[i], x, 140, 48, cols[i]);
      E.rect(c, x - 90, 190, 180, 10, "#081c15"); E.rect(c, x - 90, 190, Math.min(180, (180 * s.score[i]) / 50), 10, cols[i]);
    });
    if (s.die) {
      E.rrect(c, 350, 70, 100, 100, 16, "#fff");
      this.PIPS[s.die].forEach(([a, b]) => E.circle(c, 400 + a * 28, 120 + b * 28, 9, "#111"));
    }
    E.text(c, `This turn: ${s.turnPts}`, 400, 230, 26, "#ffd166");
    E.text(c, s.msg || E.turnText(s.turn), 400, 280, 18);
    E.rrect(c, 250, 330, 140, 60, 12, "#06d6a0"); E.text(c, "🎲 Roll", 320, 360, 22, "#073b4c");
    E.rrect(c, 410, 330, 140, 60, 12, "#ffd166"); E.text(c, "✋ Hold", 480, 360, 22, "#073b4c");
  },
});
