#!/usr/bin/env python3
"""Synthesise every line of src/data/lines.json into audio/voices/<id>.wav, then write measured durations back.

  python scripts/build_audio.py --only hook        # one line (test first)
  python scripts/build_audio.py --all              # all missing lines
  python scripts/build_audio.py --all --force      # re-synthesise everything (e.g. after changing the voice)
"""
import os, sys, json, time, subprocess, argparse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tts import synth, config, ROOT

LINES = os.path.join(ROOT, "src", "data", "lines.json")
VOICES = os.path.join(ROOT, "audio", "voices")


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True, check=True).stdout
    return round(float(out.strip()), 3)


def save(lines):
    with open(LINES, "w", encoding="utf-8", newline="\n") as f:
        f.write("[\n" + ",\n".join("  " + json.dumps(l, ensure_ascii=False) for l in lines) + "\n]\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    if not a.only and not a.all:
        ap.error("use --only <id> or --all")
    cfg = config()
    print("voice:", cfg["speaker"], " speech_rate:", cfg["speech_rate"])
    os.makedirs(VOICES, exist_ok=True)
    lines = json.load(open(LINES, encoding="utf-8"))
    todo = [l for l in lines if (a.all or l["id"] == a.only)]
    if a.only and not todo:
        sys.exit("unknown id " + a.only)
    for l in todo:
        out = os.path.join(VOICES, l["id"] + ".wav")
        if os.path.exists(out) and not a.force:
            continue
        for attempt in range(3):
            try:
                d = synth(l["text"], cfg["speaker"], out, context="用%s的语气说" % l["emo"],
                          speech_rate=cfg["speech_rate"], resource=cfg["resource"], sample_rate=cfg["sample_rate"])
                print("%-12s %5.2fs" % (l["id"], d))
                break
            except Exception as e:
                print("%-12s attempt %d failed: %s" % (l["id"], attempt + 1, e))
                if attempt == 2:
                    sys.exit(1)
                time.sleep(2 * (attempt + 1))
    total = chars = 0
    for l in lines:
        p = os.path.join(VOICES, l["id"] + ".wav")
        if os.path.exists(p):
            l["dur"] = probe(p)
            total += l["dur"]; chars += len(l["text"])
        else:
            l.pop("dur", None)
    save(lines)
    have = sum(1 for l in lines if "dur" in l)
    print("%d/%d lines voiced, %.1fs of speech, %.2f chars/s" % (have, len(lines), total, chars / total if total else 0))


if __name__ == "__main__":
    main()
