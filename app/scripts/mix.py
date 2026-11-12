#!/usr/bin/env python3
"""Mix the voice lines onto the timeline + a quiet chord pad -> audio/mix.wav (48 kHz, 16-bit stereo).

  python scripts/mix.py
Placement comes from out/timeline.json, regenerated here via scripts/dump_timeline.mjs so it is never stale.
"""
import os, sys, json, wave, subprocess
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tts import config, ROOT

SR = config()["sample_rate"]


def read_wav(path):
    with wave.open(path, "rb") as w:
        assert w.getsampwidth() == 2, path
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        if w.getnchannels() == 2:
            x = x.reshape(-1, 2).mean(axis=1)
        if w.getframerate() != SR:
            raise SystemExit("%s: sample rate %d != %d" % (path, w.getframerate(), SR))
    return x


def pad(n):
    """soft Cmaj9-ish pad with slow swell, -30 dBFS peak."""
    t = np.arange(n) / SR
    freqs = [130.81, 196.00, 246.94, 293.66, 329.63]
    y = sum(np.sin(2 * np.pi * f * t + i) * (0.6 if i else 1.0) for i, f in enumerate(freqs))
    y *= 0.75 + 0.25 * np.sin(2 * np.pi * t / 11.0)
    fade = np.minimum(1, np.minimum(t / 3.0, (t[-1] - t) / 3.0))
    y *= fade
    return y / (np.abs(y).max() + 1e-9) * 10 ** (-30 / 20)


def main():
    subprocess.run(["node", os.path.join(ROOT, "scripts", "dump_timeline.mjs"), "--quiet"], check=True)
    tl = json.load(open(os.path.join(ROOT, "out", "timeline.json"), encoding="utf-8"))
    if tl["estimated"]:
        raise SystemExit("timeline uses estimated durations: run scripts/build_audio.py --all first")
    n = int(round(tl["DURATION"] * SR))
    voice = np.zeros(n, dtype=np.float32)
    for v in tl["VOICE"]:
        x = read_wav(os.path.join(ROOT, "audio", "voices", v["id"] + ".wav"))
        a = int(round(v["at"] * SR))
        voice[a:a + len(x)] += x[: max(0, n - a)]
    voice *= 10 ** (-1.5 / 20) / (np.abs(voice).max() + 1e-9)
    mix = voice + pad(n)
    mix *= 10 ** (-1 / 20) / (np.abs(mix).max() + 1e-9)
    st = (np.repeat(mix[:, None], 2, axis=1) * 32767).astype(np.int16)
    out = os.path.join(ROOT, "audio", "mix.wav")
    with wave.open(out, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
    print("wrote %s  %.2fs (timeline %.2fs)" % (out, n / SR, tl["DURATION"]))


if __name__ == "__main__":
    main()
