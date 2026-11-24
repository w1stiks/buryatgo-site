/* BuryatGo — веб-версия для Safari / «На экран Домой»: офлайн-кэш и защита сохранения от автоочистки */
window.BG_PWA = (function () {
  const web = /^https?:$/.test(location.protocol);
  const ua = navigator.userAgent || '';
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const standalone = () => window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);

  if (web && 'serviceWorker' in navigator) {
    let reloaded = false;
    const reloadOnce = () => { if (reloaded) return; reloaded = true; location.reload(); };
    navigator.serviceWorker.addEventListener('controllerchange', reloadOnce);
    navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.type === 'reload') reloadOnce(); });
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then(reg => {
        if (reg.waiting) reg.waiting.postMessage({ type: 'skip' });
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) nw.postMessage({ type: 'skip' });
          });
        });
        reg.update().catch(() => {});
      }).catch(() => {});
    });
  }
  /* Просим браузер не удалять сохранение при нехватке места */
  if (web && navigator.storage && navigator.storage.persist) {
    navigator.storage.persisted().then(p => { if (!p) return navigator.storage.persist(); }).catch(() => {});
  }

  return {
    web,
    ios,
    standalone,
    /* Подсказку «Добавьте на экран Домой» показываем в Safari на iPhone/iPad вне режима приложения */
    needsInstall: () => web && ios && !standalone()
  };
})();
