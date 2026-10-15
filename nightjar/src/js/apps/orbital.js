/* ============================================================
   ORBITAL COMMAND — satellite tracking and tasking
   ============================================================ */
function geoCircle(lat, lon, rad, n = 40) {
  const out = [], φ1 = lat * D2R, λ1 = lon * D2R, δ = rad * D2R;
  for (let k = 0; k <= n; k++) {
    const θ = k / n * 2 * Math.PI;
    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
    const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
    out.push([φ2 / D2R, λ2 / D2R]);
  }
  return out;
}
function fmtLat(v) { return Math.abs(v).toFixed(4) + '°' + (v >= 0 ? 'N' : 'S'); }
function fmtLon(v) { return Math.abs(v).toFixed(4) + '°' + (v >= 0 ? 'E' : 'W'); }

APPS.orbital = {
  title: 'Orbital Command', short: 'Orbital', icon: 'orbital', code: 'SAT-OPS', w: 1100, h: 680, cls: 'TS//SI//TK',
  create(body, opts, win) {
    const root = h(`<div class="orb">
      <aside class="orb-sats panel"><div class="panel-h">Constellation<span class="sp"></span><span class="mono">8 PLATFORMS</span></div><div class="orb-list scroll"></div></aside>
      <div class="orb-view">
        <div class="orb-cv"></div>
        <div class="orb-hud tl mono"><b>ORBITAL TRACKING</b><span class="orb-utc"></span></div>
        <div class="orb-ctl"><button class="btn sm" data-z="1" aria-label="Zoom in">${icon('plus')}</button><button class="btn sm" data-z="-1" aria-label="Zoom out">${icon('minus')}</button><button class="btn sm on" data-auto>Auto-rotate</button><button class="btn sm" data-follow>Follow</button></div>
        <div class="orb-task" hidden></div>
      </div>
      <aside class="orb-info panel"><div class="panel-h">Telemetry<span class="sp"></span><span class="tag t-ok orb-st">NOMINAL</span></div><div class="orb-tele scroll"></div></aside>
      <div class="orb-log mono"></div>
    </div>`);
    body.appendChild(root);
    const globe = new Globe({ lat0: 30, lon0: -75 });
    let sel = SATS[0], zoom = 1, auto = true, follow = false, lastUser = 0, task = null, tNow = 0;
    const C = makeCanvas($('.orb-cv', root));
    let stars = [];
    C.onresize = () => { const r = rng(5); stars = Array.from({ length: Math.round(C.w * C.h / 2600) }, () => [r() * C.w, r() * C.h, r()]); };
    C.onresize(C);
    const list = $('.orb-list', root), tele = $('.orb-tele', root), logEl = $('.orb-log', root), taskEl = $('.orb-task', root);
    const logs = [];
    const log = (txt, cls = '') => { logs.unshift(`<div class="${cls}"><b>${tzTime('UTC')}Z</b> ${esc(txt)}</div>`); logs.length = Math.min(logs.length, 3); logEl.innerHTML = logs.join(''); };
    log('CONSTELLATION HANDSHAKE COMPLETE — 7/8 NOMINAL');
    log('GNT-3 GANNET — ATTITUDE CONTROL DEGRADED', 'w');
    const renderList = () => {
      list.innerHTML = SATS.map(s => `<button class="orb-row${s === sel ? ' on' : ''}" data-id="${s.id}"><span class="sq ${s.status === 'NOMINAL' ? 't-ok' : 't-amb'}"></span><span class="or-main"><b>${esc(s.id)} ${esc(s.name)}</b><small>${esc(s.type)}</small></span><span class="or-sig"><i style="width:${s.signal}%"></i></span></button>`).join('');
      $$('.orb-row', list).forEach(b => b.onclick = () => { select(SATS.find(s => s.id === b.dataset.id)); });
    };
    const select = s => {
      sel = s; renderList(); renderTele(); Sound.tap();
      log(`SELECTED ${s.id} ${s.name} — ${s.type}`);
      $('.orb-st', root).textContent = s.status; $('.orb-st', root).className = 'tag orb-st ' + (s.status === 'NOMINAL' ? 't-ok' : 't-amb');
    };
    const renderTele = () => {
      const s = sel;
      const rkm = 6371 + s.alt, v = Math.sqrt(398600 / rkm), per = 2 * Math.PI * Math.sqrt(rkm ** 3 / 398600) / 60;
      tele.innerHTML = `<dl class="kv orb-kv">
        <dt>Designation</dt><dd>${esc(s.id)} “${esc(s.name)}”</dd><dt>Mission</dt><dd>${esc(s.type)}</dd>
        <dt>Altitude</dt><dd class="num">${fmtInt(s.alt)} KM</dd><dt>Velocity</dt><dd class="num">${v.toFixed(3)} KM/S</dd>
        <dt>Inclination</dt><dd class="num">${s.inc.toFixed(1)}°</dd><dt>Period</dt><dd class="num">${s.geoLon != null ? 'GEOSYNC' : per.toFixed(1) + ' MIN'}</dd>
        <dt>Sub-point</dt><dd class="num orb-sub">—</dd><dt>Resolution</dt><dd>${esc(s.res)}</dd><dt>Bands</dt><dd>${esc(s.band)}</dd>
        <dt>Next pass</dt><dd class="num orb-pass">—</dd></dl>
        <div class="orb-sig2"><span class="up">Link margin</span><div class="meter seg-m"><i style="width:${s.signal}%"></i></div><b class="num">${s.signal}%</b></div>
        <div class="panel-h" style="margin-top:6px">Task to target</div>
        <div class="orb-tgts">${TARGETS.map(t => `<button class="orb-tgt" data-t="${t.id}"><b>${t.id}</b><span>${esc(t.name)}</span><small>${esc(t.note)}</small></button>`).join('')}</div>`;
      $$('.orb-tgt', tele).forEach(b => b.onclick = () => startTask(TARGETS.find(t => t.id === b.dataset.t)));
    };
    const startTask = tg => {
      if (sel.geoLon != null || /SIGINT|ELINT|WARNING/.test(sel.type)) { log(`${sel.id} CANNOT IMAGE — ${sel.type}. SELECT AN IMAGING PLATFORM`, 'w'); Sound.err(); return; }
      task = { sat: sel, tg, t0: tNow, from: [globe.lat0, globe.lon0], z0: zoom, done: false };
      auto = false; $('[data-auto]', root).classList.remove('on');
      log(`TASKING ${sel.id} ${sel.name} → TARGET ${tg.id} ${tg.name}`, 'h');
      Sound.open();
      taskEl.hidden = false;
      taskEl.innerHTML = `<div class="ot-box"><div class="panel-h">Collection request · ${esc(sel.id)}</div><div class="ot-body"><b class="ot-state">SLEWING</b><div class="meter"><i style="width:0%"></i></div><span class="mono ot-sub">TARGET ${tg.id} · ${esc(tg.name)}</span><div class="ot-act" hidden><button class="btn" data-view>View imagery</button><button class="btn sm" data-x>Dismiss</button></div></div></div>`;
      $('[data-view]', taskEl).onclick = () => { WM.open('aerial', { target: tg.id, platform: sel }); };
      $('[data-x]', taskEl).onclick = () => { task = null; taskEl.hidden = true; };
    };
    renderList(); renderTele();
    // controls
    $$('[data-z]', root).forEach(b => b.onclick = () => { zoom = clamp(zoom * (b.dataset.z > 0 ? 1.3 : 1 / 1.3), .7, 4); });
    $('[data-auto]', root).onclick = e => { auto = !auto; e.currentTarget.classList.toggle('on', auto); };
    $('[data-follow]', root).onclick = e => { follow = !follow; e.currentTarget.classList.toggle('on', follow); };
    // touch: drag rotate, pinch zoom, tap select
    const pts = new Map(); let pinch0 = 0, z0 = 1, moved = 0;
    C.cv.style.touchAction = 'none';
    C.cv.addEventListener('pointerdown', e => { C.cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); z0 = zoom; } lastUser = tNow; });
    C.cv.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return;
      const p = pts.get(e.pointerId), dx = e.clientX - p[0], dy = e.clientY - p[1];
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; zoom = clamp(z0 * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch0, .7, 4); moved += 10; }
      else { moved += Math.abs(dx) + Math.abs(dy); const k = .28 / zoom; globe.lon0 -= dx * k; globe.lat0 = clamp(globe.lat0 + dy * k, -80, 80); follow = false; $('[data-follow]', root).classList.remove('on'); }
      lastUser = tNow;
    });
    const up = e => {
      if (pts.size === 1 && moved < 8) {
        const r = C.cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        let best = null, bd = 26;
        SATS.forEach(s => { if (!s._scr || s._scr.hid) return; const d = Math.hypot(s._scr.x - x, s._scr.y - y); if (d < bd) { bd = d; best = s; } });
        if (best) select(best);
      }
      pts.delete(e.pointerId);
    };
    C.cv.addEventListener('pointerup', up); C.cv.addEventListener('pointercancel', e => pts.delete(e.pointerId));
    C.cv.addEventListener('wheel', e => { e.preventDefault(); zoom = clamp(zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), .7, 4); }, { passive: false });
    let telAcc = 0;
    const off = Loop.add((t, dt) => {
      tNow = t;
      if (!C.visible()) return;
      const ctx = C.ctx, w = C.w, hh = C.h;
      // camera
      if (task) {
        const k = ease(clamp((t - task.t0) / 1.8, 0, 1));
        let dl = ((task.tg.lon - task.from[1] + 540) % 360) - 180;
        globe.lat0 = lerp(task.from[0], clamp(task.tg.lat, -70, 70), k);
        globe.lon0 = task.from[1] + dl * k;
        zoom = lerp(task.z0, 2.2, k);
      } else if (follow) {
        const st = satState(sel, t);
        globe.lat0 = lerp(globe.lat0, clamp(st.lat, -70, 70), .05);
        globe.lon0 += (((st.lon - globe.lon0 + 540) % 360) - 180) * .05;
      } else if (auto && t - lastUser > 3) globe.lon0 += dt * 4;
      const cx = w / 2, cy = hh / 2;
      const R = Math.min(w, hh) * .5 / 1.6 * zoom;
      ctx.fillStyle = '#02060a'; ctx.fillRect(0, 0, w, hh);
      stars.forEach(([x, y, b]) => { ctx.fillStyle = `rgba(200,230,255,${.15 + b * .4 * (.7 + .3 * Math.sin(t * 2 + b * 20))})`; ctx.fillRect(x, y, b > .9 ? 2 : 1, b > .9 ? 2 : 1); });
      globe.draw(ctx, cx, cy, R);
      // targets
      TARGETS.forEach(tg => {
        const p = globe.screen(cx, cy, R, tg.lat, tg.lon); if (p.z < .05) return;
        const on = task && task.tg === tg;
        ctx.strokeStyle = rgba(on ? THEME.alert : THEME.warn, on ? 1 : .7); ctx.lineWidth = 1.2;
        ctx.strokeRect(p.x - 4, p.y - 4, 8, 8);
        hudText(ctx, tg.id, p.x + 7, p.y - 5, { size: 10, color: rgba(on ? THEME.alert : THEME.warn, .9) });
      });
      // orbits + satellites
      SATS.forEach(s => {
        const isSel = s === sel;
        const orb = satOrbit(s, t, isSel ? 140 : 90);
        const r = satState(s, t).r;
        ctx.lineWidth = isSel ? 1.6 : 1;
        let prev = null;
        orb.forEach(([la, lo]) => {
          const p = globe.screen(cx, cy, R, la, lo, r);
          if (prev) {
            ctx.strokeStyle = rgba(isSel ? THEME.acc2 : THEME.acc, (p.hid || prev.hid) ? (isSel ? .12 : .05) : (isSel ? .75 : .22));
            ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke();
          }
          prev = p;
        });
        if (isSel && s.geoLon == null) {
          ctx.setLineDash([3, 4]); ctx.strokeStyle = rgba(THEME.warn, .45); ctx.beginPath(); let pen = false;
          orb.forEach(([la, lo]) => { const p = globe.screen(cx, cy, R, la, lo, 1); if (p.z > 0) { pen ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); pen = true; } else pen = false; });
          ctx.stroke(); ctx.setLineDash([]);
        }
      });
      SATS.forEach(s => {
        let st = satState(s, t);
        let la = st.lat, lo = st.lon;
        if (task && task.sat === s) {
          const k = clamp((t - task.t0) / 1.8, 0, 1);
          la = lerp(st.lat, task.tg.lat - 3, k); lo = st.lon + ((((task.tg.lon + 4) - st.lon + 540) % 360) - 180) * k;
        }
        const p = globe.screen(cx, cy, R, la, lo, st.r);
        s._scr = p;
        if (p.hid) return;
        const isSel = s === sel;
        // footprint + cone for imagers
        if ((isSel || (task && task.sat === s)) && s.geoLon == null && !/SIGINT|ELINT|WARNING/.test(s.type)) {
          const fpPts = geoCircle(task && task.sat === s ? task.tg.lat : la, task && task.sat === s ? task.tg.lon : lo, task && task.sat === s ? 1.2 : 4.5, 36).map(([a, b]) => globe.screen(cx, cy, R, a, b, 1));
          if (fpPts.every(q => q.z > 0)) {
            ctx.fillStyle = rgba(THEME.acc, .1); ctx.strokeStyle = rgba(THEME.acc2, .6); ctx.lineWidth = 1;
            ctx.beginPath(); fpPts.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.strokeStyle = rgba(THEME.acc2, .25); ctx.beginPath();
            [0, 9, 18, 27].forEach(i => { ctx.moveTo(p.x, p.y); ctx.lineTo(fpPts[i].x, fpPts[i].y); }); ctx.stroke();
          }
        }
        const sz = isSel ? 6 : 4;
        ctx.fillStyle = s.status === 'NOMINAL' ? rgba(isSel ? THEME.acc2 : THEME.ink, 1) : rgba(THEME.warn, 1);
        ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
        ctx.strokeStyle = rgba(THEME.acc, .7); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(p.x - sz - 4, p.y); ctx.lineTo(p.x - sz, p.y); ctx.moveTo(p.x + sz, p.y); ctx.lineTo(p.x + sz + 4, p.y); ctx.stroke();
        if (isSel) { brackets(ctx, p.x - 13, p.y - 13, 26, 26, 6, rgba(THEME.acc2, 1), 1.5); hudText(ctx, `${s.id} ${s.name}`, p.x + 18, p.y - 8, { size: 11, bg: 'rgba(0,0,0,.65)', color: rgba(THEME.acc2, 1) }); hudText(ctx, `ALT ${fmtInt(s.alt)} KM`, p.x + 18, p.y + 8, { size: 10, color: rgba(THEME.acc, .9) }); }
        else hudText(ctx, s.id, p.x + 8, p.y - 6, { size: 10, color: rgba(THEME.ink, .65) });
      });
      // task beam / acquisition
      if (task) {
        const el = t - task.t0;
        const sp = task.sat._scr, tp = globe.screen(cx, cy, R, task.tg.lat, task.tg.lon);
        if (el > 1.8 && sp && !sp.hid && tp.z > 0) {
          const pulse = (t * 2) % 1;
          ctx.strokeStyle = rgba(THEME.alert, .8); ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]); ctx.lineDashOffset = -t * 30;
          ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(tp.x, tp.y); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
          ctx.strokeStyle = rgba(THEME.alert, 1 - pulse); ctx.beginPath(); ctx.arc(tp.x, tp.y, 6 + pulse * 30, 0, Math.PI * 2); ctx.stroke();
          brackets(ctx, tp.x - 20, tp.y - 20, 40, 40, 9, rgba(THEME.alert, 1), 2);
        }
        const p = clamp((el - 1.8) / 2.8, 0, 1);
        const st = $('.ot-state', taskEl);
        if (st) {
          $('.meter i', taskEl).style.width = (p * 100) + '%';
          st.textContent = el < 1.8 ? 'SLEWING' : p < .45 ? `ACQUIRING ${Math.floor(p * 100)}%` : p < 1 ? `IMAGING — FRAME ${Math.floor(p * 14)}/14` : 'IMAGERY ACQUIRED';
          if (p >= 1 && !task.done) { task.done = true; st.classList.add('ok'); $('.ot-act', taskEl).hidden = false; Sound.ok(); log(`${task.sat.id} DOWNLINK COMPLETE — 14 FRAMES, TARGET ${task.tg.id}`, 'h'); }
        }
      }
      // HUD frame
      brackets(ctx, 10, 10, w - 20, hh - 20, 18, rgba(THEME.acc, .6), 1.5);
      ctx.strokeStyle = rgba(THEME.acc, .25); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - 12, cy); ctx.lineTo(cx + 12, cy); ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy + 12); ctx.stroke();
      hudText(ctx, `CTR ${fmtLat(globe.lat0).replace(/(\.\d\d)\d\d/, '$1')} ${fmtLon(((globe.lon0 + 540) % 360) - 180).replace(/(\.\d\d)\d\d/, '$1')} · ZOOM ×${zoom.toFixed(2)}`, 18, hh - 18, { size: 11, color: rgba(THEME.acc2, .8) });
      // telemetry (4 Hz)
      telAcc += dt;
      if (telAcc > .25) {
        telAcc = 0;
        const st = satState(sel, t);
        const sub = $('.orb-sub', tele); if (sub) sub.textContent = `${fmtLat(st.lat)} ${fmtLon(st.lon)}`;
        const ps = $('.orb-pass', tele); if (ps) { const left = 5400 - Math.floor((t * 7 + hash(sel.id) % 5400) % 5400); ps.textContent = `T−${pad(Math.floor(left / 3600))}:${pad(Math.floor(left / 60) % 60)}:${pad(left % 60)}`; }
        $('.orb-utc', root).textContent = `${tzTime('UTC')}Z · ${SATS.length} TRACKS · ${task ? 'TASKING ACTIVE' : 'PASSIVE'}`;
      }
    });
    if (opts.target) setTimeout(() => startTask(TARGETS.find(t => t.id === opts.target) || TARGETS[0]), 400);
    return {
      onOpts(o) { if (o.target) startTask(TARGETS.find(t => t.id === o.target) || TARGETS[0]); },
      destroy() { off(); C.destroy(); }
    };
  }
};
