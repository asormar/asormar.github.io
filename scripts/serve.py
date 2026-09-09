"""Development server for the portfolio.

Identical to `python -m http.server` except that it refuses to let the browser
cache anything. Plain http.server sends Last-Modified with no Cache-Control,
so Chrome heuristically caches the ES module and keeps running an old app.js
after an edit — which looks exactly like a bug in the code you just wrote.

    python scripts/serve.py [port]
"""

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s\n" % (fmt % args))


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8123
handler = partial(NoCacheHandler, directory=str(ROOT))
print(f"http://localhost:{port} — sirviendo {ROOT} sin caché")
ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()
