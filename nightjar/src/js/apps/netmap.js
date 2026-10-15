/* ============================================================
   LINK ANALYSIS — force-directed network of all subjects
   ============================================================ */
APPS.netmap = {
  title: 'Link Analysis', short: 'Links', icon: 'netmap', code: 'NET-ANL', w: 1060, h: 660, cls: 'TS//SI',
  create(body, opts, win) {
    const root = h(`<div class="nm">
      <div class="nm-view"><div class="nm-cv"></div>
        <div class="nm-bar"><button class="btn sm" data-shake>Re-cluster</button><button class="btn sm on" data-unk>Unknowns</button><button class="btn sm" data-path>Find path</button></div>
        <div class="nm-hint mono">DRAG NODES · TAP TO INSPECT</div></div>
      <aside class="nm-side panel"><div class="panel-h">Node inspector</div><div class="nm-info scroll"></div></aside>
    </div>`);
    body.appendChild(root);
    const C = makeCanvas($('.nm-cv', root));
    const nodes = [], edges = [], byId = {};
    SUBJECTS.forEach((s, i) => { const a = i / SUBJECTS.length * Math.PI * 2; const n = { id: s.id, s, x: Math.cos(a) * 200, y: Math.sin(a) * 160, vx: 0, vy: 0, r: 7 + s.threat / 14 }; nodes.push(n); byId[s.id] = n; });
    LINKS.forEach(([a, b, l]) => edges.push({ a: byId[SUBJECTS[a].id], b: byId[SUBJECTS[b].id], l }));
    SUBJECTS.forEach(s => s.assoc.filter(x => !x.id).forEach(x => { const p = byId[s.id]; const n = { id: x.ghost, ghost: true, label: x.label, x: p.x + (Math.random() - .5) * 60, y: p.y + (Math.random() - .5) * 60, vx: 0, vy: 0, r: 4 }; nodes.push(n); byId[n.id] = n; edges.push({ a: p, b: n, l: x.label, ghost: true }); }));
    let sel = null, showUnk = true, pathMode = false, pathFrom = null, path = null, drag = null, view = { x: 0, y: 0, k: 1 };
    const nbrs = n => edges.filter(e => e.a === n || e.b === n).map(e => e.a === n ? e.b : e.a);
    const bfs = (a, b) => {
      const prev = new Map([[a, null]]), q = [a];
      while (q.length) { const n = q.shift(); if (n === b) break; nbrs(n).forEach(m => { if (!m.ghost && !prev.has(m)) { prev.set(m, n); q.push(m); } }); }
      if (!prev.has(b)) return null;
      const out = []; for (let n = b; n; n = prev.get(n)) out.unshift(n); return out;
    };
    const info = $('.nm-info', root);
    const renderInfo = () => {
      if (!sel) { info.innerHTML = `<p class="mono dim nm-p">TAP A NODE TO INSPECT IT.<br><br>${nodes.filter(n => !n.ghost).length} SUBJECTS · ${nodes.filter(n => n.ghost).length} UNIDENTIFIED · ${edges.length} LINKS</p>`; return; }
      if (sel.ghost) { info.innerHTML = `<div class="nm-p"><b class="nm-name">${esc(sel.id)}</b><span class="tag t-dim">UNIDENTIFIED</span><p class="mono">${esc(sel.label)}</p></div>`; return; }
      const s = sel.s, nb = nbrs(sel);
      const deg = nb.length, cent = Math.round(deg / Math.max(...nodes.filter(n => !n.ghost).map(n => nbrs(n).length)) * 100);
      info.innerHTML = `<div class="nm-p"><canvas width="84" height="100"></canvas><b class="nm-name">${esc(s.name)}</b><span class="tag ${STATUS[s.status] ? STATUS[s.status].cls : ''}">${esc(s.status)}</span>
        <dl class="kv"><dt>Degree</dt><dd>${deg}</dd><dt>Centrality</dt><dd>${cent}%</dd><dt>Threat</dt><dd>${s.threat}</dd></dl>
        ${path ? `<div class="nm-path"><span class="up">Shortest path · ${path.length - 1} hops</span>${path.map(n => `<b>${esc(n.s ? n.s.name : n.id)}</b>`).join('<i>↓</i>')}</div>` : ''}
        <div class="panel-h" style="margin:4px -12px 0">Links</div>
        ${edges.filter(e => e.a === sel || e.b === sel).map(e => { const o = e.a === sel ? e.b : e.a; return `<button class="nm-link" data-id="${esc(o.id)}"><b>${esc(o.s ? o.s.name : o.id)}</b><small class="mono">${esc(e.l)}</small></button>`; }).join('')}
        <button class="btn sm" data-file>Open file</button></div>`;
      info.querySelector('canvas').getContext('2d').drawImage(portrait(s, 84, 100), 0, 0);
      $$('.nm-link', info).forEach(b => b.onclick = () => { sel = byId[b.dataset.id]; path = null; renderInfo(); });
      $('[data-file]', info).onclick = () => WM.open('cif', { subject: s.id });
    };
    renderInfo();
    $('[data-shake]', root).onclick = () => nodes.forEach(n => { n.vx += (Math.random() - .5) * 60; n.vy += (Math.random() - .5) * 60; });
    $('[data-unk]', root).onclick = e => { showUnk = !showUnk; e.currentTarget.classList.toggle('on', showUnk); };
    $('[data-path]', root).onclick = e => { pathMode = !pathMode; pathFrom = pathMode ? (sel && !sel.ghost ? sel : null) : null; path = null; e.currentTarget.classList.toggle('on', pathMode); $('.nm-hint', root).textContent = pathMode ? (pathFrom ? 'TAP THE DESTINATION NODE' : 'TAP THE START NODE') : 'DRAG NODES · TAP TO INSPECT'; };
    const toWorld = (sx, sy) => [(sx - C.w / 2) / view.k + view.x, (sy - C.h / 2) / view.k + view.y];
    const hit = (sx, sy) => { const [wx, wy] = toWorld(sx, sy); let best = null, bd = 1e9; nodes.forEach(n => { if (n.ghost && !showUnk) return; const d = Math.hypot(n.x - wx, n.y - wy); if (d < n.r + 14 / view.k && d < bd) { bd = d; best = n; } }); return best; };
    const cv = C.cv; cv.style.touchAction = 'none';
    cv.addEventListener('pointerdown', e => { const r = cv.getBoundingClientRect(); const n = hit(e.clientX - r.left, e.clientY - r.top); if (n) { cv.setPointerCapture(e.pointerId); drag = { n, m: 0, x: e.clientX, y: e.clientY }; } });
    cv.addEventListener('pointermove', e => { if (!drag) return; const r = cv.getBoundingClientRect(); const [wx, wy] = toWorld(e.clientX - r.left, e.clientY - r.top); drag.m += Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y); drag.x = e.clientX; drag.y = e.clientY; drag.n.x = wx; drag.n.y = wy; drag.n.vx = drag.n.vy = 0; });
    cv.addEventListener('pointerup', () => {
      if (drag && drag.m < 8) {
        const n = drag.n;
        if (pathMode && !n.ghost) {
          if (!pathFrom) { pathFrom = n; sel = n; $('.nm-hint', root).textContent = 'TAP THE DESTINATION NODE'; }
          else { path = bfs(pathFrom, n); sel = n; pathMode = false; $('[data-path]', root).classList.remove('on'); $('.nm-hint', root).textContent = path ? `PATH FOUND · ${path.length - 1} HOPS` : 'NO PATH FOUND'; Sound[path ? 'ok' : 'err'](); }
        } else { sel = n; path = null; Sound.tap(); }
        renderInfo();
      }
      drag = null;
    });
    const off = Loop.add((t, dt) => {
      // physics
      const act = nodes.filter(n => !n.ghost || showUnk);
      const k = Math.min(dt, .033);
      for (let i = 0; i < act.length; i++) for (let j = i + 1; j < act.length; j++) {
        const a = act[i], b = act[j]; let dx = b.x - a.x, dy = b.y - a.y; let d2 = dx * dx + dy * dy + .01; const d = Math.sqrt(d2);
        const f = 120000 / Math.max(d2, 100); dx /= d; dy /= d; a.vx -= dx * f; a.vy -= dy * f; b.vx += dx * f; b.vy += dy * f;
      }
      edges.forEach(e => { if (e.ghost && !showUnk) return; const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y, d = Math.hypot(dx, dy) || 1, L = e.ghost ? 55 : 120, f = (d - L) * .9; e.a.vx += dx / d * f; e.a.vy += dy / d * f; e.b.vx -= dx / d * f; e.b.vy -= dy / d * f; });
      act.forEach(n => { n.vx -= n.x * .06; n.vy -= n.y * .06; if (drag && drag.n === n) return; n.vx *= .82; n.vy *= .82; n.x += n.vx * k; n.y += n.vy * k; });
      if (!C.visible()) return;
      // fit view
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; act.forEach(n => { x0 = Math.min(x0, n.x); x1 = Math.max(x1, n.x); y0 = Math.min(y0, n.y); y1 = Math.max(y1, n.y); });
      const kk = Math.min(C.w / (x1 - x0 + 120), C.h / (y1 - y0 + 120), 1.8);
      view.k = lerp(view.k, kk, .05); view.x = lerp(view.x, (x0 + x1) / 2, .05); view.y = lerp(view.y, (y0 + y1) / 2, .05);
      const ctx = C.ctx, w = C.w, hh = C.h;
      ctx.fillStyle = '#03080d'; ctx.fillRect(0, 0, w, hh);
      ctx.strokeStyle = rgba(THEME.acc, .05); ctx.lineWidth = 1; ctx.beginPath(); for (let x = 0; x < w; x += 32) { ctx.moveTo(x, 0); ctx.lineTo(x, hh); } for (let y = 0; y < hh; y += 32) { ctx.moveTo(0, y); ctx.lineTo(w, y); } ctx.stroke();
      const S = (n) => [(n.x - view.x) * view.k + w / 2, (n.y - view.y) * view.k + hh / 2];
      const onPath = (a, b) => path && path.some((n, i) => i < path.length - 1 && ((path[i] === a && path[i + 1] === b) || (path[i] === b && path[i + 1] === a)));
      const nb = sel ? new Set(nbrs(sel)) : null;
      edges.forEach((e, i) => {
        if (e.ghost && !showUnk) return;
        const [ax, ay] = S(e.a), [bx, by] = S(e.b);
        const hl = onPath(e.a, e.b), near = sel && (e.a === sel || e.b === sel);
        ctx.strokeStyle = hl ? rgba(THEME.warn, .95) : near ? rgba(THEME.acc2, .8) : rgba(THEME.acc, e.ghost ? .12 : sel ? .1 : .3);
        ctx.lineWidth = hl ? 2.5 : near ? 1.6 : 1; ctx.setLineDash(e.ghost ? [3, 4] : []);
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.setLineDash([]);
        if (!e.ghost && (!sel || near || hl)) { const p = (t * .35 + i * .13) % 1; ctx.fillStyle = rgba(hl ? THEME.warn : THEME.acc2, .9); ctx.fillRect(lerp(ax, bx, p) - 1.5, lerp(ay, by, p) - 1.5, 3, 3); }
        if (near && !e.ghost) hudText(ctx, e.l, (ax + bx) / 2, (ay + by) / 2 - 4, { size: 9.5, align: 'center', bg: 'rgba(0,0,0,.6)', color: rgba(THEME.acc2, .9) });
      });
      nodes.forEach(n => {
        if (n.ghost && !showUnk) return;
        const [x, y] = S(n), r = n.r * Math.max(.8, view.k);
        const dim = sel && n !== sel && !nb.has(n) && !(path && path.includes(n));
        const col = n.ghost ? THEME.ink : threatColor(n.s.threat);
        ctx.globalAlpha = dim ? .35 : 1;
        ctx.fillStyle = 'rgba(3,8,13,.95)'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
        ctx.strokeStyle = rgba(col, n.ghost ? .5 : 1); ctx.lineWidth = n === sel ? 2.5 : 1.5; ctx.strokeRect(x - r, y - r, r * 2, r * 2);
        if (!n.ghost) { ctx.fillStyle = rgba(col, .35); ctx.fillRect(x - r + 3, y - r + 3, r * 2 - 6, r * 2 - 6); }
        if (n === sel || (path && path.includes(n))) { const p = (t * 1.2) % 1; ctx.strokeStyle = rgba(col, 1 - p); ctx.beginPath(); ctx.arc(x, y, r + 4 + p * 18, 0, 6.283); ctx.stroke(); }
        if (!n.ghost) hudText(ctx, n.s.first[0] + '. ' + n.s.last.toUpperCase(), x, y + r + 13, { size: 10.5, align: 'center', color: rgba(THEME.ink, dim ? .4 : .9) });
        ctx.globalAlpha = 1;
      });
      brackets(ctx, 8, 8, w - 16, hh - 16, 16, rgba(THEME.acc, .5), 1.5);
    });
    if (opts.subject && byId[opts.subject]) { sel = byId[opts.subject]; renderInfo(); }
    return { onOpts(o) { if (o.subject && byId[o.subject]) { sel = byId[o.subject]; path = null; renderInfo(); } }, destroy() { off(); C.destroy(); } };
  }
};
