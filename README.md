# David & Pamela — Cena de despedida

Fase 3 sobre el proyecto existente: RSVP mediante WhatsApp. HTML, CSS y JavaScript nativo, recursos locales y rutas relativas compatibles con GitHub Pages. No se ha publicado.

## Abrir localmente

Desde la carpeta del proyecto:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Abrir **http://127.0.0.1:8000/**. El sobre es la pantalla inicial; se abre desde el sello o el botón. Detener el servidor con `Ctrl+C`. Se recomienda HTTP local para los símbolos SVG externos.

## Diseño y composición

La autoridad visual es `referencias/diseno_objetivo.png`. Sus secciones se recrearon como componentes reales: sobre independiente, franja de recuerdos, título y nombres centrados, contador, mesa, pasajes y panel celeste de cena. El encuentro, el RSVP existente y el cierre completan la experiencia. La maqueta completa no se carga como fondo del sitio.

Se conservan exactamente los **47 colores Midnight Soirée**, definidos en `css/styles.css`, y Playfair Display / Inter locales. Los degradados y transparencias se componen desde esos tokens. Las flores son ornamentos SVG discretos; no pretenden sustituir fotografías.

La apertura separa sello, solapa y tarjeta. El hero comienza a aparecer a los 460 ms y la cubierta se oculta a los 920 ms. La raíz, `#inicio` y `#contenido` presentan el sobre al cargar; los enlaces a secciones visibles permiten entrar directamente. No existe almacenamiento de apertura. Enter abre, Escape salta la secuencia y Tab recorre los dos botones. El nombre de marca permite reabrirla.

El carrusel muestra varias fotos en escritorio y una foto dominante con parte de la siguiente en móvil. Conserva el formato de las fotografías, con una máscara inferior y un velo azul para el texto. Tiene anterior/siguiente, seis indicadores, teclado y pausa. Las copias visuales de ambos extremos son inertes y están ocultas a lectores de pantalla. El movimiento usa una animación WAAPI infinita; no genera estilos inline. Solo hay un temporizador para actualizar la posición del indicador. La interacción manual pausa la reproducción; se puede reanudar. También se pausa sobre las fotos, en controles enfocados, fuera de pantalla, al ocultar la pestaña, con la pausa global y mientras está abierto el sobre o el diálogo del QR.

Los títulos, los pasajes completos, la mesa, el panel de cena y el cierre tienen entradas diferenciadas. La preferencia del sistema o `motion.reducedMotion: true` elimina el desplazamiento automático y mantiene disponibles los controles manuales y todo el contenido.

## Recursos fotográficos

No estaban disponibles las seis fotografías individuales indicadas en el encargo. Se recuperaron del recurso real suministrado `referencias/collage_vertical_original.png` mediante recortes deterministas, sin IA, filtros, ajustes de color ni redimensionado:

- `assets/images/recuerdo_01_grupo.png`
- `assets/images/recuerdo_02_trajes.png`
- `assets/images/recuerdo_03_regalo.png`
- `assets/images/recuerdo_04_david_pamela.png`
- `assets/images/recuerdo_05_baile.png`
- `assets/images/recuerdo_06_amigos.png`

Cada recorte mide **450 × 533 px** y conserva sus píxeles de origen. Los originales y la fotografía anterior se mantienen intactos en disco.

`assets/images/mesa_ambiente_provisional.png` es un recorte de **642 × 199 px** de la fotografía de mesa en la maqueta aprobada, coordenadas `(480, 779, 1122, 978)`. Se presenta a un ancho máximo de 642 px. Es provisional; una fuente de mayor resolución mejorará su definición.

El QR actual está en **`assets/images/qr_mejorado.png`** (424 × 414 px). Se carga desde `payment.qrImage`. La imagen anterior `qr.jpeg` se conserva en disco. Se muestra completo junto al texto en escritorio y debajo en móvil, sin recorte, filtros, deformación ni modificación del archivo.

## Datos editables

La configuración está en **`js/config.js`**:

| Campo | Uso |
| --- | --- |
| `couple` | David y Pamela; separador visual ` & `. |
| `event.date`, `event.time`, `event.venue` | `2026-11-15`, `17:00`, Salón Buganvillas y el enlace de Google Maps proporcionado. La dirección postal queda sin inventar. |
| `event.dateLabel`, `event.timeLabel` | Domingo 15 noviembre 2026 y 17:00 hrs. Zona: America/La_Paz. |
| `contact.whatsappNumber` | Número oficial del organizador, en formato internacional sin `+`. Única fuente del destinatario del enlace de WhatsApp. |
| `images` | Las seis fotos, sus textos alternativos y la mesa. |
| `carousel.secondsPerSlide` | Velocidad: 6 segundos por fotografía. |
| `payment.price`, `payment.currency` | 20 Bs por plato. |
| `payment.qrImage` | `./assets/images/qr_mejorado.png`, imagen íntegra proporcionada. |
| `countdown.targetDate` | `2026-11-15T17:00:00-04:00`, equivalente a las 21:00 UTC. Cuenta regresiva real activa. |
| `motion.reducedMotion` | `null` respeta el sistema; `true` fuerza movimiento reducido. |
| `features` | Visibilidad de las secciones y controles existentes. |
| `rsvp.maxCompanions` | Máximo de acompañantes, de 0 a 20; se conserva 4. El selector muestra el total incluido el invitado: de 1 a 5 personas. |
| `copy` | Textos editables y ambos pasajes completos. |

El QR se amplía en un diálogo nativo y «Guardar imagen» apunta al mismo archivo original. Con el QR actual se comprobó la visualización completa a 390 y 1440 px, la ampliación, el cierre con Escape, la decodificación local y que la descarga conserva los mismos bytes. No se hizo ningún pago ni se afirma una verificación bancaria.

El precio informa el costo por plato. No afirma un cobro automático de 20 Bs; el importe puede requerir entrada manual en la aplicación bancaria. Esta página no verifica pagos.

Los pasajes son **Proverbios 17:17** y **Filipenses 2:1**, literalmente como fueron proporcionados. No se utiliza Romanos 12:10 ni el pasaje anterior de Proverbios 3:32.

## Funcionalidad conservada

El contador rechaza objetivos inválidos o ambiguos y no usa números ficticios. El sobre, el carrusel, el contador, los datos del evento y el QR no se modificaron para esta integración. La página no confirma pagos.

## Confirmar por WhatsApp

El formulario existente pide nombre y apellido y una respuesta afirmativa o negativa. Al elegir sí, exige el total de asistentes, incluido el invitado, hasta `rsvp.maxCompanions + 1`. Al elegir no, oculta y vacía la cantidad; el mensaje negativo no incluye asistentes. No se pide teléfono ni comentario adicional.

«Revisar mi respuesta» valida los campos y prepara una vista previa. Si se corrigen los datos, el mensaje y el enlace se actualizan; si quedan incompletos, se oculta la vista previa hasta corregirlos. Los mensajes toman los nombres de la pareja, fecha, hora y lugar de la configuración.

«Enviar respuesta por WhatsApp» sigue un enlace nativo `https://wa.me/…?text=…`, generado con el contacto centralizado y `encodeURIComponent()`. **El invitado debe presionar Enviar dentro de WhatsApp.** La página solo prepara el borrador: no envía automáticamente, no registra la asistencia ni puede verificar el envío o la apertura de una aplicación externa. Los campos se conservan al volver a la página.

«Copiar mensaje» permanece disponible si el enlace no abre WhatsApp. Si el navegador rechaza el portapapeles o no lo ofrece, aparece un campo de solo lectura con el mensaje seleccionado para copiarlo manualmente. No se guardan nombres en almacenamiento local, cookies ni servicios externos; una recarga inicia un formulario nuevo.

Para probar manualmente: abrir el sitio local, ir a «Acompáñanos», introducir un nombre de prueba, elegir sí y un total, revisar el mensaje y editar el nombre para comprobar su actualización. Alternar a no para verificar que desaparezca la cantidad. Probar «Copiar mensaje» y luego abrir WhatsApp sin enviar el borrador si solo se desea verificar la integración.

Se aplicaron las cuatro skills solicitadas: UI UX Pro Max para foco y tamaños táctiles; Apple Design para respuesta inmediata y continuidad de la apertura; Impeccable para jerarquía, composición y revisión; Taste para las fotografías reales, bordes comunes y microinteracciones. La referencia y el encargo prevalecen sobre sus reglas corporativas incompatibles con un carrusel, revelados o esta paleta.

## Validación y archivos

Los resultados y capturas de revisión se guardan fuera del proyecto, en `fase2c-review` dentro de la carpeta de visualizaciones de esta conversación. Allí también están `antes-fase2c.zip`, el manifiesto de recortes y los informes estáticos.

Los archivos cambiados en esta fase son `index.html`, los tres CSS, `js/config.js`, `js/main.js`, `js/animations.js`, `assets/icons/icons.svg`, los siete PNG anteriores y este README. Se añadieron `js/carousel.js` y `js/payment.js`. Se mantiene la arquitectura sin frameworks ni compilación.

El linter de Taste no encontró FAIL; conserva un aviso sobre la exclamación de la respuesta afirmativa del RSVP. Impeccable es un detector orientativo, no una certificación: las advertencias sobre serif cursiva, Inter y resplandor azul se juzgan contra la referencia aprobada. Los contenedores reales y sus márgenes se verifican en navegador.

### Pruebas ejecutadas

- Navegador real a **360, 390, 430, 768 y 1440 px**, sin desplazamiento horizontal; apertura adicional a **360 × 640 px**.
- Comparación visual con la referencia: sobre, hero, nombres, contador, mesa, dos columnas de pasajes, panel de cena, RSVP y cierre.
- Avance automático observado durante **160 s**, más de cuatro períodos completos; controles anterior/siguiente, indicadores, Home/End y pausa/reanudación comprobados.
- Apertura desde sello y botón, Enter, Escape, ciclo de foco y entrada con `#inicio`; enlaces profundos a las secciones.
- RSVP con campos vacíos, respuesta afirmativa y dos acompañantes, respuesta negativa y restablecimiento. Solo vista previa; recargar limpia los campos.
- Movimiento reducido probado mediante `motion.reducedMotion: true`, sin modificar la preferencia del sistema: sobre presente, controles manuales disponibles y contenido visible. Se restauró `null`.
- Consola final sin errores ni advertencias. Sin imágenes rotas ni estilos inline de la aplicación. Sintaxis CSS/JS, IDs, anclas y recursos locales comprobados.
- Los 47 tokens, los originales y la lógica de RSVP/contador se compararon con la copia anterior. Recortes verificados píxel por píxel contra sus fuentes.

### Actualización de datos reales

Se verificaron fecha, hora y lugar en el navegador, apertura del enlace proporcionado en Google Maps, contador activo y correspondencia con el instante real de Bolivia. El QR conserva su proporción, resolución original y bytes. El cálculo, pausa al ocultar la pestaña, recálculo al volver e intervalo único del contador también pasaron las pruebas del controlador. El diseño, la apertura, el carrusel y el RSVP permanecen intactos.

### Fase 3: validación de WhatsApp

Se modificaron únicamente `index.html`, `js/config.js`, `js/rsvp.js`, `css/styles.css` y este README. Se actualizaron las versiones de carga de los tres recursos editados para evitar su caché anterior.

- Controlador: 17 escenarios y 167 aserciones, incluidos campos vacíos, total de 1 a 5, cambios sí/no, edición de la vista previa, tildes y saltos de línea, destinatario único, límites especiales y copia con portapapeles disponible, denegado o ausente. Estas pruebas no realizan solicitudes externas.
- Navegador: 360, 390, 430, 768 y 1440 px; controles sin desbordamiento, revisión y apertura mediante Enter, copia exacta, recarga que limpia el formulario y consola sin errores ni advertencias.
- El enlace generado llegó a la página oficial de WhatsApp con un nombre ficticio, el destinatario correcto y el mensaje preparado. No se pulsó Enviar ni se enviaron mensajes al organizador. En el navegador integrado se comprobó el intento de apertura y la copia siempre disponible; una página no puede detectar de forma fiable si otra aplicación llegó a abrirse.
- Los 31 archivos protegidos conservaron sus hashes. La raíz siguió mostrando el sobre cerrado y su apertura terminó en el hero. Los informes y capturas están fuera del proyecto, en `whatsapp-rsvp` dentro de las visualizaciones de esta conversación.

## Pendientes reales

- Imagen de la mesa con mejor resolución.
- Prueba manual de la apertura en un teléfono con WhatsApp instalado; el envío depende del invitado.
- Publicación cuando se autorice.
