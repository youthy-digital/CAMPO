# CAMPO · Gestión de incidencias

Prototipo navegable de CAMPO para Aguas del Este. Muestra en una misma pantalla los dos lados del caso #0248:

- **Izquierda:** el celular del encargado de la cuadrilla (campo).
- **Derecha:** el escritorio de Operaciones en la central (con la vista de Supervisión).

Todo funciona en el navegador, sin servidor: datos ficticios, conexión, sincronización y asistente de IA simulados.

## Cómo se usa en una presentación

- **Inicio del celular:** muestra la ruta del día (orden actual, la que sigue y las siguientes).
- **Menú del celular (☰):** accesos a la orden actual, Chat, Asistente, Historial y Criterios.
- **Chat de la orden:** la cuadrilla completa «Registrar cambio» (tipo, qué ve, domicilios, urgencia, fotos) y el cambio llega a Operaciones como una tarjeta en el chat; también puede escribir mensajes libres. Operaciones responde desde el escritorio y, si hace falta, fija la prioridad y lo que autoriza. La flecha del chat vuelve a la pantalla desde donde se abrió.
- **Chat de Operaciones:** en el menú lateral del escritorio hay una sección Chat con las conversaciones de cada cuadrilla. Cuando llega un mensaje sin leer aparece un punto rojo, que se va al abrir esa conversación.
- **Cortar o recuperar la señal del celular:** tocar el ícono de wifi de la barra de estado del celular o el indicador «Conectado / Sin señal». Sin señal, los mensajes quedan en el celular y salen al sincronizar.
- **Volver al inicio:** abrir la dirección con `#reiniciar` al final, o apretar `Alt + Shift + R`. El avance queda guardado en el navegador aunque se recargue la página.

## Estructura

- `index.html` · la app publicada (un solo archivo).
- `vercel.json` · configuración de Vercel (sitio estático, sin build).
- `source/` · archivos fuente. Para regenerar `index.html`: `python3 source/build.py`.
