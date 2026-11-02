export function icon(type, cls = '') {
  const paths = {
    wind:'M4 9h12a3 3 0 1 0-3-3M3 14h16a3 3 0 1 1-3 3M5 19h4',
    mountain:'m2 20 7-14 5 9 3-5 5 10H2Zm4-7 3 2 2-3',
    bolt:'m14 2-9 12h7l-2 8 9-12h-7l2-8Z',
    leaf:'M20 3C8 2 3 6 4 13s10 10 14 2c2-4 2-8 2-12ZM4 21 16 8M10 15v-5m0 5h5',
    drop:'M12 2S4 11 4 16a8 8 0 0 0 16 0c0-5-8-14-8-14ZM8 16a4 4 0 0 0 4 4',
    flame:'M12 2c2 6-3 7-2 12 2-1 4-3 4-6 4 4 6 7 4 11-3 5-12 4-13-2C4 10 10 9 12 2Z',
    moon:'M20 15A9 9 0 0 1 9 4 9 9 0 1 0 20 15ZM18 2v6m-3-3h6',
    arrow:'M4 12h16m-6-6 6 6-6 6', lock:'M6 10h12v11H6V10Zm3 0V6a3 3 0 0 1 6 0v4M12 14v3',
    check:'m5 12 4 4L20 5', star:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z',
    book:'M3 4c4-1 6 0 9 2 3-2 5-3 9-2v16c-4-1-6 0-9 2-3-2-5-3-9-2V4Zm9 2v16',
    flag:'M5 22V3m0 1c5-5 9 5 15 0v10c-6 5-10-5-15 0',
    save:'M5 3h12l4 4v14H3V3h2Zm2 0v6h10V3M7 21v-8h10v8',
  };
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[type] || paths.star}"/></svg>`;
}

// Original stylized landscapes; not screenshots of the official map.
export function landscape(region, id = region.id) {
  const buildings = {
    mondstadt:'M80 140v-40h30v40m-15-40V68m-20 10 40 20m-40 0 40-20M176 148V88h24v60m-25-60 13-24 13 24m-1 60V107h27v41m-14-41V92',
    liyue:'M52 150v-29h56v29m-67-28 40-17 40 17H41m87 13h80m-70 15v-27h60v27m-72-27 42-18 42 18m-27-47v30h-30V76m-9 0 24-12 24 12',
    inazuma:'M78 150v-42h70v42m-80-42 45-18 45 18m-72-19 27-16 27 16M228 147V80m-26 11h52m-58-16h64m-61-6c18 7 37 7 58 0',
    sumeru:'M156 150v-38m-7 20-26-20m33 12 24-20M98 107c-12-17 5-30 16-29-6-24 16-36 29-20 6-27 40-25 44-3 28-7 35 27 18 35 12 20-4 36-29 24-27 17-50 15-78-7Zm-40 43v-24h30v24m-34-24c0-26 38-26 38 0',
    fontaine:'M68 150V95h26v55m-30-55 17-27 17 27m18 55V89h59v61m-62-61c0-40 64-40 64 0m-32-30V44m44 106V99h28v51m-31-51 17-28 17 28m-84 40h45',
    natlan:'M55 150v-23h50v23m-55-23 30-25 30 25m32 23 19-39 21 39m-30-39-9-15m31 15 10-15m56 54v-30m-18 0 18-27 18 27m-18-27V77',
    nodkrai:'M65 150v-30h57v30m-65-30 36-27 36 27m-37-27V77m81 73v-38h41v38m-44-38 24-18 24 18m20 38V83h11v67m-17-68h23m-11 0V68m-9 0h18',
  };
  return `<svg class="landscape" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="sky-${id}" x2="0" y2="1"><stop stop-color="${region.dark}"/><stop offset="1" stop-color="#152e37"/></linearGradient><linearGradient id="haze-${id}" x2="0" y2="1"><stop stop-color="${region.accent}" stop-opacity=".3"/><stop offset="1" stop-color="${region.accent}" stop-opacity=".03"/></linearGradient></defs><path fill="url(#sky-${id})" d="M0 0h320v180H0z"/><circle cx="245" cy="46" r="24" fill="${region.accent}" opacity=".22"/><circle cx="245" cy="46" r="18" fill="none" stroke="${region.accent}" opacity=".5"/><g fill="${region.accent}" opacity=".5"><circle cx="41" cy="33" r="1"/><circle cx="142" cy="28" r="1.2"/><circle cx="203" cy="17" r=".8"/><circle cx="282" cy="81" r="1"/></g><path d="M0 123 48 70 83 95 131 41 183 101 222 76 270 114 320 86v94H0Z" fill="url(#haze-${id})"/><path d="M0 150 61 108 99 128 155 89 215 132 272 113 320 137v43H0Z" fill="#102833" opacity=".65"/><g stroke="${region.accent}" stroke-width="1.5" stroke-linejoin="round" fill="${region.dark}" opacity=".83"><path d="${buildings[region.id]}"/></g><path d="M0 155q80-16 160 0t160 0v25H0Z" fill="#10232e"/><path d="M0 161q80-16 160 0t160 0m-280 12h80m70-2h57" fill="none" stroke="${region.accent}" opacity=".25"/></svg>`;
}

export function atlas(regions) {
  const points = [[465,75],[385,158],[523,237],[258,236],[270,92],[119,224],[158,58]];
  return `<svg class="atlas-art" viewBox="0 0 640 340" role="img" aria-label="七地区旅行星图，示意画面并非游戏官方地图"><defs><radialGradient id="atlasglow"><stop stop-color="#3b706c" stop-opacity=".36"/><stop offset="1" stop-color="#17323d" stop-opacity="0"/></radialGradient><pattern id="atlasgrid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" stroke="#80a79f" stroke-opacity=".075" fill="none"/></pattern></defs><path fill="url(#atlasgrid)" d="M0 0h640v340H0z"/><ellipse cx="330" cy="168" rx="300" ry="170" fill="url(#atlasglow)"/><g fill="none" stroke="#8fa69b" stroke-width=".7" opacity=".18"><path d="M43 190 91 141 74 116 111 78 159 84 196 36 226 59 272 47 314 81 377 39 425 53 452 21 504 44 549 35 577 94 559 130 587 168 550 201 579 236 542 296 488 307 453 272 420 279 389 243 347 275 303 270 275 304 227 291 204 318 173 273 124 288 89 252 48 261Z"/><path d="m64 188 47-29-7-38 30-22 37 7 36-48 28 24 40-13 39 31 64-35 42 7 34-25 45 21 38-14 15 38-10 41 20 24-30 44 24 29-34 43-36 9-41-33-35 11-29-40-42 30-42-4-29 26-45-13-16 23-29-36-40 13-27-35-34 7Z"/><circle cx="327" cy="169" r="127"/><ellipse cx="327" cy="169" rx="240" ry="135"/><path d="M20 169h600M327 9v322"/></g><path d="M158 58Q217 2 270 92T465 75Q510 120 385 158T258 236Q210 285 119 224M385 158Q487 140 523 237" fill="none" stroke="#d5bf88" stroke-width="1.2" stroke-dasharray="3 7" opacity=".55"/>${regions.map((r,i)=>`<g transform="translate(${points[i].join(' ')})"><circle r="17" fill="${r.accent}" opacity=".08"/><circle r="9" fill="#152c37" stroke="${r.accent}"/><path d="m0-5 2 3 3 2-3 2-2 3-2-3-3-2 3-2z" fill="${r.accent}"/><text y="31" text-anchor="middle" fill="#dce2da" font-size="12" font-family="sans-serif">${r.name}</text></g>`).join('')}<g transform="translate(572 286)" stroke="#cdb37b" fill="none" opacity=".65"><circle r="18"/><path d="M0-28V28M-28 0h56m-9-19-38 38m0-38 38 38"/><path d="m0-21 4 17 17 4-17 4-4 17-4-17-17-4 17-4z"/><text y="-33" fill="#cdb37b" stroke="none" font-size="9" text-anchor="middle">N</text></g><text x="32" y="316" fill="#7f9d9e" font-size="9" letter-spacing="3">FOLLOW YOUR INNER CONSTELLATION</text></svg>`;
}
