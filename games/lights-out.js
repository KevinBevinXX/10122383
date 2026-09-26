// Lights Out: every tap toggles a light and its neighbours. Turn them all off.
GAME({
  title: "Lights Out",
  players: 1, touch: "pointer",
  controls: "Tap a light: it and its four neighbours toggle. Turn every light off. Each level gets harder.",
  init() { const s = { level: 1, moves: 0, score: 0 }; this.lvl(s); return s; },
  lvl(s) { s.g = E.grid(5, 5, 0); for (let n = 0; n < 3 + s.level * 2; n++) this.toggle(s, E.randi(0, 4), E.randi(0, 4)); if (s.g.flat().every((v) => !v)) this.toggle(s, 2, 2); s.moves = 0; },
  toggle(s, x, y) { for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = x + dx, b = y + dy; if (a >= 0 && b >= 0 && a < 5 && b < 5) s.g[b][a] ^= 1; } },
  update(s, inp) {
    for (const t of inp[0].taps) {
      const x = Math.floor((t.x - 275) / 50), y = Math.floor((t.y - 50) / 50);
      if (x < 0 || y < 0 || x > 4 || y > 4) continue;
      this.toggle(s, x, y); s.moves++; E.sfx("click");
      if (s.g.flat().every((v) => !v)) { s.score += Math.max(10, 50 - s.moves); E.sfx("win"); s.level++; if (s.level > 10) { s.over = true; return; } this.lvl(s); }
    }
  },
  draw(c, s) {
    E.clear(c, "#111827");
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) { const on = s.g[y][x]; E.rrect(c, 277 + x * 50, 52 + y * 50, 46, 46, 8, on ? "#fde047" : "#374151"); if (on) E.rrect(c, 277 + x * 50, 52 + y * 50, 46, 46, 8, "rgba(253,224,71,.3)"); }
    E.text(c, `Level ${s.level}/10`, 400, 25, 20); E.text(c, `Moves ${s.moves}   Score ${s.score}`, 400, 330, 16, "#9ca3af");
  },
});
