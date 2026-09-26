// Hangman with categories.
GAME({
  title: "Hangman",
  players: 1, touch: "pointer",
  controls: "Type letters or tap them. 6 wrong guesses and it's over. Solve as many words as you can.",
  CATS: {
    Animals: "ELEPHANT GIRAFFE PENGUIN DOLPHIN KANGAROO CROCODILE BUTTERFLY SQUIRREL OCTOPUS CHEETAH HEDGEHOG FLAMINGO GORILLA HAMSTER JELLYFISH TORTOISE RACCOON LOBSTER PELICAN PANTHER",
    Foods: "SPAGHETTI PANCAKE BURRITO AVOCADO BROCCOLI CUPCAKE SANDWICH PRETZEL LASAGNA MUSHROOM PINEAPPLE CHEESECAKE DUMPLING POPCORN BLUEBERRY OMELETTE MEATBALL WATERMELON CROISSANT PEPPERONI",
    Countries: "AUSTRALIA BRAZIL CANADA DENMARK EGYPT FRANCE GERMANY ICELAND JAPAN KENYA MEXICO NORWAY PORTUGAL SWEDEN THAILAND VIETNAM ARGENTINA IRELAND MOROCCO SINGAPORE",
    Sports: "BASKETBALL FOOTBALL BASEBALL VOLLEYBALL SWIMMING GYMNASTICS WRESTLING BADMINTON SKATEBOARD ARCHERY BOWLING CYCLING HOCKEY LACROSSE SURFING TENNIS CRICKET FENCING KARATE ROWING",
    Space: "ASTEROID GALAXY NEBULA SATELLITE TELESCOPE ASTRONAUT JUPITER SATURN NEPTUNE MERCURY ECLIPSE COMET METEOR ROCKET GRAVITY UNIVERSE PLANET ORBIT LUNAR SPACESHIP",
  },
  init() { const s = { score: 0 }; this.word(s); return s; },
  word(s) { const cat = E.pick(Object.keys(this.CATS)); s.cat = cat; s.w = E.pick(this.CATS[cat].split(" ")); s.guessed = []; s.wrong = 0; s.pause = 0; },
  keyAt(t) { for (let i = 0; i < 26; i++) { const x = 140 + (i % 13) * 40, y = 330 + Math.floor(i / 13) * 48; if (E.inRect(t, x, y, 36, 42)) return String.fromCharCode(65 + i); } return null; },
  update(s, inp, dt) {
    if (s.pause > 0) { s.pause -= dt; if (s.pause <= 0) { if (s.wrong >= 6) { s.over = true; s.overText = `The word was ${s.w}. You solved ${s.score}.`; return; } this.word(s); } return; }
    const keys = inp[0].keys.slice();
    for (const t of inp[0].taps) { const k = this.keyAt(t); if (k) keys.push(k); }
    for (const k of keys) {
      if (!/^[A-Z]$/.test(k) || s.guessed.includes(k)) continue;
      s.guessed.push(k);
      if (s.w.includes(k)) { E.sfx("pop"); if ([...s.w].every((ch) => s.guessed.includes(ch))) { s.score++; s.pause = 1.2; E.sfx("win"); break; } }
      else { s.wrong++; E.sfx("hit"); if (s.wrong >= 6) { s.pause = 1.5; E.sfx("lose"); break; } }
    }
  },
  draw(c, s) {
    E.clear(c, "#fef9c3");
    E.line(c, 80, 290, 220, 290, "#78350f", 5); E.line(c, 120, 290, 120, 40, "#78350f", 5); E.line(c, 120, 40, 200, 40, "#78350f", 5); E.line(c, 200, 40, 200, 70, "#78350f", 3);
    const w = s.wrong;
    if (w > 0) E.ring(c, 200, 90, 20, "#111", 3);
    if (w > 1) E.line(c, 200, 110, 200, 180, "#111", 3);
    if (w > 2) E.line(c, 200, 130, 170, 160, "#111", 3);
    if (w > 3) E.line(c, 200, 130, 230, 160, "#111", 3);
    if (w > 4) E.line(c, 200, 180, 175, 230, "#111", 3);
    if (w > 5) E.line(c, 200, 180, 225, 230, "#111", 3);
    E.text(c, `Category: ${s.cat}`, 520, 60, 20, "#78350f");
    const n = s.w.length, sp = Math.min(40, 440 / n);
    [...s.w].forEach((ch, i) => { const x = 520 - (n * sp) / 2 + i * sp + sp / 2; E.line(c, x - sp / 2 + 4, 200, x + sp / 2 - 4, 200, "#111", 3); if (s.guessed.includes(ch) || (s.pause && s.wrong >= 6)) E.text(c, ch, x, 180, 26, s.guessed.includes(ch) ? "#111" : "#dc2626"); });
    for (let i = 0; i < 26; i++) {
      const ch = String.fromCharCode(65 + i), x = 140 + (i % 13) * 40, y = 330 + Math.floor(i / 13) * 48, g = s.guessed.includes(ch);
      E.rrect(c, x, y, 36, 42, 6, g ? (s.w.includes(ch) ? "#86efac" : "#fca5a5") : "#fde68a"); E.text(c, ch, x + 18, y + 22, 18, g ? "#6b7280" : "#78350f");
    }
    E.text(c, `Solved: ${s.score}`, 700, 290, 18, "#78350f");
  },
});
