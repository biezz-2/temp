#!/usr/bin/env python3
"""Buat naskah voiceover BERTIMESTAMP (md, json, srt) dari out/timeline_final.json.

Jalankan setelah `python3 build.py` (atau --stills) agar timeline_final.json ada:
    python3 tools/make_timestamps.py

Dua kolom waktu:
  - "di video"      : waktu pada video draf (sudah termasuk pembuka 1,0 dtk)
  - "di file suara" : waktu yang harus dicapai file voiceover (mulai dari 0) = di video - 1,0 dtk
Waktu per KATA adalah perkiraan (dibagi proporsional jumlah huruf), per KALIMAT juga perkiraan
selama belum ada voiceover asli. Setelah ada suara: python3 build.py --vo suara.mp3 -> timing mengikuti suara.
"""
import json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
LEAD = 1.0
tl = json.load(open(os.path.join(ROOT, "out", "timeline_final.json"), encoding="utf-8"))
ns = json.load(open(os.path.join(ROOT, "data", "naskah.json"), encoding="utf-8"))

def tc(x, srt=False):
    x = max(0.0, x); m = int(x // 60); s = x - m * 60
    return (f"{int(x//3600):02d}:{m:02d}:{int(s):02d},{int(round((s-int(s))*1000)):03d}" if srt else f"{m:02d}:{s:05.2f}")

rows, js, srt = [], [], []
for i, (s, meta) in enumerate(zip(tl["sentences"], ns["sentences"])):
    ws = s["words"]; tot = sum(len(w) + 1 for w in ws); cum = 0; wt = []
    for w in ws:
        a = s["s"] + cum / tot * (s["e"] - s["s"]); cum += len(w) + 1
        b = s["s"] + cum / tot * (s["e"] - s["s"]); wt.append({"kata": w, "mulai_video": round(a, 2), "mulai_suara": round(a - LEAD, 2), "selesai_suara": round(b - LEAD, 2)})
    js.append({"scene": i + 1, "id": meta["id"], "teks": s["spoken"], "mulai_video": round(s["s"], 2), "selesai_video": round(s["e"], 2),
               "mulai_suara": round(s["s"] - LEAD, 2), "selesai_suara": round(s["e"] - LEAD, 2), "kata": wt})
    rows.append(f"| {i+1:02d} | {tc(s['s'])}–{tc(s['e'])} | {tc(s['s']-LEAD)}–{tc(s['e']-LEAD)} | {s['spoken']} |")
    srt.append(f"{i+1}\n{tc(s['s']-LEAD, True)} --> {tc(s['e']-LEAD, True)}\n{s['spoken']}\n")

tot_words = sum(len(s["words"]) for s in tl["sentences"])
md = f"""# {ns['judul']} — Naskah Voiceover Bertimestamp

Total: **{tot_words} kata**, perkiraan suara **{tl['vo_dur']:.1f} dtk** → video **{tl['dur']} dtk** (maks. 60 dtk).
Aturan: durasi video = ceil(durasi suara + 1,0 dtk pembuka + 1,5 dtk penutup). Suara maksimal ≈ 57,5 dtk.

| Scene | Di video (mm:ss) | Di file suara (mm:ss) | Teks yang dibacakan |
|---|---|---|---|
""" + "\n".join(rows) + f"""

## Instruksi untuk AI pembuat suara
- Bahasa Indonesia, nada penjelas yang antusias tapi tenang, tempo ≈ 2,5 kata/detik (ritme draf ini).
- **Persis 8 kalimat/segmen** seperti tabel di atas. Beri **jeda ± 0,5 dtk** antar-kalimat (tanpa napas/noise keras) supaya `build.py` bisa mendeteksi 8 segmen otomatis.
- Mulai file suara langsung dari kata pertama (tanpa hening di awal); pembuka 1 dtk ditambahkan otomatis oleh `build.py`.
- Pelafalan: "D L S S" dibaca huruf per huruf (di-el-es-es); "empat K" = 4K; "RTX" dibaca huruf per huruf; "empat koma lima" = 4.5; "AI-nya" = "ey-ay-nya".
- Ekspor mp3/wav/m4a. Lalu: `python3 build.py --vo "Suara Voiceover.mp3"`.

## Timestamp per kata (perkiraan, detik di file suara)
"""
for j in js:
    md += f"\n**Scene {j['scene']:02d}** ({j['mulai_suara']:.2f}–{j['selesai_suara']:.2f}): " + " · ".join(f"{w['kata']} {w['mulai_suara']:.2f}" for w in j["kata"]) + "\n"
open(os.path.join(ROOT, "naskah_voiceover_timestamp.md"), "w", encoding="utf-8").write(md)
json.dump({"meta": ns["meta"], "durasi_suara_perkiraan": round(tl["vo_dur"], 2), "durasi_video": tl["dur"], "lead_detik": LEAD, "scene": js},
          open(os.path.join(ROOT, "naskah_voiceover_timestamp.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
open(os.path.join(ROOT, "naskah_voiceover.srt"), "w", encoding="utf-8").write("\n".join(srt))
print("OK: naskah_voiceover_timestamp.md/.json, naskah_voiceover.srt")
