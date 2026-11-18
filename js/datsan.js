/* BuryatGo — Иволгинский дацан: храм Цогчен-дуган, субурганы, хурдэ, стол подношений, столб хии морин */
(function () {
  let n = 0;
  const KH_COLORS = ['#1F6FD1', '#F5F5F0', '#D6332A', '#2E9E4F', '#F2C230'];
  const POLE = { x: 96, top: 136, base: 266 };
  const ENDS = [{ x: 28, y: 252 }, { x: 160, y: 248 }];
  const MAXF = 14;

  /* v1.16.1: Хии морин — набор из 5 цветных платков (синий, белый, красный, зелёный, жёлтый) на верёвке */
  const PER = 15, SETS = 6;
  function flagSlot(i) {
    const set = Math.floor(i / 5), e = ENDS[set % 2], k = Math.floor(set / 2) * 5 + (i % 5), t = .1 + k * .058;
    const x = POLE.x + (e.x - POLE.x) * t, y = POLE.top + (e.y - POLE.top) * t + Math.sin(Math.PI * t) * 7;
    return { x, y };
  }
  function flag(i, cls) {
    const p = flagSlot(i), c = KH_COLORS[i % 5], ink = c === '#F5F5F0' ? '#1F6FD1' : 'rgba(255,255,255,.7)';
    return `<g class="khf ${cls || ''}" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(1.4)"><g class="khf-in" style="animation-delay:-${(i * .29).toFixed(2)}s">
      <path d="M-3.3 0H3.3L3.5 7.4Q2.6 8.4 1.2 7.7T-1.6 7.9T-3.4 7.5Z" fill="${c}" stroke="rgba(0,0,0,.2)" stroke-width=".4"/>
      <rect x="-3.3" y="0" width="6.6" height=".9" fill="rgba(0,0,0,.14)"/>
      <rect x="-2.1" y="1.9" width="4.2" height="4.4" fill="none" stroke="${ink}" stroke-width=".45"/>
      <circle cx="0" cy="4.1" r="1.05" fill="${ink}"/></g></g>`;
  }
  function flagsHtml(list, markLast) {
    const n = Math.min(SETS, (list || []).length);
    let h = '';
    for (let s = 0; s < n; s++) for (let j = 0; j < 5; j++) h += flag(s * 5 + j, markLast && s === n - 1 ? 'new' : '');
    return h;
  }

  /* иконки подношений (начало координат — низ по центру) */
  function offerIcon(type) {
    if (type === 'sweets') return `<ellipse cx="-2" cy="-2" rx="3" ry="1.9" fill="#E8590C"/><path d="M-5 -2L-7 -3.5V-.5Z M1 -2L3 -3.5V-.5Z" fill="#FFA94D"/><ellipse cx="2" cy="-4.8" rx="3" ry="1.9" fill="#D6336C"/><path d="M-1 -4.8L-3 -6.3V-3.3Z M5 -4.8L7 -6.3V-3.3Z" fill="#F783AC"/>`;
    if (type === 'butter') return `<ellipse cx="0" cy="-.8" rx="6" ry="1.6" fill="#EDEDED" stroke="#C9C9C9" stroke-width=".4"/><path d="M-4 -1.5V-5.5L-2 -7H4V-3L2 -1.5Z" fill="#F6D365"/><path d="M-4 -5.5L-2 -7H4L2 -5.5Z" fill="#FFE8A3"/>`;
    if (type === 'milk') return `<path d="M-5 -6Q-5 0 0 0Q5 0 5 -6Z" fill="#E9F2FA" stroke="#9DB7CF" stroke-width=".5"/><ellipse cx="0" cy="-6" rx="5" ry="1.4" fill="#FFFFFF" stroke="#9DB7CF" stroke-width=".4"/>`;
    if (type === 'tea') return `<path d="M-5 -6Q-5 0 0 0Q5 0 5 -6Z" fill="#FFFFFF" stroke="#2B6CB0" stroke-width=".6"/><path d="M-3.6 -3.4H3.6" stroke="#2B6CB0" stroke-width=".6"/><ellipse cx="0" cy="-6" rx="5" ry="1.4" fill="#C68B59"/>`;
    return `<ellipse cx="0" cy="-1" rx="3.6" ry="1.4" fill="#C9932A"/><ellipse cx="0" cy="-2.4" rx="3.6" ry="1.4" fill="#E0A92E"/><ellipse cx="0" cy="-3.8" rx="3.6" ry="1.4" fill="#F7D774" stroke="#B8862A" stroke-width=".4"/>`;
  }
  const OFFER_POS = [[283, 242], [291, 242], [299, 242], [279, 264], [290, 265], [301, 264]];
  function offersHtml(list) {
    return (list || []).slice(-6).map((t, i) => `<g class="ds-off" transform="translate(${OFFER_POS[i][0]} ${OFFER_POS[i][1]}) scale(1.15)">${offerIcon(t)}</g>`).join('');
  }
  function offerPos(i) { return OFFER_POS[Math.min(5, i)]; }

  function stupa(x, y, s) {
    return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="1" rx="24" ry="3.5" fill="rgba(0,0,0,.16)"/>
      <rect x="-20" y="-8" width="40" height="8" fill="#F4F1EA" stroke="#D3CCBC" stroke-width=".8"/><rect x="-16" y="-14" width="32" height="6" fill="#F7F4EE" stroke="#D3CCBC" stroke-width=".8"/><rect x="-12" y="-19" width="24" height="5" fill="#FAF8F3" stroke="#D3CCBC" stroke-width=".8"/>
      <path d="M-12 -19Q-14 -35 0 -39Q14 -35 12 -19Z" fill="#FBFAF6" stroke="#D3CCBC" stroke-width=".8"/><path d="M4 -37Q12 -33 11 -20H6Q8 -30 4 -37Z" fill="rgba(0,0,0,.06)"/>
      <rect x="-4.5" y="-45" width="9" height="6" fill="#F4F1EA" stroke="#D3CCBC" stroke-width=".8"/><rect x="-5" y="-46" width="10" height="1.6" fill="#E0A92E"/>
      <path d="M-3.8 -46L-1.8 -66H1.8L3.8 -46Z" fill="#E0A92E" stroke="#A8761C" stroke-width=".5"/><path d="M-3.4 -50H3.4M-3 -54H3M-2.6 -58H2.6M-2.2 -62H2.2" stroke="#A8761C" stroke-width=".6"/>
      <path d="M-3 -69Q0 -66 3 -69Q0 -67.5 -3 -69Z" fill="#F7D774"/><circle cx="0" cy="-71.5" r="1.6" fill="#F7D774"/><path d="M0 -73L0 -76" stroke="#F7D774" stroke-width=".8"/>
      <g class="snow-cap" fill="#fff"><path d="M-11 -30Q0 -42 11 -30Q0 -34 -11 -30Z"/><rect x="-20" y="-9" width="40" height="2"/><rect x="-16" y="-15" width="32" height="2"/></g></g>`;
  }

  function scene(s) {
    const id = 'ds' + (++n), P = window.BG_PLACES, A = window.BG_ART;
    const d = (s && s.datsan) || {};
    const tiles = []; for (let x = 128; x <= 272; x += 7) tiles.push(`M${x} 141V${154 - Math.abs(x - 200) * .02}`);
    const cols = []; for (let i = 0; i < 8; i++) { const x = 134 + i * 18.6; cols.push(`<rect x="${x}" y="166" width="5" height="46" fill="#C0392B"/><rect x="${x - 1}" y="166" width="7" height="3.5" fill="url(#${id}g)"/><rect x="${x + 3.4}" y="169" width="1.2" height="43" fill="rgba(0,0,0,.18)"/>`); }
    const band = []; for (let x = 122; x < 278; x += 8) band.push(`<rect x="${x}" y="155" width="4" height="4" fill="${(x / 8) % 2 ? '#E0A92E' : '#2E9E4F'}"/>`);
    const val = []; const vc = ['#1F6FD1', '#F5F5F0', '#D6332A', '#2E9E4F', '#F2C230']; for (let i = 0; i < 20; i++) val.push(`<rect x="${134 + i * 6.6}" y="166" width="6.6" height="5" fill="${vc[i % 5]}"/>`);
    const wheels = []; for (let i = 0; i < 6; i++) { const x = 18 + i * 15; wheels.push(`<g class="ds-kh"><rect x="${x - 4.5}" y="192" width="9" height="16" rx="2" fill="url(#${id}g)" stroke="#A8761C" stroke-width=".5"/><rect class="ds-khs" x="${x - 4.5}" y="197" width="9" height="3" fill="#C0392B"/><rect x="${x - 4.5}" y="203" width="9" height="1.4" fill="#C0392B"/></g>`); }
    const deer = (x, f) => `<g transform="translate(${x} 142) scale(${f} 1)"><ellipse cx="0" cy="-2" rx="4" ry="2.2" fill="url(#${id}g)"/><circle cx="3.6" cy="-5.2" r="1.7" fill="url(#${id}g)"/><path d="M3.4 -6.6L2.6 -9M4.2 -6.6L5.4 -9" stroke="#C9932A" stroke-width=".6"/><path d="M-3 0V1M2 0V1" stroke="#C9932A" stroke-width=".8"/></g>`;
    const spokes = []; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; spokes.push(`M${(200 + Math.cos(a) * 1.8).toFixed(2)} ${(133 + Math.sin(a) * 1.8).toFixed(2)}L${(200 + Math.cos(a) * 6.4).toFixed(2)} ${(133 + Math.sin(a) * 6.4).toFixed(2)}`); }
    return `<svg class="scene-svg city-svg datsan-svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" width="100%" height="100%">
      <defs><linearGradient id="${id}k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86C1EC"/><stop offset=".7" stop-color="#D5EBF7"/><stop offset="1" stop-color="#F2EDDA"/></linearGradient>
        <linearGradient id="${id}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#45AA6E"/><stop offset="1" stop-color="#1E6A43"/></linearGradient>
        <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F9DF85"/><stop offset="1" stop-color="#C48E27"/></linearGradient>
        <linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E8E1D2"/></linearGradient></defs>
      <rect width="400" height="300" fill="url(#${id}k)"/>${A.sun ? A.sun(338, 60, .9) : ''}
      <path d="M0 172Q40 148 92 160Q140 138 200 156Q262 134 322 152Q364 142 400 158V232H0Z" fill="#A7B89C"/>
      <path d="M0 194Q60 176 122 188Q200 172 282 186Q344 178 400 190V232H0Z" fill="#8DA672"/>
      ${P.pine(22, 212, .95)}${P.pine(54, 210, .75)}${P.pine(350, 210, .8)}${P.pine(384, 213, 1)}
      <rect x="0" y="198" width="120" height="16" fill="#F4EFE4"/><rect x="0" y="195" width="120" height="4" fill="#2E8B57"/><rect x="280" y="198" width="120" height="16" fill="#F4EFE4"/><rect x="280" y="195" width="120" height="4" fill="#2E8B57"/>
      <g><path d="M4 188L14 180H98L108 188Z" fill="url(#${id}r)" stroke="#E0A92E" stroke-width=".7"/><rect x="8" y="188" width="3" height="24" fill="#B03A2E"/><rect x="101" y="188" width="3" height="24" fill="#B03A2E"/><rect x="8" y="209" width="96" height="4" fill="#C9BFA9"/>${wheels.join('')}</g>
      <rect x="108" y="212" width="184" height="18" fill="#E6DFD0"/><path d="M108 212H292" stroke="#CFC6B3" stroke-width="1.2"/>
      <rect x="122" y="158" width="156" height="54" fill="url(#${id}w)"/>
      <rect x="134" y="166" width="132" height="46" fill="#8E2A1C"/>
      <rect x="146" y="178" width="30" height="26" fill="#D9A43A"/><rect x="224" y="178" width="30" height="26" fill="#D9A43A"/><path d="M151 178V204M156 178V204M161 178V204M166 178V204M171 178V204M146 187H176M146 195H176M229 178V204M234 178V204M239 178V204M244 178V204M249 178V204M224 187H254M224 195H254" stroke="#7A2416" stroke-width=".8"/>
      <rect x="187" y="176" width="26" height="36" fill="#5A140D"/><path d="M200 176V212" stroke="#D9A43A" stroke-width="1"/><g fill="#E0A92E"><circle cx="192" cy="184" r=".9"/><circle cx="208" cy="184" r=".9"/><circle cx="192" cy="194" r=".9"/><circle cx="208" cy="194" r=".9"/><circle cx="192" cy="204" r=".9"/><circle cx="208" cy="204" r=".9"/></g>
      ${val.join('')}${cols.join('')}
      <rect x="120" y="152" width="160" height="14" fill="#1E5F8C"/>${band.join('')}<path d="M120 162H280" stroke="#E0A92E" stroke-width="1"/>
      <rect x="144" y="110" width="112" height="30" fill="#A93226"/><rect x="144" y="108" width="112" height="5" fill="#F4EFE4"/><rect x="150" y="119" width="100" height="12" fill="#E0A92E"/><path d="M156 119V131M163 119V131M170 119V131M177 119V131M184 119V131M216 119V131M223 119V131M230 119V131M237 119V131M244 119V131" stroke="#7A2416" stroke-width=".8"/>
      <path d="M94 156Q112 154 122 140H278Q288 154 306 156L300 160Q200 153 100 160Z" fill="url(#${id}r)" stroke="#E0A92E" stroke-width="1.2"/><path d="${tiles.join('')}" stroke="rgba(0,0,0,.16)" stroke-width=".8"/>
      <path d="M95 156Q89 151 94 147M305 156Q311 151 306 147" stroke="#E0A92E" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="200" cy="133" r="7" fill="none" stroke="url(#${id}g)" stroke-width="2"/><path d="${spokes.join('')}" stroke="#E0A92E" stroke-width="1"/><circle cx="200" cy="133" r="1.8" fill="#E0A92E"/>${deer(188, 1)}${deer(212, -1)}
      <rect x="127" y="130" width="4" height="10" rx="1.5" fill="url(#${id}g)"/><rect x="269" y="130" width="4" height="10" rx="1.5" fill="url(#${id}g)"/>
      <path d="M124 112Q140 110 148 98H252Q260 110 276 112L270 115Q200 109 130 115Z" fill="url(#${id}r)" stroke="#E0A92E" stroke-width="1.1"/>
      <rect x="168" y="76" width="64" height="22" fill="#F4EFE4"/><rect x="176" y="81" width="8" height="10" fill="#A93226"/><rect x="196" y="81" width="8" height="10" fill="#A93226"/><rect x="216" y="81" width="8" height="10" fill="#A93226"/><rect x="168" y="92" width="64" height="6" fill="#1E5F8C"/>
      <rect x="150" y="88" width="4" height="10" rx="1.5" fill="url(#${id}g)"/><rect x="246" y="88" width="4" height="10" rx="1.5" fill="url(#${id}g)"/>
      <path d="M152 78Q166 76 172 64H228Q234 76 248 78L242 81Q200 76 158 81Z" fill="url(#${id}g)" stroke="#A8761C" stroke-width="1"/>
      <path d="M195.5 64L197 52Q200 46 203 52L204.5 64Z" fill="url(#${id}g)" stroke="#A8761C" stroke-width=".6"/><circle cx="200" cy="45" r="3.2" fill="#F7D774" stroke="#A8761C" stroke-width=".6"/><path d="M199 42.5L200 32L201 42.5Z" fill="#F7D774"/>
      <path d="M176 212H224L232 230H168Z" fill="#D7CFBE"/><path d="M174 216H226M172 220H228M171 224H229M169 228H231" stroke="#BDB3A0" stroke-width=".8"/>
      <rect y="228" width="400" height="72" fill="#D9CDB2"/><path d="M0 228H400" stroke="#C7BA9C" stroke-width="1"/>
      <path d="M0 262Q40 252 70 268Q40 290 0 296Z" fill="#A7BE7C"/><path d="M400 268Q350 262 330 280Q360 296 400 300Z" fill="#A7BE7C"/>
      <path d="M170 230H230L264 300H136Z" fill="#CBBFA4"/><path d="M164 246H236M158 262H242M150 282H250M200 230V300M182 246L176 262M218 246L224 262M170 262L164 282M230 262L236 282" stroke="#B5A88C" stroke-width=".8" fill="none"/>
      ${stupa(50, 240, 1)}${stupa(352, 240, 1)}
      ${P.bush(128, 232, .8, '#FFD43B')}${P.bush(272, 232, .8, '#FFD43B')}
      <g class="snow-cover" fill="#FFFFFF"><path d="M0 172Q40 148 92 160Q140 138 200 156Q262 134 322 152Q364 142 400 158V164Q360 150 322 160Q262 142 200 164Q140 146 92 168Q40 156 0 180Z"/>
        <path d="M122 140H278L284 147Q200 141 116 147Z"/><path d="M148 98H252L258 104Q200 99 142 104Z"/><path d="M172 64H228L232 69Q200 65 168 69Z"/><rect x="0" y="193" width="120" height="3"/><rect x="280" y="193" width="120" height="3"/><path d="M14 180H98L104 184H8Z"/>
        <rect y="228" width="400" height="72" opacity=".85"/></g>
      <g class="puddles"><ellipse cx="110" cy="276" rx="20" ry="3.4"/><ellipse cx="300" cy="288" rx="24" ry="3.6"/><ellipse cx="214" cy="292" rx="14" ry="2.6"/></g>
      <g class="ds-table"><ellipse cx="288" cy="258" rx="28" ry="4" fill="rgba(0,0,0,.18)"/><path d="M268 254V259M308 254V259" stroke="#5A140D" stroke-width="3"/>
        <rect x="266" y="247" width="44" height="8" fill="#8E2A1C"/><rect x="263" y="242" width="50" height="5" rx="1" fill="#B03A2E" stroke="#E0A92E" stroke-width=".8"/>
        <path d="M280 247H296V258L288 255L280 258Z" fill="#FAFAF5" stroke="#DDD8CC" stroke-width=".4"/>
        <g><path d="M268 242L270 236H276L278 242Z" fill="url(#${id}g)"/><path class="ds-fl" d="M273 236Q270 232 273 227Q276 232 273 236Z" fill="#FFB020"/></g>
        <g><path d="M298 242L300 236H306L308 242Z" fill="url(#${id}g)"/><path class="ds-fl" d="M303 236Q300 232 303 227Q306 232 303 236Z" fill="#FFB020"/></g>
        <g class="ds-offers">${offersHtml(d.recent)}</g></g>
      <g class="ds-pole"><path d="M${POLE.x} ${POLE.top}L${ENDS[0].x} ${ENDS[0].y}M${POLE.x} ${POLE.top}L${ENDS[1].x} ${ENDS[1].y}" stroke="#8C7B62" stroke-width=".7" fill="none"/>
        <rect x="${ENDS[0].x - 1.5}" y="${ENDS[0].y - 8}" width="3" height="10" fill="#7A5230"/><rect x="${ENDS[1].x - 1.5}" y="${ENDS[1].y - 8}" width="3" height="10" fill="#7A5230"/>
        <rect x="88" y="${POLE.base - 4}" width="16" height="7" fill="#BDB3A0"/><rect x="${POLE.x - 2}" y="${POLE.top - 4}" width="4" height="${POLE.base - POLE.top}" fill="#8B5A2B"/><rect x="${POLE.x - .6}" y="${POLE.top}" width="1.2" height="${POLE.base - POLE.top - 6}" fill="rgba(255,255,255,.2)"/>
        <path d="M90 ${POLE.top - 4}V${POLE.top - 12}M96 ${POLE.top - 4}V${POLE.top - 20}M102 ${POLE.top - 4}V${POLE.top - 12}M89 ${POLE.top - 4}H103" stroke="#E0A92E" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M93 152Q96 150 99 152L98 166L96 160L94 166Z" fill="#F8F8F2"/>
        <g class="ds-flags">${flagsHtml(d.flags)}</g></g>
      <g class="pg-layer"></g>
    </svg>`;
  }

  window.BG_DATSAN = { scene, flag, flagSlot, flagsHtml, offerIcon, offersHtml, offerPos, KH_COLORS, MAXF, POLE };
})();
