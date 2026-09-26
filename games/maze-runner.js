// Escape generated mazes against the clock. Each maze is bigger.
GAME({
  title: "Maze Runner",
  players: 1,
  controls: "Move with ◀ ▲ ▼ ▶ (or swipe). Reach the green exit. 5 mazes, each bigger.",
  aLabel: "·", bLabel: false, lowScore: true,
  init() { const s = { lvl: 1, t: 0 }; this.gen(s); return s; },
  gen(s) {
    const W = 8 + s.lvl * 4, H = Math.round(W * 0.55);
    const wall = E.grid(W * 2 + 1, H * 2 + 1, 1), seen = E.grid(W, H, false), st = [[0, 0]];
    seen[0][0] = true; wall[1][1] = 0;
    while (st.length) {
      const [x, y] = st[st.length - 1];
      const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => x + dx >= 0 && y + dy >= 0 && x + dx < W && y + dy < H && !seen[y + dy][x + dx]);
      if (!n.length) { st.pop(); continue; }
      const [dx, dy] = E.pick(n);
      seen[y + dy][x + dx] = true; wall[y * 2 + 1 + dy][x * 2 + 1 + dx] = 0; wall[(y + dy) * 2 + 1][(x + dx) * 2 + 1] = 0; st.push([x + dx, y + dy]);
    }
    Object.assign(s, { wall, W: W * 2 + 1, H: H * 2 + 1, px: 1, py: 1, ex: W * 2 - 1, ey: H * 2 - 1, trail: [[1, 1]] });
  },
  update(s, inp, dt) {
    const k = inp[0]; s.t += dt;
    let d = k.up ? [0, -1] : k.down ? [0, 1] : k.left ? [-1, 0] : k.right ? [1, 0] : null;
    for (const t of k.taps) s.swipe = [t.x, t.y];
    if (s.swipe && k.pdown) { const dx = k.px - s.swipe[0], dy = k.py - s.swipe[1]; if (Math.hypot(dx, dy) > 18) { d = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]; s.swipe = [k.px, k.py]; } }
    if (!k.pdown) s.swipe = null;
    s.cool = Math.max(0, (s.cool || 0) - dt);
    if (d && !s.cool) {
      const nx = s.px + d[0], ny = s.py + d[1];
      if (!s.wall[ny][nx]) { s.px = nx; s.py = ny; s.trail.push([nx, ny]); s.cool = 0.07; }
    }
    if (s.px === s.ex && s.py === s.ey) {
      E.sfx("win");
      if (s.lvl >= 5) { s.over = true; s.score = Math.round(s.t); s.overText = `Escaped all 5 mazes in ${Math.round(s.t)}s!`; return; }
      s.lvl++; this.gen(s);
    }
  },
  draw(c, s) {
    E.clear(c, "#0f172a");
    const T = Math.min(800 / s.W, 420 / s.H), ox = (800 - s.W * T) / 2, oy = 30 + (420 - s.H * T) / 2;
    for (let y = 0; y < s.H; y++) for (let x = 0; x < s.W; x++) if (s.wall[y][x]) E.rect(c, ox + x * T, oy + y * T, T + 0.5, T + 0.5, "#334155");
    s.trail.forEach(([x, y]) => E.rect(c, ox + x * T + T * 0.3, oy + y * T + T * 0.3, T * 0.4, T * 0.4, "rgba(56,189,248,.25)"));
    E.rect(c, ox + s.ex * T, oy + s.ey * T, T, T, "#22c55e");
    E.circle(c, ox + s.px * T + T / 2, oy + s.py * T + T / 2, T * 0.4, "#38bdf8");
    E.text(c, `Maze ${s.lvl}/5   ${Math.floor(s.t)}s`, 400, 14, 16);
  },
});
