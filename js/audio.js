/* BuryatGo — звуковые эффекты, фоновая музыка (синтез Web Audio) и озвучка слов */
window.BG_AUDIO = (function () {
  'use strict';
  let ctx = null, master = null, sfxBus = null, musicBus = null;
  let musicOn = false, musicTimer = null, nextTime = 0, step = 0, drone = null, musicVol = 0.35, paused = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 1; sfxBus.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = musicVol * 0.5; musicBus.connect(master);
    }
    if (ctx.state === 'suspended' && !paused) ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, type, vol, dest, slideTo) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, start);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(dest || sfxBus);
    o.start(start); o.stop(start + dur + 0.05);
  }

  const sounds = {
    click(t) { tone(1500, t, 0.045, 'triangle', 0.12); },
    pop(t) { tone(520, t, 0.08, 'sine', 0.18, null, 980); },
    correct(t) { tone(784, t, 0.13, 'sine', 0.28); tone(1175, t + 0.09, 0.26, 'sine', 0.28); tone(1568, t + 0.09, 0.2, 'sine', 0.06); },
    wrong(t) { tone(320, t, 0.18, 'square', 0.07, null, 200); tone(220, t + 0.14, 0.26, 'square', 0.07, null, 130); },
    complete(t) { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.1, 0.32, 'triangle', 0.22)); },
    coin(t) { tone(1319, t, 0.07, 'square', 0.05); tone(1976, t + 0.07, 0.18, 'square', 0.05); },
    popper(t) {
      tone(180, t, 0.09, 'square', 0.2, null, 90);
      tone(880, t + 0.05, 0.12, 'triangle', 0.22, null, 1760);
      [1046, 1318, 1568, 2093].forEach((f, i) => tone(f, t + 0.08 + i * 0.045, 0.18, 'sine', 0.12));
    },
    streak(t) { [392, 523, 659, 784].forEach((f, i) => tone(f, t + i * 0.08, 0.22, 'sawtooth', 0.05)); }
  };

  function play(name) {
    if (!ensure() || !sounds[name]) return;
    try { sounds[name](ctx.currentTime + 0.005); } catch (e) {}
  }

  /* Фоновая мелодия: пентатоника в стиле степных напевов */
  const N = { A3: 220, C4: 261.6, D4: 293.7, E4: 329.6, G4: 392, A4: 440, C5: 523.3, D5: 587.3, E5: 659.3, G5: 784 };
  const melody = ['E5', null, 'D5', 'E5', 'G5', null, 'E5', 'D5', 'C5', null, 'A4', 'C5', 'D5', null, null, null,
    'A4', null, 'C5', 'D5', 'E5', null, 'D5', 'C5', 'A4', null, 'G4', 'A4', 'A4', null, null, null];
  const bass = ['A3', null, null, null, 'A3', null, null, null, 'C4', null, null, null, 'D4', null, null, null];
  const STEP = 60 / 84 / 2;

  function scheduler() {
    if (!ctx || !musicOn) return;
    while (nextTime < ctx.currentTime + 0.35) {
      const m = melody[step % melody.length], b = bass[step % bass.length];
      if (m) tone(N[m], nextTime, STEP * 1.8, 'triangle', 0.16, musicBus);
      if (b) tone(N[b] / 2, nextTime, STEP * 3.6, 'sine', 0.2, musicBus);
      nextTime += STEP; step++;
    }
  }

  function startMusic() {
    if (!ensure()) return;
    if (musicTimer) return;
    nextTime = ctx.currentTime + 0.1;
    drone = ctx.createOscillator();
    const dg = ctx.createGain();
    drone.type = 'sine'; drone.frequency.value = 110; dg.gain.value = 0.05;
    drone.connect(dg); dg.connect(musicBus); drone.start();
    musicTimer = setInterval(scheduler, 90);
  }
  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    if (drone) { try { drone.stop(); } catch (e) {} drone = null; }
  }

  function setMusic(on) { musicOn = !!on; if (musicOn && !paused) startMusic(); else stopMusic(); }
  function setMusicVolume(v) { musicVol = v; if (musicBus) musicBus.gain.setTargetAtTime(v * 0.5, ctx.currentTime, 0.05); }
  function pauseAll() { paused = true; stopMusic(); if (ctx && ctx.state === 'running') ctx.suspend(); }
  function resumeAll() { paused = false; if (ctx) ctx.resume(); if (musicOn) startMusic(); }

  /* Озвучка: нативный TTS Android → Web Speech API. Записи носителей кладутся в www/audio/<id>.mp3 */
  function ttsText(t) {
    return String(t).replace(/Һ/g, 'Х').replace(/һ/g, 'х').replace(/Ү/g, 'У').replace(/ү/g, 'у').replace(/Ө/g, 'О').replace(/ө/g, 'о');
  }
  let recorded = null, playToken = 0;
  const missingAudio = {};
  /* Два голоса: «Женский» (Irina — по умолчанию) и «Мужской» (Pavel). На Android — подбор среди установленных голосов. */
  const FEMALE = /irina|ирина|milena|милена|svetlana|светлана|dariya|дария|anna|анна|female|женск/i;
  const MALE = /pavel|павел|yuri|юрий|dmitr|дмитр|maxim|максим|\bmale|мужск/i;
  let nativeGender = null;
  function gender(g) {
    if (g !== 'male' && g !== 'female') { try { g = window.BG_STORE.state.settings.voice; } catch (e) { g = 'female'; } }
    return g === 'male' ? 'male' : 'female';
  }
  function pickVoice(g) {
    const ru = speechSynthesis.getVoices().filter(x => /ru/i.test(x.lang));
    if (!ru.length) return { v: null, pitch: g === 'male' ? 0.75 : 1 };
    if (g === 'male') {
      const m = ru.find(v => MALE.test(v.name) && !/female/i.test(v.name));
      return m ? { v: m, pitch: 1 } : { v: ru.find(v => !FEMALE.test(v.name)) || ru[0], pitch: 0.75 };
    }
    return { v: ru.find(v => FEMALE.test(v.name)) || ru.find(v => !MALE.test(v.name)) || ru[0], pitch: 1 };
  }
  function setVoice(g) {
    g = gender(g); nativeGender = null;
    try { if (window.AndroidBridge && window.AndroidBridge.setVoiceGender) { window.AndroidBridge.setVoiceGender(g); nativeGender = g; } } catch (e) {}
  }
  function listVoices() {
    return Promise.resolve([{ id: 'female', label: 'Женский голос' }, { id: 'male', label: 'Мужской голос' }]);
  }

    const AUDIO_FILES = new Set(["aba", "aha", "amar", "amtatai", "ayaga", "b_ama", "b_aral", "b_bagsha", "b_bayaskhalan", "b_beshehe", "b_boroo", "b_buudal", "b_debter", "b_dolgin", "b_duratai", "b_edihe", "b_erhim", "b_erie", "b_gar", "b_gol", "b_gunig", "b_guur", "b_habar", "b_halhin", "b_haluun", "b_hamar", "b_hoto", "b_huiten", "b_hul", "b_huragsha", "b_hurguuli", "b_namar", "b_nom", "b_nuur", "b_nyuden", "b_sahan", "b_shehen", "b_tergen", "b_tolgoi", "b_toskhon", "b_ubel", "b_uhaatai", "b_uhen", "b_unshaha", "b_untaha", "b_uuha", "b_yabaha", "b_zagahan", "b_zam", "b_zorigtoi", "b_zun", "bayarlaa", "bayartai", "bi", "buhe", "buuza", "dalai", "degel", "durbeljen", "durben", "duu", "duun", "egeshe", "ezhy", "geer", "ger", "gurban", "gutal", "hadag", "hain", "hara", "hara_m", "hileemen", "hohe", "honin", "hoyor", "hubsahan", "hugshen", "jel", "k_hello", "k_listen_repeat", "k_listen_tap", "k_molodec", "k_otlichno", "k_oy", "k_sound_then_pic", "k_umnica", "k_ura", "k_zdorovo", "mahan", "malgai", "modon", "morin", "naadan", "naran", "negen", "nere", "nogoon", "nohoi", "p01_amar_mende_seseg", "p02_bayartay_bato", "p03_sayn_bayna_gut", "p04_hayn_bayarlaa", "p05_minii_nere_bato", "p06_tiime_bi_seseg", "p07_hohe_tengeri", "p08_ulaan_shara_nogoon", "p09_sagaan_hara", "p10_minii_ezhy", "p11_minii_aba", "p12_minii_ger_bule", "p13_bi_say_uunab", "p14_buuza_amtatay", "p15_baygal_dalay", "p16_minii_morin", "p17_hayn_nohoy", "p18_minii_honin", "p19_minii_degel", "p20_shene_malgay", "p21_minii_ger", "p22_minii_tolgoy", "p23_hoyor_nyuden", "p24_hoyor_gar", "p25_uta_uhen", "p26_huyten_ubel", "p27_haluun_zun", "p28_sahan_orozho_bayna", "p29_boroo_orozho_bayna", "p30_bi_yabanab", "p31_bato_untana", "p32_bi_nom_unshanab", "p33_minii_bagsha", "p34_bi_hurguulida_yabanab", "p35_shene_nom", "p36_minii_debter", "p37_sagaan_haraar", "p38_hayn_duun", "p39_hayn_naadan", "p40_negen_hoyor_gurban", "p41_taban_buuza", "p42_negen_uder", "p43_gurban_zhel", "p44_baygal_nuur", "p45_olhon_aral", "p46_tomo_zagahan", "p47_nuuray_ere", "p48_bi_sayd_duratay", "p49_ehe_bayashalan", "p50_uhaatay_hubuun", "p51_zorigtoy_bato", "p52_hoto_ruu_yabanab", "p53_urta_zam", "p54_shene_guur", "p55_tergenay_buudal", "p56_amar_mende", "p57_sayn_bayna", "p58_bayarlaa", "p59_hayn", "p60_bayartay", "sagaalgan", "sagaan", "sai", "sain", "sain_gut", "shara", "shi", "shiree", "shono", "sun", "surharban", "taban", "temeen", "tiime", "tontoloo", "ubgen", "udur", "ugy", "uhan", "uher", "ulaan", "uula", "yokhor"]);
  function normKey(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/ё/g, 'е').replace(/[!?.,…«»"“”:;—–-]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const PHRASE_FILES = {
    'амар мэндэ сэсэг': 'p01_amar_mende_seseg',
    'баяртай бато': 'p02_bayartay_bato',
    'сайн байна гүт': 'p03_sayn_bayna_gut',
    'һайн баярлаа': 'p04_hayn_bayarlaa',
    'минии нэрэ бато': 'p05_minii_nere_bato',
    'тиимэ би сэсэг': 'p06_tiime_bi_seseg',
    'хөхэ тэнгэри': 'p07_hohe_tengeri',
    'улаан шара ногоон': 'p08_ulaan_shara_nogoon',
    'минии эжы': 'p10_minii_ezhy',
    'минии аба': 'p11_minii_aba',
    'минии гэр бүлэ': 'p12_minii_ger_bule',
    'би сай уунаб': 'p13_bi_say_uunab',
    'бууза амтатай': 'p14_buuza_amtatay',
    'байгал далай': 'p15_baygal_dalay',
    'минии морин': 'p16_minii_morin',
    'һайн нохой': 'p17_hayn_nohoy',
    'минии хонин': 'p18_minii_honin',
    'минии дэгэл': 'p19_minii_degel',
    'шэнэ малгай': 'p20_shene_malgay',
    'минии гэр': 'p21_minii_ger',
    'минии толгой': 'p22_minii_tolgoy',
    'хоёр нюдэн': 'p23_hoyor_nyuden',
    'хоёр гар': 'p24_hoyor_gar',
    'ута үһэн': 'p25_uta_uhen',
    'хүйтэн үбэл': 'p26_huyten_ubel',
    'халуун зун': 'p27_haluun_zun',
    'сахаһан орожо байна': 'p28_sahan_orozho_bayna',
    'бороо орожо байна': 'p29_boroo_orozho_bayna',
    'би ябанаб': 'p30_bi_yabanab',
    'бато унтана': 'p31_bato_untana',
    'би ном уншанаб': 'p32_bi_nom_unshanab',
    'минии багша': 'p33_minii_bagsha',
    'би һургуулида ябанаб': 'p34_bi_hurguulida_yabanab',
    'шэнэ ном': 'p35_shene_nom',
    'минии дэбтэр': 'p36_minii_debter',
    'сагаан һараар': 'p37_sagaan_haraar',
    'һайн дуун': 'p38_hayn_duun',
    'һайн наадан': 'p39_hayn_naadan',
    'нэгэн хоёр гурбан': 'p40_negen_hoyor_gurban',
    'табан бууза': 'p41_taban_buuza',
    'нэгэн үдэр': 'p42_negen_uder',
    'гурбан жэл': 'p43_gurban_zhel',
    'байгал нуур': 'p44_baygal_nuur',
    'ольхон арал': 'p45_olhon_aral',
    'томо загаһан': 'p46_tomo_zagahan',
    'нуурай эрэ': 'p47_nuuray_ere',
    'нуурай эрье': 'p47_nuuray_ere',
    'би сайд дуратай': 'p48_bi_sayd_duratay',
    'эхэ баяшалан': 'p49_ehe_bayashalan',
    'эхэ баясхалан': 'p49_ehe_bayashalan',
    'ухаатай хүбүүн': 'p50_uhaatay_hubuun',
    'зоригтой бато': 'p51_zorigtoy_bato',
    'хото руу ябанаб': 'p52_hoto_ruu_yabanab',
    'урта зам': 'p53_urta_zam',
    'шэнэ гүүр': 'p54_shene_guur',
    'тэргэнэй буудал': 'p55_tergenay_buudal',
    'тэргэнай буудал': 'p55_tergenay_buudal'
  };
  const AUDIO_MAP = {};
  (function () {
    const D = window.BG_DATA;
    if (D && D.words) {
      Object.keys(D.words).forEach(id => {
        if (!AUDIO_FILES.has(id)) return;
        const w = D.words[id];
        const k = normKey(w.bu);
        if (!k || AUDIO_MAP[k]) return;
        AUDIO_MAP[k] = 'audio/' + id + '.m4a';
        w.audio = id + '.m4a';
      });
    }
    Object.keys(PHRASE_FILES).forEach(k => {
      const id = PHRASE_FILES[k];
      if (!AUDIO_FILES.has(id) || AUDIO_MAP[k]) return;
      AUDIO_MAP[k] = 'audio/' + id + '.m4a';
    });
  })();
  function fileFor(text) { return AUDIO_MAP[normKey(text)] || null; }
  function hasFile(id) { return AUDIO_FILES.has(String(id || '')); }
  function isBuryat(text) {
    const k = normKey(text);
    if (AUDIO_MAP[k]) return true;
    if (/[һөүҺӨҮ]/.test(String(text || ''))) return true;
    const D = window.BG_DATA;
    if (D && D.words) {
      for (const id in D.words) if (normKey(D.words[id].bu) === k) return true;
    }
    if (D && D.mascotPhrases) {
      for (let i = 0; i < D.mascotPhrases.length; i++) if (normKey(D.mascotPhrases[i].bu) === k) return true;
    }
    return false;
  }

  function speak(text, rate, audioFile, voice, onEnded) {
    rate = rate || 0.85;
    const g = gender(voice);
    const fireEnd = () => { if (typeof onEnded === 'function') { try { onEnded(); } catch (e) {} } };
    let list = audioFile ? (Array.isArray(audioFile) ? audioFile : [audioFile]) : [];
    list = list.filter(f => f && !missingAudio[f]);
    // skip known empty files
    list = list.filter(f => !f.includes('p09_sagaan_hara'));
    if (list.length) {
      const token = ++playToken;
      const tryAt = i => {
        if (token !== playToken) return;
        if (i >= list.length) {
          console.warn('Нет озвучки для фразы:', text);
          fireEnd();
          return;
        }
        const f = list[i];
        let done = false;
        const next = () => { if (done) return; done = true; missingAudio[f] = true; tryAt(i + 1); };
        try {
          if (recorded) { recorded.onerror = null; recorded.onended = null; try { recorded.pause(); } catch (e2) {} }
          const el = new Audio(f);
          recorded = el;
          el.preload = 'auto';
          el.playbackRate = rate < 0.7 ? 0.75 : 1;
          el.onerror = () => {
            if (token !== playToken) return;
            if (el.error && el.error.code === 1) return;
            next();
          };
          el.onended = () => { if (token === playToken) fireEnd(); };
          const pr = el.play();
          if (pr && pr.catch) pr.catch(err => {
            if (done || token !== playToken) return;
            if (err && (err.name === 'NotAllowedError' || err.name === 'AbortError')) { done = true; return; }
            next();
          });
        } catch (e) { next(); }
      };
      tryAt(0);
      return;
    }
    if (isBuryat(text)) {
      console.warn('Нет озвучки для фразы:', text);
      fireEnd();
      return;
    }
    synth(text, rate, g, fireEnd);
  }
  function synth(text, rate, g, onEnded) {
    const t = ttsText(text);
    try {
      const b = window.AndroidBridge;
      if (b && b.speak) {
        if (b.setVoiceGender && nativeGender !== g) { b.setVoiceGender(g); nativeGender = g; }
        b.speak(t, rate); return;
      }
    } catch (e) {}
    if ('speechSynthesis' in window) {
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(t);
        u.lang = 'ru-RU'; u.rate = rate;
        const p = pickVoice(g);
        if (p.v) u.voice = p.v;
        u.pitch = p.pitch;
        if (typeof onEnded === 'function') u.onend = onEnded;
        speechSynthesis.speak(u);
      } catch (e) { if (typeof onEnded === 'function') setTimeout(onEnded, 800); }
    }
  }

  let jingleStop = null;
  function playJingle() {
    if (!ensure()) return;
    stopJingle();
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0.0001, ctx.currentTime);
    bus.gain.exponentialRampToValueAtTime(0.55, ctx.currentTime + 0.35);
    bus.connect(sfxBus);
    const beat = 0.28;
    const seq = [[659, 0], [659, 1], [659, 2], [659, 4], [659, 5], [659, 6], [659, 8], [784, 9], [523, 10], [587, 11], [659, 12], [698, 16], [698, 17], [698, 18], [698, 19], [698, 20], [659, 21], [659, 22], [659, 23], [784, 24], [784, 25], [698, 26], [587, 27], [523, 28]];
    const t0 = ctx.currentTime + 0.06;
    [0, 28].forEach(shift => {
      seq.forEach(([f, i]) => {
        tone(f, t0 + (i + shift) * beat, beat * 0.95, 'triangle', 0.22, bus);
        tone(f * 2, t0 + (i + shift) * beat, beat * 0.28, 'sine', 0.05, bus);
      });
    });
    const stopAt = t0 + 17.5;
    bus.gain.setValueAtTime(0.7, stopAt - 2.5);
    bus.gain.exponentialRampToValueAtTime(0.0001, stopAt);
    const timer = setTimeout(() => { try { bus.disconnect(); } catch (e) {} }, 18500);
    jingleStop = () => {
      clearTimeout(timer);
      try {
        const now = ctx.currentTime;
        bus.gain.cancelScheduledValues(now);
        bus.gain.setValueAtTime(Math.max(bus.gain.value, 0.0001), now);
        bus.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
      } catch (e) {}
      setTimeout(() => { try { bus.disconnect(); } catch (e) {} }, 900);
      jingleStop = null;
    };
  }
  function stopJingle() { if (jingleStop) jingleStop(); }

  return { play, unlock: ensure, setMusic, setMusicVolume, pauseAll, resumeAll, speak, setVoice, listVoices, ttsText, playJingle, stopJingle, fileFor, hasFile, isBuryat, AUDIO_MAP };
})();
