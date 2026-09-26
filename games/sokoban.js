// Sokoban: push every box onto a target. You can only push, not pull.
GAME({
  title: "Box Pusher",
  players: 1,
  controls: "Move with ◀ ▲ ▼ ▶ (or swipe). Push all boxes onto the ◎ targets. B = undo · A = restart level.",
  aLabel: "Reset", bLabel: "Undo",
  LEVELS: [
    ["#######", "#.    #", "# $   #", "#  @  #", "#######"],
    ["########", "#   .  #", "# $$ # #", "#  @ . #", "########"],
    ["  ####", "###  #", "#   $#", "# #  ###", "# .$ @ #", "#  .   #", "#########"],
    ["########", "#      #", "# .$$. #", "#  @   #", "# .$$. #", "#      #", "########"],
    ["########", "#  .   #", "# ## # #", "#  $ $ #", "#.  @ .#", "## $  ##", " #    #", " ######"],
    ["  #####", "###   #", "#.@$  #", "### $.#", "#.##$ #", "# # . ##", "#$ *$$.#", "#   .  #", "########"],
  ],
  init() { const s = { lv: 0, score: 0 }; this.load(s); return s; },
  load(s) {
    const L = this.LEVELS[s.lv]; s.walls = []; s.goals = []; s.boxes = []; s.hist = []; s.moves = 0;
    L.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === "#") s.walls.push([x, y]);
      if (".*+".includes(ch)) s.goals.push([x, y]);
      if ("$*".includes(ch)) s.boxes.push([x, y]);
      if ("@+".includes(ch)) s.p = [x, y];
    }));
    s.w = Math.max(...L.map((r) => r.length)); s.h = L.length;
  },
  has(list, x, y) { return list.some(([a, b]) => a === x && b === y); },
  update(s, inp) {
    const k = inp[0];
    let d = k.pu ? [0, -1] : k.pd ? [0, 1] : k.pl ? [-1, 0] : k.pr ? [1, 0] : null;
    for (const t of k.taps) { s.swipe = [t.x, t.y]; }
    if (s.swipe && !k.pdown) { const dx = k.px - s.swipe[0], dy = k.py - s.swipe[1]; if (Math.hypot(dx, dy) > 20) d = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]; s.swipe = null; }
    if (k.pb && s.hist.length) { const h = s.hist.pop(); s.p = h.p; s.boxes = h.boxes; s.moves--; return; }
    if (k.pa) { this.load(s); return; }
    if (!d) return;
    const nx = s.p[0] + d[0], ny = s.p[1] + d[1];
    if (this.has(s.walls, nx, ny)) return;
    const bi = s.boxes.findIndex(([a, b]) => a === nx && b === ny);
    if (bi >= 0) { const bx = nx + d[0], by = ny + d[1]; if (this.has(s.walls, bx, by) || this.has(s.boxes, bx, by)) return; s.hist.push({ p: s.p, boxes: s.boxes.map((b) => b.slice()) }); s.boxes[bi] = [bx, by]; E.sfx("hit"); }
    else { s.hist.push({ p: s.p, boxes: s.boxes.map((b) => b.slice()) }); E.sfx("click"); }
    s.p = [nx, ny]; s.moves++;
    if (s.boxes.every(([a, b]) => this.has(s.goals, a, b))) { s.score += 100; E.sfx("win"); s.lv++; if (s.lv >= this.LEVELS.length) { s.over = true; s.overText = "All levels solved! 🎉"; return; } this.load(s); }
  },
  draw(c, s) {
    E.clear(c, "#292524");
    const T = Math.min(50, Math.floor(400 / s.h), Math.floor(700 / s.w)), ox = 400 - (s.w * T) / 2, oy = 240 - (s.h * T) / 2;
    s.walls.forEach(([x, y]) => { E.rect(c, ox + x * T, oy + y * T, T, T, "#78716c"); E.rect(c, ox + x * T + 2, oy + y * T + 2, T - 4, T - 4, "#a8a29e"); });
    s.goals.forEach(([x, y]) => { E.ring(c, ox + x * T + T / 2, oy + y * T + T / 2, T * 0.3, "#f87171", 3); });
    s.boxes.forEach(([x, y]) => { const on = this.has(s.goals, x, y); E.rrect(c, ox + x * T + 4, oy + y * T + 4, T - 8, T - 8, 5, on ? "#22c55e" : "#d97706"); E.line(c, ox + x * T + 8, oy + y * T + 8, ox + x * T + T - 8, oy + y * T + T - 8, "rgba(0,0,0,.3)", 2); });
    E.circle(c, ox + s.p[0] * T + T / 2, oy + s.p[1] * T + T / 2, T * 0.35, "#38bdf8"); E.circle(c, ox + s.p[0] * T + T / 2, oy + s.p[1] * T + T / 2 - 3, T * 0.18, "#fde68a");
    E.text(c, `Level ${s.lv + 1}/${this.LEVELS.length}   Moves ${s.moves}`, 400, 20, 18);
  },
});
