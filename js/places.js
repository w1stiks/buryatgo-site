/* BuryatGo — городские детали: деревья, кусты, дверь, зал Дома Правительства, портрет создателя, голуби */
(function () {
  let n = 0;
  const nid = p => p + 'pl' + (++n);
  const sway = () => `style="animation-delay:-${(Math.random() * 5).toFixed(2)}s"`;

  function tree(x, y, s) {
    return `<g class="tr" transform="translate(${x} ${y}) scale(${s})">
      <ellipse cx="0" cy="1" rx="22" ry="4" fill="rgba(0,0,0,.18)"/>
      <path d="M-3.5 0Q-2 -16 -2.5 -28L-10 -40L-8 -41.5L-1 -33L-.5 -46H2L2 -32L8.5 -42L10.5 -40.5L3 -28Q2 -14 3.5 0Z" fill="#6B4A2E"/>
      <path d="M1 -2Q.5 -14 1 -26" stroke="#8A6542" stroke-width="1.2" fill="none"/>
      <g class="tr-sway" ${sway()}>
        <g fill="#2D6431"><circle cx="-13" cy="-44" r="13"/><circle cx="12" cy="-46" r="13"/><circle cx="0" cy="-60" r="15"/><circle cx="-5" cy="-37" r="10"/><circle cx="8" cy="-35" r="9"/></g>
        <g fill="#3E8A3D"><circle cx="-11" cy="-49" r="10"/><circle cx="10" cy="-51" r="10"/><circle cx="-1" cy="-63" r="11"/><circle cx="2" cy="-44" r="9"/></g>
        <g fill="#62B04F"><circle cx="-13" cy="-53" r="5"/><circle cx="3" cy="-68" r="6"/><circle cx="11" cy="-56" r="4"/><circle cx="-4" cy="-47" r="3"/></g>
        <g fill="#86C966" opacity=".8"><circle cx="-15" cy="-55" r="2"/><circle cx="1" cy="-71" r="2.4"/><circle cx="12" cy="-58" r="1.6"/></g>
        <g class="snow-cap" fill="#FFFFFF"><ellipse cx="0" cy="-74" rx="10" ry="3.6"/><ellipse cx="-14" cy="-56" rx="8" ry="3"/><ellipse cx="13" cy="-58" rx="8" ry="3"/><ellipse cx="-6" cy="-46" rx="5" ry="2"/></g>
      </g></g>`;
  }

  function pine(x, y, s) {
    return `<g class="tr" transform="translate(${x} ${y}) scale(${s})">
      <ellipse cx="0" cy="1" rx="14" ry="3" fill="rgba(0,0,0,.16)"/>
      <rect x="-2.5" y="-14" width="5" height="14" fill="#5E3F25"/>
      <g class="tr-sway" ${sway()}>
        <path d="M-17 -12L0 -36L17 -12Z" fill="#1F5233"/><path d="M-14 -26L0 -50L14 -26Z" fill="#24603B"/><path d="M-10 -40L0 -64L10 -40Z" fill="#2B6E44"/>
        <path d="M0 -36L17 -12H6Z M0 -50L14 -26H5Z M0 -64L10 -40H4Z" fill="rgba(0,0,0,.14)"/>
        <g class="snow-cap" fill="#FFFFFF"><path d="M-5 -57L0 -64L5 -57Q0 -55 -5 -57Z"/><path d="M-7 -43L0 -50L7 -43Q0 -41 -7 -43Z"/><path d="M-8 -29L0 -36L8 -29Q0 -27 -8 -29Z"/></g>
      </g></g>`;
  }

  function bush(x, y, s, fl) {
    return `<g class="bs" transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0.5" rx="15" ry="2.6" fill="rgba(0,0,0,.18)"/>
      <g class="bs-sway" ${sway()}>
      <g fill="#2E6A31"><circle cx="-8" cy="-5" r="7"/><circle cx="8" cy="-5" r="7"/><circle cx="0" cy="-9" r="8.5"/></g>
      <g fill="#40903D"><circle cx="-5" cy="-8" r="5"/><circle cx="5" cy="-9.5" r="5"/></g>
      <g fill="#6DBB55"><circle cx="-6" cy="-10" r="2"/><circle cx="3" cy="-14" r="2.3"/></g>
      ${fl ? `<g fill="${fl}"><circle cx="-9" cy="-6" r="1.4"/><circle cx="-2" cy="-12" r="1.4"/><circle cx="7" cy="-7" r="1.4"/><circle cx="2" cy="-4" r="1.2"/></g>` : ''}
      <g class="snow-cap" fill="#fff"><ellipse cx="0" cy="-16" rx="7" ry="2.6"/><ellipse cx="-9" cy="-10" rx="5" ry="2"/><ellipse cx="9" cy="-10" rx="5" ry="2"/></g></g></g>`;
  }
  function cityBushes() {
    return bush(48, 228, 1, '#F06595') + bush(76, 228, .9) + bush(152, 228, .85, '#FFD43B') + bush(248, 228, .85, '#FFD43B') + bush(326, 228, .9) + bush(354, 228, 1, '#F06595');
  }

  function cityDoor() {
    const leaf = (x0, hx) => `<rect x="${x0}" y="184" width="14" height="40" fill="#6B3B1F"/><rect x="${x0 + 2}" y="187" width="10" height="15" fill="none" stroke="#3F200E" stroke-width="1"/><rect x="${x0 + 2}" y="205" width="10" height="16" fill="none" stroke="#3F200E" stroke-width="1"/><circle cx="${hx}" cy="205" r="1.1" fill="#F2C14E"/>`;
    return `<g class="ct-door">
      <rect x="170" y="222" width="60" height="4" fill="#D6CDBB"/><rect x="164" y="226" width="72" height="4" fill="#C2B8A4"/>
      <path d="M181 224V182Q200 166 219 182V224Z" fill="#EDE5D2" stroke="#C9BC9F" stroke-width="1"/>
      <rect x="186" y="184" width="28" height="40" fill="#FFD98A"/><rect x="186" y="184" width="28" height="40" fill="#F7B955" opacity=".55"/>
      <path d="M188 186Q200 176 212 186" stroke="#C9A24A" stroke-width="2" fill="none"/>
      <g class="ct-dl">${leaf(186, 198)}</g><g class="ct-dr">${leaf(200, 202)}</g>
    </g>`;
  }

  /* Портрет создателя: тот же стиль, что и Бато, но другой персонаж — каштановые волосы, очки, наушники, красное худи. Без имени. */
  function creatorInner(M) {
    const raw = M.svg({ hat: null, outfit: 'hoodie', feet: null, hand: null, acc: null, belt: null }, { mood: 'happy', cls: 'static' });
    const m = raw.match(/<svg[^>]*>([\s\S]*)<\/svg>\s*$/);
    const inner = (m ? m[1] : raw).split('#241A13').join('#6B4423');
    return inner + `<g class="cr-extra"><path d="M47 86Q46 22 100 21Q154 22 153 86" fill="none" stroke="#2F3640" stroke-width="7" stroke-linecap="round"/>
      <rect x="38" y="70" width="16" height="28" rx="7" fill="#2F3640"/><rect x="41" y="75" width="6" height="18" rx="3" fill="#E03131"/>
      <rect x="146" y="70" width="16" height="28" rx="7" fill="#2F3640"/><rect x="153" y="75" width="6" height="18" rx="3" fill="#E03131"/>
      <circle cx="81" cy="88" r="10.5" fill="rgba(190,225,255,.22)" stroke="#1E1E1E" stroke-width="2.6"/><circle cx="119" cy="88" r="10.5" fill="rgba(190,225,255,.22)" stroke="#1E1E1E" stroke-width="2.6"/>
      <path d="M91.5 87Q100 83 108.5 87" stroke="#1E1E1E" stroke-width="2.4" fill="none"/><path d="M74 83L78 81" stroke="#fff" stroke-width="1.6" opacity=".7"/><path d="M112 83L116 81" stroke="#fff" stroke-width="1.6" opacity=".7"/></g>`;
  }

  function hall(M) {
    const cl = nid('c'), sky = nid('s'), gold = nid('g'), wall = nid('w');
    const pil = x => `<rect x="${x}" y="64" width="10" height="146" fill="#FAF5EA"/><rect x="${x - 2}" y="64" width="14" height="6" fill="url(#${gold})"/><rect x="${x - 2}" y="204" width="14" height="6" fill="#D9CDB5"/><path d="M${x + 3} 72V202M${x + 7} 72V202" stroke="#E4DCCB" stroke-width="1"/>`;
    const win = x => `<path d="M${x} 176V96Q${x + 22} 74 ${x + 44} 96V176Z" fill="#BFDDF0" stroke="#C9A24A" stroke-width="2"/><path d="M${x + 22} 82V176M${x} 128H${x + 44}M${x} 152H${x + 44}" stroke="#F4EEE2" stroke-width="2"/>
      <path d="M${x - 8} 70Q${x + 22} 92 ${x + 52} 70V80Q${x + 22} 100 ${x - 8} 80Z" fill="#8E1626"/><path d="M${x - 8} 74Q${x - 2} 130 ${x - 6} 178H${x + 6}Q${x + 4} 120 ${x + 6} 82Z" fill="#A3172B"/><path d="M${x + 52} 74Q${x + 46} 130 ${x + 50} 178H${x + 38}Q${x + 40} 120 ${x + 38} 82Z" fill="#A3172B"/>
      <circle cx="${x + 2}" cy="128" r="2.6" fill="url(#${gold})"/><circle cx="${x + 42}" cy="128" r="2.6" fill="url(#${gold})"/>`;
    const chand = x => `<g class="hl-ch"><path d="M${x} 0V26" stroke="#B8913A" stroke-width="1.4"/><circle cx="${x}" cy="40" r="26" fill="#FFE9A8" opacity=".22"/>
      <path d="M${x - 22} 36Q${x} 50 ${x + 22} 36" stroke="url(#${gold})" stroke-width="2.4" fill="none"/><path d="M${x - 12} 30Q${x} 38 ${x + 12} 30" stroke="url(#${gold})" stroke-width="2" fill="none"/>
      ${[-22, -11, 0, 11, 22].map(d => `<rect x="${x + d - 1.2}" y="${Math.abs(d) > 15 ? 30 : 33}" width="2.4" height="6" fill="#FFF7E0"/><circle class="hl-fl" cx="${x + d}" cy="${Math.abs(d) > 15 ? 28.5 : 31.5}" r="1.6" fill="#FFC23D"/><path d="M${x + d} 42V${48 + (d === 0 ? 6 : 0)}" stroke="#E6F4FF" stroke-width="1.2"/>`).join('')}
      <path d="M${x - 4} 44L${x} 58L${x + 4} 44Z" fill="#E6F4FF" opacity=".9"/></g>`;
    const floorLines = [-200, -150, -100, -60, -30, 0, 30, 60, 100, 150, 200].map(d => `<path d="M${200 + d * .25} 210L${200 + d * 1.6} 300"/>`).join('') + [218, 230, 246, 268, 296].map(y => `<path d="M0 ${y}H400"/>`).join('');
    const ru = `<path d="M146 96Q132 92 118 98V106Q132 100 146 104Z" fill="#FFFFFF"/><path d="M146 104Q132 100 118 106V114Q132 108 146 112Z" fill="#1C57C8"/><path d="M146 112Q132 108 118 114V122Q132 116 146 120Z" fill="#D52B1E"/>`;
    const bu = `<path d="M254 96Q268 92 282 98V106Q268 100 254 104Z" fill="#0F5BBD"/><path d="M254 104Q268 100 282 106V114Q268 108 254 112Z" fill="#FFFFFF"/><path d="M254 112Q268 108 282 114V122Q268 116 254 120Z" fill="#F2C230"/><circle cx="262" cy="100" r="2.4" fill="#F2C230"/><path d="M259 102.5Q262 104.5 265 102.5" stroke="#F2C230" stroke-width="1" fill="none"/>`;
    return `<svg class="hl-svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" width="100%" height="100%">
      <defs><linearGradient id="${gold}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7D774"/><stop offset="1" stop-color="#B8862A"/></linearGradient>
        <linearGradient id="${wall}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6EFE0"/><stop offset="1" stop-color="#EADFC9"/></linearGradient>
        <linearGradient id="${sky}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FD3F2"/><stop offset="1" stop-color="#F7E7C2"/></linearGradient>
        <clipPath id="${cl}"><rect x="158" y="110" width="84" height="104"/></clipPath></defs>
      <rect width="400" height="300" fill="url(#${wall})"/>
      <rect width="400" height="56" fill="#E9DCC2"/>${[20, 80, 140, 200, 260, 320, 380].map(x => `<rect x="${x - 22}" y="8" width="44" height="38" rx="3" fill="none" stroke="#D6C49F" stroke-width="1.5"/>`).join('')}
      <rect y="54" width="400" height="10" fill="url(#${gold})"/><path d="M0 64H400" stroke="#9C7420" stroke-width="1"/>
      <rect y="176" width="400" height="34" fill="#E3D4B9"/>${[30, 100, 170, 230, 300, 370].map(x => `<rect x="${x - 26}" y="182" width="52" height="22" fill="none" stroke="#CDBB98" stroke-width="1.4"/>`).join('')}
      ${win(80)}${win(276)}${pil(66)}${pil(134)}${pil(256)}${pil(324)}
      <circle cx="200" cy="84" r="12" fill="url(#${gold})" stroke="#9C7420"/><circle cx="200" cy="84" r="6" fill="#1C57C8"/><path d="M200 79L202 84L200 89L198 84Z" fill="#F2C230"/>
      <rect y="210" width="400" height="90" fill="#ECE5D9"/><g stroke="#CFC4B2" stroke-width="1" fill="none">${floorLines}</g>
      <path d="M184 210H216L264 300H136Z" fill="#A3172B"/><path d="M187 210L141 300M213 210L259 300" stroke="#E0A92E" stroke-width="2"/>
      <path d="M146 92V214M254 92V214" stroke="#8B6A2B" stroke-width="2.4"/><circle cx="146" cy="90" r="3" fill="url(#${gold})"/><circle cx="254" cy="90" r="3" fill="url(#${gold})"/>
      <g class="hl-flag">${ru}</g><g class="hl-flag">${bu}</g>
      <path d="M184 0H216L282 262H118Z" fill="#FFF8DC" opacity=".16"/>
      <ellipse cx="200" cy="266" rx="44" ry="6" fill="rgba(0,0,0,.16)"/>
      <path d="M186 122L166 266M214 122L234 266M200 132V260M172 236H228" stroke="#7A4A26" stroke-width="5" stroke-linecap="round"/>
      <g class="hl-portrait"><rect x="144" y="96" width="112" height="132" rx="4" fill="url(#${gold})" stroke="#8E6A1C" stroke-width="1.5"/>
        <rect x="151" y="103" width="98" height="118" fill="#F2CF6A" stroke="#B88A2A"/>
        <rect x="158" y="110" width="84" height="104" fill="url(#${sky})"/>
        <g clip-path="url(#${cl})"><path d="M158 196Q190 184 242 194V214H158Z" fill="#9CC26B"/><circle cx="228" cy="124" r="6" fill="#FFE066"/>
          <g transform="translate(140 104) scale(.6)">${creatorInner(M)}</g></g>
        ${[[146, 98], [254, 98], [146, 226], [254, 226]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#F7D774" stroke="#8E6A1C"/>`).join('')}
        <rect x="182" y="229" width="36" height="8" rx="2" fill="url(#${gold})" stroke="#8E6A1C" stroke-width=".8"/><path d="M194 233H206" stroke="#8E6A1C" stroke-width="1" stroke-dasharray="2 2"/></g>
      <g class="hl-shine"><path d="M160 112L174 112L160 140Z" fill="#fff" opacity=".35"/></g>
      ${[124, 276].map(x => `<rect x="${x - 2}" y="246" width="4" height="24" fill="url(#${gold})"/><ellipse cx="${x}" cy="271" rx="7" ry="2.5" fill="#B8862A"/><circle cx="${x}" cy="245" r="3.4" fill="#F7D774"/>`).join('')}
      <path d="M124 249Q200 276 276 249" stroke="#8E1626" stroke-width="3.4" fill="none"/>
      ${chand(100)}${chand(300)}
      <g transform="translate(372 210)"><path d="M-12 0L-14 -20H14L12 0Z" fill="#B85C38"/><rect x="-15" y="-22" width="30" height="4" fill="#9A4A2C"/>
        <g class="tr-sway" fill="#2F7D3B"><path d="M0 -22Q-22 -40 -30 -34Q-16 -34 0 -22Z"/><path d="M0 -22Q20 -46 30 -38Q14 -36 0 -22Z"/><path d="M0 -22Q-8 -58 2 -66Q4 -44 0 -22Z"/><path d="M0 -22Q-24 -60 -14 -64Q-6 -46 0 -22Z" fill="#3E9449"/><path d="M0 -22Q22 -62 14 -66Q4 -46 0 -22Z" fill="#3E9449"/></g></g>
      <g class="hl-door"><rect x="6" y="102" width="52" height="108" fill="#EDE2CB" stroke="#C9A24A" stroke-width="2"/><rect x="11" y="108" width="21" height="102" fill="#6B3B1F"/><rect x="32" y="108" width="21" height="102" fill="#5E3219"/>
        <circle cx="29" cy="160" r="1.8" fill="#F2C14E"/><circle cx="35" cy="160" r="1.8" fill="#F2C14E"/>
        <g class="yi-exit"><rect x="4" y="80" width="56" height="16" rx="8" fill="#1CB0F6"/><text x="32" y="91.5" text-anchor="middle" font-size="9.5" font-weight="900" fill="#fff" font-family="system-ui,sans-serif">⬅ Выход</text></g></g>
    </svg>`;
  }

  /* ── Голуби: ходят, прыгают, клюют; в дождь/снег улетают, в солнце возвращаются ── */
  function pigeonSvg() {
    return `<g class="pg"><g class="pg-b"><ellipse class="pg-sh" cx="0" cy=".4" rx="6" ry="1.3" fill="rgba(0,0,0,.2)"/>
      <path class="pg-legs" d="M-1.5 -2.5V.3M1.5 -2.5V.3" stroke="#D9534F" stroke-width="1.1" stroke-linecap="round"/>
      <path d="M-5 -5.5L-12.5 -5L-12 -2.8L-5 -3Z" fill="#5E6672"/><ellipse cx="-.5" cy="-5.2" rx="6.6" ry="4" fill="#A2AAB6"/>
      <path class="pg-wing" d="M-7 -6Q-1 -9.5 4.5 -6.2Q0 -3 -7 -4.2Z" fill="#848D9A"/><path class="pg-wing" d="M-4 -5.6H0M-3.5 -4.6H.5" stroke="#3E444D" stroke-width=".7"/>
      <g class="pg-h"><path d="M2.5 -6.5Q4 -9 5.5 -10.5L7.5 -8Q6 -6 4.5 -5Z" fill="#6E8F84"/><circle cx="5.6" cy="-10.6" r="2.5" fill="#7C8592"/><circle cx="6.5" cy="-11.1" r=".65" fill="#E8590C"/><path d="M7.8 -10.6L10.2 -10L7.8 -9.4Z" fill="#3A3A3A"/></g>
      <g class="pg-fw"><path class="pg-f1" d="M-4 -7Q-10 -20 3 -18Q3 -12 1.5 -7Z" fill="#8F98A5"/><path class="pg-f2" d="M-3 -5Q-12 -1 -2 -1Z" fill="#7A8390"/></g></g></g>`;
  }
  function pigeons(svg, getMode, o) {
    const layer = svg && svg.querySelector('.pg-layer');
    if (!layer) return;
    const A = o.area, N = o.n || 8, rnd = (a, b) => a + Math.random() * (b - a);
    const cx = v => Math.max(A.x0, Math.min(A.x1, v)), cy = v => Math.max(A.y0, Math.min(A.y1, v));
    let h = ''; for (let i = 0; i < N; i++) h += pigeonSvg(); layer.innerHTML = h;
    const sun0 = getMode() === 'sun';
    const birds = Array.from(layer.querySelectorAll('.pg')).map(el => ({ el, x: rnd(A.x0, A.x1), y: rnd(A.y0, A.y1), dir: Math.random() < .5 ? -1 : 1, st: sun0 ? 'ground' : 'away', act: 'idle', until: performance.now() + rnd(200, 2000), lift: 0, cls: '' }));
    const setCls = (b, c) => { if (b.cls !== c) { b.el.setAttribute('class', 'pg ' + c); b.cls = c; } };
    const draw = b => {
      const k = .72 + (b.y - A.y0) / Math.max(1, A.y1 - A.y0) * .5;
      b.el.style.display = b.st === 'away' ? 'none' : '';
      b.el.setAttribute('transform', `translate(${b.x.toFixed(1)} ${(b.y - b.lift).toFixed(1)}) scale(${(b.dir * k).toFixed(3)} ${k.toFixed(3)})`);
    };
    let last = performance.now();
    const loop = now => {
      if (!svg.isConnected) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      const sunny = getMode() === 'sun';
      birds.forEach(b => {
        if (b.fl) {
          const f = b.fl, t = Math.min(1, (now - f.t0) / f.ms), e = f.ease(t);
          b.x = f.x0 + (f.x1 - f.x0) * e; b.lift = f.l0 + (f.l1 - f.l0) * e;
          if (t >= 1) { b.fl = null; b.lift = 0; if (b.st === 'out') { b.st = 'away'; setCls(b, ''); b.backAt = 0; } else { b.st = 'ground'; setCls(b, ''); b.act = 'idle'; b.until = now + rnd(500, 1500); b.leaveAt = 0; } }
        } else if (b.st === 'ground') {
          if (!sunny) {
            if (!b.leaveAt) b.leaveAt = now + rnd(0, 900);
            if (now >= b.leaveAt) { b.st = 'out'; b.hop = null; setCls(b, 'fly'); b.dir = b.x < 200 ? -1 : 1; b.fl = { t0: now, ms: rnd(1300, 1900), x0: b.x, x1: b.x + b.dir * rnd(200, 280), l0: 0, l1: b.y + 70, ease: t => t * t }; }
          } else if (b.hop) {
            const t = Math.min(1, (now - b.hop.t0) / 380);
            b.x = cx(b.hop.x0 + (b.hop.x1 - b.hop.x0) * t); b.lift = Math.sin(Math.PI * t) * 5;
            if (t >= 1) { b.hop = null; b.lift = 0; b.act = 'idle'; b.until = now + rnd(300, 1200); }
          } else if (b.act === 'walk') {
            const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy);
            if (d < 1 || now > b.until) { b.act = 'idle'; setCls(b, ''); b.until = now + rnd(600, 1800); }
            else { const v = 15 * dt; b.x += dx / d * Math.min(v, d); b.y += dy / d * Math.min(v, d); if (Math.abs(dx) > .5) b.dir = dx > 0 ? 1 : -1; }
          } else if (now > b.until) {
            const r = Math.random();
            if (r < .38) { b.act = 'walk'; b.tx = cx(b.x + rnd(-40, 40)); b.ty = cy(b.y + rnd(-9, 9)); b.until = now + 4000; setCls(b, 'walk'); }
            else if (r < .6) { b.act = 'hop'; if (Math.random() < .3) b.dir *= -1; b.hop = { t0: now, x0: b.x, x1: cx(b.x + b.dir * rnd(8, 16)) }; setCls(b, ''); }
            else if (r < .84) { b.act = 'peck'; setCls(b, 'peck'); b.until = now + 950; }
            else { b.act = 'idle'; setCls(b, ''); if (Math.random() < .5) b.dir *= -1; b.until = now + rnd(700, 2200); }
          }
        } else if (b.st === 'away') {
          if (!sunny) b.backAt = 0;
          else {
            if (!b.backAt) b.backAt = now + rnd(600, 6000);
            if (now >= b.backAt) {
              const side = Math.random() < .5 ? -1 : 1, lx = rnd(A.x0, A.x1);
              b.y = rnd(A.y0, A.y1); b.dir = side < 0 ? 1 : -1; b.st = 'in'; setCls(b, 'fly');
              b.fl = { t0: now, ms: rnd(1700, 2500), x0: side < 0 ? -40 : 440, x1: lx, l0: b.y + rnd(50, 110), l1: 0, ease: t => 1 - (1 - t) * (1 - t) };
            }
          }
        }
        draw(b);
      });
      requestAnimationFrame(loop);
    };
    birds.forEach(draw);
    requestAnimationFrame(loop);
    return { count: () => birds.filter(b => b.st !== 'away').length, birds };
  }

  window.BG_PLACES = { tree, pine, bush, cityBushes, cityDoor, hall, creatorInner, pigeons, pigeonSvg };
})();
