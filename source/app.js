/* CAMPO · prototipo navegable (estado, lógica y vistas) */
(function () {
  'use strict';
  var PRES = !!window.CAMPO_PRES; // versión de presentación: dos vistas, sin controles de demo
  var KEY = PRES ? 'campo-pres-v2' : 'campo-demo-v3';
  var S = null;
  var persist = true, videoMode = false, embedSide = null;
  var modal = null;
  var timers = [];

  /* ---------- utilidades ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function fmt(m) { var h = Math.floor(m / 60) % 24, mm = m % 60; return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm; }
  function now() { return fmt(S.clock); }
  function tick(d) { S.clock += d; return now(); }
  function uid() { S.seq += 1; return 'x' + S.seq; }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function getPath(p) { var parts = p.split('.'), o = S.drafts; for (var i = 0; i < parts.length; i++) { if (o == null) return undefined; o = o[parts[i]]; } return o; }
  function setPath(p, v) { var parts = p.split('.'), o = S.drafts; for (var i = 0; i < parts.length - 1; i++) { if (o[parts[i]] == null) o[parts[i]] = {}; o = o[parts[i]]; } o[parts[parts.length - 1]] = v; }
  function todayStr() { var d = new Date(); return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear(); }
  var URG = { 'Baja': 0, 'Media': 1, 'Alta': 2, 'Crítica': 3 };

  /* ---------- fricciones operativas (Clase 29 · Actividad 3) ---------- */
  var FRIC = {
    handoff: ['HANDOFF FRÁGIL', 'La información tiene que llegar a Operaciones: puede llegar tarde, sin suficiente contexto o sin que sepamos si alguien la recibió.'],
    sindueno: ['SIN DUEÑO', 'El aviso queda pendiente o llega a Operaciones, pero todavía no está claro quién se hace responsable de retomarlo.'],
    sobrecarga: ['SOBRECARGA', 'Quien organiza las órdenes recibe muchas actualizaciones: puede no tener tiempo de revisar todo y algunos cambios importantes pueden quedar sin atender.'],
    espera: ['ESPERA', 'La cuadrilla necesita una decisión de Operaciones que puede no llegar a tiempo: sigue con lo que tiene a su alcance, pero parte del trabajo queda esperando.'],
    sinautoridad: ['SIN AUTORIDAD', 'La cuadrilla detecta que hay que cambiar recursos o prioridades, pero esa decisión no le corresponde: tiene que consultar a Operaciones para reorganizar el trabajo.']
  };
  function fricOn() { return S.fric === true; }
  function fric(key, note) {
    if (!fricOn()) return '';
    var f = FRIC[key];
    return '<div class="fric" data-fric="' + key + '"><div class="fric-tag">' + icon('alert', 13) + f[0] + '</div><div class="fric-note">' + esc(note || f[1]) + '</div></div>';
  }

  /* ---------- estado ---------- */
  function seed() {
    return {
      v: 3, clock: 9 * 60 + 5, online: true, lastSync: '09:05', offlineSince: null, wentOffline: false,
      role: PRES ? 'dividida' : 'cuadrilla', deskRole: 'operaciones', guide: PRES ? false : null,
      m: { name: 'inicio' }, d: { name: 'panel' },
      incidents: seedIncidents(), history: clone(HISTORY_SEED), alerts: [], chat: [], chatPending: false,
      drafts: { change: null, result: null, update: null, valid: null, composer: '', cmsg: null, omsg: null },
      hist: { q: '', status: 'todos', sector: 'Todos' }, crit: { cat: 'todas', open: null, hl: [] },
      syncUI: null, newCase: null, seenUpdate: false, seq: 100, fric: false, menu: false, readM: 0, tlOpen: { m: false, d: false }
    };
  }
  function save() { if (!persist) return; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
  function load() { try { var t = localStorage.getItem(KEY); if (t) { var o = JSON.parse(t); if (o && o.v === 3) return o; } } catch (e) { } return null; }

  /* ---------- proyección de la información por lado ---------- */
  // 'm' = dispositivo de la cuadrilla · 'd' = central (Operaciones / Supervisión)
  function visible(inc, side) {
    return inc.events.filter(function (e) { return side === 'm' ? (e.src === 'campo' || e.synced) : (e.src === 'central' || e.synced); });
  }
  function mergeReport(a, b) {
    if (!a) return clone(b);
    var u = function (x, y) { var r = (x || []).slice(); (y || []).forEach(function (v) { if (r.indexOf(v) < 0) r.push(v); }); return r; };
    var m = clone(a);
    m.conditions = u(a.conditions, b.conditions); m.actions = u(a.actions, b.actions); m.photos = (a.photos || []).concat(b.photos || []);
    m.homes = b.homes || a.homes; m.urgency = URG[b.urgency] > URG[a.urgency] ? b.urgency : a.urgency;
    if (b.type && b.type !== b.kind0) m.type = b.type;
    m.conditionsText = b.conditionsText || a.conditionsText; m.offline = a.offline || b.offline;
    var seen = {}; m.reasons = (a.reasons || []).concat(b.reasons || []).filter(function (r) { var k = r.t || r; if (seen[k]) return false; seen[k] = 1; return true; });
    m.requiresEval = m.reasons.length > 0;
    return m;
  }
  function proj(inc, side) {
    var p = { status: 'Asignada', key: 'asignada', priority: inc.priority, change: null, changeEv: null, update: null, updateEv: null, result: null, resultEv: null, validation: null, validEv: null, ai: [], msgs: [], started: false, events: visible(inc, side) };
    p.events.forEach(function (e) {
      if (e.type === 'started') { p.started = true; if (p.key === 'asignada') { p.status = 'En curso'; p.key = 'curso'; } }
      else if (e.type === 'change') { p.status = 'Cambio de escenario'; p.key = 'cambio'; p.change = e.data; p.changeEv = e; }
      else if (e.type === 'msg') {
        p.msgs.push(e);
        if (e.src === 'campo' && e.data.report) { p.change = mergeReport(p.change, e.data.report); if (!p.changeEv) p.changeEv = e; p.lastReportEv = e; if (!p.update && !p.result) { p.status = 'Cambio de escenario'; p.key = 'cambio'; } }
        if (e.src === 'central' && e.data.priority) { p.update = { priority: e.data.priority, authorized: e.data.authorized || [], pending: e.data.pending || [], message: e.data.text || '' }; p.updateEv = e; p.priority = e.data.priority; if (!p.result) { p.status = 'Autorizada'; p.key = 'autorizada'; } }
      }
      else if (e.type === 'ai') { p.ai.push(e); }
      else if (e.type === 'update') { p.status = 'Autorizada'; p.key = 'autorizada'; p.priority = e.data.priority; p.update = e.data; p.updateEv = e; }
      else if (e.type === 'result') { p.status = 'A validar'; p.key = 'resuelta'; p.result = e.data; p.resultEv = e; }
      else if (e.type === 'validated') { p.status = 'Cerrada'; p.key = 'cerrada'; p.validation = e.data; p.validEv = e; }
    });
    p.last = p.events[p.events.length - 1];
    return p;
  }
  function statusPill(p) {
    var cls = { asignada: 'blue', curso: 'blue', cambio: 'red', autorizada: 'blue', resuelta: 'pend', cerrada: 'ok' }[p.key] || 'gray';
    var ic = { asignada: 'clipboard', curso: 'play', cambio: 'alert', autorizada: 'shield', resuelta: 'hourglass', cerrada: 'checkCircle' }[p.key] || 'info';
    return '<span class="pill ' + cls + '">' + icon(ic, 13) + esc(p.status) + '</span>';
  }
  /* ---------- vocabulario visual: íconos en lugar de texto ---------- */
  var PLV = { 'Baja': 1, 'Media': 2, 'Alta': 3, 'Crítica': 4 };
  function prioMeter(pr, noLabel) { var l = PLV[pr] || 0; return '<span class="pm l' + l + '" title="Prioridad ' + esc(pr) + '"><i class="pd"></i>' + (noLabel ? '' : '<b>' + esc(pr) + '</b>') + '</span>'; }
  function prioTxt(pr) { return prioMeter(pr); }
  var TYPE_IC = { 'Pérdida de agua en vereda': 'drop', 'Pérdida en conexión domiciliaria': 'home', 'Posible pérdida en red distribuidora': 'network', 'Rotura de caño': 'pipe', 'Baja presión': 'gauge', 'Pérdida en medidor': 'gauge', 'Revisión de conexión': 'home', 'Reparación de vereda': 'tool', 'Otro': 'plus' };
  var TYPE_SHORT = { 'Pérdida de agua en vereda': 'Pérdida en vereda', 'Pérdida en conexión domiciliaria': 'Conexión domiciliaria', 'Posible pérdida en red distribuidora': 'Posible falla de red' };
  var TYPE_TILE = { 'Pérdida de agua en vereda': 'Vereda', 'Pérdida en conexión domiciliaria': 'Conexión', 'Posible pérdida en red distribuidora': 'Falla de red', 'Rotura de caño': 'Rotura', 'Baja presión': 'Presión', 'Otro': 'Otro' };
  var COND = { 'Agua en calzada': ['drop', 'Agua en calzada'], 'Reportes de baja presión': ['gauge', 'Baja presión'], 'Caudal continuo': ['flow', 'Caudal continuo'], 'Hundimiento': ['hole', 'Hundimiento'], 'Afecta el tránsito': ['car', 'Tránsito'], 'Agua turbia': ['turbid', 'Agua turbia'] };
  var ACT = { 'Señalización de la zona': ['cone', 'Señalizado'], 'Delimitación del paso peatonal': ['users', 'Paso peatonal'], 'Registro fotográfico': ['camera', 'Fotos'], 'Consulta a vecinos': ['home', 'Vecinos'], 'Cierre de llave de paso domiciliaria': ['tap', 'Llave de paso'], 'Aviso al usuario': ['phone', 'Usuario avisado'], 'Revisión del medidor': ['gauge', 'Medidor revisado'], 'Desvío del tránsito': ['car', 'Tránsito desviado'], 'Relevamiento de domicilios sin presión': ['home', 'Domicilios relevados'], 'Contención del agua': ['drop', 'Agua contenida'], 'Aviso a vecinos del sector': ['users', 'Vecinos avisados'], 'Medición de presión': ['gauge', 'Presión medida'] };
  function actionsFor(type) { return ACTIONS_BY_TYPE[type] || CHANGE_OPTIONS.actions; }
  var ITEM_IC = { 'Mantener la zona señalizada': 'cone', 'Esperar al equipo de red · 10:35': 'clock', 'Excavar solo con el equipo de red': 'tool', 'Corte V-N12 · 10:40 a 11:15 (equipo de red)': 'tap', 'Avisar a los vecinos del corte': 'users', 'Confirmar baja presión con telemetría': 'gauge', 'Avisar al municipio': 'bell', 'Evidencia completa': 'camera', 'Acciones dentro de lo autorizado': 'shield', 'Servicio restablecido': 'tap', 'Usuarios informados': 'users' };
  var TAG_IC = { 'Agua en calzada': 'drop', 'Baja presión': 'gauge', 'Escalado': 'escalate', 'Inicio como pérdida domiciliaria': 'home', 'Sin pérdida visible': 'eye', 'Dentro del alcance de la cuadrilla': 'check', 'Medidor': 'gauge', 'Caudal continuo': 'flow', 'Riesgo peatonal': 'users', 'Municipio': 'grid', 'Cámara de válvula': 'tap', 'Calidad': 'turbid', 'Seguimiento': 'clock', 'Terceros': 'tool', 'Registrado sin conexión': 'wifiOff' };
  var CAT_IC = { todas: 'list', seg: 'shield', doc: 'camera', esc: 'escalate', man: 'lock', pri: 'gauge', off: 'wifiOff', cie: 'stamp' };
  var OUTCOMES = [['Pérdida reparada y servicio restablecido', 'checkCircle', 'Reparada', 'ok'], ['Pérdida controlada · requiere seguimiento', 'clock', 'Controlada', 'amber'], ['No resuelta · requiere otro equipo', 'xCircle', 'No resuelta', 'red']];
  function tIc(k) { return TYPE_IC[k] || 'drop'; }
  function tShort(k) { return TYPE_SHORT[k] || k; }
  function ichip(ic, t, cls) { return '<span class="ichip ' + (cls || '') + '">' + icon(ic, 14) + esc(t) + '</span>'; }
  function condChip(c, cls) { var m = COND[c] || ['alert', c]; return ichip(m[0], m[1], cls || 'warn'); }
  function actChip(a) { var m = ACT[a] || ['check', a]; return ichip(m[0], m[1], 'ok'); }
  function tagChip(t) { return ichip(TAG_IC[t] || 'info', t); }
  function outcomeOf(o) { return OUTCOMES.filter(function (x) { return x[0] === o; })[0] || [o, 'checkCircle', o, 'ok']; }
  function outcomeChip(o) { var x = outcomeOf(o); return ichip(x[1], x[2], x[3] === 'ok' ? 'ok' : x[3] === 'red' ? 'red' : 'warn'); }
  function reasonChips(rs) { return (rs || []).map(function (r) { return typeof r === 'string' ? ichip('alert', r, 'red') : ichip(r.ic, r.t, 'red'); }).join(''); }
  function pendingOut() { var n = 0; Object.keys(S.incidents).forEach(function (k) { S.incidents[k].events.forEach(function (e) { if (e.src === 'campo' && !e.synced) n++; }); }); return n; }
  function pendingIn() { var n = 0; Object.keys(S.incidents).forEach(function (k) { S.incidents[k].events.forEach(function (e) { if (e.src === 'central' && !e.synced) n++; }); }); return n; }
  function inc0248() { return S.incidents['0248']; }
  function addEvent(inc, ev) { ev.id = uid(); inc.events.push(ev); return ev; }
  function lastCrewContact() {
    var t = null; inc0248().events.forEach(function (e) { if (e.src === 'campo' && e.synced) t = e.syncedAt || e.time; });
    return t || S.lastSync;
  }

  /* ---------- reglas: detección de cambio que requiere evaluación ---------- */
  function evalChange(d, inc) {
    var r = [];
    if (d.urgency && URG[d.urgency] > URG[inc.priority]) r.push({ ic: 'escalate', t: 'Urgencia ' + d.urgency + ' > ' + inc.priority });
    if ((d.conditions || []).indexOf('Agua en calzada') >= 0) r.push({ ic: 'drop', t: 'Agua en calzada' });
    if ((d.conditions || []).indexOf('Reportes de baja presión') >= 0) r.push({ ic: 'gauge', t: 'Baja presión' + (d.homes ? ' · ' + d.homes + ' domicilios' : '') });
    if (d.type && d.type !== inc.kind) r.push({ ic: tIc(d.type), t: tShort(d.type) });
    return r;
  }

  /* ---------- acciones del flujo ---------- */
  function go(side, name, id) {
    if (side === 'm' && name === 'chat' && S.m.name !== 'chat' && S.m.name !== 'cambio') S.chatFrom = { name: S.m.name, id: S.m.id }; // la flecha del chat vuelve a la pantalla anterior
    if (side === 'm' && name === 'cambio' && S.m.name !== 'cambio') S.cambioFrom = { name: S.m.name, id: S.m.id };
    S[side] = { name: name, id: id || null };
    if (side === 'm') { S.menu = false; var p = proj(inc0248(), 'm'); if ((name === 'incidencia' || name === 'chat') && p.update) S.seenUpdate = true; if (name === 'chat') S.readM = p.msgs.filter(function (e) { return e.src === 'central'; }).length; }
    commit();
    if (side === 'm' && name === 'chat') scrollEnd('m');
  }
  function unreadM() { var p = proj(inc0248(), 'm'); return Math.max(0, p.msgs.filter(function (e) { return e.src === 'central'; }).length - (S.readM || 0)); }
  function setRole(r) {
    if (PRES) return;
    if (r === 'dividida') { S.role = 'dividida'; }
    else if (r === 'cuadrilla') { S.role = 'cuadrilla'; }
    else { S.role = r; S.deskRole = r; if (r === 'supervision' && S.d.name === 'panel') S.d = { name: 'validaciones' }; if (r === 'operaciones' && S.d.name === 'validaciones') S.d = { name: 'panel' }; }
    try { if (!embedSide && location.hash !== '#' + r) location.hash = r; } catch (e) { }
    commit();
  }
  function setOnline(on) {
    if (on === S.online) return;
    if (!on) { S.online = false; S.offlineSince = tick(17); S.wentOffline = true; S.syncUI = null; toast('Sin conexión · se guarda en el celular', 'wifiOff'); }
    else {
      S.online = true; tick(18);
      var n = pendingOut() + pendingIn();
      S.syncUI = n > 0 ? { phase: 'recovered', count: n, progress: 0 } : null;
      toast(n > 0 ? 'Señal recuperada · ' + n + ' sin enviar' : 'Señal recuperada', 'wifi');
    }
    commit();
  }
  function start(id) {
    var inc = S.incidents[id || '0248'];
    if (proj(inc, 'm').started) return;
    addEvent(inc, { type: 'started', src: 'campo', who: 'Cuadrilla 3 · R. Benítez', time: tick(13), synced: S.online, syncedAt: S.online ? now() : null, text: 'Intervención iniciada por el encargado.' });
    if (S.online) S.lastSync = now();
    toast(S.online ? 'Intervención iniciada' : 'Iniciada · sin enviar', 'play');
    S.m = { name: 'incidencia', id: inc.id }; commit();
  }
  function ensureChangeDraft() {
    if (!S.drafts.change) { var inc = inc0248(); S.drafts.change = { location: inc.address + ' · ' + inc.ref.toLowerCase(), type: inc.kind, conditions: [], conditionsText: '', homes: '', difference: '', urgency: '', actions: [], actionsText: '', photos: [] }; }
  }
  // El registro del cambio se completa con el formulario de siempre y se envía como mensaje del chat
  function saveChange() {
    ensureChangeDraft();
    var d = S.drafts.change, inc = inc0248(), miss = [];
    if (!d.type) miss.push('tipo');
    if (!(d.conditions.length || d.conditionsText)) miss.push('qué ves');
    if (!d.urgency) miss.push('urgencia');
    if (miss.length) { S.formError = 'Falta: ' + miss.join(', '); commit(); return false; }
    S.formError = null;
    var r = clone(d); r.actions = (d.actions || []).filter(function (x) { return actionsFor(d.type).indexOf(x) >= 0; }); r.kind0 = inc.kind; r.offline = !S.online; r.reasons = evalChange(d, inc); r.requiresEval = r.reasons.length > 0;
    if (!r.difference) r.difference = 'Orden: ' + tShort(inc.kind) + ' (' + inc.priority + '). En el lugar: ' + tShort(d.type) + ' (' + d.urgency + ').';
    if (!proj(inc, 'm').started) addEvent(inc, { type: 'started', src: 'campo', who: 'Cuadrilla 3 · R. Benítez', time: tick(1), synced: S.online, syncedAt: S.online ? now() : null, text: 'Intervención iniciada por el encargado.' });
    var ev = addEvent(inc, { type: 'msg', src: 'campo', who: 'Cuadrilla 3 · R. Benítez', time: tick(6), synced: S.online, syncedAt: S.online ? now() : null, data: { text: (d.conditionsText || '').trim(), tags: [], photos: [], form: true, report: r } });
    if (S.online) { S.lastSync = now(); makeAlert(inc, ev); }
    S.drafts.change = null;
    var from = S.cambioFrom && S.cambioFrom.name !== 'chat' ? S.cambioFrom : { name: 'incidencia', id: '0248' };
    S.m = { name: 'chat' }; S.chatFrom = from; S.readM = proj(inc, 'm').msgs.filter(function (e) { return e.src === 'central'; }).length;
    toast(S.online ? 'Cambio enviado por chat' : 'Cambio guardado · sale con señal', S.online ? 'send' : 'device');
    commit(); return true;
  }
  function ensureCMsg() { if (!S.drafts.cmsg) S.drafts.cmsg = { text: '', tags: [], photos: [] }; }
  function ensureOMsg() { if (!S.drafts.omsg) S.drafts.omsg = { text: '', priority: '', authorized: [], auth: false }; }
  // Lo que la cuadrilla cuenta por chat se resume solo para Operaciones (condiciones, urgencia, domicilios, fotos)
  function buildReport(d, inc) {
    var tags = d.tags || [], conds = tags.filter(function (t) { return COND[t]; }), acts = tags.filter(function (t) { return ACT[t]; }), urgent = tags.indexOf('Urgente') >= 0;
    if (!conds.length && !urgent) return null;
    var m = (d.text || '').match(/(\d+)\s*(vecinos|domicilios|casas)/i);
    var type = conds.indexOf('Agua en calzada') >= 0 && conds.indexOf('Reportes de baja presión') >= 0 ? 'Posible pérdida en red distribuidora' : inc.kind;
    var r = { kind0: inc.kind, type: type, conditions: conds, homes: m ? m[1] : '', urgency: urgent ? 'Alta' : 'Media', actions: acts, photos: (d.photos || []).slice(), conditionsText: (d.text || '').trim(), offline: !S.online };
    r.reasons = evalChange(r, inc); r.requiresEval = r.reasons.length > 0;
    r.difference = 'Orden: ' + tShort(inc.kind) + ' (' + inc.priority + '). En el lugar: ' + tShort(type) + ' (' + r.urgency + ').';
    return r;
  }
  function sendCrewMsg() {
    ensureCMsg();
    var d = S.drafts.cmsg, inc = inc0248();
    if (!(d.text || '').trim() && !d.tags.length && !d.photos.length) return false;
    if (!proj(inc, 'm').started) addEvent(inc, { type: 'started', src: 'campo', who: 'Cuadrilla 3 · R. Benítez', time: tick(1), synced: S.online, syncedAt: S.online ? now() : null, text: 'Intervención iniciada por el encargado.' });
    var ev = addEvent(inc, { type: 'msg', src: 'campo', who: 'Cuadrilla 3 · R. Benítez', time: tick(4), synced: S.online, syncedAt: S.online ? now() : null, data: { text: (d.text || '').trim(), tags: d.tags.slice(), photos: d.photos.slice(), report: buildReport(d, inc) } });
    if (S.online) { S.lastSync = now(); makeAlert(inc, ev); }
    S.drafts.cmsg = null; commit(); scrollEnd('m'); return true;
  }
  function sendOpsMsg() {
    ensureOMsg();
    var d = S.drafts.omsg, inc = inc0248();
    if (!(d.text || '').trim() && !d.priority && !d.authorized.length) return false;
    var pr = d.priority || (d.authorized.length ? proj(inc, 'd').priority : '');
    addEvent(inc, { type: 'msg', src: 'central', who: S.deskRole === 'supervision' ? 'Supervisión · C. Duarte' : 'Operaciones · L. Ferreyra', time: tick(6), synced: S.online, syncedAt: S.online ? now() : null, data: { text: (d.text || '').trim(), priority: pr, authorized: d.authorized.slice(), pending: [] } });
    S.alerts.forEach(function (a) { if (a.inc === inc.id && (a.kind === 'change' || a.kind === 'msg')) a.read = true; });
    S.drafts.omsg = null; S.seenUpdate = false;
    toast(S.online ? 'Enviado a Cuadrilla 3' : 'Guardado · se entrega cuando C3 tenga señal', 'send');
    commit(); return true;
  }
  function makeAlert(inc, ev) {
    if (ev.type === 'msg') S.alerts.unshift({ id: uid(), inc: inc.id, ev: ev.id, kind: ev.data.report ? 'change' : 'msg', title: '#' + inc.id + (ev.data.report ? ' · Cambio de escenario' : ' · Mensaje de C3'), body: ev.data.text, time: now(), read: false });
    if (ev.type === 'result') S.alerts.unshift({ id: uid(), inc: inc.id, kind: 'result', title: '#' + inc.id + ' · Resultado para validar', body: ev.data.outcome + '. Pendiente de validación del cierre.', time: now(), read: false });
  }
  function startSync() {
    if (!S.online) return;
    var n = pendingOut() + pendingIn();
    S.syncUI = { phase: 'syncing', count: n, progress: 15 }; commit();
    if (videoMode) return;
    later(function () { S.syncUI.progress = 65; commit(); }, 600);
    later(function () { completeSync(); }, 1500);
  }
  function completeSync() {
    var n = 0, gotUpdate = false;
    Object.keys(S.incidents).forEach(function (k) {
      var inc = S.incidents[k];
      inc.events.forEach(function (e) {
        if (!e.synced) { e.synced = true; e.syncedAt = now(); n++; if (e.src === 'campo') makeAlert(inc, e); if (e.src === 'central' && (e.type === 'update' || e.type === 'msg')) gotUpdate = true; }
      });
    });
    S.lastSync = now();
    S.syncUI = { phase: 'shared', count: n || (S.syncUI && S.syncUI.count) || 0, progress: 100 };
    toast('Compartido con Operaciones', 'cloudCheck');
    if (gotUpdate) toast('Nuevo mensaje de Operaciones', 'chat');
    commit();
  }
  function doSync() { startSync(); if (videoMode) completeSync(); }

  /* ---------- asistente (simulado, por reglas) ---------- */
  function buildAnswer(q) {
    var t = norm(q), inc = inc0248(), p = proj(inc, 'm'), ch = p.change;
    var intent = 'main';
    if (/valvul|cerrar|cortar|corte|excav|maniobr|puedo/.test(t)) intent = 'limits';
    else if (/(seguimos|hacemos|recomend|que hago|como sigo|antecedentes)/.test(t)) intent = 'main';
    else if (/0176/.test(t)) intent = 'ante';
    else if (/falta|informacion|registrar|completar/.test(t)) intent = 'missing';
    else if (/criterio|regla|procedimiento/.test(t)) intent = 'criteria';
    else if (/operaciones (sabe|conoce|recibio)|sincroniz|pendiente/.test(t)) intent = 'status';
    var cond = ch ? ch.conditions : [];
    var water = cond.indexOf('Agua en calzada') >= 0 || /calzada/.test(t);
    var lowp = cond.indexOf('Reportes de baja presion') >= 0 || cond.indexOf('Reportes de baja presión') >= 0 || /presion/.test(t);
    var coinc = [{ t: 'Sector Norte', ic: 'pin', ok: true }, { t: 'Empezó en vereda', ic: 'clipboard', ok: true }, { t: 'Agua en calzada', ic: 'drop', ok: water }, { t: 'Baja presión', ic: 'gauge', ok: lowp }];
    var missing = [];
    if (!ch) missing.push({ ic: 'edit', t: 'Registrar el cambio (se envía por chat)' });
    if (!ch || !ch.homes) missing.push({ ic: 'home', t: 'Cuántos domicilios sin presión' });
    if (!ch || (ch.photos || []).length < 2) missing.push({ ic: 'camera', t: 'Fotos de vereda y calzada' });
    missing.push({ ic: 'pin', t: 'Origen probable: vereda, calzada o conexión' });
    missing.push({ ic: 'flow', t: 'Si el caudal aumenta (con hora)' });
    var acts = ch ? ch.actions : [];
    var verif = [
      { t: 'Señalizar y delimitar la zona', ic: 'cone', c: 'CO-SEG-01', done: acts.indexOf('Señalización de la zona') >= 0 },
      { t: 'Relevar domicilios sin presión', ic: 'home', c: 'CO-DOC-01', done: !!(ch && ch.homes) },
      { t: 'Fotos con hora', ic: 'camera', c: 'CO-DOC-01', done: !!(ch && (ch.photos || []).length >= 2) },
      { t: 'Observar sin intervenir', ic: 'eye', c: 'CO-SEG-01', done: false },
      { t: 'Reintentar contacto (radio o teléfono)', ic: 'radio', c: 'CO-OFF-01', done: false }
    ];
    var crit = ['CO-DOC-01', 'CO-SEG-01', 'CO-DOC-02', 'CO-MAN-01', 'CO-ESC-01'];
    var situ = ch
      ? 'Orden original: pérdida menor en vereda, prioridad ' + inc.priority.toLowerCase() + '. Registrado en campo (' + p.changeEv.time + '): ' + cond.join(', ').toLowerCase() + (ch.homes ? ' (' + ch.homes + ' domicilios)' : '') + '; urgencia preliminar ' + (ch.urgency || '—').toLowerCase() + '.'
      : 'Orden original: pérdida menor en vereda, prioridad ' + inc.priority.toLowerCase() + '. Todavía no se contó un cambio por chat.';
    var sources = ['#0248 · registro local', '#0176 · historial local', '#0221 · historial local'].concat(crit).concat(['Datos locales al ' + S.lastSync]);
    return { intent: intent, offline: !S.online, situ: situ, hasChange: !!ch, coinc: coinc, missing: missing, verif: verif, crit: crit, sources: sources, pending: pendingOut(), q: q };
  }
  function ask(text) {
    text = (text || '').trim(); if (!text || S.chatPending) return;
    S.chat.push({ from: 'u', text: text, time: now() });
    S.drafts.composer = ''; S.chatPending = true; S.m = { name: 'asistente' }; commit(); scrollEnd('m');
    var fin = function () {
      var a = buildAnswer(text);
      tick(3);
      S.chat.push({ from: 'a', ans: a, time: now() });
      S.chatPending = false;
      addEvent(inc0248(), { type: 'ai', src: 'campo', who: 'Cuadrilla 3 · consulta al asistente', time: now(), synced: S.online, syncedAt: S.online ? now() : null, data: { q: text, intent: a.intent, sources: a.sources, crit: a.crit } });
      a.logged = true;
      commit(); scrollToLastQ('m');
    };
    if (videoMode) fin(); else later(fin, 1400);
  }

  /* ---------- Operaciones / Supervisión ---------- */
  function ensureResultDraft() { if (!S.drafts.result) S.drafts.result = { done: [], outcome: '', text: '', restored: null, photos: [] }; }
  function sendResult() {
    ensureResultDraft();
    var d = S.drafts.result;
    if (!d.outcome) { S.formError = 'Elegí el resultado'; commit(); return false; }
    S.formError = null;
    var inc = inc0248();
    var ev = addEvent(inc, { type: 'result', src: 'campo', who: 'Cuadrilla 3 · R. Benítez', time: tick(77), synced: S.online, syncedAt: S.online ? now() : null, data: clone(d) });
    if (S.online) { S.lastSync = now(); makeAlert(inc, ev); }
    S.drafts.result = null; S.m = { name: 'cierre', id: inc.id }; commit(); return true;
  }
  function ensureValidDraft() { if (!S.drafts.valid) S.drafts.valid = { checks: [], lesson: '' }; }
  function validate() {
    ensureValidDraft();
    var d = S.drafts.valid, inc = inc0248(), p = proj(inc, 'd');
    if (d.checks.length < 3) { S.formError = 'Marcá los controles antes de validar'; commit(); return false; }
    S.formError = null;
    var by = S.deskRole === 'supervision' ? 'Supervisión · C. Duarte' : 'Operaciones · L. Ferreyra';
    addEvent(inc, { type: 'validated', src: 'central', who: by, time: tick(15), synced: S.online, syncedAt: S.online ? now() : null, data: { by: by, checks: clone(d.checks), lesson: d.lesson } });
    S.alerts.forEach(function (a) { if (a.inc === inc.id) a.read = true; });
    var ch = p.change || {}, up = p.update || {}, rs = p.result || {};
    S.history = S.history.filter(function (h) { return h.id !== '0248'; });
    S.history.unshift({
      id: '0248', short: 'Pérdida "menor" → rotura de red', title: 'Pérdida informada como menor que resultó ser una rotura en red', type: ch.type || inc.kind, sector: inc.sector, address: inc.address,
      date: todayStr(), status: 'resuelto', validatedBy: by, isNew: true,
      tags: ['Agua en calzada', 'Baja presión', 'Registrado sin conexión', 'Escalado'],
      initial: 'Reclamo por pérdida de agua en vereda. Prioridad media.',
      found: (ch.conditionsText || '') + (ch.difference ? ' ' + ch.difference : ''),
      decisions: ['La cuadrilla contó el cambio por chat sin señal y consultó al asistente (antecedente #0176).', 'Al sincronizar, Operaciones respondió por chat y elevó la prioridad a ' + (up.priority || 'alta').toLowerCase() + '.'].concat((up.authorized || []).slice(2, 4).map(function (x) { return 'Autorizado: ' + x.charAt(0).toLowerCase() + x.slice(1) + '.'; })),
      result: rs.text || rs.outcome || '', lesson: d.lesson || '—', criteria: ['CO-DOC-01', 'CO-OFF-01', 'CO-ESC-01', 'CO-MAN-01', 'CO-CIE-01']
    });
    S.newCase = '0248'; S.drafts.valid = null;
    S.d = { name: 'cierre', id: inc.id };
    toast('#0248 validada · en el historial', 'checkCircle');
    commit(); return true;
  }

  /* ---------- demo: completar formularios ---------- */
  function demoFill(kind) {
    if (kind === 'chat') S.drafts.cmsg = clone(DEMO_CHAT);
    if (kind === 'change') S.drafts.change = clone(DEMO_CHANGE);
    if (kind === 'opschat') S.drafts.omsg = { text: DEMO_UPDATE.message, priority: DEMO_UPDATE.priority, authorized: clone(DEMO_UPDATE.authorized), auth: true };
    if (kind === 'result') { var p = proj(inc0248(), 'm'); S.drafts.result = { done: clone((p.update && p.update.authorized) || []), outcome: DEMO_RESULT.outcome, text: DEMO_RESULT.text, restored: true, photos: clone(DEMO_RESULT.photos) }; }
    if (kind === 'valid') S.drafts.valid = { checks: clone(DEMO_VALIDATION.checks), lesson: DEMO_VALIDATION.lesson };
    S.formError = null; commit();
  }

  /* ---------- infraestructura de render ---------- */
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); }
  function commit() { save(); render(); }
  function toast(msg, ic) {
    if (videoMode || embedSide) return;
    var root = document.getElementById('toasts'); if (!root) return;
    var el = document.createElement('div'); el.className = 'toast'; el.innerHTML = icon(ic || 'info', 18) + '<span>' + esc(msg) + '</span>';
    root.appendChild(el); setTimeout(function () { el.remove(); }, 3400);
  }
  function scrollToLastQ(side) {
    var box = document.querySelector('[data-pane="' + side + '"] [data-sk]'); if (!box) return;
    var qs = box.querySelectorAll('.msg.u'), el = qs[qs.length - 1]; if (!el) return;
    box.scrollTop = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 8;
  }
  function scrollEnd(side) { var el = document.querySelector('[data-pane="' + side + '"] [data-sk]'); if (el) el.scrollTop = el.scrollHeight; }
  var lastRoutes = {}, lastThread = {};
  var PHONE_H = 866; // 844 de pantalla (iPhone 12 Pro: 390 × 844) + marco de 11 px
  function fitPhone() {
    var ph = document.querySelector('.phone'), df = document.querySelector('.deskframe');
    if (!ph) { if (df) df.style.height = ''; return; }
    if (embedSide || window.innerWidth < 760) { ph.style.zoom = ''; if (df) df.style.height = ''; return; }
    var z = Math.max(0.6, Math.min(1, (window.innerHeight - (PRES ? 64 : 104)) / PHONE_H));
    ph.style.zoom = z;
    if (df) df.style.height = Math.round(PHONE_H * z) + 'px';
  }
  function render() {
    var app = document.getElementById('app');
    var scrolls = {};
    document.querySelectorAll('[data-sk]').forEach(function (el) { scrolls[el.getAttribute('data-sk')] = el.scrollTop; });
    var ae = document.activeElement, focusKey = ae && ae.getAttribute && (ae.getAttribute('data-f') || ae.getAttribute('data-k')), sel = null;
    if (focusKey && ae.selectionStart != null) sel = [ae.selectionStart, ae.selectionEnd];
    var focusPane = ae && ae.closest && ae.closest('[data-pane]'); focusPane = focusPane && focusPane.getAttribute('data-pane');
    app.innerHTML = layout();
    document.querySelectorAll('[data-sk]').forEach(function (el) {
      var k = el.getAttribute('data-sk'), side = k.charAt(0), r = JSON.stringify(S[side]);
      if (lastRoutes[side] === r && scrolls[k] != null) el.scrollTop = scrolls[k];
      lastRoutes[side] = r;
    });
    if (focusKey) {
      var q = (focusPane ? '[data-pane="' + focusPane + '"] ' : '') + '[data-f="' + focusKey + '"],' + (focusPane ? '[data-pane="' + focusPane + '"] ' : '') + '[data-k="' + focusKey + '"]';
      var el = document.querySelector(q);
      if (el) { el.focus(); if (sel && el.setSelectionRange) try { el.setSelectionRange(sel[0], sel[1]); } catch (e) { } }
    }
    ['m', 'd'].forEach(function (sd) {
      var th = document.querySelector('[data-pane="' + sd + '"] .thread'); if (!th) { lastThread[sd] = null; return; }
      var key = JSON.stringify(S[sd]) + th.querySelectorAll('.bub,.sysnote').length;
      if (lastThread[sd] !== key) { var sc = sd === 'm' ? th.closest('[data-sk]') : th; if (sc) sc.scrollTop = sc.scrollHeight; lastThread[sd] = key; }
    });
    renderModal();
    fitPhone();
    document.body.classList.toggle('no-anim', videoMode);
  }

  /* ---------- layout general ---------- */
  function layout() {
    var showM = embedSide ? embedSide === 'm' : (S.role === 'cuadrilla' || S.role === 'dividida');
    var showD = embedSide ? embedSide === 'd' : (S.role !== 'cuadrilla');
    var h = embedSide || PRES ? '' : demobar();
    h += '<main class="stage' + (S.role === 'dividida' && !embedSide ? ' split' : '') + '">';
    if (showM) h += '<section class="col-m"><div class="pane-label"><span class="dot"></span>' + (PRES ? 'Campo · celular del encargado' : 'Cuadrilla · dispositivo del encargado') + '</div><div class="phone"><div class="screen" data-pane="m">' + mobileApp() + '</div></div></section>';
    if (showD) h += '<section class="col-d"><div class="pane-label ops"><span class="dot"></span>' + (S.deskRole === 'supervision' ? 'Supervisión' : 'Operaciones') + ' · central</div><div class="deskframe" data-pane="d">' + deskApp() + '</div></section>';
    h += '</main>';
    if (!embedSide && !PRES) h += guide();
    return h;
  }
  function demobar() {
    var roles = [['cuadrilla', 'device', 'Cuadrilla'], ['operaciones', 'grid', 'Operaciones'], ['supervision', 'shield', 'Supervisión'], ['dividida', 'split', 'Vista dividida']];
    var r = '<header class="demobar"><div class="brand">' + icon('logo', 22) + 'CAMPO <small>Prototipo</small></div>';
    r += '<div class="grp"><span class="lbl">Rol</span><div class="seg" role="tablist">' + roles.map(function (x) { return '<button data-a="role" data-v="' + x[0] + '" class="' + (S.role === x[0] ? 'on' : '') + '">' + icon(x[1], 16) + '<span class="' + (x[0] === 'dividida' ? 'lbl-long' : '') + '">' + x[2] + '</span></button>'; }).join('') + '</div></div>';
    r += '<div class="grp"><span class="lbl">Red de la cuadrilla</span><button class="conn-toggle ' + (S.online ? '' : 'off') + '" data-a="toggleNet" aria-pressed="' + (!S.online) + '"><span class="sw"></span>' + (S.online ? 'Conectada' : 'Sin conexión') + '</button></div>';
    r += '<button class="dbtn fric-toggle ' + (fricOn() ? 'on' : '') + '" data-a="fricToggle" title="Mostrar u ocultar las fricciones operativas">' + icon('alert', 16) + '<span class="t">Fricciones: ' + (fricOn() ? 'visibles' : 'ocultas') + '</span></button>';
    r += '<span class="spacer"></span><span class="sim-note">Datos ficticios · red, servidor e IA simulados</span>';
    r += '<button class="dbtn" data-a="about" title="Qué es simulado">' + icon('info', 16) + '<span class="t">Qué es simulado</span></button><button class="dbtn" data-a="guide" title="Guía">' + icon('list', 16) + '<span class="t">Guía</span></button><button class="dbtn" data-a="reset" title="Reiniciar">' + icon('refresh', 16) + '<span class="t">Reiniciar</span></button></header>';
    return r;
  }

  /* ================= APP MÓVIL · CUADRILLA ================= */
  function mobileApp() {
    var r = S.m.name, pend = pendingOut(), unread = unreadM();
    var top = ['inicio', 'incidencia', 'asistente', 'historial', 'criterios'].indexOf(r) >= 0; // el chat lleva flecha para volver a Inicio
    var titles = { inicio: '', incidencia: 'Orden #0248', chat: 'Chat · Operaciones', asistente: 'Asistente', historial: 'Historial', criterios: 'Criterios', caso: 'Caso #' + (S.m.id || ''), resultado: 'Resultado', cierre: 'Cierre #0248', cambio: 'Registrar cambio', orden2: 'Orden #' + (S.m.id || '') };
    var h = '<div class="mapp">';
    h += '<div class="statusbar"><span class="clk">' + now() + '</span><span class="notch" aria-hidden="true"></span><span class="r"><button class="sigbtn" data-a="toggleNet" title="' + (S.online ? 'Cortar la señal' : 'Recuperar la señal') + '" aria-label="' + (S.online ? 'Cortar la señal' : 'Recuperar la señal') + '">' + (S.online ? icon('wifi', 15) : icon('wifiOff', 15)) + '</button><span class="batt"></span></span></div>';
    h += '<div class="mhead"><div class="row">';
    h += top ? '<button class="back burger" data-a="menu" aria-label="Abrir menú">' + icon('menu', 20) + ((unread || pend) && !S.menu ? '<span class="bdot"></span>' : '') + '</button>' : '<button class="back" data-a="mback" aria-label="Volver">' + icon('arrowLeft', 18) + '</button>';
    h += r === 'inicio' ? '<div class="t">' + icon('logo', 22) + 'CAMPO</div>' : '<span class="ttl">' + esc(titles[r] || '') + '</span>';
    h += '</div><div class="row">' + (pend ? '<span class="pill pend" title="Sin enviar">' + icon('cloudPending', 14) + pend + '</span>' : '') + (S.online ? '<button class="pill on sigpill" data-a="toggleNet" title="Cortar la señal">' + icon('wifi', 14) + 'Conectado</button>' : '<button class="pill off sigpill" data-a="toggleNet" title="Recuperar la señal">' + icon('wifiOff', 14) + 'Sin señal</button>') + '</div></div>';
    if (!S.online) h += '<div class="offline-banner">' + icon('wifiOff', 18) + '<div>Sin conexión<small>Todo se guarda en el celular</small></div></div>';
    h += '<div class="mbody' + (r === 'chat' ? ' chatbody' : '') + '" data-sk="m-' + r + '">' + mView() + '</div>';
    if (r === 'asistente') h += '<div class="composer"><textarea data-f="composer" placeholder="Preguntá…" rows="1">' + esc(S.drafts.composer || '') + '</textarea><button data-a="ask" aria-label="Enviar">' + icon('send', 20) + '</button></div>';
    if (r === 'chat') h += chatComposer();
    if (S.menu) h += drawer();
    return h + '</div>';
  }
  function routeStops() {
    var done = false;
    return ROUTE.map(function (o, i) {
      var inc = S.incidents[o.id], p = proj(inc, 'm'), st;
      if (o.id === '0248') st = p.result ? 'done' : 'now';
      else st = (i === 1 && proj(inc0248(), 'm').result) ? 'now' : (i === 1 ? 'next' : 'later');
      return { o: o, inc: inc, p: p, st: st };
    });
  }
  var STOP_L = { now: 'Ahora', next: 'Después', later: 'Más tarde', done: 'Hecha' };
  function drawer() {
    var unread = unreadM(), pend = pendingOut();
    var h = '<div class="drawer-bg" data-a="menu"></div><aside class="drawer" aria-label="Menú">';
    h += '<div class="dhead"><div class="avatar">RB</div><div style="flex:1;min-width:0"><b>Raúl Benítez</b><small>Cuadrilla 3 · Encargado · Norte</small></div><button class="back" data-a="menu" aria-label="Cerrar">' + icon('x', 18) + '</button></div>';
    var items = [['inicio', 'home', 'Inicio'], ['incidencia', 'clipboard', 'Orden actual · #0248'], ['chat', 'chat', 'Chat con Operaciones', unread], ['asistente', 'spark', 'Asistente'], ['historial', 'history', 'Historial'], ['criterios', 'book', 'Criterios']];
    h += '<div class="dmsec">Menú</div><nav class="dnav">' + items.map(function (it) { return '<button class="' + (S.m.name === it[0] ? 'on' : '') + '" data-a="mgo" data-v="' + it[0] + '"' + (it[0] === 'incidencia' ? ' data-id="0248"' : '') + '>' + icon(it[1], 19) + '<span>' + it[2] + '</span>' + (it[3] ? '<span class="nb">' + it[3] + '</span>' : '') + '</button>'; }).join('') + '</nav>';
    h += '<div class="dfoot">' + (S.online ? ichip('wifi', 'Conectado · ' + S.lastSync, 'ok') : ichip('wifiOff', 'Sin señal', 'warn')) + (pend ? ichip('cloudPending', pend + ' sin enviar', 'warn') : '') + ichip('device', 'Historial, criterios y asistente sin señal') + '</div>';
    return h + '</aside>';
  }
  function mView() {
    switch (S.m.name) {
      case 'inicio': return mHome();
      case 'incidencia': return mIncident();
      case 'chat': return mChat();
      case 'cambio': return mChangeForm();
      case 'orden2': return mOrder2();
      case 'historial': return historyView('m');
      case 'caso': return caseView('m', S.m.id);
      case 'criterios': return criteriaView('m');
      case 'asistente': return mAssistant();
      case 'resultado': return mResultForm();
      case 'cierre': return mClosure();
    }
    return mHome();
  }
  function hop(nodes) {
    return '<div class="hop">' + nodes.map(function (n, i) { return (i ? '<span class="l ' + (n[2] === 'done' ? '' : n[2]) + '"></span>' : '') + '<div class="n ' + n[2] + '"><i>' + icon(n[0], 18, n[2] === 'cur' ? 'spin' : '') + '</i>' + esc(n[1]) + '</div>'; }).join('') + '</div>';
  }
  function syncCard() {
    var u = S.syncUI; if (!u) return '';
    var st = u.phase === 'recovered' ? [['wifiOff', 'Sin señal', 'done'], ['wifi', 'Señal', 'done'], ['sync', 'Envío', 'todo'], ['cloudCheck', 'Listo', 'todo']]
      : u.phase === 'syncing' ? [['wifiOff', 'Sin señal', 'done'], ['wifi', 'Señal', 'done'], ['sync', 'Envío', 'cur'], ['cloudCheck', 'Listo', 'todo']]
        : [['wifiOff', 'Sin señal', 'done'], ['wifi', 'Señal', 'done'], ['sync', 'Envío', 'done'], ['cloudCheck', 'Listo', 'done']];
    var h = '<div class="sync" data-k="sync">';
    if (u.phase === 'recovered') h += '<div class="row between"><div class="h3 row">' + icon('wifi', 20) + 'Señal recuperada</div><span class="pill pend">' + icon('cloudPending', 14) + u.count + ' sin enviar</span></div>' + hop(st) + '<button class="btn primary big" style="margin-top:12px" data-a="sync">' + icon('sync', 18) + 'Sincronizar ahora</button>';
    else if (u.phase === 'syncing') h += '<div class="h3 row">' + icon('sync', 20, 'spin') + 'Enviando ' + u.count + '…</div>' + hop(st) + '<div class="bar"><i style="width:' + u.progress + '%"></i></div>';
    else if (u.phase === 'shared') h += '<div class="row between"><div class="h3 row" style="color:var(--green)">' + icon('cloudCheck', 20) + 'Compartido · ' + S.lastSync + '</div><button class="btn ghost sm" data-a="closeSync" aria-label="Cerrar">' + icon('x', 16) + '</button></div>' + hop(st);
    h += '</div>';
    if (u.phase === 'shared') h += fric('handoff', 'El registro llegó a la central, pero eso no confirma que alguien lo haya leído: la cuadrilla no sabe si Operaciones lo recibió ni si tiene el contexto suficiente.');
    return h;
  }
  function stat(ic, n, l, cls) { return '<div class="stat ' + (cls || '') + '"><div class="row">' + icon(ic, 18) + '<span class="n">' + n + '</span></div><div class="l">' + l + '</div></div>'; }
  function lastMsg(side) { var p = proj(inc0248(), side); return p.msgs[p.msgs.length - 1]; }
  function mHome() {
    var inc = inc0248(), p = proj(inc, 'm'), unread = unreadM();
    var h = '<div class="hello"><div class="avatar">RB</div><div><div class="h2">Hola, Raúl</div><div class="small muted">Cuadrilla 3 · Norte</div></div></div>';
    if (S.syncUI) h += syncCard() + '<div style="height:12px"></div>';
    if (unread) { var lm = lastMsg('m'); h += '<button class="notice blue tap" data-a="mgo" data-v="chat">' + icon('chat', 20) + '<div><b>Operaciones te escribió · ' + unread + '</b><span class="xs ellipsis" style="display:block">' + esc(lm && lm.data.text ? lm.data.text : 'Nuevo mensaje') + '</span></div>' + icon('chevronRight', 18) + '</button>'; }
    if (pendingOut()) h += fric('sindueno', 'Los registros quedan pendientes en el dispositivo hasta que vuelva la señal: si nadie los retoma, no está claro quién se hace cargo de que lleguen.');
    h += '<div class="sec"><div class="sec-t">Mi ruta de hoy<span class="xs muted" style="letter-spacing:0;text-transform:none;font-weight:600">' + ROUTE.length + ' órdenes</span></div><div class="dayroute">';
    h += routeStops().map(function (x) {
      if (x.o.id === '0248' && x.st === 'now') {
        var c = '<div class="rstop now"><span class="rail"><i></i></span><div class="rbody"><div class="when">Ahora</div><div class="order hl" data-k="order-0248"><div class="row between"><span class="id">#0248</span>' + statusPill(p) + '</div><div class="row" style="gap:10px;margin-top:8px"><span class="tic">' + icon(tIc(inc.kind), 22) + '</span><div style="min-width:0"><div class="tt">' + esc(tShort(inc.kind)) + '</div><div class="small muted row" style="gap:4px">' + icon('pin', 14) + esc(inc.short) + '</div></div></div><div class="row" style="margin-top:10px;gap:14px">' + prioMeter(p.priority) + '<span class="xs muted row" style="gap:4px">' + icon('clock', 13) + x.o.time + '</span></div>';
        c += p.started ? (!p.result ? (!p.update ? '<button class="btn warn block cardmain" data-a="mgo" data-v="cambio" data-id="0248">' + icon('edit', 17) + 'Registrar cambio</button>' : '<button class="btn primary block cardmain" data-a="mgo" data-v="resultado" data-id="0248">' + icon('checkCircle', 17) + 'Registrar resultado</button>') : '') + '<div class="grid3 cardacts"><button class="btn secondary" data-a="mgo" data-v="incidencia" data-id="0248">' + icon('clipboard', 16) + 'Orden</button><button class="btn secondary chatbtn" data-a="mgo" data-v="chat">' + icon('chat', 16) + 'Chat' + (unread ? '<span class="nb">' + unread + '</span>' : '') + '</button><button class="btn secondary" style="color:var(--indigo)" data-a="mgo" data-v="asistente">' + icon('spark', 16) + 'IA</button></div>' : '<div class="grid2" style="margin-top:12px"><button class="btn secondary" data-a="mgo" data-v="incidencia" data-id="0248">' + icon('eye', 16) + 'Ver</button><button class="btn primary" data-a="start" data-id="0248">' + icon('play', 16) + 'Iniciar</button></div>';
        return c + '</div></div></div>';
      }
      var to = x.o.id === '0248' ? 'data-v="cierre" data-id="0248"' : 'data-v="orden2" data-id="' + x.o.id + '"';
      return '<div class="rstop ' + x.st + '"><span class="rail"><i></i></span><div class="rbody"><div class="when">' + STOP_L[x.st] + ' · ' + x.o.time + '</div><button class="order mini" data-a="mgo" ' + to + '><span class="tic gray">' + icon(x.st === 'done' ? 'checkCircle' : tIc(x.inc.kind), 18) + '</span><div style="flex:1;min-width:0"><b>#' + x.o.id + ' · ' + esc(tShort(x.inc.kind)) + '</b><div class="xs muted row" style="gap:4px">' + icon('pin', 12) + esc(x.inc.short || x.inc.address) + '</div></div>' + icon('chevronRight', 16) + '</button></div></div>';
    }).join('');
    h += '</div></div>';
    var stops = routeStops();
    h += '<div class="sec"><div class="sec-t">Mapa de hoy<span class="xs muted row" style="gap:4px;letter-spacing:0;text-transform:none;font-weight:600">' + icon('pin', 12) + 'Sector Norte</span></div><button class="mapcard" data-a="mgo" data-v="incidencia" data-id="0248" aria-label="Abrir la orden actual"><div class="rmap">' + routeMapSVG({ alert: !!p.change && !p.update && !p.result, started: p.started && !p.result, states: stops.map(function (x) { return x.st; }), labels: ['#0248', '#0251 · 14:00', '#0253 · 16:00'] }) + '</div><div class="maplg"><span><i class="dotlg"></i>Orden</span><span><i class="dotlg me"></i>Tu ubicación</span>' + (p.change && !p.update && !p.result ? '<span><i class="dotlg red"></i>Zona afectada</span>' : '') + '</div></button></div>';
    return h;
  }
  function mOrder2() {
    var inc = S.incidents[S.m.id] || S.incidents['0251'], o = ROUTE.filter(function (x) { return x.id === inc.id; })[0] || { time: '—' }, p = proj(inc, 'm');
    var h = '<div class="card"><div class="row between"><span class="id" style="font-weight:800;color:var(--blue-700)">#' + inc.id + '</span>' + statusPill(p) + '</div><div class="row" style="gap:10px;margin:8px 0 2px"><span class="tic">' + icon(tIc(inc.kind), 22) + '</span><div><div class="h2">' + esc(tShort(inc.kind)) + '</div><div class="small muted row" style="gap:4px">' + icon('pin', 14) + esc(inc.address) + '</div></div></div>';
    h += '<div class="facts">' + fact('Hora', icon('clock', 14) + o.time) + fact('Prioridad', prioMeter(p.priority)) + fact('Sector', icon('pin', 14) + inc.sector) + '</div></div>';
    h += '<div class="statusrow gray">' + icon('hourglass', 18) + '<b>Programada</b><span class="sp"></span><span class="wait">' + icon('clipboard', 15) + 'Después de #0248</span></div>';
    h += '<button class="btn secondary big" style="margin-top:12px" data-a="mgo" data-v="incidencia" data-id="0248">' + icon('arrowLeft', 17) + 'Volver a la orden actual</button>';
    return h;
  }
  var EV_IC = { created: 'plus', assigned: 'users', started: 'play', change: 'edit', ai: 'spark', update: 'bell', result: 'checkCircle', validated: 'stamp', msg: 'chat' };
  var EV_T = { created: 'Orden creada', assigned: 'Asignada', started: 'Iniciada', change: 'Cambio registrado', ai: 'Consulta IA', update: 'Orden actualizada', result: 'Resultado', validated: 'Validada', msg: 'Mensaje' };
  function evTitle(e) { if (e.type !== 'msg') return EV_T[e.type]; if (e.src === 'campo') return e.data.report ? 'Cambio por chat' : 'Mensaje a Operaciones'; return e.data.priority ? 'Indicaciones por chat' : 'Mensaje de Operaciones'; }
  function tlKey() { return '<div class="tlkey"><span><i style="background:var(--blue-600)"></i>Cuadrilla</span><span><i style="background:var(--navy)"></i>Central</span><span><i style="background:var(--indigo)"></i>IA</span></div>'; }
  function timeline(inc, side, limit) {
    var p = proj(inc, side);
    var items = p.events.slice().reverse().slice(0, limit || 999).map(function (e) {
      var who = e.type === 'ai' ? 'ia' : (e.src === 'campo' ? 'campo' : 'central');
      var pendM = side === 'm' && e.src === 'campo' && !e.synced;
      var extra = '';
      if (e.type === 'change') extra = prioMeter(e.data.urgency, true);
      if (e.type === 'update') extra = prioMeter(e.data.priority, true);
      if (e.type === 'msg' && e.data.report) extra = prioMeter(e.data.report.urgency, true);
      if (e.type === 'msg' && e.data.priority) extra = prioMeter(e.data.priority, true);
      var st = '';
      if (side === 'm' && e.src === 'campo') st = e.synced ? '<span class="st ok" title="Sincronizado ' + (e.syncedAt || '') + '">' + icon('cloudCheck', 16) + '</span>' : '<span class="st pend" title="Sin enviar">' + icon('cloudPending', 16) + '</span>';
      if (side === 'd' && e.src === 'campo' && e.syncedAt && e.syncedAt !== e.time) st = '<span class="st pend" title="Registrado sin conexión · recibido ' + e.syncedAt + '">' + icon('wifiOff', 15) + '<small>' + e.syncedAt + '</small></span>';
      if (side === 'd' && e.src === 'central' && !e.synced) st = '<span class="st pend" title="Sin entregar a la cuadrilla">' + icon('cloudPending', 16) + '</span>';
      return '<li class="' + who + (pendM ? ' pend' : '') + '"><span class="ic2">' + icon(EV_IC[e.type] || 'info', 15) + '</span><span class="t">' + evTitle(e) + ' ' + extra + '</span>' + st + '<span class="tm">' + e.time + '</span></li>';
    }).join('');
    return (limit ? '' : tlKey()) + '<ul class="tl2">' + items + '</ul>';
  }
  function regBox(inc, side) {
    var p = proj(inc, side), n = p.events.length, open = !!(S.tlOpen && S.tlOpen[side]);
    return '<button class="reghd" data-a="tlToggle" data-v="' + side + '" aria-expanded="' + open + '"><span class="sec-t">Registro</span><span class="xs muted">' + n + ' eventos</span>' + icon(open ? 'chevronDown' : 'chevronRight', 17) + '</button><div class="regbody' + (open ? '' : ' shut') + '">' + timeline(inc, side, open ? 0 : 1) + (open ? '' : '<button class="regmore" data-a="tlToggle" data-v="' + side + '">Ver los ' + n + ' eventos ' + icon('chevronDown', 14) + '</button>') + '</div>';
  }
  function demoBtn(k) { return PRES ? '' : '<button class="btn ghost sm" data-a="demoFill" data-v="' + k + '">' + icon('edit', 14) + 'Completar demo</button>'; }
  function fact(label, v) { return '<div class="fact"><small>' + label + '</small><div class="v">' + v + '</div></div>'; }
  function todoList(list, done, iconMap, cls) { return '<ul class="todo ' + (cls || '') + '">' + list.map(function (a) { var t = typeof a === 'string' ? a : a.t, ic = typeof a === 'string' ? (iconMap && iconMap[a]) || 'check' : a.ic, d = done && done(a); return '<li class="' + (d ? 'done' : '') + '">' + icon(d ? 'checkCircle' : ic, 17) + '<span>' + esc(t) + '</span></li>'; }).join('') + '</ul>'; }
  function chatPreview(side, nav) {
    var lm = lastMsg(side), unread = side === 'm' ? unreadM() : 0;
    var who = lm ? (lm.src === 'campo' ? (side === 'm' ? 'Vos' : 'C3') : (side === 'm' ? 'Operaciones' : 'Vos')) : '';
    return '<button class="chatprev" ' + nav + '><span class="ci">' + icon('chat', 20) + (unread ? '<span class="nb">' + unread + '</span>' : '') + '</span><span class="cb"><b>Chat con ' + (side === 'm' ? 'Operaciones' : 'Cuadrilla 3') + '</b><span class="xs muted ellipsis">' + (lm ? '<b>' + who + ':</b> ' + esc(lm.data.text || (lm.data.photos && lm.data.photos.length ? 'Foto' : '…')) : 'Sin mensajes') + '</span></span>' + (lm ? '<span class="xs muted">' + lm.time + '</span>' : '') + icon('chevronRight', 16) + '</button>';
  }
  function mIncident() {
    var inc = inc0248(), p = proj(inc, 'm');
    var h = '<div class="card"><div class="row between"><span class="id" style="font-weight:800;color:var(--blue-700)">#0248</span>' + statusPill(p) + '</div><div class="row" style="gap:10px;margin:8px 0 2px"><span class="tic">' + icon(tIc(inc.kind), 22) + '</span><div><div class="h2">' + esc(tShort(inc.kind)) + '</div><div class="small muted row" style="gap:4px">' + icon('pin', 14) + esc(inc.short) + '</div></div></div>';
    h += '<div class="facts">' + fact('Prioridad', prioMeter(p.priority)) + (p.change ? fact('En campo', prioMeter(p.change.urgency)) : fact('Reclamo', icon('phone', 14) + inc.reportedAt)) + fact('Sector', icon('pin', 14) + inc.sector) + '</div>';
    h += '<div class="ichips" style="margin-top:10px">' + (inc.cues || []).map(function (c) { return ichip(c[0], c[1]); }).join('') + '</div></div>';
    if (!p.started) h += '<button class="btn primary big" style="margin-top:12px" data-a="start" data-id="0248">' + icon('play', 18) + 'Iniciar intervención</button>';
    if (p.started) h += '<div style="margin-top:12px">' + chatPreview('m', 'data-a="mgo" data-v="chat"') + '</div>';
    if (p.change && !p.update) {
      var ce = p.lastReportEv || p.changeEv;
      h += ce.synced ? '<div class="statusrow blue">' + icon('cloudCheck', 20) + '<b>Enviado ' + ce.syncedAt + '</b><span class="sp"></span><span class="wait">' + icon('hourglass', 16) + 'Esperando a Operaciones</span></div>'
        : '<div class="statusrow amber">' + icon('cloudPending', 20) + '<b>Sin enviar</b><span class="sp"></span><span class="wait">' + icon('wifi', 15) + 'se envía con señal</span></div>';
      h += fric('espera', 'La cuadrilla necesita la decisión de Operaciones para seguir con la reparación. Mientras no llega, solo puede señalizar, registrar y observar: parte del trabajo queda esperando.');
    }
    if (p.update) {
      var u = p.update;
      h += '<div class="card upd" style="margin-top:12px"><div class="row between"><div class="h3 row">' + icon('shield', 18) + 'Autorizado</div><span class="row" style="gap:10px">' + prioMeter(u.priority) + '<span class="xs muted">' + p.updateEv.time + '</span></span></div>' + todoList(u.authorized, null, ITEM_IC) + (u.pending.length ? todoList(u.pending.map(function (x) { return { ic: 'hourglass', t: x }; }), null, null, 'pendl') : '') + '</div>';
    }
    if (p.started && !p.result) {
      h += '<div class="stack" style="margin-top:12px">';
      if (p.update) h += '<button class="btn primary big" data-a="mgo" data-v="resultado" data-id="0248">' + icon('checkCircle', 18) + 'Registrar resultado</button>';
      else h += '<button class="btn warn big" data-a="mgo" data-v="cambio" data-id="0248">' + icon('edit', 18) + 'Registrar cambio</button>';
      h += '</div>';
    }
    if (p.result) h += '<button class="btn secondary big" style="margin-top:12px" data-a="mgo" data-v="cierre" data-id="0248">' + icon('stamp', 18) + (p.validation ? 'Ver cierre' : 'Ver estado del cierre') + '</button>';
    h += '<div class="sec"><div class="card reg">' + regBox(inc, 'm') + '</div></div>';
    return h;
  }
  function iconChips(path, opts, sel, map) { return '<div class="chips">' + opts.map(function (o) { var on = (sel || []).indexOf(o) >= 0, m = map[o] || ['check', o]; return '<button class="chip ic ' + (on ? 'on' : '') + '" data-a="toggle" data-f="' + path + '" data-v="' + esc(o) + '">' + icon(on ? 'check' : m[0], 16) + esc(m[1]) + '</button>'; }).join('') + '</div>'; }
  function photosField(path, list) {
    return '<div class="photos">' + (list || []).map(function (k, i) { return '<div class="photo">' + photoSVG(k) + '<span class="tag">' + (i + 1) + '</span></div>'; }).join('') + ((list || []).length < 3 ? '<button class="photo-add" data-a="addPhoto" data-f="' + path + '" title="Agregar foto">' + icon('camera', 22) + '<span>+</span></button>' : '') + '</div>';
  }
  function tagChipC(t) { if (t === 'Urgente') return ichip('alert', 'Urgente', 'red'); return COND[t] ? condChip(t) : actChip(t); }
  function chatThread(side) {
    var inc = inc0248(), p = proj(inc, side), me = side === 'm' ? 'campo' : 'central', h = '';
    var lastCrew = null; p.msgs.forEach(function (e) { if (e.src === 'campo') lastCrew = e; });
    p.events.forEach(function (e) {
      if (e.type === 'assigned') h += '<div class="sysnote">' + icon('users', 13) + 'Orden asignada a C3 · ' + e.time + '</div>';
      else if (e.type === 'started') h += '<div class="sysnote">' + icon('play', 13) + 'Intervención iniciada · ' + e.time + '</div>';
      else if (e.type === 'result') h += '<div class="sysnote">' + icon('checkCircle', 13) + 'Resultado enviado a validar · ' + e.time + '</div>';
      else if (e.type === 'validated') h += '<div class="sysnote ok">' + icon('stamp', 13) + 'Cierre validado · ' + e.time + '</div>';
      else if (e.type === 'msg') {
        var mine = e.src === me, d = e.data;
        var who = e.src === 'campo' ? 'Raúl · C3' : (e.who && e.who.indexOf('Supervis') === 0 ? 'Carla · Supervisión' : 'Lucía · Operaciones');
        var st = '';
        if (e.src === 'campo' && side === 'm') st = e.synced ? '<span class="ok" title="Entregado ' + (e.syncedAt || '') + '">' + icon('checks', 14) + '</span>' : '<span class="pend" title="Sin enviar">' + icon('clock', 13) + '</span>';
        if (e.src === 'central' && side === 'd') st = e.synced ? '<span class="ok" title="Entregado">' + icon('checks', 14) + '</span>' : '<span class="pend" title="Sin entregar: C3 sin señal">' + icon('clock', 13) + '</span>';
        if (e.src === 'campo' && side === 'd' && e.syncedAt && e.syncedAt !== e.time) st = '<span class="pend" title="Escrito sin señal · llegó ' + e.syncedAt + '">' + icon('wifiOff', 13) + e.syncedAt + '</span>';
        h += '<div class="bub ' + (mine ? 'me' : 'them') + (e.src === 'campo' && !e.synced ? ' pending' : '') + '">' + (mine ? '' : '<div class="bw">' + esc(who) + '</div>');
        if (d.priority) h += '<div class="bprio">' + icon('gauge', 14) + 'Prioridad ' + prioMeter(d.priority) + '</div>';
        if (d.form && d.report) h += reportCard(d.report, side);
        if (d.text) h += '<div class="bt">' + esc(d.text) + '</div>';
        if (d.tags && d.tags.length) h += '<div class="ichips">' + d.tags.map(tagChipC).join('') + '</div>';
        if (d.photos && d.photos.length) h += '<div class="bph">' + d.photos.map(function (k) { return '<div class="photo">' + photoSVG(k) + '</div>'; }).join('') + '</div>';
        if (d.authorized && d.authorized.length) h += '<div class="bauth"><b>' + icon('shield', 13) + 'Autorizado</b>' + todoList(d.authorized, null, ITEM_IC) + '</div>';
        h += '<div class="bm">' + e.time + st + '</div></div>';
        if (side === 'm' && e.src === 'campo' && d.report && d.report.requiresEval && e === p.lastReportEv) {
          h += '<div class="sysnote card evalnote"><div class="row" style="gap:6px;color:var(--red);font-weight:800">' + icon('escalate', 15) + 'Lo decide Operaciones</div><div class="ichips" style="margin-top:8px;justify-content:center">' + reasonChips(d.report.reasons) + '</div><div class="lockline" style="justify-content:center">' + icon('lock', 13) + 'Sin maniobras en la red</div></div>';
          h += fric('sinautoridad', 'El caso excede lo que la cuadrilla puede decidir: reorganizar el trabajo, cambiar prioridades o sumar recursos depende de Operaciones.');
        }
        if (side === 'm' && e === lastCrew && d.report) h += fric('handoff', e.synced ? 'El mensaje salió hacia Operaciones, pero no hay confirmación de que alguien lo haya leído ni de que alcance para entender la situación.' : 'El mensaje tiene que llegar a Operaciones cuando vuelva la señal: puede llegar tarde, sin suficiente contexto o sin que sepamos si alguien lo recibió.');
      }
    });
    if (side === 'm') {
      var pend = p.msgs.filter(function (e) { return e.src === 'campo' && !e.synced; }).length;
      if (pend) h += '<div class="sysnote warn">' + icon('wifiOff', 13) + pend + ' sin enviar · salen cuando vuelva la señal</div>';
      else if (p.change && !p.update && !p.result) h += '<div class="sysnote">' + icon('hourglass', 13) + 'Esperando respuesta de Operaciones</div>';
    } else if (!S.online) h += '<div class="sysnote warn">' + icon('wifiOff', 13) + 'C3 sin señal desde ' + lastCrewContact() + ' · lo que mandes se entrega al reconectar</div>';
    return h;
  }
  function mChangeForm() {
    ensureChangeDraft();
    var d = S.drafts.change, inc = inc0248(), n = parseInt(d.homes || '0', 10) || 0;
    var h = '<div class="row between"><span class="small muted row" style="gap:5px">' + icon('chat', 15) + 'Se envía por el chat de #0248</span>' + demoBtn('change') + '</div>';
    h += '<div class="field"><span>Ubicación</span><div class="locrow">' + icon('pin', 18) + '<input class="input" data-f="change.location" value="' + esc(d.location) + '"><span class="gps">' + icon('gps', 13) + 'GPS</span></div></div>';
    h += '<div class="field"><span>Tipo <em>*</em></span><div class="opts3">' + CHANGE_OPTIONS.types.map(function (t) { return '<button class="opt' + (d.type === t ? ' on' : '') + '" data-a="set" data-f="change.type" data-v="' + esc(t) + '" title="' + esc(t) + '">' + icon(tIc(t), 22) + '<span>' + esc(TYPE_TILE[t] || t) + '</span></button>'; }).join('') + '</div></div>';
    h += '<div class="field"><span>¿Qué ves? <em>*</em></span>' + iconChips('change.conditions', CHANGE_OPTIONS.conditions, d.conditions, COND) + '</div>';
    h += '<div class="field"><span>Domicilios sin presión</span><div class="stepper"><button data-a="step" data-f="change.homes" data-v="-1" aria-label="Menos">' + icon('minus', 18) + '</button><span class="val">' + n + '</span><button data-a="step" data-f="change.homes" data-v="1" aria-label="Más">' + icon('plus', 18) + '</button><span class="homes">' + new Array(Math.min(n, 8) + 1).join(icon('home', 17)) + (n > 8 ? '+' : '') + '</span></div></div>';
    h += '<div class="field"><span>Urgencia <em>*</em></span><div class="urg">' + CHANGE_OPTIONS.urgency.map(function (u) { return '<button class="u' + PLV[u] + (d.urgency === u ? ' on' : '') + '" data-a="set" data-f="change.urgency" data-v="' + u + '">' + prioMeter(u, true) + '<span>' + u + '</span></button>'; }).join('') + '</div>';
    h += '<div class="cmpmini"><div><small>Orden</small>' + icon(tIc(inc.kind), 16) + prioMeter(inc.priority) + '</div>' + icon('arrowRight', 16) + '<div class="now"><small>Ahora</small>' + icon(tIc(d.type), 16) + (d.urgency ? prioMeter(d.urgency) : '<span class="muted">—</span>') + '</div></div></div>';
    h += fric('sinautoridad', 'La cuadrilla marca una urgencia preliminar, pero cambiar la prioridad de la orden o pedir más recursos no le corresponde: tiene que consultarlo con Operaciones.');
    h += '<div class="field acts"><span>Ya hiciste <i class="row" style="display:inline-flex;gap:4px;vertical-align:-2px">· ' + icon(tIc(d.type), 13) + esc(TYPE_TILE[d.type] || tShort(d.type)) + '</i></span>' + iconChips('change.actions', actionsFor(d.type), d.actions, ACT) + (NO_MANEUVER_TYPES.indexOf(d.type) >= 0 ? '<div class="lockline">' + icon('lock', 13) + 'Válvulas, cortes y excavación: los autoriza Operaciones</div>' : '') + '</div>';
    h += '<div class="field"><span>Fotos</span>' + photosField('change.photos', d.photos) + '</div>';
    h += '<label class="field"><span>Nota <i>opcional</i></span><textarea class="textarea sm" data-f="change.conditionsText" placeholder="Algo más para Operaciones">' + esc(d.conditionsText) + '</textarea></label>';
    if (S.formError) h += '<div class="statusrow red">' + icon('alert', 18) + '<b>' + esc(S.formError) + '</b></div>';
    h += '<button class="btn primary big" style="margin-top:16px" data-a="saveChange">' + icon(S.online ? 'chat' : 'device', 18) + (S.online ? 'Enviar por el chat' : 'Guardar · sale con señal') + '</button>';
    h += '<button class="btn ghost block" style="margin-top:6px" data-a="mback">Cancelar</button>';
    return h;
  }
  function reportCard(r, side) {
    var h = '<div class="rcard"><div class="rch">' + icon('edit', 14) + 'Cambio de escenario<span class="sp"></span>' + prioMeter(r.urgency) + '</div>';
    h += '<div class="rct"><span class="tic sm">' + icon(tIc(r.type), 17) + '</span><b>' + esc(tShort(r.type)) + '</b></div>';
    h += '<div class="ichips">' + (r.conditions || []).map(function (c) { return condChip(c); }).join('') + (r.homes ? ichip('home', r.homes + ' domicilios', 'warn') : '') + '</div>';
    if ((r.actions || []).length) h += '<div class="ichips">' + r.actions.map(actChip).join('') + '</div>';
    if ((r.photos || []).length) h += '<div class="bph">' + r.photos.map(function (k) { return '<div class="photo">' + photoSVG(k) + '</div>'; }).join('') + '</div>';
    return h + '</div>';
  }
  function mChat() {
    ensureCMsg();
    return '<div class="thread">' + chatThread('m') + '</div>';
  }
  function chatComposer() {
    ensureCMsg();
    var d = S.drafts.cmsg;
    var p = proj(inc0248(), 'm');
    var h = '<div class="ccomp">' + (p.started && !p.result ? '<div class="qtags"><button class="chip ic regbtn" data-a="mgo" data-v="cambio" data-id="0248">' + icon('edit', 15) + 'Registrar cambio</button></div>' : '');
    if (d.photos.length) h += '<div class="attach">' + d.photos.map(function (k, i) { return '<div class="photo">' + photoSVG(k) + '<button class="rm" data-a="rmPhoto" data-f="cmsg.photos" data-v="' + i + '" aria-label="Quitar foto">' + icon('x', 12) + '</button></div>'; }).join('') + '</div>';
    h += '<div class="crow"><button class="cam" data-a="addPhoto" data-f="cmsg.photos" aria-label="Agregar foto">' + icon('camera', 20) + '</button><textarea data-f="cmsg.text" rows="1" placeholder="Escribile a Operaciones…">' + esc(d.text) + '</textarea><button class="snd" data-a="sendCrewMsg" aria-label="Enviar">' + icon(S.online ? 'send' : 'device', 19) + '</button></div></div>';
    return h;
  }
  function anteBlock(a) {
    var k = S.history.filter(function (x) { return x.id === '0176'; })[0], ok = a.coinc.filter(function (c) { return c.ok; }).length;
    return '<div class="ante"><div class="row between"><span class="xs b row" style="gap:5px;color:var(--indigo)">' + icon('history', 13) + 'ANTECEDENTE</span><span class="match" title="Coincidencias con #0248">' + a.coinc.map(function (c) { return '<i class="' + (c.ok ? 'on' : '') + '"></i>'; }).join('') + '<b>' + ok + '/' + a.coinc.length + '</b></span></div><div class="h3" style="margin:5px 0 8px">#0176 · ' + esc(k.short) + '</div><div class="ichips">' + a.coinc.map(function (c) { return ichip(c.ok ? c.ic : 'minus', c.t, c.ok ? 'ia' : 'off'); }).join('') + '</div><div class="small row" style="margin-top:8px;gap:6px">' + icon('escalate', 15) + 'Se escaló · corte autorizado</div><button class="btn secondary sm" data-a="casego" data-v="0176">Ver #0176 ' + icon('arrowRight', 14) + '</button></div>';
  }
  function srcLine(a, list) { return '<div class="srcline">' + icon('database', 13) + esc(list || ('#0248 · #0176 · ' + a.crit.length + ' criterios')) + '<button class="lnk" data-a="critgo" data-v="hl">ver</button><span class="sp"></span>' + (a.offline ? '<span class="row" style="gap:3px;color:var(--amber)">' + icon('cloudPending', 13) + 'sin enviar</span>' : '<span class="row" style="gap:3px;color:var(--green)">' + icon('cloudCheck', 13) + 'guardado</span>') + '</div>'; }
  function aiCard(a) {
    var h = '<div class="msg a aic"><div class="who">' + icon('spark', 14) + 'Asistente</div>';
    if (a.intent === 'limits') {
      h += '<div class="nocard">' + icon('lock', 24) + '<div><b>No puedo autorizarlo</b><small>Lo autoriza Operaciones · CO-MAN-01</small></div></div>';
      h += '<h5>' + icon('shield', 14) + 'Sí podés</h5>' + todoList(a.verif.slice(0, 4), function (v) { return v.done; });
      h += '<div class="small row" style="margin-top:8px;gap:6px">' + icon('history', 15) + '#0176: el corte lo hizo el equipo de red</div>';
      h += '<div class="limits">' + icon('lock', 14) + ' Sin señal tampoco se habilita (CO-OFF-01)</div>';
      return h + srcLine(a, 'CO-MAN-01 · CO-OFF-01 · #0176') + '</div>';
    }
    if (a.intent === 'missing') return h + '<h5>' + icon('clipboard', 14) + 'Falta registrar</h5>' + todoList(a.missing) + srcLine(a, '#0248 · CO-DOC-01') + '</div>';
    if (a.intent === 'criteria') {
      h += '<h5>' + icon('book', 14) + 'Criterios para #0248</h5><ul class="todo">' + a.crit.map(function (c) { var k = CRITERIA.filter(function (x) { return x.id === c; })[0]; return '<li>' + icon(CAT_IC[k.cat], 17) + '<span><b>' + c + '</b> · ' + esc(k.title) + '</span></li>'; }).join('') + '</ul>';
      return h + '<button class="btn secondary sm" style="margin-top:8px" data-a="critgo" data-v="hl">' + icon('book', 15) + 'Abrir criterios</button></div>';
    }
    if (a.intent === 'status') return h + '<div class="statusrow ' + (a.pending ? 'amber' : 'green') + '" style="margin-top:4px">' + icon(a.pending ? 'cloudPending' : 'cloudCheck', 20) + '<b>' + (a.pending ? a.pending + ' sin enviar' : 'Todo enviado') + '</b></div></div>';
    if (a.intent === 'ante') return h + anteBlock(a) + '</div>';
    if (!a.hasChange) h += '<button class="btn warn sm" style="margin-bottom:8px" data-a="mgo" data-v="cambio" data-id="0248">' + icon('edit', 15) + 'Registrá el cambio primero</button>';
    h += anteBlock(a);
    h += '<h5>' + icon('shield', 14) + 'Ahora</h5>' + todoList(a.verif, function (v) { return v.done; });
    h += '<div class="esc">' + icon('device', 16) + icon('arrowRight', 14) + icon('grid', 16) + '<span><b>Escalar a Operaciones</b> · CO-ESC-01' + (a.offline ? ' · al sincronizar' : '') + '</span></div>';
    h += '<div class="limits">' + icon('lock', 14) + ' <b>No:</b> válvulas, cortes ni excavación</div>';
    return h + srcLine(a) + '</div>';
  }
  function mAssistant() {
    var h = '<div class="aihead">' + icon('spark', 18) + '<b>Asistente</b>' + (PRES ? '' : '<span class="pill ia" style="padding:2px 8px">IA simulada</span>') + '<span class="sp"></span>' + (S.online ? ichip('cloud', S.lastSync) : ichip('device', 'Datos locales', 'warn')) + '</div>';
    h += '<div class="chat" style="margin-top:12px">';
    h += '<div class="msg a"><div class="who">' + icon('spark', 14) + 'Asistente</div>Hola, Raúl. Busco antecedentes, criterios y lo que falta registrar. <span class="xs muted row" style="gap:4px;margin-top:6px">' + icon('lock', 12) + 'No autorizo maniobras</span></div>';
    S.chat.forEach(function (m) {
      if (m.from === 'u') h += '<div class="msg u"><div class="who">' + m.time + '</div>' + esc(m.text) + '</div>';
      else h += aiCard(m.ans);
    });
    if (S.chatPending) h += '<div class="msg a"><div class="who">' + icon('spark', 14) + 'Consultando</div><div class="thinking"><div class="row"><i class="spin"></i>' + icon('clipboard', 15) + '#0248</div><div class="row"><i class="spin"></i>' + icon('history', 15) + 'Historial</div><div class="row"><i class="spin"></i>' + icon('book', 15) + 'Criterios</div></div></div>';
    h += '</div>';
    var sug = [['history', 'Antecedentes y cómo seguir', DEMO_QUESTION], ['lock', '¿Puedo cerrar la válvula?', '¿Puedo cerrar la válvula del sector para frenar la pérdida?'], ['clipboard', '¿Qué falta registrar?', '¿Qué información falta registrar?'], ['book', '¿Qué criterios aplican?', '¿Qué criterios aplican?']];
    if (!S.chatPending) h += '<div class="sugg">' + (S.chat.length ? sug.slice(1) : sug.slice(0, 3)).map(function (s) { return '<button data-a="askv" data-v="' + esc(s[2]) + '">' + icon(s[0], 15) + esc(s[1]) + '</button>'; }).join('') + '</div>';
    return h;
  }
  function mResultForm() {
    ensureResultDraft();
    var d = S.drafts.result, p = proj(inc0248(), 'm'), auth = (p.update && p.update.authorized) || [];
    var h = '<div class="row between"><span class="small muted row" style="gap:5px">' + icon('shield', 15) + 'Autorizado ' + (p.updateEv ? p.updateEv.time : '') + ' · ' + prioMeter(p.priority) + '</span>' + demoBtn('result') + '</div>';
    h += '<div class="field"><span>Hecho</span><div class="checklist">' + auth.map(function (a) { return ckItem('result.done', a, d.done.indexOf(a) >= 0, ITEM_IC[a]); }).join('') + '</div></div>';
    h += '<div class="field"><span>Resultado <em>*</em></span><div class="opts3">' + OUTCOMES.map(function (o) { return '<button class="opt ' + o[3] + (d.outcome === o[0] ? ' on' : '') + '" data-a="set" data-f="result.outcome" data-v="' + esc(o[0]) + '" title="' + esc(o[0]) + '">' + icon(o[1], 24) + '<span>' + o[2] + '</span></button>'; }).join('') + '</div></div>';
    h += '<div class="field"><span>¿Hay servicio?</span><div class="segc" style="grid-template-columns:1fr 1fr"><button class="' + (d.restored === true ? 'on' : '') + '" data-a="setb" data-f="result.restored" data-v="1">' + icon('tap', 17) + ' Sí</button><button class="' + (d.restored === false ? 'on' : '') + '" data-a="setb" data-f="result.restored" data-v="0">' + icon('xCircle', 17) + ' No</button></div></div>';
    h += '<div class="field"><span>Fotos</span>' + photosField('result.photos', d.photos) + '</div>';
    h += '<label class="field"><span>Nota <i>opcional</i></span><textarea class="textarea sm" data-f="result.text" placeholder="¿Qué se hizo?">' + esc(d.text) + '</textarea></label>';
    if (S.formError) h += '<div class="statusrow red">' + icon('alert', 18) + '<b>' + esc(S.formError) + '</b></div>';
    h += '<button class="btn primary big" style="margin-top:16px" data-a="sendResult">' + icon('send', 18) + 'Enviar a validar</button>';
    return h;
  }
  function ckItem(path, v, on, ic) { return '<button type="button" class="ck ' + (on ? 'on' : '') + '" data-a="toggle" data-f="' + path + '" data-v="' + esc(v) + '"><span class="box">' + (on ? icon('check', 14) : '') + '</span>' + (ic ? '<span class="cki">' + icon(ic, 17) + '</span>' : '') + '<span>' + esc(v) + '</span></button>'; }
  function mClosure() {
    var inc = inc0248(), p = proj(inc, 'm');
    if (!p.result) return mIncident();
    var h = '<div class="card hero">';
    if (p.validation) h += '<div class="bigic">' + icon('checkCircle', 34) + '</div><div class="h2">Caso cerrado</div><div class="small muted row" style="justify-content:center;gap:5px;margin-top:4px">' + icon('stamp', 14) + esc(p.validation.by) + ' · ' + p.validEv.time + '</div>' + hop([['send', 'Enviado', 'done'], ['stamp', 'Validado', 'done'], ['history', 'Historial', 'done']]) + '<button class="btn primary big" style="margin-top:14px" data-a="casego" data-v="0248">' + icon('history', 18) + 'Ver en el historial</button>';
    else h += '<div class="bigic amber">' + icon('stamp', 32) + '</div><div class="h2">Enviado a validar</div>' + hop([['send', 'Enviado', p.resultEv.synced ? 'done' : 'pend'], ['stamp', 'Validación', 'pend'], ['history', 'Historial', 'todo']]);
    h += '</div><div class="card" style="margin-top:12px"><div class="ichips">' + outcomeChip(p.result.outcome) + ichip(p.result.restored ? 'tap' : 'xCircle', p.result.restored ? 'Con servicio' : 'Sin servicio', p.result.restored ? 'ok' : 'red') + '</div>' + (p.result.photos && p.result.photos.length ? '<div class="photos" style="margin-top:10px">' + p.result.photos.map(function (k) { return '<div class="photo">' + photoSVG(k) + '</div>'; }).join('') + '</div>' : '') + '</div>';
    h += '<div class="sec"><div class="card reg">' + regBox(inc, 'm') + '</div></div>';
    return h;
  }

  /* ================= HISTORIAL Y CRITERIOS (compartidos) ================= */
  function historyView(side) {
    var f = S.hist, q = norm(f.q);
    var list = S.history.filter(function (c) {
      if (f.status === 'resueltos' && c.status !== 'resuelto') return false;
      if (f.status === 'pendientes' && c.status !== 'pendiente') return false;
      if (f.sector !== 'Todos' && c.sector !== f.sector) return false;
      if (q && norm([c.id, c.title, c.short, c.type, c.sector, c.address, c.tags.join(' '), c.found, c.lesson].join(' ')).indexOf(q) < 0) return false;
      return true;
    });
    var h = '<div class="searchbox">' + icon('search', 18) + '<input data-k="hist-q-' + side + '" data-a-input="histq" placeholder="Buscar #, calle o condición" value="' + esc(f.q) + '"></div>';
    h += '<div class="row wrap" style="margin-top:10px">' + [['todos', 'list', 'Todos'], ['resueltos', 'checkCircle', 'Resueltos'], ['pendientes', 'hourglass', 'Pendientes']].map(function (x) { return '<button class="chip ' + (f.status === x[0] ? 'on' : '') + '" data-a="histst" data-v="' + x[0] + '">' + icon(x[1], 15) + x[2] + '</button>'; }).join('') + '<select class="select" style="width:auto;padding:7px 10px;font-size:13px;border-radius:999px" data-a-change="histsec">' + ['Todos', 'Norte', 'Sur', 'Este', 'Oeste', 'Centro'].map(function (s) { return '<option value="' + s + '"' + (f.sector === s ? ' selected' : '') + '>' + (s === 'Todos' ? 'Sector' : s) + '</option>'; }).join('') + '</select></div>';
    h += '<div class="row between" style="margin:10px 2px"><span class="xs muted">' + list.length + ' casos</span>' + (side === 'm' ? ichip('device', 'En el celular', 'ok') : '') + '</div>';
    if (!list.length) h += '<div class="empty">' + icon('search', 22) + '<div style="margin-top:6px">Sin resultados</div></div>';
    var grid = side === 'd';
    h += grid ? '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">' : '';
    h += list.map(function (c) {
      var st = c.status === 'resuelto' ? '<span class="pill ok">' + icon(c.isNew ? 'spark' : 'checkCircle', 13) + (c.isNew ? 'Nuevo' : 'Resuelto') + '</span>' : '<span class="pill pend">' + icon('hourglass', 13) + 'Pendiente</span>';
      return '<button class="case ' + (c.isNew && S.newCase === c.id ? 'new' : '') + '"' + (grid ? ' style="margin:0"' : '') + ' data-a="casego" data-v="' + c.id + '"><div class="row between"><span class="id">#' + c.id + ' <span class="xs muted" style="font-weight:600">' + c.date + '</span></span>' + st + '</div><div class="row" style="gap:9px;margin:6px 0 8px"><span class="tic sm">' + icon(tIc(c.type), 17) + '</span><div class="tt" style="margin:0">' + esc(c.short || c.title) + '</div></div><div class="ichips">' + ichip('pin', c.sector) + c.tags.slice(0, 2).map(tagChip).join('') + '</div></button>';
    }).join('');
    return h + (grid ? '</div>' : '');
  }
  function caseView(side, id) {
    var c = S.history.filter(function (x) { return x.id === id; })[0]; if (!c) return historyView(side);
    var citedByAI = S.chat.some(function (m) { return m.from === 'a'; }) && id === '0176';
    var h = '<div class="card"><div class="row between"><span style="font-weight:800;color:var(--blue-700)">#' + c.id + ' <span class="xs muted" style="font-weight:600">' + c.date + '</span></span>' + (c.status === 'resuelto' ? '<span class="pill ok">' + icon('checkCircle', 13) + (c.isNew ? 'Nuevo' : 'Resuelto') + '</span>' : '<span class="pill pend">' + icon('hourglass', 13) + esc(c.pendingLabel) + '</span>') + '</div>';
    h += '<div class="row" style="gap:10px;margin:8px 0 10px"><span class="tic">' + icon(tIc(c.type), 22) + '</span><div class="h2">' + esc(c.short || c.title) + '</div></div>';
    h += '<div class="ichips">' + (citedByAI ? ichip('spark', 'Sugerido por la IA', 'ia') : '') + (c.isNew ? ichip('checkCircle', 'Agregado hoy', 'ok') : '') + ichip('pin', c.sector + ' · ' + c.address) + (c.validatedBy ? ichip('stamp', c.validatedBy) : '') + c.tags.map(tagChip).join('') + '</div></div>';
    h += '<div class="' + (side === 'd' ? 'dgrid even' : '') + '" style="margin-top:12px"><div>';
    h += '<div class="card"><div class="ab"><div><small>' + icon('phone', 12) + 'Reclamo</small>' + esc(c.initial) + '</div><div><small>' + icon('eye', 12) + 'Se encontró</small>' + esc(c.found) + '</div></div></div>';
    h += '<div class="card"><div class="sec-t">Decisiones</div><ol class="steps2">' + c.decisions.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ol></div>';
    h += '</div><div>';
    h += '<div class="card"><div class="row" style="gap:10px;align-items:flex-start"><span style="color:' + (c.status === 'resuelto' ? 'var(--green)' : 'var(--amber)') + '">' + icon(c.status === 'resuelto' ? 'checkCircle' : 'hourglass', 22) + '</span><div class="small">' + esc(c.result) + '</div></div></div>';
    if (c.lesson && c.lesson !== '—') h += '<div class="lesson" style="margin-top:12px">' + icon('bulb', 22) + '<span>' + esc(c.lesson) + '</span></div>';
    h += '<div class="card"><div class="sec-t">Criterios</div><div class="chips">' + c.criteria.map(function (k) { var x = CRITERIA.filter(function (y) { return y.id === k; })[0]; return '<button class="chip static" data-a="critgo" data-v="' + k + '">' + icon(CAT_IC[x ? x.cat : 'todas'], 13) + k + '</button>'; }).join('') + '</div></div></div></div>';
    return h;
  }
  function criteriaView(side) {
    var c = S.crit;
    var h = '<div class="row between"><span class="small muted row" style="gap:5px">' + icon('shield', 15) + CRITERIA.length + ' criterios · v2026.3</span>' + (side === 'm' ? ichip('device', 'En el celular', 'ok') : '') + '</div>';
    h += '<div class="chips ' + (side === 'm' ? 'scrollx' : '') + '" style="margin:12px 0">' + [{ id: 'todas', name: 'Todas' }].concat(CRITERIA_CATEGORIES).map(function (k) { return '<button class="chip ' + (c.cat === k.id ? 'on' : '') + '" data-a="critcat" data-v="' + k.id + '">' + icon(CAT_IC[k.id], 15) + k.name + '</button>'; }).join('') + '</div>';
    var list = CRITERIA.filter(function (x) { return c.cat === 'todas' || x.cat === c.cat; });
    var grid = side === 'd';
    h += grid ? '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;align-items:start">' : '';
    h += list.map(function (x) {
      var open = c.open === x.id, hl = (c.hl || []).indexOf(x.id) >= 0;
      var whoIc = /Operaciones|Supervisión/.test(x.who) && !/cuadrilla/i.test(x.who) ? 'grid' : (/→|y Operaciones/.test(x.who) ? 'escalate' : 'device');
      return '<div class="crit ' + (hl ? 'hl' : '') + '"' + (grid ? ' style="margin:0"' : '') + '><button class="hd" data-a="critopen" data-v="' + x.id + '"><div class="row" style="gap:10px"><span class="cic">' + icon(CAT_IC[x.cat], 18) + '</span><div style="flex:1;min-width:0"><div class="code">' + x.id + '</div><div class="h3" style="margin-top:2px">' + esc(x.title) + '</div></div>' + (hl ? '<span class="pill ia">' + icon('spark', 12) + 'IA</span>' : icon(open ? 'chevronDown' : 'chevronRight', 16)) + '</div></button>' + (open ? '<div class="rule">' + esc(x.rule) + '<div class="ichips" style="margin-top:8px">' + ichip(whoIc, x.who, 'blue') + ichip('checkCircle', x.version + ' · ' + x.validated) + '</div></div>' : '') + '</div>';
    }).join('');
    return h + (grid ? '</div>' : '');
  }

  /* ================= APP ESCRITORIO · OPERACIONES / SUPERVISIÓN ================= */
  function deskApp() {
    var r = S.d.name, unread = S.alerts.filter(function (a) { return !a.read; }).length;
    var toValidate = Object.keys(S.incidents).filter(function (k) { return proj(S.incidents[k], 'd').key === 'resuelta'; }).length;
    var nav = [['panel', 'grid', 'Panel'], ['incidencias', 'list', 'Incidencias'], ['alertas', 'bell', 'Alertas', unread], ['validaciones', 'stamp', 'Validaciones', toValidate], ['historial', 'history', 'Historial'], ['criterios', 'book', 'Criterios']];
    var navKey = { incidente: 'incidencias', caso: 'historial', cierre: 'validaciones' }[r] || r;
    var sup = S.deskRole === 'supervision';
    var h = '<div class="dapp"><aside class="side"><div class="logo">' + icon('logo', 26) + '<div>CAMPO<small>' + (sup ? 'Supervisión' : 'Operaciones') + '</small></div></div><nav>' + nav.map(function (n) { return '<button data-a="dgo" data-v="' + n[0] + '" class="' + (navKey === n[0] ? 'on' : '') + '" title="' + n[2] + '">' + icon(n[1], 18) + n[2] + (n[3] ? '<span class="b">' + n[3] + '</span>' : '') + '</button>'; }).join('') + '</nav></aside>';
    var titles = { panel: 'Panel', incidencias: 'Incidencias', alertas: 'Alertas', validaciones: 'Validaciones', historial: 'Historial', criterios: 'Criterios', incidente: 'Incidencia #' + (S.d.id || ''), caso: 'Caso #' + (S.d.id || ''), cierre: 'Cierre #0248' };
    h += '<div class="dcol"><div class="dtop"><div class="tt">' + esc(titles[r] || '') + '</div><span class="sp"></span>';
    h += '<div class="crewsig ' + (S.online ? '' : 'stale') + '" title="Último dato de la Cuadrilla 3">' + icon(S.online ? 'wifi' : 'wifiOff', 15) + '<span class="d"></span>C3 · ' + lastCrewContact() + '</div>';
    h += '<div class="seg" style="background:var(--g100)"><button class="' + (!sup ? 'on' : '') + '" style="color:' + (!sup ? 'var(--navy)' : 'var(--g600)') + '" data-a="deskrole" data-v="operaciones">Operaciones</button><button class="' + (sup ? 'on' : '') + '" style="color:' + (sup ? 'var(--navy)' : 'var(--g600)') + '" data-a="deskrole" data-v="supervision">Supervisión</button></div>';
    h += '<span class="pill gray">' + icon('clock', 14) + now() + '</span><span class="av" title="' + (sup ? 'Supervisión · C. Duarte' : 'Operaciones · L. Ferreyra') + '">' + (sup ? 'CD' : 'LF') + '</span></div>';
    h += '<div class="dmain" data-sk="d-' + r + '">' + dView() + '</div></div></div>';
    return h;
  }
  function dView() {
    switch (S.d.name) {
      case 'panel': return dPanel();
      case 'incidencias': return '<div class="card">' + incTable() + '</div>';
      case 'alertas': return dAlerts();
      case 'validaciones': return dValidations();
      case 'historial': return historyView('d');
      case 'caso': return '<button class="btn ghost sm" data-a="dgo" data-v="historial">' + icon('arrowLeft', 15) + 'Historial</button>' + caseView('d', S.d.id);
      case 'criterios': return criteriaView('d');
      case 'incidente': return dIncident();
      case 'cierre': return dClosure();
    }
    return '';
  }
  function incTable(compact) {
    var rows = ['0248', '0249', '0250', '0251', '0253', '0246'].map(function (k) {
      var inc = S.incidents[k], p = proj(inc, 'd'), alert = S.alerts.some(function (a) { return a.inc === k && !a.read; });
      var kind = k === '0248' && p.change ? p.change.type : inc.kind;
      return '<tr class="click ' + (alert ? 'hl' : '') + '" data-a="dinc" data-v="' + k + '"><td class="nw"><b style="color:var(--blue-700)">#' + k + '</b>' + (alert ? ' <span class="newdot" title="Novedad sin revisar"></span>' : '') + '</td><td class="nw"><span class="row" style="gap:8px">' + icon(tIc(kind), 17) + esc(tShort(kind)) + '</span></td>' + (compact ? '' : '<td>' + inc.sector + '</td>') + '<td>' + prioMeter(p.priority) + '</td><td>' + statusPill(p) + '</td>' + (compact ? '' : '<td>C' + inc.crew.slice(-1) + '</td>') + '<td class="small"><span class="row" style="gap:5px;color:var(--g500)">' + (p.last ? icon(p.last.src === 'campo' ? 'device' : 'grid', 14) + '<b style="color:var(--g700)">' + p.last.time + '</b>' : '') + '</span></td></tr>';
    }).join('');
    return '<div class="tblwrap"><table class="tbl"><thead><tr><th>N.º</th><th>Tipo</th>' + (compact ? '' : '<th>Sector</th>') + '<th>Prioridad</th><th>Estado</th>' + (compact ? '' : '<th>Cuadrilla</th>') + '<th>' + (compact ? 'Hora' : 'Último dato') + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  function alertRow(a) {
    var inc = S.incidents[a.inc], p = proj(inc, 'd'), body = '';
    if (a.kind === 'change' && p.change) body = (p.change.conditions || []).map(function (c) { return condChip(c); }).join('') + (p.change.homes ? ichip('home', p.change.homes, 'warn') : '') + '<span class="ichip warn">' + prioMeter(p.change.urgency) + '</span>' + (p.change.offline ? ichip('wifiOff', 'Sin señal ' + p.changeEv.time) : '');
    if (a.kind === 'result' && p.result) body = outcomeChip(p.result.outcome) + ichip('hourglass', 'A validar');
    var snip = (a.kind === 'change' || a.kind === 'msg') && a.body ? '<div class="small muted ellipsis" style="margin-top:4px">' + icon('chat', 13) + ' «' + esc(a.body) + '»</div>' : '';
    return '<div class="alertrow ' + (a.read ? 'read' : '') + '"><div class="ico">' + icon(a.kind === 'result' ? 'stamp' : a.kind === 'msg' ? 'chat' : 'alert', 20) + '</div><div style="flex:1;min-width:0"><div class="row between"><b>' + esc(a.title) + '</b><span class="xs muted">' + a.time + '</span></div>' + snip + (body ? '<div class="ichips" style="margin-top:7px">' + body + '</div>' : '') + '</div><button class="btn ' + (a.read ? 'secondary' : 'primary') + ' sm" data-a="openAlert" data-v="' + a.id + '">' + (a.read ? 'Ver' : 'Revisar') + '</button></div>';
  }
  function kpi(ic, n, l, cls) { return '<div class="kpi ' + (cls || '') + '"><span class="i">' + icon(ic, 22) + '</span><div><div class="n">' + n + '</div><div class="l">' + l + '</div></div></div>'; }
  function dPanel() {
    var unread = S.alerts.filter(function (a) { return !a.read; });
    var active = Object.keys(S.incidents).filter(function (k) { return proj(S.incidents[k], 'd').key !== 'cerrada'; }).length;
    var toVal = Object.keys(S.incidents).filter(function (k) { return proj(S.incidents[k], 'd').key === 'resuelta'; }).length + 2;
    var p = proj(inc0248(), 'd');
    var h = '<div class="kpis">' + kpi('list', active, 'Activas') + kpi('users', 4, 'Cuadrillas') + kpi('bell', unread.length, 'Alertas', unread.length ? 'alert' : '') + kpi('stamp', toVal, 'A validar') + '</div>';
    h += fric('sobrecarga', 'La misma persona (L. Ferreyra) organiza las órdenes de las 4 cuadrillas y recibe sus alertas, reportes y cierres: puede no tener tiempo de revisar todo y algún cambio importante puede quedar sin atender.');
    if (unread.length) h += '<div class="dsec">' + unread.map(alertRow).join('') + fric('sindueno', 'La alerta llega a la central, pero no queda asignada a nadie en particular: todavía no está claro quién se hace responsable de revisarla y retomarla.') + '</div>';
    h += '<div class="dgrid"><div class="card"><div class="sec-t">En curso<button class="btn ghost sm" data-a="dgo" data-v="incidencias">Ver todas</button></div>' + incTable(true) + '</div><div>';
    h += '<div class="card"><div class="sec-t">Cuadrillas</div><div class="cmap">' + crewMapSVG({ c3on: S.online, alert: !!p.change && p.key === 'cambio' }) + '</div><div class="maplg"><span><i class="pinlg"></i>Cuadrilla</span><span><i class="dotlg"></i>Incidencia</span><span><i class="dotlg red"></i>Con alerta</span><span><i class="dotlg gray"></i>Programada</span></div><div class="crews">' + [['C1', '#0249', true], ['C2', '#0250', true], ['C3', '#0248', S.online], ['C4', '#0246', true]].map(function (c) { return '<div><span class="d ' + (c[2] ? '' : 'off') + '"></span>' + c[0] + ' <small>' + c[1] + (c[0] === 'C3' && !S.online ? ' · ' + icon('wifiOff', 12) + lastCrewContact() : '') + '</small></div>'; }).join('') + '</div></div>';
    h += '<div class="card"><div class="sec-t">#0248 · lo que ve la central</div><div class="row wrap" style="gap:10px"><span class="row" style="gap:6px;font-weight:700">' + icon(tIc(p.change ? p.change.type : inc0248().kind), 18) + esc(tShort(p.change ? p.change.type : inc0248().kind)) + '</span>' + prioMeter(p.priority) + statusPill(p) + '</div><div class="xs muted row" style="gap:5px;margin-top:10px">' + icon('clock', 13) + 'Último dato ' + (p.last ? p.last.time : '') + (S.online ? '' : ' · ' + icon('wifiOff', 13) + 'C3 sin señal') + '</div><button class="btn secondary sm" style="margin-top:10px" data-a="dinc" data-v="0248">Abrir #0248</button></div>';
    return h + '</div></div>';
  }
  function dAlerts() {
    if (!S.alerts.length) return '<div class="empty">' + icon('bell', 26) + '<div style="margin-top:6px">Sin alertas</div></div>';
    return fric('sindueno', 'Las alertas llegan a la central, pero ninguna tiene un responsable asignado: si nadie las revisa, el aviso puede quedar sin retomar.') + S.alerts.map(alertRow).join('');
  }
  function dValidations() {
    var list = Object.keys(S.incidents).filter(function (k) { return proj(S.incidents[k], 'd').key === 'resuelta'; });
    var h = '<div class="row wrap" style="gap:8px"><span class="small muted row" style="gap:5px">' + icon('stamp', 16) + 'Se valida:</span>' + ichip('camera', 'Evidencia', 'blue') + ichip('shield', 'Lo autorizado', 'blue') + ichip('tap', 'Servicio', 'blue') + ichip('book', 'CO-CIE-01') + '</div>';
    h += fric('sindueno', 'Hay cierres pendientes sin una persona asignada para validarlos: mientras nadie los toma, no se incorporan al historial.') + '<div class="dsec">';
    if (!list.length) h += '<div class="empty" style="margin-bottom:10px">' + icon('checkCircle', 22) + '<div style="margin-top:6px">Nada del día por validar</div></div>';
    h += list.map(function (k) { var inc = S.incidents[k], p = proj(inc, 'd'); return '<div class="alertrow"><div class="ico">' + icon('stamp', 20) + '</div><div style="flex:1"><div class="row between"><b>#' + k + ' · ' + esc(tShort(p.change ? p.change.type : inc.kind)) + '</b><span class="xs muted">' + p.resultEv.time + '</span></div><div class="ichips" style="margin-top:7px">' + outcomeChip(p.result.outcome) + ichip(p.result.restored ? 'tap' : 'xCircle', p.result.restored ? 'Con servicio' : 'Sin servicio', p.result.restored ? 'ok' : 'red') + ichip('camera', (p.result.photos || []).length + ((p.result.photos || []).length === 1 ? ' foto' : ' fotos')) + '</div></div><button class="btn primary sm" data-a="dinc" data-v="' + k + '">Revisar y validar</button></div>'; }).join('');
    h += S.history.filter(function (c) { return c.status === 'pendiente' && c.pendingLabel === 'Pendiente de validación'; }).map(function (c) { return '<div class="alertrow read" style="margin-top:8px"><div class="ico">' + icon('stamp', 20) + '</div><div style="flex:1"><b>#' + c.id + ' · ' + esc(c.short || c.title) + '</b><div class="ichips" style="margin-top:6px">' + ichip('clock', c.date) + ichip('pin', c.sector) + '</div></div><button class="btn secondary sm" data-a="casego" data-v="' + c.id + '">Ver caso</button></div>'; }).join('');
    return h + '</div>';
  }
  function dIncident() {
    var inc = S.incidents[S.d.id] || inc0248(), p = proj(inc, 'd');
    var kind = p.change ? p.change.type : inc.kind;
    var h = '<div class="row between wrap"><div class="row wrap"><button class="btn ghost sm" data-a="dgo" data-v="incidencias">' + icon('arrowLeft', 15) + 'Incidencias</button><span class="tic">' + icon(tIc(kind), 20) + '</span><span class="h2">#' + inc.id + ' · ' + esc(tShort(kind)) + '</span>' + statusPill(p) + prioMeter(p.priority) + '</div><span class="ichips">' + ichip('pin', (inc.short || inc.address) + ' · ' + inc.sector) + ichip('users', inc.crew) + '</span></div>';
    if (inc.id !== '0248') return h + '<div class="card" style="margin-top:14px"><div class="small muted">' + esc(inc.description) + '</div><div class="divider"></div>' + timeline(inc, 'd') + '</div>';
    if (!p.change) h += '<div class="statusrow gray">' + icon(S.online ? 'info' : 'wifiOff', 20) + '<b>Solo la orden original</b><span class="sp"></span><span class="wait">' + icon('clock', 15) + 'Último dato C3 ' + lastCrewContact() + '</span></div>' + fric('handoff', 'Lo que la cuadrilla registró en campo todavía no llegó a la central: depende de que vuelva la señal y se sincronice, y puede llegar tarde.');
    h += '<div class="dgrid" style="margin-top:14px"><div>';
    var ch = p.change, ce = p.changeEv;
    h += '<div class="card"><div class="sec-t">Orden vs. lo que contó campo' + (ch ? '<span class="xs muted row" style="gap:4px;letter-spacing:0;text-transform:none;font-weight:600">' + icon('chat', 13) + 'resumen del chat</span>' : '') + '</div><div class="cmp"><div class="c"><div class="hd">' + icon('grid', 15) + 'Orden</div><div class="big"><span class="tic">' + icon(tIc(inc.kind), 20) + '</span>' + esc(tShort(inc.kind)) + '</div>' + prioMeter(inc.priority) + '<div class="ichips">' + ichip('phone', 'Reclamo ' + inc.reportedAt) + (inc.cues || []).map(function (c) { return ichip(c[0], c[1]); }).join('') + '</div></div><div class="mid">' + icon('arrowRight', 20) + '</div>';
    if (ch) {
      h += '<div class="c"><div class="hd">' + icon('chat', 15) + 'Campo · C3</div><div class="big"><span class="tic warn">' + icon(tIc(ch.type), 20) + '</span>' + esc(tShort(ch.type)) + (ch.type !== inc.kind ? ' <span class="diff">CAMBIÓ</span>' : '') + '</div><div class="row" style="gap:8px">' + prioMeter(ch.urgency) + (URG[ch.urgency] > URG[inc.priority] ? ' <span class="diff">SUBE</span>' : '') + '</div>';
      h += '<div class="ichips">' + ch.conditions.map(function (c) { return condChip(c); }).join('') + (ch.homes ? ichip('home', ch.homes + ' domicilios', 'warn') : '') + '</div><div class="ichips">' + (ch.actions || []).map(actChip).join('') + '</div>';
      h += '<div class="ichips">' + (ch.offline ? ichip('wifiOff', 'Registrado ' + ce.time) : ichip('clock', 'Registrado ' + ce.time)) + ichip('cloudCheck', 'Recibido ' + (ce.syncedAt || '—'), 'ok') + '</div>' + (ch.conditionsText ? '<div class="note">«' + esc(ch.conditionsText) + '»</div>' : '') + '</div>';
    } else h += '<div class="c empty-c"><div class="hd">' + icon('device', 15) + 'Campo · C3</div><div class="nodata">' + icon(S.online ? 'hourglass' : 'wifiOff', 26) + '<span>Sin reporte todavía</span></div></div>';
    h += '</div>';
    if (ch && ch.reasons && ch.reasons.length) h += '<div class="evalbar">' + icon('escalate', 18) + '<b>Requiere decisión</b><span class="sp"></span>' + ch.reasons.map(function (r) { var o = typeof r === 'string' ? { ic: 'alert', t: r } : r; return '<span class="rb" title="' + esc(o.t) + '">' + icon(o.ic, 15) + '</span>'; }).join('') + '<span class="xs">' + ch.reasons.length + ' motivos</span></div>';
    h += '</div>';
    if (ch && ch.photos && ch.photos.length) h += '<div class="card"><div class="sec-t">Evidencias</div><div class="photos">' + ch.photos.map(function (k) { return '<div class="photo" style="width:150px;height:105px">' + photoSVG(k) + '<span class="tag">' + ce.time + '</span></div>'; }).join('') + (p.result && p.result.photos ? p.result.photos.map(function (k) { return '<div class="photo" style="width:150px;height:105px">' + photoSVG(k) + '<span class="tag">' + icon('checkCircle', 10) + ' ' + p.resultEv.time + '</span></div>'; }).join('') : '') + '</div></div>';
    if (p.ai.length) { var ai = p.ai[p.ai.length - 1]; h += '<div class="card airow"><span class="ii">' + icon('spark', 20) + '</span><div style="flex:1;min-width:0"><div class="row" style="gap:8px"><b>Consulta a la IA · ' + ai.time + '</b>' + (PRES ? '' : '<span class="pill ia" style="padding:1px 7px;font-size:10.5px">simulada</span>') + '</div><div class="small muted ellipsis" title="' + esc(ai.data.q) + '">«' + esc(ai.data.q) + '»</div></div><div class="ichips" style="flex:none">' + ichip('history', '#0176', 'ia') + ichip('book', ai.data.crit.length + ' criterios', 'ia') + ichip('lock', 'Sin maniobras', 'ok') + '</div></div>'; }
    h += '<div class="card reg">' + regBox(inc, 'd') + '</div>';
    h += '</div><div>';
    if (p.result || p.validation) h += dActionCard(inc, p);
    h += dChat(inc, p);
    h += '<div class="card"><div class="sec-t">Ubicación</div><div class="map" style="height:170px">' + mapSVG(!!ch) + '</div>' + (ch ? '<div class="xs muted row" style="gap:5px;margin-top:8px"><span class="lg red"></span>Área posiblemente afectada</div>' : '') + '</div>';
    return h + '</div></div>';
  }
  function dChat(inc, p) {
    ensureOMsg();
    var d = S.drafts.omsg;
    var h = '<div class="card dchat" data-k="actioncard"><div class="sec-t">Chat con Cuadrilla 3' + demoBtn('opschat') + '</div>';
    if (p.change && !p.update) h += fric('sobrecarga', 'Leer el chat, decidir la prioridad y autorizar acciones recae en la misma persona que atiende al resto de las cuadrillas.');
    h += '<div class="thread dthread" data-sk="d-chat">' + chatThread('d') + '</div>';
    if (!p.result) {
      h += '<div class="dcomp"><div class="row wrap" style="gap:6px"><span class="xs muted b">Prioridad</span>' + ['Media', 'Alta', 'Crítica'].map(function (x) { return '<button class="chip pchip u' + PLV[x] + (d.priority === x ? ' on' : '') + '" data-a="setx" data-f="omsg.priority" data-v="' + x + '">' + prioMeter(x, true) + x + '</button>'; }).join('') + '<span class="sp"></span><button class="chip ' + (d.auth ? 'on' : '') + '" data-a="setb" data-f="omsg.auth" data-v="' + (d.auth ? '0' : '1') + '">' + icon('shield', 15) + 'Autorizar' + (d.authorized.length ? ' · ' + d.authorized.length : '') + '</button></div>';
      if (d.auth) h += '<div class="checklist authl">' + DEMO_UPDATE.authorized.map(function (a) { return ckItem('omsg.authorized', a, d.authorized.indexOf(a) >= 0, ITEM_IC[a]); }).join('') + '</div>';
      h += '<div class="crow"><textarea data-f="omsg.text" rows="2" placeholder="Escribile a la cuadrilla…">' + esc(d.text) + '</textarea><button class="snd" data-a="sendOpsMsg" aria-label="Enviar">' + icon('send', 19) + '</button></div></div>';
    }
    return h + '</div>';
  }
  function dActionCard(inc, p) {
    var h = '<div class="card">';
    var byChip = '<div class="ichips" style="margin-top:10px">' + ichip('user', S.deskRole === 'supervision' ? 'Supervisión · C. Duarte' : 'Operaciones · L. Ferreyra') + '</div>';
    if (p.validation) {
      h += '<div class="sec-t">Cierre</div><div class="statusrow green" style="margin-top:0">' + icon('checkCircle', 20) + '<b>Cerrada · ' + p.validEv.time + '</b></div><button class="btn primary block" style="margin-top:10px" data-a="dgo" data-v="cierre" data-id="0248">Ver cierre</button>';
    } else if (p.result) {
      ensureValidDraft(); var d = S.drafts.valid;
      h += '<div class="sec-t">Validar cierre' + demoBtn('valid') + '</div><div class="ichips">' + outcomeChip(p.result.outcome) + ichip(p.result.restored ? 'tap' : 'xCircle', p.result.restored ? 'Con servicio' : 'Sin servicio', p.result.restored ? 'ok' : 'red') + '</div>' + (p.result.text ? '<div class="note" style="margin-top:8px">«' + esc(p.result.text) + '»</div>' : '');
      h += '<div class="checklist" style="margin-top:10px">' + DEMO_VALIDATION.checks.map(function (c) { return ckItem('valid.checks', c, d.checks.indexOf(c) >= 0, ITEM_IC[c]); }).join('') + '</div><label class="field"><span>' + icon('bulb', 14) + ' Aprendizaje <i>opcional</i></span><textarea class="textarea sm" data-f="valid.lesson" placeholder="¿Qué conviene recordar?">' + esc(d.lesson) + '</textarea></label>' + byChip + (S.formError ? '<div class="statusrow red">' + icon('alert', 16) + '<b>' + esc(S.formError) + '</b></div>' : '') + '<button class="btn ok block" style="margin-top:12px" data-a="validate">' + icon('stamp', 18) + 'Validar cierre</button>';
    }
    return h + '</div>';
  }
  function dClosure() {
    var inc = inc0248(), p = proj(inc, 'd');
    if (!p.validation) return dIncident();
    var t = function (type) { var e = inc.events.filter(function (x) { return x.type === type; })[0]; return e ? e.time : '—'; };
    var ce = p.changeEv;
    var steps = [[t('assigned'), 'users', 'Asignada', 'central'], [t('started'), 'play', 'Iniciada', 'campo'], [ce ? ce.time : '—', 'chat', 'Cambio por chat' + (p.change && p.change.offline ? ' sin señal' : ''), 'campo'], [p.ai.length ? p.ai[0].time : '—', 'spark', 'Consulta IA · #0176', 'ia'], [ce ? ce.syncedAt : '—', 'sync', 'Sincronizado', 'central'], [p.updateEv ? p.updateEv.time : '—', 'chat', 'Indicaciones por chat · ' + (p.update ? p.update.priority : ''), 'central'], [t('result'), 'checkCircle', 'Resultado', 'campo'], [p.validEv.time, 'stamp', 'Validada', 'central']];
    var h = '<div class="dgrid even"><div class="card hero"><div class="bigic">' + icon('checkCircle', 34) + '</div><div class="h1">#0248 cerrada</div><div class="small muted row" style="justify-content:center;gap:5px;margin-top:6px">' + icon('stamp', 14) + esc(p.validation.by) + ' · ' + p.validEv.time + '</div>' + hop([['send', 'Resultado', 'done'], ['stamp', 'Validado', 'done'], ['history', 'Historial', 'done']]) + '<div class="row" style="justify-content:center;margin-top:16px;gap:10px"><button class="btn primary" data-a="casego" data-v="0248">' + icon('history', 18) + 'Ver en el historial</button><button class="btn secondary" data-a="dgo" data-v="panel">Panel</button></div></div>';
    h += '<div class="card"><div class="sec-t">Recorrido</div>' + tlKey() + '<ul class="tl2">' + steps.map(function (s) { return '<li class="' + s[3] + '"><span class="ic2">' + icon(s[1], 15) + '</span><span class="t">' + esc(s[2]) + '</span><span class="tm">' + s[0] + '</span></li>'; }).join('') + '</ul>' + (p.validation.lesson ? '<div class="lesson" style="margin-top:12px">' + icon('bulb', 22) + '<span>' + esc(p.validation.lesson) + '</span></div>' : '') + '</div></div>';
    return h;
  }

  /* ================= GUÍA DE DEMOSTRACIÓN ================= */
  function guideSteps() {
    var inc = inc0248(), all = inc.events;
    var has = function (t) { return all.some(function (e) { return e.type === t; }); };
    var rp = all.filter(function (e) { return e.type === 'msg' && e.src === 'campo' && e.data.report; })[0];
    var upd = all.some(function (e) { return e.type === 'msg' && e.src === 'central' && e.data.priority; });
    return [
      { n: 'Escena 1 · Asignación', p: 'Operaciones asignó la #0248. En el celular, pulsá «Iniciar» en la ruta del día. El menú ☰ muestra la orden actual y las que siguen.', done: has('started'), go: [['Ver en Operaciones', 'operaciones', 'd', 'incidente', '0248'], ['Ir a Cuadrilla', 'cuadrilla', 'm', 'inicio']] },
      { n: 'Escena 2 · Cambio de escenario', p: 'En la orden, pulsá «Registrar cambio», completá el formulario (o «Completar demo») y envialo: llega a Operaciones como mensaje del chat.', done: !!rp, go: [['Abrir formulario', 'cuadrilla', 'm', 'cambio', '0248']] },
      { n: 'Escena 3 · Sin conexión', p: 'Cortá la señal (interruptor de arriba o el ícono de wifi del celular) antes de enviar el cambio: queda en el chat del celular y Operaciones no lo ve.', done: S.wentOffline && !!(rp && rp.data.report.offline), go: [['Ver vista dividida', 'dividida']] },
      { n: 'Escena 4 · Consulta a la IA', p: 'Abrí el Asistente sin conexión y enviá la consulta sugerida. Revisá el antecedente #0176, los criterios y los límites.', done: has('ai'), go: [['Abrir asistente', 'cuadrilla', 'm', 'asistente']] },
      { n: 'Escena 5 · Reconexión', p: 'Volvé a «Conectada» y pulsá «Sincronizar ahora». En Operaciones, abrí la alerta y respondé por el chat con la prioridad y lo que autorizás.', done: upd, go: [['Ir a Cuadrilla', 'cuadrilla', 'm', 'inicio'], ['Ir a Operaciones', 'operaciones', 'd', 'panel']] },
      { n: 'Escena 6 · Resolución', p: 'En Cuadrilla, «Registrar resultado». En Operaciones o Supervisión, validá el cierre y buscá #0248 en el historial.', done: has('validated'), go: [['Resultado (Cuadrilla)', 'cuadrilla', 'm', 'resultado', '0248'], ['Validar (Supervisión)', 'supervision', 'd', 'incidente', '0248']] }
    ];
  }
  var FRIC_GUIDE = [
    ['handoff', 'Cuadrilla: chat de la orden después de contar el cambio, y «Compartido». Operaciones: incidencia #0248 antes de sincronizar.'],
    ['sindueno', 'Cuadrilla: mensajes sin enviar. Operaciones: alertas del panel, pantalla Alertas y Validaciones.'],
    ['sobrecarga', 'Operaciones: panel de control y chat de la incidencia #0248.'],
    ['espera', 'Cuadrilla: orden #0248 después de contar el cambio, mientras espera la respuesta de Operaciones.'],
    ['sinautoridad', 'Cuadrilla: «Urgencia» del formulario de cambio y aviso «Lo decide Operaciones» en el chat.']
  ];
  // Lleva la demostración al momento del recorrido donde se ve cada fricción
  function fricJump(key) {
    timers.forEach(clearTimeout); timers = [];
    var keep = { guide: S.guide }; var wasVideo = videoMode; videoMode = true; persist = false;
    S = seed(); S.guide = keep.guide; S.fric = true;
    start('0248'); S.m = { name: 'cambio', id: '0248' }; demoFill('change');
    var target = { side: 'm', sel: '[data-fric="sinautoridad"]' };
    if (key === 'sinautoridad') { S.role = 'cuadrilla'; }
    else {
      setOnline(false); saveChange();
      if (key === 'handoff') { S.role = 'dividida'; S.m = { name: 'chat' }; S.d = { name: 'incidente', id: '0248' }; target = { side: 'm', sel: '[data-fric="handoff"]' }; }
      else {
        setOnline(true); startSync(); completeSync();
        if (key === 'espera') { S.role = 'cuadrilla'; S.syncUI = null; S.m = { name: 'incidencia', id: '0248' }; target = { side: 'm', sel: '[data-fric="espera"]' }; }
        else { S.role = 'operaciones'; S.deskRole = 'operaciones'; S.d = { name: 'panel' }; target = { side: 'd', sel: '[data-fric="' + key + '"]' }; }
      }
    }
    videoMode = wasVideo; persist = true;
    try { if (location.hash !== '#' + S.role) location.hash = S.role; } catch (e) { }
    if (window.innerWidth < 760) S.guide = false;
    commit();
    var box = document.querySelector('[data-pane="' + target.side + '"] [data-sk]'), el = document.querySelector('[data-pane="' + target.side + '"] ' + target.sel);
    if (box && el) box.scrollTop = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 90;
  }
  function guide() {
    var open = S.guide === null ? (window.innerWidth > 1240 && S.role === 'cuadrilla') : S.guide;
    var steps = guideSteps(), cur = steps.findIndex(function (s) { return !s.done; });
    var h = '<aside class="guide ' + (open ? 'open' : '') + '"><div class="gh"><div><div class="h3">Recorrido de demostración</div><div class="xs muted">Caso #0248 · Calle 12, Sector Norte</div></div><button class="btn ghost sm" data-a="guide" aria-label="Cerrar">' + icon('x', 18) + '</button></div><div class="gb">';
    h += steps.map(function (s, i) { return '<div class="gstep ' + (s.done ? 'done' : (i === cur ? 'cur' : '')) + '"><div class="n">' + (s.done ? icon('checkCircle', 14) : '') + s.n + '</div><p>' + s.p + '</p><div class="row wrap">' + s.go.map(function (g) { return '<button class="btn secondary sm" data-a="gstep" data-v="' + g.join('|') + '">' + g[0] + '</button>'; }).join('') + '</div></div>'; }).join('');
    h += '<div class="notice blue" style="margin-top:6px">' + icon('split', 18) + '<div>Usá «Vista dividida» para mostrar al mismo tiempo lo que sabe la Cuadrilla y lo que sabe Operaciones.</div></div>';
    h += '<div class="h3" style="margin:18px 0 4px">Fricciones operativas · Clase 29</div><p class="small muted" style="margin:0 0 10px">Posibles problemas identificados al analizar el recorrido. No están comprobados ni resueltos.</p>';
    h += FRIC_GUIDE.map(function (g) { return '<div class="gstep"><div class="fric-tag">' + icon('alert', 13) + FRIC[g[0]][0] + '</div><p>' + g[1] + '</p><button class="btn secondary sm" data-a="fricJump" data-v="' + g[0] + '">Ver en el prototipo</button></div>'; }).join('');
    return h + '</div></aside>';
  }

  /* ================= MODALES ================= */
  function renderModal() {
    var root = document.getElementById('modal'); if (!root) return;
    if (!modal) { root.innerHTML = ''; return; }
    var h = '<div class="modal-bg" data-a="closeModal"><div class="modal" data-stop="1">';
    if (modal === 'reset') h += '<h3>¿Reiniciar la demostración?</h3><p class="small">Se borran los registros cargados y se vuelve al estado inicial: orden #0248 recién asignada, con conexión.</p><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn secondary" data-a="closeModal">Cancelar</button><button class="btn primary" data-a="doReset">Reiniciar</button></div>';
    if (modal === 'about') h += '<h3>Qué es real y qué es simulado</h3><p class="small muted">Este prototipo funciona completo en el navegador, sin servicios externos.</p><table class="simtbl"><tr><td>Formularios, historial, criterios, búsquedas y filtros</td><td>Funcionan de verdad sobre datos ficticios precargados.</td></tr><tr><td>Almacenamiento</td><td>Se guarda en el navegador (localStorage). Si no está disponible, la demo funciona en memoria.</td></tr><tr><td>Conexión de la cuadrilla</td><td>Simulada con el interruptor «Red de la cuadrilla».</td></tr><tr><td>Servidor central y sincronización</td><td>Simulados dentro del navegador: cada registro indica si ya llegó al otro lado.</td></tr><tr><td>Asistente de IA</td><td>Simulado con reglas y respuestas predefinidas que leen los datos locales. No hay un modelo de IA real.</td></tr><tr><td>Fotos y mapa</td><td>Ilustraciones de referencia, no imágenes reales.</td></tr></table><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn primary" data-a="closeModal">Entendido</button></div>';
    root.innerHTML = h + '</div></div>';
  }

  /* ================= EVENTOS ================= */
  function onClick(ev) {
    var el = ev.target.closest('[data-a]'); if (!el) return;
    if (el.getAttribute('data-a') === 'closeModal' && ev.target.closest('[data-stop]') && el.classList.contains('modal-bg')) return;
    var a = el.getAttribute('data-a'), v = el.getAttribute('data-v'), id = el.getAttribute('data-id'), f = el.getAttribute('data-f');
    var paneEl = el.closest('[data-pane]'), side = paneEl ? paneEl.getAttribute('data-pane') : null;
    switch (a) {
      case 'role': setRole(v); break;
      case 'deskrole': S.deskRole = v; if (S.role !== 'dividida' && !PRES) S.role = v; if (v === 'supervision' && S.d.name === 'panel') S.d = { name: 'validaciones' }; commit(); break;
      case 'toggleNet': setOnline(!S.online); break;
      case 'guide': S.guide = !(S.guide === null ? (window.innerWidth > 1240 && S.role === 'cuadrilla') : S.guide); commit(); break;
      case 'reset': modal = 'reset'; renderModal(); break;
      case 'about': modal = 'about'; renderModal(); break;
      case 'fricToggle': S.fric = !fricOn(); commit(); break;
      case 'fricJump': fricJump(v); break;
      case 'closeModal': modal = null; renderModal(); break;
      case 'doReset': modal = null; resetAll(); break;
      case 'mtab': S.formError = null; if (v === 'orden') go('m', 'incidencia', '0248'); else go('m', v); break;
      case 'mgo': S.formError = null; go('m', v, id); break;
      case 'mback': S.formError = null; if (S.m.name === 'cambio') { var mf = S.cambioFrom || { name: 'incidencia', id: '0248' }; go('m', mf.name, mf.id); break; } if (S.m.name === 'chat') { var cf = S.chatFrom || { name: 'inicio' }; go('m', cf.name === 'chat' ? 'inicio' : cf.name, cf.id); break; } var bk = { caso: 'historial', resultado: 'incidencia', cierre: 'incidencia', orden2: 'inicio', chat: 'inicio' }[S.m.name] || 'inicio'; go('m', bk, '0248'); break;
      case 'menu': S.menu = !S.menu; commit(); break;
      case 'tlToggle': S.tlOpen = S.tlOpen || {}; S.tlOpen[v] = !S.tlOpen[v]; commit(); break;
      case 'sendCrewMsg': sendCrewMsg(); break;
      case 'saveChange': saveChange(); break;
      case 'sendOpsMsg': sendOpsMsg(); break;
      case 'setx': setPath(f, getPath(f) === v ? '' : v); commit(); break;
      case 'rmPhoto': var rp = (getPath(f) || []).slice(); rp.splice(parseInt(v, 10), 1); setPath(f, rp); commit(); break;
      case 'start': start(id); break;
      case 'toggle': var arr = getPath(f) || []; var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); setPath(f, arr); commit(); break;
      case 'set': setPath(f, v); if (f === 'change.type' && S.drafts.change) S.drafts.change.actions = (S.drafts.change.actions || []).filter(function (x) { return actionsFor(v).indexOf(x) >= 0; }); commit(); break;
      case 'setb': setPath(f, v === '1'); commit(); break;
      case 'step': var nn = (parseInt(getPath(f) || '0', 10) || 0) + parseInt(v, 10); setPath(f, nn > 0 ? String(nn) : ''); commit(); break;
      case 'addPhoto': var ph = getPath(f) || []; var kinds = f.indexOf('result') === 0 ? ['reparacion', 'calzada', 'vereda'] : ['calzada', 'vereda', 'reparacion']; ph.push(kinds[ph.length % 3]); setPath(f, ph); commit(); break;
      case 'demoFill': demoFill(v); break;
      case 'sync': doSync(); break;
      case 'closeSync': S.syncUI = null; commit(); break;
      case 'ask': ask(S.drafts.composer); break;
      case 'askv': ask(v); break;
      case 'critgo': S.crit.hl = v === 'hl' ? ['CO-DOC-01', 'CO-SEG-01', 'CO-DOC-02', 'CO-MAN-01', 'CO-ESC-01'] : (/^CO-/.test(v) ? [v] : []); S.crit.cat = /^CO-/.test(v) || v === 'hl' ? 'todas' : v; S.crit.open = /^CO-/.test(v) ? v : (v === 'esc' ? 'CO-ESC-01' : null); if (side === 'd') go('d', 'criterios'); else go('m', 'criterios'); break;
      case 'critcat': S.crit.cat = v; S.crit.hl = []; commit(); break;
      case 'critopen': S.crit.open = S.crit.open === v ? null : v; commit(); break;
      case 'casego': if (side === 'd') go('d', 'caso', v); else go('m', 'caso', v); break;
      case 'histst': S.hist.status = v; commit(); break;
      case 'dgo': S.formError = null; go('d', v, id); break;
      case 'dinc': S.formError = null; go('d', 'incidente', v); break;
      case 'openAlert': var al = S.alerts.filter(function (x) { return x.id === v; })[0]; if (al) { al.read = true; go('d', 'incidente', al.inc); } break;
      case 'sendResult': sendResult(); break;
      case 'validate': validate(); break;
      case 'gstep': var g = v.split('|'); if (g[1]) setRole(g[1]); if (g[2]) go(g[2], g[3], g[4]); if (window.innerWidth < 760) { S.guide = false; commit(); } break;
    }
  }
  function onInput(ev) {
    var el = ev.target;
    var f = el.getAttribute('data-f');
    if (f) { if (f === 'composer') S.drafts.composer = el.value; else setPath(f, el.value); save(); return; }
    if (el.getAttribute('data-a-input') === 'histq') { S.hist.q = el.value; commit(); }
  }
  function onChange(ev) {
    var el = ev.target;
    if (el.getAttribute('data-a-change') === 'histsec') { S.hist.sector = el.value; commit(); }
    if (el.tagName === 'SELECT' && el.getAttribute('data-f')) { setPath(el.getAttribute('data-f'), el.value); commit(); }
  }
  function onKey(ev) {
    var df = ev.target.getAttribute && ev.target.getAttribute('data-f');
    if (df === 'composer' && ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); ask(ev.target.value); }
    if (df === 'cmsg.text' && ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); setPath(df, ev.target.value); sendCrewMsg(); }
    if (df === 'omsg.text' && ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); setPath(df, ev.target.value); sendOpsMsg(); }
    if (ev.key === 'Escape' && S.menu) { S.menu = false; commit(); }
    if (ev.key === 'Escape' && modal) { modal = null; renderModal(); }
    if (PRES && ev.altKey && ev.shiftKey && ev.code === 'KeyR') { ev.preventDefault(); resetAll(); }
  }
  function resetAll() { timers.forEach(clearTimeout); timers = []; var role = S.role, g = S.guide; S = seed(); S.role = role; S.guide = g; commit(); toast(PRES ? 'Reiniciado' : 'Demostración reiniciada', 'refresh'); }
  function applyHash() { var h = (location.hash || '').slice(1); if (PRES) { if (h === 'reiniciar') { resetAll(); try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; } } return; } if (['cuadrilla', 'operaciones', 'supervision', 'dividida'].indexOf(h) >= 0 && h !== S.role) setRole(h); }

  /* ================= INICIO ================= */
  function init() {
    S = load() || seed();
    if (PRES) { S.role = 'dividida'; S.fric = false; S.guide = false; document.body.classList.add('pres'); }
    if (S.chatPending) S.chatPending = false;
    S.menu = false;
    if (S.syncUI && S.syncUI.phase === 'syncing') S.syncUI.phase = 'recovered';
    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('change', onChange);
    document.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', applyHash);
    window.addEventListener('resize', fitPhone);
    applyHash();
    render();
  }

  /* API para automatizar la demostración y grabar el video */
  window.CAMPO = {
    state: function () { return S; }, exportState: function () { return clone(S); },
    loadState: function (o) { S = clone(o); S.chatPending = !!o.chatPending; render(); },
    reset: function () { S = seed(); render(); }, render: render,
    go: function (side, name, id) { go(side, name, id); }, role: setRole, online: setOnline,
    start: start, saveChange: saveChange, sendCrewMsg: sendCrewMsg, sendOpsMsg: sendOpsMsg, ask: ask, sync: doSync, startSync: startSync, completeSync: completeSync,
    sendResult: sendResult, validate: validate, demoFill: demoFill,
    set: function (path, v) { var parts = path.split('.'), o = S; for (var i = 0; i < parts.length - 1; i++) o = o[parts[i]]; o[parts[parts.length - 1]] = v; render(); },
    embed: function (side) { embedSide = side; document.body.classList.add('embed'); render(); },
    video: function (on) { videoMode = !!on; persist = !on; render(); },
    scroll: function (side, y) { var el = document.querySelector('[data-pane="' + side + '"] [data-sk]'); if (el) el.scrollTop = y; return el ? el.scrollHeight - el.clientHeight : 0; },
    scrollTo: function (side, sel, off) { var box = document.querySelector('[data-pane="' + side + '"] [data-sk]'), el = document.querySelector('[data-pane="' + side + '"] ' + sel); if (box && el) { box.scrollTop = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - (off || 0); } },
    rect: function (side, sel) { var el = document.querySelector((side ? '[data-pane="' + side + '"] ' : '') + sel); if (!el) return null; var r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
