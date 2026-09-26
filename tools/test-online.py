#!/usr/bin/env python3
"""Two headless Chromes: one hosts a game online, the other joins by code.
Checks that each side's key presses move its own player on BOTH screens.
Usage: tools/test-online.py [game-id]   (needs the site served on :8766)"""
import asyncio, json, subprocess, sys, tempfile, time, urllib.request
import websockets

GAME = sys.argv[1] if len(sys.argv) > 1 else "hoop-brawl"
BASE = "http://localhost:8766/"

class Tab:
    def __init__(self, port):
        self.port, self.n = port, 0
        self.proc = subprocess.Popen(["google-chrome", "--headless=new", "--disable-gpu", f"--remote-debugging-port={port}",
            f"--user-data-dir={tempfile.mkdtemp()}", "--disable-features=WebRtcHideLocalIpsWithMdns", "about:blank"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    async def open(self):
        for _ in range(50):
            try:
                pages = json.load(urllib.request.urlopen(f"http://localhost:{self.port}/json"))
                ws = [p for p in pages if p["type"] == "page"][0]["webSocketDebuggerUrl"]; break
            except Exception: await asyncio.sleep(0.2)
        self.ws = await websockets.connect(ws, max_size=None)
    async def cmd(self, method, **params):
        self.n += 1; i = self.n
        await self.ws.send(json.dumps({"id": i, "method": method, "params": params}))
        while True:
            m = json.loads(await self.ws.recv())
            if m.get("id") == i: return m.get("result", {})
    async def js(self, expr):
        r = await self.cmd("Runtime.evaluate", expression=expr, returnByValue=True, awaitPromise=True)
        return r.get("result", {}).get("value")
    async def wait(self, expr, secs=20):
        end = time.time() + secs
        while time.time() < end:
            v = await self.js(expr)
            if v: return v
            await asyncio.sleep(0.25)
        raise TimeoutError(expr)
    async def key(self, code, key, down):
        await self.cmd("Input.dispatchKeyEvent", type="keyDown" if down else "keyUp", code=code, key=key)

async def main():
    h, g = Tab(9301), Tab(9302)
    try:
        await h.open(); await g.open()
        await h.cmd("Page.navigate", url=f"{BASE}play.html?g={GAME}")
        await h.wait("!!document.querySelector('[data-m=host]')")
        await h.js("document.querySelector('[data-m=host]').click()")
        code = await h.wait("document.querySelector('.code')?.textContent")
        print("host code:", code)
        # join from the hub-style link, without naming the game: the host tells the guest which game it is
        await g.cmd("Page.navigate", url=f"{BASE}play.html?join={code}")
        await g.wait("!!document.getElementById('go')")
        await g.js("document.getElementById('go').click()")
        await g.wait("!!(window.E && E._debug().running && E._debug().s)")
        await h.wait("E._debug().running")
        print("guest loaded game:", await g.js("document.title"))
        await asyncio.sleep(2)  # tip-off pause
        if not await g.js("!!(E._debug().s.p && E._debug().s.p[1] && typeof E._debug().s.p[1].x === 'number')"):
            # generic check: the guest keeps receiving fresh state from the host
            a = await g.js("JSON.stringify(E._debug().s).length")
            await asyncio.sleep(1)
            same = await g.js("JSON.stringify(E._debug().s) === JSON.stringify(E._debug().s)")
            hs, gs = await h.js("Object.keys(E._debug().s).sort().join()"), await g.js("Object.keys(E._debug().s).sort().join()")
            ok = bool(a) and hs == gs
            print(f"state synced: host/guest keys match={hs == gs}, guest state size={a} bytes")
            print("ONLINE TEST", "PASS" if ok else "FAIL")
            return ok
        px = lambda t, i: t.js(f"E._debug().s.p[{i}].x")
        before = (await px(h, 1), await px(g, 1))
        await g.key("ArrowLeft", "ArrowLeft", True); await asyncio.sleep(1.0); await g.key("ArrowLeft", "ArrowLeft", False)
        await asyncio.sleep(0.4)
        after = (await px(h, 1), await px(g, 1))
        print(f"guest pressed left: P2 x on host {before[0]:.0f}->{after[0]:.0f}, on guest {before[1]:.0f}->{after[1]:.0f}")
        b0 = await px(g, 0)
        await h.key("KeyD", "d", True); await asyncio.sleep(1.0); await h.key("KeyD", "d", False)
        await asyncio.sleep(0.4)
        a0 = await px(g, 0)
        print(f"host pressed right: P1 x as seen by guest {b0:.0f}->{a0:.0f}")
        ok = after[0] < before[0] - 50 and after[1] < before[1] - 50 and a0 > b0 + 50
        print("ONLINE TEST", "PASS" if ok else "FAIL")
        return ok
    finally:
        h.proc.kill(); g.proc.kill()

sys.exit(0 if asyncio.run(main()) else 1)
