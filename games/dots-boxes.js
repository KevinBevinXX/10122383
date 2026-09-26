// Take turns drawing lines. Complete a box to claim it and go again.
GAME({
  title: "Dots & Boxes",
  players: 2, touch: "pointer",
  controls: "Tap between two dots to draw a line. Close a box to score it and move again.",
  N: 6, X: 250, Y: 50, S: 70,
  init() { return { h: E.grid(5, 6, -1), v: E.grid(6, 5, -1), box: E.grid(5, 5, -1), turn: 0, t: 0, score: [0, 0], done: 0 }; },
  sides(s, r, c) { return [s.h[r][c], s.h[r + 1][c], s.v[r][c], s.v[r][c + 1]].filter((x) => x >= 0).length; },
  nearest(x, y) {
    const gx = (x - this.X) / this.S, gy = (y - this.Y) / this.S;
    const r = Math.round(gy), c = Math.floor(gx), r2 = Math.floor(gy), c2 = Math.round(gx);
    const dh = Math.abs(gy - r), dv = Math.abs(gx - c2);
    if (dh < dv) { if (r >= 0 && r <= 5 && c >= 0 && c < 5 && dh < 0.3) return ["h", r, c]; }
    else if (r2 >= 0 && r2 < 5 && c2 >= 0 && c2 <= 5 && dv < 0.3) return ["v", r2, c2];
    return null;
  },
  play(s, [t, r, c]) {
    const arr = t === "h" ? s.h : s.v;
    if (arr[r][c] >= 0) return false;
    arr[r][c] = s.turn; E.sfx("click");
    let got = 0;
    for (let br = 0; br < 5; br++) for (let bc = 0; bc < 5; bc++) if (s.box[br][bc] < 0 && this.sides(s, br, bc) === 4) { s.box[br][bc] = s.turn; s.score[s.turn]++; got++; }
    if (got) E.sfx("coin"); else s.turn = 1 - s.turn;
    s.t = 0;
    if (s.score[0] + s.score[1] === 25) { s.winner = s.score[0] > s.score[1] ? 0 : 1; s.done = 1; }
    return true;
  },
  update(s, inp, dt) {
    s.t += dt;
    if (s.done) { if ((s.done -= dt) <= 0) s.over = true; return; }
    for (const t of inp[s.turn].taps) { const e = this.nearest(t.x, t.y); if (e && this.play(s, e)) break; }
  },
  ai(s, i) {
    if (s.turn !== i || s.t < 0.4 || s.done) return {};
    const edges = [];
    for (let r = 0; r <= 5; r++) for (let c = 0; c < 5; c++) if (s.h[r][c] < 0) edges.push(["h", r, c]);
    for (let r = 0; r < 5; r++) for (let c = 0; c <= 5; c++) if (s.v[r][c] < 0) edges.push(["v", r, c]);
    const boxesOf = ([t, r, c]) => (t === "h" ? [[r - 1, c], [r, c]] : [[r, c - 1], [r, c]]).filter(([a, b]) => a >= 0 && a < 5 && b >= 0 && b < 5);
    const rate = (e) => { let v = 0; for (const [a, b] of boxesOf(e)) { const n = this.sides(s, a, b); if (n === 3) v += 10; if (n === 2) v -= 5; } return v + Math.random(); };
    edges.sort((a, b) => rate(b) - rate(a));
    const [t, r, c] = edges[0];
    const x = t === "h" ? this.X + (c + 0.5) * this.S : this.X + c * this.S, y = t === "h" ? this.Y + r * this.S : this.Y + (r + 0.5) * this.S;
    return { taps: [{ x, y }] };
  },
  draw(c, s) {
    E.clear(c, "#fdf6e3");
    const cols = ["#1e88e5", "#e53935"], fills = ["#bbdefb", "#ffcdd2"];
    for (let r = 0; r < 5; r++) for (let col = 0; col < 5; col++) if (s.box[r][col] >= 0) E.rect(c, this.X + col * this.S, this.Y + r * this.S, this.S, this.S, fills[s.box[r][col]]);
    for (let r = 0; r <= 5; r++) for (let col = 0; col < 5; col++) E.line(c, this.X + col * this.S, this.Y + r * this.S, this.X + (col + 1) * this.S, this.Y + r * this.S, s.h[r][col] >= 0 ? cols[s.h[r][col]] : "#e0dccc", s.h[r][col] >= 0 ? 6 : 2);
    for (let r = 0; r < 5; r++) for (let col = 0; col <= 5; col++) E.line(c, this.X + col * this.S, this.Y + r * this.S, this.X + col * this.S, this.Y + (r + 1) * this.S, s.v[r][col] >= 0 ? cols[s.v[r][col]] : "#e0dccc", s.v[r][col] >= 0 ? 6 : 2);
    for (let r = 0; r <= 5; r++) for (let col = 0; col <= 5; col++) E.circle(c, this.X + col * this.S, this.Y + r * this.S, 6, "#333");
    E.text(c, `${E.name(0)}: ${s.score[0]}`, 125, 200, 22, cols[0]);
    E.text(c, `${E.name(1)}: ${s.score[1]}`, 675, 200, 22, cols[1]);
    E.text(c, s.done ? "" : E.turnText(s.turn), 400, 25, 18, cols[s.turn]);
  },
});
