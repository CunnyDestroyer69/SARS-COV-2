/* ============================================================
   Boot sequence, login, session control.
   ============================================================ */
const Boot = {
  timer: null,
  run() {
    const el = $('#boot');
    $('#login').hidden = true; $('#os').hidden = true;
    el.hidden = false; el.className = 'screen';
    el.innerHTML = `<div class="bt-log" id="btLog"></div>
      <div class="bt-center"><div class="bt-mark">${emblem(true)}<b>${esc(S.osName)}</b><span>${esc(S.agency)}</span>
      <div class="bt-prog"><div class="meter"><i id="btBar" style="width:0%"></i></div><div class="mono"><span id="btStep">ESTABLISHING SECURE LINK</span><span id="btPct">0%</span></div></div></div></div>
      <div class="bt-skip">TAP TO SKIP</div>`;
    const lines = [
      ['h', `${S.osName} SECURE KERNEL ${S.osVersion} — ${S.agencyShort.toUpperCase()} BUILD 2026.10.14`],
      ['', '(C) ' + S.agency.toUpperCase() + ' — UNAUTHORIZED USE PROHIBITED'],
      ['', ''],
      ['', 'CPU0  TRUSTED EXECUTION ENVIRONMENT ............', 'OK'],
      ['', 'TPM   MEASURED BOOT CHAIN (14 STAGES) ..........', 'OK'],
      ['', 'MEM   65536 MB ECC — SELF TEST .................', 'OK'],
      ['', 'CRYPT HARDWARE KEYSTORE UNSEALED ...............', 'OK'],
      ['', 'NET   TEMPEST SHIELDING VERIFIED ...............', 'OK'],
      ['', 'NET   SECURE ENCLAVE LINK  SIPR/NJ-7 ...........', 'OK'],
      ['', 'NET   QUANTUM KEY DISTRIBUTION — 4 NODES .......', 'OK'],
      ['w', 'SAT   GANNET-3 TELEMETRY .......................', 'DEGRADED'],
      ['', 'SAT   CONSTELLATION HANDSHAKE 7/8 ..............', 'OK'],
      ['', 'DB    CIVILIAN INFORMATION FILES (2.3B RECORDS) ', 'MOUNTED'],
      ['', 'DB    BIOMETRIC INDEX (FINGERPRINT / FACIAL) ...', 'MOUNTED'],
      ['', 'DB    SIGNALS ARCHIVE (RETENTION 30D) ..........', 'MOUNTED'],
      ['', 'SVC   CCTV AGGREGATION — 41,207 FEEDS ..........', 'ONLINE'],
      ['', 'SVC   LPR NETWORK — 9,812 READERS ..............', 'ONLINE'],
      ['', 'SVC   CARRIER METADATA BROKER ..................', 'ONLINE'],
      ['', 'SVC   ORBITAL TASKING SCHEDULER ................', 'ONLINE'],
      ['', 'SEC   INTRUSION DETECTION — HEURISTIC MODE .....', 'ARMED'],
      ['', 'SEC   AUDIT LOGGING — WORM STORAGE .............', 'ARMED'],
      ['', ''],
      ['h', `LOADING ${S.osName} INTEGRATED ENVIRONMENT...`]
    ];
    const log = $('#btLog');
    let i = 0, done = false;
    const finish = () => { if (done) return; done = true; clearTimeout(this.timer); el.hidden = true; Login.show(); };
    el.onclick = finish;
    const next = () => {
      if (done) return;
      if (i < lines.length) {
        const L = lines[i++];
        const d = document.createElement('div');
        d.className = L[0];
        d.innerHTML = esc(L[1]) + (L[2] ? ` [ <b>${esc(L[2])}</b> ]` : '');
        log.appendChild(d);
        Sound.type();
        this.timer = setTimeout(next, L[1] === '' ? 160 : 55 + Math.random() * 90);
        return;
      }
      el.classList.add('phase2');
      Sound.open();
      const steps = ['ESTABLISHING SECURE LINK', 'VERIFYING CRYPTOGRAPHIC KEYS', 'MOUNTING ENCRYPTED VOLUMES', 'SYNCHRONIZING ORBITAL ASSETS', 'READY'];
      const t0 = performance.now(), dur = 2200;
      const off = Loop.add(() => {
        if (done) { off(); return; }
        const p = clamp((performance.now() - t0) / dur, 0, 1);
        $('#btBar').style.width = (p * 100).toFixed(1) + '%';
        $('#btPct').textContent = Math.floor(p * 100) + '%';
        $('#btStep').textContent = steps[Math.min(steps.length - 1, Math.floor(p * (steps.length - 1) + .02))];
        if (p >= 1) { off(); this.timer = setTimeout(finish, 450); }
      });
    };
    next();
  }
};

const Login = {
  built: false, pin: '', bgOff: null,
  show() {
    const el = $('#login');
    $('#os').hidden = true;
    el.hidden = false;
    this.build();
    this.pin = ''; this.renderPin();
    this.status('AWAITING AUTHENTICATION', '');
    this.fpProgress = 0; this.drawFp();
  },
  build() {
    const el = $('#login');
    el.innerHTML = `
      <div class="classbar lg-class"><span>${esc(S.classification)}</span></div>
      <div class="lg-wrap">
        <div class="lg-card brk" id="lgCard">
          <div class="lg-head">${emblem(true)}<div><b>${esc(S.osName)}</b><span>${esc(S.agency)}</span></div></div>
          <div class="lg-warn">Restricted system — authorized personnel only</div>
          <div class="lg-id"><span>OPERATOR <b>${esc(S.operator)}</b></span><span>ID <b>${esc(S.operatorId)}</b></span><span><b>${esc(S.terminal)}</b></span></div>
          <div class="lg-main">
            <div class="lg-bio">
              <button class="fp-pad" id="fpPad" aria-label="Fingerprint scanner: press and hold">
                <svg class="fp-ring" viewBox="0 0 136 156" preserveAspectRatio="none"><path d="M1 1H135V155H1Z" fill="none" stroke="rgba(var(--acc-rgb),.18)" stroke-width="2"/><path id="fpRing" d="M1 1H135V155H1Z" fill="none" stroke="var(--acc)" stroke-width="3" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/></svg>
                <span class="fp-line"></span>
              </button>
              <span>Press and hold to scan</span>
            </div>
            <div class="lg-or">OR</div>
            <div class="lg-pin">
              <div class="pin-dots" id="pinDots"></div>
              <div class="keypad" id="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-k="${n}">${n}</button>`).join('')}<button class="k-fn" data-k="clr">CLR</button><button data-k="0">0</button><button class="k-fn" data-k="ent">ENTER</button></div>
              <span>Passcode</span>
            </div>
          </div>
          <div class="lg-status mono" id="lgStatus"><b>AWAITING AUTHENTICATION</b><span>SESSION ${pad(Math.floor(Math.random() * 9999), 4)}</span></div>
        </div>
        <p class="lg-legal">This terminal and every network it connects to are monitored and recorded. Use of this system is consent to monitoring. Unauthorized access, or attempted access, is prosecuted under Directive 41-C. All activity is logged to write-once storage.</p>
      </div>`;
    // background
    if (this.bgOff) this.bgOff();
    const C = makeCanvas(el, { cls: 'fill lg-bg' });
    el.prepend(C.cv);
    let map = null;
    C.onresize = () => { map = flatWorld(C.w, C.h, { landA: .14, homeA: .22, grid: false }); };
    C.onresize();
    const cols = Array.from({ length: 2 }, () => Array.from({ length: 60 }, () => Math.random().toString(16).slice(2, 10).toUpperCase()));
    this.bgOff = Loop.add((t) => {
      if (el.hidden || !C.visible()) return;
      const ctx = C.ctx, w = C.w, hh = C.h;
      ctx.fillStyle = '#03070b'; ctx.fillRect(0, 0, w, hh);
      if (map) ctx.drawImage(map.canvas, 0, 0, w, hh);
      const cx = w / 2, cy = hh / 2, R = Math.min(w, hh) * .46;
      const A = THEME.acc;
      [[R, .5, 60, .16], [R * .86, -.8, 24, .12], [R * 1.08, .25, 120, .08]].forEach(([r, sp, n, a]) => {
        ctx.strokeStyle = rgba(A, a); ctx.lineWidth = 2; ctx.beginPath();
        for (let k = 0; k < n; k++) { const a0 = t * sp * .3 + k * Math.PI * 2 / n; ctx.moveTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r); ctx.arc(cx, cy, r, a0, a0 + Math.PI * 2 / n * .6); }
        ctx.stroke();
      });
      const sa = t * .9;
      for (let k = 0; k < 24; k++) {
        ctx.fillStyle = rgba(A, .05 * (1 - k / 24)); ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R * .86, sa - (k + 1) * .03, sa - k * .03); ctx.closePath(); ctx.fill();
      }
      ctx.font = '11px "Share Tech Mono", monospace'; ctx.textAlign = 'left';
      cols.forEach((col, ci) => {
        const x = ci ? w - 86 : 16, off = (t * (ci ? 22 : 30)) % 18;
        for (let k = 0; k < col.length; k++) {
          const y = 40 + k * 18 - off; if (y > hh) break;
          ctx.fillStyle = rgba(A, (k * 7 + ci * 3) % 11 === 0 ? .55 : .14);
          ctx.fillText(col[(k + Math.floor(t * (ci ? 1.2 : 1.6))) % col.length], x, y);
        }
      });
    });
    // keypad
    $$('#keypad button').forEach(b => b.onclick = () => this.key(b.dataset.k));
    // fingerprint
    const padEl = $('#fpPad');
    const fpc = makeCanvas(padEl, { cls: 'fill' });
    padEl.prepend(fpc.cv);
    this.fpc = fpc;
    fpc.onresize = () => this.drawFp();
    let raf = null, t0 = 0;
    const startScan = e => {
      e.preventDefault();
      if (this.busy) return;
      padEl.classList.add('scanning'); t0 = performance.now(); Sound.scan();
      this.status('SCANNING — HOLD STEADY', '');
      cancelAnimationFrame(raf);
      const step = () => {
        const p = clamp((performance.now() - t0) / 1600, 0, 1);
        this.fpProgress = p; this.drawFp();
        $('#fpRing').style.strokeDashoffset = String(100 - p * 100);
        if (p >= 1) { padEl.classList.remove('scanning'); this.success('BIOMETRIC MATCH 99.2%'); return; }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const stopScan = () => {
      if (!padEl.classList.contains('scanning')) return;
      cancelAnimationFrame(raf); padEl.classList.remove('scanning');
      if (this.fpProgress < 1) { this.fpProgress = 0; this.drawFp(); $('#fpRing').style.strokeDashoffset = '100'; this.status('SCAN INCOMPLETE — PRESS AND HOLD', 'bad'); Sound.err(); }
    };
    padEl.addEventListener('pointerdown', startScan);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => padEl.addEventListener(t, stopScan));
    padEl.addEventListener('contextmenu', e => e.preventDefault());
    if (!this.keyBound) {
      this.keyBound = true;
      document.addEventListener('keydown', e => {
        if ($('#login').hidden || e.target.closest('input,textarea,select,[contenteditable="true"]')) return;
        if (/^[0-9]$/.test(e.key)) this.key(e.key);
        else if (e.key === 'Enter') this.key('ent');
        else if (e.key === 'Backspace' || e.key === 'Escape') this.key('clr');
      });
    }
    this.busy = false;
  },
  drawFp() {
    const c = this.fpc; if (!c || !c.w) return;
    const ctx = c.ctx, w = c.w, hh = c.h;
    ctx.clearRect(0, 0, w, hh);
    const fp = fingerprint(4471, Math.round(w * c.dpr * .78), Math.round(hh * c.dpr * .8), THEME.acc);
    const fw = w * .78, fh = hh * .8, fx = (w - fw) / 2, fy = (hh - fh) / 2;
    ctx.globalAlpha = .18; ctx.drawImage(fp.canvas, fx, fy, fw, fh); ctx.globalAlpha = 1;
    if (this.fpProgress > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, fy + fh * this.fpProgress); ctx.clip();
      ctx.drawImage(fp.canvas, fx, fy, fw, fh); ctx.restore();
    }
  },
  renderPin() {
    const n = Math.max(4, Math.min(6, Math.max(this.pin.length, (S.pin || '').length || 4)));
    $('#pinDots').innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i < this.pin.length ? 'on' : ''}"></i>`).join('');
  },
  key(k) {
    if (this.busy) return;
    if (k === 'clr') { this.pin = ''; this.renderPin(); this.status('AWAITING AUTHENTICATION', ''); return; }
    if (k === 'ent') {
      const want = String(S.pin || '');
      if ((want && this.pin === want) || (!want && this.pin.length >= 4)) this.success('PASSCODE ACCEPTED');
      else {
        this.attempts = (this.attempts || 0) + 1;
        this.status(`ACCESS DENIED — ATTEMPT ${this.attempts} OF 3`, 'bad'); Sound.err();
        const c = $('#lgCard'); c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake');
        this.pin = ''; this.renderPin();
      }
      return;
    }
    if (this.pin.length >= 6) return;
    this.pin += k; this.renderPin();
  },
  status(txt, cls) { const s = $('#lgStatus'); if (!s) return; s.className = 'lg-status mono ' + (cls || ''); s.firstElementChild.textContent = txt; },
  success(how) {
    this.busy = true; this.attempts = 0;
    this.status(`${how} — WELCOME, ${S.operator}`, 'good'); Sound.ok();
    setTimeout(() => this.enter(), 1100);
  },
  enter() {
    $('#login').hidden = true;
    const os = $('#os');
    os.hidden = false;
    if (!Desktop.built) Desktop.build();
    UI.updateCompact();
    WM.relayout();
    os.classList.remove('power-on'); void os.offsetWidth; os.classList.add('power-on');
    if (!Store.get('hintSeen', false)) setTimeout(showHint, 1400);
  }
};
function showHint() {
  if ($('.toast')) return;
  const t = h(`<div class="toast" role="status"><span><b>PROP CONTROL:</b> press and hold the clocks in the top bar, or tap the ${esc(S.osName)} logo 5 times, to open the hidden crew panel with cues and settings.</span><button aria-label="Dismiss">${icon('close')}</button></div>`);
  t.querySelector('button').onclick = () => { Store.set('hintSeen', true); t.remove(); };
  $('#app').appendChild(t);
  setTimeout(() => { if (t.isConnected) t.remove(); }, 12000);
}

const Session = {
  lock() { Cue.clear(); Login.show(); },
  reboot() { Cue.clear(); WM.closeAll(); Boot.run(); },
  off() {
    Cue.clear(); WM.closeAll();
    const fx = $('#fx');
    const o = h(`<div class="cue-wrap" style="background:#000;cursor:pointer"><div class="mono" style="color:var(--ink-faint);letter-spacing:.2em;font-size:13px">SESSION TERMINATED — TAP TO START</div></div>`);
    fx.appendChild(o);
    setTimeout(() => { const m = o.firstElementChild; if (m) m.style.transition = 'opacity 1.5s', m.style.opacity = '0'; }, 2500);
    o.onclick = () => { o.remove(); Boot.run(); };
  }
};
