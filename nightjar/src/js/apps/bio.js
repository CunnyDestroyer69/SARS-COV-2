/* ============================================================
   BIOMETRICS — fingerprint + facial comparison
   ============================================================ */
APPS.bio = {
  title: 'Biometric Identification', short: 'Biometrics', icon: 'bio', code: 'BIO-IDX', w: 1100, h: 680, cls: 'S//NF',
  create(body, opts, win) {
    const root = h(`<div class="bio">
      <div class="bio-top"><div class="tabs bio-tabs"><button data-t="fp" class="on">Fingerprint</button><button data-t="face">Facial</button></div><span class="sp"></span><span class="mono dim bio-db">INDEX: 412,880,016 PRINTS · 2.3B FACES</span></div>
      <div class="bio-fp">
        <section class="bio-cap panel brk"><div class="panel-h">Latent capture</div>
          <button class="bio-pad" aria-label="Fingerprint pad: press and hold"><div class="bio-pcv"></div><span class="bio-line"></span></button>
          <div class="bio-pmsg mono">PRESS AND HOLD TO CAPTURE</div>
          <dl class="kv bio-kv"><dt>Pattern</dt><dd class="b-pat">—</dd><dt>Minutiae</dt><dd class="b-min">—</dd><dt>Quality</dt><dd class="b-q">—</dd><dt>Subject</dt><dd class="b-sub">UNKNOWN</dd></dl>
        </section>
        <section class="bio-cards">${Array.from({ length: 8 }, (_, i) => `<div class="bio-card"><div class="bc-h mono"><span>DB-${pad(4471 + i * 137, 6)}</span><b>STANDBY</b></div><div class="bc-cv"></div><div class="bc-f mono"><span class="bc-n">— —</span><span class="bc-sq"><i></i><i></i><i></i><i></i></span></div></div>`).join('')}</section>
        <section class="bio-stat panel"><div class="panel-h">Search nodes</div><div class="bio-rows">${Array.from({ length: 8 }, (_, i) => `<div class="bio-row"><span class="mono">NODE ${pad(i + 1)}</span><b>READY</b></div>`).join('')}</div>
          <div class="bio-res"></div></section>
      </div>
      <div class="bio-face" hidden>
        <section class="panel bio-probe"><div class="panel-h">Probe image</div><div class="bio-prcv"></div><div class="mono bio-prmsg">SOURCE: CAM-07 · FRAME 4471</div><button class="btn" data-run>Run comparison</button></section>
        <section class="bio-cands"></section>
        <section class="panel bio-rank"><div class="panel-h">Candidate ranking</div><div class="bio-rlist"><p class="mono dim" style="padding:10px 12px;margin:0">RUN A COMPARISON TO RANK CANDIDATES</p></div></section>
      </div></div>`);
    body.appendChild(root);
    let target = SUBJ(opts.subject) || SUBJ(S.matchSubject) || SUBJECTS[0];
    let st = 'idle', t0 = 0, capP = 0, matchIdx = 5;
    const PC = makeCanvas($('.bio-pcv', root));
    const cards = $$('.bio-card', root).map((el, i) => ({ el, C: makeCanvas($('.bc-cv', el), { maxDpr: 2 }), seed: 9000 + i * 77, pct: 0 }));
    const rows = $$('.bio-row b', root);
    const pad2 = $('.bio-pad', root);
    const fpFor = (seed, C) => fingerprint(seed, Math.max(40, Math.round(C.w * C.dpr * .82)), Math.max(50, Math.round(C.h * C.dpr * .86)), THEME.acc);
    const setMsg = (txt, cls = '') => { const m = $('.bio-pmsg', root); m.textContent = txt; m.className = 'bio-pmsg mono ' + cls; };
    const reset = () => {
      st = 'idle'; capP = 0; cards.forEach((c, i) => { c.seed = 9000 + i * 77; c.el.classList.remove('hit', 'miss'); $('.bc-h b', c.el).textContent = 'STANDBY'; $('.bc-n', c.el).textContent = '— —'; });
      rows.forEach(r => { r.textContent = 'READY'; r.className = ''; }); $('.bio-res', root).innerHTML = '';
      ['.b-pat', '.b-min', '.b-q'].forEach(s => $(s, root).textContent = '—'); $('.b-sub', root).textContent = 'UNKNOWN';
      setMsg('PRESS AND HOLD TO CAPTURE');
    };
    let holdStart = 0;
    pad2.style.touchAction = 'none';
    pad2.addEventListener('pointerdown', e => { e.preventDefault(); if (st === 'search') return; if (st !== 'idle') reset(); st = 'cap'; holdStart = performance.now(); pad2.classList.add('on'); setMsg('CAPTURING — HOLD STEADY'); Sound.scan(); });
    const release = () => { pad2.classList.remove('on'); if (st === 'cap') { st = 'idle'; capP = 0; setMsg('CAPTURE INCOMPLETE — HOLD LONGER', 'warn'); Sound.err(); } };
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => pad2.addEventListener(t, release));
    pad2.addEventListener('contextmenu', e => e.preventDefault());
    const startSearch = () => {
      st = 'search'; t0 = performance.now() / 1000; matchIdx = Math.floor(Math.random() * 8);
      const fp = fingerprint(hash(target.id), 120, 150, THEME.acc);
      $('.b-pat', root).textContent = fp.type; $('.b-min', root).textContent = fp.minutiae; $('.b-q', root).textContent = (88 + hash(target.id) % 11) + '%';
      setMsg('SEARCHING INDEX…'); Sound.open();
    };
    // tabs
    $$('.bio-tabs button', root).forEach(b => b.onclick = () => { $$('.bio-tabs button', root).forEach(x => x.classList.toggle('on', x === b)); $('.bio-fp', root).hidden = b.dataset.t !== 'fp'; $('.bio-face', root).hidden = b.dataset.t !== 'face'; });
    // facial
    const PR = makeCanvas($('.bio-prcv', root));
    const candBox = $('.bio-cands', root);
    let face = { st: 'idle', t0: 0 };
    const cands = SUBJECTS.slice(0, 12);
    candBox.innerHTML = cands.map(() => `<div class="bio-cand"><div class="bcd-cv"></div><span class="mono">—</span></div>`).join('');
    const candEls = $$('.bio-cand', candBox).map(el => ({ el, C: makeCanvas($('.bcd-cv', el), { maxDpr: 2 }) }));
    const drawCands = (shuffle) => {
      candEls.forEach((c, i) => {
        if (!c.C.w) return;
        const s = shuffle ? SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)] : cands[i];
        c.C.ctx.drawImage(portrait(s, Math.round(c.C.w * c.C.dpr), Math.round(c.C.h * c.C.dpr)), 0, 0, c.C.w, c.C.h);
        c.s = s;
      });
    };
    $('[data-run]', root).onclick = () => { face = { st: 'run', t0: performance.now() / 1000 }; Sound.scan(); $('.bio-rlist', root).innerHTML = '<p class="mono dim" style="padding:10px 12px;margin:0">COMPARING…</p>'; candEls.forEach(c => c.el.classList.remove('hit')); };
    const finishFace = () => {
      face.st = 'done'; Sound.ok();
      const others = SUBJECTS.filter(s => s !== target).sort(() => Math.random() - .5).slice(0, 4);
      const ranked = [[target, 98.7], ...others.map((s, i) => [s, 61 - i * 9 - Math.random() * 5])];
      $('.bio-rlist', root).innerHTML = ranked.map(([s, p], i) => `<button class="bio-rrow${i === 0 ? ' top' : ''}" data-id="${s.id}"><canvas width="60" height="72"></canvas><span><b>${esc(s.name)}</b><small class="mono">${esc(s.idLong)}</small><span class="meter"><i style="width:${p}%"></i></span></span><b class="num">${p.toFixed(1)}%</b></button>`).join('');
      $$('.bio-rrow', root).forEach(b => { const s = SUBJ(b.dataset.id); b.querySelector('canvas').getContext('2d').drawImage(portrait(s, 60, 72), 0, 0); b.onclick = () => WM.open('cif', { subject: s.id }); });
      candEls.forEach(c => { c.C.ctx.drawImage(portrait(c.s, Math.round(c.C.w * c.C.dpr), Math.round(c.C.h * c.C.dpr)), 0, 0, c.C.w, c.C.h); });
      const hit = candEls.find(c => c.s === target) || candEls[0];
      if (hit.s !== target) { hit.s = target; hit.C.ctx.drawImage(portrait(target, Math.round(hit.C.w * hit.C.dpr), Math.round(hit.C.h * hit.C.dpr)), 0, 0, hit.C.w, hit.C.h); }
      hit.el.classList.add('hit');
      candEls.forEach(c => { $('span', c.el).textContent = c === hit ? '98.7%' : (20 + Math.random() * 40).toFixed(1) + '%'; });
    };
    let acc = 0, candAcc = 0;
    const off = Loop.add((t, dt) => {
      const now = performance.now() / 1000;
      if (st === 'cap') { capP = clamp((performance.now() - holdStart) / 1500, 0, 1); if (capP >= 1) { pad2.classList.remove('on'); setMsg('CAPTURE COMPLETE', 'ok'); Sound.ok(); startSearch(); } }
      acc += dt; if (acc < 1 / 30) return; acc = 0;
      // capture pad
      if (PC.visible()) {
        const ctx = PC.ctx, w = PC.w, hh = PC.h; ctx.clearRect(0, 0, w, hh);
        const fp = fpFor(hash(target.id), PC);
        const fw = w * .82, fh = hh * .86, fx = (w - fw) / 2, fy = (hh - fh) / 2;
        ctx.globalAlpha = .12; ctx.drawImage(fp.canvas, fx, fy, fw, fh); ctx.globalAlpha = 1;
        const shown = st === 'cap' ? capP : st === 'idle' ? 0 : 1;
        if (shown > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, fy + fh * shown); ctx.clip(); ctx.drawImage(fp.canvas, fx, fy, fw, fh); ctx.restore(); }
        if (st === 'search' || st === 'match') {
          const r = rng(hash(target.id) + 1);
          ctx.strokeStyle = rgba(THEME.warn, .9); ctx.lineWidth = 1;
          for (let k = 0; k < 22; k++) { const x = fx + fw * (.2 + r() * .6), y = fy + fh * (.15 + r() * .7); if (r() < .5) ctx.strokeRect(x - 3, y - 3, 6, 6); else { ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 6.283); ctx.stroke(); } }
        }
        brackets(ctx, 6, 6, w - 12, hh - 12, 14, rgba(THEME.acc, .9), 2);
      }
      // cards
      const el = now - t0;
      cards.forEach((c, i) => {
        if (st === 'search') {
          if (Math.random() < .25) { c.seed = 9000 + Math.floor(Math.random() * 14) * 77; c.pct = Math.floor(Math.random() * 60); }
          $('.bc-h b', c.el).textContent = 'SCANNING'; $('.bc-n', c.el).textContent = `${pad(Math.floor(Math.random() * 999999), 6)} · ${c.pct}%`;
        }
        if (!c.C.visible()) return;
        const ctx = c.C.ctx, w = c.C.w, hh = c.C.h;
        ctx.fillStyle = '#03090e'; ctx.fillRect(0, 0, w, hh);
        const fp = fpFor(c.seed, c.C);
        const fw = w * .82, fh = hh * .86;
        ctx.globalAlpha = st === 'idle' ? .45 : c.el.classList.contains('miss') ? .25 : 1;
        ctx.drawImage(fp.canvas, (w - fw) / 2, (hh - fh) / 2, fw, fh); ctx.globalAlpha = 1;
        if (st === 'search' || st === 'idle') { const y = ((t * (st === 'search' ? 1.3 : .4) + i * .17) % 1) * hh; ctx.fillStyle = rgba(THEME.acc, .7); ctx.fillRect(0, y, w, 1.5); const g = ctx.createLinearGradient(0, y - 24, 0, y); g.addColorStop(0, rgba(THEME.acc, 0)); g.addColorStop(1, rgba(THEME.acc, .15)); ctx.fillStyle = g; ctx.fillRect(0, y - 24, w, 24); }
        brackets(ctx, 3, 3, w - 6, hh - 6, 9, rgba(c.el.classList.contains('hit') ? THEME.ok : THEME.acc, .9), 1.5);
      });
      if (st === 'search') {
        rows.forEach((r, i) => { r.textContent = Math.floor(t * 3 + i) % 3 ? 'SCANNING' : `${Math.floor(el / 3.6 * 100)}%`; r.className = 'acc'; });
        if (el > 3.6) {
          st = 'match'; Sound.ok();
          cards.forEach((c, i) => {
            if (i === matchIdx) { c.seed = hash(target.id); c.el.classList.add('hit'); $('.bc-h b', c.el).textContent = 'MATCH'; $('.bc-n', c.el).textContent = `${target.id} · 98.7%`; }
            else { c.el.classList.add('miss'); $('.bc-h b', c.el).textContent = 'NO MATCH'; $('.bc-n', c.el).textContent = `${(Math.random() * 30).toFixed(1)}%`; }
          });
          rows.forEach((r, i) => { r.textContent = i === matchIdx ? 'MATCH' : 'COMPLETE'; r.className = i === matchIdx ? 'ok' : 'dim'; });
          $('.b-sub', root).textContent = target.name;
          setMsg('IDENTITY CONFIRMED', 'ok');
          const res = $('.bio-res', root);
          res.innerHTML = `<div class="br-box"><span class="up">Match · 98.7%</span><canvas width="96" height="116"></canvas><b>${esc(target.name)}</b><span class="tag ${STATUS[target.status] ? STATUS[target.status].cls : 't-acc'}">${esc(target.status)}</span><button class="btn sm" data-open>Open file</button></div>`;
          res.querySelector('canvas').getContext('2d').drawImage(portrait(target, 96, 116), 0, 0);
          $('[data-open]', res).onclick = () => WM.open('cif', { subject: target.id });
        }
      }
      // facial
      if (!$('.bio-face', root).hidden) {
        if (PR.visible()) {
          const ctx = PR.ctx, w = PR.w, hh = PR.h;
          ctx.drawImage(portrait(target, Math.round(w * PR.dpr), Math.round(hh * PR.dpr)), 0, 0, w, hh);
          const mesh = faceMesh(target.face), sz = Math.min(w, hh / 1.2), ox = (w - sz) / 2, oy = (hh - sz * 1.2) / 2;
          const p = face.st === 'run' ? clamp((now - face.t0) / 1.2, 0, 1) : face.st === 'done' ? 1 : .3;
          ctx.strokeStyle = rgba(THEME.acc2, .55); ctx.lineWidth = 1; ctx.beginPath();
          mesh.edges.slice(0, Math.floor(mesh.edges.length * p)).forEach(([a, b]) => { ctx.moveTo(ox + mesh.pts[a][0] * sz, oy + mesh.pts[a][1] * sz); ctx.lineTo(ox + mesh.pts[b][0] * sz, oy + mesh.pts[b][1] * sz); });
          ctx.stroke();
          if (face.st === 'run') { const y = ((now - face.t0) * .8 % 1) * hh; ctx.fillStyle = rgba(THEME.acc, .6); ctx.fillRect(0, y, w, 2); }
          brackets(ctx, 5, 5, w - 10, hh - 10, 14, rgba(THEME.acc, .9), 2);
        }
        if (face.st === 'run') {
          candAcc += 1 / 30;
          if (candAcc > .09) { candAcc = 0; drawCands(true); candEls.forEach(c => { $('span', c.el).textContent = (Math.random() * 90).toFixed(1) + '%'; }); }
          if (now - face.t0 > 2.8) finishFace();
        } else if (face.st === 'idle' && !candEls[0].s && candEls[0].C.w) drawCands(false);
      }
    });
    const offTh = Bus.on('theme', () => { if (face.st !== 'run') drawCands(false); });
    return {
      onOpts(o) { if (o.subject) { target = SUBJ(o.subject) || target; reset(); face = { st: 'idle' }; drawCands(false); } },
      destroy() { off(); offTh(); PC.destroy(); PR.destroy(); cards.forEach(c => c.C.destroy()); candEls.forEach(c => c.C.destroy()); }
    };
  }
};
