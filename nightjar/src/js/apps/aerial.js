/* ============================================================
   AERIAL RECON — procedural overhead imagery with live traffic
   ============================================================ */
const CITY_S = 2048, M_PER_PX = .4;
const CITY_PAL = {
  eo: { ground: '#4a4e43', grass: '#3d4934', grass2: '#46533b', tree: '#26341f', treeHi: '#3a4a30', water: '#1b2a30', waterHi: '#243840', asphalt: '#2e3032', asphalt2: '#343638', sidewalk: '#76776e', mark: '#cfccb6', markY: '#b9a052', roofLo: 105, roofHi: 178, tint: 1, shadow: 'rgba(6,8,10,.58)', plaza: '#8b897f', path: '#86826f', lot: '#393b3c', stall: '#a2a196', unit: '#c9c9c2', carCols: ['#d8d8d4', '#1c1d1f', '#8d9093', '#5b6066', '#7a2a24', '#28406a', '#e2e0d8', '#3d3f41'] },
  ir: { ground: '#454545', grass: '#2b2b2b', grass2: '#303030', tree: '#1e1e1e', treeHi: '#262626', water: '#101010', waterHi: '#151515', asphalt: '#8e8e8e', asphalt2: '#979797', sidewalk: '#a3a3a3', mark: '#808080', markY: '#7c7c7c', roofLo: 70, roofHi: 150, tint: 0, shadow: 'rgba(0,0,0,.32)', plaza: '#9a9a9a', path: '#7a7a7a', lot: '#a0a0a0', stall: '#8a8a8a', unit: '#f2f2f2', carCols: ['#6e6e6e', '#5e5e5e', '#787878', '#686868'] }
};
const CityGen = {
  layouts: new Map(),
  paints: new Map(),
  layout(seed) {
    if (this.layouts.has(seed)) return this.layouts.get(seed);
    const r = rng(seed * 7919 + 13), S = CITY_S;
    const vx = [], hy = [];
    for (let x = 50 + r() * 70; x < S - 40; x += 170 + r() * 120) vx.push({ x, w: r() < .3 ? 32 : 20 });
    for (let y = 50 + r() * 70; y < S - 40; y += 160 + r() * 130) hy.push({ y, w: r() < .3 ? 32 : 20 });
    const river = r() < .75 ? { y0: S * (.25 + r() * .5), amp: 60 + r() * 140, ph: r() * 6, w: 120 + r() * 90 } : null;
    const riverY = x => river.y0 + river.amp * Math.sin(x / S * Math.PI * 1.4 + river.ph);
    const xs = [{ x: -20, w: 0 }, ...vx, { x: S + 20, w: 0 }], ys = [{ y: -20, w: 0 }, ...hy, { y: S + 20, w: 0 }];
    const blocks = [], shadows = [], roofs = [], trees = [], lots = [], plazas = [], parks = [];
    for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
      const x0 = xs[i].x + xs[i].w / 2 + 6, x1 = xs[i + 1].x - xs[i + 1].w / 2 - 6, y0 = ys[j].y + ys[j].w / 2 + 6, y1 = ys[j + 1].y - ys[j + 1].w / 2 - 6;
      if (x1 - x0 < 30 || y1 - y0 < 30) continue;
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      if (river && Math.abs(cy - riverY(cx)) < river.w / 2 + (y1 - y0) / 2 + 6) continue;
      const d = Math.hypot(cx - S / 2, cy - S / 2) / S, p = r();
      const type = d < .22 ? (p < .08 ? 'plaza' : 'dense') : d < .42 ? (p < .1 ? 'park' : p < .24 ? 'parking' : 'mid') : (p < .14 ? 'park' : p < .3 ? 'industrial' : p < .4 ? 'parking' : 'res');
      const b = { x0, y0, x1, y1, type };
      blocks.push(b);
      if (type === 'park') { parks.push(b); for (let k = 0; k < (x1 - x0) * (y1 - y0) / 500; k++) trees.push([x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), 5 + r() * 7]); continue; }
      if (type === 'plaza') { plazas.push(b); continue; }
      if (type === 'parking') { lots.push({ ...b, cars: [] }); const L = lots[lots.length - 1]; for (let yy = y0 + 10; yy < y1 - 12; yy += 26) for (let xx = x0 + 8; xx < x1 - 8; xx += 9) if (r() < .62) L.cars.push([xx, yy + (r() < .5 ? 0 : 13), Math.floor(r() * 8)]); continue; }
      const minL = type === 'dense' ? 58 : type === 'mid' ? 44 : type === 'industrial' ? 90 : 30;
      const split = (x, y, w, hh, dep) => {
        if ((w < minL * 2 && hh < minL * 2) || dep > 5) {
          const ins = type === 'res' ? 6 + r() * 6 : 2 + r() * 5;
          const bw = w - ins * 2, bh = hh - ins * 2; if (bw < 10 || bh < 10) return;
          let bx = x + ins, by = y + ins, rw = bw, rh = bh;
          if (type === 'res') { rw = bw * (.55 + r() * .3); rh = bh * (.5 + r() * .3); bx = x + ins + r() * (bw - rw); by = y + ins + r() * (bh - rh); for (let k = 0; k < 3; k++) if (r() < .7) trees.push([x + r() * w, y + r() * hh, 4 + r() * 4]); }
          const ht = type === 'dense' ? 18 + r() * 60 : type === 'mid' ? 8 + r() * 22 : type === 'industrial' ? 6 + r() * 8 : 4 + r() * 4;
          const tone = r(), units = [];
          const nu = type === 'res' ? 0 : Math.floor(r() * 6);
          for (let k = 0; k < nu; k++) { const uw = 3 + r() * 7, uh = 3 + r() * 6; units.push([bx + 3 + r() * Math.max(1, rw - uw - 6), by + 3 + r() * Math.max(1, rh - uh - 6), uw, uh, r() < .35]); }
          roofs.push({ x: bx, y: by, w: rw, h: rh, ht, tone, units, kind: type, ridge: type === 'res' ? (rw > rh ? 'h' : 'v') : null, ribs: type === 'industrial' });
          return;
        }
        if (w >= hh) { const s = w * (.35 + r() * .3); split(x, y, s, hh, dep + 1); split(x + s, y, w - s, hh, dep + 1); }
        else { const s = hh * (.35 + r() * .3); split(x, y, w, s, dep + 1); split(x, y + s, w, hh - s, dep + 1); }
      };
      split(x0, y0, x1 - x0, y1 - y0, 0);
    }
    // street trees
    vx.forEach(v => { for (let y = 10; y < S; y += 26 + r() * 30) if (r() < .45) trees.push([v.x + (r() < .5 ? -1 : 1) * (v.w / 2 + 3), y, 3.5 + r() * 2.5]); });
    const L = { seed, vx, hy, river, riverY: river ? riverY : null, blocks, roofs, trees, lots, plazas, parks };
    this.layouts.set(seed, L);
    return L;
  },
  paint(L, mode) {
    const key = L.seed + ':' + mode;
    if (this.paints.has(key)) return this.paints.get(key);
    const P = CITY_PAL[mode], S = CITY_S, c = offscreen(S, S), x = c.getContext('2d'), r = rng(L.seed + (mode === 'ir' ? 5 : 1));
    x.fillStyle = P.ground; x.fillRect(0, 0, S, S);
    // ground mottling
    for (let k = 0; k < 900; k++) { x.fillStyle = r() < .5 ? P.grass : P.grass2; x.globalAlpha = .25 + r() * .3; x.beginPath(); x.arc(r() * S, r() * S, 6 + r() * 30, 0, Math.PI * 2); x.fill(); }
    x.globalAlpha = 1;
    // parks + plazas
    L.parks.forEach(b => { x.fillStyle = P.grass; x.fillRect(b.x0 - 4, b.y0 - 4, b.x1 - b.x0 + 8, b.y1 - b.y0 + 8); x.strokeStyle = P.path; x.lineWidth = 3; x.beginPath(); x.moveTo(b.x0, b.y0); x.lineTo(b.x1, b.y1); x.moveTo(b.x1, b.y0); x.quadraticCurveTo((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2 + 30, b.x0, b.y1); x.stroke(); });
    L.plazas.forEach(b => {
      x.fillStyle = P.plaza; x.fillRect(b.x0 - 4, b.y0 - 4, b.x1 - b.x0 + 8, b.y1 - b.y0 + 8);
      x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = 1; x.beginPath();
      for (let xx = b.x0; xx < b.x1; xx += 8) { x.moveTo(xx, b.y0); x.lineTo(xx, b.y1); }
      for (let yy = b.y0; yy < b.y1; yy += 8) { x.moveTo(b.x0, yy); x.lineTo(b.x1, yy); }
      x.stroke();
      const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
      x.fillStyle = P.water; x.beginPath(); x.arc(cx, cy, 18, 0, Math.PI * 2); x.fill(); x.strokeStyle = P.sidewalk; x.lineWidth = 3; x.stroke();
    });
    // water
    if (L.river) {
      x.fillStyle = P.water; x.beginPath();
      for (let xx = -10; xx <= S + 10; xx += 16) x.lineTo(xx, L.riverY(xx) - L.river.w / 2);
      for (let xx = S + 10; xx >= -10; xx -= 16) x.lineTo(xx, L.riverY(xx) + L.river.w / 2);
      x.closePath(); x.fill();
      x.strokeStyle = P.waterHi; x.lineWidth = 1;
      for (let k = 0; k < 160; k++) { const xx = r() * S, yy = L.riverY(xx) + (r() - .5) * L.river.w * .8; x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + 8 + r() * 20, yy + (r() - .5) * 2); x.stroke(); }
      x.strokeStyle = P.sidewalk; x.lineWidth = 3; x.beginPath();
      for (let xx = -10; xx <= S + 10; xx += 16) x.lineTo(xx, L.riverY(xx) - L.river.w / 2); x.stroke(); x.beginPath();
      for (let xx = -10; xx <= S + 10; xx += 16) x.lineTo(xx, L.riverY(xx) + L.river.w / 2); x.stroke();
    }
    // roads
    const road = (isV, c0, w) => {
      x.fillStyle = P.sidewalk; isV ? x.fillRect(c0 - w / 2 - 6, 0, w + 12, S) : x.fillRect(0, c0 - w / 2 - 6, S, w + 12);
    };
    L.vx.forEach(v => road(true, v.x, v.w)); L.hy.forEach(v => road(false, v.y, v.w));
    x.fillStyle = P.asphalt;
    L.vx.forEach(v => x.fillRect(v.x - v.w / 2, 0, v.w, S)); L.hy.forEach(v => x.fillRect(0, v.y - v.w / 2, S, v.w));
    // markings
    x.setLineDash([12, 12]); x.lineWidth = 1.2;
    L.vx.forEach(v => { x.strokeStyle = v.w > 25 ? P.markY : P.mark; x.beginPath(); x.moveTo(v.x, 0); x.lineTo(v.x, S); x.stroke(); });
    L.hy.forEach(v => { x.strokeStyle = v.w > 25 ? P.markY : P.mark; x.beginPath(); x.moveTo(0, v.y); x.lineTo(S, v.y); x.stroke(); });
    x.setLineDash([]);
    // intersections: clear paint + crosswalks
    L.vx.forEach(v => L.hy.forEach(hz => {
      x.fillStyle = P.asphalt2; x.fillRect(v.x - v.w / 2, hz.y - hz.w / 2, v.w, hz.w);
      x.fillStyle = P.mark;
      for (let k = -v.w / 2 + 2; k < v.w / 2 - 1; k += 4) { x.fillRect(v.x + k, hz.y - hz.w / 2 - 7, 2, 6); x.fillRect(v.x + k, hz.y + hz.w / 2 + 1, 2, 6); }
      for (let k = -hz.w / 2 + 2; k < hz.w / 2 - 1; k += 4) { x.fillRect(v.x - v.w / 2 - 7, hz.y + k, 6, 2); x.fillRect(v.x + v.w / 2 + 1, hz.y + k, 6, 2); }
    }));
    // bridges railings
    if (L.river) {
      x.strokeStyle = P.unit; x.lineWidth = 1.5;
      L.vx.forEach(v => { const yy = L.riverY(v.x); x.beginPath(); x.moveTo(v.x - v.w / 2 - 6, yy - L.river.w / 2 - 4); x.lineTo(v.x - v.w / 2 - 6, yy + L.river.w / 2 + 4); x.moveTo(v.x + v.w / 2 + 6, yy - L.river.w / 2 - 4); x.lineTo(v.x + v.w / 2 + 6, yy + L.river.w / 2 + 4); x.stroke(); });
    }
    // parking lots
    L.lots.forEach(b => {
      x.fillStyle = P.lot; x.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
      x.strokeStyle = P.stall; x.lineWidth = 1; x.beginPath();
      for (let yy = b.y0 + 10; yy < b.y1 - 12; yy += 26) for (let xx = b.x0 + 8; xx < b.x1 - 8; xx += 9) { x.moveTo(xx, yy - 1); x.lineTo(xx, yy + 11); x.moveTo(xx, yy + 13); x.lineTo(xx, yy + 25); }
      x.stroke();
      b.cars.forEach(([cx, cy, ci]) => { x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(cx + 2.5, cy + 2.5, 5, 10); x.fillStyle = P.carCols[ci % P.carCols.length]; x.fillRect(cx + 1.5, cy + 1, 5, 10); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(cx + 2, cy + 3.2, 4, 2.2); });
    });
    // shadows
    x.fillStyle = P.shadow;
    L.roofs.forEach(b => {
      const d = b.ht * .55;
      x.beginPath(); x.moveTo(b.x, b.y); x.lineTo(b.x + b.w, b.y); x.lineTo(b.x + b.w + d, b.y + d); x.lineTo(b.x + b.w + d, b.y + b.h + d); x.lineTo(b.x + d, b.y + b.h + d); x.lineTo(b.x, b.y + b.h); x.closePath(); x.fill();
    });
    L.trees.forEach(([tx, ty, tr]) => { x.beginPath(); x.arc(tx + tr * .6, ty + tr * .6, tr, 0, Math.PI * 2); x.fill(); });
    // roofs
    L.roofs.forEach(b => {
      let v = Math.round(P.roofLo + (P.roofHi - P.roofLo) * b.tone);
      if (mode === 'ir' && b.kind === 'industrial') v = Math.min(200, v + 30);
      const warm = P.tint ? (b.tone > .6 ? 6 : b.tone < .25 ? -6 : 0) : 0;
      x.fillStyle = `rgb(${v + warm},${v},${v - warm})`; x.fillRect(b.x, b.y, b.w, b.h);
      x.fillStyle = 'rgba(255,255,255,.14)'; x.fillRect(b.x, b.y, b.w, 1.5); x.fillRect(b.x, b.y, 1.5, b.h);
      x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(b.x, b.y + b.h - 1.5, b.w, 1.5); x.fillRect(b.x + b.w - 1.5, b.y, 1.5, b.h);
      if (b.ridge) { x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 1; x.beginPath(); if (b.ridge === 'h') { x.moveTo(b.x, b.y + b.h / 2); x.lineTo(b.x + b.w, b.y + b.h / 2); } else { x.moveTo(b.x + b.w / 2, b.y); x.lineTo(b.x + b.w / 2, b.y + b.h); } x.stroke(); x.fillStyle = 'rgba(0,0,0,.12)'; b.ridge === 'h' ? x.fillRect(b.x, b.y + b.h / 2, b.w, b.h / 2) : x.fillRect(b.x + b.w / 2, b.y, b.w / 2, b.h); }
      if (b.ribs) { x.strokeStyle = 'rgba(0,0,0,.14)'; x.lineWidth = 1; x.beginPath(); for (let k = b.x + 4; k < b.x + b.w; k += 5) { x.moveTo(k, b.y + 1); x.lineTo(k, b.y + b.h - 1); } x.stroke(); }
      b.units.forEach(([ux, uy, uw, uh, hot]) => { x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(ux + 1.5, uy + 1.5, uw, uh); x.fillStyle = mode === 'ir' && hot ? '#f4f4f4' : P.unit; x.fillRect(ux, uy, uw, uh); });
    });
    // trees
    L.trees.forEach(([tx, ty, tr]) => {
      const g = x.createRadialGradient(tx - tr * .35, ty - tr * .35, 1, tx, ty, tr);
      g.addColorStop(0, P.treeHi); g.addColorStop(1, P.tree);
      x.fillStyle = g; x.beginPath(); x.arc(tx, ty, tr, 0, Math.PI * 2); x.fill();
    });
    // sensor grain
    const tiles = getNoiseTiles();
    x.globalAlpha = .07; x.globalCompositeOperation = 'overlay';
    for (let yy = 0; yy < S; yy += 192) for (let xx = 0; xx < S; xx += 192) x.drawImage(tiles[(xx + yy) % 4], xx, yy);
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    this.paints.set(key, c);
    while (this.paints.size > 3) this.paints.delete(this.paints.keys().next().value);
    return c;
  }
};

APPS.aerial = {
  title: 'Aerial Reconnaissance', short: 'Aerial', icon: 'aerial', code: 'ISR-EO', w: 1100, h: 680, cls: 'S//REL NJ',
  create(body, opts, win) {
    const root = h(`<div class="aer">
      <div class="aer-view"><div class="aer-img"></div><div class="aer-hud"></div><div class="aer-flash"></div></div>
      <aside class="aer-side panel">
        <div class="panel-h">Sensor control</div>
        <div class="aer-sec"><div class="seg aer-mode"><button data-m="eo" class="on">EO</button><button data-m="wh">IR-W</button><button data-m="bh">IR-B</button><button data-m="nv">NV</button></div></div>
        <div class="aer-sec aer-btns"><button class="btn sm" data-z="1">${icon('plus')}Zoom</button><button class="btn sm" data-z="-1">${icon('minus')}Zoom</button><button class="btn sm" data-track>Track</button><button class="btn sm" data-snap>Capture</button></div>
        <div class="panel-h">Target</div>
        <div class="aer-sec aer-tgt"></div>
        <div class="panel-h">Lock</div>
        <div class="aer-sec aer-lock"><p class="dim mono">TAP A VEHICLE TO LOCK ON</p></div>
        <div class="panel-h">Re-task</div>
        <div class="aer-sec aer-list scroll">${TARGETS.map(t => `<button class="aer-trow" data-t="${t.id}"><b>${t.id}</b>${esc(t.name)}</button>`).join('')}</div>
      </aside>
    </div>`);
    body.appendChild(root);
    const IC = makeCanvas($('.aer-img', root), { maxDpr: 2 }), HC = makeCanvas($('.aer-hud', root), { maxDpr: 2 });
    let tg = TARGETS.find(t => t.id === opts.target) || TARGETS[0], L, eo, ir = null, mode = 'eo';
    let cam = { x: CITY_S / 2, y: CITY_S / 2, z: 1.6 }, track = false, lock = null, subjCar = null, platform = opts.platform || null, frame = 4400 + Math.floor(Math.random() * 300), banner = null;
    let cars = [], people = [];
    const setTarget = (t, subjId) => {
      tg = t; L = CityGen.layout(t.seed); eo = CityGen.paint(L, 'eo'); ir = null; if (mode !== 'eo' && mode !== 'nv') ir = CityGen.paint(L, 'ir');
      cam = { x: CITY_S / 2, y: CITY_S / 2, z: 1.6 }; lock = null; subjCar = null; track = false; $('[data-track]', root).classList.remove('on');
      const r = rng(t.seed + 3);
      cars = [];
      for (let k = 0; k < 110; k++) {
        const v = r() < .5, arr = v ? L.vx : L.hy; const rd = arr[Math.floor(r() * arr.length)];
        const dir = r() < .5 ? 1 : -1;
        cars.push({ v, rd, dir, pos: r() * CITY_S, sp: 18 + r() * 26, col: Math.floor(r() * 8), id: k, plate: String.fromCharCode(65 + Math.floor(r() * 26), 65 + Math.floor(r() * 26), 65 + Math.floor(r() * 26)) + '-' + (1000 + Math.floor(r() * 8999)) });
      }
      people = [];
      for (let k = 0; k < 140; k++) { const v = r() < .5, arr = v ? L.vx : L.hy; const rd = arr[Math.floor(r() * arr.length)]; people.push({ v, rd, side: r() < .5 ? -1 : 1, pos: r() * CITY_S, sp: (2 + r() * 2.5) * (r() < .5 ? 1 : -1) }); }
      if (subjId) {
        const s = SUBJ(subjId);
        let best = cars[0], bd = 1e9;
        cars.forEach(c => { const p = carPos(c); const d = Math.hypot(p[0] - CITY_S / 2, p[1] - CITY_S / 2); if (d < bd) { bd = d; best = c; } });
        best.plate = s.plate; best.subj = s.id; best.sp = 14; subjCar = best;
        setTimeout(() => { if (!root.isConnected) return; lock = best; track = true; $('[data-track]', root).classList.add('on'); banner = { txt: `SUBJECT VEHICLE ACQUIRED — PLATE ${s.plate}`, t: performance.now() }; Sound.ok(); renderLock(); }, 1400);
      }
      renderTgt(); renderLock();
      $$('.aer-trow', root).forEach(b => b.classList.toggle('on', b.dataset.t === t.id));
    };
    const carPos = c => { const off = c.rd.w / 4 * (c.v ? -c.dir : c.dir); return c.v ? [c.rd.x + off, c.pos] : [c.pos, c.rd.y + off]; };
    const renderTgt = () => {
      $('.aer-tgt', root).innerHTML = `<b class="aer-tname">TARGET ${tg.id} · ${esc(tg.name)}</b><span class="mono dim">${esc(tg.note)}</span><span class="mono aer-coord"></span><span class="mono dim">${platform ? `PLATFORM ${esc(platform.id)} ${esc(platform.name)} · ${esc(platform.res)} GSD` : 'PLATFORM SHRIKE-2 UAV · MSN 4471'}</span>`;
    };
    const renderLock = () => {
      const el = $('.aer-lock', root);
      if (!lock) { el.innerHTML = `<p class="dim mono">TAP A VEHICLE TO LOCK ON</p>`; return; }
      const s = lock.subj ? SUBJ(lock.subj) : null;
      el.innerHTML = `<dl class="kv"><dt>Track</dt><dd>TGT-${pad(lock.id, 3)}</dd><dt>Plate</dt><dd class="${s ? 'alert' : ''}">${esc(lock.plate)}</dd><dt>Speed</dt><dd class="aer-spd">—</dd><dt>Heading</dt><dd>${lock.v ? (lock.dir > 0 ? '180° S' : '000° N') : (lock.dir > 0 ? '090° E' : '270° W')}</dd><dt>Owner</dt><dd>${s ? esc(s.name) : 'NO RECORD — QUERYING'}</dd></dl>
        <div class="aer-lk-btns">${s ? `<button class="btn sm alert" data-file>Open file</button>` : ''}<button class="btn sm" data-unlock>Release</button></div>`;
      const f = $('[data-file]', el); if (f) f.onclick = () => WM.open('cif', { subject: s.id });
      $('[data-unlock]', el).onclick = () => { lock = null; track = false; $('[data-track]', root).classList.remove('on'); renderLock(); };
    };
    setTarget(tg, opts.subject);
    const applyMode = () => {
      const img = IC.cv;
      img.style.filter = mode === 'eo' ? 'saturate(.55) contrast(1.08)' : mode === 'wh' ? 'grayscale(1) contrast(1.15)' : mode === 'bh' ? 'grayscale(1) invert(1) contrast(1.15)' : 'grayscale(1) sepia(1) hue-rotate(58deg) saturate(3.2) brightness(.95) contrast(1.15)';
      if ((mode === 'wh' || mode === 'bh') && !ir) ir = CityGen.paint(L, 'ir');
    };
    applyMode();
    $$('.aer-mode button', root).forEach(b => b.onclick = () => { mode = b.dataset.m; $$('.aer-mode button', root).forEach(x => x.classList.toggle('on', x === b)); applyMode(); });
    $$('[data-z]', root).forEach(b => b.onclick = () => { cam.z = clamp(cam.z * (b.dataset.z > 0 ? 1.4 : 1 / 1.4), minZ(), 7); });
    $('[data-track]', root).onclick = e => { track = !track && !!lock; e.currentTarget.classList.toggle('on', track); };
    $('[data-snap]', root).onclick = () => { const f = $('.aer-flash', root); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); banner = { txt: `FRAME ${frame} CAPTURED — SENT TO ANALYST QUEUE`, t: performance.now() }; Sound.beep(1800, .05, 'square', .03); };
    $$('.aer-trow', root).forEach(b => b.onclick = () => setTarget(TARGETS.find(t => t.id === b.dataset.t)));
    const minZ = () => Math.max(IC.w, IC.h) / CITY_S;
    // touch
    const pts = new Map(); let pinch0 = 0, z0 = 1, moved = 0, lastTap = 0;
    const cv = HC.cv; cv.style.touchAction = 'none';
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); z0 = cam.z; } });
    cv.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return;
      const p = pts.get(e.pointerId), dx = e.clientX - p[0], dy = e.clientY - p[1]; pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; cam.z = clamp(z0 * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch0, minZ(), 7); moved += 10; }
      else { moved += Math.abs(dx) + Math.abs(dy); if (moved > 6) { cam.x -= dx / cam.z; cam.y -= dy / cam.z; if (track) { track = false; $('[data-track]', root).classList.remove('on'); } } }
    });
    cv.addEventListener('pointerup', e => {
      if (pts.size === 1 && moved < 8) {
        const r = cv.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
        const now = performance.now();
        let best = null, bd = 22;
        cars.forEach(c => { const [wx, wy] = carPos(c); const X = (wx - cam.x) * cam.z + HC.w / 2, Y = (wy - cam.y) * cam.z + HC.h / 2; const d = Math.hypot(X - sx, Y - sy); if (d < bd) { bd = d; best = c; } });
        if (best) { lock = best; renderLock(); Sound.ok(); banner = { txt: `TRACK TGT-${pad(best.id, 3)} INITIATED`, t: now }; }
        else if (now - lastTap < 320) { cam.x += (sx - HC.w / 2) / cam.z; cam.y += (sy - HC.h / 2) / cam.z; cam.z = clamp(cam.z * 1.6, minZ(), 7); }
        lastTap = now;
      }
      pts.delete(e.pointerId);
    });
    cv.addEventListener('pointercancel', e => pts.delete(e.pointerId));
    cv.addEventListener('wheel', e => { e.preventDefault(); cam.z = clamp(cam.z * (e.deltaY < 0 ? 1.12 : 1 / 1.12), minZ(), 7); }, { passive: false });
    let uiAcc = 0;
    const off = Loop.add((t, dt) => {
      // simulate
      cars.forEach(c => { c.pos += c.sp * c.dir * dt; if (c.pos > CITY_S + 20) c.pos = -20; if (c.pos < -20) c.pos = CITY_S + 20; });
      people.forEach(p => { p.pos += p.sp * dt; if (p.pos > CITY_S) p.pos = 0; if (p.pos < 0) p.pos = CITY_S; });
      if (!IC.visible()) return;
      frame++;
      const w = IC.w, hh = IC.h;
      if (track && lock) { const [lx, ly] = carPos(lock); cam.x = lerp(cam.x, lx, .08); cam.y = lerp(cam.y, ly, .08); }
      const z = cam.z;
      cam.x = clamp(cam.x, w / 2 / z, CITY_S - w / 2 / z); cam.y = clamp(cam.y, hh / 2 / z, CITY_S - hh / 2 / z);
      const jx = Math.sin(t * .7) * 1.2 + Math.sin(t * 2.3) * .4, jy = Math.cos(t * .6) * 1.2;
      const vx0 = cam.x - w / 2 / z + jx / z, vy0 = cam.y - hh / 2 / z + jy / z;
      const ctx = IC.ctx;
      const src = (mode === 'wh' || mode === 'bh') ? ir : eo;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(src, vx0, vy0, w / z, hh / z, 0, 0, w, hh);
      const hot = mode === 'wh' || mode === 'bh';
      const P = hot ? CITY_PAL.ir : CITY_PAL.eo;
      const S2 = (wx, wy) => [(wx - vx0) * z, (wy - vy0) * z];
      people.forEach(p => {
        const off2 = p.rd.w / 2 + 3; const wx = p.v ? p.rd.x + p.side * off2 : p.pos, wy = p.v ? p.pos : p.rd.y + p.side * off2;
        const [X, Y] = S2(wx, wy); if (X < -5 || Y < -5 || X > w + 5 || Y > hh + 5) return;
        const rr = Math.max(1.1, .9 * z);
        ctx.fillStyle = hot ? '#ffffff' : 'rgba(30,30,30,.9)'; ctx.fillRect(X - rr / 2, Y - rr / 2, rr, rr);
      });
      cars.forEach(c => {
        const [wx, wy] = carPos(c); const [X, Y] = S2(wx, wy);
        if (X < -20 || Y < -20 || X > w + 20 || Y > hh + 20) return;
        const L2 = 10 * z, W2 = 4.8 * z;
        ctx.save(); ctx.translate(X, Y); if (c.v) ctx.rotate(c.dir > 0 ? Math.PI / 2 : -Math.PI / 2); else if (c.dir < 0) ctx.rotate(Math.PI);
        ctx.fillStyle = hot ? 'rgba(0,0,0,.35)' : 'rgba(0,0,0,.45)'; ctx.fillRect(-L2 / 2 + 1.5 * z, -W2 / 2 + 1.5 * z, L2, W2);
        ctx.fillStyle = hot ? '#d8d8d8' : P.carCols[c.col % P.carCols.length]; ctx.fillRect(-L2 / 2, -W2 / 2, L2, W2);
        ctx.fillStyle = hot ? '#ffffff' : 'rgba(0,0,0,.4)'; ctx.fillRect(L2 * .12, -W2 / 2 + .5, L2 * .2, W2 - 1);
        if (hot) { ctx.fillStyle = '#ffffff'; ctx.fillRect(L2 * .3, -W2 / 2, L2 * .2, W2); }
        ctx.restore();
      });
      // HUD
      const hc = HC.ctx; hc.clearRect(0, 0, w, hh);
      const A = THEME.acc, A2 = THEME.acc2, cx = w / 2, cy = hh / 2;
      hc.strokeStyle = rgba(A2, .85); hc.lineWidth = 1.2; hc.beginPath();
      hc.moveTo(cx - 60, cy); hc.lineTo(cx - 14, cy); hc.moveTo(cx + 14, cy); hc.lineTo(cx + 60, cy); hc.moveTo(cx, cy - 60); hc.lineTo(cx, cy - 14); hc.moveTo(cx, cy + 14); hc.lineTo(cx, cy + 60);
      for (let k = 1; k <= 5; k++) { hc.moveTo(cx - 14 - k * 9, cy - 3); hc.lineTo(cx - 14 - k * 9, cy + 3); hc.moveTo(cx + 14 + k * 9, cy - 3); hc.lineTo(cx + 14 + k * 9, cy + 3); hc.moveTo(cx - 3, cy - 14 - k * 9); hc.lineTo(cx + 3, cy - 14 - k * 9); hc.moveTo(cx - 3, cy + 14 + k * 9); hc.lineTo(cx + 3, cy + 14 + k * 9); }
      hc.stroke();
      hc.strokeStyle = rgba(A2, .35); hc.beginPath(); hc.arc(cx, cy, 90, 0, Math.PI * 2); hc.stroke();
      brackets(hc, 14, 14, w - 28, hh - 28, 22, rgba(A2, .7), 2);
      // heading tape
      hc.fillStyle = 'rgba(0,0,0,.45)'; hc.fillRect(cx - 150, 18, 300, 26);
      hc.strokeStyle = rgba(A2, .7); hc.lineWidth = 1; hc.beginPath();
      const hd = (Math.sin(t * .2) * 3 + 360) % 360;
      for (let k = -30; k <= 30; k += 5) { const x = cx + (k - (hd > 180 ? hd - 360 : hd)) * 5; if (x < cx - 148 || x > cx + 148) continue; hc.moveTo(x, 18); hc.lineTo(x, k % 10 === 0 ? 28 : 24); if (k % 10 === 0) hudText(hc, pad((k + 360) % 360, 3), x, 40, { size: 9, align: 'center', color: rgba(A2, .8) }); }
      hc.stroke(); hc.fillStyle = rgba(THEME.warn, 1); hc.beginPath(); hc.moveTo(cx, 46); hc.lineTo(cx - 5, 52); hc.lineTo(cx + 5, 52); hc.fill();
      // telemetry
      const lat = tg.lat - (cam.y - CITY_S / 2) * M_PER_PX / 111320, lon = tg.lon + (cam.x - CITY_S / 2) * M_PER_PX / (111320 * Math.cos(tg.lat * D2R));
      const plat = platform ? `${platform.id} ${platform.name} · ${platform.type}` : 'SHRIKE-2 UAV · MSN 4471';
      const modeName = { eo: 'EO DAY', wh: 'IR WHITE-HOT', bh: 'IR BLACK-HOT', nv: 'NIGHT VISION' }[mode];
      [plat, `SENSOR ${modeName}`, platform ? `ALT ${fmtInt(platform.alt)} KM` : `ALT ${fmtInt(18450 + Math.sin(t * .3) * 40)} FT AGL`, `GSD ${(M_PER_PX / z * 100).toFixed(0)} CM/PX`].forEach((s, i) => hudText(hc, s, 26, 70 + i * 16, { size: 11, bg: 'rgba(0,0,0,.5)', color: rgba(A2, .95) }));
      [`TGT ${tg.id} · ${tg.name}`, `${fmtLat(lat)}  ${fmtLon(lon)}`, `${tzTime('UTC')}Z`, `FRAME ${frame}`].forEach((s, i) => hudText(hc, s, w - 26, 70 + i * 16, { size: 11, align: 'right', bg: 'rgba(0,0,0,.5)', color: rgba(A2, .95) }));
      const mpx = 50 / M_PER_PX * z; const bl = mpx > 180 ? mpx / 5 : mpx > 90 ? mpx / 2 : mpx; const bm = mpx > 180 ? 10 : mpx > 90 ? 25 : 50;
      hc.fillStyle = rgba(A2, .9); hc.fillRect(26, hh - 34, bl, 3); hc.fillRect(26, hh - 40, 2, 9); hc.fillRect(26 + bl - 2, hh - 40, 2, 9);
      hudText(hc, `${bm} M`, 26 + bl + 8, hh - 29, { size: 11, color: rgba(A2, .9) });
      hudText(hc, `ZOOM ×${(z / 1.6 * 4).toFixed(1)}  ·  ${modeName}`, w - 26, hh - 28, { size: 11, align: 'right', bg: 'rgba(0,0,0,.5)', color: rgba(A2, .95) });
      // north arrow
      hc.strokeStyle = rgba(A2, .9); hc.lineWidth = 1.5; hc.beginPath(); hc.moveTo(w - 46, 196); hc.lineTo(w - 46, 162); hc.moveTo(w - 52, 170); hc.lineTo(w - 46, 162); hc.lineTo(w - 40, 170); hc.stroke(); hudText(hc, 'N', w - 46, 155, { size: 11, align: 'center', color: rgba(A2, 1) });
      // lock box
      if (lock) {
        const [wx, wy] = carPos(lock); const [X, Y] = S2(wx, wy); const bs = Math.max(26, 18 * z);
        const col = lock.subj ? THEME.alert : THEME.warn;
        brackets(hc, X - bs / 2, Y - bs / 2, bs, bs, 7, rgba(col, 1), 2);
        hc.strokeStyle = rgba(col, .5); hc.lineWidth = 1; hc.beginPath(); hc.moveTo(X + bs / 2, Y - bs / 2); hc.lineTo(X + bs / 2 + 18, Y - bs / 2 - 18); hc.lineTo(X + bs / 2 + 30, Y - bs / 2 - 18); hc.stroke();
        hudText(hc, `TGT-${pad(lock.id, 3)} ${lock.plate}`, X + bs / 2 + 34, Y - bs / 2 - 14, { size: 11, bg: 'rgba(0,0,0,.65)', color: rgba(col, 1) });
        hudText(hc, `${Math.round(lock.sp * M_PER_PX * 3.6)} KM/H`, X + bs / 2 + 34, Y - bs / 2 + 2, { size: 10, color: rgba(col, .95) });
      }
      if (banner) {
        const el = (performance.now() - banner.t) / 1000;
        if (el > 3) banner = null;
        else if (Math.floor(el * 4) % 2 === 0 || el > 1) hudText(hc, banner.txt, cx, hh - 70, { size: 14, align: 'center', bg: 'rgba(0,0,0,.75)', color: rgba(THEME.warn, 1) });
      }
      uiAcc += dt;
      if (uiAcc > .3) {
        uiAcc = 0;
        const co = $('.aer-coord', root); if (co) co.textContent = `${fmtLat(lat)} ${fmtLon(lon)}`;
        const sp = $('.aer-spd', root); if (sp && lock) sp.textContent = `${Math.round(lock.sp * M_PER_PX * 3.6)} KM/H`;
      }
    });
    return {
      onOpts(o) { if (o.platform) platform = o.platform; if (o.target || o.subject) setTarget(TARGETS.find(t => t.id === o.target) || tg, o.subject); },
      destroy() { off(); IC.destroy(); HC.destroy(); }
    };
  }
};
