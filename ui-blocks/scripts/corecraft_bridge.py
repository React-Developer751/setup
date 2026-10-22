"""A small HTTP bridge to Core-Craft AI (the `cont` folder next to this project): the Content AI is only imported, never changed.

  python3 scripts/corecraft_bridge.py --port 8100            (or: npm run corecraft)

GET  /health                          -> {"ok": true, "model": true|false}
POST /generate {"prompt", "seed"?, "n"?}  -> {"niche", "candidates": [one Core-Craft page of copy per seed]}
POST /page {"prompt", "seed"?, "lang"?}   -> {"page": the whole page of copy (services of the prompt, place, Hindi when asked), with what to check}

Only text slots are returned (no stats: Core-Craft invents numbers, this project never shows invented numbers). Pure standard library.
"""
import argparse
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = Path(os.environ.get("CORECRAFT_DIR", HERE.parent.parent.parent / "cont")).resolve()
sys.dont_write_bytecode = True
if not (ROOT / "corecraft" / "content_engine.py").exists():
    sys.exit("Core-Craft was not found in %s (set CORECRAFT_DIR to the folder that holds corecraft/)" % ROOT)
sys.path.insert(0, str(ROOT))
from corecraft import content_engine  # noqa: E402
from corecraft.ngram_model import Model  # noqa: E402

SLOTS = ("niche", "brand", "hero_heading", "tagline", "cta_primary", "cta_secondary", "cta_text", "about", "features", "generated_by")


def candidates(prompt, seed, n):
    out = []
    for i in range(n):
        s = (seed or 1) + i * 7919
        try:
            page = content_engine.generate_content(prompt, s)
        except ValueError:
            continue
        item = {k: page[k] for k in SLOTS if k in page}
        item["seed"] = s
        out.append(item)
    return out


class Handler(BaseHTTPRequestHandler):
    def _send(self, status, body):
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("content-type", "application/json; charset=utf-8")
        self.send_header("content-length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path.split("?")[0] == "/health":
            return self._send(200, {"ok": True, "model": Model.load() is not None})
        self._send(404, {"error": "not found"})

    def do_POST(self):
        route = self.path.split("?")[0]
        if route not in ("/generate", "/page"):
            return self._send(404, {"error": "not found"})
        try:
            body = json.loads(self.rfile.read(min(int(self.headers.get("content-length") or 0), 20_000)) or b"{}")
        except ValueError:
            return self._send(400, {"error": "bad json"})
        prompt = str(body.get("prompt", "")).strip()[:300]
        if len(prompt) < 2:
            return self._send(400, {"error": "prompt is needed"})
        seed = body.get("seed")
        if route == "/page":
            try:
                lang = body.get("lang") if body.get("lang") in ("en", "hi") else None
                return self._send(200, {"page": content_engine.generate_content(prompt, int(seed) if isinstance(seed, int) else 1, lang=lang)})
            except (ValueError, KeyError) as e:
                return self._send(422, {"error": str(e)})
        n = max(1, min(8, int(body.get("n") or 4)))
        cands = candidates(prompt, int(seed) if isinstance(seed, int) else None, n)
        self._send(200, {"niche": cands[0]["niche"] if cands else None, "candidates": cands})

    def log_message(self, *args):
        pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=int(os.environ.get("CORECRAFT_PORT", "8100")))
    ap.add_argument("--host", default="127.0.0.1")
    a = ap.parse_args()
    Model.load()  # parse the trained model once, not on the first request
    print("Core-Craft bridge on http://%s:%d  (Core-Craft in %s)" % (a.host, a.port, ROOT), flush=True)
    ThreadingHTTPServer((a.host, a.port), Handler).serve_forever()


if __name__ == "__main__":
    main()
