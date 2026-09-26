// Side-view brawler: punch, kick, block. Knock out your opponent.
GAME({
  title: "Stick Fight",
  players: 2,
  controls: "Move ◀ ▶ · Jump ▲ · Block ▼ · A = punch · B = kick (slower, stronger). Best of 3 rounds.",
  aLabel: "Punch", bLabel: "Kick",
  FLOOR: 390,
  init() { return { ...this.round(), wins: [0, 0], roundNo: 1 }; },
  round() { return { f: [this.fighter(250, 1), this.fighter(550, -1)], wait: 1.2, msg: "FIGHT!" }; },
  fighter(x, face) { return { x, y: this.FLOOR, vy: 0, vx: 0, face, hp: 100, atk: null, at: 0, cd: 0, block: false, hurt: 0 }; },
  update(s, inp, dt) {
    if (s.wait > 0) { s.wait -= dt; if (s.wait <= 0) s.msg = ""; return; }
    s.f.forEach((f, i) => {
      const k = inp[i], o = s.f[1 - i];
      f.cd = Math.max(0, f.cd - dt); f.hurt = Math.max(0, f.hurt - dt);
      f.face = o.x > f.x ? 1 : -1;
      f.block = k.down && f.y >= this.FLOOR && !f.atk;
      const dir = f.hurt || f.block || f.atk ? 0 : (k.right ? 1 : 0) - (k.left ? 1 : 0);
      f.vx = f.hurt ? f.vx * 0.9 : dir * 230;
      if (k.pu && f.y >= this.FLOOR && !f.hurt) { f.vy = -560; E.sfx("jump"); }
      f.vy += 1500 * dt; f.x = E.clamp(f.x + f.vx * dt, 30, 770); f.y = Math.min(this.FLOOR, f.y + f.vy * dt);
      if (f.y >= this.FLOOR) f.vy = 0;
      if (!f.atk && !f.cd && !f.hurt && !f.block) {
        if (k.pa) { f.atk = "punch"; f.at = 0; } else if (k.pb) { f.atk = "kick"; f.at = 0; }
      }
      if (f.atk) {
        f.at += dt;
        const P = f.atk === "punch" ? { hit: 0.08, end: 0.22, reach: 62, dmg: 7, kb: 180, cd: 0.1 } : { hit: 0.2, end: 0.45, reach: 78, dmg: 13, kb: 360, cd: 0.25 };
        if (f.at >= P.hit && !f.landed) {
          f.landed = true;
          const dx = (o.x - f.x) * f.face;
          if (dx > 0 && dx < P.reach && Math.abs(o.y - f.y) < 70) {
            const blocked = o.block && o.face === -f.face;
            o.hp -= blocked ? P.dmg * 0.15 : P.dmg; o.vx = f.face * (blocked ? P.kb * 0.3 : P.kb); o.hurt = blocked ? 0.1 : 0.3;
            E.sfx(blocked ? "pop" : "hit");
          }
        }
        if (f.at >= P.end) { f.atk = null; f.landed = false; f.cd = P.cd; }
      }
    });
    const [a, b] = s.f;
    if (Math.abs(a.x - b.x) < 30 && Math.abs(a.y - b.y) < 60) { const sg = a.x < b.x ? -1 : 1, p = (30 - Math.abs(a.x - b.x)) / 2; a.x += sg * p; b.x -= sg * p; }
    const ko = s.f.map((f) => f.hp <= 0);
    if (ko[0] || ko[1]) {
      const w = ko[0] && ko[1] ? -1 : ko[0] ? 1 : 0;
      if (w >= 0) s.wins[w]++;
      E.sfx("boom");
      if (s.wins.some((v) => v >= 2)) { s.over = true; s.winner = s.wins[0] >= 2 ? 0 : 1; return; }
      s.roundNo++;
      Object.assign(s, this.round(), { msg: "K.O.! Round " + s.roundNo });
    }
  },
  ai(s, i) {
    const f = s.f[i], o = s.f[1 - i], d = Math.abs(o.x - f.x), k = {};
    const toward = o.x > f.x ? "right" : "left", away = o.x > f.x ? "left" : "right";
    if (o.atk && d < 90 && Math.random() < 0.5) { k.down = true; return k; }
    if (d > 70) k[toward] = true;
    else if (d < 40) k[away] = true;
    if (d < 75 && !f.cd && Math.random() < 0.12) k[Math.random() < 0.6 ? "pa" : "pb"] = true;
    if (Math.random() < 0.01) k.pu = true;
    return k;
  },
  draw(c, s) {
    const g = c.createLinearGradient(0, 0, 0, 450); g.addColorStop(0, "#ff9a8b"); g.addColorStop(1, "#ff6a88");
    c.fillStyle = g; c.fillRect(0, 0, 800, 450);
    E.circle(c, 620, 130, 60, "#ffe29f");
    E.rect(c, 0, 400, 800, 50, "#2d132c");
    const cols = ["#1a237e", "#b71c1c"];
    s.f.forEach((f, i) => {
      const col = f.hurt ? "#fff" : cols[i], x = f.x, y = f.y, fc = f.face;
      c.lineCap = "round";
      E.circle(c, x, y - 92, 12, col);
      E.line(c, x, y - 80, x, y - 40, col, 6);
      const kick = f.atk === "kick" && f.at > 0.15, punch = f.atk === "punch" && f.at > 0.05;
      E.line(c, x, y - 40, x - 12, y, col, 6);
      E.line(c, x, y - 40, kick ? x + fc * 45 : x + 12, kick ? y - 45 : y, col, 6);
      if (f.block) { E.line(c, x, y - 70, x + fc * 18, y - 90, col, 6); E.line(c, x, y - 65, x + fc * 20, y - 80, col, 6); }
      else { E.line(c, x, y - 72, punch ? x + fc * 42 : x + fc * 18, punch ? y - 74 : y - 55, col, 6); E.line(c, x, y - 72, x - fc * 14, y - 52, col, 6); }
      const bx = i ? 460 : 40;
      E.rect(c, bx, 20, 300, 18, "#2d132c"); E.rect(c, i ? bx + 300 - 3 * Math.max(0, f.hp) : bx, 20, 3 * Math.max(0, f.hp), 18, i ? "#ef5350" : "#42a5f5");
      E.text(c, E.name(i) + " " + "●".repeat(s.wins[i]), i ? 760 : 40, 52, 14, "#fff", i ? "right" : "left");
    });
    if (s.msg) E.text(c, s.msg, 400, 180, 52, "#fff");
  },
});
