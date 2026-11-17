# CAMPO · Gestión de incidencias

Prototipo navegable de CAMPO para Aguas del Este. Muestra en una misma pantalla los dos lados del caso #0248:

- **Izquierda:** el celular del encargado de la cuadrilla (campo).
- **Derecha:** el escritorio de Operaciones en la central (con la vista de Supervisión).

Todo funciona en el navegador, sin servidor: datos ficticios, conexión, sincronización y asistente de IA simulados.

## Cómo se usa en una presentación

- **Cortar o recuperar la señal del celular:** tocar el ícono de wifi de la barra de estado del celular o el indicador «Conectado / Sin señal».
- **Volver al inicio:** abrir la dirección con `#reiniciar` al final, o apretar `Alt + Shift + R`. El avance queda guardado en el navegador aunque se recargue la página.

## Estructura

- `index.html` · la app publicada (un solo archivo).
- `vercel.json` · configuración de Vercel (sitio estático, sin build).
- `source/` · archivos fuente. Para regenerar `index.html`: `python3 source/build.py`.
