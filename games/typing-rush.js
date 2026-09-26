// Type the falling words before they land.
GAME({
  title: "Typing Rush",
  players: 1, touch: "pointer",
  controls: "Type the falling words (a physical keyboard works best; on phones tap the letters). Don't let 5 words hit the ground.",
  LIST: "cat dog sun run fox map cup hat pen box jam key top web zip fun big hot red sky ice car bus toy egg fly arm leg ear eye fish frog bird tree rain snow wind moon star ship boat cake milk rock sand gold king jump play fast slow warm cold blue pink ball game code tiger zebra pizza apple lemon mango ocean river cloud storm light music dance happy smile robot rocket planet guitar banana orange purple yellow button winter summer castle dragon wizard puzzle jungle forest island bridge monkey rabbit turtle".split(" "),
  init() { return { words: [], typed: "", target: null, score: 0, miss: 0, next: 0.5, t: 0, fx: [] }; },
  keyAt(t) { const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"]; for (let r = 0; r < 3; r++) { const w = 50, x0 = 400 - (rows[r].length * w) / 2; for (let i = 0; i < rows[r].length; i++) if (E.inRect(t, x0 + i * w, 325 + r * 40, w - 4, 36)) return rows[r][i]; } return null; },
  update(s, inp, dt) {
    s.t += dt; s.next -= dt;
    if (s.next <= 0) { const w = E.pick(this.LIST).toUpperCase(); s.words.push({ w, x: E.rand(60, 740), y: 0, v: 25 + s.t * 0.6 + E.rand(0, 10) }); s.next = Math.max(0.8, 2.6 - s.t / 50); }
    const keys = inp[0].keys.slice(); for (const t of inp[0].taps) { const k = this.keyAt(t); if (k) keys.push(k); }
    for (const k of keys) {
      if (!/^[A-Z]$/.test(k)) continue;
      if (!s.target || !s.words.includes(s.words.find((w) => w === s.target))) {
        const cand = s.words.filter((w) => w.w[0] === k).sort((a, b) => b.y - a.y)[0];
        if (cand) { s.target = cand; s.typed = k; E.sfx("click"); } else E.sfx("hit");
      } else if (s.target.w[s.typed.length] === k) { s.typed += k; E.sfx("click"); }
      else E.sfx("hit");
      if (s.target && s.typed === s.target.w) { s.score += s.target.w.length; s.fx.push({ x: s.target.x, y: s.target.y, t: 0.5 }); s.words.splice(s.words.indexOf(s.target), 1); s.target = null; s.typed = ""; E.sfx("coin"); }
    }
    s.words.forEach((w) => (w.y += w.v * dt));
    s.words = s.words.filter((w) => { if (w.y > 310) { s.miss++; E.sfx("lose"); if (w === s.target) { s.target = null; s.typed = ""; } return false; } return true; });
    s.fx.forEach((f) => (f.t -= dt)); s.fx = s.fx.filter((f) => f.t > 0);
    if (s.miss >= 5) s.over = true;
  },
  draw(c, s) {
    E.clear(c, "#0c0a09"); E.rect(c, 0, 310, 800, 2, "#ef4444");
    s.words.forEach((w) => {
      const tgt = w === s.target;
      c.font = "bold 22px ui-monospace, monospace"; const tw = c.measureText(w.w).width;
      E.rrect(c, w.x - tw / 2 - 8, w.y - 16, tw + 16, 30, 6, tgt ? "#1e3a8a" : "#292524");
      E.text(c, w.w, w.x, w.y, 22, "#e7e5e4");
      if (tgt) { c.font = "bold 22px ui-monospace, monospace"; c.textAlign = "left"; c.fillStyle = "#4ade80"; c.fillText(s.typed, w.x - tw / 2, w.y); }
    });
    s.fx.forEach((f) => E.text(c, "✔", f.x, f.y - (0.5 - f.t) * 60, 26, `rgba(74,222,128,${f.t * 2})`));
    const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
    for (let r = 0; r < 3; r++) { const w = 50, x0 = 400 - (rows[r].length * w) / 2; for (let i = 0; i < rows[r].length; i++) { E.rrect(c, x0 + i * w, 325 + r * 40, w - 4, 36, 5, "#292524"); E.text(c, rows[r][i], x0 + i * w + 23, 343 + r * 40, 15, "#a8a29e"); } }
    E.text(c, `Score ${s.score}   Misses ${s.miss}/5`, 10, 10, 16, "#fff", "left", "top");
  },
});
