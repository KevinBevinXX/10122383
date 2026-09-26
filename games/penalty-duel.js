// Take turns as shooter and keeper. Both pick a side at the same time.
GAME({
  title: "Penalty Duel",
  players: 2,
  controls: "Pick a spot with ◀ ▲ ▶ (or tap the goal), then press A to lock it in.\nShooter and keeper choose at the same time. 5 kicks each.",
  aLabel: "Lock",
  bLabel: false,
  init() { return { round: 0, shooter: 0, pick: [1, 1], locked: [false, false], goals: [0, 0], phase: "pick", t: 0, res: "" }; },
  SPOTS: [[270, 170], [400, 150], [530, 170], [270, 250], [400, 260], [530, 250]],
  update(s, inp, dt) {
    s.t += dt;
    if (s.phase === "pick") {
      for (let i = 0; i < 2; i++) {
        if (s.locked[i]) continue;
        const k = inp[i];
        let p = s.pick[i];
        if (k.pl && p % 3 > 0) p--;
        if (k.pr && p % 3 < 2) p++;
        if (k.pu && p >= 3) p -= 3;
        if (k.pd && p < 3) p += 3;
        for (const t of k.taps) this.SPOTS.forEach(([x, y], j) => { if (E.dist(t.x, t.y, x, y) < 55) { p = j; s.locked[i] = true; } });
        s.pick[i] = p;
        if (k.pa) s.locked[i] = true;
      }
      if (s.locked[0] && s.locked[1]) {
        const shot = s.pick[s.shooter], dive = s.pick[1 - s.shooter];
        const saved = shot === dive || (Math.abs(shot - dive) === 3 && Math.random() < 0.5);
        const miss = !saved && Math.random() < 0.08;
        if (!saved && !miss) { s.goals[s.shooter]++; s.res = "GOAL!"; E.sfx("score"); } else { s.res = miss ? "Wide!" : "SAVED!"; E.sfx("hit"); }
        s.phase = "show"; s.t = 0;
      }
    } else if (s.t > 1.8) {
      s.round++;
      const kicks = [Math.ceil(s.round / 2), Math.floor(s.round / 2)];
      const left = [5 - kicks[0], 5 - kicks[1]];
      const decided = s.round < 10 ? s.goals[0] > s.goals[1] + left[1] || s.goals[1] > s.goals[0] + left[0] || s.round === 10 : s.round % 2 === 0;
      if (decided && s.goals[0] !== s.goals[1]) { s.over = true; s.winner = s.goals[0] > s.goals[1] ? 0 : 1; return; }
      s.shooter = 1 - s.shooter; s.phase = "pick"; s.locked = [false, false]; s.pick = [1, 1]; s.res = "";
    }
  },
  ai(s, i) {
    if (s.phase !== "pick" || s.locked[i] || s.t < 0.8) return {};
    const [x, y] = E.pick(this.SPOTS);
    return { taps: [{ x, y }] };
  },
  draw(c, s) {
    E.clear(c, "#2e7d32");
    E.rect(c, 0, 0, 800, 110, "#355c7d");
    E.rect(c, 200, 110, 400, 200, "rgba(255,255,255,.15)");
    E.rect(c, 195, 105, 410, 8, "#fff"); E.rect(c, 195, 105, 8, 210, "#fff"); E.rect(c, 597, 105, 8, 210, "#fff");
    E.rect(c, 0, 310, 800, 3, "#fff");
    const sh = s.shooter, kp = 1 - sh;
    const view = E.me() === -1 ? null : E.me();
    this.SPOTS.forEach(([x, y], j) => {
      E.ring(c, x, y, 40, "rgba(255,255,255,.35)", 2);
      const mine = view === null ? [] : [view];
      const show = s.phase === "show" ? [0, 1] : mine;
      show.forEach((i) => { if (s.pick[i] === j) E.circle(c, x, y, 34, i === sh ? "rgba(255,235,59,.6)" : "rgba(33,150,243,.6)"); });
    });
    const [kx, ky] = s.phase === "show" ? this.SPOTS[s.pick[kp]] : [400, 240];
    E.rect(c, kx - 20, ky - 30, 40, 70, kp === 0 ? "#1e88e5" : "#e53935");
    E.circle(c, kx, ky - 42, 16, "#f1c27d");
    const [bx, by] = s.phase === "show" ? this.SPOTS[s.pick[sh]] : [400, 400];
    E.circle(c, bx, by, 14, "#fff");
    E.text(c, `${E.name(0)} ${s.goals[0]} - ${s.goals[1]} ${E.name(1)}`, 400, 35, 24);
    E.text(c, `${E.name(sh)} shoots · ${E.name(kp)} keeps`, 400, 75, 18, "#ffe082");
    if (s.phase === "pick") {
      const st = [0, 1].map((i) => (s.locked[i] ? "✔" : "…")).join("   ");
      E.text(c, "Locked in: " + st, 400, 430, 16);
      if (view === null) E.text(c, "Same device? Player 2 look away while Player 1 picks!", 400, 400, 13, "#c8e6c9");
    } else E.text(c, s.res, 400, 380, 48, "#ffeb3b");
  },
});
