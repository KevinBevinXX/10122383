// Clicker: bake cookies, buy helpers, bake more cookies. Progress is saved on this device.
GAME({
  title: "Idle Bakery",
  players: 1, touch: "pointer",
  controls: "Tap the cookie. Buy upgrades on the right. Your bakery keeps going — and is saved on this device.",
  SHOP: [["👆 Better click", 15, 0, 1], ["👵 Grandma", 50, 1, 0], ["🏭 Oven", 300, 6, 0], ["🚜 Farm", 1500, 25, 0], ["🏗️ Factory", 9000, 120, 0], ["🚀 Rocket", 60000, 700, 0]],
  init() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem("idle-bakery") || "null"); } catch (e) {}
    return saved && saved.v === 1 ? { ...saved, pops: [] } : { v: 1, cookies: 0, total: 0, owned: [0, 0, 0, 0, 0, 0], pops: [], saveT: 0 };
  },
  cost(s, i) { return Math.ceil(this.SHOP[i][1] * Math.pow(1.15, s.owned[i])); },
  cps(s) { return this.SHOP.reduce((a, [, , c], i) => a + c * s.owned[i], 0); },
  perClick(s) { return 1 + s.owned[0]; },
  update(s, inp, dt) {
    const add = this.cps(s) * dt; s.cookies += add; s.total += add;
    for (const t of inp[0].taps) {
      if (E.dist(t.x, t.y, 220, 230) < 110) { const n = this.perClick(s); s.cookies += n; s.total += n; s.pops.push({ x: t.x, y: t.y, t: 0.8, n }); E.sfx("pop"); }
      this.SHOP.forEach((_, i) => { if (E.inRect(t, 470, 40 + i * 62, 310, 54) && s.cookies >= this.cost(s, i)) { s.cookies -= this.cost(s, i); s.owned[i]++; E.sfx("coin"); } });
    }
    if (inp[0].pa) { const n = this.perClick(s); s.cookies += n; s.total += n; }
    s.pops.forEach((p) => { p.t -= dt; p.y -= 60 * dt; }); s.pops = s.pops.filter((p) => p.t > 0);
    s.saveT = (s.saveT || 0) + dt;
    if (s.saveT > 3 && E.mode() === "solo") { s.saveT = 0; try { localStorage.setItem("idle-bakery", JSON.stringify({ ...s, pops: [] })); } catch (e) {} }
  },
  fmt(n) { n = Math.floor(n); return n >= 1e9 ? (n / 1e9).toFixed(2) + "B" : n >= 1e6 ? (n / 1e6).toFixed(2) + "M" : n >= 1e4 ? (n / 1e3).toFixed(1) + "K" : String(n); },
  draw(c, s) {
    E.clear(c, "#451a03");
    E.text(c, this.fmt(s.cookies) + " cookies", 220, 45, 26, "#fde68a"); E.text(c, `${this.fmt(this.cps(s))} per second`, 220, 75, 15, "#fcd34d");
    E.circle(c, 220, 230, 110, "#b45309"); E.circle(c, 220, 230, 100, "#d97706");
    [[-40, -30], [30, -50], [50, 20], [-20, 40], [-60, 20], [10, 0], [40, 60]].forEach(([dx, dy]) => E.circle(c, 220 + dx, 230 + dy, 10, "#451a03"));
    s.pops.forEach((p) => E.text(c, "+" + p.n, p.x, p.y, 18, `rgba(255,255,255,${p.t})`));
    this.SHOP.forEach(([name, , cps, click], i) => {
      const y = 40 + i * 62, cost = this.cost(s, i), ok = s.cookies >= cost;
      E.rrect(c, 470, y, 310, 54, 10, ok ? "#92400e" : "#3f1d0b");
      E.text(c, name, 485, y + 18, 16, ok ? "#fff" : "#a8a29e", "left");
      E.text(c, `🍪 ${this.fmt(cost)}   ${click ? "+1 per click" : "+" + cps + "/s"}`, 485, y + 40, 12, ok ? "#fde68a" : "#78716c", "left");
      E.text(c, s.owned[i], 765, y + 27, 22, "#fde68a", "right");
    });
    E.text(c, `Baked all-time: ${this.fmt(s.total)}`, 220, 420, 13, "#d6d3d1");
  },
});
