/* ============================================================
   GLOBAL OPERATIONS — world + domestic situation map
   ============================================================ */
const CITY_LL = {
  'Arlington, VA': [38.88, -77.1], 'Washington, DC': [38.9, -77.03], 'Baltimore, MD': [39.29, -76.61], 'Norfolk, VA': [36.85, -76.29], 'Alexandria, VA': [38.8, -77.05],
  'Philadelphia, PA': [39.95, -75.17], 'Richmond, VA': [37.54, -77.44], 'New York, NY': [40.71, -74.0], 'Silver Spring, MD': [38.99, -77.03], 'Miami, FL': [25.77, -80.19],
  'Chicago, IL': [41.88, -87.63], 'Boston, MA': [42.36, -71.06], 'Denver, CO': [39.74, -104.99]
};
function subjLL(s) { const b = CITY_LL[s.city] || [38.9, -77.03]; const r = rng(hash(s.id)); return [b[0] + (r() - .5) * .5, b[1] + (r() - .5) * .6]; }
function sunPos() {
  const d = new Date(), doy = Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5);
  const decl = -23.44 * Math.cos(2 * Math.PI / 365 * (doy + 10));
  const hrs = d.getUTCHours() + d.getUTCMinutes() / 60;
  return { decl, lon: -(hrs - 12) * 15 };
}
APPS.ops = {
  title: 'Global Operations', short: 'Global ops', icon: 'globe', code: 'OPS-MAP', w: 1120, h: 680, cls: 'TS//NF',
  create(body, opts, win) {
    const root = h(`<div class="ops">
      <div class="ops-top">
        <div class="ops-stat"><b>${OPS.filter(o => o.status === 'ACTIVE').length}</b><span>Active ops</span></div>
        <div class="ops-stat"><b>41</b><span>Assets deployed</span></div>
        <div class="ops-stat"><b class="ops-int">0</b><span>Intercepts today</span></div>
        <div class="ops-stat warn"><b>3</b><span>Open alerts</span></div>
        <span class="sp"></span>
        <div class="seg ops-view"><button data-v="world" class="on">Global</button><button data-v="us">Domestic</button></div>
        <div class="seg ops-lay"><button data-l="arcs" class="on">Links</button><button data-l="sats" class="on">Satellites</button><button data-l="night" class="on">Night</button></div>
      </div>
      <div class="ops-map"><div class="ops-cv"></div><div class="ops-card" hidden></div></div>
      <aside class="ops-side panel"><div class="panel-h">Operations<span class="sp"></span><span class="mono">${OPS.length}</span></div><div class="ops-list scroll"></div></aside>
      <div class="ops-tick"><div class="ops-tick-in mono"></div></div>
    </div>`);
    body.appendChild(root);
    liveCounter($('.ops-int', root), 2148330 + Math.floor(Math.random() * 5000), 38);
    let view = 'world', lay = { arcs: true, sats: true, night: true }, selOp = null, map = null, mapKey = '';
    const C = makeCanvas($('.ops-cv', root));
    const list = $('.ops-list', root), card = $('.ops-card', root);
    const tickTxt = ['FLASH · INT-0447 KEYWORD MATCH "ARCHIVE" — CIV-1001 MERCER', 'GLASS HARBOR · CONTAINER CBMU 448120-7 MOVED TO BERTH 4', 'GNT-3 GANNET · ATTITUDE CONTROL DEGRADED — ENGINEERING NOTIFIED', 'IRON WREN · ASSET WREN CHECK-IN RECEIVED 06:14Z', 'COPPER VEIL · LISBON TEAM ON 4-HOUR NOTICE', 'LPR · PLATE KXR-2190 SIGHTED I-395 N MILE 7', 'STATIC CROWN · BUYER MEETING WINDOW 10 DAYS', 'NORTHERN LANTERN · CABLE LANDING ANOMALY SEVERITY 2'];
    $('.ops-tick-in', root).innerHTML = [...tickTxt, ...tickTxt].map(t => `<span>${esc(t)}</span>`).join('');
    const ops = () => view === 'world' ? OPS : OPS.filter(o => o.lon > -126 && o.lon < -66 && o.lat > 24 && o.lat < 50);
    const renderList = () => {
      list.innerHTML = ops().map(o => `<button class="ops-row${selOp === o ? ' on' : ''}" data-n="${esc(o.name)}"><span class="tag ${OPS_STATUS[o.status]}">${o.status}</span><b>${esc(o.name)}</b><small class="mono">${esc(o.place)} · LEAD ${esc(o.lead)}</small></button>`).join('');
      $$('.ops-row', list).forEach(b => b.onclick = () => selectOp(OPS.find(o => o.name === b.dataset.n)));
    };
    const selectOp = o => { selOp = o; renderList(); Sound.tap(); positionCard(); };
    const positionCard = () => {
      if (!selOp || !map) { card.hidden = true; return; }
      const [x, y] = map.proj(selOp.lat, selOp.lon);
      card.hidden = false;
      card.innerHTML = `<div class="panel-h">Operation ${esc(selOp.name)}<span class="sp"></span><button class="oc-x" aria-label="Close">${icon('close')}</button></div><div class="oc-b"><span class="tag ${OPS_STATUS[selOp.status]}">${selOp.status}</span><p>${esc(selOp.note)}</p><dl class="kv"><dt>Location</dt><dd>${esc(selOp.place)}</dd><dt>Coordinates</dt><dd>${fmtLat(selOp.lat).replace(/(\.\d\d)\d\d/, '$1')} ${fmtLon(selOp.lon).replace(/(\.\d\d)\d\d/, '$1')}</dd><dt>Lead</dt><dd>${esc(selOp.lead)}</dd></dl></div>`;
      $('.oc-x', card).onclick = () => { selOp = null; card.hidden = true; renderList(); };
      const cw = 270, mw = C.w, mh = C.h;
      card.style.left = clamp(x + 18, 8, mw - cw - 8) + 'px';
      card.style.top = clamp(y - 40, 8, Math.max(8, mh - card.offsetHeight - 8)) + 'px';
    };
    $$('.ops-view button', root).forEach(b => b.onclick = () => { view = b.dataset.v; $$('.ops-view button', root).forEach(x => x.classList.toggle('on', x === b)); mapKey = ''; selOp = null; card.hidden = true; renderList(); });
    $$('.ops-lay button', root).forEach(b => b.onclick = () => { lay[b.dataset.l] = !lay[b.dataset.l]; b.classList.toggle('on', lay[b.dataset.l]); });
    C.cv.addEventListener('click', e => {
      if (!map) return;
      const r = C.cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      let best = null, bd = 24;
      ops().forEach(o => { const [ox, oy] = map.proj(o.lat, o.lon); const d = Math.hypot(ox - x, oy - y); if (d < bd) { bd = d; best = o; } });
      if (best) selectOp(best);
      else if (view === 'us') {
        SUBJECTS.forEach(s => { const [la, lo] = subjLL(s); const [sx, sy] = map.proj(la, lo); const d = Math.hypot(sx - x, sy - y); if (d < bd) { bd = d; best = s; } });
        if (best) WM.open('cif', { subject: best.id });
      }
    });
    const off = Loop.add((t) => {
      if (!C.visible()) return;
      const ctx = C.ctx, w = C.w, hh = C.h;
      const key = view + w + 'x' + hh + THEME.acc.join(',');
      if (key !== mapKey) { mapKey = key; map = view === 'world' ? flatWorld(w, hh, { dpr: C.dpr, latT: 82, latB: -58 }) : flatUS(w, hh, { dpr: C.dpr }); positionCard(); }
      ctx.fillStyle = '#03080d'; ctx.fillRect(0, 0, w, hh);
      ctx.drawImage(map.canvas, 0, 0, w, hh);
      const P = (la, lo) => map.proj(la, lo);
      // night shading
      if (lay.night && view === 'world') {
        const sp = sunPos(), [bx, by, bw, bh] = map.box;
        ctx.fillStyle = 'rgba(0,0,0,.38)'; ctx.beginPath();
        const tanD = Math.tan(sp.decl * D2R);
        for (let lo = -180; lo <= 180; lo += 3) { const la = Math.atan(-Math.cos((lo - sp.lon) * D2R) / (tanD || 1e-6)) / D2R; const [x, y] = P(clamp(la, -58, 82), lo); lo === -180 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        if (sp.decl < 0) { ctx.lineTo(bx + bw, by); ctx.lineTo(bx, by); } else { ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx, by + bh); }
        ctx.closePath(); ctx.fill();
        const [sx, sy] = P(clamp(sp.decl, -58, 82), sp.lon);
        ctx.strokeStyle = rgba(THEME.warn, .7); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(sx, sy, 6, 0, 6.283); ctx.stroke();
        hudText(ctx, 'SUBSOLAR', sx + 9, sy + 4, { size: 9, color: rgba(THEME.warn, .8) });
      }
      // satellites
      if (lay.sats && view === 'world') {
        SATS.slice(0, 4).forEach((s, i) => {
          if (s.geoLon != null) return;
          const orb = satOrbit(s, t, 120);
          ctx.strokeStyle = rgba(THEME.acc2, .28); ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath();
          let prev = null;
          orb.forEach(([la, lo]) => { const [x, y] = P(la, lo); if (prev && Math.abs(lo - prev) < 180) ctx.lineTo(x, y); else ctx.moveTo(x, y); prev = lo; });
          ctx.stroke(); ctx.setLineDash([]);
          const st = satState(s, t); const [x, y] = P(st.lat, st.lon);
          ctx.fillStyle = rgba(THEME.acc2, 1); ctx.fillRect(x - 3, y - 3, 6, 6);
          hudText(ctx, s.id, x + 7, y - 5, { size: 10, color: rgba(THEME.acc2, .9) });
        });
      }
      // links
      const hub = OPS[1], [hx, hy] = P(hub.lat, hub.lon);
      if (lay.arcs) {
        ops().forEach((o, i) => {
          if (o === hub || o.status === 'CLOSED') return;
          const [x, y] = P(o.lat, o.lon), mx = (x + hx) / 2, my = Math.min(y, hy) - Math.abs(x - hx) * .25 - 10;
          ctx.strokeStyle = rgba(THEME.acc, selOp === o ? .7 : .22); ctx.lineWidth = selOp === o ? 1.6 : 1; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo(mx, my, x, y); ctx.stroke();
          for (let k = 0; k < 2; k++) { const p = (t * .25 + i * .17 + k * .5) % 1, q = 1 - p; const px = q * q * hx + 2 * q * p * mx + p * p * x, py = q * q * hy + 2 * q * p * my + p * p * y; ctx.fillStyle = rgba(THEME.acc2, .9); ctx.fillRect(px - 1.5, py - 1.5, 3, 3); }
        });
      }
      // domestic: cities + subjects
      if (view === 'us') {
        US_CITIES.forEach(([n, la, lo]) => { const [x, y] = P(la, lo); ctx.fillStyle = rgba(THEME.ink, .55); ctx.fillRect(x - 1.5, y - 1.5, 3, 3); hudText(ctx, n, x + 5, y - 4, { size: 9, color: rgba(THEME.ink, .45) }); });
        SUBJECTS.forEach((s, i) => {
          const [la, lo] = subjLL(s), [x, y] = P(la, lo), col = threatColor(s.threat);
          const p = (t * .7 + i * .21) % 1;
          ctx.strokeStyle = rgba(col, (1 - p) * .8); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 3 + p * 14, 0, 6.283); ctx.stroke();
          ctx.fillStyle = rgba(col, 1); ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 4, y); ctx.closePath(); ctx.fill();
          if (s.threat >= 80) hudText(ctx, s.last.toUpperCase(), x + 7, y + 12, { size: 10, bg: 'rgba(0,0,0,.6)', color: rgba(col, 1) });
        });
      }
      // op markers
      ops().forEach((o, i) => {
        const [x, y] = P(o.lat, o.lon);
        const col = o.status === 'ACTIVE' ? THEME.alert : o.status === 'STANDBY' ? THEME.warn : o.status === 'CLOSED' ? THEME.ink : THEME.acc2;
        const p = (t * .6 + i * .23) % 1;
        if (o.status !== 'CLOSED') { ctx.strokeStyle = rgba(col, (1 - p) * .9); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, 4 + p * 20, 0, 6.283); ctx.stroke(); }
        ctx.fillStyle = rgba(col, 1); ctx.fillRect(x - 3, y - 3, 6, 6);
        if (selOp === o) brackets(ctx, x - 14, y - 14, 28, 28, 7, rgba(col, 1), 2);
        hudText(ctx, o.name, x + 8, y - 6, { size: 10, bg: 'rgba(0,0,0,.55)', color: rgba(col, .95) });
      });
      if (view === 'us') { ctx.strokeStyle = rgba(THEME.acc2, .9); ctx.beginPath(); ctx.arc(hx, hy, 9, 0, 6.283); ctx.stroke(); }
      brackets(ctx, 8, 8, w - 16, hh - 16, 16, rgba(THEME.acc, .55), 1.5);
      hudText(ctx, view === 'world' ? `SITUATION MAP · ${tzTime('UTC')}Z` : `DOMESTIC · ${SUBJECTS.length} SUBJECTS TRACKED · TAP A MARKER TO OPEN ITS FILE`, 18, hh - 18, { size: 11, color: rgba(THEME.acc2, .8) });
    });
    renderList();
    return { destroy() { off(); C.destroy(); } };
  }
};
