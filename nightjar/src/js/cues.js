/* ============================================================
   Scene cues (triggered by crew from the hidden panel) and the
   prop-control panel itself.
   ============================================================ */
const Cue = {
  live: {},
  fx() { return $('#fx'); },
  kill(name) { const c = this.live[name]; if (c) { try { c.off && c.off(); } catch (e) { /* ignore */ } c.el && c.el.remove(); delete this.live[name]; } },
  clear() {
    Object.keys(this.live).forEach(k => this.kill(k));
    $('#app').classList.remove('glitch');
    if (THEME.alertMode) { THEME.alertMode = false; applyTheme(); }
    const al = $('#alvl'); if (al) $$('i', al).forEach((i, k) => { i.className = k < 3 ? 'on' : ''; });
    const wl = $('#wgLevel'); if (wl) { wl.textContent = 'ELEVATED'; wl.style.color = ''; }
  },
  box(name, cls, sub, main, foot, ms) {
    this.kill(name);
    const el = h(`<div class="cue-wrap dim"><div class="cue-box ${cls}"><div class="c-sub">${esc(sub)}</div><div class="c-main">${esc(main)}</div><div class="c-foot">${esc(foot)}</div></div></div>`);
    el.onclick = () => this.kill(name);
    this.fx().appendChild(el);
    let tm = null;
    if (ms) tm = setTimeout(() => this.kill(name), ms);
    this.live[name] = { el, off: () => clearTimeout(tm) };
  },
  denied() { Sound.err(); this.box('denied', 'c-red', `${S.osName} security`, 'Access denied', `CLEARANCE INSUFFICIENT — INCIDENT LOGGED ${tzTime('UTC')}Z`, 3500); },
  granted() { Sound.ok(); this.box('granted', 'c-ok', `${S.osName} security`, 'Access granted', `LEVEL 5 AUTHORIZATION — ${S.operator}`, 3000); },
  intrusion() {
    this.kill('intrusion');
    Sound.alarm();
    THEME.alertMode = true; applyTheme();
    const al = $('#alvl'); if (al) $$('i', al).forEach(i => { i.className = 'on hot'; });
    const wl = $('#wgLevel'); if (wl) { wl.textContent = 'CRITICAL'; wl.style.color = 'var(--alert)'; }
    const el = h(`<div><div class="cue-intrusion"></div><div class="cue-banner">${icon('alert', 'cb-ic')}<div><b>Intrusion detected</b><span>UNAUTHORIZED ACCESS FROM 198.51.100.23 — COUNTER-TRACE ACTIVE</span></div><div class="cb-trace"><small>TRACE</small><span id="cueTrace">00%</span></div></div></div>`);
    this.fx().appendChild(el);
    let p = 0;
    const off = Loop.add((t, dt) => {
      p = Math.min(99, p + dt * (2 + Math.random() * 7));
      const tr = $('#cueTrace'); if (tr) tr.textContent = pad(Math.floor(p)) + '%';
    });
    const iv = setInterval(() => Sound.alarm(), 2400);
    el.querySelector('.cue-banner').onclick = () => this.kill('intrusion');
    this.live.intrusion = { el, off: () => { off(); clearInterval(iv); THEME.alertMode = false; applyTheme(); const a = $('#alvl'); if (a) $$('i', a).forEach((i, k) => { i.className = k < 3 ? 'on' : ''; }); const w = $('#wgLevel'); if (w) { w.textContent = 'ELEVATED'; w.style.color = ''; } } };
  },
  lockdown() {
    this.kill('lockdown'); Sound.err();
    const el = h(`<div class="cue-lock"><div class="cue-box c-amb"><div class="c-sub">Protocol BLACKOUT invoked</div><div class="c-main">System lockdown</div><div class="c-foot">ALL SESSIONS SUSPENDED · AWAITING DIRECTOR AUTHORIZATION</div></div></div>`);
    this.fx().appendChild(el);
    this.live.lockdown = { el };
  },
  match(id) {
    const s = SUBJ(id || S.matchSubject) || SUBJECTS[0];
    this.kill('match'); Sound.ok();
    const el = h(`<div class="cue-wrap dim"><div class="cue-box c-acc"><div class="cue-match"><canvas></canvas><div>
      <div class="c-sub">Biometric correlation complete</div><div class="c-main">Match found</div>
      <div class="c-name">${esc(s.name)}</div><div class="c-foot" style="margin-top:6px">${esc(s.idLong)} · CONFIDENCE 98.7%</div>
      <div class="c-row"><span class="tag ${STATUS[s.status] ? STATUS[s.status].cls : 't-acc'}">${esc(s.status)}</span><button class="btn sm" data-open>Open file</button></div></div></div></div></div>`);
    const cv = el.querySelector('canvas');
    cv.width = 300; cv.height = 360;
    cv.getContext('2d').drawImage(portrait(s, 300, 360), 0, 0);
    el.onclick = e => { if (e.target.closest('[data-open]')) { this.kill('match'); WM.open('cif', { subject: s.id }); } else if (e.target === el) this.kill('match'); };
    this.fx().appendChild(el);
    this.live.match = { el };
  },
  incoming() {
    this.kill('incoming'); Sound.ok();
    const el = h(`<div class="cue-wrap dim"><div class="cue-box c-acc cue-msg"><div class="c-head"><div><div class="c-sub">Incoming secure transmission</div><div class="c-main">Priority message</div></div><span class="tag t-red blink">FLASH</span></div>
      <div class="c-body"><span class="tx"></span><i class="cur"></i></div><div class="c-foot" style="margin-top:10px;display:flex;justify-content:space-between;gap:10px"><span>FROM: OFFICE OF THE DIRECTOR</span><span>TAP TO CLOSE</span></div></div></div>`);
    this.fx().appendChild(el);
    const off = typeOut(el.querySelector('.tx'), S.transmission, 34);
    el.onclick = () => this.kill('incoming');
    this.live.incoming = { el, off };
  },
  glitch(ms = 1200) {
    const app = $('#app');
    app.classList.add('glitch');
    Sound.beep(90, .4, 'sawtooth', .05, 3);
    clearTimeout(this.gt); this.gt = setTimeout(() => app.classList.remove('glitch'), ms);
  },
  countdown(sec) {
    sec = sec || S.countdown || 30;
    this.kill('countdown');
    const el = h(`<div class="cue-count"><small>Terminal purge in</small><b>00:00</b><div class="meter"><i></i></div></div>`);
    this.fx().appendChild(el);
    const t0 = performance.now();
    let lastS = -1;
    const off = Loop.add(() => {
      const left = Math.max(0, sec - (performance.now() - t0) / 1000);
      const s = Math.ceil(left);
      el.querySelector('b').textContent = `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
      el.querySelector('.meter i').style.width = (left / sec * 100) + '%';
      if (s !== lastS) { lastS = s; if (s <= 10 && s > 0) Sound.beep(1200, .08, 'square', .04); }
      if (left <= 0) { off(); this.kill('countdown'); this.signal(); }
    });
    el.onclick = () => this.kill('countdown');
    this.live.countdown = { el, off };
  },
  signal() {
    this.kill('signal');
    const el = h(`<div class="cue-signal"><div class="cs-label">NO SIGNAL</div></div>`);
    const C = makeCanvas(el, { cls: 'fill', maxDpr: 1 });
    el.prepend(C.cv);
    this.fx().appendChild(el);
    C.fit();
    const tiles = getNoiseTiles();
    const off = Loop.add((t) => {
      const ctx = C.ctx; const tl = tiles[Math.floor(t * 30) % tiles.length];
      for (let y = 0; y < C.h; y += 192) for (let x = 0; x < C.w; x += 192) ctx.drawImage(tl, x - (t * 997 % 192), y);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, C.w, C.h);
      const by = (t * 220) % (C.h + 80) - 40; ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(0, by, C.w, 30);
    });
    el.onclick = () => this.kill('signal');
    this.live.signal = { el, off: () => { off(); C.destroy(); } };
  }
};

const CUE_LIST = [
  ['denied', 'Access denied', 'red'], ['granted', 'Access granted', 'grn'], ['intrusion', 'Intrusion alert', 'red'], ['lockdown', 'Lockdown', ''],
  ['match', 'Match found', 'blu'], ['incoming', 'Incoming message', 'blu'], ['glitch', 'Screen glitch', ''], ['countdown', 'Countdown', 'red'],
  ['signal', 'No signal', ''], ['clear', 'Clear all cues', 'wide']
];

const Director = {
  open() {
    if ($('#director')) return;
    const d = h(`<aside id="director" aria-label="Prop control">
      <div class="dr-head"><div><b>PROP CONTROL</b><small>Crew only · hidden from the in-world OS</small></div><button aria-label="Close panel">${icon('close')}</button></div>
      <div class="dr-body scroll">
        <h4>Cues</h4>
        <p class="dr-note">Tap to trigger on screen. Tap the overlay to dismiss it. With a keyboard: Ctrl+1 to Ctrl+9, Ctrl+0 clears.</p>
        <div class="dr-cues">${CUE_LIST.map((c, i) => `<button data-cue="${c[0]}" class="${c[2]}"><i></i>${esc(c[1])}${i < 9 ? `<span style="margin-left:auto;opacity:.5;font-family:var(--f-data);font-weight:400">^${i + 1}</span>` : ''}</button>`).join('')}</div>
        <div class="dr-row"><label for="drMatch">Match subject</label><select id="drMatch">${SUBJECTS.map(s => `<option value="${s.id}"${s.id === S.matchSubject ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>
        <div class="dr-row"><label for="drCount">Countdown (s)</label><input id="drCount" class="field-in" type="number" min="3" max="3600" value="${S.countdown}"></div>
        <div class="dr-row" style="align-items:flex-start"><label for="drMsg">Message text</label><textarea id="drMsg" class="field-in" rows="4">${esc(S.transmission)}</textarea></div>
        <h4>Look</h4>
        <div class="dr-row"><label>Accent color</label><div class="sw">${Object.keys(ACCENTS).map(k => `<button data-acc="${k}" title="${ACCENTS[k].name}" style="background:rgb(${ACCENTS[k].acc.join(',')})" class="${S.accent === k ? 'on' : ''}" aria-label="${ACCENTS[k].name}"></button>`).join('')}</div></div>
        <div class="dr-row"><label>Film grain</label><div class="tgl"><button data-tgl="grain" class="${S.grain ? 'on' : ''}">${S.grain ? 'ON' : 'OFF'}</button></div></div>
        <div class="dr-row"><label>Scanlines</label><div class="tgl"><button data-tgl="scanlines" class="${S.scanlines ? 'on' : ''}">${S.scanlines ? 'ON' : 'OFF'}</button></div></div>
        <p class="dr-note">Scanlines can cause moiré on camera. Test before you shoot.</p>
        <div class="dr-row"><label>UI sounds</label><div class="tgl"><button data-tgl="sound" class="${S.sound ? 'on' : ''}">${S.sound ? 'ON' : 'OFF'}</button></div></div>
        <div class="dr-row"><label>Boot sequence</label><div class="tgl"><button data-tgl="boot" class="${S.boot ? 'on' : ''}">${S.boot ? 'ON' : 'OFF'}</button></div></div>
        <h4>Names and text</h4>
        <div class="dr-row"><label for="drOs">OS name</label><input id="drOs" class="field-in" value="${esc(S.osName)}"></div>
        <div class="dr-row"><label for="drAg">Agency</label><input id="drAg" class="field-in" value="${esc(S.agency)}"></div>
        <div class="dr-row"><label for="drAgS">Agency initials</label><input id="drAgS" class="field-in" value="${esc(S.agencyShort)}"></div>
        <div class="dr-row"><label for="drOp">Operator</label><input id="drOp" class="field-in" value="${esc(S.operator)}"></div>
        <div class="dr-row"><label for="drOpId">Operator ID</label><input id="drOpId" class="field-in" value="${esc(S.operatorId)}"></div>
        <div class="dr-row"><label for="drCls">Banner</label><input id="drCls" class="field-in" value="${esc(S.classification)}"></div>
        <div class="dr-row"><label for="drPin">Login passcode</label><input id="drPin" class="field-in" inputmode="numeric" maxlength="6" placeholder="Any 4+ digits" value="${esc(S.pin)}"></div>
        <p class="dr-note">Leave the passcode empty to accept any 4 or more digits. Set one if the actor should get "Access denied" on a wrong code.</p>
        <h4>Subject files</h4>
        <div class="dr-row"><label>Edit mode</label><div class="tgl"><button data-edit class="${UI.editMode ? 'on' : ''}">${UI.editMode ? 'ON' : 'OFF'}</button></div></div>
        <p class="dr-note">With edit mode on, tap any outlined text in Civilian Information Files to retype it, and tap a portrait to replace it with an actor's photo. Changes stay on this device.</p>
        <div class="dr-actions"><button data-act="resetSubj">Reset subject edits</button></div>
        <h4>Session</h4>
        <div class="dr-actions"><button data-act="lock">Lock screen</button><button data-act="reboot">Restart (boot)</button><button data-act="off">Shut down</button><button data-act="closeAll">Close all windows</button><button data-act="fullscreen">Full screen</button><button data-act="resetAll">Reset everything</button></div>
        <p class="dr-note" id="drMsgLine"></p>
      </div></aside>`);
    $('#app').appendChild(d);
    d.querySelector('.dr-head button').onclick = () => this.close();
    $$('[data-cue]', d).forEach(b => b.onclick = () => this.fire(b.dataset.cue));
    $$('[data-acc]', d).forEach(b => b.onclick = () => { S.accent = b.dataset.acc; saveSettings(); applyTheme(); $$('[data-acc]', d).forEach(x => x.classList.toggle('on', x === b)); });
    $$('[data-tgl]', d).forEach(b => b.onclick = () => { const k = b.dataset.tgl; S[k] = !S[k]; saveSettings(); applyTheme(); b.classList.toggle('on', S[k]); b.textContent = S[k] ? 'ON' : 'OFF'; if (k === 'sound' && S.sound) Sound.ok(); });
    const eb = d.querySelector('[data-edit]');
    eb.onclick = () => { UI.editMode = !UI.editMode; eb.classList.toggle('on', UI.editMode); eb.textContent = UI.editMode ? 'ON' : 'OFF'; $('#app').classList.toggle('edit-mode', UI.editMode); Bus.emit('editmode'); };
    const bindIn = (id, key, after) => { const el = $('#' + id, d); el.addEventListener('input', () => { S[key] = el.value; saveSettings(); if (after) after(); }); };
    bindIn('drOs', 'osName', () => Desktop.refreshText());
    bindIn('drAg', 'agency', () => Desktop.refreshText());
    bindIn('drAgS', 'agencyShort', () => Desktop.refreshText());
    bindIn('drOp', 'operator', () => Desktop.refreshText());
    bindIn('drOpId', 'operatorId');
    bindIn('drCls', 'classification', () => Desktop.refreshText());
    bindIn('drMsg', 'transmission');
    const pinEl = $('#drPin', d); pinEl.addEventListener('input', () => { pinEl.value = pinEl.value.replace(/\D/g, '').slice(0, 6); S.pin = pinEl.value; saveSettings(); });
    const cnt = $('#drCount', d); cnt.addEventListener('input', () => { S.countdown = clamp(parseInt(cnt.value, 10) || 30, 3, 3600); saveSettings(); });
    $('#drMatch', d).onchange = e => { S.matchSubject = e.target.value; saveSettings(); };
    $$('[data-act]', d).forEach(b => b.onclick = () => this.act(b.dataset.act));
  },
  close() { const d = $('#director'); if (d) d.remove(); },
  fire(name) {
    if (name === 'clear') return Cue.clear();
    if (name === 'countdown') return Cue.countdown(S.countdown);
    if (Cue[name]) Cue[name]();
  },
  note(t) { const n = $('#drMsgLine'); if (n) n.textContent = t; },
  act(a) {
    if (a === 'resetSubj') { Store.del('subjects'); this.note('Subject edits cleared. Reloading…'); setTimeout(() => location.reload(), 600); return; }
    if (a === 'resetAll') { ['settings', 'subjects', 'hintSeen'].forEach(k => Store.del(k)); this.note('Everything reset. Reloading…'); setTimeout(() => location.reload(), 600); return; }
    if (a === 'closeAll') { WM.closeAll(); return; }
    if (a === 'fullscreen') {
      const el = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) { try { const p = req.call(el); if (p && p.catch) p.catch(() => this.note('Full screen is not available here. On iPad, use Share → Add to Home Screen, or Guided Access.')); } catch (e) { this.note('Full screen is not available here.'); } }
      else this.note('Full screen is not available here. On iPad, use Share → Add to Home Screen, or Guided Access.');
      return;
    }
    this.close();
    Session[a]();
  }
};

document.addEventListener('keydown', e => {
  if (e.key === '`' && !e.target.closest('input,textarea,[contenteditable="true"]')) { $('#director') ? Director.close() : Director.open(); return; }
  if ((e.ctrlKey || e.metaKey) && /^[0-9]$/.test(e.key)) {
    e.preventDefault();
    const n = parseInt(e.key, 10);
    if (n === 0) Cue.clear(); else if (CUE_LIST[n - 1]) Director.fire(CUE_LIST[n - 1][0]);
  }
});
