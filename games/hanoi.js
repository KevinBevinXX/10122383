// Tower of Hanoi: move the stack to the right peg. Bigger discs never go on smaller ones.
GAME({
  title: "Tower of Hanoi",
  players: 1, touch: "pointer", lowScore: true,
  controls: "Tap a peg to pick up its top disc, tap another peg to drop it (or ◀ ▶ + A). Move the whole stack to the right peg.",
  aLabel: "Pick", bLabel: false,
  init() { const s = { n: 3, moves: 0, total: 0 }; this.lvl(s); return s; },
  lvl(s) { s.pegs = [Array.from({ length: s.n }, (_, i) => s.n - i), [], []]; s.hold = null; s.cur = 0; s.moves = 0; },
  act(s, p) {
    if (s.hold === null) { if (s.pegs[p].length) { s.hold = s.pegs[p].pop(); s.from = p; E.sfx("click"); } return; }
    const top = s.pegs[p][s.pegs[p].length - 1];
    if (top && top < s.hold) { E.sfx("hit"); return; }
    s.pegs[p].push(s.hold); s.hold = null; if (p !== s.from) s.moves++; E.sfx("pop");
    if (s.pegs[2].length === s.n) {
      s.total += s.moves; E.sfx("win");
      if (s.n >= 6) { s.over = true; s.score = s.total; s.overText = `Solved 3–6 discs in ${s.total} moves (best possible: 120)`; return; }
      s.n++; this.lvl(s);
    }
  },
  update(s, inp) {
    const k = inp[0];
    if (k.pl) s.cur = Math.max(0, s.cur - 1); if (k.pr) s.cur = Math.min(2, s.cur + 1);
    if (k.pa) this.act(s, s.cur);
    for (const t of k.taps) { const p = Math.floor(t.x / 267); if (p >= 0 && p < 3) { s.cur = p; this.act(s, p); } }
  },
  draw(c, s) {
    E.clear(c, "#1e293b"); E.rect(c, 40, 390, 720, 16, "#92400e");
    const cols = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7"];
    s.pegs.forEach((pg, p) => {
      const x = 133 + p * 267;
      E.rect(c, x - 6, 170, 12, 220, "#b45309");
      if (p === s.cur) E.text(c, "▲", x, 425, 16, "#94a3b8");
      pg.forEach((d, i) => E.rrect(c, x - 18 - d * 16, 366 - i * 26, 36 + d * 32, 22, 8, cols[d]));
    });
    if (s.hold !== null) E.rrect(c, 133 + s.cur * 267 - 18 - s.hold * 16, 110, 36 + s.hold * 32, 22, 8, cols[s.hold]);
    E.text(c, `${s.n} discs · moves ${s.moves} (fewest possible ${2 ** s.n - 1})`, 400, 30, 18);
  },
});
