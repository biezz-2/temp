#!/usr/bin/env python3
"""Voiceover TTS per kalimat -> out/voiceover.wav (48 kHz stereo).

Endpoint dipakai lewat env agar API key tidak pernah masuk source:
  export TTS_API_KEY=...            # atau simpan di file /workspace/.tts_key
  export TTS_URL=https://9router.biezz.my.id/v1/audio/speech   (default)
  export TTS_MODEL=gemini/gemini-3.1-flash-tts-preview/Zephyr  (default)

  python3 tools/make_tts.py          # 15 kalimat, jeda 0.45 dtk antar kalimat
"""
import json, os, subprocess, sys, time, urllib.request, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR, GAP = 48000, 0.45
URL = os.environ.get("TTS_URL", "https://9router.biezz.my.id/v1/audio/speech")
MODEL = os.environ.get("TTS_MODEL", "gemini/gemini-3.1-flash-tts-preview/Zephyr")
KEY = os.environ.get("TTS_API_KEY", "").strip()
if not KEY and os.path.exists("/workspace/.tts_key"):
    KEY = open("/workspace/.tts_key").read().strip()
if not KEY:
    sys.exit("API key TTS tidak ditemukan: set TTS_API_KEY atau isi /workspace/.tts_key")
CACHE = os.path.join(ROOT, "out", "tts_cache"); os.makedirs(CACHE, exist_ok=True)


def tts(text, i):
    raw = os.path.join(CACHE, f"s{i:02d}.raw")
    for attempt in range(4):
        try:
            req = urllib.request.Request(URL, method="POST", data=json.dumps({
                "model": MODEL, "input": text, "language": "Indonesian"}).encode("utf-8"),
                headers={"Content-Type": "application/json", "Authorization": "Bearer " + KEY,
                         "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
                         "Accept": "*/*"})
            with urllib.request.urlopen(req, timeout=120) as r:
                body = r.read()
            ok = body[:4] == b"RIFF" or body[:2] == b"ID3" or body[:1] == b"\xff"
            if len(body) < 2000 or not ok:
                raise RuntimeError(f"respons bukan audio ({len(body)} byte)")
            open(raw, "wb").write(body)
            return raw
        except Exception as e:
            print(f"  kalimat {i}: gagal ({e}); coba lagi {attempt + 1}/4", flush=True)
            time.sleep(2 + attempt * 3)
    sys.exit(f"TTS gagal permanen untuk kalimat {i}")


def mp3_to_wav(mp3, wav):
    r = subprocess.run(["ffmpeg", "-y", "-i", mp3, "-ar", str(SR), "-ac", "1", wav],
                       capture_output=True, text=True)
    if r.returncode: sys.exit("ffmpeg decode gagal: " + r.stderr[-500:])


def main():
    sents = json.load(open(os.path.join(ROOT, "data", "naskah.json"), encoding="utf-8"))["sentences"]
    wavs = []
    for i, s in enumerate(sents):
        cache_wav = os.path.join(CACHE, f"s{i:02d}.wav")
        mp3 = os.path.join(CACHE, f"s{i:02d}.raw")
        if not os.path.exists(cache_wav):
            mp3 = tts(s["spoken"], i)
            mp3_to_wav(mp3, cache_wav)
        with wave.open(cache_wav) as w:
            x = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float64) / 32768
            rate = w.getframerate()
        if rate != SR: sys.exit(f"rate tak terduga {rate} untuk s{i:02d}")
        wavs.append(x); print(f"  s{i:02d}: {len(x) / SR:.2f}s", flush=True)
    sil = np.zeros(int(SR * GAP))
    parts, manifest, off = [], [], 0.0
    for i, x in enumerate(wavs):
        nz = np.flatnonzero(np.abs(x) > 0.004)
        if len(nz):
            x = x[nz[0]:nz[-1] + 1]
        if i: parts.append(sil); off += GAP
        parts.append(x)
        manifest.append({"start": round(off, 4), "dur": round(len(x) / SR, 4)})
        off += len(x) / SR
    y = np.concatenate(parts)
    json.dump(manifest, open(os.path.join(ROOT, "out", "tts_manifest.json"), "w"), indent=1)
    stereo = np.column_stack([y, y])
    out = os.path.join(ROOT, "out", "voiceover.wav")
    pcm = (np.clip(stereo, -1, 1) * 32767).astype("<i2")
    with wave.open(out, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print(f"voiceover -> {out} ({len(y) / SR:.2f}s)")


if __name__ == "__main__":
    main()
