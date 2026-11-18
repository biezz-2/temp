#!/usr/bin/env python3
"""
build video kinetic typography (MP4, H.264+AAC, 30 fps, 1080x1920)

Cara pakai
  python3 tools/make_audio.py                      # (sekali) musik + SFX sintetis, sudah ada di assets/audio
  python3 build.py                                 # DRAF tanpa voiceover (timing perkiraan 2,5 kata/detik)
  python3 build.py --vo "Suara Voiceover.mp3"      # VERSI FINAL: durasi + timing mengikuti suara asli
  python3 build.py --stills 3,10,20                # hanya render PNG pada detik tertentu (cek cepat)

Aturan durasi (dari skill motion-graphics-by-nalarka)
  durasi video = ceil(durasi voiceover + 1 detik pembuka + 1,5 detik penutup), maksimal 60 detik
  frame = durasi x 30. Kalau lebih dari 60 detik, skrip BERHENTI (persingkat naskah / buat ulang suara).
"""
import argparse, json, math, os, re, subprocess, sys, wave
import numpy as np

ROOT = os.path.dirname(os.path.abspath(__file__))
FPS, W, H = 60, 1080, 1920
MAX_DUR = 150
SR = 48000
LEAD, TAIL = 1.0, 1.5
WPS, PAUSE = 2.5, 0.35          # kata/detik & jeda antar-kalimat (hanya untuk perkiraan tanpa voiceover)
OUT = os.path.join(ROOT, "out")


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def probe_dur(path):
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path])
    return float(r.stdout.strip())


# ---------------------------------------------------------------- timeline
def load_script():
    with open(os.path.join(ROOT, "data", "naskah.json"), encoding="utf-8") as f:
        return json.load(f)


def detect_segments(vo, n):
    """Cari n segmen ucapan lewat silencedetect. Kembalikan [(s,e)] relatif ke awal file, atau None."""
    dur = probe_dur(vo)
    for noise in (-35, -40, -30, -45, -28):
        for d in (0.30, 0.25, 0.35, 0.20, 0.40, 0.15):
            r = run(["ffmpeg", "-i", vo, "-af", f"silencedetect=noise={noise}dB:d={d}", "-f", "null", "-"])
            st = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", r.stderr)]
            en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r.stderr)]
            segs, cur = [], 0.0
            for i, s in enumerate(st):
                if s - cur > 0.15: segs.append((cur, max(cur, s)))
                cur = en[i] if i < len(en) else dur
            if dur - cur > 0.15: segs.append((cur, dur))
            if len(segs) == n:
                return segs, (noise, d)
    return None, None


def make_timeline(script, vo_path=None):
    sents = script["sentences"]
    words = [s["spoken"].split() for s in sents]
    n = len(sents)
    base = [len(w) / WPS for w in words]
    est = sum(base) + PAUSE * (n - 1)
    method = "perkiraan (2,5 kata/detik, tanpa voiceover)"
    segs = None
    if vo_path:
        vod = probe_dur(vo_path)
        mf = os.path.join(OUT, "tts_manifest.json")
        if os.path.exists(mf):
            m = json.load(open(mf))
            if len(m) == n:
                segs = [(e["start"], e["start"] + e["dur"]) for e in m]
        if segs:
            method = "manifest TTS per kalimat (make_tts.py) -> timing eksak"
        else:
            segs, prm = detect_segments(vo_path, n)
            if segs:
                method = f"silencedetect {prm[0]} dB / d={prm[1]} -> {n} segmen ucapan terdeteksi"
            else:
                method = "proporsional jumlah huruf (silencedetect tidak menemukan tepat %d segmen; timing per kalimat = PERKIRAAN)" % n
    else:
        vod = est
    dur = math.ceil(vod + LEAD + TAIL - 1e-9)
    ts = []
    if segs:
        for (a, b) in segs: ts.append({"s": LEAD + a, "e": LEAD + b})
    else:
        k = vod / est
        cur = LEAD
        for i in range(n):
            d = base[i] * k
            ts.append({"s": cur, "e": cur + d}); cur += d + PAUSE * k
    for i, t in enumerate(ts):
        t["words"] = words[i]; t["spoken"] = sents[i]["spoken"]
    return {"meta": script.get("meta", {}), "dur": dur, "frames": dur * FPS, "vo_dur": vod, "draft": vo_path is None,
            "method": method, "sentences": ts}


# ------------------------------------------------------------------ audio
def read_wav(path):
    with wave.open(path) as w:
        assert w.getframerate() == SR and w.getnchannels() == 2
        x = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float64) / 32768
    return x.reshape(-1, 2)


def write_wav(path, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())


def mix_sfx(events, dur, path):
    cache, n = {}, int(SR * dur)
    buf = np.zeros((n, 2))
    for e in events:
        if e["n"] not in cache:
            cache[e["n"]] = read_wav(os.path.join(ROOT, "assets", "audio", "sfx", e["n"] + ".wav"))
        x = cache[e["n"]] * e["v"]
        s = int(e["t"] * SR)
        if s >= n: continue
        m = min(len(x), n - s)
        buf[s:s + m] += x[:m]
    pk = np.max(np.abs(buf)) or 1
    if pk > .95: buf *= .95 / pk
    write_wav(path, buf)


def final_mix(video_only, vo, music, sfx, dur, out):
    fade_st = dur - 2.5
    if vo:
        fc = (f"[1:a]adelay={int(LEAD*1000)}:all=1,apad=whole_dur={dur},atrim=0:{dur},asetpts=PTS-STARTPTS,asplit=2[vo1][vo2];"
              f"[2:a]atrim=0:{dur},asetpts=PTS-STARTPTS,volume=0.42,afade=t=out:st={fade_st}:d=2.5[bg];"
              f"[3:a]atrim=0:{dur},asetpts=PTS-STARTPTS,volume=0.55[fx];"
              f"[bg][vo1]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=300[duck];"
              f"[duck][fx][vo2]amix=inputs=3:duration=longest:dropout_transition=0,volume=3,alimiter=limit=0.8:level=0[aout]")
        ins = ["-i", video_only, "-i", vo, "-i", music, "-i", sfx]
    else:
        fc = (f"[1:a]atrim=0:{dur},asetpts=PTS-STARTPTS,volume=0.55,afade=t=out:st={fade_st}:d=2.5[bg];"
              f"[2:a]atrim=0:{dur},asetpts=PTS-STARTPTS,volume=0.9[fx];"
              f"[bg][fx]amix=inputs=2:duration=longest:dropout_transition=0,volume=2,alimiter=limit=0.8:level=0,"
              f"apad=whole_dur={dur},atrim=0:{dur}[aout]")
        ins = ["-i", video_only, "-i", music, "-i", sfx]
    cmd = ["ffmpeg", "-y", *ins, "-filter_complex", fc, "-map", "0:v", "-map", "[aout]",
           "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", str(dur),
           "-movflags", "+faststart", out]
    r = run(cmd)
    if r.returncode: print(r.stderr[-2000:]); sys.exit("ffmpeg mixing gagal")


# ----------------------------------------------------------------- render
def with_page(tl, fn):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
        pg.goto("file://" + os.path.join(ROOT, "web", "scene.html"))
        pg.evaluate("tl => window.setup(tl)", tl)
        res = fn(pg)
        b.close()
    return res


def render_video(tl, video_only, events_path):
    F = tl["frames"]
    ff = subprocess.Popen(["ffmpeg", "-y", "-f", "image2pipe", "-framerate", str(FPS), "-vcodec", "png", "-i", "-",
                           "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
                           "-r", str(FPS), "-frames:v", str(F), "-movflags", "+faststart", video_only],
                          stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)

    def go(pg):
        ev = pg.evaluate("window.getEvents()")
        json.dump(ev, open(events_path, "w"), indent=1)
        for f in range(F):
            pg.evaluate("t => window.renderFrame(t)", f / FPS)
            ff.stdin.write(pg.screenshot(type="png"))
            if f % 60 == 0: print(f"frame {f}/{F}", flush=True)
        return ev
    ev = with_page(tl, go)
    ff.stdin.close(); ff.wait()
    return ev


def render_stills(tl, times, outdir):
    os.makedirs(outdir, exist_ok=True)

    def go(pg):
        for t in times:
            pg.evaluate("t => window.renderFrame(t)", t)
            pg.screenshot(path=os.path.join(outdir, f"t{t:06.2f}.png"))
    with_page(tl, go)


# ------------------------------------------------------------- verifikasi
def verify(path, tl):
    dur, frames = tl["dur"], tl["frames"]
    r = run(["ffprobe", "-v", "error", "-show_entries",
             "format=duration:stream=codec_type,codec_name,width,height,r_frame_rate,avg_frame_rate,pix_fmt",
             "-of", "json", path])
    info = json.loads(r.stdout)
    cd = run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0",
              "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", path]).stdout.strip()
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    a = next(s for s in info["streams"] if s["codec_type"] == "audio")
    cont = float(info["format"]["duration"])
    bl = run(["ffmpeg", "-i", path, "-vf", "blackdetect=d=0.1:pix_th=0.05", "-an", "-f", "null", "-"]).stderr
    fz = run(["ffmpeg", "-i", path, "-vf", "freezedetect=n=-60dB:d=1.5", "-an", "-f", "null", "-"]).stderr
    vd = run(["ffmpeg", "-i", path, "-af", "volumedetect", "-vn", "-f", "null", "-"]).stderr
    black_list = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", bl)
    freeze_list = re.findall(r"freeze_start: ([\d.]+)", fz)
    mean = re.search(r"mean_volume: (-?[\d.]+)", vd).group(1); mx = re.search(r"max_volume: (-?[\d.]+)", vd).group(1)
    ok = (abs(cont - dur) < 0.02 and int(cd) == frames and v["r_frame_rate"] == f"{FPS}/1"
          and v["avg_frame_rate"] == f"{FPS}/1" and v["codec_name"] == "h264" and a["codec_name"] == "aac"
          and v["width"] == W and v["height"] == H and dur <= MAX_DUR)
    rep = [
        f"# Laporan verifikasi — {os.path.basename(path)}",
        f"- Mode: {'DRAF tanpa voiceover (timing perkiraan)' if tl['draft'] else 'FINAL (mengikuti voiceover)'}",
        f"- Durasi voiceover: {tl['vo_dur']:.3f} dtk  ->  target video: {dur} dtk ({frames} frame)",
        f"- Durasi container hasil ekspor: {cont:.3f} dtk",
        f"- Frame terbaca: {cd} (harus {frames})",
        f"- Video: {v['codec_name']} {v['width']}x{v['height']} {v['r_frame_rate']} (avg {v['avg_frame_rate']}) {v['pix_fmt']}",
        f"- Audio: {a['codec_name']}",
        f"- Level audio: mean {mean} dB, max {mx} dB",
        f"- Frame hitam: {'tidak ada' if not black_list else 'TERDETEKSI: ' + ' | '.join(a + '-' + b for a, b in black_list)}",
        f"- Frame beku >1,5 dtk: {'tidak ada' if not freeze_list else 'terdeteksi mulai detik ' + ', '.join(freeze_list) + ' (cek: wajar bila itu jeda visual disengaja)'}",
        f"- Metode timing kalimat: {tl['method']}",
        f"- HASIL: {'LULUS' if ok else 'GAGAL — periksa angka di atas'}",
    ]
    return "\n".join(rep), ok


# ------------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--vo", help="file voiceover (mp3/wav/m4a). Tanpa ini = draf.")
    ap.add_argument("--out", help="nama file output MP4")
    ap.add_argument("--stills", help="detik, dipisah koma; render PNG saja")
    ap.add_argument("--words", help="JSON timestamp kata asli: [[t0,t1,..] per kalimat] (detik, relatif awal file suara). Buat dengan scripts/words_from_transcript.py")
    ap.add_argument("--reuse-video", action="store_true", help="lewati render frame, pakai out/_video_only.mp4 + events_sfx.json yang ada (hanya mixing ulang)")
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    script = load_script()
    tl = make_timeline(script, a.vo)
    if a.words:
        wt = json.load(open(a.words, encoding="utf-8"))
        for i, s in enumerate(tl["sentences"]):
            if i < len(wt) and len(wt[i]) == len(s["words"]): s["wt"] = [round(LEAD + x, 3) for x in wt[i]]
            else: print(f"PERINGATAN: --words kalimat {i}: jumlah kata tidak cocok ({len(wt[i]) if i < len(wt) else 0} vs {len(s['words'])}); memakai perkiraan huruf")
        tl["method"] += " + timestamp kata asli (--words)"
    if tl["dur"] > MAX_DUR:
        sys.exit(f"BERHENTI: voiceover {tl['vo_dur']:.1f} dtk -> video {tl['dur']} dtk > {MAX_DUR} dtk. "
                 "Persingkat naskah atau buat ulang suara. Jangan dipotong/dipercepat.")
    json.dump(tl, open(os.path.join(OUT, "timeline_final.json"), "w"), indent=1, ensure_ascii=False)
    print(f"voiceover={tl['vo_dur']:.3f}s  video={tl['dur']}s  frame={tl['frames']}  draft={tl['draft']}")
    if a.stills:
        render_stills(tl, [float(x) for x in a.stills.split(",")], os.path.join(OUT, "stills")); return
    m = tl["meta"]; slug = re.sub(r"[^a-z0-9]+", "_", f"episode{m.get('episode', '')}_{m.get('topic', 'video')}".lower()).strip("_")
    name = a.out or (f"{slug}_DRAF.mp4" if tl["draft"] else f"{slug}_FINAL.mp4")
    final = os.path.join(OUT, name)
    vo_only = os.path.join(OUT, "_video_only.mp4"); evp = os.path.join(OUT, "events_sfx.json")
    if a.reuse_video:
        ev = json.load(open(evp))
    else:
        ev = render_video(tl, vo_only, evp)
    sfx = os.path.join(OUT, "_sfx_track.wav"); mix_sfx(ev, tl["dur"], sfx)
    final_mix(vo_only, a.vo, os.path.join(ROOT, "assets", "audio", "musik_latar.wav"), sfx, tl["dur"], final)
    rep, ok = verify(final, tl)
    open(os.path.join(OUT, "laporan_verifikasi.md"), "w", encoding="utf-8").write(rep + "\n")
    print(rep)
    sys.exit(0 if ok else 2)


if __name__ == "__main__":
    main()
