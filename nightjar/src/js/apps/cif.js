/* ============================================================
   CIVILIAN INFORMATION FILES
   ============================================================ */
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
function fmtDT(t, withYear) { const d = new Date(t - 4 * 3600e3); return `${pad(d.getUTCDate())} ${MON[d.getUTCMonth()]}${withYear ? ' ' + d.getUTCFullYear() : ''} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`; }
function fmtDur(s) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }
function redactHTML(text) {
  return esc(text).replace(/\[\[(.+?)\]\]/g, (m, inner) => `<span class="redact tap" data-r="${esc(inner)}">${'█'.repeat(Math.min(18, Math.max(6, inner.length)))}</span>`);
}
function bindRedactions(root) {
  root.addEventListener('click', e => {
    const r = e.target.closest('.redact.tap'); if (!r || UI.editMode) return;
    if (r.classList.contains('open')) { r.classList.remove('open'); r.textContent = '█'.repeat(Math.min(18, Math.max(6, r.dataset.r.length))); return; }
    scramble(r, r.dataset.r); r.classList.add('open'); Sound.ok();
  });
}
function scramble(el, txt, ms = 700) {
  const chars = '█▓▒░#%&@$ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  const t0 = performance.now();
  const off = Loop.add(() => {
    const p = clamp((performance.now() - t0) / ms, 0, 1), n = Math.floor(p * txt.length);
    let s = txt.slice(0, n); for (let i = n; i < txt.length; i++) s += txt[i] === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)];
    el.textContent = s; if (p >= 1) off();
  });
}
function threatColor(v) { return v >= 80 ? THEME.alert : v >= 55 ? THEME.warn : v >= 25 ? THEME.acc : THEME.ok; }

APPS.cif = {
  title: 'Civilian Information Files', short: 'CIF', icon: 'cif', code: 'CIF-DB', w: 1080, h: 690, cls: 'TS//SI//NF',
  create(body, opts, win) {
    const root = h(`<div class="cif">
      <div class="cif-search">
        <button class="btn sm cif-listbtn">${'Subjects'}</button>
        <label class="cif-q">${icon('search')}<input class="field-in" id="cifQ${win.id}" placeholder="Search name, ID, phone or plate" autocomplete="off" autocapitalize="characters" spellcheck="false"></label>
        <button class="btn cif-go">Query</button>
        <div class="seg cif-seg"><button data-f="ALL" class="on">All</button><button data-f="PRIORITY TARGET">Priority</button><button data-f="WATCHLIST">Watch</button><button data-f="MONITORED">Monitor</button><button data-f="CLEARED">Cleared</button></div>
      </div>
      <div class="cif-main">
        <div class="cif-list scroll"></div>
        <div class="cif-file"></div>
      </div>
      <div class="cif-foot mono"><span>DATABASE: 2,314,882,107 RECORDS</span><span class="cif-count"></span><span>LAST SYNC ${tzTime('UTC').slice(0, 5)}Z</span></div>
    </div>`);
    body.appendChild(root);
    const list = $('.cif-list', root), file = $('.cif-file', root), q = $('input', root);
    let filter = 'ALL', cur = null, tab = 'overview', offs = [];
    const cleanup = () => { offs.forEach(f => f()); offs = []; };
    const norm = s => String(s).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const matches = () => {
      const qq = norm(q.value);
      return SUBJECTS.filter(s => (filter === 'ALL' || s.status === filter || (filter === 'CLEARED' && s.status === 'ASSET — ACTIVE')) &&
        (!qq || [s.name, s.id, s.idLong, s.phone, s.plate, s.city, s.emp, ...(s.alias || [])].some(v => norm(v).includes(qq))))
        .sort((a, b) => b.threat - a.threat);
    };
    const renderList = () => {
      const arr = matches();
      list.innerHTML = arr.map(s => `<button class="cif-row${cur && cur.id === s.id ? ' on' : ''}" data-id="${s.id}">
        <canvas width="68" height="80"></canvas>
        <span class="cr-main"><b>${esc(s.name)}</b><small>${esc(s.id)} · ${esc(s.city)}</small></span>
        <span class="cr-side"><span class="sq ${STATUS[s.status] ? STATUS[s.status].cls : ''}"></span><span class="num">${s.threat}</span></span></button>`).join('') || `<div class="cif-empty mono">NO RECORDS MATCH</div>`;
      $$('.cif-row', list).forEach(b => {
        const s = SUBJ(b.dataset.id);
        b.querySelector('canvas').getContext('2d').drawImage(portrait(s, 68, 80), 0, 0);
        b.onclick = () => { select(s.id); root.classList.remove('list-open'); };
      });
      $('.cif-count', root).textContent = `${arr.length} OF ${SUBJECTS.length} SUBJECTS SHOWN`;
    };
    const select = (id, animate = true) => {
      cur = SUBJ(id) || SUBJECTS[0];
      $$('.cif-row', list).forEach(b => b.classList.toggle('on', b.dataset.id === cur.id));
      renderFile(animate);
    };
    const ed = (key, val, tagName = 'span') => UI.editMode ? `<${tagName} data-edit="${key}" contenteditable="true" spellcheck="false">${esc(val)}</${tagName}>` : esc(val);
    const renderFile = (animate) => {
      cleanup();
      const s = cur;
      const st = STATUS[s.status] || { cls: 't-acc' };
      file.innerHTML = `
        <div class="cf-head">
          <div class="cf-portrait${UI.editMode ? ' editable' : ''}"><div class="cf-pv"></div><span class="cf-pl mono">FACIAL INDEX · ${esc(s.id)}</span>${UI.editMode ? '<span class="cf-photo-hint">Tap to replace photo</span>' : ''}</div>
          <div class="cf-id">
            <div class="cf-tags"><span class="tag ${st.cls}${st.rank === 0 ? ' blink' : ''}" ${UI.editMode ? 'data-cycle="status" style="cursor:pointer"' : ''}>${esc(s.status)}</span><span class="tag t-dim">${esc(s.idLong)}</span></div>
            <h2 class="cf-name">${ed('name', s.name)}</h2>
            <div class="cf-alias mono">${s.alias && s.alias.length ? 'AKA ' + s.alias.map(esc).join(' · ') : 'NO KNOWN ALIASES'}</div>
            <div class="cf-occ">${ed('occ', s.occ)} — ${ed('emp', s.emp)}</div>
            <div class="cf-acts"><button class="btn sm" data-act="track">${icon('target')}Track</button><button class="btn sm" data-act="comms">${icon('sigint')}Intercepts</button><button class="btn sm" data-act="bio">${icon('bio')}Biometrics</button><button class="btn sm alert" data-act="flag">Flag subject</button></div>
          </div>
          <div class="cf-gauge" ${UI.editMode ? 'title="Tap to change" style="cursor:pointer"' : ''}><div class="cf-gv"></div><span class="up">Threat index</span></div>
        </div>
        <div class="tabs cf-tabs">${[['overview', 'Overview'], ['assoc', 'Associates'], ['moves', 'Movements'], ['comms', 'Communications'], ['fin', 'Financial'], ['travel', 'Travel']].map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        <div class="cf-body scroll"></div>
        <div class="cf-query" hidden></div>`;
      // portrait with face-mesh scan
      const pv = $('.cf-pv', file);
      const PC = makeCanvas(pv);
      const mesh = faceMesh(s.face);
      const t0 = performance.now() / 1000;
      offs.push(() => PC.destroy());
      offs.push(Loop.add((t) => {
        if (!PC.visible()) return;
        const ctx = PC.ctx, w = PC.w, hh = PC.h;
        const base = portrait(s, Math.round(w * PC.dpr), Math.round(hh * PC.dpr));
        ctx.drawImage(base, 0, 0, w, hh);
        const p = animate ? clamp((t - t0) / 1.8, 0, 1) : 1;
        const sz = Math.min(w, hh / 1.2), ox = (w - sz) / 2, oy = (hh - sz * 1.2) / 2;
        const X = v => ox + v * sz, Y = v => oy + v * sz;
        const nE = Math.floor(mesh.edges.length * p);
        ctx.strokeStyle = rgba(THEME.acc2, p < 1 ? .7 : .28); ctx.lineWidth = 1; ctx.beginPath();
        for (let i = 0; i < nE; i++) { const [a, b] = mesh.edges[i]; ctx.moveTo(X(mesh.pts[a][0]), Y(mesh.pts[a][1])); ctx.lineTo(X(mesh.pts[b][0]), Y(mesh.pts[b][1])); }
        ctx.stroke();
        const nP = Math.floor(mesh.pts.length * p);
        ctx.fillStyle = rgba(THEME.acc2, p < 1 ? 1 : .55);
        for (let i = 0; i < nP; i++) ctx.fillRect(X(mesh.pts[i][0]) - 1.5, Y(mesh.pts[i][1]) - 1.5, 3, 3);
        const sy = p < 1 ? hh * p : (hh * ((t * .25) % 1));
        ctx.fillStyle = rgba(THEME.acc, .5); ctx.fillRect(0, sy, w, 1.5);
        const g = ctx.createLinearGradient(0, sy - 30, 0, sy); g.addColorStop(0, rgba(THEME.acc, 0)); g.addColorStop(1, rgba(THEME.acc, .14)); ctx.fillStyle = g; ctx.fillRect(0, sy - 30, w, 30);
        brackets(ctx, 4, 4, w - 8, hh - 8, 12, rgba(THEME.acc, .9), 2);
        hudText(ctx, p < 1 ? `MAPPING ${Math.floor(p * 68)}/68` : 'IDENTITY CONFIRMED', 9, 18, { size: 10, bg: 'rgba(0,0,0,.6)', color: p < 1 ? rgba(THEME.warn, 1) : rgba(THEME.ok, 1) });
      }));
      // gauge
      const GC = makeCanvas($('.cf-gv', file));
      offs.push(() => GC.destroy());
      const g0 = performance.now() / 1000;
      offs.push(Loop.add((t) => {
        if (!GC.visible()) return;
        const ctx = GC.ctx, w = GC.w, hh = GC.h; ctx.clearRect(0, 0, w, hh);
        const v = s.threat * (animate ? ease(clamp((t - g0) / 1.2, 0, 1)) : 1);
        const cx = w / 2, cy = hh / 2 + 4, R = Math.min(w, hh) * .4;
        const a0 = Math.PI * .75, a1 = Math.PI * 2.25;
        ctx.lineWidth = 9; ctx.strokeStyle = rgba(THEME.acc, .12); ctx.beginPath(); ctx.arc(cx, cy, R, a0, a1); ctx.stroke();
        const col = threatColor(v);
        const segs = 30;
        for (let i = 0; i < segs; i++) {
          const f0 = i / segs; if (f0 * 100 > v) break;
          ctx.strokeStyle = rgba(col, .95); ctx.beginPath(); ctx.arc(cx, cy, R, a0 + (a1 - a0) * f0, a0 + (a1 - a0) * (f0 + .8 / segs)); ctx.stroke();
        }
        ctx.lineWidth = 1; ctx.strokeStyle = rgba(THEME.acc, .4); ctx.beginPath(); ctx.arc(cx, cy, R - 12, a0, a1); ctx.stroke();
        hudText(ctx, String(Math.round(v)), cx, cy + 9, { size: Math.round(R * .62), align: 'center', color: rgba(col, 1) });
        hudText(ctx, '/100', cx, cy + R * .55, { size: 10, align: 'center', color: rgba(THEME.ink, .5) });
      }));
      // tabs
      $$('.cf-tabs button', file).forEach(b => b.onclick = () => { tab = b.dataset.tab; $$('.cf-tabs button', file).forEach(x => x.classList.toggle('on', x === b)); renderTab(); });
      $$('[data-act]', file).forEach(b => b.onclick = () => act(b.dataset.act));
      const pt = $('.cf-portrait', file);
      pt.onclick = () => { if (UI.editMode) pickPhoto(); };
      const gauge = $('.cf-gauge', file);
      gauge.onclick = () => { if (!UI.editMode) return; saveSubjectEdit(s.id, 'threat', (s.threat + 5) % 105); renderFile(false); renderList(); };
      const cyc = $('[data-cycle]', file);
      if (cyc) cyc.onclick = () => { const keys = Object.keys(STATUS); saveSubjectEdit(s.id, 'status', keys[(keys.indexOf(s.status) + 1) % keys.length]); renderFile(false); renderList(); };
      bindEdits(file);
      renderTab();
    };
    let tabOffs = [];
    const renderTab = () => {
      tabOffs.forEach(f => f()); tabOffs = [];
      const s = cur, box = $('.cf-body', file);
      if (tab === 'overview') {
        const L = s.lastSeen;
        box.innerHTML = `<div class="cf-ov">
          <section class="panel"><div class="panel-h">Identity</div><dl class="kv cf-kv">
            <dt>Date of birth</dt><dd>${ed('dob', s.dob)} <span class="faint">(${s.age})</span></dd>
            <dt>Sex</dt><dd>${s.sex === 'F' ? 'FEMALE' : 'MALE'}</dd>
            <dt>Height / weight</dt><dd>${ed('height', s.height)} · ${ed('weight', s.weight)}</dd>
            <dt>Eyes / hair</dt><dd>${ed('eyes', s.eyes)} · ${ed('hair', s.hair)}</dd>
            <dt>National ID</dt><dd>${esc(s.nid)}</dd>
            <dt>Languages</dt><dd>${esc(s.lang.toUpperCase())}</dd>
            <dt>Address</dt><dd>${ed('addr', s.addr.toUpperCase())}</dd>
            <dt>Phone</dt><dd>${ed('phone', s.phone)}</dd>
            <dt>Device IMEI</dt><dd>${esc(s.imei)}</dd>
            <dt>Last IP</dt><dd>${esc(s.ip)}</dd>
            <dt>Vehicle</dt><dd>${ed('vehicle', s.vehicle.toUpperCase())}</dd>
            <dt>Plate</dt><dd>${ed('plate', s.plate)}</dd>
          </dl></section>
          <div class="cf-col">
            <section class="panel"><div class="panel-h">Last known location<span class="sp"></span><span class="tag t-acc">${esc(L.src)}</span></div>
              <div class="cf-last"><b>${esc(L.place)}</b><span class="mono">${fmtDT(L.t, true)} EST · CONF ${L.conf}%</span></div></section>
            <section class="panel"><div class="panel-h">Analyst notes<span class="sp"></span><span class="mono">TAP REDACTIONS</span></div>
              <div class="cf-notes">${UI.editMode ? `<div data-edit="notes" contenteditable="true" spellcheck="false">${esc(s.notes)}</div>` : redactHTML(s.notes)}</div></section>
            <section class="panel"><div class="panel-h">Risk factors</div><div class="cf-risk">${riskRows(s)}</div></section>
          </div></div>`;
        bindRedactions(box); bindEdits(box);
      } else if (tab === 'assoc') {
        box.innerHTML = `<div class="cf-net"><svg class="cf-svg"></svg><div class="cf-netlist"></div></div>`;
        drawNet(s, box);
      } else if (tab === 'moves') {
        box.innerHTML = `<div class="cf-moves"><div class="cf-map"></div><div class="cf-mlist scroll">${s.moves.slice().reverse().map((m, i) => `<button class="cf-mrow" data-i="${s.moves.length - 1 - i}"><span class="num">${fmtDT(m.t)}</span><b>${esc(m.place)}</b><span class="tag t-acc">${esc(m.src)}</span></button>`).join('')}</div></div>`;
        const MC = makeCanvas($('.cf-map', box));
        let hi = s.moves.length - 1;
        $$('.cf-mrow', box).forEach(b => b.onclick = () => { hi = +b.dataset.i; $$('.cf-mrow', box).forEach(x => x.classList.toggle('on', x === b)); });
        const t0 = performance.now() / 1000;
        tabOffs.push(() => MC.destroy());
        tabOffs.push(Loop.add((t) => {
          if (!MC.visible()) return;
          const ctx = MC.ctx, w = MC.w, hh = MC.h;
          ctx.drawImage(schematic(hash(s.id), Math.round(w * MC.dpr), Math.round(hh * MC.dpr)), 0, 0, w, hh);
          const P = s.moves.map(m => [m.x * w, m.y * hh]);
          const prog = clamp((t - t0) / 2.4, 0, 1) * (P.length - 1);
          ctx.strokeStyle = rgba(THEME.warn, .9); ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.beginPath();
          for (let i = 0; i <= Math.floor(prog); i++) { const [x, y] = P[i]; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
          const fi = Math.floor(prog), fr = prog - fi;
          if (fi < P.length - 1) ctx.lineTo(lerp(P[fi][0], P[fi + 1][0], fr), lerp(P[fi][1], P[fi + 1][1], fr));
          ctx.stroke(); ctx.setLineDash([]);
          P.forEach(([x, y], i) => {
            if (i > prog + .01) return;
            const on = i === hi;
            ctx.fillStyle = on ? rgba(THEME.alert, 1) : rgba(THEME.warn, .9);
            ctx.fillRect(x - (on ? 5 : 3), y - (on ? 5 : 3), on ? 10 : 6, on ? 10 : 6);
            hudText(ctx, pad(i + 1), x + 8, y - 6, { size: 10, color: rgba(THEME.ink, .8) });
            if (on) { const pp = (t * 1.2) % 1; ctx.strokeStyle = rgba(THEME.alert, 1 - pp); ctx.beginPath(); ctx.arc(x, y, 6 + pp * 22, 0, Math.PI * 2); ctx.stroke(); }
          });
          const m = s.moves[hi];
          hudText(ctx, `${pad(hi + 1)} · ${m.place} · ${fmtDT(m.t)} · ${m.src} ${m.conf}%`, 10, hh - 12, { size: 11, bg: 'rgba(0,0,0,.7)', color: rgba(THEME.acc2, 1) });
          brackets(ctx, 3, 3, w - 6, hh - 6, 14, rgba(THEME.acc, .7));
        }));
      } else if (tab === 'comms') {
        const icpt = INTERCEPTS.filter(i => i.a.subj === s.id || i.b.subj === s.id);
        const hours = Array(24).fill(0); s.calls.forEach(c => hours[new Date(c.t - 4 * 3600e3).getUTCHours()]++);
        const mx = Math.max(1, ...hours);
        box.innerHTML = `<div class="cf-comms">
          <section class="panel"><div class="panel-h">Activity by hour (72h)<span class="sp"></span><span class="mono">${s.calls.length} EVENTS</span></div>
            <div class="cf-hours">${hours.map((v, i) => `<i style="height:${Math.max(3, v / mx * 100)}%" title="${pad(i)}:00"></i>`).join('')}</div>
            <div class="cf-hours-ax mono"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div></section>
          ${icpt.length ? `<section class="panel cf-icpt"><div class="panel-h">Recorded intercepts</div>${icpt.map(i => `<button class="cf-irow" data-int="${i.id}"><span class="tag t-red">${esc(i.pri)}</span><b>${esc(i.id)}</b><span>${esc(i.a.name)} ↔ ${esc(i.b.name)}</span><span class="mono acc">PLAY ▸</span></button>`).join('')}</section>` : ''}
          <section class="panel"><div class="panel-h">Call detail records</div>
          <table class="dt"><thead><tr><th>Date / time</th><th>Dir</th><th>Type</th><th>Number</th><th>Dur</th><th>Flag</th></tr></thead><tbody>
          ${s.calls.map(c => `<tr class="${c.flag ? 'hot' : ''}"><td>${fmtDT(c.t)}</td><td>${c.dir}</td><td>${c.type}</td><td>${esc(c.num)}</td><td>${c.type === 'SMS' ? '—' : fmtDur(c.dur)}</td><td>${c.flag ? `<span class="tag t-red">${esc(c.flag)}</span>` : '<span class="faint">—</span>'}</td></tr>`).join('')}
          </tbody></table></section></div>`;
        $$('.cf-irow', box).forEach(b => b.onclick = () => WM.open('sigint', { intercept: b.dataset.int }));
      } else if (tab === 'fin') {
        const mx = Math.max(...s.months);
        const flagged = s.txns.filter(x => x.flag).reduce((a, x) => a + x.amt, 0);
        box.innerHTML = `<div class="cf-fin">
          <section class="panel"><div class="panel-h">Monthly outflow (12 mo)<span class="sp"></span><span class="mono">FLAGGED $${fmtInt(flagged)}</span></div>
            <div class="cf-bars">${s.months.map((v, i) => `<div><i style="height:${v / mx * 100}%" class="${v > 6000 ? 'hot' : ''}"></i><span class="mono">${MON[(i + 10) % 12].slice(0, 1)}</span></div>`).join('')}</div></section>
          <section class="panel"><div class="panel-h">Transactions</div>
          <table class="dt"><thead><tr><th>Date</th><th>Merchant</th><th>Card</th><th class="r">Amount</th></tr></thead><tbody>
          ${s.txns.map(x => `<tr class="${x.flag ? 'hot' : ''}"><td>${fmtDT(x.t).slice(0, 6)}</td><td>${esc(x.m)}</td><td>${x.card}</td><td class="r">$${x.amt.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</td></tr>`).join('')}
          </tbody></table></section></div>`;
      } else if (tab === 'travel') {
        box.innerHTML = `<div class="cf-travel">
          <section class="panel"><div class="panel-h">Air travel</div>
          <table class="dt"><thead><tr><th>Date</th><th>Route</th><th>Flight</th><th>Seat</th><th>Status</th></tr></thead><tbody>
          ${s.travel.map(x => `<tr class="${x.flag ? 'hot' : ''}"><td>${fmtDT(x.t, true).slice(0, 11)}</td><td>${x.from} → ${x.to}</td><td>${x.flt}</td><td>${x.seat}</td><td>${x.flag ? '<span class="tag t-red">SECONDARY SCREENING</span>' : '<span class="tag t-dim">CLEARED</span>'}</td></tr>`).join('')}
          </tbody></table></section>
          <section class="panel"><div class="panel-h">Watchlist hits</div><dl class="kv cf-kv">
            <dt>Border alert</dt><dd>${s.threat > 60 ? '<span class="alert">ACTIVE — DETAIN AND NOTIFY</span>' : s.threat > 40 ? '<span class="warn">SECONDARY INSPECTION</span>' : 'NONE'}</dd>
            <dt>Passport status</dt><dd>${s.threat > 80 ? '<span class="alert">FLAGGED FOR REVOCATION</span>' : 'VALID'}</dd>
            <dt>Last crossing</dt><dd>${s.travel[0] ? fmtDT(s.travel[0].t, true).slice(0, 11) + ' · ' + s.travel[0].to : '—'}</dd>
          </dl></section></div>`;
      }
      box.scrollTop = 0;
    };
    const riskRows = s => {
      const r = rng(hash(s.id) + 99);
      return [['Network centrality', s.assoc.length * 9 + r() * 20], ['Financial anomaly', s.threat * .8 + r() * 25], ['Travel pattern', s.threat * .6 + r() * 30], ['Comms security', s.threat * .9 + r() * 10]]
        .map(([l, v]) => { v = clamp(Math.round(v), 3, 99); return `<div class="rk"><span>${l}</span><div class="meter seg-m${v > 75 ? ' hot' : ''}"><i style="width:${v}%"></i></div><b class="num">${v}</b></div>`; }).join('');
    };
    const drawNet = (s, box) => {
      const svg = $('.cf-svg', box), lst = $('.cf-netlist', box);
      const W = 600, H = 420, cx = W / 2, cy = H / 2;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const n = s.assoc.length;
      let out = `<defs><pattern id="g${win.id}" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="rgba(var(--acc-rgb),.07)"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#g${win.id})"/>`;
      const pos = s.assoc.map((a, i) => { const ang = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(ang) * 165, cy + Math.sin(ang) * 140]; });
      // second-degree ghosts
      s.assoc.forEach((a, i) => {
        const o = a.id ? SUBJ(a.id) : null; if (!o) return;
        const [x, y] = pos[i];
        o.assoc.filter(b => b.id && b.id !== s.id).slice(0, 3).forEach((b, k) => {
          const ang = Math.atan2(y - cy, x - cx) + (k - 1) * .35;
          const gx = x + Math.cos(ang) * 58, gy = y + Math.sin(ang) * 50;
          out += `<line x1="${x}" y1="${y}" x2="${gx}" y2="${gy}" stroke="rgba(var(--acc-rgb),.18)" stroke-dasharray="2 3"/><rect x="${gx - 3}" y="${gy - 3}" width="6" height="6" fill="rgba(var(--acc-rgb),.35)"/>`;
        });
      });
      s.assoc.forEach((a, i) => {
        const [x, y] = pos[i]; const o = a.id ? SUBJ(a.id) : null;
        const col = o ? (o.threat >= 80 ? 'var(--alert)' : o.threat >= 55 ? 'var(--warn)' : 'var(--acc)') : 'var(--ink-faint)';
        out += `<line class="ln" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${col}" stroke-opacity=".6" stroke-width="1.4" ${o ? '' : 'stroke-dasharray="5 4"'} style="animation-delay:${i * .08}s"/>`;
        const mx = (cx + x) / 2, my = (cy + y) / 2;
        out += `<text x="${mx}" y="${my - 4}" text-anchor="middle" class="el">${esc(a.label)}</text>`;
      });
      s.assoc.forEach((a, i) => {
        const [x, y] = pos[i]; const o = a.id ? SUBJ(a.id) : null;
        const col = o ? (o.threat >= 80 ? 'var(--alert)' : o.threat >= 55 ? 'var(--warn)' : 'var(--acc)') : 'var(--ink-faint)';
        out += `<g class="nd${o ? ' tap' : ''}" ${o ? `data-id="${o.id}"` : ''} style="animation-delay:${.2 + i * .08}s"><rect x="${x - 24}" y="${y - 24}" width="48" height="48" fill="rgba(4,12,19,.95)" stroke="${col}" stroke-width="1.5"/>
          <text x="${x}" y="${y + 6}" text-anchor="middle" class="ni" fill="${col}">${o ? esc(o.first[0] + o.last[0]) : '?'}</text>
          <text x="${x}" y="${y + 40}" text-anchor="middle" class="nl">${o ? esc((o.first + ' ' + o.last).toUpperCase()) : esc(a.ghost)}</text></g>`;
      });
      out += `<g class="nd"><rect x="${cx - 34}" y="${cy - 34}" width="68" height="68" fill="rgba(4,12,19,.95)" stroke="var(--acc)" stroke-width="2"/><rect x="${cx - 40}" y="${cy - 40}" width="80" height="80" fill="none" stroke="var(--acc)" stroke-opacity=".35"/>
        <text x="${cx}" y="${cy + 9}" text-anchor="middle" class="ni big" fill="var(--acc-2)">${esc(s.first[0] + s.last[0])}</text><text x="${cx}" y="${cy + 54}" text-anchor="middle" class="nl">SUBJECT</text></g>`;
      svg.innerHTML = out;
      $$('.nd.tap', svg).forEach(g => g.addEventListener('click', () => select(g.dataset.id)));
      lst.innerHTML = `<div class="panel-h">Known associates · ${n}</div>` + s.assoc.map(a => { const o = a.id ? SUBJ(a.id) : null; return `<button class="cf-arow"${o ? ` data-id="${o.id}"` : ' disabled'}><b>${o ? esc(o.name) : esc(a.ghost)}</b><small>${esc(a.label)}</small>${o ? `<span class="tag ${STATUS[o.status] ? STATUS[o.status].cls : ''}">${o.threat}</span>` : ''}</button>`; }).join('');
      $$('.cf-arow[data-id]', lst).forEach(b => b.onclick = () => select(b.dataset.id));
    };
    const act = a => {
      const s = cur;
      if (a === 'track') { const tgt = TARGETS.find(t => t.note.includes(s.last.toUpperCase())) || TARGETS[0]; WM.open('aerial', { target: tgt.id, subject: s.id }); }
      else if (a === 'comms') { const i = INTERCEPTS.find(x => x.a.subj === s.id || x.b.subj === s.id); WM.open('sigint', i ? { intercept: i.id } : {}); }
      else if (a === 'bio') WM.open('bio', { subject: s.id });
      else if (a === 'flag') {
        Sound.err();
        const b = $('[data-act="flag"]', file); b.textContent = 'Flagged — Director notified'; b.classList.add('on'); b.disabled = true;
      }
    };
    const runQuery = () => {
      const qv = q.value.trim();
      const res = matches();
      const box = $('.cf-query', file);
      box.hidden = false;
      const dbs = ['Biometric index', 'Motor vehicle registry', 'Telecom metadata', 'Financial transactions', 'Travel manifests', 'Municipal CCTV index'];
      box.innerHTML = `<div class="cq-in"><div class="panel-h">Cross-referencing${qv ? ' · “' + esc(qv.toUpperCase()) + '”' : ''}</div><div class="cq-rows">${dbs.map(d => `<div class="cq-row"><span>${d}</span><div class="meter"><i style="width:0%"></i></div><b class="mono">—</b></div>`).join('')}</div><div class="cq-res mono"></div></div>`;
      Sound.scan();
      const rows = $$('.cq-row', box), t0 = performance.now();
      const off = Loop.add(() => {
        const el = (performance.now() - t0) / 1000;
        rows.forEach((r, i) => {
          const p = clamp((el - i * .22) / .55, 0, 1);
          r.querySelector('i').style.width = (p * 100) + '%';
          r.querySelector('b').textContent = p >= 1 ? (res.length ? `${Math.max(1, Math.floor((hash(r.textContent) % 7) + 1))} HIT` : '0 HIT') : p > 0 ? Math.floor(p * 100) + '%' : '—';
        });
        if (el > dbs.length * .22 + .8) {
          off();
          const rr = $('.cq-res', box);
          if (res.length) { rr.innerHTML = `<span class="ok">${res.length} MATCH${res.length > 1 ? 'ES' : ''} FOUND</span> · OPENING ${esc(res[0].name)}`; Sound.ok(); setTimeout(() => { if (!box.isConnected) return; box.hidden = true; select(res[0].id); }, 900); }
          else { rr.innerHTML = `<span class="alert">NO RECORDS FOUND</span> · TAP TO CLOSE`; Sound.err(); box.onclick = () => { box.hidden = true; }; }
        }
      });
      offs.push(off);
    };
    const pickPhoto = () => {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = () => {
        const f = inp.files && inp.files[0]; if (!f) return;
        const rd = new FileReader();
        rd.onload = () => {
          const img = new Image();
          img.onload = () => {
            const c = offscreen(360, 432), x = c.getContext('2d');
            const sc = Math.max(360 / img.width, 432 / img.height);
            x.drawImage(img, (360 - img.width * sc) / 2, (432 - img.height * sc) / 2, img.width * sc, img.height * sc);
            const url = c.toDataURL('image/jpeg', .85);
            cur._img = null;
            const ok = saveSubjectEdit(cur.id, 'photo', url);
            faceCache.clear();
            renderFile(false); renderList();
            if (!ok) toastMsg('Photo is shown but could not be saved on this device.');
          };
          img.src = rd.result;
        };
        rd.readAsDataURL(f);
      };
      inp.click();
    };
    const bindEdits = scope => {
      $$('[data-edit]', scope).forEach(el => {
        el.addEventListener('keydown', e => { if (e.key === 'Enter' && el.dataset.edit !== 'notes') { e.preventDefault(); el.blur(); } });
        el.addEventListener('blur', () => {
          const k = el.dataset.edit; let v = el.innerText.replace(/\s+\n/g, '\n').trim();
          if (k !== 'notes') v = v.replace(/\s+/g, ' ');
          if (!v || v === String(cur[k])) return;
          saveSubjectEdit(cur.id, k, k === 'name' ? v.toUpperCase() : v);
          renderList();
        });
      });
    };
    // wiring
    $('.cif-go', root).onclick = runQuery;
    q.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); q.blur(); runQuery(); } });
    q.addEventListener('input', renderList);
    $$('.cif-seg button', root).forEach(b => b.onclick = () => { filter = b.dataset.f; $$('.cif-seg button', root).forEach(x => x.classList.toggle('on', x === b)); renderList(); });
    $('.cif-listbtn', root).onclick = () => root.classList.toggle('list-open');
    const offE = Bus.on('editmode', () => { renderFile(false); });
    const offS = Bus.on('subject', id => { renderList(); if (cur && cur.id === id && !file.contains(document.activeElement)) renderFile(false); });
    const offT = Bus.on('theme', () => { renderList(); });
    renderList();
    select(opts.subject || matches()[0].id);
    return {
      onOpts(o) { if (o.subject) { q.value = ''; renderList(); select(o.subject); } },
      destroy() { cleanup(); tabOffs.forEach(f => f()); offE(); offS(); offT(); }
    };
  }
};
function toastMsg(txt) {
  const t = h(`<div class="toast" role="status"><span>${esc(txt)}</span><button aria-label="Dismiss">${icon('close')}</button></div>`);
  t.querySelector('button').onclick = () => t.remove();
  $('#app').appendChild(t); setTimeout(() => t.remove(), 6000);
}
