// Flip two cards; match them to keep them and go again. Most pairs wins.
GAME({
  title: "Memory Match",
  players: 2, touch: "pointer",
  controls: "Tap two cards. A match scores a pair and you go again.",
  EMO: ["🍎", "🍌", "🍇", "🍉", "🍒", "🍋", "🥝", "🍍", "🥥", "🍑", "🍓", "🫐"],
  init() {
    const cards = E.shuffle([...Array(12).keys(), ...Array(12).keys()]);
    return { cards, open: [], gone: Array(24).fill(-1), turn: 0, t: 0, score: [0, 0], wait: 0, seen: {} };
  },
  pos(i) { return [115 + (i % 8) * 78, 70 + Math.floor(i / 8) * 110]; },
  update(s, inp, dt) {
    s.t += dt;
    if (s.wait > 0) {
      s.wait -= dt;
      if (s.wait <= 0) {
        const [a, b] = s.open;
        if (s.cards[a] === s.cards[b]) { s.gone[a] = s.gone[b] = s.turn; s.score[s.turn]++; }
        else s.turn = 1 - s.turn;
        s.open = []; s.t = 0;
        if (s.gone.every((g) => g >= 0)) { s.over = true; s.winner = s.score[0] === s.score[1] ? -1 : s.score[0] > s.score[1] ? 0 : 1; }
      }
      return;
    }
    for (const t of inp[s.turn].taps) {
      for (let i = 0; i < 24; i++) {
        const [x, y] = this.pos(i);
        if (E.inRect(t, x, y, 70, 100) && s.gone[i] < 0 && !s.open.includes(i)) {
          s.open.push(i); s.seen[i] = s.cards[i]; E.sfx("click");
          if (s.open.length === 2) { s.wait = s.cards[s.open[0]] === s.cards[s.open[1]] ? 0.6 : 1.1; if (s.wait < 1) E.sfx("coin"); }
          return;
        }
      }
    }
  },
  ai(s, i) {
    if (s.turn !== i || s.wait > 0 || s.t < 0.6) return {};
    const avail = [...Array(24).keys()].filter((k) => s.gone[k] < 0 && !s.open.includes(k));
    const known = avail.filter((k) => k in s.seen && Math.random() < 0.8);
    let pick;
    if (s.open.length === 1) pick = known.find((k) => s.seen[k] === s.cards[s.open[0]]);
    else for (const a of known) { const b = known.find((k) => k !== a && s.seen[k] === s.seen[a]); if (b !== undefined) { pick = a; break; } }
    if (pick === undefined) pick = E.pick(avail.filter((k) => !(k in s.seen)).concat(avail.length ? [] : avail)) ?? E.pick(avail);
    if (pick === undefined) return {};
    const [x, y] = this.pos(pick);
    return { taps: [{ x: x + 35, y: y + 50 }] };
  },
  draw(c, s) {
    E.clear(c, "#264653");
    for (let i = 0; i < 24; i++) {
      const [x, y] = this.pos(i);
      if (s.gone[i] >= 0) { E.rrect(c, x, y, 70, 100, 10, s.gone[i] ? "rgba(231,111,81,.25)" : "rgba(42,157,143,.25)"); continue; }
      const up = s.open.includes(i);
      E.rrect(c, x, y, 70, 100, 10, up ? "#fefae0" : "#e9c46a");
      E.text(c, up ? this.EMO[s.cards[i]] : "?", x + 35, y + 52, up ? 38 : 30, "#264653");
    }
    E.text(c, `${E.name(0)}: ${s.score[0]}`, 200, 30, 20, "#2a9d8f");
    E.text(c, `${E.name(1)}: ${s.score[1]}`, 600, 30, 20, "#e76f51");
    E.text(c, E.turnText(s.turn), 400, 30, 16);
  },
});
