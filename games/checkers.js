// Checkers: captures are mandatory, multi-jumps continue, reach the far row to king.
GAME({
  title: "Checkers",
  players: 2, touch: "pointer",
  controls: "Tap a piece, then a square. You must capture when you can.",
  X: 192, Y: 17, S: 52,
  init() {
    const b = Array(64).fill(null);
    for (let sq = 0; sq < 64; sq++) { const r = sq >> 3, c = sq & 7; if ((r + c) % 2) { if (r < 3) b[sq] = "1"; if (r > 4) b[sq] = "0"; } }
    return { b, turn: 0, sel: -1, chain: -1, t: 0, done: 0 };
  },
  steps(b, sq) {
    const p = b[sq], me = +p[0], king = p.length > 1, r = sq >> 3, c = sq & 7, moves = [], jumps = [];
    const dirs = king ? [-1, 1] : [me === 0 ? -1 : 1];
    for (const dr of dirs) for (const dc of [-1, 1]) {
      const r1 = r + dr, c1 = c + dc, r2 = r + 2 * dr, c2 = c + 2 * dc;
      if (r1 < 0 || r1 > 7 || c1 < 0 || c1 > 7) continue;
      const q = b[r1 * 8 + c1];
      if (!q) moves.push([r1 * 8 + c1, -1]);
      else if (+q[0] !== me && r2 >= 0 && r2 <= 7 && c2 >= 0 && c2 <= 7 && !b[r2 * 8 + c2]) jumps.push([r2 * 8 + c2, r1 * 8 + c1]);
    }
    return { moves, jumps };
  },
  options(s, me) {
    const all = [];
    s.b.forEach((p, sq) => { if (p && +p[0] === me && (s.chain < 0 || s.chain === sq)) { const st = this.steps(s.b, sq); st.jumps.forEach((j) => all.push([sq, ...j])); } });
    if (all.length || s.chain >= 0) return all;
    s.b.forEach((p, sq) => { if (p && +p[0] === me) this.steps(s.b, sq).moves.forEach((m) => all.push([sq, ...m])); });
    return all;
  },
  update(s, inp, dt) {
    s.t += dt;
    if (s.done) { if ((s.done -= dt) <= 0) s.over = true; return; }
    const opts = this.options(s, s.turn);
    if (!opts.length) { s.winner = 1 - s.turn; s.done = 1; return; }
    for (const t of inp[s.turn].taps) {
      const sq = this.sqAt(t, E.mode() === "online" && s.turn === 1); if (sq < 0) continue;
      const mv = opts.find((o) => o[0] === s.sel && o[1] === sq);
      if (mv) {
        const [from, to, cap] = mv;
        s.b[to] = s.b[from]; s.b[from] = null;
        const r = to >> 3, crowned = s.b[to].length === 1 && (r === 0 || r === 7);
        if (crowned) s.b[to] += "K";
        if (cap >= 0) { s.b[cap] = null; E.sfx("hit"); } else E.sfx("click");
        if (cap >= 0 && !crowned && this.steps(s.b, to).jumps.length) { s.chain = to; s.sel = to; }
        else { s.chain = -1; s.sel = -1; s.turn = 1 - s.turn; s.t = 0; }
        break;
      }
      if (s.chain < 0 && s.b[sq] && +s.b[sq][0] === s.turn) s.sel = sq;
    }
  },
  // flip = the tap came from player 1's flipped online view
  sqAt(t, flip) {
    let c = Math.floor((t.x - this.X) / this.S), r = Math.floor((t.y - this.Y) / this.S);
    if (c < 0 || c > 7 || r < 0 || r > 7) return -1;
    if (flip) { c = 7 - c; r = 7 - r; }
    return r * 8 + c;
  },
  flipped() { return E.mode() === "online" && E.me() === 1; },
  center(sq) { let r = sq >> 3, c = sq & 7; if (this.flipped()) { r = 7 - r; c = 7 - c; } return { x: this.X + c * this.S + 26, y: this.Y + r * this.S + 26 }; },
  ai(s, i) {
    if (s.turn !== i || s.t < 0.5 || s.done) return {};
    const opts = this.options(s, i); if (!opts.length) return {};
    const rate = ([f, t, cap]) => (cap >= 0 ? 10 : 0) + ((t >> 3) === (i === 0 ? 0 : 7) ? 5 : 0) + Math.random() * 2;
    opts.sort((a, b) => rate(b) - rate(a));
    const [f, t] = opts[0];
    return { taps: s.sel === f ? [this.center(t)] : [this.center(f), this.center(t)] };
  },
  draw(c, s) {
    E.clear(c, "#1f2a1f");
    const opts = s.done ? [] : this.options(s, s.turn);
    for (let sq = 0; sq < 64; sq++) {
      const { x, y } = this.center(sq), r = sq >> 3, col = sq & 7;
      E.rect(c, x - 26, y - 26, 52, 52, (r + col) % 2 ? "#6b3e26" : "#f3dfc1");
      if (sq === s.sel) E.rect(c, x - 26, y - 26, 52, 52, "rgba(255,235,59,.4)");
      if (opts.some((o) => o[0] === s.sel && o[1] === sq)) E.circle(c, x, y, 8, "rgba(255,235,59,.7)");
      const p = s.b[sq];
      if (p) {
        E.circle(c, x, y + 3, 20, "rgba(0,0,0,.4)");
        E.circle(c, x, y, 20, p[0] === "0" ? "#d32f2f" : "#212121"); E.ring(c, x, y, 14, "rgba(255,255,255,.25)", 2);
        if (p.length > 1) E.text(c, "♛", x, y + 1, 18, "#ffd54f");
      }
    }
    E.text(c, "🔴 " + E.name(0), 95, 380, 16); E.text(c, "⚫ " + E.name(1), 95, 60, 16);
    E.text(c, s.done ? "" : E.turnText(s.turn), 705, 210, 16);
    const left = [0, 1].map((p) => s.b.filter((q) => q && +q[0] === p).length);
    E.text(c, `${left[0]} vs ${left[1]}`, 705, 240, 20);
  },
});
