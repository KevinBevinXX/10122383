// Game engine shared by every game in /games.
//
// A game calls GAME({...}) with:
//   title, w, h        logical canvas size (default 800x450); draw in these units
//   players            1 or 2
//   ai(s, i)           optional: returns an input for player i when playing vs CPU
//   controls           help text shown on the menu
//   touch              "pad" (d-pad + A/B, default) or "pointer" (tap/drag only)
//   aLabel, bLabel     labels for touch buttons
//   lowScore           true if a lower score is better
//   init(opts)         returns the state. State MUST be plain JSON: it is sent to
//                      the other device every tick in online play.
//   update(s, inp, dt) advance one fixed 1/60 s step. inp[i] is player i's input.
//   draw(c, s)         render. Must not change s (the guest only draws).
// End a round by setting s.over = true plus s.winner (0/1, -1 draw) or s.score.
//
// Input fields: up down left right a b (held), pu pd pl pr pa pb (pressed this
// step), taps [{x,y}] (pointer presses), px py pdown (pointer), keys [typed keys].
(() => {
  "use strict";
  const SITE = "g10122383";
  const DT = 1 / 60;
  const E = (window.E = {});
  let def = null, s = null, c = null, canvas = null, W = 800, H = 450;
  let mode = "solo", me = 0, running = false, overAt = 0;
  let peer = null, conn = null, isHost = false, remoteIn = blank(), sendTimer = 0, fxQueue = [];
  let muted = false, test = false;

  window.GAME = (d) => { def = d; };

  // ---------- helpers games use ----------
  E.rand = (a, b) => a + Math.random() * (b - a);
  E.randi = (a, b) => Math.floor(E.rand(a, b + 1));
  E.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  E.shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  E.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  E.lerp = (a, b, t) => a + (b - a) * t;
  E.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  E.hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  E.inRect = (p, x, y, w, h) => p.x >= x && p.x < x + w && p.y >= y && p.y < y + h;
  E.grid = (w, h, v) => Array.from({ length: h }, () => Array(w).fill(v));
  E.rect = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  E.circle = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, Math.max(0, r), 0, Math.PI * 2); c.fill(); };
  E.ring = (c, x, y, r, col, lw = 2) => { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.arc(x, y, Math.max(0, r), 0, Math.PI * 2); c.stroke(); };
  E.line = (c, x1, y1, x2, y2, col, lw = 2) => { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };
  E.rrect = (c, x, y, w, h, r, col) => { c.fillStyle = col; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };
  E.text = (c, str, x, y, size = 20, col = "#fff", align = "center", base = "middle") => {
    c.fillStyle = col; c.font = `bold ${size}px system-ui, sans-serif`; c.textAlign = align; c.textBaseline = base; c.fillText(str, x, y);
  };
  E.clear = (c, col) => E.rect(c, 0, 0, W, H, col);
  E._debug = () => ({ mode, me, isHost, running, s, def });
  E.me = () => me;          // which player this device controls (-1 = both, local 2P)
  E.mode = () => mode;      // "solo" | "local" | "online"
  E.cpu = () => mode === "solo" && def.players === 2;
  E.turnText = (i) => (E.name(i) === "You" ? "Your turn" : E.name(i) === "CPU" ? "CPU is thinking…" : E.name(i) === "Friend" ? "Friend's turn" : E.name(i) + "'s turn");
  E.name = (i) => (E.cpu() ? (i === 0 ? "You" : "CPU") : mode === "online" ? (i === me ? "You" : "Friend") : "Player " + (i + 1));

  // ---------- sound ----------
  let actx = null;
  const SFX = {
    hit: [220, 0.06, "square"], score: [660, 0.15, "triangle"], jump: [440, 0.08, "square"],
    shoot: [880, 0.05, "sawtooth"], boom: [80, 0.3, "sawtooth"], click: [520, 0.03, "square"],
    win: [784, 0.4, "triangle"], lose: [160, 0.4, "triangle"], coin: [988, 0.1, "square"], pop: [330, 0.05, "sine"],
  };
  function play(name) {
    if (muted || test || !SFX[name]) return;
    try {
      actx = actx || new AudioContext();
      const [f, d, type] = SFX[name], o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.value = f; g.gain.value = 0.08;
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + d);
      o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + d);
    } catch (e) {}
  }
  E.sfx = (name) => { play(name); if (mode === "online" && isHost) fxQueue.push(name); };

  // ---------- input ----------
  function blank() {
    return { up: false, down: false, left: false, right: false, a: false, b: false,
      pu: false, pd: false, pl: false, pr: false, pa: false, pb: false, taps: [], px: 0, py: 0, pdown: false, keys: [] };
  }
  const local = [blank(), blank()];
  const MAP_SOLO = { KeyW: "up", ArrowUp: "up", KeyS: "down", ArrowDown: "down", KeyA: "left", ArrowLeft: "left", KeyD: "right", ArrowRight: "right",
    Space: "a", KeyF: "a", KeyJ: "a", KeyZ: "a", Enter: "a", KeyG: "b", KeyK: "b", KeyX: "b", ShiftLeft: "b", ShiftRight: "b" };
  const MAP_P1 = { KeyW: "up", KeyS: "down", KeyA: "left", KeyD: "right", KeyF: "a", Space: "a", KeyG: "b" };
  const MAP_P2 = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", Enter: "a", Period: "a", Numpad0: "a", ShiftRight: "b", Slash: "b" };
  const EDGE = { up: "pu", down: "pd", left: "pl", right: "pr", a: "pa", b: "pb" };
  function keyTarget(code) {
    if (mode === "local") {
      if (MAP_P1[code]) return [0, MAP_P1[code]];
      if (MAP_P2[code]) return [1, MAP_P2[code]];
      return null;
    }
    return MAP_SOLO[code] ? [slot(), MAP_SOLO[code]] : null;
  }
  const slot = () => (me < 0 ? 0 : me);
  function setKey(code, down) {
    const t = keyTarget(code);
    if (!t) return false;
    const p = local[t[0]];
    if (down && !p[t[1]]) p[EDGE[t[1]]] = true;
    p[t[1]] = down;
    return true;
  }
  addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return;
    if (!running) return;
    if (!e.repeat && (e.key.length === 1 || e.key === "Backspace" || e.key === "Enter")) local[slot()].keys.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
    if (setKey(e.code, true) || e.key === "Backspace") e.preventDefault();
  });
  addEventListener("keyup", (e) => setKey(e.code, false));
  addEventListener("blur", () => local.forEach((p) => ["up", "down", "left", "right", "a", "b"].forEach((k) => (p[k] = false))));

  function toLogical(e) {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  }
  // In local 2P the one screen is shared, so pointer input goes to both players;
  // turn-based games read the input of whoever's turn it is.
  const pointerTargets = () => (mode === "local" ? [0, 1] : [slot()]);
  function bindPointer() {
    canvas.addEventListener("pointerdown", (e) => {
      if (!running) return;
      const p = toLogical(e);
      canvas.setPointerCapture(e.pointerId);
      for (const i of pointerTargets()) { local[i].taps.push(p); local[i].px = p.x; local[i].py = p.y; local[i].pdown = true; }
      e.preventDefault();
    });
    canvas.addEventListener("pointermove", (e) => {
      const p = toLogical(e);
      for (const i of pointerTargets()) { local[i].px = p.x; local[i].py = p.y; }
    });
    const up = () => { for (const i of pointerTargets()) local[i].pdown = false; };
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  function buildTouchPad() {
    if (def.touch === "pointer" || !matchMedia("(pointer: coarse)").matches) return;
    const pad = document.getElementById("pad");
    pad.hidden = false;
    pad.querySelector('[data-k="a"]').textContent = def.aLabel || "A";
    const b = pad.querySelector('[data-k="b"]');
    if (def.bLabel === false) b.hidden = true; else b.textContent = def.bLabel || "B";
    pad.querySelectorAll("[data-k]").forEach((el) => {
      const k = el.dataset.k;
      const set = (v) => (e) => { e.preventDefault(); const p = local[slot()]; if (v && !p[k]) p[EDGE[k]] = true; p[k] = v; el.classList.toggle("on", v); };
      el.addEventListener("pointerdown", set(true));
      el.addEventListener("pointerup", set(false));
      el.addEventListener("pointerleave", set(false));
      el.addEventListener("pointercancel", set(false));
    });
  }

  function takeInput(p) {
    const snap = JSON.parse(JSON.stringify(p));
    p.pu = p.pd = p.pl = p.pr = p.pa = p.pb = false; p.taps = []; p.keys = [];
    return snap;
  }
  function mergeRemote(m) {
    for (const k of ["up", "down", "left", "right", "a", "b", "px", "py", "pdown"]) remoteIn[k] = m[k];
    for (const k of ["pu", "pd", "pl", "pr", "pa", "pb"]) remoteIn[k] = remoteIn[k] || m[k];
    remoteIn.taps.push(...m.taps); remoteIn.keys.push(...m.keys);
  }
  function fill(p) { return Object.assign(blank(), p || {}); }

  // ---------- loop ----------
  function newRound() {
    s = def.init({ mode, cpu: E.cpu() });
    overAt = 0;
    hideOverlay();
  }
  function gatherInputs() {
    const inp = [];
    if (mode === "online") {
      inp[0] = takeInput(local[0]);
      inp[1] = takeInput(remoteIn);
    } else {
      inp[0] = takeInput(local[0]);
      inp[1] = mode === "local" ? takeInput(local[1]) : fill(def.ai ? def.ai(s, 1) : null);
    }
    return inp;
  }
  function step() {
    const inp = gatherInputs();
    if (s.over) {
      if (!overAt) { overAt = performance.now(); showResult(); }
      const again = inp.some((p) => p.pa || p.taps.length || p.keys.includes("Enter"));
      if (again && performance.now() - overAt > 600) newRound();
      return;
    }
    def.update(s, inp, DT);
  }
  let last = 0, acc = 0;
  function frame(t) {
    requestAnimationFrame(frame);
    if (!running) return;
    const guest = mode === "online" && !isHost;
    if (!guest) {
      acc += Math.min(0.1, (t - (last || t)) / 1000);
      while (acc >= DT) { step(); acc -= DT; }
      if (mode === "online" && conn && (sendTimer = (sendTimer + 1) % 2) === 0) {
        conn.send({ t: "s", s, fx: fxQueue }); fxQueue = [];
      }
    } else if (conn) {
      const p = takeInput(local[me]);
      conn.send({ t: "i", i: p });
      if (s && s.over && !overAt) { overAt = performance.now(); showResult(); }
      if (s && !s.over && overAt) { overAt = 0; hideOverlay(); }
    }
    last = t;
    if (s) render();
  }
  function render() {
    const k = canvas.width / W;
    c.setTransform(k, 0, 0, k, 0, 0);
    c.clearRect(0, 0, W, H);
    def.draw(c, s);
  }

  function fit() {
    const st = document.getElementById("stage"), cs = getComputedStyle(st);
    const bw = st.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const bh = st.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const scale = Math.max(0.1, Math.min(bw / W, bh / H));
    const cw = Math.floor(W * scale), ch = Math.floor(H * scale), dpr = devicePixelRatio || 1;
    canvas.style.width = cw + "px"; canvas.style.height = ch + "px";
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    if (s) render();
  }

  // ---------- overlay / menu ----------
  const $ = (id) => document.getElementById(id);
  function overlay(html) { $("overlay").innerHTML = html; $("overlay").hidden = false; }
  function hideOverlay() { $("overlay").hidden = true; }
  const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

  function showResult() {
    let head;
    if (s.overText) head = s.overText;
    else if (s.winner === -1) head = "It's a draw!";
    else if (s.winner !== undefined) {
      const n = E.name(s.winner);
      head = n === "You" ? "You win! 🎉" : n === "CPU" || n === "Friend" ? n + " wins" : n + " wins! 🎉";
    } else head = "Game over";
    let sub = "";
    if (typeof s.score === "number" && s.winner === undefined && !s.lost) {
      const key = "best:" + def.id, prev = Number(localStorage.getItem(key) || (def.lowScore ? Infinity : 0));
      const better = def.lowScore ? s.score < prev : s.score > prev;
      if (better && !(mode === "online" && !isHost)) try { localStorage.setItem(key, s.score); } catch (e) {}
      sub = `Score: ${s.score}` + (better ? " — new best!" : ` · Best: ${prev}`);
    }
    play(s.winner === undefined || E.name(s.winner) === "You" || mode === "local" ? "win" : "lose");
    const guest = mode === "online" && !isHost;
    overlay(`<h2>${esc(head)}</h2><p>${esc(sub)}</p><p class="hint">${guest ? "Tap or press Space to ask for a rematch" : "Tap or press Space to play again"}</p>`);
  }

  function menu() {
    running = false;
    const best = localStorage.getItem("best:" + def.id);
    const two = def.players === 2;
    overlay(`<h2>${esc(def.title)}</h2>
      <p class="controls">${esc(def.controls || "")}</p>
      ${best ? `<p class="hint">Best: ${esc(best)}</p>` : ""}
      <div class="btns">
        ${!two || def.ai ? `<button data-m="solo">${two ? "▶ Play vs CPU" : "▶ Play"}</button>` : ""}
        ${two ? `<button data-m="local">👥 2 Players · this device</button>
        <button data-m="host">🌐 Host online game</button>
        <button data-m="join">🔗 Join online game</button>` : ""}
      </div>
      ${two ? `<p class="hint">Same device: Player 1 uses WASD + F/G, Player 2 uses arrows + Enter/Shift.</p>` : ""}`);
    $("overlay").querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => choose(b.dataset.m)));
  }
  function choose(m) {
    if (m === "solo" || m === "local") { mode = m; me = m === "local" ? -1 : 0; begin(); }
    else if (m === "host") host();
    else joinPrompt();
  }
  function begin() { running = true; newRound(); last = 0; acc = 0; canvas.focus(); }

  // ---------- online (PeerJS / WebRTC) ----------
  const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const makeCode = () => Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
  function peerError(err) {
    const msg = {
      "peer-unavailable": "No game found with that code. Check the code and that the host is still waiting.",
      "browser-incompatible": "This browser can't do online play.",
      network: "Couldn't reach the connection server. Check your internet.",
    }[err.type] || "Connection problem: " + err.type;
    overlay(`<h2>Couldn't connect</h2><p>${esc(msg)}</p><div class="btns"><button id="back">Back</button></div>`);
    $("back").onclick = () => { cleanupPeer(); menu(); };
  }
  function cleanupPeer() { try { conn && conn.close(); peer && peer.destroy(); } catch (e) {} conn = peer = null; }

  function host(tries = 0) {
    const code = makeCode();
    overlay(`<h2>Starting…</h2>`);
    peer = new Peer(SITE + "-" + code);
    peer.on("error", (err) => {
      if (err.type === "unavailable-id" && tries < 5) { cleanupPeer(); host(tries + 1); } else peerError(err);
    });
    peer.on("open", () => {
      const link = location.origin + location.pathname + "?join=" + code;
      overlay(`<h2>Waiting for your friend…</h2>
        <p>On the other device, open this site, press <b>Join a friend</b>, and type:</p>
        <div class="code">${code}</div>
        <p class="hint">Or open this link there: <br><a href="${esc(link)}">${esc(link)}</a></p>
        <div class="btns"><button id="cancel">Cancel</button></div>`);
      $("cancel").onclick = () => { cleanupPeer(); menu(); };
    });
    peer.on("connection", (cn) => {
      if (conn) { cn.on("open", () => { cn.send({ t: "full" }); setTimeout(() => cn.close(), 500); }); return; }
      conn = cn;
      conn.on("open", () => {
        isHost = true; mode = "online"; me = 0; remoteIn = blank();
        conn.send({ t: "hello", game: def.id });
        begin();
      });
      conn.on("data", (m) => { if (m.t === "i") mergeRemote(m.i); });
      conn.on("close", lost);
    });
  }
  function joinPrompt(prefill = "") {
    overlay(`<h2>Join online game</h2><p>Type the code shown on your friend's screen.</p>
      <input id="code" maxlength="5" autocomplete="off" autocapitalize="characters" value="${esc(prefill)}" placeholder="ABCDE">
      <div class="btns"><button id="go">Join</button><button id="back">Back</button></div>`);
    const go = () => { const v = $("code").value.trim().toUpperCase(); if (v.length === 5) join(v); };
    $("go").onclick = go;
    $("code").onkeydown = (e) => e.key === "Enter" && go();
    $("back").onclick = () => (def ? menu() : (location.href = "index.html"));
    $("code").focus();
  }
  function join(code) {
    overlay(`<h2>Connecting…</h2><p>Code ${esc(code)}</p>`);
    peer = new Peer();
    peer.on("error", peerError);
    peer.on("open", () => {
      conn = peer.connect(SITE + "-" + code, { serialization: "json", reliable: true });
      conn.on("data", async (m) => {
        if (m.t === "full") { overlay(`<h2>That game is full</h2><p>Someone already joined.</p>`); return; }
        if (m.t === "hello") {
          if (!def || def.id !== m.game) await loadGame(m.game);
          isHost = false; mode = "online"; me = 1; running = true; hideOverlay();
          history.replaceState(null, "", "?g=" + m.game);
        } else if (m.t === "s") {
          s = m.s;
          m.fx.forEach(play);
        }
      });
      conn.on("close", lost);
    });
  }
  function lost() {
    if (!running) return;
    running = false; conn = null;
    overlay(`<h2>Your friend left</h2><p>The online game ended.</p><div class="btns"><button id="back">Back to menu</button></div>`);
    $("back").onclick = () => { cleanupPeer(); s = null; menu(); };
  }

  // ---------- boot ----------
  function loadGame(id) {
    return new Promise((ok, fail) => {
      if (!/^[a-z0-9-]+$/.test(id)) return fail(new Error("bad game id"));
      const sc = document.createElement("script");
      sc.src = "games/" + id + ".js";
      sc.onload = () => { def.id = id; setup(); ok(); };
      sc.onerror = () => fail(new Error("game not found: " + id));
      document.head.appendChild(sc);
    });
  }
  function setup() {
    W = typeof def.w === "number" ? def.w : 800; H = typeof def.h === "number" ? def.h : 450;
    document.title = def.title + " · Game Hub";
    $("title").textContent = def.title;
    canvas = $("game");
    c = canvas.getContext("2d");
    bindPointer();
    buildTouchPad();
    new ResizeObserver(fit).observe(document.getElementById("stage"));
    fit();
  }

  function runTest() {
    // Automated smoke test: random inputs for both players, with the state round-tripped
    // through JSON the way online play does, and CPU input when the game has an AI.
    const r = () => Math.random() < 0.3;
    const randIn = () => fill({ up: r(), down: r(), left: r(), right: r(), a: r(), b: r(), pu: r(), pd: r(), pl: r(), pr: r(), pa: r(), pb: r(),
      taps: Math.random() < 0.2 ? [{ x: Math.random() * W, y: Math.random() * H }] : [], px: Math.random() * W, py: Math.random() * H, pdown: r(),
      keys: Math.random() < 0.2 ? [E.pick("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").concat(["Enter", "Backspace"]))] : [] });
    let rounds = 0, ticks = 0;
    for (const m of def.players === 2 ? (def.ai ? ["solo", "local"] : ["local"]) : ["solo"]) {
      mode = m; me = m === "local" ? -1 : 0;
      s = def.init({ mode, cpu: E.cpu() });
      for (let i = 0; i < 3000; i++, ticks++) {
        if (s.over) { rounds++; s = def.init({ mode, cpu: E.cpu() }); }
        const inp = [randIn(), E.cpu() ? fill(def.ai(s, 1)) : randIn()];
        def.update(s, inp, DT);
        if (i % 50 === 0) { s = JSON.parse(JSON.stringify(s)); render(); }
      }
    }
    let cpuRounds = 0;
    if (def.players === 2 && def.ai) {
      // CPU vs CPU plays real games, which random input rarely manages in board games
      mode = "solo"; me = 0;
      s = def.init({ mode, cpu: true });
      for (let i = 0; i < 12000 && cpuRounds < 3; i++, ticks++) {
        if (s.over) { cpuRounds++; s = def.init({ mode, cpu: true }); }
        def.update(s, [fill(def.ai(s, 0)), fill(def.ai(s, 1))], DT);
        if (i % 50 === 0) { s = JSON.parse(JSON.stringify(s)); render(); }
      }
    }
    let cpuWins = 0;
    if (def.players === 2 && def.ai) {
      // CPU vs a player who does nothing: proves the CPU can actually win
      s = def.init({ mode, cpu: true });
      for (let i = 0; i < 12000 && !s.over; i++, ticks++) def.update(s, [blank(), fill(def.ai(s, 1))], DT);
      cpuWins = s.over && s.winner === 1 ? 1 : 0;
    }
    return `OK ticks=${ticks} rounds=${rounds}` + (def.players === 2 && def.ai ? ` cpu-vs-cpu=${cpuRounds} cpu-beats-idle=${cpuWins ? "yes" : "NO"}` : "");
  }

  window.addEventListener("DOMContentLoaded", async () => {
    const q = new URLSearchParams(location.search);
    const id = q.get("g"), joinCode = q.get("join");
    test = q.has("test");
    try {
      if (id) await loadGame(id);
    } catch (e) {
      overlay(`<h2>Game not found</h2><div class="btns"><a class="btn" href="index.html">Back</a></div>`);
      return;
    }
    if (test) {
      try { document.title = runTest(); } catch (e) { document.title = "ERR " + e.message + " @ " + (e.stack || "").split("\n")[1]; }
      return;
    }
    $("mute").onclick = () => { muted = !muted; $("mute").textContent = muted ? "🔇" : "🔊"; };
    $("full").onclick = () => document.documentElement.requestFullscreen?.();
    requestAnimationFrame(frame);
    if (joinCode) joinPrompt(joinCode.toUpperCase());
    else menu();
  });
  window.addEventListener("error", (e) => { if (!test) console.error(e.error); });
})();
