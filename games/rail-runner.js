// 3-lane runner: switch lanes, jump, roll. Collect coins.
GAME({
  title: "Rail Runner",
  players: 1,
  controls: "◀ ▶ switch lanes · ▲ jump · ▼ roll · or swipe.",
  aLabel: "Jump", bLabel: "Roll",
  init() { return { lane: 1, lx: 1, y: 0, vy: 0, roll: 0, obs: [], coins: [], z: 0, spd: 18, next: 20, score: 0, got: 0, swipe: null }; },
  update(s, inp, dt) {
    const k = inp[0];
    let mv = k.pl ? -1 : k.pr ? 1 : 0, jump = k.pu || k.pa, roll = k.pd || k.pb;
    for (const t of k.taps) s.swipe = { x: t.x, y: t.y };
    if (s.swipe && !k.pdown) {
      const dx = k.px - s.swipe.x, dy = k.py - s.swipe.y;
      if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) mv = Math.sign(dx); else if (dy < -30) jump = true; else if (dy > 30) roll = true;
      s.swipe = null;
    }
    if (mv) { s.lane = E.clamp(s.lane + mv, 0, 2); E.sfx("click"); }
    if (jump && s.y === 0) { s.vy = 11; E.sfx("jump"); }
    if (roll) { s.roll = 0.6; if (s.y > 0) s.vy = -14; }
    s.roll = Math.max(0, s.roll - dt);
    s.vy -= 30 * dt; s.y = Math.max(0, s.y + s.vy * dt); if (!s.y) s.vy = 0;
    s.lx = E.lerp(s.lx, s.lane, 0.3);
    s.spd += dt * 0.3; s.z += s.spd * dt; s.score = Math.floor(s.z) + s.got * 10;
    while (s.next < s.z + 120) {
      const kinds = ["train", "barrier", "low"];
      const lanes = E.shuffle([0, 1, 2]).slice(0, E.randi(1, 2));
      lanes.forEach((l) => s.obs.push({ l, z: s.next, k: E.pick(kinds), len: 0 }));
      s.obs.filter((o) => o.z === s.next && o.k === "train").forEach((o) => (o.len = E.rand(8, 20)));
      const free = [0, 1, 2].find((l) => !lanes.includes(l)) ?? 1;
      for (let c = 0; c < 5; c++) s.coins.push({ l: free, z: s.next + 3 + c * 2.5 });
      s.next += E.rand(14, 24);
    }
    const lane = Math.round(s.lx);
    for (const o of s.obs) {
      if (o.l !== lane) continue;
      const len = o.k === "train" ? o.len : 1;
      if (s.z + 0.5 > o.z && s.z - 0.5 < o.z + len) {
        const clear = o.k === "barrier" ? s.y > 1.2 : o.k === "low" ? s.roll > 0 || s.y > 1.4 : s.y > 3.5;
        if (!clear) { s.over = true; E.sfx("boom"); }
      }
    }
    s.coins = s.coins.filter((c) => { if (c.l === lane && Math.abs(c.z - s.z) < 0.8 && s.y < 2) { s.got++; E.sfx("coin"); return false; } return c.z > s.z - 2; });
    s.obs = s.obs.filter((o) => o.z + (o.len || 1) > s.z - 2);
  },
  draw(c, s) {
    const g = c.createLinearGradient(0, 0, 0, 450); g.addColorStop(0, "#7dd3fc"); g.addColorStop(1, "#bae6fd"); c.fillStyle = g; c.fillRect(0, 0, 800, 450);
    const P = (lane, z, h = 0) => { const dz = z - s.z + 4, sc = 360 / dz; return [400 + (lane - 1) * 2.2 * sc, 60 + sc * 3.8 - h * sc * 0.5, sc]; };
    c.fillStyle = "#78716c"; c.beginPath(); { const [a] = P(-0.5, s.z + 80), [b] = P(2.5, s.z + 80), [cc, cy] = P(2.5, s.z - 3.5), [d] = P(-0.5, s.z - 3.5); c.moveTo(a, P(0, s.z + 80)[1]); c.lineTo(b, P(0, s.z + 80)[1]); c.lineTo(cc, cy); c.lineTo(d, cy); c.fill(); }
    for (let l = 0; l < 3; l++) for (let z = Math.ceil(s.z); z < s.z + 60; z += 2) { const [x, y, sc] = P(l, z); E.rect(c, x - sc * 0.9, y, sc * 1.8, Math.max(1, sc * 0.08), "#57534e"); }
    const items = [...s.obs.map((o) => ({ ...o, t: "o" })), ...s.coins.map((o) => ({ ...o, t: "c" }))].filter((o) => o.z > s.z - 3 && o.z < s.z + 80).sort((a, b) => b.z - a.z);
    items.forEach((o) => {
      if (o.t === "c") { const [x, y, sc] = P(o.l, o.z, 1); E.circle(c, x, y, sc * 0.35, "#facc15"); return; }
      if (o.k === "train") {
        const [x1, y1, s1] = P(o.l, o.z + o.len), [x0, y0, s0] = P(o.l, Math.max(o.z, s.z - 3.5));
        c.fillStyle = "#b91c1c"; c.beginPath(); c.moveTo(x1 - s1 * 0.9, y1); c.lineTo(x1 - s1 * 0.9, y1 - s1 * 2.2); c.lineTo(x1 + s1 * 0.9, y1 - s1 * 2.2); c.lineTo(x1 + s1 * 0.9, y1); c.lineTo(x0 + s0 * 0.9, y0); c.lineTo(x0 + s0 * 0.9, y0 - s0 * 2.2); c.lineTo(x0 - s0 * 0.9, y0 - s0 * 2.2); c.lineTo(x0 - s0 * 0.9, y0); c.fill();
        E.rect(c, x0 - s0 * 0.9, y0 - s0 * 2.2, s0 * 1.8, s0 * 2.2, "#dc2626"); E.rect(c, x0 - s0 * 0.6, y0 - s0 * 1.9, s0 * 1.2, s0 * 0.6, "#bfdbfe");
      } else if (o.k === "barrier") { const [x, y, sc] = P(o.l, o.z); E.rect(c, x - sc * 0.9, y - sc * 0.6, sc * 1.8, sc * 0.3, "#f59e0b"); E.rect(c, x - sc * 0.8, y - sc * 0.6, sc * 0.1, sc * 0.6, "#78350f"); E.rect(c, x + sc * 0.7, y - sc * 0.6, sc * 0.1, sc * 0.6, "#78350f"); }
      else { const [x, y, sc] = P(o.l, o.z); E.rect(c, x - sc * 0.9, y - sc * 1.6, sc * 1.8, sc * 0.4, "#2563eb"); E.rect(c, x - sc * 0.8, y - sc * 1.6, sc * 0.1, sc * 1.6, "#1e3a8a"); E.rect(c, x + sc * 0.7, y - sc * 1.6, sc * 0.1, sc * 1.6, "#1e3a8a"); }
    });
    const [px, py, sc] = P(s.lx, s.z, s.y);
    const h = s.roll ? 0.6 : 1.4;
    E.rrect(c, px - sc * 0.35, py - sc * h, sc * 0.7, sc * h, sc * 0.2, "#16a34a"); E.circle(c, px, py - sc * h - sc * 0.25, sc * 0.28, "#fcd34d");
    E.text(c, `${s.score}   🪙 ${s.got}`, 20, 20, 22, "#0c4a6e", "left", "top");
  },
});
