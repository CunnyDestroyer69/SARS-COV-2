/* ============================================================
   Shared renderers: land masks, dotted globe, flat maps,
   portraits, fingerprints, schematic street maps, noise.
   ============================================================ */
const D2R = Math.PI / 180;

const Geo = (() => {
  const dec = b64 => { const s = atob(b64); const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; };
  const W = 480, H = 240;
  const world = dec(GEO.world), worldUS = dec(GEO.worldUS), us = dec(GEO.us), usOnly = dec(GEO.usOnly);
  const bit = (a, idx) => (a[idx >> 3] >> (idx & 7)) & 1;
  const cell = (lat, lon) => { let i = Math.floor((lon + 180) / 360 * W); const j = clamp(Math.floor((90 - lat) / 180 * H), 0, H - 1); i = ((i % W) + W) % W; return j * W + i; };
  const land = (lat, lon) => bit(world, cell(lat, lon));
  const isUS = (lat, lon) => bit(worldUS, cell(lat, lon));
  const usCell = (lat, lon) => {
    const i = Math.floor((lon - GEO.usLon0) / GEO.usStep), j = Math.floor((GEO.usLat0 - lat) / GEO.usStep);
    if (i < 0 || j < 0 || i >= GEO.usW || j >= GEO.usH) return -1;
    return j * GEO.usW + i;
  };
  const usLand = (lat, lon) => { const c = usCell(lat, lon); return c < 0 ? land(lat, lon) : bit(us, c); };
  const usHome = (lat, lon) => { const c = usCell(lat, lon); return c < 0 ? 0 : bit(usOnly, c); };
  let globeCache = null;
  function globePts() {
    if (globeCache) return globeCache;
    const step = 1.25, tmp = [];
    for (let lat = -86; lat <= 86; lat += step) {
      const n = Math.max(1, Math.round(360 * Math.cos(lat * D2R) / step));
      for (let k = 0; k < n; k++) {
        const lon = -180 + (k + .5) * 360 / n;
        if (land(lat, lon)) tmp.push(Math.sin(lat * D2R), Math.cos(lat * D2R), Math.sin(lon * D2R), Math.cos(lon * D2R), isUS(lat, lon));
      }
    }
    globeCache = new Float32Array(tmp);
    return globeCache;
  }
  return { land, isUS, usLand, usHome, globePts };
})();

/* ---------- dotted orthographic globe ---------- */
class Globe {
  constructor(o = {}) {
    this.lat0 = o.lat0 ?? 28; this.lon0 = o.lon0 ?? -70; this.spin = o.spin ?? 4; this.zoom = 1;
    this.pts = Geo.globePts();
    this.buckets = [[], [], [], []];
  }
  prep() { this.s0 = Math.sin(this.lat0 * D2R); this.c0 = Math.cos(this.lat0 * D2R); this.sl0 = Math.sin(this.lon0 * D2R); this.cl0 = Math.cos(this.lon0 * D2R); }
  /* unit-sphere coords: x right, y up, z toward viewer */
  proj(lat, lon, r = 1) {
    const sp = Math.sin(lat * D2R), cp = Math.cos(lat * D2R);
    const dl = (lon - this.lon0) * D2R, cdl = Math.cos(dl);
    return [cp * Math.sin(dl) * r, (this.c0 * sp - this.s0 * cp * cdl) * r, (this.s0 * sp + this.c0 * cp * cdl) * r];
  }
  /* is a projected point hidden behind the earth disc */
  hidden(p) { return p[2] < 0 && (p[0] * p[0] + p[1] * p[1]) < 1; }
  draw(ctx, cx, cy, R, o = {}) {
    this.prep();
    const A = THEME.acc, A2 = THEME.acc2;
    const g = ctx.createRadialGradient(cx - R * .35, cy - R * .4, R * .05, cx, cy, R);
    g.addColorStop(0, rgba(A, .2)); g.addColorStop(.7, rgba(A, .06)); g.addColorStop(1, rgba(A, .02));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rgba(A, .65); ctx.lineWidth = 1.2; ctx.stroke();
    ctx.strokeStyle = rgba(A, .14); ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, R + 4, 0, Math.PI * 2); ctx.stroke();
    // graticule
    if (o.grid !== false) {
      ctx.strokeStyle = rgba(A, .13); ctx.lineWidth = 1;
      ctx.beginPath();
      for (let lat = -60; lat <= 60; lat += 30) this._line(ctx, cx, cy, R, k => [lat, -180 + k * 4], 91);
      for (let lon = -180; lon < 180; lon += 30) this._line(ctx, cx, cy, R, k => [-90 + k * 3, lon], 61);
      ctx.stroke();
    }
    // land dots
    const P = this.pts, b = this.buckets; b[0].length = b[1].length = b[2].length = b[3].length = 0;
    const s0 = this.s0, c0 = this.c0, sl0 = this.sl0, cl0 = this.cl0;
    const usP = [];
    for (let i = 0; i < P.length; i += 5) {
      const sp = P[i], cp = P[i + 1], sl = P[i + 2], cl = P[i + 3];
      const cdl = cl * cl0 + sl * sl0;
      const z = s0 * sp + c0 * cp * cdl;
      if (z <= 0.02) continue;
      const sdl = sl * cl0 - cl * sl0;
      const x = cx + cp * sdl * R, y = cy - (c0 * sp - s0 * cp * cdl) * R;
      if (P[i + 4]) usP.push(x, y);
      else b[z > .75 ? 3 : z > .5 ? 2 : z > .25 ? 1 : 0].push(x, y);
    }
    const ds = Math.max(1.3, R * .0105), hs = ds / 2;
    const alphas = [.28, .5, .72, .92];
    for (let k = 0; k < 4; k++) {
      const arr = b[k]; if (!arr.length) continue;
      ctx.fillStyle = rgba(A, alphas[k]); ctx.beginPath();
      for (let j = 0; j < arr.length; j += 2) ctx.rect(arr[j] - hs, arr[j + 1] - hs, ds, ds);
      ctx.fill();
    }
    if (usP.length) {
      ctx.fillStyle = rgba(o.homeColor || A2, .95); ctx.beginPath();
      for (let j = 0; j < usP.length; j += 2) ctx.rect(usP[j] - hs, usP[j + 1] - hs, ds, ds);
      ctx.fill();
    }
    // terminator-style rim shading
    const sh = ctx.createRadialGradient(cx, cy, R * .55, cx, cy, R);
    sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.35)');
    ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  }
  _line(ctx, cx, cy, R, f, n) {
    let pen = false;
    for (let k = 0; k < n; k++) {
      const [la, lo] = f(k); const p = this.proj(la, lo);
      if (p[2] > 0) { const x = cx + p[0] * R, y = cy - p[1] * R; if (pen) ctx.lineTo(x, y); else ctx.moveTo(x, y); pen = true; } else pen = false;
    }
  }
  /* screen point for lat/lon (+altitude factor), with visibility */
  screen(cx, cy, R, lat, lon, r = 1) { const p = this.proj(lat, lon, r); return { x: cx + p[0] * R, y: cy - p[1] * R, z: p[2], hid: this.hidden(p) }; }
}

/* Satellite position (lat, lon) at time t (seconds). Display radius factor r. */
function satState(s, t) {
  if (s.geoLon != null) return { lat: 0, lon: s.geoLon, r: satRadius(s.alt) };
  const period = 36 * Math.pow((6371 + s.alt) / 6871, 1.5); // display seconds per orbit
  const u = s.ph + t * 2 * Math.PI / period;
  const inc = s.inc * D2R;
  const lat = Math.asin(Math.sin(inc) * Math.sin(u)) / D2R;
  const lon = s.raan + Math.atan2(Math.cos(inc) * Math.sin(u), Math.cos(u)) / D2R - t * 1.2;
  return { lat, lon: ((lon + 540) % 360) - 180, r: satRadius(s.alt), u, period };
}
function satRadius(alt) { return 1.07 + .42 * (1 - Math.exp(-alt / 8000)); }
function satOrbit(s, t, n = 96) {
  const pts = [];
  if (s.geoLon != null) { for (let k = 0; k <= n; k++) pts.push([0, -180 + k * 360 / n]); return pts; }
  const st = satState(s, t);
  for (let k = 0; k <= n; k++) {
    const dt = (k / n) * st.period;
    const q = satState(s, t + dt);
    pts.push([q.lat, q.lon]);
  }
  return pts;
}

/* ---------- flat maps (pre-rendered dot fields) ---------- */
function flatWorld(w, hh, o = {}) {
  const latT = o.latT ?? 80, latB = o.latB ?? -58;
  const sx = w / 360, sy = hh / (latT - latB);
  const s = Math.min(sx, sy);
  const mw = 360 * s, mh = (latT - latB) * s, ox = (w - mw) / 2, oy = (hh - mh) / 2;
  const proj = (lat, lon) => [ox + (lon + 180) * s, oy + (latT - lat) * s];
  const unproj = (x, y) => [latT - (y - oy) / s, (x - ox) / s - 180];
  const c = offscreen(w * (o.dpr || 1), hh * (o.dpr || 1)), ctx = c.getContext('2d');
  ctx.scale(o.dpr || 1, o.dpr || 1);
  const step = o.step || Math.max(4, Math.round(mw / 150));
  const A = THEME.acc, A2 = THEME.acc2;
  const r = step * (o.dot || .3);
  for (let y = oy + step / 2; y < oy + mh; y += step) {
    for (let x = ox + step / 2; x < ox + mw; x += step) {
      const [lat, lon] = unproj(x, y);
      if (!Geo.land(lat, lon)) continue;
      const home = Geo.isUS(lat, lon);
      ctx.fillStyle = home ? rgba(A2, o.homeA ?? .75) : rgba(A, o.landA ?? .42);
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }
  if (o.grid !== false) {
    ctx.strokeStyle = rgba(A, .08); ctx.lineWidth = 1; ctx.beginPath();
    for (let lon = -180; lon <= 180; lon += 30) { const [x] = proj(0, lon); ctx.moveTo(x, oy); ctx.lineTo(x, oy + mh); }
    for (let lat = -30; lat <= 60; lat += 30) { const [, y] = proj(lat, 0); ctx.moveTo(ox, y); ctx.lineTo(ox + mw, y); }
    ctx.stroke();
  }
  return { canvas: c, proj, unproj, box: [ox, oy, mw, mh] };
}

function flatUS(w, hh, o = {}) {
  const lon0 = -126, lon1 = -66, lat0 = 50, lat1 = 24, k = Math.cos(38 * D2R);
  const s = Math.min(w / ((lon1 - lon0) * k), hh / (lat0 - lat1));
  const mw = (lon1 - lon0) * k * s, mh = (lat0 - lat1) * s, ox = (w - mw) / 2, oy = (hh - mh) / 2;
  const proj = (lat, lon) => [ox + (lon - lon0) * k * s, oy + (lat0 - lat) * s];
  const unproj = (x, y) => [lat0 - (y - oy) / s, lon0 + (x - ox) / (k * s)];
  const c = offscreen(w * (o.dpr || 1), hh * (o.dpr || 1)), ctx = c.getContext('2d');
  ctx.scale(o.dpr || 1, o.dpr || 1);
  const step = o.step || Math.max(5, Math.round(mw / 110));
  const A = THEME.acc, A2 = THEME.acc2, r = step * .32;
  for (let y = oy + step / 2; y < oy + mh; y += step) {
    for (let x = ox + step / 2; x < ox + mw; x += step) {
      const [lat, lon] = unproj(x, y);
      if (!Geo.usLand(lat, lon)) continue;
      const home = Geo.usHome(lat, lon);
      ctx.fillStyle = home ? rgba(A2, .8) : rgba(A, .16);
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }
  return { canvas: c, proj, unproj, box: [ox, oy, mw, mh] };
}

/* ---------- value noise ---------- */
function makeNoise(seed) {
  const r = rng(seed), N = 64, g = new Float32Array(N * N);
  for (let i = 0; i < g.length; i++) g[i] = r();
  const sm = t => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const x0 = xi & 63, x1 = (xi + 1) & 63, y0 = (yi & 63) * N, y1 = ((yi + 1) & 63) * N;
    const u = sm(xf), v = sm(yf);
    return lerp(lerp(g[y0 + x0], g[y0 + x1], u), lerp(g[y1 + x0], g[y1 + x1], u), v) * 2 - 1;
  };
}
let noiseTiles = null;
function getNoiseTiles() {
  if (noiseTiles) return noiseTiles;
  noiseTiles = [];
  for (let k = 0; k < 4; k++) {
    const c = offscreen(192, 192), ctx = c.getContext('2d'), id = ctx.createImageData(192, 192), r = rng(900 + k);
    for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ctx.putImageData(id, 0, 0); noiseTiles.push(c);
  }
  return noiseTiles;
}

/* ---------- fingerprints ---------- */
const fpCache = new Map();
function fingerprint(seed, w, hh, col) {
  const key = seed + ':' + w + 'x' + hh + ':' + col.join(',');
  if (fpCache.has(key)) return fpCache.get(key);
  const r = rng(seed), nz = makeNoise(seed * 7 + 1), nz2 = makeNoise(seed * 13 + 5);
  const type = pick(r, ['whorl', 'loopL', 'loopR', 'whorl', 'loopL', 'arch']);
  const c = offscreen(w, hh), ctx = c.getContext('2d'), id = ctx.createImageData(w, hh), d = id.data;
  const cx = .5 + (r() - .5) * .08, cy = .44 + (r() - .5) * .1;
  const period = .043 + r() * .008;
  const rot = type === 'loopL' ? -.55 : type === 'loopR' ? .55 : (r() - .5) * .3;
  const cr = Math.cos(rot), sr = Math.sin(rot);
  const ex = .5, ey = .52, ax = .41, ay = .47;
  const twist = type === 'whorl' ? (r() < .5 ? 1 : -1) * period * (.6 + r()) : 0;
  const ar = hh / w;
  for (let y = 0; y < hh; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w, v = y / hh;
      const mx = (u - ex) / ax, my = (v - ey) / ay, m = mx * mx + my * my;
      if (m > 1) continue;
      let px = (u - cx), py = (v - cy) * ar;
      px += nz(u * 9, v * 9) * .012; py += nz(u * 9 + 40, v * 9) * .012;
      const qx = px * cr - py * sr, qy = px * sr + py * cr;
      let core;
      if (type === 'whorl') core = Math.sqrt(qx * qx * 1.1 + qy * qy * .85) + twist * Math.atan2(qy, qx) / (2 * Math.PI);
      else if (type === 'arch') core = qy + .5;
      else core = qy < 0 ? Math.sqrt(qx * qx + qy * qy * .9) : Math.abs(qx) + qy * .08;
      const arch = -qy * 1.0 + .22 * Math.exp(-(qx * qx) / .05);
      const dist = Math.sqrt(qx * qx + qy * qy);
      const wgt = type === 'arch' ? 0 : clamp((.36 - dist) / .1, 0, 1);
      const phase = core * wgt + (arch + .3) * (1 - wgt);
      const val = Math.cos(phase / period * 2 * Math.PI);
      const press = .55 + .45 * nz2(u * 4, v * 4);
      const edge = clamp((1 - m) * 6, 0, 1);
      let a = clamp((val - .1) * 1.6, 0, 1) * edge * clamp(press + .35, 0, 1);
      if (nz(u * 40, v * 40) > .72) a *= .15;
      if (a < .02) continue;
      const i = (y * w + x) * 4;
      d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = Math.round(a * 255);
    }
  }
  ctx.putImageData(id, 0, 0);
  const out = { canvas: c, type: type === 'arch' ? 'PLAIN ARCH' : type === 'whorl' ? 'WHORL' : type === 'loopL' ? 'ULNAR LOOP' : 'RADIAL LOOP', minutiae: 38 + Math.floor(r() * 40) };
  if (fpCache.size > 80) fpCache.clear();
  fpCache.set(key, out);
  return out;
}

/* ---------- portraits ---------- */
const faceCache = new Map();
function faceGeom(face) {
  const r = rng(face.seed);
  const f = face.sex === 'F';
  const g = {
    hw: (f ? .205 : .22) + r() * .03, hh: .27 + r() * .025, cy: .43, jaw: f ? .62 + r() * .1 : .7 + r() * .12,
    eyeY: .015 + r() * .02, eyeW: .052 + r() * .01, eyeGap: .085 + r() * .015, browA: (r() - .5) * .05,
    noseL: .085 + r() * .025, mouthW: .055 + r() * .025, mouthY: .155 + r() * .02, neck: .08 + r() * .02, sh: f ? .36 : .42 + r() * .05,
    glasses: r() < .28, beard: !f && r() < .3 && face.age > 25, hairStyle: '', hairA: .5
  };
  const hairBright = { WHITE: .95, GRAY: .8, BLONDE: .85, RED: .6, AUBURN: .55, BROWN: .45, BLACK: .3 }[face.hair] || .45;
  g.hairA = hairBright;
  g.hairStyle = f ? pick(r, ['long', 'bob', 'bun', 'long', 'pony']) : (face.age > 55 && r() < .5 ? 'receding' : pick(r, ['short', 'side', 'buzz', 'short', 'wavy']));
  return g;
}
function drawFace(ctx, W, H, face, o = {}) {
  const A = o.col || THEME.acc, A2 = o.col2 || THEME.acc2;
  const g = faceGeom(face);
  const s = Math.min(W, H / 1.2);
  const ox = (W - s) / 2, oy = (H - s * 1.2) / 2;
  const X = v => ox + v * s, Y = v => oy + v * s;
  const cx = .5, cy = g.cy;
  // backdrop
  ctx.fillStyle = 'rgb(4,12,19)'; ctx.fillRect(0, 0, W, H);
  const bg = ctx.createRadialGradient(X(.5), Y(.4), 2, X(.5), Y(.45), s * .7);
  bg.addColorStop(0, rgba(A, .16)); bg.addColorStop(1, rgba(A, 0));
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = rgba(A, .07); ctx.lineWidth = 1; ctx.beginPath();
  for (let x = 0; x < W; x += Math.max(6, s / 14)) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0; y < H; y += Math.max(6, s / 14)) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
  const fillGrad = (y0, y1, a0, a1) => { const gr = ctx.createLinearGradient(0, Y(y0), 0, Y(y1)); gr.addColorStop(0, rgba(A, a0)); gr.addColorStop(1, rgba(A, a1)); return gr; };
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // hair behind (long styles)
  if (g.hairStyle === 'long' || g.hairStyle === 'pony') {
    ctx.beginPath();
    ctx.moveTo(X(cx - g.hw * 1.12), Y(cy - .02));
    ctx.bezierCurveTo(X(cx - g.hw * 1.3), Y(cy + .25), X(cx - g.hw * 1.25), Y(cy + .42), X(cx - g.hw * 1.05), Y(cy + (g.hairStyle === 'long' ? .5 : .28)));
    ctx.lineTo(X(cx + g.hw * 1.05), Y(cy + (g.hairStyle === 'long' ? .5 : .28)));
    ctx.bezierCurveTo(X(cx + g.hw * 1.25), Y(cy + .42), X(cx + g.hw * 1.3), Y(cy + .25), X(cx + g.hw * 1.12), Y(cy - .02));
    ctx.closePath(); ctx.fillStyle = rgba(A, .1 + g.hairA * .14); ctx.fill();
    ctx.strokeStyle = rgba(A, .4); ctx.lineWidth = 1; ctx.stroke();
  }
  // shoulders
  ctx.beginPath();
  ctx.moveTo(X(cx - g.sh - .1), Y(1.2));
  ctx.bezierCurveTo(X(cx - g.sh - .06), Y(.92), X(cx - g.sh * .55), Y(.84), X(cx - g.neck * 1.2), Y(.8));
  ctx.lineTo(X(cx + g.neck * 1.2), Y(.8));
  ctx.bezierCurveTo(X(cx + g.sh * .55), Y(.84), X(cx + g.sh + .06), Y(.92), X(cx + g.sh + .1), Y(1.2));
  ctx.closePath(); ctx.fillStyle = fillGrad(.8, 1.2, .22, .05); ctx.fill(); ctx.strokeStyle = rgba(A, .55); ctx.lineWidth = 1.2; ctx.stroke();
  // collar
  ctx.beginPath(); ctx.moveTo(X(cx - g.neck * 1.25), Y(.8)); ctx.lineTo(X(cx), Y(.93)); ctx.lineTo(X(cx + g.neck * 1.25), Y(.8)); ctx.strokeStyle = rgba(A, .45); ctx.stroke();
  // neck
  ctx.beginPath(); ctx.moveTo(X(cx - g.neck), Y(cy + g.hh * .6)); ctx.lineTo(X(cx - g.neck * 1.05), Y(.82)); ctx.lineTo(X(cx + g.neck * 1.05), Y(.82)); ctx.lineTo(X(cx + g.neck), Y(cy + g.hh * .6)); ctx.closePath();
  ctx.fillStyle = fillGrad(.6, .82, .2, .1); ctx.fill(); ctx.strokeStyle = rgba(A, .5); ctx.stroke();
  // head
  const hw = g.hw, hh = g.hh;
  const head = new Path2D();
  head.moveTo(X(cx), Y(cy - hh));
  head.bezierCurveTo(X(cx + hw * .62), Y(cy - hh), X(cx + hw), Y(cy - hh * .6), X(cx + hw), Y(cy - hh * .05));
  head.bezierCurveTo(X(cx + hw), Y(cy + hh * .35), X(cx + hw * g.jaw), Y(cy + hh * .62), X(cx + hw * .42), Y(cy + hh * .9));
  head.quadraticCurveTo(X(cx), Y(cy + hh * 1.06), X(cx - hw * .42), Y(cy + hh * .9));
  head.bezierCurveTo(X(cx - hw * g.jaw), Y(cy + hh * .62), X(cx - hw), Y(cy + hh * .35), X(cx - hw), Y(cy - hh * .05));
  head.bezierCurveTo(X(cx - hw), Y(cy - hh * .6), X(cx - hw * .62), Y(cy - hh), X(cx), Y(cy - hh));
  // ears
  ctx.beginPath();
  ctx.ellipse(X(cx - hw - .012), Y(cy + .02), s * .022, s * .045, 0, 0, Math.PI * 2);
  ctx.ellipse(X(cx + hw + .012), Y(cy + .02), s * .022, s * .045, 0, 0, Math.PI * 2);
  ctx.fillStyle = rgba(A, .14); ctx.fill(); ctx.strokeStyle = rgba(A, .5); ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = fillGrad(cy - hh, cy + hh, .3, .12); ctx.fill(head);
  ctx.strokeStyle = rgba(A2, .85); ctx.lineWidth = 1.4; ctx.stroke(head);
  // contour shading lines
  ctx.save(); ctx.clip(head);
  ctx.strokeStyle = rgba(A, .1); ctx.lineWidth = 1; ctx.beginPath();
  for (let k = -6; k <= 6; k++) { const xx = cx + k * hw / 6; ctx.moveTo(X(xx), Y(cy - hh)); ctx.quadraticCurveTo(X(xx + k * .006), Y(cy), X(xx * .96 + cx * .04), Y(cy + hh)); }
  ctx.stroke();
  // beard
  if (g.beard) {
    ctx.beginPath();
    ctx.moveTo(X(cx - hw), Y(cy + hh * .1));
    ctx.bezierCurveTo(X(cx - hw * .95), Y(cy + hh * .7), X(cx - hw * .4), Y(cy + hh * 1.05), X(cx), Y(cy + hh * 1.08));
    ctx.bezierCurveTo(X(cx + hw * .4), Y(cy + hh * 1.05), X(cx + hw * .95), Y(cy + hh * .7), X(cx + hw), Y(cy + hh * .1));
    ctx.lineTo(X(cx + hw * .62), Y(cy + hh * .5)); ctx.quadraticCurveTo(X(cx), Y(cy + hh * .38), X(cx - hw * .62), Y(cy + hh * .5)); ctx.closePath();
    ctx.fillStyle = rgba(A, .22); ctx.fill();
  }
  ctx.restore();
  // hair front
  ctx.beginPath();
  const hs = g.hairStyle;
  if (hs !== 'buzz') {
    const top = cy - hh - (hs === 'bun' ? .0 : hs === 'wavy' ? .04 : .025);
    ctx.moveTo(X(cx - hw * 1.04), Y(cy - (hs === 'receding' ? .02 : hs === 'long' || hs === 'bob' ? -.12 : .04)));
    ctx.bezierCurveTo(X(cx - hw * 1.1), Y(top - .02), X(cx - hw * .3), Y(top - .03), X(cx), Y(top));
    ctx.bezierCurveTo(X(cx + hw * .4), Y(top - .025), X(cx + hw * 1.1), Y(top), X(cx + hw * 1.04), Y(cy - (hs === 'receding' ? .02 : hs === 'long' || hs === 'bob' ? -.12 : .04)));
    if (hs === 'receding') { ctx.quadraticCurveTo(X(cx + hw * .7), Y(cy - hh * .55), X(cx + hw * .3), Y(cy - hh * .62)); ctx.quadraticCurveTo(X(cx), Y(cy - hh * .5), X(cx - hw * .3), Y(cy - hh * .62)); ctx.quadraticCurveTo(X(cx - hw * .7), Y(cy - hh * .55), X(cx - hw * 1.04), Y(cy - .02)); }
    else if (hs === 'side') { ctx.quadraticCurveTo(X(cx + hw * .8), Y(cy - hh * .58), X(cx - hw * .2), Y(cy - hh * .72)); ctx.quadraticCurveTo(X(cx - hw * .8), Y(cy - hh * .5), X(cx - hw * 1.04), Y(cy - .04)); }
    else if (hs === 'long' || hs === 'bob') { ctx.quadraticCurveTo(X(cx + hw * .9), Y(cy - hh * .5), X(cx + hw * .05), Y(cy - hh * .78)); ctx.quadraticCurveTo(X(cx - hw * .8), Y(cy - hh * .5), X(cx - hw * 1.04), Y(cy + .12)); }
    else { ctx.quadraticCurveTo(X(cx + hw * .75), Y(cy - hh * .7), X(cx), Y(cy - hh * .72)); ctx.quadraticCurveTo(X(cx - hw * .75), Y(cy - hh * .7), X(cx - hw * 1.04), Y(cy - .04)); }
    ctx.closePath();
    ctx.fillStyle = rgba(A, .14 + g.hairA * .3); ctx.fill(); ctx.strokeStyle = rgba(A2, .6); ctx.lineWidth = 1.1; ctx.stroke();
    if (hs === 'bun') { ctx.beginPath(); ctx.arc(X(cx), Y(cy - hh - .05), s * .055, 0, Math.PI * 2); ctx.fillStyle = rgba(A, .14 + g.hairA * .3); ctx.fill(); ctx.stroke(); }
    if (hs === 'bob') { ctx.beginPath(); ctx.moveTo(X(cx - hw * 1.04), Y(cy + .12)); ctx.quadraticCurveTo(X(cx - hw * 1.2), Y(cy + .2), X(cx - hw * .95), Y(cy + .24)); ctx.moveTo(X(cx + hw * 1.04), Y(cy + .12)); ctx.quadraticCurveTo(X(cx + hw * 1.2), Y(cy + .2), X(cx + hw * .95), Y(cy + .24)); ctx.stroke(); }
  } else {
    ctx.save(); ctx.clip(head); ctx.fillStyle = rgba(A, .12 + g.hairA * .15); ctx.fillRect(X(cx - hw), Y(cy - hh - .01), hw * 2 * s, hh * .55 * s); ctx.restore();
  }
  // features
  const L = landmarks(face, g);
  ctx.strokeStyle = rgba(A2, .9); ctx.lineWidth = 1.3;
  const line = pts => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))); ctx.stroke(); };
  line(L.browL); line(L.browR);
  [L.eyeL, L.eyeR].forEach(e => {
    ctx.beginPath(); ctx.moveTo(X(e[0][0]), Y(e[0][1])); ctx.quadraticCurveTo(X(e[1][0]), Y(e[1][1] - .012), X(e[2][0]), Y(e[2][1])); ctx.quadraticCurveTo(X(e[3][0]), Y(e[3][1] + .01), X(e[0][0]), Y(e[0][1])); ctx.stroke();
    ctx.beginPath(); ctx.arc(X((e[0][0] + e[2][0]) / 2), Y(e[0][1]), s * .011, 0, Math.PI * 2); ctx.fillStyle = rgba(A2, .95); ctx.fill();
  });
  line(L.nose);
  ctx.beginPath(); ctx.moveTo(X(L.mouth[0][0]), Y(L.mouth[0][1])); ctx.quadraticCurveTo(X(cx), Y(L.mouth[0][1] + .012), X(L.mouth[2][0]), Y(L.mouth[2][1])); ctx.stroke();
  ctx.strokeStyle = rgba(A2, .45); ctx.beginPath(); ctx.moveTo(X(L.mouth[0][0] + .01), Y(L.mouth[0][1] + .02)); ctx.quadraticCurveTo(X(cx), Y(L.mouth[0][1] + .035), X(L.mouth[2][0] - .01), Y(L.mouth[2][1] + .02)); ctx.stroke();
  if (g.glasses) {
    ctx.strokeStyle = rgba(A2, .8); ctx.lineWidth = 1.2;
    [L.eyeL, L.eyeR].forEach(e => { const ex = (e[0][0] + e[2][0]) / 2; ctx.strokeRect(X(ex - g.eyeW * .95), Y(e[0][1] - .03), g.eyeW * 1.9 * s, .058 * s); });
    ctx.beginPath(); ctx.moveTo(X(cx - g.eyeGap + g.eyeW * .95), Y(L.eyeL[0][1] - .01)); ctx.lineTo(X(cx + g.eyeGap - g.eyeW * .95), Y(L.eyeL[0][1] - .01)); ctx.stroke();
  }
  // scan lines + vignette
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  return { X, Y, L, s };
}
function landmarks(face, g) {
  g = g || faceGeom(face);
  const cx = .5, cy = g.cy, hw = g.hw, hh = g.hh;
  const ey = cy + g.eyeY;
  const eye = sx => { const ex = cx + sx * g.eyeGap; return [[ex - g.eyeW, ey], [ex, ey - .012], [ex + g.eyeW, ey], [ex, ey + .01]]; };
  const by = ey - .045;
  const jaw = [];
  for (let k = 0; k <= 8; k++) { const a = Math.PI * (k / 8); const jx = Math.cos(a), jy = Math.sin(a); const wf = lerp(1, g.jaw, jy); jaw.push([cx + jx * hw * wf * .98, cy + hh * .05 + jy * hh * .95]); }
  return {
    jaw, eyeL: eye(-1), eyeR: eye(1),
    browL: [[cx - g.eyeGap - g.eyeW * 1.15, by + .006], [cx - g.eyeGap, by - .01 + g.browA], [cx - g.eyeGap + g.eyeW * 1.05, by + .002]],
    browR: [[cx + g.eyeGap - g.eyeW * 1.05, by + .002], [cx + g.eyeGap, by - .01 + g.browA], [cx + g.eyeGap + g.eyeW * 1.15, by + .006]],
    nose: [[cx - .006, ey + .01], [cx - .012, ey + g.noseL * .7], [cx - .03, ey + g.noseL], [cx, ey + g.noseL + .012], [cx + .03, ey + g.noseL]],
    mouth: [[cx - g.mouthW, cy + g.mouthY], [cx, cy + g.mouthY + .008], [cx + g.mouthW, cy + g.mouthY]],
    fore: [[cx - hw * .5, cy - hh * .55], [cx, cy - hh * .62], [cx + hw * .5, cy - hh * .55]]
  };
}
/* All landmark points + mesh edges, in normalized face coords. */
function faceMesh(face) {
  const L = landmarks(face);
  const pts = [...L.jaw, ...L.browL, ...L.browR, ...L.eyeL, ...L.eyeR, ...L.nose, ...L.mouth, ...L.fore];
  const idx = {}; let i = 0;
  ['jaw', 'browL', 'browR', 'eyeL', 'eyeR', 'nose', 'mouth', 'fore'].forEach(k => { idx[k] = i; i += L[k].length; });
  const E = [];
  const chain = (k, n, closed) => { for (let j = 0; j < n - 1; j++) E.push([idx[k] + j, idx[k] + j + 1]); if (closed) E.push([idx[k] + n - 1, idx[k]]); };
  chain('jaw', 9); chain('browL', 3); chain('browR', 3); chain('eyeL', 4, true); chain('eyeR', 4, true); chain('nose', 5); chain('mouth', 3); chain('fore', 3);
  const J = idx.jaw, BL = idx.browL, BR = idx.browR, EL = idx.eyeL, ER = idx.eyeR, N = idx.nose, M = idx.mouth, F = idx.fore;
  E.push([F, BL + 1], [F + 1, BL + 2], [F + 1, BR], [F + 2, BR + 1], [BL + 2, BR], [BL + 1, EL + 1], [BR + 1, ER + 1], [EL + 2, N], [ER, N], [N + 2, M], [N + 4, M + 2], [M, J + 6], [M + 2, J + 2], [M + 1, J + 4], [EL, J + 8], [ER + 2, J], [N + 2, J + 7], [N + 4, J + 1], [F, J + 8], [F + 2, J], [BL, J + 8], [BR + 2, J]);
  return { pts, edges: E };
}
/* Cached portrait canvas for a subject (or uploaded photo). */
function portrait(subj, W, H) {
  const key = subj.id + ':' + W + 'x' + H + ':' + THEME.acc.join(',') + ':' + (subj.photo ? subj.photo.length : 0);
  if (faceCache.has(key)) return faceCache.get(key);
  const c = offscreen(W, H), ctx = c.getContext('2d');
  if (subj.photo && subj._img && subj._img.complete && subj._img.naturalWidth) {
    tintPhoto(ctx, subj._img, W, H);
  } else {
    drawFace(ctx, W, H, subj.face);
    if (subj.photo && !subj._img) {
      const img = new Image();
      img.onload = () => { faceCache.clear(); Bus.emit('subject', subj.id); };
      img.src = subj.photo; subj._img = img;
    }
  }
  if (faceCache.size > 120) faceCache.clear();
  faceCache.set(key, c);
  return c;
}
function tintPhoto(ctx, img, W, H) {
  const sc = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const dw = img.naturalWidth * sc, dh = img.naturalHeight * sc;
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  const id = ctx.getImageData(0, 0, W, H), d = id.data, A = THEME.acc, A2 = THEME.acc2;
  for (let i = 0; i < d.length; i += 4) {
    const l = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) / 255;
    const t = clamp(l * 1.15, 0, 1);
    const k = t < .6 ? t / .6 : 1, k2 = t < .6 ? 0 : (t - .6) / .4;
    d[i] = 4 + (A[0] - 4) * k * (1 - k2) + A2[0] * k2;
    d[i + 1] = 12 + (A[1] - 12) * k * (1 - k2) + A2[1] * k2;
    d[i + 2] = 19 + (A[2] - 19) * k * (1 - k2) + A2[2] * k2;
  }
  ctx.putImageData(id, 0, 0);
  ctx.fillStyle = 'rgba(0,0,0,.2)';
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
}

/* ---------- schematic street map ---------- */
const schemCache = new Map();
function schematic(seed, W, H) {
  const key = seed + ':' + W + 'x' + H + ':' + THEME.acc.join(',');
  if (schemCache.has(key)) return schemCache.get(key);
  const r = rng(seed), A = THEME.acc, c = offscreen(W, H), ctx = c.getContext('2d');
  ctx.fillStyle = 'rgb(4,11,17)'; ctx.fillRect(0, 0, W, H);
  const ang = (r() - .5) * .5;
  // river
  ctx.save();
  ctx.strokeStyle = rgba(A, .12); ctx.lineWidth = Math.max(14, W * .05); ctx.lineCap = 'round';
  ctx.beginPath(); const ry = H * (.25 + r() * .5);
  ctx.moveTo(-20, ry); ctx.bezierCurveTo(W * .3, ry - H * .3 * (r() - .3), W * .6, ry + H * .35 * (r() - .3), W + 20, ry + (r() - .5) * H * .4); ctx.stroke();
  ctx.restore();
  // parks
  for (let k = 0; k < 3; k++) {
    const px = r() * W * .8, py = r() * H * .8, pw = W * (.08 + r() * .1), ph = H * (.08 + r() * .1);
    ctx.fillStyle = rgba(A, .05); ctx.fillRect(px, py, pw, ph);
    ctx.save(); ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
    ctx.strokeStyle = rgba(A, .1); ctx.lineWidth = 1; ctx.beginPath();
    for (let x = -ph; x < pw; x += 6) { ctx.moveTo(px + x, py + ph); ctx.lineTo(px + x + ph, py); }
    ctx.stroke(); ctx.restore();
  }
  // street grid
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(ang); ctx.translate(-W / 2, -H / 2);
  const gs = Math.max(18, W / 18);
  ctx.strokeStyle = rgba(A, .16); ctx.lineWidth = 1; ctx.beginPath();
  for (let x = -W; x < W * 2; x += gs * (.7 + r() * .6)) { ctx.moveTo(x, -H); ctx.lineTo(x, H * 2); }
  for (let y = -H; y < H * 2; y += gs * (.7 + r() * .6)) { ctx.moveTo(-W, y); ctx.lineTo(W * 2, y); }
  ctx.stroke();
  ctx.restore();
  // arterials
  ctx.strokeStyle = rgba(A, .4); ctx.lineWidth = 2.2; ctx.beginPath();
  for (let k = 0; k < 4; k++) {
    if (k % 2) { const y0 = r() * H; ctx.moveTo(0, y0); ctx.bezierCurveTo(W * .3, y0 + (r() - .5) * H * .3, W * .7, y0 + (r() - .5) * H * .3, W, r() * H); }
    else { const x0 = r() * W; ctx.moveTo(x0, 0); ctx.bezierCurveTo(x0 + (r() - .5) * W * .3, H * .3, x0 + (r() - .5) * W * .3, H * .7, r() * W, H); }
  }
  ctx.stroke();
  // labels
  ctx.fillStyle = rgba(A, .35); ctx.font = `${Math.max(8, Math.round(W / 70))}px "Share Tech Mono", monospace`;
  for (let k = 0; k < 6; k++) ctx.fillText(pick(r, STREETS).toUpperCase(), r() * W * .85, 12 + r() * (H - 20));
  if (schemCache.size > 30) schemCache.clear();
  schemCache.set(key, c);
  return c;
}

/* Small helpers for canvas HUD text. */
function hudText(ctx, txt, x, y, o = {}) {
  ctx.font = `${o.weight || 400} ${o.size || 11}px ${o.font || '"Share Tech Mono", monospace'}`;
  ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'alphabetic';
  if (o.bg) { const m = ctx.measureText(txt); const pw = m.width + 8, ph = (o.size || 11) + 6; let bx = x - 4; if (o.align === 'center') bx = x - pw / 2; if (o.align === 'right') bx = x - pw + 4; ctx.fillStyle = o.bg; ctx.fillRect(bx, y - (o.size || 11) - 1, pw, ph); }
  ctx.fillStyle = o.color || rgba(THEME.acc2, .9);
  ctx.fillText(txt, x, y);
}
function brackets(ctx, x, y, w, hh, len, col, lw = 1.5) {
  ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
  ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y);
  ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len);
  ctx.moveTo(x + w, y + hh - len); ctx.lineTo(x + w, y + hh); ctx.lineTo(x + w - len, y + hh);
  ctx.moveTo(x + len, y + hh); ctx.lineTo(x, y + hh); ctx.lineTo(x, y + hh - len);
  ctx.stroke();
}
/* Clear theme-dependent caches when the accent changes. */
Bus.on('theme', () => { faceCache.clear(); fpCache.clear(); schemCache.clear(); });
