/* BuryatGo — логика приложения: навигация, уроки, магазин, профиль, лиги, настройки, paywall */
(function () {
  'use strict';
  const APP_VERSION = 'BETA 1.10.10';

  // Global lesson swipe-down lock
  (function lockLessonSwipe() {
    let sy = 0;
    document.addEventListener('touchstart', e => {
      if (ui.view !== 'lesson') return;
      sy = e.touches[0].clientY;
    }, { passive: true, capture: true });
    document.addEventListener('touchmove', e => {
      if (ui.view !== 'lesson') return;
      const dy = e.touches[0].clientY - sy;
      const body = document.getElementById('lBody');
      // Block pull-down when at top of lesson
      if (dy > 6 && body && body.scrollTop <= 1) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, { passive: false, capture: true });
  })();

  const D = window.BG_DATA, S = window.BG_STORE, A = window.BG_AUDIO, M = window.BG_MASCOT;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const st = () => S.state;
  const NAME_MAX = 10;
  if (S.state && S.state.name && Array.from(S.state.name).length > NAME_MAX) { S.state.name = Array.from(S.state.name).slice(0, NAME_MAX).join('').trim(); S.save(); }

  /* ───────────────── Утилиты ───────────────── */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function shuffle(a, rnd) { rnd = rnd || Math.random; a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  const sample = (a, n) => shuffle(a).slice(0, n);
  const uniq = a => Array.from(new Set(a));
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  function plural(n, f) { const a = Math.abs(n) % 100, b = a % 10; if (a > 10 && a < 20) return f[2]; if (b > 1 && b < 5) return f[1]; if (b === 1) return f[0]; return f[2]; }
  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const WD = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  function humanDate(k) { const d = S.parseDay(k); return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  const norm = s => String(s).toLowerCase().replace(/ё/g, 'е').replace(/[.,!?;:«»"—–-]/g, '').replace(/\s+/g, ' ').trim();
  const BZ_IMG = '<img class=bz-img src=assets/images/buuza.png alt=Бууза draggable=false>';
  const GER_SVG = window.BG_ART.yurtSvg('ger-svg');
  const STEPPE_SVG = window.BG_ART.steppe();

  /* Огонёк (анимированное пламя) — замена свечи в окне серии */
  function flameSvg(on, size) {
    size = size || 92;
    return `<svg class="flame ${on ? 'on' : 'off'}" width="${size}" height="${Math.round(size * 1.2)}" viewBox="0 0 100 120" role="img" aria-label="Огонёк">
      <defs><radialGradient id="flG" cx="50%" cy="72%" r="62%"><stop offset="0" stop-color="#FFF3B0"/><stop offset=".45" stop-color="#FFC21A"/><stop offset="1" stop-color="#FF5A00"/></radialGradient></defs>
      <ellipse class="fl-glow" cx="50" cy="110" rx="30" ry="6" fill="rgba(255,110,0,.28)"/>
      <g class="fl-body"><path class="fl-outer" d="M50 6 C62 30 86 44 84 74 C82 98 66 110 50 110 C34 110 18 98 16 74 C15 56 26 46 32 34 C34 48 40 54 46 56 C44 36 42 22 50 6 Z" fill="url(#flG)"/>
      <path class="fl-inner" d="M50 50 C58 64 68 72 66 88 C64 100 57 104 50 104 C43 104 36 100 34 88 C33 78 40 72 44 64 C46 72 49 74 52 74 C50 66 48 58 50 50 Z" fill="#FFF6C8"/></g></svg>`;
  }
  /* Флаг и герб Республики Бурятия (стилизованные SVG) */
  let flagUid = 0;
  function flagSvg(cls) {
    const k = 'rbf' + (++flagUid);
    const w1 = 'M7 5C22 1 34 9 50 5S66 2 70 4V34C62 32 56 37 46 36S22 30 7 35Z';
    const w2 = 'M7 4C20 7 34 1 50 5S64 8 70 5V35C60 38 54 32 44 34S20 38 7 34Z';
    const anim = `<animate attributeName="d" values="${w1};${w2};${w1}" dur="3.6s" repeatCount="indefinite"/>`;
    return `<svg class="rb-flag ${cls || ''}" viewBox="0 0 72 40" role="img" aria-label="Флаг Республики Бурятия">
      <defs><clipPath id="${k}c"><path d="${w1}">${anim}</path></clipPath>
        <linearGradient id="${k}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".25" stop-color="#fff" stop-opacity=".3"/><stop offset=".45" stop-color="#000" stop-opacity=".12"/><stop offset=".7" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity=".14"/>
          <animateTransform attributeName="gradientTransform" type="translate" values="-.25 0;.25 0;-.25 0" dur="3.6s" repeatCount="indefinite"/></linearGradient>
        <linearGradient id="${k}p" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFE28A"/><stop offset=".5" stop-color="#E0A800"/><stop offset="1" stop-color="#9C7300"/></linearGradient></defs>
      <rect x="2" y="3" width="3.2" height="37" rx="1.6" fill="url(#${k}p)"/><circle cx="3.6" cy="2.9" r="2.6" fill="#F2B705" stroke="#B88A00" stroke-width=".6"/>
      <g clip-path="url(#${k}c)">${window.BG_MASCOT.flagRect(4, 1, 76)}<rect x="4" y="0" width="68" height="40" fill="url(#${k}g)"/></g>
      <path d="${w1}" fill="none" stroke="rgba(0,0,0,.2)" stroke-width=".7">${anim}</path></svg>`;
  }
  function flagPoleSvg() {
    return `<svg class="flag-pole" viewBox="0 0 52 84" aria-hidden="true"><path d="M4 6 V84" stroke="#8B5A2B" stroke-width="3.5" stroke-linecap="round"/><circle cx="4" cy="5" r="3.5" fill="#F2B705"/><g class="wave">${window.BG_MASCOT.flagRect(6, 7, 44)}</g></svg>`;
  }
  function gerbSvg(cls) {
    const M_ = window.BG_MASCOT;
    return `<svg class="rb-gerb ${cls || ''}" viewBox="0 0 100 112" role="img" aria-label="Герб Бурятии">
      <path d="M34 88 Q26 102 30 112 L40 104 L44 92 Z M66 88 Q74 102 70 112 L60 104 L56 92 Z" fill="#74C0FC" stroke="#fff" stroke-width="1.5"/>
      <circle cx="50" cy="50" r="47" fill="#74C0FC" stroke="#F2B705" stroke-width="3"/>
      <circle cx="50" cy="50" r="41" fill="none" stroke="#fff" stroke-width="2.4" stroke-dasharray="6 4"/>
      <clipPath id="gerbClip"><circle cx="50" cy="50" r="36"/></clipPath>
      <g clip-path="url(#gerbClip)"><rect x="0" y="0" width="100" height="100" fill="#0F5BB5"/>
        <path d="M10 74 L28 56 L40 66 L54 50 L68 62 L80 54 L92 66 V100 H10 Z" fill="#2F9E44"/>
        <path d="M54 50 L59 55 L54 54 L49 56 Z M28 56 L32 60 L24 60 Z" fill="#fff"/>
        <rect x="0" y="74" width="100" height="30" fill="#1E6BC6"/>
        <path d="M12 80 q5 -3 10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 M12 87 q5 -3 10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0" stroke="#fff" stroke-opacity=".7" stroke-width="1.8" fill="none"/></g>
      ${M_.soyombo(39, 16, 1.1)}
      <circle cx="50" cy="50" r="36" fill="none" stroke="#F2B705" stroke-width="2.5"/></svg>`;
  }
  /* Фон сцены магазина: облака у солнца и горы за персонажем */
  const CLOUD = '<svg viewBox="0 0 120 50" aria-hidden="true"><path d="M18 44 Q2 44 4 32 Q6 22 20 24 Q22 8 42 10 Q54 0 68 10 Q84 4 90 20 Q110 18 114 32 Q116 44 100 44 Z" fill="#fff"/><path d="M24 36 q8 -6 16 0 M58 32 q8 -7 16 0" stroke="#CFE0F7" stroke-width="3" fill="none" stroke-linecap="round"/></svg>';
  const STAGE_SKY = `<div class="clouds" aria-hidden="true"><div class="cloud c1">${CLOUD}</div><div class="cloud c2">${CLOUD}</div><div class="cloud c3">${CLOUD}</div></div>`;
  const horseState = () => { const s = st(); if (!s.horses || !Array.isArray(s.horses.owned)) s.horses = { owned: [], main: null, freeUsed: false }; if (s.horses.owned.length && !s.horses.freeUsed) s.horses.freeUsed = true; return s.horses; };
  const petsState = () => { const s = st(); if (!s.pets || typeof s.pets.sheep !== 'number' || !isFinite(s.pets.sheep)) s.pets = { sheep: 10, starter: true }; if (!s.pets.starter) { s.pets.starter = true; s.pets.sheep = Math.max(10, s.pets.sheep); S.save(); } s.pets.sheep = Math.max(0, Math.min(D.sheepMax || 13, Math.floor(s.pets.sheep))); return s.pets; };
  const BZI = '<img class=bz-ic src=assets/images/buuza-icon.png alt=Буузы draggable=false>';
  const stageHorses = () => {
    const hs = horseState();
    if (!S.isPremium()) { const lh = hs.lucky && D.horses.find(h => h.id === hs.lucky); return lh ? [lh] : []; }
    const ids = hs.owned.filter(id => id !== hs.main).concat(hs.owned.indexOf(hs.main) >= 0 ? [hs.main] : []);
    if (hs.lucky && ids.indexOf(hs.lucky) < 0 && ids.length < 3) ids.unshift(hs.lucky);
    return ids.map(id => D.horses.find(h => h.id === id)).filter(Boolean);
  };
  /* v1.8.3: дошёл ли игрок до n-го модуля (все уроки предыдущих модулей пройдены) */
  const reachedUnit = (n) => D.units.slice(0, Math.max(0, n - 1)).every(u => u.lessons.every(l => ((st().lessons || {})[l.id] || {}).done));
  const stageScene = (compact) => `<div class="scene" aria-hidden="true">${window.BG_ART.scene({ compact: !!compact, horses: stageHorses(), sheep: petsState().sheep, kennel: !!(st().dog && st().dog.house) })}</div>`;

  if (D.words && D.words.buuza) D.words.buuza.emoji = BZ_IMG;
  D.units.forEach(u => { if (u.icon === '\u{1F95F}' || u.icon === '🥟') u.icon = BZ_IMG; });
  /* v1.10: свои записи голоса. Файлы лежат в www/audio/ и называются по коду слова (amar.m4a, sain.mp3...).
     Если записи нет — слово озвучивает синтезатор, как раньше. */
  const normWord = s => String(s == null ? '' : s).toLowerCase().replace(/ё/g, 'е').replace(/[!?.,…«»"“”:;—–-]/g, ' ').replace(/\s+/g, ' ').trim();
  const WORD_BY_TEXT = {};
  Object.keys(D.words || {}).forEach(id => { const w = D.words[id]; w._id = id; const k = normWord(w.bu); if (k && !WORD_BY_TEXT[k]) WORD_BY_TEXT[k] = id; });
  /* Сначала пробуем audio/<код>.m4a, потом .mp3, потом синтезатор. Отсутствующие файлы запоминаются. */
  function audioFor(id) {
    if (!id) return null;
    const k = String(id).toLowerCase();
    return ['audio/' + k + '.m4a', 'audio/' + k + '.mp3'];
  }
  const audioOf = w => (w && w.audio ? 'audio/' + w.audio : (w ? audioFor(w._id) : null));
  const leagueAcc = n => n.replace(/ая$/, 'ую');
  const leaguePrep = n => n.replace(/ая$/, 'ой');
  /* v1.11: наполненность пиал (чай/молоко). false — пиала пустая после обряда */
  const cupsState = () => { const s = st(); if (!s.cups || typeof s.cups !== 'object') s.cups = {}; return s.cups; };
  const isCupEmpty = id => cupsState()[id] === false;
  M.cupEmpty = id => id === 'buuza_plate' ? (st().buuz || 0) <= 0 : isCupEmpty(id);
  const LIFETIME_UNTIL = '9999-12-31';
  const isLifetime = p => !!(p && (p.plan === 'lifetime' || p.until === LIFETIME_UNTIL));
  const premUntil = p => isLifetime(p) ? 'навсегда' : 'до ' + humanDate(p.until);

  /* ───────────────── Нативный мост Android ───────────────── */
  function bridge(fn) {
    const args = Array.prototype.slice.call(arguments, 1);
    try { if (window.AndroidBridge && typeof window.AndroidBridge[fn] === 'function') return window.AndroidBridge[fn].apply(window.AndroidBridge, args); } catch (e) { console.warn('bridge', fn, e); }
    return undefined;
  }
  const native = bridge('isNative') === true;
  /* iOS-сборка (Capacitor): плагины доступны через window.Capacitor.Plugins */
  const capPlugin = name => (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && window.Capacitor.Plugins) ? window.Capacitor.Plugins[name] : null;

  /* ───────────────── Звук, вибрация, озвучка ───────────────── */
  const SFX_GROUP = { click: 'sfxClick', pop: 'sfxClick', correct: 'sfxCorrect', complete: 'sfxCorrect', coin: 'sfxCorrect', streak: 'sfxCorrect', wrong: 'sfxWrong' };
  function sfx(n) { if (st().settings[SFX_GROUP[n]] !== false) A.play(n); }
  function haptic(kind) {
    if (!st().settings.haptics) return;
    if (native) { bridge('haptic', kind); return; }
    const hp = capPlugin('Haptics');
    if (hp) {
      try { if (kind === 'error' || kind === 'success') hp.notification({ type: kind === 'error' ? 'ERROR' : 'SUCCESS' }); else hp.impact({ style: 'LIGHT' }); } catch (e) {}
      return;
    }
    if (navigator.vibrate) { try { navigator.vibrate(kind === 'error' ? [30, 40, 30] : kind === 'success' ? [15, 30, 25] : 8); } catch (e) {} }
  }
  /* Текст на экране не меняется; синтезатор получает фонетическую запись («Баяртай» → «Баяртэ»). */
  const PRON_RULES = Object.keys(D.pron || {}).map(k => ({
    re: new RegExp('(^|[^а-яёөүһ])(' + k + ')(?=$|[^а-яёөүһ])', 'giu'),
    to: D.pron[k]
  }));
  function pronounce(text) {
    let t = String(text == null ? '' : text);
    PRON_RULES.forEach(r => {
      t = t.replace(r.re, (m, pre, w) => pre + (w[0] !== w[0].toLowerCase() ? r.to[0].toUpperCase() + r.to.slice(1) : r.to));
    });
    return t;
  }
  function speak(text, slow, audio, onEnded) {
    if (!st().settings.tts) { if (typeof onEnded === 'function') setTimeout(onEnded, 0); return; }
    const cfg = st().settings;
    const base = cfg.ttsRate === 0.85 ? 0.92 : (cfg.ttsRate || 0.92);
    if (!audio) audio = audioFor(WORD_BY_TEXT[normWord(text)]);
    A.speak(pronounce(text), base * (slow ? 0.75 : 1), audio, cfg.voice || '', onEnded);
  }

  /* ───────────────── Тосты, конфетти, модалки ───────────────── */
  let toastTimer = null;
  function toast(msg, ms) {
    const t = $('#toast');
    t.innerHTML = msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), ms || 2200);
  }

  let confettiRun = 0;
  function confetti() {
    const c = $('#confetti');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = c.clientWidth, H = c.clientHeight;
    c.width = W * dpr; c.height = H * dpr;
    const x = c.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colors = ['#58CC02', '#1CB0F6', '#FFC800', '#FF4B4B', '#CE82FF', '#FF9600'];
    const P = [];
    for (let i = 0; i < 110; i++) P.push({ x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.35, vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 13 - 4,
      w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: colors[i % colors.length] });
    const id = ++confettiRun, t0 = performance.now();
    function frame(t) {
      if (id !== confettiRun) return;
      const el = t - t0;
      x.clearRect(0, 0, W, H);
      P.forEach(p => {
        p.vy += 0.38; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.globalAlpha = Math.max(0, 1 - el / 2600);
        x.fillStyle = p.c; x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); x.restore();
      });
      if (el < 2600) requestAnimationFrame(frame); else x.clearRect(0, 0, W, H);
    }
    requestAnimationFrame(frame);
  }

  let modalOpts = null;
  function openModal(html, opts) {
    opts = opts || {};
    modalOpts = opts;
    const o = $('#overlay');
    o.className = 'overlay show' + (opts.full ? ' full' : '');
    o.innerHTML = (opts.full ? '' : '<div class="backdrop"></div>') + '<div class="modal' + (opts.center ? ' center' : '') + '">' + html + '</div>';
    const bd = $('.backdrop', o);
    if (bd) bd.addEventListener('click', () => { if (!(modalOpts && modalOpts.locked)) closeModal(); });
    return $('.modal', o);
  }
  function closeModal() {
    const o = $('#overlay');
    o.className = 'overlay'; o.innerHTML = '';
    const cb = modalOpts && modalOpts.onClose;
    modalOpts = null;
    if (cb) cb();
  }
  const modalOpen = () => $('#overlay').classList.contains('show');

  function confirmBox(o) {
    const m = openModal(`<div class="big-emo">${o.emoji || '🤔'}</div><h2>${o.title}</h2><p>${o.text || ''}</p>
      <div class="stack"><button class="btn ${o.okClass || ''}" data-ok>${o.ok || 'Да'}</button>
      <button class="btn ghost dark" data-cancel>${o.cancel || 'Отмена'}</button></div>`, { center: true });
    $('[data-ok]', m).onclick = () => { closeModal(); if (o.onOk) o.onOk(); };
    $('[data-cancel]', m).onclick = () => { closeModal(); if (o.onCancel) o.onCancel(); };
  }

  function bump(id) { const e = document.getElementById(id); if (e) { e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); } }
  const mini = () => M.svg(st().equip, { cls: 'static' });

  /* ───────────────── Навигация ───────────────── */
  const ui = { loc: 'home', riding: false, rideHorse: null, ritual: false, tab: 'home', view: 'home', shopSlot: 'hat', lesson: null, lbTimer: null, onbStep: 0, onbName: '', onbGoal: 20 };

  function setChrome(top, tabs) {
    $('#topbar').classList.toggle('hidden', !top);
    $('#tabbar').classList.toggle('hidden', !tabs);
    $('#screen').classList.toggle('full', !tabs);
  }
  function go(view) {
    ui.view = view;
    if (['home', 'shop', 'leagues', 'profile'].indexOf(view) >= 0) ui.tab = view;
    render();
  }
  function render() {
    if (ui.lbTimer) { clearInterval(ui.lbTimer); ui.lbTimer = null; }
    const scr = $('#screen');
    scr.scrollTop = 0;
    document.body.dataset.view = ui.view;
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === ui.tab));
    switch (ui.view) {
      case 'home': setChrome(true, true); renderHome(scr); break;
      case 'shop': setChrome(true, true); renderShop(scr); break;
      case 'profile': setChrome(true, true); renderProfile(scr); break;
      case 'leagues': setChrome(true, true); renderLeagues(scr); break;
      case 'settings': setChrome(false, true); renderSettings(scr); break;
      case 'developer': setChrome(false, true); renderDeveloper(scr); break;
      case 'onboarding': setChrome(false, false); renderOnboarding(scr); break;
      case 'lesson': setChrome(false, false); renderLessonShell(scr); break;
      default: ui.view = 'home'; setChrome(true, true); renderHome(scr);
    }
    renderTop();
  }

  function renderTop() {
    const s = st();
    const active = s.lastActive === S.today();
    const prem = S.isPremium();
    $('#topbar').innerHTML = `
      <span class="ver-badge" title="Версия">${APP_VERSION}</span>
      <button class="stat-chip chip-streak ${active ? '' : 'off'}" id="tStreak"><span class="ic">🔥</span><span>${s.streak}</span></button>
      <button class="stat-chip chip-buzzy" id="tBuzzy"><span class="ic"><img class=bz-ic src=assets/images/buuza-icon.png alt=Буузы draggable=false></span><span>${fmt(s.buzzy)}</span></button>
      <button class="stat-chip chip-xp" id="tXp"><span class="ic">⚡</span><span>${fmt(s.xp)}</span></button>
      <button class="stat-chip chip-super" id="tSuper">${prem ? 'SUPER ✓' : 'SUPER'}</button>`;
    $('#tStreak').onclick = () => streakModal();
    $('#tBuzzy').onclick = () => go('shop');
    $('#tXp').onclick = () => go('profile');
    $('#tSuper').onclick = () => (prem ? go('settings') : openPaywall());
  }

  /* ───────────────── Главная / карта ───────────────── */
  function lessonState(gi) {
    const unit = D.lessonIndex[gi].unit, lesson = D.lessonIndex[gi].lesson;
    const rec = st().lessons[lesson.id];
    const done = !!(rec && rec.done);
    const open = gi === 0 || unit.lessons[0] === lesson || !!((st().lessons[D.lessonIndex[gi - 1].lesson.id] || {}).done);
    return { done, open, premiumLocked: !!(unit.superOnly || unit.premium) && !S.isPremium(), times: rec ? rec.times : 0 };
  }
  function currentGi() {
    for (let i = 0; i < D.lessonIndex.length; i++) { const x = lessonState(i); if (!x.done && x.open) return i; }
    return -1;
  }
  function ring(p, color) {
    const r = 24, c = 2 * Math.PI * r, v = Math.min(1, p);
    return `<svg class="ring" viewBox="0 0 56 56"><circle cx="28" cy="28" r="${r}" stroke="#E5E5E5" stroke-width="7" fill="none"/>
      <circle cx="28" cy="28" r="${r}" stroke="${color}" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}"
      stroke-dashoffset="${(c * (1 - v)).toFixed(1)}" transform="rotate(-90 28 28)"/>
      <text x="28" y="33" text-anchor="middle" font-size="14" font-weight="900" fill="#3C3C3C" font-family="sans-serif">${v >= 1 ? '✓' : Math.round(v * 100) + '%'}</text></svg>`;
  }

  function renderHome(scr) {
    const s = st();
    const today = S.todayXp(), goal = s.settings.dailyGoal;
    const cur = currentGi();
    const offsets = [0, 46, 72, 46, 0, -46, -72, -46];
    let gi = 0, html = '';
    D.units.forEach((u, ui_) => {
      const locked = !!(u.superOnly || u.premium) && !S.isPremium();
      html += `${u.superOnly && (ui_ === 0 || !D.units[ui_ - 1].superOnly) ? `<div class="super-divider"><span>👑 Модули для Суперпользователей</span><small>Усложнённые уроки · доступны в BuryatGo Super</small></div>` : ''}<section class="unit${u.superOnly ? ' super-unit' : ''}"><div class="unit-head" style="background:${u.color}">
        <div><div class="u-t">Модуль ${ui_ + 1}${u.superOnly ? ' · 👑 SUPER · сложный' : ''}</div><div class="u-n">${esc(u.title)}</div><div class="u-s">${esc(u.subtitle)}</div></div>
        ${locked ? '<button class="lock-badge" data-pw>👑 SUPER</button>' : `<div class="u-ic">${u.icon}</div>`}</div>
        <div class="path">`;
      u.lessons.forEach((l, li) => {
        const x = lessonState(gi);
        const isCur = gi === cur;
        let cls = '', style = '', icon = '★';
        if (x.open && x.premiumLocked) { cls = 'premium-lock'; icon = '👑'; }
        else if (x.done) { cls = 'done'; icon = '✔'; }
        else if (x.open) { style = `background:${u.color};box-shadow:0 7px 0 ${u.shade}`; icon = '★'; }
        else { cls = 'locked'; icon = '🔒'; }
        html += `<div class="node-wrap" style="transform:translateX(${offsets[gi % offsets.length]}px)">
          ${isCur && !x.premiumLocked ? '<div class="start-bubble">Старт</div><div class="node-current-ring"></div>' : ''}
          <button class="node ${cls}" data-gi="${gi}" style="${style}" aria-label="${esc(l.title)}">${icon}${x.done ? `<span class="crown">×${x.times}</span>` : ''}</button>
          <div class="node-label">${esc(l.title)}</div></div>`;
        gi++;
      });
      if (ui_ === 0) html += `<div class="map-mascot" id="mapMascot" style="left:6px;top:232px">${M.svg(s.equip, { mood: 'happy' })}</div>${dogHtml('map')}`;
      html += '</div></section>';
    });
    scr.innerHTML = `<div class="view">
      <div class="rb-banner">${gerbSvg()}<div class="rb-t"><b>Буряад Республика</b><span>Буряад хэлэн - манай баялиг</span></div>${flagSvg('waving')}</div>
      <div class="goal-card">${ring(today / goal, '#FFC800')}<div><b>Дневная цель</b><div class="muted" style="font-weight:700">${today} из ${goal} XP сегодня</div></div></div>
      ${html}
      <div class="steppe">${STEPPE_SVG}</div>
      <div class="info-plate" role="note"><span class="ip-ic">📣</span><p>В скором времени ожидается обновление приложений. Следите за нами в MAX или <b>Instagram</b> (ссылки добавим позже при релизе)</p></div></div>`;
    $$('.node', scr).forEach(b => { b.onclick = () => openLessonStart(+b.dataset.gi); });
    const mm = $('#mapMascot', scr);
    if (mm) mm.onclick = () => mascotTap(mm, mm.parentElement, null);
    const mdw = $('.dog-wrap.map', scr); if (mdw) mdw.onclick = e => { e.stopPropagation(); dogTap(mdw, null); };
    $$('[data-pw]', scr).forEach(b => { b.onclick = () => openPaywall(); });
    const curEl = $('.node-current-ring', scr);
    if (curEl && cur > 1) setTimeout(() => curEl.parentElement.scrollIntoView({ block: 'center', behavior: 'smooth' }), 120);
  }

  function openLessonStart(gi) {
    const x = lessonState(gi);
    const unit = D.lessonIndex[gi].unit, lesson = D.lessonIndex[gi].lesson;
    if (x.premiumLocked) { openPaywall(); return; }
    if (!x.open) { toast('🔒 Сначала пройдите предыдущий урок'); haptic('error'); return; }
    const words = lesson.words.map(w => `<span style="display:inline-block;border:2px solid var(--line);border-radius:10px;padding:4px 9px;margin:3px;font-weight:800">${D.words[w].emoji} ${esc(D.words[w].bu)}</span>`).join('');
    const m = openModal(`<div class="big-emo">${unit.icon}</div><h2>${esc(lesson.title)}</h2>
      <p>${esc(unit.title)} · урок ${unit.lessons.indexOf(lesson) + 1} из ${unit.lessons.length}</p>
      <div style="text-align:center;margin:-6px 0 16px">${words}</div>
      <p style="margin-bottom:14px">${x.done ? 'Повторение: +5 XP · +4 <img class=bz-ic src=assets/images/buuza-icon.png alt=Буузы draggable=false>' : 'Награда: +10 XP · +10 <img class=bz-ic src=assets/images/buuza-icon.png alt=Буузы draggable=false>'}</p>
      <div class="stack"><button class="btn" id="goLesson" style="background:${unit.color};box-shadow:0 4px 0 ${unit.shade}">${x.done ? 'Повторить' : 'Начать'}</button></div>`);
    $('#goLesson', m).onclick = () => { closeModal(); startLesson(gi); };
  }

  /* ───────────────── Движок урока ───────────────── */
  function wordPoolFor(unit, lesson) {
    let p = uniq(unit.lessons.reduce((a, l) => a.concat(l.words), []).concat(lesson.review));
    if (p.length < 4) p = uniq(p.concat(D.units[0].lessons.reduce((a, l) => a.concat(l.words), [])));
    return p;
  }
  function optionsFor(w, pool, n) {
    const ru = D.words[w].ru;
    return shuffle([w].concat(sample(pool.filter(x => x !== w && D.words[x].ru !== ru), n - 1)));
  }
  function buildQueue(unit, lesson) {
    const pool = wordPoolFor(unit, lesson);
    const age = ageOf();
    if (age === 'kids') return kidsQueue(lesson, pool);
    if (age === 'std') return stdQueue(lesson, pool);
    const first = !((st().lessons[lesson.id] || {}).done);
    const q = [];
    lesson.words.forEach(w => {
      if (first || !st().words[w]) q.push({ type: 'intro', w });
      q.push({ type: 'choose_ru', w, opts: optionsFor(w, pool, 4) });
    });
    const mid = [];
    sample(lesson.words, Math.min(2, lesson.words.length)).forEach(w => mid.push({ type: 'listen', w, opts: optionsFor(w, pool, 4) }));
    sample(lesson.words, Math.min(3, lesson.words.length)).forEach(w => mid.push({ type: 'choose_bu', w, opts: optionsFor(w, pool, 3) }));
    sample(lesson.review, Math.min(2, lesson.review.length)).forEach(w => mid.push({ type: 'choose_ru', w, opts: optionsFor(w, pool, 4) }));
    shuffle(mid).forEach(e => q.push(e));
    lesson.phrases.forEach((p, i) => q.push({ type: 'build', phrase: p, dir: i % 2 === 0 ? 'bu2ru' : 'ru2bu' }));
    const mp = uniq(lesson.words.concat(lesson.review));
    if (mp.length >= 3) q.push({ type: 'match', pairs: sample(mp, Math.min(5, mp.length)) });
    return q;
  }

  function startLesson(gi) {
    const unit = D.lessonIndex[gi].unit, lesson = D.lessonIndex[gi].lesson;
    ui.lesson = { age: ageOf(), gi, unit, lesson, queue: buildQueue(unit, lesson), done: 0, mistakes: 0, combo: 0, maxCombo: 0, answered: 0, correct: 0,
      cur: null, ready: false, answer: null, checked: false, evaluate: null, finished: false, onContinue: null };
    go('lesson');
    nextExercise();
  }

  function renderLessonShell(scr) {
    scr.innerHTML = `<div class="lesson view age-${ageOf()}" style="position:relative">
      <div class="lesson-top"><button class="x-btn" id="lQuit" aria-label="Выйти">✕</button><div class="progress"><i id="lProg"></i></div><div class="combo" id="lCombo"></div></div>
      <div class="lesson-body" id="lBody"></div>
      <div class="lesson-foot" id="lFoot"></div>
      <div class="sheet" id="lSheet"></div></div>`;
    $('#lQuit').onclick = quitLesson;
    // Hard block any swipe-down in lesson (prevents skip button reveal)
    const lesson = $('.lesson', scr);
    if (lesson) {
      let sy = 0;
      const block = e => {
        if (e.touches && e.touches.length) {
          const dy = e.touches[0].clientY - sy;
          if (dy > 8) e.preventDefault();
        }
      };
      lesson.addEventListener('touchstart', e => { sy = e.touches[0].clientY; }, { passive: true });
      lesson.addEventListener('touchmove', block, { passive: false });
      lesson.addEventListener('touchend', () => { sy = 0; }, { passive: true });
    }
  }

  function quitLesson() {
    confirmBox({ emoji: '😢', title: 'Подождите, не уходите!', text: 'Если выйдете сейчас, прогресс этого урока пропадёт.',
      ok: 'Продолжить урок', cancel: 'Выйти', onCancel: () => { ui.lesson = null; go('home'); } });
  }

  function updateProgress() {
    const L = ui.lesson, p = $('#lProg');
    if (!p) return;
    const total = L.done + L.queue.length + (L.cur ? 1 : 0);
    p.style.width = (total ? (L.done / total) * 100 : 100) + '%';
  }
  function updateCombo() {
    const L = ui.lesson, c = $('#lCombo');
    if (!c) return;
    c.textContent = L.combo >= 2 ? '🔥' + L.combo : '';
    if (L.combo >= 2) bump('lCombo');
  }
  function setReady(b) { ui.lesson.ready = b; const c = $('#lCheck'); if (c) c.disabled = !b; }

  function nextExercise() {
    const L = ui.lesson;
    if (!L) return;
    L.cur = L.queue.shift() || null;
    if (!L.cur) { updateProgress(); setTimeout(finishLesson, 250); return; }
    L.checked = false; L.ready = false; L.answer = null; L.evaluate = null;
    updateProgress();
    renderExercise();
  }

  function renderExercise() {
    const L = ui.lesson, ex = L.cur, body = $('#lBody'), foot = $('#lFoot');
    body.style.pointerEvents = '';
    body.scrollTop = 0;
    foot.innerHTML = '<button class="btn" id="lCheck" data-silent disabled>Проверить</button>';
    body.innerHTML = '<div class="ex-anim" id="exRoot"></div>';
    const R = { intro: exIntro, choose_ru: exChooseRu, listen: exListen, choose_bu: exChooseBu, build: exBuild, match: exMatch, k_intro: exKidsIntro, k_pick: exKidsPick, k_match: exKidsMatch }[ex.type];
    R(ex, $('#exRoot'), foot);
    if (L.age === 'std') stdHint(ex, $('#exRoot'));
    $('#lCheck').onclick = onCheck;
  }

  function onCheck() {
    const L = ui.lesson;
    if (!L || !L.cur) return;
    if (L.cur.type === 'intro' || L.cur.type === 'k_intro') { L.done++; sfx('pop'); nextExercise(); return; }
    if (!L.ready || L.checked || !L.evaluate) return;
    doCheck();
  }

  function requeue(ex) { const c = Object.assign({}, ex); if (c.opts) c.opts = shuffle(c.opts); return c; }

  function doCheck() {
    const L = ui.lesson;
    const r = L.evaluate();
    L.checked = true; L.answered++;
    $('#lBody').style.pointerEvents = 'none';
    if (r.ok) {
      L.correct++; L.combo++; L.maxCombo = Math.max(L.maxCombo, L.combo); L.done++;
      sfx('correct'); haptic('success');
      if (r.onOk) r.onOk();
    } else {
      L.mistakes++; L.combo = 0;
      L.queue.push(requeue(L.cur));
      sfx('wrong'); haptic('error');
    }
    if (r.mark) r.mark(r.ok);
    updateCombo();
    showSheet(r.ok, r);
  }

  const PRAISE = ['Отлично!', 'Правильно!', 'Супер!', 'Молодец!', 'Һайн! Хорошо!', 'Так держать!'];
  function showSheet(ok, r) {
    const L = ui.lesson, sh = $('#lSheet');
    if (L && L.age === 'kids') return kidsSheet(ok, r);
    if (L && L.age === 'std' && ok && L.cur && L.cur.w && L.cur.type !== 'listen') setTimeout(() => speak(L.cur.w.bu, false, audioOf(L.cur.w)), 260);
    const combo = ok && L.combo >= 3 ? `<div style="font-size:14px;font-weight:800;color:var(--orange)">🔥 ${L.combo} правильных подряд</div>` : '';
    const bodyTxt = ok ? (r.okText ? esc(r.okText) : '') : (r.correctText ? 'Правильный ответ: <b>' + esc(r.correctText) + '</b>' : '');
    sh.className = 'sheet ' + (ok ? 'good' : 'wrong');
    sh.innerHTML = `<div class="s-head"><div class="s-ic">${ok ? '✅' : '❌'}</div><div>${ok ? PRAISE[Math.floor(Math.random() * PRAISE.length)] : 'Ошибка'}${combo}</div></div>
      <div class="s-body">${bodyTxt}</div>
      <button class="btn ${ok ? '' : 'wrongbtn'}" id="sNext">Продолжить</button>`;
    void sh.offsetWidth;
    sh.classList.add('show');
    $('#sNext').onclick = () => { sh.classList.remove('show'); nextExercise(); };
  }

  function bindSay(root, text, audio) {
    const say = $('[data-say]', root), slow = $('[data-slow]', root);
    const anim = b => { b.classList.remove('playing'); void b.offsetWidth; b.classList.add('playing'); };
    if (say) say.onclick = () => { anim(say); speak(text, false, audio); };
    if (slow) slow.onclick = () => { anim(slow); speak(text, true, audio); };
  }

  function bindChoice(root, sel, correctId, info, onPick) {
    const L = ui.lesson;
    $$(sel, root).forEach(b => {
      b.onclick = () => {
        $$(sel, root).forEach(x => x.classList.remove('sel'));
        b.classList.add('sel');
        L.answer = b.dataset.id;
        setReady(true);
        if (onPick) onPick(b.dataset.id);
      };
    });
    L.evaluate = () => {
      const ok = L.answer === correctId;
      return Object.assign({
        ok,
        mark() {
          $$(sel, root).forEach(x => {
            x.classList.remove('sel');
            if (x.dataset.id === correctId) x.classList.add('ok');
            else if (x.dataset.id === L.answer) x.classList.add('bad');
            else x.classList.add('dim');
          });
        }
      }, info());
    };
  }

  function exIntro(ex, root, foot) {
    const w = D.words[ex.w];
    root.innerHTML = `<div class="ex-kind">✨ Новое слово</div><div class="ex-title">Запомните</div>
      <div class="intro-card"><div class="emo">${w.emoji}</div><div class="bu">${esc(w.bu)}</div><div class="ru">${esc(w.ru)}</div>
      ${pronounce(w.bu) !== w.bu ? `<div class="pron-hint">🔊 Звучит как «${esc(pronounce(w.bu))}»</div>` : ''}
      ${w.note ? `<div class="note">💡 ${esc(w.note)}</div>` : ''}
      <div style="display:flex;gap:12px;justify-content:center;margin-top:18px">
        <button class="spk" data-silent data-say aria-label="Прослушать">🔊</button>
        <button class="spk" data-silent data-slow aria-label="Медленно" style="background:#fff;border:2px solid var(--line);box-shadow:0 3px 0 var(--line)">🐢</button></div></div>`;
    bindSay(root, w.bu, audioOf(w));
    setTimeout(() => speak(w.bu, false, audioOf(w)), 350);
    const b = $('#lCheck', foot);
    b.disabled = false; b.textContent = 'Продолжить';
    ui.lesson.ready = true;
  }

  function exChooseRu(ex, root) {
    const w = D.words[ex.w];
    root.innerHTML = `<div class="ex-kind">🧩 Выберите перевод</div><div class="ex-title">Что это значит?</div>
      <div class="speech"><div class="mini-m">${mini()}</div><div class="bubble"><button class="spk" data-silent data-say>🔊</button><span>${esc(w.bu)}</span></div></div>
      <div class="grid2">${ex.opts.map(id => { const o = D.words[id]; return `<button class="card-opt" data-id="${id}"><span class="emo">${o.emoji}</span><span>${esc(o.ru)}</span></button>`; }).join('')}</div>`;
    bindSay(root, w.bu, audioOf(w));
    setTimeout(() => speak(w.bu, false, audioOf(w)), 300);
    bindChoice(root, '.card-opt', ex.w, () => ({ correctText: w.ru, okText: w.bu + ' — ' + w.ru }));
  }

  function exListen(ex, root, foot) {
    const w = D.words[ex.w];
    root.innerHTML = `<div class="ex-kind">🎧 Аудирование</div><div class="ex-title">Что вы услышали?</div>
      <div class="listen-btns"><button class="big-spk" data-silent data-say aria-label="Прослушать">🔊</button><button class="big-spk slow" data-silent data-slow aria-label="Медленно">🐢</button></div>
      <div class="grid2">${ex.opts.map(id => { const o = D.words[id]; return `<button class="card-opt" data-id="${id}"><span class="emo">${o.emoji}</span><span>${esc(o.ru)}</span></button>`; }).join('')}</div>`;
    bindSay(root, w.bu, audioOf(w));
    setTimeout(() => speak(w.bu, false, audioOf(w)), 350);
    bindChoice(root, '.card-opt', ex.w, () => ({ correctText: w.bu + ' — ' + w.ru, okText: w.bu + ' — ' + w.ru }));
    foot.insertAdjacentHTML('afterbegin', '<button class="btn ghost dark skip" id="lSkip">Не могу слушать</button>');
    $('#lSkip', foot).onclick = () => { if (ui.lesson.checked) return; ui.lesson.done++; nextExercise(); };
  }

  function exChooseBu(ex, root) {
    const w = D.words[ex.w];
    root.innerHTML = `<div class="ex-kind">💬 Выберите ответ</div><div class="ex-title">Как сказать «${esc(w.ru)}» ${w.emoji}?</div>
      <div class="list-opt">${ex.opts.map((id, i) => `<button class="row-opt" data-id="${id}"><span class="num">${i + 1}</span><span>${esc(D.words[id].bu)}</span></button>`).join('')}</div>`;
    bindChoice(root, '.row-opt', ex.w, () => ({ correctText: w.bu, okText: w.bu + ' — ' + w.ru }),
      id => speak(D.words[id].bu, false, audioOf(D.words[id])));
  }

  function exBuild(ex, root) {
    const L = ui.lesson, p = ex.phrase;
    const toRu = ex.dir === 'bu2ru';
    const src = toRu ? p.bu : p.ru, tgt = toRu ? p.ru : p.bu, lang = toRu ? 'ru' : 'bu';
    const tnorm = tgt.map(norm);
    const pool = wordPoolFor(L.unit, L.lesson);
    const distract = uniq(shuffle(pool).reduce((a, id) => a.concat(D.words[id][lang].split(/\s+/)), [])
      .map(t => t.replace(/[.,!?]/g, '')).filter(t => t && tnorm.indexOf(norm(t)) < 0)).slice(0, 2);
    const tiles = shuffle(tgt.concat(distract)).map(t => ({ t }));
    const srcText = src.join(' '), tgtText = tgt.join(' ');
    root.innerHTML = `<div class="ex-kind">🧱 Конструктор фраз</div><div class="ex-title">${toRu ? 'Переведите на русский' : 'Переведите на бурятский'}</div>
      <div class="speech"><div class="mini-m">${mini()}</div><div class="bubble">${toRu ? '<button class="spk" data-silent data-say>🔊</button>' : ''}<span>${esc(srcText)}</span></div></div>
      <div class="answer-area" id="ans"></div>
      <div class="bank" id="bank">${tiles.map((o, i) => `<button class="tile" data-i="${i}">${esc(o.t)}</button>`).join('')}</div>`;
    if (toRu) { bindSay(root, srcText); setTimeout(() => speak(srcText), 300); }
    const ans = $('#ans', root), bank = $('#bank', root);
    const chosen = [];
    function draw() {
      ans.innerHTML = chosen.map(i => `<button class="tile" data-i="${i}">${esc(tiles[i].t)}</button>`).join('');
      $$('.tile', bank).forEach(b => b.classList.toggle('ghost', chosen.indexOf(+b.dataset.i) >= 0));
      $$('.tile', ans).forEach(b => { b.onclick = () => { const k = chosen.indexOf(+b.dataset.i); if (k >= 0) chosen.splice(k, 1); draw(); }; });
      setReady(chosen.length > 0);
    }
    $$('.tile', bank).forEach(b => {
      b.onclick = () => {
        const i = +b.dataset.i;
        if (chosen.indexOf(i) >= 0) return;
        chosen.push(i);
        if (lang === 'bu') speak(tiles[i].t);
        draw();
      };
    });
    L.evaluate = () => {
      const given = chosen.map(i => tiles[i].t).join(' ');
      const ok = norm(given) === norm(tgtText);
      return {
        ok, correctText: tgtText,
        okText: toRu ? srcText + ' — ' + tgtText : tgtText + ' — ' + srcText,
        mark(good) { $$('.tile', ans).forEach(t => t.classList.add(good ? 'ok' : 'bad')); },
        onOk() { if (!toRu) setTimeout(() => speak(tgtText), 200); }
      };
    };
  }

  function exMatch(ex, root, foot) {
    const L = ui.lesson, ids = ex.pairs;
    const left = shuffle(ids), right = shuffle(ids);
    root.innerHTML = `<div class="ex-kind">🔗 Пары</div><div class="ex-title">Соедините пары слов</div>
      <div class="match-grid">${left.map((id, i) => `<button class="row-opt" data-side="l" data-id="${id}">${esc(D.words[id].bu)}</button><button class="row-opt" data-side="r" data-id="${right[i]}">${D.words[right[i]].emoji} ${esc(D.words[right[i]].ru)}</button>`).join('')}</div>`;
    $('#lCheck', foot).textContent = 'Найдите все пары';
    let selL = null, selR = null, matched = 0, busy = false;
    $$('.row-opt', root).forEach(b => {
      b.onclick = () => {
        if (busy || b.classList.contains('done')) return;
        const side = b.dataset.side;
        $$(`.row-opt[data-side="${side}"]`, root).forEach(x => x.classList.remove('sel'));
        b.classList.add('sel');
        if (side === 'l') { selL = b; speak(D.words[b.dataset.id].bu, false, audioOf(D.words[b.dataset.id])); } else selR = b;
        if (!selL || !selR) return;
        const a = selL, c = selR; selL = null; selR = null;
        a.classList.remove('sel'); c.classList.remove('sel');
        if (a.dataset.id === c.dataset.id) {
          a.classList.add('ok'); c.classList.add('ok');
          sfx('pop'); haptic('light');
          setTimeout(() => { a.classList.add('done'); c.classList.add('done'); }, 300);
          matched++;
          if (matched === ids.length) {
            setTimeout(() => {
              L.evaluate = () => ({ ok: true, okText: 'Все пары найдены!' });
              L.ready = true;
              doCheck();
            }, 450);
          }
        } else {
          a.classList.add('bad'); c.classList.add('bad');
          L.mistakes++; L.combo = 0; updateCombo();
          sfx('wrong'); haptic('error');
          busy = true;
          setTimeout(() => { a.classList.remove('bad'); c.classList.remove('bad'); busy = false; }, 550);
        }
      };
    });
  }

  function finishLesson() {
    const L = ui.lesson, s = st();
    if (!L || L.finished) return;
    const rec = s.lessons[L.lesson.id] || { done: false, times: 0, best: 0 };
    const first = !rec.done;
    const acc = L.answered ? Math.round((L.correct / L.answered) * 100) : 100;
    const perfect = L.mistakes === 0;
    let xp = first ? 10 : 5;
    if (perfect) xp += 5;
    if (L.maxCombo >= 5) xp += 3;
    const beforeToday = S.todayXp();
    const streakGrew = S.bumpStreak();
    /* v1.12: «Неделя огня» — каждые 7 дней без пропусков = +1000 Бууз */
    if (streakGrew && s.streak > 0 && s.streak % 7 === 0 && s.weekBonusDay !== S.today()) {
      s.weekBonusDay = S.today(); s.buzzy += D.weekStreakBonus; s.buzzyEarned += D.weekStreakBonus; S.save();
      setTimeout(() => { toast('🔥 Неделя огня! ' + s.streak + ' дней без пропусков — бонус +' + D.weekStreakBonus + ' ' + BZI); confetti(); }, 1600);
    }
    let bz = first ? 10 : 4;
    if (perfect) bz += 5;
    const streakBonus = streakGrew ? Math.min(s.streak, 10) * 2 : 0;
    bz += streakBonus;
    const prem = S.isPremium();
    if (prem) bz *= 2;
    S.addXp(xp);
    s.buzzy += bz; s.buzzyEarned += bz;
    rec.done = true; rec.times++; rec.best = Math.max(rec.best, acc); rec.last = S.today();
    s.lessons[L.lesson.id] = rec;
    L.lesson.words.forEach(w => { s.words[w] = (s.words[w] || 0) + 1; });
    // Module completion rewards
    const doneUnits = D.units.filter(u => u.lessons.every(l => (s.lessons[l.id] || {}).done)).length;
    if (!s.modRewards) s.modRewards = {};
    if (doneUnits >= 3 && !s.modRewards.free3) {
      s.modRewards.free3 = true;
      s.buzzy += 25000; s.buzzyEarned += 25000;
      setTimeout(() => { toast('🎉 3 модуля пройдены! +25 000 Бууз'); confetti(); }, 2000);
    }
    if (doneUnits >= 15 && !s.modRewards.all15) {
      s.modRewards.all15 = true;
      s.buzzy += 50000; s.buzzyEarned += 50000;
      setTimeout(() => { toast('🏆 Все 15 модулей! +50 000 Бууз'); confetti(); }, 2500);
    }
    s.stats.lessons++; s.stats.answers += L.answered; s.stats.correct += L.correct;
    if (perfect) s.stats.perfect++;
    const goal = s.settings.dailyGoal;
    const goalHit = beforeToday < goal && S.todayXp() >= goal;
    S.save();
    L.finished = true;
    renderResult({ xp, bz, acc, perfect, streakGrew, streakBonus, goalHit, first, prem, combo: L.maxCombo });
  }

  function renderResult(res) {
    const L = ui.lesson, scr = $('#screen');
    const extras = [];
    if (res.perfect) extras.push('🎯 Без ошибок: +5 XP, +5 <img class=bz-ic src=assets/images/buuza-icon.png alt=Буузы draggable=false>');
    if (res.combo >= 5) extras.push('🔥 Комбо ×' + res.combo + ': +3 XP');
    if (res.streakBonus) extras.push('📅 Бонус за серию: +' + res.streakBonus + ' <img class=bz-ic src=assets/images/buuza-icon.png alt=Буузы draggable=false>');
    if (res.prem) extras.push('👑 Super: Буузы ×2');
    scr.innerHTML = `<div class="view result">
      <div class="r-m jump">${M.svg(st().equip, { mood: 'happy', cls: 'wave' })}</div>
      <h1>${res.perfect ? 'Идеально! 🎯' : 'Урок пройден!'}</h1>
      <div class="muted" style="font-weight:800">${esc(L.lesson.title)} · ${esc(L.unit.title)}</div>
      <div class="r-stats">
        <div class="r-stat" style="border-color:#FFC800"><div class="h" style="background:#FFC800">Опыт</div><div class="v" style="color:#E0A800">⚡ ${res.xp}</div></div>
        <div class="r-stat" style="border-color:#FF9600"><div class="h" style="background:#FF9600">Буузы</div><div class="v" style="color:#E08600"><img class=bz-ic src=assets/images/buuza-icon.png alt=Буузы draggable=false> ${res.bz}</div></div>
        <div class="r-stat" style="border-color:#58CC02"><div class="h" style="background:#58CC02">Точность</div><div class="v" style="color:#46A302">🎯 ${res.acc}%</div></div>
      </div>
      ${extras.length ? `<div style="margin:-12px 0 24px;font-weight:800;color:var(--muted);font-size:14px;line-height:1.8">${extras.join('<br>')}</div>` : ''}
      <button class="btn" id="rNext">Продолжить</button></div>`;
    sfx('complete'); haptic('success');
    setTimeout(confetti, 150);
    L.onContinue = () => {
      const lessonId = L.lesson.id;
      ui.lesson = null;
      go('home');
      const chain = [];
      if (res.streakGrew) chain.push(cb => streakModal(cb, true));
      if (res.goalHit) chain.push(cb => goalModal(cb));
      if (res.first && lessonId === 'u1l3' && !S.isPremium()) chain.push(cb => { openPaywall(); cb(); });
      const run = i => { if (i < chain.length) chain[i](() => run(i + 1)); else checkAchievements(); };
      run(0);
    };
    $('#rNext').onclick = () => L.onContinue();
  }

  function weekRow() {
    const s = st(), start = S.dayKey(S.weekStart()), today = S.today();
    let h = '<div style="display:flex;justify-content:space-between;gap:4px;margin:0 0 18px">';
    for (let i = 0; i < 7; i++) {
      const k = S.addDays(start, i), on = (s.xpByDay[k] || 0) > 0, isT = k === today;
      h += `<div style="flex:1;text-align:center"><div style="font-size:12px;font-weight:900;color:${isT ? 'var(--orange)' : '#AFAFAF'}">${WD[S.parseDay(k).getDay()]}</div>
        <div style="margin:4px auto 0;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:17px;background:${on ? 'var(--orange)' : 'var(--line)'};color:#fff">${on ? '🔥' : ''}</div></div>`;
    }
    return h + '</div>';
  }

  function streakModal(onClose, celebrate) {
    const s = st();
    if (celebrate) { sfx('streak'); haptic('success'); }
    const active = s.lastActive === S.today();
    const m = openModal(`<div class="big-emo flame-wrap">${flameSvg(active)}</div>
      <h2 style="font-size:44px;color:var(--orange);margin:0">${s.streak}</h2>
      <p>${plural(s.streak, ['день', 'дня', 'дней'])} подряд! ${active ? 'Сегодня вы уже позанимались — возвращайтесь завтра.' : 'Пройдите урок сегодня, чтобы продлить серию.'}</p>
      ${weekRow()}
      ${weekBonusHtml()}
      <p style="font-size:14px;margin-top:-6px">🧊 Заморозок: ${s.freezes} · Рекорд: ${s.bestStreak}</p>
      <button class="btn gold" data-ok>${celebrate ? 'Так держать!' : 'Понятно'}</button>`, { center: true, onClose });
    $('[data-ok]', m).onclick = () => closeModal();
  }

  function goalModal(onClose) {
    const s = st();
    const m = openModal(`<div class="big-emo">🎯</div><h2>Дневная цель выполнена!</h2>
      <p>${S.todayXp()} XP из ${s.settings.dailyGoal}. Бато вами гордится!</p>
      <button class="btn" data-ok>Ура!</button>`, { center: true, onClose });
    sfx('coin'); confetti();
    $('[data-ok]', m).onclick = () => closeModal();
  }

  function checkAchievements() {
    const s = st(), got = [];
    D.achievements.forEach(a => {
      if (s.unlockedAchievements.indexOf(a.id) < 0 && a.metric(s) >= a.goal) {
        s.unlockedAchievements.push(a.id);
        s.buzzy += 20; s.buzzyEarned += 20;
        s.buuz = Math.min(99, (s.buuz || 0) + 2); if (s.owned.indexOf('buuza_plate') < 0) s.owned.push('buuza_plate');
        got.push(a);
      }
    });
    if (!got.length) return;
    S.save();
    renderTop();
    got.forEach((a, i) => setTimeout(() => { toast(a.icon + ' Достижение «' + a.title + '»! +20 <img class=bz-ic src=assets/images/buuza-icon.png alt=Буузы draggable=false> · 🥟 +2', 2600); sfx('coin'); bump('tBuzzy'); }, i * 2800 + 400));
  }

  /* ───────────────── Магазин персонажа ───────────────── */
  function itemPreview(it) {
    if (it.dog) return window.BG_ART.dogSvg('dog-svg', null, { [it.slot]: it.id });
    if (it.slot === 'bonus' || it.offer) return `<div class="bonus-icon">${it.icon || '🧊'}</div>`;
    if (it.food) return M.preview('buuza_plate');
    return M.preview(it.id);
  }
  function renderShop(scr) {
    const s = st();
    const items = D.items.filter(i => (i.cat || i.slot) === ui.shopSlot && i.slot !== 'datsan');
    scr.innerHTML = `<div class="view">
      <div class="mascot-stage v4" id="stage">${stageScene()}${STAGE_SKY}
        <div class="say" id="say"></div>
        <div class="mascot-hold" id="mHold">${M.svg(s.equip, { mood: 'happy', cls: 'wave' })}</div></div>
      <div class="wallet">
        <div><span class="big"><img class=bz-ic src=assets/images/buuza-icon.png alt=Буузы draggable=false></span><div><div class="big" id="wBuzzy">${fmt(s.buzzy)}</div><div class="muted" style="font-size:12px;font-weight:800">Буузы</div></div></div>
        <div><span class="big">🧊</span><div><div class="big">${s.freezes}</div><div class="muted" style="font-size:12px;font-weight:800">Заморозки</div></div></div>
      </div>
      <div class="seg">${D.slots.filter(sl => sl.id !== 'datsan').map(sl => `<button data-slot="${sl.id}" class="${ui.shopSlot === sl.id ? 'on' : ''}">${sl.icon} ${esc(sl.name)}</button>`).join('')}<button data-slot="pets" class="${ui.shopSlot === 'pets' ? 'on' : ''}">🐾 Питомцы</button></div>
      <div class="shop-grid">${ui.shopSlot === 'pets' ? petsGrid() : items.map(it => {
        const owned = s.owned.indexOf(it.id) >= 0, eq = s.equip[it.slot] === it.id;
        let tag = '';
        if (eq) tag = '<span class="tag">Надето</span>';
        else if (owned && !it.consumable) tag = '<span class="tag" style="background:var(--blue)">Есть</span>';
        else if (it.premiumOnly) tag = '<span class="tag super">SUPER</span>';
        const price = it.consumable ? `<img class=bz-ic src=assets/images/buuza-icon.png alt=Буузы draggable=false> ${it.price}` : owned ? (eq ? '✔ Надето' : 'Надеть') : `<img class=bz-ic src=assets/images/buuza-icon.png alt=Буузы draggable=false> ${it.price}`;
        const refill = !!(it.cup && owned && isCupEmpty(it.id));
        if (refill) tag = '<span class="tag" style="background:#868E96">Пустая</span>';
        return `<button class="item-card ${eq ? 'equipped' : ''} ${refill ? 'refill' : ''}" data-id="${it.id}" ${refill ? 'data-refill="1"' : ''}>${tag}<div class="pv">${itemPreview(it)}</div><div class="nm">${esc(it.name)}${it.id === 'buuza_plate' && owned ? ' · 🥟' + (s.buuz || 0) : ''}${it.offer ? ' · ' + ((s.offerInv || {})[it.offer] || 0) + ' шт.' : ''}</div><div class="price">${refill ? `🔄 Наполнить ${BZI} ${D.cupRefill}` : price}</div></button>`;
      }).join('')}</div>
      <p class="disclaimer">Нажмите на Бато — он скажет что-нибудь по-бурятски! Буузы зарабатываются за уроки, серии и достижения.</p></div>`;
    $$('.seg button', scr).forEach(b => { b.onclick = () => { ui.shopSlot = b.dataset.slot; renderShop(scr); }; });
    $$('.item-card', scr).forEach(b => { b.onclick = () => b.dataset.refill ? (refillCup(D.itemsById[b.dataset.id]) && refreshShop(true)) : b.dataset.lucky ? luckyModal() : b.dataset.pet ? sheepModal() : b.dataset.horse ? horseModal(b.dataset.horse) : itemModal(b.dataset.id); });
    const hold = $('#mHold', scr);
    hold.onclick = () => { if (ui.skating || ui.sheltered === 'yurt') return; mascotTap(hold, $('#stage', scr), mascotTalk); };
    $$('[data-dog]', scr).forEach(b => { b.onclick = () => (b.dataset.dog === 'house' ? kennelModal() : dogModal()); });
    $$('[data-coat]', scr).forEach(b => { b.onclick = coatModal; });
    bindStageExtras(scr);
  }

  /* ───────── v1.11: обряд брызганья (сэржэм) ─────────
     Бато с полной пиалой чая/молока: поворот к горам → три взмаха рукой с брызгами → пиала пустеет → поворот обратно. */

  /* ───────── v1.15: возраст, теги статусов, боты ───────── */
  const AGES = [
    { id: 'kids', label: '3–5 лет', tag: 'KIDS', emoji: '🧸', d: 'Только картинки и озвучка — читать не нужно' },
    { id: 'std', label: '5–10 лет', tag: 'Standart', emoji: '🎒', d: 'Больше аудио и подсказок, минимум текста' },
    { id: 'big', label: '10–15+ лет', tag: 'BIG', emoji: '🎓', d: 'Полный режим: текст, карточки, конструктор фраз' }
  ];
  const ageOf = () => { const a = st().age; return a === 'kids' || a === 'std' || a === 'big' ? a : 'big'; };
  const ageInfo = id => AGES.find(a => a.id === id) || AGES[2];
  const isAdmin = () => !!st().admin || devRemembered();
  const TAGS = { admin: ['ADMIN', 'tg-admin'], super: ['SUPER', 'tg-super'], kids: ['KIDS', 'tg-kids'], std: ['Standart', 'tg-std'], big: ['BIG', 'tg-big'] };
  function tagHtml(kind, upper) {
    const t = TAGS[kind]; if (!t) return '';
    return `<span class="utag ${t[1]}">${upper ? t[0].toUpperCase() : t[0]}</span>`;
  }
  function tagsFor(o, withAge, upper) {
    let h = '';
    if (o.admin) h += tagHtml('admin');
    if (o.premium) h += tagHtml('super');
    if (withAge && TAGS[o.age]) h += tagHtml(o.age, upper);
    return h ? `<span class="utags">${h}</span>` : '';
  }
  const myTags = (withAge, upper) => tagsFor({ admin: isAdmin(), premium: S.isPremium(), age: st().age }, withAge, upper);

  /* Боты лиг: категория выдаётся случайно один раз и навсегда хранится в состоянии (локально + Firebase) */
  const BOT_CATS = ['kids', 'std', 'big', 'super'];
  function botCat(name) {
    const s = st();
    if (!s.bots || typeof s.bots !== 'object') s.bots = {};
    let c = s.bots[name];
    if (BOT_CATS.indexOf(c) < 0) { c = BOT_CATS[Math.floor(Math.random() * BOT_CATS.length)]; s.bots[name] = c; ui.botsDirty = true; }
    return c;
  }
  const botTag = name => { const c = botCat(name); return `<span class="utags">${c === 'super' ? tagHtml('super') : tagHtml(c, true)}</span>`; };

  function ageButtons(cur) {
    return AGES.map(a => `<button class="age-opt ${cur === a.id ? 'on' : ''}" data-age="${a.id}"><span class="ae">${a.emoji}</span><span class="at"><b>${a.label}</b><small>${a.d}</small></span>${tagHtml(a.id)}</button>`).join('');
  }
  function setAge(id) {
    const s = st(); s.age = id; S.save(); sfx('pop'); haptic('success');
    toast(ageInfo(id).emoji + ' Режим уроков: ' + ageInfo(id).tag);
    if (id === 'kids') setTimeout(() => speak('Привет! Будем учиться вместе!'), 300);
  }
  function ageModal(onDone, locked) {
    const m = openModal(`<h2>Сколько лет ученику?</h2><p>От возраста зависит формат уроков.</p><div class="stack age-list">${ageButtons(st().age)}</div>`, { center: true, locked: !!locked });
    $$('[data-age]', m).forEach(b => { b.onclick = () => { setAge(b.dataset.age); closeModal(); if (onDone) onDone(); }; });
  }

  /* ───────── v1.15: уроки по возрасту ───────── */
  function picOpts(w, pool, n) {
    const seen = [D.words[w].emoji], ru = D.words[w].ru;
    const rest = shuffle(pool.filter(x => x !== w && D.words[x] && D.words[x].ru !== ru)).filter(x => {
      const e = D.words[x].emoji; if (!e || seen.indexOf(e) >= 0) return false; seen.push(e); return true;
    });
    return shuffle([w].concat(rest.slice(0, n - 1)));
  }
  function distinctPics(ids, n) {
    const seen = [], out = [];
    shuffle(ids).forEach(id => { const e = D.words[id] && D.words[id].emoji; if (e && seen.indexOf(e) < 0 && out.length < n) { seen.push(e); out.push(id); } });
    return out;
  }
  function kidsQueue(lesson, pool) {
    const q = [];
    lesson.words.forEach(w => { q.push({ type: 'k_intro', w }); q.push({ type: 'k_pick', w, opts: picOpts(w, pool, 3) }); });
    shuffle(lesson.words.concat(sample(lesson.review, Math.min(2, lesson.review.length)))).forEach(w => q.push({ type: 'k_pick', w, opts: picOpts(w, pool, 4) }));
    const mp = distinctPics(uniq(lesson.words.concat(lesson.review)), 4);
    if (mp.length >= 3) q.push({ type: 'k_match', pairs: mp });
    return q;
  }
  function stdQueue(lesson, pool) {
    const first = !((st().lessons[lesson.id] || {}).done), q = [], mid = [];
    lesson.words.forEach(w => {
      if (first || !st().words[w]) q.push({ type: 'intro', w });
      q.push({ type: 'listen', w, opts: optionsFor(w, pool, 4) });
    });
    lesson.words.forEach(w => mid.push({ type: 'choose_ru', w, opts: optionsFor(w, pool, 4) }));
    sample(lesson.words, Math.min(1, lesson.words.length)).forEach(w => mid.push({ type: 'choose_bu', w, opts: optionsFor(w, pool, 3) }));
    sample(lesson.review, Math.min(2, lesson.review.length)).forEach(w => mid.push({ type: 'listen', w, opts: optionsFor(w, pool, 4) }));
    shuffle(mid).forEach(e => q.push(e));
    if (lesson.phrases[0]) q.push({ type: 'build', phrase: lesson.phrases[0], dir: 'bu2ru' });
    const mp = uniq(lesson.words.concat(lesson.review));
    if (mp.length >= 3) q.push({ type: 'match', pairs: sample(mp, Math.min(4, mp.length)) });
    return q;
  }
  /* Голосовая инструкция, затем (по желанию) слово */

  const KIDS_AUDIO = {
    'Послушай и повтори': 'k_listen_repeat',
    'Послушай и нажми на картинку': 'k_listen_tap',
    'Нажми на звук, а потом на картинку': 'k_sound_then_pic',
    'Молодец!': 'k_molodec',
    'Умница!': 'k_umnica',
    'Отлично!': 'k_otlichno',
    'Здорово!': 'k_zdorovo',
    'Ура! Правильно!': 'k_ura',
    'Ой! Это вот так.': 'k_oy',
    'Привет! Будем учиться вместе!': 'k_hello'
  };
  let kVoiceT = null;
  function kidsVoice(text, then) {
    clearTimeout(kVoiceT);
    const id = KIDS_AUDIO[text];
    const audio = id ? audioFor(id) : null;
    const done = () => { if (ui.lesson && typeof then === 'function') then(); };
    speak(text, false, audio, done);
  }
  const kSpk = () => '<button class="k-spk" data-silent data-ksay aria-label="Прослушать">🔊</button>';
  function kBindSay(root, w) { $$('[data-ksay]', root).forEach(b => { b.onclick = e => { e.stopPropagation(); clearTimeout(kVoiceT); speak(w.bu, false, audioOf(w)); b.classList.remove('ping'); void b.offsetWidth; b.classList.add('ping'); }; }); }
  function exKidsIntro(ex, root, foot) {
    const w = D.words[ex.w];
    root.innerHTML = `<div class="k-wrap"><div class="k-head">👂</div><button class="k-pic big" data-ksay data-silent>${w.emoji || '🔊'}</button><div class="k-meaning">${esc(w.ru || '')}</div>${kSpk()}</div>`;
    kBindSay(root, w);
    kidsVoice('Послушай и повтори', () => speak(w.bu, false, audioOf(w)));
    const b = $('#lCheck', foot); b.disabled = false; b.innerHTML = '▶'; b.classList.add('k-next');
    ui.lesson.ready = true;
  }
  function exKidsPick(ex, root) {
    const w = D.words[ex.w];
    root.innerHTML = `<div class="k-wrap"><div class="k-head">👂 → 👆</div>${kSpk()}<div class="k-grid n${ex.opts.length}">${ex.opts.map(id => `<button class="card-opt k-pic" data-id="${id}">${D.words[id].emoji}</button>`).join('')}</div></div>`;
    kBindSay(root, w);
    $('#lCheck').innerHTML = '👆';
    kidsVoice('Послушай и нажми на картинку', () => speak(w.bu, false, audioOf(w)));
    bindChoice(root, '.k-pic', ex.w, () => ({ kids: w.emoji, kidsWord: w }), () => setTimeout(() => { const L = ui.lesson; if (L && !L.checked && L.ready) doCheck(); }, 380));
  }
  function exKidsMatch(ex, root, foot) {
    const L = ui.lesson, ids = ex.pairs, left = shuffle(ids), right = shuffle(ids);
    const COL = ['#1CB0F6', '#FF9600', '#CE82FF', '#58CC02', '#FF4B4B'];
    root.innerHTML = `<div class="k-wrap"><div class="k-head">🔊 ↔ 🖼️</div><div class="match-grid k-match">${left.map((id, i) => `<button class="row-opt k-snd" data-side="l" data-id="${id}" style="--c:${COL[i % 5]}">🔊</button><button class="row-opt k-pic2" data-side="r" data-id="${right[i]}">${D.words[right[i]].emoji}</button>`).join('')}</div></div>`;
    $('#lCheck', foot).innerHTML = '🔊 ↔ 🖼️';
    kidsVoice('Нажми на звук, а потом на картинку');
    let selL = null, selR = null, matched = 0, busy = false;
    $$('.row-opt', root).forEach(b => {
      b.onclick = () => {
        if (busy || b.classList.contains('done')) return;
        const side = b.dataset.side;
        $$(`.row-opt[data-side="${side}"]`, root).forEach(x => x.classList.remove('sel'));
        b.classList.add('sel');
        if (side === 'l') { selL = b; const w = D.words[b.dataset.id]; clearTimeout(kVoiceT); speak(w.bu, false, audioOf(w)); } else selR = b;
        if (!selL || !selR) return;
        const a = selL, c = selR; selL = selR = null; a.classList.remove('sel'); c.classList.remove('sel');
        if (a.dataset.id === c.dataset.id) {
          a.classList.add('ok'); c.classList.add('ok'); sfx('pop'); haptic('light');
          setTimeout(() => { a.classList.add('done'); c.classList.add('done'); }, 300);
          if (++matched === ids.length) setTimeout(() => { L.evaluate = () => ({ ok: true }); L.ready = true; doCheck(); }, 450);
        } else {
          a.classList.add('bad'); c.classList.add('bad'); L.mistakes++; L.combo = 0; updateCombo(); sfx('wrong'); haptic('error'); busy = true;
          setTimeout(() => { a.classList.remove('bad'); c.classList.remove('bad'); busy = false; }, 550);
        }
      };
    });
  }
  const PRAISE_K = ['Молодец!', 'Умница!', 'Отлично!', 'Здорово!', 'Ура! Правильно!'];
  function kidsSheet(ok, r) {
    const sh = $('#lSheet');
    sh.className = 'sheet k-sheet ' + (ok ? 'good' : 'wrong');
    sh.innerHTML = `<div class="k-res"><span class="k-big">${ok ? '🌟' : '🙈'}</span>${r.kids ? `<span class="k-ans">${r.kids}</span>` : ''}</div><button class="btn ${ok ? '' : 'wrongbtn'} k-next" id="sNext" aria-label="Дальше">▶</button>`;
    void sh.offsetWidth; sh.classList.add('show');
    clearTimeout(kVoiceT);
    const pText = ok ? PRAISE_K[Math.floor(Math.random() * PRAISE_K.length)] : 'Ой! Это вот так.';
    const pId = KIDS_AUDIO[pText];
    speak(pText, false, pId ? audioFor(pId) : null);
    if (!ok && r.kidsWord) kVoiceT = setTimeout(() => speak(r.kidsWord.bu, false, audioOf(r.kidsWord)), 1300);
    $('#sNext').onclick = () => { sh.classList.remove('show'); nextExercise(); };
  }
  /* Standart: голосовая подсказка — медленно проговаривает слово задания */
  function stdHint(ex, root) {
    const w = ex.w && D.words[ex.w]; if (!w || ex.type === 'intro') return;
    root.insertAdjacentHTML('afterbegin', '<button class="v-hint" data-silent id="vHint">🗣️ Подсказка</button>');
    $('#vHint', root).onclick = e => { e.stopPropagation(); speak(w.bu, true, audioOf(w)); };
  }

  /* ───────── v1.15: юрта изнутри и «Шагай наадан» ───────── */
  function tween(ms, fn, ease) {
    const e = ease || (t => 1 - Math.pow(1 - t, 3));
    return new Promise(res => {
      const t0 = performance.now();
      const step = now => { const t = Math.min(1, (now - t0) / ms); fn(e(t), t); if (t < 1) requestAnimationFrame(step); else res(); };
      requestAnimationFrame(step);
    });
  }
  function sleeveOf() {
    const out = D.itemsById[st().equip.outfit] || D.itemsById.tshirt_green || {};
    return { c: out.style === 'vest' ? (out.shirt || '#FBF4E6') : (out.color || '#58CC02'), cuff: out.style === 'degel' ? (out.trim || '#FFD43B') : (out.dark || 'rgba(0,0,0,.18)') };
  }
  function yurtHit(stage, scr) {
    const y = stage.querySelector('.scene-svg .yurt'); if (!y) return;
    const sr = stage.getBoundingClientRect(), r = y.getBoundingClientRect(); if (!r.width) return;
    const b = document.createElement('button'); b.className = 'yurt-hit'; b.setAttribute('aria-label', 'Зайти в юрту');
    b.style.left = (r.left - sr.left) + 'px'; b.style.top = (r.top - sr.top) + 'px';
    b.style.width = r.width + 'px'; b.style.height = (r.height * .82) + 'px';
    b.onclick = e => { e.stopPropagation(); enterYurt(stage); };
    stage.insertBefore(b, stage.firstChild.nextSibling);
  }
  async function enterYurt(stage) {
    if (ui.ritual || ui.riding || ui.skating || ui.sheltered || ui.eating || ui.yurtBusy || ui.loc !== 'home') return;
    const hold = $('#mHold', stage), y = stage.querySelector('.scene-svg .yurt');
    if (!hold || !y) return;
    ui.yurtBusy = true; sfx('pop'); haptic('light');
    const yr = y.getBoundingClientRect();
    hold.classList.add('walk');
    hold.style.transition = 'transform 1s cubic-bezier(.45,.05,.4,1), opacity .5s ease .5s';
    moveTo(hold, yr.left + yr.width * .5, yr.bottom - yr.height * .1, .3);
    hold.style.opacity = '0';
    await wait12(1020);
    ui.loc = 'yurt';
    hold.classList.remove('walk'); hold.style.transition = 'none'; hold.style.transform = ''; hold.style.opacity = '';
    hold.classList.add('away');
    mountYurt(stage, false);
    await wait12(60); hold.style.transition = '';
    ui.yurtBusy = false;
  }
  function mountYurt(stage, instant) {
    const old = $('.yurt-in', stage); if (old) old.remove();
    const el = document.createElement('div'); el.className = 'yurt-in' + (instant ? ' on' : '');
    const eq = Object.assign({}, st().equip, { hand: null });
    el.innerHTML = window.BG_YURT.interior(M.svg(eq, { mood: 'happy', cls: 'static' }), sleeveOf()) +
      '<div class="yi-res" id="yiRes">🎲 Нажмите на руку Бато — он бросит шагаи</div>';
    stage.appendChild(el);
    if (!instant) requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
    $('.yi-door', el).addEventListener('click', e => { e.stopPropagation(); exitYurt(stage); });
    $('.yi-hand', el).addEventListener('click', e => { e.stopPropagation(); throwShagai(el); });
    window.BG_YURT.bind($('.yi-svg', el));
  }
  async function exitYurt(stage) {
    if (ui.yurtBusy || ui.shagai) return;
    const el = $('.yurt-in', stage), hold = $('#mHold', stage);
    ui.yurtBusy = true; sfx('pop'); haptic('light');
    const door = el && $('.yi-door', el); if (door) door.classList.add('open');
    await wait12(260);
    if (el) { el.classList.remove('on'); await wait12(420); el.remove(); }
    ui.loc = 'home';
    if (hold) {
      const y = stage.querySelector('.scene-svg .yurt');
      hold.style.transition = 'none'; hold.classList.remove('away');
      if (y) {
        const yr = y.getBoundingClientRect();
        moveTo(hold, yr.left + yr.width * .5, yr.bottom - yr.height * .1, .3); hold.style.opacity = '0';
        void hold.offsetWidth;
        hold.classList.add('walk');
        hold.style.transition = 'transform 1s cubic-bezier(.45,.05,.4,1), opacity .4s ease';
        hold.style.transform = ''; hold.style.opacity = '';
        await wait12(1020);
        hold.classList.remove('walk');
      }
      hold.style.transition = '';
    }
    ui.yurtBusy = false;
    wxSync(stage, false);
  }
  async function throwShagai(el) {
    if (ui.shagai || ui.yurtBusy) return;
    ui.shagai = true;
    const Y = window.BG_YURT, sv = $('.yi-svg', el), palm = $('.yi-palm', el), bones = $('.yi-bones', el), res = $('#yiRes', el), hint = $('.yi-hint', el);
    if (hint) hint.remove();
    bones.innerHTML = ''; res.classList.remove('win');
    res.textContent = '✋ Бато достаёт шагаи из кармана…';
    haptic('light');
    const H = Y.HAND, P = Y.POCKET, U = Y.RAISE, T = Y.TOSS;
    const setH = (x, y, r, sc) => Y.setHand(sv, x, y, r, sc);
    const io = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const lerp = (A, B, t) => [A.x + (B.x - A.x) * t, A.y + (B.y - A.y) * t];
    await tween(460, t => { const [x, y] = lerp(H, P, t); setH(x, y - 7 * Math.sin(Math.PI * t), -12 * t, 1 - .14 * t); }, io);
    await wait12(220);
    palm.innerHTML = Y.palmBones(); sfx('pop');
    await tween(440, t => { const [x, y] = lerp(P, U, t); setH(x, y, -12 + 2 * t, .86 + .14 * t); }, io);
    await tween(300, t => setH(U.x + 2.5 * Math.sin(t * Math.PI * 4), U.y + 1.5 * Math.sin(t * Math.PI * 8), -10, 1), t => t);
    await tween(170, t => { const [x, y] = lerp(U, T, t); setH(x, y, -10 + 32 * t, 1); }, t => t * t);
    palm.innerHTML = '';
    sfx('pop'); haptic('medium');
    const rolls = [0, 1, 2, 3].map(() => Y.roll());
    const x0 = T.x, y0 = T.y - 5;
    const slots = shuffle(Y.SLOTS.slice());
    tween(420, t => { const [x, y] = lerp(T, H, t); setH(x, y, 22 - 22 * t, 1); }, io);
    await Promise.all(rolls.map((side, i) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'yi-bone');
      g.innerHTML = `<g class="yi-rot">${Y.bone('tumble')}</g>`; g.setAttribute('transform', `translate(${x0} ${y0}) scale(.4)`);
      bones.appendChild(g);
      const rot = $('.yi-rot', g);
      const tx = slots[i] + (Math.random() - .5) * 8, ty = Y.SLOT_Y + (Math.random() - .5) * 6, tr = (Math.random() - .5) * 60;
      const spin = (Math.random() < .5 ? -1 : 1) * (360 + Math.random() * 280), dur = 680 + i * 80;
      return wait12(i * 55).then(() => tween(dur, (e, t) => {
        const x = x0 + (tx - x0) * e, y = y0 + (ty - y0) * e - 30 * Math.sin(Math.PI * t) * (1 - t * .25);
        g.setAttribute('transform', `translate(${x} ${y}) scale(${.4 + .4 * e})`);
        rot.setAttribute('transform', `rotate(${spin * (1 - e) + tr})`);
      }, t => t)).then(() => {
        rot.innerHTML = Y.bone(side.id);
        bones.insertAdjacentHTML('beforeend', `<text class="yi-lbl" x="${tx.toFixed(1)}" y="${Y.LBL_Y}" text-anchor="middle">${side.bu}</text>`);
        sfx('pop');
        return tween(200, (e, t) => g.setAttribute('transform', `translate(${tx} ${ty - 4 * Math.sin(Math.PI * t)}) scale(.8)`), t => t);
      });
    }));
    const cnt = {}; rolls.forEach(r => { cnt[r.id] = (cnt[r.id] || 0) + 1; });
    const txt = Y.SIDES.filter(sd => cnt[sd.id]).map(sd => `${sd.icon} ${sd.bu} (${sd.ru.toLowerCase()}) ×${cnt[sd.id]}`).join(' · ');
    const four = Object.keys(cnt).length === 1;
    const s = st(); s.shagai = s.shagai || { throws: 0, best: 0 }; s.shagai.throws++;
    if (four) {
      s.shagai.best++;
      res.innerHTML = `🎉 Дүрбэн ${esc(rolls[0].bu)}! Редкая удача!`; res.classList.add('win');
      confetti(); sfx('complete'); haptic('success');
    } else res.textContent = txt;
    S.save();
    speak(rolls.map(r => r.bu).join(', '));
    ui.shagai = false;
  }

  /* ───────── v1.15: Бато ест буузы ───────── */
  const buuzN = () => Math.max(0, st().buuz || 0);
  async function eatBuuz(hold) {
    if (ui.eating) return;
    ui.eating = true;
    hold.classList.remove('jump');
    const sv = () => $('svg.mascot-svg', hold);
    const s0 = sv(); if (s0) s0.classList.remove('wave');
    sfx('pop'); haptic('light');
    for (let k = 0; k < 2; k++) {
      const v = sv(); if (!v) break;
      v.classList.remove('chew'); void v.getBBox; v.classList.add('bite');
      await wait12(540);
      v.classList.remove('bite'); v.classList.add('chew'); haptic('light');
      await wait12(1800);
      v.classList.remove('chew');
      await wait12(180);
    }
    const s = st(); s.buuz = Math.max(0, (s.buuz || 0) - 1); S.save();
    const host = $('.m-turn', hold) || hold;
    host.innerHTML = M.svg(s.equip, { mood: 'happy' });
    ui.eating = false;
    speak('Бууза амтатай!');
    toast(`😋 Амтатай! Осталось бууз на тарелке: ${s.buuz}`);
    const pr = $('.item-card[data-id="buuza_plate"] .nm'); if (pr) pr.textContent = 'Тарелка бууз · 🥟' + s.buuz;
  }

  function heldCup() { const it = D.itemsById[st().equip.hand]; return it && it.cup ? it : null; }
  function mascotTap(hold, box, talk) {
    if (ui.ritual || ui.riding || ui.skating || ui.sheltered || ui.eating) return;
    if (st().equip.hand === 'buuza_plate') { if ((st().buuz || 0) > 0) eatBuuz(hold); else { toast('🍽️ Тарелка пуста — докупите буузы: Магазин → 🥟 Еда'); haptic('light'); } return; }
    const cup = heldCup();
    if (cup && !isCupEmpty(cup.id)) { ritual(hold, box); return; }
    if (cup) { toast('🥣 ' + esc(cup.name) + ' пуста — наполните её в магазине за ' + D.cupRefill + ' ' + BZI); haptic('light'); }
    if (talk) talk();
  }
  function ritual(hold, box) {
    const cup = heldCup(); if (!cup || !hold) return;
    ui.ritual = true;
    const wait = ms => new Promise(r => setTimeout(r, ms));
    let turn = $('.m-turn', hold);
    if (!turn) { turn = document.createElement('div'); turn.className = 'm-turn'; while (hold.firstChild) turn.appendChild(hold.firstChild); hold.appendChild(turn); }
    hold.classList.remove('jump');
    const svgEl = () => $('svg', turn);
    const s0 = svgEl(); if (s0) s0.classList.remove('wave');
    const color = cup.id === 'milk' ? '#FFFFFF' : '#D9B27C';
    const splash = () => {
      const c = $('.m-held', turn), host = box || hold.parentElement; if (!c || !host) return;
      const r = c.getBoundingClientRect(), hr = host.getBoundingClientRect();
      const x0 = r.left + r.width / 2 - hr.left, y0 = r.top - hr.top;
      for (let i = 0; i < 9; i++) {
        const d = document.createElement('i'); d.className = 'drop';
        d.style.left = x0 + 'px'; d.style.top = y0 + 'px'; d.style.background = color;
        d.style.setProperty('--dx', ((Math.random() - 0.5) * 90) + 'px');
        d.style.setProperty('--dy', (-70 - Math.random() * 70) + 'px');
        d.style.animationDelay = (i * 18) + 'ms';
        host.appendChild(d); setTimeout(() => d.remove(), 1100);
      }
    };
    (async () => {
      sfx('pop'); haptic('light');
      turn.classList.add('rt-a');                 /* 0° → 90° */
      await wait(420);
      if (svgEl()) svgEl().classList.add('from-back');
      turn.classList.add('rt-b');                 /* 90° → 180°: Бато спиной к нам, лицом к горам */
      await wait(460);
      for (let k = 0; k < 3; k++) {               /* три традиционных взмаха */
        const sv = svgEl(); if (!sv) break;
        sv.classList.remove('flick'); void sv.getBoundingClientRect(); sv.classList.add('flick');
        await wait(260); splash(); haptic('light');
        await wait(300);
      }
      cupsState()[cup.id] = false; S.save();       /* пиала пустеет */
      const keep = svgEl() ? svgEl().className.baseVal : '';
      turn.innerHTML = M.svg(st().equip, { mood: 'happy' });
      if (svgEl()) svgEl().setAttribute('class', keep.replace(/\bflick\b/, '').replace(/\bwave\b/, ''));
      await wait(250);
      turn.classList.remove('rt-b');              /* 180° → 90° */
      await wait(440);
      if (svgEl()) svgEl().classList.remove('from-back');
      turn.classList.remove('rt-a');              /* 90° → 0° */
      await wait(460);
      ui.ritual = false;
      sfx('complete'); haptic('success');
      toast('🙏 Подношение духам гор совершено. Пиала пуста — наполнить можно в магазине за ' + D.cupRefill + ' ' + BZI);
      if (ui.view === 'shop') refreshShop(false);
    })();
  }
  /* ───────── v1.12: собака, будка, возрождение огонька, поездка в Улан-Удэ ───────── */
  const wait12 = ms => new Promise(r => setTimeout(r, ms));
  const cleanName = v => String(v || '').replace(/[<>"'`&]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12);
  function dogState() { return st().dog || null; }
  function cupLiquid() { const c = heldCup(); return c && c.id === 'milk' ? '#FFFFFF' : '#D9B27C'; }
  function dogHtml(where) {
    const d = dogState(); if (!d) return '';
    return `<div class="dog-wrap ${where}" data-dog-w="${where}"><div class="dog-bub"></div><div class="dog-turn">${window.BG_ART.dogSvg('dog-svg', cupLiquid(), dogWearOf())}</div><div class="dog-name">${esc(d.name)}</div></div>`;
  }
  function dogSay(w, t) {
    const b = $('.dog-bub', w); if (!b) return;
    b.textContent = t; b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
    clearTimeout(w._bt); w._bt = setTimeout(() => b.classList.remove('on'), 1600);
  }
  function poof(w) { const p = document.createElement('i'); p.className = 'poof'; p.textContent = '✨'; w.appendChild(p); setTimeout(() => p.remove(), 650); }
  function dogTap(w, stage) {
    if (ui.ritual || ui.riding || ui.skating || ui.sheltered || w._busy) return;
    const d = dogState(); if (!d) return;
    const turn = $('.dog-turn', w);
    if (w.dataset.home === '1') {                 /* из будки — обратно к Бато */
      w._busy = true; w.classList.add('run'); w.style.transform = '';
      sfx('pop');
      setTimeout(() => { w.classList.remove('run'); w.dataset.home = ''; w._busy = false; dogSay(w, 'Гав! 🐾'); }, 1150);
      return;
    }
    const k = stage && stage.querySelector('.scene-svg .kennel');
    if (!d.house || !k) {
      w.classList.remove('hop'); void w.offsetWidth; w.classList.add('hop'); dogSay(w, 'Гав-гав!'); haptic('light');
      if (!d.house) toast('🏠 Купите будку в разделе «Питомцы» — и ' + esc(d.name) + ' будет к ней бегать');
      return;
    }
    const kr = k.getBoundingClientRect(), wr = w.getBoundingClientRect();
    const dx = kr.right - (wr.left + wr.width / 2) + 2, dy = kr.bottom - wr.bottom - 2;
    w._busy = true; turn.classList.add('face-l'); w.classList.add('run');
    w.style.transform = `translate(${dx}px, ${dy}px) scale(.5)`;
    sfx('pop');
    setTimeout(() => { w.classList.remove('run'); turn.classList.remove('face-l'); w.dataset.home = '1'; w._busy = false; dogSay(w, '🏠'); }, 1150);
  }
  function dogCards() {
    const d = dogState();
    const kSvg = `<svg class="dog-svg" viewBox="-38 -64 76 70" xmlns="http://www.w3.org/2000/svg">${window.BG_ART.kennel()}</svg>`;
    return `<div class="pets-h">🐕 Собака${d ? ' · ' + esc(d.name) : ''}</div>
      <button class="item-card pet-card ${d ? 'equipped' : ''}" data-dog="dog">${d ? '<span class="tag" style="background:var(--blue)">С Бато</span>' : ''}<div class="pv">${window.BG_ART.dogSvg('dog-svg', null, dogWearOf())}</div><div class="nm">${d ? esc(d.name) : 'Нохой — собака'}</div><div class="price">${d ? '✏️ Имя' : BZI + ' ' + D.dogPrice}</div></button>
      <button class="item-card pet-card ${d && d.house ? 'equipped' : ''}" data-dog="house"><div class="pv">${kSvg}</div><div class="nm">Будка</div><div class="price">${d && d.house ? '✔ У юрты' : BZI + ' ' + D.kennelPrice}</div></button>`;
  }
  function dogModal() {
    const s = st(), d = dogState();
    const m = openModal(`<div class="horse-pv">${window.BG_ART.dogSvg('dog-svg big', null, dogWearOf())}</div>
      <h2>${d ? esc(d.name) : 'Нохой — собака'}</h2>
      <p>${d ? 'Верный друг Бато всегда рядом. Нажмите на собаку — она побежит к будке. Во время обряда брызганья она присоединяется к Бато со своей миской.' : 'Собака всегда будет рядом с Бато и будет брызгать молоко вместе с ним. Дайте ей уникальное имя:'}</p>
      <input id="dogName" class="dog-in" maxlength="12" autocomplete="off" placeholder="Например, Баабгай" value="${d ? esc(d.name) : ''}">
      <p class="dog-err" id="dogErr"></p>
      <div class="stack">${d ? '<button class="btn blue" data-act="rename">Сохранить имя</button>' : `<button class="btn gold" data-act="buy">Купить за ${BZI} ${D.dogPrice}</button>`}
      <button class="btn ghost dark" data-act="close">Закрыть</button></div>`);
    const inp = $('#dogName', m), err = $('#dogErr', m);
    if (!d) setTimeout(() => inp && inp.focus(), 250);
    $$('[data-act]', m).forEach(b => {
      b.onclick = () => {
        const act = b.dataset.act;
        if (act === 'close') return closeModal();
        const name = cleanName(inp.value);
        if (name.length < 2) { err.textContent = 'Введите имя собаки (2–12 символов)'; haptic('error'); return; }
        if (act === 'rename') { s.dog.name = name; S.save(); closeModal(); toast('🐕 Теперь собаку зовут ' + esc(name)); refreshShop(false); return; }
        if (s.buzzy < D.dogPrice) { haptic('error'); sfx('wrong'); toast(`Не хватает ${D.dogPrice - s.buzzy} ${BZI}. Пройдите урок!`); return; }
        s.buzzy -= D.dogPrice; s.stats.purchases++; s.dog = { name, house: false }; S.save();
        closeModal(); sfx('coin'); haptic('success'); confetti();
        toast('🐕 ' + esc(name) + ' теперь живёт с Бато!');
        refreshShop(true);
      };
    });
  }
  function kennelModal() {
    const s = st(), d = dogState();
    let btn;
    if (!d) btn = '<button class="btn" disabled>Сначала купите собаку</button>';
    else if (d.house) btn = '<button class="btn" disabled>✔ Будка уже стоит у юрты</button>';
    else btn = `<button class="btn gold" data-act="buy">Купить за ${BZI} ${D.kennelPrice}</button>`;
    const m = openModal(`<div class="horse-pv"><svg class="dog-svg big" viewBox="-38 -64 76 70" xmlns="http://www.w3.org/2000/svg">${window.BG_ART.kennel()}</svg></div>
      <h2>Будка</h2><p>Ставится на локации рядом с юртой. Нажмите на собаку — и она побежит к своей будке, ещё раз — вернётся к Бато.</p>
      <div class="stack">${btn}<button class="btn ghost dark" data-act="close">Закрыть</button></div>`);
    $$('[data-act]', m).forEach(b => {
      b.onclick = () => {
        if (b.dataset.act === 'close') return closeModal();
        if (s.buzzy < D.kennelPrice) { haptic('error'); sfx('wrong'); toast(`Не хватает ${D.kennelPrice - s.buzzy} ${BZI}. Пройдите урок!`); return; }
        s.buzzy -= D.kennelPrice; s.stats.purchases++; s.dog.house = true; S.save();
        closeModal(); sfx('coin'); haptic('success'); confetti();
        toast('🏠 Будка поставлена у юрты!');
        refreshShop(true);
      };
    });
  }
  /* Возрождение огонька: возвращает потухшую серию целиком (+ дни новой серии, если она уже началась) */
  function reviveStreak() {
    const s = st(), L = s.lostStreak; if (!L || !L.n) return false;
    const t = S.today(), y = S.addDays(t, -1);
    if (s.streak > 0 && (s.lastActive === t || s.lastActive === y)) s.streak += L.n;
    else { s.streak = L.n; s.lastActive = y; }
    s.bestStreak = Math.max(s.bestStreak || 0, s.streak);
    s.lostStreak = null;
    return true;
  }
  function weekBonusHtml() {
    const s = st(), got = s.weekBonusDay === S.today(), inW = s.streak % 7, filled = got ? 7 : inW, left = 7 - filled;
    let bar = ''; for (let i = 0; i < 7; i++) bar += `<i class="${i < filled ? 'on' : ''}"></i>`;
    return `<div class="week-bonus"><div class="wb-t">🎁 Неделя огня = +${D.weekStreakBonus} ${BZI}</div><div class="wb-bar">${bar}</div>
      <div class="wb-d">${got ? 'Бонус начислен сегодня! 🎉' : 'Держите огонёк 7 дней без пропусков · осталось ' + left + ' ' + plural(left, ['день', 'дня', 'дней'])}</div></div>
      ${s.lostStreak && s.lostStreak.n ? `<p class="wb-lost">💔 Огонёк потух (было ${s.lostStreak.n} ${plural(s.lostStreak.n, ['день', 'дня', 'дней'])}). В магазине → «Заморозки» есть «Возрождение Огонька».</p>` : ''}`;
  }
  /* ───────── v1.12: поездка верхом в Улан-Удэ и обратно ───────── */
  const CITY_BADGE = '<div class="city-badge">🏙️ Улан-Удэ · Площадь Советов</div>';
  function riderHtml(h) {
    return `<div class="rider" id="rider" role="button" aria-label="Бато верхом"><div class="rd-in">
      <div class="rd-horse"><svg class="horse-svg" viewBox="-62 -96 124 104" xmlns="http://www.w3.org/2000/svg">${window.BG_ART.horse(0, 0, 1, h, 0, true)}</svg></div>
      <div class="rd-bato">${M.svg(st().equip, { mood: 'happy', cls: 'static' })}</div>
      <div class="rd-leg"><i></i></div></div></div>`;
  }
  function rideHorseOf(id) { const hs = stageHorses() || []; return hs.find(x => x.id === id) || hs[0] || null; }
  /* ───────── v1.13: погода, коньки, одежда собаки, пасхалка разработчика ───────── */
  const DEV_PASS = '2014';
  const DEV_KEY = 'buryatgo_dev_auth_v1';
  const devRemembered = () => { try { if (localStorage.getItem(DEV_KEY) === '1') return true; } catch (e) { /* нет памяти */ } return !!(S.state && S.state.admin); };
  const WX_KEY = 'buryatgo_weather_v1';
  const WX_META = { sun: ['☀️', 'Солнечно'], rain: ['🌧️', 'Дождь'], snow: ['❄️', 'Снег'] };
  const wxRnd = (a, b) => a + Math.random() * (b - a);
  function wxLoad() {
    try { const w = JSON.parse(localStorage.getItem(WX_KEY) || 'null'); if (w && WX_META[w.mode] && isFinite(w.until)) return w; } catch (e) { /* нет данных */ }
    return { mode: 'sun', until: Date.now() + wxRnd(D.wxSun[0], D.wxSun[1]) * 1000, ice: 0, iceT: Date.now(), iceDir: 0 };
  }
  let WX = wxLoad();
  const wxSave = () => { try { localStorage.setItem(WX_KEY, JSON.stringify(WX)); } catch (e) { /* память недоступна */ } };
  /* Уровень льда 0..1: замерзание за 5 с, таяние за D.wxMeltSec (150 с = 2,5 мин) */
  function wxIce(now) {
    now = now || Date.now();
    const rate = WX.iceDir > 0 ? 5000 : (D.wxMeltSec || 150) * 1000;
    return Math.max(0, Math.min(1, (WX.ice || 0) + (WX.iceDir || 0) * (now - (WX.iceT || now)) / rate));
  }
  function wxSetIce(level, dir) { WX.ice = level; WX.iceT = Date.now(); WX.iceDir = dir; }
  function wxSet(mode, sec) {
    const now = Date.now(), cur = wxIce(now);
    const r = { sun: D.wxSun, rain: D.wxRain, snow: D.wxSnow }[mode] || [20, 30];
    WX.mode = mode; WX.until = now + (sec != null ? sec : wxRnd(r[0], r[1])) * 1000;
    if (mode === 'snow') wxSetIce(1, 0);                       /* ручей замерзает */
    else if (cur > 0 && WX.iceDir >= 0) wxSetIce(cur, -1);     /* после снега — плавно тает */
    wxSave(); wxApply();
  }
  function wxNext() { wxSet(WX.mode !== 'sun' ? 'sun' : (Math.random() < .55 ? 'rain' : 'snow')); }
  const wxClock = sec => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  function wxApply() {
    const now = Date.now(), ice = wxIce(now);
    if ((WX.iceDir < 0 && ice <= 0) || (WX.iceDir > 0 && ice >= 1)) { wxSetIce(ice, 0); wxSave(); }
    const coat = !!st().horseCoat;
    $$('.mascot-stage.v4').forEach(sg => {
      sg.classList.toggle('wx-rain', WX.mode === 'rain'); sg.classList.toggle('wx-snow', WX.mode === 'snow');
      sg.classList.toggle('coat', coat); sg.classList.toggle('iced', ice >= .85 || WX.mode === 'snow');
      sg.style.setProperty('--ice', ice.toFixed(3));
    });
    const left = Math.max(0, Math.ceil((WX.until - now) / 1000)), m = WX_META[WX.mode], t = wxClock(left);
    const small = WX.iceDir < 0 && ice > 0 ? `💧 лёд тает · ${Math.round(ice * 100)}%` : ice >= .85 ? '🧊 ручей замёрз' : '';
    $$('.wx-badge').forEach(b => { b.innerHTML = `<span class="wx-e">${m[0]}</span><span class="wx-l">${m[1]}</span><b>${t}</b>${small ? `<small>${small}</small>` : ''}`; });
    const ds = $('#wxDevSt');
    if (ds) ds.textContent = `Сейчас: ${m[0]} ${m[1]} · до смены ${t} · лёд ${Math.round(ice * 100)}%${WX.iceDir > 0 ? ' (замерзает)' : WX.iceDir < 0 ? ' (тает)' : ''}`;
    $$('[data-wx]').forEach(b => b.classList.toggle('on', b.dataset.wx === WX.mode));
    const stage = $('#stage');
    if (stage && $('#mHold', stage)) wxSync(stage, false);
  }
  setInterval(() => { if (Date.now() >= WX.until) wxNext(); else wxApply(); }, 1000);

  function wxFxHtml() {
    let r = '', f = '';
    for (let i = 0; i < 44; i++) r += `<i class="rd" style="left:${((i * 37) % 100 + Math.random() * 2).toFixed(1)}%;animation-delay:${(-Math.random()).toFixed(2)}s;animation-duration:${(.55 + Math.random() * .35).toFixed(2)}s"></i>`;
    for (let i = 0; i < 34; i++) f += `<i class="sf" style="left:${(Math.random() * 100).toFixed(1)}%;animation-delay:${(-Math.random() * 7).toFixed(2)}s;animation-duration:${(4.5 + Math.random() * 4).toFixed(2)}s;--sz:${(3 + Math.random() * 4).toFixed(1)}px;--dx:${Math.round(Math.random() * 44 - 22)}px"></i>`;
    return `<div class="wx-fx" aria-hidden="true"><div class="wx-tint"></div><div class="wx-drops">${r}</div><div class="wx-flakes">${f}</div></div>`;
  }
  /* Вызывается после каждой отрисовки сцены магазина */
  function wxBind(scr) {
    const stage = $('#stage', scr); if (!stage || !stage.isConnected) return;
    $$('.wx-fx, .wx-badge, .stream-hit', stage).forEach(x => x.remove());
    stage.insertAdjacentHTML('beforeend', wxFxHtml() + '<div class="wx-badge" aria-live="polite"></div>');
    ui.sheltered = false;
    const s = stage.querySelector('.scene-svg .stream');
    if (s) requestAnimationFrame(() => {
      const sr = stage.getBoundingClientRect(), r = s.getBoundingClientRect(); if (!r.width) return;
      const b = document.createElement('button'); b.className = 'stream-hit'; b.setAttribute('aria-label', 'Ручей');
      Object.assign(b.style, { left: (r.left - sr.left) + 'px', top: (r.top - sr.top) + 'px', width: r.width + 'px', height: r.height + 'px' });
      b.onclick = e => { e.stopPropagation(); streamTap(stage); };
      stage.appendChild(b);
    });
    wxApply();
    wxSync(stage, true);
  }
  function wxSync(stage, instant) {
    const want = WX.mode === 'rain' && ui.loc === 'home' && !ui.riding;
    if (want && !ui.sheltered && !ui.ritual && !ui.skating) shelterIn(stage, instant);
    else if (!want && ui.sheltered) shelterOut(stage);
  }
  /* Смещение элемента так, чтобы его нижний центр попал в точку (x, y) */
  const moveTo = (el, x, y, sc) => { const r = el.getBoundingClientRect(); el.style.transform = `translate(${x - (r.left + r.width / 2)}px, ${y - r.bottom}px) scale(${sc})`; };
  function shelterIn(stage, instant) {
    const hold = $('#mHold', stage); if (!hold) return;
    const dw = $('.dog-wrap', stage), d = dogState(), umb = st().owned.indexOf('umbrella') >= 0;
    ui.sheltered = umb ? 'umb' : 'yurt';
    if (instant) stage.classList.add('wx-instant');
    if (dw) { dw.style.transform = ''; dw.dataset.home = ''; }
    if (umb) {                                   /* авто-зонт: Бато и собака остаются на улице */
      hold._orig = hold.innerHTML;
      hold.innerHTML = M.svg(Object.assign({}, st().equip, { hand: 'umbrella' }), { mood: 'happy' });
      if (dw) dw.classList.add('umb');
      if (!instant) { sfx('pop'); toast('☂️ Дождь! Бато раскрыл зонтик'); }
    } else {
      const y = stage.querySelector('.scene-svg .yurt');
      if (y) {
        const yr = y.getBoundingClientRect(), door = [yr.left + yr.width * .5, yr.bottom - 2];
        moveTo(hold, door[0], door[1], .3); hold.classList.add('shelter');
        const k = d && d.house && stage.querySelector('.scene-svg .kennel');
        if (dw) {
          const kr = k && k.getBoundingClientRect();
          moveTo(dw, kr ? kr.left + kr.width / 2 : door[0] + 6, kr ? kr.bottom - 3 : door[1], .42);
          dw.classList.add('run', 'hide-in'); setTimeout(() => dw.classList.remove('run'), 1150);
        }
        if (!instant) { sfx('pop'); toast(d ? (d.house ? '🌧️ Дождь! Бато в юрте, ' + esc(d.name) + ' — в будке' : '🌧️ Дождь! Бато и ' + esc(d.name) + ' прячутся в юрте') : '🌧️ Дождь! Бато прячется в юрте'); }
      }
    }
    if (instant) requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.remove('wx-instant')));
  }
  function shelterOut(stage) {
    const hold = $('#mHold', stage), dw = $('.dog-wrap', stage), was = ui.sheltered;
    ui.sheltered = false;
    if (hold) { hold.classList.remove('shelter'); hold.style.transform = ''; if (was === 'umb' && hold._orig) hold.innerHTML = hold._orig; }
    if (dw) { dw.classList.remove('hide-in', 'umb'); dw.style.transform = ''; dw.dataset.home = ''; if (was === 'yurt') { dw.classList.add('run'); setTimeout(() => dw.classList.remove('run'), 1150); } }
    sfx('pop');
  }

  /* Коньки: нажатие на замёрзший ручей */
  function streamTap(stage) {
    if (ui.skating || ui.sheltered || ui.ritual || ui.riding) return;
    const ice = wxIce();
    if (ice < .85) { toast(ice > 0 ? '🧊 Лёд ещё тонкий — кататься опасно' : '💧 Ручей течёт. Кататься можно, когда он замёрзнет в снегопад'); return; }
    if (st().owned.indexOf('skates') < 0) { toast('⛸️ Купите «Коньки» в разделе «Одежда»'); return; }
    const hold = $('#mHold', stage), s = stage.querySelector('.scene-svg .stream'); if (!hold || !s) return;
    ui.skating = true;
    const orig = hold.innerHTML;
    hold.innerHTML = M.svg(Object.assign({}, st().equip, { feet: 'skates' }), { mood: 'happy' });
    const sr = s.getBoundingClientRect();
    hold.classList.add('to-ice'); moveTo(hold, sr.left + sr.width * .45, sr.top + sr.height * .8, .42);
    sfx('pop'); haptic('light');
    const T = 1150, SK = 7200;
    setTimeout(() => { hold.classList.add('skating'); toast('⛸️ Бато катается по льду!'); }, T);
    setTimeout(() => { hold.classList.remove('skating'); hold.style.transform = ''; }, T + SK);
    setTimeout(() => { hold.classList.remove('to-ice'); hold.innerHTML = orig; ui.skating = false; wxApply(); }, T * 2 + SK);
  }

  /* Одежда собаки и зимняя попона коней */
  function dogWearOf() { const e = st().equip || {}; return { dhat: e.dhat, dacc: e.dacc, dcoat: e.dcoat }; }
  function coatCard() {
    const on = !!st().horseCoat;
    return `<div class="pets-h">❄️ Зимняя попона для коней</div><button class="item-card pet-card ${on ? 'equipped' : ''}" data-coat="1">${on ? '<span class="tag" style="background:var(--blue)">Куплено</span>' : ''}<div class="pv">${window.BG_ART.horseSvg(D.horses[0], 'horse-svg coat-on')}</div><div class="nm">Зимняя попона</div><div class="price">${on ? '❄️ В снегопад' : BZI + ' ' + D.horseCoatPrice}</div></button>`;
  }
  function coatModal() {
    const s = st(), on = !!s.horseCoat;
    const m = openModal(`<div class="horse-pv">${window.BG_ART.horseSvg(D.horses[0], 'horse-svg big coat-on')}</div>
      <h2>Зимняя попона</h2><p>Тёплая красная попона с золотой вышивкой. Во время снегопада она сама надевается на всех ваших коней.</p>
      <div class="stack">${on ? '<button class="btn" disabled>✅ Уже куплено</button>' : `<button class="btn gold" data-act="buy">Купить за ${BZI} ${D.horseCoatPrice}</button>`}<button class="btn ghost dark" data-act="close">Закрыть</button></div>`);
    $$('[data-act]', m).forEach(b => {
      b.onclick = () => {
        if (b.dataset.act === 'close') { closeModal(); return; }
        if (s.buzzy < D.horseCoatPrice) { haptic('error'); sfx('wrong'); toast(`Не хватает ${D.horseCoatPrice - s.buzzy} ${BZI}`); return; }
        s.buzzy -= D.horseCoatPrice; s.horseCoat = true; s.stats.purchases++; S.save();
        closeModal(); sfx('coin'); haptic('success'); confetti(); toast('❄️ Попона куплена — в снег кони будут в тепле');
        refreshShop(true);
      };
    });
  }

  /* Пасхалка: 15 быстрых нажатий на «BuryatGo» или «Буряад хэлэн - манай баялиг» → пароль */
  let devTaps = 0, devTapT = 0;
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest && e.target.closest('.rb-banner, .ver-tap, .brand-logo');
    if (!t) return;
    const now = Date.now();
    devTaps = now - devTapT < 700 ? devTaps + 1 : 1; devTapT = now;
    if (devTaps >= 5) { devTaps = 0; openDeveloper(); }
  }, true);
  function openDeveloper() {
    if (devRemembered()) { ui.devAuth = true; sfx('coin'); haptic('success'); go('developer'); return; }
    const m = openModal(`<div class="dev-lock"><div class="dl-ic">🔐</div><h2>Панель разработчика</h2><p>Введите секретный пароль</p>
      <input type="password" id="devPass" class="dev-pass" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Secret-Password">
      <p class="dl-err" id="devErr"></p>
      <div class="stack"><button class="btn blue" id="devGo">🔓 Открыть</button><button class="btn ghost dark" id="devCancel">Отмена</button></div></div>`, { center: true });
    const inp = $('#devPass', m), err = $('#devErr', m);
    const ok = v => { v = String(v || '').trim().toLowerCase().replace(/\s+/g, ''); return v === DEV_PASS || v === 'secret-password:' + DEV_PASS; };
    const tryIt = () => {
      if (ok(inp.value)) { ui.devAuth = true; try { localStorage.setItem(DEV_KEY, '1'); } catch (e) { /* без памяти */ } st().admin = true; S.save(); closeModal(); sfx('coin'); haptic('success'); toast('🔓 Доступ администратора открыт'); go('developer'); return; }
      err.textContent = 'Неверный пароль'; inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake');
      haptic('error'); sfx('wrong'); inp.select();
    };
    $('#devGo', m).onclick = tryIt;
    inp.onkeydown = e => { if (e.key === 'Enter') tryIt(); };
    $('#devCancel', m).onclick = closeModal;
    setTimeout(() => inp.focus(), 80);
  }
  function devClose() { ui.devAuth = false; go('settings'); }
  function wxDevHtml() {
    return `<div class="dev-wx"><h3>🌦️ Управление погодой</h3><p class="dev-wx-st" id="wxDevSt"></p>
      <div class="wx-seg"><button data-wx="sun">☀️ Солнечно</button><button data-wx="rain">🌧️ Дождь</button><button data-wx="snow">❄️ Снег</button></div>
      <div class="wx-row"><input type="number" id="wxSec" class="dev-in" min="1" max="31000" value="15" inputmode="numeric"><button class="btn blue" id="wxSetT">⏱️ Задать таймер, сек</button></div>
      <div class="wx-row"><button class="btn ghost dark" id="wxZero">⏹️ Обнулить таймер</button></div>
      <div class="wx-row"><button class="btn" id="wxFreeze">🧊 Заморозить</button><button class="btn" id="wxMelt">💧 Растопить</button></div>
      <div class="wx-row"><button class="btn ghost dark" id="wxMeltSlow">🌤️ Плавное таяние (2,5 мин)</button></div></div>`;
  }
  function wxDevBind(scr) {
    $$('[data-wx]', scr).forEach(b => { b.onclick = () => { wxSet(b.dataset.wx); sfx('pop'); toast(WX_META[b.dataset.wx].join(' ') + ' — включено'); }; });
    $('#wxSetT', scr).onclick = () => { const n = Math.max(1, Math.min(31000, parseInt($('#wxSec', scr).value, 10) || 0)); WX.until = Date.now() + n * 1000; wxSave(); wxApply(); toast('⏱️ Таймер: ' + wxClock(n)); };
    $('#wxZero', scr).onclick = () => { WX.until = Date.now(); wxSave(); wxNext(); toast('⏹️ Таймер обнулён — погода сменилась'); };
    $('#wxFreeze', scr).onclick = () => { wxSetIce(1, 0); wxSave(); wxApply(); toast('🧊 Ручей заморожен'); };
    $('#wxMelt', scr).onclick = () => { wxSetIce(0, 0); wxSave(); wxApply(); toast('💧 Ручей растоплен'); };
    $('#wxMeltSlow', scr).onclick = () => { const i = wxIce(); if (!i) { toast('Ручей и так течёт'); return; } wxSetIce(i, -1); wxSave(); wxApply(); toast('🌤️ Лёд начал таять'); };
    wxApply();
  }

  /* ───────── v1.14: место собаки, регулятор XP, живые игроки ───────── */
  /* Собака стоит на траве между сэргэ и Бато: правый край — левее его ботинок/коньков, лапы — на линии травы у будки (выше голов коней) */
  function placeDog(stage) {
    stage = stage || $('#stage');
    if (!stage) return;
    const dog = $('.dog-wrap.stage', stage), hold = $('#mHold', stage), svg = $('.scene-svg', stage);
    if (!dog || !hold || !svg || ui.riding) return;
    const sr = stage.getBoundingClientRect(), ctm = svg.getScreenCTM();
    if (!sr.width || !ctm) return;
    const feetL = hold.offsetLeft + hold.offsetWidth * .22;
    const W = Math.round(Math.max(40, Math.min(52, 44 * ctm.a)));
    const groundY = ctm.f - sr.top + 240 * ctm.d;
    dog.style.width = W + 'px';
    dog.style.right = 'auto';
    dog.style.left = Math.round(feetL - 6 - W) + 'px';
    const sv = $('svg', dog);
    const off = sv ? Math.max(0, dog.getBoundingClientRect().bottom - sv.getBoundingClientRect().bottom) : 0;
    dog.style.bottom = Math.round(sr.height - groundY - off * 0) + 'px';
  }
  window.addEventListener('resize', () => placeDog());

  /* Живые игроки: облачный список присутствия (Firestore «presence»). Онлайн — активен за последние 3 минуты */
  const LIVE_MS = 3 * 100000;
  let liveCache = { t: 0, list: null, err: '' };
  const isLive = p => Date.now() - (p.lastSeen || 0) < LIVE_MS;
  function liveFetch(force) {
    if (!window.BG_CLOUD || !BG_CLOUD.configured() || !BG_CLOUD.livePlayers) return Promise.resolve({ list: null, err: 'off' });
    if (!force && liveCache.list && Date.now() - liveCache.t < 30000) return Promise.resolve(liveCache);
    return BG_CLOUD.ping(true).catch(() => {}).then(() => BG_CLOUD.livePlayers())
      .then(res => { liveCache = { t: Date.now(), list: res.players || [], err: '' }; return liveCache; })
      .catch(e => { liveCache = { t: Date.now(), list: null, err: (e && e.code) || 'ERR' }; return liveCache; });
  }
  function liveNote(err) {
    if (err === 'off') return 'Облако не подключено — счётчик игроков недоступен.';
    if (err === 'NO_SESSION') return 'Войдите в аккаунт (Профиль → Аккаунт), чтобы видеть, кто сейчас играет.';
    return 'Не удалось загрузить список игроков. Проверьте интернет.';
  }
  function drawLive(force) {
    if (!$('#liveBox')) return;
    liveFetch(force).then(c => {
      const b = $('#liveBox'); if (!b) return;
      if (!c.list) { b.innerHTML = `<div class="live-h"><i class="dot"></i>Живые игроки</div><div class="live-note">${liveNote(c.err)}</div>`; return; }
      const on = c.list.filter(isLive).sort((a, x) => (x.weekXp || 0) - (a.weekXp || 0));
      const day = c.list.filter(p => Date.now() - (p.lastSeen || 0) < 864e5).length;
      b.innerHTML = `<div class="live-h"><i class="dot ${on.length ? 'on' : ''}"></i>Сейчас в игре: <b id="liveN">${on.length}</b><span>за сутки ${day} · всего ${c.list.length}</span></div>` +
        (on.length ? `<div class="live-list">${on.slice(0, 20).map(p => `<div class="live-p ${p.me ? 'me' : ''}"><span class="lp-av">${M.svg(p.equip || {}, { cls: 'mini' })}</span>
          <span class="lp-n">${esc(p.name || 'Ученик')}${p.me ? ' (вы)' : ''}${tagsFor({ admin: p.admin, premium: p.premium, age: p.age }, true, true)}<small>${esc((D.leagues[p.league] || D.leagues[0]).name)} лига · 🔥 ${p.streak || 0}</small></span><b>${fmt(p.weekXp || 0)} XP</b></div>`).join('')}</div>`
          : '<div class="live-note">Сейчас в сети никого нет.</div>');
    });
  }
  function devPlayersFetch() {
    return Promise.all([S.fetchPlayers(), liveFetch(true)]).then(([loc, c]) => (c.list ? { source: 'cloud', players: c.list } : Object.assign({ cloudErr: c.err }, loc)));
  }

  /* Регулятор опыта и сессия администратора */
  function devXpHtml() {
    const s = st(), xp = s.xp || 0, max = Math.max(50000, Math.ceil(xp / 10000) * 10000);
    return `<h2 class="sub">Опыт (XP)</h2>
      <div class="set-group dev-pad dev-xp">
        <div class="dev-xp-top"><span>⚡ Всего на аккаунте</span><b id="devXpV">${fmt(xp)} XP</b></div>
        <input type="range" id="devXpR" min="0" max="${max}" step="10" value="${xp}" aria-label="Опыт">
        <div class="dev-row"><input type="number" id="devXpN" inputmode="numeric" min="0" max="10000000" step="1" value="${xp}"><button class="btn small blue" id="devXpSet">Установить</button></div>
        <div class="dev-grid">${[-100, -10, 10, 100, 500, 1000].map(v => `<button class="btn small ${v < 0 ? 'red' : 'blue'}" data-dxp="${v}">${v > 0 ? '+' : '−'}${Math.abs(v)}</button>`).join('')}</div>
        <div class="dev-row"><span class="dev-lbl">📅 За неделю (лига)</span><input type="number" id="devWkN" inputmode="numeric" min="0" step="1" value="${(s.week && s.week.xp) || 0}"><button class="btn small" id="devWkSet">Ок</button></div>
        <div class="muted dock-note">Ползунок сохраняет значение, когда вы его отпускаете. Недельный XP определяет место в лиге.</div></div>
      <h2 class="sub">Возрастной режим уроков</h2>
      <div class="set-group dev-pad"><div class="dev-grid">${AGES.map(a => `<button class="btn small ${ageOf() === a.id ? 'blue' : 'ghost dark'}" data-dage="${a.id}">${a.emoji} ${a.tag}</button>`).join('')}</div></div>
      <h2 class="sub">Сессия администратора</h2>
      <div class="set-group dev-pad"><div class="muted dock-note">🔓 Пароль запомнен на этом устройстве: 15 нажатий открывают панель сразу.</div>
        <button class="btn small red" id="devForget">🔒 Забыть пароль</button></div>`;
  }
  function devXpBind(scr) {
    const s = st(), r = $('#devXpR', scr), n = $('#devXpN', scr), v = $('#devXpV', scr), wk = $('#devWkN', scr);
    if (!r) return;
    const show = x => { v.textContent = fmt(x) + ' XP'; };
    const sync = () => { n.value = s.xp; if (s.xp > +r.max) r.max = Math.ceil(s.xp / 10000) * 10000; r.value = s.xp; show(s.xp); wk.value = s.week ? s.week.xp : 0; };
    const setXp = x => {
      x = Math.max(0, Math.min(10000000, Math.round(+x || 0)));
      s.xp = x; if (s.week && s.week.xp > x) s.week.xp = x;
      S.save(); renderTop(); sync(); sfx('coin'); toast('⚡ Опыт: ' + fmt(x) + ' XP');
    };
    r.oninput = () => { n.value = r.value; show(+r.value); };
    r.onchange = () => setXp(r.value);
    $('#devXpSet', scr).onclick = () => setXp(n.value);
    n.onkeydown = e => { if (e.key === 'Enter') setXp(n.value); };
    $$('[data-dxp]', scr).forEach(b => { b.onclick = () => setXp((s.xp || 0) + +b.dataset.dxp); });
    $('#devWkSet', scr).onclick = () => {
      const x = Math.max(0, Math.min(10000000, Math.round(+wk.value || 0)));
      if (!s.week || s.week.key !== S.weekKey()) s.week = { key: S.weekKey(), xp: 0 };
      s.week.xp = x; if ((s.xp || 0) < x) s.xp = x;
      S.save(); renderTop(); sync(); sfx('coin'); toast('📅 Недельный опыт: ' + fmt(x) + ' XP');
    };
    $$('[data-dage]', scr).forEach(b => { b.onclick = () => { setAge(b.dataset.dage); $$('[data-dage]', scr).forEach(x => { x.classList.toggle('blue', x === b); x.classList.toggle('ghost', x !== b); x.classList.toggle('dark', x !== b); }); }; });
    $('#devForget', scr).onclick = () => {
      try { localStorage.removeItem(DEV_KEY); } catch (e) { /* память недоступна */ }
      st().admin = false; S.save();
      toast('🔒 Пароль забыт — при следующем входе он понадобится'); devClose();
    };
  }

  function bindStageExtras(scr) {
    setTimeout(() => { wxBind(scr); placeDog($('#stage', scr) || $('#stage')); }, 0);
    const stage = $('#stage', scr), hold = $('#mHold', scr); if (!stage || !hold) return;
    $$('.horse-hit, .rider, .dog-wrap, .city-badge, .yurt-hit, .yurt-in, .pl-hit, #walker, .gov-in, .pl-spark', stage).forEach(x => x.remove());
    if (ui.loc === 'city' || false && ui.loc === 'datsan') {
      const h = rideHorseOf(ui.rideHorse);
      if (h) {
        const sc = $('.scene', stage); if (sc) sc.innerHTML = placeScene(ui.loc);
        hold.classList.add('away');
        stage.insertAdjacentHTML('beforeend', riderHtml(h) + (false && ui.loc === 'datsan' ? DATSAN_BADGE : CITY_BADGE));
        const r = $('#rider', stage); r.classList.add('idle', 'empty'); r.style.transition = 'none'; r.style.transform = placeRiderTf(stage.getBoundingClientRect().width); ui.placeBusy = false;
        requestAnimationFrame(() => placeSetup(scr, h, false));
        r.onclick = () => rideHome(scr, h);
        return;
      }
      ui.loc = 'home';
    }
    hold.classList.remove('away');
    stage.insertAdjacentHTML('beforeend', dogHtml('stage'));
    const dw = $('.dog-wrap', stage); if (dw) dw.onclick = e => { e.stopPropagation(); dogTap(dw, stage); };
    if (ui.loc === 'yurt') { if (ui.view === 'shop') { hold.classList.add('away'); mountYurt(stage, true); return; } ui.loc = 'home'; }
    requestAnimationFrame(() => {
      const sr = stage.getBoundingClientRect();
      if (ui.view === 'shop') yurtHit(stage, scr);
      $$('.scene-svg .horse', stage).forEach((g, i) => {
        const r = g.getBoundingClientRect(); if (!r.width) return;
        const b = document.createElement('button'); b.className = 'horse-hit'; b.setAttribute('aria-label', 'Сесть на коня');
        b.style.left = (r.left - sr.left) + 'px'; b.style.top = (r.top - sr.top) + 'px';
        b.style.width = r.width + 'px'; b.style.height = r.height + 'px';
        b.onclick = e => { e.stopPropagation(); rideCity(scr, i, g); };
        stage.appendChild(b);
      });
    });
  }
  /* ── v1.16: Дом Правительства (вход в здание) и Иволгинский дацан ── */
  const DATSAN_BADGE = '<div class="city-badge">🛕 Иволгинский дацан</div>';
  const WEEK_MS = 7 * 24 * 31000 * 1000;
  const OFFERS = [{ k: 'sweets', n: 'Сладости', i: '🍬' }, { k: 'butter', n: 'Масло', i: '🧈' }, { k: 'milk', n: 'Молоко', i: '🥛' }, { k: 'tea', n: 'Чай', i: '🍵' }];
  /* В дацане конь стоит у ступеней (в центре, чуть дальше), не заслоняя стол и столб */
  function placeRiderTf(w) { return false && ui.loc === 'datsan' ? 'translateX(' + (w * -.01) + 'px) translateY(-6px) scale(.72)' : 'translateX(' + (w * .26) + 'px)'; }
  function placeScene(loc) { return loc === 'datsan' ? window.BG_DATSAN.scene(st()) : window.BG_ART.city(); }
  function datsanState() {
    const s = st();
    if (!s.datsan || typeof s.datsan !== 'object') s.datsan = { offers: 0, recent: [], flags: [], khiiLast: 0 };
    if (!s.offerInv || typeof s.offerInv !== 'object') s.offerInv = {};
    return s.datsan;
  }
  function stagePt(stage, x, y) {
    const sr = stage.getBoundingClientRect(), svg = $('.scene .city-svg', stage);
    if (!svg || !svg.getScreenCTM || !svg.getScreenCTM()) return { x: sr.width / 2, y: sr.height - 10, k: 1 };
    const m = svg.getScreenCTM(), p = svg.createSVGPoint(); p.x = x; p.y = y;
    const q = p.matrixTransform(m);
    return { x: q.x - sr.left, y: q.y - sr.top, k: m.a };
  }
  function walkerHtml() { return `<div class="walker" id="walker"><div class="wk-in">${M.svg(st().equip, { mood: 'happy', cls: 'static' })}</div></div>`; }
  function wkSet(w, x, y, k) { w._x = x; w._y = y; w._k = k; w.style.left = x + 'px'; w.style.top = y + 'px'; w.style.transform = `translate(-50%,-100%) scale(${k})`; }
  function horseSpot(stage) {
    const sr = stage.getBoundingClientRect(), r = $('#rider', stage);
    if (!r) return { x: sr.width * .5, y: sr.height - 10 };
    const rr = r.getBoundingClientRect();
    return { x: rr.left - sr.left - 14, y: rr.bottom - sr.top - 4 };
  }
  async function wkWalk(w, x, y, k, speed) {
    const x0 = w._x, y0 = w._y, k0 = w._k, d = Math.hypot(x - x0, y - y0);
    const ms = Math.max(380, d / (speed || 110) * 1000);
    w.classList.add('walking');
    await tween(ms, e => wkSet(w, x0 + (x - x0) * e, y0 + (y - y0) * e, k0 + (k - k0) * e), t => t);
    w.classList.remove('walking');
  }
  function hitsOff(stage, off) { $$('.pl-hit', stage).forEach(b => b.classList.toggle('off', !!off)); }
  function placeHit(stage, sel, label, fn, pad) {
    const el = $('.scene ' + sel, stage); if (!el) return null;
    const sr = stage.getBoundingClientRect(), r = el.getBoundingClientRect(); if (!r.width) return null;
    pad = pad == null ? 6 : pad;
    const b = document.createElement('button'); b.className = 'pl-hit'; b.setAttribute('aria-label', label);
    b.style.left = (r.left - sr.left - pad) + 'px'; b.style.top = (r.top - sr.top - pad) + 'px';
    b.style.width = (r.width + pad * 2) + 'px'; b.style.height = (r.height + pad * 2) + 'px';
    b.innerHTML = `<span>${label}</span>`;
    b.onclick = e => { e.stopPropagation(); fn(); };
    stage.appendChild(b); return b;
  }
  function sparkleAt(stage, p) {
    const d = document.createElement('div'); d.className = 'pl-spark'; d.textContent = '✨';
    d.style.left = p.x + 'px'; d.style.top = p.y + 'px'; stage.appendChild(d);
    setTimeout(() => d.remove(), 1300);
  }
  function placeSetup(scr, h, fresh) {
    const stage = $('#stage', scr); if (!stage) return;
    const r = $('#rider', stage); if (!r) return;
    r.classList.add('idle', 'empty');
    r.onclick = () => rideHome(scr, h);
    $$('.pl-hit, #walker', stage).forEach(x => x.remove());
    stage.insertAdjacentHTML('beforeend', walkerHtml());
    const w = $('#walker', stage), hs = horseSpot(stage);
    wkSet(w, hs.x, hs.y, 1);
    if (fresh) w.classList.add('hop-off');
    const svg = $('.scene .city-svg', stage);
    if (window.BG_PLACES) window.BG_PLACES.pigeons(svg, () => WX.mode, false && ui.loc === 'datsan'
      ? { n: 6, area: { x0: 150, x1: 250, y0: 252, y1: 292 } }
      : { n: 10, area: { x0: 30, x1: 370, y0: 244, y1: 292 } });
    if (ui.loc === 'city') placeHit(stage, '.ct-door', '🚪 Войти', () => enterGov(scr), 4);
    else {
      placeHit(stage, '.ds-table', '🙏 Подношение', () => offerModal(scr), 6);
      placeHit(stage, '.ds-pole', '🎏 Хии морин', () => hangKhii(scr), 0);
    }
    if (ui.loc === 'city' && ui.inGov) { w.style.opacity = '0'; mountGov(stage, scr, true); }
  }
  function govK(p) { return Math.max(.28, Math.min(.6, 36 * p.k / 101)); }
  async function enterGov(scr) {
    if (ui.placeBusy || ui.riding || ui.inGov) return;
    const stage = $('#stage', scr), w = $('#walker', stage), door = $('.scene .ct-door', stage);
    if (!w || !door) return;
    ui.placeBusy = true; haptic('light'); hitsOff(stage, true);
    const p = stagePt(stage, 200, 224), k = govK(p);
    await wkWalk(w, p.x, p.y, k, 95);
    door.classList.add('open'); sfx('pop'); await wait12(560);
    await tween(420, e => { w.style.opacity = String(1 - e); wkSet(w, p.x, p.y - e * 3 * p.k, k * (1 - .14 * e)); });
    await wait12(150); door.classList.remove('open');
    ui.inGov = true; ui.placeBusy = false;
    mountGov(stage, scr, false);
  }
  function mountGov(stage, scr, instant) {
    $$('.gov-in', stage).forEach(x => x.remove());
    stage.insertAdjacentHTML('beforeend', `<div class="place-in gov-in">${window.BG_PLACES.hall(M)}<div class="yi-res">🏛️ Дом Правительства · в центре зала — портрет создателя игры</div></div>`);
    const g = $('.gov-in', stage);
    if (instant) g.classList.add('on'); else requestAnimationFrame(() => requestAnimationFrame(() => g.classList.add('on')));
    $('.hl-door', g).onclick = e => { e.stopPropagation(); exitGov(scr); };
    const pt = $('.hl-portrait', g);
    pt.onclick = e => {
      e.stopPropagation(); g.classList.remove('glint'); void g.offsetWidth; g.classList.add('glint');
      sfx('coin'); haptic('light'); toast('🎨 Портрет создателя BuryatGo — того, кто придумал Бато и эту игру');
    };
    if (!instant) { sfx('pop'); toast('🏛️ Бато вошёл в Дом Правительства!'); }
  }
  async function exitGov(scr) {
    if (ui.placeBusy) return;
    const stage = $('#stage', scr), g = $('.gov-in', stage), w = $('#walker', stage), door = $('.scene .ct-door', stage);
    ui.placeBusy = true; sfx('pop');
    if (g) { g.classList.remove('on'); await wait12(480); g.remove(); }
    ui.inGov = false;
    if (door) door.classList.add('open');
    await wait12(300);
    const p = stagePt(stage, 200, 224), k = govK(p);
    if (w) { wkSet(w, p.x, p.y, k); await tween(340, e => { w.style.opacity = String(e); }); }
    await wait12(150); if (door) door.classList.remove('open');
    if (w) { const hs = horseSpot(stage); await wkWalk(w, hs.x, hs.y, 1, 105); }
    hitsOff(stage, false); ui.placeBusy = false;
  }
  function offerModal(scr) {
    if (ui.placeBusy || ui.riding) return;
    const s = st(), d = datsanState(), inv = s.offerInv;
    const rows = OFFERS.map(o => { const c = inv[o.k] || 0; return `<button class="btn ${c > 0 ? 'gold' : 'ghost dark'}" data-off="${o.k}" ${c > 0 ? '' : 'disabled'}>${o.i} ${o.n} · у вас ${c}</button>`; }).join('')
      + `<button class="btn ${s.buzzy >= 10 ? 'blue' : 'ghost dark'}" data-off="money" ${s.buzzy >= 10 ? '' : 'disabled'}>🪙 Деньги · 10 ${BZI}</button>`;
    const m = openModal(`<div class="bonus-icon">🙏</div><h2>Подношение в дацане</h2><p>В храме оставляют сладости, чай, молоко, масло или деньги — так развивается щедрость и уходит жадность. Сделано подношений: <b>${d.offers || 0}</b></p><div class="stack">${rows}<button class="btn" data-shop="1">🛒 Купить в магазине</button><button class="btn ghost dark" data-act="close">Закрыть</button></div>`);
    $$('[data-off]', m).forEach(b => b.onclick = () => { closeModal(); makeOffer(scr, b.dataset.off); });
    $('[data-act="close"]', m).onclick = () => closeModal();
    $('[data-shop]', m).onclick = () => { closeModal(); ui.shopSlot = 'datsan'; if (ui.view === 'shop') refreshShop(true); else go('shop'); };
  }
  async function makeOffer(scr, k) {
    const s = st(), d = datsanState(), stage = $('#stage', scr), w = stage && $('#walker', stage);
    if (!w || ui.placeBusy) return;
    if (k === 'money' ? s.buzzy < 10 : !(s.offerInv[k] > 0)) return;
    ui.placeBusy = true; hitsOff(stage, true);
    const p = stagePt(stage, 272, 262);
    await wkWalk(w, p.x, p.y, Math.max(.5, Math.min(.9, p.k * .75)), 100);
    w.classList.add('bow'); sfx('pop'); await wait12(650);
    if (k === 'money') s.buzzy -= 10; else s.offerInv[k]--;
    d.recent = (d.recent || []).concat(k === 'money' ? 'coin' : k).slice(-6);
    d.offers = (d.offers || 0) + 1;
    S.save(); renderTop();
    const og = $('.scene .ds-offers', stage);
    if (og) { og.innerHTML = window.BG_DATSAN.offersHtml(d.recent); const l = og.lastElementChild; if (l) l.classList.add('new'); }
    sparkleAt(stage, stagePt(stage, 290, 238)); sfx('coin'); haptic('success');
    const o = OFFERS.find(x => x.k === k);
    toast(`🙏 Подношение принято${o ? ': ' + o.i + ' ' + o.n : ': 🪙 деньги'}. Щедрость растёт — жадность уходит ✨`);
    await wait12(550); w.classList.remove('bow');
    const hs = horseSpot(stage); await wkWalk(w, hs.x, hs.y, 1, 110);
    hitsOff(stage, false); ui.placeBusy = false;
  }
  async function hangKhii(scr) {
    if (ui.placeBusy || ui.riding) return;
    const s = st(), d = datsanState(), stage = $('#stage', scr), w = stage && $('#walker', stage);
    if (!w) return;
    const left = (d.khiiLast || 0) + WEEK_MS - Date.now();
    if (left > 0) {
      const th = Math.max(1, Math.ceil(left / 31000000)), dd = Math.floor(th / 24), hh = th % 24;
      toast(`🎏 Хии морин уже поднят на этой неделе. Следующий — через ${dd ? dd + ' дн.' : ''}${dd && hh ? ' ' : ''}${hh ? hh + ' ч.' : ''}`); haptic('error'); return;
    }
    if (!(s.offerInv.khii > 0)) { toast('🎏 Купите флажок «Хии морин» в магазине — раздел «🛕 Дацан»'); haptic('error'); return; }
    ui.placeBusy = true; hitsOff(stage, true);
    const p = stagePt(stage, 110, 268);
    await wkWalk(w, p.x, p.y, Math.max(.55, Math.min(.95, p.k * .8)), 100);
    w.classList.add('bow'); await wait12(700);
    s.offerInv.khii--;
    d.flags = (d.flags || []).concat({ t: Date.now() }).slice(-window.BG_DATSAN.MAXF);
    d.khiiLast = Date.now(); S.save(); renderTop();
    const fg = $('.scene .ds-flags', stage);
    if (fg) fg.innerHTML = window.BG_DATSAN.flagsHtml(d.flags, true);
    sparkleAt(stage, stagePt(stage, 96, 140)); sfx('coin'); haptic('success'); confetti();
    toast('🎏 Хии морин освящён и поднят! Удача и защита на всю неделю');
    await wait12(500); w.classList.remove('bow');
    const hs = horseSpot(stage); await wkWalk(w, hs.x, hs.y, 1, 110);
    hitsOff(stage, false); ui.placeBusy = false;
  }
  async function rideCity(scr, i, g) {
    if (ui.ritual || ui.riding || ui.skating || ui.sheltered) return;
    const hs = stageHorses() || [], h = hs[i] || hs[0]; if (!h) return;
    const stage = $('#stage', scr), hold = $('#mHold', scr);
    ui.riding = true; ui.rideHorse = h.id; sfx('pop'); haptic('light');
    const sr = stage.getBoundingClientRect(), gr = g.getBoundingClientRect();
    hold.classList.add('away');                              /* Бато идёт к коню */
    const dw = $('.dog-wrap', stage); if (dw) dw.classList.add('away');
    $$('.horse-hit', stage).forEach(x => x.remove());
    stage.insertAdjacentHTML('beforeend', riderHtml(h));
    const r = $('#rider', stage), rw = r.offsetWidth;
    const x0 = gr.left - sr.left + gr.width / 2 - sr.width / 2;
    r.style.transition = 'none'; r.style.transform = `translateX(${x0}px) scale(.7)`;
    void r.offsetWidth;
    g.style.opacity = '0';
    r.classList.add('mount');                                /* садится верхом у сэргэ */
    await wait12(520);
    r.classList.remove('mount'); r.classList.add('gallop');
    r.style.transition = 'transform 1.5s cubic-bezier(.45,0,.75,1)';
    r.style.transform = `translateX(${sr.width / 2 + rw}px) scale(1)`;   /* вправо, за край экрана */
    await wait12(1550);
    stage.classList.add('fade'); await wait12(280);
    ui.loc = window.__BG_DEST || (Math.random() < .5 ? 'datsan' : 'city'); ui.inGov = false; ui.placeBusy = false;
    const sc = $('.scene', stage); if (sc) sc.innerHTML = placeScene(ui.loc);
    if (dw) dw.remove();
    stage.classList.remove('fade');
    r.style.transition = 'none'; r.style.transform = `translateX(${-(sr.width / 2 + rw)}px)`; void r.offsetWidth;
    r.style.transition = 'transform 1.4s cubic-bezier(.2,.7,.3,1)'; r.style.transform = placeRiderTf(sr.width);
    await wait12(1450);
    r.classList.remove('gallop'); r.classList.add('idle');
    stage.insertAdjacentHTML('beforeend', false && ui.loc === 'datsan' ? DATSAN_BADGE : CITY_BADGE);
    placeSetup(scr, h, true);
    ui.riding = false;
    toast(false && ui.loc === 'datsan' ? '🛕 Бато прискакал в Иволгинский дацан! Сделайте подношение или поднимите Хии морин' : '🏛️ Бато в Улан-Удэ! Нажмите на дверь Дома Правительства, чтобы войти');
  }
  async function rideHome(scr, h) {
    if (ui.riding || ui.placeBusy || ui.inGov) return;
    const stage = $('#stage', scr), r = $('#rider', stage); if (!r) return;
    ui.riding = true; sfx('pop'); haptic('light');
    $$('.pl-hit, .pl-spark', stage).forEach(x => x.remove());
    const wk = $('#walker', stage);
    if (wk) { const hp = horseSpot(stage); await wkWalk(wk, hp.x, hp.y, 1, 120); wk.remove(); r.classList.remove('empty', 'idle'); r.classList.add('mount'); await wait12(480); r.classList.remove('mount'); }
    r.classList.remove('empty');
    const sr = stage.getBoundingClientRect(), rw = r.offsetWidth;
    const badge = $('.city-badge', stage); if (badge) badge.remove();
    r.classList.remove('idle'); r.classList.add('gallop', 'back-dir');      /* разворот налево */
    r.style.transition = 'transform 1.4s cubic-bezier(.45,0,.75,1)';
    r.style.transform = `translateX(${-(sr.width / 2 + rw)}px)`;
    await wait12(1450);
    stage.classList.add('fade'); await wait12(280);
    ui.loc = 'home'; ui.inGov = false;
    const sc = $('.scene', stage); if (sc) sc.outerHTML = stageScene();
    stage.classList.remove('fade');
    const hs = stageHorses() || [], idx = Math.max(0, hs.findIndex(x => x.id === h.id));
    const g = $$('.scene-svg .horse', stage)[idx];
    if (g) g.style.opacity = '0';
    const gr = g ? g.getBoundingClientRect() : null;
    const x1 = gr ? gr.left - sr.left + gr.width / 2 - sr.width / 2 : 0;
    r.style.transition = 'none'; r.style.transform = `translateX(${sr.width / 2 + rw}px)`; void r.offsetWidth;
    r.style.transition = 'transform 1.6s cubic-bezier(.2,.7,.3,1)'; r.style.transform = `translateX(${x1}px) scale(.7)`;
    await wait12(1650);
    r.classList.remove('gallop'); r.classList.add('mount');               /* спешивается у сэргэ */
    await wait12(420);
    if (g) g.style.opacity = '';
    r.remove();
    ui.riding = false;
    bindStageExtras(scr);
    toast('🏡 Бато вернулся домой — к юрте и ручью');
  }
  function refillCup(it) {
    const s = st();
    if (!isCupEmpty(it.id)) { toast('Пиала уже полная'); return false; }
    if (s.buzzy < D.cupRefill) { haptic('error'); sfx('wrong'); toast(`Не хватает ${D.cupRefill - s.buzzy} ${BZI}. Пройдите урок!`); return false; }
    s.buzzy -= D.cupRefill; cupsState()[it.id] = true; S.save();
    sfx('coin'); haptic('success');
    toast((it.id === 'milk' ? '🥛 Пиала наполнена молоком' : '🍵 Пиала наполнена чаем') + ' · −' + D.cupRefill + ' ' + BZI);
    return true;
  }

  let sayTimer = null;
  function mascotTalk() {
    const hold = $('#mHold'), say = $('#say');
    if (!hold || !say) return;
    const ph = D.mascotPhrases[Math.floor(Math.random() * D.mascotPhrases.length)];
    hold.classList.remove('jump'); void hold.offsetWidth; hold.classList.add('jump');
    say.innerHTML = `${esc(ph.bu)}<small>${esc(ph.ru)}</small>`;
    say.classList.add('show');
    speak(ph.bu);
    haptic('light');
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => say.classList.remove('show'), 2600);
  }

  function itemModal(id) {
    const s = st(), it = D.itemsById[id];
    if (!it) return;
    const owned = s.owned.indexOf(id) >= 0, eq = s.equip[it.slot] === id;
    let preview;
    if (it.slot === 'bonus' || it.offer) preview = `<div class="bonus-icon" style="font-size:84px">${it.icon || '🧊'}</div>`;
    else { const tryOn = Object.assign({}, s.equip); tryOn[it.slot] = it.food ? 'buuza_plate' : id; preview = it.dog ? '<div class="dog-try">' + window.BG_ART.dogSvg('dog-svg', null, Object.assign(dogWearOf(), { [it.slot]: id })) + '</div>' : M.svg(tryOn, { mood: 'happy', cls: 'wave' }); }
    let btn = '';
    if (it.revive) {
      btn = s.lostStreak && s.lostStreak.n > 0
        ? `<button class="btn gold" data-act="buy">❤️‍🔥 Возродить за ${BZI} ${it.price}</button>`
        : '<button class="btn" disabled>🔥 Огонёк горит — возрождать нечего</button>';
    } else if (it.consumable) {
      btn = s.freezes >= 2 ? '<button class="btn" disabled>Максимум 2 заморозки</button>'
        : `<button class="btn gold" data-act="buy">Купить за <img class=bz-ic src=assets/images/buuza-icon.png alt=Буузы draggable=false> ${it.price}</button>`;
    } else if (!owned) {
      if (it.premiumOnly && !S.isPremium()) btn = '<button class="btn purple" data-act="super">👑 Доступно в Super</button>';
      else btn = `<button class="btn gold" data-act="buy">Купить за <img class=bz-ic src=assets/images/buuza-icon.png alt=Буузы draggable=false> ${it.price}</button>`;
    } else if (eq) {
      btn = it.slot === 'outfit' && id === 'tshirt_green' ? '<button class="btn" disabled>Базовая одежда</button>' : '<button class="btn ghost dark" data-act="unequip">Снять</button>';
    } else btn = '<button class="btn blue" data-act="equip">Надеть</button>';
    if (it.cup && owned && isCupEmpty(id)) btn = `<button class="btn gold" data-act="refill">🔄 Наполнить за ${BZI} ${D.cupRefill}</button>` + btn;
    const m = openModal(`<div class="mascot-stage v4" style="height:190px;margin:0 0 14px">${stageScene(true)}${STAGE_SKY}<div class="mascot-hold">${preview}</div></div>
      <h2>${esc(it.name)}</h2><p>${esc(it.desc || (it.slot === 'outfit' ? 'Одежда для Бато' : 'Аксессуар для Бато'))}</p>
      ${it.revive ? `<p style="margin-top:-6px">${s.lostStreak && s.lostStreak.n ? '💔 Потухшая серия: ' + s.lostStreak.n + ' ' + plural(s.lostStreak.n, ['день', 'дня', 'дней']) : '🔥 Сейчас серия: ' + s.streak}</p>` : it.consumable ? `<p style="margin-top:-6px">У вас: ${s.freezes} из 2</p>` : ''}
      ${it.cup && owned ? `<p style="margin-top:-6px">${isCupEmpty(id) ? '🫗 Пиала пустая — наполните, чтобы снова совершить обряд' : '✨ Пиала полная — наденьте и нажмите на Бато'}</p>` : ''}
      ${it.offer ? `<p style="margin-top:-6px">👜 У вас: ${(s.offerInv || {})[it.offer] || 0} шт. · отнесите в Иволгинский дацан</p>` : ''}
      <div class="stack">${btn}<button class="btn ghost dark" data-act="close">Закрыть</button></div>`);
    $$('[data-act]', m).forEach(b => {
      b.onclick = () => {
        const act = b.dataset.act;
        if (act === 'close') closeModal();
        else if (act === 'super') { closeModal(); openPaywall(); }
        else if (act === 'buy') buyItem(it);
        else if (act === 'refill') { if (refillCup(it)) { closeModal(); refreshShop(true); } }
        else if (act === 'equip') { s.equip[it.slot] = id; S.save(); closeModal(); sfx('pop'); refreshShop(true); }
        else if (act === 'unequip') { s.equip[it.slot] = it.slot === 'outfit' ? 'tshirt_green' : null; S.save(); closeModal(); refreshShop(false); }
      };
    });
  }

  function buyItem(it) {
    const s = st();
    if (it.dog && !dogState()) { toast('🐕 Сначала заведите собаку в разделе «Питомцы»'); return; }
    if (it.revive && !(s.lostStreak && s.lostStreak.n > 0)) { toast('🔥 Огонёк и так горит'); return; }
    if (it.food && s.owned.indexOf('buuza_plate') < 0) { toast('🍽️ Сначала купите «Тарелку бууз»'); haptic('error'); return; }
    if (it.food && (s.buuz || 0) >= 99) { toast('🥟 Тарелка полна (99)'); return; }
    if (it.offer && ((s.offerInv || {})[it.offer] || 0) >= 99) { toast('👜 Сумка полна (99)'); return; }
    if (s.buzzy < it.price) {
      haptic('error'); sfx('wrong');
      toast(`Не хватает ${it.price - s.buzzy} <img class=bz-ic src=assets/images/buuza-icon.png alt=Буузы draggable=false>. Пройдите урок!`);
      return;
    }
    s.buzzy -= it.price;
    s.stats.purchases++;
    if (it.revive) reviveStreak();
    else if (it.food) { s.buuz = Math.min(99, (s.buuz || 0) + it.food); s.equip.hand = 'buuza_plate'; }
    else if (it.offer) { s.offerInv = s.offerInv || {}; s.offerInv[it.offer] = Math.min(99, (s.offerInv[it.offer] || 0) + (it.qty || 1)); }
    else if (it.consumable) { s.freezes = Math.min(2, s.freezes + 1); }
    else { if (s.owned.indexOf(it.id) < 0) s.owned.push(it.id); s.equip[it.slot] = it.id; if (it.cup) cupsState()[it.id] = true; if (it.plate) s.buuz = Math.min(99, (s.buuz || 0) + it.plate); }
    S.save();
    closeModal();
    sfx('coin'); haptic('success'); confetti();
    toast(it.revive ? '❤️‍🔥 Огонёк возрождён! Серия: ' + s.streak : it.food ? '🥟 +' + it.food + ' бууз · на тарелке: ' + s.buuz + '. Нажмите на Бато!' : it.offer ? '🛕 ' + esc(it.name) + ' — в сумке! Отнесите в Иволгинский дацан' : it.consumable ? '🧊 Заморозка серии куплена!' : '🎉 Куплено: ' + esc(it.name));
    refreshShop(true);
    checkAchievements();
  }

  /* ───────── Кони (Super) ───────── */
  function horseGrid() {
    const prem = S.isPremium(), hs = horseState();
    return D.horses.map(h => {
      const own = hs.owned.indexOf(h.id) >= 0, main = hs.main === h.id;
      let tag = '';
      if (main) tag = '<span class="tag">Главный</span>';
      else if (own) tag = '<span class="tag" style="background:var(--blue)">Есть</span>';
      else if (!prem) tag = '<span class="tag super">SUPER</span>';
      const price = own ? '✔ У сэргэ' : !prem ? '👑 Super' : (!hs.owned.length && !hs.freeUsed) ? '🎁 Бесплатно' : `<img class=bz-ic src=assets/images/buuza-icon.png alt=Буузы draggable=false> ${D.horsePrice}`;
      return `<button class="item-card horse-card ${own ? 'equipped' : ''}" data-horse="${h.id}">${tag}<div class="pv">${window.BG_ART.horseSvg(h)}</div><div class="nm">${esc(h.name)}</div><div class="price">${price}</div></button>`;
    }).join('');
  }

  /* Питомцы: овцы (до 13) и кони */
  function petsGrid() { return dogCards() + petsGridBase() + coatCard(); }
  function petsGridBase() {
    const n = petsState().sheep, max = D.sheepMax, prem = S.isPremium();
    const sheepCard = `<button class="item-card pet-card ${n ? 'equipped' : ''}" data-pet="sheep">${n ? `<span class="tag" style="background:var(--blue)">${n} из ${max}</span>` : ''}<div class="pv">${window.BG_ART.sheepSvg()}</div><div class="nm">Хонин — овца</div><div class="price">${n >= max ? '✔ Полное стадо' : `${BZI} ${D.sheepPrice}`}</div></button>`;
    return `<div class="pets-h">🐑 Овцы · ${n} из ${max}</div>${sheepCard}<div class="pets-h">🐎 Кони · ${prem ? horseState().owned.length + ' из 3' : (horseState().lucky ? 'случайный конь у сэргэ' : '1 случайный с ' + D.luckyHorseUnit + '-го модуля, остальные в Super')}</div>${prem ? '' : luckyCard()}${horseGrid()}`;
  }

  function sheepModal() {
    const s = st(), p = petsState(), n = p.sheep, max = D.sheepMax;
    const m = openModal(`<div class="horse-pv">${window.BG_ART.sheepSvg('big')}</div>
      <h2>Хонин — овца</h2><p>Барашки пасутся на лугу справа от Бато. Каждая купленная овца сразу появляется в стаде, проданная — исчезает.</p>
      <p class="muted" style="margin-top:-6px">В стаде: <b id="shCount">${n} из ${max}</b></p>
      <div class="stack">${n < max ? `<button class="btn gold" data-act="buy">Купить овцу за ${BZI} ${D.sheepPrice}</button>` : `<button class="btn" disabled>Стадо полное: ${max} из ${max}</button>`}
      ${n > 0 ? `<button class="btn red" data-act="sell">Продать овцу за ${BZI} ${D.sheepSell}</button>` : ''}
      <button class="btn ghost dark" data-act="close">Закрыть</button></div>`);
    $$('[data-act]', m).forEach(b => {
      b.onclick = () => {
        const act = b.dataset.act;
        if (act === 'close') return closeModal();
        if (act === 'buy') {
          if (p.sheep >= max) { toast(`В стаде уже ${max} овец — это максимум`); return; }
          if (s.buzzy < D.sheepPrice) { haptic('error'); sfx('wrong'); toast(`Не хватает ${D.sheepPrice - s.buzzy} ${BZI}. Пройдите урок!`); return; }
          s.buzzy -= D.sheepPrice; s.stats.purchases++; p.sheep++; S.save();
          sfx('coin'); haptic('success'); toast(`🐑 Новая овца в стаде! ${p.sheep} из ${max}`);
        } else if (act === 'sell') {
          if (p.sheep <= 0) return;
          p.sheep--; s.buzzy += D.sheepSell; S.save();
          sfx('coin'); haptic('light'); toast(`Овца продана: +${D.sheepSell} ${BZI}`);
        }
        refreshShop(false);
        sheepModal();
      };
    });
  }

  /* v1.8.3: случайный конь для игроков без Super — один раз, после выхода на 5-й модуль */
  function luckyCard() {
    const hs = horseState(), ok = reachedUnit(D.luckyHorseUnit), got = hs.lucky && D.horses.find(h => h.id === hs.lucky);
    const tag = got ? '<span class="tag">Ваш</span>' : ok ? '<span class="tag" style="background:var(--green)">Открыто</span>' : '<span class="tag" style="background:#868E96">🔒</span>';
    const pv = got ? window.BG_ART.horseSvg(got) : '<div class="lucky-q">🎲</div>';
    const price = got ? '✔ У сэргэ' : ok ? `${BZI} ${D.luckyHorsePrice}` : `🔒 Модуль ${D.luckyHorseUnit}`;
    return `<button class="item-card pet-card lucky-card ${got ? 'equipped' : ''}" data-lucky="1">${tag}<div class="pv">${pv}</div><div class="nm">${got ? esc(got.name) : 'Случайный конь'}</div><div class="price">${price}</div></button>`;
  }
  function luckyModal() {
    const s = st(), hs = horseState(), ok = reachedUnit(D.luckyHorseUnit), got = hs.lucky && D.horses.find(h => h.id === hs.lucky);
    const unit = D.units[D.luckyHorseUnit - 1];
    let body, btn = '';
    if (got) body = `<div class="horse-pv">${window.BG_ART.horseSvg(got, 'horse-svg big')}</div><h2>${esc(got.name)} — ${esc(got.ru)}</h2><p>${esc(got.desc)}</p><p class="muted">Это ваш случайный конь — он пасётся у сэргэ. Выбирать породу и держать до 3 коней можно в Super.</p>`;
    else {
      body = `<div class="horse-pv lucky-pv"><div class="lucky-q big">🎲</div></div><h2>Случайный конь</h2><p>Один конь на удачу: порода выпадет случайно из ${D.horses.length}.</p>` +
        (ok ? '' : `<p class="muted">🔒 Откроется, когда вы дойдёте до ${D.luckyHorseUnit}-го модуля${unit ? ' «' + esc(unit.title) + '»' : ''}.</p>`);
      btn = ok ? `<button class="btn gold" data-act="roll">🎲 Купить за ${BZI} ${D.luckyHorsePrice}</button>` : `<button class="btn" disabled>🔒 Нужен ${D.luckyHorseUnit}-й модуль</button>`;
    }
    const m = openModal(`${body}<div class="stack">${btn}<button class="btn ghost dark" data-act="close">Закрыть</button></div>`);
    let rolling = false;
    $$('[data-act]', m).forEach(b => {
      b.onclick = () => {
        if (rolling) return;
        if (b.dataset.act === 'close') return closeModal();
        if (hs.lucky || !reachedUnit(D.luckyHorseUnit)) return;
        if (s.buzzy < D.luckyHorsePrice) { haptic('error'); sfx('wrong'); toast(`Не хватает ${D.luckyHorsePrice - s.buzzy} ${BZI}. Пройдите урок!`); return; }
        const pick = D.horses[Math.floor(Math.random() * D.horses.length)];
        s.buzzy -= D.luckyHorsePrice; s.stats.purchases = (s.stats.purchases || 0) + 1; hs.lucky = pick.id; S.save();
        rolling = true; b.disabled = true; b.textContent = 'Крутим…';
        const pv = m.querySelector('.lucky-pv'); let i = 0;
        const t = setInterval(() => { if (pv) pv.innerHTML = window.BG_ART.horseSvg(D.horses[i++ % D.horses.length], 'horse-svg big'); }, 110);
        setTimeout(() => {
          clearInterval(t); rolling = false;
          if (pv) pv.innerHTML = window.BG_ART.horseSvg(pick, 'horse-svg big');
          const h2 = m.querySelector('h2'); if (h2) h2.textContent = pick.name + ' — ' + pick.ru; const pp = m.querySelector('h2 + p'); if (pp) pp.textContent = pick.desc;
          b.remove(); sfx('coin'); haptic('success'); confetti();
          toast(`🐎 Выпал ${esc(pick.name)}! Конь привязан к сэргэ`);
          refreshShop(true); renderTop();
        }, 1700);
      };
    });
  }

  function horseModal(id) {
    const s = st(), hs = horseState(), h = D.horses.find(x => x.id === id);
    if (!h) return;
    const prem = S.isPremium(), own = hs.owned.indexOf(id) >= 0;
    let btn;
    if (!prem) btn = '<button class="btn purple" data-act="super">👑 Конь доступен в Super</button>';
    else if (!hs.owned.length && !hs.freeUsed) btn = '<button class="btn gold" data-act="free">🎁 Выбрать бесплатно</button>';
    else if (!own) btn = `<button class="btn gold" data-act="buy">Докупить за <img class=bz-ic src=assets/images/buuza-icon.png alt=Буузы draggable=false> ${D.horsePrice}</button>${hs.owned.length ? '<button class="btn blue" data-act="swap">Поменять главного коня на этого</button>' : ''}`;
    else if (hs.main !== id) btn = '<button class="btn blue" data-act="main">Сделать главным</button>';
    else btn = '<button class="btn" disabled>Это ваш главный конь</button>';
    if (prem && own) btn += `<button class="btn red" data-act="sell">Продать за ${BZI} ${D.horseSell}</button>`;
    const note = prem && hs.owned.length && !own ? `<p class="muted" style="margin-top:-6px">К сэргэ можно привязать до 3 коней. Сейчас: ${hs.owned.length} из 3</p>` : '';
    const m = openModal(`<div class="horse-pv">${window.BG_ART.horseSvg(h, 'horse-svg big')}</div>
      <h2>${esc(h.name)} — ${esc(h.ru)}</h2><p>${esc(h.desc)}</p>${note}
      <div class="stack">${btn}<button class="btn ghost dark" data-act="close">Закрыть</button></div>`);
    $$('[data-act]', m).forEach(b => {
      b.onclick = () => {
        const act = b.dataset.act;
        if (act === 'close') return closeModal();
        if (act === 'super') { closeModal(); return openPaywall(); }
        if (act === 'buy') {
          if (hs.owned.length >= 3) { haptic('error'); toast('К сэргэ можно привязать не больше 3 коней'); return; }
          if (s.buzzy < D.horsePrice) { haptic('error'); sfx('wrong'); toast(`Не хватает ${D.horsePrice - s.buzzy} <img class=bz-ic src=assets/images/buuza-icon.png alt=Буузы draggable=false>. Пройдите урок!`); return; }
          s.buzzy -= D.horsePrice; s.stats.purchases++;
          hs.owned.push(id);
        } else if (act === 'free') { hs.owned = [id]; hs.main = id; hs.freeUsed = true; }
        else if (act === 'sell') { hs.owned = hs.owned.filter(x => x !== id); if (hs.main === id) hs.main = hs.owned.length ? hs.owned[hs.owned.length - 1] : null; s.buzzy += D.horseSell; }
        else if (act === 'swap') { const i = hs.owned.indexOf(hs.main); if (i >= 0) hs.owned[i] = id; else hs.owned.push(id); hs.main = id; }
        else if (act === 'main') hs.main = id;
        S.save(); closeModal();
        sfx('coin'); haptic('success'); if (act !== 'main' && act !== 'sell') confetti();
        toast(act === 'sell' ? `${esc(h.name)} продан: +${D.horseSell} ${BZI}` : `🐎 ${esc(h.name)} привязан к сэргэ!`);
        refreshShop(true);
      };
    });
  }

  /* Выбор коня сразу после покупки Super */
  function horsePicker(after) {
    const m = openModal(`<h2>Выберите своего коня 🐎</h2>
      <p>Подарок Super: конь встанет у коновязи-сэргэ возле юрты. Поменять, продать или докупить коней можно в магазине, во вкладке «Питомцы».</p>
      <div class="horse-pick">${D.horses.map(h => `<button class="horse-opt" data-h="${h.id}"><div class="pv">${window.BG_ART.horseSvg(h)}</div><b>${esc(h.name)}</b><span>${esc(h.ru)}</span></button>`).join('')}</div>`,
      { center: true, locked: true, onClose: after });
    $$('.horse-opt', m).forEach(b => {
      b.onclick = () => {
        const hs = horseState(), h = D.horses.find(x => x.id === b.dataset.h);
        hs.owned = [h.id]; hs.main = h.id; hs.freeUsed = true; S.save();
        sfx('coin'); haptic('success'); confetti();
        closeModal();
        toast(`🐎 ${esc(h.name)} ждёт вас у сэргэ в магазине!`);
      };
    });
  }

  function refreshShop(jump) {
    if (ui.view !== 'shop') return;
    const y = $('#screen').scrollTop;
    renderShop($('#screen'));
    renderTop();
    $('#screen').scrollTop = y;
    bump('tBuzzy');
    if (jump) setTimeout(mascotTalk, 120);
  }

  /* ───────────────── Профиль ───────────────── */
  function renderProfile(scr) {
    const s = st(), lg = D.leagues[s.league];
    const acc = s.stats.answers ? Math.round((s.stats.correct / s.stats.answers) * 100) : 0;
    const learned = Object.keys(s.words).length;
    const prem = S.isPremium();
    const days = [];
    for (let i = 6; i >= 0; i--) { const k = S.addDays(S.today(), -i); days.push({ k, v: s.xpByDay[k] || 0, t: i === 0 }); }
    const max = Math.max(s.settings.dailyGoal, ...days.map(d => d.v));
    const stats = [
      ['🔥', s.streak, 'Дней подряд'], ['⚡', fmt(s.xp), 'Всего XP'], ['🏆', lg.name, 'Лига'],
      ['📚', learned, 'Слов изучено'], ['✅', s.stats.lessons, 'Уроков'], ['🎯', acc + '%', 'Точность'],
      ['<img class=bz-ic src=assets/images/buuza-icon.png alt=Буузы draggable=false>', fmt(s.buzzyEarned), 'Заработано'], ['🌟', s.bestStreak, 'Рекорд серии'], ['💎', s.stats.perfect, 'Идеальных'],
      ['🐑', petsState().sheep + ' / ' + D.sheepMax, 'Овец в стаде'], ['🐎', (S.isPremium() ? horseState().owned.length + ' / 3' : (horseState().lucky ? 1 : 0) + ' / 1'), 'Коней у сэргэ'], ['🛍️', s.stats.purchases || 0, 'Покупок']
    ];
    scr.innerHTML = `<div class="view pad">
      <div class="profile-head"><span class="corner-flag">${flagSvg()}</span><div class="avatar">${M.svg(s.equip, { cls: 'static', mood: 'happy' })}</div>
        <div style="flex:1;min-width:0"><div class="nm" id="pName">${esc(s.name || 'Ученик')} ✏️</div><div class="p-tags" style="justify-content:flex-start">${tagsFor({ admin: isAdmin(), premium: prem }, false, true)}<button class="utag-btn" id="pAge" data-silent>${st().age ? tagHtml(st().age) : '<span class="utag tg-std">?</span> Возраст'} ✎</button></div><div class="since">С нами с ${humanDate(s.createdAt)}${prem ? ' · 👑 Super' : ''}</div></div>
        <button class="icon-btn" id="pSet" aria-label="Настройки">⚙️</button></div>
      ${prem ? `<div class="super-banner" id="pSuper"><div class="t">👑 BuryatGo Super активна</div><div class="d">Действует ${premUntil(s.premium)}${isLifetime(s.premium) ? '' : ' · управление в настройках'}</div></div>`
        : `<div class="super-banner" id="pSuper"><div class="t">👑 Попробуйте BuryatGo Super</div><div class="d">Все модули, двойные Буузы и праздничный дэгэл</div></div>`}
      <h2 class="sub">Статистика</h2>
      <div class="stats-grid">${stats.map(x => `<div class="stat-box"><div class="i">${x[0]}</div><div class="v">${x[1]}</div><div class="l">${x[2]}</div></div>`).join('')}</div>
      <h2 class="sub">Опыт за неделю</h2>
      <div class="chart">${days.map(d => `<div class="bar ${d.t ? 'today' : ''}"><b>${d.v || ''}</b><i style="height:${Math.max(4, (d.v / max) * 100)}%"></i><span>${WD[S.parseDay(d.k).getDay()]}</span></div>`).join('')}</div>
      <h2 class="sub">Достижения</h2>
      ${D.achievements.map(a => {
        const got = s.unlockedAchievements.indexOf(a.id) >= 0, v = Math.min(a.goal, a.metric(s));
        return `<div class="ach ${got ? 'got' : 'lock'}"><div class="ai">${a.icon}</div><div style="flex:1"><div class="at">${esc(a.title)}</div><div class="ad">${esc(a.desc)}</div>
          <div class="minibar"><i style="width:${(v / a.goal) * 100}%"></i></div></div><div style="font-weight:900;color:var(--muted);font-size:13px">${v}/${a.goal}</div></div>`;
      }).join('')}
    </div>`;
    $('#pSet').onclick = () => go('settings');
    $('#pName').onclick = editName;
    $('#pSuper').onclick = () => (prem ? go('settings') : openPaywall());
  }

  function editName() {
    const m = openModal(`<h2>Ваше имя</h2><p>Оно отображается в профиле и в лидерборде.</p>
      <input type="text" id="nmIn" maxlength="10" value="${esc(st().name)}" style="width:100%;margin-bottom:14px">
      <div class="stack"><button class="btn" id="nmOk">Сохранить</button></div>`);
    const inp = $('#nmIn', m);
    const save = () => { const v = Array.from(inp.value.trim()).slice(0, NAME_MAX).join('').trim(); if (!v) { toast('Введите имя'); return; } st().name = v; S.save(); closeModal(); render(); };
    $('#nmOk', m).onclick = save;
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') save(); });
  }

  /* ───────────────── Лиги и лидерборд ───────────────── */
  const AV_COLORS = ['#FF9600', '#1CB0F6', '#CE82FF', '#FF4B4B', '#58CC02', '#2B70C9', '#FFC800', '#00CD9C'];
  function weekFraction() {
    const f = (Date.now() - S.weekStart().getTime()) / (7 * 86400000);
    return Math.max(0, Math.min(1, f));
  }
  function board(weekKey, league, f, playerXp) {
    const r = mulberry32(hash(weekKey + '|' + league));
    const names = shuffle(D.botNames, r).slice(0, 14);
    const rows = names.map((n, i) => {
      const target = Math.round((30 + r() * 390) * (1 + league * 0.35));
      const curve = 0.6 + r() * 1.2;
      return { name: n, xp: Math.round(target * Math.pow(f, curve)), color: AV_COLORS[i % AV_COLORS.length], me: false };
    });
    rows.push({ name: st().name || 'Вы', xp: playerXp, me: true });
    rows.sort((a, b) => b.xp - a.xp || (a.me ? -1 : b.me ? 1 : 0));
    return rows;
  }
  function timeLeft() {
    const end = S.weekStart(); end.setDate(end.getDate() + 7);
    const ms = Math.max(0, end.getTime() - Date.now());
    const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 31000000), m = Math.floor((ms % 31000000) / 100000);
    return d > 0 ? `${d} ${plural(d, ['день', 'дня', 'дней'])} ${h} ч` : `${h} ч ${m} мин`;
  }
  function processWeek() {
    const s = st(), wk = S.weekKey();
    if (s.week && s.week.key === wk) return;
    const old = s.week || { key: wk, xp: 0 };
    if (old.key && old.xp > 0) {
      const rows = board(old.key, s.league, 1, old.xp);
      const rank = rows.findIndex(x => x.me) + 1;
      let to = s.league;
      if (rank <= 5 && s.league < D.leagues.length - 1) to++;
      else if (rank >= rows.length - 2 && s.league > 0) to--;
      s.pendingLeagueResult = { from: s.league, to, rank };
      s.league = to;
    }
    s.week = { key: wk, xp: 0 };
    S.save();
  }
  function leagueResultModal(onClose) {
    const r = st().pendingLeagueResult;
    if (!r) { if (onClose) onClose(); return; }
    st().pendingLeagueResult = null; S.save();
    const up = r.to > r.from, down = r.to < r.from, name = D.leagues[r.to].name;
    const m = openModal(`<div class="big-emo">${up ? '🚀' : down ? '😔' : '🏅'}</div><h2>${up ? 'Повышение!' : down ? 'Понижение' : 'Неделя завершена'}</h2>
      <p>Вы заняли ${r.rank}-е место. ${up ? `Добро пожаловать в ${leagueAcc(name)} лигу!` : down ? `Вы переходите в ${leagueAcc(name)} лигу. Всё получится!` : `Вы остаётесь в ${leaguePrep(name)} лиге.`}</p>
      <button class="btn" data-ok>Отлично</button>`, { center: true, onClose });
    if (up) { sfx('complete'); confetti(); }
    $('[data-ok]', m).onclick = () => closeModal();
  }

  function renderLeagues(scr) {
    processWeek();
    const s = st(), lg = D.leagues[s.league];
    scr.innerHTML = `<div class="view">
      <div class="league-hero"><div class="hero-gerb">${gerbSvg()}</div><div class="league-badges">${D.leagues.map((l, i) => `<div class="lbadge ${i === s.league ? 'cur' : ''}" style="background:${i <= s.league ? l.color : '#E5E5E5'}">${i < s.league ? '✔' : i === s.league ? '🏆' : '🔒'}</div>`).join('')}</div>
        <h1 class="title" style="margin:6px 0 4px">${esc(lg.name)} лига</h1>
        <div class="tm">${s.league < D.leagues.length - 1 ? `Топ-5 перейдут в ${leagueAcc(D.leagues[s.league + 1].name)} лигу` : 'Вы в высшей лиге!'}</div>
        <div class="tm" style="margin-top:4px">⏳ До конца недели: <b id="lgTime">${timeLeft()}</b></div></div>
      <div id="lbList"></div>
      <div id="liveBox" class="live-box"><div class="live-h"><i class="dot"></i>Живые игроки<span>загрузка…</span></div></div>
      <p class="disclaimer">Соперники — виртуальные участники офлайн-режима. Их очки растут в течение недели, рейтинг обновляется автоматически.</p></div>`;
    drawBoard(); drawLive(true);
    ui.lbTimer = setInterval(() => {
      if (ui.view !== 'leagues') return;
      drawBoard(); drawLive();
      const t = $('#lgTime'); if (t) t.textContent = timeLeft();
    }, 15000);
  }
  function drawBoard() {
    const s = st(), box = $('#lbList');
    if (!box) return;
    const rows = board(S.weekKey(), s.league, weekFraction(), s.week.xp);
    const canUp = s.league < D.leagues.length - 1, canDown = s.league > 0;
    let h = '';
    rows.forEach((r, i) => {
      const rank = i + 1;
      if (rank === 6 && canUp) h += '<div class="zone up">⬆ Зона повышения</div>';
      if (rank === rows.length - 2 && canDown) h += '<div class="zone down">⬇ Зона понижения</div>';
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
      h += `<div class="lb-row ${r.me ? 'me' : ''}"><div class="rk ${rank <= 3 ? 'top' : ''}">${medal}</div>
        <div class="av" style="background:${r.me ? '#DDF4FF' : r.color}">${r.me ? M.svg(s.equip, { cls: 'mini' }) : esc(r.name.charAt(0))}</div>
        <div class="nm"><span class="nmt">${esc(r.name)}${r.me ? ' (вы)' : ''}</span>${r.me ? myTags(true, true) : botTag(r.name)}</div><div class="xp">${fmt(r.xp)} XP</div></div>`;
    });
    box.innerHTML = h;
    if (ui.botsDirty) { ui.botsDirty = false; S.save(); }
  }

  /* ───────────────── Настройки ───────────────── */
  function applyReminder() {
    const s = st().settings;
    const parts = String(s.notifTime || '19:00').split(':');
    const h = parseInt(parts[0], 10) || 0, m = parseInt(parts[1], 10) || 0;
    if (native) { bridge('setReminder', !!s.notif, h, m); return; }
    const ln = capPlugin('LocalNotifications');
    if (ln) {
      ln.cancel({ notifications: [{ id: 1 }] }).catch(() => {}).then(() => {
        if (!s.notif) return;
        return ln.schedule({ notifications: [{ id: 1, title: 'BuryatGo', body: 'Амар мэндэ! Пора позаниматься, чтобы не потерять серию 🔥', schedule: { on: { hour: h, minute: m }, repeats: true, allowWhileIdle: true } }] });
      }).catch(() => {});
    }
  }
  function toggleNotif(on) {
    const s = st().settings;
    s.notif = on; S.save();
    if (!on) { applyReminder(); toast('Напоминания выключены'); return; }
    if (native) { applyReminder(); toast('🔔 Напомню каждый день в ' + s.notifTime); return; }
    const ln = capPlugin('LocalNotifications');
    if (ln) {
      ln.requestPermissions().then(r => {
        if (r && r.display === 'granted') { applyReminder(); toast('🔔 Напомню каждый день в ' + s.notifTime); }
        else { s.notif = false; S.save(); toast('Разрешите уведомления в настройках iPhone'); if (ui.view === 'settings') render(); }
      }).catch(() => {});
      return;
    }
    if ('Notification' in window) {
      Notification.requestPermission().then(p => {
        toast(p === 'granted' ? '🔔 Расписание напоминаний работает в Android-приложении' : 'Разрешите уведомления в настройках');
      }).catch(() => {});
    } else toast('🔔 Напоминания работают в Android-приложении');
  }
  function testNotification() {
    if (native) { bridge('testNotification'); toast('Отправлено тестовое уведомление'); return; }
    const ln = capPlugin('LocalNotifications');
    if (ln) {
      ln.schedule({ notifications: [{ id: 2, title: 'BuryatGo', body: 'Так будет выглядеть напоминание. Баярлаа! 👍', schedule: { at: new Date(Date.now() + 3000) } }] })
        .then(() => toast('Уведомление придёт через 3 секунды')).catch(() => toast('Разрешите уведомления'));
      return;
    }
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification('BuryatGo', { body: 'Амар мэндэ! Пора позаниматься 🔥' }); } catch (e) { toast('Уведомления недоступны в этом браузере'); }
    } else toast('Тест доступен в Android-приложении');
  }

  /* ---------- Аккаунт (логин + пароль) и облачное сохранение ---------- */
  function cloudSubText() {
    const C = window.BG_CLOUD;
    if (!C || !C.user()) return '';
    if (C.pending()) return navigator.onLine === false ? 'Нет интернета — сохраним позже' : 'Сохраняем…';
    const t = C.syncedAt();
    if (!t) return 'Синхронизация…';
    const d = new Date(t), p = n => String(n).padStart(2, '0');
    const same = new Date().toDateString() === d.toDateString();
    return '☁️ Сохранено ' + (same ? 'сегодня' : p(d.getDate()) + '.' + p(d.getMonth() + 1)) + ' в ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function cloudRow(row) {
    const C = window.BG_CLOUD;
    if (!C || !C.configured()) return '';
    if (C.user()) return `<div class="set-row"><div class="lb">🔐 ${esc(C.user())}<small id="cloudSub">${cloudSubText()}</small></div><button class="btn small ghost dark" id="cloudOut">Выйти</button></div>`;
    return row('🔐 Логин и пароль', 'Прогресс не пропадёт и перенесётся на любой телефон', '<button class="btn small blue" id="cloudIn">Войти</button>');
  }
  function cloudModal(mode) {
    const C = window.BG_CLOUD;
    if (!C || !C.configured()) { toast('Облако ещё не подключено'); return; }
    const isIn = mode !== 'up';
    const label = isIn ? 'Войти' : 'Создать аккаунт';
    const m = openModal(`<div class="big-emo">${isIn ? '🔐' : '✨'}</div>
      <h2>${isIn ? 'Вход в аккаунт' : 'Новый аккаунт'}</h2>
      <p>${isIn ? 'Ваш прогресс загрузится на этом устройстве.' : 'Текущий прогресс сохранится в аккаунт. Запомните логин и пароль!'}</p>
      <form class="cloud-form" id="cForm" autocomplete="on">
        <input class="cloud-in" id="cLogin" name="username" placeholder="Логин (латиница, 3–20)" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="20">
        <input class="cloud-in" id="cPass" name="password" type="password" placeholder="Пароль (от 6 символов)" autocomplete="${isIn ? 'current-password' : 'new-password'}" maxlength="64">
        <p class="cloud-err" id="cErr"></p>
        <div class="stack"><button class="btn" id="cGo" type="submit">${label}</button>
        <button class="btn ghost dark" id="cSwitch" type="button">${isIn ? 'Нет аккаунта? Регистрация' : 'Уже есть аккаунт? Войти'}</button>
        <button class="btn ghost dark" id="cClose" type="button">Закрыть</button></div>
      </form>`, { center: true });
    const err = t => { $('#cErr', m).textContent = t || ''; };
    $('#cClose', m).onclick = closeModal;
    $('#cSwitch', m).onclick = () => cloudModal(isIn ? 'up' : 'in');
    const btn = $('#cGo', m);
    $('#cForm', m).onsubmit = async ev => {
      ev.preventDefault();
      if (btn.disabled) return;
      const login = $('#cLogin', m).value, pass = $('#cPass', m).value;
      err(''); btn.disabled = true; btn.textContent = '⏳ Подождите…';
      try {
        if (!isIn) {
          await C.signUp(login, pass);
          closeModal(); haptic('success');
          toast('☁️ Аккаунт создан! Прогресс сохраняется', 2600);
          render();
        } else {
          const r = await C.signIn(login, pass);
          closeModal(); haptic('success');
          if (r.restored) { toast('☁️ Прогресс загружен!', 1500); setTimeout(() => location.reload(), 900); }
          else { toast('☁️ Вы вошли. Прогресс сохранён в аккаунт', 2600); render(); }
        }
      } catch (e) {
        haptic('error'); err(e.message);
        btn.disabled = false; btn.textContent = label;
      }
    };
    setTimeout(() => { const l = $('#cLogin', m); if (l) l.focus(); }, 60);
  }
  function cloudLogout() {
    const C = window.BG_CLOUD;
    confirmBox({ emoji: '👋', title: 'Выйти из аккаунта?',
      text: 'Прогресс сохранён в аккаунте. На этом устройстве он будет удалён — войдите снова, чтобы вернуть его.',
      ok: 'Остаться', cancel: 'Выйти',
      onCancel: () => {
        toast('☁️ Сохраняем…');
        C.signOut().then(() => { A.setMusic(false); S.reset(); location.reload(); });
      } });
  }
  function installHelp() {
    const m = openModal(`<div class="big-emo">📲</div><h2>Установите BuryatGo</h2>
      <ol class="install-steps">
        <li>Нажмите кнопку <b>«Поделиться»</b> ⬆️ внизу Safari</li>
        <li>Выберите <b>«На экран Домой»</b> ➕</li>
        <li>Нажмите <b>«Добавить»</b> — игра появится среди приложений</li>
      </ol>
      <p>Открывайте BuryatGo с иконки: во весь экран, без интернета и с надёжным сохранением.</p>
      <div class="stack"><button class="btn" id="pwaOk">Понятно</button></div>`, { center: true });
    $('#pwaOk', m).onclick = closeModal;
  }
  if (window.BG_CLOUD) BG_CLOUD.onChange(() => { const e = document.getElementById('cloudSub'); if (e) e.textContent = cloudSubText(); });
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#onbLogin')) cloudModal('in'); });

  function renderSettings(scr) {
    const s = st(), cfg = s.settings, prem = S.isPremium();
    const sw = (key, on) => `<button class="switch ${on ? 'on' : ''}" data-sw="${key}" role="switch" aria-checked="${on}"></button>`;
    const row = (lb, small, ctl) => `<div class="set-row"><div class="lb">${lb}${small ? `<small>${small}</small>` : ''}</div>${ctl}</div>`;
    const pills = (name, vals, cur) => `<div class="pills">${vals.map(v => `<button data-${name}="${v[0]}" class="${String(v[0]) === String(cur) ? 'on' : ''}">${v[1]}</button>`).join('')}</div>`;
    let subRow;
    if (prem && isLifetime(s.premium)) subRow = row('👑 BuryatGo Super', 'Бессрочный тариф · навсегда', '<span class="tag-ok">✔ Навсегда</span>');
    else if (prem) subRow = row('👑 BuryatGo Super', `${s.premium.plan === 'year' ? 'Годовой' : 'Месячный'} тариф · до ${humanDate(s.premium.until)}${s.premium.autoRenew === false ? ' · автопродление выкл.' : ''}`,
      s.premium.autoRenew === false ? '<button class="btn small blue" id="subRenew">Возобновить</button>' : '<button class="btn small ghost dark" id="subCancel">Отменить</button>');
    else subRow = row('👑 BuryatGo Super', 'Не оформлена', '<button class="btn small purple" id="subBuy">Оформить</button>');
    scr.innerHTML = `<div class="view pad">
      <div class="back-head"><button class="icon-btn" id="setBack" aria-label="Назад">←</button><h1 class="title" style="margin:0">Настройки</h1></div>
      <h2 class="sub">Звуковые эффекты</h2>
      <div class="set-group">
        ${row('🔘 Нажатия', 'Звук кнопок', sw('sfxClick', cfg.sfxClick))}
        ${row('✅ Правильный ответ', 'И награды', sw('sfxCorrect', cfg.sfxCorrect))}
        ${row('❌ Ошибка', '', sw('sfxWrong', cfg.sfxWrong))}
      </div>
      <h2 class="sub">Музыка и озвучка</h2>
      <div class="set-group">
        ${row('🎵 Фоновая музыка', 'Спокойная мелодия степи', sw('music', cfg.music))}
        ${row('🔉 Громкость музыки', '', `<input type="range" id="musVol" min="0" max="1" step="0.05" value="${cfg.musicVol}" style="width:130px">`)}
        ${row('🗣️ Озвучка слов', 'Синтез речи устройства', sw('tts', cfg.tts))}
        <div class="set-row" style="flex-wrap:wrap"><div class="lb">🐢 Скорость речи</div>${pills('rate', [[0.6, 'Медленно'], [0.85, 'Нормально'], [1.05, 'Быстро']], cfg.ttsRate)}</div>
        ${row('🎙️ Голос', 'По умолчанию — женский голос (Irina)', '<select id="voiceSel" class="voice-sel"><option value="female">Женский голос</option><option value="male">Мужской голос</option></select>')}
        ${row('🔊 Проверить озвучку', '«Амар мэндэ!»', '<button class="btn small blue" id="ttsTest">Слушать</button>')}
        ${row('👋 Проверить прощание', '«Баяртай!» звучит как «Баяртэ»', '<button class="btn small blue" id="ttsBye">Слушать</button>')}
        ${row('📳 Вибрация', 'Тактильный отклик', sw('haptics', cfg.haptics))}
      </div>
      <p class="disclaimer" style="margin-top:-4px">Учебные материалы составлены для начинающих. Рекомендуем сверять произношение с носителем языка.</p>
      <h2 class="sub">Уведомления</h2>
      <div class="set-group">
        ${row('🔔 Ежедневное напоминание', 'Чтобы не потерять серию', sw('notif', cfg.notif))}
        ${row('⏰ Время', '', `<input type="time" id="notifTime" value="${esc(cfg.notifTime)}">`)}
        ${row('🧪 Тестовое уведомление', '', '<button class="btn small blue" id="notifTest">Отправить</button>')}
      </div>
      <h2 class="sub">Обучение</h2>
      <div class="set-group">
        <div class="set-row" style="flex-wrap:wrap"><div class="lb">🎯 Дневная цель<small>XP в день</small></div>${pills('goal', [[10, '10'], [20, '20'], [30, '30'], [50, '50']], cfg.dailyGoal)}</div>
      </div>
      <h2 class="sub">Аккаунт</h2>
      <div class="set-group">
        ${cloudRow(row)}
        ${window.BG_PWA && BG_PWA.needsInstall() ? row('📲 На экран «Домой»', 'Игра откроется как приложение', '<button class="btn small blue" id="pwaHow">Как?</button>') : ''}
        ${row('👤 Имя', esc(s.name), '<button class="btn small ghost dark" id="setName">Изменить</button>')}
        ${subRow}
        ${row('♻️ Восстановить покупки', '', '<button class="btn small ghost dark" id="restore">Восстановить</button>')}
        ${row('🗑️ Сбросить прогресс', 'Удалить все данные на устройстве', '<button class="btn small red" id="reset">Сброс</button>')}
      </div>
      <p class="disclaimer"><span id="verTap" class="ver-tap">BuryatGo 1.16.2</span> · ${window.BG_CLOUD && BG_CLOUD.user() ? 'Прогресс сохраняется в аккаунте.' : 'Данные хранятся на устройстве.'}<br>Баярлаа! — Спасибо, что учите бурятский язык ❤️</p>
    </div>`;

    $('#setBack').onclick = () => go('profile');
    $$('[data-sw]', scr).forEach(b => {
      b.onclick = () => {
        const key = b.dataset.sw, on = !cfg[key];
        b.classList.toggle('on', on); b.setAttribute('aria-checked', on);
        if (key === 'notif') { toggleNotif(on); return; }
        cfg[key] = on; S.save();
        if (key === 'music') A.setMusic(on);
        if (key === 'haptics' && on) haptic('success');
      };
    });
    const vol = $('#musVol');
    vol.oninput = () => A.setMusicVolume(parseFloat(vol.value));
    vol.onchange = () => { cfg.musicVol = parseFloat(vol.value); S.save(); };
    $$('[data-rate]', scr).forEach(b => { b.onclick = () => { cfg.ttsRate = parseFloat(b.dataset.rate); S.save(); $$('[data-rate]', scr).forEach(x => x.classList.toggle('on', x === b)); speak('Амар мэндэ!'); }; });
    $$('[data-goal]', scr).forEach(b => { b.onclick = () => { cfg.dailyGoal = parseInt(b.dataset.goal, 10); S.save(); $$('[data-goal]', scr).forEach(x => x.classList.toggle('on', x === b)); toast('🎯 Цель: ' + cfg.dailyGoal + ' XP в день'); }; });
    $('#ttsTest').onclick = () => { if (!cfg.tts) { toast('Включите озвучку слов'); return; } speak('Амар мэндэ!'); };
    $('#ttsBye').onclick = () => { if (!cfg.tts) { toast('Включите озвучку слов'); return; } speak('Баяртай!'); };
    const vs = $('#voiceSel');
    vs.value = cfg.voice === 'male' ? 'male' : 'female';
    vs.onchange = () => { cfg.voice = vs.value; S.save(); A.setVoice(cfg.voice); speak('Амар мэндэ!'); };
    const nt = $('#notifTime');
    nt.onchange = () => { if (!nt.value) return; cfg.notifTime = nt.value; S.save(); if (cfg.notif) { applyReminder(); toast('⏰ Напоминание в ' + nt.value); } };
    $('#notifTest').onclick = testNotification;
    $('#setName').onclick = editName;
    const cIn = $('#cloudIn'); if (cIn) cIn.onclick = () => cloudModal('in');
    const cOut = $('#cloudOut'); if (cOut) cOut.onclick = cloudLogout;
    const pwh = $('#pwaHow'); if (pwh) pwh.onclick = installHelp;
    $('#restore').onclick = restorePurchases;
    const sb = $('#subBuy'); if (sb) sb.onclick = () => openPaywall();
    const sc = $('#subCancel');
    if (sc) sc.onclick = () => confirmBox({ emoji: '😿', title: 'Отменить подписку?', text: `Автопродление будет отключено. Super продолжит работать до ${humanDate(s.premium.until)}.`,
      ok: 'Оставить Super', cancel: 'Отменить подписку',
      onCancel: () => { s.premium.autoRenew = false; saveReceipt(); S.save(); toast('Автопродление отключено'); render(); } });
    const sr = $('#subRenew');
    if (sr) sr.onclick = () => { s.premium.autoRenew = true; saveReceipt(); S.save(); toast('Автопродление включено 👑'); render(); };
    $('#reset').onclick = () => confirmBox({ emoji: '⚠️', title: 'Сбросить весь прогресс?', text: 'Уроки, XP, Буузы, серия и покупки в магазине будут удалены. Это нельзя отменить.',
      ok: 'Сбросить', okClass: 'red', cancel: 'Отмена',
      onOk: () => { A.setMusic(false); if (native) bridge('setReminder', false, 0, 0); S.reset(); ui.onbStep = 0; ui.onbName = ''; ui.tab = 'home'; go('onboarding'); toast('Прогресс сброшен'); } });
  }

  /* ───────────────── Панель разработчика ─────────────────
     Вход: Настройки → 7 нажатий на «BuryatGo 1.0» внизу экрана.
     Логин и пароль хранятся не текстом, а в виде SHA-256 хэша с солью. */
  /* Панель разработчика открывается сразу, без логина и пароля */

  /* v1.11: все слова по модулям (для инструмента озвучки) */
  function devWordGroups() {
    const seen = {}, out = [];
    D.units.forEach((u, i) => {
      const ids = [];
      u.lessons.forEach(l => (l.words || []).forEach(id => { if (!seen[id] && D.words[id]) { seen[id] = 1; ids.push(id); } }));
      if (ids.length) out.push({ t: (i + 1) + '. ' + u.title, ids });
    });
    const rest = Object.keys(D.words).filter(id => !seen[id]);
    if (rest.length) out.push({ t: 'Другие', ids: rest });
    return out;
  }
  /* v1.11: установить активный модуль: все уроки до него пройдены, начиная с него — сброшены */
  function devSetModule(n) {
    const s = st();
    n = Math.max(1, Math.min(D.units.length, n | 0));
    D.units.forEach((u, i) => u.lessons.forEach(l => {
      if (i < n - 1) { const r = s.lessons[l.id] || { done: false, times: 0, best: 0 }; r.done = true; r.times = Math.max(1, r.times || 0); s.lessons[l.id] = r; }
      else delete s.lessons[l.id];
    }));
    S.save();
    const u = D.units[n - 1];
    toast('📘 Активный модуль: ' + n + '. ' + esc(u.title) + ((u.superOnly || u.premium) && !S.isPremium() ? ' (нужен Super)' : ''));
  }
  function devToolsHtml() {
    const s = st();
    const cur = currentGi(), curUnit = cur >= 0 ? D.units.indexOf(D.lessonIndex[cur].unit) + 1 : D.units.length;
    const groups = devWordGroups();
    let n = 0;
    const words = groups.map(g => `<div class="dv-gh">${esc(g.t)}</div>` + g.ids.map(id => { n++; const w = D.words[id];
      return `<div class="dv-w"><span class="dv-n">${n}</span><span class="dv-t"><b>${esc(w.bu)}</b><small>${esc(w.ru)} · ${esc(id)}</small></span>
        <button class="dv-play" data-say="${esc(id)}" aria-label="Слушать ${esc(w.bu)}">▶</button><button class="dv-play slow" data-say="${esc(id)}" data-slow="1" aria-label="Медленно">🐢</button></div>`; }).join('')).join('');
    return `<h2 class="sub">Лига</h2>
      <div class="set-group dev-pad"><div class="dev-row"><select id="devLeague" class="dev-sel">${D.leagues.map((l, i) => `<option value="${i}" ${i === s.league ? 'selected' : ''}>${esc(l.name)} лига</option>`).join('')}</select></div>
        <div class="muted dock-note">Лига меняется сразу после выбора.</div></div>
      <h2 class="sub">Активный модуль</h2>
      <div class="set-group dev-pad"><div class="dev-row"><select id="devModule" class="dev-sel">${D.units.map((u, i) => `<option value="${i + 1}" ${i + 1 === curUnit ? 'selected' : ''}>${i + 1}. ${esc(u.title)}${u.superOnly || u.premium ? ' 👑' : ''}</option>`).join('')}</select><button class="btn small blue" id="devModBtn">Установить</button></div>
        <div class="muted dock-note">Уроки всех модулей до выбранного станут пройденными, с выбранного — начнутся заново.</div></div>
      <h2 class="sub">Озвучка · ${n} слов</h2>
      <div class="set-group dev-voice">${words}</div>
      <p class="disclaimer">▶ — играет ваша запись из папки audio, если она есть, иначе синтезатор речи. 🐢 — медленно.</p>`;
  }
  function bindDevTools(scr) {
    const s = st();
    const lg = $('#devLeague', scr);
    if (lg) lg.onchange = () => { s.league = Math.max(0, Math.min(D.leagues.length - 1, +lg.value)); s.pendingLeagueResult = null; S.save(); sfx('coin'); toast('🏆 ' + esc(D.leagues[s.league].name) + ' лига'); };
    const mb = $('#devModBtn', scr);
    if (mb) mb.onclick = () => devSetModule(+$('#devModule', scr).value);
    $$('[data-say]', scr).forEach(b => { b.onclick = () => {
      const w = D.words[b.dataset.say]; if (!w) return;
      if (!st().settings.tts) { toast('Включите озвучку в настройках'); return; }
      $$('.dv-play.on', scr).forEach(x => x.classList.remove('on')); b.classList.add('on'); setTimeout(() => b.classList.remove('on'), 900);
      speak(w.bu, !!b.dataset.slow, audioOf(w));
    }; });
  }

  function renderDeveloper(scr) {
    if (!ui.devAuth && devRemembered()) ui.devAuth = true;
    if (!ui.devAuth) { setTimeout(() => go('settings'), 0); return; }
    const s = st();
    const head = `<div class="back-head"><button class="icon-btn" id="devBack" aria-label="Назад">←</button><h1 class="title" style="margin:0">Для разработчика</h1></div>`;
    const prem = S.isPremium();
    scr.innerHTML = `<div class="view pad">${head}
      <div class="dev-balance"><span class="big"><img class=bz-ic src=assets/images/buuza-icon.png alt=Буузы draggable=false></span><div><div class="big" id="devBz">${fmt(s.buzzy)}</div><div class="muted" style="font-size:12px;font-weight:800">Буузы на устройстве</div></div></div>
      <h2 class="sub">Буузы</h2>
      <div class="set-group dev-pad">
        <div class="dev-grid">${[-100, -10, 10, 100, 500, 1000].map(v => `<button class="btn small ${v < 0 ? 'red' : 'blue'}" data-dz="${v}">${v > 0 ? '+' : '−'}${Math.abs(v)}</button>`).join('')}</div>
        <div class="dev-row"><input type="number" id="devAmt" inputmode="numeric" min="1" step="1" placeholder="Сумма"><button class="btn small" id="devAdd">Начислить</button><button class="btn small red" id="devSub">Списать</button></div>
      </div>
      <h2 class="sub">Подписка</h2>
      <div class="set-group">
        <div class="set-row"><div class="lb">👑 BuryatGo Super<small>${prem ? 'Активна ' + premUntil(s.premium) : 'Выключена'}</small></div><button class="switch ${prem ? 'on' : ''}" id="devPrem" role="switch" aria-checked="${prem}"></button></div>
      </div>
      ${devXpHtml()}
      ${wxDevHtml()}
      ${devToolsHtml()}
      <p class="disclaimer">Изменения сохраняются только на этом устройстве. При включении Super здесь бонус +500 не начисляется.</p>
      <button class="btn ghost dark" id="devOut">Закрыть панель</button>
      <div id="devDock" class="dev-dock is-loading" aria-busy="true"><div class="dock-title">⚙️ Расширенная панель управления</div><div class="dev-skel"></div><div class="dev-skel"></div><div class="dev-skel short"></div></div></div>`;
    const change = (d) => {
      d = Math.trunc(d); if (!d) return;
      const before = s.buzzy;
      s.buzzy = Math.max(0, s.buzzy + d); S.save();
      const real = s.buzzy - before;
      $('#devBz').textContent = fmt(s.buzzy); renderTop();
      sfx(real > 0 ? 'coin' : 'click');
      toast((real >= 0 ? '+' : '−') + Math.abs(real) + ' <img class=bz-ic src=assets/images/buuza-icon.png alt=Буузы draggable=false> · баланс ' + fmt(s.buzzy));
    };
    $$('[data-dz]', scr).forEach(b => { b.onclick = () => change(+b.dataset.dz); });
    const amt = () => { const v = Math.abs(parseInt($('#devAmt').value, 10)); if (!v) { toast('Введите сумму'); return 0; } return Math.min(v, 1000000); };
    $('#devAdd').onclick = () => { const v = amt(); if (v) change(v); };
    $('#devSub').onclick = () => { const v = amt(); if (v) change(-v); };
    $('#devPrem').onclick = () => {
      if (S.isPremium()) s.premium = null;
      else s.premium = { plan: 'lifetime', since: S.today(), until: LIFETIME_UNTIL, autoRenew: false, dev: true };
      saveReceipt(); S.save();
      toast(S.isPremium() ? '👑 Super включён' : 'Super выключен');
      render();
    };
    $('#devBack').onclick = devClose;
    bindDevTools(scr);
    wxDevBind(scr);
    devXpBind(scr);
    $('#devOut').onclick = devClose;
    loadDevDock();
  }

  /* Дополнительная панель (подгружается после входа): точный баланс + живые игроки */
  function setExactBuzzy(v) {
    const s = st();
    v = Math.trunc(Number(v));
    if (!isFinite(v) || v < 0) { toast('Введите число от 0'); return false; }
    s.buzzy = Math.min(v, 10000000); S.save();
    const b = $('#devBz'); if (b) b.textContent = fmt(s.buzzy);
    renderTop(); sfx('coin'); haptic('success');
    toast('Баланс установлен: ' + fmt(s.buzzy) + ' <img class=bz-ic src=assets/images/buuza-icon.png alt=Буузы draggable=false>');
    return true;
  }
  function agoText(ms) {
    const m = Math.max(0, Math.round((Date.now() - (ms || 0)) / 100000));
    if (m < 3) return 'онлайн';
    if (m < 60) return m + ' мин назад';
    if (m < 1440) return Math.round(m / 60) + ' ч назад';
    return Math.round(m / 1440) + ' дн назад';
  }
  function loadDevDock() {
    const dock = $('#devDock'); if (!dock) return;
    const s = st();
    devPlayersFetch().then(res => {
      if (!$('#devDock')) return;
      const list = (res.players || []).slice().sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
      ui.devPlayers = list;
      dock.classList.remove('is-loading'); dock.removeAttribute('aria-busy');
      dock.innerHTML = `<div class="dock-title">⚙️ Расширенная панель управления</div>
        <h2 class="sub">Точный баланс Бууз</h2>
        <div class="set-group dev-pad"><div class="dev-row"><input type="number" id="devSet" inputmode="numeric" min="0" step="1" value="${s.buzzy}"><button class="btn small blue" id="devSetBtn">Установить</button></div>
          <div class="muted dock-note">Задаёт ровно такое количество Бууз на этом устройстве (0 — 10 000 000).</div></div>
        <h2 class="sub">Живые игроки · ${list.filter(isLive).length} онлайн</h2>
        <div class="dev-live"><div><b id="devLiveN">${list.filter(isLive).length}</b><small><i class="dot on"></i> онлайн</small></div><div><b>${list.filter(p => Date.now() - (p.lastSeen || 0) < 864e5).length}</b><small>за сутки</small></div><div><b id="devLiveAll">${list.length}</b><small>всего</small></div></div>
        ${res.source === 'cloud' ? '<div class="muted dock-note">🌐 Данные из облака: все игроки с аккаунтом. Онлайн — активность за 3 минуты.</div>' : `<div class="muted dock-note">Облачный список недоступен: ${esc(liveNote(res.cloudErr))} Показаны игроки этого устройства.</div>`}
        <div class="set-group dev-players">${list.map(p => `<button class="dev-player" data-pid="${esc(p.id)}">
            <span class="dp-av">${M.svg(p.equip || {}, { full: true, cls: 'static' })}</span>
            <span class="dp-main"><b>${esc(p.name || 'Игрок')}${p.id === s.playerId ? ' <em>(вы)</em>' : ''}${p.premium ? ' 👑' : ''}</b>
              <small><i class="dot ${agoText(p.lastSeen) === 'онлайн' ? 'on' : ''}"></i>${agoText(p.lastSeen)} · ${fmt(p.xp || 0)} XP · 🔥 ${p.streak || 0}</small></span>
            <span class="dp-bz">${fmt(p.buzzy || 0)} <img class=bz-ic src=assets/images/buuza-icon.png alt=Буузы draggable=false></span></button>`).join('') || '<div class="set-row">Активных игроков нет</div>'}</div>
        <p class="disclaimer">Источник: ${res.source === 'server' ? 'сервер игроков' : 'локальный реестр устройства. Для игроков с других телефонов укажите адрес сервера в BG_PLAYERS_API'}.</p>
        <button class="btn ghost dark" id="devReload">↻ Обновить список</button>`;
      $('#devSetBtn').onclick = () => { if (setExactBuzzy($('#devSet').value)) $('#devSet').value = st().buzzy; };
      $('#devReload').onclick = () => { dock.classList.add('is-loading'); loadDevDock(); };
      $$('.dev-player', dock).forEach(b => { b.onclick = () => { const p = ui.devPlayers.find(x => x.id === b.dataset.pid); if (p) devPlayerModal(p); }; });
    });
  }
  function devPlayerModal(p) {
    const me = p.id === st().playerId;
    const acc = p.answers ? Math.round((p.correct || 0) / p.answers * 100) + '%' : '—';
    const lg = D.leagues[p.league || 0] || D.leagues[0];
    const cells = [
      ['⚡ Опыт', fmt(p.xp || 0) + ' XP'], ['📅 За неделю', fmt(p.weekXp || 0) + ' XP'],
      ['🥟 Буузы', fmt(p.buzzy || 0)], ['💰 Заработано', fmt(p.buzzyEarned || 0)],
      ['🔥 Серия', (p.streak || 0) + ' · рекорд ' + (p.bestStreak || 0)], ['🧊 Заморозки', p.freezes || 0],
      ['🏆 Лига', esc(lg.name)], ['📘 Уроков', (p.lessonsDone || 0) + ' из ' + D.lessonIndex.length],
      ['📖 Слов', p.words || 0], ['🎯 Точность', acc],
      ['✨ Идеальных', p.perfect || 0], ['🛍️ Покупок', (p.purchases || 0) + ' · предметов ' + (p.owned || 0)],
      ['👑 Super', p.premium ? (p.premiumUntil === LIFETIME_UNTIL ? 'навсегда' : 'до ' + humanDate(p.premiumUntil)) : 'нет'], ['🎯 Цель', (p.dailyGoal || 0) + ' XP/день'],
      ['🗓️ С нами с', p.createdAt ? humanDate(p.createdAt) : '—'], ['🟢 Активность', agoText(p.lastSeen)]
    ];
    const m = openModal(`<div class="dp-modal"><div class="dp-head"><span class="dp-av big">${M.svg(p.equip || {}, { full: true, cls: 'static', mood: 'happy' })}</span>
        <div><div class="title" style="margin:0">${esc(p.name || 'Игрок')}</div><div class="muted" style="font-size:12px;font-weight:700">ID ${esc(String(p.id).slice(0, 12))} · ${esc(p.device || '')}</div></div></div>
      <div class="dp-grid">${cells.map(c => `<div class="dp-cell"><small>${c[0]}</small><b>${c[1]}</b></div>`).join('')}</div>
      ${me ? `<div class="dev-row" style="margin-top:12px"><input type="number" id="dpSet" min="0" step="1" value="${st().buzzy}"><button class="btn small blue" id="dpSetBtn">Установить Буузы</button></div>` : '<p class="disclaimer">Баланс можно точно изменить только на устройстве игрока.</p>'}
      <button class="btn" data-ok style="margin-top:12px">Закрыть</button></div>`);
    $('[data-ok]', m).onclick = closeModal;
    if (me) $('#dpSetBtn', m).onclick = () => { if (setExactBuzzy($('#dpSet', m).value)) { closeModal(); loadDevDock(); } };
  }

  /* ───────────────── Paywall / подписка ───────────────── */
  const RECEIPT_KEY = 'buryatgo_receipt_v1';
  function saveReceipt() { try { localStorage.setItem(RECEIPT_KEY, JSON.stringify(st().premium)); } catch (e) {} }
  function restorePurchases() {
    let r = null;
    try { r = JSON.parse(localStorage.getItem(RECEIPT_KEY) || 'null'); } catch (e) { r = null; }
    if (r && r.until && S.diffDays(S.today(), r.until) >= 0) {
      st().premium = r; S.save();
      toast('♻️ Super восстановлена ' + premUntil(r));
      if (modalOpen()) closeModal();
      render();
    } else toast('Активных покупок не найдено');
  }

  function openPaywall() {
    if (S.isPremium()) { toast('👑 BuryatGo Super уже активна'); return; }
    const price = D.prices.lifetime;
    const m = openModal(`<div class="paywall">
      <button class="x-btn" id="pwClose" style="position:absolute;top:14px;left:14px;color:#fff" aria-label="Закрыть">✕</button>
      <div class="pw-hero"><div class="pm">${M.svg({ hat: 'malgai_gold', outfit: 'degel_gold', hand: null, acc: null }, { mood: 'happy', cls: 'wave' })}</div>
        <h1>BuryatGo <span>Super</span></h1><p>Учите бурятский без ограничений — навсегда</p></div>
      <div class="pw-feats">
        <div class="pw-feat"><div class="fi">🔓</div><div><b>Модули с 4 по 15 (12 модулей)</b><br><small>Бесплатно — модули 1–3. Super открывает все остальные, включая Праздники, Числа, Байкал, Чувства и Путешествие</small></div></div>
        <div class="pw-feat"><div class="fi"><img class=bz-ic src=assets/images/buuza-icon.png alt=Буузы draggable=false></div><div><b>Двойные Буузы + 1000 сразу</b><br><small>Бонус 1000 Бууз при покупке, далее ×2 за уроки и серии</small></div></div>
        <div class="pw-feat"><div class="fi">🧥</div><div><b>Праздничный дэгэл</b><br><small>Эксклюзивная одежда для Бато</small></div></div>
        <div class="pw-feat"><div class="fi">❤️</div><div><b>Поддержка языка</b><br><small>Помогаете создавать новые уроки</small></div></div>
      </div>
      <div class="plans">
        <div class="plan on"><span class="best">Бессрочно</span><span class="radio"></span>
          <span class="pn"><b>Навсегда</b><small>Единоразовая покупка</small></span><span class="pp">${fmt(price)} ₽<small>один раз</small></span></div>
      </div>
      <div class="pw-warn" role="alert">⚠️ <b>Внимание! Покупка является безвозвратной, денежные средства за подписку не возвращаются.</b></div>
      <button class="btn gold" id="pwBuy" data-silent>Купить навсегда за ${fmt(price)} ₽</button>
      <div class="pw-promo"><div class="dev-row"><input type="text" id="pwCode" maxlength="24" autocomplete="off" autocapitalize="characters" placeholder="Промокод" aria-label="Промокод"><button class="btn small blue" id="pwApply">Применить</button></div>
        <p class="pw-promo-hint">Промокоды появляются на наших официальных страницах в Instagram или MAX</p></div>
      <div class="pw-links"><button class="link" id="pwRestore">Восстановить покупки</button></div>
      <p class="pw-legal">Демо-версия: деньги не списываются. В релизной версии оплата проходит через Google Play. Это разовая покупка без автопродления: Super остаётся с вами навсегда.</p>
    </div>`, { full: true });
    $('#pwClose', m).onclick = () => closeModal();
    $('#pwRestore', m).onclick = restorePurchases;
    $('#pwBuy', m).onclick = () => purchase('lifetime');
    const inp = $('#pwCode', m);
    $('#pwApply', m).onclick = () => applyPromo(inp.value);
    inp.onkeydown = e => { if (e.key === 'Enter') applyPromo(inp.value); };
  }

  /* v1.11: промокоды (список в data.js → promos). Один код — один раз на аккаунт */
  function applyPromo(raw) {
    const code = String(raw || '').toUpperCase().replace(/\s+/g, '');
    if (!code) { toast('Введите промокод'); return; }
    const p = (D.promos || {})[code], s = st();
    if (!Array.isArray(s.usedPromos)) s.usedPromos = [];
    if (!p) { haptic('error'); sfx('wrong'); toast('❌ Промокод не найден'); return; }
    if (s.usedPromos.indexOf(code) >= 0) { haptic('error'); toast('Этот промокод уже использован'); return; }
    s.usedPromos.push(code);
    if (p.type === 'super') {
      s.premium = { plan: 'lifetime', since: S.today(), until: LIFETIME_UNTIL, autoRenew: false, promo: code };
      saveReceipt(); S.save(); renderTop();
      sfx('complete'); haptic('success'); confetti();
      closeModal(); toast('👑 Промокод активирован: Super навсегда!'); render();
    } else {
      const a = Math.max(0, p.amount | 0);
      s.buzzy += a; s.buzzyEarned += a; S.save(); renderTop();
      sfx('coin'); haptic('success'); confetti();
      toast('🎁 Промокод активирован: +' + a + ' ' + BZI);
    }
  }

  function purchase(plan) {
    sfx('pop');
    const m = openModal(`<div class="spinner"></div><h2>Обработка платежа…</h2><p>Пожалуйста, не закрывайте приложение</p>`, { center: true, locked: true });
    setTimeout(() => {
      const s = st();
      s.premium = { plan: 'lifetime', since: S.today(), until: LIFETIME_UNTIL, autoRenew: false };
      const bonus = 1000;
      s.buzzy += bonus; s.buzzyEarned += bonus;
      saveReceipt(); S.save(); renderTop();
      if (!modalOpen()) return;
      const ok = openModal(`<div class="r-m jump" style="width:140px;margin:0 auto">${M.svg({ hat: 'malgai_gold', outfit: 'degel_gold', hand: null, acc: null }, { mood: 'happy', cls: 'wave' })}</div>
        <h2>Добро пожаловать в Super! 👑</h2>
        <p>Все модули открыты навсегда. Баярлаа!</p>
        <div class="bonus-pill"><img class=bz-ic src=assets/images/buuza-icon.png alt=Буузы draggable=false> +${bonus} ${plural(bonus, ['Бууза', 'Буузы', 'Бууз'])} на счёт</div>
        <button class="btn gold" data-ok>${(horseState().owned.length || horseState().freeUsed) ? 'Начать учиться' : '🐎 Выбрать коня'}</button>`, { center: true, onClose: () => { if (ui.view !== 'lesson') render(); } });
      sfx('complete'); setTimeout(() => sfx('coin'), 450); haptic('success'); confetti();
      $('[data-ok]', ok).onclick = () => { if (horseState().owned.length || horseState().freeUsed) closeModal(); else horsePicker(() => { if (ui.view !== 'lesson') render(); }); };
    }, 1600);
    return m;
  }

  /* ───────────────── Онбординг ───────────────── */
  function renderOnboarding(scr) {
    const step = ui.onbStep;
    let body = '';
    if (step === 0) {
      body = `<div class="om jump">${M.svg({ hat: 'malgai_blue', outfit: 'degel_blue', hand: 'hadak', acc: null }, { mood: 'happy', cls: 'wave' })}</div>
        <h1>Амар мэндэ!</h1><p>Я Бато. Вместе мы выучим бурятский язык — по 5 минут в день, весело и без стресса.</p>
        <div class="grow"></div>
        <div class="stack"><button class="btn" id="onbNext">Начать</button>${window.BG_CLOUD && BG_CLOUD.configured() ? '<button class="btn ghost" id="onbLogin">У меня уже есть аккаунт</button>' : ''}</div>`;
    } else if (step === 1) {
      body = `<div class="om">${M.svg(st().equip, { mood: 'happy', cls: 'static' })}</div>
        <h1>Как вас зовут?</h1><p>Имя будет в профиле и в таблице лиги.</p>
        <input type="text" id="onbName" maxlength="10" placeholder="Ваше имя" value="${esc(ui.onbName)}" style="width:100%">
        <div class="grow"></div>
        <div class="stack"><button class="btn" id="onbNext">Дальше</button></div>`;
    } else if (step === 2) {
      body = `<h1>Сколько лет ученику?</h1><p>Уроки подстроятся под возраст: малышам — только голос и картинки.</p>
        <div class="stack age-list">${ageButtons(ui.onbAge)}</div>
        <div class="grow"></div>
        <div class="stack"><button class="btn" id="onbNext">Дальше</button></div>`;
    } else {
      const goals = [[10, 'Легко', '5 мин/день'], [20, 'Нормально', '10 мин/день'], [30, 'Серьёзно', '15 мин/день'], [50, 'Интенсивно', '20+ мин/день']];
      body = `<h1>Ваша дневная цель</h1><p>Её можно изменить позже в настройках.</p>
        <div class="stack">${goals.map(g => `<button class="btn ghost dark goal-opt ${ui.onbGoal === g[0] ? 'on' : ''}" data-g="${g[0]}" style="${ui.onbGoal === g[0] ? 'border-color:var(--blue);color:var(--blue);background:#DDF4FF' : ''}"><span>${g[1]} · ${g[2]}</span><span>${g[0]} XP</span></button>`).join('')}</div>
        <div class="grow"></div>
        <div class="stack"><button class="btn" id="onbNext">Поехали! 🚀</button></div>`;
    }
    scr.innerHTML = `<div class="onb">${body}</div>`;
    const inp = $('#onbName', scr);
    if (inp) {
      inp.oninput = () => { ui.onbName = inp.value; };
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') onbNext(); });
      setTimeout(() => inp.focus(), 200);
    }
    $$('[data-g]', scr).forEach(b => { b.onclick = () => { ui.onbGoal = parseInt(b.dataset.g, 10); renderOnboarding(scr); }; });
    $$('[data-age]', scr).forEach(b => { b.onclick = () => { ui.onbAge = b.dataset.age; if (b.dataset.age === 'kids') speak('Привет! Будем учиться вместе!'); renderOnboarding(scr); }; });
    $('#onbNext', scr).onclick = onbNext;
  }
  function onbNext() {
    if (ui.onbStep === 0) { ui.onbStep = 1; render(); return; }
    if (ui.onbStep === 1) {
      const v = (ui.onbName || '').trim();
      if (!v) { toast('Введите имя'); haptic('error'); return; }
      ui.onbStep = 2; render(); return;
    }
    if (ui.onbStep === 2) {
      if (!ui.onbAge) { toast('Выберите возраст'); haptic('error'); return; }
      ui.onbStep = 3; render(); return;
    }
    const s = st();
    s.name = Array.from((ui.onbName || '').trim()).slice(0, NAME_MAX).join('').trim() || 'Ученик';
    s.settings.dailyGoal = ui.onbGoal;
    s.age = ui.onbAge || 'big';
    s.onboarded = true;
    S.save();
    sfx('complete'); confetti();
    ui.tab = 'home';
    go('home');
    toast('Сайн байна, ' + esc(s.name) + '! Начнём с первого урока 👋');
  }

  /* ───────────────── Кнопка «Назад» и жизненный цикл ───────────────── */
  window.__onBack = function () {
    if (modalOpen()) {
      if (modalOpts && modalOpts.locked) return true;
      closeModal();
      return true;
    }
    if (ui.view === 'lesson' && ui.lesson) {
      if (ui.lesson.finished && ui.lesson.onContinue) ui.lesson.onContinue();
      else quitLesson();
      return true;
    }
    if (ui.view === 'settings') { go('profile'); return true; }
    if (ui.view === 'developer') { devClose(); return true; }
    if (ui.view === 'onboarding') {
      if (ui.onbStep > 0) { ui.onbStep--; render(); return true; }
      return false;
    }
    if (ui.view !== 'home') { go('home'); return true; }
    return false;
  };

  window.BG = {
    onPause() { try { A.pauseAll(); } catch (e) {} S.save(); },
    onResume() {
      try { A.resumeAll(); } catch (e) {}
      processWeek();
      const r = S.checkStreak();
      if (r === 'lost') toast('💔 Огонёк потух. Верните серию предметом «Возрождение Огонька» в магазине → Заморозки');
      if (ui.view !== 'lesson' && !modalOpen()) render();
      if (st().pendingLeagueResult && !modalOpen()) leagueResultModal();
    },
    onNotifPermission(granted) {
      if (!granted) {
        st().settings.notif = false; S.save();
        toast('Уведомления запрещены. Разрешите их в настройках телефона');
        if (ui.view === 'settings') render();
      }
    }
  };
  document.addEventListener('visibilitychange', () => {
    if (native) return; // нативное приложение вызывает BG.onPause/onResume само
    if (document.hidden) window.BG.onPause(); else window.BG.onResume();
  });

  /* ───────────────── Инициализация ───────────────── */
  function init() {
    document.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || b.disabled || b.hasAttribute('data-silent')) return;
      sfx('click'); haptic('light');
    }, true);

    const unlock = () => {
      try { A.unlock(); if (st().settings.music) A.setMusic(true); } catch (e) {}
      document.removeEventListener('pointerdown', unlock, true);
    };
    document.addEventListener('pointerdown', unlock, true);

    $$('#tabbar .tab').forEach(t => {
      t.addEventListener('click', () => {
        if (ui.view === 'lesson' || ui.view === 'onboarding') return;
        const tab = t.dataset.tab;
        if (ui.view === tab) { $('#screen').scrollTo({ top: 0, behavior: 'smooth' }); return; }
        go(tab);
      });
    });

    processWeek();
    const sr = S.checkStreak();
    applyReminder();

    ui.view = st().onboarded ? 'home' : 'onboarding';
    document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('#pAge'); if (b) ageModal(() => render()); });
    setTimeout(() => { if (st().onboarded && !st().age && !modalOpen()) ageModal(() => render(), true); }, 1900);
    ui.tab = 'home';
    render();

    setTimeout(() => {
      const sp = $('#splash');
      if (sp) { sp.classList.add('hide'); setTimeout(() => sp.remove(), 1000); }
      if (!st().onboarded) return;
      if (sr === 'frozen') {
        const m = openModal(`<div class="big-emo">🧊</div><h2>Серия спасена!</h2><p>Вы пропустили день, но заморозка сохранила вашу серию: ${st().streak} ${plural(st().streak, ['день', 'дня', 'дней'])} 🔥</p><button class="btn blue" data-ok>Ура!</button>`,
          { center: true, onClose: () => leagueResultModal() });
        $('[data-ok]', m).onclick = () => closeModal();
      } else {
        if (sr === 'lost') toast('💔 Огонёк потух. Верните серию предметом «Возрождение Огонька» в магазине → Заморозки');
        leagueResultModal();
      }
    }, 800);
  }

  function safeInit() {
    try { init(); }
    catch (e) {
      console.error('BuryatGo init error:', e);
      const sp = document.getElementById('splash');
      if (sp) { sp.classList.add('hide'); setTimeout(() => sp.remove(), 400); }
      const sc = document.getElementById('screen');
      if (sc) sc.innerHTML = '<div style="padding:24px;text-align:center"><h2>Ошибка загрузки</h2><p>' + (e && e.message || e) + '</p><button onclick="location.reload(true)">Обновить</button></div>';
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', safeInit);
  else safeInit();
})();
