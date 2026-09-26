// 15-puzzle: slide the tiles into order.
GAME({
  title: "Slide Puzzle",
  players: 1, touch: "pointer", lowScore: true,
  controls: "Tap a tile next to the gap (or use arrows to slide). Put 1–15 in order.",
  init() {
    const b = [...Array(15).keys()].map((i) => i + 1).concat(0);
    let e = 15;
    for (let n = 0; n < 400; n++) { const opts = [e - 4, e + 4, e % 4 ? e - 1 : -1, e % 4 < 3 ? e + 1 : -1].filter((i) => i >= 0 && i < 16); const j = E.pick(opts); [b[e], b[j]] = [b[j], b[e]]; e = j; }
    return { b, moves: 0, t: 0 };
  },
  X: 250, Y: 25, S: 100,
  update(s, inp, dt) {
    const k = inp[0]; s.t += dt;
    const e = s.b.indexOf(0);
    const slide = (j) => { if (j < 0 || j > 15) return; const adj = (Math.abs(j - e) === 4) || (Math.abs(j - e) === 1 && Math.floor(j / 4) === Math.floor(e / 4)); if (!adj) return; [s.b[e], s.b[j]] = [s.b[j], s.b[e]]; s.moves++; E.sfx("click"); };
    if (k.pu) slide(e + 4); else if (k.pd) slide(e - 4); else if (k.pl) slide(e % 4 < 3 ? e + 1 : -1); else if (k.pr) slide(e % 4 ? e - 1 : -1);
    for (const t of k.taps) { const c = Math.floor((t.x - this.X) / this.S), r = Math.floor((t.y - this.Y) / this.S); if (c >= 0 && c < 4 && r >= 0 && r < 4) slide(r * 4 + c); }
    if (s.b.every((v, i) => v === (i + 1) % 16)) { s.over = true; s.score = s.moves; s.overText = `Solved in ${s.moves} moves!`; E.sfx("win"); }
  },
  draw(c, s) {
    E.clear(c, "#0f766e");
    E.rrect(c, this.X - 8, this.Y - 8, 416, 416, 14, "#134e4a");
    s.b.forEach((v, i) => { if (!v) return; const x = this.X + (i % 4) * this.S, y = this.Y + Math.floor(i / 4) * this.S; E.rrect(c, x + 4, y + 4, this.S - 8, this.S - 8, 12, v === i + 1 ? "#5eead4" : "#ccfbf1"); E.text(c, v, x + 50, y + 52, 38, "#134e4a"); });
    E.text(c, `Moves ${s.moves}`, 125, 200, 22); E.text(c, `${Math.floor(s.t)}s`, 125, 240, 18, "#99f6e4");
  },
});
