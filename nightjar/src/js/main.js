/* ============================================================
   Start-up
   ============================================================ */
function init() {
  try { $('#grain').style.backgroundImage = `url(${getNoiseTiles()[0].toDataURL()})`; } catch (e) { /* ignore */ }
  applyTheme();
  window.addEventListener('resize', () => { UI.updateCompact(); WM.relayout(); });
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('contextmenu', e => { if (!e.target.closest('input,textarea')) e.preventDefault(); });
  document.addEventListener('pointerdown', e => { if (e.target.closest('button')) Sound.tap(); }, true);
  if (navigator.wakeLock) {
    const req = () => { try { navigator.wakeLock.request('screen').catch(() => {}); } catch (e) { /* ignore */ } };
    req(); document.addEventListener('visibilitychange', () => { if (!document.hidden) req(); });
  }
  const hash = (location.hash || '').slice(1);
  if (hash === 'desktop' || APPS[hash]) { Login.enter(); if (APPS[hash]) setTimeout(() => WM.open(hash), 300); }
  else if (hash === 'login' || !S.boot) Login.show();
  else Boot.run();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
