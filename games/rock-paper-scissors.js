// Rock, paper, scissors. Both choose in secret. First to 3.
GAME({
  title: "Rock Paper Scissors",
  players: 2,
  controls: "◀ rock · ▲ paper · ▶ scissors (or tap). First to 3 wins.",
  aLabel: "·", bLabel: false,
  ICON: ["✊", "✋", "✌️"], NAME: ["Rock", "Paper", "Scissors"],
  init() { return { pick: [-1, -1], score: [0, 0], show: 0, res: "", hist: [] }; },
  update(s, inp, dt) {
    if (s.show > 0) {
      s.show -= dt;
      if (s.show <= 0) { s.pick = [-1, -1]; s.res = ""; if (s.score.some((v) => v >= 3)) { s.over = true; s.winner = s.score[0] >= 3 ? 0 : 1; } }
      return;
    }
    for (let i = 0; i < 2; i++) {
      if (s.pick[i] >= 0) continue;
      const k = inp[i];
      let p = k.pl ? 0 : k.pu ? 1 : k.pr ? 2 : -1;
      for (const t of k.taps) [0, 1, 2].forEach((j) => { if (E.inRect(t, 190 + j * 150, 330, 120, 90)) p = j; });
      if (p >= 0) { s.pick[i] = p; E.sfx("click"); }
    }
    if (s.pick[0] >= 0 && s.pick[1] >= 0) {
      const [a, b] = s.pick, d = (a - b + 3) % 3;
      if (d === 0) s.res = "Tie!"; else { const w = d === 1 ? 0 : 1; s.score[w]++; s.res = `${this.NAME[s.pick[w]]} wins — point to ${E.name(w)}`; }
      s.hist.push(a); E.sfx(d ? "score" : "pop");
      s.show = 1.8;
    }
  },
  ai(s, i) {
    if (s.pick[i] >= 0 || s.show > 0) return {};
    const h = s.hist; let p = E.randi(0, 2);
    if (h.length > 2 && Math.random() < 0.5) { const cnt = [0, 0, 0]; h.forEach((x) => cnt[x]++); p = (cnt.indexOf(Math.max(...cnt)) + 1) % 3; }
    return { taps: [{ x: 250 + p * 150, y: 370 }] };
  },
  draw(c, s) {
    E.clear(c, "#3d348b");
    const v = E.mode() === "online" ? E.me() : 0;
    [0, 1].forEach((i) => {
      const x = i ? 600 : 200;
      E.text(c, E.name(i) + ": " + s.score[i], x, 40, 24);
      const reveal = s.show > 0 || (E.mode() !== "local" && i === v);
      E.text(c, s.pick[i] < 0 ? "🤔" : reveal ? this.ICON[s.pick[i]] : "✔", x, 170, 90);
    });
    E.text(c, s.res, 400, 280, 20, "#f7b801");
    if (E.mode() === "local" && s.show <= 0) E.text(c, "Same device: P1 uses A/W/D, P2 uses ◀/▲/▶ — no peeking!", 400, 300, 13, "#c9c3ff");
    this.ICON.forEach((ic, j) => { E.rrect(c, 190 + j * 150, 330, 120, 90, 14, "rgba(255,255,255,.15)"); E.text(c, ic, 250 + j * 150, 368, 44); E.text(c, "◀▲▶"[j], 250 + j * 150, 408, 12, "#c9c3ff"); });
  },
});
