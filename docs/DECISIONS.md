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
