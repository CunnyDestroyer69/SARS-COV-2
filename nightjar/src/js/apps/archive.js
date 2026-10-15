/* ============================================================
   CLASSIFIED ARCHIVE — browsable fictional document reader
   ============================================================ */
APPS.archive = {
  title: 'Classified Archive', short: 'Archive', icon: 'archive', code: 'DOC-VAULT', w: 1000, h: 660, cls: 'TS//ORCON',
  create(body, opts, win) {
    const root = h(`<div class="ar">
      <aside class="ar-list panel"><div class="panel-h">Document vault<span class="sp"></span><span class="mono">${DOCS.length}</span></div>
        <label class="ar-q">${icon('search')}<input class="field-in" placeholder="Search vault" autocomplete="off"></label>
        <div class="ar-items scroll"></div></aside>
      <div class="ar-doc"><button class="btn sm ar-back" hidden>${icon('chevL')}Vault</button><div class="ar-paper scroll"></div></div>
    </div>`);
    body.appendChild(root);
    const items = $('.ar-items', root), paper = $('.ar-paper', root), q = $('.ar-q input', root);
    let cur = null, revealed = false;
    const matches = () => { const v = q.value.toUpperCase(); return DOCS.filter(d => !v || (d.title + d.sub + d.body.join(' ')).toUpperCase().includes(v)); };
    const renderList = () => {
      items.innerHTML = matches().map(d => `<button class="ar-item${cur === d ? ' on' : ''}" data-id="${d.id}"><span class="ai-stamp">${esc(d.stamp)}</span><b>${esc(d.title)}</b><small>${esc(d.sub)}</small><span class="mono dim">${esc(d.date)} · ${esc(d.id)}</span></button>`).join('') || '<div class="ar-empty mono">NO DOCUMENTS MATCH</div>';
      $$('.ar-item', items).forEach(b => b.onclick = () => { open(DOCS.find(d => d.id === b.dataset.id)); root.classList.add('reading'); });
    };
    const open = d => {
      cur = d; revealed = false; renderList();
      paper.scrollTop = 0;
      paper.innerHTML = `<article class="doc">
        <div class="doc-cls">${esc(S.classification)}</div>
        <header class="doc-head">
          <div class="doc-seal">${emblem(true)}</div>
          <div class="doc-meta">
            <div class="doc-stamp">${esc(d.stamp)}</div>
            <h1>${esc(d.title)}</h1><h2>${esc(d.sub)}</h2>
            <dl class="doc-kv"><dt>FROM</dt><dd>${esc(d.from)}</dd><dt>TO</dt><dd>${esc(d.to)}</dd><dt>DATE</dt><dd>${esc(d.date)}</dd><dt>CLASS</dt><dd>${esc(d.level)}</dd><dt>DOC ID</dt><dd>${esc(d.id)}-${pad(hash(d.id) % 9999, 4)}</dd></dl>
          </div>
        </header>
        <div class="doc-ctl"><button class="btn sm" data-reveal>Reveal redactions</button><span class="mono dim">${d.body.join(' ').match(/\[\[/g) ? (d.body.join(' ').match(/\[\[/g).length + ' REDACTIONS') : 'NO REDACTIONS'} · READ-ONLY</span></div>
        <div class="doc-body">${d.body.map((p, i) => `<p>${redactHTML(p)}</p>`).join('')}</div>
        <footer class="doc-foot"><div class="doc-sig"><span class="mono">AUTHENTICATED</span><div class="doc-qr"></div></div><div class="mono dim">THIS DOCUMENT IS TRACKED. PRINTING AND EXFILTRATION ARE LOGGED UNDER DIRECTIVE 41-C.<br>ACCESSED BY ${esc(S.operator)} (${esc(S.operatorId)}) · ${tzTime('UTC')}Z</div></footer>
        <div class="doc-cls">${esc(S.classification)}</div>
      </article>`;
      bindRedactions(paper);
      drawQR($('.doc-qr', paper), hash(d.id));
      const rb = $('[data-reveal]', paper);
      rb.onclick = () => {
        revealed = !revealed;
        $$('.redact', paper).forEach(r => { if (revealed && !r.classList.contains('open')) { scramble(r, r.dataset.r); r.classList.add('open'); } else if (!revealed) { r.classList.remove('open'); r.textContent = '█'.repeat(Math.min(18, Math.max(6, r.dataset.r.length))); } });
        rb.textContent = revealed ? 'Hide redactions' : 'Reveal redactions'; rb.classList.toggle('on', revealed);
        Sound[revealed ? 'ok' : 'tap']();
      };
    };
    const drawQR = (el, seed) => {
      const n = 21, r = rng(seed), c = offscreen(n, n), x = c.getContext('2d');
      x.fillStyle = '#d3ebf6'; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (r() < .5) x.fillRect(i, j, 1, 1);
      [[0, 0], [n - 7, 0], [0, n - 7]].forEach(([ox, oy]) => { x.fillStyle = '#d3ebf6'; x.fillRect(ox, oy, 7, 7); x.clearRect(ox + 1, oy + 1, 5, 5); x.fillRect(ox + 2, oy + 2, 3, 3); });
      el.style.cssText = 'width:54px;height:54px;image-rendering:pixelated'; el.appendChild(c); c.style.cssText = 'width:100%;height:100%';
    };
    $('.ar-back', root).onclick = () => root.classList.remove('reading');
    q.addEventListener('input', renderList);
    renderList();
    open(DOCS.find(d => d.id === opts.doc) || DOCS[0]);
    return { onOpts(o) { if (o.doc) { open(DOCS.find(d => d.id === o.doc) || DOCS[0]); root.classList.add('reading'); } }, destroy() {} };
  }
};
