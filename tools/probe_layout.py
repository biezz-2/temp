#!/usr/bin/env python3
"""Probe geometri tiap scene: baca rect semua elemen teks, laporkan
   keluar safe-zone (x 60..1020, y 180..1590) dan pasangan yang tumpang tindih.

   python3 tools/probe_layout.py 44.9,48.5          # waktu absolut video
   python3 tools/probe_layout.py ALL                # sampling otomatis per scene
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAFE = (60, 180, 1020, 1590)  # toleransi 12px di luar zona ketat 72..1008 / 200..1560

TIMES = sys.argv[1] if len(sys.argv) > 1 else "ALL"

def sample_times():
    tl = json.load(open(os.path.join(ROOT, "out", "timeline_final.json")))
    ts = []
    for i, s in enumerate(tl["sentences"]):
        e = s["e"] + (0.9 if i == len(tl["sentences"]) - 1 else 0)
        ts += [(i, s["s"] + 0.4), (i, (s["s"] + s["e"]) / 2), (i, e - 0.15)]
    return ts

tl = json.load(open(os.path.join(ROOT, "out", "timeline_final.json")))

JS = """() => {
  const out = [];
  const els = document.querySelectorAll('body *');
  for (const el of els) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    if (cs.position === 'fixed') continue;
    let txt = '';
    for (const n of el.childNodes) if (n.nodeType === 3) txt += n.textContent;
    txt = txt.trim();
    const r = el.getBoundingClientRect();
    if (!txt && (el.tagName !== 'svg' && el.tagName !== 'rect' && el.tagName !== 'circle' &&
        el.tagName !== 'path' && el.tagName !== 'line' && !el.querySelector('rect,circle,path,line'))) continue;
    if (r.width < 2 || r.height < 2) continue;
    out.push({tag: el.tagName, cls: (el.className.baseVal !== undefined ? el.className.baseVal : el.className) || '',
              txt: txt.slice(0, 40), x: Math.round(r.x), y: Math.round(r.y),
              w: Math.round(r.width), h: Math.round(r.height)});
  }
  return out;
}"""

def check(items):
    probs = []
    for it in items:
        x2, y2 = it["x"] + it["w"], it["y"] + it["h"]
        if it["x"] < SAFE[0] - 14 or it["y"] < SAFE[1] - 14 or x2 > SAFE[2] + 14 or y2 > SAFE[3] + 14:
            probs.append(f"  OUT  [{it['tag']}.{it['cls']}] '{it['txt']}' rect=({it['x']},{it['y']},{it['w']},{it['h']})")
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            a, b = items[i], items[j]
            if not a["txt"] or not b["txt"]: continue
            ox = min(a["x"] + a["w"], b["x"] + b["w"]) - max(a["x"], b["x"])
            oy = min(a["y"] + a["h"], b["y"] + b["h"]) - max(a["y"], b["y"])
            if ox > 8 and oy > 8:
                small = min(a["w"] * a["h"], b["w"] * b["h"])
                if ox * oy > 0.25 * small:
                    probs.append(f"  OVER '{a['txt']}' X '{b['txt']}' ({ox}x{oy}px)")
    return probs

from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
    pg.goto("file://" + os.path.join(ROOT, "web", "scene.html"))
    pg.evaluate("tl => window.setup(tl)", tl)
    if TIMES.upper() == "ALL":
        samples = sample_times()
    else:
        samples = [(None, float(x)) for x in TIMES.split(",")]
    for k, t in samples:
        pg.evaluate("t => window.renderFrame(t)", t)
        items = pg.evaluate(JS)
        probs = check(items)
        head = f"scene {k}: t={t:.2f}" if k is not None else f"t={t:.2f}"
        if probs:
            print(head)
            for pr in probs[:25]: print(pr)
        else:
            print(head, "OK")
    b.close()
