'use strict';
/* =====================================================================
   SAAS OTOMASI · "SATU BRIEF SEMUA CHANNEL" — 15 scene.
   Motif tanda tangan: FAN-OUT (satu node BRIEF menyebar ke banyak channel).
   Sistem: bg #0a0a0f · teks #f2f2f7 · gray #7f7f92 · kartu #14141d · aksen #7c5cff.
   Semua gerak = fungsi murni dari t (detik). Waktu kata = tw(k, i).
   ===================================================================== */

const ACC = '#7c5cff', INKD = '#0a0a12';
const checkSvg = (sz = 110, col = ACC) => `<svg width="${sz}" height="${sz}" viewBox="0 0 110 110"><circle cx="55" cy="55" r="44" fill="none" stroke="${col}" stroke-width="12"/><path d="M36 57 L50 71 L76 41" fill="none" stroke="${col}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const playSvg = '<svg width="150" height="150" viewBox="0 0 150 150"><circle cx="75" cy="75" r="70" fill="none" stroke="#7c5cff" stroke-width="10"/><path d="M60 45 L110 75 L60 105 Z" fill="#7c5cff"/></svg>';
const loopSvg = '<svg width="170" height="170" viewBox="0 0 170 170"><path d="M85 22 A63 63 0 1 1 24 90" fill="none" stroke="#7c5cff" stroke-width="14" stroke-linecap="round"/><path d="M60 8 L92 24 L62 44 Z" fill="#7c5cff"/></svg>';

/* satu baris antrian/checklist: nomor + kata + centang */
function stepRow(parent, num, word, top) {
  const w = mk(parent, 'abs', '', `left:72px;top:${top}px;width:936px;height:170px`);
  const numEl = mk(w, 'abs', `<span style="font-weight:800;font-size:44px;letter-spacing:.1em;color:#7f7f92">${num}</span>`, 'left:0;top:38px');
  const wordEl = mk(w, 'abs', `<span style="font-weight:900;font-size:118px;letter-spacing:-.04em;color:#f2f2f7">${word}</span>`, 'left:96px;top:0;white-space:nowrap');
  const ck = mk(w, 'abs', checkSvg(88), 'right:14px;top:36px');
  return { w, numEl, wordEl, ck };
}
/* garis fan-out: wrapper diputar statis, garis di dalamnya tumbuh. end = pill di ujungnya */
function fanLine(parent, ox, oy, ang, len, label, fs = 54) {
  const w = mk(parent, 'abs', '', `left:${ox}px;top:${oy}px;width:${len}px;height:0`);
  const line = mk(w, 'abs', '', `left:0;top:-6px;width:${len}px;height:12px;background:${ACC};border-radius:6px;transform-origin:left center;transform:scaleX(0)`);
  w.style.transform = `rotate(${ang}deg)`;
  const ex = ox + Math.cos(ang * Math.PI / 180) * len, ey = oy + Math.sin(ang * Math.PI / 180) * len;
  const end = label ? mk(parent, 'pill dark', label, `left:${ex - 90}px;top:${ey - 44}px;font-size:${fs}px;padding:12px 30px`) : null;
  return { w, line, end };
}

/* =================================================================
   SCENE 0 — HOOK: "Bayangkan brief pagi ini langsung jadi video, jadi voiceover, dan jadi postingan."
   ================================================================= */
function build0() {
  const sc = newScene(), n = { sc };
  n.g = grayWords(sc, ['Bayangkan', 'pagi', 'ini', 'langsung'], 'left:72px;top:235px');
  n.chip = mk(sc, 'pill', 'BRIEF', 'left:72px;top:320px;font-size:64px;padding:10px 36px');
  n.v = bigLines(sc, ['VIDEO'], { top: 460, size: 260 });
  n.vo = bigLines(sc, ['VOICEOVER'], { top: 740, size: 190 });
  n.po = bigLines(sc, ['POSTINGAN'], { top: 960, size: 160 });
  N[0] = n;
}
function r0(t) {
  const n = N[0], t1 = tw(0, 1), p1 = P(t, t1, .45, 'slam');
  n.g.sp.forEach((s, i) => A(s, t, tw(0, [0, 2, 3, 4][i]), { y: 24, d: .35 }));
  n.chip.style.opacity = t >= t1 ? 1 : 0;
  n.chip.style.transform = `translateY(${(1 - p1) * -80 + (p1 >= 1 ? flt(t, 5, 2.1) : 0)}px)`;
  LN(n.v.l[0], t, tw(0, 6), .5);
  LN(n.vo.l[0], t, tw(0, 8), .5);
  LN(n.po.l[0], t, tw(0, 11), .5);
}

/* =================================================================
   SCENE 1 — NEGASI: "Tanpa editor, tanpa jadwal kacau, tanpa telat unggah."
   ================================================================= */
function build1() {
  const sc = newScene(), n = { sc };
  n.tp = bigLines(sc, ['TANPA'], { top: 280, size: 280 });
  n.stp = mk(sc, 'abs', '', 'left:80px;top:420px;width:610px;height:16px;background:#f2f2f7;border-radius:8px;transform-origin:left center;transform:scaleX(0)');
  n.r1 = mk(sc, 'abs', '<span style="font-weight:900;font-size:150px;letter-spacing:-.04em;color:#7f7f92">EDITOR</span>', 'left:72px;top:640px;white-space:nowrap');
  n.s1 = mk(sc, 'abs', '', 'left:80px;top:712px;width:400px;height:14px;background:#f2f2f7;border-radius:8px;transform-origin:left center;transform:scaleX(0)');
  n.r2 = mk(sc, 'abs', '<span style="font-weight:900;font-size:110px;letter-spacing:-.04em;color:#7f7f92;white-space:nowrap">JADWAL KACAU</span>', 'left:72px;top:870px;white-space:nowrap');
  n.s2 = mk(sc, 'abs', '', 'left:80px;top:934px;width:660px;height:12px;background:#f2f2f7;border-radius:8px;transform-origin:left center;transform:scaleX(0)');
  n.r3 = mk(sc, 'abs', '<span style="font-weight:900;font-size:110px;letter-spacing:-.04em;color:#7f7f92;white-space:nowrap">TELAT UNGGAH</span>', 'left:72px;top:1050px;white-space:nowrap');
  n.s3 = mk(sc, 'abs', '', 'left:80px;top:1114px;width:660px;height:12px;background:#f2f2f7;border-radius:8px;transform-origin:left center;transform:scaleX(0)');
  N[1] = n;
}
function r1(t) {
  const n = N[1];
  LN(n.tp.l[0], t, tw(1, 0), .5);
  grow(n.stp, t, tw(1, 1) + .2, .4, 'X', 'out5');
  A(n.r1, t, tw(1, 1), { y: 60, d: .45 });
  grow(n.s1, t, tw(1, 2) + .1, .3, 'X', 'out5');
  A(n.r2, t, tw(1, 3), { y: 60, d: .45 });
  grow(n.s2, t, tw(1, 5) + .1, .3, 'X', 'out5');
  A(n.r3, t, tw(1, 6), { y: 60, d: .45 });
  grow(n.s3, t, tw(1, 7) + .25, .3, 'X', 'out5');
}

/* =================================================================
   SCENE 2 — DEFINISI: "Mesin otomasi konten video yang kita bangun sebagai S A A S."
   ================================================================= */
function build2() {
  const sc = newScene(), n = { sc };
  n.g0 = grayWords(sc, ['Mesin'], 'left:72px;top:235px');
  n.w1 = bigLines(sc, ['MESIN'], { top: 300, size: 260 });
  n.w2 = bigLines(sc, ['OTOMASI'], { top: 580, size: 250 });
  n.w3 = bigLines(sc, ['KONTEN', 'VIDEO'], { top: 850, size: 130 });
  n.g2 = grayWords(sc, ['yang', 'kita', 'bangun', 'sebagai'], 'left:72px;top:1130px');
  const L = x => `<span class="hl L" style="margin-right:.05em">${x}</span>`;
  n.aa = bigLines(sc, [L('S') + L('A') + L('A') + L('S')], { top: 1200, size: 280 });
  n.letters = [...n.aa.l[0].querySelectorAll('.L')];
  N[2] = n;
}
function r2(t) {
  const n = N[2];
  A(n.g0.sp[0], t, tw(2, 0), { y: 24, d: .4 });
  LN(n.w1.l[0], t, tw(2, 1), .55);
  LN(n.w2.l[0], t, tw(2, 2), .55);
  LN(n.w3.l[0], t, tw(2, 3), .5); LN(n.w3.l[1], t, tw(2, 4), .5);
  n.g2.sp.forEach((s, i) => A(s, t, tw(2, 5 + i), { y: 24, d: .35 }));
  n.letters.forEach((el, i) => {
    A(el, t, tw(2, 8 + i), { s: .2, r: i % 2 ? -22 : 22, d: .45, e: 'slam' });
    pulse(el, t, tw(2, 8 + i) + .5);
  });
}

/* =================================================================
   SCENE 3 — MOTIF (teaser): "Cara kerjanya cukup satu jalur mulus."
   ================================================================= */
function build3() {
  const sc = newScene(), n = { sc };
  n.g = grayWords(sc, ['Cara', 'kerjanya', 'cukup'], 'left:72px;top:235px');
  n.w1 = bigLines(sc, ['SATU'], { top: 300, size: 280 });
  n.w2 = bigLines(sc, ['JALUR'], { top: 600, size: 280 });
  n.w3 = bigLines(sc, ['<span class="hl">MULUS</span>'], { top: 920, size: 240 });
  n.rail = mk(sc, 'abs', '', 'left:200px;top:1200px;width:12px;height:330px;background:#2a2a3a;border-radius:8px;transform-origin:top center;transform:scaleY(0)');
  n.n1 = mk(sc, 'pill dark', 'BRIEF', 'left:250px;top:1176px;font-size:42px;padding:10px 28px');
  n.n2 = mk(sc, 'pill dark', 'RENDER', 'left:250px;top:1336px;font-size:42px;padding:10px 28px');
  n.n3 = mk(sc, 'pill', 'POSTING', 'left:250px;top:1496px;font-size:42px;padding:10px 28px');
  N[3] = n;
}
function r3(t) {
  const n = N[3];
  n.g.sp.forEach((s, i) => A(s, t, tw(3, i), { y: 24, d: .35 }));
  LN(n.w1.l[0], t, tw(3, 3), .55);
  LN(n.w2.l[0], t, tw(3, 4), .55);
  LN(n.w3.l[0], t, tw(3, 5), .85);
  grow(n.rail, t, tw(3, 4) + .15, .8, 'Y', 'io');
  [n.n1, n.n2, n.n3].forEach((el, i) => A(el, t, tw(3, 4) + .35 + i * .3, { x: -50, s: .6, d: .4, e: 'back' }));
}

/* =================================================================
   SCENE 4 — INPUT: "Pelanggan memberi satu topik atau brief singkat."
   ================================================================= */
function build4() {
  const sc = newScene(), n = { sc };
  n.k = mk(sc, 'kick', 'PELANGGAN', 'left:72px;top:235px;font-size:30px');
  n.card = mk(sc, 'card', '', 'left:72px;top:300px;width:936px;height:340px');
  n.av = mk(n.card, 'abs', '', 'left:48px;top:48px;width:80px;height:80px;border-radius:50%;background:#2a2a3a');
  n.bl1 = mk(n.card, 'abs', '', 'left:160px;top:60px;width:520px;height:26px;border-radius:14px;background:#22222e');
  n.bl2 = mk(n.card, 'abs', '', 'left:160px;top:106px;width:380px;height:26px;border-radius:14px;background:#22222e');
  n.bch = mk(n.card, 'pill', 'BRIEF BARU', 'position:absolute;left:48px;top:210px;font-size:56px;padding:10px 32px');
  n.g = grayWords(sc, ['satu', 'topik', 'atau'], 'left:72px;top:700px');
  n.b = bigLines(sc, ['<span class="hl">BRIEF</span>'], { top: 770, size: 320 });
  n.ul = mk(sc, 'bar', '', 'left:72px;top:1110px;width:560px;height:18px');
  n.k2 = mk(sc, 'kick', 'SINGKAT', 'left:72px;top:1170px;font-size:26px');
  N[4] = n;
}
function r4(t) {
  const n = N[4], tS = tw(4, 1), u = t - tS - .2;
  const p = P(t, tS, .45, 'slam'), sh = u > 0 ? Math.exp(-u * 11) : 0;
  A(n.k, t, tw(4, 0), { y: 20, d: .4 });
  n.card.style.opacity = t >= tS ? 1 : 0;
  n.card.style.transform = `translateY(${(1 - p) * -520 + (u > 0 ? Math.exp(-u * 10) * Math.sin(u * 34) * 6 : 0) + (u > .6 ? flt(t, 5, 2.2) : 0)}px)`;
  n.sc.style.transform = `translate(${Math.sin(u * 83) * 9 * sh}px,${Math.cos(u * 71) * 8 * sh}px)`;
  A(n.bl1, t, tS + .3, { x: 40, d: .4 }); A(n.bl2, t, tS + .45, { x: 40, d: .4 });
  A(n.bch, t, tw(4, 2) + .55, { s: .4, d: .45, e: 'back' });
  n.g.sp.forEach((s, i) => A(s, t, tw(4, 2 + i), { y: 24, d: .35 }));
  LN(n.b.l[0], t, tw(4, 5), .5);
  grow(n.ul, t, tw(4, 6), .4);
  A(n.k2, t, tw(4, 6), { y: 20, d: .4 });
}

/* =================================================================
   SCENE 5 — URUTAN: "Agen AI melakukan riset, menulis naskah, lalu merekam voiceover."
   ================================================================= */
function build5() {
  const sc = newScene(), n = { sc };
  n.h = bigLines(sc, ['AGEN <span class="hl">AI</span>'], { top: 300, size: 230 });
  n.ai = n.h.l[0].querySelector('.hl');
  n.g1 = grayWords(sc, ['melakukan'], 'left:72px;top:560px');
  n.s1 = stepRow(sc, '01', 'RISET', 630);
  n.g2 = grayWords(sc, ['menulis'], 'left:72px;top:770px');
  n.s2 = stepRow(sc, '02', 'NASKAH', 910);
  n.g3 = grayWords(sc, ['lalu', 'merekam'], 'left:72px;top:1110px');
  n.s3 = stepRow(sc, '03', 'VOICEOVER', 1230);
  N[5] = n;
}
function r5(t) {
  const n = N[5];
  LN(n.h.l[0], t, tw(5, 0), .55);
  pulse(n.ai, t, tw(5, 1), .18, 6);
  A(n.g1.sp[0], t, tw(5, 2), { y: 24, d: .35 });
  A(n.s1.w, t, tw(5, 3), { x: -60, s: .95, d: .45, e: 'back' });
  A(n.s1.ck, t, tw(5, 3) + .3, { s: .2, r: -40, d: .5, e: 'slam' });
  A(n.g2.sp[0], t, tw(5, 4), { y: 24, d: .35 });
  A(n.s2.w, t, tw(5, 5), { x: -60, s: .95, d: .45, e: 'back' });
  A(n.s2.ck, t, tw(5, 5) + .3, { s: .2, r: -40, d: .5, e: 'slam' });
  A(n.g3.sp[0], t, tw(5, 6), { y: 24, d: .35 });
  A(n.g3.sp[1], t, tw(5, 7), { y: 24, d: .35 });
  A(n.s3.w, t, tw(5, 8), { x: -60, s: .95, d: .45, e: 'back' });
  A(n.s3.ck, t, tw(5, 8) + .3, { s: .2, r: -40, d: .5, e: 'slam' });
}

/* =================================================================
   SCENE 6 — RENDER: "Hasilnya dirender jadi video vertikal, lengkap dengan caption per platform."
   ================================================================= */
function build6() {
  const sc = newScene(), n = { sc };
  n.g0 = grayWords(sc, ['Hasilnya', 'dirender', 'jadi'], 'left:72px;top:235px');
  n.v = bigLines(sc, ['VIDEO'], { top: 310, size: 240 });
  n.vt = bigLines(sc, ['<span class="hl">VERTIKAL</span>'], { top: 570, size: 190 });
  n.card = mk(sc, 'card', '', 'left:240px;top:820px;width:600px;height:600px');
  n.kick = mk(n.card, 'kick', 'VIDEO AI', 'position:absolute;left:44px;top:40px;font-size:26px');
  n.pl = mk(n.card, 'abs', playSvg, 'left:225px;top:190px');
  n.cap = mk(n.card, 'pill dark', 'CAPTION', 'position:absolute;left:44px;top:490px;font-size:52px;padding:10px 28px');
  n.k2 = mk(sc, 'kick', 'CAPTION BERBEDA PER PLATFORM', 'left:72px;top:1470px;font-size:26px');
  N[6] = n;
}
function r6(t) {
  const n = N[6], tC = tw(6, 5) + .1;
  const p = P(t, tC, .6, 'back');
  n.g0.sp.forEach((s, i) => A(s, t, tw(6, i), { y: 24, d: .35 }));
  LN(n.v.l[0], t, tw(6, 3), .5);
  LN(n.vt.l[0], t, tw(6, 4), .6);
  n.card.style.opacity = t >= tC ? 1 : 0;
  n.card.style.transform = `translateY(${(1 - p) * 140 + (p >= 1 ? flt(t, 5, 2.1) : 0)}px) scale(${.9 + .1 * p})`;
  A(n.pl, t, tC + .5, { s: .5, d: .45, e: 'back' });
  A(n.cap, t, tw(6, 7), { y: 40, s: .6, d: .45, e: 'back' });
  A(n.k2, t, tw(6, 9), { y: 20, d: .4 });
}

/* =================================================================
   SCENE 7 — POSTIZ: "Setiap video masuk ke Postiz, satu antrian untuk semua channel."
   ================================================================= */
function build7() {
  const sc = newScene(), n = { sc };
  n.g0 = grayWords(sc, ['Setiap', 'video', 'masuk', 'ke'], 'left:72px;top:235px');
  n.pz = mk(sc, 'pill', 'POSTIZ', 'left:72px;top:310px;font-size:170px;padding:2px 44px;line-height:1.1');
  n.g1 = grayWords(sc, ['satu', 'antrian', 'untuk', 'semua', 'channel'], 'left:72px;top:580px');
  n.q1 = mk(sc, 'pill dark', '01&nbsp;&nbsp;YOUTUBE', 'left:72px;top:690px;font-size:74px;padding:16px 40px');
  n.q2 = mk(sc, 'pill dark', '02&nbsp;&nbsp;TIKTOK', 'left:72px;top:870px;font-size:74px;padding:16px 40px');
  n.q3 = mk(sc, 'pill dark', '03&nbsp;&nbsp;INSTAGRAM', 'left:72px;top:1050px;font-size:74px;padding:16px 40px');
  n.q4 = mk(sc, 'kick', '· · ·', 'left:96px;top:1240px;font-size:56px');
  N[7] = n;
}
function r7(t) {
  const n = N[7], tQ = tw(7, 6);
  n.g0.sp.forEach((s, i) => A(s, t, tw(7, i), { y: 24, d: .35 }));
  A(n.pz, t, tw(7, 4), { s: .4, d: .5, e: 'slam' });
  n.g1.sp.forEach((s, i) => A(s, t, tw(7, 5 + i), { y: 24, d: .35 }));
  [n.q1, n.q2, n.q3, n.q4].forEach((el, i) => A(el, t, tQ + i * .13, { x: -70, d: .4, e: 'back' }));
}

/* =================================================================
   SCENE 8 — TEMPORAL: "Temporal mengatur jadwal, dan mencoba lagi otomatis kalau gagal."
   ================================================================= */
function build8() {
  const sc = newScene(), n = { sc };
  n.k = mk(sc, 'kick', 'TEMPORAL', 'left:72px;top:235px;font-size:30px');
  n.j = bigLines(sc, ['JADWAL'], { top: 300, size: 270 });
  n.cells = [0, 1, 2, 3, 4].map(i => mk(sc, 'abs', '', `left:${72 + i * 190}px;top:640px;width:170px;height:170px;border-radius:26px;background:#1c1c28;border:3px solid #2a2a3a`));
  n.lo = mk(sc, 'abs', loopSvg, 'left:72px;top:880px');
  n.cl = mk(sc, 'pill dark', 'COBA LAGI', 'left:300px;top:910px;font-size:100px;padding:10px 40px');
  n.ot = bigLines(sc, ['<span class="hl">OTOMATIS</span>'], { top: 1140, size: 170 });
  n.gl = grayWords(sc, ['kalau', 'gagal.'], 'left:112px;top:1370px');
  N[8] = n;
}
function r8(t) {
  const n = N[8], tJ = tw(8, 2), tL = tw(8, 4), tO = tw(8, 6), tG = tw(8, 8);
  A(n.k, t, tw(8, 0), { y: 20, d: .4 });
  LN(n.j.l[0], t, tJ, .55);
  n.cells.forEach((c, i) => {
    const p = P(t, tJ + .2 + i * .1, .35, 'back');
    c.style.opacity = p > 0 ? 1 : 0;
    c.style.transform = `scale(${.6 + .4 * p})`;
  });
  n.lo.style.opacity = t > tL ? 1 : 0;
  n.lo.style.transform = `rotate(${t > tL ? (t - tL) * 160 : 0}deg)`;
  A(n.cl, t, tw(8, 5), { s: .4, d: .45, e: 'back' });
  LN(n.ot.l[0], t, tO, .5);
  const sh = t >= tG ? 10 * Math.exp(-(t - tG) * 9) : 0;
  n.ot.w.style.transform = `translate(${Math.sin(t * 57) * sh}px,0)`;
  n.gl.sp.forEach((s, i) => A(s, t, tw(8, 8 + i), { y: 24, d: .35 }));
}

/* =================================================================
   SCENE 9 — 3 CHANNEL: "Tiga channel siap duluan: YouTube, TikTok, dan Instagram."
   ================================================================= */
function build9() {
  const sc = newScene(), n = { sc };
  n.g = grayWords(sc, ['Tiga', 'channel'], 'left:72px;top:235px');
  n.s = bigLines(sc, ['<span class="hl">SIAP</span>'], { top: 300, size: 300 });
  n.du = mk(sc, 'kick', 'DULUAN', 'left:72px;top:620px;font-size:28px');
  n.c1 = stepRow(sc, '01', 'YOUTUBE', 700);
  n.c2 = stepRow(sc, '02', 'TIKTOK', 940);
  n.c3 = stepRow(sc, '03', 'INSTAGRAM', 1180);
  N[9] = n;
}
function r9(t) {
  const n = N[9];
  n.g.sp.forEach((s, i) => A(s, t, tw(9, i), { y: 24, d: .35 }));
  LN(n.s.l[0], t, tw(9, 2), .6);
  A(n.du, t, tw(9, 3), { y: 20, d: .4 });
  A(n.c1.w, t, tw(9, 4), { x: -70, d: .45, e: 'back' });
  A(n.c1.ck, t, tw(9, 4) + .3, { s: .2, r: -40, d: .5, e: 'slam' });
  A(n.c2.w, t, tw(9, 5), { x: -70, d: .45, e: 'back' });
  A(n.c2.ck, t, tw(9, 5) + .3, { s: .2, r: -40, d: .5, e: 'slam' });
  A(n.c3.w, t, tw(9, 7), { x: -70, d: .45, e: 'back' });
  A(n.c3.ck, t, tw(9, 7) + .3, { s: .2, r: -40, d: .5, e: 'slam' });
}

/* =================================================================
   SCENE 10 — PUNCAK (motif penuh): "Lalu satu brief menyebar ke tiga puluh lebih platform dalam menit."
   ================================================================= */
function build10() {
  const sc = newScene(), n = { sc };
  n.g0 = grayWords(sc, ['Lalu', 'satu'], 'left:72px;top:235px');
  n.node = mk(sc, 'pill', 'BRIEF', 'left:100px;top:420px;font-size:84px;padding:12px 38px');
  const labels = ['TIKTOK', 'YOUTUBE', 'IG', 'X', 'LINKEDIN', 'FB'];
  const pans = [-50, -28, -9, 9, 28, 50], lens = [290, 350, 410, 410, 350, 290];
  n.fans = labels.map((lb, i) => fanLine(sc, 430, 490, pans[i], lens[i], lb));
  n.p30 = mk(sc, 'pill', '30+', 'left:100px;top:620px;font-size:130px;padding:4px 48px;line-height:1');
  n.pl = bigLines(sc, ['PLATFORM'], { top: 1020, size: 170 });
  n.mn = bigLines(sc, ['<span class="hl">MENIT</span>'], { top: 1210, size: 230 });
  n.gl = grayWords(sc, ['dalam', 'hitungan'], 'left:72px;top:1480px');
  N[10] = n;
}
function r10(t) {
  const n = N[10], tS = tw(10, 3), t30 = tw(10, 5);
  n.g0.sp.forEach((s, i) => A(s, t, tw(10, i), { y: 24, d: .35 }));
  const pN = P(t, tw(10, 2), .45, 'slam');
  n.node.style.opacity = t >= tw(10, 2) ? 1 : 0;
  n.node.style.transform = `translateY(${(1 - pN) * -140}px)`;
  n.fans.forEach((o, i) => {
    o.line.style.transform = `scaleX(${P(t, tS + i * .09, .38, 'out5')})`;
    A(o.end, t, tS + i * .09 + .3, { s: .3, y: 24, d: .4, e: 'back' });
  });
  const p30 = P(t, t30, .55, 'slam');
  n.p30.style.opacity = t >= t30 ? 1 : 0;
  n.p30.style.transform = `scale(${.3 + .7 * p30})`;
  LN(n.pl.l[0], t, tw(10, 8), .5);
  LN(n.mn.l[0], t, tw(10, 10), .6);
  n.mn.w.style.transform = t > tw(10, 10) ? `translateY(${flt(t, 7, 2.3)}px)` : '';
  n.gl.sp.forEach((s, i) => A(s, t, tw(10, 9 + i), { y: 24, d: .35 }));
}

/* =================================================================
   SCENE 11 — HASIL: "Analytics dari setiap unggahan kembali ke satu dashboard."
   ================================================================= */
function build11() {
  const sc = newScene(), n = { sc };
  n.a = bigLines(sc, ['ANALYTICS'], { top: 300, size: 200 });
  n.g = grayWords(sc, ['dari', 'setiap', 'unggahan'], 'left:72px;top:560px');
  n.sr = ['TIKTOK', 'YOUTUBE', 'INSTAGRAM'].map((lb, i) => mk(sc, 'pill dark', lb, `left:72px;top:${700 + i * 190}px;font-size:56px;padding:14px 30px`));
  n.lines = [0, 1, 2].map(i => fanLine(sc, 545, 745 + i * 190, i * 22 - 22, 200, null));
  n.card = mk(sc, 'card', '', 'left:640px;top:640px;width:368px;height:520px');
  n.dh = mk(n.card, 'kick', 'DASHBOARD', 'position:absolute;left:36px;top:36px;font-size:26px');
  n.bf = [0, 1, 2, 3].map(i => mk(n.card, 'abs', '', `left:${250 - i * 70}px;top:120px;width:52px;height:290px;border-radius:14px;background:${ACC};transform-origin:bottom center;transform:scaleY(0)`));
  n.db = mk(n.card, 'abs', '<span style="font-weight:900;font-size:58px;letter-spacing:-.03em;color:#f2f2f7">DASHBOARD</span>', 'left:0;top:430px;width:368px;text-align:center;white-space:nowrap');
  n.g2 = grayWords(sc, ['ke', 'satu'], 'left:72px;top:1300px');
  N[11] = n;
}
function r11(t) {
  const n = N[11];
  LN(n.a.l[0], t, tw(11, 0), .55);
  n.g.sp.forEach((s, i) => A(s, t, tw(11, 1 + i), { y: 24, d: .35 }));
  n.sr.forEach((s, i) => A(s, t, tw(11, 4) + i * .12, { s: .7, d: .4, e: 'back' }));
  n.lines.forEach((o, i) => { o.line.style.transform = `scaleX(${P(t, tw(11, 4) + .25, .5, 'out5')})`; });
  A(n.card, t, tw(11, 6) + .2, { y: 100, s: .92, d: .55, e: 'out5' });
  const hgt = [1, .68, .9, .5];
  n.bf.forEach((b, i) => { b.style.transform = `scaleY(${P(t, tw(11, 6) + .35 + i * .12, .5, 'out5') * hgt[i]})`; });
  A(n.db, t, tw(11, 7), { y: 30, d: .4 });
  n.g2.sp.forEach((s, i) => A(s, t, tw(11, 5 + i), { y: 24, d: .35 }));
}

/* =================================================================
   SCENE 12 — KONTRAS: "Kamu fokus ke produk, agen mengerjakan sisanya."
   ================================================================= */
function build12() {
  const sc = newScene(), n = { sc };
  n.g = grayWords(sc, ['Kamu', 'fokus', 'ke'], 'left:72px;top:235px');
  n.p = bigLines(sc, ['<span class="hl">PRODUK</span>'], { top: 310, size: 290 });
  n.div = mk(sc, 'abs', '', 'left:72px;top:720px;width:936px;height:5px;background:#2a2a3a;border-radius:4px;transform-origin:left center;transform:scaleX(0)');
  n.a = bigLines(sc, ['AGEN'], { top: 790, size: 150 });
  n.m = bigLines(sc, ['MENGERJAKAN'], { top: 970, size: 110 });
  n.s = bigLines(sc, ['<span class="hl">SISANYA</span>'], { top: 1130, size: 200 });
  n.ch = ['RISET', 'NASKAH', 'VIDEO', 'JADWAL'].map((lb, i) => mk(sc, 'pill dark', lb, `left:${72 + i * 240}px;top:1400px;font-size:44px;padding:12px 26px`));
  N[12] = n;
}
function r12(t) {
  const n = N[12];
  n.g.sp.forEach((s, i) => A(s, t, tw(12, i), { y: 24, d: .35 }));
  LN(n.p.l[0], t, tw(12, 3), .55);
  grow(n.div, t, tw(12, 3) + .3, .5);
  LN(n.a.l[0], t, tw(12, 4), .5);
  LN(n.m.l[0], t, tw(12, 5), .5);
  LN(n.s.l[0], t, tw(12, 6), .5);
  n.ch.forEach((c, i) => A(c, t, tw(12, 6) + .3 + i * .11, { y: 40, s: .7, d: .4, e: 'back' }));
}

/* =================================================================
   SCENE 13 — KALENDER: "Brief masuk, video keluar, kalender konten terisi setiap hari."
   ================================================================= */
function build13() {
  const sc = newScene(), n = { sc };
  n.in = mk(sc, 'pill dark', 'BRIEF&nbsp;MASUK', 'left:72px;top:250px;font-size:72px;padding:12px 38px');
  n.ar = mk(sc, 'abs', '', 'left:352px;top:378px;width:12px;height:52px;background:#7c5cff;border-radius:6px;transform-origin:center top;transform:scaleY(0)');
  n.out = mk(sc, 'pill', 'VIDEO&nbsp;KELUAR', 'left:140px;top:450px;font-size:72px;padding:12px 38px');
  n.card = mk(sc, 'card', '', 'left:72px;top:640px;width:936px;height:620px');
  n.kick = mk(n.card, 'kick', 'KALENDER KONTEN', 'position:absolute;left:44px;top:36px;font-size:26px');
  n.cells = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
    const cell = mk(n.card, 'abs', '', `left:${44 + c * 174}px;top:${100 + r * 124}px;width:150px;height:100px;border-radius:20px;background:#1c1c28`);
    n.cells.push(cell);
  }
  n.h = bigLines(sc, ['SETIAP <span class="hl">HARI</span>'], { top: 1300, size: 150 });
  N[13] = n;
}
function r13(t) {
  const n = N[13], tF = tw(13, 6);
  A(n.in, t, tw(13, 1), { y: 40, s: .6, d: .4, e: 'back' });
  grow(n.ar, t, tw(13, 2), .3, 'Y', 'out5', 'center top');
  A(n.out, t, tw(13, 3), { y: 40, s: .6, d: .4, e: 'back' });
  A(n.card, t, tw(13, 4), { y: 100, s: .95, d: .55, e: 'out5' });
  n.cells.forEach((c, i) => {
    const p = P(t, tF + (i % 7) * .07 + Math.floor(i / 7) * .05, .3, 'out5');
    c.style.background = `rgba(124,92,255,${.14 + .86 * p})`;
    c.style.transform = `scale(${.94 + .06 * p})`;
  });
  LN(n.h.l[0], t, tw(13, 7), .5);
}

/* =================================================================
   SCENE 14 — PENUTUP + END CARD: "Satu brief, semua channel terisi."
   ================================================================= */
function build14() {
  const sc = newScene(), n = { sc };
  n.main = mk(sc, 'abs', '', 'left:0;top:0;width:1080px;height:1920px');
  n.w1 = bigLines(n.main, ['SATU <span class="hl">BRIEF,</span>'], { top: 300, size: 190 });
  n.w2 = bigLines(n.main, ['SEMUA CHANNEL'], { top: 520, size: 120 });
  n.w3 = bigLines(n.main, ['TERISI.'], { top: 700, size: 260 });
  n.node = mk(n.main, 'pill', 'BRIEF', 'left:100px;top:1120px;font-size:68px;padding:12px 36px');
  const pans = [-36, 0, 36], lens = [300, 380, 300];
  n.fans = pans.map((a, i) => fanLine(n.main, 280, 1180, a, lens[i], ['TIKTOK', 'YOUTUBE', 'IG'][i], 46));
  n.end = mk(sc, 'abs', '', 'left:0;top:0;width:1080px;height:1920px');
  n.ep = mk(n.end, 'pill', 'SAAS OTOMASI · EPISODE 1', 'left:72px;top:620px;font-size:44px;padding:14px 34px');
  n.ed = bigLines(n.end, ['SATU BRIEF', '<span class="hl">SEMUA CHANNEL</span>'], { top: 740, size: 240 });
  n.cus = mk(n.end, 'kick', 'BRIEF MASUK · VIDEO KELUAR', 'left:72px;top:1260px;font-size:28px');
  n.src = mk(n.end, 'abs', '<span class="kick" style="font-size:22px;letter-spacing:.14em;line-height:1.8;white-space:normal">PIPELINE · AI AGENT → POSTIZ → TEMPORAL → 30+ PLATFORM</span>', 'left:72px;top:1330px;width:936px');
  N[14] = n;
}
function r14(t) {
  const n = N[14], tE = S[14].e + .2;
  LN(n.w1.l[0], t, tw(14, 0), .55);
  LN(n.w2.l[0], t, tw(14, 2), .5);
  LN(n.w3.l[0], t, tw(14, 4), .6);
  const pN = P(t, tw(14, 1), .45, 'slam');
  n.node.style.opacity = t >= tw(14, 1) ? 1 : 0;
  n.node.style.transform = `translateY(${(1 - pN) * -120}px)`;
  n.fans.forEach((o, i) => {
    o.line.style.transform = `scaleX(${P(t, tw(14, 2) + i * .14, .4, 'out5')})`;
    A(o.end, t, tw(14, 2) + i * .14 + .3, { s: .3, y: 24, d: .4, e: 'back' });
  });
  O(n.main, t, tE, { y: -60, d: .35 });
  A(n.ep, t, tE + .25, { y: 30, d: .5 });
  n.ed.l.forEach((l, i) => LN(l, t, tE + .35 + i * .12, .55));
  A(n.cus, t, tE + .65, { d: .5 });
  A(n.src, t, tE + .8, { d: .5 });
}

/* =================================================================
   SFX — hanya di momen penting; waktu = tw() visual yang sama
   ================================================================= */
function getEvents() {
  const e = []; const add = (tt, n2, v = 1) => e.push({ t: Math.max(0, tt), n: n2, v });
  for (let j = 1; j < 15; j++) add(B[j] - .26, 'whoosh_up', .5);
  // 0 hook
  add(tw(0, 0), 'tick', .5); add(tw(0, 1), 'stamp', .8); add(tw(0, 6), 'pop', .6); add(tw(0, 8), 'pop', .6); add(tw(0, 11), 'ding', .6);
  // 1 negasi
  add(tw(1, 0), 'pop', .6); add(tw(1, 1) + .2, 'swipe_short', .6); [2, 5, 7].forEach(i => add(tw(1, i) + .1, 'buzz', .3));
  // 2 definisi
  add(tw(2, 1), 'pop', .6); add(tw(2, 2), 'stamp', .7);
  [8, 9, 10, 11].forEach(i => add(tw(2, i), 'stamp', .6)); add(tw(2, 11) + .4, 'ding', .55);
  // 3 pipeline
  add(tw(3, 3), 'stamp', .6); add(tw(3, 4), 'swipe_short', .5); add(tw(3, 5), 'whoosh_up', .45);
  // 4 brief
  add(tw(4, 0), 'tick', .5); add(tw(4, 1), 'stamp', .95); add(tw(4, 2), 'pop', .55); add(tw(4, 5), 'stamp', .8); add(tw(4, 6), 'ding', .5);
  // 5 urutan
  add(tw(5, 0), 'pop', .6); add(tw(5, 1), 'ding', .5);
  add(tw(5, 3), 'tick', .5); add(tw(5, 3) + .3, 'stamp', .6); add(tw(5, 5), 'tick', .5); add(tw(5, 8), 'tick', .5); add(tw(5, 8) + .3, 'ding', .6);
  // 6 render
  add(tw(6, 4), 'whoosh_up', .5); add(tw(6, 5) + .1, 'stamp', .8); add(tw(6, 7), 'pop', .55); add(tw(6, 9), 'tick', .5);
  // 7 postiz
  add(tw(7, 4), 'stamp', .95);
  [0, 1, 2, 3].forEach(i => add(tw(7, 6) + i * .13, 'tick', .48));
  // 8 temporal
  add(tw(8, 0), 'tick', .5); add(tw(8, 2), 'pop', .6); add(tw(8, 4), 'riser', .45); add(tw(8, 5), 'whoosh_up', .45); add(tw(8, 6), 'ding', .6);
  // 9 channel
  add(tw(9, 0), 'pop', .6); add(tw(9, 2), 'stamp', .8);
  add(tw(9, 4), 'tick', .5); add(tw(9, 4) + .3, 'stamp', .6); add(tw(9, 5), 'tick', .5); add(tw(9, 7), 'stamp', .7); add(tw(9, 7) + .3, 'ding', .55);
  // 10 puncak
  add(tw(10, 2), 'stamp', .9); add(tw(10, 3), 'riser', .5);
  for (let i = 0; i < 6; i++) add(tw(10, 3) + i * .09 + .3, 'tick', .42);
  add(tw(10, 5), 'stamp', .95); add(tw(10, 5) + .1, 'ding', .6); add(tw(10, 10), 'ding', .6);
  // 11 analytics
  add(tw(11, 0), 'pop', .6); add(tw(11, 4) + .25, 'whoosh_down', .45); add(tw(11, 7), 'ding', .6);
  // 12 fokus
  add(tw(12, 3), 'stamp', .9); add(tw(12, 4), 'pop', .55); add(tw(12, 6), 'stamp', .7);
  [0, 1, 2, 3].forEach(i => add(tw(12, 6) + .3 + i * .11, 'tick', .42));
  // 13 kalender
  add(tw(13, 1), 'pop', .6); add(tw(13, 3), 'stamp', .8); add(tw(13, 4), 'swipe_short', .45);
  for (let i = 0; i < 10; i++) add(tw(13, 6) + i * .08, 'tick', .4);
  add(tw(13, 7) + .5, 'ding', .55);
  // 14 penutup + end card
  add(tw(14, 0), 'pop', .6); add(tw(14, 1), 'stamp', .85); add(tw(14, 4), 'stamp', .95); add(tw(14, 4) + .2, 'ding', .6);
  add(S[14].e + .25, 'swipe_short', .4); add(S[14].e + .65, 'ding', .55);
  return e.sort((a, b) => a.t - b.t);
}

const BUILD = [build0, build1, build2, build3, build4, build5, build6, build7, build8, build9, build10, build11, build12, build13, build14];
const RENDER = [r0, r1, r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14];
