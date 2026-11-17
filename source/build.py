"""Arma ../index.html (versión de presentación) a partir de los archivos de esta carpeta."""
import pathlib
here = pathlib.Path(__file__).parent
css = (here / 'styles.css').read_text()
js = '\n'.join((here / f).read_text() for f in ['data.js', 'icons.js', 'app.js'])
html = f'''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CAMPO · Gestión de incidencias</title>
<meta name="description" content="CAMPO · gestión de incidencias en campo para Aguas del Este: la cuadrilla y Operaciones trabajando sobre el mismo caso, con o sin conexión.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2.8s-6.4 7-6.4 11.8a6.4 6.4 0 0 0 12.8 0C18.4 9.8 12 2.8 12 2.8z' fill='%231f5fae'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
{css}
</style>
</head>
<body>
<div id="app"></div>
<div id="toasts" class="toasts" aria-live="polite"></div>
<div id="modal"></div>
<script>window.CAMPO_PRES = true;</script>
<script>
{js}
</script>
</body>
</html>
'''
(here.parent / 'index.html').write_text(html)
print('index.html', len(html))
