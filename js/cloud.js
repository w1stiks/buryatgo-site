/* BuryatGo — аккаунты (логин + пароль) и сохранение прогресса в облаке.
   Сервер: Firebase (Authentication + Cloud Firestore), запросы через REST — без SDK и сторонних библиотек.
   Ключи проекта задаются в js/cloud-config.js. Если ключей нет, игра работает только с локальным сохранением. */
window.BG_CLOUD = (function () {
  const CFG = window.BG_CLOUD_CONFIG || {};
  const SKEY = 'buryatgo_cloud_session_v1';
  const DOMAIN = '@buryatgo.app';
  const Store = () => window.BG_STORE;
  let timer = null, busy = false, again = false;
  const listeners = [];

  const configured = () => !!(CFG.apiKey && CFG.projectId);
  const readSess = () => { try { return JSON.parse(localStorage.getItem(SKEY) || 'null'); } catch (e) { return null; } };
  let sess = readSess();
  /* Снимок до запуска игры: app.js сохраняет состояние при старте, это не должно перебивать свежий прогресс из облака */
  /* Отпечаток содержимого прогресса (без времени сохранения): понять, что реально изменилось */
  function sig(st) {
    let json = '';
    try { const c = Object.assign({}, st); delete c._savedAt; json = JSON.stringify(c); } catch (e) {}
    let h = 5381;
    for (let i = 0; i < json.length; i++) h = ((h * 33) ^ json.charCodeAt(i)) >>> 0;
    return h.toString(36) + '.' + json.length;
  }
  const bootAt = (window.BG_STORE && window.BG_STORE.state && window.BG_STORE.state._savedAt) || 0;
  const bootSig = window.BG_STORE ? sig(window.BG_STORE.state) : '';
  function writeSess(s) {
    sess = s;
    try { if (s) localStorage.setItem(SKEY, JSON.stringify(s)); else localStorage.removeItem(SKEY); } catch (e) {}
  }
  function emit() { listeners.forEach(fn => { try { fn(); } catch (e) {} }); }

  const normLogin = l => String(l || '').trim().toLowerCase();
  const validLogin = l => /^[a-z0-9_.-]{3,20}$/.test(l);

  const ERR = {
    EMAIL_EXISTS: 'Такой логин уже занят — придумайте другой',
    EMAIL_NOT_FOUND: 'Неверный логин или пароль',
    INVALID_PASSWORD: 'Неверный логин или пароль',
    INVALID_LOGIN_CREDENTIALS: 'Неверный логин или пароль',
    USER_DISABLED: 'Аккаунт заблокирован',
    TOO_MANY_ATTEMPTS_TRY_LATER: 'Слишком много попыток. Попробуйте через несколько минут',
    WEAK_PASSWORD: 'Пароль — минимум 6 символов',
    BAD_LOGIN: 'Логин: латинские буквы, цифры, точка, _ или -, от 3 до 20 символов',
    INVALID_EMAIL: 'Логин: латинские буквы, цифры, точка, _ или -, от 3 до 20 символов',
    OPERATION_NOT_ALLOWED: 'Вход по паролю не включён на сервере (Firebase → Authentication)',
    PERMISSION_DENIED: 'Firebase закрыл общую базу. Прогресс аккаунта пишется, а ивент и список игроков — нет. В Firestore → Правила добавьте коллекции events и presence',
    NOT_CONFIGURED: 'Облако ещё не подключено (js/cloud-config.js)',
    NO_SESSION: 'Войдите в аккаунт',
    TOKEN_EXPIRED: 'Сессия устарела — войдите снова',
    USER_NOT_FOUND: 'Аккаунт не найден — войдите снова',
    INVALID_REFRESH_TOKEN: 'Сессия устарела — войдите снова'
  };
  function fail(code) {
    const k = String(code || '').split(' ')[0].split(':')[0].trim();
    const e = new Error(ERR[k] || 'Нет связи с сервером. Проверьте интернет и попробуйте ещё раз');
    e.code = k || 'NETWORK';
    return e;
  }

  async function request(url, opts) {
    let r;
    try { r = await fetch(url, opts); } catch (e) { throw fail('NETWORK'); }
    const j = await r.json().catch(() => ({}));
    return { r, j };
  }
  const errCode = j => (j && j.error && (j.error.status || j.error.message)) || '';
  const idt = p => 'https://identitytoolkit.googleapis.com/v1/accounts:' + p + '?key=' + encodeURIComponent(CFG.apiKey);

  function fromAuth(j, login) {
    const secs = parseInt(j.expiresIn || j.expires_in, 10) || 3600;
    return {
      login,
      uid: j.localId || j.user_id,
      idToken: j.idToken || j.id_token,
      refreshToken: j.refreshToken || j.refresh_token,
      exp: Date.now() + secs * 1000 - 60000,
      syncedAt: sess && sess.login === login ? sess.syncedAt || 0 : 0
    };
  }

  async function token() {
    if (!configured()) throw fail('NOT_CONFIGURED');
    if (!sess) throw fail('NO_SESSION');
    if (sess.idToken && sess.exp > Date.now()) return sess.idToken;
    const { r, j } = await request('https://securetoken.googleapis.com/v1/token?key=' + encodeURIComponent(CFG.apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(sess.refreshToken)
    });
    if (!r.ok) {
      if (r.status === 400) { writeSess(null); emit(); }
      throw fail(errCode(j));
    }
    writeSess(fromAuth(j, sess.login));
    return sess.idToken;
  }

  const docUrl = () => 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(CFG.projectId) +
    '/databases/(default)/documents/users/' + encodeURIComponent(sess.uid);

  /* Загрузка сохранения из облака: { state, updatedAt } или null, если сохранения ещё нет */
  async function pull() {
    const t = await token();
    const { r, j } = await request(docUrl(), { headers: { Authorization: 'Bearer ' + t } });
    if (r.status === 404) return null;
    if (!r.ok) throw fail(errCode(j));
    const f = j.fields || {};
    try {
      return { state: JSON.parse(f.data.stringValue), updatedAt: parseInt((f.updatedAt || {}).integerValue, 10) || 0 };
    } catch (e) { return null; }
  }

  /* Отправка текущего прогресса в облако */
  async function push(keepalive) {
    if (!configured() || !sess) return false;
    if (busy) { again = true; return false; }
    busy = true;
    clearTimeout(timer); timer = null;
    try {
      const t = await token();
      stripForeignAdmin();
      const st = Store().state;
      const data = JSON.stringify(st), sentSig = sig(st);
      const body = JSON.stringify({ fields: {
        data: { stringValue: data },
        updatedAt: { integerValue: String(st._savedAt || Date.now()) },
        login: { stringValue: sess.login },
        name: { stringValue: String(st.name || '') }
      } });
      const mask = ['data', 'updatedAt', 'login', 'name'].map(f => 'updateMask.fieldPaths=' + f).join('&');
      const { r, j } = await request(docUrl() + '?' + mask, {
        method: 'PATCH',
        keepalive: !!keepalive && body.length < 60000,
        headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' },
        body
      });
      if (!r.ok) throw fail(errCode(j));
      if (sess) { sess.syncedAt = Date.now(); sess.hash = sentSig; sess.dirty = sig(Store().state) !== sentSig; writeSess(sess); }
      emit();
      return true;
    } finally {
      busy = false;
      if (again) { again = false; schedule(); }
    }
  }

  /* Вызывается при каждом сохранении: отправка в облако с небольшой задержкой */
  function schedule() {
    if (!configured() || !sess) return;
    if (sess.hash && sig(Store().state) === sess.hash) {
      if (sess.dirty && !timer) { sess.dirty = false; writeSess(sess); }
      return;
    }
    if (!sess.dirty) { sess.dirty = true; writeSess(sess); }
    clearTimeout(timer);
    timer = setTimeout(() => { push().catch(() => {}); }, 2500);
  }

  /* Подмена прогресса на устройстве сохранением из облака */
  function stripForeignAdmin() {
    const S = Store();
    if (!S || !S.state) return;
    let who = '';
    try { who = localStorage.getItem('buryatgo_dev_login_v1') || ''; } catch (e) {}
    if (!sess || who !== sess.login) S.state.admin = false;
  }
  function applyRemote(state) {
    const S = Store();
    if (sess) { sess.hash = sig(state); sess.dirty = false; writeSess(sess); }
    S.state = state;
    stripForeignAdmin();
    S.save();
  }

  async function signUp(login, password) {
    if (!configured()) throw fail('NOT_CONFIGURED');
    login = normLogin(login);
    if (!validLogin(login)) throw fail('BAD_LOGIN');
    if (String(password || '').length < 6) throw fail('WEAK_PASSWORD');
    const { r, j } = await request(idt('signUp'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: login + DOMAIN, password, returnSecureToken: true })
    });
    if (!r.ok) throw fail(errCode(j));
    writeSess(fromAuth(j, login));
    await push();
    emit();
    return { login };
  }

  /* Вход. Если в облаке есть прогресс — он загружается на устройство (restored: true) */
  async function signIn(login, password) {
    if (!configured()) throw fail('NOT_CONFIGURED');
    login = normLogin(login);
    if (!validLogin(login)) throw fail('BAD_LOGIN');
    if (!password) throw fail('INVALID_PASSWORD');
    const { r, j } = await request(idt('signInWithPassword'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: login + DOMAIN, password, returnSecureToken: true })
    });
    if (!r.ok) throw fail(errCode(j));
    writeSess(fromAuth(j, login));
    const ban = await checkBan();
    if (ban) return { login, banned: ban };
    let remote = null;
    try { remote = await pull(); } catch (e) { writeSess(null); emit(); throw e; }
    if (remote && remote.state) {
      applyRemote(remote.state);
      sess.syncedAt = Date.now(); writeSess(sess);
      emit();
      return { login, restored: true };
    }
    await push();
    emit();
    return { login, restored: false };
  }

  /* Выход: последний прогресс отправляется в облако, на устройстве данные удаляются */
  async function signOut() {
    if (sess) { try { await push(); } catch (e) {} }
    writeSess(null);
    clearTimeout(timer); timer = null;
    emit();
  }

  /* При запуске: подтянуть более свежий прогресс (например, с другого телефона) или отправить свой */
  async function startupSync() {
    if (!configured() || !sess || navigator.onLine === false) return;
    try {
      const remote = await pull();
      if (!remote || !remote.state) { await push(); return; }
      const rs = sig(remote.state);
      if (rs === sig(Store().state)) {
        sess.hash = rs; sess.dirty = false; sess.syncedAt = Date.now(); writeSess(sess); emit();
        return;
      }
      const localChanged = !sess.hash || bootSig !== sess.hash;
      const remoteChanged = rs !== sess.hash;
      /* В облаке новее (играли на другом устройстве) — загружаем. Если меняли и там, и тут — побеждает более свежее */
      if (remoteChanged && (!localChanged || remote.updatedAt > bootAt)) {
        let reloaded = false;
        try { reloaded = sessionStorage.getItem('bg_cloud_reload') === rs; } catch (e) {}
        if (!reloaded) {
          try { sessionStorage.setItem('bg_cloud_reload', rs); } catch (e) {}
          applyRemote(remote.state);
          sess.syncedAt = Date.now(); writeSess(sess);
          location.reload();
          return;
        }
      }
      await push();
    } catch (e) { /* нет сети — синхронизируемся позже */ }
  }

  /* v1.14: живые игроки. Каждый вошедший игрок раз в минуту отмечается в коллекции presence/{uid};
     список читается целиком. Правила Firestore: read — любому вошедшему, write — только владельцу. */
  const presUrl = id => 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(CFG.projectId) +
    '/databases/(default)/documents/presence' + (id ? '/' + encodeURIComponent(id) : '');
  let lastPing = 0;
  async function ping(force) {
    if (!configured() || !sess || !Store()) return false;
    if (document.visibilityState === 'hidden') return false;
    if (!force && Date.now() - lastPing < 50000) return false;
    lastPing = Date.now();
    const p = Store().playerSnapshot();
    const t = await token();
    const I = v => ({ integerValue: String(Math.max(0, Math.round(+v || 0))) });
    const body = { fields: {
      name: { stringValue: String(p.name || 'Ученик').slice(0, 24) },
      xp: I(p.xp), weekXp: I(p.weekXp), league: I(p.league), streak: I(p.streak), lastSeen: I(Date.now()),
      snap: { stringValue: JSON.stringify(p) },
      ip: { stringValue: String(await myIp() || '') },
      app: { stringValue: String(p.app || window.BG_APP_VERSION || '').slice(0, 24) }
    } };
    const keys = Object.keys(body.fields);
    const mask = keys.map(f => 'updateMask.fieldPaths=' + f).join('&');
    const { r } = await request(presUrl(sess.uid) + '?' + mask, {
      method: 'PATCH', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    return r.ok;
  }
  async function livePlayers() {
    if (!configured()) throw fail('NOT_CONFIGURED');
    if (!sess) throw fail('NO_SESSION');
    const t = await token();
    const out = [];
    let page = '';
    for (let i = 0; i < 6; i++) {
      const { r, j } = await request(presUrl() + '?pageSize=300' + (page ? '&pageToken=' + encodeURIComponent(page) : ''),
        { headers: { Authorization: 'Bearer ' + t } });
      if (!r.ok) throw fail(errCode(j));
      (j.documents || []).forEach(d => {
        const f = d.fields || {}, uid = String(d.name || '').split('/').pop();
        const num = k => parseInt((f[k] || {}).integerValue, 10) || 0;
        let snap = {};
        try { snap = JSON.parse((f.snap || {}).stringValue || '{}') || {}; } catch (e) { snap = {}; }
        out.push(Object.assign({}, snap, {
          id: snap.id || uid, uid, name: (f.name || {}).stringValue || snap.name || 'Ученик',
          xp: num('xp'), weekXp: num('weekXp'), league: num('league'), streak: num('streak'), lastSeen: num('lastSeen'),
          me: uid === sess.uid,
          ip: (f.ip || {}).stringValue || snap.ip || '',
          app: (f.app || {}).stringValue || snap.app || ''
        }));
      });
      page = j.nextPageToken;
      if (!page) break;
    }
    return { source: 'cloud', players: out };
  }

  const fsDoc = path => 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(CFG.projectId) +
    '/databases/(default)/documents/' + path;
  function nyFromFields(f) {
    if (!f) return null;
    const on = !!((f.nyOn && f.nyOn.booleanValue) || (f.on && f.on.booleanValue));
    const id = (f.nyId && f.nyId.stringValue) || (f.id && f.id.stringValue) || '';
    const at = parseInt(((f.nyAt || f.at || {}).integerValue) || '0', 10) || 0;
    const startAt = parseInt(((f.startAt || {}).integerValue) || '0', 10) || at;
    if (!id) return null;
    return { on, id, at, startAt };
  }
  async function publishNy(on, startAt) {
    if (!configured()) throw fail('NOT_CONFIGURED');
    if (!sess) throw fail('NO_SESSION');
    const t = await token();
    const id = on ? ('ny' + Date.now().toString(36)) : (sess.nyId || 'ny0');
    const at = Date.now();
    const when = on ? Math.max(0, parseInt(startAt, 10) || at) : 0;
    const headers = { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' };
    const evFields = {
      on: { booleanValue: !!on }, id: { stringValue: id }, at: { integerValue: String(at) },
      startAt: { integerValue: String(when) },
      nyOn: { booleanValue: !!on }, nyId: { stringValue: id }, nyAt: { integerValue: String(at) }
    };
    const evMask = Object.keys(evFields).map(f => 'updateMask.fieldPaths=' + f).join('&');
    const ev = await request(fsDoc('events/ny') + '?' + evMask, { method: 'PATCH', headers, body: JSON.stringify({ fields: evFields }) });
    const prFields = { nyOn: evFields.nyOn, nyId: evFields.nyId, nyAt: evFields.nyAt };
    const prMask = Object.keys(prFields).map(f => 'updateMask.fieldPaths=' + f).join('&');
    const pr = await request(presUrl(sess.uid) + '?' + prMask, { method: 'PATCH', headers, body: JSON.stringify({ fields: prFields }) });
    if (!ev.r.ok && !pr.r.ok) throw fail(errCode(ev.j) || errCode(pr.j));
    sess.nyId = id; writeSess(sess);
    return { on: !!on, id, at, startAt: when, shared: ev.r.ok };
  }
  async function readNy() {
    if (!configured() || !sess) return null;
    const t = await token();
    const ev = await request(fsDoc('events/ny'), { cache: 'no-store', headers: { Authorization: 'Bearer ' + t } });
    if (ev.r.ok) return nyFromFields(ev.j.fields) || { on: false, id: '', at: 0 };
    let best = null, page = '';
    for (let i = 0; i < 4; i++) {
      const { r, j } = await request(presUrl() + '?pageSize=300' + (page ? '&pageToken=' + encodeURIComponent(page) : ''),
        { headers: { Authorization: 'Bearer ' + t } });
      if (!r.ok) break;
      (j.documents || []).forEach(d => {
        const n = nyFromFields(d.fields);
        if (n && n.on && (!best || n.at > best.at)) best = n;
      });
      page = j.nextPageToken;
      if (!page) break;
    }
    return best || (ev.r.status === 404 ? { on: false, id: '', at: 0 } : null);
  }
  setInterval(() => { ping().catch(() => {}); }, 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') ping(true).catch(() => {}); });
  window.addEventListener('load', () => setTimeout(() => ping(true).catch(() => {}), 3000));

  let cachedIp = '';
  async function myIp() {
    if (cachedIp) return cachedIp;
    try {
      const { r, j } = await request('https://api.ipify.org?format=json');
      if (r.ok && j && j.ip) cachedIp = String(j.ip);
    } catch (e) {}
    return cachedIp;
  }
  async function readBans() {
    if (!configured() || !sess) return [];
    const t = await token();
    const ev = await request(fsDoc('events/bans'), { headers: { Authorization: 'Bearer ' + t } });
    if (!ev.r.ok) return [];
    try { return JSON.parse(((ev.j.fields || {}).list || {}).stringValue || '[]') || []; } catch (e) { return []; }
  }
  async function writeBans(list) {
    const t = await token();
    const fields = { list: { stringValue: JSON.stringify(list) } };
    const ev = await request(fsDoc('events/bans') + '?updateMask.fieldPaths=list', {
      method: 'PATCH', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields })
    });
    if (!ev.r.ok) throw fail(errCode(ev.j));
    return list;
  }
  async function banPlayer(entry) {
    const list = await readBans();
    const id = entry.uid || ('ip-' + (entry.ip || Date.now()));
    const row = { id, uid: entry.uid || '', ip: entry.ip || '', name: entry.name || '', reason: entry.reason || 'Нарушение правил', wipe: false, at: Date.now(), by: (sess && sess.login) || '' };
    await writeBans([row].concat(list.filter(b => b.id !== id && !(row.ip && b.ip === row.ip) && !(row.uid && b.uid === row.uid))));
    return row;
  }
  async function unban(id) {
    const keys = (Array.isArray(id) ? id : [id]).map(v => String(v || '')).filter(Boolean);
    const list = await readBans();
    await writeBans(list.filter(b => !keys.includes(b.id) && !keys.includes(b.uid) && !keys.includes(String(b.ip || ''))));
  }
  async function deleteSelf() {
    if (!sess) return;
    const t = await token();
    await request(docUrl(), { method: 'DELETE', headers: { Authorization: 'Bearer ' + t } }).catch(() => {});
    await request(presUrl(sess.uid), { method: 'DELETE', headers: { Authorization: 'Bearer ' + t } }).catch(() => {});
    await request(idt('delete'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: t }) }).catch(() => {});
    writeSess(null);
  }
  async function readPurged() {
    if (!configured() || !sess) return [];
    const t = await token();
    const ev = await request(fsDoc('events/purged'), { headers: { Authorization: 'Bearer ' + t } });
    if (!ev.r.ok) return [];
    try { return JSON.parse(((ev.j.fields || {}).list || {}).stringValue || '[]') || []; } catch (e) { return []; }
  }
  async function purgeAccount(uid) {
    uid = String(uid || '');
    if (!uid) throw fail('USER_NOT_FOUND');
    const list = await readPurged();
    if (list.indexOf(uid) < 0) list.unshift(uid);
    const t = await token();
    const fields = { list: { stringValue: JSON.stringify(list.slice(0, 400)) } };
    const ev = await request(fsDoc('events/purged') + '?updateMask.fieldPaths=list', {
      method: 'PATCH', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields })
    });
    if (!ev.r.ok) throw fail(errCode(ev.j));
    const hdr = { Authorization: 'Bearer ' + t };
    const userDoc = await request(fsDoc('users/' + encodeURIComponent(uid)), { method: 'DELETE', headers: hdr });
    const pres = await request(presUrl(uid), { method: 'DELETE', headers: hdr });
    return { user: userDoc.r.ok || userDoc.r.status === 404, presence: pres.r.ok || pres.r.status === 404 };
  }
  async function checkPurge() {
    if (!configured() || !sess) return false;
    const list = await readPurged();
    if (list.indexOf(sess.uid) < 0) return false;
    try { await deleteSelf(); } catch (e) {}
    return true;
  }
  async function checkBan() {
    if (!configured() || !sess) return null;
    const ip = await myIp();
    const list = await readBans();
    const hit = list.find(b => (b.uid && b.uid === sess.uid) || (ip && b.ip && b.ip === ip));
    return hit || null;
  }

  window.addEventListener('online', () => { if (sess && sess.dirty) push().catch(() => {}); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && sess && (timer || sess.dirty)) push(true).catch(() => {});
  });
  window.addEventListener('pagehide', () => { if (sess && timer) push(true).catch(() => {}); });
  window.addEventListener('load', () => setTimeout(startupSync, 400));

  return {
    configured,
    user: () => (sess ? sess.login : null),
    syncedAt: () => (sess ? sess.syncedAt || 0 : 0),
    pending: () => !!(sess && (sess.dirty || timer)),
    signUp, signIn, signOut, push, pull, schedule, startupSync, ping, livePlayers, publishNy, readNy,
    myIp, readBans, banPlayer, unban, checkBan, readPurged, purgeAccount, checkPurge,
    onChange(fn) { listeners.push(fn); }
  };
})();
