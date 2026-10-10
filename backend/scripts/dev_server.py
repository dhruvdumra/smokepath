"""Local dev server: /data/* from data/out, /api/* through the real Lambda handler. Port 8787."""
import json
import mimetypes
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qsl, urlsplit

ROOT = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, ROOT)
from handlers import api  # noqa: E402

OUT = os.path.join(ROOT, "..", "data", "out")


class H(BaseHTTPRequestHandler):
    def _api(self, method):
        u = urlsplit(self.path)
        n = int(self.headers.get("Content-Length") or 0)
        event = {"rawPath": u.path, "queryStringParameters": dict(parse_qsl(u.query)),
                 "requestContext": {"http": {"method": method}},
                 "headers": {k.lower(): v for k, v in self.headers.items()},
                 "body": self.rfile.read(n).decode() if n else None}
        r = api.handler(event, None)
        self.send_response(r["statusCode"])
        for k, v in r["headers"].items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(r["body"].encode())

    def do_GET(self):
        u = urlsplit(self.path)
        if u.path.startswith("/api/"):
            return self._api("GET")
        path = os.path.normpath(os.path.join(OUT, u.path.lstrip("/")))
        if not path.startswith(os.path.normpath(OUT)) or not os.path.isfile(path):
            self.send_response(404)
            self.end_headers()
            return
        self.send_response(200)
        self.send_header("Content-Type", mimetypes.guess_type(path)[0] or "application/octet-stream")
        self.end_headers()
        with open(path, "rb") as f:
            self.wfile.write(f.read())

    def do_POST(self):
        return self._api("POST")


if __name__ == "__main__":
    print("dev server on http://localhost:8787")
    ThreadingHTTPServer(("127.0.0.1", 8787), H).serve_forever()
