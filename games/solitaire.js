// Klondike solitaire (draw 1).
GAME({
  title: "Solitaire",
  players: 1, touch: "pointer", lowScore: true,
  controls: "Tap the deck to draw. Tap a card to select it (and the cards on top), then tap where to move it. Double-tap sends a card to the foundations.",
  W: 70, H: 96,
  init() {
    const deck = E.shuffle([...Array(52).keys()].map((i) => ({ r: (i % 13) + 1, s: Math.floor(i / 13), up: false })));
    const tab = [];
    for (let i = 0; i < 7; i++) { tab.push(deck.splice(0, i + 1)); tab[i][i].up = true; }
    return { stock: deck, waste: [], found: [[], [], [], []], tab, sel: null, moves: 0, lastTap: null, t: 0 };
  },
  red(c) { return c.s === 1 || c.s === 2; },
  tx(i) { return 40 + i * 104; },
  canTab(card, pile) { if (!pile.length) return card.r === 13; const top = pile[pile.length - 1]; return top.up && top.r === card.r + 1 && this.red(top) !== this.red(card); },
  canFound(card, f) { return f.length ? f[f.length - 1].s === card.s && f[f.length - 1].r === card.r - 1 : card.r === 1; },
  pick(s, t) {
    if (E.inRect(t, 40, 15, this.W, this.H)) return { src: "stock" };
    if (E.inRect(t, 144, 15, this.W, this.H) && s.waste.length) return { src: "waste" };
    for (let f = 0; f < 4; f++) if (E.inRect(t, this.tx(3 + f), 15, this.W, this.H)) return { src: "found", i: f };
    for (let i = 0; i < 7; i++) {
      const p = s.tab[i];
      if (t.x < this.tx(i) || t.x > this.tx(i) + this.W) continue;
      for (let j = p.length - 1; j >= 0; j--) { const y = this.ty(p, j); if (t.y >= y && t.y <= y + (j === p.length - 1 ? this.H : 22)) return { src: "tab", i, j }; }
      if (t.y > 125) return { src: "tab", i, j: -1 };
    }
    return null;
  },
  ty(p, j) { let y = 125; for (let k = 0; k < j; k++) y += p[k].up ? 22 : 10; return y; },
  cards(s, sel) { if (sel.src === "waste") return [s.waste[s.waste.length - 1]]; if (sel.src === "found") return [s.found[sel.i][s.found[sel.i].length - 1]]; return s.tab[sel.i].slice(sel.j); },
  remove(s, sel) { if (sel.src === "waste") s.waste.pop(); else if (sel.src === "found") s.found[sel.i].pop(); else { s.tab[sel.i].splice(sel.j); const p = s.tab[sel.i]; if (p.length) p[p.length - 1].up = true; } },
  autoFound(s, sel) {
    const cs = this.cards(s, sel); if (cs.length !== 1) return false;
    for (const f of s.found) if (this.canFound(cs[0], f)) { this.remove(s, sel); f.push(cs[0]); s.moves++; E.sfx("coin"); return true; }
    return false;
  },
  update(s, inp, dt) {
    s.t += dt;
    for (const t of inp[0].taps) {
      const hit = this.pick(s, t);
      if (!hit) { s.sel = null; continue; }
      if (hit.src === "stock") { if (s.stock.length) { const c = s.stock.pop(); c.up = true; s.waste.push(c); } else { s.stock = s.waste.reverse().map((c) => ({ ...c, up: false })); s.waste = []; } s.sel = null; E.sfx("click"); continue; }
      const dbl = s.lastTap && performance.now() - s.lastTap.t < 350 && s.lastTap.src === hit.src && s.lastTap.i === hit.i;
      s.lastTap = { ...hit, t: performance.now() };
      if (s.sel) {
        const cs = this.cards(s, s.sel);
        let ok = false;
        if (hit.src === "tab" && hit.i !== s.sel.i && this.canTab(cs[0], s.tab[hit.i])) { this.remove(s, s.sel); s.tab[hit.i].push(...cs); ok = true; }
        else if (hit.src === "found" && cs.length === 1 && this.canFound(cs[0], s.found[hit.i])) { this.remove(s, s.sel); s.found[hit.i].push(cs[0]); ok = true; }
        if (ok) { s.moves++; s.sel = null; E.sfx("pop"); continue; }
        if (dbl && this.autoFound(s, s.sel)) { s.sel = null; continue; }
      }
      if (hit.src === "tab" && hit.j >= 0 && s.tab[hit.i][hit.j].up) s.sel = hit;
      else if (hit.src === "waste" || (hit.src === "found" && s.found[hit.i].length)) s.sel = hit;
      else s.sel = null;
      if (dbl && s.sel && this.autoFound(s, s.sel)) s.sel = null;
    }
    if (s.found.every((f) => f.length === 13)) { s.over = true; s.score = s.moves; s.overText = `You won in ${s.moves} moves! 🎉`; E.sfx("win"); }
  },
  card(c, x, y, card, hl) {
    if (!card.up) { E.rrect(c, x, y, this.W, this.H, 7, "#1d4ed8"); E.rrect(c, x + 5, y + 5, this.W - 10, this.H - 10, 5, "#2563eb"); return; }
    E.rrect(c, x, y, this.W, this.H, 7, hl ? "#fef08a" : "#fff");
    const col = this.red(card) ? "#dc2626" : "#111", r = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"][card.r], su = "♠♥♦♣"[card.s];
    E.text(c, r + su, x + 6, y + 12, 15, col, "left"); E.text(c, su, x + this.W / 2, y + this.H / 2 + 8, 32, col);
  },
  draw(c, s) {
    E.clear(c, "#166534");
    const empty = (x, y) => { c.strokeStyle = "rgba(255,255,255,.3)"; c.lineWidth = 2; c.strokeRect(x, y, this.W, this.H); };
    empty(40, 15); if (s.stock.length) this.card(c, 40, 15, { up: false }); else E.text(c, "↻", 75, 63, 30, "rgba(255,255,255,.5)");
    empty(144, 15); if (s.waste.length) this.card(c, 144, 15, s.waste[s.waste.length - 1], s.sel && s.sel.src === "waste");
    s.found.forEach((f, i) => { empty(this.tx(3 + i), 15); if (f.length) this.card(c, this.tx(3 + i), 15, f[f.length - 1], s.sel && s.sel.src === "found" && s.sel.i === i); else E.text(c, "♠♥♦♣"[i], this.tx(3 + i) + 35, 63, 28, "rgba(255,255,255,.25)"); });
    s.tab.forEach((p, i) => { empty(this.tx(i), 125); p.forEach((card, j) => this.card(c, this.tx(i), this.ty(p, j), card, s.sel && s.sel.src === "tab" && s.sel.i === i && j >= s.sel.j)); });
    E.text(c, `Moves ${s.moves}`, 790, 440, 13, "#bbf7d0", "right", "bottom");
  },
});
