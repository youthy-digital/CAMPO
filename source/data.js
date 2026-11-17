/* CAMPO · datos ficticios precargados del prototipo */
const PEOPLE = {
  foreman: 'Raúl Benítez',
  crew: 'Cuadrilla 3',
  operator: 'Lucía Ferreyra',
  supervisor: 'Carla Duarte'
};

const CRITERIA_CATEGORIES = [
  { id: 'seg', name: 'Seguridad' },
  { id: 'doc', name: 'Documentación' },
  { id: 'esc', name: 'Escalamiento' },
  { id: 'man', name: 'Maniobras y restricciones' },
  { id: 'pri', name: 'Prioridades' },
  { id: 'off', name: 'Sin conexión' },
  { id: 'cie', name: 'Cierre y validación' }
];

const CRITERIA = [
  { id: 'CO-SEG-01', cat: 'seg', title: 'Priorizar la seguridad en el lugar',
    summary: 'Antes de cualquier tarea, señalizar y delimitar la zona afectada.',
    rule: 'Si hay agua en calzada, señalizar para vehículos y peatones y delimitar el paso. Ninguna tarea continúa si el entorno no es seguro.',
    who: 'Encargado de cuadrilla', version: 'v2.1', validated: '03/03/2026' },
  { id: 'CO-SEG-02', cat: 'seg', title: 'Distancia de trabajo en calzada',
    summary: 'Trabajar en calzada solo con corte o desvío de tránsito coordinado.',
    rule: 'Las tareas en calzada requieren conos, cartelería y, si corresponde, desvío coordinado por Operaciones con el municipio.',
    who: 'Operaciones', version: 'v1.4', validated: '03/03/2026' },
  { id: 'CO-DOC-01', cat: 'doc', title: 'Documentar todo cambio de escenario',
    summary: 'Registrar diferencias respecto de la orden apenas se detectan.',
    rule: 'Registrar ubicación, condiciones observadas, diferencia con lo previsto, urgencia preliminar, acciones realizadas y evidencia fotográfica, con hora.',
    who: 'Encargado de cuadrilla', version: 'v1.8', validated: '12/01/2026' },
  { id: 'CO-DOC-02', cat: 'doc', title: 'Comparar con antecedentes',
    summary: 'Consultar casos similares del historial antes de proponer acciones.',
    rule: 'Revisar antecedentes del mismo sector o con condiciones parecidas y dejar constancia de cuáles se consideraron.',
    who: 'Cuadrilla y Operaciones', version: 'v1.2', validated: '12/01/2026' },
  { id: 'CO-ESC-01', cat: 'esc', title: 'Escalar cuando el caso excede el alcance',
    summary: 'Agua en calzada + baja presión en varios domicilios indica posible falla de red.',
    rule: 'Si se observan agua en calzada, baja presión en más de un domicilio o indicios de afectación de la red distribuidora, el caso se escala a Operaciones para su evaluación.',
    who: 'Encargado de cuadrilla → Operaciones', version: 'v2.0', validated: '20/02/2026' },
  { id: 'CO-MAN-01', cat: 'man', title: 'Evitar maniobras no autorizadas',
    summary: 'No operar válvulas de red ni cortar el suministro sin autorización.',
    rule: 'El cierre de válvulas de sector, los cortes de suministro y las excavaciones en calzada requieren autorización expresa de Operaciones.',
    who: 'Solo Operaciones autoriza', version: 'v2.3', validated: '20/02/2026' },
  { id: 'CO-PRI-01', cat: 'pri', title: 'Criterios de prioridad alta',
    summary: 'Afectación a varios usuarios, riesgo en vía pública o pérdida continua en red.',
    rule: 'Se eleva a prioridad alta si hay afectación de servicio a más de un domicilio, riesgo para tránsito o peatones, o pérdida continua en red distribuidora.',
    who: 'Operaciones', version: 'v1.6', validated: '05/02/2026' },
  { id: 'CO-OFF-01', cat: 'off', title: 'Trabajo sin conexión',
    summary: 'Registrar localmente y reintentar el contacto por canal alternativo.',
    rule: 'Sin conexión, los registros se guardan en el dispositivo y se sincronizan al volver la señal. Reintentar contacto por radio o teléfono. La falta de conexión no habilita maniobras no autorizadas.',
    who: 'Encargado de cuadrilla', version: 'v1.1', validated: '05/02/2026' },
  { id: 'CO-CIE-01', cat: 'cie', title: 'Validación del cierre',
    summary: 'El cierre lo valida Operaciones o Supervisión antes de pasar al historial.',
    rule: 'Un caso se incorpora al historial solo después de validar evidencia, acciones realizadas dentro de lo autorizado y restablecimiento del servicio.',
    who: 'Operaciones o Supervisión', version: 'v1.3', validated: '05/02/2026' }
];

const HISTORY_SEED = [
  { id: '0176', short: 'Pérdida en vereda → rotura de red', title: 'Pérdida domiciliaria que resultó ser rotura en red distribuidora',
    type: 'Pérdida en red distribuidora', sector: 'Norte', address: 'Calle 9 entre Av. 3 y Av. 5',
    date: '14/08/2026', status: 'resuelto', validatedBy: 'Supervisión · C. Duarte',
    tags: ['Agua en calzada', 'Baja presión', 'Escalado', 'Inicio como pérdida domiciliaria'],
    initial: 'Reclamo por pérdida menor en vereda, frente a un domicilio. Prioridad media.',
    found: 'Agua en calzada y baja presión en 6 domicilios de la cuadra. La pérdida provenía de un caño de 75 mm de la red.',
    decisions: ['La cuadrilla documentó el cambio y escaló a Operaciones.', 'Operaciones elevó la prioridad a alta y envió al equipo de red.', 'Corte de sector autorizado por Operaciones durante 40 minutos.'],
    result: 'Caño de 75 mm reparado. Servicio restablecido en 3 h 20 min. 38 usuarios avisados del corte.',
    lesson: 'Agua en calzada + baja presión en varios domicilios es indicio de falla en red: documentar y escalar temprano.',
    criteria: ['CO-DOC-01', 'CO-ESC-01', 'CO-MAN-01', 'CO-PRI-01'] },
  { id: '0189', short: 'Baja presión por válvula cerrada', title: 'Baja presión por válvula parcialmente cerrada', type: 'Baja presión', sector: 'Este',
    address: 'Av. 20 y Calle 31', date: '02/09/2026', status: 'resuelto', validatedBy: 'Operaciones · L. Ferreyra',
    tags: ['Baja presión', 'Sin pérdida visible'],
    initial: 'Varios reclamos por baja presión en una manzana.', found: 'Válvula de sector parcialmente cerrada tras una obra anterior.',
    decisions: ['Operaciones autorizó la apertura de la válvula.', 'La cuadrilla verificó presión en tres domicilios.'],
    result: 'Presión normalizada en 1 h 10 min.', lesson: 'Antes de buscar pérdidas, revisar maniobras recientes en el sector.',
    criteria: ['CO-MAN-01', 'CO-DOC-02'] },
  { id: '0203', short: 'Rotura de conexión domiciliaria', title: 'Rotura de conexión domiciliaria', type: 'Pérdida en conexión domiciliaria', sector: 'Sur',
    address: 'Calle 44 N.º 812', date: '19/09/2026', status: 'resuelto', validatedBy: 'Operaciones · L. Ferreyra',
    tags: ['Dentro del alcance de la cuadrilla'],
    initial: 'Pérdida en vereda frente a un domicilio.', found: 'Rotura de la conexión domiciliaria, sin afectación de la red.',
    decisions: ['Reparación realizada por la cuadrilla dentro de su alcance.'],
    result: 'Reparado en 1 h 40 min.', lesson: 'Caso típico de pérdida menor: no requirió escalamiento.',
    criteria: ['CO-DOC-01', 'CO-SEG-01'] },
  { id: '0212', short: 'Pérdida en medidor', title: 'Pérdida en medidor con caudal continuo', type: 'Pérdida en medidor', sector: 'Norte',
    address: 'Calle 14 N.º 1720', date: '27/09/2026', status: 'resuelto', validatedBy: 'Supervisión · C. Duarte',
    tags: ['Medidor', 'Caudal continuo'],
    initial: 'Reclamo por agua en nicho de medidor.', found: 'Junta del medidor dañada.',
    decisions: ['Cambio de junta por la cuadrilla.'], result: 'Resuelto en 50 min.',
    lesson: 'Revisar nicho y llave de paso antes de abrir vereda.', criteria: ['CO-DOC-01'] },
  { id: '0221', short: 'Hundimiento de vereda', title: 'Hundimiento de vereda por pérdida prolongada', type: 'Hundimiento', sector: 'Centro',
    address: 'Av. 7 y Calle 50', date: '08/10/2026', status: 'resuelto', validatedBy: 'Supervisión · C. Duarte',
    tags: ['Riesgo peatonal', 'Escalado', 'Municipio'],
    initial: 'Vereda hundida reportada por vecinos.', found: 'Pérdida subterránea de larga data bajo la vereda.',
    decisions: ['Delimitación inmediata del área.', 'Operaciones coordinó con el municipio la reparación de vereda.'],
    result: 'Pérdida reparada; vereda a cargo del municipio.', lesson: 'Un hundimiento es riesgo para peatones: señalizar primero.',
    criteria: ['CO-SEG-01', 'CO-ESC-01'] },
  { id: '0231', short: 'Pérdida en cámara de válvula', title: 'Pérdida en cámara de válvula', type: 'Pérdida en red distribuidora', sector: 'Oeste',
    address: 'Calle 60 y Av. 1', date: '21/10/2026', status: 'pendiente', pendingLabel: 'Pendiente de validación',
    tags: ['Cámara de válvula'],
    initial: 'Agua en cámara de válvula.', found: 'Empaquetadura de válvula con pérdida.',
    decisions: ['Operaciones autorizó el cambio de empaquetadura.'], result: 'Reparación informada por la cuadrilla, falta validar.',
    lesson: '—', criteria: ['CO-MAN-01', 'CO-CIE-01'] },
  { id: '0239', short: 'Agua turbia', title: 'Agua turbia reportada por usuarios', type: 'Calidad de agua', sector: 'Norte',
    address: 'Calle 16 y Av. 9', date: '29/10/2026', status: 'pendiente', pendingLabel: 'En seguimiento',
    tags: ['Calidad', 'Seguimiento'],
    initial: 'Tres reclamos por agua turbia.', found: 'Turbiedad tras maniobra en la red.',
    decisions: ['Purga autorizada por Operaciones.', 'Toma de muestras en curso.'], result: 'Pendiente de resultados de laboratorio.',
    lesson: '—', criteria: ['CO-MAN-01'] },
  { id: '0244', short: 'Rotura por obra de terceros', title: 'Rotura por obra de terceros', type: 'Rotura de caño', sector: 'Este',
    address: 'Calle 33 y Av. 18', date: '03/11/2026', status: 'pendiente', pendingLabel: 'Pendiente de validación',
    tags: ['Terceros', 'Escalado'],
    initial: 'Rotura de caño durante obra privada.', found: 'Caño de 63 mm dañado por excavadora.',
    decisions: ['Operaciones autorizó corte de sector.', 'Se labró acta a la empresa contratista.'], result: 'Reparación informada, falta validar.',
    lesson: '—', criteria: ['CO-MAN-01', 'CO-ESC-01'] }
];

function seedIncidents() {
  return {
    '0248': {
      id: '0248', kind: 'Pérdida de agua en vereda', address: 'Calle 12 entre Av. 5 y Av. 7', short: 'Calle 12 · Av. 5 y 7', sector: 'Norte',
      cues: [['flow', 'Caudal bajo'], ['car', 'Sin afectar tránsito']],
      ref: 'Frente al N.º 1450', description: 'Vecino reporta pérdida de agua en vereda. Caudal aparentemente bajo, sin afectación al tránsito.',
      reportedBy: 'Reclamo telefónico · Centro de atención', reportedAt: '08:52', crew: 'Cuadrilla 3', priority: 'Media',
      events: [
        { id: 'e1', type: 'created', src: 'central', who: 'Operaciones · L. Ferreyra', time: '08:58', synced: true, text: 'Orden #0248 creada a partir de un reclamo telefónico.' },
        { id: 'e2', type: 'assigned', src: 'central', who: 'Operaciones · L. Ferreyra', time: '09:00', synced: true, text: 'Asignada a Cuadrilla 3 con prioridad media.' },
        { id: 'e3', type: 'msg', src: 'central', who: 'Operaciones · L. Ferreyra', time: '09:01', synced: true, syncedAt: '09:01', data: { text: 'Hola Raúl, te asigné la #0248: pérdida en vereda, caudal bajo. Cualquier novedad, avisame por acá.', tags: [], photos: [], authorized: [] } }
      ]
    },
    '0249': {
      id: '0249', kind: 'Baja presión', address: 'Av. 22 y Calle 35', sector: 'Este', ref: 'Manzana completa',
      description: 'Reclamos por baja presión en una manzana.', reportedBy: 'Web', reportedAt: '07:40', crew: 'Cuadrilla 1', priority: 'Media',
      events: [
        { id: 'a1', type: 'created', src: 'central', who: 'Operaciones', time: '07:45', synced: true, text: 'Orden creada.' },
        { id: 'a2', type: 'assigned', src: 'central', who: 'Operaciones', time: '07:50', synced: true, text: 'Asignada a Cuadrilla 1.' },
        { id: 'a3', type: 'started', src: 'campo', who: 'Cuadrilla 1', time: '08:20', synced: true, text: 'Intervención iniciada.' }
      ]
    },
    '0250': {
      id: '0250', kind: 'Pérdida en medidor', address: 'Calle 47 N.º 1033', sector: 'Sur', ref: 'Nicho de medidor',
      description: 'Agua en nicho de medidor.', reportedBy: 'Teléfono', reportedAt: '08:30', crew: 'Cuadrilla 2', priority: 'Baja',
      events: [
        { id: 'b1', type: 'created', src: 'central', who: 'Operaciones', time: '08:35', synced: true, text: 'Orden creada.' },
        { id: 'b2', type: 'assigned', src: 'central', who: 'Operaciones', time: '08:40', synced: true, text: 'Asignada a Cuadrilla 2.' }
      ]
    },
    '0251': {
      id: '0251', kind: 'Revisión de conexión', address: 'Calle 10 N.º 1215', short: 'Calle 10 N.º 1215', sector: 'Norte', ref: 'Programada 14:00',
      description: 'Revisión programada de conexión domiciliaria.', reportedBy: 'Programada', reportedAt: '—', crew: 'Cuadrilla 3', priority: 'Baja',
      events: [
        { id: 'c1', type: 'created', src: 'central', who: 'Operaciones', time: '08:10', synced: true, text: 'Orden programada.' },
        { id: 'c2', type: 'assigned', src: 'central', who: 'Operaciones', time: '08:10', synced: true, text: 'Asignada a Cuadrilla 3 para las 14:00.' }
      ]
    },
    '0253': {
      id: '0253', kind: 'Pérdida en medidor', address: 'Calle 16 N.º 980', short: 'Calle 16 N.º 980', sector: 'Norte', ref: 'Programada 16:00',
      description: 'Agua en nicho de medidor, reclamo de la mañana.', reportedBy: 'Teléfono', reportedAt: '08:15', crew: 'Cuadrilla 3', priority: 'Baja',
      events: [
        { id: 'f1', type: 'created', src: 'central', who: 'Operaciones', time: '08:20', synced: true, text: 'Orden creada.' },
        { id: 'f2', type: 'assigned', src: 'central', who: 'Operaciones', time: '08:20', synced: true, text: 'Asignada a Cuadrilla 3 para las 16:00.' }
      ]
    },
    '0246': {
      id: '0246', kind: 'Reparación de vereda', address: 'Calle 2 y Av. 13', sector: 'Oeste', ref: 'Esquina',
      description: 'Reposición de vereda tras reparación.', reportedBy: 'Interno', reportedAt: 'Ayer', crew: 'Cuadrilla 4', priority: 'Baja',
      events: [
        { id: 'd1', type: 'created', src: 'central', who: 'Operaciones', time: '07:00', synced: true, text: 'Orden creada.' },
        { id: 'd2', type: 'assigned', src: 'central', who: 'Operaciones', time: '07:05', synced: true, text: 'Asignada a Cuadrilla 4.' },
        { id: 'd3', type: 'started', src: 'campo', who: 'Cuadrilla 4', time: '07:30', synced: true, text: 'Intervención iniciada.' }
      ]
    }
  };
}

/* Valores del caso de demostración (para completar formularios rápidamente) */
const DEMO_CHANGE = {
  location: 'Calle 12 entre Av. 5 y Av. 7 · N.º 1450',
  type: 'Posible pérdida en red distribuidora',
  conditions: ['Agua en calzada', 'Reportes de baja presión', 'Caudal continuo'],
  conditionsText: 'El agua cubre media calzada y corre hacia Av. 7.',
  homes: '4',
  difference: '',
  urgency: 'Alta',
  actions: ['Señalización de la zona', 'Delimitación del paso peatonal', 'Registro fotográfico'],
  actionsText: '',
  photos: ['calzada', 'vereda']
};

/* Ruta del día de la Cuadrilla 3 (orden actual, la que sigue y las siguientes) */
const ROUTE = [{ id: '0248', time: '09:00' }, { id: '0251', time: '14:00' }, { id: '0253', time: '16:00' }];

/* Chat campo ↔ Operaciones: atajos que la cuadrilla puede sumar al mensaje */
const CHAT_TAGS = ['Agua en calzada', 'Reportes de baja presión', 'Caudal continuo', 'Hundimiento', 'Afecta el tránsito', 'Agua turbia', 'Señalización de la zona', 'Urgente'];
const DEMO_CHAT = {
  text: 'La pérdida es más grande de lo que decía la orden: el agua llega a la calzada y hay 4 vecinos sin presión. Ya señalizamos.',
  tags: ['Agua en calzada', 'Reportes de baja presión', 'Caudal continuo', 'Señalización de la zona', 'Urgente'],
  photos: ['calzada', 'vereda']
};

const DEMO_QUESTION = 'Pérdida mayor de lo previsto, agua en calzada y sin contacto con Operaciones. ¿Antecedentes y cómo seguimos?';

const DEMO_UPDATE = {
  priority: 'Alta',
  authorized: [
    'Mantener la zona señalizada',
    'Esperar al equipo de red · 10:35',
    'Excavar solo con el equipo de red',
    'Corte V-N12 · 10:40 a 11:15 (equipo de red)',
    'Avisar a los vecinos del corte'
  ],
  pending: [
    'Confirmar baja presión con telemetría',
    'Avisar al municipio'
  ],
  message: 'Prioridad alta. Mantengan la zona señalizada. No operar válvulas: el corte lo hace el equipo de red.'
};

const DEMO_RESULT = {
  outcome: 'Pérdida reparada y servicio restablecido',
  text: 'Caño de 75 mm reparado con el equipo de red. Presión normal en los 4 domicilios.',
  restored: true,
  photos: ['reparacion']
};

const DEMO_VALIDATION = {
  checks: ['Evidencia completa', 'Acciones dentro de lo autorizado', 'Servicio restablecido', 'Usuarios informados'],
  lesson: 'Pérdida "menor" que resultó rotura de red (75 mm), igual que #0176. Registrar sin señal y escalar al reconectar.'
};

const CHANGE_OPTIONS = {
  types: ['Pérdida de agua en vereda', 'Pérdida en conexión domiciliaria', 'Posible pérdida en red distribuidora', 'Rotura de caño', 'Baja presión', 'Otro'],
  conditions: ['Agua en calzada', 'Reportes de baja presión', 'Caudal continuo', 'Hundimiento', 'Afecta el tránsito', 'Agua turbia'],
  urgency: ['Baja', 'Media', 'Alta', 'Crítica'],
  actions: ['Señalización de la zona', 'Delimitación del paso peatonal', 'Registro fotográfico', 'Consulta a vecinos', 'Cierre de llave de paso domiciliaria']
};
