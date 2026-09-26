// Quick maths: answer as many as you can in 60 seconds.
GAME({
  title: "Math Blitz",
  players: 1, touch: "pointer",
  controls: "Tap the right answer (or press 1–4). Wrong answers cost 3 seconds. 60 seconds.",
  init() { const s = { time: 60, score: 0, streak: 0, flash: 0, ok: true }; this.q(s); return s; },
  q(s) {
    const lvl = Math.min(4, 1 + Math.floor(s.score / 5)), op = E.pick(["+", "−", "×", "÷"].slice(0, Math.min(4, 1 + lvl)));
    let a, b, ans;
    if (op === "+") { a = E.randi(2, 10 * lvl + 10); b = E.randi(2, 10 * lvl + 10); ans = a + b; }
    else if (op === "−") { a = E.randi(5, 10 * lvl + 15); b = E.randi(1, a); ans = a - b; }
    else if (op === "×") { a = E.randi(2, 5 + lvl * 2); b = E.randi(2, 9 + lvl); ans = a * b; }
    else { b = E.randi(2, 9 + lvl); ans = E.randi(2, 9 + lvl); a = b * ans; }
    const opts = new Set([ans]); while (opts.size < 4) opts.add(Math.max(0, ans + E.pick([-10, -2, -1, 1, 2, 3, 10, -3]) * E.randi(1, 2)));
    s.text = `${a} ${op} ${b}`; s.ans = ans; s.opts = E.shuffle([...opts]);
  },
  update(s, inp, dt) {
    s.time -= dt; s.flash = Math.max(0, s.flash - dt);
    if (s.time <= 0) { s.over = true; return; }
    let pick = -1;
    for (const key of inp[0].keys) if (/^[1-4]$/.test(key)) pick = +key - 1;
    for (const t of inp[0].taps) s.opts.forEach((_, i) => { if (E.inRect(t, 110 + i * 150, 260, 130, 90)) pick = i; });
    if (pick < 0) return;
    if (s.opts[pick] === s.ans) { s.score++; s.streak++; s.ok = true; E.sfx("coin"); if (s.streak % 5 === 0) s.time += 3; }
    else { s.time -= 3; s.streak = 0; s.ok = false; E.sfx("lose"); }
    s.flash = 0.25; this.q(s);
  },
  draw(c, s) {
    E.clear(c, s.flash ? (s.ok ? "#14532d" : "#7f1d1d") : "#1e1b4b");
    E.text(c, s.text + " = ?", 400, 150, 64);
    s.opts.forEach((o, i) => { E.rrect(c, 110 + i * 150, 260, 130, 90, 14, "#4338ca"); E.text(c, o, 175 + i * 150, 305, 34); E.text(c, i + 1, 125 + i * 150, 275, 12, "#a5b4fc"); });
    E.text(c, `Score ${s.score}`, 20, 25, 22, "#fff", "left"); E.text(c, `${Math.max(0, Math.ceil(s.time))}s`, 780, 25, 22, "#fff", "right");
    if (s.streak >= 3) E.text(c, `🔥 ${s.streak} in a row`, 400, 400, 18, "#fde047");
  },
});
