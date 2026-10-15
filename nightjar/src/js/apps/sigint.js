/* ============================================================
   SIGNALS INTERCEPT — spectrum, waterfall, live transcripts, trace
   ============================================================ */
function waterLut() {
  const stops = [[0, [2, 6, 12]], [.3, [6, 40, 80]], [.55, THEME.acc], [.78, THEME.warn], [1, [255, 255, 255]]];
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255; let k = 0; while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
    const [t0, c0] = stops[k], [t1, c1] = stops[k + 1], f = (t - t0) / (t1 - t0);
    for (let j = 0; j < 3; j++) lut[i * 3 + j] = c0[j] + (c1[j] - c0[j]) * f;
  }
  return lut;
}
function hiliteKeys(text, keys) {
  let out = esc(text);
  keys.forEach(k => { const re = new RegExp('(' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'); out = out.replace(re, '<mark>$1</mark>'); });
  return out;
}
APPS.sigint = {
  title: 'Signals Intercept', short: 'SIGINT', icon: 'sigint', code: 'SIG-RT', w: 1100, h: 690, cls: 'TS//SI//NF',
  create(body, opts, win) {
    const root = h(`<div class="sg">
      <aside class="sg-list panel"><div class="panel-h">Intercept queue<span class="sp"></span><span class="tag t-red blink">LIVE</span></div><div class="sg-items scroll"></div></aside>
      <div class="sg-main">
        <div class="sg-spec"><div class="sg-scv"></div></div>
        <div class="sg-call"></div>
        <div class="sg-wave"><div class="sg-wcv"></div></div>
        <div class="sg-tx scroll"></div>
        <div class="sg-trace" hidden></div>
      </div></div>`);
    body.appendChild(root);
    const items = $('.sg-items', root), call = $('.sg-call', root), tx = $('.sg-tx', root), trace = $('.sg-trace', root);
    let cur = null, play = null, lut = waterLut(), traceSt = null;
    const offT = Bus.on('theme', () => { lut = waterLut(); });
    const renderList = () => {
      items.innerHTML = INTERCEPTS.map((it, i) => `<button class="sg-item${cur === it ? ' on' : ''}" data-i="${i}"><div class="si-top"><span class="tag ${it.pri === 'FLASH' ? 't-red' : it.pri === 'PRIORITY' ? 't-amb' : 't-dim'}">${it.pri}</span><b class="mono">${it.id}</b><span class="mono dim">${it.type}</span></div><div class="si-who">${esc(it.a.name)} <span class="dim">↔</span> ${esc(it.b.name)}</div><div class="si-kw mono">${it.keys.slice(0, 3).map(esc).join(' · ')}</div></button>`).join('');
      $$('.sg-item', items).forEach(b => b.onclick = () => load(INTERCEPTS[+b.dataset.i], true));
    };
    const load = (it, autoplay) => {
      cur = it; renderList(); trace.hidden = true; if (traceSt) traceSt.TC.destroy(); traceSt = null;
      call.innerHTML = `<div class="sc-party"><span class="up">Party A</span><b>${esc(it.a.name)}</b><span class="mono">${esc(it.a.num)}</span>${it.a.subj ? `<button class="btn sm" data-file="${it.a.subj}">File</button>` : ''}</div>
        <div class="sc-mid"><span class="tag t-red blink">${it.type === 'SMS' ? 'TEXT CAPTURE' : 'VOICE CAPTURE'}</span><b class="num sc-dur">00:00</b><span class="mono dim">TOWER ${esc(it.tower)} · AES BYPASS</span></div>
        <div class="sc-party r"><span class="up">Party B</span><b>${esc(it.b.name)}</b><span class="mono">${esc(it.b.num)}</span>${it.b.subj ? `<button class="btn sm" data-file="${it.b.subj}">File</button>` : ''}</div>
        <div class="sc-ctl"><button class="btn sm" data-play>${icon('pause')}Pause</button><button class="btn sm" data-restart>${icon('refresh')}Replay</button><button class="btn sm alert" data-trace>${icon('target')}Trace</button><button class="btn sm" data-flag>Flag keywords</button></div>`;
      $$('[data-file]', call).forEach(b => b.onclick = () => WM.open('cif', { subject: b.dataset.file }));
      $('[data-play]', call).onclick = () => { if (!play) return; play.paused = !play.paused; $('[data-play]', call).innerHTML = play.paused ? icon('play') + 'Play' : icon('pause') + 'Pause'; };
      $('[data-restart]', call).onclick = () => start();
      $('[data-trace]', call).onclick = () => startTrace();
      $('[data-flag]', call).onclick = e => { e.currentTarget.textContent = `${it.keys.length} keywords flagged`; e.currentTarget.classList.add('on'); Sound.ok(); };
      const start = () => {
        tx.innerHTML = `<div class="tx-head mono">${it.id} · ${it.type} · ${esc(it.a.num)} → ${esc(it.b.num)} · ${tzTime('UTC')}Z</div>`;
        play = { i: 0, c: 0, wait: .6, paused: false, dur: 0, el: null };
        $('[data-play]', call).innerHTML = icon('pause') + 'Pause';
      };
      if (autoplay) start(); else { play = null; tx.innerHTML = `<div class="tx-head mono">SELECT PLAY TO REVIEW ${it.id}</div>`; }
    };
    const startTrace = () => {
      const it = cur; if (!it) return;
      const subj = SUBJ(it.a.subj) || SUBJECTS[0];
      if (traceSt) traceSt.TC.destroy();
      trace.hidden = false;
      trace.innerHTML = `<div class="tr-box"><div class="panel-h">Location trace · ${esc(it.a.num)}<span class="sp"></span><button class="tr-x" aria-label="Close trace">${icon('close')}</button></div><div class="tr-map"></div><div class="tr-foot"><b class="tr-st">TRIANGULATING</b><span class="mono tr-acc">±2.40 KM</span><div class="tr-act" hidden><button class="btn sm" data-aer>Task aerial</button><button class="btn sm" data-cif>Open file</button></div></div></div>`;
      $('.tr-x', trace).onclick = () => { trace.hidden = true; if (traceSt) traceSt.TC.destroy(); traceSt = null; };
      const TC = makeCanvas($('.tr-map', trace));
      const r = rng(hash(it.id));
      traceSt = { TC, t0: performance.now() / 1000, subj, towers: [[.2 + r() * .15, .2 + r() * .2], [.7 + r() * .15, .25 + r() * .2], [.4 + r() * .2, .78 + r() * .12]], fix: [.42 + r() * .16, .42 + r() * .16], place: subj.lastSeen.place, done: false };
      $('[data-cif]', trace).onclick = () => WM.open('cif', { subject: subj.id });
      $('[data-aer]', trace).onclick = () => { const tg = TARGETS.find(t => t.note.includes(subj.last.toUpperCase())) || TARGETS[0]; WM.open('aerial', { target: tg.id, subject: subj.id }); };
      Sound.scan();
    };
    const SC = makeCanvas($('.sg-scv', root)), WC = makeCanvas($('.sg-wcv', root));
    let wf = null, wfImg = null;
    const peaks = Array.from({ length: 7 }, (_, i) => ({ f: .08 + i * .13 + Math.random() * .05, a: .3 + Math.random() * .6, w: .006 + Math.random() * .012, d: (Math.random() - .5) * .002 }));
    let hold = null, acc = 0, ampA = 0, ampB = 0;
    const off = Loop.add((t, dt) => {
      // transcript playback
      if (play && !play.paused && cur) {
        play.dur += dt;
        const lines = cur.lines;
        if (play.i < lines.length) {
          if (play.wait > 0) play.wait -= dt;
          else {
            if (!play.el) { const sp = lines[play.i][0]; play.el = h(`<div class="tx-line ${sp === 'A' ? 'a' : 'b'}"><span class="tx-who">${sp === 'A' ? esc(cur.a.name) : esc(cur.b.name)}</span><span class="tx-t"></span><i class="tx-cur"></i></div>`); tx.appendChild(play.el); }
            play.c += dt * (cur.type === 'SMS' ? 60 : 24);
            const full = lines[play.i][1], n = Math.min(full.length, Math.floor(play.c));
            $('.tx-t', play.el).innerHTML = hiliteKeys(full.slice(0, n), cur.keys);
            if (Math.random() < .3) Sound.type();
            tx.scrollTop = tx.scrollHeight;
            if (n >= full.length) { $('.tx-cur', play.el).remove(); if (cur.keys.some(k => full.toUpperCase().includes(k))) { play.el.classList.add('hit'); Sound.beep(1500, .06, 'square', .03); } play.el = null; play.i++; play.c = 0; play.wait = .7 + Math.random() * .5; }
          }
        } else if (!play.ended) { play.ended = true; tx.appendChild(h(`<div class="tx-end mono">— CALL TERMINATED · ${pad(Math.floor(play.dur / 60))}:${pad(Math.floor(play.dur % 60))} · ARCHIVED TO SIG-${hash(cur.id) % 99999} —</div>`)); tx.scrollTop = tx.scrollHeight; }
        const d = $('.sc-dur', call); if (d) d.textContent = `${pad(Math.floor(play.dur / 60))}:${pad(Math.floor(play.dur % 60))}`;
      }
      const speaking = play && !play.paused && play.el ? cur.lines[play.i][0] : null;
      ampA = lerp(ampA, speaking === 'A' ? 1 : .05, .15); ampB = lerp(ampB, speaking === 'B' ? 1 : .05, .15);
      acc += dt; if (acc < 1 / 30) return; acc = 0;
      // spectrum
      if (SC.visible()) {
        const ctx = SC.ctx, w = SC.w, hh = SC.h, sh = Math.round(hh * .42);
        const N = Math.max(64, Math.floor(w / 3));
        const vals = new Float32Array(N);
        peaks.forEach(p => { p.f += p.d * dt * 30; if (p.f < .03 || p.f > .97) p.d *= -1; });
        for (let i = 0; i < N; i++) {
          const f = i / N; let v = .08 + Math.random() * .07;
          peaks.forEach((p, k) => { v += p.a * (k === 3 && speaking ? 1.3 : 1) * Math.exp(-((f - p.f) ** 2) / (2 * p.w * p.w)) * (.75 + Math.random() * .3); });
          vals[i] = Math.min(1, v);
        }
        if (!hold || hold.length !== N) hold = new Float32Array(N);
        for (let i = 0; i < N; i++) hold[i] = Math.max(vals[i], hold[i] - dt * .4);
        ctx.fillStyle = '#02070b'; ctx.fillRect(0, 0, w, sh);
        ctx.strokeStyle = rgba(THEME.acc, .08); ctx.lineWidth = 1; ctx.beginPath();
        for (let x = 0; x < w; x += w / 10) { ctx.moveTo(x, 0); ctx.lineTo(x, sh); } for (let y = 0; y < sh; y += sh / 4) { ctx.moveTo(0, y); ctx.lineTo(w, y); } ctx.stroke();
        const bw = w / N;
        for (let i = 0; i < N; i++) { const v = vals[i]; ctx.fillStyle = rgba(v > .75 ? THEME.warn : THEME.acc, .35 + v * .6); ctx.fillRect(i * bw, sh - v * (sh - 14), Math.max(1, bw - 1), v * (sh - 14)); }
        ctx.strokeStyle = rgba(THEME.acc2, .9); ctx.beginPath(); for (let i = 0; i < N; i++) { const y = sh - hold[i] * (sh - 14); i ? ctx.lineTo(i * bw, y) : ctx.moveTo(0, y); } ctx.stroke();
        const mx = peaks[3].f * w; ctx.strokeStyle = rgba(THEME.alert, .9); ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, sh); ctx.stroke(); ctx.setLineDash([]);
        hudText(ctx, `CH 41 · ${(1710 + peaks[3].f * 170).toFixed(2)} MHz · ${speaking ? 'ACTIVE' : 'CARRIER'}`, Math.min(mx + 6, w - 230), 14, { size: 10.5, bg: 'rgba(0,0,0,.6)', color: rgba(THEME.alert, 1) });
        hudText(ctx, 'SPECTRUM 1710–1880 MHz · RBW 30 kHz', 8, 14, { size: 10.5, color: rgba(THEME.acc2, .8) });
        // waterfall
        const wy = sh + 1, wh = hh - wy;
        const dpr = SC.dpr, pw = Math.round(w * dpr), ph = Math.max(1, Math.round(wh * dpr));
        if (!wf || wf.width !== pw || wf.height !== ph) { wf = offscreen(pw, ph); wfImg = wf.getContext('2d').createImageData(pw, 1); }
        const wctx = wf.getContext('2d');
        wctx.drawImage(wf, 0, 1);
        const d = wfImg.data;
        for (let x = 0; x < pw; x++) { const v = vals[Math.min(N - 1, Math.floor(x / pw * N))]; const li = Math.min(255, Math.floor(v * 255)) * 3; d[x * 4] = lut[li]; d[x * 4 + 1] = lut[li + 1]; d[x * 4 + 2] = lut[li + 2]; d[x * 4 + 3] = 255; }
        wctx.putImageData(wfImg, 0, 0);
        ctx.drawImage(wf, 0, wy, w, wh);
        ctx.fillStyle = rgba(THEME.acc, .5); ctx.fillRect(0, sh, w, 1);
        hudText(ctx, 'WATERFALL · 30 S', 8, wy + 14, { size: 10.5, bg: 'rgba(0,0,0,.5)', color: rgba(THEME.acc2, .8) });
      }
      // waveform
      if (WC.visible()) {
        const ctx = WC.ctx, w = WC.w, hh = WC.h;
        ctx.fillStyle = '#02070b'; ctx.fillRect(0, 0, w, hh);
        [[ampA, hh * .27, 'A', THEME.acc2], [ampB, hh * .73, 'B', THEME.warn]].forEach(([amp, cy, lab, col]) => {
          ctx.strokeStyle = rgba(THEME.acc, .12); ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
          ctx.strokeStyle = rgba(col, .95); ctx.lineWidth = 1.2; ctx.beginPath();
          for (let x = 0; x < w; x += 2) {
            const env = Math.sin(x / w * Math.PI) * (.4 + .6 * Math.abs(Math.sin(x * .021 + t * 7.3)));
            const y = cy + amp * hh * .2 * env * (Math.sin(x * .31 + t * 40) * .6 + Math.sin(x * .093 - t * 23) * .4 + (Math.random() - .5) * .6);
            x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          }
          ctx.stroke();
          hudText(ctx, `CH ${lab}`, 8, cy - hh * .14, { size: 10, color: rgba(col, .9) });
        });
      }
      // trace
      if (traceSt && traceSt.TC.visible()) {
        const T = traceSt, ctx = T.TC.ctx, w = T.TC.w, hh = T.TC.h, el = performance.now() / 1000 - T.t0;
        ctx.drawImage(schematic(hash(cur.tower), Math.round(w * T.TC.dpr), Math.round(hh * T.TC.dpr)), 0, 0, w, hh);
        const p = clamp(el / 4.2, 0, 1), fx = T.fix[0] * w, fy = T.fix[1] * hh;
        T.towers.forEach(([tx0, ty0], i) => {
          const x = tx0 * w, y = ty0 * hh, d = Math.hypot(x - fx, y - fy);
          const rr = d + (1 - ease(p)) * Math.min(w, hh) * .25 * (1 + i * .2);
          ctx.strokeStyle = rgba(THEME.acc2, .55); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = rgba(THEME.acc, .08); ctx.fill();
          ctx.fillStyle = rgba(THEME.acc2, 1); ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x - 6, y + 6); ctx.lineTo(x + 6, y + 6); ctx.closePath(); ctx.fill();
          hudText(ctx, `TWR ${String.fromCharCode(65 + i)}`, x + 9, y + 4, { size: 10, bg: 'rgba(0,0,0,.6)', color: rgba(THEME.acc2, 1) });
        });
        const errKm = 2.4 * Math.pow(1 - p, 2.2) + .012;
        if (p > .35) { const pp = (el * 1.5) % 1; ctx.strokeStyle = rgba(THEME.alert, 1 - pp); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(fx, fy, 5 + pp * 30, 0, Math.PI * 2); ctx.stroke(); }
        if (p >= 1) { brackets(ctx, fx - 18, fy - 18, 36, 36, 8, rgba(THEME.alert, 1), 2); hudText(ctx, T.place, fx + 24, fy - 8, { size: 12, bg: 'rgba(40,0,0,.8)', color: rgba(THEME.alert, 1) }); }
        const st = $('.tr-st', trace), ac = $('.tr-acc', trace);
        if (ac) ac.textContent = errKm >= 1 ? `±${errKm.toFixed(2)} KM` : `±${Math.round(errKm * 1000)} M`;
        if (st) st.textContent = p < 1 ? `TRIANGULATING ${Math.floor(p * 100)}%` : 'LOCATION ACQUIRED';
        if (p >= 1 && !T.done) { T.done = true; st.classList.add('ok'); $('.tr-act', trace).hidden = false; Sound.ok(); }
      }
    });
    renderList();
    load(INTERCEPTS.find(i => i.id === opts.intercept) || INTERCEPTS[0], true);
    return {
      onOpts(o) { if (o.intercept) load(INTERCEPTS.find(i => i.id === o.intercept) || INTERCEPTS[0], true); },
      destroy() { off(); offT(); SC.destroy(); WC.destroy(); if (traceSt) traceSt.TC.destroy(); }
    };
  }
};
