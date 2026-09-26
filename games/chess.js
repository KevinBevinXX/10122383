// Chess with full rules: castling, en passant, promotion (to queen), check, mate, stalemate.
GAME({
  title: "Chess",
  players: 2, touch: "pointer",
  controls: "Tap a piece, then tap where to move it. White moves first.",
  X: 192, Y: 17, S: 52,
  init() {
    const back = "RNBQKBNR";
    const b = Array(64).fill(null);
    for (let i = 0; i < 8; i++) { b[i] = "1" + back[i]; b[8 + i] = "1P"; b[48 + i] = "0P"; b[56 + i] = "0" + back[i]; }
    return { b, turn: 0, sel: -1, castle: { 0: [true, true], 1: [true, true] }, ep: -1, t: 0, done: 0, last: null, msg: "" };
  },
  pseudo(st, sq) {
    const b = st.b, p = b[sq]; if (!p) return [];
    const me = +p[0], t = p[1], r = sq >> 3, c = sq & 7, out = [];
    const add = (rr, cc) => { if (rr < 0 || rr > 7 || cc < 0 || cc > 7) return false; const q = b[rr * 8 + cc]; if (q && +q[0] === me) return false; out.push(rr * 8 + cc); return !q; };
    const ray = (dirs) => dirs.forEach(([dr, dc]) => { let rr = r + dr, cc = c + dc; while (add(rr, cc)) { rr += dr; cc += dc; } });
    if (t === "P") {
      const d = me === 0 ? -1 : 1, start = me === 0 ? 6 : 1;
      if (!b[(r + d) * 8 + c]) { out.push((r + d) * 8 + c); if (r === start && !b[(r + 2 * d) * 8 + c]) out.push((r + 2 * d) * 8 + c); }
      for (const dc of [-1, 1]) { const cc = c + dc, to = (r + d) * 8 + cc; if (cc < 0 || cc > 7) continue; if ((b[to] && +b[to][0] !== me) || to === st.ep) out.push(to); }
    } else if (t === "N") [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]].forEach(([a, bb]) => add(r + a, c + bb));
    else if (t === "B") ray([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
    else if (t === "R") ray([[1, 0], [-1, 0], [0, 1], [0, -1]]);
    else if (t === "Q") ray([[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]]);
    else if (t === "K") {
      [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, bb]) => add(r + a, c + bb));
      const row = me === 0 ? 56 : 0;
      if (sq === row + 4 && !this.attacked(st, sq, 1 - me)) {
        if (st.castle[me][0] && b[row + 7] === me + "R" && !b[row + 5] && !b[row + 6] && !this.attacked(st, row + 5, 1 - me)) out.push(row + 6);
        if (st.castle[me][1] && b[row] === me + "R" && !b[row + 1] && !b[row + 2] && !b[row + 3] && !this.attacked(st, row + 3, 1 - me)) out.push(row + 2);
      }
    }
    return out;
  },
  attacked(st, sq, by) {
    const b = st.b, r = sq >> 3, c = sq & 7;
    const at = (rr, cc) => (rr < 0 || rr > 7 || cc < 0 || cc > 7 ? undefined : b[rr * 8 + cc]);
    const d = by === 0 ? 1 : -1;
    for (const dc of [-1, 1]) if (at(r + d, c + dc) === by + "P") return true;
    for (const [a, bb] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) if (at(r + a, c + bb) === by + "N") return true;
    for (const [a, bb] of [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]]) if (at(r + a, c + bb) === by + "K") return true;
    const rays = (dirs, types) => dirs.some(([dr, dc]) => { let rr = r + dr, cc = c + dc; for (;;) { const q = at(rr, cc); if (q === undefined) return false; if (q) return +q[0] === by && types.includes(q[1]); rr += dr; cc += dc; } });
    return rays([[1, 1], [1, -1], [-1, 1], [-1, -1]], "BQ") || rays([[1, 0], [-1, 0], [0, 1], [0, -1]], "RQ");
  },
  apply(st, from, to) {
    const b = st.b, p = b[from], me = +p[0];
    if (p[1] === "P" && to === st.ep) b[to + (me === 0 ? 8 : -8)] = null;
    if (p[1] === "K" && Math.abs(to - from) === 2) { const row = from - 4; if (to > from) { b[row + 5] = b[row + 7]; b[row + 7] = null; } else { b[row + 3] = b[row]; b[row] = null; } }
    b[to] = p; b[from] = null;
    if (p[1] === "P" && (to < 8 || to >= 56)) b[to] = me + "Q";
    st.ep = p[1] === "P" && Math.abs(to - from) === 16 ? (from + to) / 2 : -1;
    if (p[1] === "K") st.castle[me] = [false, false];
    for (const [sq, who, side] of [[63, 0, 0], [56, 0, 1], [7, 1, 0], [0, 1, 1]]) if (from === sq || to === sq) st.castle[who][side] = false;
  },
  legal(st, sq) {
    const me = +st.b[sq][0];
    return this.pseudo(st, sq).filter((to) => {
      const sim = { b: st.b.slice(), castle: { 0: st.castle[0].slice(), 1: st.castle[1].slice() }, ep: st.ep };
      this.apply(sim, sq, to);
      return !this.attacked(sim, sim.b.indexOf(me + "K"), 1 - me);
    });
  },
  allMoves(st, me) { const m = []; st.b.forEach((p, sq) => { if (p && +p[0] === me) this.legal(st, sq).forEach((to) => m.push([sq, to])); }); return m; },
  move(s, from, to) {
    const cap = !!s.b[to];
    this.apply(s, from, to); s.last = [from, to]; s.sel = -1;
    s.turn = 1 - s.turn; s.t = 0; E.sfx(cap ? "hit" : "click");
    const inCheck = this.attacked(s, s.b.indexOf(s.turn + "K"), 1 - s.turn);
    if (!this.allMoves(s, s.turn).length) { s.winner = inCheck ? 1 - s.turn : -1; s.msg = inCheck ? "Checkmate!" : "Stalemate"; s.done = 1.5; }
    else s.msg = inCheck ? "Check!" : "";
    if (s.b.filter(Boolean).length === 2) { s.winner = -1; s.msg = "Draw"; s.done = 1.5; }
  },
  update(s, inp, dt) {
    s.t += dt;
    if (s.done) { if ((s.done -= dt) <= 0) { s.over = true; s.overText = s.msg === "Checkmate!" ? null : s.msg; } return; }
    if (s.t > 600) { s.winner = -1; s.done = 1; return; }
    for (const t of inp[s.turn].taps) {
      // player 1's taps arrive in their flipped (black-at-bottom) view when playing online
      const flip = E.mode() === "online" && s.turn === 1;
      let c = Math.floor((t.x - this.X) / this.S), r = Math.floor((t.y - this.Y) / this.S);
      if (c < 0 || c > 7 || r < 0 || r > 7) continue;
      if (flip) { c = 7 - c; r = 7 - r; }
      const sq = r * 8 + c;
      if (s.sel >= 0 && this.legal(s, s.sel).includes(sq)) { this.move(s, s.sel, sq); break; }
      s.sel = s.b[sq] && +s.b[sq][0] === s.turn ? sq : -1;
    }
  },
  VAL: { P: 100, N: 300, B: 310, R: 500, Q: 900, K: 0 },
  evalB(st, me) { let v = 0; st.b.forEach((p, sq) => { if (!p) return; const c = sq & 7, r = sq >> 3; const center = (3.5 - Math.abs(3.5 - c)) + (3.5 - Math.abs(3.5 - r)); v += (+p[0] === me ? 1 : -1) * (this.VAL[p[1]] + (p[1] !== "K" ? center * 3 : 0)); }); return v; },
  ai(s, i) {
    if (s.turn !== i || s.t < 0.4 || s.done) return {};
    const moves = this.allMoves(s, i);
    let best = moves[0], bv = -Infinity;
    for (const [f, t] of moves) {
      const sim = { b: s.b.slice(), castle: { 0: s.castle[0].slice(), 1: s.castle[1].slice() }, ep: s.ep };
      this.apply(sim, f, t);
      const replies = this.allMoves(sim, 1 - i);
      let worst = Infinity;
      if (!replies.length) worst = this.attacked(sim, sim.b.indexOf((1 - i) + "K"), i) ? 1e6 : 0;
      for (const [f2, t2] of replies) {
        const sim2 = { b: sim.b.slice(), castle: { 0: sim.castle[0].slice(), 1: sim.castle[1].slice() }, ep: sim.ep };
        this.apply(sim2, f2, t2);
        worst = Math.min(worst, this.evalB(sim2, i));
      }
      const v = worst + Math.random() * 8;
      if (v > bv) { bv = v; best = [f, t]; }
    }
    return { taps: [this.center(best[0]), this.center(best[1])] };
  },
  flipped() { return E.mode() === "online" && E.me() === 1; },
  center(sq) { let r = sq >> 3, c = sq & 7; if (this.flipped()) { r = 7 - r; c = 7 - c; } return { x: this.X + c * this.S + 26, y: this.Y + r * this.S + 26 }; },
  GLYPH: { K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟" },
  draw(c, s) {
    E.clear(c, "#262421");
    const legal = s.sel >= 0 ? this.legal(s, s.sel) : [];
    for (let sq = 0; sq < 64; sq++) {
      const { x, y } = this.center(sq), r = sq >> 3, col = sq & 7;
      E.rect(c, x - 26, y - 26, 52, 52, (r + col) % 2 ? "#b58863" : "#f0d9b5");
      if (s.last && s.last.includes(sq)) E.rect(c, x - 26, y - 26, 52, 52, "rgba(205,210,106,.55)");
      if (sq === s.sel) E.rect(c, x - 26, y - 26, 52, 52, "rgba(20,85,30,.5)");
      const p = s.b[sq];
      if (p) {
        c.font = "44px 'DejaVu Sans', 'Segoe UI Symbol', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
        c.lineWidth = 2; c.strokeStyle = p[0] === "0" ? "#000" : "#fff";
        c.fillStyle = p[0] === "0" ? "#fff" : "#111";
        c.strokeText(this.GLYPH[p[1]], x, y + 3); c.fillText(this.GLYPH[p[1]], x, y + 3);
      }
      if (legal.includes(sq)) E.circle(c, x, y, s.b[sq] ? 22 : 8, "rgba(20,85,30,.45)");
    }
    E.text(c, "⬜ " + E.name(0), 95, 380, 16); E.text(c, "⬛ " + E.name(1), 95, 60, 16);
    E.text(c, s.done ? s.msg : E.turnText(s.turn), 705, 210, 16);
    if (s.msg && !s.done) E.text(c, s.msg, 705, 240, 22, "#ff7043");
  },
});
