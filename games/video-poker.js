// Jacks or Better video poker. Start with 100 credits.
GAME({
  title: "Video Poker",
  players: 1, touch: "pointer",
  controls: "Deal, tap cards to HOLD, then Draw. Pairs of Jacks or better pay. 5 credits per hand.",
  PAY: [["Royal Flush", 800], ["Straight Flush", 50], ["Four of a Kind", 25], ["Full House", 9], ["Flush", 6], ["Straight", 4], ["Three of a Kind", 3], ["Two Pair", 2], ["Jacks or Better", 1]],
  init() { return { cred: 100, hand: [], hold: [false, false, false, false, false], phase: "deal", deck: [], res: "", best: 100 }; },
  rank(h) {
    const r = h.map((c) => c.r).sort((a, b) => a - b), su = h.map((c) => c.s);
    const flush = su.every((x) => x === su[0]);
    const uniq = [...new Set(r)], straight = uniq.length === 5 && (r[4] - r[0] === 4 || r.join() === "2,3,4,5,14");
    const cnt = Object.values(r.reduce((m, v) => ((m[v] = (m[v] || 0) + 1), m), {})).sort((a, b) => b - a);
    if (straight && flush) return r[0] === 10 ? 0 : 1;
    if (cnt[0] === 4) return 2; if (cnt[0] === 3 && cnt[1] === 2) return 3; if (flush) return 4; if (straight) return 5; if (cnt[0] === 3) return 6; if (cnt[0] === 2 && cnt[1] === 2) return 7;
    if (cnt[0] === 2) { const p = r.find((v, i) => r.indexOf(v) !== i); if (p >= 11) return 8; }
    return -1;
  },
  update(s, inp) {
    for (const t of inp[0].taps) {
      if (s.phase === "draw") s.hand.forEach((_, i) => { if (E.inRect(t, 120 + i * 116, 200, 96, 134)) { s.hold[i] = !s.hold[i]; E.sfx("click"); } });
      if (E.inRect(t, 330, 380, 140, 50)) {
        if (s.phase === "deal") {
          if (s.cred < 5) { s.over = true; s.score = s.best; s.overText = `Out of credits. Peak: ${s.best}`; return; }
          s.cred -= 5; s.deck = E.shuffle([...Array(52).keys()].map((i) => ({ r: (i % 13) + 2, s: Math.floor(i / 13) })));
          s.hand = s.deck.splice(0, 5); s.hold = [false, false, false, false, false]; s.phase = "draw"; s.res = ""; E.sfx("click");
        } else {
          s.hand = s.hand.map((c, i) => (s.hold[i] ? c : s.deck.pop()));
          const r = this.rank(s.hand);
          if (r >= 0) { const [name, pay] = this.PAY[r]; s.cred += pay * 5; s.res = `${name}! +${pay * 5}`; E.sfx("win"); } else { s.res = "No win"; E.sfx("lose"); }
          s.best = Math.max(s.best, s.cred); s.phase = "deal";
        }
      }
    }
    if (inp[0].pb && s.phase === "deal") { s.over = true; s.score = s.cred; s.overText = `Cashed out with ${s.cred} credits`; }
  },
  draw(c, s) {
    E.clear(c, "#1e1b4b");
    this.PAY.forEach(([n, p], i) => { E.text(c, n, 20, 20 + i * 18, 13, "#fde68a", "left"); E.text(c, p * 5, 200, 20 + i * 18, 13, "#fde68a", "right"); });
    s.hand.forEach((cd, i) => {
      const x = 120 + i * 116, y = 200, red = cd.s === 1 || cd.s === 2;
      E.rrect(c, x, y, 96, 134, 10, "#fff");
      E.text(c, ["", "", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"][cd.r], x + 12, y + 18, 22, red ? "#dc2626" : "#111", "left");
      E.text(c, "♠♥♦♣"[cd.s], x + 48, y + 78, 44, red ? "#dc2626" : "#111");
      if (s.hold[i]) E.text(c, "HELD", x + 48, y - 14, 16, "#fde047");
    });
    E.rrect(c, 330, 380, 140, 50, 10, "#f59e0b"); E.text(c, s.phase === "deal" ? "Deal (5)" : "Draw", 400, 405, 20, "#1c1917");
    E.text(c, `Credits ${s.cred}`, 780, 30, 22, "#fff", "right");
    E.text(c, s.res, 560, 120, 24, "#a5f3fc");
    if (s.phase === "deal") E.text(c, "B = cash out", 780, 440, 11, "#a5b4fc", "right", "bottom");
  },
});
