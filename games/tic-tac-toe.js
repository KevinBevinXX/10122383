// Tic-tac-toe with an unbeatable CPU.
GAME({
  title: "Tic-Tac-Toe",
  players: 2, touch: "pointer",
  controls: "Tap a square. Three in a row wins.",
  init() { return { b: Array(9).fill(-1), turn: 0, t: 0, line: null }; },
  LINES: [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]],
  win(b) { for (const l of this.LINES) if (b[l[0]] >= 0 && b[l[0]] === b[l[1]] && b[l[1]] === b[l[2]]) return l; return null; },
  update(s, inp, dt) {
    s.t += dt;
    if (s.done) { if ((s.done -= dt) <= 0) { s.over = true; } return; }
    for (const t of inp[s.turn].taps) {
      const cx = Math.floor((t.x - 250) / 100), cy = Math.floor((t.y - 75) / 100), i = cy * 3 + cx;
      if (cx < 0 || cx > 2 || cy < 0 || cy > 2 || s.b[i] >= 0) continue;
      s.b[i] = s.turn; E.sfx("click");
      const l = this.win(s.b);
      if (l) { s.line = l; s.winner = s.turn; s.done = 1; }
      else if (!s.b.includes(-1)) { s.winner = -1; s.done = 1; }
      s.turn = 1 - s.turn; s.t = 0;
      break;
    }
  },
  mm(b, p, me) {
    const l = this.win(b);
    if (l) return b[l[0]] === me ? 10 : -10;
    if (!b.includes(-1)) return 0;
    let best = p === me ? -99 : 99;
    for (let i = 0; i < 9; i++) if (b[i] < 0) {
      b[i] = p; const v = this.mm(b, 1 - p, me) * 0.9; b[i] = -1;
      best = p === me ? Math.max(best, v) : Math.min(best, v);
    }
    return best;
  },
  ai(s, i) {
    if (s.turn !== i || s.t < 0.5 || s.done) return {};
    let best = -1, bv = -99;
    const b = s.b.slice();
    for (let j = 0; j < 9; j++) if (b[j] < 0) { b[j] = i; const v = this.mm(b, 1 - i, i) + Math.random() * 0.01; b[j] = -1; if (v > bv) { bv = v; best = j; } }
    return { taps: [{ x: 300 + (best % 3) * 100, y: 125 + Math.floor(best / 3) * 100 }] };
  },
  draw(c, s) {
    E.clear(c, "#14213d");
    for (let k = 1; k < 3; k++) { E.line(c, 250 + k * 100, 85, 250 + k * 100, 365, "#e5e5e5", 6); E.line(c, 260, 75 + k * 100, 540, 75 + k * 100, "#e5e5e5", 6); }
    s.b.forEach((v, i) => {
      const x = 300 + (i % 3) * 100, y = 125 + Math.floor(i / 3) * 100;
      if (v === 0) { E.line(c, x - 28, y - 28, x + 28, y + 28, "#4cc9f0", 10); E.line(c, x + 28, y - 28, x - 28, y + 28, "#4cc9f0", 10); }
      if (v === 1) E.ring(c, x, y, 30, "#fca311", 10);
    });
    if (s.line) { const a = s.line[0], b = s.line[2]; E.line(c, 300 + (a % 3) * 100, 125 + Math.floor(a / 3) * 100, 300 + (b % 3) * 100, 125 + Math.floor(b / 3) * 100, "#fff", 8); }
    E.text(c, s.done ? "" : E.turnText(s.turn), 400, 35, 22, s.turn ? "#fca311" : "#4cc9f0");
    E.text(c, `✕ ${E.name(0)}     ◯ ${E.name(1)}`, 400, 415, 16, "#8d99ae");
  },
});
