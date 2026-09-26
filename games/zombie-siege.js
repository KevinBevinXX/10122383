// Top-down survival: shoot zombies, grab ammo, survive the waves.
GAME({
  title: "Zombie Siege",
  players: 1,
  controls: "Move ◀ ▲ ▼ ▶ · aim with the mouse (or it auto-aims at the nearest zombie) · A / click = shoot · B = reload",
  aLabel: "Shoot", bLabel: "Reload",
  init() { return { x: 400, y: 225, hp: 100, z: [], b: [], drops: [], ammo: 12, mag: 12, spare: 48, reload: 0, cool: 0, wave: 0, left: 0, next: 0, score: 0, aim: 0, inv: 0 }; },
  update(s, inp, dt) {
    const k = inp[0];
    s.x = E.clamp(s.x + ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 190 * dt, 15, 785);
    s.y = E.clamp(s.y + ((k.down ? 1 : 0) - (k.up ? 1 : 0)) * 190 * dt, 15, 435);
    const near = s.z.reduce((b, z) => (!b || E.dist(z.x, z.y, s.x, s.y) < E.dist(b.x, b.y, s.x, s.y) ? z : b), null);
    if (k.px || k.py) s.aim = Math.atan2(k.py - s.y, k.px - s.x); else if (near) s.aim = Math.atan2(near.y - s.y, near.x - s.x);
    if (E.mode() === "solo" && matchMedia("(pointer: coarse)").matches && near) s.aim = Math.atan2(near.y - s.y, near.x - s.x);
    s.cool -= dt; s.inv = Math.max(0, s.inv - dt);
    if (s.reload > 0) { s.reload -= dt; if (s.reload <= 0) { const n = Math.min(s.mag - s.ammo, s.spare); s.ammo += n; s.spare -= n; } }
    if ((k.pb || (!s.ammo && s.spare)) && s.reload <= 0 && s.ammo < s.mag && s.spare) s.reload = 1.2;
    if ((k.a || k.pdown) && s.cool <= 0 && s.ammo > 0 && s.reload <= 0) { s.ammo--; s.cool = 0.16; s.b.push({ x: s.x, y: s.y, vx: Math.cos(s.aim) * 700, vy: Math.sin(s.aim) * 700 }); E.sfx("shoot"); }
    if (!s.left && !s.z.length) { s.wave++; s.left = 5 + s.wave * 4; s.next = 2; }
    s.next -= dt;
    if (s.left && s.next <= 0) {
      const side = E.randi(0, 3), p = side === 0 ? [E.rand(0, 800), -20] : side === 1 ? [820, E.rand(0, 450)] : side === 2 ? [E.rand(0, 800), 470] : [-20, E.rand(0, 450)];
      const big = Math.random() < 0.1; s.z.push({ x: p[0], y: p[1], hp: (big ? 6 : 2) + Math.floor(s.wave / 3), sp: E.rand(40, 60) + s.wave * 3, big }); s.left--; s.next = E.rand(0.3, 1.2) / (1 + s.wave * 0.1);
    }
    s.b = s.b.filter((b) => { b.x += b.vx * dt; b.y += b.vy * dt; return b.x > -10 && b.x < 810 && b.y > -10 && b.y < 460; });
    s.z = s.z.filter((z) => {
      const d = E.dist(z.x, z.y, s.x, s.y) || 1, r = z.big ? 22 : 14;
      z.x += ((s.x - z.x) / d) * z.sp * (z.big ? 0.7 : 1) * dt; z.y += ((s.y - z.y) / d) * z.sp * (z.big ? 0.7 : 1) * dt;
      const hit = s.b.findIndex((b) => E.dist(b.x, b.y, z.x, z.y) < r);
      if (hit >= 0) { s.b.splice(hit, 1); z.hp -= 1; z.x -= ((s.x - z.x) / d) * 8; z.y -= ((s.y - z.y) / d) * 8; E.sfx("hit"); }
      if (z.hp <= 0) { s.score += z.big ? 50 : 10; if (Math.random() < 0.18) s.drops.push({ x: z.x, y: z.y, k: Math.random() < 0.7 ? "ammo" : "hp" }); return false; }
      if (d < r + 12 && !s.inv) { s.hp -= z.big ? 20 : 10; s.inv = 0.6; E.sfx("lose"); }
      return true;
    });
    s.drops = s.drops.filter((p) => { if (E.dist(p.x, p.y, s.x, s.y) < 24) { if (p.k === "ammo") s.spare += 24; else s.hp = Math.min(100, s.hp + 30); E.sfx("coin"); return false; } return true; });
    if (s.hp <= 0) s.over = true;
  },
  draw(c, s) {
    E.clear(c, "#3f3f2e");
    for (let i = 0; i < 50; i++) E.circle(c, (i * 173) % 800, (i * 91) % 450, 6 + (i % 4) * 3, "#4a4a36");
    s.drops.forEach((p) => E.text(c, p.k === "ammo" ? "📦" : "➕", p.x, p.y, 20));
    s.z.forEach((z) => { const r = z.big ? 22 : 14; E.circle(c, z.x, z.y, r, z.big ? "#4d7c0f" : "#65a30d"); E.circle(c, z.x - r / 3, z.y - r / 4, 3, "#dc2626"); E.circle(c, z.x + r / 3, z.y - r / 4, 3, "#dc2626"); });
    s.b.forEach((b) => E.circle(c, b.x, b.y, 3, "#fde047"));
    c.save(); c.translate(s.x, s.y); c.rotate(s.aim); E.rect(c, 4, -3, 22, 6, "#111"); c.restore();
    E.circle(c, s.x, s.y, 14, s.inv ? "#fff" : "#2563eb"); E.circle(c, s.x, s.y, 8, "#f1c27d");
    E.rect(c, 10, 10, 200, 14, "#111"); E.rect(c, 10, 10, 2 * Math.max(0, s.hp), 14, "#ef4444");
    E.text(c, s.reload > 0 ? "Reloading…" : `Ammo ${s.ammo}/${s.spare}`, 10, 40, 14, "#fff", "left");
    E.text(c, `Wave ${s.wave}   Score ${s.score}`, 790, 16, 16, "#fff", "right");
  },
});
