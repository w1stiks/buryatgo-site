/* BuryatGo v1.15.1 — интерьер юрты: Бато за столом, шагаи, гардероб, кошка */
(function () {
  'use strict';
  const SKIN = '#D9A273', SKIN_D = '#BF8556';
  const SIDES = [
    { id: 'honi', bu: 'Хони', ru: 'Овца', icon: '🐑', p: .32 },
    { id: 'yamaan', bu: 'Ямаан', ru: 'Коза', icon: '🐐', p: .32 },
    { id: 'morin', bu: 'Морин', ru: 'Лошадь', icon: '🐎', p: .14 },
    { id: 'temen', bu: 'Тэмэн', ru: 'Верблюд', icon: '🐫', p: .14 },
    { id: 'uher', bu: 'Үхэр', ru: 'Корова', icon: '🐄', p: .08 }
  ];
  const HAND = { x: 230, y: 174 };      // правая рука в покое (на столе)
  const POCKET = { x: 221, y: 153 };    // карман дэгэла
  const RAISE = { x: 240, y: 158 };     // замах
  const TOSS = { x: 226, y: 181 };      // бросок
  const SHOULDER_R = { x: 218.6, y: 143 }, SHOULDER_L = { x: 181.4, y: 143 };
  const LHAND = { x: 170, y: 175 };
  const SLOTS = [140, 178, 222, 260], SLOT_Y = 182, LBL_Y = 209;

  function roll() {
    let r = Math.random(), acc = 0;
    for (const s of SIDES) { acc += s.p; if (r < acc) return s; }
    return SIDES[0];
  }

  const BASE = 'M-11 -6Q-12 -10 -7 -10Q-3 -8 0 -9Q4 -10 8 -9Q12 -8 11 -3Q13 2 10 6Q7 10 2 9Q-2 8 -6 10Q-11 10 -11 5Q-13 0 -11 -6Z';
  const base = f => `<ellipse cx="0" cy="10" rx="11" ry="2.6" fill="rgba(60,25,5,.25)"/><path d="${BASE}" fill="${f}" stroke="#9C7743" stroke-width="1.4" stroke-linejoin="round"/><path d="M-8 -7Q-2 -9 6 -7" stroke="#fff" stroke-opacity=".7" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  const ST = 'stroke="#6B4520" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"';
  const MARK = {
    honi: ['#F6EBD2', `<path d="M-5 3Q-7 -4 0 -4Q5 -4 4 1Q3 4 0 3Q-2 2 -1 0" ${ST}/>`],
    yamaan: ['#EFDDB8', `<path d="M-4 4L-2 -5M4 4L2 -5M-1 6L0 8L1 6" ${ST}/>`],
    morin: ['#F1DFBE', `<path d="M-6 5Q-5 -3 0 -5Q5 -6 6 -2L3 0Q1 -1 0 1L-1 5" ${ST}/>`],
    temen: ['#EADBB5', `<path d="M-8 4Q-6 -4 -3 1Q0 -6 3 1Q5 -1 8 4" ${ST}/>`],
    uher: ['#F4E2C0', `<path d="M-7 -3Q-4 2 0 1Q4 2 7 -3M-3 4Q0 6 3 4" ${ST}/>`]
  };
  function bone(id) {
    if (!MARK[id]) return base('#F3E4C4') + `<path d="M-6 1Q0 -3 6 1" ${ST} stroke-opacity=".55"/>`;
    return base(MARK[id][0]) + MARK[id][1];
  }
  function palmBones() {
    return `<g transform="translate(-3 -6) scale(.42) rotate(-20)">${bone('tumble')}</g><g transform="translate(4 -7) scale(.42) rotate(25)">${bone('tumble')}</g><g transform="translate(0 -11) scale(.42) rotate(5)">${bone('tumble')}</g>`;
  }

  function armD(s, hx, hy, side) {
    const dx = hx - s.x, dy = hy - s.y, d = Math.max(1, Math.hypot(dx, dy));
    let nx = -dy / d, ny = dx / d; if (nx * side < 0) { nx = -nx; ny = -ny; }
    const bend = Math.max(4, 20 - d * .3);
    const cx = (s.x + hx) / 2 + nx * bend, cy = (s.y + hy) / 2 + ny * bend;
    return `M${s.x} ${s.y}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${hx.toFixed(1)} ${hy.toFixed(1)}`;
  }
  function setHand(svg, x, y, r, s) {
    if (!svg) return;
    const h = svg.querySelector('.yi-hand');
    if (h) h.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(r || 0).toFixed(1)}) scale(${(s || 1).toFixed(3)})`);
    const d = armD(SHOULDER_R, x, y, 1);
    svg.querySelectorAll('.yi-arm-r').forEach(p => p.setAttribute('d', d));
  }
  function handG(cuff, cls, extra) {
    return `<g class="${cls}"><circle cx="0" cy="-2" r="5.4" fill="${cuff}" stroke="rgba(0,0,0,.25)" stroke-width="1"/><ellipse cx="0" cy="2" rx="6.2" ry="5.4" fill="${SKIN}" stroke="${SKIN_D}" stroke-width="1.2"/><path d="M-3 5.5Q0 7 3 5.5" stroke="${SKIN_D}" stroke-width="1" fill="none"/>${extra || ''}</g>`;
  }

  function ward() {
    const orn = (x, y) => `<rect x="${x - 4}" y="${y - 4}" width="8" height="8" transform="rotate(45 ${x} ${y})" fill="none" stroke="#2D7DD2" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="1.6" fill="#F2C14E"/>`;
    const door = (x, cls) => `<g class="${cls}"><rect x="${x}" y="104" width="32" height="66" rx="2" fill="#D2532F" stroke="#8E2F1A" stroke-width="1.4"/><rect x="${x + 4}" y="109" width="24" height="56" rx="2" fill="none" stroke="#F2C14E" stroke-width="1.4"/>${orn(x + 16, 128)}${orn(x + 16, 148)}</g>`;
    return `<g class="yi-ward" role="button" aria-label="Гардероб">
      <rect x="318" y="200" width="6" height="7" fill="#6E2414"/><rect x="382" y="200" width="6" height="7" fill="#6E2414"/>
      <ellipse cx="353" cy="207" rx="42" ry="3.5" fill="rgba(50,20,5,.28)"/>
      <rect x="316" y="98" width="74" height="104" rx="3" fill="#B5482B" stroke="#6E2414" stroke-width="1.6"/>
      <rect x="312" y="91" width="82" height="9" rx="2" fill="#8E2F1A"/><path d="M316 95.5H390" stroke="#F2C14E" stroke-width="1.2" stroke-dasharray="4 3"/>
      <rect x="320" y="104" width="66" height="66" fill="#3A1A0C"/>
      <path d="M322 111H384" stroke="#9C7743" stroke-width="1.6"/>
      <path d="M337 111L329 120L327 166H347L345 120Z" fill="#2D7DD2" stroke="#1C5596" stroke-width="1"/><path d="M337 112V166" stroke="#F2C14E" stroke-width="1.2"/>
      <path d="M367 111L359 120L357 160H377L375 120Z" fill="#7C3AED" stroke="#4C1D95" stroke-width="1"/><path d="M367 112V160" stroke="#F2C14E" stroke-width="1.2"/>
      ${door(320, 'yi-wd-l')}${door(354, 'yi-wd-r')}
      <circle cx="349" cy="137" r="1.8" fill="#F2C14E"/><circle cx="357" cy="137" r="1.8" fill="#F2C14E"/>
      <rect x="320" y="174" width="66" height="11" rx="1.5" fill="#C64A2C" stroke="#8E2F1A"/><rect x="320" y="187" width="66" height="11" rx="1.5" fill="#C64A2C" stroke="#8E2F1A"/>
      <circle cx="353" cy="179.5" r="2" fill="#F2C14E"/><circle cx="353" cy="192.5" r="2" fill="#F2C14E"/>
    </g>`;
  }

  function cat() {
    const O = '#F0A04B', D = '#C96A1B', L = '#D9792A';
    const head = (x, y) => `<g transform="translate(${x} ${y})"><path d="M-7 -4L-6 -13L-1 -7ZM7 -4L6 -13L1 -7Z" fill="${O}" stroke="${D}" stroke-width="1"/><circle r="8" fill="${O}" stroke="${D}" stroke-width="1"/><path d="M-3 -7L-2 -3M0 -8V-4M3 -7L2 -3" stroke="${D}" stroke-width="1.1"/><g class="cat-eye"><ellipse cx="-3" cy="0" rx="1.5" ry="2" fill="#2F6B2F"/><ellipse cx="3.4" cy="0" rx="1.5" ry="2" fill="#2F6B2F"/></g><ellipse cx="0" cy="4" rx="4" ry="2.6" fill="#FFF4E4"/><path d="M-1 3H1L0 4.2Z" fill="#E86A8A"/><path d="M-4 4H-11M-4 5.5L-10 7.5M4 4H11M4 5.5L10 7.5" stroke="#fff" stroke-width=".6"/></g>`;
    const leg = (x, c, k) => `<g class="cl ${k}"><rect x="${x}" y="-11" width="5" height="12" rx="2.5" fill="${c}"/></g>`;
    return `<g class="yi-cat sit" transform="translate(70 266) scale(.7)"><g class="cat-in">
      <ellipse cx="0" cy="1" rx="20" ry="3.5" fill="rgba(50,20,5,.25)"/>
      <g class="cat-run">
        <path class="cat-tail" d="M-16 -17Q-28 -20 -27 -33" stroke="${O}" stroke-width="5" fill="none" stroke-linecap="round"/>
        ${leg(-14, L, 'cl2')}${leg(9, L, 'cl3')}
        <g class="cat-body"><ellipse cx="0" cy="-15" rx="18" ry="8.5" fill="${O}" stroke="${D}" stroke-width="1"/><path d="M-8 -23Q-6 -17 -8 -12M-2 -23.5Q0 -17 -2 -11M4 -23Q6 -17 4 -12" stroke="${D}" stroke-width="1.6" fill="none"/><ellipse cx="4" cy="-10" rx="8" ry="3" fill="#FFF4E4"/>${head(18, -23)}</g>
        ${leg(-10, O, 'cl1')}${leg(12, O, 'cl4')}
      </g>
      <g class="cat-sit">
        <path class="cat-tail" d="M-8 -2Q-20 -1 -18 -12Q-17 -20 -11 -22" stroke="${O}" stroke-width="5" fill="none" stroke-linecap="round"/>
        <ellipse cx="-2" cy="-11" rx="11" ry="12" fill="${O}" stroke="${D}" stroke-width="1"/><path d="M-9 -16Q-6 -12 -9 -7M-4 -20Q-1 -14 -4 -8" stroke="${D}" stroke-width="1.6" fill="none"/>
        <ellipse cx="3" cy="-11" rx="5" ry="8" fill="#FFF4E4"/><rect x="0" y="-9" width="4" height="10" rx="2" fill="${O}"/><rect x="5" y="-9" width="4" height="10" rx="2" fill="${O}"/>
        ${head(4, -27)}
      </g>
      <g class="yi-meow"><g class="yi-meow-f"><rect x="-20" y="-62" width="40" height="17" rx="8.5" fill="#fff" stroke="#F0A04B" stroke-width="1.4"/><text x="0" y="-50" text-anchor="middle" class="yi-lbl2">Мяу! ♥</text></g></g>
      <ellipse class="cat-hit" cx="2" cy="-16" rx="28" ry="22" fill="transparent"/>
    </g></g>`;
  }

  function interior(mascotSvg, sl) {
    const c = (sl && sl.c) || '#2D7DD2', cuff = (sl && sl.cuff) || '#F2C14E';
    const inner = String(mascotSvg).replace(/^\s*<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
    let poles = '';
    for (let i = 0; i <= 15; i++) poles += `<path d="M200 -34L${-40 + i * 32} 84" stroke="#C0552B" stroke-width="3.2"/>`;
    let boards = '';
    for (let i = 0; i < 7; i++) boards += `<path d="M0 ${214 + i * 14 + i * i}H400" stroke="#9A6738" stroke-width="1"/>`;
    const armOut = armD(SHOULDER_R, HAND.x, HAND.y, 1), armL = armD(SHOULDER_L, LHAND.x, LHAND.y, -1);
    const arm = (d, cls) => `<path class="${cls}" d="${d}" stroke="rgba(0,0,0,.28)" stroke-width="11.5" fill="none" stroke-linecap="round"/><path class="${cls}" d="${d}" stroke="${c}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
    return `<svg class="yi-svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="yiKhana" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#F4E3C1"/><path d="M0 0L16 16M16 0L0 16" stroke="#D9B27A" stroke-width="1.6"/></pattern>
      <radialGradient id="yiGlow" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#FFE9B0" stop-opacity=".25"/><stop offset="1" stop-color="#3A1A0C" stop-opacity=".35"/></radialGradient>
    </defs>
    <rect x="-60" y="-80" width="520" height="170" fill="#E9D3A8"/>${poles}
    <circle cx="200" cy="-34" r="46" fill="#FFF6D8" stroke="#B5482B" stroke-width="6"/>
    <rect x="-60" y="84" width="520" height="12" fill="#B5482B"/><path d="M-60 90H460" stroke="#F2C14E" stroke-width="1.4" stroke-dasharray="6 4"/>
    <rect x="-60" y="96" width="520" height="100" fill="url(#yiKhana)"/>
    <rect x="-60" y="196" width="520" height="8" fill="#8E2F1A"/>
    <rect x="-60" y="204" width="520" height="120" fill="#B07A47"/>${boards}
    <ellipse cx="200" cy="252" rx="156" ry="30" fill="#A83A22"/><ellipse cx="200" cy="252" rx="146" ry="25" fill="#C9502E" stroke="#F2C14E" stroke-width="1.6" stroke-dasharray="7 4"/><ellipse cx="200" cy="252" rx="96" ry="14" fill="none" stroke="#2D7DD2" stroke-width="1.6"/>
    <g class="yi-door" role="button" aria-label="Выход">
      <rect x="12" y="96" width="76" height="108" rx="3" fill="#C0552B" stroke="#6E2414" stroke-width="1.6"/>
      <rect x="18" y="102" width="64" height="102" fill="#5A2A10"/>
      <g class="yi-door-p"><rect x="18" y="102" width="64" height="102" fill="#E07A3A" stroke="#8E2F1A" stroke-width="1.2"/><rect x="24" y="108" width="52" height="38" rx="2" fill="none" stroke="#F2C14E" stroke-width="1.4"/><rect x="24" y="152" width="52" height="44" rx="2" fill="none" stroke="#F2C14E" stroke-width="1.4"/><circle cx="72" cy="150" r="2.6" fill="#F2C14E"/></g>
      <g class="yi-exit"><rect x="14" y="76" width="72" height="16" rx="8" fill="#fff" stroke="#C0552B" stroke-width="1.4"/><text x="50" y="87.5" text-anchor="middle" class="yi-lbl2">⬅ Выход</text></g>
    </g>
    ${ward()}
    <ellipse cx="200" cy="240" rx="108" ry="10" fill="rgba(40,15,5,.3)"/>
    <g class="yi-bato"><g class="yi-head"><g transform="translate(138 63) scale(.62)">${inner}</g></g></g>
    <rect x="128" y="212" width="8" height="18" fill="#5E1F10"/><rect x="264" y="212" width="8" height="18" fill="#5E1F10"/>
    <path d="M122 158H278L300 196H100Z" fill="#B5482B" stroke="#6E2414" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M130 162H270L288 192H112Z" fill="none" stroke="#F2C14E" stroke-width="1.2" stroke-opacity=".8"/>
    <path d="M100 196H300V214H100Z" fill="#8E2F1A" stroke="#6E2414" stroke-width="1.4"/><path d="M106 205H294" stroke="#F2C14E" stroke-width="1" stroke-dasharray="5 3" stroke-opacity=".6"/>
    <path d="M104 214H116V238Q119 244 112 245H106Q100 244 104 238Z" fill="#7A2A16" stroke="#5E1F10" stroke-width="1"/>
    <path d="M284 214H296V238Q300 244 294 245H288Q281 244 284 238Z" fill="#7A2A16" stroke="#5E1F10" stroke-width="1"/>
    <ellipse cx="110" cy="245.5" rx="9" ry="2.2" fill="rgba(30,10,0,.35)"/><ellipse cx="290" cy="245.5" rx="9" ry="2.2" fill="rgba(30,10,0,.35)"/>
    <g transform="translate(130 164)"><ellipse cx="0" cy="3" rx="8" ry="2.2" fill="rgba(0,0,0,.2)"/><path d="M-7 -3H7Q6 3 0 3.4Q-6 3 -7 -3Z" fill="#fff" stroke="#2D7DD2" stroke-width="1.2"/><ellipse cx="0" cy="-3" rx="7" ry="1.8" fill="#E8C9A0"/></g>
    ${arm(armL, 'yi-arm-l')}
    <g transform="translate(${LHAND.x} ${LHAND.y})">${handG(cuff, 'yi-hand-l')}</g>
    ${arm(armOut, 'yi-arm-r')}
    <g class="yi-hand" transform="translate(${HAND.x} ${HAND.y})">${handG(cuff, 'yi-hand-in', '<g class="yi-palm" transform="translate(0 -1)"></g>')}<circle class="yi-hint" r="13" fill="none" stroke="#FFD43B" stroke-width="2.4"/><circle r="24" fill="transparent"/></g>
    <g class="yi-bones"></g>
    ${cat()}
    <rect x="-60" y="-80" width="520" height="400" fill="url(#yiGlow)" pointer-events="none"/>
    </svg>`;
  }

  /* Кошка: бегает по полу, садится, мурлычет по тапу */
  function bind(svg) {
    if (!svg) return;
    const wd = svg.querySelector('.yi-ward');
    if (wd) wd.addEventListener('click', e => { e.stopPropagation(); wd.classList.toggle('open'); });
    const cat = svg.querySelector('.yi-cat'); if (!cat) return;
    const meowF = cat.querySelector('.yi-meow-f');
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let x = 70, y = 266, dir = 1, tx = x, ty = y, state = 'sit', until = performance.now() + 1200, last = performance.now(), speed = 95;
    const pose = p => { cat.classList.toggle('run', p === 'run'); cat.classList.toggle('sit', p === 'sit'); };
    function draw() {
      const s = .62 + (y - 250) * .006;
      cat.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(dir * s).toFixed(3)} ${s.toFixed(3)})`);
      if (meowF) meowF.setAttribute('transform', `scale(${dir} 1)`);
    }
    function frame(now) {
      if (!cat.isConnected) return;
      const dt = Math.min(50, now - last) / 1000; last = now;
      if (state === 'run') {
        const dx = tx - x, dy = ty - y, d = Math.hypot(dx, dy), sp = speed * dt;
        if (d <= sp) { x = tx; y = ty; state = 'sit'; pose('sit'); until = now + 1400 + Math.random() * 2600; }
        else { x += dx / d * sp; y += dy / d * sp; }
      } else if (now > until && !reduce) {
        do { tx = 40 + Math.random() * 320; } while (Math.abs(tx - x) < 70);
        ty = 256 + Math.random() * 26; dir = tx > x ? 1 : -1;
        speed = Math.random() < .35 ? 55 : 105; cat.classList.toggle('walk', speed < 80);
        state = 'run'; pose('run');
      }
      draw(); requestAnimationFrame(frame);
    }
    draw(); requestAnimationFrame(frame);
    cat.addEventListener('click', e => {
      e.stopPropagation();
      cat.classList.remove('hop', 'meow'); void cat.getBoundingClientRect();
      cat.classList.add('hop', 'meow');
      clearTimeout(cat._t); cat._t = setTimeout(() => cat.classList.remove('hop', 'meow'), 1300);
      if (navigator.vibrate) try { navigator.vibrate(15); } catch (_) {}
    });
  }

  window.BG_YURT = { SIDES, HAND, POCKET, RAISE, TOSS, SLOTS, SLOT_Y, LBL_Y, roll, bone, palmBones, interior, setHand, bind };
})();
