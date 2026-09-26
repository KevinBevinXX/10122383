// Fly down a spinning tunnel. Rotate to dodge the walls.
GAME({
  title: "Neon Tunnel",
  players: 1,
  controls: "◀ ▶ (or hold the left/right side of the screen) to rotate the tunnel. Slip through the gaps.",
  aLabel: "·", bLabel: false,
  N: 8,
  init() { return { rot: 0, rings: [], z: 0, spd: 5, score: 0, t: 0 }; },
  update(s, inp, dt) {
    const k = inp[0];
    let d = (k.right ? 1 : 0) - (k.left ? 1 : 0);
    if (k.pdown) d = k.px > 400 ? 1 : -1;
    s.rot += d * 3.2 * dt; s.t += dt;
    s.spd = 5 + s.t * 0.08;
    s.z += s.spd * dt;
    while (s.rings.length < 12) {
      const last = s.rings.length ? s.rings[s.rings.length - 1].z : s.z + 4;
      const open = E.randi(0, this.N - 1), wide = E.randi(1, s.t > 40 ? 2 : 3);
      const blocked = Array.from({ length: this.N }, (_, i) => { const dd = (i - open + this.N) % this.N; return dd >= wide; });
      s.rings.push({ z: last + E.rand(2.2, 3.4), blocked });
    }
    const seg = (2 * Math.PI) / this.N;
    s.rings = s.rings.filter((r) => {
      if (r.z <= s.z && !r.passed) {
        r.passed = true;
        // player sits at the bottom of the screen (angle π/2) in tunnel coordinates
        const a = (((Math.PI / 2 - s.rot) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), i = Math.floor(a / seg);
        if (r.blocked[i]) { s.over = true; E.sfx("boom"); } else { s.score++; E.sfx("pop"); }
      }
      return r.z > s.z - 0.5;
    });
  },
  draw(c, s) {
    E.clear(c, "#05010f");
    const seg = (2 * Math.PI) / this.N, hue = (s.t * 20) % 360;
    for (let i = s.rings.length - 1; i >= 0; i--) {
      const r = s.rings[i], dz = r.z - s.z; if (dz <= 0.05) continue;
      const R = 260 / dz;
      r.blocked.forEach((b, j) => {
        if (!b) return;
        const a0 = j * seg + s.rot, a1 = a0 + seg;
        c.fillStyle = `hsla(${hue + i * 12},90%,${Math.max(20, 60 - dz * 3)}%,.9)`;
        c.beginPath(); c.arc(400, 225, R, a0, a1); c.arc(400, 225, R * 0.72, a1, a0, true); c.fill();
      });
    }
    for (let j = 0; j < this.N; j++) { const a = j * seg + s.rot; E.line(c, 400, 225, 400 + Math.cos(a) * 600, 225 + Math.sin(a) * 600, "rgba(255,255,255,.06)", 1); }
    E.circle(c, 400, 400, 12, "#fff"); E.circle(c, 400, 400, 20, "rgba(255,255,255,.2)");
    E.text(c, s.score, 400, 40, 32, "#fff");
  },
});
