// Mancala (Kalah): sow stones, land in your store for another turn.
GAME({
  title: "Mancala",
  players: 2, touch: "pointer",
  controls: "Tap one of your pits to sow its stones counter-clockwise.\nLast stone in your store = go again. Land in your empty pit = capture.",
  init() { const p = Array(14).fill(4); p[6] = p[13] = 0; return { p, turn: 0, t: 0, done: 0, msg: "" }; },
  // pits 0-5 = player 0 (bottom, left→right), 6 = store 0 (right); 7-12 = player 1 (top, right→left), 13 = store 1 (left)
  xy(i) { if (i < 6) return [190 + i * 84, 300]; if (i === 6) return [720, 225]; if (i < 13) return [190 + (12 - i) * 84, 150]; return [80, 225]; },
  sow(s, pit) {
    let n = s.p[pit], i = pit; s.p[pit] = 0;
    const me = s.turn, skip = me === 0 ? 13 : 6, store = me === 0 ? 6 : 13;
    while (n) { i = (i + 1) % 14; if (i === skip) continue; s.p[i]++; n--; }
    const mine = me === 0 ? i < 6 : i > 6 && i < 13;
    if (mine && s.p[i] === 1 && s.p[12 - i] > 0) { s.p[store] += s.p[12 - i] + 1; s.p[i] = s.p[12 - i] = 0; s.msg = "Capture!"; E.sfx("coin"); }
    else s.msg = "";
    if (i === store) s.msg = "Go again!"; else s.turn = 1 - s.turn;
    s.t = 0;
    const side = (a) => s.p.slice(a, a + 6).reduce((x, y) => x + y, 0);
    if (!side(0) || !side(7)) {
      s.p[6] += side(0); s.p[13] += side(7); for (let k = 0; k < 13; k++) if (k !== 6) s.p[k] = 0;
      s.winner = s.p[6] === s.p[13] ? -1 : s.p[6] > s.p[13] ? 0 : 1; s.done = 1.5;
    }
  },
  update(s, inp, dt) {
    s.t += dt;
    if (s.done) { if ((s.done -= dt) <= 0) s.over = true; return; }
    for (const t of inp[s.turn].taps) {
      for (let k = 0; k < 6; k++) {
        const pit = s.turn === 0 ? k : 7 + k, [x, y] = this.xy(pit);
        if (E.dist(t.x, t.y, x, y) < 38 && s.p[pit]) { E.sfx("click"); this.sow(s, pit); return; }
      }
    }
  },
  ai(s, i) {
    if (s.turn !== i || s.t < 0.7 || s.done) return {};
    let best = -1, bv = -Infinity;
    for (let k = 0; k < 6; k++) {
      const pit = i === 0 ? k : 7 + k; if (!s.p[pit]) continue;
      const sim = JSON.parse(JSON.stringify(s)); const before = sim.p[i === 0 ? 6 : 13];
      const saved = E.sfx; E.sfx = () => {}; this.sow(sim, pit); E.sfx = saved;
      const v = sim.p[i === 0 ? 6 : 13] - before + (sim.turn === i ? 3 : 0) + Math.random();
      if (v > bv) { bv = v; best = pit; }
    }
    const [x, y] = this.xy(best);
    return { taps: [{ x, y }] };
  },
  draw(c, s) {
    E.clear(c, "#2d1b12");
    E.rrect(c, 30, 90, 740, 270, 60, "#8d5a32");
    for (let i = 0; i < 14; i++) {
      const [x, y] = this.xy(i), store = i === 6 || i === 13;
      if (store) E.rrect(c, x - 36, y - 100, 72, 200, 34, "#5d3a1f"); else E.circle(c, x, y, 36, "#5d3a1f");
      for (let k = 0; k < Math.min(s.p[i], 20); k++) E.circle(c, x + Math.cos(k * 2.4) * (4 + k * 1.3), y + Math.sin(k * 2.4) * (4 + k * (store ? 3 : 1.3)), 6, ["#4fc3f7", "#aed581", "#ffb74d", "#f06292"][k % 4]);
      E.text(c, s.p[i], x, store ? y + 120 : i < 6 ? y + 54 : y - 54, 16);
    }
    E.text(c, E.name(0) + " ↓ (store right)", 400, 400, 16, "#ffcc80");
    E.text(c, E.name(1) + " ↑ (store left)", 400, 50, 16, "#ffcc80");
    E.text(c, s.done ? "" : E.turnText(s.turn) + (s.msg ? " · " + s.msg : ""), 400, 20, 16);
  },
});
