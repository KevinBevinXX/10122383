#!/usr/bin/env python3
"""Evaluate JS in a headless Chrome page and print the result. Usage: js-eval.py URL 'expression'"""
import asyncio, json, subprocess, sys, tempfile, time, urllib.request
import websockets
async def main(url, expr):
    p = subprocess.Popen(["google-chrome", "--headless=new", "--disable-gpu", "--remote-debugging-port=9311", f"--user-data-dir={tempfile.mkdtemp()}", url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try: ws = [x for x in json.load(urllib.request.urlopen("http://localhost:9311/json")) if x["type"] == "page"][0]["webSocketDebuggerUrl"]; break
            except Exception: await asyncio.sleep(0.2)
        async with websockets.connect(ws, max_size=None) as w:
            await asyncio.sleep(1.5)
            await w.send(json.dumps({"id": 1, "method": "Runtime.evaluate", "params": {"expression": expr, "returnByValue": True, "awaitPromise": True}}))
            while True:
                m = json.loads(await w.recv())
                if m.get("id") == 1: print(json.dumps(m["result"].get("result", {}).get("value", m["result"]), indent=None)); break
    finally: p.kill()
asyncio.run(main(sys.argv[1], sys.argv[2]))
