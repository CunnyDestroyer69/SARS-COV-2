'use strict';
/* ============================================================
   NIGHTJAR — fictional intelligence OS for on-screen use.
   Every agency, person, number and record in here is invented.
   ============================================================ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const pad = (n, l = 2) => String(n).padStart(l, '0');
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hash(str) { let x = 2166136261; for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); } return x >>> 0; }
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const fmtInt = n => Math.round(n).toLocaleString('en-US');
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- storage (best effort, per device) ---------- */
const Store = {
  get(k, d) { try { const v = localStorage.getItem('nj.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('nj.' + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem('nj.' + k); } catch (e) { /* ignore */ } }
};

const DEFAULTS = {
  osName: 'NIGHTJAR',
  osVersion: '9.4.2',
  agency: 'Directorate of Strategic Observation',
  agencyShort: 'DSO',
  operator: 'R. HALLORAN',
  operatorId: 'DSO-4471-K',
  terminal: 'TERMINAL 07-B',
  classification: 'TOP SECRET // SI // NIGHTJAR // NOFORN',
  accent: 'cyan',
  scanlines: false,
  grain: true,
  boot: true,
  pin: '',
  sound: false,
  matchSubject: 'CIV-1001',
  transmission: 'PRIORITY FLASH — DIRECTOR\'S OFFICE\n\nSubject has left the safe house. Your clearance for Phase III is revoked effective immediately. Do not attempt to contact the asset. Report to Sub-Level 4.\n\n— END OF MESSAGE —',
  countdown: 30
};
const S = Object.assign({}, DEFAULTS, Store.get('settings', {}));
function saveSettings() { Store.set('settings', S); }

/* ---------- tiny event bus ---------- */
const Bus = {
  m: {},
  on(e, f) { (this.m[e] = this.m[e] || new Set()).add(f); return () => this.m[e].delete(f); },
  emit(e, d) { (this.m[e] || []).forEach(f => { try { f(d); } catch (err) { console.error(err); } }); }
};

/* ---------- theme ---------- */
const ACCENTS = {
  cyan: { name: 'Cyan', acc: [54, 212, 255], acc2: [160, 235, 255] },
  ice: { name: 'Blue', acc: [90, 160, 255], acc2: [190, 215, 255] },
  green: { name: 'Green', acc: [64, 240, 150], acc2: [185, 255, 215] },
  amber: { name: 'Amber', acc: [255, 176, 58], acc2: [255, 222, 160] },
  white: { name: 'White', acc: [196, 222, 234], acc2: [240, 248, 252] }
};
const THEME = { acc: [54, 212, 255], acc2: [160, 235, 255], warn: [255, 176, 58], alert: [255, 72, 72], ok: [70, 240, 166], ink: [211, 235, 246], bg: [3, 7, 11], alertMode: false };
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
function applyTheme() {
  const a = ACCENTS[S.accent] || ACCENTS.cyan;
  THEME.acc = THEME.alertMode ? [255, 82, 82] : a.acc;
  THEME.acc2 = THEME.alertMode ? [255, 196, 190] : a.acc2;
  const st = document.documentElement.style;
  st.setProperty('--acc-rgb', THEME.acc.join(','));
  st.setProperty('--acc2-rgb', THEME.acc2.join(','));
  const app = $('#app');
  if (app) {
    app.classList.toggle('fx-scan', !!S.scanlines);
    app.classList.toggle('fx-grain', !!S.grain);
  }
  Bus.emit('theme');
}

/* ---------- animation loop ---------- */
const Loop = {
  fns: new Set(),
  add(fn) { this.fns.add(fn); return () => this.fns.delete(fn); }
};
(function () {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    const t = now / 1000;
    if (!document.hidden) for (const f of Loop.fns) { try { f(t, dt); } catch (e) { console.error(e); Loop.fns.delete(f); } }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* Canvas that tracks its CSS box and draws in CSS pixels. */
function makeCanvas(parent, opts = {}) {
  const cv = document.createElement('canvas');
  cv.className = opts.cls || 'fill';
  parent.appendChild(cv);
  const o = { cv, ctx: cv.getContext('2d'), w: 0, h: 0, dpr: 1, onresize: null };
  o.fit = () => {
    const w = Math.max(1, Math.round(cv.clientWidth)), hh = Math.max(1, Math.round(cv.clientHeight));
    const dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr || 2);
    if (w === o.w && hh === o.h && dpr === o.dpr) return;
    o.w = w; o.h = hh; o.dpr = dpr;
    cv.width = Math.round(w * dpr); cv.height = Math.round(hh * dpr);
    o.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (o.onresize) o.onresize(o);
  };
  o.visible = () => cv.offsetParent !== null && o.w > 2;
  o.ro = new ResizeObserver(() => o.fit());
  o.ro.observe(cv);
  o.fit();
  o.destroy = () => { o.ro.disconnect(); };
  return o;
}
function offscreen(w, hh) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(hh)); return c; }

/* ---------- sound (off by default; sets usually add sound in post) ---------- */
const Sound = {
  ctx: null,
  init() { if (this.ctx) return; try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; } },
  beep(freq = 1800, dur = .04, type = 'sine', vol = .05, slide = 0, delay = 0) {
    if (!S.sound) return;
    this.init(); const c = this.ctx; if (!c) return;
    if (c.state === 'suspended') c.resume();
    const t0 = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + dur + .03);
  },
  tap() { this.beep(2300, .025, 'square', .015); },
  open() { this.beep(520, .2, 'sine', .05, 2.4); },
  close() { this.beep(1000, .16, 'sine', .04, .35); },
  ok() { this.beep(880, .09, 'sine', .06); this.beep(1320, .16, 'sine', .06, 0, .1); },
  err() { this.beep(220, .22, 'sawtooth', .05); this.beep(150, .32, 'sawtooth', .05, 0, .2); },
  scan() { this.beep(300, .9, 'triangle', .03, 4); },
  alarm() { for (let i = 0; i < 4; i++) { this.beep(760, .22, 'square', .035, 0, i * .5); this.beep(560, .22, 'square', .035, 0, i * .5 + .25); } },
  type() { this.beep(2600 + Math.random() * 900, .012, 'square', .01); }
};

/* ---------- icons (24px line icons) ---------- */
const ICONS = {
  cif: '<rect x="3" y="4" width="18" height="16"/><circle cx="9" cy="10" r="2.6"/><path d="M5 17c.8-2.2 2.2-3.3 4-3.3s3.2 1.1 4 3.3M15 9h3.5M15 12h3.5M15 15h2.5"/>',
  orbital: '<circle cx="12" cy="12" r="3.2"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-28 12 12)"/><rect x="18" y="3.5" width="3" height="3"/>',
  cctv: '<path d="M2.5 7.5 15 4.5l1.8 6.2L4.3 13.7z"/><path d="M9 12.4V18H4M16.8 8.5 21 7.4v5l-3.1.8"/><circle cx="6.5" cy="9.4" r=".6"/>',
  aerial: '<circle cx="12" cy="12" r="7"/><path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5"/><rect x="10.5" y="10.5" width="3" height="3"/>',
  sigint: '<path d="M2 12h3.2l2-6 3.2 12 3-9 2 6 1.8-3H22"/>',
  bio: '<path d="M7 18.5A9 9 0 0 1 6.5 12a5.5 5.5 0 0 1 11 0M17.5 12v1.5a14 14 0 0 1-1.2 5.2M9.5 20a11 11 0 0 0 .8-4.2V12a1.7 1.7 0 0 1 3.4 0v2.5a12 12 0 0 1-1.6 6M4 9.5A8.5 8.5 0 0 1 20 9"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.2 3.2 3.2 14.8 0 18M12 3c-3.2 3.2-3.2 14.8 0 18M4.6 7h14.8M4.6 17h14.8"/>',
  terminal: '<rect x="3" y="4" width="18" height="16"/><path d="m7 9 3 3-3 3M12.5 15H17"/>',
  archive: '<path d="M5 3h10l4 4v14H5z"/><path d="M15 3v4h4M8 11h8M8 14h8M8 17h4.5"/>',
  netmap: '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="13" r="2.5"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/><path d="m6.7 7.2 3.4 4.3M17.3 7.2l-3.4 4.3M10.4 14.8 7.3 17.6M13.6 14.8l3.1 2.8"/>',
  close: '<path d="m5 5 14 14M19 5 5 19"/>',
  min: '<path d="M5 18h14"/>',
  max: '<rect x="5" y="5" width="14" height="14"/>',
  unmax: '<rect x="4" y="8" width="12" height="12"/><path d="M8 8V4h12v12h-4"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 9.5v5M12 16.8v.4"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5M12 14.5v2.5"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5.5 5.5"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  pause: '<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4"/>',
  user: '<circle cx="12" cy="8.5" r="4"/><path d="M4 21c1-4.4 4-6.6 8-6.6s7 2.2 8 6.6"/>',
  chevL: '<path d="m15 5-7 7 7 7"/>',
  chevR: '<path d="m9 5 7 7-7 7"/>',
  chevU: '<path d="m5 15 7-7 7 7"/>',
  chevD: '<path d="m5 9 7 7 7-7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  power: '<path d="M12 3v8M6.3 6.8a8 8 0 1 0 11.4 0"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v4.5h-4.5"/>',
  doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/>',
  phone: '<path d="M5 3.5h4l1.6 4.5-2.4 1.6a11 11 0 0 0 6.2 6.2l1.6-2.4 4.5 1.6v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5.5a2 2 0 0 1 2-2z"/>',
  car: '<path d="M4 16v-4l2-5h12l2 5v4z"/><path d="M4 12h16M6.5 16v2.5M17.5 16v2.5"/><circle cx="7.5" cy="13.8" r=".7"/><circle cx="16.5" cy="13.8" r=".7"/>',
  sat: '<rect x="9.5" y="9.5" width="5" height="5"/><path d="M3 4.5 8 9.5M16 14.5l5 5M2.5 9.5l7-7M14.5 21.5l7-7"/>'
};
function icon(name, cls = '') { return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter">${ICONS[name] || ''}</svg>`; }

/* Fictional emblem: ringed seal with star and chevron wings. */
let emblemSeq = 0;
function emblem(withText = true) {
  const id = 'em' + (++emblemSeq);
  const ring = `${S.agency.toUpperCase()} ★ ${S.osName.toUpperCase()} ★ `;
  const fs = Math.min(7.2, 238 / (ring.length * .6));
  const star = [];
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 3.4 : 8.2, a = -Math.PI / 2 + i * Math.PI / 5; star.push((50 + r * Math.cos(a)).toFixed(2) + ',' + (33 + r * Math.sin(a)).toFixed(2)); }
  return `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" style="color:var(--acc)">
    <circle cx="50" cy="50" r="48" stroke-width="1.6"/><circle cx="50" cy="50" r="45.5" stroke-width=".5" opacity=".7"/>
    <circle cx="50" cy="50" r="${withText ? 34 : 38}" stroke-width="1.1"/>
    ${withText ? `<path id="${id}" d="M50,50 m-40,0 a40,40 0 1,1 80,0 a40,40 0 1,1 -80,0" stroke="none"/>
    <text fill="currentColor" stroke="none" font-family="Share Tech Mono, monospace" font-size="${fs.toFixed(2)}" dominant-baseline="middle"><textPath href="#${id}" startOffset="0">${esc(ring)}</textPath></text>` : ''}
    <polygon points="${star.join(' ')}" fill="currentColor" stroke="none"/>
    <path d="M20 56 50 42l30 14-6 4.2L50 49 26 60.2z" fill="currentColor" stroke="none"/>
    <path d="M28 66 50 55.5 72 66l-5.2 3.4L50 61.6 33.2 69.4z" fill="currentColor" stroke="none" opacity=".75"/>
    <path d="M37 75.5 50 69l13 6.5-4.4 2.8L50 74l-8.6 4.3z" fill="currentColor" stroke="none" opacity=".5"/>
  </svg>`;
}

/* ---------- desktop geometry ---------- */
const UI = {
  compact: false,
  editMode: false,
  desk() { const d = $('#desktop'); return d ? { w: d.clientWidth, h: d.clientHeight } : { w: window.innerWidth, h: window.innerHeight }; },
  updateCompact() {
    const c = window.innerWidth < 760 || window.innerHeight < 500;
    if (c !== this.compact) { this.compact = c; WM.relayout(); }
    $('#app').classList.toggle('compact', c);
  }
};

/* ---------- window manager ---------- */
const APPS = {};
const APP_ORDER = ['cif', 'orbital', 'cctv', 'aerial', 'sigint', 'bio', 'ops', 'netmap', 'archive'];

const WM = {
  wins: [], z: 20, seq: 0,
  layer() { return $('#winLayer'); },
  find(appId) { return this.wins.find(w => w.appId === appId); },
  open(appId, opts) {
    const app = APPS[appId]; if (!app) return null;
    let w = this.find(appId);
    if (w) { this.restore(w); this.focus(w); if (opts && w.inst && w.inst.onOpts) w.inst.onOpts(opts); return w; }
    const desk = UI.desk();
    const n = this.wins.length;
    const ww = Math.min(app.w || 900, desk.w - 24), wh = Math.min(app.h || 600, desk.h - 20);
    const off = (n % 5) * 26;
    let x = Math.round((desk.w - ww) / 2 + off - 52), y = Math.round((desk.h - wh) / 2 + off - 40);
    x = clamp(x, 8, Math.max(8, desk.w - ww - 8)); y = clamp(y, 6, Math.max(6, desk.h - wh - 6));
    const el = h(`<section class="win opening" role="dialog" aria-label="${esc(app.title)}">
      <header class="win-bar">${icon(app.icon, 'wi')}<span class="wt">${esc(app.title)}</span><span class="wc">${esc(app.cls || 'TS//SI')}</span><span class="sp"></span>
        <div class="wctl"><button class="mn" aria-label="Minimize">${icon('min')}</button><button class="mx" aria-label="Maximize">${icon('max')}</button><button class="x" aria-label="Close">${icon('close')}</button></div>
      </header>
      <div class="win-body"></div><div class="win-rs"></div></section>`);
    Object.assign(el.style, { left: x + 'px', top: y + 'px', width: ww + 'px', height: wh + 'px' });
    w = { id: ++this.seq, appId, app, el, body: $('.win-body', el), min: false, max: !!(UI.compact || app.startMax) };
    if (w.max) el.classList.add('max');
    this.layer().appendChild(el);
    this.wins.push(w);
    this.focus(w);
    this.bind(w);
    el.addEventListener('animationend', () => el.classList.remove('opening'), { once: true });
    Sound.open();
    try { w.inst = app.create(w.body, opts || {}, w) || {}; } catch (e) { console.error(e); w.inst = {}; }
    Taskbar.render();
    $$('.dicon').forEach(d => d.classList.toggle('flag', false));
    return w;
  },
  bind(w) {
    const el = w.el, bar = $('.win-bar', el);
    $('.mn', el).onclick = e => { e.stopPropagation(); this.minimize(w); };
    $('.mx', el).onclick = e => { e.stopPropagation(); this.toggleMax(w); };
    $('.x', el).onclick = e => { e.stopPropagation(); this.close(w); };
    el.addEventListener('pointerdown', () => this.focus(w), true);
    let lastTap = 0;
    bar.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      const now = performance.now();
      if (now - lastTap < 320) { this.toggleMax(w); lastTap = 0; return; }
      lastTap = now;
      if (w.max || UI.compact) return;
      e.preventDefault();
      const sx = e.clientX, sy = e.clientY, ox = el.offsetLeft, oy = el.offsetTop;
      const desk = UI.desk();
      bar.setPointerCapture(e.pointerId);
      const mv = ev => {
        const nx = clamp(ox + ev.clientX - sx, 80 - el.offsetWidth, desk.w - 80);
        const ny = clamp(oy + ev.clientY - sy, 0, desk.h - 36);
        el.style.left = nx + 'px'; el.style.top = ny + 'px';
      };
      const up = () => { bar.removeEventListener('pointermove', mv); bar.removeEventListener('pointerup', up); bar.removeEventListener('pointercancel', up); };
      bar.addEventListener('pointermove', mv); bar.addEventListener('pointerup', up); bar.addEventListener('pointercancel', up);
    });
    const rs = $('.win-rs', el);
    rs.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation();
      const sx = e.clientX, sy = e.clientY, ow = el.offsetWidth, oh = el.offsetHeight;
      const desk = UI.desk();
      rs.setPointerCapture(e.pointerId);
      const mv = ev => {
        el.style.width = clamp(ow + ev.clientX - sx, 320, desk.w - el.offsetLeft) + 'px';
        el.style.height = clamp(oh + ev.clientY - sy, 240, desk.h - el.offsetTop) + 'px';
      };
      const up = () => { rs.removeEventListener('pointermove', mv); rs.removeEventListener('pointerup', up); rs.removeEventListener('pointercancel', up); };
      rs.addEventListener('pointermove', mv); rs.addEventListener('pointerup', up); rs.addEventListener('pointercancel', up);
    });
  },
  focus(w) {
    if (!w) return;
    this.wins.forEach(o => o.el.classList.toggle('focus', o === w));
    w.el.style.zIndex = ++this.z;
    this.top = w;
    Taskbar.render();
  },
  minimize(w) {
    w.min = true; w.el.classList.add('min');
    const next = this.wins.filter(o => !o.min && o !== w).sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0];
    if (next) this.focus(next); else { this.wins.forEach(o => o.el.classList.remove('focus')); this.top = null; Taskbar.render(); }
  },
  restore(w) { if (w.min) { w.min = false; w.el.classList.remove('min'); w.el.classList.add('opening'); w.el.addEventListener('animationend', () => w.el.classList.remove('opening'), { once: true }); } },
  toggleMax(w) {
    if (UI.compact) return;
    w.max = !w.max; w.el.classList.toggle('max', w.max);
    $('.mx', w.el).innerHTML = icon(w.max ? 'unmax' : 'max');
  },
  close(w) {
    if (w.closing) return;
    w.closing = true;
    Sound.close();
    w.el.classList.remove('opening'); w.el.classList.add('closing');
    const done = () => {
      try { w.inst && w.inst.destroy && w.inst.destroy(); } catch (e) { console.error(e); }
      w.el.remove();
      this.wins = this.wins.filter(o => o !== w);
      if (this.top === w) { const next = this.wins.filter(o => !o.min).sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0]; if (next) this.focus(next); else this.top = null; }
      Taskbar.render();
    };
    setTimeout(done, 260);
  },
  closeAll() { this.wins.slice().forEach(w => { try { w.inst && w.inst.destroy && w.inst.destroy(); } catch (e) { /* ignore */ } w.el.remove(); }); this.wins = []; this.top = null; Taskbar.render(); },
  relayout() {
    if (!$('#desktop')) return;
    const desk = UI.desk();
    this.wins.forEach(w => {
      if (UI.compact) { w.el.classList.add('max'); return; }
      w.el.classList.toggle('max', w.max);
      const el = w.el;
      if (el.offsetWidth > desk.w) el.style.width = (desk.w - 16) + 'px';
      if (el.offsetHeight > desk.h) el.style.height = (desk.h - 12) + 'px';
      el.style.left = clamp(el.offsetLeft, 80 - el.offsetWidth, desk.w - 80) + 'px';
      el.style.top = clamp(el.offsetTop, 0, Math.max(0, desk.h - 36)) + 'px';
    });
  }
};

/* ---------- taskbar ---------- */
const Taskbar = {
  render() {
    const box = $('#tbWins'); if (!box) return;
    box.innerHTML = '';
    WM.wins.forEach(w => {
      const b = h(`<button class="tb-win${WM.top === w && !w.min ? ' focus' : ''}${w.min ? ' min' : ''}">${icon(w.app.icon)}<span>${esc(w.app.short || w.app.title)}</span></button>`);
      b.onclick = () => { if (WM.top === w && !w.min) WM.minimize(w); else { WM.restore(w); WM.focus(w); } };
      box.appendChild(b);
    });
  }
};

/* Small helper for press-and-hold interactions. */
function onHold(el, ms, fn) {
  let timer = null;
  const start = e => { clearTimeout(timer); timer = setTimeout(() => { timer = null; fn(e); }, ms); };
  const stop = () => { clearTimeout(timer); timer = null; };
  el.addEventListener('pointerdown', start);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => el.addEventListener(t, stop));
}

/* Text that types itself out. Returns a cancel function. */
function typeOut(el, text, cps = 40, done) {
  let i = 0, acc = 0, cancelled = false;
  el.textContent = '';
  const off = Loop.add((t, dt) => {
    if (cancelled) { off(); return; }
    acc += dt * cps;
    const n = Math.floor(acc);
    if (n > 0) {
      acc -= n; i = Math.min(text.length, i + n);
      el.textContent = text.slice(0, i);
      if (n && Math.random() < .5) Sound.type();
      if (i >= text.length) { off(); if (done) done(); }
    }
  });
  return () => { cancelled = true; off(); };
}

/* Number that counts upward with jitter (for "intercepts today" style stats). */
function liveCounter(el, start, perSec) {
  let v = start, seen = false;
  const off = Loop.add((t, dt) => {
    if (el.isConnected) seen = true; else if (seen) { off(); return; }
    v += perSec * dt * (0.6 + Math.random() * .8);
    if (el.isConnected) el.textContent = fmtInt(v);
  });
  return off;
}
