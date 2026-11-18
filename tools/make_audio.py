#!/usr/bin/env python3
"""Membuat musik latar + SFX sintetis (tanpa internet, tanpa lisensi pihak ketiga).
Output: assets/audio/musik_latar.wav (48 kHz stereo, 62 detik) dan assets/audio/sfx/*.wav
Jalankan: python3 tools/make_audio.py
"""
import os, wave
import numpy as np
from scipy.signal import lfilter, butter, sosfilt

SR = 48000
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "assets", "audio")
rng = np.random.default_rng(13)  # seed tetap -> hasil selalu sama


def save(path, x, peak=0.89):
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    m = np.max(np.abs(x)) or 1.0
    x = x / m * peak
    pcm = (x * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def tt(d):
    return np.arange(int(SR * d)) / SR


def env_exp(n, decay):
    return np.exp(-np.arange(n) / SR * decay)


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, "low", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def fade(x, a=0.005, b=0.02):
    n = len(x); fa = int(SR * a); fb = int(SR * b)
    x = x.copy()
    if fa: x[:fa] *= np.linspace(0, 1, fa)
    if fb: x[-fb:] *= np.linspace(1, 0, fb)
    return x


# ------------------------------------------------------------------ SFX
def whoosh(d=0.5, f0=400, f1=5000, up=True):
    n = int(SR * d); noise = rng.standard_normal(n)
    out = np.zeros(n); blocks = 24; bl = n // blocks
    for i in range(blocks):
        p = i / (blocks - 1)
        fc = f0 * (f1 / f0) ** (p if up else 1 - p)
        seg = noise[i * bl:(i + 1) * bl if i < blocks - 1 else n]
        sos = butter(2, [fc * 0.6, min(fc * 1.6, SR / 2 - 100)], "band", fs=SR, output="sos")
        out[i * bl:i * bl + len(seg)] = sosfilt(sos, seg)
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.6
    return fade(out * e, 0.004, 0.03)


def pop(d=0.16, f0=720, f1=300):
    t = tt(d); f = f1 + (f0 - f1) * np.exp(-t * 40)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return fade(np.sin(ph) * env_exp(len(t), 28) + 0.25 * lp(rng.standard_normal(len(t)), 3000) * env_exp(len(t), 90))


def tick(d=0.05):
    t = tt(d); return fade(bp(rng.standard_normal(len(t)), 2500, 7000) * env_exp(len(t), 160), 0.0005, 0.005)


def stamp(d=0.55):
    t = tt(d); f = 42 + 80 * np.exp(-t * 18)
    ph = 2 * np.pi * np.cumsum(f) / SR
    thump = np.sin(ph) * env_exp(len(t), 9)
    crack = lp(rng.standard_normal(len(t)), 4500) * env_exp(len(t), 55) * 0.6
    return fade(thump + crack, 0.0008, 0.05)


def ding(d=0.8):
    t = tt(d)
    x = (np.sin(2 * np.pi * 1318.5 * t) + 0.5 * np.sin(2 * np.pi * 1975.5 * t) + 0.25 * np.sin(2 * np.pi * 2637 * t)) * env_exp(len(t), 6)
    return fade(x, 0.002, 0.08)


def riser(d=1.2):
    n = int(SR * d); t = tt(d)
    f = 200 * (6 ** (t / d))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.35
    nz = bp(rng.standard_normal(n), 800, 9000) * (t / d) ** 2
    return fade((tone + nz * 0.8) * (t / d) ** 1.3, 0.01, 0.01)


def buzz(d=0.3):  # peringatan lembut untuk "dibatalkan"
    t = tt(d); x = np.sign(np.sin(2 * np.pi * 110 * t)) * 0.4 + np.sin(2 * np.pi * 165 * t) * 0.3
    return fade(lp(x, 900) * env_exp(len(t), 7), 0.003, 0.04)


def sfx_all():
    d = os.path.join(OUT, "sfx"); os.makedirs(d, exist_ok=True)
    for name, x in {
        "whoosh_up": whoosh(0.5, 400, 5200, True),
        "whoosh_down": whoosh(0.45, 4500, 350, False),
        "swipe_short": whoosh(0.28, 900, 6000, True),
        "pop": pop(),
        "tick": tick(),
        "stamp": stamp(),
        "ding": ding(),
        "riser": riser(1.2),
        "buzz": buzz(),
    }.items():
        save(os.path.join(d, name + ".wav"), x, 0.9)
        print("sfx", name)


# ---------------------------------------------------------------- Musik
BPM = 112
BEAT = 60 / BPM
NOTE = {"A": 57, "F": 53, "C": 48, "G": 55, "E": 52, "D": 50}


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def music(total=62.0):
    n = int(SR * total); L = np.zeros(n); R = np.zeros(n)
    prog = [("A", [0, 3, 7]), ("F", [0, 4, 7]), ("C", [0, 4, 7]), ("G", [0, 4, 7])]
    bar = 4 * BEAT; chord_len = 2 * bar

    def add(buf, x, start):
        s = int(start * SR); e = min(n, s + len(x))
        if s < n: buf[s:e] += x[:e - s]

    ci = 0; t0 = 0.0
    while t0 < total:
        root, ints = prog[ci % 4]; base = NOTE[root] + 12  # oktaf menengah
        # PAD: saw terdetune + lowpass
        d = chord_len + 0.6; tp = tt(d); pad = np.zeros(len(tp))
        for iv in ints:
            for det in (-0.07, 0.0, 0.07):
                f = midi(base + iv + det)
                pad += 2 * ((f * tp) % 1.0) - 1.0
        pad = lp(pad, 1400) / 9
        pe = np.minimum(1, tp / 0.7) * np.minimum(1, (d - tp) / 0.8)
        add(L, pad * pe * 0.55, t0); add(R, pad * pe * 0.55, t0 + 0.012)
        # BASS: 8th notes
        for k in range(16):
            ts = t0 + k * BEAT / 2
            if k % 4 == 3: continue
            tb = tt(BEAT / 2 * 0.95); f = midi(NOTE[root] - 12)
            b = np.sin(2 * np.pi * f * tb) + 0.25 * np.sin(2 * np.pi * 2 * f * tb)
            b *= env_exp(len(tb), 7) * 0.5
            add(L, b, ts); add(R, b, ts)
        # ARP: 16th pluck
        pat = [0, 1, 2, 1, 2, 1, 0, 2]
        for k in range(32):
            ts = t0 + k * BEAT / 4
            iv = ints[pat[k % 8]] + (12 if (k // 8) % 2 else 0)
            f = midi(base + 12 + iv); ta = tt(0.28)
            a = (np.sin(2 * np.pi * f * ta) + 0.35 * np.sin(2 * np.pi * 2 * f * ta)) * env_exp(len(ta), 14) * 0.16
            pan = 0.5 + 0.35 * np.sin(k * 0.7)
            add(L, a * (1 - pan) * 1.4, ts); add(R, a * pan * 1.4, ts)
        t0 += chord_len; ci += 1

    # KICK lembut tiap beat 1 & 3, HAT tipis tiap off-beat
    nb = int(total / BEAT)
    for b in range(nb):
        ts = b * BEAT
        if b % 2 == 0:
            tk = tt(0.22); f = 48 + 90 * np.exp(-tk * 30)
            k = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(len(tk), 14) * 0.55
            add(L, k, ts); add(R, k, ts)
        th = ts + BEAT / 2; tk = tt(0.05)
        h = bp(rng.standard_normal(len(tk)), 6000, 12000) * env_exp(len(tk), 90) * 0.06
        add(L, h, th); add(R, h, th)
    st = np.stack([L, R], 1)
    fi = int(SR * 1.0); st[:fi] *= np.linspace(0, 1, fi)[:, None]
    fo = int(SR * 2.0); st[-fo:] *= np.linspace(1, 0, fo)[:, None]
    return st


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    sfx_all()
    save(os.path.join(OUT, "musik_latar.wav"), music(110.0), 0.85)
    print("musik_latar.wav selesai")
