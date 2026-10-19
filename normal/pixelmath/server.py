"""HTTP API for PixelMath (standard library only).

    python3 serve.py --model my_model.json            # http://127.0.0.1:8000

Endpoints (JSON errors everywhere, see /openapi.json):
    GET  /health            liveness, no auth
    GET  /                  endpoint index
    GET  /openapi.json      OpenAPI 3 description (importable into Postman)
    GET  /generate?prompt=  image (browser friendly)
    POST /generate          JSON -> PNG/BMP bytes, or JSON with base64
    POST /parse             how a prompt is understood
    GET  /model             info about the loaded trained model
    POST /train             upload a zip of images + captions (async job, needs --model)
    GET  /jobs/<id>         training progress and result

Safety defaults: binds to 127.0.0.1; refuses a non-loopback address without an API key;
Host-header check against DNS rebinding; request body, image size, unzip size and concurrency
limits; zip-slip / zip-bomb / symlink protection; no tracebacks in responses.
"""
import argparse
import base64
import copy
import hmac
import json
import mmap
import os
import re
import shutil
import socket
import sys
import tempfile
import threading
import time
import traceback
import uuid
import zipfile
import zlib
from collections import OrderedDict
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit

from . import __version__
from .compose import MAX_SIZE, MIN_SIZE, choose_mode, render, text_warnings
from .imagefile import encode_bmp, encode_png
from .learn import (DEFAULT_GRID, IMAGE_EXTS, UNSUPPORTED_EXTS, LearnedModel, ModelError,
                    load_dataset, train_model)
from .tokenizer import MAX_PROMPT_CHARS, parse

MB = 1024 * 1024
LOOPBACK_HOSTS = ("127.0.0.1", "localhost", "::1")


class ApiError(Exception):
    def __init__(self, status, code, message, headers=None):
        super().__init__(message)
        self.status, self.code, self.message, self.headers = status, code, message, headers or {}


@dataclass
class Config:
    host: str = "127.0.0.1"
    port: int = 8000
    model_path: str = None
    api_key: str = None
    max_size: int = 1024
    max_concurrent: int = 2
    queue_wait: float = 10.0          # seconds a request may wait for a render slot before 503
    max_json_bytes: int = 64 * 1024
    max_upload_bytes: int = 100 * MB
    max_unzipped_bytes: int = 300 * MB
    max_file_bytes: int = 64 * MB
    max_files: int = 20000
    cors_origin: str = None
    quiet: bool = False


def is_loopback(host):
    return host in LOOPBACK_HOSTS or host.startswith("127.")


# ------------------------------------------------------------------ parameters
GEN_FIELDS = {"prompt", "size", "width", "height", "seed", "format", "learned", "response"}
TRAIN_FIELDS = {"epochs", "lr", "l2", "val_frac", "seed", "fresh", "grid", "refit"}


def _int(src, name, default, lo, hi, from_text):
    v = src.get(name)
    if v is None:
        return default
    if from_text:
        try:
            v = int(str(v).strip())
        except ValueError:
            raise ApiError(400, "bad_parameter", "%s must be an integer" % name)
    elif type(v) is not int:
        raise ApiError(400, "bad_parameter", "%s must be an integer" % name)
    if not lo <= v <= hi:
        raise ApiError(400, "bad_parameter", "%s must be between %d and %d" % (name, lo, hi))
    return v


def _float(src, name, default, lo, hi, lo_open=False):
    v = src.get(name)
    if v is None:
        return default
    try:
        v = float(str(v).strip())
    except ValueError:
        raise ApiError(400, "bad_parameter", "%s must be a number" % name)
    if not (v == v) or v < lo or v > hi or (lo_open and v == lo):
        raise ApiError(400, "bad_parameter", "%s is out of range" % name)
    return v


def _bool(src, name, default):
    v = src.get(name)
    if v is None:
        return default
    if isinstance(v, bool):
        return v
    s = str(v).strip().lower()
    if s in ("1", "true", "yes", "on"):
        return True
    if s in ("0", "false", "no", "off"):
        return False
    raise ApiError(400, "bad_parameter", "%s must be true or false" % name)


def parse_gen_params(src, cfg, from_text):
    unknown = sorted(set(src) - GEN_FIELDS)
    if unknown:
        raise ApiError(400, "unknown_field", "unknown field(s): %s (allowed: %s)" % (
            ", ".join(unknown), ", ".join(sorted(GEN_FIELDS))))
    prompt = src.get("prompt")
    if not isinstance(prompt, str) or not prompt.strip():
        raise ApiError(400, "bad_parameter", "prompt is required (a non-empty string)")
    if len(prompt) > MAX_PROMPT_CHARS:
        raise ApiError(400, "bad_parameter", "prompt too long (max %d characters)" % MAX_PROMPT_CHARS)
    hi = min(cfg.max_size, MAX_SIZE)
    size = _int(src, "size", 512, MIN_SIZE, hi, from_text)
    out = {
        "prompt": prompt.strip(),
        "width": _int(src, "width", size, MIN_SIZE, hi, from_text),
        "height": _int(src, "height", size, MIN_SIZE, hi, from_text),
        "seed": _int(src, "seed", 0, 0, 2 ** 31 - 1, from_text),
        "format": str(src.get("format", "png")).lower(),
        "learned": str(src.get("learned", "auto")).lower(),
        "response": str(src.get("response", "binary")).lower(),
    }
    for key, allowed in (("format", ("png", "bmp")), ("learned", ("auto", "always", "blend", "off")),
                         ("response", ("binary", "base64"))):
        if out[key] not in allowed:
            raise ApiError(400, "bad_parameter", "%s must be one of: %s" % (key, ", ".join(allowed)))
    return out


def parse_train_params(src):
    unknown = sorted(set(src) - TRAIN_FIELDS - {"data"})
    if unknown:
        raise ApiError(400, "unknown_field", "unknown field(s): %s (allowed: data, %s)" % (
            ", ".join(unknown), ", ".join(sorted(TRAIN_FIELDS))))
    return {
        "epochs": _int(src, "epochs", 80, 1, 500, True),
        "lr": _float(src, "lr", 0.3, 0.0, 5.0, lo_open=True),
        "l2": _float(src, "l2", 1e-4, 0.0, 1.0),
        "val_frac": _float(src, "val_frac", 0.15, 0.0, 0.499),
        "seed": _int(src, "seed", 0, 0, 2 ** 31 - 1, True),
        "fresh": _bool(src, "fresh", False),
        "grid": _int(src, "grid", DEFAULT_GRID, 4, 64, True),
        "refit": _bool(src, "refit", True),
    }


# ------------------------------------------------------------------ uploads
def parse_multipart(path, boundary, workdir, max_parts=16, max_field=4096):
    """Parse a multipart/form-data body stored in `path`. Returns (fields, files)."""
    if not boundary or len(boundary) > 200:
        raise ApiError(400, "bad_multipart", "missing or invalid multipart boundary")
    delim = b"--" + boundary.encode("latin-1", "replace")
    fields, files = {}, {}
    with open(path, "rb") as fh:
        if os.fstat(fh.fileno()).st_size == 0:
            raise ApiError(400, "bad_multipart", "empty request body")
        mm = mmap.mmap(fh.fileno(), 0, access=mmap.ACCESS_READ)
        try:
            pos = mm.find(delim)
            if pos < 0:
                raise ApiError(400, "bad_multipart", "multipart boundary not found in body")
            parts = 0
            while True:
                pos += len(delim)
                if mm[pos:pos + 2] == b"--":
                    break
                if mm[pos:pos + 2] != b"\r\n":
                    raise ApiError(400, "bad_multipart", "malformed multipart body")
                pos += 2
                hdr_end = mm.find(b"\r\n\r\n", pos)
                if hdr_end < 0 or hdr_end - pos > 8192:
                    raise ApiError(400, "bad_multipart", "malformed multipart headers")
                raw_header = mm[pos:hdr_end]
                if delim in raw_header:
                    raise ApiError(400, "bad_multipart", "malformed multipart headers")
                header = raw_header.decode("utf-8", "replace")
                body_start = hdr_end + 4
                nxt = mm.find(b"\r\n" + delim, body_start)
                if nxt < 0:
                    raise ApiError(400, "bad_multipart", "multipart body is incomplete")
                parts += 1
                if parts > max_parts:
                    raise ApiError(400, "bad_multipart", "too many form parts")
                disp = next((ln for ln in header.split("\r\n") if ln.lower().startswith("content-disposition")), "")
                m_name = re.search(r'\bname="([^"]*)"', disp)
                m_file = re.search(r'\bfilename="([^"]*)"', disp)
                if not m_name:
                    raise ApiError(400, "bad_multipart", "form part without a name")
                if m_file is not None:
                    dest = os.path.join(workdir, "part%d" % parts)
                    with open(dest, "wb") as out:
                        for off in range(body_start, nxt, MB):
                            out.write(mm[off:min(nxt, off + MB)])
                    files[m_name.group(1)] = dest
                else:
                    if nxt - body_start > max_field:
                        raise ApiError(400, "bad_multipart", "form field too large")
                    fields[m_name.group(1)] = mm[body_start:nxt].decode("utf-8", "replace")
                pos = nxt + 2
        finally:
            mm.close()
    return fields, files


def safe_extract(zip_path, dest, cfg):
    """Extract only images / caption files from an untrusted zip. Returns `dest`."""
    allowed = IMAGE_EXTS | UNSUPPORTED_EXTS | {".csv", ".json", ".txt"}
    try:
        zf = zipfile.ZipFile(zip_path)
    except (zipfile.BadZipFile, OSError):
        raise ApiError(400, "bad_zip", "the upload is not a valid zip file")
    real_dest = os.path.realpath(dest)
    with zf:
        entries = []
        for info in zf.infolist():
            if info.is_dir():
                continue
            name = info.filename.replace("\\", "/")
            parts = [p for p in name.split("/") if p not in ("", ".")]
            if (not parts or name.startswith("/") or ".." in parts or re.match(r"^[A-Za-z]:", parts[0])
                    or "\x00" in name):
                raise ApiError(400, "unsafe_zip", "the zip contains an unsafe path: %r" % info.filename[:80])
            if parts[0] == "__MACOSX" or parts[-1].startswith("._") or parts[-1] == ".DS_Store":
                continue
            if (info.external_attr >> 16) & 0o170000 == 0o120000:      # symlink entry
                continue
            if info.flag_bits & 0x1:
                raise ApiError(400, "bad_zip", "encrypted zip files are not supported")
            entries.append((info, parts))
        if len(entries) > cfg.max_files:
            raise ApiError(413, "too_many_files", "the zip has more than %d files" % cfg.max_files)
        if entries and all(len(p) > 1 for _, p in entries) and len({p[0] for _, p in entries}) == 1:
            entries = [(i, p[1:]) for i, p in entries]                  # single wrapper folder: drop it
        total = 0
        for info, parts in entries:
            if os.path.splitext(parts[-1])[1].lower() not in allowed:
                continue
            out = os.path.realpath(os.path.join(real_dest, *parts))
            if not out.startswith(real_dest + os.sep):
                raise ApiError(400, "unsafe_zip", "the zip contains an unsafe path")
            os.makedirs(os.path.dirname(out), exist_ok=True)
            written = 0
            try:
                with zf.open(info) as src, open(out, "wb") as dst:
                    while True:
                        chunk = src.read(MB)
                        if not chunk:
                            break
                        written += len(chunk)
                        total += len(chunk)
                        if written > cfg.max_file_bytes or total > cfg.max_unzipped_bytes:
                            raise ApiError(413, "zip_too_large",
                                           "the zip expands to more than the allowed %d MB" % (cfg.max_unzipped_bytes // MB))
                        dst.write(chunk)
            except (zipfile.BadZipFile, zlib.error, EOFError, NotImplementedError, RuntimeError, OSError) as exc:
                raise ApiError(400, "bad_zip", "the zip is corrupt or uses an unsupported feature (%s)" % type(exc).__name__)
    return dest


# ------------------------------------------------------------------ training jobs
class Job:
    def __init__(self, params):
        self.id = uuid.uuid4().hex[:12]
        self.lock = threading.Lock()
        self.data = {"id": self.id, "status": "queued", "message": "", "epoch": 0, "epochs": params["epochs"],
                     "train_rmse": None, "val_rmse": None, "images_read": 0, "skipped_count": 0,
                     "skipped": [], "metrics": None, "error": None, "created": time.time(), "finished": None}

    def update(self, **kw):
        with self.lock:
            self.data.update(kw)

    def snapshot(self):
        with self.lock:
            d = copy.deepcopy(self.data)
        d["skipped"] = d["skipped"][:100]
        return d


class App:
    def __init__(self, cfg):
        self.cfg = cfg
        self.lock = threading.Lock()
        self.model = None
        self.render_slots = threading.BoundedSemaphore(cfg.max_concurrent)
        self.train_lock = threading.Lock()
        self.jobs = OrderedDict()
        self.host_check = is_loopback(cfg.host) and not cfg.api_key
        if cfg.model_path and os.path.exists(cfg.model_path):
            self.model = LearnedModel.load(cfg.model_path)

    def log(self, msg):
        if not self.cfg.quiet:
            print("[pixelmath] " + msg, file=sys.stderr, flush=True)

    def get_model(self):
        with self.lock:
            return self.model

    def set_model(self, model):
        with self.lock:
            self.model = model

    def new_job(self, params):
        job = Job(params)
        with self.lock:
            self.jobs[job.id] = job
            while len(self.jobs) > 20:
                self.jobs.popitem(last=False)
        return job

    def start_training(self, tmpdir, zip_path, params):
        if not self.train_lock.acquire(blocking=False):
            running = next((j.id for j in reversed(self.jobs.values())
                            if j.snapshot()["status"] not in ("done", "error")), None)
            raise ApiError(409, "training_busy", "a training job is already running%s" % (
                " (job %s)" % running if running else ""))
        job = self.new_job(params)
        threading.Thread(target=self._run_job, args=(job, tmpdir, zip_path, params), daemon=True).start()
        return job

    def _run_job(self, job, tmpdir, zip_path, p):
        def fail(code, message):
            job.update(status="error", message=message, error={"code": code, "message": message},
                       finished=time.time())
        try:
            job.update(status="extracting", message="unpacking the zip")
            data_dir = safe_extract(zip_path, os.path.join(tmpdir, "data"), self.cfg)
            job.update(status="reading", message="reading images")
            current = self.get_model()
            model = LearnedModel(p["grid"]) if (p["fresh"] or current is None) else copy.deepcopy(current)
            samples, skipped, _sources = load_dataset(data_dir, model.grid)
            job.update(images_read=len(samples), skipped_count=len(skipped),
                       skipped=[{"file": r, "reason": w} for r, w in skipped[:100]])
            if not samples and not (model.samples and not p["fresh"]):
                return fail("no_usable_data", "no usable (image, caption) pairs found in the zip")

            def log(ep, tr, va):
                if ep == 0:
                    job.update(status="training", message="refitting on all data")
                else:
                    job.update(epoch=ep, train_rmse=round(tr ** 0.5 * 255, 2),
                               val_rmse=None if va is None else round(va ** 0.5 * 255, 2))

            job.update(status="training", message="training")
            m = train_model(model, samples, p["epochs"], p["lr"], p["l2"], p["val_frac"], p["seed"], 8,
                            p["refit"], log)
            model.save(self.cfg.model_path)
            self.set_model(model)
            gain = None
            if m["val_mse"] is not None and m["baseline_val"]:
                gain = round(100.0 * (1 - m["val_mse"] / m["baseline_val"]), 1)
            job.update(status="done", message="finished", finished=time.time(), metrics={
                "samples": m["samples"], "added": m["added"], "vocabulary": len(model.rows),
                "val_samples": m["val_samples"], "best_epoch": m["best_epoch"],
                "val_rmse": None if m["val_mse"] is None else round(m["val_mse"] ** 0.5 * 255, 2),
                "baseline_rmse": None if m["baseline_val"] is None else round(m["baseline_val"] ** 0.5 * 255, 2),
                "improvement_percent": gain})
        except ApiError as exc:
            fail(exc.code, exc.message)
        except (ModelError, OSError, ValueError) as exc:
            fail("training_failed", str(exc))
        except Exception:                                               # never kill the server thread silently
            self.log("training job %s crashed:\n%s" % (job.id, traceback.format_exc()))
            fail("internal_error", "internal error while training (see server log)")
        finally:
            shutil.rmtree(tmpdir, ignore_errors=True)
            self.train_lock.release()


# ------------------------------------------------------------------ HTTP handler
ROUTES = {
    "/": {"GET": "get_index"},
    "/health": {"GET": "get_health"},
    "/openapi.json": {"GET": "get_openapi"},
    "/generate": {"GET": "get_generate", "POST": "post_generate"},
    "/parse": {"POST": "post_parse"},
    "/model": {"GET": "get_model_info"},
    "/train": {"POST": "post_train"},
    "/jobs": {"GET": "get_jobs"},
}
OPEN_ROUTES = {"/health", "/openapi.json", "/"}
IMAGE_MIME = {"png": "image/png", "bmp": "image/bmp"}


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server_version = "PixelMath/" + __version__
    sys_version = ""
    timeout = 60

    def log_message(self, fmt, *args):          # replaced by our own one-line log
        pass

    def send_error(self, code, message=None, explain=None):
        """Malformed HTTP detected by the base class: answer in JSON like everything else."""
        self.close_connection = True
        try:
            from http import HTTPStatus
            msg = message or HTTPStatus(code).phrase
            self._json({"error": {"code": "http_%d" % code, "message": str(msg)[:200]}}, code)
        except OSError:
            pass

    # ---- plumbing
    @property
    def app(self):
        return self.server.app

    def _cors_headers(self):
        origin = self.app.cfg.cors_origin
        if not origin:
            return {}
        return {"Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Authorization",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Expose-Headers": "X-PixelMath-Mode, X-PixelMath-Seed, X-Render-Seconds",
                "Vary": "Origin"}

    def _send(self, status, body=b"", ctype="application/json", headers=None):
        self._status = status
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Connection", "close")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        for k, v in {**self._cors_headers(), **(headers or {})}.items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)
        self.close_connection = True

    def _json(self, obj, status=200, headers=None):
        self._send(status, json.dumps(obj, ensure_ascii=False).encode("utf-8"), "application/json; charset=utf-8", headers)

    def _error(self, exc):
        self._drain()
        self._json({"error": {"code": exc.code, "message": exc.message}}, exc.status, exc.headers)

    def _drain(self):
        """Read (a bounded amount of) an unread request body so the client can see our reply."""
        if getattr(self, "_body_read", True) or self.command != "POST":
            return
        try:
            left = min(int(self.headers.get("Content-Length") or 0), 2 * MB)
            self.connection.settimeout(2)
            while left > 0:
                data = self.rfile.read(min(65536, left))
                if not data:
                    break
                left -= len(data)
        except (OSError, ValueError):
            pass

    def _read_body(self, limit):
        raw = self.headers.get("Content-Length")
        if raw is None:
            raise ApiError(411, "length_required", "Content-Length header is required")
        try:
            n = int(raw)
        except ValueError:
            raise ApiError(400, "bad_request", "invalid Content-Length")
        if n < 0:
            raise ApiError(400, "bad_request", "invalid Content-Length")
        if n > limit:
            raise ApiError(413, "body_too_large", "request body too large (max %d bytes)" % limit)
        data = self.rfile.read(n)
        self._body_read = True
        if len(data) != n:
            raise ApiError(400, "bad_request", "request body ended early")
        return data

    def _stream_body(self, path, limit):
        raw = self.headers.get("Content-Length")
        if raw is None:
            raise ApiError(411, "length_required", "Content-Length header is required")
        try:
            n = int(raw)
        except ValueError:
            raise ApiError(400, "bad_request", "invalid Content-Length")
        if n <= 0:
            raise ApiError(400, "bad_request", "empty request body")
        if n > limit:
            raise ApiError(413, "body_too_large", "upload too large (max %d MB)" % (limit // MB))
        left = n
        with open(path, "wb") as fh:
            while left > 0:
                chunk = self.rfile.read(min(MB, left))
                if not chunk:
                    raise ApiError(400, "bad_request", "request body ended early")
                fh.write(chunk)
                left -= len(chunk)
        self._body_read = True

    def _json_body(self):
        ctype = (self.headers.get("Content-Type") or "").split(";")[0].strip().lower()
        if ctype != "application/json" and not ctype.endswith("+json"):
            raise ApiError(415, "unsupported_media_type", "Content-Type must be application/json")
        raw = self._read_body(self.app.cfg.max_json_bytes)
        try:
            obj = json.loads(raw.decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            raise ApiError(400, "invalid_json", "request body is not valid JSON")
        if not isinstance(obj, dict):
            raise ApiError(400, "invalid_json", "request body must be a JSON object")
        return obj

    def _check_host(self):
        if not self.app.host_check:
            return
        host = self.headers.get("Host")
        if not host:
            return
        m = re.match(r"^(\[[^\]]+\]|[^:]+)(?::\d+)?$", host.strip())
        name = m.group(1).strip("[]").lower() if m else ""
        if name not in LOOPBACK_HOSTS:
            raise ApiError(403, "bad_host", "unexpected Host header (protecting against DNS rebinding)")

    def _check_auth(self):
        key = self.app.cfg.api_key
        if not key:
            return
        supplied = self.headers.get("X-API-Key")
        auth = self.headers.get("Authorization") or ""
        if not supplied and auth.lower().startswith("bearer "):
            supplied = auth[7:].strip()
        if not supplied or not hmac.compare_digest(supplied.encode("utf-8"), key.encode("utf-8")):
            raise ApiError(401, "unauthorized", "missing or invalid API key (send X-API-Key or Authorization: Bearer)",
                           {"WWW-Authenticate": 'Bearer realm="pixelmath"'})

    # ---- dispatch
    def _dispatch(self, method):
        t0 = time.time()
        self._status = 500
        self._body_read = method != "POST"
        parts = urlsplit(self.path)
        path = parts.path.rstrip("/") or "/"
        try:
            self._check_host()
            if path.startswith("/jobs/") and len(path) > 6:
                routes, handler_path = {"GET": "get_job"}, "/jobs/<id>"
            else:
                routes, handler_path = ROUTES.get(path), path
            if routes is None:
                raise ApiError(404, "not_found", "no such endpoint: %s" % path[:80])
            if method == "OPTIONS":
                self._send(204, b"", "text/plain", {"Allow": ", ".join(sorted(set(routes) | {"OPTIONS"}))})
                return
            if method not in routes:
                raise ApiError(405, "method_not_allowed", "%s is not allowed on %s" % (method, path),
                               {"Allow": ", ".join(sorted(routes))})
            if handler_path not in OPEN_ROUTES:
                self._check_auth()
            getattr(self, routes[method])(parts, path)
        except ApiError as exc:
            self._error(exc)
        except (BrokenPipeError, ConnectionResetError, socket.timeout, TimeoutError):
            self.close_connection = True
        except Exception:
            self.app.log("unhandled error on %s %s:\n%s" % (method, path, traceback.format_exc()))
            try:
                self._error(ApiError(500, "internal_error", "internal server error"))
            except OSError:
                pass
        finally:
            self.app.log("%s %s %s -> %s (%.0f ms)" % (self.client_address[0], method, path[:60], self._status,
                                                       (time.time() - t0) * 1000))

    def do_GET(self):
        self._dispatch("GET")

    def do_POST(self):
        self._dispatch("POST")

    def do_OPTIONS(self):
        self._dispatch("OPTIONS")

    def do_PUT(self):
        self._dispatch("PUT")

    def do_DELETE(self):
        self._dispatch("DELETE")

    def do_PATCH(self):
        self._dispatch("PATCH")

    def do_HEAD(self):
        self._dispatch("HEAD")

    # ---- endpoints
    def get_index(self, parts, path):
        self._json({"name": "PixelMath", "version": __version__, "docs": "/openapi.json", "endpoints": {
            "GET /health": "liveness", "GET|POST /generate": "make an image", "POST /parse": "explain a prompt",
            "GET /model": "trained model info", "POST /train": "upload zip to train (needs --model)",
            "GET /jobs/<id>": "training progress"}})

    def get_health(self, parts, path):
        m = self.app.get_model()
        self._json({"status": "ok", "version": __version__, "model_loaded": m is not None,
                    "training_enabled": bool(self.app.cfg.model_path), "auth_required": bool(self.app.cfg.api_key)})

    def get_openapi(self, parts, path):
        from .apidocs import openapi
        self._json(openapi(self.app.cfg))

    def get_generate(self, parts, path):
        q = {k: v[0] for k, v in parse_qs(parts.query, keep_blank_values=True, max_num_fields=20).items()}
        self._generate(parse_gen_params(q, self.app.cfg, True))

    def post_generate(self, parts, path):
        self._generate(parse_gen_params(self._json_body(), self.app.cfg, False))

    def _generate(self, p):
        app = self.app
        if not app.render_slots.acquire(timeout=app.cfg.queue_wait):
            raise ApiError(503, "busy", "the server is still busy after waiting %g s, retry shortly" % app.cfg.queue_wait,
                           {"Retry-After": "2"})
        try:
            model = app.get_model()
            t0 = time.time()
            try:
                canvas, parsed, mode = render(p["prompt"], p["width"], p["height"], p["seed"], model, p["learned"])
            except ValueError as exc:
                raise ApiError(400, "bad_parameter", str(exc))
            rgb = canvas.to_rgb_bytes()
            data = (encode_png if p["format"] == "png" else encode_bmp)(p["width"], p["height"], rgb)
            secs = round(time.time() - t0, 3)
        finally:
            app.render_slots.release()
        mime = IMAGE_MIME[p["format"]]
        if p["response"] == "base64":
            self._json({"image_base64": base64.b64encode(data).decode("ascii"), "mime": mime,
                        "width": p["width"], "height": p["height"], "seed": p["seed"], "mode": mode,
                        "render_seconds": secs, "warnings": text_warnings(parsed),
                        "known_words": model.known_words(p["prompt"]) if model else []})
            return
        warn = text_warnings(parsed)
        self._send(200, data, mime, {"X-PixelMath-Mode": mode, "X-PixelMath-Seed": str(p["seed"]),
                                     "X-Render-Seconds": str(secs), **({"X-PixelMath-Warning": warn[0]} if warn else {}),
                                     "Content-Disposition": 'inline; filename="pixelmath.%s"' % p["format"]})

    def post_parse(self, parts, path):
        body = self._json_body()
        unknown = sorted(set(body) - {"prompt"})
        if unknown:
            raise ApiError(400, "unknown_field", "unknown field(s): %s (allowed: prompt)" % ", ".join(unknown))
        prompt = body.get("prompt")
        if not isinstance(prompt, str) or not prompt.strip():
            raise ApiError(400, "bad_parameter", "prompt is required (a non-empty string)")
        if len(prompt) > MAX_PROMPT_CHARS:
            raise ApiError(400, "bad_parameter", "prompt too long (max %d characters)" % MAX_PROMPT_CHARS)
        parsed = parse(prompt)
        model = self.app.get_model()
        self._json({
            "mode": choose_mode(parsed), "time": parsed.time, "flags": sorted(parsed.flags),
            "entities": [{"kind": e.kind, "name": e.name, "count": e.count, "size": e.size, "position": e.position,
                          "color": None if e.color is None else "#%02x%02x%02x" % tuple(int(round(c * 255)) for c in e.color)}
                         for e in parsed.entities],
            "not_in_lexicon": parsed.unknown_words,
            "model_knows": model.known_words(prompt) if model else []})

    def get_model_info(self, parts, path):
        m = self.app.get_model()
        if m is None:
            self._json({"loaded": False, "training_enabled": bool(self.app.cfg.model_path)})
            return
        top = sorted(m.rows, key=lambda w: (-m.doc_freq.get(w, 0), w))[:20]
        self._json({"loaded": True, "grid": m.grid, "samples": len(m.samples), "vocabulary": len(m.rows),
                    "meta": m.meta, "training_enabled": bool(self.app.cfg.model_path),
                    "top_words": [{"word": w, "captions": m.doc_freq.get(w, 0),
                                   "color": "#%02x%02x%02x" % m.word_color(w)} for w in top]})

    def post_train(self, parts, path):
        app = self.app
        if not app.cfg.model_path:
            raise ApiError(403, "training_disabled", "training is disabled: start the server with --model PATH")
        ctype_header = self.headers.get("Content-Type") or ""
        ctype = ctype_header.split(";")[0].strip().lower()
        params = {k: v[0] for k, v in parse_qs(parts.query, keep_blank_values=True, max_num_fields=20).items()}
        if ctype not in ("multipart/form-data", "application/zip", "application/x-zip-compressed",
                         "application/octet-stream"):
            raise ApiError(415, "unsupported_media_type",
                           "send multipart/form-data (field 'data' = zip file) or a raw application/zip body")
        tmpdir = tempfile.mkdtemp(prefix="pixelmath-upload-")
        handed_over = False
        try:
            body_path = os.path.join(tmpdir, "body")
            self._stream_body(body_path, app.cfg.max_upload_bytes)
            if ctype == "multipart/form-data":
                m = re.search(r'boundary=(?:"([^"]+)"|([^;\s]+))', ctype_header, re.I)
                boundary = (m.group(1) or m.group(2)) if m else None
                fields, files = parse_multipart(body_path, boundary, tmpdir)
                if "data" not in files:
                    raise ApiError(400, "missing_file", "multipart field 'data' (the zip file) is required")
                params.update(fields)
                zip_path = files["data"]
            else:
                zip_path = body_path
            p = parse_train_params(params)
            if not zipfile.is_zipfile(zip_path):
                raise ApiError(400, "bad_zip", "the upload is not a valid zip file")
            job = app.start_training(tmpdir, zip_path, p)
            handed_over = True
        finally:
            if not handed_over:
                shutil.rmtree(tmpdir, ignore_errors=True)
        self._json({"job_id": job.id, "status": "queued", "status_url": "/jobs/%s" % job.id}, 202,
                   {"Location": "/jobs/%s" % job.id})

    def get_job(self, parts, path):
        job = self.app.jobs.get(path[len("/jobs/"):])
        if job is None:
            raise ApiError(404, "not_found", "no such job (the server keeps the last 20)")
        self._json(job.snapshot())

    def get_jobs(self, parts, path):
        with self.app.lock:
            jobs = list(self.app.jobs.values())
        self._json({"jobs": [{"id": j.id, "status": j.snapshot()["status"]} for j in reversed(jobs)]})


class _Server(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True
    request_queue_size = 32

    def handle_error(self, request, client_address):      # drop noisy socket tracebacks
        pass


class _Server6(_Server):
    address_family = socket.AF_INET6


def create_server(cfg):
    """Build (but do not start) the HTTP server. `server.app` holds the shared state."""
    if not is_loopback(cfg.host) and not cfg.api_key:
        raise ValueError("refusing to listen on %s without an API key (use --api-key or PIXELMATH_API_KEY)" % cfg.host)
    if cfg.max_size < MIN_SIZE or cfg.max_size > MAX_SIZE:
        raise ValueError("max_size must be between %d and %d" % (MIN_SIZE, MAX_SIZE))
    app = App(cfg)
    cls = _Server6 if ":" in cfg.host else _Server
    httpd = cls((cfg.host, cfg.port), Handler)
    httpd.app = app
    return httpd


def main(argv=None):
    ap = argparse.ArgumentParser(prog="serve.py", description="PixelMath HTTP API (stdlib only).")
    ap.add_argument("--host", default="127.0.0.1", help="default 127.0.0.1 (this machine only)")
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--model", help="model file to load; also enables POST /train (created on first training)")
    ap.add_argument("--api-key", default=os.environ.get("PIXELMATH_API_KEY"),
                    help="require this key (X-API-Key header). Prefer the PIXELMATH_API_KEY env var")
    ap.add_argument("--max-size", type=int, default=1024, help="largest width/height accepted (default 1024, hard max 2048)")
    ap.add_argument("--max-concurrent", type=int, default=2, help="simultaneous renders; others wait in a queue")
    ap.add_argument("--queue-wait", type=float, default=10.0, help="seconds a request waits for a free slot before 503")
    ap.add_argument("--max-upload-mb", type=int, default=100)
    ap.add_argument("--max-unzipped-mb", type=int, default=300)
    ap.add_argument("--cors-origin", help="allow browser calls from this origin (or *)")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args(argv)
    cfg = Config(host=args.host, port=args.port, model_path=args.model, api_key=args.api_key or None,
                 max_size=args.max_size, max_concurrent=max(1, args.max_concurrent), queue_wait=max(0.0, args.queue_wait),
                 max_upload_bytes=args.max_upload_mb * MB, max_unzipped_bytes=args.max_unzipped_mb * MB,
                 cors_origin=args.cors_origin, quiet=args.quiet)
    try:
        httpd = create_server(cfg)
    except (ValueError, ModelError) as exc:
        print("serve.py: error: %s" % exc, file=sys.stderr)
        return 2
    except OSError as exc:
        print("serve.py: error: cannot listen on %s:%d (%s)" % (cfg.host, cfg.port, exc.strerror or exc), file=sys.stderr)
        return 1
    host, port = httpd.server_address[:2]
    model = httpd.app.model
    print("PixelMath API %s on http://%s:%d" % (__version__, "[%s]" % host if ":" in host else host, port))
    print("  auth:     %s" % ("API key required (X-API-Key)" if cfg.api_key else "none (local use only)"))
    print("  model:    %s" % (("%s (%d samples, %d words)" % (cfg.model_path, len(model.samples), len(model.rows)))
                              if model else (cfg.model_path + " (will be created by /train)" if cfg.model_path else "none")))
    print("  training: %s" % ("enabled (POST /train)" if cfg.model_path else "disabled (start with --model PATH)"))
    print("  limits:   image <= %d px, %d concurrent renders (others queue up to %g s), upload <= %d MB" % (
        cfg.max_size, cfg.max_concurrent, cfg.queue_wait, cfg.max_upload_bytes // MB))
    print("  docs:     http://%s:%d/openapi.json   (Ctrl-C to stop)" % (host, port), flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstopping", file=sys.stderr)
    finally:
        httpd.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
