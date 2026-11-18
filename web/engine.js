'use strict';
/* =====================================================================
   ENGINE kinetic typography (portrait 1080x1920) — file ini STABIL; isi scene ada di scenes.js
   Semua gerak = fungsi dari waktu t (detik). Tidak ada state tersembunyi,
   tidak ada angka acak, sehingga render selalu identik.
   Dipanggil dari build.py:
     await setup(TL)   -> membangun DOM dari timeline (TL.sentences[k].s/e/words)
     renderFrame(t)    -> menggambar satu frame
     getEvents()       -> daftar SFX [{t, n, v}]
   ===================================================================== */
const G = '#7c5cff', K = '#f2f2f7', GR = '#7f7f92', SAND = '#15151d';
const IMG = '../assets/images/';
const $ = id => document.getElementById(id);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, p) => a + (b - a) * p;
const EA = {
  lin: x => x,
  out: x => 1 - Math.pow(1 - x, 3),
  out5: x => 1 - Math.pow(1 - x, 5),
  io: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  back: x => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  slam: x => { const c1 = 3.2, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
};
const P = (t, t0, d, e = 'out') => EA[e](clamp((t - t0) / d));

let TL = null, S = [], B = [], SC = [], N = [];

/* ---- waktu kata: kata ke-i dari kalimat k, dibagi proporsional jumlah huruf ---- */
function tw(k, i) {
  const s = S[k];
  if (s.wt && s.wt[i] != null) return s.wt[i];     // timestamp kata ASLI (build.py --words), bila tersedia
  let tot = 0, cum = 0;
  s.words.forEach((w, j) => { const l = w.length + 1; if (j < i) cum += l; tot += l; });
  return s.s + (cum / tot) * (s.e - s.s);
}

/* ---- helper DOM ---- */
function mk(parent, cls, html = '', css = '') {
  const e = document.createElement('div'); e.className = cls; e.innerHTML = html; e.style.cssText = css;
  parent.appendChild(e); return e;
}
function newScene() { const s = mk($('scenes'), 'scene'); SC.push(s); return s; }
/* baris teks besar bertopeng; ukuran font disesuaikan agar baris terlebar muat di `max` */
function bigLines(parent, arr, o) {
  const w = mk(parent, 'abs', '', `left:${o.left ?? 72}px;top:${o.top}px;width:${o.max ?? 936}px;font-size:${o.size}px;`);
  const ins = arr.map((h, i) => {
    const ln = mk(w, 'big ln', `<span class="in">${h}</span>`, o.lineCss || '');
    return ln.firstChild;
  });
  let widest = 0; ins.forEach(e => widest = Math.max(widest, e.getBoundingClientRect().width));
  const max = o.max ?? 936;
  if (widest > max) w.style.fontSize = (o.size * max / widest * .995) + 'px';
  return { w, l: ins };
}
/* animasi masuk generik */
function A(el, t, t0, o = {}) {
  const d = o.d ?? .5, p = P(t, t0, d, o.e || 'out');
  const pr = clamp((t - t0) / (o.fd ?? Math.min(d, .28)));
  const s0 = o.s ?? 1;
  el.style.opacity = o.fade === false ? (t >= t0 ? 1 : 0) : pr;
  el.style.transform = `translate(${(o.x || 0) * (1 - p)}px,${(o.y || 0) * (1 - p)}px) translateY(${(o.yp || 0) * (1 - p)}%) scale(${s0 + (1 - s0) * p}) rotate(${(o.r || 0) * (1 - p)}deg)`;
}
/* baris topeng: naik dari bawah */
function LN(inEl, t, t0, d = .55) { A(inEl, t, t0, { yp: 112, d, e: 'out5', fade: false }); }
/* animasi keluar */
function O(el, t, t0, o = {}) {
  const d = o.d ?? .3, p = P(t, t0, d, 'io');
  el.style.opacity = 1 - p;
  el.style.transform = `translate(${(o.x || 0) * p}px,${(o.y || 0) * p}px) scale(${1 + ((o.s ?? 1) - 1) * p})`;
}
function grow(el, t, t0, d, axis = 'X', e = 'out5', origin = 'left center') {
  el.style.transformOrigin = origin; el.style.transform = `scale${axis}(${P(t, t0, d, e)})`;
}
const flt = (t, amp, sp, ph = 0) => Math.sin(t * sp + ph) * amp;
const img = (name, w, css = '') => `<img src="${IMG}${name}.svg" style="width:${w}px;${css}">`;

/* =====================================================================
   KOMPONEN GAYA "SIHIR PIKSEL" (dipakai ulang di semua scene)
   - PX        : kanvas yang bisa dipikselkan (blok kasar) + kaca pembesar + sapuan "disusun ulang"
   - paintGame : bingkai game buatan kode (datar, palet seri) — banyak detail halus agar kehilangan detail terlihat
   - textPaint : teks Inter Black di kanvas (agar kata bisa berubah dari piksel kasar jadi tajam)
   - grayWords : kata-kata pendukung abu-abu yang muncul satu per satu mengikuti suara
   ===================================================================== */
const rnd = seed => { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
const _tmp = document.createElement('canvas');
function pixelate(ctx, base, W, H, bs) {
  if (bs <= 1) { ctx.drawImage(base, 0, 0); return; }
  const w = Math.ceil(W / bs), h = Math.ceil(H / bs);
  _tmp.width = w; _tmp.height = h;
  const t = _tmp.getContext('2d'); t.imageSmoothingEnabled = true; t.imageSmoothingQuality = 'high';
  t.drawImage(base, 0, 0, W / bs, H / bs);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(_tmp, 0, 0, w, h, 0, 0, w * bs, h * bs);
}
/* tingkat blok (bulat) dari progres p: a -> b secara eksponensial, supaya terasa "bertahap" */
const lvl = (p, a, b) => Math.max(1, Math.round(Math.exp(lerp(Math.log(a), Math.log(b), clamp(p)))));

class PX {
  constructor(parent, W, H, paint, css = '') {
    this.W = W; this.H = H;
    this.base = document.createElement('canvas'); this.base.width = W; this.base.height = H;
    paint(this.base.getContext('2d'), W, H);
    this.cv = document.createElement('canvas'); this.cv.width = W; this.cv.height = H;
    this.cv.style.cssText = `position:absolute;${css}`;
    parent.appendChild(this.cv); this.ctx = this.cv.getContext('2d');
  }
  /* bs = ukuran blok piksel (1 = tajam). L = {cx,cy,r,m,a,sweep}: kaca pembesar + area yang sudah "disusun ulang" */
  draw(bs, L) {
    const { ctx: c, W, H, base } = this;
    c.clearRect(0, 0, W, H);
    pixelate(c, base, W, H, bs);
    c.imageSmoothingEnabled = true;
    if (L && L.sweep > 0) {
      c.save(); c.beginPath(); c.rect(0, 0, Math.min(W, L.sweep), H); c.clip(); c.drawImage(base, 0, 0); c.restore();
    }
    if (L && L.r > 2 && L.a > 0.01) {
      const { cx, cy, r } = L, m = L.m || 1.18;
      c.save(); c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.clip();
      c.translate(cx, cy); c.scale(m, m); c.translate(-cx, -cy); c.drawImage(base, 0, 0); c.restore();
      c.save(); c.globalAlpha = clamp(L.a);
      const ang = Math.PI * .27, hx = cx + Math.cos(ang) * (r + r * .06), hy = cy + Math.sin(ang) * (r + r * .06), len = r * .8;
      c.lineCap = 'round';
      c.strokeStyle = K; c.lineWidth = r * .17; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + Math.cos(ang) * len, hy + Math.sin(ang) * len); c.stroke();
      c.strokeStyle = K; c.lineWidth = r * .1 + 8; c.beginPath(); c.arc(cx, cy, r + r * .03, 0, 7); c.stroke();
      c.strokeStyle = G; c.lineWidth = r * .1; c.beginPath(); c.arc(cx, cy, r + r * .03, 0, 7); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = r * .06; c.beginPath(); c.arc(cx, cy, r * .76, Math.PI * 1.12, Math.PI * 1.42); c.stroke();
      c.restore();
    }
  }
}

function ridge(c, W, H, base, amp, col, r, n) {
  c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
  for (let i = 0; i <= n; i++) c.lineTo(i / n * W, H * base - r() * H * amp);
  c.lineTo(W, H); c.closePath(); c.fill();
}
function paintGame(v = 0) {
  return (c, W, H) => {
    const r = rnd(11 + v * 37), lw = Math.max(2, H / 250);
    c.fillStyle = '#fff'; c.fillRect(0, 0, W, H);
    c.fillStyle = K; for (let i = 0; i < 80; i++) c.fillRect(r() * W, r() * H * .5, 2, 2);
    const sx = W * (v % 2 ? .3 : .7), sy = H * .3, sr = H * .13;
    c.fillStyle = G; c.beginPath(); c.arc(sx, sy, sr, 0, 7); c.fill();
    c.strokeStyle = K; c.lineWidth = lw;
    for (let i = 0; i < 30; i++) { const a = i / 30 * 6.2832; c.beginPath(); c.moveTo(sx + Math.cos(a) * sr * 1.2, sy + Math.sin(a) * sr * 1.2); c.lineTo(sx + Math.cos(a) * sr * 1.6, sy + Math.sin(a) * sr * 1.6); c.stroke(); }
    ridge(c, W, H, .66, .16, SAND, r, 9); ridge(c, W, H, .75, .13, GR, r, 7);
    c.fillStyle = K;
    for (let i = 0; i < 16; i++) { const x = (i + .3 + r() * .4) / 16 * W, h = H * (.07 + r() * .05), w = h * .45; c.beginPath(); c.moveTo(x, H * .78 - h); c.lineTo(x + w, H * .78); c.lineTo(x - w, H * .78); c.closePath(); c.fill(); }
    c.fillRect(0, H * .78, W, H * .22);
    c.strokeStyle = G; c.lineWidth = Math.max(1.5, H / 300);
    for (let i = -9; i <= 9; i++) { c.beginPath(); c.moveTo(W / 2 + i * W * .02, H * .78); c.lineTo(W / 2 + i * W * .17, H); c.stroke(); }
    for (let j = 1; j < 6; j++) { const y = H * (.78 + .22 * Math.pow(j / 6, 1.6)); c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    c.strokeStyle = '#fff'; c.lineWidth = lw; const cx = W / 2, cy = H * .56, cr = H * .05;
    c.beginPath(); c.arc(cx, cy, cr, 0, 7); c.stroke();
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => { c.beginPath(); c.moveTo(cx + dx * cr * 1.3, cy + dy * cr * 1.3); c.lineTo(cx + dx * cr * 2.1, cy + dy * cr * 2.1); c.stroke(); });
    c.strokeRect(W * .04, H * .9, W * .26, H * .045); c.fillStyle = G; c.fillRect(W * .04, H * .9, W * .26 * (.55 + v * .1), H * .045);
    c.fillStyle = K; for (let i = 1; i < 10; i++) c.fillRect(W * .04 + W * .026 * i, H * .9, 2, H * .045);
  };
}
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function measureText(txt, size, ls = -.04) {
  const c = document.createElement('canvas').getContext('2d');
  c.font = `900 ${size}px Inter`; c.letterSpacing = `${ls * size}px`; return Math.ceil(c.measureText(txt).width);
}
function fitSize(txt, max, maxW) { const w = measureText(txt, 100); return Math.min(max, Math.floor(100 * maxW / w)); }
/* teks Inter Black di kanvas; o.bg = warna latar bulat (mis. highlight hijau) */
function textPaint(txt, size, color, o = {}) {
  return (c, W, H) => {
    if (o.bg) { c.fillStyle = o.bg; rr(c, 0, 0, W, H, size * .12); c.fill(); }
    c.fillStyle = color; c.font = `900 ${size}px Inter`; c.letterSpacing = `${-.04 * size}px`; c.textBaseline = 'alphabetic';
    c.fillText(txt, o.padX || 0, size * .8);
  };
}
function pxText(parent, txt, size, color, css, o = {}) {
  const padX = o.bg ? Math.round(size * .09) : 0;
  const W = measureText(txt, size) + padX * 2 + 6, H = Math.round(size * .92);
  const p = new PX(parent, W, H, textPaint(txt, size, color, { ...o, padX }), css);
  return p;
}
function grayWords(parent, words, css, size = 54) {
  const w = mk(parent, 'abs', '', `${css};font-size:${size}px;font-weight:600;color:#9b9a8e;white-space:nowrap`);
  const sp = words.map(x => { const s = document.createElement('span'); s.textContent = x; s.style.cssText = 'display:inline-block;margin-right:.28em'; w.appendChild(s); return s; });
  return { w, sp };
}
const pulse = (el, t, t0, amp = .14, k = 7) => { const u = t - t0; if (u > 0) el.style.transform = `scale(${1 + amp * Math.exp(-u * k)})`; };

/* =================================================================
   Wipe antar-scene: hijau menyapu, hitam menyusul (arah bergantian)
   ================================================================= */
function wipe(t) {
  const wg = $('wg'), wk = $('wk'); let on = false;
  for (let j = 1; j < S.length; j++) {
    const dt = t - B[j], hd = .24;
    if (dt > -hd && dt < hd) {
      on = true; const horiz = j % 2 === 1;
      const ax = horiz ? 'X' : 'Y';
      const put = (el, d) => {
        let tr, org;
        if (d < 0) { tr = EA.io(clamp((d + hd) / hd)); org = horiz ? 'left center' : 'center bottom'; }
        else { tr = 1 - EA.io(clamp(d / hd)); org = horiz ? 'right center' : 'center top'; }
        el.style.display = tr <= 0.0005 ? 'none' : 'block'; el.style.transformOrigin = org; el.style.transform = `scale${ax}(${tr})`;
      };
      put(wg, dt); put(wk, dt - .07);
    }
  }
  if (!on) { wg.style.display = 'none'; wk.style.display = 'none'; }
}

/* =================================================================
   API untuk build.py
   ================================================================= */
window.setup = async function (tl) {
  TL = tl; S = tl.sentences; B = [0];
  if (S.length !== BUILD.length) throw new Error(`Jumlah kalimat naskah (${S.length}) harus sama dengan jumlah scene (${BUILD.length}) di web/scenes.js`);
  const m = tl.meta || {};
  if (m.series || m.topic) $('hud-l').textContent = `${m.series || ''} · ${m.topic || ''}`;
  if (m.episode) $('hud-b').textContent = `EPISODE ${m.episode} · ${m.episode_title || ''}`;
  for (let k = 1; k < S.length; k++) B.push((S[k - 1].e + S[k].s) / 2);
  B.push(tl.dur);
  await Promise.all(['900', '800', '700', '600', '500', '400'].map(w => document.fonts.load(`${w} 40px Inter`)));
  await document.fonts.ready;
  $('scenes').classList.add('measure');
  BUILD.forEach(f => f());
  // tunggu semua gambar SVG selesai dimuat
  await Promise.all([...document.images].map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; })));
  $('scenes').classList.remove('measure');
  $('draft').style.display = tl.draft ? 'block' : 'none';
  return true;
};
window.renderFrame = function (t) {
  let k = 0; for (let i = 0; i < SC.length; i++) if (t >= B[i]) k = i;
  SC.forEach((s, i) => s.style.display = i === k ? 'block' : 'none');
  RENDER[k](t);
  $('hud-n').textContent = String(k + 1).padStart(2, '0') + '/' + String(SC.length).padStart(2, '0');
  $('prog').style.width = (clamp(t / TL.dur) * 1080) + 'px';
  wipe(t);
  return k;
};
window.getEvents = getEvents;
window.getBoundaries = () => B;
