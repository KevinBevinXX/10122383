// Peg solitaire: jump pegs over each other to remove them. Finish with one peg.
GAME({
  title: "Peg Solitaire",
  players: 1, touch: "pointer", lowScore: true,
  controls: "Tap a peg, then tap an empty hole two spaces away (with a peg between) to jump. Leave as few pegs as possible — one is perfect.",
  init() {
    const b = E.grid(7, 7, -1);
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) if ((x >= 2 && x <= 4) || (y >= 2 && y <= 4)) b[y][x] = 1;
    b[3][3] = 0;
    return { b, sel: null };
  },
  moves(s) { const m = []; for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) if (s.b[y][x] === 1) for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) { const tx = x + dx, ty = y + dy; if (tx >= 0 && ty >= 0 && tx < 7 && ty < 7 && s.b[ty][tx] === 0 && s.b[y + dy / 2][x + dx / 2] === 1) m.push([x, y, tx, ty]); } return m; },
  update(s, inp) {
    for (const t of inp[0].taps) {
      const x = Math.floor((t.x - 225) / 50), y = Math.floor((t.y - 50) / 50);
      if (x < 0 || y < 0 || x > 6 || y > 6 || s.b[y][x] < 0) continue;
      if (s.b[y][x] === 1) { s.sel = [x, y]; E.sfx("click"); continue; }
      if (s.sel) {
        const [sx, sy] = s.sel, dx = x - sx, dy = y - sy;
        if (((Math.abs(dx) === 2 && !dy) || (Math.abs(dy) === 2 && !dx)) && s.b[sy + dy / 2][sx + dx / 2] === 1) {
          s.b[sy][sx] = 0; s.b[sy + dy / 2][sx + dx / 2] = 0; s.b[y][x] = 1; s.sel = null; E.sfx("pop");
          if (!this.moves(s).length) { const left = s.b.flat().filter((v) => v === 1).length; s.over = true; s.score = left; s.overText = left === 1 ? "Perfect — one peg left! 🎉" : `${left} pegs left`; }
        } else E.sfx("hit");
      }
    }
  },
  draw(c, s) {
    E.clear(c, "#3f2d20");
    c.fillStyle = "#8b5e3c"; c.beginPath(); c.arc(400, 225, 200, 0, 7); c.fill();
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
      const v = s.b[y][x]; if (v < 0) continue;
      const px = 250 + x * 50, py = 75 + y * 50;
      E.circle(c, px, py, 12, "#3f2d20");
      if (v === 1) { const sel = s.sel && s.sel[0] === x && s.sel[1] === y; E.circle(c, px, py - 2, 17, sel ? "#fde047" : "#dc2626"); E.circle(c, px - 5, py - 7, 5, "rgba(255,255,255,.4)"); }
    }
    E.text(c, `Pegs: ${s.b.flat().filter((v) => v === 1).length}`, 700, 225, 22);
  },
});
