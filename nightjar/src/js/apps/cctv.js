/* ============================================================
   SURVEILLANCE NETWORK — procedural CCTV feeds
   ============================================================ */
const CAMS = [
  { id: 'CAM-07', name: 'UNION TRANSIT CONCOURSE B', type: 'platform', subj: 'CIV-1001', seed: 7 },
  { id: 'CAM-12', name: 'PIER 9 — NORTH GATE', type: 'pier', subj: 'CIV-1009', seed: 12 },
  { id: 'CAM-03', name: 'HALSEY ST & 14TH', type: 'street', seed: 3 },
  { id: 'CAM-21', name: 'HALVORSEN AERO — LOBBY C', type: 'corridor', subj: 'CIV-1016', seed: 21 },
  { id: 'CAM-15', name: 'LOT 4 PARKING — LEVEL 2', type: 'garage', seed: 15 },
  { id: 'CAM-09', name: 'KETTERING PARK PLAZA', type: 'plaza', seed: 9 }
];
const CAM_VIEW = {
  street: { Hc: 7.5, hor: .06, fx: 1.05 }, platform: { Hc: 4.6, hor: .2, fx: 1 }, corridor: { Hc: 2.55, hor: .4, fx: .95 },
  garage: { Hc: 2.5, hor: .36, fx: .95 }, plaza: { Hc: 10, hor: -.02, fx: 1.05 }, pier: { Hc: 8, hor: .1, fx: 1 }
};
const LUTS = {};
function camLut(mode) {
  const key = mode + THEME.acc.join(',');
  if (LUTS[key]) return LUTS[key];
  const out = [];
  for (let l = 0; l < 256; l++) {
    if (mode === 'night') { const v = Math.min(255, l * 1.25); out.push(`rgb(${Math.round(v * .32)},${Math.round(v)},${Math.round(v * .42)})`); }
    else if (mode === 'thermal') out.push(`rgb(${l},${l},${l})`);
    else out.push(`rgb(${Math.round(l * .9)},${Math.round(l * .97)},${l})`);
  }
  return (LUTS[key] = out);
}

class CamScene {
  constructor(cam) {
    this.cam = cam; this.type = cam.type; this.r = rng(cam.seed * 31 + 1);
    Object.assign(this, CAM_VIEW[cam.type]);
    this.pan = 0; this.tilt = 0; this.zoom = 1; this.t = 0;
    this.agents = []; this.boxes = []; this.train = null; this.nextId = 100 + cam.seed * 37;
    this.init();
  }
  init() {
    const r = this.r, T = this.type;
    const person = (o) => this.agents.push(Object.assign({ kind: 'p', id: this.nextId++, x: 0, z: 20, vx: 0, vz: 0, ph: r() * 6, lum: 70 + r() * 110, head: 150 + r() * 70, ht: 1.6 + r() * .3, heat: .9 + r() * .1, seed: Math.floor(r() * 1e6) }, o));
    if (T === 'street') {
      for (let k = 0; k < 14; k++) person({ x: (r() < .5 ? -1 : 1) * (5 + r() * 1.8), z: 8 + r() * 60, vz: (r() < .5 ? -1 : 1) * (1.1 + r() * .6) });
      for (let k = 0; k < 2; k++) person({ x: -4 + r() * 8, z: 20, vx: (r() < .5 ? -1 : 1) * 1.3, cross: true });
      for (let k = 0; k < 5; k++) this.agents.push({ kind: 'car', x: r() < .5 ? -1.9 : 1.9, z: 10 + r() * 80, vz: 0, lum: 40 + r() * 170, heat: .8, len: 4.4, id: this.nextId++ });
      this.agents.filter(a => a.kind === 'car').forEach(c => { c.vz = c.x < 0 ? -(9 + r() * 5) : 8 + r() * 5; });
    } else if (T === 'platform') {
      for (let k = 0; k < 6; k++) this.boxes.push({ x0: -5.6, x1: -5, y0: 0, y1: 4.6, z0: 10 + k * 11, z1: 10.6 + k * 11, lum: 120 });
      for (let k = 0; k < 9; k++) person({ x: -6.5 + r() * 6, z: 9 + r() * 45, vz: r() < .4 ? 0 : (r() < .5 ? -1 : 1) * (1 + r() * .5) });
      this.train = { z: 140, state: 'away', t: 6 + r() * 10 };
    } else if (T === 'corridor') {
      for (let k = 0; k < 5; k++) person({ x: -1.6 + r() * 3.2, z: 5 + r() * 30, vz: (r() < .5 ? -1 : 1) * (1 + r() * .5) });
      this.boxes.push({ x0: -2.4, x1: -1.2, y0: 0, y1: 1.1, z0: 9, z1: 10.2, lum: 140, desk: true });
    } else if (T === 'garage') {
      for (let k = 0; k < 6; k++) { this.boxes.push({ x0: -4.9, x1: -4.3, y0: 0, y1: 2.5, z0: 8 + k * 9, z1: 8.6 + k * 9, lum: 130 }); this.boxes.push({ x0: 4.3, x1: 4.9, y0: 0, y1: 2.5, z0: 8 + k * 9, z1: 8.6 + k * 9, lum: 130 }); }
      for (let k = 0; k < 10; k++) { const side = k % 2 ? 1 : -1; if (r() < .25) continue; this.agents.push({ kind: 'car', parked: true, x: side * 7, z: 9 + Math.floor(k / 2) * 9 + 4, vz: 0, lum: 40 + r() * 170, heat: .15, len: 4.4, sideways: true, id: this.nextId++ }); }
      this.agents.push({ kind: 'car', x: 1.2, z: 60, vz: -4, lum: 200, heat: .85, len: 4.4, id: this.nextId++ });
      for (let k = 0; k < 3; k++) person({ x: -3 + r() * 6, z: 8 + r() * 30, vz: (r() < .5 ? -1 : 1) * 1.2 });
    } else if (T === 'plaza') {
      for (let k = 0; k < 16; k++) { const a = r() * 6.28; person({ x: -12 + r() * 24, z: 10 + r() * 40, vx: Math.cos(a) * 1.2, vz: Math.sin(a) * 1.2, wander: true }); }
      for (let k = 0; k < 4; k++) this.boxes.push({ x0: -10 + k * 6, x1: -8.2 + k * 6, y0: 0, y1: .45, z0: 14, z1: 14.5, lum: 110 });
    } else if (T === 'pier') {
      for (let s = 0; s < 4; s++) for (let lv = 0; lv < 1 + Math.floor(r() * 3); lv++) this.boxes.push({ x0: -13, x1: -10.6, y0: lv * 2.6, y1: lv * 2.6 + 2.55, z0: 12 + s * 7, z1: 18 + s * 7, lum: 60 + r() * 130, cont: true });
      this.boxes.push({ x0: 1.5, x1: 3.2, y0: 0, y1: 2.6, z0: 11, z1: 13, lum: 160 });
      for (let k = 0; k < 7; k++) person({ x: -8 + r() * 12, z: 9 + r() * 40, vz: (r() < .5 ? -1 : 1) * (1 + r() * .5) });
      this.agents.push({ kind: 'car', x: -6, z: 50, vz: -2.5, lum: 190, heat: .9, len: 3, id: this.nextId++, fork: true });
    }
    if (this.cam.subj) person({ x: T === 'platform' ? -3.2 : T === 'corridor' ? .4 : -2, z: 34, vz: -.9, target: this.cam.subj, lum: 70, head: 190, ht: 1.82 });
  }
  P(X, Y, Z, w, h) { const f = w * this.fx * this.zoom, zz = Math.max(.25, Z); return [w / 2 + (X - this.pan) * f / zz, h * (this.hor + this.tilt) + (this.Hc - Y) * f / zz]; }
  update(dt) {
    this.t += dt;
    const T = this.type;
    this.agents.forEach(a => {
      if (a.kind === 'car') {
        if (a.parked) return;
        a.z += a.vz * dt;
        if (T === 'street') { if (a.z < 6) a.z = 95; if (a.z > 100) a.z = 7; }
        else if (a.z < 4 || a.z > 70) a.vz *= -1;
        return;
      }
      a.ph += dt * 6 * (Math.abs(a.vz) + Math.abs(a.vx) > .1 ? 1 : 0);
      if (a.wander && Math.random() < dt * .3) { const ang = Math.random() * 6.28; a.vx = Math.cos(ang) * 1.2; a.vz = Math.sin(ang) * 1.2; }
      a.x += a.vx * dt; a.z += a.vz * dt;
      if (a.target) { if (a.z < 9) a.vz = .9; if (a.z > 40) a.vz = -.9; }
      if (a.cross) { if (a.x > 8 || a.x < -8) a.vx *= -1; }
      if (a.wander) { if (a.x < -14 || a.x > 14) a.vx *= -1; if (a.z < 8 || a.z > 55) a.vz *= -1; }
      else if (!a.target) { if (a.z < 6.5) a.z = 70; if (a.z > 72) a.z = 7; }
    });
    if (this.train) {
      const tr = this.train; tr.t -= dt;
      if (tr.state === 'away' && tr.t <= 0) { tr.state = 'in'; tr.z = 160; }
      if (tr.state === 'in') { tr.z = Math.max(4, tr.z - Math.max(2, (tr.z - 4) * .9) * dt); if (tr.z <= 4.5) { tr.state = 'stop'; tr.t = 7; } }
      if (tr.state === 'stop' && tr.t <= 0) tr.state = 'out';
      if (tr.state === 'out') { tr.zOff = (tr.zOff || 0) + dt * (2 + (tr.zOff || 0) * .8); if (tr.zOff > 150) { tr.state = 'away'; tr.t = 18; tr.zOff = 0; tr.z = 160; } }
    }
  }
  draw(ctx, w, h, mode, o = {}) {
    const C = camLut(mode), th = mode === 'thermal';
    const L = (l, heat = 0) => C[clamp(Math.round(th ? 18 + l * .22 + heat * 230 : l), 0, 255)];
    const P = (X, Y, Z) => this.P(X, Y, Z, w, h);
    const T = this.type;
    ctx.fillStyle = L(T === 'corridor' || T === 'garage' ? 40 : 55); ctx.fillRect(0, 0, w, h);
    const quad = (pts, l, heat) => { ctx.fillStyle = L(l, heat); ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill(); };
    const line = (a, b, l, lw = 1) => { ctx.strokeStyle = L(l); ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); };
    const zN = 3, zF = 140;
    // ---- static environment
    if (T === 'street') {
      quad([P(-60, 0, zF), P(60, 0, zF), P(60, 0, zN), P(-60, 0, zN)], 70);
      quad([P(-4, 0, zF), P(4, 0, zF), P(4, 0, zN), P(-4, 0, zN)], 48);
      for (let z = 4; z < 120; z += 6) line(P(0, 0, z), P(0, 0, z + 3), 170, 1.5);
      for (let k = -3.6; k < 3.7; k += .8) quad([P(k, 0, 19), P(k + .45, 0, 19), P(k + .45, 0, 21.5), P(k, 0, 21.5)], 175);
      [-1, 1].forEach(s => {
        const xs = s * 8;
        quad([P(xs, 0, 6), P(xs, 0, zF), P(xs, 26, zF), P(xs, 26, 6)], s < 0 ? 95 : 82);
        for (let z = 8; z < 90; z += 3.2) for (let y = 3; y < 24; y += 3.4) { const a = P(xs, y, z), b = P(xs, y, z + 1.6), c = P(xs, y + 1.8, z + 1.6), d = P(xs, y + 1.8, z); quad([a, b, c, d], ((z * 7 + y * 3) % 5 < 1) ? 150 : 50); }
        for (let z = 8; z < 90; z += 10) line(P(s * 4, 0, z), P(s * 4, 4.5, z), 140, 1.5);
      });
    } else if (T === 'platform') {
      quad([P(-9, 0, zF), P(0, 0, zF), P(0, 0, zN), P(-9, 0, zN)], 92);
      quad([P(0, 0, zF), P(6, 0, zF), P(6, 0, zN), P(0, 0, zN)], 26);
      quad([P(-.5, 0, zF), P(0, 0, zF), P(0, 0, zN), P(-.5, 0, zN)], 200);
      [1.6, 3.2].forEach(x => line(P(x, 0, zN), P(x, 0, zF), 150, 1.5));
      for (let z = 4; z < 100; z += 2) line(P(.8, 0, z), P(4, 0, z), 45, 1);
      for (let z = 4; z < 100; z += 4) line(P(-9, 0, z), P(0, 0, z), 82, 1);
      quad([P(-9, 4.6, zN), P(6, 4.6, zN), P(6, 4.6, zF), P(-9, 4.6, zF)], 34);
      for (let z = 6; z < 100; z += 7) quad([P(-6, 4.5, z), P(-3, 4.5, z), P(-3, 4.5, z + 1.2), P(-6, 4.5, z + 1.2)], 230);
      quad([P(-9, 0, 6), P(-9, 0, zF), P(-9, 4.6, zF), P(-9, 4.6, 6)], 70);
      for (let z = 10; z < 90; z += 14) quad([P(-9, 1.6, z), P(-9, 1.6, z + 5), P(-9, 3.2, z + 5), P(-9, 3.2, z)], 150);
    } else if (T === 'corridor') {
      quad([P(-2.5, 0, zF), P(2.5, 0, zF), P(2.5, 0, zN), P(-2.5, 0, zN)], 110);
      for (let z = 4; z < 80; z += 1.5) line(P(-2.5, 0, z), P(2.5, 0, z), 95, 1);
      quad([P(-2.5, 3, zN), P(2.5, 3, zN), P(2.5, 3, zF), P(-2.5, 3, zF)], 60);
      for (let z = 4; z < 70; z += 5) quad([P(-.6, 2.99, z), P(.6, 2.99, z), P(.6, 2.99, z + 1.4), P(-.6, 2.99, z + 1.4)], 245);
      [-1, 1].forEach(s => {
        quad([P(s * 2.5, 0, 3), P(s * 2.5, 0, zF), P(s * 2.5, 3, zF), P(s * 2.5, 3, 3)], s < 0 ? 128 : 112);
        for (let z = 6; z < 70; z += 6) quad([P(s * 2.5, 0, z), P(s * 2.5, 0, z + 1.1), P(s * 2.5, 2.2, z + 1.1), P(s * 2.5, 2.2, z)], 70);
      });
      quad([P(-2.5, 0, 70), P(2.5, 0, 70), P(2.5, 3, 70), P(-2.5, 3, 70)], 150);
    } else if (T === 'garage') {
      quad([P(-12, 0, zF), P(12, 0, zF), P(12, 0, zN), P(-12, 0, zN)], 62);
      for (let z = 9; z < 70; z += 2.7) { line(P(-8.6, 0, z), P(-5.4, 0, z), 160, 1); line(P(5.4, 0, z), P(8.6, 0, z), 160, 1); }
      for (let z = 6; z < 80; z += 6) line(P(0, 0, z), P(0, 0, z + 3), 190, 1.5);
      quad([P(-12, 2.7, zN), P(12, 2.7, zN), P(12, 2.7, zF), P(-12, 2.7, zF)], 34);
      for (let z = 6; z < 70; z += 9) [-3, 3].forEach(x => quad([P(x - .1, 2.69, z), P(x + .1, 2.69, z), P(x + .1, 2.69, z + 2.6), P(x - .1, 2.69, z + 2.6)], 250));
    } else if (T === 'plaza') {
      quad([P(-60, 0, zF), P(60, 0, zF), P(60, 0, zN), P(-60, 0, zN)], 108);
      for (let x = -30; x <= 30; x += 2) line(P(x, 0, 5), P(x, 0, 80), 96, 1);
      for (let z = 5; z < 80; z += 2) line(P(-30, 0, z), P(30, 0, z), 96, 1);
      ctx.fillStyle = L(48); ctx.beginPath();
      for (let k = 0; k <= 40; k++) { const a = k / 40 * 6.283, p = P(Math.cos(a) * 4, 0, 30 + Math.sin(a) * 4); k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
      ctx.fill(); ctx.strokeStyle = L(180); ctx.lineWidth = 2; ctx.stroke();
      [[-14, 22], [14, 26], [-16, 44], [17, 48]].forEach(([x, z]) => { line(P(x, 0, z), P(x, 3, z), 50, 2); const c = P(x, 4.2, z), rr = w * this.fx * this.zoom * 2 / z; ctx.fillStyle = L(60); ctx.beginPath(); ctx.ellipse(c[0], c[1], rr, rr * .7, 0, 0, 6.283); ctx.fill(); });
    } else if (T === 'pier') {
      quad([P(-40, 0, zF), P(7, 0, zF), P(7, 0, zN), P(-40, 0, zN)], 96);
      quad([P(7, 0, zF), P(60, 0, zF), P(60, 0, zN), P(7, 0, zN)], 30);
      for (let k = 0; k < 18; k++) { const z = 6 + k * 5 + (this.t * 1.5) % 5; line(P(9, 0, z), P(30, 0, z + 1), 50, 1); }
      line(P(7, 0, zN), P(7, 0, zF), 210, 2);
      for (let z = 6; z < 80; z += 5) quad([P(6.4, 0, z), P(6.8, 0, z), P(6.8, .6, z), P(6.4, .6, z)], 40);
      for (let z = 6; z < 90; z += 8) line(P(-6, 0, z), P(-6, 0, z + 4), 200, 1.5);
    }
    // ---- dynamic: boxes + agents, far to near
    const items = [];
    this.boxes.forEach(b => items.push({ z: b.z0, b }));
    this.agents.forEach(a => items.push({ z: a.z, a }));
    if (this.train && this.train.state !== 'away') items.push({ z: this.train.z + (this.train.zOff || 0), train: true });
    items.sort((p, q) => q.z - p.z);
    const box = (b, heat = 0) => {
      const { x0, x1, y0, y1, z0, z1 } = b;
      if (z0 < 1) return;
      if (y1 < this.Hc) quad([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], b.lum * 1.1, heat);
      if (this.pan < x0) quad([P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0)], b.lum * .7, heat);
      if (this.pan > x1) quad([P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0)], b.lum * .7, heat);
      quad([P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)], b.lum * .85, heat);
      if (b.cont) { const n = 8; for (let k = 1; k < n; k++) { const xx = x0 + (x1 - x0) * k / n; line(P(xx, y0, z0), P(xx, y1, z0), b.lum * .6); } }
    };
    this.dets = [];
    items.forEach(it => {
      if (it.b) return box(it.b);
      if (it.train) {
        const z0 = it.z, z1 = z0 + 60;
        box({ x0: .7, x1: 4.2, y0: .2, y1: 3.7, z0, z1, lum: 150 }, .3);
        for (let z = z0 + 2; z < z1; z += 4.5) quad([P(.7, 1.5, z), P(.7, 1.5, z + 2.6), P(.7, 2.9, z + 2.6), P(.7, 2.9, z)], 40, .1);
        quad([P(1.2, 1.6, z0), P(3.7, 1.6, z0), P(3.7, 3, z0), P(1.2, 3, z0)], 35);
        [[1.4, .6], [3.5, .6]].forEach(([x, y]) => { const p = P(x, y, z0), rr = Math.max(1.5, w * this.fx * this.zoom * .14 / z0); ctx.fillStyle = L(255, .6); ctx.beginPath(); ctx.arc(p[0], p[1], rr, 0, 6.283); ctx.fill(); });
        return;
      }
      const a = it.a;
      if (a.z < 1.2) return;
      if (a.kind === 'car') {
        const hw = a.fork ? .7 : .9, len = a.len;
        if (a.sideways) { box({ x0: a.x - len / 2, x1: a.x + len / 2, y0: .15, y1: .95, z0: a.z - hw, z1: a.z + hw, lum: a.lum }, a.heat); box({ x0: a.x - len * .28, x1: a.x + len * .22, y0: .95, y1: 1.45, z0: a.z - hw * .85, z1: a.z + hw * .85, lum: a.lum * .55 }, a.heat * .6); }
        else {
          box({ x0: a.x - hw, x1: a.x + hw, y0: .15, y1: a.fork ? 1.1 : .95, z0: a.z, z1: a.z + len, lum: a.lum }, a.heat);
          if (!a.fork) box({ x0: a.x - hw * .85, x1: a.x + hw * .85, y0: .95, y1: 1.45, z0: a.z + len * .3, z1: a.z + len * .75, lum: a.lum * .55 }, a.heat * .6);
          else box({ x0: a.x - .1, x1: a.x + .1, y0: 1.1, y1: 2.6, z0: a.z, z1: a.z + .2, lum: 60 });
          if (a.vz < 0 && (mode === 'night' || T === 'garage' || T === 'street')) [[-hw * .7], [hw * .7]].forEach(([dx]) => { const p = P(a.x + dx, .6, a.z), rr = Math.max(1.2, w * this.fx * this.zoom * .12 / a.z); ctx.fillStyle = L(255, .5); ctx.beginPath(); ctx.arc(p[0], p[1], rr, 0, 6.283); ctx.fill(); });
        }
        return;
      }
      // person
      const f = w * this.fx * this.zoom / a.z;
      const [fx0, fy0] = P(a.x, 0, a.z);
      if (fx0 < -40 || fx0 > w + 40) return;
      const sw = Math.sin(a.ph) * .22;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(fx0, fy0, .3 * f, .08 * f, 0, 0, 6.283); ctx.fill();
      ctx.strokeStyle = L(a.lum * .6, a.heat * .7); ctx.lineWidth = Math.max(1, .14 * f); ctx.lineCap = 'round';
      const hip = P(a.x, .9 * a.ht / 1.75, a.z);
      ctx.beginPath(); ctx.moveTo(hip[0], hip[1]); ctx.lineTo(fx0 + sw * f, fy0); ctx.moveTo(hip[0], hip[1]); ctx.lineTo(fx0 - sw * f, fy0); ctx.stroke();
      const sh = P(a.x, 1.45 * a.ht / 1.75, a.z);
      ctx.fillStyle = L(a.lum, a.heat * .85);
      const tw = .44 * f; ctx.fillRect(sh[0] - tw / 2, sh[1], tw, hip[1] - sh[1] + .05 * f);
      ctx.lineWidth = Math.max(1, .1 * f);
      ctx.beginPath(); ctx.moveTo(sh[0] - tw / 2, sh[1] + .05 * f); ctx.lineTo(sh[0] - tw / 2 - sw * .5 * f, sh[1] + .6 * f); ctx.moveTo(sh[0] + tw / 2, sh[1] + .05 * f); ctx.lineTo(sh[0] + tw / 2 + sw * .5 * f, sh[1] + .6 * f); ctx.stroke();
      const hd = P(a.x, 1.62 * a.ht / 1.75, a.z);
      ctx.fillStyle = L(a.head, a.heat); ctx.beginPath(); ctx.arc(hd[0], hd[1], Math.max(1.2, .12 * f), 0, 6.283); ctx.fill();
      if (a.z < 38 && hd[1] > 0 && fy0 < h + 10) this.dets.push({ a, x: hd[0] - .3 * f, y: hd[1] - .2 * f, w: .6 * f, h: fy0 - hd[1] + .25 * f, f });
    });
    // fog for depth
    if (T === 'street' || T === 'plaza' || T === 'pier') {
      const hy = h * (this.hor + this.tilt);
      const g = ctx.createLinearGradient(0, hy, 0, hy + h * .35); g.addColorStop(0, L(th ? 30 : 120)); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = .35; ctx.fillStyle = g; ctx.fillRect(0, hy, w, h * .35); ctx.globalAlpha = 1;
    }
  }
}

function cctvPost(ctx, w, h, t, cam, o) {
  const tiles = getNoiseTiles();
  ctx.globalAlpha = o.big ? .09 : .12;
  const tl = tiles[Math.floor(t * 24) % 4], ox = -(Math.floor(t * 997) % 192), oy = -(Math.floor(t * 613) % 192);
  for (let y = oy; y < h; y += 192) for (let x = ox; x < w; x += 192) ctx.drawImage(tl, x, y);
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(0,0,0,.14)';
  for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
  if (Math.sin(t * .7 + cam.seed) > .985) { const by = (t * 300) % h; ctx.drawImage(ctx.canvas, 0, by * (ctx.canvas.height / h), ctx.canvas.width, 12 * (ctx.canvas.height / h), 6, by, w, 12); }
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .35, w / 2, h / 2, Math.max(w, h) * .72);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
  const fs = o.big ? 13 : 10.5;
  const d = new Date();
  const ts = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}  ${tzTime('America/New_York')}`;
  hudText(ctx, `${cam.id} // ${cam.name}`, 10, fs + 8, { size: fs, bg: 'rgba(0,0,0,.55)', color: 'rgba(235,240,240,.95)' });
  hudText(ctx, ts, 10, h - 10, { size: fs, bg: 'rgba(0,0,0,.55)', color: 'rgba(235,240,240,.95)' });
  if (Math.floor(t * 1.4) % 2 === 0) { ctx.fillStyle = '#ff3b3b'; ctx.beginPath(); ctx.arc(w - 44, fs + 3, fs * .38, 0, 6.283); ctx.fill(); }
  hudText(ctx, 'REC', w - 10, fs + 8, { size: fs, align: 'right', color: 'rgba(235,240,240,.95)' });
  hudText(ctx, o.mode === 'thermal' ? 'LWIR 30HZ' : o.mode === 'night' ? 'NV GEN3' : '1080P 24FPS', w - 10, h - 10, { size: fs, align: 'right', bg: 'rgba(0,0,0,.55)', color: 'rgba(235,240,240,.85)' });
}

function drawDets(ctx, sc, o) {
  (sc.dets || []).forEach(d => {
    const tgt = d.a.target, sel = o.sel === d.a;
    const col = tgt ? THEME.alert : sel ? THEME.warn : THEME.acc;
    if (!tgt && !sel && !o.detect) return;
    const bw = Math.max(16, d.w), bh = Math.max(24, d.h);
    if (tgt || sel) brackets(ctx, d.x, d.y, bw, bh, Math.min(8, bw / 3), rgba(col, 1), o.big ? 2 : 1.5);
    else { ctx.strokeStyle = rgba(col, .6); ctx.lineWidth = 1; ctx.strokeRect(d.x, d.y, bw, bh); }
    const s = tgt ? SUBJ(tgt) : null;
    const label = tgt ? `MATCH ${s ? s.last.toUpperCase() : ''} 0.9${(d.a.id % 7) + 2}` : sel ? `SELECTED ID-${d.a.id}` : `ID-${d.a.id} 0.${60 + (d.a.id % 35)}`;
    if (tgt || sel || o.big || d.f > 24) hudText(ctx, label, d.x, d.y - 4, { size: o.big ? 11 : 9, bg: tgt ? 'rgba(60,0,0,.75)' : 'rgba(0,0,0,.6)', color: rgba(col, 1) });
  });
}

APPS.cctv = {
  title: 'Surveillance Network', short: 'CCTV', icon: 'cctv', code: 'CCTV-AGG', w: 1120, h: 690, cls: 'S//NF',
  create(body, opts, win) {
    const root = h(`<div class="cc">
      <div class="cc-top"><button class="btn sm cc-back" hidden>${icon('chevL')}All feeds</button><b class="cc-title">Surveillance network</b><span class="mono dim cc-sub">41,207 FEEDS · 6 PINNED · FACIAL INDEX ONLINE</span><span class="sp"></span>
        <div class="seg cc-mode"><button data-m="day" class="on">Day</button><button data-m="night">Night</button><button data-m="thermal">Thermal</button></div><button class="btn sm on cc-det">Detect</button></div>
      <div class="cc-grid">${CAMS.map((c, i) => `<button class="cc-tile" data-i="${i}" aria-label="${esc(c.id)} ${esc(c.name)}"><div class="cc-cv"></div></button>`).join('')}</div>
      <div class="cc-focus" hidden>
        <div class="cc-big"><div class="cc-cv"></div>
          <div class="cc-ptz"><button class="btn sm" data-p="l" aria-label="Pan left">${icon('chevL')}</button><button class="btn sm" data-p="u" aria-label="Tilt up">${icon('chevU')}</button><button class="btn sm" data-p="d" aria-label="Tilt down">${icon('chevD')}</button><button class="btn sm" data-p="r" aria-label="Pan right">${icon('chevR')}</button><button class="btn sm" data-p="zi" aria-label="Zoom in">${icon('plus')}</button><button class="btn sm" data-p="zo" aria-label="Zoom out">${icon('minus')}</button></div>
          <div class="cc-hint mono">TAP A PERSON TO SELECT · DRAG TO PAN</div></div>
        <aside class="cc-side panel">
          <div class="panel-h">Camera<span class="sp"></span><span class="tag t-ok">LIVE</span></div>
          <dl class="kv cc-kv"></dl>
          <div class="panel-h">Facial recognition</div>
          <div class="cc-enh"><div class="cc-enh-cv"></div><div class="cc-enh-txt mono">SELECT A PERSON IN THE FEED</div></div>
          <div class="cc-enh-btns"><button class="btn" data-enh disabled>Enhance</button><button class="btn sm" data-open hidden>Open file</button></div>
        </aside>
      </div></div>`);
    body.appendChild(root);
    let mode = 'day', detect = true, focus = -1, sel = null, enh = null;
    const scenes = CAMS.map(c => new CamScene(c));
    const tiles = $$('.cc-tile', root).map((el, i) => ({ el, C: makeCanvas($('.cc-cv', el), { maxDpr: 1.5 }), i }));
    const big = makeCanvas($('.cc-big .cc-cv', root), { maxDpr: 2 });
    const EC = makeCanvas($('.cc-enh-cv', root), { maxDpr: 2 });
    let lost = { i: -1, until: 0, next: 12 };
    const mlab = { day: 'day', night: 'night', thermal: 'thermal' };
    $$('.cc-mode button', root).forEach(b => b.onclick = () => { mode = b.dataset.m; $$('.cc-mode button', root).forEach(x => x.classList.toggle('on', x === b)); });
    $('.cc-det', root).onclick = e => { detect = !detect; e.currentTarget.classList.toggle('on', detect); };
    const openFocus = i => {
      focus = i; sel = null; enh = null;
      $('.cc-grid', root).hidden = true; $('.cc-focus', root).hidden = false; $('.cc-back', root).hidden = false;
      $('.cc-title', root).textContent = CAMS[i].id; $('.cc-sub', root).textContent = CAMS[i].name;
      const sc = scenes[i]; sc.pan = 0; sc.tilt = 0; sc.zoom = 1;
      $('.cc-kv', root).innerHTML = `<dt>Feed</dt><dd>${esc(CAMS[i].id)}</dd><dt>Location</dt><dd>${esc(CAMS[i].name)}</dd><dt>Owner</dt><dd>${i % 2 ? 'MUNICIPAL TRANSIT' : 'PRIVATE — COMPELLED'}</dd><dt>Stream</dt><dd>H.265 · 1920×1080 · 24 FPS</dd><dt>Retention</dt><dd>30 DAYS · MIRRORED</dd>`;
      renderEnh();
    };
    const closeFocus = () => { focus = -1; $('.cc-grid', root).hidden = false; $('.cc-focus', root).hidden = true; $('.cc-back', root).hidden = true; $('.cc-title', root).textContent = 'Surveillance network'; $('.cc-sub', root).textContent = '41,207 FEEDS · 6 PINNED · FACIAL INDEX ONLINE'; };
    tiles.forEach(tl => tl.el.onclick = () => openFocus(tl.i));
    $('.cc-back', root).onclick = closeFocus;
    const sc = () => scenes[focus];
    $$('[data-p]', root).forEach(b => b.onclick = () => { const s = sc(); if (!s) return; const k = b.dataset.p; if (k === 'l') s.pan -= 1.5; if (k === 'r') s.pan += 1.5; if (k === 'u') s.tilt = clamp(s.tilt + .05, -.3, .4); if (k === 'd') s.tilt = clamp(s.tilt - .05, -.3, .4); if (k === 'zi') s.zoom = clamp(s.zoom * 1.25, 1, 4); if (k === 'zo') s.zoom = clamp(s.zoom / 1.25, 1, 4); });
    // big feed touch
    const bcv = big.cv; bcv.style.touchAction = 'none';
    let drag = null;
    bcv.addEventListener('pointerdown', e => { bcv.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY, m: 0 }; });
    bcv.addEventListener('pointermove', e => { if (!drag) return; const s = sc(); const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.m += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY; if (drag.m > 6 && s) { s.pan -= dx * .03 / s.zoom; s.tilt = clamp(s.tilt + dy * .001, -.3, .4); } });
    bcv.addEventListener('pointerup', e => {
      if (drag && drag.m < 8) {
        const r = bcv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        const s = sc(); let best = null, bd = 1e9;
        (s.dets || []).forEach(d => { if (x > d.x - 10 && x < d.x + Math.max(16, d.w) + 10 && y > d.y - 10 && y < d.y + Math.max(24, d.h) + 10) { const dd = Math.hypot(x - (d.x + d.w / 2), y - (d.y + d.h / 2)); if (dd < bd) { bd = dd; best = d.a; } } });
        if (best) { sel = best; enh = null; Sound.tap(); renderEnh(); }
      }
      drag = null;
    });
    bcv.addEventListener('wheel', e => { e.preventDefault(); const s = sc(); if (s) s.zoom = clamp(s.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), 1, 4); }, { passive: false });
    const renderEnh = () => {
      const txt = $('.cc-enh-txt', root), bE = $('[data-enh]', root), bO = $('[data-open]', root);
      bO.hidden = true;
      if (!sel) { txt.innerHTML = 'SELECT A PERSON IN THE FEED'; bE.disabled = true; return; }
      bE.disabled = !!(enh && !enh.done);
      if (!enh) txt.innerHTML = `SUBJECT ID-${sel.id} SELECTED<br><span class="dim">READY TO ENHANCE</span>`;
    };
    $('[data-enh]', root).onclick = () => {
      if (!sel) return;
      const r = rng(sel.seed || sel.id);
      let subj = sel.target ? SUBJ(sel.target) : (r() < .7 ? SUBJECTS[3 + Math.floor(r() * (SUBJECTS.length - 3))] : null);
      enh = { t0: performance.now() / 1000, subj, conf: sel.target ? 96.4 : 61 + Math.floor(r() * 25), face: subj ? subj.face : { seed: sel.seed || sel.id, sex: r() < .5 ? 'M' : 'F', hair: pick(r, ['BLACK', 'BROWN', 'BLONDE', 'GRAY']), age: 30 }, done: false };
      Sound.scan(); renderEnh();
    };
    $('[data-open]', root).onclick = () => { if (enh && enh.subj) WM.open('cif', { subject: enh.subj.id }); };
    let acc = 0, accB = 0;
    const off = Loop.add((t, dt) => {
      scenes.forEach(s => s.update(dt));
      if (t > lost.next) { lost = { i: Math.floor(Math.random() * CAMS.length), until: t + 1.6, next: t + 25 + Math.random() * 30 }; }
      acc += dt;
      if (focus < 0 && acc > 1 / 24) {
        acc = 0;
        tiles.forEach(tl => {
          if (!tl.C.visible()) return;
          const ctx = tl.C.ctx, w = tl.C.w, hh = tl.C.h, s = scenes[tl.i];
          if (lost.i === tl.i && t < lost.until) {
            const tile = getNoiseTiles()[Math.floor(t * 30) % 4];
            for (let y = 0; y < hh; y += 192) for (let x = 0; x < w; x += 192) ctx.drawImage(tile, x, y);
            hudText(ctx, 'SIGNAL LOST — RECONNECTING', w / 2, hh / 2 + 5, { size: 13, align: 'center', bg: '#000', color: '#fff' });
            hudText(ctx, CAMS[tl.i].id, 10, 18, { size: 10.5, bg: 'rgba(0,0,0,.6)', color: '#fff' });
            return;
          }
          s.draw(ctx, w, hh, mlab[mode]);
          drawDets(ctx, s, { detect, big: false });
          cctvPost(ctx, w, hh, t, CAMS[tl.i], { mode });
        });
      }
      accB += dt;
      if (focus >= 0 && accB > 1 / 30 && big.visible()) {
        accB = 0;
        const s = scenes[focus], ctx = big.ctx, w = big.w, hh = big.h;
        s.draw(ctx, w, hh, mlab[mode]);
        drawDets(ctx, s, { detect, big: true, sel });
        cctvPost(ctx, w, hh, t, CAMS[focus], { mode, big: true });
        hudText(ctx, `PTZ  PAN ${(s.pan * 6).toFixed(1)}°  TILT ${(s.tilt * -60).toFixed(1)}°  ZOOM ×${s.zoom.toFixed(1)}`, 10, 44, { size: 11, bg: 'rgba(0,0,0,.55)', color: rgba(THEME.acc2, .95) });
        // enhance panel
        if (EC.visible()) {
          const ec = EC.ctx, ew = EC.w, eh = EC.h;
          ec.fillStyle = '#02070b'; ec.fillRect(0, 0, ew, eh);
          if (enh) {
            const el = t - enh.t0, stages = [28, 18, 11, 6, 3, 1], st = Math.min(stages.length - 1, Math.floor(el / .6));
            if (!enh.pc || enh.pcw !== ew || enh.pch !== eh) {
              enh.pcw = ew; enh.pch = eh; enh.sm = {};
              enh.pc = offscreen(ew * EC.dpr, eh * EC.dpr); const px = enh.pc.getContext('2d');
              if (enh.subj) px.drawImage(portrait(enh.subj, enh.pc.width, enh.pc.height), 0, 0); else drawFace(px, enh.pc.width, enh.pc.height, enh.face);
            }
            const pc = enh.pc, blk = stages[st] * EC.dpr;
            if (blk > 1.5) {
              let sm = enh.sm[st];
              if (!sm) { sm = enh.sm[st] = offscreen(Math.max(2, pc.width / blk), Math.max(2, pc.height / blk)); sm.getContext('2d').drawImage(pc, 0, 0, sm.width, sm.height); }
              ec.imageSmoothingEnabled = false; ec.drawImage(sm, 0, 0, ew, eh); ec.imageSmoothingEnabled = true;
            } else ec.drawImage(pc, 0, 0, ew, eh);
            const txt = $('.cc-enh-txt', root);
            if (st < stages.length - 1) { txt.innerHTML = `ENHANCING… ${Math.pow(2, st + 1)}× <span class="dim">RECONSTRUCTING FRAME ${4400 + st * 17}</span>`; ec.fillStyle = rgba(THEME.acc, .5); ec.fillRect(0, (el % .6) / .6 * eh, ew, 2); }
            else if (el > stages.length * .6 + .9) {
              if (!enh.done) { enh.done = true; if (enh.subj) Sound.ok(); else Sound.err(); $('[data-enh]', root).disabled = false; }
              const mesh = faceMesh(enh.face); const sz = Math.min(ew, eh / 1.2), ox = (ew - sz) / 2, oy = (eh - sz * 1.2) / 2;
              ec.strokeStyle = rgba(THEME.acc2, .5); ec.lineWidth = 1; ec.beginPath(); mesh.edges.forEach(([a, b]) => { ec.moveTo(ox + mesh.pts[a][0] * sz, oy + mesh.pts[a][1] * sz); ec.lineTo(ox + mesh.pts[b][0] * sz, oy + mesh.pts[b][1] * sz); }); ec.stroke();
              if (enh.subj) { txt.innerHTML = `<span class="${enh.subj.threat > 60 ? 'alert' : 'ok'}">MATCH ${Number(enh.conf).toFixed(1)}%</span> · ${esc(enh.subj.name)}<br><span class="dim">${esc(enh.subj.idLong)} · ${esc(enh.subj.status)}</span>`; $('[data-open]', root).hidden = false; }
              else txt.innerHTML = `<span class="warn">NO MATCH IN INDEX</span><br><span class="dim">ADDED TO UNKNOWN-PERSONS QUEUE</span>`;
            } else txt.innerHTML = 'COMPARING AGAINST 2.3B FACES…';
            brackets(ec, 4, 4, ew - 8, eh - 8, 12, rgba(THEME.acc, .9), 2);
          } else {
            ec.strokeStyle = rgba(THEME.acc, .25); ec.strokeRect(.5, .5, ew - 1, eh - 1);
            hudText(ec, sel ? `ID-${sel.id}` : 'NO SUBJECT', ew / 2, eh / 2, { size: 12, align: 'center', color: rgba(THEME.acc, .6) });
          }
        }
      }
    });
    if (opts.cam != null) openFocus(opts.cam);
    return {
      onOpts(o) { if (o.cam != null) openFocus(o.cam); },
      destroy() { off(); tiles.forEach(tl => tl.C.destroy()); big.destroy(); EC.destroy(); }
    };
  }
};
