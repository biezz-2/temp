# SAAS OTOMASI — Kinetic Typography Video

Video kinetic typography 1080x1920 @ 60 fps mempromosikan SaaS
"Satu brief → AI Agent → Postiz → 30+ platform sosial".
Semua animasi adalah fungsi murni dari waktu (deterministik, tanpa
Math.random/Date.now). 1 kalimat = 1 scene (15 scene).

## Pipeline

```bash
pip install -r requirements.txt            # playwright, pillow, imageio-ffmpeg/static-ffmpeg, numpy
python3 tools/make_audio.py                # musik latar 110s + 9 SFX (sekali saja)
export TTS_API_KEY=<API_KEY_ANDA>          # JANGAN ditulis di file repo
python3 tools/make_tts.py                  # voiceover Zephyr (cache out/tts_cache/)
python3 build.py                           # draf tanpa voiceover (timing perkiraan)
python3 build.py --vo out/voiceover.wav    # FINAL: timing mengikuti voiceover (silencedetect)
```

Hasil: `out/saas_otomasi_final.mp4` + laporan verifikasi
`out/laporan_verifikasi.md` (fps 60/1, durasi, cek frame hitam).

Tool tambahan:

- `tools/make_timestamps.py` — skrip bertimestamp dari `out/timeline_final.json`.
- `tools/probe_layout.py` — QA geometri: rect semua elemen vs zona aman
  (x 72-1008 / y 200-1560) dan deteksi tumpang tindih teks.

## Struktur

- `web/scene.html` — kanvas + CSS; font Inter disuntik lewat JS FontFace API
  (base64 di `window.__fonts`) karena headless Chromium memblokir file:// font.
- `web/engine.js` — mesin: timeline, easing, wipe antar scene, audio event.
- `web/scenes.js` — 15 scene (build{k} membangun DOM sekali, r{k}(t) murni).
- `data/naskah.json` — 15 kalimat naskah (S2 "S A A S" diucapkan per huruf).
- `data/kartu_beat.md` — Beat Cards: peran scene, keyword, makna→gerak, motif.
- `web/fonts/` — Inter OTF (sumber embedding).
- `assets/audio/` — musik + SFX sintetis.

## Konvensi penting

- Warna: bg `#0a0a0f`, teks `#f2f2f7`, abu `#7f7f92`, kartu `#14141d/#101018`,
  aksen ungu `#7c5cff`, teks-di-aksen `#0a0a12`.
- Zona aman: HUD atas (y<200) & label bawah (y>1560) di luar area konten.
- Motif tanda tangan: FAN-OUT (scene 3, 10, 14) — satu node BRIEF menyebar
  ke banyak channel.
- SFX di `getEvents()` mengikat waktu `tw(k, i)` yang sama dengan visual.

## TTS

Default `tools/make_tts.py` mengarah ke endpoint downstream yang balas
WAV/MP3 binary, model `gemini/gemini-3.1-flash-tts-preview/Zephyr`,
`language: Indonesian`. Endpoint bisa diganti via `TTS_URL` / `TTS_MODEL`.
API key hanya dibaca dari env `TTS_API_KEY` atau file di luar repo.
