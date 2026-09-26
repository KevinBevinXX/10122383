// Blackjack vs the dealer. Start with 100 chips.
GAME({
  title: "Blackjack",
  players: 1, touch: "pointer",
  controls: "Choose a bet, then Hit or Stand (Double doubles your bet for one card). Dealer stands on 17. Blackjack pays 3:2. Bust out and it's over.",
  init() { return { chips: 100, bet: 10, phase: "bet", deck: this.deck(), p: [], d: [], msg: "Place your bet", best: 100 }; },
  deck() { return E.shuffle([...Array(52 * 4).keys()].map((i) => ({ r: (i % 13) + 1, s: Math.floor(i / 13) % 4 }))); },
  val(h) { let v = 0, aces = 0; for (const c of h) { v += Math.min(10, c.r); if (c.r === 1) aces++; } while (aces-- && v + 10 <= 21) v += 10; return v; },
  draw1(s) { if (s.deck.length < 20) s.deck = this.deck(); return s.deck.pop(); },
  btn(t, x, y, w = 110, h = 50) { return E.inRect(t, x, y, w, h); },
  settle(s) {
    const pv = this.val(s.p), dv = this.val(s.d), pbj = pv === 21 && s.p.length === 2, dbj = dv === 21 && s.d.length === 2;
    let win = 0;
    if (pv > 21) { s.msg = "Bust!"; win = -1; }
    else if (pbj && !dbj) { s.msg = "Blackjack!"; win = 1.5; }
    else if (dbj && !pbj) { s.msg = "Dealer blackjack"; win = -1; }
    else if (dv > 21) { s.msg = "Dealer busts — you win!"; win = 1; }
    else if (pv > dv) { s.msg = "You win!"; win = 1; }
    else if (pv < dv) { s.msg = "Dealer wins"; win = -1; }
    else s.msg = "Push";
    s.chips += Math.round(s.bet * win); s.best = Math.max(s.best, s.chips);
    E.sfx(win > 0 ? "win" : win < 0 ? "lose" : "pop");
    s.phase = "done";
  },
  update(s, inp, dt) {
    for (const t of inp[0].taps) {
      if (s.phase === "bet") {
        [5, 10, 25, 50].forEach((b, i) => { if (this.btn(t, 170 + i * 120, 330, 100, 44) && b <= s.chips) s.bet = b; });
        if (this.btn(t, 330, 390, 140, 46)) { s.p = [this.draw1(s), this.draw1(s)]; s.d = [this.draw1(s), this.draw1(s)]; s.phase = "play"; s.msg = ""; E.sfx("click"); if (this.val(s.p) === 21) { this.dealer(s); } }
      } else if (s.phase === "play") {
        if (this.btn(t, 200, 370)) { s.p.push(this.draw1(s)); E.sfx("click"); if (this.val(s.p) > 21) this.settle(s); }
        else if (this.btn(t, 345, 370)) this.dealer(s);
        else if (this.btn(t, 490, 370) && s.p.length === 2 && s.chips >= s.bet * 2) { s.bet *= 2; s.p.push(this.draw1(s)); if (this.val(s.p) > 21) this.settle(s); else this.dealer(s); }
      } else if (s.phase === "done" && this.btn(t, 330, 390, 140, 46)) {
        if (s.chips <= 0) { s.over = true; s.score = s.best; s.overText = `Out of chips. Best stack: ${s.best}`; return; }
        s.bet = Math.min(s.bet, s.chips); s.phase = "bet"; s.p = []; s.d = []; s.msg = "Place your bet";
      }
    }
    if (inp[0].pb && s.phase === "done") { s.over = true; s.score = s.chips; s.overText = `Cashed out with ${s.chips} chips`; }
  },
  dealer(s) { while (this.val(s.d) < 17) s.d.push(this.draw1(s)); this.settle(s); },
  card(c, x, y, card, hidden) {
    if (hidden) { E.rrect(c, x, y, 64, 90, 7, "#b91c1c"); E.rrect(c, x + 5, y + 5, 54, 80, 5, "#dc2626"); return; }
    E.rrect(c, x, y, 64, 90, 7, "#fff");
    const red = card.s === 1 || card.s === 2, col = red ? "#dc2626" : "#111";
    E.text(c, ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"][card.r], x + 8, y + 14, 16, col, "left");
    E.text(c, "♠♥♦♣"[card.s], x + 32, y + 52, 30, col);
  },
  button(c, x, y, label, on = true, w = 110, h = 50) { E.rrect(c, x, y, w, h, 10, on ? "#f59e0b" : "#57534e"); E.text(c, label, x + w / 2, y + h / 2, 18, on ? "#1c1917" : "#a8a29e"); },
  draw(c, s) {
    E.clear(c, "#065f46");
    E.text(c, `Chips: ${s.chips}`, 20, 25, 20, "#fde68a", "left"); E.text(c, `Bet: ${s.bet}`, 780, 25, 20, "#fde68a", "right");
    const hideHole = s.phase === "play";
    s.d.forEach((cd, i) => this.card(c, 300 + i * 50, 50, cd, hideHole && i === 1));
    s.p.forEach((cd, i) => this.card(c, 300 + i * 50, 200, cd));
    if (s.d.length) E.text(c, hideHole ? "Dealer" : `Dealer: ${this.val(s.d)}`, 230, 95, 16, "#d1fae5", "right");
    if (s.p.length) E.text(c, `You: ${this.val(s.p)}`, 230, 245, 16, "#d1fae5", "right");
    E.text(c, s.msg, 400, 170, 22, "#fff");
    if (s.phase === "bet") { [5, 10, 25, 50].forEach((b, i) => { E.rrect(c, 170 + i * 120, 330, 100, 44, 22, s.bet === b ? "#fde047" : b <= s.chips ? "#e5e7eb" : "#57534e"); E.text(c, b, 220 + i * 120, 352, 18, "#111"); }); this.button(c, 330, 390, "Deal", true, 140, 46); }
    if (s.phase === "play") { this.button(c, 200, 370, "Hit"); this.button(c, 345, 370, "Stand"); this.button(c, 490, 370, "Double", s.p.length === 2 && s.chips >= s.bet * 2); }
    if (s.phase === "done") { this.button(c, 330, 390, s.chips > 0 ? "Next hand" : "Finish", true, 140, 46); E.text(c, "B = cash out", 400, 445, 11, "#a7f3d0", "center", "bottom"); }
  },
});
