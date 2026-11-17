/* Íconos de trazo simple (24×24) dibujados para el prototipo */
const ICON_PATHS = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 9.8V20h13V9.8"/><path d="M10 20v-5.5h4V20"/>',
  clipboard: '<rect x="5" y="4.5" width="14" height="16.5" rx="2"/><path d="M9 4.5h6v3H9z"/><path d="M8.5 12h7M8.5 16h5"/>',
  history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4.5v4h4"/><path d="M12 7.5V12l3 2"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M8.5 8h7"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8.5 9.5h7M8.5 12.5h4.5"/>',
  spark: '<path d="M12 3.5 13.8 9 19.5 10.8 13.8 12.6 12 18.3 10.2 12.6 4.5 10.8 10.2 9z"/><path d="M19 3v3M17.5 4.5h3"/>',
  wifi: '<path d="M2.5 9a14 14 0 0 1 19 0"/><path d="M5.5 12.3a9.5 9.5 0 0 1 13 0"/><path d="M8.7 15.5a5 5 0 0 1 6.6 0"/><circle cx="12" cy="18.8" r="1" fill="currentColor"/>',
  wifiOff: '<path d="M3 3l18 18"/><path d="M8.7 15.5a5 5 0 0 1 6.6 0"/><path d="M5.5 12.3a9.5 9.5 0 0 1 4-2.2M14.8 10.4a9.5 9.5 0 0 1 3.7 1.9"/><path d="M2.5 9a14 14 0 0 1 4.3-2.7M11 5.1A14 14 0 0 1 21.5 9"/><circle cx="12" cy="18.8" r="1" fill="currentColor"/>',
  cloud: '<path d="M7 18.5h10.5a4 4 0 0 0 .6-8 6 6 0 0 0-11.6 1.6A3.3 3.3 0 0 0 7 18.5z"/>',
  cloudCheck: '<path d="M7 18.5h10.5a4 4 0 0 0 .6-8 6 6 0 0 0-11.6 1.6A3.3 3.3 0 0 0 7 18.5z"/><path d="m9.5 13.8 2 2 3.5-3.6"/>',
  cloudPending: '<path d="M7 18.5h10.5a4 4 0 0 0 .6-8 6 6 0 0 0-11.6 1.6A3.3 3.3 0 0 0 7 18.5z"/><path d="M12 11v3l2 1.2"/>',
  device: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.2"/><path d="M10.5 18.5h3"/>',
  alert: '<path d="M12 3.5 21.5 20h-19z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.2" r=".9" fill="currentColor"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  checkCircle: '<circle cx="12" cy="12" r="8.5"/><path d="m8.3 12.3 2.6 2.6 4.9-5"/>',
  camera: '<path d="M4 8h3.5L9 5.5h6L16.5 8H20v11H4z"/><circle cx="12" cy="13.3" r="3.3"/>',
  pin: '<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  users: '<circle cx="9" cy="8.5" r="3.3"/><path d="M2.8 20a6.2 6.2 0 0 1 12.4 0"/><path d="M15.5 5.6a3.2 3.2 0 0 1 0 6.1M17.5 14.2a6 6 0 0 1 3.7 5.8"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="m15.5 15.5 5 5"/>',
  filter: '<path d="M4 5h16l-6.2 7.3V19l-3.6-1.8v-4.9z"/>',
  arrowRight: '<path d="M4.5 12h15M13.5 6l6 6-6 6"/>',
  arrowLeft: '<path d="M19.5 12h-15M10.5 6l-6 6 6 6"/>',
  chevronRight: '<path d="m9 5.5 6.5 6.5L9 18.5"/>',
  chevronDown: '<path d="m5.5 9 6.5 6.5L18.5 9"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.3-4.4L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M4 13a8 8 0 0 0 14.3 4.4L20 15.5"/><path d="M20 20v-4.5h-4.5"/>',
  sync: '<path d="M20 11a8 8 0 0 0-14.3-4.4L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M4 13a8 8 0 0 0 14.3 4.4L20 15.5"/><path d="M20 20v-4.5h-4.5"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"/><path d="m8.8 12 2.3 2.3 4.2-4.3"/>',
  drop: '<path d="M12 3.2s-6 6.6-6 11.1a6 6 0 0 0 12 0C18 9.8 12 3.2 12 3.2z"/>',
  gauge: '<path d="M4 17a8 8 0 1 1 16 0"/><path d="M12 17l3.8-5"/><circle cx="12" cy="17" r="1" fill="currentColor"/>',
  layers: '<path d="m12 3.5 9 4.8-9 4.8-9-4.8z"/><path d="m3 12.5 9 4.8 9-4.8"/><path d="m3 16.5 9 4.8 9-4.8" opacity=".5"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.2"/><rect x="13" y="4" width="7" height="7" rx="1.2"/><rect x="4" y="13" width="7" height="7" rx="1.2"/><rect x="13" y="13" width="7" height="7" rx="1.2"/>',
  list: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="5" cy="6.5" r="1" fill="currentColor"/><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="5" cy="17.5" r="1" fill="currentColor"/>',
  send: '<path d="M4 12 20 4l-4.5 16-3.8-6.4z"/><path d="M11.7 13.6 20 4"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><circle cx="12" cy="7.9" r=".9" fill="currentColor"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  split: '<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="M12 4.5v15"/>',
  stamp: '<path d="M9 3.5h6l-1 7h-4z"/><path d="M5 14.5h14v3H5z"/><path d="M4.5 20.5h15"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  edit: '<path d="M4 20h4.5L19 9.5 14.5 5 4 15.5z"/><path d="m12.5 7 4.5 4.5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  radio: '<rect x="6" y="7" width="12" height="14" rx="2"/><path d="M9 7 15 2.5"/><path d="M9.5 11.5h5M9.5 14.5h5"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  database: '<ellipse cx="12" cy="6" rx="7.5" ry="2.8"/><path d="M4.5 6v12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V6"/><path d="M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8"/>',
  logo: '<path d="M12 2.8s-6.4 7-6.4 11.8a6.4 6.4 0 0 0 12.8 0C18.4 9.8 12 2.8 12 2.8z"/><path d="M8.8 14.8a3.3 3.3 0 0 0 3.2 3.1"/>',
  car: '<path d="M5 11l1.6-4.2A1.5 1.5 0 0 1 8 6h8a1.5 1.5 0 0 1 1.4.8L19 11"/><rect x="3.5" y="11" width="17" height="6" rx="2"/><path d="M6 17v2.5M18 17v2.5"/><circle cx="7.5" cy="14" r=".9" fill="currentColor"/><circle cx="16.5" cy="14" r=".9" fill="currentColor"/>',
  phone: '<path d="M6.5 3.5h3l1.5 4-2 1.5a10 10 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  bulb: '<path d="M9.5 17.5h5M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.3 1.1 2.2v1.5h5V16c0-.9.5-1.7 1.1-2.2A6 6 0 0 0 12 3z"/>',
  hourglass: '<path d="M6.5 3.5h11M6.5 20.5h11"/><path d="M8 3.5v2.5a4 4 0 0 0 1.6 3.2L12 11l2.4-1.8A4 4 0 0 0 16 6V3.5"/><path d="M8 20.5V18a4 4 0 0 1 1.6-3.2L12 13l2.4 1.8A4 4 0 0 1 16 18v2.5"/>',
  tool: '<path d="M15 4.5a4.5 4.5 0 0 0-4.3 5.8L4 17l3 3 6.7-6.7A4.5 4.5 0 0 0 19.5 9l-2.8 2.8-2.5-.3-.3-2.5L16.7 6A4.5 4.5 0 0 0 15 4.5z"/>',
  cone: '<path d="M9.5 4h5l4 15.5h-13z"/><path d="M8.3 10h7.4M7.2 14.5h9.6"/><path d="M3.5 19.5h17"/>',
  pipe: '<path d="M2.5 9.5h7v5h-7zM14.5 9.5h7v5h-7z"/><path d="M9.5 12h1.5M13 12h1.5"/><path d="M12 6.5v2M12 15.5v2"/>',
  network: '<circle cx="5" cy="12" r="2.2"/><circle cx="19" cy="5.5" r="2.2"/><circle cx="19" cy="18.5" r="2.2"/><path d="M7.2 12h4.3M11.5 12l5.6-5M11.5 12l5.6 5"/>',
  flow: '<path d="M3 8.5c3 0 3 2 6 2s3-2 6-2 3 2 6 2"/><path d="M3 14.5c3 0 3 2 6 2s3-2 6-2 3 2 6 2"/>',
  hole: '<path d="M2.5 8.5h19"/><path d="M5.5 8.5l2.5 7.5h8l2.5-7.5"/><path d="M10 12.5h4"/>',
  turbid: '<path d="M12 3.5s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11z"/><circle cx="10" cy="14.5" r=".9" fill="currentColor"/><circle cx="13.8" cy="16.6" r=".9" fill="currentColor"/><circle cx="13.2" cy="12.2" r=".9" fill="currentColor"/>',
  tap: '<path d="M3.5 9.5h9a3.5 3.5 0 0 1 3.5 3.5v.5"/><path d="M3.5 7v5"/><path d="M8.5 9.5V6.5M6 6.5h5"/><path d="M16 17c0 1.2-1 2.8-1 2.8s-1-1.6-1-2.8a1 1 0 0 1 2 0z"/>',
  xCircle: '<circle cx="12" cy="12" r="8.5"/><path d="m9 9 6 6M15 9l-6 6"/>',
  minus: '<path d="M5 12h14"/>',
  escalate: '<path d="M4 18l6-6 4 4 6-6"/><path d="M15 10h5v5"/>',
  gps: '<circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/>'
};
function icon(name, size, cls) {
  size = size || 20;
  return '<svg class="ic ' + (cls || '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON_PATHS[name] || '') + '</svg>';
}

/* Fotos simuladas (ilustraciones SVG) */
function photoSVG(kind) {
  const W = 320, H = 220;
  let body = '';
  if (kind === 'calzada') {
    body = '<rect width="320" height="220" fill="#9fb1c3"/><rect y="0" width="320" height="70" fill="#c9d6e2"/>' +
      '<rect y="70" width="320" height="34" fill="#b7a998"/><rect y="104" width="320" height="116" fill="#5d6873"/>' +
      '<path d="M0 160h320" stroke="#e8e2c8" stroke-width="4" stroke-dasharray="26 18"/>' +
      '<path d="M40 104c40 6 70 30 140 34s110 30 140 52v30H0v-70c10-30 20-44 40-46z" fill="#6f9fc8" opacity=".75"/>' +
      '<path d="M70 120c30 8 60 18 100 20M120 150c40 4 80 14 120 30" stroke="#d6e8f7" stroke-width="2.5" fill="none" opacity=".8"/>' +
      '<rect x="20" y="20" width="60" height="50" fill="#e9eef3"/><rect x="100" y="10" width="80" height="60" fill="#dfe6ed"/><rect x="200" y="24" width="70" height="46" fill="#e9eef3"/>' +
      '<path d="M250 98l10-26 10 26z" fill="#f08a24"/><rect x="249" y="96" width="22" height="4" fill="#333"/><path d="M254 86h12" stroke="#fff" stroke-width="3"/>';
  } else if (kind === 'vereda') {
    body = '<rect width="320" height="220" fill="#b8ad9d"/><path d="M0 70h320M0 140h320M80 0v220M160 0v220M240 0v220" stroke="#a39885" stroke-width="3"/>' +
      '<path d="M120 90c20-10 60-8 80 6s30 40 10 60-70 22-96 6-14-62 6-72z" fill="#6f9fc8" opacity=".8"/>' +
      '<path d="M150 112l12 10 8-6 14 14" stroke="#3f4a55" stroke-width="3" fill="none"/>' +
      '<path d="M168 125c10 14 30 30 60 40s70 12 92 10" stroke="#6f9fc8" stroke-width="10" fill="none" opacity=".7"/>';
  } else {
    body = '<rect width="320" height="220" fill="#7a6a55"/><rect x="0" y="0" width="320" height="60" fill="#5d6873"/>' +
      '<path d="M40 60h240l-20 140H60z" fill="#8a7860"/><rect x="40" y="120" width="240" height="26" rx="13" fill="#3e6fa3"/>' +
      '<rect x="140" y="112" width="44" height="42" rx="6" fill="#c9ced4"/><path d="M146 120h32M146 146h32" stroke="#8a929b" stroke-width="3"/>' +
      '<path d="M0 60h320" stroke="#f08a24" stroke-width="6" stroke-dasharray="20 14"/>';
  }
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">' + body + '</svg>';
}

function mapSVG(expanded) {
  /* Plano esquemático del Sector Norte con la ubicación de #0248 */
  const streets = '<g stroke="#ffffff" stroke-width="14" stroke-linecap="square">' +
    '<path d="M0 60h400M0 150h400M0 240h400"/><path d="M70 0v300M190 0v300M310 0v300"/></g>' +
    '<g font-family="Inter,system-ui,sans-serif" font-size="11" fill="#6b7a8c" font-weight="600">' +
    '<text x="6" y="54">Calle 10</text><text x="6" y="144">Calle 12</text><text x="6" y="234">Calle 14</text>' +
    '<text x="76" y="292">Av. 5</text><text x="196" y="292">Av. 7</text><text x="316" y="292">Av. 9</text></g>';
  const pipe = '<path d="M0 158h400" stroke="#7aa7d6" stroke-width="3" stroke-dasharray="6 5"/>';
  const area = expanded
    ? '<ellipse cx="150" cy="150" rx="105" ry="62" fill="#d64545" opacity=".14" stroke="#d64545" stroke-width="1.5" stroke-dasharray="5 4"/>'
    : '<circle cx="140" cy="150" r="22" fill="#1f5fae" opacity=".14"/>';
  const homes = expanded
    ? '<g fill="#d64545">' + [[100, 128], [118, 128], [160, 172], [182, 128]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4.5"/>'; }).join('') + '</g>'
    : '';
  const pinc = expanded ? '#d64545' : '#1f5fae';
  const pin = '<g transform="translate(140 150)"><path d="M0 0c0 0-13-13-13-23a13 13 0 0 1 26 0C13-13 0 0 0 0z" fill="' + pinc + '"/><circle cx="0" cy="-23" r="5" fill="#fff"/></g>';
  return '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"><rect width="400" height="300" fill="#e6ecf2"/>' +
    '<g fill="#d9e1ea"><rect x="84" y="74" width="92" height="62" rx="4"/><rect x="204" y="74" width="92" height="62" rx="4"/><rect x="84" y="164" width="92" height="62" rx="4"/><rect x="204" y="164" width="92" height="62" rx="4"/><rect x="0" y="74" width="56" height="62" rx="4"/><rect x="324" y="74" width="76" height="62" rx="4"/><rect x="0" y="164" width="56" height="62" rx="4"/><rect x="324" y="164" width="76" height="62" rx="4"/></g>' +
    streets + pipe + area + homes + pin + '</svg>';
}

/* Mapa de sectores con la posición de las cuadrillas (tablero de Operaciones) */
function crewMapSVG(o) {
  o = o || {};
  var z = function (x, y, w, h, n, f) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10" fill="' + f + '"/><text x="' + (x + 9) + '" y="' + (y + 16) + '" font-size="9.5" font-weight="700" fill="#66768a" letter-spacing=".08em">' + n + '</text>'; };
  var zones = z(6, 6, 308, 50, 'NORTE', '#dfeaf8') + z(6, 120, 308, 50, 'SUR', '#e7ecf1') + z(6, 62, 98, 52, 'OESTE', '#e7ecf1') + z(216, 62, 98, 52, 'ESTE', '#e7ecf1') + z(110, 62, 100, 52, 'CENTRO', '#e7ecf1');
  var crew = function (x, y, t, on) { return '<g transform="translate(' + x + ' ' + y + ')"><circle r="12" fill="' + (on ? '#1b7f50' : '#8d99a8') + '" stroke="#fff" stroke-width="2.5"/><text y="3.5" text-anchor="middle" font-size="9.5" font-weight="800" fill="#fff">' + t + '</text></g>'; };
  var inc = function (x, y, c, big) { return '<circle cx="' + x + '" cy="' + y + '" r="' + (big ? 11 : 7) + '" fill="' + c + '" opacity=".22"/><circle cx="' + x + '" cy="' + y + '" r="4.5" fill="' + c + '"/>'; };
  var incs = inc(206, 34, o.alert ? '#bf3434' : '#1f5fae', o.alert) + inc(286, 92, '#1f5fae') + inc(196, 148, '#1f5fae') + inc(36, 96, '#1f5fae');
  var crews = crew(170, 34, 'C3', o.c3on !== false) + crew(262, 92, 'C1', true) + crew(160, 148, 'C2', true) + crew(70, 96, 'C4', true);
  return '<svg viewBox="0 0 320 176" xmlns="http://www.w3.org/2000/svg" font-family="Inter,system-ui,sans-serif">' + zones + incs + crews + '</svg>';
}
