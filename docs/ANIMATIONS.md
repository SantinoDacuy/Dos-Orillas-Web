# Animaciones

F0: sin animación. HTML visible por defecto; sin dependencia de hover o JavaScript.

## Perfil actual F4: Hero cinematográfico

La selección expresa del 12/10/2026 sustituye el Hero de dos fotografías y su coreografía fijada. El Hero actual usa exclusivamente el video original `hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4`, optimizado como `/visuals/dos-orillas-film-mobile.mp4` (720×402, 192892 B) y `/visuals/dos-orillas-film.mp4` (1924×1076 nativos, 24 fps, 7685079 B). La versión de escritorio conserva resolución original con H.264 CRF 18 y faststart, sin escalado, recorte ni audio. Los posters del mismo video son `/visuals/hero-film-poster.webp` (1280×716, 39406 B) y `/visuals/hero-film-poster-desktop.webp` (1924×1076, 112962 B). No se incorporan las dos imágenes generadas descartadas, que permanecen fuera del repositorio.

El HTML entrega h1, filosofía, descripción y CTAs; la sección y su contenido crecen en flujo normal. No monta HeroMotion, SceneMotion, pin, parallax de puntero ni intro. El bootstrap conserva clasificación de tiers y safety 3s, pero excluye la intro cuando la variante es `film`. La distancia y las tres escenas narrativas conservan sus mejoras independientes.

Un `picture` nativo SSR eager con prioridad alta pinta el poster sin depender de la inicialización del video. Desde 1024px selecciona el poster de resolución original y su precarga usa el mismo media query; en anchos menores conserva el poster de 39406 B. La imagen sólo cede su lugar cuando el video tiene un frame decodificado. No se introduce una pieza visual distinta. El efecto de esta entrega en Lighthouse requiere la nueva medición.

El video nativo es decorativo, silenciado, en bucle y con `preload="none"`. Sólo recibe la ruta MP4 cuando el proveedor está listo, se detecta el primer paint y la imagen entra al viewport; la activación se programa en idle con timeout 1500ms. La versión móvil se elige hasta 767px. IntersectionObserver y visibilitychange pausan/reanudan al salir/entrar o esconder/mostrar la pestaña. «PAUSAR VIDEO» / «REPRODUCIR VIDEO» permite controlar la reproducción; `aria-pressed=true` significa pausado. La pausa solicitada persiste durante los cambios de visibilidad.

Tier0, reduced y sin JS conservan el poster, el copy y los enlaces completos, sin solicitar el MP4 desde esta mejora. Si el autoplay falla, el poster sigue siendo la composición válida. No hay timeline GSAP ni RAF continuo para reproducir el video; se limpian IO, observador de paint, idle/timer y listeners al cambiar tier/desmontar. La paleta inicial de Nav en la home es crema sobre navy aun antes del primer scroll; ThemeController continúa activándose al recorrer la página.

La prueba `qa-hero-film.mjs` cubre anchos 320/375/768/1024/1440/1920, texto 200%, poca altura, reduced/no JS, reproducción/pausa y cambio de preferencia. Sus 14 perfiles aprobaron el 13/10/2026, incluida la resolución de reproducción 1924×1076, selección del poster y ausencia de colisión con la etiqueta del capítulo. Readiness y shell exigen flujo natural y ausencia de intro bloqueante para esta variante. La revisión de capturas debe comprobar legibilidad sobre el video elegido; el contraste de todos sus fotogramas y la identidad geográfica no se deducen de DOM/axe. El cierre global F4 sigue pendiente de sus otros gates; los números F3 que siguen son históricos.

Las cuatro familias locales suman 92924 B en la entrega del 14/10/2026. El subset conserva las formas, métricas, ejes y caracteres del sitio, además de ASCII y español; 2299 comparaciones de contornos y 12 corpus de shaping verificaron su equivalencia. El perfil actual las declara con `@font-face` y sus métricas de fallback en `styles/fonts.css`; el layout servidor precarga sus cuatro URLs públicas mediante `ReactDOM.preload`. Esta implementación sustituye el experimento de hints con `next/font` y no altera la coreografía ni agrega fuentes. Distance, ThemeController y ScrollProgress difieren su inicio hasta scroll o IntersectionObserver, sin leer `scrollY` durante hidratación. Las cifras de 116000 B que aparecen en las entradas F3 corresponden a esos checkpoints anteriores.

## Infraestructura de movimiento

| Recurso | Intención | Disparador | Propiedades | Mobile | Reduced |
|---|---|---|---|---|---|
| Lenis | CRUZAR: continuidad de lectura | Rueda, tier 2 | Scroll nativo suavizado por RAF sincronizado | Nativo, sin Lenis | Nativo |
| RevealText | REVELAR: jerarquía | Entrada a viewport, debajo del primer frame | transform, opacity | IO + WAAPI, sin GSAP | Visible |
| ImageReveal | REVELAR: descubrimiento | Entrada al viewport | clip-path; scale en capa interna | Reveal nativo | Visible |
| ParallaxImage | ACERCAR: profundidad en una imagen protagonista | Scroll de bloque | transform | Estática para preservar presupuesto | Estática |
| Bridge | CONECTAR: unir dos orillas | Entrada al viewport | scaleX / scaleY | IO + WAAPI | Línea completa |

Demostración interna en `/motion-lab`. Controladores diferidos separados del HTML. Un error de mejora no oculta contenido. useGSAP/context revierte transforms y triggers; RAF/listeners/ticker/Lenis se destruyen. El muestreo de FPS inicia con interacción y se reinicia si cambia la visibilidad de la pestaña.

## Shell F2/F3 — registro histórico de la intro

La fila Intro y su secuencia describen el diseño anterior. La variante cinematográfica actual no la monta; menú, Nav, rail, cursor y footer siguen disponiendo de sus propias mejoras.

| Shell F2 | Intención | Disparador | Propiedades | Mobile | Reduced |
|---|---|---|---|---|---|
| Intro | CONECTAR: dos trazos se encuentran | Primera visita de sesión | scaleX, translateY, opacity | Banda inferior 20svh, status, scroll/foco disponibles y botón para omitir | Omitida |
| Menú | REVELAR: acceder a capítulos | Botón real | clip-path, transform, opacity | Dialog nativo, trap y Esc | Fade ≤200ms |
| Navbar | REVELAR: orientar durante lectura | Sentinel 80px mediante IO / capítulo | transform, opacity | Compacta | Cambio inmediato |
| Rail | CRUZAR: acompañar recorrido | Scroll | scaleY / scaleX | Línea horizontal | Sólo marcas |
| Cursor | REVELAR: affordance de links | Puntero fino | transform, opacity | Desactivado | Desactivado |
| Footer cortina | REVELAR: cierre | Sentinel visible | transform, opacity, scroll nativo | Flujo normal | Flujo normal |

Footer inerte y oculto mientras queda detrás de main. Se usa flujo normal si el footer no cabe en el viewport, incluyendo zoom. La cortina reserva padding en el shell: así no colapsa un margen ni entra antes de tiempo. Main no se transforma para preservar los pins. El menú atenúa mediante backdrop y posee cierre manual del ciclo de Tab además del dialog nativo. En F3, la intro corría una única vez por sesión: head reservaba el overlay y la sesión. Su última activación esperaba first-contentful-paint buffered y, en full, el botón de omitir visible y enfocado. Dos RAF presentaban el comienzo de `do-intro-animate`; sin PerformanceObserver de paint se conservaba ese fallback. Sus0,8s se contaban desde esa activación, con un safety 3s desde head que podía interrumpir un arranque tardío. Escape, omitir y timeout cancelaban RAF/timers y retiraban ambas clases. La banda móvil mantenía la secuencia y desktop usaba un diálogo modal. Esta intro queda reemplazada por la composición cinematográfica. Fondo/navbar cambian por umbral; no se interpola una superficie grande por frame. El SVG oficial del footer se descarga al acercarse a 100px del viewport, con su caja reservada y alternativa noscript.

El foco de la intro desktop espera al botón de omitir visible si React streaming todavía lo mantiene fuera del DOM presentado. Un MutationObserver de vida corta reintenta sólo con la intro activa, tier 2 y sin menú abierto; se desconecta al enfocar o cerrar. Una mutación posterior al cierre no vuelve a tomar el foco.

El sentinel de compactación de Nav ocupa 1×1px a 80px del shell, fuera del hit testing y del árbol accesible. IntersectionObserver aporta la posición ya calculada por el navegador (`threshold:1`); la compactación depende de que su top cruce cero y evita repetir la misma escritura. El listener de capítulos se conserva. Se retira el lector síncrono de scrollY y su RAF de scroll; la QA final F3 aprobó, incluido umbral y recarga. Lighthouse F3 cumple los presupuestos sobre la misma compilación, sin atribuir una mejora aislada a Nav.

La mejora Lenis se descarga al primer scroll nativo de tier 2, sin interceptar ese primer movimiento. Se cancela su carga pendiente y se destruyen sus listeners al reducir el movimiento o desmontar.

Si el safety de arranque se dispara antes de confirmar readiness, se conserva tier 0 también después de una hidratación tardía: sin pins, Lenis ni cambios automáticos de composición. El usuario puede reactivar la mejora desde «Movimiento completo», con preferencia del sistema y Save-Data siempre autoritativos. Al reducir o reactivar, el proveedor sincroniza tanto el tier como la clase CSS.

## Escenas F3 — Hero anterior y La distancia

Las filas Hero documentan la coreografía histórica, reemplazada en F4. La distancia conserva el relato tipográfico y la mejora de scroll descritos aquí. Las reservas sticky350svh/190svh del Hero anterior no aplican a la variante `film` en flujo normal.

| Escena / recurso | Intención | Disparador | Propiedades | Tier 1 | Reduced / sin JS |
|---|---|---|---|---|---|
| Hero: fotos y palabras | SEPARAR → ACERCAR: negocio y solución se encuentran | Scroll reversible, 250% en desktop | x/y, scale, opacity | Sticky nativo; acercamiento vertical en <768 y horizontal en tablet/lite | Fotos juntas, título y frase completos |
| Hero: horizonte y costura | CONECTAR: la línea organiza y une | Beats .20 y .55 | scaleX, scaleY | Líneas con la misma intención | Sin líneas superpuestas al contenido |
| Hero: filosofía | ENTENDER → HACER: dos pasos de trabajo | Beats .35 y .60 | y, opacity | Frases legibles, CTAs siempre presentes | Texto completo y estático |
| Hero: profundidad de puntero | ACERCAR: dos capas responden en sentidos opuestos | Puntero dentro del escenario, sólo full | x/y en wrapper independiente, ±6px | Desactivado | Desactivado |
| Hero: CTAs y salida | CRUZAR: dar lugar al siguiente capítulo | Beat .30 y salida .82 | autoAlpha, yPercent, opacity | CTAs conservan foco y progreso | Enlaces nativos visibles |
| Distance: mundos tipográficos | ACERCAR: reducir la distancia real entre negocio y tecnología | Scroll reversible, 300% desktop | x/y, scale en padres y spans | Vertical en móvil; fila horizontal desde768 | Fila final con cota en desktop; lectura natural móvil |
| Distance: cota y puente | CONECTAR: una línea comunica el vínculo | .18–.62 y .72 | scaleX/scaleY, x/y | Cota vertical en móvil | Línea completa decorativa |
| Distance: conclusión y frases | REVELAR: explicar el criterio del estudio | .72–1.0 | y, opacity | Tres frases secuenciales | Todas visibles en flujo |

El primer scroll nativo inicia la carga diferida. CSS reserva350svh y400svh en full y mantiene stages sticky antes de GSAP; pinSpacing:false conserva esa reserva al montar. Tier1 usa 190/210svh en Hero y220svh en Distance, sin pin JS. La geometría de la fila y su cota se cachea al montar/refresh: baseline real, anchos, gap y offsets; ninguna lectura de layout en onUpdate.

Altura insuficiente o texto ampliado que colisiona activa una composición en flujo: todos los bloques se conservan, sin recortes ni escena fijada. El guard también verifica el ancho del título y los límites de la frase dentro del escenario, sólo durante setup/resize. El fallback de poca altura existe también en CSS antes de hidratar. Import fallido activa el mismo fallback local. Reduced evita importar timelines y conserva HTML completo; el Hero estático usa flujo normal en todos los anchos, también sin JavaScript. AbortSignal impide montar un contexto obsoleto; montajes parciales se revierten si fallan. Contextos, listeners, RAF, observers, quickTo y will-change se limpian al cambiar de tier/desmontar.

En full, el foco en un CTA del Hero vuelve al comienzo para mostrarlo cuando el scroll lo hubiera retirado. En tier 1 los CTAs permanecen visibles y no retroceden la lectura. `.hero-camera` usa `pointer-events:none` para excluir la capa transparente del hit testing sobre esos enlaces; el listener de profundidad de puntero sigue en `.hero-stage`. La QA final F3 confirmó clic nativo y estabilidad en los tres escenarios de readiness a CPU 4× (31 checks), incluido móvil con scripts retrasados 4200ms; shell, 89 checks / 7 escenarios / 13 capturas; fase, 77 checks / 37 capturas; escenas adicionales, 351 checks / 10 escenarios / 64 capturas. Todas las suites aprobaron sobre las fuentes corregidas, con registros del 10/10/2026, 02:57–02:59 UTC. Lighthouse F3 cumple los presupuestos originales. El usuario aprobó continuar desde F3 el 10/10/2026; F4 integra Manifiesto, Soluciones y Proceso; su verificación se registra en esta documentación. El orden semántico es h1 → filosofía → subtexto/CTAs; las fotos reales conservarán sus alternativas cuando se aporten. Los marcos actuales son placeholders sin nombres técnicos en producción.

Bricolage conserva el WOFF2 público, pesos 200–800, `display:swap` y métricas del fallback. Su `@font-face` comparte URL con el único enlace emitido mediante `ReactDOM.preload` desde el layout servidor. Las cuatro fuentes siguen sumando 116000 B; no se reemplazaron diseños ni se redujeron pesos. Esta corrección de descubrimiento no cambia la coreografía. La QA funcional final usa Chrome instalado 154.0.8037.99; Lighthouse usa Chrome Headless Shell 156.0.8078.4 sobre la misma compilación.

## Escenas F4

Implementación integrada; los resultados funcionales y Lighthouse de F4 se registrarán después de verificar esta compilación. Los pases históricos F3 no certifican las escenas nuevas.

| Escena / intención | Disparador | Full DOM | Lite / móvil | Reduced / sin JS |
|---|---|---|---|---|
| Manifiesto · REVELAR | Primera afirmación al 85%; segunda al 65%, después del tachado | Máscaras por líneas, primera composición sticky y pausa de 65svh | Reveals IO + WAAPI; lectura en flujo, foto entre afirmaciones | Afirmaciones y descripción completas |
| Manifiesto · CONECTAR | Cierre de la pausa | Bridge de 2px desde el centro sobre «PORQUE SÍ.»; palabras de cierre con scrub | Bridge nativo; palabras con reveal breve | Tachado estático |
| Manifiesto · foto | Entrada al 85% y recorrido de la imagen real | Máscara desde abajo, zoom 1,06→1 y parallax −15→+15% | Foto 4:5 al 70%, a la derecha; parallax nativo ±3% | Foto estática; marco editorial si falta |
| Soluciones · REVELAR | Filas al 80%; hover/foco en puntero fino | Hairline, nombre en máscara y número; nombre crece 1,03, línea ±8%; preview acompaña parcialmente el puntero | Acordeón nativo, una fila abierta como máximo; foto dentro del panel | Cuatro descripciones expandidas |
| Soluciones · CONECTAR | Recorrido de la lista y su cierre | Bridge vertical de IA con marcas; línea final se extiende hasta enlazar Proceso | Líneas y marcas adaptadas a la lista vertical | Conectores completos decorativos |
| Proceso · CRUZAR / CONECTAR | Scroll de la sección | Track horizontal con pin; cuatro diagramas, contador y progreso sincronizados | Lista vertical; progreso nativo y contador por etapa | Cuatro pasos en flujo, sin pin ni import de timelines |

Manifiesto conserva composición crema asimétrica, segunda afirmación con indentación de dos columnas y «MEJORAR ALGO.» en Instrument Serif itálica con acento. La foto vertical ocupa la columna derecha en escritorio y no pasa detrás del texto. Sólo una foto real activa reveal/parallax; el marco pendiente queda estático. Un viewport bajo o una primera composición que no cabe desactiva sticky y mantiene lectura natural. Los módulos de movimiento se solicitan después del primer scroll nativo y al acercarse a la sección; el Manifiesto lite utiliza WAAPI/IO sin descargar GSAP.

Soluciones entrega títulos y descripciones en HTML. Los botones sólo se habilitan y los paneles sólo se colapsan después de conectar sus handlers. `aria-expanded`, `aria-controls`, `aria-hidden` e `inert` reflejan el acordeón; Enter/Espacio usa el clic nativo y Flechas/Home/End llevan el foco a una fila visible. Hover y foco ofrecen el mismo énfasis; Escape retira el preview manteniendo el foco. En tier 0 y sin JavaScript todo permanece expandido. Las imágenes de preview son un complemento; las cuatro fotografías siguen siendo opcionales y no se inventan. El preview queda debajo de títulos y descripciones, con una superficie opaca detrás del texto para preservar lectura y contraste también cuando se aporten imágenes reales.

Tier1 de Soluciones usa IO/WAAPI sin GSAP ni ScrollTrigger: revela líneas/números decorativos y cierre de IA, mantiene los nombres y descripciones legibles, y dibuja Bridge con geometría cacheada. El acordeón y sus estados accesibles conservan el mismo controlador. `transitionend` y el fallback400ms agrupan la medición de alturas; resize/RO se mide tras asentarse. La rama full conserva el runtime GSAP. Las tres secciones narrativas lite pueden omitir el layout distante hasta su aproximación; `data-narrative-layout-ready` desactiva CV antes de medir. Hash inicial, Tab/enlaces, pantallas bajas, full, reduced y no-JS mantienen geometría normal.

Proceso conserva una lista ordenada semántica. El recorrido horizontal se activa sólo desde 1024px, con altura suficiente y paneles que caben; su distancia se calcula a partir del ancho real del track. Un viewport bajo o texto que excede el escenario recupera flujo normal. El foco en un paso horizontal desplaza el recorrido hasta ese panel; en móvil y estático el navegador recorre la lista vertical. El contador se escribe sólo al cambiar la etapa más cercana al centro, sin actualizar estado React por frame. Los SVG son diagramas abstractos decorativos de separar, pensar, construir y conectar; no son screenshots de proyectos. MotionPathPlugin se solicita únicamente para el recorrido horizontal cercano.

La cadena Bridge parte del cierre de Soluciones, continúa en la entrada y progreso de Proceso y termina en su línea de salida. Contextos, timelines, observers, listeners, RAF, animaciones nativas y estilos temporales se revierten al cambiar tier o desmontar; AbortSignal descarta cargas obsoletas. HTML visible, flujo reducido y fallbacks de importación preceden a la mejora.

Los pasos horizontales inactivos conservan opacidad mínima .68 para mantener AA: numeral azul 3,57:1 y descripción 5,24:1 sobre navy. Las pequeñas marcas futuras usan crema al 68% (6,86:1). El track completo declara su fondo navy, incluido el contenido fuera del encuadre recortado; así la herramienta de contraste evalúa el mismo fondo al desplazarse. En Soluciones se atenúan las líneas decorativas, mientras los números usan el token muted y las descripciones un color AA, sin reducir la opacidad de sus superficies de lectura.

F4: las palabras del Manifiesto conservan opacidad mínima .65 durante la lectura progresiva, tanto en full como en lite. La variación hasta 1 mantiene jerarquía sin dejar el párrafo bajo contraste AA. Los estilos exclusivos del track horizontal y preview full se solicitan con sus runtimes.

El Hero cinematográfico no reserva overlay ni solicita una introducción. La QA conserva CPU 4×, los tiempos reales de carga, el retraso de scripts 4200ms y la recuperación del movimiento; el cambio de variante sólo sustituye las expectativas propias de la intro por lectura/foco/rueda en flujo natural. El safety 3s del proveedor continúa protegiendo la entrega estática.

Los estilos de detalle narrativo se generan desde las tres hojas canónicas en un CSS externo con versión SHA. El CSS crítico conserva geometría y CV. Sin JS el enlace noscript aplica la hoja completa; full/reduced/hash/restore la activan inmediatamente. La visita nueva lite alta difiere activación hasta un idle tras FCP o la primera interacción capturada, con safety 3s. Resize se escucha después de FCP, sin leer dimensiones durante el parseo inicial; scroll en 0 no adelanta esa activación. La carga del archivo emite refresh y el fallback React activa todos los enlaces nuevos al navegar para no depender del estado de una página cacheada. Un hash inicial o clic interno pendiente se vuelve a alinear tras la hoja y la carga del documento, con dos RAF; rueda, touch, pointerdown o teclas de navegación posteriores cancelan esa reparación. El hash y destino actual deben seguir coincidiendo. Esto no cambia las timelines ni añade un fetch de fuente. La QA dedicada conserva descargas lentas y navegación real antes del cierre.

El colapso inicial del acordeón se aplica sin transición; las transiciones de interacción se habilitan después de dos frames. La señal de Soluciones lista permite reparar una vez la geometría de un hash pendiente, siempre cancelable por gesto y excluyendo Back/Forward. Con tier 0 o `prefers-reduced-motion`, la hoja generada declara `transition-property:none` en las tres escenas narrativas y sus descendientes: tampoco transiciona la tipografía al llegar el CSS diferido. Los 6 escenarios de entrega de estilos aprobaron el 13/10/2026; esta comprobación no sustituye Lighthouse ni la QA completa de layout.

## F5–F8 — proyectos y cierre integrados

El carrusel adapta las referencias del usuario mediante un arco finito CSS 3D. Su intención es CRUZAR / DESCUBRIR: recorrer los proyectos reales con profundidad y una portada protagonista. Flechas, indicadores y gesto horizontal eligen la tarjeta; el scroll vertical y el zoom continúan nativos. No tiene autoplay ni pin. Movimiento reducido, no-JS, poca altura y texto que no cabe recuperan la lista completa. La tarjeta activa conserva foco y accesibilidad; las otras quedan inertes. La grilla conserva enlaces nativos a todos los proyectos. No se añaden Three/WebGL ni contenido de las demos.

Las posiciones del arco se calculan al montar o cambiar su geometría, sin trigonometría ni mediciones por frame. Las sombras y los controles pequeños de vidrio quedan estáticos. Cambiar una tarjeta anima transforms/opacity; el anuncio accesible se emite sólo para cambios manuales. La galería conserva una composición de doce columnas en escritorio y alterna ancho/alineación en móvil; las leyendas de los esquemas conceptuales crecen en flujo con el texto.

Al abrir un caso, React 19.3 empareja exclusivamente la portada elegida mediante un nombre único. Las demás portadas no participan de una captura. El contenido de página conserva un Fragment con clave de ruta para mantener el DOM durante la hidratación y los cambios de preferencia de movimiento. La mejora de portada se activa en la acción real de navegación. Navegadores sin la API usan una copia decorativa inerte y Flip diferido; otras rutas usan una cortina de marca. Movimiento reducido conserva navegación directa. Las operaciones disponen de cancelación, watchdog y limpieza; los clics modificados conservan comportamiento nativo.

La vuelta guarda la portada de origen de forma semántica. Tras volver, restaura posición/foco y observa cambios reales de geometría causados por escenas diferidas; rueda, touch, pointer o teclado cancelan inmediatamente la reparación. El timeout sólo limpia observadores y no provoca scroll tardío. Los SVG y sus referencias usan IDs únicos por ubicación y ruta.

El estudio revela líneas y conserva una columna de lectura sticky cuando cabe. Equipo presenta a Santino y Tobías con dos composiciones relacionadas por una costura; las fotos ausentes se sustituyen por iniciales, sin retratos ficticios. Herramientas muestra lista semántica y permite un marquee decorativo en el perfil adecuado. El cierre destaca «HABLEMOS.» y extiende una línea hasta la invitación al contacto. Texto y enlaces permanecen legibles antes de cualquier mejora.

Los controladores de narrativa, proyectos, separador y editorial se importan tras scroll, hash/restauración o foco real. En móvil alto, las secciones alejadas pueden usar `content-visibility:auto` con estimaciones de altura; se desbloquean antes de medir, ante Tab/enlaces y al aproximarse. Altura corta, reduced/no-JS y destinos por hash conservan flujo natural. Cada controlador limpia sus observers, listeners, RAF, contextos y estilos temporales al cambiar tier o desmontarse.

El formulario anima sólo líneas de foco, progreso y confirmación. Sus estados accesibles y validación no dependen del movimiento. La lógica de envío se solicita al enfocar o enviar; un fallo conserva campos y alternativa por email. Reduced elimina animaciones de carga/éxito. Las comprobaciones y sus fechas se registran en `DECISIONS.md`; esta descripción no sustituye los gates de rendimiento ni acredita publicación.
