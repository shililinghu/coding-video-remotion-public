#!/usr/bin/env python3
"""Doubao TTS 2.0 via the v3 HTTP unidirectional stream (adapted from the reference project's tts2.py).

Key: VOLC_TTS_API_KEY from the environment, else from .env.local.  The key is never printed or logged.
Voice / rate / sample rate come from src/config.mjs (single source of truth); env SPEAKER overrides the voice.

CLI:  python scripts/tts.py "<text>" <speaker> <out.wav> [context]
"""
import os, re, sys, json, base64, uuid, wave, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = "https://openspeech.bytedance.com/api/v3/tts/unidirectional"


def config():
    """Read SPEAKER / SPEECH_RATE / SAMPLE_RATE / TTS_RESOURCE from src/config.mjs (keep them in sync there)."""
    src = open(os.path.join(ROOT, "src", "config.mjs"), encoding="utf-8").read()
    def get(name):
        m = re.search(r"export const %s = '?([^';\n]+)'?;" % name, src)
        return m.group(1).strip() if m else None
    return {
        "speaker": os.environ.get("SPEAKER") or get("SPEAKER"),
        "speech_rate": int(get("SPEECH_RATE")),
        "sample_rate": int(get("SAMPLE_RATE")),
        "resource": get("TTS_RESOURCE"),
    }


def api_key():
    k = os.environ.get("VOLC_TTS_API_KEY")
    if k:
        return k
    p = os.path.join(ROOT, ".env.local")
    if os.path.exists(p):
        for line in open(p, encoding="utf-8"):
            line = line.strip()
            if line.startswith("VOLC_TTS_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("VOLC_TTS_API_KEY not set (env or .env.local)")


def synth(text, speaker, out_path, context=None, speech_rate=0, resource="seed-tts-2.0", sample_rate=48000):
    req = {"text": text, "speaker": speaker,
           "audio_params": {"format": "pcm", "sample_rate": sample_rate, "speech_rate": speech_rate}}
    if context:
        req["additions"] = json.dumps({"context_texts": [context]}, ensure_ascii=False)
    body = {"user": {"uid": "all-correct-video"}, "req_params": req}
    r = urllib.request.Request(URL, data=json.dumps(body, ensure_ascii=False).encode(), method="POST", headers={
        "Content-Type": "application/json", "X-Api-Key": api_key(),
        "X-Api-Resource-Id": resource, "X-Api-Request-Id": str(uuid.uuid4())})
    pcm = bytearray()

    def handle(line):
        d = json.loads(line)
        if d.get("data"):
            pcm.extend(base64.b64decode(d["data"]))
        elif d.get("code") not in (0, 20000000, None):
            raise RuntimeError("TTS error code=%s message=%s" % (d.get("code"), d.get("message")))

    try:
        with urllib.request.urlopen(r, timeout=120) as resp:
            buf = b""
            for chunk in iter(lambda: resp.read(8192), b""):
                buf += chunk
                while b"\n" in buf:
                    line, buf = buf.split(b"\n", 1)
                    if line.strip():
                        handle(line)
            if buf.strip():
                handle(buf)
    except urllib.error.HTTPError as e:
        raise RuntimeError("HTTP %s x-api-status-code=%s x-api-message=%s body=%r" % (
            e.code, e.headers.get("x-api-status-code"), e.headers.get("x-api-message"), e.read()[:300]))
    if not pcm:
        raise RuntimeError("TTS returned no audio")
    with wave.open(out_path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sample_rate); w.writeframes(bytes(pcm))
    return len(pcm) / 2 / sample_rate


if __name__ == "__main__":
    cfg = config()
    text, speaker, out = sys.argv[1], sys.argv[2], sys.argv[3]
    print(synth(text, speaker, out, context=sys.argv[4] if len(sys.argv) > 4 else None,
                speech_rate=cfg["speech_rate"], resource=cfg["resource"], sample_rate=cfg["sample_rate"]))
