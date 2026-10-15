/* ============================================================
   Desktop shell: top bar, icons, widgets, taskbar, launcher,
   animated background.
   ============================================================ */
const ZONES = [
  ['WASHINGTON', 'America/New_York', 'main'], ['ZULU', 'UTC', ''], ['LONDON', 'Europe/London', 'hide-m'],
  ['MOSCOW', 'Europe/Moscow', 'hide-c'], ['BEIJING', 'Asia/Shanghai', 'hide-c hide-m'], ['DUBAI', 'Asia/Dubai', 'hide-c hide-m']
];
const tzFmt = {};
function tzTime(tz) {
  try {
    tzFmt[tz] = tzFmt[tz] || new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    return tzFmt[tz].format(new Date());
  } catch (e) { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }
}
function dcDate() {
  try { return new Intl.DateTimeFormat('en-GB', { timeZone: 'America/New_York', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()).toUpperCase(); }
  catch (e) { return new Date().toDateString().toUpperCase(); }
}

const Desktop = {
  built: false,
  build() {
    const os = $('#os');
    os.innerHTML = `
      <header id="topbar">
        <div class="classbar"><span class="cb-side">${esc(S.agencyShort)} // ${esc(S.terminal)}</span><span id="classText">${esc(S.classification)}</span><span class="cb-side">HANDLE VIA ${esc(S.osName)} CHANNELS ONLY</span></div>
        <div class="sysbar">
          <div class="sb-brand" id="sbBrand">${emblem(false)}<div><b id="sbName">${esc(S.osName)}</b><br><small>v${esc(S.osVersion)} · ${esc(S.agencyShort)} SECURE ENVIRONMENT</small></div></div>
          <div class="sb-clocks" id="sbClocks">${ZONES.map(z => `<div class="sb-clock ${z[2]}"><span>${z[0]}</span><b data-tz="${z[1]}">--:--:--</b></div>`).join('')}</div>
          <div class="sb-right">
            <div class="sb-ind hide-c"><span>UPLINK</span><b class="ok">SECURE · 7/8 SAT</b></div>
            <div class="sb-ind hide-c"><span>ENCRYPTION</span><b>AES-256 · QKD</b></div>
            <div class="sb-ind"><span>ALERT</span><div class="alvl" id="alvl"><i class="on"></i><i class="on"></i><i class="on"></i><i></i><i></i></div></div>
            <div class="sb-op"><span class="up">OPERATOR</span><b id="sbOp">${esc(S.operator)}</b></div>
          </div>
        </div>
      </header>
      <main id="desktop">
        <canvas id="deskBg"></canvas>
        <div class="desk-mark">${emblem(true)}<b id="deskMarkName">${esc(S.osName)}</b><span id="deskMarkAgency">${esc(S.agency)}</span></div>
        <nav id="deskIcons" aria-label="Applications"></nav>
        <aside id="widgets"></aside>
        <div id="winLayer"></div>
      </main>
      <footer id="taskbar">
        <button class="tb-start" id="tbStart" aria-label="Open menu">${emblem(false)}<span>${esc(S.osName)}</span></button>
        <div class="tb-wins" id="tbWins"></div>
        <div class="tb-tray"><canvas class="tb-spark" id="tbSpark"></canvas><div class="tb-time" id="tbTime">--:--:--<small>---</small></div></div>
      </footer>`;
    this.icons();
    this.widgets();
    this.background();
    this.clock();
    this.launcherBind();
    const clocks = $('#sbClocks');
    onHold(clocks, 900, () => Director.open());
    let taps = 0, tt = 0;
    $('#sbBrand').addEventListener('pointerdown', () => { const n = performance.now(); taps = n - tt < 500 ? taps + 1 : 1; tt = n; if (taps >= 5) { taps = 0; Director.open(); } });
    this.built = true;
    UI.updateCompact();
  },
  refreshText() {
    if (!this.built) return;
    $('#classText').textContent = S.classification;
    $('#sbName').textContent = S.osName;
    $('#sbOp').textContent = S.operator;
    $('#deskMarkName').textContent = S.osName;
    $('#deskMarkAgency').textContent = S.agency;
    $('.tb-start span').textContent = S.osName;
    $('.desk-mark svg').outerHTML = emblem(true);
    $$('.classbar .cb-side')[0].textContent = `${S.agencyShort} // ${S.terminal}`;
    $$('.classbar .cb-side')[1].textContent = `HANDLE VIA ${S.osName} CHANNELS ONLY`;
  },
  icons() {
    const nav = $('#deskIcons');
    nav.innerHTML = '';
    APP_ORDER.forEach(id => {
      const a = APPS[id]; if (!a) return;
      const b = h(`<button class="dicon" data-app="${id}">${'<span class="ic">' + icon(a.icon) + '</span>'}<span class="lb">${esc(a.title)}</span></button>`);
      b.onclick = () => WM.open(id);
      nav.appendChild(b);
    });
    const f = nav.querySelector('[data-app="sigint"]'); if (f) f.classList.add('flag');
  },
  widgets() {
    const box = $('#widgets');
    box.innerHTML = `
      <section class="panel brk wg">
        <div class="panel-h">Threat assessment<span class="sp"></span><span class="mono" id="wgUpd">UPD 00:00</span></div>
        <div class="wg-body">
          <div class="threat-row"><b id="wgLevel">ELEVATED</b><div class="alvl" id="wgAlvl"><i class="on"></i><i class="on"></i><i class="on"></i><i></i><i></i></div></div>
          <div class="stat-grid">
            <div class="stat"><b>${OPS.filter(o => o.status === 'ACTIVE').length}</b><span>Active ops</span></div>
            <div class="stat"><b>${SUBJECTS.filter(s => STATUS[s.status] && STATUS[s.status].rank < 2).length}</b><span>Priority subjects</span></div>
            <div class="stat"><b id="wgInt">4,182,903</b><span>Intercepts / 24h</span></div>
            <div class="stat"><b>7<span class="faint">/8</span></b><span>Sat links</span></div>
          </div>
        </div>
      </section>
      <section class="panel brk wg">
        <div class="panel-h">Global asset network<span class="sp"></span><span class="mono">LIVE</span></div>
        <div class="wg-globe" id="wgGlobe"></div>
      </section>
      <section class="panel brk wg wg-feed">
        <div class="panel-h">Live intercepts<span class="sp"></span><span class="tag t-red blink" style="height:16px;font-size:9.5px">REC</span></div>
        <div class="feed" id="wgFeed"></div>
      </section>`;
    liveCounter($('#wgInt'), 4182903, 46);
    // globe
    const gbox = $('#wgGlobe');
    const C = makeCanvas(gbox);
    const globe = new Globe({ lat0: 30, lon0: -80 });
    Loop.add((t, dt) => {
      if (!C.visible()) return;
      globe.lon0 += dt * 5;
      const ctx = C.ctx, w = C.w, hh = C.h;
      ctx.clearRect(0, 0, w, hh);
      const R = Math.min(w, hh) * .36, cx = w / 2, cy = hh / 2 + 2;
      globe.draw(ctx, cx, cy, R, { grid: true });
      SATS.forEach(s => {
        const st = satState(s, t);
        const p = globe.screen(cx, cy, R, st.lat, st.lon, Math.min(st.r, 1.3));
        if (p.hid) return;
        ctx.fillStyle = rgba(THEME.warn, .95); ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      });
      OPS.forEach((o, i) => {
        const p = globe.screen(cx, cy, R, o.lat, o.lon);
        if (p.z < .05) return;
        const pulse = (t * .8 + i * .37) % 1;
        ctx.strokeStyle = rgba(o.status === 'ACTIVE' ? THEME.alert : THEME.acc2, (1 - pulse) * .9);
        ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, 2 + pulse * 9, 0, Math.PI * 2); ctx.stroke();
      });
      hudText(ctx, `LAT ${globe.lat0.toFixed(1)}  LON ${(((globe.lon0 + 540) % 360) - 180).toFixed(1)}`, 8, hh - 8, { size: 10, color: rgba(THEME.acc, .7) });
      hudText(ctx, '8 PLATFORMS · 12 OPS', w - 8, hh - 8, { size: 10, align: 'right', color: rgba(THEME.acc, .7) });
    });
    // feed
    const feed = $('#wgFeed');
    let k = 0;
    const push = () => {
      const L = FEED_LINES[k++ % FEED_LINES.length];
      const d = h(`<div class="${L[3] ? 'hot' : ''}"><b>${tzTime('America/New_York')} ${esc(L[0])}</b> ${esc(L[1])} · ${esc(L[2])}</div>`);
      feed.prepend(d);
      while (feed.children.length > 22) feed.lastChild.remove();
    };
    for (let i = 0; i < 12; i++) push();
    setInterval(() => { if (!document.hidden) push(); }, 1700);
  },
  background() {
    const box = $('#desktop');
    const cv = $('#deskBg');
    const o = { cv, ctx: cv.getContext('2d'), w: 0, h: 0, base: null, map: null };
    const rebuild = () => {
      const w = box.clientWidth, hh = box.clientHeight, dpr = Math.min(devicePixelRatio || 1, 2);
      if (!w || !hh) return;
      o.w = w; o.h = hh; cv.width = w * dpr; cv.height = hh * dpr; o.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const base = offscreen(w * dpr, hh * dpr), b = base.getContext('2d'); b.scale(dpr, dpr);
      const g = b.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, '#050c13'); g.addColorStop(1, '#03070b');
      b.fillStyle = g; b.fillRect(0, 0, w, hh);
      b.strokeStyle = rgba(THEME.acc, .035); b.lineWidth = 1; b.beginPath();
      for (let x = .5; x < w; x += 48) { b.moveTo(x, 0); b.lineTo(x, hh); }
      for (let y = .5; y < hh; y += 48) { b.moveTo(0, y); b.lineTo(w, y); }
      b.stroke();
      b.strokeStyle = rgba(THEME.acc, .06); b.beginPath();
      for (let x = .5; x < w; x += 192) { b.moveTo(x, 0); b.lineTo(x, hh); }
      for (let y = .5; y < hh; y += 192) { b.moveTo(0, y); b.lineTo(w, y); }
      b.stroke();
      const mw = Math.min(w * .98, hh * 2.4);
      o.map = flatWorld(mw, mw * .45, { dpr, landA: .2, homeA: .32, grid: false });
      o.mapX = (w - mw) / 2; o.mapY = (hh - mw * .45) / 2;
      b.drawImage(o.map.canvas, o.mapX, o.mapY, mw, mw * .45);
      const vg = b.createRadialGradient(w / 2, hh / 2, Math.min(w, hh) * .3, w / 2, hh / 2, Math.max(w, hh) * .75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
      b.fillStyle = vg; b.fillRect(0, 0, w, hh);
      o.base = base;
    };
    new ResizeObserver(rebuild).observe(box);
    Bus.on('theme', rebuild);
    rebuild();
    let acc = 0;
    Loop.add((t, dt) => {
      acc += dt; if (acc < 1 / 30) return; acc = 0;
      if (!o.base || $('#os').hidden) return;
      if (WM.wins.some(w => w.max && !w.min)) return;
      const ctx = o.ctx, w = o.w, hh = o.h;
      ctx.drawImage(o.base, 0, 0, w, hh);
      const mp = o.map;
      // ops markers + arcs
      OPS.forEach((op, i) => {
        const [x, y] = mp.proj(op.lat, op.lon); const X = o.mapX + x, Y = o.mapY + y;
        const col = op.status === 'ACTIVE' ? THEME.alert : op.status === 'CLOSED' ? THEME.ink : THEME.acc2;
        const p = (t * .5 + i * .23) % 1;
        ctx.strokeStyle = rgba(col, (1 - p) * .55); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(X, Y, 3 + p * 16, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = rgba(col, .8); ctx.fillRect(X - 2, Y - 2, 4, 4);
      });
      const hub = OPS[1];
      const [hx0, hy0] = mp.proj(hub.lat, hub.lon); const hx = o.mapX + hx0, hy = o.mapY + hy0;
      OPS.forEach((op, i) => {
        if (i === 1 || op.status === 'CLOSED') return;
        const [x0, y0] = mp.proj(op.lat, op.lon); const x = o.mapX + x0, y = o.mapY + y0;
        const mx = (x + hx) / 2, my = Math.min(y, hy) - Math.abs(x - hx) * .22;
        ctx.strokeStyle = rgba(THEME.acc, .1); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo(mx, my, x, y); ctx.stroke();
        const p = (t * .18 + i * .13) % 1, q = 1 - p;
        const px = q * q * hx + 2 * q * p * mx + p * p * x, py = q * q * hy + 2 * q * p * my + p * p * y;
        ctx.fillStyle = rgba(THEME.acc2, .8); ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
      });
      // sweep band
      const sy = ((t * 40) % (hh + 200)) - 100;
      const sg = ctx.createLinearGradient(0, sy - 60, 0, sy);
      sg.addColorStop(0, rgba(THEME.acc, 0)); sg.addColorStop(1, rgba(THEME.acc, .05));
      ctx.fillStyle = sg; ctx.fillRect(0, sy - 60, w, 60);
      ctx.fillStyle = rgba(THEME.acc, .12); ctx.fillRect(0, sy, w, 1);
    });
  },
  clock() {
    const sp = $('#tbSpark');
    const spc = makeCanvas(sp.parentNode, { cls: 'tb-spark' }); sp.remove(); spc.cv.id = 'tbSpark';
    const data = Array.from({ length: 40 }, () => .3 + Math.random() * .4);
    let acc = 0;
    Loop.add((t, dt) => {
      acc += dt; if (acc < .25) return; acc = 0;
      data.shift(); data.push(clamp(data[data.length - 1] + (Math.random() - .5) * .3, .1, .95));
      if (!spc.visible()) return;
      const c = spc.ctx, w = spc.w, hh = spc.h;
      c.clearRect(0, 0, w, hh);
      c.beginPath(); data.forEach((v, i) => { const x = i / (data.length - 1) * w, y = hh - v * hh; i ? c.lineTo(x, y) : c.moveTo(x, y); });
      c.strokeStyle = rgba(THEME.acc, .9); c.lineWidth = 1.2; c.stroke();
      c.lineTo(w, hh); c.lineTo(0, hh); c.closePath(); c.fillStyle = rgba(THEME.acc, .12); c.fill();
    });
    const tick = () => {
      $$('#sbClocks b[data-tz]').forEach(b => { b.textContent = tzTime(b.dataset.tz); });
      const tt = $('#tbTime'); if (tt) tt.innerHTML = `${tzTime('America/New_York')}<small>${dcDate()} · EST</small>`;
      const u = $('#wgUpd'); if (u) u.textContent = 'UPD ' + tzTime('UTC').slice(0, 5) + 'Z';
    };
    tick(); setInterval(tick, 1000);
  },
  launcherBind() {
    const start = $('#tbStart');
    start.onclick = e => { e.stopPropagation(); $('#launcher') ? this.closeLauncher() : this.openLauncher(); };
    document.addEventListener('pointerdown', e => { const l = $('#launcher'); if (l && !l.contains(e.target) && !start.contains(e.target)) this.closeLauncher(); });
  },
  openLauncher() {
    const l = h(`<div id="launcher">
      <div class="ln-head">${emblem(false)}<div><b>${esc(S.operator)}</b><small>${esc(S.operatorId)} · CLEARANCE LEVEL 5</small></div></div>
      <div class="ln-list scroll">${APP_ORDER.map(id => APPS[id] ? `<button class="ln-item" data-app="${id}">${icon(APPS[id].icon)}${esc(APPS[id].title)}<small>${esc(APPS[id].code || '')}</small></button>` : '').join('')}</div>
      <div class="ln-foot"><button data-act="lock">${'Lock'}</button><button data-act="reboot">Restart</button><button data-act="off">Shut down</button></div></div>`);
    $('#os').appendChild(l);
    $('#tbStart').classList.add('on');
    $$('.ln-item', l).forEach(b => b.onclick = () => { this.closeLauncher(); WM.open(b.dataset.app); });
    $$('.ln-foot button', l).forEach(b => b.onclick = () => { this.closeLauncher(); Session[b.dataset.act](); });
  },
  closeLauncher() { const l = $('#launcher'); if (l) l.remove(); const s = $('#tbStart'); if (s) s.classList.remove('on'); }
};
