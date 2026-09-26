// Drop bombs, blast crates, grab power-ups, catch your rival in a blast.
GAME({
  title: "Bomb Arena",
  players: 2,
  controls: "Move ◀ ▲ ▼ ▶ · A = drop bomb. Blasts go in a cross. First to 3 rounds.",
  aLabel: "Bomb", bLabel: false,
  CW: 15, CH: 11, T: 40, OX: 100, OY: 5,
  init() { return { ...this.round(), wins: [0, 0] }; },
  round() {
    const g = E.grid(this.CW, this.CH, 0);
    for (let y = 0; y < this.CH; y++) for (let x = 0; x < this.CW; x++) {
      if (x === 0 || y === 0 || x === this.CW - 1 || y === this.CH - 1 || (x % 2 === 0 && y % 2 === 0)) g[y][x] = 1;
      else if (Math.random() < 0.6 && !(x + y < 4) && !(x + y > this.CW + this.CH - 6)) g[y][x] = 2;
    }
    return { g, p: [this.pl(1, 1), this.pl(this.CW - 2, this.CH - 2)], bombs: [], fire: [], items: [], wait: 1 };
  },
  pl(x, y) { return { x: x + 0.5, y: y + 0.5, max: 1, pow: 2, spd: 3.2, dead: false }; },
  free(s, x, y, who) {
    const cx = Math.floor(x), cy = Math.floor(y);
    if (s.g[cy][cx]) return false;
    const b = s.bombs.find((b) => b.x === cx && b.y === cy);
    return !b || b.pass.includes(who);
  },
  update(s, inp, dt) {
    if (s.wait > 0) { s.wait -= dt; return; }
    s.p.forEach((p, i) => {
      if (p.dead) return;
      const k = inp[i];
      const dx = (k.right ? 1 : 0) - (k.left ? 1 : 0), dy = (k.down ? 1 : 0) - (k.up ? 1 : 0);
      const v = p.spd * dt;
      // move along one axis; if blocked but the next cell is open, slide toward the lane centre (corner assist)
      const tryMove = (ax, d) => {
        const along = ax === "x" ? p.x : p.y, across = ax === "x" ? p.y : p.x;
        const next = along + d * v, edge = next + d * 0.35;
        const at = (a, b) => (ax === "x" ? this.free(s, a, b, i) : this.free(s, b, a, i));
        if (at(edge, across - 0.3) && at(edge, across + 0.3)) { if (ax === "x") p.x = next; else p.y = next; return; }
        const lane = Math.floor(across) + 0.5, cell = Math.floor(along) + d;
        if (at(cell + 0.5, lane)) {
          const nudge = E.clamp(lane - across, -v, v);
          if (ax === "x") p.y += nudge; else p.x += nudge;
        }
      };
      if (dx) tryMove("x", dx); else if (dy) tryMove("y", dy);
      const cx = Math.floor(p.x), cy = Math.floor(p.y);
      if (k.pa && s.bombs.filter((b) => b.o === i).length < p.max && !s.bombs.some((b) => b.x === cx && b.y === cy)) {
        s.bombs.push({ x: cx, y: cy, t: 2.2, o: i, pow: p.pow, pass: [0, 1].filter((j) => Math.floor(s.p[j].x) === cx && Math.floor(s.p[j].y) === cy) }); E.sfx("click");
      }
      const it = s.items.findIndex((t) => t.x === cx && t.y === cy);
      if (it >= 0) { const t = s.items[it]; if (t.k === 0) p.max++; else if (t.k === 1) p.pow++; else p.spd = Math.min(5, p.spd + 0.5); s.items.splice(it, 1); E.sfx("coin"); }
    });
    s.bombs.forEach((b) => { b.pass = b.pass.filter((j) => Math.floor(s.p[j].x) === b.x && Math.floor(s.p[j].y) === b.y); b.t -= dt; });
    let boom = s.bombs.find((b) => b.t <= 0);
    while (boom) {
      s.bombs.splice(s.bombs.indexOf(boom), 1); E.sfx("boom");
      s.fire.push({ x: boom.x, y: boom.y, t: 0.5 });
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let r = 1; r <= boom.pow; r++) {
        const x = boom.x + dx * r, y = boom.y + dy * r, c = s.g[y][x];
        if (c === 1) break;
        s.fire.push({ x, y, t: 0.5 });
        const other = s.bombs.find((o) => o.x === x && o.y === y); if (other) other.t = 0;
        if (c === 2) { s.g[y][x] = 0; if (Math.random() < 0.3) s.items.push({ x, y, k: E.randi(0, 2) }); break; }
      }
      boom = s.bombs.find((b) => b.t <= 0);
    }
    s.fire.forEach((f) => (f.t -= dt)); s.fire = s.fire.filter((f) => f.t > 0);
    s.items = s.items.filter((t) => !s.fire.some((f) => f.x === t.x && f.y === t.y && f.t > 0.45));
    s.p.forEach((p) => { if (!p.dead && s.fire.some((f) => f.x === Math.floor(p.x) && f.y === Math.floor(p.y))) p.dead = true; });
    const alive = s.p.map((p) => !p.dead);
    if (!alive[0] || !alive[1]) {
      s.endT = (s.endT || 0) + dt;
      if (s.endT < 1) return;
      if (alive[0] !== alive[1]) s.wins[alive[0] ? 0 : 1]++;
      const w = s.wins.findIndex((v) => v >= 3);
      if (w >= 0) { s.over = true; s.winner = w; return; }
      Object.assign(s, this.round(), { endT: 0 });
    }
  },
  danger(s, x, y) {
    return s.fire.some((f) => f.x === x && f.y === y) || s.bombs.some((b) => (b.x === x && Math.abs(b.y - y) <= b.pow) || (b.y === y && Math.abs(b.x - x) <= b.pow));
  },
  ai(s, i) {
    const p = s.p[i]; if (p.dead) return {};
    const cx = Math.floor(p.x), cy = Math.floor(p.y), o = s.p[1 - i];
    // BFS to the nearest cell matching goal
    const bfs = (goal, avoid = true) => {
      const seen = new Set([cx + "," + cy]), q = [[cx, cy, null]];
      while (q.length) {
        const [x, y, first] = q.shift();
        if (goal(x, y) && first) return first;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy, key = nx + "," + ny;
          if (seen.has(key) || s.g[ny][nx] || s.bombs.some((b) => b.x === nx && b.y === ny) || (avoid && s.fire.some((f) => f.x === nx && f.y === ny))) continue;
          seen.add(key); q.push([nx, ny, first || [dx, dy]]);
        }
      }
      return null;
    };
    let dir;
    if (this.danger(s, cx, cy)) dir = bfs((x, y) => !this.danger(s, x, y));
    else {
      const nearCrate = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => s.g[cy + dy][cx + dx] === 2);
      const nearFoe = Math.abs(Math.floor(o.x) - cx) + Math.abs(Math.floor(o.y) - cy) <= 2;
      if ((nearCrate || nearFoe) && !s.bombs.some((b) => b.o === i) && Math.random() < 0.7) {
        // only drop a bomb if there's somewhere safe to run to afterwards
        s.bombs.push({ x: cx, y: cy, t: 2.2, o: i, pow: p.pow, pass: [] });
        const escape = bfs((x, y) => !this.danger(s, x, y));
        s.bombs.pop();
        if (escape) return { pa: true };
      }
      const ox = Math.floor(o.x), oy = Math.floor(o.y);
      dir = (!o.dead && bfs((x, y) => Math.abs(x - ox) + Math.abs(y - oy) <= 1)) || bfs((x, y) => s.items.some((t) => t.x === x && t.y === y));
      if (!dir) {
        // no open path to the opponent: dig toward them via the reachable crate spot nearest to them
        let best = null, bestD = Infinity;
        const seen = new Set([cx + "," + cy]), q = [[cx, cy, null, 0]];
        while (q.length) {
          const [x, y, first, n] = q.shift();
          if (first && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => s.g[y + dy][x + dx] === 2)) {
            const d = Math.abs(x - ox) + Math.abs(y - oy) + n * 0.3;
            if (d < bestD) { bestD = d; best = first; }
          }
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, ny = y + dy, key = nx + "," + ny;
            if (seen.has(key) || s.g[ny][nx] || s.bombs.some((b) => b.x === nx && b.y === ny) || s.fire.some((f) => f.x === nx && f.y === ny)) continue;
            seen.add(key); q.push([nx, ny, first || [dx, dy], n + 1]);
          }
        }
        const here = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => s.g[cy + dy][cx + dx] === 2) ? Math.abs(cx - ox) + Math.abs(cy - oy) : Infinity;
        dir = here <= bestD ? null : best;
      }
      if (dir && this.danger(s, cx + dir[0], cy + dir[1])) dir = null;
    }
    if (!dir) return {};
    return { right: dir[0] > 0, left: dir[0] < 0, down: dir[1] > 0, up: dir[1] < 0 };
  },
  draw(c, s) {
    E.clear(c, "#1b5e20");
    const T = this.T, X = this.OX, Y = this.OY;
    for (let y = 0; y < this.CH; y++) for (let x = 0; x < this.CW; x++) {
      const v = s.g[y][x], px = X + x * T, py = Y + y * T;
      E.rect(c, px, py, T, T, (x + y) % 2 ? "#388e3c" : "#43a047");
      if (v === 1) { E.rect(c, px, py, T, T, "#546e7a"); E.rect(c, px + 3, py + 3, T - 6, T - 6, "#78909c"); }
      if (v === 2) { E.rect(c, px + 2, py + 2, T - 4, T - 4, "#a1662f"); E.line(c, px + 4, py + 4, px + T - 4, py + T - 4, "#6d3f16", 3); }
    }
    s.items.forEach((t) => E.text(c, ["💣", "🔥", "👟"][t.k], X + t.x * T + T / 2, Y + t.y * T + T / 2, 24));
    s.bombs.forEach((b) => { const pulse = 14 + Math.sin(b.t * 12) * 2; E.circle(c, X + b.x * T + T / 2, Y + b.y * T + T / 2, pulse, "#111"); E.circle(c, X + b.x * T + T / 2 + 6, Y + b.y * T + 8, 4, "#ff9800"); });
    s.fire.forEach((f) => { E.rect(c, X + f.x * T + 3, Y + f.y * T + 3, T - 6, T - 6, "#ff9800"); E.rect(c, X + f.x * T + 10, Y + f.y * T + 10, T - 20, T - 20, "#fff59d"); });
    const cols = ["#fff", "#212121"];
    s.p.forEach((p, i) => {
      if (p.dead) return;
      const px = X + p.x * T, py = Y + p.y * T;
      E.circle(c, px, py, 15, cols[i]); E.circle(c, px, py - 3, 9, "#f1c27d");
      E.rect(c, px - 10, py - 16, 20, 5, i ? "#e53935" : "#1e88e5");
    });
    E.text(c, E.name(0), 50, 200, 14); E.text(c, "★".repeat(s.wins[0]), 50, 225, 18, "#ffeb3b");
    E.text(c, E.name(1), 750, 200, 14); E.text(c, "★".repeat(s.wins[1]), 750, 225, 18, "#ffeb3b");
  },
});
