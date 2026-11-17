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
  { id: 'cie', name: 'Cierre y validación' },
  { id: 'com', name: 'Comunicación al usuario' },
  { id: 'con', name: 'Contratistas' }
];

/* Criterios operativos. Se apoyan en el caso base de Aguas del Este (piezas AE-03, AE-08, AE-10, AE-13, AE-14, AE-15 y AE-17) */
const CRITERIA = [
  { id: 'CO-SEG-01', cat: 'seg', title: 'Priorizar la seguridad en el lugar',
    summary: 'Antes de cualquier tarea, señalizar y delimitar la zona afectada.',
    rule: 'Si hay agua en calzada, señalizar para vehículos y peatones y delimitar el paso. Ninguna tarea continúa si el entorno no es seguro.',
    who: 'Encargado de cuadrilla', version: 'v2.1', validated: '03/03/2026' },
  { id: 'CO-SEG-02', cat: 'seg', title: 'Trabajo en calzada',
    summary: 'Trabajar en calzada solo con corte o desvío de tránsito coordinado.',
    rule: 'Las tareas en calzada requieren conos, cartelería y, si corresponde, desvío coordinado por el centro operativo con el municipio. Algunos trabajos necesitan permisos o coordinación con terceros.',
    who: 'Centro operativo', version: 'v1.4', validated: '03/03/2026' },
  { id: 'CO-DOC-01', cat: 'doc', title: 'Documentar todo cambio de escenario',
    summary: 'Una incidencia puede cambiar de clasificación después de la primera inspección: registrarlo apenas se detecta.',
    rule: 'Registrar ubicación, condiciones observadas, diferencia con lo previsto (por ejemplo, de «pérdida visible» a «rotura de conexión»), urgencia preliminar, acciones realizadas y fotos, con hora. Lo que para la cuadrilla es una pausa dentro del mismo trabajo puede ser información nueva para Atención.',
    who: 'Encargado de cuadrilla', version: 'v1.8', validated: '12/01/2026' },
  { id: 'CO-DOC-02', cat: 'doc', title: 'Comparar con antecedentes',
    summary: 'Consultar casos parecidos del historial antes de proponer acciones.',
    rule: 'Revisar antecedentes del mismo distrito o con condiciones parecidas y dejar constancia de cuáles se consideraron. Un mismo evento de red puede generar varios reclamos.',
    who: 'Cuadrilla y centro operativo', version: 'v1.2', validated: '12/01/2026' },
  { id: 'CO-ESC-01', cat: 'esc', title: 'Escalar cuando el caso excede el alcance',
    summary: 'Agua en calzada + baja presión en varios domicilios indica posible falla de red.',
    rule: 'Si se observan agua en calzada, baja presión en más de un domicilio o indicios de afectación de la red distribuidora, el caso se escala al centro operativo para que evalúe, repriorice y vincule otros reclamos de la zona.',
    who: 'Encargado de cuadrilla → Operaciones', version: 'v2.0', validated: '20/02/2026' },
  { id: 'CO-MAN-01', cat: 'man', title: 'Evitar maniobras no autorizadas',
    summary: 'No operar válvulas de red ni cortar el suministro sin autorización.',
    rule: 'El cierre de válvulas de sector, los cortes de suministro y las excavaciones en calzada requieren autorización expresa del centro operativo.',
    who: 'Solo Operaciones autoriza', version: 'v2.3', validated: '20/02/2026' },
  { id: 'CO-PRI-01', cat: 'pri', title: 'Prioridades P1 a P4 (OPS-PRIO-11)',
    summary: 'La prioridad ordena la atención. No es una promesa de hora de resolución.',
    rule: 'P1 Emergencia: riesgo sanitario, establecimiento de salud afectado, inundación con riesgo o falla principal; puede desplazar órdenes en curso. P2 Alta: desborde activo, interrupción amplia o pérdida significativa. P3 Normal: pérdida sin riesgo, conexión individual o baja presión localizada. P4 Programable: medidores y mantenimiento no urgente. El centro territorial puede repriorizar cuando aparece información nueva.',
    who: 'Centro territorial', version: 'v1.6', validated: '05/02/2026' },
  { id: 'CO-OFF-01', cat: 'off', title: 'Trabajo sin conexión',
    summary: 'Registrar en el celular y reintentar el contacto por otro canal.',
    rule: 'La señal no es estable en todo el territorio: en Norte y Sur, cerca de 1 de cada 5 rutas pasa por zonas sin señal estable. Sin conexión, los registros quedan en el celular y se envían al volver la señal. Reintentar el contacto por radio o teléfono. La falta de conexión no habilita maniobras no autorizadas.',
    who: 'Encargado de cuadrilla', version: 'v1.1', validated: '05/02/2026' },
  { id: 'CO-CIE-01', cat: 'cie', title: 'Cierre con motivo, foto y validación',
    summary: 'Todo cierre lleva motivo, foto del estado final y comentario. Lo valida Operaciones o Supervisión.',
    rule: 'Al cerrar se indica el motivo (reparación terminada, maniobra realizada, causa descartada, unida a otra incidencia, derivada a otro equipo o visita sin nueva acción), cómo queda el servicio y una foto del estado final. La foto final es obligatoria, también para contratistas. El caso pasa al historial y a MiAguas recién cuando se valida.',
    who: 'Cuadrilla cierra · Operaciones o Supervisión valida', version: 'v2.0', validated: '05/02/2026' },
  { id: 'CO-COM-01', cat: 'com', title: '«Resuelto» solo si el problema terminó',
    summary: 'El vecino ve el estado de MiAguas y el fundamento del cierre.',
    rule: 'MiAguas muestra cinco estados: Recibido, En evaluación, Asignado, En curso y Resuelto. Al cerrar se informa el fundamento general. Si el servicio vuelve de a poco, se dice («la presión puede tardar hasta 2 h»). Si el servicio sigue sin normalizarse, el caso no se muestra como «Resuelto».',
    who: 'Cuadrilla, Operaciones y Atención', version: 'v1.0', validated: '30/06/2026' },
  { id: 'CO-COM-02', cat: 'com', title: 'Sin hora confiable, informar lo que sigue',
    summary: 'No convertir una estimación operativa en una promesa.',
    rule: 'Los tiempos máximos del reglamento no se comunican como estimación individual. Si no hay una hora confiable, se informa la próxima decisión (por ejemplo, «probar presión a las 17»). Cada cambio material en la condición del servicio se actualiza.',
    who: 'Operaciones y Atención', version: 'v1.0', validated: '30/06/2026' },
  { id: 'CO-CON-01', cat: 'con', title: 'Órdenes con Reparaciones Delta',
    summary: 'Aceptar en 90 min e informar inicio, permisos, finalización y foto final.',
    rule: 'El contratista acepta o rechaza la orden dentro de los 90 minutos, informa el inicio efectivo, la necesidad de permiso o material especial y la finalización, y carga la evidencia fotográfica. Sus estados se sincronizan cada 60 minutos; los comentarios y las fotos, una vez por día.',
    who: 'Contratista → centro territorial', version: 'v1.2', validated: '15/04/2026' }
];

const HISTORY_SEED = [
  { id: '0176', short: 'Pérdida en vereda → rotura de red', title: 'Pérdida domiciliaria que resultó ser rotura en red distribuidora',
    type: 'Pérdida en red distribuidora', sector: 'Norte', address: 'Calle 9 entre Av. 3 y Av. 5',
    date: '14/08/2026', status: 'resuelto', validatedBy: 'Supervisión · C. Duarte',
    tags: ['Agua en calzada', 'Baja presión', 'Escalado', 'Inicio como pérdida domiciliaria'],
    initial: 'Reclamo por pérdida menor en vereda, frente a un domicilio. Prioridad P3 · normal.',
    found: 'Agua en calzada y baja presión en 6 domicilios de la cuadra. La pérdida provenía de un caño de 75 mm de la red.',
    decisions: ['La cuadrilla documentó el cambio y escaló a Operaciones.', 'Operaciones subió la prioridad a P2 · alta y envió al equipo de red.', 'Corte de sector autorizado por Operaciones durante 40 minutos.'],
    result: 'Caño de 75 mm reparado. Servicio restablecido en 3 h 20 min. 38 usuarios avisados del corte.',
    lesson: 'Agua en calzada + baja presión en varios domicilios es indicio de falla en red: documentar y escalar temprano.',
    criteria: ['CO-DOC-01', 'CO-ESC-01', 'CO-MAN-01', 'CO-PRI-01'] },
  { id: '26-039774', short: 'La ventana del contratista no llegó al vecino', title: 'Pérdida en vía pública: la información existía, pero el usuario no la recibió',
    type: 'Pérdida en red distribuidora', sector: 'Litoral', address: 'Tres domicilios de la misma cuadra',
    date: '18/05/2026', status: 'resuelto', validatedBy: 'Centro territorial Litoral',
    tags: ['Contratista', 'Reclamos unidos', 'Recontacto'],
    initial: 'Tres domicilios reportan agua junto a la vereda. Se unen en una sola incidencia.',
    found: 'Posible rotura de conexión principal: requiere cierre parcial y equipo de excavación.',
    decisions: ['El centro territorial pidió disponibilidad al contratista.', 'El contratista confirmó una ventana para el martes de 08:00 a 12:00.', 'MiAguas mostró «En curso» todo el lunes; Atención no veía la ventana desde su pantalla.'],
    result: 'Reparación terminada el martes a las 12:10. MiAguas pasó a «Resuelto» a las 12:38.',
    lesson: 'Si ya hay una ventana confirmada, tiene que llegar a Atención y al vecino: «En curso» no responde «¿tengo que dejar libre la entrada?».',
    criteria: ['CO-CON-01', 'CO-COM-02', 'CO-DOC-01'] },
  { id: 'INC-7821', short: 'Baja presión en 4 barrios · bombeo B-17', title: 'Cada área conocía una parte: baja presión en cuatro barrios',
    type: 'Baja presión', sector: 'Oeste', address: 'Cuatro barrios · estación de bombeo B-17',
    date: '03/06/2026', status: 'resuelto', validatedBy: 'Control de Red',
    tags: ['Evento de red', 'Reclamos unidos', 'Reabierto'],
    initial: '42 reclamos individuales por baja presión durante la mañana.',
    found: 'Bomba 2 fuera de servicio en B-17. La bomba 3 entró en servicio parcial y la presión se recuperó de a poco.',
    decisions: ['El centro territorial unió 31 de los 42 reclamos con la incidencia de red; 11 siguieron como casos sueltos.', 'Atención dio respuestas distintas según qué pantalla consultaba.', 'La incidencia de red se cerró cuando el sensor troncal volvió al rango normal.'],
    result: 'Presión normal a las 14:20. A las 16:30, cuatro usuarios volvieron a reclamar: había problemas locales en dos cuadras.',
    lesson: 'Cerrar la incidencia de red no cierra los problemas locales: verificar en el lugar antes de mostrar «Resuelto».',
    criteria: ['CO-CIE-01', 'CO-COM-01', 'CO-DOC-02'] },
  { id: '26-042911', short: 'Desborde: la estimación cambió 3 veces', title: 'Desborde cloacal con una estimación que cambió tres veces',
    type: 'Desborde cloacal', sector: 'Norte', address: 'Cámara externa de un domicilio',
    date: '09/06/2026', status: 'resuelto', validatedBy: 'Operaciones · L. Ferreyra',
    tags: ['Repriorizado', 'Hidrojet', 'Estimación cambiada'],
    initial: 'Desborde en cámara externa. Orden urgente con llegada estimada de 14:30 a 15:30.',
    found: 'Obstrucción a mayor profundidad: hizo falta un hidrojet de más potencia.',
    decisions: ['La primera cuadrilla se derivó a un desborde frente a un centro de salud (P1).', 'Nueva estimación de 16:00 a 17:00; el pedido de hidrojet no se informó al usuario.', 'El equipo se liberó antes y llegó a las 18:12.'],
    result: 'Obstrucción resuelta a las 19:03.',
    lesson: 'La emergencia puede desplazar la orden, pero cada cambio de estimación se tiene que avisar.',
    criteria: ['CO-PRI-01', 'CO-COM-02'] },
  { id: '26-041183', short: 'Medidor reemplazado sin llamadas', title: 'Reemplazo de medidor: el usuario sabía qué iba a pasar',
    type: 'Medidor sin lectura', sector: 'Centro', address: 'Medidor con acceso desde la vereda',
    date: '22/04/2026', status: 'resuelto', validatedBy: 'Cierre en ORBE',
    tags: ['Programable', 'Sin recontacto'],
    initial: 'Visor del medidor apagado, reportado desde MiAguas con foto.',
    found: 'Modelo elegible y con stock: la orden se generó sola.',
    decisions: ['MiAguas avisó: reemplazo dentro de 48 h, sin necesidad de estar en casa.', 'La cuadrilla escaneó el medidor nuevo al día siguiente.'],
    result: 'Medidor reemplazado. Encuesta 10/10 y ningún contacto adicional.',
    lesson: 'Cuando la persona sabe qué va a pasar y si tiene que estar, no llama.',
    criteria: ['CO-COM-01', 'CO-CIE-01'] },
  { id: '0189', short: 'Baja presión por válvula cerrada', title: 'Baja presión por válvula parcialmente cerrada', type: 'Baja presión', sector: 'Litoral',
    address: 'Av. 20 y Calle 31', date: '02/09/2026', status: 'resuelto', validatedBy: 'Operaciones · L. Ferreyra',
    tags: ['Baja presión', 'Sin pérdida visible'],
    initial: 'Varios reclamos por baja presión en una manzana.', found: 'Válvula de sector parcialmente cerrada tras una obra anterior.',
    decisions: ['Operaciones autorizó la apertura de la válvula.', 'La cuadrilla verificó presión en tres domicilios.'],
    result: 'Presión normalizada en 1 h 10 min.', lesson: 'Antes de buscar pérdidas, revisar maniobras recientes en el distrito.',
    criteria: ['CO-MAN-01', 'CO-DOC-02'] },
  { id: '0203', short: 'Rotura de conexión domiciliaria', title: 'Rotura de conexión domiciliaria', type: 'Pérdida en conexión domiciliaria', sector: 'Sur',
    address: 'Calle 44 N.º 812', date: '19/09/2026', status: 'resuelto', validatedBy: 'Operaciones · L. Ferreyra',
    tags: ['Dentro del alcance de la cuadrilla'],
    initial: 'Pérdida en vereda frente a un domicilio.', found: 'Rotura de la conexión domiciliaria, sin afectación de la red.',
    decisions: ['Reparación realizada por la cuadrilla dentro de su alcance.'],
    result: 'Reparado en 1 h 40 min.', lesson: 'Caso típico de pérdida menor: no requirió escalamiento.',
    criteria: ['CO-DOC-01', 'CO-SEG-01'] },
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
  { id: '0244', short: 'Rotura por obra de terceros', title: 'Rotura por obra de terceros', type: 'Rotura de caño', sector: 'Litoral',
    address: 'Calle 33 y Av. 18', date: '03/11/2026', status: 'pendiente', pendingLabel: 'Pendiente de validación',
    tags: ['Terceros', 'Contratista', 'Escalado'],
    initial: 'Rotura de caño durante obra privada.', found: 'Caño de 63 mm dañado por excavadora.',
    decisions: ['Operaciones autorizó corte de sector.', 'Reparaciones Delta hizo la excavación.', 'Se labró acta a la empresa de la obra.'], result: 'Reparación informada por el contratista; la foto final llega con la sincronización diaria.',
    lesson: '—', criteria: ['CO-MAN-01', 'CO-CON-01', 'CO-CIE-01'] }
];

function seedIncidents() {
  return {
    '0248': {
      id: '0248', kind: 'Pérdida de agua en vereda', address: 'Calle 12 entre Av. 5 y Av. 7', short: 'Calle 12 · Av. 5 y 7', sector: 'Norte',
      cues: [['flow', 'Caudal bajo'], ['car', 'Sin afectar tránsito']],
      ref: 'Frente al N.º 1450', description: 'Vecino reporta pérdida de agua en vereda. Caudal aparentemente bajo, sin afectación al tránsito.',
      caso: '26-043517', reportedBy: 'Reclamo telefónico · Centro de atención', reportedAt: '08:52', crew: 'Cuadrilla 3', priority: 'Normal',
      events: [
        { id: 'e1', type: 'created', src: 'central', who: 'Operaciones · L. Ferreyra', time: '08:58', synced: true, text: 'Orden #0248 creada a partir de un reclamo telefónico.' },
        { id: 'e2', type: 'assigned', src: 'central', who: 'Operaciones · L. Ferreyra', time: '09:00', synced: true, text: 'Asignada a Cuadrilla 3 con prioridad P3 · normal.' },
        { id: 'e3', type: 'msg', src: 'central', who: 'Operaciones · L. Ferreyra', time: '09:01', synced: true, syncedAt: '09:01', data: { text: 'Hola Raúl, te asigné la #0248: pérdida en vereda, caudal bajo. Cualquier novedad, avisame por acá.', tags: [], photos: [], authorized: [] } }
      ]
    },
    '0249': {
      id: '0249', kind: 'Baja presión', address: 'Av. 22 y Calle 35', sector: 'Litoral', ref: 'Manzana completa',
      description: 'Reclamos por baja presión en una manzana.', caso: '26-043488', reportedBy: 'MiAguas · web', reportedAt: '07:40', crew: 'Cuadrilla 1', priority: 'Normal',
      events: [
        { id: 'a1', type: 'created', src: 'central', who: 'Operaciones', time: '07:45', synced: true, text: 'Orden creada.' },
        { id: 'a2', type: 'assigned', src: 'central', who: 'Operaciones', time: '07:50', synced: true, text: 'Asignada a Cuadrilla 1.' },
        { id: 'a3', type: 'started', src: 'campo', who: 'Cuadrilla 1', time: '08:20', synced: true, text: 'Intervención iniciada.' },
        { id: 'a4', type: 'msg', src: 'campo', who: 'Cuadrilla 1', time: '08:25', synced: true, syncedAt: '08:25', data: { text: 'Llegamos. Presión baja en toda la manzana, revisamos la válvula de vereda.', tags: [], photos: [] } },
        { id: 'a5', type: 'msg', src: 'central', who: 'Operaciones · L. Ferreyra', time: '08:31', synced: true, syncedAt: '08:31', data: { text: 'Ok. Si hace falta un corte, avisame antes por acá.', tags: [], photos: [] } }
      ]
    },
    '0250': {
      id: '0250', kind: 'Pérdida en medidor', address: 'Calle 47 N.º 1033', sector: 'Sur', ref: 'Nicho de medidor',
      description: 'Agua en nicho de medidor.', caso: '26-043502', reportedBy: 'Centro telefónico', reportedAt: '08:30', crew: 'Cuadrilla 2', priority: 'Programable',
      events: [
        { id: 'b1', type: 'created', src: 'central', who: 'Operaciones', time: '08:35', synced: true, text: 'Orden creada.' },
        { id: 'b2', type: 'assigned', src: 'central', who: 'Operaciones', time: '08:40', synced: true, text: 'Asignada a Cuadrilla 2.' },
        { id: 'b3', type: 'msg', src: 'central', who: 'Operaciones · L. Ferreyra', time: '08:41', synced: true, syncedAt: '08:41', data: { text: 'C2, la #0250 es en el nicho del medidor. El vecino está en casa.', tags: [], photos: [] } },
        { id: 'b4', type: 'msg', src: 'campo', who: 'Cuadrilla 2', time: '08:44', synced: true, syncedAt: '08:44', data: { text: 'Recibido, vamos para allá.', tags: [], photos: [] } }
      ]
    },
    '0251': {
      id: '0251', kind: 'Revisión de conexión', address: 'Calle 10 N.º 1215', short: 'Calle 10 N.º 1215', sector: 'Norte', ref: 'Programada 14:00',
      description: 'Revisión programada de conexión domiciliaria.', reportedBy: 'Programada', reportedAt: '—', crew: 'Cuadrilla 3', priority: 'Programable',
      events: [
        { id: 'c1', type: 'created', src: 'central', who: 'Operaciones', time: '08:10', synced: true, text: 'Orden programada.' },
        { id: 'c2', type: 'assigned', src: 'central', who: 'Operaciones', time: '08:10', synced: true, text: 'Asignada a Cuadrilla 3 para las 14:00.' }
      ]
    },
    '0253': {
      id: '0253', kind: 'Pérdida en medidor', address: 'Calle 16 N.º 980', short: 'Calle 16 N.º 980', sector: 'Norte', ref: 'Programada 16:00',
      description: 'Agua en nicho de medidor, reclamo de la mañana.', caso: '26-043470', reportedBy: 'MiAguas · app', reportedAt: '08:15', crew: 'Cuadrilla 3', priority: 'Programable',
      events: [
        { id: 'f1', type: 'created', src: 'central', who: 'Operaciones', time: '08:20', synced: true, text: 'Orden creada.' },
        { id: 'f2', type: 'assigned', src: 'central', who: 'Operaciones', time: '08:20', synced: true, text: 'Asignada a Cuadrilla 3 para las 16:00.' }
      ]
    },
    '0246': {
      id: '0246', kind: 'Tapa de cámara dañada', address: 'Calle 2 y Av. 13', sector: 'Oeste', ref: 'Esquina',
      description: 'Tapa de cámara de válvula rota en la esquina.', caso: '26-043391', reportedBy: 'Oficina comercial', reportedAt: 'Ayer', crew: 'Cuadrilla 4', priority: 'Normal',
      events: [
        { id: 'd1', type: 'created', src: 'central', who: 'Operaciones', time: '07:00', synced: true, text: 'Orden creada.' },
        { id: 'd2', type: 'assigned', src: 'central', who: 'Operaciones', time: '07:05', synced: true, text: 'Asignada a Cuadrilla 4.' },
        { id: 'd3', type: 'started', src: 'campo', who: 'Cuadrilla 4', time: '07:30', synced: true, text: 'Intervención iniciada.' },
        { id: 'd4', type: 'msg', src: 'campo', who: 'Cuadrilla 4', time: '07:40', synced: true, syncedAt: '07:40', data: { text: 'Estamos cambiando la tapa de la cámara, terminamos antes del mediodía.', tags: [], photos: [] } }
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
  actions: ['Señalización de la zona', 'Delimitación del paso peatonal', 'Relevamiento de domicilios sin presión', 'Registro fotográfico'],
  actionsText: '',
  photos: ['calzada', 'vereda']
};

/* Ruta del día de la Cuadrilla 3 (orden actual, la que sigue y las siguientes) */
/* Conversaciones de Operaciones con cada cuadrilla (una por orden en curso) */
const CHAT_INCS = ['0248', '0249', '0250', '0246'];
const CREW_NAME = { 'Cuadrilla 1': 'Martín · C1', 'Cuadrilla 2': 'Sofía · C2', 'Cuadrilla 3': 'Raúl · C3', 'Cuadrilla 4': 'Diego · C4' };

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
    'Confirmar la presión en HIDRA',
    'Avisar al municipio'
  ],
  message: 'Prioridad alta. Mantengan la zona señalizada. No operar válvulas: el corte lo hace el equipo de red.'
};

const DEMO_RESULT = {
  outcome: 'Reparación terminada',
  service: 'gradual',
  text: 'Caño de 75 mm reparado con el equipo de red. Zanja tapada y vereda limpia. La presión vuelve en los 4 domicilios.',
  photos: ['cierre', 'reparacion']
};

const DEMO_VALIDATION = {
  checks: ['Foto del cierre', 'Acciones dentro de lo autorizado', 'Presión verificada en HIDRA', 'Mensaje para el vecino'],
  lesson: 'Pérdida "menor" que resultó rotura de red (75 mm), igual que #0176. Registrar sin señal y escalar al reconectar.'
};

const CHANGE_OPTIONS = {
  types: ['Pérdida de agua en vereda', 'Pérdida en conexión domiciliaria', 'Posible pérdida en red distribuidora', 'Rotura de caño', 'Baja presión', 'Otro'],
  conditions: ['Agua en calzada', 'Reportes de baja presión', 'Caudal continuo', 'Hundimiento', 'Afecta el tránsito', 'Agua turbia'],
  urgency: ['Programable', 'Normal', 'Alta', 'Emergencia'],
  actions: ['Señalización de la zona', 'Delimitación del paso peatonal', 'Registro fotográfico', 'Consulta a vecinos', 'Cierre de llave de paso domiciliaria']
};

/* Acciones tomadas por la cuadrilla, según el tipo de incidencia */
const ACTIONS_BY_TYPE = {
  'Pérdida de agua en vereda': ['Señalización de la zona', 'Delimitación del paso peatonal', 'Cierre de llave de paso domiciliaria', 'Consulta a vecinos', 'Registro fotográfico'],
  'Pérdida en conexión domiciliaria': ['Cierre de llave de paso domiciliaria', 'Aviso al usuario', 'Revisión del medidor', 'Señalización de la zona', 'Registro fotográfico'],
  'Posible pérdida en red distribuidora': ['Señalización de la zona', 'Delimitación del paso peatonal', 'Desvío del tránsito', 'Relevamiento de domicilios sin presión', 'Registro fotográfico'],
  'Rotura de caño': ['Señalización de la zona', 'Contención del agua', 'Aviso a vecinos del sector', 'Desvío del tránsito', 'Registro fotográfico'],
  'Baja presión': ['Medición de presión', 'Relevamiento de domicilios sin presión', 'Revisión del medidor', 'Consulta a vecinos', 'Registro fotográfico'],
  'Otro': ['Señalización de la zona', 'Consulta a vecinos', 'Registro fotográfico']
};
/* Tipos en los que la cuadrilla no puede maniobrar la red sin autorización */
const NO_MANEUVER_TYPES = ['Posible pérdida en red distribuidora', 'Rotura de caño'];

/* Cierre de la orden: motivos (lo que hoy puede significar «Resuelto» en MiAguas, pieza AE-03) y estado del servicio */
const CLOSE_REASONS = [
  ['Reparación terminada', 'tool', 'Reparada', 'ok'],
  ['Maniobra realizada', 'tap', 'Maniobra', 'ok'],
  ['Causa descartada', 'eye', 'Descartada', 'blue'],
  ['Unida a otra incidencia', 'link', 'Unida a otra', 'blue'],
  ['Derivada a otro equipo', 'escalate', 'Derivada', 'amber'],
  ['Visita sin nueva acción', 'home', 'Sin acción', 'blue']
];
const SERVICE_STATES = [
  ['ok', 'tap', 'Normal', 'ok'],
  ['gradual', 'hourglass', 'Vuelve de a poco', 'warn'],
  ['no', 'xCircle', 'Sin servicio', 'red']
];
/* Lo que lee el vecino en MiAguas cuando se valida el cierre (estado público + fundamento) */
function publicClose(r) {
  r = r || {};
  var base = {
    'Reparación terminada': 'La reparación terminó.',
    'Maniobra realizada': 'Hicimos una maniobra en la red para resolver el problema.',
    'Causa descartada': 'Revisamos el lugar y no encontramos una falla en la red.',
    'Unida a otra incidencia': 'Tu reclamo se unió a otro por el mismo problema, que sigue en curso.',
    'Derivada a otro equipo': 'Tu reclamo pasó a un equipo especializado, que sigue con el trabajo.',
    'Visita sin nueva acción': 'Visitamos el lugar y no hizo falta otra intervención.'
  }[r.outcome] || 'Cerramos la intervención.';
  var svc = { ok: ' El servicio ya está normal.', gradual: ' El servicio vuelve de a poco: la presión puede tardar hasta 2 h en normalizarse.', no: ' El servicio todavía no está normal: te vamos a avisar cuando vuelva.' }[r.service] || '';
  var open = r.service === 'no' || r.outcome === 'Unida a otra incidencia' || r.outcome === 'Derivada a otro equipo';
  return { state: open ? 'En curso' : 'Resuelto', text: base + (r.outcome === 'Unida a otra incidencia' || r.outcome === 'Derivada a otro equipo' ? '' : svc) };
}
