# Contenido pendiente de Dos Orillas

El copy del brief vive en `content/` y los cinco proyectos en `data/projects.ts`. La home, los casos y contacto están integrados. `null` significa que el bloque se omite; no se completan años, resultados, clientes, métricas ni colaboradores por deducción. Los esquemas de proyectos se identifican como conceptuales; las fotografías ausentes no se presentan como reales. Las fotos y bios siguientes son ampliaciones de contenido y no justifican publicar datos inventados.

## Marca y datos generales

- **ENTREGADO Y VERIFICADO:** SVG oficiales del ZIP, copiados byte a byte: `/brand/logo.svg`, `/brand/logo-light.svg`, `/brand/mark.svg`, `/brand/logo-horizontal.svg` y `/brand/logo-horizontal-light.svg`. El logo no se redibuja.
- **CONFIRMAR:** modalidad presencial/remota, alcance geográfico y disponibilidad. `workModality`, `coverage` y `availability` permanecen `null`.
- **CONFIRMAR:** la cuenta enlazada `https://www.instagram.com/dosorillas.estudio/` corresponde al estudio.
- **CONFIRMAR:** etiquetas visibles de contexto. Default: `Caso de estudio`; para Retail Vision, cuyo contexto académico está explícito en el brief, `Proyecto académico`.
- **PENDIENTE:** dominio propio, URL canónica, plan y cuenta de Vercel.
- **CONFIRMAR antes de publicación:** condiciones vigentes del plan de Vercel para uso comercial y cuotas de imágenes.
- **CONFIRMAR:** aprobación de Vercel Analytics y Speed Insights; permanecen desactivados hasta aprobación.

## Hero cinematográfico y La distancia (F4)

- **RESUELTO:** el 12/10/2026 el usuario eligió expresamente el video original `hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4`. La referencia y rutas se centralizan en `content/hero-film.ts`.
- **INTEGRADO:** `/visuals/dos-orillas-film-mobile.mp4` (192892 B), `/visuals/dos-orillas-film.mp4` (7685079 B) y poster del mismo video `/visuals/hero-film-poster.webp` (39406 B). Estos tamaños describen archivos locales, no un resultado de rendimiento.
- Las dos fotografías `_hero/orilla-1.webp` / `_hero/orilla-2.webp` dejan de ser requeridas para el Hero actual. Su coreografía de pin e intro fue sustituida por video y contenido en flujo natural.
- Las dos imágenes generadas rechazadas permanecen fuera del repositorio. No incorporar marcas, textos ni assets de Prisma, VEX o Joinlab.
- El video es escenario decorativo: no identifica al equipo, un cliente ni una ubicación regional real. El nombre de Concepción del Uruguay, Entre Ríos identifica al estudio.
- **ENTREGADO:** video de escritorio a 1924×1076 nativos y poster de escritorio de 112962 B; versión móvil conservada. Las comprobaciones actuales y sus límites se registran en `docs/DECISIONS.md`.
- La distancia no necesita assets fotográficos; las líneas de cota son decorativas. El texto está completo en el brief.

## Referencia regional autorizada

El usuario autorizó incorporar referencias a Concepción del Uruguay, el río, las orillas y el paisaje entrerriano como dirección visual opcional. Pueden orientar la selección de fotografías reales si ayudan al relato del estudio. No obligan a mostrar un puente físico ni a repetir una misma metáfora en todas las secciones.

- **PENDIENTE opcional:** seleccionar, entre los archivos reales que se aporten, una imagen regional adecuada para los espacios previstos; mantener los ratios y describir su contenido mediante `alt` y punto focal.
- Incorporar la referencia cuando tenga una función concreta de identidad, contexto o transición. No sumar imágenes de relleno ni generar fotografías que se presenten como reales.
- Esta autorización visual no confirma cobertura comercial, modalidad de trabajo ni disponibilidad: esos campos permanecen `null` hasta validación.

## Manifiesto, Soluciones y El estudio (F4/F7)

- **PENDIENTE:** `/projects/_manifesto/vertical.webp`, mínimo 1800 × 2400 (3:4).
- **PENDIENTE opcional:** `/projects/_services/web.webp`, `/projects/_services/sistemas.webp`, `/projects/_services/automatizacion.webp`, `/projects/_services/datos.webp`, mínimo 1400 × 1750 (4:5).
- **PENDIENTE:** dos o tres fotografías de trabajo/personas para `/projects/_studio/01.webp`, `02.webp`, `03.webp`, con ratios mezclados. Las dimensiones actuales reservan espacio, no describen archivos entregados.
- **PENDIENTE:** alternativas accesibles y puntos focales de las imágenes reales.

## Equipo (F7)

- **PENDIENTE:** `/team/santino-01.webp` y `/team/tobias-01.webp`, mínimo 1800 × 2250 (4:5). Alternativas `santino-02.webp` y `tobias-02.webp` opcionales.
- **PENDIENTE:** bios cortas de Santino y Tobías; `bio: null` en ambos.
- **CONFIRMAR Santino:** Diseño · UX/UI · Contenido · Backend y datos.
- **CONFIRMAR Tobías:** Desarrollo web · Bases de datos.
- `focus: null` evita publicar áreas sin validar; las propuestas del brief se conservan en `pendingFocus`, con `focusConfirmed: false`.
- **PENDIENTE:** proyectos de Tobías; no se inventan ni se agregan tarjetas vacías.

## Contacto y privacidad (F7/F8)

- **CONFIRMAR:** “Usamos tus datos solo para responderte.” Se conserva como `pendingPrivacy`; `privacy: null` hasta validación.
- **PENDIENTE:** texto de `/privacidad`; no inventar política legal. La estructura no publicada está en `components/legal/PrivacyDraft.tsx`, con párrafos `null`. Crear la ruta sólo después de aprobar ese texto; mientras tanto `/privacidad` usa el 404 general, también sin JavaScript.
- **PENDIENTE:** método definitivo de envío y dominio verificado para Resend (o alternativa). Definir `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL`.
- Mientras no haya envío operativo, el fallback autorizado es `mailto:dosorillasestudio@gmail.com`. No mostrar estado de éxito por abrir mailto.

## Proyectos: pendientes comunes

Los cinco tienen `year`, `intro`, `challenge`, `approach`, `solution`, `result`, `liveUrl` y `githubUrl` en `null`, portada con `src: null` y galería vacía. Las descripciones y tecnologías proceden del brief. No hay resultados ni métricas.

Para cada slug se necesita `/projects/<slug>/cover.webp`, mínimo 2400 × 1500 (16:10; opcional recorte 4:5), y dos a cuatro `/projects/<slug>/gallery-XX.webp`, lado mayor mínimo 1600 px. Aportar texto alternativo descriptivo de cada captura. El esquema conceptual del brief se usa solo como tal y se rotula `ESQUEMA CONCEPTUAL`.

### Mate Único — `mate-unico`

- **PENDIENTE:** año, introducción, problema, proceso, solución, resultado real, links, portada y galería.
- **CONFIRMAR:** contexto. `personal` es un default técnico provisional con badge `Caso de estudio`, nunca un cliente comercial.
- **CONFIRMAR:** React (Router), Node.js/Express, PostgreSQL, Strapi, API de Mercado Pago, Google OAuth, Figma y UML.
- **CONFIRMAR:** catálogo, productos, combos, stock, carrito, autenticación, Google Login, Mercado Pago, cupones, envíos, reseñas y panel administrativo son funcionalidades contempladas; no prometer funcionalidades operativas que aún no se verificaron.
- No agregar ventas, usuarios ni resultados comerciales.

### Gestión Aeroportuaria — `gestion-aeroportuaria`

- **PENDIENTE:** año, introducción, problema, proceso, solución, resultado real, links, portada y galería.
- **CONFIRMAR:** contexto personal o académico; el brief no lo determina. `personal` provisional con badge `Caso de estudio`.
- Se conservan API REST, MongoDB, Redis, Leaflet, Docker y Docker Compose. El brief describe CRUD, búsquedas geográficas/cercanos, ranking, mapa y clustering; no inventar aeropuertos concretos ni valores de popularidad.

### Clasificador de Frutas — `clasificador-de-frutas`

- **PENDIENTE:** año, introducción, problema, proceso, solución, resultado real, links, portada y galería.
- **CONFIRMAR:** contexto personal o académico; `personal` provisional con badge `Caso de estudio`.
- **CONFIRMAR:** dos corridas encadenadas (variedad y calidad) y limitaciones documentadas.
- **PENDIENTE:** stack de implementación; solo se lista ART1 (Carpenter-Grossberg), expresamente indicado. No inferir lenguaje o librería.
- No agregar accuracy, porcentajes ni resultados de clasificación.

### Retail Vision — `retail-vision`

- **PENDIENTE:** año, introducción, problema, proceso, solución, resultado real, links, portada y galería.
- Contexto `academico` confirmado por el brief; conservar transparencia y no mencionar compañeros sin autorización expresa.
- **CONFIRMAR antes de publicación:** modelo en estrella con cuatro tablas de hechos, pipeline ETL completo en PostgreSQL, dashboards en Tableau, informe formal y hallazgos de integridad de datos.
- No completar campos, clientes, KPIs ni cifras. Los ejes conceptuales quedan vacíos y marcados `a completar`.

### Transacciones en Tiempo Real — `transacciones-en-tiempo-real`

- **PENDIENTE:** año, introducción, problema, proceso, solución, resultado real, links, portada y galería.
- **CONFIRMAR:** contexto personal o académico; `personal` provisional con badge `Caso de estudio`.
- Se conservan Next.js, KafkaJS y Server-Sent Events. El sistema conceptual usa comandos, eventos, procesador, DLQ y timeline del brief.
- No agregar estadísticas de eventos, tasas de error ni métricas de rendimiento.

## Assets técnicos

- **ENTREGADO:** `/textures/grain.svg`, tile 200 × 200: textura SVG decorativa permitida por la sección 5.1; no es contenido fotográfico del equipo.
- **INTEGRADO:** imágenes Open Graph de home, índice y cinco casos a 1200×630, generadas desde la marca oficial y el contenido confirmado; icono Apple de 180×180.
- Confirmar que el manifest prioriza automáticamente los archivos reales y que los rótulos de ruta/dimensión del placeholder aparecen solo en desarrollo.

## Cierre y publicación

F4–F8 están integradas: narrativa, carrusel/grilla, índice/casos, estudio/equipo/herramientas, cierre/contacto y SEO. La prueba temporal del sexto proyecto se ejecutó y los cinco datos originales se restauraron; no se publica el fixture. Las pruebas finales de la versión integrada y el rendimiento conservan los presupuestos del pedido y se registran con su alcance en `docs/DECISIONS.md`.

El 14/10/2026 el usuario pidió entregar un ZIP completo para su IDE y posponer la publicación. El uso local no necesita cuenta, dominio ni proveedor de correo. Cuando se decida publicar, la guía está en `docs/DEPLOYMENT.md`; entonces se completarán la URL pública y la configuración de envío real. NVDA, dispositivos físicos e INP con visitas reales todavía no fueron comprobados. F10 conserva carácter opcional y no bloquea el diseño solicitado.

El gate de rendimiento móvil también queda abierto: Performance78, LCP3815.5105ms y TBT447.0015ms no alcanzan los límites originales. Escritorio99 aprueba su perfil. Resolver y volver a medir móvil antes de declarar la QA global/publicación aprobada; consultar `docs/VALIDATION.md`.
