# Decisiones — Dos Orillas

## Alcance

F0–F3 completaron sus comprobaciones y el usuario autorizó la continuidad el 10/10/2026. La versión local integra F4–F8: narrativa, Hero cinematográfico elegido, carrusel CSS 3D y grilla, índice/casos, estudio/equipo/cierre/contacto y SEO. Los resultados vigentes se registran al final de este documento; las entradas anteriores describen su estado en la fecha indicada. La revisión final conserva los presupuestos del pedido. El 14/10/2026 el usuario indicó no publicar todavía y pidió un ZIP completo para abrirlo en su IDE: ésa es la entrega actual. F9/publicación queda para más adelante y F10 es opcional.

Las entradas y métricas F0–F3 y los diagnósticos previos al cambio de Hero son un registro histórico de aquellas compilaciones. Las frases sobre revisión pendiente en la entrega F3 deben leerse con la autorización posterior documentada abajo. Ningún pase anterior certifica la variante cinematográfica actual.

| Decisión | Alternativas | Motivo |
|---|---|---|
| Next.js App Router, TypeScript estricto, Tailwind v4, GSAP + Lenis | Sites / otro framework | El pedido elige explícitamente Next y Vercel. |
| SVG oficiales copiados sin cambios | Reconstrucción tipográfica | Preservar identidad; prohibido redibujar logo. |
| Placeholders editoriales para fotos faltantes | Stock / fotos generadas | No presentar fotos ajenas o inventadas como el estudio. |
| Tier 3 deshabilitado hasta F10 | WebGL inicial | El DOM conserva la narrativa sin carga WebGL. |
| Preview local sin indexación | Publicación prematura | Publicación en F9; dominio/plan/cuenta faltantes. |
| Resend y fallback mailto previstos F7 | Otros proveedores | Default autorizado por prompt; no inventar envío real. |

## Fuentes técnicas consultadas

- https://nextjs.org/docs/app/getting-started/installation
- https://gsap.com/docs/v3/Installation/
- [Lighthouse con Puppeteer](https://github.com/GoogleChrome/lighthouse/blob/main/docs/puppeteer.md): su guía recomienda evitar el viewport predeterminado de 800×600.
- [Emulación de Lighthouse](https://github.com/GoogleChrome/lighthouse/blob/main/docs/emulation.md): el perfil mobile/desktop es distinto del tamaño de la ventana del navegador.
- Versiones verificadas en registro npm: Next 16.4.0, GSAP 3.15.0, Lenis 1.3.26.

## Verificación por fase

Los informes reales se agregan al cierre de cada fase. No se declaran métricas sin medición.

## Contraste de temas

Ratios WCAG calculados con luminancia sRGB, texto opaco y los tokens reales:

| Tema | Texto/fondo | Ratio texto | Ratio acento/fondo |
|---|---|---|---|
| cream | #111111 / #F2EEE6 | 16,32:1 | 7,39:1 |
| white | #111111 / #FAF9F6 | 17,94:1 | 8,12:1 |
| navy | #F2EEE6 / #10263E | 13,26:1 | 6,03:1 |
| navy-deep | #F2EEE6 / #071725 | 15,67:1 | 7,13:1 |
| ink | #F2EEE6 / #0B0B0B | 17,01:1 | 7,74:1 |

Muted #6A665F sobre cream: 4,93:1. El acento oscuro se usa sólo sobre fondos claros; los temas oscuros usan #7FA6CF. Las opacidades animadas se verifican además con axe en las escenas.

## Infraestructura F1

El runtime GSAP y Lenis se descargan como chunks diferidos. Plugins opcionales se registran bajo demanda. El contenido semántico se entrega en HTML visible; no se aplica opacidad cero global y el island sólo prepara reveals que aún están fuera del viewport. Si el proveedor de movimiento no confirma `data-motion-ready="true"` antes de 3 segundos, el bootstrap retira `js-motion` y fuerza tier 0. Con la confirmación conserva la clase. Esa señal verifica la hidratación del proveedor, no garantiza que las timelines diferidas se hayan montado: el fallo de carga de una escena dispone de su propio fallback a flujo natural. Cuatro WOFF2 Latin (incluyen ñ y acentos), 116.000 bytes. Bricolage con eje wght; no se carga wdth/opsz multieje por presupuesto.

## Intro F2 y LCP

En la compilación medida de F2, la intro iniciaba sus animaciones CSS desde el script mínimo de head, antes de hidratación, con una secuencia de 0,8s (mínimo autorizado). El Hero cargaba en paralelo; el fallback hidratado esperaba fuentes y decode con tope, mientras el arranque temprano usaba fuentes swap y placeholders inmediatamente. Las métricas F2 conservan esa implementación histórica. El timing actualizado para F3 se documenta más abajo. La intro es decorativa y no condiciona la existencia del contenido.

La variante tier 1 conserva los dos trazos, el encuentro, DOS ORILLAS y la apertura de los dos paneles en una banda inferior de 20svh. El título permanece visible y accesible: esta banda es un status, no bloquea foco ni scroll. Desktop conserva el overlay modal de pantalla completa. La adaptación preserva CONECTAR y debe revisarse visualmente en F3.

El shell no crea un grupo de composición aislado que abarque todo el documento. Main y footer usan sus z-index locales; las escenas pueden aislar sólo su viewport. El reloj se inicializa al entrar el footer en pantalla. Al cierre F3, ThemeController y el rail activan sus mediciones y observadores tras el primer scroll nativo, o al encontrar una posición de scroll ya restaurada. Hasta ese punto CSS aporta la paleta inicial del Hero. Luego cachean geometría y la actualizan cuando cambian tamaño, fuentes o estructura; el rail usa una escritura de transform por frame de scroll con movimiento activo. Se descartó inlineCss experimental: no dio una mejora suficiente y este proyecto conserva CSS cacheable. La prueba diagnóstico que omitía el loader móvil tampoco mejoró la demora, por lo que se restauró la secuencia completa.

La excepción del atributo hidden durante la intro vive en la capa base, igual que preflight: las declaraciones important invierten la prioridad de capas. La verificación de primera visita detectó y corrigió una intro que permanecía oculta. La cortina reserva padding en el shell para evitar colapso de margen y un salto de posición. Al cerrar una capa se respeta el estado actual de otra: el footer oculto conserva inert y la intro móvil no libera el scroll de un menú abierto. Sin JavaScript se muestran los enlaces de navegación en flujo y se omiten controles que necesitan código.

La medición con Chrome instalado 154 mostró una espera de BeginFrame de aproximadamente un segundo con el hilo principal libre: LCP 2,98s, TBT 83ms. El patrón coincide con un [reporte abierto de Lighthouse](https://github.com/GoogleChrome/lighthouse/issues/17148); se trata de una inferencia, no de una causa confirmada. Se contrastó con Chrome Headless Shell oficial 156.0.8078.4, revisión 1248 de Playwright 1.64.0, instalado sólo en work. El primer paint observado pasó de ~1,2s a 444ms, sin desactivar PaintHolding ni cambiar el perfil simulado, CPU 4× o umbrales. Los reportes anteriores quedan preservados en installed-chrome-154 y turbopack-shell-156.

Producción usa el empaquetador webpack soportado por Next. En la comparación con el mismo Shell 156, Turbopack produjo TBT 205ms; webpack redujo esa tarea a 138ms y mantuvo JS inicial en 156.860 bytes transferidos. En esa etapa Nav, footer e intro tenían límites Suspense. Los límites vacíos de Nav y footer se retiraron durante F3 tras verificar la lectura sin JavaScript; la arquitectura final divide su hidratación con alternativas completas dentro de `noscript`. Los fallback vacíos actuales se reservan a mejoras opcionales: ThemeController, cursor, rail e intro. Las mediciones finales usan CHROME_PATH explícito; el script registra navegador, versión y benchmark. La prueba diagnóstica que desactiva PaintHolding nunca cierra una fase.

## F0 — verificación real

Lint, typecheck y build: aprobados. Playwright: aprobado (30 checks aprobados; 7 capturas). Axe: sin violaciones serias/críticas en las vistas verificadas si los checks axe pasan.

| Perfil | Performance | A11y | Buenas prácticas | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| mobile | 98 | 100 | 100 | 100 | 2.18 s | 0.0000 | 124 ms |
| desktop | 100 | 100 | 100 | 100 | 0.62 s | 0.0000 | 9 ms |

Informes: qa-results/F0/. Medidos con Chrome instalado, build de producción y Lighthouse mobile simulado. SEO excluye únicamente is-crawlable: este checkpoint lleva noindex deliberado según el contrato de previews. No implica indexación apta para lanzamiento. INP y dispositivos físicos/lector NVDA requieren verificación posterior; no se afirman mediciones de campo.

## F1 — verificación real

Lint, typecheck y build: aprobados. Playwright: aprobado (30 checks aprobados; 7 capturas). Axe: sin violaciones serias/críticas en las vistas verificadas si los checks axe pasan.

| Perfil | Performance | A11y | Buenas prácticas | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| mobile | 98 | 100 | 100 | 100 | 1.87 s | 0.0000 | 127 ms |
| desktop | 100 | 100 | 100 | 100 | 0.60 s | 0.0000 | 1 ms |

Informes: qa-results/F1/. Medidos con Chrome instalado, build de producción y Lighthouse mobile simulado. SEO excluye únicamente is-crawlable: este checkpoint lleva noindex deliberado según el contrato de previews. No implica indexación apta para lanzamiento. INP y dispositivos físicos/lector NVDA requieren verificación posterior; no se afirman mediciones de campo.

## F2 — verificación real

Lint, typecheck y build: aprobados. Playwright: aprobado (33 checks aprobados; 7 capturas). Axe: sin violaciones serias/críticas en las vistas verificadas si los checks axe pasan.

| Perfil | Performance | A11y | Buenas prácticas | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| mobile | 97 | 100 | 100 | 100 | 1.38 s | 0.0010 | 190 ms |
| desktop | 100 | 100 | 100 | 100 | 0.53 s | 0.0026 | 22 ms |

Informes: qa-results/F2/. Build de producción y Lighthouse mobile simulado, con los umbrales originales. Runtime: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/156.0.8078.4 Safari/537.36. SEO excluye únicamente is-crawlable: este checkpoint lleva noindex deliberado según el contrato de previews. No implica indexación apta para lanzamiento. INP y dispositivos físicos/lector NVDA requieren verificación posterior; no se afirman mediciones de campo.

Corrección de cierre F2: el presupuesto de JS inicial se verifica en ambos perfiles. Lenis y GSAP se activan tras el primer scroll nativo; antes de eso la página usa scroll ordinario. Lighthouse registra 156.895 bytes iniciales tanto en móvil como en escritorio, 4 fuentes / 116.000 bytes, ninguna foto Hero real todavía y cero WebGL. Estos límites están incorporados al gate automático. Los valores de la tabla F2 corresponden a esta compilación corregida.

QA adicional F2: siete escenarios de primera visita, menú durante intro, footer móvil/escritorio y navegación sin JavaScript aprobados. La cortina no genera CLS al revelar el wordmark oficial. El ancla sin JS respeta el margen del encabezado y deja el contenido visible.

## F3 — decisiones de composición y lectura

El bootstrap de la intro reserva el overlay y marca la sesión desde head, pero activa las animaciones CSS después de DOMContentLoaded y dos requestAnimationFrame. La secuencia de 0,8s cuenta desde que se añade `do-intro-animate`; el límite de seguridad de 3s cuenta desde el bootstrap y puede cerrar antes una secuencia que arrancó tarde. El cierre cancela ambos RAF y los timers, retira `do-intro` y `do-intro-animate`, y restaura foco/inert/scroll respetando otras capas abiertas. Separar reserva y animación busca dar al navegador oportunidades de presentar la composición inicial antes de animar. La retención del primer frame es una hipótesis compatible con las observaciones en headless, no una causa confirmada; no se afirma una corrección ni un gate aprobado antes de medir esta compilación.

En desktop, React streaming puede incorporar o mover el botón de omitir desde un contenedor oculto al DOM visible después del primer intento de foco. `focusSkip` utiliza un MutationObserver de vida corta si ese intento no tiene éxito. Sólo intenta enfocar mientras la intro sigue activa, en tier 2 y sin menú abierto; se desconecta al conseguir el foco o al cerrar la intro. El estado de cierre impide que una mutación tardía vuelva a tomar el foco.

Se ensayó `startTransition` únicamente para la primera clasificación de `useMotionTier`, manteniendo prioridad normal en reclasificaciones, controles y downgrade. La lectura de React DOM instalado motivó la prueba porque una actualización de contexto puede programar trabajo en límites todavía sin hidratar; no demostró una causa de LCP ni una mejora medida. La verificación posterior con CPU simulada 4× encontró readiness después del safety de 3000ms y una clasificación tardía que volvía a habilitar el tier. Se decide retirar la transición inicial y conservar el fallback tier 0 cuando la hidratación llega tarde. `data-motion-ready` sigue asociado al commit real del proveedor; la implementación final, incluidas las fuentes corregidas, aprobó QA de readiness.

El timeout registra `data-motion-failed` y notifica al clasificador. Una hidratación tardía conserva tier 0, sin `js-motion`, pins ni Lenis; no vuelve a cambiar la composición por sí sola. El control «Movimiento completo» puede retirar ese estado y reactivar la mejora explícitamente, respetando siempre la preferencia del sistema y Save-Data. El proveedor sincroniza también la clase CSS al reducir/reactivar el movimiento. La prueba de readiness cubre tres visitas a CPU 4×: móvil 375×812, desktop 1440×900 y móvil con respuestas de scripts retrasadas 4,2s. Verifica lectura, navegación nativa mediante un clic real, estabilidad del modo resultante y recuperación con el primer clic en el control de movimiento. Los timers de 3s son seguridad de mejor esfuerzo; un hilo ocupado puede entregarlos más tarde. Se registran los tiempos observados y se exige contenido liberado antes de 5s, sin exigir que el callback se entregue exactamente a los 3000ms ni presentar esa comprobación como un presupuesto Lighthouse. Los límites de Lighthouse permanecen intactos.

Hero y La distancia comparten el acercamiento entre orillas, con recursos distintos: fotos y palabras en el primero, tipografía y cota en el segundo. En desktop hay dos pins sin espaciadores adicionales; CSS reserva el recorrido antes de la mejora. Mobile usa sticky nativo con recorrido vertical y CTAs disponibles. Las pantallas bajas, el texto ampliado y el movimiento reducido conservan una composición en flujo normal. La cota final usa el ancho real de los textos y su baseline, con geometría cacheada fuera del loop de animación.

La distancia, ubicada debajo del primer viewport, difiere ResizeObserver y las mediciones de ajuste hasta el primer scroll nativo; una posición restaurada mayor que cero las activa de inmediato. CSS define su ubicación inicial y el flujo de las pantallas bajas antes de esa activación. El Hero conserva su verificación temprana de ajuste. El Lighthouse actual cumple los presupuestos sobre la compilación final; no aísla una mejora atribuible a esta decisión.

Se corrigieron una superposición de enlaces en el Hero estático de tablet y posibles recortes de texto ampliado. El Hero sin movimiento usa flujo normal en todos los anchos. Las líneas decorativas comienzan sin dibujar y la segunda frase aparece en el beat narrativo; sin mejora, el texto completo permanece disponible. Las dos fotografías reales siguen pendientes y el manifest mantiene marcos editoriales sin inventar imágenes.

Una ejecución intermedia de readiness detectó que `.hero-camera`, una capa transparente que abarca el viewport, interceptaba el toque móvil sobre el CTA. Se la excluye del hit testing con `pointer-events:none`; el seguimiento del puntero en full permanece en `.hero-stage`. La nueva pasada de readiness confirma el clic nativo en sus tres escenarios; fase y escenas también aprobaron en la última compilación verificada.

La compactación de Nav usa ahora un sentinel absoluto a 80px dentro del shell relativo, observado con IntersectionObserver (`threshold:1`). La condición usa `entry.boundingClientRect.top < 0` y sólo escribe `data-condensed` cuando cambia. Sustituye la lectura síncrona de `scrollY` durante hidratación y el listener scroll/RAF dedicado a ese umbral. El [trace analizado](../../review-F3/TRACE-COMPARISON-NAV.md) mostraba 91ms de Layout dentro de una tarea de 107ms durante la hidratación de Nav, ausentes en el trace anterior. Esta evidencia motiva retirar la lectura que forzaba layout; no demuestra por sí sola una mejora de LCP/TBT. La compilación y QA dirigida posteriores a este cambio aprobaron. El Lighthouse actual cumple los presupuestos después del ajuste adicional de fuentes, sin aislar la contribución de Nav.

La prueba adicional sin JavaScript detectó contenido de navegación/footer dentro de contenedores hidden de streaming React cuando sus límites Suspense tenían fallback vacío. La arquitectura final conserva hidratación separada para Nav y footer, con `NavFallback` y `FooterFallback` completos dentro de `noscript`: copy centralizado, SVG oficiales dimensionados y enlaces nativos. Sus IDs `nav-static` y `footer-static` son distintos de los componentes hidratados. Estas alternativas omiten menú, reloj y controles que requieren JavaScript; volver arriba usa un enlace nativo. El footer estático incorpora su wordmark oficial directamente; la versión hidratada conserva la caja y carga la imagen al acercarse mediante IntersectionObserver. El harness sin JavaScript exige el footer real visible y legible, con logo y enlaces nativos, sin ocultar defectos mediante cambios del test.

Los logos usan `img` nativo con los SVG oficiales exactos, alt centralizado, ancho/alto intrínsecos y aspect-ratio explícito. La carga es eager o lazy según su ubicación, con decode asíncrono y prioridad de descarga baja. Los vectores no requieren el optimizador de imágenes raster; HeroMedia conserva Next Image para las fotografías. El enlace del logo hacia la home vuelve a ser un ancla nativa; su versión anterior ya tenía prefetch desactivado. La medición actual cubre esta implementación, sin aislar mejoras atribuibles a estas decisiones.

La [auditoría de fuentes](../../review-F3/FONT-AUDIT.md) encontró que Bricolage declaraba `preload:true` en next/font, pero el HTML compilado no emitía ningún hint de fuente y el manifest estaba vacío. Se conserva su WOFF2 público de 41344 B con `@font-face`, `display:swap` y rango real de pesos 200–800. El fallback Arial mantiene `size-adjust:112.88%`, ascent 82.39%, descent 23.92% y line-gap 0%. `ReactDOM.preload` desde el layout servidor emite un único enlace `as="font"`, `type="font/woff2"`, cross-origin, a `/fonts/bricolage.woff2`, la misma URL del CSS; se verificó ese enlace en el HTML de producción. Las otras tres familias conservan next/font sin precarga. No se transformaron archivos: siguen siendo cuatro fuentes Latin y 116000 B. La corrección hace real el descubrimiento temprano pedido; el PASS de la compilación actual no demuestra por sí solo un ahorro aislado ni atribuye toda la variación de LCP a las fuentes.

## F3 — estado de verificación

La compilación final con precarga corregida de Bricolage pasó lint, typecheck, build, Lighthouse y las cuatro suites funcionales. F3 completó las comprobaciones de calidad; la revisión humana del nivel de movimiento permanece pendiente antes de iniciar F4. Todos los resúmenes siguientes corresponden a esa misma compilación y registran Chrome instalado 154.0.8037.99 en `C:\Program Files\Google\Chrome\Application\chrome.exe`; Lighthouse usa Shell 156 separado:

| Prueba / resumen copiado | Checks | Escenarios | Capturas | Registro UTC, 10/10/2026 |
|---|---|---|---|---|
| [Readiness](../../review-F3/readiness-summary.json) | 31 | 3 | 0 | 02:57:38.627 |
| [Shell](../../review-F3/shell-summary.json) | 89 | 7 | 13 | 02:57:59.599 |
| [Fase](../../review-F3/phase-summary.json) | 77 | — | 37 | 02:58:15.904 |
| [Escenas adicionales](../../review-F3/scene-summary.json) | 351 | 10 | 64 | 02:59:30.610 |

Shell incluye la intro nativa con el observador de foco de vida corta, las alternativas completas sin JavaScript y 12 checks de umbral/recarga de Nav. Readiness verifica las tres visitas a CPU 4×, incluido el retraso de scripts de 4200ms; la rama saludable desktop confirma readiness antes del timeout. Escenas adicionales verifica colisiones, recortes, texto ampliado, viewport bajo, cambios repetidos de movimiento y lectura sin JavaScript. Los registros finales equivalen al 09/10, 23:57–23:59 en Buenos Aires. Los [37 PNG de fase copiados coinciden por SHA256](../../review-F3/phase-png-hashes.json); las dos capturas adicionales seleccionadas provienen también de la última pasada.

`--headed` permite contrastar Lighthouse con Chrome visible; no constituye una aprobación alternativa del gate. El harness fija una ventana de 1350×940 tanto en visible como en headless para evitar el tamaño inicial de 800×600, manteniendo los perfiles de emulación de Lighthouse. Una corrida histórica visible registró input de rueda real durante el ensayo; se conserva esa observación sin atribuir su origen ni afirmar que causó el resultado.

### F3 — Lighthouse de la compilación con fuentes corregidas

Estado: **Lighthouse PASS; QA funcional PASS; revisión del movimiento pendiente**. Lighthouse 13.5.0, Chrome Headless Shell 156.0.8078.4, revisión 1248 de Playwright 1.64.0, ventana 1350×940. Ejecutable: `C:\Users\santi\Documents\Codex\2026-10-08\files-mentioned-by-the-user-dos\work\playwright-browsers\chromium_headless_shell-1248\chrome-headless-shell-win64\chrome-headless-shell.exe`. Fetch UTC del 10/10/2026: mobile 02:56:31.392; desktop 02:56:43.261 (09/10, 23:56 en Buenos Aires). Mobile conserva simulación CPU 4×, RTT 150ms, throughput 1638,4kbps y emulación 412×823; desktop CPU 1×, RTT 40ms, 10240kbps y 1350×940. Benchmarks CPU registrados: 1430,5 mobile y 1396,5 desktop.

| Perfil | Performance | A11y | Buenas prácticas | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| mobile | 96 | 100 | 100 | 100 | 2410,626 ms | 0,00123 | 135 ms |
| desktop | 100 | 100 | 100 | 100 | 525,194 ms | 0,00577 | 8 ms |

El [resumen original copiado](../../review-F3/lighthouse-summary.json) declara `passed:true`, sin errores: ambos perfiles cumplen todos los controles originales. Performance exige ≥90 móvil / ≥95 desktop; A11y/Buenas prácticas/SEO ≥95; LCP ≤2500ms, CLS ≤0,05 y TBT ≤200ms. Ambos perfiles registran 157818 B de JS inicial, 4 fuentes / 116000 B y una imagen máxima de 63280 B (`logo-horizontal.svg`); no hay fotos Hero reales ni WebGL inicial. SEO excluye únicamente `is-crawlable` por el noindex del preview. Los informes HTML/JSON actuales están copiados a revisión; las corridas anteriores permanecen en el historial local de QA. Lighthouse mide la carga inicial; Playwright y capturas verifican el recorrido de scroll. Las fotos reales requerirán repetir la medición. El [kickoff del prompt, línea 1035](../PROMPT.md#kickoff-primer-mensaje-a-codex), exige detenerse aquí y presentar capturas/resultados para aprobar el nivel de movimiento antes de continuar. La [revisión visual](../../review-F3/REVISION.md) solicita esa aprobación; F4 no se inició y no se publicó el sitio.

## F3 — verificación real

Lint, typecheck y build: aprobados. Playwright: aprobado (77 checks aprobados; 37 capturas). Axe: sin violaciones serias/críticas en las vistas verificadas si los checks axe pasan.

| Perfil | Performance | A11y | Buenas prácticas | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| mobile | 96 | 100 | 100 | 100 | 2.41 s | 0.0012 | 135 ms |
| desktop | 100 | 100 | 100 | 100 | 0.53 s | 0.0058 | 8 ms |

Informes: qa-results/F3/. Build de producción y Lighthouse mobile simulado, con los umbrales originales. Runtime: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/156.0.8078.4 Safari/537.36. SEO excluye únicamente is-crawlable: este checkpoint lleva noindex deliberado según el contrato de previews. No implica indexación apta para lanzamiento. INP y dispositivos físicos/lector NVDA requieren verificación posterior; no se afirman mediciones de campo.

## Continuación autorizada después de F3

El 10/10/2026 el usuario pidió «segui entonces» después de recibir las capturas, el informe Lighthouse y la explicación del checkpoint F3. Se considera autorización para avanzar a F4 y las fases siguientes conforme al kickoff: no pedir confirmación entre fases salvo bloqueo real. El archivo de revisión F3 conserva el estado histórico de aquella entrega. Cada fase nueva mantiene lint, typecheck, build, capturas y presupuestos Lighthouse originales antes de avanzar.

## Dirección regional y ritmo de trabajo

El 10/10/2026 el usuario pidió acelerar sin afectar el resultado y usar Concepción del Uruguay, Entre Ríos, como referencia visual opcional. Se toma el río Uruguay, las orillas y el paisaje entrerriano como dirección de atmósfera, encuadre y materialidad; no se supone que la metáfora deba representar un puente concreto. Las fotografías locales reales tendrán prioridad cuando se aporten, sin imágenes de relleno ni fotografías ficticias. El trabajo de componentes se distribuyó en paralelo; las comprobaciones de producción y Lighthouse se ejecutan de forma secuencial sobre una compilación fija para evitar mediciones contaminadas y repeticiones innecesarias.

## F4 — ajustes antes del cierre

La primera revisión detectó contraste insuficiente en los numerales atenuados de Soluciones y las marcas pequeñas de Proceso. Los numerales conservan el token muted, las marcas usan crema al 68% y los pasos horizontales conservan opacidad mínima .68: azul grande sobre navy 3,57:1; descripción 5,24:1; marca futura 6,86:1. El preview queda bajo una capa de lectura opaca: ningún título se oculta al aparecer la foto o su placeholder.

Un diagnóstico adicional mostró que axe tomaba el fondo crema del documento para texto de Proceso situado fuera del encuadre horizontal. Declarar navy en todo el track, incluidas sus partes recortadas, dejó esa prueba sin violaciones; no se excluyó ningún control. La QA geométrica descarta fragmentos totalmente fuera de su máscara, porque no están pintados, y conserva los checks de ancho y colisiones de los fragmentos visibles. El retorno tablet→desktop se prueba desplazándose nuevamente a Proceso antes de esperar su carga diferida.

La medición inicial F4 no aprobó: mobile Performance77, TBT930,594ms, LCP2118,609ms; desktop100, TBT15ms. JS inicial160503B y fuentes116000B. El trace registró más trabajo de layout con el HTML ampliado y un efecto de Soluciones que cambiaba el acordeón durante el arranque. Se separa ese controlador en un módulo solicitado después del primer scroll y al acercarse a 800px de la sección; el HTML completo permanece expandido hasta que existen handlers. Esta corrección elimina trabajo e import de interacción al inicio; su efecto medido se registrará con la nueva compilación. Se conservan los informes fallidos en `qa-results/F4/lighthouse-before-service-deferral-*`; no se cambiaron navegador, emulación ni presupuestos.

Las tres islas narrativas se solicitan desde una fachada única al acercarse tras el primer scroll. Manifiesto y Proceso lite usan exclusivamente WAAPI/IO y pueden reservar layout distante con `content-visibility:auto`; full, reduced, no-JS, hash inicial y viewport bajo conservan layout normal. Una marca elimina CV antes de medir o importar el runtime. Los enlaces internos y Tab desbloquean las alturas antes de calcular scroll/foco. La prueba focalizada de visita inicial pasó en 375×812 y768×900: reserva, contacto bajo Nav, ida/vuelta de historial, Tab y ausencia de overflow/errores. Los escenarios adicionales siguen pendientes.

CV redujo los objetos del primer layout de 539 a 356. La corrida de esa compilación registró Performance82/TBT592,587ms y benchmark852; las fuentes, CLS, peso JS y auditorías restantes cumplieron. Se conserva en `lighthouse-before-hydration-boundaries-*`. Con fronteras Suspense independientes por sección SSR, la siguiente compilación registró Performance95/TBT241,5ms/LCP1804,902ms móvil y100/TBT23,5ms desktop, con benchmark903,5/892,5. Sigue pendiente el gate TBT≤200ms; no se atribuye la diferencia exclusivamente al código dado el cambio de benchmark y la actividad de lint que todavía no había finalizado. No se modifican el navegador, la emulación ni los umbrales, y F4 no se declara cerrada.

### F4 — correcciones de contenido y carga verificadas

Soluciones tier 1 ahora usa IO/WAAPI y geometría agrupada, sin GSAP ni ScrollTrigger propio. CV se limita a los tres flujos nativos no mejorados; el primer layout registrado bajó a 245 objetos. En una corrida aislada TBT61ms cumplió, pero LCP3134ms no: no se atribuye todo el cambio de TBT al código porque varió el benchmark. Se conservó en lighthouse-before-first-paint-intro-*. El bootstrap ahora espera first-contentful-paint buffered y, en desktop, el foco real del skip visible antes de comenzar los 800ms. Safety3s, Escape, skip y limpieza de observers/RAF permanecen.

El intento inlineCss nativo experimental de Next aumentó LCP a 2705ms (TBT120,5ms) y se retiró; sus informes se conservan en lighthouse-inline-css-*. CSS de Proceso horizontal y preview full se separó del recurso inicial y llega con sus módulos diferidos. La siguiente corrida registró móvil92/LCP3102,855ms/TBT134ms y desktop100/LCP566,126ms/TBT9,5ms: falla todavía únicamente el LCP móvil. No se modificaron umbrales ni flags/navegador y F4 sigue abierta.

La QA sin JavaScript encontró que Suspense fallback null alrededor de secciones server dejaba segmentos streamed ocultos. Se retiraron esas tres fronteras: sólo las islas vacías conservan Suspense. La prueba posterior sin JS375/768 pasó con copia y layout completos. La suite narrativa final pasó sus11 casos: acordeón/ARIA, preview, contador, pulso final, zoom200%, landscape, no JS/reduced, tres cambios de tier sin leaks y resize full/tablet/full. El harness adicional de layout necesitaba distinguir texto completamente fuera de máscaras de recorte visible y acercarse al margen real400px del controller; se conserva el reporte anterior y el nuevo harness exige también que ambas frases AI se revelen completas.

La revisión de fase detectó palabras de Manifiesto con opacidad inicial .15 bajo contraste AA en escritorio. Se cambia a .65 en full y lite: mantiene el progreso de lectura y un mínimo legible. En ese checkpoint aún requería rebuild y nueva comprobación de fase. La ejecución de capturas se interrumpió por el límite de uso de la revisión automática; fue un fallo de revisión, no una clasificación de inseguridad. El12/10 volvió a habilitarse la ejecución. Proyectos/F6/F7/F8 están preparados en staging y no se consideran integrados ni aprobados.

## F4 — Hero cinematográfico elegido por el usuario, 12/10/2026

El usuario indicó usar exactamente el original `hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4` como Hero y excluir marcas/textos/assets de Prisma, VEX, Joinlab y demos. Esta selección sustituye la coreografía anterior de dos fotografías, pin, profundidad de puntero e intro por una pieza de video en flujo natural. Las dos imágenes generadas que no aprobó permanecen fuera del repositorio y no se usan como alternativa.

La referencia original está centralizada en `content/hero-film.ts`. La entrega vigente, actualizada el 13/10/2026, usa `/visuals/dos-orillas-film-mobile.mp4` de 192892 B a 720×402, `/visuals/dos-orillas-film.mp4` de 7685079 B a 1924×1076 nativos y los posters `/visuals/hero-film-poster.webp` de 39406 B y `/visuals/hero-film-poster-desktop.webp` de 112962 B. Se extraen del mismo video; no son nuevas imágenes generadas. Estos bytes corresponden a los archivos locales y no certifican LCP, TBT ni una mejora aislada de rendimiento.

El SSR entrega un `picture` nativo eager, con prioridad alta y precarga, además de h1, filosofía, descripción y enlaces nativos a contacto/proyectos. Desde 1024px la imagen y su precarga seleccionan el poster de 1924×1076; en anchos menores se conserva el poster de 39406 B. Esa imagen permanece hasta disponer de un frame decodificado del video. El elemento video no lleva fuente MP4 inicial y usa `preload="none"`, muted, loop y playsInline. El controlador espera readiness del proveedor, primer paint e intersección; programa su activación en idle, selecciona móvil hasta 767px y conserva el poster si autoplay falla. Fuera del viewport o con la pestaña oculta pausa; al volver sólo reanuda si el usuario no solicitó pausa. El botón accesible «PAUSAR VIDEO» / «REPRODUCIR VIDEO» expresa pausado con `aria-pressed=true`. No se añade GSAP ni RAF continuo para reproducir el video.

Reduced, tier 0 y sin JS conservan imagen estática y contenido completo. `SiteShell` no monta Preloader y el bootstrap excluye la intro para `data-hero-variant="film"`; mantiene clasificación de movimiento y safety 3s. Hero y contenido crecen en flujo normal, también con poca altura/texto ampliado. La distancia, Manifiesto, Soluciones y Proceso conservan su propia narrativa de scroll.

Se añade `data-home` al shell y fallback crema/navy para la Nav inicial de la home. ThemeController difiere su observación hasta el primer scroll; CSS aporta la paleta inicial del Hero cinematográfico. El tratamiento inicial del SVG conserva el archivo oficial y se retira al existir el tema calculado. Esta decisión preserva legibilidad inicial sin reactivar lecturas de scroll durante hidratación.

Concepción del Uruguay, Entre Ríos se muestra como ubicación del estudio. La pieza elegida se usa como escenario decorativo y no se presenta como filmación documental de esa ciudad, un puente local, una persona del equipo o un cliente.

## F4 — carga narrativa y coherencia de hidratación

Se genera una hoja externa desde las tres fuentes CSS canónicas, con versión SHA en la URL. Su componente no serializa la hoja completa en HTML/Flight. El CSS crítico conserva reservas y CV; la hoja completa tiene alternativa noscript y activación inmediata para full/reduced/hash/recarga/historial. La visita nueva lite alta puede activarla después de FCP en idle o ante interacción real, con safety 3s. Resize se escucha después de FCP, sin leer dimensiones durante el parseo inicial; scroll en 0 no adelanta esa activación.

Con una descarga lenta, el bootstrap recuerda hash inicial/enlace interno y desbloquea los tres flujos antes de emitir refresh. Tras cargar hoja/documento, repara el ancla con dos RAF sólo si hash, ruta y destino visible siguen coincidiendo. Rueda, touch, pointerdown o teclas de navegación posteriores cancelan el reanclaje para respetar la decisión del usuario. La prueba dedicada exige clic/Tab/hash antes de la hoja, historial, no JS/reduced y cancelación por rueda; no sustituye interacciones nativas por scroll sintético.

Una hidratación diferida del footer podía comenzar después de clasificar el tier y producir discrepancia de texto del control de movimiento. Un snapshot de hidratación mediante `useSyncExternalStore` conserva el estado servidor para texto y `aria-pressed` durante esa hidratación; después aplica el estado real del proveedor. No se oculta el error ni se suprime esa comprobación.

El primer gate del Hero cinematográfico no aprobó el rendimiento móvil. El trace motivó sustituir la lectura inicial de scrollY de ScrollProgress/ThemeController por la señal del sentinel de Nav y eliminar del bootstrap narrativo toda consulta inicial de dimensiones. El listener de resize se conecta después de FCP; visualViewport también forzaba layout y se retiró. La imagen SSR separa la presentación del poster de la inicialización de video. Estas modificaciones buscan retirar layout forzado y ofrecer el primer frame antes; su efecto debe registrarse con la nueva compilación y no se declara una mejora medida por anticipado.

## F4 — estado del cierre cinematográfico

Los resultados finales de esta compilación se incorporan después de lint, typecheck, build, capturas, suites funcionales y Lighthouse sobre el mismo build. La QA del Hero usa 14 perfiles para anchos, texto 200%, poca altura, reduced/no JS, reproducción/pausa y cambios de preferencia. Readiness y shell adaptan sólo las expectativas específicas de intro a flujo/foco/rueda; conservan CPU 4×, scripts demorados 4200ms, safety, recuperación, menú, footer, errores y umbral/recarga de Nav. DOM/axe no prueban el contraste de cada fotograma: la pieza elegida necesita revisión visual.

No se declaran aquí nuevos scores, tiempos ni un PASS global. Se conservan Lighthouse 13.5, Chrome Headless Shell 156 y los umbrales originales; los resultados fallidos previos son diagnósticos históricos. F4 permanece abierta hasta registrar las comprobaciones finales. F5–F8 requieren integración/QA de sus propuestas de staging, contenido real y datos confirmados; F9 requiere QA completa, preview, dominio/plan/env y publicación autorizados. No hay despliegue de este checkpoint ni medición de INP real/NVDA/dispositivos físicos.

## 13/10/2026 — nitidez del video en PC

La versión de escritorio a1280×716 estaba demasiado comprimida para pantallas grandes. Se recodificó directamente desde el original a1924×1076 nativos,24fps,CRF18,faststart, sin escalado/recorte/audio:7685079B. El decode completo de241frames pasó. Se añadió hero-film-poster-desktop.webp de112962B; picture y preload con media desde1024px entregan ese fotograma antes de mostrar el video decodificado. Móvil conserva los mismos archivos y hashes: MP4 de192892B y poster de39406B. La pieza conserva la suavidad propia de su fuente; no se genera detalle4K ni se cambia la escena elegida.

Se ensayó precargar las tres declaraciones `localFont` existentes en sus URLs generadas. Ese experimento no emitió hints y quedó sustituido por los cuatro `@font-face` y preloads públicos descritos abajo. El control de video se separa de la etiqueta de capítulo desde 768px. Soluciones omite la transición durante el colapso inicial del SSR y habilita las transiciones de interacción tras dos frames. La señal de geometría lista permite una única reparación adicional del hash, siempre cancelable por gesto y excluyendo Back/Forward. No se rebajan presupuestos o pruebas para cerrar el gate.

## F4 — descubrimiento explícito de las cuatro fuentes

El experimento preload:true de next/font no emitió hints en este build: next-font-manifest seguía vacío y las tres fuentes se descubrían desde CSS. Se sustituyen esas tres declaraciones por @font-face local en styles/fonts.css, preservando archivos y métricas de fallback, y preload de sus mismas URLs públicas. Junto a Bricolage se solicitan exactamente cuatro WOFF2, 116000B; no se conservan URLs hashed que dupliquen descargas. La nueva medición debe confirmar red y presupuesto; el cambio no implica un PASS anticipado.

El trace también encontró una lectura inicial de scrollY en SceneMotion para Distance. Su inicio ahora conserva primer scroll y usa IntersectionObserver para hash/restauración, sin forzar layout al hidratar. Esta activación diferida debe conservarse al integrar las rutas de proyectos.

## F4 — alcance comprobado el 13/10/2026

Sobre la compilación con fuentes públicas, activación de Distance por IO y posters responsivos, `qa-narrative-styles.mjs` aprobó sus 6 escenarios (registro 14:18:42 UTC) y `qa-hero-film.mjs` sus 14 perfiles (14:19:11 UTC). La prueba del video confirma reproducción nativa a 1924×1076, poster de escritorio, control de pausa y ausencia de superposición con la etiqueta de capítulo. Se decodificaron además los 241 frames del MP4 sin error; móvil conserva los archivos y hashes previos. Esto documenta nitidez y comportamiento, no un score de carga anticipado.

La aplicación tardía del CSS reducido podía iniciar una transición de tipografía por la regla global de duración breve y `transition-property:all`. La hoja narrativa generada ahora declara `transition-property:none` en tier 0 y `prefers-reduced-motion`, para las tres escenas y sus descendientes. La prueba de carga lenta pasa sin cambiar umbrales ni añadir esperas para esconder ese estado.

El cierre F4 todavía requiere Lighthouse aislado sobre esta compilación, la QA narrativa completa, layout, fase, revisión de capturas y los checks de código. Los informes históricos de readiness y shell se conservan con su fecha y alcance; si hay cambios relevantes deben repetirse. `report-phase.mjs F4` exige resumen principal, Lighthouse y las seis suites funcionales aprobadas antes de escribir el cierre. No se declara un PASS global ni se modifica el presupuesto móvil de LCP ≤2500ms / TBT ≤200ms.

## F5 — integración de las referencias de carrusel

El usuario pidió priorizar el carrusel y mejorar la calidad del video en PC. Se elige un arco finito CSS 3D para Proyectos seleccionados y una grilla editorial para Todos los proyectos, ambos generados desde `data/projects.ts`. Se conservan los cinco proyectos reales, sus datos y key visuals conceptuales cuando no hay capturas; se excluyen nombres, marcas y contenido ajeno de las demos. Los pequeños controles de vidrio quedan estáticos y no agregan un runtime Three/WebGL.

El carrusel propone flechas, indicadores, teclado y gesto horizontal, con scroll vertical nativo y sin autoplay o pin. Los fallbacks conservan todos los enlaces y el contenido en flujo. Su integración está en curso y todavía requiere capturas, accesibilidad, rendimiento y la prueba de agregar/quitar un sexto objeto, seguida de rebuild de los cinco proyectos reales. Preparar o integrar fuentes no equivale a aprobar F5.

## F8 — privacidad pendiente y 404 sin JavaScript

El build de cinco proyectos reveló que la ruta vacía `/privacidad`, al ejecutar `notFound()` durante su prerender, entregaba HTTP 404/noindex con `html#__next_error__` y un body vacío. Con JavaScript recuperaba el 404 del estudio; sin JavaScript no mostraba contenido. El boundary local no resolvió ese comportamiento: la comprobación enfocada aprobó 3 de 4 escenarios, mientras una URL inexistente normal sí entregó HTML completo en ambos modos. La QA HTTP también mantuvo su fallo por falta de h1; no se relajó ese check.

La implementación instalada de Next 16.4 comparte el payload de recuperación `getErrorRSCPayload` entre el render de request y el prerender; su shell de error tiene body vacío. Se retiró la propuesta de `force-dynamic` antes de certificarla y se conservó el borrador en `components/legal/PrivacyDraft.tsx`, fuera de las rutas públicas. No se publica una página legal sin texto aprobado. `privacyDocumentCopy.paragraphs` y el enlace de privacidad del contacto permanecen `null`; headers y sitemap mantienen la exclusión existente. `/privacidad` pasa a la ruta general de 404, cuya entrega SSR ya se comprobó.

La nueva compilación debe confirmar para `/privacidad` HTTP 404, noindex, h1 visible y enlace de vuelta tanto con como sin JavaScript. `qa-privacy-render.mjs` conserva los cuatro escenarios y `qa-seo-served.mjs --final` el requisito de h1. Este cambio de fuente no declara un PASS F8 antes de ese rebuild ni agrega texto legal inventado.

## Integración final y entrega local — 14/10/2026

El usuario pospuso la publicación y pidió un ZIP completo para abrir en su IDE. Se integraron las doce secciones, el carrusel CSS 3D finito, la grilla, el índice y cinco casos, el equipo confirmado, el cierre editorial, contacto y SEO. El Hero conserva la película elegida; su versión de escritorio usa la resolución nativa 1924×1076 y los archivos móviles mantienen la carga ligera. No se usan las imágenes generadas descartadas ni marcas/UI de las referencias.

Las tarjetas usan esquemas explícitamente conceptuales cuando faltan capturas reales. Los cinco datos originales se restauraron exactamente después de la prueba temporal del sexto proyecto: SHA256 `2db2e40a11dc12ab82f14b161955f917a7cefdd0fe78bc777e02f76cee2d623c`. No se agregaron clientes, años, resultados, bios o fotos deducidos. Santino Dacuy y Tobías Carballo conservan nombres e iniciales cuando no hay foto real.

La ruta persistente mantiene un Fragment estable: activar movimiento ya no desmonta toda la home. View Transition se habilita sólo para el cover seleccionado y soportado; los otros covers, reduced y navegadores sin soporte conservan navegación ordinaria. El retorno restaura el cover semántico observando geometría real y se cancela ante interacción del usuario. El footer conserva flujo visible si contiene el foco: su cortina no puede volver inert un control que se esté usando. Los enlaces al índice son anchors nativos y el proveedor existente conserva navegación/prefetch.

La detección de capacidad de View Transition se hace al navegar, junto a selection/kind en el mismo `flushSync`, en lugar de cambiar un snapshot de falso a verdadero al hidratar y reconciliar todos los covers otra vez. El primer click usa el valor local detectado; el efecto de listeners no depende del nuevo estado supported, por lo que no cancela la navegación recién creada. La suite final de cuatro perfiles aprobó 171 controles y registró once capturas nativas, con `project-mate-unico` como primer cover: primer click, Back/restauración, reduced, sin API y sin JS comprobados. El carrusel y hash nativo aprobaron tres perfiles afectados/216 controles adicionales.

La línea animada del CTA final se desplazó al borde inferior del botón para evitar cruzar su texto en hover/foco. Se conservaron color, fill, teclado y movimiento reducido. La comprobación final verificó la línea debajo del texto en los seis perfiles del cierre.

Se retiraron 123 reglas del Hero anterior que ya no se usaban. Las cuatro fuentes se subsettingearon a 92924 B, sin reemplazar familias ni cambiar contornos, métricas o ejes: 2299 comparaciones de contornos y 12 corpus de shaping aprobaron. `scripts/subset-fonts.py` documenta su regeneración opcional; Python no es una dependencia para abrir o compilar el sitio.

El cuerpo decorativo de los cinco tipos de KeyVisual se serializa en servidor con una lista cerrada de tags/atributos y escape. Title, desc, defs, IDs/ARIA, leyendas y límites cliente conservan su JSX. Diez renders completos de figuras aprobaron igualdad byte a byte. Los bloques nativos de Estudio, Equipo, Herramientas y Hablemos usan el mismo principio: 183 nodos del árbol pasan a cuatro wrappers con HTML idéntico. Fotos reales conservan NextImage/Media; dos simulaciones de assets futuros comprobaron esa alternativa. No se admiten handlers, HTML crudo, estilos, componentes arbitrarios ni URLs externas; sólo enlaces de ancla validados. La auditoría independiente no encontró entradas ejecutables.

Una ampliación experimental a narrativa, textos de tarjetas y leyendas aprobó igualdad de HTML y seguridad, pero su transferencia sólo bajó 1313 B y el primer layout siguió alrededor de 77 ms. No cumplió el gate móvil y se retiró completamente por falta de mejora medida y complejidad adicional. Sus informes permanecen en `lighthouse-rejected-static-narrative`; sus recuentos de nodos no se presentan como un ahorro de rendimiento de la entrega.

La optimización entrega todas las secciones directamente en SSR. Se rechazó y retiró un experimento con Suspense alrededor de contenido: ocultaba segmentos sin JavaScript y empeoraba la medición. El HTML final no contiene cuerpos ocultos `S:`. Las fronteras Suspense se limitan a islas vacías; las animaciones y controles se mejoran al recorrer la página.

La home completa aprobó 216 controles en seis anchos y reduced/noJS. La revisión integrada del Hero aprobó 14 perfiles, estilos diferidos 6, shell 7, readiness 3, contacto 9, navegación de casos 4 y SEO 187 controles. El cierre editorial también aprobó seis perfiles JS/noJS a375/1024/1440, 48 comprobaciones y doce capturas: navegación real, teclado, copy, geometría y contacto. El servidor de contacto aprobó 16 casos/5184 aserciones con transporte simulado; no se enviaron correos. La privacidad pendiente responde 404 legible con y sin JavaScript.

La instalación del lockfile con `--offline --frozen-lockfile --ignore-scripts --lockfile-only`, lint, typecheck y build aprobaron sobre la fuente final. Un primer lint/typecheck dentro del sandbox no pudo resolver correctamente enlaces de pnpm; las ejecuciones con acceso normal a dependencias aprobaron. Ese error de entorno no se ocultó ni se corrigió excluyendo archivos. Las métricas de la medición aislada final se registran en `VALIDATION.md`; los informes fallidos y experimentales permanecen como históricos, sin cambiar el runtime ni los presupuestos.

El paquete contiene fuente, configuración, lockfile, todos los assets de la aplicación, licencias y guías. `node_modules`, `.next`, credenciales y QA voluminoso se regeneran o permanecen fuera del ZIP. `ABRIR_PROYECTO.md` explica el arranque. No se requiere dominio, hosting ni proveedor de correo para desarrollar localmente; la alternativa por email permanece hasta configurar envío. No se acredita despliegue, entrega real de emails, Safari físico, NVDA ni INP de campo.

### Resultado final medido y alcance del ZIP

La última corrida aislada sobre esta fuente, después de terminar funcional/readiness y sin procesos de agentes activos, registró escritorio99/LCP945.774ms/TBT75ms y móvil78/LCP3815.5105ms/TBT447.0015ms. A11y/Buenas prácticas/SEO100 en ambos; CLS0.0005071 móvil/0.0001085 escritorio. JS166474B, cuatro fuentes92924B y posters39406B/112962B cumplen los presupuestos. El perfil móvil falla Performance/LCP/TBT. Los umbrales originales permanecen90 móvil/95 escritorio, LCP≤2500ms y TBT≤200ms. No hay PASS global ni cierre completo del gate F8; el objetivo móvil queda explícitamente pendiente para resolver antes de publicar.

La entrega local incluye toda la aplicación funcional y sus recursos, con ese resultado documentado en `VALIDATION.md` y la guía de apertura. Las optimizaciones descartadas y los valores anteriores no se usan como aprobación de esta fuente. La comprobación final de navegación aprobó cuatro perfiles/171 checks y once capturas nativas; el cierre seis perfiles/48 checks; carrusel/hash tres perfiles/216 checks; core seis tamaños más reduced/noJS; readiness tres perfiles/43 checks; lint/typecheck/build y lockfile aprobaron. El ZIP no se presenta como una publicación ni como cumplimiento de los tres límites móviles pendientes.

## 21/10/2026 — La distancia rehecha como recorrido horizontal

La escena anterior era texto sobre un fondo WebGL, con tarjetas de vidrio y un tramo donde las palabras se superponían. Se reemplaza por un viaje: el stage sticky mueve en horizontal una pista [TU NEGOCIO · río · LA TECNOLOGÍA] mientras la foto aérea del río (`/images/distance/river-aerial.webp`, virada a azul desde `river-delta.jpg`), la regla y la descripción se desplazan a velocidades distintas. Después la cámara se aleja hasta encuadrar las dos orillas y un puente de línea se dibuja entre ellas; cierran «Ahí trabajamos nosotros.» y las tres frases. El copy y los datos son los de `distanceCopy`; no se agregó contenido.

Sin pin de GSAP: sólo CSS sticky + un ScrollTrigger con scrub (la altura reservada evita CLS antes de cargar GSAP). Móvil (<768px) y poca altura (<681px en desktop) no usan pista: flujo vertical con reveals (móvil) o lectura estática. El río en canvas sólo corre en tier 2/3 y mientras la escena es visible. Se retiró el GlassFold WebGL de esta sección (sigue en Soluciones y Proyectos). Código: `Distance.tsx`, `distance-timeline.ts`, `distance-river.ts`, `styles/distance.css`.

Limitaciones: la foto aérea se amplía ~1,7× en desktop (es suave por diseño, bajo máscara y grano); falta validar Lighthouse móvil y correr las suites QA con el nuevo DOM.

## 21/10/2026 — Manifiesto y Soluciones fusionados en un solo recorrido

Dos secciones (`#manifiesto`, `#soluciones`) siguen existiendo como anclas y para Nav/ThemeController/ScrollProgress, pero se leen como una sola historia: *no hacemos tecnología porque sí → la hacemos cuando puede mejorar algo → estas son las soluciones → la IA las cruza a todas*. Reemplaza el carrusel de ocho fondos, la lista en acordeón y su infraestructura (`ManifestoMotion`, `manifesto-motion`, `Solutions*`, `solutions-*`, `styles/manifesto|solutions*.css`; el bundle narrativo diferido queda sólo con `process.css`).

**Manifiesto (sticky, 340/440svh).** «NO HACEMOS TECNOLOGÍA PORQUE SÍ.» sobre `fondo-1` (relieve con el monograma). La línea que tacha «PORQUE SÍ.» se convierte en una ventana (`clip-path`) hacia `fondo-3` (la persona, la cercanía), donde entra «LA HACEMOS CUANDO PUEDE MEJORAR ALGO.» con «MEJORAR ALGO.» en serif itálica. Al final la foto cae a navy para la entrega a Soluciones. Las fotos son derivadas webp de la colección oficial (`public/images/approach/`, 31 KB y 48 KB frente a ~1,5–2,9 MB de los PNG); `fondo-3` evita la marca de agua que tienen `fondo-2` y `fondo-8`.

**Soluciones (sticky, 520/680svh).** Lista tipográfica grande a la izquierda; el servicio activo se enciende y su foto entra con cortina desde abajo, con inclinación 3D hacia el puntero (sólo puntero fino y tier completo). Cierra la IA como línea transversal que cruza los cuatro nombres. Copy y datos: `manifestoCopy` y `content/services.ts`, sin cambios.

**Modos.** ≥768px y ≥681px de alto: recorrido fijado (CSS sticky + un ScrollTrigger con scrub por escena, sin pin de GSAP). <768px con altura suficiente: flujo vertical con reveals y parallax. Tier 0/reduced/sin JS/poca altura: lectura estática con todo visible. Código: `Manifesto.tsx`, `Solutions.tsx`, `ApproachMotion.tsx`, `approach-timeline.ts`, `styles/approach.css`.

Pendiente: las suites `qa-narrative*`, `qa-phase` y `qa-seo-served` apuntan a las clases/DOM anteriores y hay que actualizarlas antes de usarlas como gate; Lighthouse móvil sin medir sobre esta versión. Las fotos de servicios (`_services/*`) siguen siendo las existentes, incluida la maqueta «MAISON NOIR»: conviene revisar con el equipo que no se lea como un cliente real.

## 21/10/2026 — Proyectos como mazo de ventanas con perspectiva

Reemplaza el carrusel compacto (~550px, fondo WebGL GlassFold) por un mazo fijado de cinco portadas: la activa en grande, las siguientes asoman detrás con rotación y profundidad, la saliente vuela a la izquierda. El título «PROYECTOS.» entra línea por línea; el texto del proyecto cambia con el progreso; la portada activa se inclina hacia el puntero (puntero fino, tier completo) con un brillo que sigue al cursor. Sin pin de GSAP: CSS sticky (500/640svh) + un ScrollTrigger cuyo progreso alimenta un `render(pos)` con meseta en cada proyecto e inercia propia. La atmósfera es la portada activa desenfocada (`next/image` a 24vw, filtro estático; sólo se anima la opacidad), no un shader.

**Portal.** Cada portada es `ProjectCoverTransition role="source"` (`sourceId=home:<slug>`) dentro de un `<a>` con `data-project-transition-*`; el botón «VER CASO DE ESTUDIO» comparte ese origen. El clic en la portada activa expande la imagen hasta el hero del caso con la View Transition existente; el clic en una portada que asoma la trae al centro. La portada se aplana en `pointerdown` para que el portal parta de geometría limpia. Se añadió `data-cover-restore="native"`: `restoreSource` no reubica la portada por su rectángulo dentro de un escenario sticky; el scroll del historial ya devuelve al mismo proyecto (comprobado: vuelve a la misma posición exacta).

**Modos.** ≥1024px y ≥681px de alto: mazo fijado, con flechas del teclado, riel numerado y paginador. Tablet y móvil: lista en flujo con portada que se abre (`clip-path`), parallax de imagen y reveals. Tier 0/reduced/sin JS: lista estática completa. Se retiraron `styles/projects-cinematic.css`, `components/ui/glass-fold.tsx` y `components/ui/hero-carousel.tsx` (sin usuarios). Código: `ProjectsCinematicSection.tsx`, `ProjectsMotion.tsx`, `projects-timeline.ts`, `styles/projects-showcase.css`.

**Contenido a validar.** Los textos de `SHOWCASE_PROJECTS` son los que ya estaban publicados y difieren de `data/projects.ts` (que es la fuente verificada y marca «CONFIRMAR contexto; nunca presentarlo como cliente comercial»): hablan de «checkout integrado», «panel de administración en tiempo real», «control de calidad en procesos industriales», «monitoreo de tráfico aéreo». Se conservaron tal cual por pedido del equipo, pero conviene alinearlos con los datos confirmados. «QUIERO ALGO ASÍ» pasa a `#contacto`: el enlace anterior `/#contacto?tipo=…` no resolvía ningún ancla y Contacto no lee `tipo`.

## 21/10/2026 — El Estudio como escena de las dos orillas

Reemplaza el bloque de texto de ~720px (glows cian, curvas de río, tercera línea en cian saturado) por una escena fijada de ~340svh. «DOS PERSONAS.» llega desde la izquierda y «DOS ORILLAS.» desde la derecha (las dos orillas) y se encuentran sobre una foto que se abre con `clip-path`. «UNA MISMA FORMA DE TRABAJAR.» sube y un puente de línea con dos nodos cruza el ancho. Después la frase se vuelve fondo (opacidad .06), la foto crece y se disuelve en el navy, y la frase central se enciende palabra por palabra con el scroll; el párrafo entra debajo y el puente cierra con las coordenadas. Copy: `studioCopy`, sin cambios.

**Foto.** `public/images/studio/notebook.webp` (92 KB): la fotografía del cuaderno con bocetos y planos (antes en el Manifiesto, sin uso desde que se rehízo) en monocromo con virado azul, coherente con «primero entendemos»; evita usar las imágenes de las personas, que pertenecen a Equipo (intocable).

**Modos.** ≥1024px y ≥681px de alto: escena fijada (sticky + un ScrollTrigger, sin pin de GSAP). Tablet/móvil: flujo con reveals, foto con parallax, frase que se enciende por scroll y puente que se dibuja. Tier 0/sin JS: lectura estática completa. Se retiró `data-editorial="studio"` y el CSS propio de Studio en `editorial.css`/`editorial-radiant.css`; Equipo, Stack y Cierre siguen usando el controlador editorial sin cambios (su rama `fullStudio` quedó sin uso). El acento pasa de cian a `--accent` (azul-río, un solo acento). Código: `Studio.tsx`, `StudioMotion.tsx`, `studio-timeline.ts`, `styles/studio.css`.

## 21/10/2026 — Criterio & Stack + cierre en una sola sección compacta

Se fusionan «Criterio & Stack» y el cierre «HABLEMOS.» (antes dos secciones: Stack con ilustración isométrica, conectores animados y glows, y un CTA de `min-block-size:100svh` con un título de hasta 15rem) en una sección de ~1,3 pantallas en desktop (~1170px). Se quitaron: el SVG isométrico, los conectores con pulso, los dos glows de 600px y el parallax por `scroll` con `setState`, los íconos Lucide de las tarjetas y la caja de «El criterio ante todo». Se conserva todo el texto (`finalCtaCopy`, copy de las tres capas, sus 17 tecnologías con `TechIcon`).

**Estructura.** Cabecera de dos líneas («EL CRITERIO NO.» en acento) → tres capas en una fila, unidas por una sola vía horizontal con nodos que reemplaza a la ilustración (INTERFAZ → SERVIDOR → DATOS) → franja de criterio en una línea de lectura → cierre en dos columnas (premisa a la izquierda; «HABLEMOS.» con puente y botón a la derecha) → ubicación. En móvil todo es una columna.

**Movimiento.** Sin pin ni GSAP: transiciones CSS que `StackMotion` dispara con un `IntersectionObserver` (`data-in`); las líneas del titular suben enmascaradas, la vía de cada capa se dibuja y el puente de «HABLEMOS.» crece. Los estados ocultos sólo existen con `data-st-ready` (JS + tier>0), así que tier 0, reduced motion y sin JS leen todo visible. El botón usa Lenis para llegar a `#contacto`.

**Anclas.** La sección es `#herramientas`; `#hablemos` queda como ancla interna del bloque de cierre, de modo que `chapters`/`checkpoint` siguen resolviendo ambos ids. Se retiraron `FinalCTA.tsx`, `lib/static-section.ts` (sólo lo usaba FinalCTA), el CSS de stack/cierre de `editorial.css` y `editorial-radiant.css` y, en `editorial-motion.ts`, las ramas de Studio/Stack/CTA: el controlador editorial sólo anima Equipo (intocable, sin cambios). Código: `Stack.tsx`, `StackMotion.tsx`, `styles/stack.css`.

## 21/10/2026 — Equilibrio entre scroll cinematográfico y secciones planas

Diagnóstico: en desktop, seis secciones eran recorridos fijados seguidos (Distancia 6,4 · Manifiesto 4,4 · Soluciones 6,8 · Proceso 2,8 · Proyectos 6,4 · Estudio 3,4 pantallas) y la página medía ~36 pantallas (~33.000 px a 1440×900) con el mismo ritmo de principio a fin. Ahora mide ~22 pantallas (~19.800 px) y alterna.

**Se queda como momento de scroll (más corto):** Distancia (4,4 pantallas; 3,4 en tier 1), Manifiesto (3,1), Proyectos como mazo con portal (4,6). Son las tres escenas con una idea que sólo funciona en movimiento (el viaje entre orillas, la línea que tacha y abre, el mazo/portal).

**Pasa a plano (reveals al entrar, sin pin):** Soluciones (cuatro tarjetas en una fila + línea de IA, ~1,3 pantallas), Proceso (cuatro pasos sobre una línea-puente, ~0,6; antes un slider horizontal de 280svh con medidas en vw), El Estudio (~1,6) y Criterio & Stack + cierre (~1,2). Equipo y Contacto no cambian de estructura.

**Texto repetido que se quitó:** las tres frases finales de Distancia («Entendemos el problema / Pensamos la solución / Construimos el puente») repetían Proceso; la ubicación de la franja de Manifiesto y la del cierre de Stack (quedan Estudio con coordenadas, Contacto y footer); el subtítulo de Proyectos («diseñadas desde el problema real, sin atajos») y el de Stack («Elegimos tecnología en función de…»), que repetían el mensaje «primero el problema» de Hero/Manifiesto/Soluciones/Criterio; el riel de nombres y los «01 / 04» de Soluciones; el párrafo de la columna izquierda de Contacto, que repetía el helper del formulario y el cierre. El título del formulario pasa de «Contáctanos» a «Conversemos» (voseo y coherente con el botón del menú). El eyebrow de Stack pasa a «05 ·» (había dos «04»).

**Código.** `SectionReveal.tsx` (genérico: `[data-reveal]` + `data-in` + enlace con Lenis) sirve a Stack y Proceso. Se retiró `pinnedSolutions`, `pinnedStudio`, el CSS fijado de ambas y se borró `ui/timeline.tsx` (el slider horizontal de Proceso). Infra heredada sin uso real: `DeferredNarrative*`, `ProcessMotion`, `styles/process*.css` y `prepare-narrative-styles` siguen cableados al build; conviene retirarlos en una pasada aparte.

## 21/10/2026 — Una sola familia tipográfica y un solo sistema de botones

**Tipografía.** Se eliminó la serif itálica (Instrument Serif) de todo el sitio: «La herramienta viene después del problema», la IA aplicada, las frases de Distancia/Stack/Estudio, «MEJORAR ALGO.», acentos de Contacto, etc. También se retiró Bricolage Grotesque: los titulares pasan a Geist (600–650, tracking ajustado) y las etiquetas siguen en Geist Mono. Resultado: dos familias (Geist + Geist Mono) en vez de cuatro; se borraron `bricolage.woff2` e `instrument-serif-italic.woff2` y sus licencias y se quitaron del preload. `--font-display` apunta ahora a Geist y `--font-editorial` ya no existe. El énfasis que antes daba la itálica ahora lo da el color de acento (p. ej. «MEJORAR ALGO.», «FUNCIONAR MEJOR.»). Equipo conserva Anton/Inter con estilos en línea (intocable), por eso sigue el `@import` de Google Fonts en `fonts.css`. Quedan sin uso `@fontsource-variable/bricolage-grotesque` y `@fontsource/instrument-serif` en `package.json` (los lee `scripts/subset-fonts.py`; retirarlos junto con ese script en una pasada aparte).

**Botones.** `.btn` + `.btn-primary` (relleno acento, texto navy) / `.btn-ghost` (contorno) + `.btn-sm` / `.btn-block`, con chip circular de flecha, definidos en `styles/globals.css`. Reemplazan los cuatro estilos anteriores: Hero (píldora con degradé), Proyectos (cuadrados mono en mayúsculas), cierre de Stack (caja con relleno que se desliza) y envío de Contacto (cian). Los textos de botón pasan de MAYÚSCULAS mono a frase en Geist. El botón «Conversemos» del menú ya era un contorno y no cambia.

## 21/10/2026 — Tipografía de tres familias y sistema de botones único

**Tipografía.** Se eliminó la serif itálica (Instrument Serif) de todo el sitio —«La herramienta viene después del problema», la IA aplicada, las frases de Distancia/Stack/Estudio, «MEJORAR ALGO.», los acentos de Contacto— por parecer elegante pero no tecnológica. La combinación final son tres familias con roles distintos: **Bricolage Grotesque** (titulares: carácter y escala), **Geist** (texto corrido y botones: precisión y legibilidad) y **Geist Mono** (etiquetas, numeración y datos técnicos). Ninguna está en la lista de prohibidas (Inter, Roboto, Arial, Helvetica, Open Sans, Montserrat, Poppins, Lato, Nunito, Raleway, Space Grotesk, fuentes del sistema; futuristas tipo Orbitron/Exo/Audiowide/Rajdhani/Oxanium/Michroma; decorativas). El énfasis que daba la itálica lo da ahora el color de acento («MEJORAR ALGO.», «FUNCIONAR MEJOR.») y el peso 600 con tracking cerrado. `--font-editorial` ya no existe; se borraron `instrument-serif-italic.woff2` y su licencia y se quitó del preload. Equipo conserva Anton/Inter con estilos en línea (intocable), por eso sigue el `@import` de Google Fonts en `fonts.css`. Pendiente aparte: `@fontsource/instrument-serif` sigue en `package.json` (lo lee `scripts/subset-fonts.py`).

**Botones.** `.btn` + `.btn-primary` (relleno acento, texto navy) / `.btn-ghost` (contorno) + `.btn-sm` / `.btn-block`, con chip circular de flecha, en `styles/globals.css`. Reemplazan cuatro estilos distintos: Hero (píldora con degradé), Proyectos (cuadrados mono en mayúsculas), cierre de Stack (caja con relleno deslizante) y envío de Contacto (cian). Los textos de botón pasan de MAYÚSCULAS mono a frase en Geist. «Conversemos» del menú ya era un contorno y no cambia.

## 21/10/2026 — Fondo vivo, acento luminoso y Archivo con eje de ancho

**Fondo vivo (`LivingBackground.tsx`, `styles/living-bg.css`).** Capa fija detrás de toda la home: degradé que cambia de temperatura por capítulo (atardecer en el Hero, noche/profundo/río en el medio, amanecer cálido en Contacto, decidido por la sección que cruza el centro de la pantalla), dos luces grandes que derivan con el scroll (fría con el acento; cálida sólo al amanecer) y el río como hilo de luz que se dibuja con el progreso total de la página. Las secciones de la home pasaron a ser transparentes (salvo Hero y Equipo) para que se vea; se quitaron los glows locales de Estudio y Stack. Sólo cambia variables CSS y transforms (`@property` para animar los colores); tier 0 y movimiento reducido lo dejan estático; en móvil se omite el brillo del río.

**Acento.** `#7FA6CF` (gris azulado) pasa a `#68B1FF` (azul eléctrico) en todos los estilos propios, incluido `distance-river.ts`; hover de botón `#8CC4FF`. Contacto abandona el cian propio (`#38bdf8`/`#0284c7`) y usa el mismo acento; en su panel claro el texto de acento es `#1B6FD8` por contraste. Equipo (intocable) conserva sus colores.

**Tipografía.** Bricolage se reemplaza por **Archivo** (variable, ejes `wght` 100–900 y `wdth` 62–125) como fuente de titulares. Los titulares gigantes (Distancia, Manifiesto, Soluciones, Proyectos, Estudio, cierre) van en peso 700 y ancho 118–122%; el resto en ancho normal: contraste de escala y ancho dentro de una sola familia. Se ajustaron los tamaños (≈ −15%) porque la fuente expandida ocupa más. Se retiraron `@fontsource-variable/bricolage-grotesque` y `@fontsource/instrument-serif` de `package.json`; `scripts/subset-fonts.py` apunta a Archivo.

## 21/10/2026 — 3D por escena y limpieza de plantilla

**3D con perspectiva (GSAP, sin WebGL).** Distancia: la cámara parte inclinada 12° (se ve la profundidad del río) y se endereza antes de alejarse. Manifiesto: la primera frase se acerca hasta atravesar la cámara (`z` + opacidad) mientras la segunda llega desde el fondo (`z:-420`). Soluciones: cada foto se inclina hacia el cursor con un brillo que lo sigue. El Estudio: parallax por capas con el cursor (cada frase hacia su orilla, la foto se inclina y avanza en sentido contrario). Fondo vivo: las luces derivan también con el cursor. Todo el seguimiento de cursor es sólo para puntero fino y tier completo; móvil y tier 1 conservan los reveals, tier 0 y movimiento reducido quedan estáticos.

**Soluciones: fotos en duotono.** Las cuatro imágenes comparten un virado azul (escala de grises + `mix-blend-mode:color`) y recuperan su color al acercar el cursor o enfocar, para que se lean como un sistema y no como cuatro fotos de stock distintas. La maqueta «MAISON NOIR» sigue siendo legible en la primera tarjeta: conviene reemplazarla por una captura propia.

**Señales de plantilla retiradas.** `.mono` ya no fuerza mayúsculas y el tracking de etiquetas baja de .1–.3em a .03em; se quitaron el eyebrow de Proyectos y el de El Estudio (repetían el título), la numeración de Soluciones y de las capas de Stack (no son secuencias; Proceso la conserva) y los puntos decorativos; Manifiesto, Stack y Proceso conservan su nombre en minúsculas. El énfasis de color dentro de los titulares («EL CRITERIO NO.», «Empezamos escuchando.», «MEJORAR ALGO.», «FUNCIONAR MEJOR.», «UNA MISMA FORMA DE TRABAJAR.») pasa a contraste de peso y ancho (300 / ancho normal frente a 700 expandido).

## 21/10/2026 — Proyectos: carrusel con flechas, sin scroll

El mazo de Proyectos dejó de depender del scroll: antes ocupaba 4,6 pantallas de recorrido fijado y obligaba a pasar por los cinco casos; ahora la sección mide una pantalla (~900px) y el usuario sigue de largo cuando quiere. Se navega con las flechas, el riel numerado, el teclado (← →, sólo con la sección en pantalla) o arrastrando; el scroll no mueve nada (verificado: las flechas no cambian `scrollY`). La posición del carrusel es un estado (`index`) animado con un tween de GSAP; ya no hay ScrollTrigger de scrub ni `end: bottom bottom`, sólo una entrada del título al acercarse.

**Portadas opacas.** Se eliminó la transparencia: todas las portadas son opacas y la jerarquía sale de la escala, la profundidad, el orden de apilado por distancia (`zIndex`) y un velo oscuro (`--dim`, hasta .78 para las que asoman a la derecha; la saliente se oscurece hasta el negro y se oculta al salir) en lugar de bajar la opacidad.

**Flechas.** Píldoras de vidrio de 54px que, al pasar el cursor, se expanden y muestran el proyecto de destino («Aeropuertos», «Clasificador IA»…), se rellenan con el acento y se elevan con un brillo; se desactivan en el primer y último proyecto. El contador y las etiquetas se actualizan por JS; las `aria-label` nombran el destino.

**Modos.** ≥1024px y ≥681px de alto: mazo 3D (portadas con perspectiva, info a la izquierda). Menor: una portada por vez con las flechas arriba del contenido (la sección pasa de ~4,8 a ~1,3 pantallas en móvil). Tier 0, sin JS y movimiento reducido: lista completa de los cinco proyectos. Código: `projects-timeline.ts` (`carousel`, modos `deck`/`slide`), `ProjectsMotion.tsx`, `projects-showcase.css`.

## 24/10/2026 — Distancia: una sola copia del texto, contraste de ancho y la distancia que se cierra

**Texto duplicado.** `Words` emitía cada frase dos veces (un `sr-only` con el texto plano más las palabras partidas con `aria-hidden`): «Entre tener un problema…» y «Ahí trabajamos nosotros.» salían repetidas en `textContent` (indexable/copiable). Ahora las palabras partidas son el único texto (los espacios son nodos reales). `ORILLA 01/02` aparecían además dos veces a la vez (HUD y rótulo sobre cada orilla): se dejó el HUD. Se quitó `distanceCopy.statements` (ya no se renderizaba; repetía Proceso) y se actualizó `scripts/qa-scenes-extra.mjs`.

**Tipografía (sólo Archivo, ejes de peso y ancho).** Orillas en 800 / ancho 125 %; la frase puente en 300 / ancho 85 % (liviana y estrecha); el cierre «Ahí trabajamos» en 300 y «nosotros.» en 800 / 125 %. El énfasis es de peso y ancho, no de color. Se redujo el tamaño del flujo estático de las orillas (el ancho extra cortaba «TECNOLOGÍA» a 1440 px). Se quitó un `letter-spacing` duplicado en `.dc-text` y se achicó la sombra de texto de las orillas.

**Coreografía.** La pista sigue siendo la misma (sticky + un ScrollTrigger, 440/340svh). Cambios en `distance-timeline.ts`: (1) el viaje arranca y frena con coseno y se demora donde la frase queda centrada (`createTravel`, ease por función; las revelaciones se ubican con `timeAt` según dónde está la frase y no con números fijos); (2) la frase se revela al entrar y sale antes del zoom (sin ella el zoom la traía de vuelta al encuadre final); (3) tras el zoom, las dos orillas caminan una hacia la otra y la cota se acorta hasta quedar casi en una línea (`--d-close`, fracción del hueco que queda); (4) [reemplazado el mismo día, ver la entrada siguiente: el puente SVG ya no existe] las orillas se acercan y recién entonces entra «Ahí trabajamos nosotros.»; (5) la orilla derecha se solidifica con `opacity` (antes `color`) y el borde de cada orilla es un elemento (`.bank-edge`) en lugar de una custom property heredada; (6) el pre-pin usa `scrub: true` en tier 2 porque Lenis ya suaviza.

**Medido (Chromium, 1440×900, build de producción, tier 2).** Cada frase aparece una vez en `main`. La frase puente queda entera y revelada ≈ 253 px de scroll (≈ 28svh) entre p=.20 y .275; con la versión anterior la estimación geométrica era ≈ 185 px, o sea ≈ 1,4× y no más. Velocidad de la pista al centro de la frase ≈ 4300 px por unidad de progreso frente a ≈ 7000 antes (lineal); en el tramo previo, vacío, llega a ≈ 13000. No se midieron Lighthouse, CLS ni frames largos; tier 1 en escritorio no se revisó con capturas.

## 24/10/2026 — Distancia: la conexión pasa a ser una corriente de partículas líquidas (WebGL2)

**Qué se quitó.** El puente colgante SVG (cubierta, pilotes, cable, 19 tensores) y la foto aérea del río con su recuadro (`.distance-aerial`). El archivo `public/images/distance/river-aerial.webp` ya no se referencia desde el código (sigue en `public/` y en `data/asset-manifest.json`; retirarlo es una decisión aparte).

**Qué hay ahora.** Un canvas WebGL2 (`.distance-flow`, `aria-hidden`, `pointer-events:none`) detrás de las palabras. Mientras la cámara cruza el río es una corriente de partículas dispersa y turbulenta que fluye en horizontal; al final (beat `gather` .74, duración .18 del recorrido) converge y se tensa en filamentos entrelazados (crema + acento `#68B1FF`) entre «TU NEGOCIO» y «LA TECNOLOGÍA», justo antes de que entre «Ahí trabajamos nosotros.» (beat `outro` .90). El escalón de scroll se suaviza dentro del motor y la vuelta elástica de las partículas da la tensión. Con el puntero fino, pasar sobre el puente (ya formado) abre las partículas con streaks y vuelven con resorte (campo de estela `FLOW_FS` + física `SIM_FS`).

**Código.** `components/sections/liquid-flow.ts` (motor GPGPU: estado en texturas RGBA16F con ping-pong, instancias de cápsulas, estela del puntero; la escultura es una imagen de filamentos dibujada en un canvas offscreen y muestreada, sin imágenes ni CDN), `distance-flow.ts` (pegamento con la escena: mide dónde queda el puente tras el zoom, `IntersectionObserver` para pausar fuera de pantalla, carga diferida del motor con `import()`, puntero, fallbacks) y `distance-timeline.ts` (un solo proxy `gather` dentro del timeline maestro; no hay estado de React por frame). La parte final de `distance.css` y `Distance.tsx` quedaron sin SVG ni foto.

**Origen y licencia.** La arquitectura del motor se adaptó del componente «Sculpture Hero» de 21st.dev (autor: guglielmogiannattasio.it). La página no declara licencia: **sin verificar**. El código se reescribió (otro pipeline de partículas, sin la pasada de imagen ni la detección de fondo, sin demo ni imágenes del CDN de 21st.dev); antes de publicar conviene confirmar los términos con el autor o reemplazar la referencia.

**Tiers.** Tier 2: simulación completa (hasta 70 000 partículas, DPR ≤ 1,75 y ≤ 4 Mpx). Tier 1 y móvil: `lowPower` (≤ 22 000 partículas, DPR 1, menos streaks, sin interacción de puntero); en móvil la corriente cae por la «distancia» y se recoge en un hilo vertical junto al margen. Tier 0, `prefers-reduced-motion`, sin JS: el canvas no se muestra y queda sólo el texto (sin puente). Sin WebGL2 o sin render targets flotantes: los mismos filamentos dibujados una vez en 2D, que aparecen por opacidad. `webglcontextlost`: se oculta el canvas. El motor se detiene fuera de pantalla y no corre con la pestaña oculta (rAF).

**Medido (Chromium headless con SwiftShader, 1440×900, 390×844, build de producción).** Escena a 10 progresos en tier 2 (corriente → convergencia → puente → cierre); modo sin WebGL2 y modo `reduce`; móvil. Sólo hay peticiones a 127.0.0.1 desde esta escena. **No medido:** rendimiento en GPU real (SwiftShader no sirve para eso), Lighthouse/LCP/TBT, CLS, memoria tras montar/desmontar ×10, la interacción de hover (SwiftShader corre el canvas a ≈ 3 fps y el conteo de píxeles fuera de la banda del puente no fue concluyente: no se puede afirmar que el hover abra y devuelva las partículas hasta probarlo con GPU), tier 1 en escritorio con capturas.


## Distancia: sin puente, sin regla, sin fondo propio

**Decisión del equipo.** Se retiran de Distancia el puente de filamentos (nube de partículas WebGL que convergía entre las orillas), la corriente de partículas y las líneas de agua que corrían detrás del texto, la regla con marcas y su cota «DISTANCIA», y la capa de atmósfera (grano + viñeta propia). La escena queda sobre el fondo vivo global.

**Se conserva** el deslizamiento horizontal hasta la otra orilla (la parte que gustó), la brújula superior «ORILLA 01 — ORILLA 02», el viaje inclinado que se endereza, el zoom-out, el cierre de las orillas (`--d-close` pasa de .42 a .2: quedan casi juntas) y «Ahí trabajamos nosotros.» (entra a los .88 del recorrido).

**Código.** Se borran `distance-river.ts`, `distance-flow.ts` y `liquid-flow.ts`; `distance-timeline.ts` ya no tiene beats `gather`, ni `near`/regla; `content/site.ts` pierde `distanceCopy.measure`. Móvil: flujo vertical con reveals y el hilo que se dibuja, sin canvas.

### Distancia: el cruce (prueba)

Reemplaza el final anterior. **Sin zoom-out ni vista general**: el viaje horizontal termina en «LA TECNOLOGÍA» (que se achica a `min(10.8vw,24svh)` para verse entera), reposa un instante y el pin se suelta; «Ahí trabajamos nosotros.» sube por debajo en el último tramo fijado (`margin-top:-21svh`) y ambas siguen hacia abajo con el scroll normal. El escenario sticky vive en `.distance-runway` (330/360svh) y el cierre es hermano, fuera del pin.

**Fondo:** vuelve el río en canvas 2D (`distance-river.ts`) con grano y viñeta, enmascarados abajo para que no quede franja al soltar el pin. **Sin partículas** (no convencieron) ni puente ni regla. Para que se entienda la idea, una luz rotulada «NOSOTROS» cruza el río por el centro de la pantalla mientras la pista avanza: espera en la primera orilla, abre una estela en el agua y se apaga al tocar la otra. Móvil sin cambios (flujo vertical con reveals).

### Distancia: fondo de franjas y partícula sola

Se retira el río en canvas (no se quiere una simulación de agua en el medio) y se borra `distance-river.ts`. **Fondo**: adaptación en CSS puro del patrón «elegant dark pattern» de 21st.dev (referencia; el código se reescribió, sin dependencias ni la textura de su CDN): brillo frío desde arriba a la izquierda, cuatro franjas inclinadas 45° en el acento `#68B1FF` que se desvanecen hacia abajo, grilla de puntos tenue y el grano local; también se ve en móvil y tier 0. **«Nosotros»**: una sola partícula (`.distance-particle`, movida por `distance-crossing.ts` leyendo la `x` de la pista) que espera en la primera orilla, cruza por el centro de la pantalla y se apaga al tocar la otra. Sin estela, líneas ni etiqueta.

## Manifiesto retirado

**Decisión del equipo.** Se elimina la sección Manifiesto («NO HACEMOS TECNOLOGÍA PORQUE SÍ. / LA HACEMOS CUANDO PUEDE MEJORAR ALGO.»): no gustó. La home queda Hero → Distancia → Soluciones → Proceso → Proyectos → Estudio → Equipo → Stack → Contacto. Se borran `Manifesto.tsx`, `manifestoCopy`, las funciones `pinnedManifesto`/`flowManifesto` y los estilos `.ap-beat/.ap-statement/.ap-telemetry/...`; `ApproachMotion` y `approach-timeline.ts` quedan sólo para Soluciones (plana). Sale también de la navegación de «Estudio», del riel lateral (`content/checkpoint.ts`) y del fondo vivo. La foto `public/images/river-delta.jpg` queda sin uso. Página: ~12.900 px a 1440×900 (antes ~16.300).

## Un solo fondo para toda la home

`LivingBackground` deja de ser un fondo vivo (tonos por sección, luces que seguían al scroll y al cursor, río SVG) y pasa a ser **estático y único**: el patrón de franjas inclinadas en el acento, brillo desde arriba a la izquierda, grilla de puntos, grano y viñeta (adaptación CSS del «elegant dark pattern» de 21st.dev), fijo al viewport detrás de todas las secciones. Ya no es Client Component ni escucha eventos. Para que se vea: `main.site-main` pasa a transparente en la home (su color sólido tapaba la capa desde antes), Distancia pierde su copia propia del patrón y Proyectos apaga su viñeta con bordes sólidos, el resplandor borroso de la portada activa y su grano duplicado (cortaban el fondo entre Proceso y Proyectos). Conservan fondo propio el Hero (video), Equipo (intocable) y el panel claro de Contacto.
