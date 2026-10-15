# PROMPT MAESTRO — DOS ORILLAS ESTUDIO
### Sitio web oficial · Next.js + GSAP + Lenis · Deploy en Vercel · Para ejecutar con Codex

> **Cómo usar este documento.** Guardalo como `PROMPT.md` en la raíz de un repo nuevo (o pegalo entero) y pedile a Codex: *"Leé PROMPT.md completo, creá `docs/DECISIONS.md` y ejecutá las fases de la sección 15 en orden, verificando al cierre de cada una."*
>
> Tiene tres niveles: **contrato** (qué sí / qué no), **sistema** (tokens, motion system, arquitectura, catálogo de técnicas) y **escenas** (qué pasa en cada sección, cuadro por cuadro).
>
> Convenciones: `CONFIRMAR` = el dato existe pero el equipo debe validarlo antes de publicar. `PENDIENTE` = todavía no existe y **no debe inventarse**. Los valores numéricos de movimiento son *valores iniciales para afinar a ojo*, no dogmas.

## Índice
0. Rol, modo de trabajo y reglas de oro
1. La marca
2. Objetivo, narrativa y mapa de ritmo
3. Contenido: reglas, banco de copy, microcopy y proyectos
4. Stack, configuración y estructura del repo
5. Sistema de diseño (tokens, tipografía, grilla, imágenes)
6. Motion system (principios, tiers, infraestructura)
7. Catálogo de técnicas de animación (qué es, cómo se hace)
8. Escenas, sección por sección
9. Páginas de proyecto, transiciones entre páginas y `/projects`
10. Interacciones globales (navegación, cursor, progreso, tema)
11. Contacto, SEO, accesibilidad
12. Performance y degradación adaptativa
13. Deploy en Vercel
14. QA, Definition of Done y anti-patrones
15. Fases de ejecución
16. Extras propuestos y lista de assets que tiene que aportar el equipo

---

## 0. Rol, modo de trabajo y reglas de oro

### 0.1 Rol
Actuá como **Creative Developer senior + director de arte + ingeniero de performance**. Tu trabajo es construir un sitio que parezca hecho por un estudio que vende precisamente la capacidad de crear buenas experiencias digitales. No es una landing de plantilla ni un portfolio de código: es una **experiencia editorial narrada con scroll**.

La referencia es el **nivel** de dirección de arte, fluidez y storytelling de sitios de Awwwards y de experiencias como las de Charles Leclerc y Lando Norris. **No copiar** su branding, layouts ni composiciones. Todo debe sentirse 100 % Dos Orillas.

### 0.2 Modo de trabajo
- Trabajá de forma **autónoma**. Tomá decisiones razonables por defecto y registralas en `docs/DECISIONS.md` (decisión · alternativas · motivo). Preguntá solo si algo bloquea de verdad y no se puede resolver con un default.
- Construí **por fases** (sección 15). Al cerrar cada fase: `pnpm lint && pnpm typecheck && pnpm build`, revisión visual con capturas Playwright en 375 / 768 / 1024 / 1440 / 1920 px, y un commit descriptivo.
- **No simplifiques el diseño automáticamente.** Si una animación compleja compromete seriamente performance o accesibilidad, no la elimines: implementá una versión técnicamente más eficiente que conserve la intención visual, y documentalo.
- Prioridades de diseño (en este orden): 1 narrativa · 2 dirección de arte · 3 UX · 4 movimiento · 5 performance · 6 código mantenible. **Accesibilidad y `prefers-reduced-motion` no son prioridades negociables: son restricciones.**
- Creá y mantené `docs/ANIMATIONS.md`: por cada animación, **Intención** (¿por qué se mueve así? → verbo del motion system), **Disparador**, **Propiedades animadas**, **Fallback mobile** y **Fallback reduced-motion**. Si no podés justificar una animación con *narrativa, jerarquía, interacción, conexión, dos orillas o descubrimiento*, no la hagas.
- Creá `docs/CONTENT_TODO.md` con todo lo `PENDIENTE` / `CONFIRMAR` que encuentres, agrupado por sección y por proyecto.

### 0.3 Reglas de oro (contrato)
1. **No inventar nada**: clientes, testimonios, números, usuarios, facturación, métricas, años de experiencia, empresas, resultados, premios, porcentajes, fechas, ni "cantidad de proyectos". Si un dato no existe: placeholder editable visible solo en desarrollo, o directamente omitir el bloque.
2. **No copiar** a Leclerc/Norris ni a ningún sitio de referencia.
3. **El contenido nunca depende del hover** ni de JavaScript para existir: el HTML semántico contiene todo el texto; la animación lo *revela*, no lo *crea*.
4. **Nada de scroll secuestrado**: nunca capturar el wheel a mano, nunca snap forzado que pelee con el usuario, nunca bloquear el scroll durante animaciones de contenido (solo durante loader y menú abierto).
5. **Animar solo `transform`, `opacity` y `clip-path`** (y `filter` puntual en elementos chicos). Evitar animar `width/height/top/left/box-shadow/backdrop-filter`.
6. **El sitio funciona perfecto sin WebGL, sin JS de animación y con `prefers-reduced-motion`.** Todo es progressive enhancement.
7. **Cero overflow horizontal accidental** (`html { overflow-x: clip }`, nunca `overflow: hidden` en `body`; cuidado con `100vw`).
8. **Todo ScrollTrigger se limpia** al desmontar (`useGSAP` + `gsap.context` / `matchMedia`). Sin memory leaks.
9. **Lección aprendida de un proyecto anterior del equipo:** una web con GSAP + Three.js pesados tuvo en mobile un TBT de varios segundos y LCP > 10 s por imágenes sin optimizar. Por eso hay **presupuestos de performance estrictos (sección 12)** y **degradación por tiers**. Medí Lighthouse *mobile* al terminar cada fase; si una fase empeora el score, se corrige antes de seguir.
10. **El logo no se redibuja ni se reinterpreta.** Se usa el SVG provisto por el equipo (sección 1.6).

---

## 1. La marca

### 1.1 Qué es
**Dos Orillas Estudio** — estudio de soluciones digitales de **Concepción del Uruguay, Entre Ríos, Argentina**, creado por **Santino Dacuy** y **Tobías Carballo** (ambos Analistas en Sistemas). No es una agencia tecnológica genérica ni una software factory que vende herramientas.

### 1.2 Filosofía
> **“Primero entendemos. Después hacemos.”**
> No hacemos tecnología porque sí; la hacemos cuando puede mejorar algo. No empezamos preguntando *“¿qué tecnología querés?”* sino *“¿qué problema querés resolver?”*. Hacemos que la tecnología se adapte al negocio, no al revés.

### 1.3 La metáfora (atraviesa todo el sitio, sin volverse literal ni infantil)
| ORILLA 1 | ORILLA 2 |
|---|---|
| el negocio, la persona, el problema, el desorden, la situación actual | la solución, la organización, la tecnología, la situación deseada |

Pares asociados: negocio ↔ tecnología · problema ↔ solución · cliente ↔ equipo · situación actual ↔ deseada · idea ↔ producto funcionando.
**Dos Orillas construye el puente entre ambas.** El puente es una **línea fina azul**, recurso de marca (sección 5.6). **Nunca** dibujar un puente literal.
Ancla geográfica opcional (usar con mucha sutileza, solo en fotografía/atmósfera, nunca como ilustración): la luz, el agua y el horizonte del río Uruguay.

### 1.4 Atributos y tono
Cercanía · profesionalismo · criterio · confianza · calidez · tranquilidad · curiosidad · claridad · creatividad · capacidad técnica.
- **Voz**: español rioplatense con **voseo** (“contanos”, “escribinos”, “querés”), cálido, directo, sin tecnicismos innecesarios, sin buzzwords. Cercano como “dos gurises que dan una buena solución”, pero con criterio profesional.
- **Prohibido** sonar a: consultora multinacional fría, startup cripto, agencia de marketing, plantilla SaaS, portfolio de programadores lleno de código, web futurista genérica, estética de “IA”.
- **Frases vacías prohibidas**: “Transformamos ideas en experiencias digitales increíbles”, “Impulsamos el futuro”, “Revolucionamos tu negocio”, “Potenciamos tu transformación digital”, “soluciones innovadoras”, “llevamos tu negocio al siguiente nivel”.

### 1.5 Modalidad y alcance `CONFIRMAR`
Trabajo presencial o remoto, cercanía al cliente (ir al local, entender el problema desde adentro); mercado principal Argentina, con ciudades de Uruguay cercanas por la frontera. **No afirmar cobertura, tiempos de respuesta ni disponibilidad** hasta que el equipo lo confirme. Dejar `siteConfig.availability = null` (si algún día se completa, se muestra un sello discreto en el footer).

### 1.6 Logo
Wordmark “DOS ORILLAS ESTUDIO” en negro sobre fondo claro, con la “O” de “DOS” formando un río/puente. El equipo entrega:
`/public/brand/logo.svg` (para fondos claros) · `/public/brand/logo-light.svg` (para fondos oscuros) · `/public/brand/mark.svg` (la “O” sola → favicon/OG).
**Mientras no existan**: componente `<Logo>` con wordmark tipográfico provisorio (“DOS ORILLAS” + “ESTUDIO” chico), con un `data-placeholder` y un aviso en `CONTENT_TODO.md`. No intentes dibujar la “O”-puente.

---

## 2. Objetivo, narrativa y mapa de ritmo

### 2.1 Qué debe entender un visitante nuevo
1. Quiénes somos · 2. Qué hacemos · 3. Cómo pensamos · 4. Qué problemas resolvemos · 5. Cómo trabajamos · 6. Qué construimos · 7. Quiénes están detrás · 8. Cómo contactarnos.
No como bloques sueltos: como **una historia** con ritmo.

### 2.2 Arco narrativo
`PROBLEMA → ENTENDER → PENSAR → CONSTRUIR → CONECTAR → SOLUCIÓN`
No se explica: **se siente** mediante diseño y movimiento. La página abre con dos mundos separados y, al avanzar, las piezas se acercan, las líneas se conectan, las fotos cruzan la pantalla y el contenido pasa de una orilla a la otra.

### 2.2.1 Nombre del concepto: **“CONSTRUIR EL PUENTE”**

### 2.3 Mapa de ritmo (orden final de la home)
Alternar **impacto / respiro / información / exploración**. Nunca dos escenas de impacto seguidas sin un respiro. Largo total objetivo: ~20–25 pantallas en desktop, bastante menos en mobile.

| # | Escena | Verbo | Tipo | Tema (fondo) | Scroll desktop | Mobile |
|---|---|---|---|---|---|---|
| 00 | Loader | CONECTAR | sorpresa | navy → crema | ~1,2 s (tiempo) | igual |
| 01 | Hero | SEPARAR → ACERCAR | impacto | crema | 100svh + pin 250 % | pin 120 % (variante vertical) |
| 02 | La distancia entre dos orillas | ACERCAR → CONECTAR | impacto tipográfico | navy-deep | pin 300 % | sin pin largo |
| 03 | Manifiesto | REVELAR | respiro | crema | ~220svh | ~150svh |
| 04 | Soluciones | REVELAR / CRUZAR | informativo + exploración | blanco roto | ~200svh | ~180svh |
| 05 | Cómo trabajamos | CRUZAR | impacto | navy | pin horizontal ~400 % | vertical |
| 06 | Proyectos destacados | CRUZAR / REVELAR | impacto cinematográfico | tono por proyecto | pin N×100svh | sin pin, N×~110svh |
| 07 | Todos los proyectos | REVELAR | exploración | crema | ~250svh | ~200svh |
| 08 | El estudio | ACERCAR | lectura | blanco roto | ~250svh | ~200svh |
| 09 | Equipo | ACERCAR | personas | crema | pin liviano 150 % | vertical |
| 10 | Herramientas | (el criterio no cambia) | respiro | crema | ~100svh | ~80svh |
| 11 | CTA final | CONECTAR | emocional | navy-deep | ~150svh | ~120svh |
| 12 | Contacto | — | acción | navy-deep | ~110svh | auto |
| 13 | Footer | — | cierre | negro / ink | ~80svh | auto |

**Por qué “La distancia” no repite al Hero:** el Hero es **fotográfico** (dos fotos que se acercan); “La distancia” es **tipográfico/diagramático** (dos palabras gigantes y una línea de cota que se contrae). Misma idea, distinto lenguaje: no se siente repetido.

---

## 3. Contenido: reglas, banco de copy, microcopy y proyectos

### 3.1 Centralización
Todo el texto vive en `/content` (nada de strings en componentes): `site.ts`, `services.ts`, `process.ts`, `team.ts`, `stack.ts`, `projects.ts`. Estructura lista para i18n futuro (hoy solo `es-AR`). `<html lang="es-AR">`.

### 3.2 Banco de copy (usar tal cual)
**Frases centrales**
- “Primero entendemos. Después hacemos.”
- “No hacemos tecnología porque sí. La hacemos cuando puede mejorar algo.”
- “Entre tu negocio y la tecnología, construimos el puente.”
- “Las herramientas cambian. El criterio no.”
- “No hace falta que tengas la solución. Contanos qué está pasando.”
- “Hacemos que la tecnología se adapte al negocio, no al revés.”

**Hero**: `DOS ORILLAS` / `ESTUDIO` · “Primero entendemos. Después hacemos.” · Subtexto: “Soluciones digitales pensadas desde el problema, no desde la herramienta.” · CTA principal: `CONTANOS QUÉ QUERÉS RESOLVER →` · CTA secundario: `VER PROYECTOS ↓` · Indicación: `DESLIZÁ PARA CRUZAR`.

**La distancia**: `TU NEGOCIO` ←→ `LA TECNOLOGÍA` · “Entre tener un problema y encontrar la herramienta correcta hay una distancia.” · “Ahí trabajamos nosotros.” · “Entendemos el problema. Pensamos la solución. Construimos el puente.”

**Manifiesto**: `NO HACEMOS / TECNOLOGÍA / PORQUE SÍ.` → `LA HACEMOS / CUANDO PUEDE / MEJORAR ALGO.`

**Soluciones** — Título `SOLUCIONES` · Subtítulo “La herramienta viene después del problema.”
| N° | Nombre corto (fila) | Título completo | Descripción |
|---|---|---|---|
| 01 | WEB | WEB & E-COMMERCE | Sitios web, experiencias digitales y tiendas pensadas para cumplir un objetivo real. |
| 02 | SISTEMAS | SISTEMAS A MEDIDA | Herramientas adaptadas a la forma en que funciona cada negocio. |
| 03 | AUTOMATIZACIÓN | AUTOMATIZACIÓN & INTEGRACIONES | Conectar herramientas, eliminar tareas repetitivas y ordenar procesos. |
| 04 | DATOS | DATOS & ORGANIZACIÓN | Transformar información dispersa en información útil para tomar decisiones. |

Transversal — **IA aplicada**: “Usamos inteligencia artificial cuando aporta valor. No porque esté de moda.”

**Cómo trabajamos** — Título `CÓMO TRABAJAMOS` · “No empezamos construyendo. Empezamos escuchando.”
| N° | Etapa | Texto |
|---|---|---|
| 01 | NOS CONTÁS | Entendemos qué está pasando y qué necesitás resolver. |
| 02 | LO PENSAMOS | Analizamos el problema antes de elegir herramientas. |
| 03 | LO CONSTRUIMOS | Diseñamos y desarrollamos una solución adecuada. |
| 04 | LO PONEMOS A ANDAR | Implementamos, probamos y acompañamos el funcionamiento. |

**Proyectos**: `PROYECTOS SELECCIONADOS` · `TODOS LOS PROYECTOS` · `VER PROYECTO →` · `01 / 05` · `SIGUIENTE PROYECTO`.

**El estudio** — Headline `DOS PERSONAS. / DOS ORILLAS. / UNA MISMA FORMA / DE TRABAJAR.` · “Dos Orillas nace de una idea simple: antes de construir una solución, hay que entender realmente el problema.” · “Somos un estudio de soluciones digitales de Concepción del Uruguay, Entre Ríos.” · “Trabajamos con negocios, comercios, emprendimientos y organizaciones que necesitan ordenar, mejorar o transformar alguna parte de su trabajo mediante tecnología.” · “No llegamos con una herramienta definida. Escuchamos. Analizamos. Y después construimos.”

**Equipo** — `DOS MIRADAS. / UN MISMO EQUIPO.` · Santino Dacuy — *Analista en Sistemas · Licenciatura en Sistemas de Información en curso* · Tobías Carballo — *Analista en Sistemas*.

**Herramientas** — `LAS HERRAMIENTAS CAMBIAN. / EL CRITERIO NO.` · “Elegimos tecnología en función de lo que haya que resolver.” · Lista: React · Next.js · JavaScript · TypeScript · Node.js · Python · SQL · PostgreSQL · MongoDB · Redis · Docker · Supabase · AWS · Figma · APIs REST · GSAP.

**CTA final** — `TENÉS UNA IDEA. / UN PROBLEMA. / O ALGO QUE PODRÍA / FUNCIONAR MEJOR.` · `HABLEMOS.` · `CONTANOS QUÉ QUERÉS RESOLVER →` · “Dos Orillas Estudio · Concepción del Uruguay · Entre Ríos · Argentina”.

**Contacto** — Email `dosorillasestudio@gmail.com` · Instagram `@dosorillas.estudio` · Campos: Nombre · Email · Negocio / empresa · ¿Qué querés resolver? · Textarea helper: “No hace falta que tengas la solución. Contanos qué está pasando.” · Botón `ENVIAR MENSAJE →`.

**Footer** — `DOS ORILLAS / ESTUDIO` · Estudio · Soluciones · Proyectos · Equipo · Contacto · Instagram · Email · “Primero entendemos. Después hacemos.” · “Concepción del Uruguay · Entre Ríos · Argentina” · © año dinámico.

**Navegación** — Estudio · Soluciones · Proyectos · Equipo · `Conversemos →`. Menú mobile: `01 Estudio · 02 Soluciones · 03 Proyectos · 04 Equipo · 05 Conversemos`.
**Capítulos del progress rail** — `01 ESTUDIO · 02 SOLUCIONES · 03 PROYECTOS · 04 EQUIPO · 05 CONTACTO`.

### 3.3 Microcopy adicional (nuevo; mantener voz)
- Loader (texto de apoyo, mono chico): `ORILLA` … `ORILLA` → `DOS ORILLAS`.
- Skip link: “Saltar al contenido”.
- Errores de formulario: nombre → “Necesitamos tu nombre para saber con quién hablamos.” · email → “Revisá el email: parece que falta algo.” · mensaje → “Contanos aunque sea en una línea qué está pasando.” · error de red → “No pudimos enviar el mensaje. Probá de nuevo o escribinos a dosorillasestudio@gmail.com.”
- Éxito: “Mensaje enviado. Gracias por escribirnos; lo leemos y te respondemos por email.” (**sin prometer plazos**).
- Copiar email: botón “Copiar email” → toast “Email copiado”.
- 404: “Este puente no llega a ningún lado.” + `VOLVER AL INICIO →`.
- Toggle de movimiento (footer/nav): “Reducir movimiento” / “Movimiento completo”.
- Aria-labels: “Abrir menú”, “Cerrar menú”, “Ir al proyecto {título}”, “Volver arriba”.
- Reloj del footer (opcional, dato real): `CONCEPCIÓN DEL URUGUAY · 21:35 ART` (zona `America/Argentina/Buenos_Aires`, actualizado por minuto).

### 3.4 Proyectos: modelo de datos (`/data/projects.ts`)
El sitio **no se hardcodea para cinco proyectos**: todo se genera iterando este array (home, featured, grilla, páginas, sitemap, OG). Agregar un proyecto = agregar un objeto + sus imágenes.

```ts
export type ProjectCategoryId = 'web-ecommerce' | 'sistemas' | 'datos' | 'ia' | 'arquitectura';
export type ProjectContext = 'academico' | 'personal' | 'cliente'; // por transparencia; nunca insinuar cliente si no lo hay
export type MediaRef = { src: string | null; alt: string; width: number; height: number; focal?: [number, number] };

export interface Project {
  slug: string;
  title: string;                 // "MATE ÚNICO" (la UI decide mayúsculas con CSS)
  titleLines: string[];          // ['MATE', 'ÚNICO'] para el display gigante
  year: number | null;           // null => no se muestra
  categoryLabel: string;         // "E-commerce / Sistemas"
  categories: ProjectCategoryId[];
  context: ProjectContext;       // el badge visible dice "Caso de estudio" / "Proyecto académico" (configurable en site.ts)
  description: string;           // 1–2 frases (cards + meta description)
  intro: string | null;
  challenge: string | null;
  approach: string | null;
  solution: string | null;
  result: string | null;         // SOLO con datos reales; null => el bloque no se renderiza
  technologies: string[];
  authors: ('santino' | 'tobias')[]; // interno. NO mostrar en la grilla principal
  cover: MediaRef;
  gallery: MediaRef[];
  keyVisual: 'event-flow' | 'geo' | 'clusters' | 'dw-structure' | 'commerce-flow' | null;
  tone: { bg: string; fg: string };  // color de fondo en la escena de destacados
  featured: boolean;
  order: number;
  liveUrl: string | null;
  githubUrl: string | null;
}
```
Regla: **un campo `null` = su bloque no existe en la UI**. Nunca rellenar con lorem ni con texto inventado. `docs/CONTENT_TODO.md` lista qué campos faltan por proyecto.
**Privacidad**: no mostrar nombres de terceros (compañeros de cursada u otros colaboradores) sin confirmación expresa.

### 3.5 Los cinco proyectos iniciales (todos de Santino; los de Tobías se suman después)

**01 · MATE ÚNICO** — `E-commerce / Sistemas` · `authors: ['santino']` · `keyVisual: 'commerce-flow'`
Experiencia de comercio electrónico desarrollada alrededor de una tienda especializada en mates y combos.
Funcionalidades contempladas: catálogo, productos, combos, stock, carrito, autenticación, Google Login, Mercado Pago, cupones, envíos, reseñas, panel administrativo.
Tecnologías confirmadas `CONFIRMAR`: React (Router), Node.js/Express, PostgreSQL, Strapi (CMS de catálogo), API de Mercado Pago, Google OAuth, Figma, UML.
Presentarlo como **proyecto / caso de estudio**. **No decir ni insinuar** que fue un cliente comercial real, ni inventar ventas, usuarios o resultados.

**02 · GESTIÓN AEROPORTUARIA** — `Backend / Datos / Geolocalización` · `keyVisual: 'geo'`
Sistema para gestionar y explorar información de aeropuertos.
Tecnologías: API REST, MongoDB, Redis (GEO y Sorted Sets), Leaflet, Docker, Docker Compose.
Características: CRUD de aeropuertos, búsqueda geográfica, aeropuertos cercanos, ranking de popularidad, mapa interactivo, clustering.

**03 · CLASIFICADOR DE FRUTAS** — `Inteligencia Artificial` · `keyVisual: 'clusters'`
Clasificación con red **ART1 (Carpenter-Grossberg)**. Enfatizar: procesamiento de características (preprocesamiento de imágenes y binarización), clustering, clasificación, experimentación con IA, análisis de datos. Hechos confirmados `CONFIRMAR`: dos corridas encadenadas (primero variedad, después calidad) y limitaciones documentadas con honestidad (valor de producto: criterio, no solo código).
**No inventar accuracy, resultados ni métricas.**

**04 · RETAIL VISION** — `Datos / Visualización` · `keyVisual: 'dw-structure'`
Data Warehouse y BI. Hechos confirmados disponibles `CONFIRMAR antes de publicar`: modelo en estrella con cuatro tablas de hechos, pipeline ETL completo en PostgreSQL, dashboards en Tableau e informe formal; se documentaron hallazgos de integridad de datos. **No mostrar cifras, clientes, KPIs ni resultados** salvo que el equipo los confirme; preparar la estructura visual con bloques de datos marcados como “a completar”. Es un proyecto que nació en un contexto académico y compartido: no listar compañeros.

**05 · TRANSACCIONES EN TIEMPO REAL** — `Arquitectura / Sistemas distribuidos` · `keyVisual: 'event-flow'`
Next.js, KafkaJS, arquitectura orientada a eventos, topics, comandos, eventos, DLQ, Server-Sent Events y timeline en tiempo real. Se muestra **como sistema de eventos/flujo** (ver 9.5).

Para todos: `year`, `challenge`, `approach`, `solution`, `result` = `null` salvo que el equipo los provea. `featured: true` en los cinco; `order` 1–5.

---

## 4. Stack, configuración y estructura del repo

### 4.1 Dependencias
| Paquete | Uso | Nota |
|---|---|---|
| `next` (última estable, App Router) · `react` 19 · `typescript` (strict) | base | RSC por defecto; `'use client'` solo donde haya interacción |
| `tailwindcss` v4 | estilos | tokens en `@theme` (CSS-first) + variables CSS |
| `gsap` (+ `@gsap/react`) | motor de storytelling | Plugins: `ScrollTrigger`, `SplitText`, `Flip`, `CustomEase`, `Draggable`, `MotionPathPlugin`, `DrawSVGPlugin`. Desde 2025 GSAP y sus plugins son gratuitos (verificar licencia vigente y que los imports `gsap/SplitText` etc. resuelvan) |
| `lenis` | smooth scroll inercial | sincronizado con ScrollTrigger |
| `zod` | validación del formulario (cliente y servidor) | |
| `resend` | envío de mails | opcional, ver 11.1 |
| `sharp` | script de optimización de imágenes | devDependency |
| `ogl` **o** `three` | WebGL opcional (Nivel 3) | **solo** `dynamic import`, solo desktop con tier alto |
| `@vercel/analytics`, `@vercel/speed-insights` | métricas | opcionales |
| `@playwright/test`, `@axe-core/playwright` | QA | devDependencies |
| `eslint`, `prettier`, `pnpm` | calidad | |

**No instalar**: `framer-motion`/`motion` (GSAP cubre el storytelling; solo se admite `motion` para `AnimatePresence` del formulario/toasts, y **nunca** sobre el mismo elemento/propiedad que GSAP), `locomotive-scroll`, `ScrollSmoother` (el scroll lo maneja Lenis), jQuery, UI kits pesados, librerías de iconos enteras.

### 4.2 Configuración
- `next.config.ts`: `images.formats = ['image/avif','image/webp']`, `reactStrictMode: true`, headers de seguridad básicos. Revisar la documentación de la versión instalada por si existe el flag de View Transitions (`experimental.viewTransition`) y decidir según 9.2.
- `tsconfig`: `strict`, `noUncheckedIndexedAccess`, alias `@/*`.
- `.nvmrc` (Node LTS), `engines`, `packageManager: pnpm`.
- Scripts: `dev`, `build`, `lint`, `typecheck`, `test:e2e`, `images:optimize`, `assets:manifest` (corre en `prebuild`).
- Variables de entorno (`.env.example`): `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL=dosorillasestudio@gmail.com`, `CONTACT_FROM_EMAIL`.
- Git: repo **nuevo** (`dos-orillas-web`), commits por fase, `.gitignore` estándar. Proyecto de Vercel nuevo.

### 4.3 Estructura
```
/app
  layout.tsx · page.tsx (solo compone secciones) · not-found.tsx
  /projects/[slug]/page.tsx · /projects/page.tsx (alias /proyectos con redirect) · /api/contact/route.ts
  sitemap.ts · robots.ts · opengraph-image.tsx · manifest.ts
/components
  /layout        Header, Footer, SiteShell, Logo
  /navigation    Nav, MobileMenu, ScrollProgress, ChapterLabel
  /motion        SmoothScroll, RevealText, ParallaxImage, ImageReveal, Marquee, MagneticButton,
                 Cursor, ThemeController, PageTransition, TransitionLink, Bridge (línea azul), Preloader,
                 ScrollVelocity, MotionProvider
  /sections      Hero, Distance, Manifesto, Services, Process, FeaturedProjects, AllProjects,
                 Studio, Team, Stack, FinalCTA, Contact
  /projects      ProjectCard, ProjectShowcase, ProjectHero, ProjectChapters, ProjectGallery,
                 NextProject, KeyVisual/(EventFlow, Geo, Clusters, DwStructure, CommerceFlow)
  /ui            AnimatedLink, Button, SectionHeader, Media (imagen real o placeholder), Toast, FormField
/content         site.ts, services.ts, process.ts, team.ts, stack.ts
/data            projects.ts
/hooks           useMotionTier, useReducedMotionPref, useMatchMedia, useParallax, useMagnetic,
                 useScrollVelocity, useIsFinePointer, useLenis, useInView
/lib             gsap.ts (registro único), motion-tokens.ts, easings.ts, lenis.ts, view-transition.ts,
                 seo.ts, assets.ts, utils.ts
/styles          globals.css (tokens, capas, utilidades), motion.css
/scripts         optimize-images.mjs, build-asset-manifest.mjs
/docs            DECISIONS.md, ANIMATIONS.md, CONTENT_TODO.md, README de assets
/public
  /brand /team /projects/<slug>/ /textures /og
/tests           e2e/*.spec.ts
```
Prohibido: Home en un solo `page.tsx` gigante, animaciones duplicadas, `any` innecesarios, estilos inline para valores que son tokens. Comentar **solo lógica compleja**.

---

## 5. Sistema de diseño

### 5.1 Tokens (valores iniciales; si los assets reales de marca traen otros, mandan los de marca)
```css
:root{
  --background:#F2EEE6;  --foreground:#111111;
  --navy:#10263E;        --navy-deep:#071725;
  --cream:#E7E0D5;       --white:#FAF9F6;
  --muted:#6A665F;       /* #77736D da ~4,0:1 sobre crema: NO cumple AA en texto chico. Este da ~4,9:1 */
  --ink:#0B0B0B;
  --bridge:#1E4E80;      /* línea azul sobre fondos claros */
  --bridge-on-dark:#7FA6CF; /* línea azul sobre navy/ink */
  --grain-opacity:.045;
}
/* Temas por sección: cada <section data-theme="..."> redefine estas 4 variables semánticas */
[data-theme="cream"]    {--bg:#F2EEE6; --fg:#111111; --accent:var(--bridge);        --line:color-mix(in oklab,var(--fg) 16%,transparent)}
[data-theme="white"]    {--bg:#FAF9F6; --fg:#111111; --accent:var(--bridge);        --line:color-mix(in oklab,var(--fg) 14%,transparent)}
[data-theme="navy"]     {--bg:#10263E; --fg:#F2EEE6; --accent:var(--bridge-on-dark);--line:color-mix(in oklab,var(--fg) 22%,transparent)}
[data-theme="navy-deep"]{--bg:#071725; --fg:#F2EEE6; --accent:var(--bridge-on-dark);--line:color-mix(in oklab,var(--fg) 22%,transparent)}
[data-theme="ink"]      {--bg:#0B0B0B; --fg:#F2EEE6; --accent:var(--bridge-on-dark);--line:color-mix(in oklab,var(--fg) 22%,transparent)}
```
- `body { background: var(--bg); color: var(--fg) }`. Todo el sitio (navbar, cursor, líneas) lee `--bg/--fg/--accent/--line`: así un solo tween de variables cambia **todo** el color coherentemente.
- Prohibido: gradientes violeta/azul de startup, glow neón, cyberpunk, glassmorphism, sombras en todas partes, pills en todo. Los fondos se sienten **materiales y editoriales**.
- Todas las combinaciones texto/fondo deben cumplir **WCAG AA** (4,5:1 texto normal; 3:1 texto grande ≥ 24px o 18,66px bold). Verificar con herramienta y listar en `DECISIONS.md`.
- **Grain** extremadamente sutil: una sola capa `position: fixed; inset: 0; pointer-events: none; z-index: 60` con textura SVG/PNG pequeña en `/textures` (tile ~200 px), `opacity: var(--grain-opacity)`, `mix-blend-mode: multiply` en claro y `screen` en oscuro. **Estática** (o salto de 2 fps con `steps()`), nunca animación continua cara. Se apaga en tier 0.

### 5.2 Tipografía
Cargar con `next/font` (self-host, `display: 'swap'`, `adjustFontFallback`, subsets `latin` y `latin-ext` para ñ/acentos). Propuesta (todas Google Fonts, gratuitas):
| Rol | Fuente | Uso |
|---|---|---|
| **Display** | *Bricolage Grotesque* (variable: `wght`, `wdth`, `opsz`) en MAYÚSCULAS, ancho condensado/medio, peso 600–800 | titulares gigantes |
| **Acento editorial** | *Instrument Serif* (Italic) | una palabra o frase de contraste dentro del titular (p. ej. “*Después* hacemos.”) |
| **Body / UI** | *Geist* o *Inter Tight* | texto corrido, navegación, formulario |
| **Mono** | *Geist Mono* | números de capítulo (`01 / 05`), etiquetas, metadatos |

Alternativa si el equipo licencia fuentes: Clash Display / General Sans / Satoshi (Fontshare). No usar tipografías futuristas.
- Display: desktop `clamp(72px, 10vw, 180px)` · mobile (<768) `clamp(48px, 15vw, 90px)` · `line-height: .86–.92` · `letter-spacing: -0.02em` a `-0.04em`.
- Escala: `display-xl / display-l / h2 / h3 / lead / body / small / mono-xs`. Texto corrido 16–18 px, `line-height 1.5`, medida ≤ 62ch. `text-wrap: balance` en titulares, `pretty` en párrafos.
- **Contraste de escala**: títulos GIGANTES vs. texto chico (12–14 px mono) cuidadosamente alineado en grilla. Mucho whitespace.
- **Acentos y máscaras de línea**: las máscaras `overflow: hidden` **cortan tildes** (Ú, Ó, Í). Cada línea enmascarada lleva `padding-block: .12em; margin-block: -.12em` (o `overflow: clip` + `overflow-clip-margin`). Probar con “ÚNICO”, “AUTOMATIZACIÓN”, “TÚ”, “Ñ”.
- Opcional (un solo lugar, ej. links del menú mobile o CTA): animar el eje `wdth` de la variable en hover. **No** usarlo en scroll continuo (provoca relayout).

### 5.3 Grilla, espaciado y superficies
- Grilla 12 col (desktop) / 6 (tablet) / 4 (mobile). Márgenes laterales `clamp(20px, 4vw, 64px)`. Gutter `clamp(12px, 1.6vw, 24px)`.
- Escala de espaciado 4/8 px con tokens (`--space-1…--space-12`). Secciones con `min-height: 100svh` cuando son escena; padding vertical `clamp(96px, 14vw, 220px)` cuando son lectura.
- Radio 0 por defecto (editorial); 2 px en imágenes; el *morphing* de border-radius solo en reveals puntuales. Líneas de 1 px (`--line`). Sin sombras. Botones rectangulares con hairline, no pills.
- Usar CSS moderno cuando simplifique: `container queries` en `ProjectCard`, `:has()`, nesting, `@layer` (reset, tokens, base, components, utilities), `subgrid` en la grilla editorial, `svh/dvh`, `color-mix()`, `text-wrap`.

### 5.4 Altura de viewport
Escenas a pantalla completa: `min-height: 100svh`. Overlays/menú: `100dvh`. **Nunca `100vh`** en mobile. `html { overflow-x: clip }`; ningún hijo usa `100vw` sin compensar scrollbar (preferir `100%` o `inset: 0`).

### 5.5 Capas de color por escena (secuencia)
crema (Hero) → **navy-deep** (La distancia) → crema (Manifiesto) → blanco roto (Soluciones) → **navy** (Proceso) → tono por proyecto (Destacados, oscuros) → crema (Todos) → blanco roto (Estudio) → crema (Equipo / Herramientas) → **navy-deep** (CTA + Contacto) → **ink** (Footer). Las transiciones son suaves y están ligadas al scroll (T14).

### 5.6 La línea azul (**Bridge**) — recurso de marca
Línea de 1 px que representa el puente/la conexión. Aparece como: indicador de scroll · subrayado/tachado de titulares · divisores de sección · línea de cota en “La distancia” · pista del Proceso · marco de la primera foto de Proyectos · base del footer · estado “conectado” en el formulario. Reglas: se dibuja con `transform: scaleX/scaleY` (barata) o `stroke-dashoffset` / `DrawSVGPlugin` si es curva; `vector-effect: non-scaling-stroke` en SVG; **nunca** se convierte en dibujo literal de un puente.

### 5.7 Fotografía (dirección de arte)
- Estilo **documental**, luz natural cálida, grano suave, levemente desaturado, sombras apenas hacia el navy; **un único grading** para todo el sitio. Inspiración de revista editorial.
- **Orilla 1** (negocio / problema): manos trabajando, mostradores, cuadernos y planillas, un local, personas reales, detalles de oficio. **Orilla 2** (solución / tecnología): pantallas en uso (cercanas, con enfoque en la persona), pizarras con diagramas, teclado, notas, proyectos funcionando. Atmósfera opcional: río, agua, horizonte.
- **Prohibido**: stock corporativo, apretones de manos, robots, laptops flotando, dashboards falsos, mockups de MacBook, “IA” genérica, fotos generadas presentadas como reales.
- Tratamiento en layout (nada de rectángulos iguales): crops dinámicos, `object-position`, máscaras, composiciones verticales, full-bleed, imágenes flotantes, fotos chicas dentro de grandes vacíos, ratios mezclados.

### 5.8 Pipeline de imágenes y placeholders
- Estructura: `/public/brand`, `/public/team`, `/public/projects/<slug>/`, `/public/textures`, `/public/og`.
- `scripts/optimize-images.mjs` (sharp): a partir de originales en `/assets-src` genera AVIF + WebP en anchos 640/960/1440/1920/2560, EXIF fuera, calidad ~72–78, y un **LQIP** (blur base64 10 px) por imagen. `next/image` con `sizes` correctos, `placeholder="blur"`.
- Reglas: `priority`/`fetchpriority="high"` **solo** en las imágenes del Hero; el resto `loading="lazy"` y `decoding="async"`; todas con `width/height` o `aspect-ratio` reservado (CLS ≈ 0); `object-position` desde `focal`.
- **`<Media>`**: recibe una ruta lógica; si existe el archivo real (según `assets:manifest`, generado en `prebuild`) lo usa; si no, renderiza un **placeholder editorial** (bloque crema o navy con hairline interior a 12 px, grain, y en desarrollo un rótulo mono `FOTO · /team/santino-01.webp · 1600×2000`). En producción el rótulo técnico **no** se muestra (solo la textura). Así, cuando el equipo suba imágenes reales con el nombre correcto, **se priorizan automáticamente** sin tocar código.

| Archivo | Ratio / mínimo | Dónde |
|---|---|---|
| `/projects/_hero/orilla-1.webp` | 4:5 vertical · 2400×3000 | Hero, orilla izquierda (negocio) |
| `/projects/_hero/orilla-2.webp` | 4:5 vertical · 2400×3000 | Hero, orilla derecha (solución) |
| `/textures/grain.png` | tile 200×200 | grain global |
| `/projects/_manifesto/vertical.webp` | 3:4 · 1800×2400 | Manifiesto (parallax lento) |
| `/projects/_services/{web,sistemas,automatizacion,datos}.webp` | 4:5 · 1400×1750 | preview de filas de Soluciones |
| `/projects/_studio/{01,02,03}.webp` | mezcla (3:4, 4:5) | El estudio |
| `/team/santino-01.webp`, `/team/tobias-01.webp` | 4:5 · 1800×2250 | Equipo (+ `-02` opcional para hover) |
| `/projects/<slug>/cover.webp` | 16:10 · 2400×1500 (+ versión 4:5 si se recorta) | featured, grilla, hero del caso |
| `/projects/<slug>/gallery-XX.webp` | ratios libres · ≥1600 px | galería del caso |
| `/og/default.png` | 1200×630 | Open Graph por defecto |
| `/brand/logo.svg`, `logo-light.svg`, `mark.svg` | SVG | navbar, footer, favicon |

---

## 6. Motion system

### 6.1 Los cinco verbos
Cada movimiento del sitio es una instancia de **SEPARAR · ACERCAR · CONECTAR · CRUZAR · REVELAR**.
| Verbo | Qué comunica | Traducción de movimiento |
|---|---|---|
| **SEPARAR** | dos orillas, distancia, problema | elementos en extremos, gap generoso, tipografía partida |
| **ACERCAR** | entender, empatía | translaciones convergentes con velocidades distintas, ligero zoom de “cámara” |
| **CONECTAR** | solución, puente | la línea azul se dibuja (`scaleX/DrawSVG`), elementos se alinean en baseline |
| **CRUZAR** | cambio de capítulo | un elemento atraviesa el viewport de izquierda a derecha (dirección de lectura = cruzar a la otra orilla) |
| **REVELAR** | claridad, descubrimiento | máscaras (`clip-path`, `overflow:hidden`+`translateY`), `opacity` |

**Dirección semántica**: lo que habla del problema/negocio entra **desde la izquierda**; lo que habla de solución/tecnología, **desde la derecha**; cuando “se resuelve”, **convergen**; los conectores crecen **desde el centro hacia afuera**; al cambiar de capítulo algo **cruza**. Al hacer scroll hacia arriba, todo lo *scrubbed* se revierte solo (por eso se usa `scrub`).

### 6.2 Tokens de movimiento (`lib/motion-tokens.ts` + variables CSS)
```ts
export const dur = { xs: .2, sm: .4, md: .7, lg: 1.1, xl: 1.6 };               // segundos
export const ease = {
  out:    'expo.out',                         // reveals de entrada (CSS: cubic-bezier(.16,1,.3,1))
  inOut:  'orilla',                           // CustomEase "0.76,0,0.24,1" → transiciones de capítulo/página
  soft:   'power3.out',                       // microinteracciones, cursor, magnético
  scrub:  'none',                             // el "tiempo" del timeline scrubbed es el scroll
  feel:   'power2.inOut',                     // easing por tween dentro de timelines scrubbed
};
export const stagger = { lines: .08, words: .03, list: .06 };
export const distance = { reveal: 110 /* yPercent */, parallax: 10 /* % */, magnet: .25 };
```
Registrar `CustomEase.create('orilla', '0.76,0,0.24,1')` una sola vez. CSS: `--ease-out-expo: cubic-bezier(.16,1,.3,1); --ease-in-out-quart: cubic-bezier(.76,0,.24,1); --ease-out-quint: cubic-bezier(.22,1,.36,1)`. `linear()` (spring suave) solo para toggles/menú, **sin overshoot > 3 %**; generarlo con una herramienta de linear-easing, no a mano. **Sin bounce infantil.**

### 6.3 Tiers de movimiento (`useMotionTier`, `html[data-motion-tier]`)
| Tier | Cuándo | Qué se activa |
|---|---|---|
| **0 — estático** | `prefers-reduced-motion: reduce`, toggle del usuario “Reducir movimiento”, o `saveData` | contenido visible de inmediato, sin Lenis, sin scrub, sin parallax, sin pin, sin WebGL, sin grain; solo fades cortos (≤ 200 ms) |
| **1 — lite** | mobile / tablet / dispositivo lento | scroll nativo (Lenis solo si no degrada), reveals por IntersectionObserver o ScrollTrigger sin scrub, parallax mínimo (≤ 6 %), horizontal → vertical, sin pin largo, sin cursor, sin skew, sin WebGL |
| **2 — full DOM** | desktop con puntero fino y buen rendimiento | Lenis + pins + scrub + parallax + horizontal + cursor + magnético + skew por velocidad |
| **3 — full + WebGL** | desktop potente (`hardwareConcurrency ≥ 8`, GPU razonable, sin `saveData`) | tier 2 + planos WebGL del Hero / transición de imágenes (Nivel 3) |

**Detección**: media queries (`(prefers-reduced-motion)`, `(hover:hover) and (pointer:fine)`, ancho), `navigator.hardwareConcurrency`, `deviceMemory`, `connection.saveData`. **Autodegradación**: durante los primeros 2 s de interacción, medir FPS con `gsap.ticker`; si el promedio < 45 fps, bajar un tier (apagar skew → WebGL → parallax) y recordarlo en `sessionStorage`. El usuario puede forzar “Reducir movimiento” desde un toggle en el footer (persistido en `localStorage`).

### 6.4 Infraestructura obligatoria
**(a) Registro único** — `lib/gsap.ts`: registra `ScrollTrigger, SplitText, Flip, CustomEase, Draggable, MotionPathPlugin, DrawSVGPlugin`, `useGSAP`, easings; protegido con `typeof window !== 'undefined'`. Todos importan desde ahí.

**(b) Lenis ↔ ScrollTrigger** (`components/motion/SmoothScroll.tsx`, `'use client'`):
```ts
const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false, autoRaf: false });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
// cleanup: gsap.ticker.remove(...), lenis.destroy()
```
- Scroll suave **pero no lento**: `lerp` 0,08–0,12. En touch, scroll **nativo** (`syncTouch:false`).
- Incluir el CSS de Lenis (`html.lenis`, `.lenis-stopped`, `.lenis-smooth` con `scroll-behavior:auto`).
- Exponer `useLenis()` (context): `scrollTo(target, {offset, duration:1.4, easing})`, `stop()/start()`, `velocity`, `direction`. Al abrir el menú: `lenis.stop()`. Overlays con scroll interno: `data-lenis-prevent`.
- En cambio de ruta: `lenis.scrollTo(0, { immediate: true })` + `ScrollTrigger.refresh()`.
- Anclas del menú: `lenis.scrollTo('#soluciones', { offset: -64 })` y `history.replaceState` (sin saltos).
- **Con Lenis no usar `pinType:'transform'`**; el scroller es `window`.

**(c) Hooks y limpieza**: toda animación vive en `useGSAP(() => {…}, { scope, dependencies })`; handlers de eventos dentro de `contextSafe`. Todo trigger se crea **dentro** de un `gsap.context` o `gsap.matchMedia`, así se revierte solo. Prohibido `ScrollTrigger.create` suelto sin context.

**(d) Variantes por media** con `gsap.matchMedia()`:
```ts
useGSAP(() => {
  const mm = gsap.matchMedia();
  mm.add({
    full:   '(min-width: 1024px) and (hover:hover) and (prefers-reduced-motion: no-preference)',
    lite:   '(max-width: 1023px) and (prefers-reduced-motion: no-preference)',
    reduce: '(prefers-reduced-motion: reduce)',
  }, (ctx) => {
    const { full, lite, reduce } = ctx.conditions as Record<string, boolean>;
    if (reduce) return showStatic();
    if (full)   buildPinnedTimeline();
    if (lite)   buildVerticalVersion();
  });
  return () => mm.revert();
}, { scope: rootRef });
```

**(e) Sin FOUC y progressive enhancement**: el HTML llega **visible y legible**. Un script inline mínimo en `<head>` agrega `html.js-motion` solo si hay JS y no hay `reduce`; el CSS oculta los estados iniciales **solo bajo `.js-motion`** (`.js-motion [data-reveal]{opacity:0}`). Si el JS de animación falla, un timeout de seguridad (3 s) remueve `.js-motion`. `<noscript>` deja todo visible. Esto evita parpadeos y protege SEO/accesibilidad.

**(f) Refresh**: `document.fonts.ready.then(() => { lenis.resize(); ScrollTrigger.refresh(); })`; refrescar también al terminar de cargar imágenes del Hero y al cambiar de ruta. `ScrollTrigger.config({ ignoreMobileResize: true })`. Pins con `invalidateOnRefresh: true`, `anticipatePin: 1`. Todo valor derivado de medidas va en función `() => …`. Crear triggers en orden de DOM o usar `refreshPriority`. `ScrollTrigger.sort()` cuando haya pins anidados.

**(g) Debug**: con `?debug` en la URL: markers de ScrollTrigger, medidor de FPS, tier actual y `ScrollTrigger.getAll().length`. Nunca en producción por defecto.

**(h) Reduced motion** (implementación explícita, además de matchMedia): ver T30. Regla: *el contenido y la jerarquía son idénticos; solo desaparece el movimiento*.

---

## 7. Catálogo de técnicas de animación (qué es · dónde · cómo)

Para cada animación del sitio, usar estas recetas. Cada una trae su **fallback** (mobile/tier 1 y reduced-motion/tier 0).

**T01 · Smooth scroll inercial (Lenis)** — *Qué*: el scroll suaviza la rueda y da sensación de “deslizarse”. *Dónde*: global. *Cómo*: sección 6.4(b). *Fallback*: tier 1 nativo; tier 0 nativo sin Lenis.

**T02 · Máscara de texto por líneas (line mask reveal)** — *Qué*: cada línea sube desde una ventana con `overflow:hidden`. *Dónde*: todos los titulares. *Cómo*: titulares con saltos conocidos → cada línea es `<span class="line"><span class="line-inner">`; títulos largos/fluidos → `SplitText`:
```ts
SplitText.create(el, {
  type: 'lines', mask: 'lines', autoSplit: true,
  onSplit: (self) => gsap.from(self.lines, {
    yPercent: 110, duration: dur.lg, ease: ease.out, stagger: stagger.lines,
    scrollTrigger: { trigger: el, start: 'top 85%', once: true },
  }),
});
```
`autoSplit` re-divide al cambiar el ancho/fuentes; devolver el tween permite revertirlo. *No hacer*: animar letra por letra en lectura. *Fallback*: tier 0 → texto visible sin movimiento.

**T03 · Texto que se “enciende” con el scroll (scrub por palabras)** — *Qué*: las palabras de un párrafo pasan de opacidad .15 a 1 a medida que se las lee. *Dónde*: Manifiesto (segunda frase), El estudio. *Cómo*: `SplitText type:'words'`; `gsap.fromTo(words,{opacity:.15},{opacity:1,stagger:.03,ease:'none',scrollTrigger:{trigger:p,start:'top 80%',end:'bottom 45%',scrub:true}})`. *Fallback*: opacidad 1 fija.

**T04 · Reveal de imagen con máscara** — *Qué*: la foto aparece “abriéndose” (`clip-path`) mientras el contenido interior hace *zoom out*. *Cómo*:
```ts
gsap.fromTo(wrap, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: ease.inOut, scrollTrigger: st });
gsap.fromTo(img,  { scale: 1.3 }, { scale: 1, duration: 1.6, ease: ease.out, scrollTrigger: st });
```
Variantes: `inset(0 100% 0 0)` (desde izquierda = orilla 1), `inset(0 0 0 100%)` (desde derecha), `inset(49% 49% 49% 49% round 24px)` → `inset(0 round 0)` (apertura central con morphing de radio). *No hacer*: wipes excesivos. *Fallback*: imagen visible, sin clip.

**T05 · Parallax interno de imagen** — *Qué*: la foto se desplaza dentro de su marco a menor velocidad que la página (profundidad). *Cómo*: contenedor `overflow:hidden`; `img` con `height:120%; top:-10%`;
```ts
gsap.fromTo(img, { yPercent: -10 }, { yPercent: 10, ease: 'none',
  scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true } });
```
Usarlo **solo** en fotos protagonistas, no en todo. *Fallback*: tier 1 ≤ 6 %; tier 0 sin movimiento.

**T06 · Capas con velocidades distintas (`data-speed`)** — *Qué*: elementos flotantes que se mueven más rápido o más lento que el scroll (efecto “cámara con profundidad”). *Cómo*: velocidad `s` (1 = normal; 1,2 más rápido; .8 más lento). Desplazamiento relativo = `(1 − s) × distancia recorrida`:
```ts
const dist = () => (1 - s) * (innerHeight + el.offsetHeight);
gsap.fromTo(el, { y: () => -dist() / 2 }, { y: () => dist() / 2, ease: 'none',
  scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
```
Hook `useParallax(ref, speed)`. *Fallback*: tier 1 sin; tier 0 sin.

**T07 · “Lag” distinto por capa (scrub numérico)** — *Qué*: con Lenis ya hay inercia; usar `scrub: true` para 1:1 y un `scrub: 0.4–0.9` en *algunas* capas hace que la foto izquierda y derecha “pesen” distinto (más sensación de volumen). *Dónde*: Hero, Equipo.

**T08 · Escena fija con timeline (pin + scrub)** — *Qué*: la sección queda pegada y el scroll “reproduce” una película. *Dónde*: Hero, La distancia, Proyectos destacados, Proceso, Equipo.
```ts
const tl = gsap.timeline({
  defaults: { ease: ease.feel },
  scrollTrigger: { trigger: root, start: 'top top', end: '+=250%', pin: true, scrub: true,
                   anticipatePin: 1, invalidateOnRefresh: true },
});
tl.to(left, { xPercent: 12 }, 0).to(right, { xPercent: -12 }, 0).addLabel('connect', .35)…
```
Reglas: **el pin nunca va dentro de un ancestro con `transform`**; usar `svh`; evitar pins anidados; largo del pin proporcional a la cantidad de “acontecimientos” (≈ 80–100 % por beat). Los *beats* se definen como **etiquetas** y fracciones del timeline (ver escenas). *Fallback*: tier 1 → versión vertical sin pin largo; tier 0 → layout estático final.

**T09 · Scroll horizontal controlado por scroll vertical** — *Dónde*: Proceso.
```ts
const dist = () => track.scrollWidth - window.innerWidth;
const h = gsap.to(track, { x: () => -dist(), ease: 'none',
  scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: true,
                   invalidateOnRefresh: true, anticipatePin: 1,
                   onUpdate: (s) => setStage(Math.min(3, Math.floor(s.progress * 4))) } });
panels.forEach((p) => gsap.from(p.querySelector('.title'), { yPercent: 110,
  scrollTrigger: { trigger: p, containerAnimation: h, start: 'left 80%', toggleActions: 'play none none reverse' } }));
```
Actualizar el contador (`01 / 04`) **solo cuando cambia el índice** (no `setState` a 60 fps). *Fallback*: tier 1 → lista vertical con línea vertical que crece (`scaleY` con scrub).

**T10 · “Dolly” en Z con capas (proyectos destacados)** — *Qué*: la imagen actual se acerca a cámara (scale > 1) y se desvanece mientras la siguiente emerge desde atrás (scale .86 → 1): sensación de **capas/profundidad**. *Cómo*: todas las slides apiladas (`position:absolute; inset:0`); un solo timeline maestro con pin `+= N × 100%`; ver escena 06. *Fallback*: tier 1 → bloques apilados con `position: sticky` y reveals simples.

**T11 · Contador/roll de número** — *Qué*: `01 / 05` cambia deslizando el dígito dentro de una máscara. *Cómo*: columna de dígitos en una ventana de 1 línea; `yPercent = -100 × índice` con `gsap.to` al cambiar el índice (duración `dur.md`, `ease.out`).

**T12 · Marquee cinético ligado a la velocidad del scroll** — *Qué*: una línea de texto que corre horizontal y se acelera/invierte según el scroll. *Dónde*: 2–3 lugares (separador “DOS ORILLAS — DOS ORILLAS —”, Herramientas, footer).
```ts
const tw = gsap.to(track, { xPercent: -50, ease: 'none', duration: 40, repeat: -1 }); // contenido duplicado x2
let dir = 1, k = 1;
gsap.ticker.add(() => {
  const v = lenis.velocity; if (Math.abs(v) > .1) dir = Math.sign(v);
  k += (1 + Math.min(Math.abs(v) * .08, 4) - k) * .08;       // suaviza hacia el objetivo
  tw.timeScale(dir * k);
});
```
Alternativa solo-scrub: `gsap.to(track,{xPercent:-25, ease:'none', scrollTrigger:{scrub:true}})`. *Fallback*: tier 0 → texto estático (grilla/wrap).

**T13 · Skew sutil por velocidad** — *Qué*: las imágenes “sienten” la inercia (±1,5° máx.).
```ts
const set = gsap.quickSetter(el, 'skewY', 'deg'); let cur = 0;
gsap.ticker.add(() => { const t = gsap.utils.clamp(-1.5, 1.5, lenis.velocity * -.04); cur += (t - cur) * .1; set(cur); });
```
Solo en unas pocas imágenes grandes, nunca en texto ni en elementos pinneados. *Fallback*: tier ≤ 1 sin skew.

**T14 · Cambio de tema/color ligado al scroll** — *Qué*: el fondo y el color de texto se interpolan entre secciones (20–30 vh) vía variables. *Cómo* (`ThemeController`): un tween por frontera, `start:'top 75%'`, `end:'top 45%'`, `scrub:true`, `gsap.fromTo(root,{'--bg':A,'--fg':fgA,'--accent':accA},{'--bg':B,…})`. La **navbar** cambia por *umbral* (no scrub): `ScrollTrigger` con `start:'top 80px'` y `onToggle` que fija `data-nav="light|dark"`. Si el profiler muestra repaints caros, usar dos capas fijas con crossfade de `opacity`.

**T15 · Dibujo de línea (Bridge)** — *Qué*: la línea azul se “construye”. *Cómo*: recta → `scaleX: 0 → 1` (`transformOrigin` según el verbo: izquierda=problema, derecha=solución, centro=conexión); curva → `DrawSVGPlugin` o `pathLength="1"` + `strokeDashoffset 1 → 0`. Con `scrub` o con `once`.

**T16 · Cadena de capítulos (Bridge Chain)** — *Qué*: la línea final de un capítulo se convierte en la estructura del siguiente. *Cómo*: ver 8.5 y 8.6; técnica: cada frontera tiene un **segmento Bridge a ancho completo** posicionado en el borde común de ambas secciones (`bottom:0` de A = `top:0` de B), con `transform-origin` izquierdo; A lo extiende (`scaleX 0→1`) en su último tramo y B lo usa como pista/marco (misma posición `y`, sin saltos). Opcional: `Flip.getState/Flip.fit` para mover/redimensionar la línea entre estados.

**T17 · Lista con preview que sigue el cursor** — *Qué*: al pasar sobre una fila aparece una imagen que sigue al mouse con leve inclinación. *Dónde*: Soluciones. *Cómo*: `quickTo` para `x`/`y` (duración .5, `power3`), rotación = `clamp(dx × .1, −6, 6)` que vuelve a 0; el preview entra con `clip-path` + `scale .9→1`; las otras filas bajan a `opacity .35`; la línea de la fila crece. Solo `(hover:hover) and (pointer:fine)`. *Mobile*: acordeón (T18). El contenido (descripción) siempre accesible sin hover.

**T18 · Acordeón elegante (mobile / táctil)** — expandir con `grid-template-rows: 0fr → 1fr` + `opacity` (CSS), botón real con `aria-expanded`/`aria-controls`; la línea de la fila se dibuja al abrir.

**T19 · Cursor contextual** — *Qué*: círculo chico por defecto; mayor con etiqueta (`VER`, `DRAG`) según `data-cursor`. *Cómo*:
```ts
const xTo = gsap.quickTo(cursor, 'x', { duration: .35, ease: 'power3' });
const yTo = gsap.quickTo(cursor, 'y', { duration: .35, ease: 'power3' });
addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
// pointerover → closest('[data-cursor]') define la etiqueta y la escala
```
Solo `(hover:hover) and (pointer:fine)` y sin `reduce`. **No ocultar el cursor del sistema** sobre texto, inputs ni zonas de riesgo; el cursor propio *acompaña*, no reemplaza, salvo en zonas de proyecto/drag. `aria-hidden`, `pointer-events:none`.

**T20 · Botón magnético** — *Qué*: el botón se inclina hacia el cursor. *Cómo*: cachear `getBoundingClientRect` en `pointerenter`; `xTo((e.clientX − cx) × .25)`; `pointerleave` → 0 con `power3.out` (sin elastic). Solo CTA principales. Solo puntero fino.

**T21 · Botón con texto que rueda (CSS puro)** — dos copias del texto en un contenedor `overflow:clip`; en `:hover` y `:focus-visible` la primera sube `−110 %` y la segunda entra desde `+110 %` (`.6s var(--ease-out-expo)`); la copia es `aria-hidden`. La flecha `→` se desplaza `translateX(6px)`; el botón principal “expande” su fondo con `clip-path` y una hairline lo atraviesa.

**T22 · Subrayado de links** — `::after` con `transform: scaleX(0→1)`; al salir, `transform-origin` pasa de izquierda a derecha para “cerrar” del otro lado.

**T23 · Scroll de imágenes “cruzando” (Cruce)** — *Qué*: una banda/foto atraviesa el viewport horizontalmente en los cambios de capítulo. *Cómo*: `<Crossing>` con `xPercent: -30 → 30` (o `-100 → 100`) scrub entre dos secciones; `will-change` solo mientras está activo.

**T24 · Sticky split (texto fijo / medios cambian)** — *Qué*: una columna queda fija y la otra se desplaza; cada párrafo dispara un cambio en la imagen (reveal por `clip-path`). *Dónde*: El estudio, páginas de proyecto (índice lateral que marca capítulo activo).

**T25 · Transición de página con View Transitions API** — ver 9.2.

**T26 · Cortina de transición (page curtain)** — transición de marca para rutas sin portada: dos paneles navy entran desde izquierda y derecha, se encuentran (aparece “DOS ORILLAS” + la línea) y se abren hacia arriba/abajo. `ease.inOut`, ~0,9 s. Reemplaza al “fade to white”.

**T27 · Footer-cortina (curtain reveal)** — *Qué*: el contenido se “levanta” y revela el footer que estaba detrás. *Cómo*: footer `position: fixed; bottom: 0; z-index: 0; height: H`; `main` con `position: relative; z-index: 1; margin-bottom: H; background: var(--bg)`. **A11y**: mientras no es visible, el footer va con `inert`/`visibility:hidden` (un `IntersectionObserver` sobre un sentinel lo activa) para que el teclado no entre a links ocultos. El wordmark gigante del footer sube con `yPercent 100 → 0` (scrub corto).

**T28 · Animaciones nativas de CSS (scroll-driven) como mejora** — `animation-timeline: scroll()/view()` para el **indicador de progreso** y reveals simples de párrafos; envolver en `@supports (animation-timeline: scroll())`, con fallback GSAP si no hay soporte. **Regla**: GSAP y CSS scroll-driven no animan la misma propiedad del mismo elemento.
```css
@supports (animation-timeline: scroll()) {
  .scroll-progress { transform-origin: top; animation: grow linear both; animation-timeline: scroll(root block); }
  @keyframes grow { from { transform: scaleY(0) } to { transform: scaleY(1) } }
}
```

**T29 · Reveals de baja prioridad con IntersectionObserver** — `<Reveal>` con un único observer compartido para párrafos chicos, metadatos, listas (más barato que un ScrollTrigger por elemento). `once: true`. Mismo CSS que T02 pero con clases.

**T30 · Reduced motion (contrato de implementación)** — con `prefers-reduced-motion: reduce` **o** toggle del usuario: sin Lenis, sin scrub complejo, sin parallax, sin pin, sin marquee en loop, sin cursor, sin WebGL, sin grain; todo el contenido visible desde el primer frame; transiciones de estado ≤ 200 ms (opacity); el loader se omite; las transiciones de página son un crossfade corto. Implementar con `gsap.matchMedia` (6.4d), y un bloque CSS `@media (prefers-reduced-motion: reduce){ *{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important} }` como red de seguridad.

**T31 · Shader / WebGL (Nivel 3, opcional)** — ver 8.1.4 y presupuesto en 12.1.

**T32 · Filtro animado con Flip** — al filtrar proyectos en `/projects`, `Flip.getState(items)` → cambiar el DOM (mostrar/ocultar por categoría) → `Flip.from(state,{duration:.8,ease:'expo.inOut',stagger:.03,absolute:true,onEnter/onLeave fades})`. Los elementos conservan identidad y “viajan” a su nueva posición.

---

## 8. Escenas, sección por sección

Plantilla de cada escena: **Objetivo** · **Layout desktop** · **Beats** (progreso 0–1 del pin o del trigger) · **Mobile / tier 1** · **Reduced motion** · **A11y** · **Aceptación**. Los números son valores iniciales para afinar mirando la escena en el navegador (usar `?debug`).

**Regla de capas para evitar conflictos de `transform`**: un mismo elemento **no** recibe transforms de dos sistemas distintos. Separar siempre en capas: `wrapper (skew/velocity)` → `mid (scale/clip/pin)` → `inner/img (parallax)`.

### 8.0 Loader / Intro
- **Cuándo**: solo en la **primera visita de la sesión** (`sessionStorage 'do-intro'`) y solo en la home. Nunca en rutas internas ni en visitas posteriores. Se omite con reduced-motion/tier 0. Duración objetivo **0,8–1,5 s** (mínimo 0,8 s; se extiende solo mientras no esté listo el Hero, tope duro 2,5 s; si algo falla, `setTimeout` de seguridad de 3 s lo remueve).
- **Qué espera**: `document.fonts.ready` + `decode()` de las dos imágenes del Hero (si no existen, placeholders → no espera).
- **Layout**: pantalla `navy-deep`; en el eje horizontal central, dos líneas finas (`--bridge-on-dark`); rótulos mono `ORILLA` en cada extremo. Responsive real hasta 320 px (los rótulos usan `clamp()` y **nunca se cortan** en el borde).
- **Beats (tiempo, no scroll)**: `0–.55 s` cada línea crece hacia el centro (`scaleX 0→1`, origen izquierdo/derecho, `ease.inOut`) arrastrando su rótulo · `.55–.8 s` se encuentran y aparece `DOS ORILLAS` (line mask) · `.8–1.3 s` el panel se abre en horizontal como un horizonte (mitad superior `yPercent −100`, inferior `+100`) con la línea como bisagra → revela el Hero; la línea queda como la **línea horizonte** del Hero.
- **Scroll**: `lenis.stop()` durante el loader; `lenis.start()` al terminar.
- **Entrada del Hero (una sola vez, por tiempo, solapada)**: fotos se abren con `clip-path` (la izquierda desde la izquierda, la derecha desde la derecha: dirección semántica) con `scale 1.2→1`; título en máscaras; frase y subtexto; CTAs; indicación de scroll al final. ~1,4 s con stagger.
- **Aceptación**: no parpadea, no hay CLS, 320 px sin cortes, `reduce` lo omite, la primera visita es memorable y la segunda no estorba.

### 8.1 Hero — “Dos orillas, una distancia” (100svh + pin 250 %)
**Objetivo**: en 5 segundos entender que hay dos mundos y que Dos Orillas es el puente. Composición **editorial**, no “título centrado + botón”.

**8.1.1 Layout desktop (≥ 1024)** — escenario pinneado de 100svh, tema `cream`:
- Foto **ORILLA 1** (negocio / personas / trabajo / problemas reales) a la izquierda, 3:4, ~28vw, `top: 12svh`. Foto **ORILLA 2** (solución / interfaces / proyectos / sistemas) a la derecha, 3:4, ~28vw, `top: 20svh` (desfasada: asimetría editorial). Gap central ≈ 30vw (la “distancia”).
- Título en banda inferior: **`DOS`** pegado al margen izquierdo y **`ORILLAS`** al margen derecho (separados = distancia); `ESTUDIO` más chico, en mono/itálica serif bajo `ORILLAS`. `<h1>` accesible: “Dos Orillas Estudio” (texto real en el DOM, partido visualmente).
- Entre fotos y título: banda de la frase; subtexto y CTAs en la parte baja/izquierda; indicación `DESLIZÁ PARA CRUZAR` con una línea que “respira” (idle de 3 s, `scaleY`) y desaparece al primer scroll.
- Una **línea horizonte** (Bridge) a la altura del eje central, aún sin dibujar.

**8.1.2 Beats del timeline (`end: '+=250%'`, `scrub: true`)**
| Progreso | Qué pasa | Cómo |
|---|---|---|
| 0–.08 | se retira la indicación de scroll | `autoAlpha 1→0` |
| 0–.55 | **ACERCAR**: foto izq. `x 0→+14vw`, der. `x 0→−14vw` con **lag distinto** (scrub .5 vs .9 → una “pesa” más) · la derecha baja a la altura de la izquierda (`y` → 0: “se alinean”) · las imágenes hacen *push-in* (`scale 1→1.08` interno) · `DOS` y `ORILLAS` convergen hasta leerse `DOS ORILLAS` · el escenario hace “cámara”: `scale 1→1.06` en la capa interna | `ease.feel` |
| .20–.45 | **CONECTAR**: la línea horizonte se dibuja de izquierda a derecha (`scaleX 0→1`, origen izquierdo = orilla 1) detrás de las fotos | T15 |
| .30–.45 | los CTAs se atenúan (`autoAlpha`), quedan accesibles por la navbar | |
| .35–.60 | aparece **“Primero entendemos.”** (line mask, centrada en la banda de frase) y **permanece** | T02 |
| .55–.75 | las fotos se tocan: una **costura vertical azul** (`scaleY 0→1`) las une | T15 |
| .60–.80 | aparece **“Después hacemos.”** (en *Instrument Serif* itálica, segunda línea) | T02 |
| .80–1.0 | **salida natural**: título sube `yPercent −15` y se atenúa; el escenario escala a 1.15; el fondo empieza a virar a `navy-deep` (T14); **la línea horizonte se queda** y pasa a ser la cota de 8.2 | |

Extras (tier ≥ 2): parallax de mouse **±6–10 px** en sentidos opuestos para cada foto (`quickTo`), desactivado en touch.
**8.1.3 Mobile / tablet**: tablet (768–1023) = desktop con pin 160 % y sin WebGL. Mobile (<768) = composición **vertical**: foto orilla 1 arriba, foto orilla 2 abajo, el título en el medio (`DOS` / `ORILLAS`, 15vw), convergen en **Y** (`±8svh`), pin ≤ 120 %, **CTAs siempre visibles** (no se atenúan), la frase se revela por líneas.
**8.1.4 Nivel 3 — WebGL (opcional, tier 3, solo después de que el Nivel 2 esté impecable)**: un `<canvas>` detrás del texto con dos planos texturizados con las mismas fotos. Uniforms: `uProgress` (del timeline), `uMouse`, `uTime` (solo para ruido lento). Shader: desplazamiento de UV por ruido suave con amplitud ≤ **0,012** y pico en la mitad de la convergencia (`uProgress·(1−uProgress)`); separación RGB ≤ 0,0015. Parallax 3D por mouse máximo 5–10 px equivalentes. Reglas: DPR ≤ 1,5; render **a demanda** (solo si el Hero es visible); `dynamic import`; fallback DOM siempre presente (el canvas aparece cuando las texturas están listas); `dispose()` de geometrías/texturas/renderer al desmontar; manejar `webglcontextlost`. **Si no se justifica, no se hace**: la página debe funcionar perfecta sin esto.
**Reduced**: estado final estático: fotos juntas, título leído como `DOS ORILLAS`, frase completa, CTAs visibles.
**A11y**: orden de lectura = h1 → frase → subtexto → CTAs; CTAs son `<a>` reales; foco visible; `autoAlpha` retira del tab-order los CTAs ocultos.
**Aceptación**: el usuario controla la animación con el scroll (reversible); nada depende del tiempo salvo la entrada; 60 fps; el Hero comunica “dos mundos que se acercan”.

### 8.2 La distancia entre dos orillas (pin 300 %) — impacto **tipográfico**
**Objetivo**: una de las experiencias principales. Convertir la metáfora en un gesto: dos palabras gigantes se acercan y una línea las une. Tema `navy-deep`.
**Layout**: a la izquierda `TU NEGOCIO` (display, 2 líneas) con rótulo mono `ORILLA 01`; a la derecha `LA TECNOLOGÍA` con `ORILLA 02`; entre ambas, una **línea de cota** (como las de un plano: tramo con marcas `|——|` en los extremos y la etiqueta mono `DISTANCIA` en el centro). En el centro, chico: “Entre tener un problema y encontrar la herramienta correcta hay una distancia.”
| Progreso | Qué pasa |
|---|---|
| 0–.18 | las palabras entran por sus lados (izq. desde la izquierda, der. desde la derecha) con line mask; la **línea horizonte del Hero** se vuelve la cota (continuidad); el texto central aparece |
| .18–.62 | **ACERCAR**: `TU NEGOCIO` `x→+`, `LA TECNOLOGÍA` `x→−` con `power2.inOut`; la cota se acorta proporcional al gap (`scaleX = gap/gapMax`); el texto central se desvanece antes de que las palabras lo toquen (≈ .30–.40); las palabras se reducen (~55–60 %) con `transform-origin` en su lado exterior |
| .62–.72 | estado intermedio: ambas quedan en **una sola línea** `TU NEGOCIO ───── LA TECNOLOGÍA` |
| .72–.82 | **CONECTAR**: la línea entre las palabras se dibuja desde el centro hacia afuera; aparece **“Ahí trabajamos nosotros.”** (itálica serif, line mask) |
| .82–1.0 | tres líneas secuenciales: “Entendemos el problema.” / “Pensamos la solución.” / “Construimos el puente.”; la última cierra con una hairline a ancho completo (divisor hacia el Manifiesto); el tema vira a `cream` (T14) |
**Mobile / tier 1**: sin pin JS. Contenedor de ~220svh con un hijo **`position: sticky; top: 0; height: 100svh`** (pin por CSS, barato) y un ScrollTrigger *scrub* sobre el contenedor: `TU NEGOCIO` arriba y `LA TECNOLOGÍA` abajo se acercan en vertical (`yPercent`), cota vertical con `scaleY`, las tres frases se revelan.
**Reduced**: composición final estática.
**A11y**: DOM = “Tu negocio” → “La tecnología” → párrafo → tres frases; la cota es decorativa (`aria-hidden`).
**Aceptación**: se entiende sin leer; la línea efectivamente “une”; no se siente repetición del Hero (distinto lenguaje).

### 8.3 Manifiesto — **respiro**
**Layout (cream)**: dos afirmaciones gigantes, 3 líneas cada una, asimétricas (la 2.ª con indentación de 2 columnas). Una foto vertical 3:4 (~26vw) en la columna derecha con T04 (reveal desde abajo) + T05 (parallax lento −15 → +15 %). La foto **no** pasa detrás del texto (legibilidad).
**Secuencia**: `NO HACEMOS / TECNOLOGÍA / PORQUE SÍ.` (line masks al 85 %) → pausa de ~60–70svh → `PORQUE SÍ.` recibe un **tachado Bridge** (`scaleX 0→1`, 1–2 px, acento) → `LA HACEMOS / CUANDO PUEDE / MEJORAR ALGO.` (line masks; `MEJORAR ALGO.` en *Instrument Serif* itálica con color de acento) → al final, texto chico revelado con T03: “Hacemos que la tecnología se adapte al negocio, no al revés.”
**Mobile**: foto 4:5 al 70 % de ancho, alineada a la derecha, entre ambas afirmaciones; parallax ≤ 6 %.
**Reduced**: todo visible; tachado estático.
**Aceptación**: es lo más calmo de la página; mucho aire; lectura cómoda.

### 8.4 Soluciones
**Layout (white)**: cabecera `SOLUCIONES` (display-l) + subtítulo chico a la derecha. Lista de **4 filas grandes** (≥ 22svh): `[01]` mono a la izquierda · **hairline** que ocupa el espacio sobrante · **nombre corto** display a la derecha (`WEB`, `SISTEMAS`, `AUTOMATIZACIÓN`, `DATOS`), de modo que las líneas tienen largos distintos: `01 ─────── WEB`, `02 ───── SISTEMAS`, `03 ─── AUTOMATIZACIÓN`, `04 ───── DATOS`.
- **Reposo (sin hover, siempre legible)**: bajo cada fila, en una sub-columna, el título completo (`WEB & E-COMMERCE`…) y la descripción, a ~60 % de opacidad. **Hover/focus (puntero fino)**: el nombre crece (`scale 1→1.03`, origen derecho), la línea se engrosa y se acorta/alarga (±8 %) con color de acento, las demás filas bajan a `.35`, la descripción pasa a 100 % y aparece la **imagen preview que sigue parcialmente al cursor** (T17).
- **Entrada**: cada fila al 80 % del viewport: línea `scaleX 0→1` (origen izquierdo), nombre en máscara, número en fade; stagger .12.
- **IA aplicada (transversal)**: una **línea vertical Bridge** recorre el margen izquierdo cruzando las cuatro filas (se dibuja con scrub, con una marca en cada fila): *es un hilo que atraviesa todas las áreas*. Debajo de la lista: etiqueta mono `IA APLICADA · TRANSVERSAL` y la frase “Usamos inteligencia artificial cuando aporta valor. No porque esté de moda.” en line masks. Sin robots, sin neón, sin estética “de IA”.
- **Cierre de capítulo → 8.5**: la hairline inferior de la última fila se extiende a **ancho completo** (`scaleX`, scrub) y queda posicionada en el borde de la sección: es la pista de Proceso (T16).
**Mobile**: acordeón (T18); una abierta a la vez; la imagen va *dentro* del panel (4:5 chica).
**Reduced**: todo expandido, sin movimiento.
**A11y**: cada fila es un `<h3>` + descripción; en mobile el disparador es un `<button>`; el hover es un extra.

### 8.5 Cómo trabajamos — scroll horizontal controlado por scroll vertical
**Objetivo**: sentir un recorrido; “el puente que avanza”. Tema `navy`.
**Estructura pinneada** (T09): panel de apertura (~50vw) con “No empezamos construyendo. Empezamos escuchando.” (display-l, line masks) → 4 etapas de **60–80vw** cada una. **No son cards**: cada etapa tiene un **numeral gigante** (`01`…`04`), título (`NOS CONTÁS`…), texto breve (≤ 34ch) y un **esquema lineal abstracto** (SVG, acento) que se anima al entrar al centro (con `containerAnimation`):
- 01 · *dos puntos distantes* con un trazo punteado tenue entre ellos (lo desconocido). — SEPARAR.
- 02 · los mismos puntos + **líneas de construcción** (retícula, cruz) y marcas de medición sobre el trazo. — PENSAR.
- 03 · **bloques** (rectángulos de contorno) que se deslizan y se ubican a lo largo del trazo. — CONSTRUIR.
- 04 · el trazo se vuelve **sólido**; un punto viaja de una orilla a la otra (`MotionPathPlugin`) y hay un pulso breve en la segunda. — PONER A ANDAR.
**Progreso**: pista Bridge inferior a ancho de márgenes (continuación de la línea de 8.4, mismo `y`), con `scaleX` = progreso total y **marcas** en 0, ⅓, ⅔, 1 etiquetadas `01…04` (pasan a acento al cumplirse). Contador `01 / 04` arriba a la derecha con **roll** (T11), actualizado solo al cambiar de etapa. Opacidad de cada panel `.35→1` al acercarse al centro.
**Cierre de capítulo → 8.6**: al terminar el pin, la pista queda en el borde y es el **borde superior del marco** de la primera foto de Proyectos.
**Mobile / tier 1**: lista vertical (`<ol>`); cada etapa con su esquema (más chico); una **línea Bridge vertical** a la izquierda se llena con `scaleY` (scrub no pinneado); reveals T02/T29. **No** se bloquea un scroll enorme.
**Reduced**: etapas apiladas estáticas, línea completa.
**A11y**: `<ol><li>`; **sincronización de foco**: si un elemento de la etapa k recibe foco (Tab), llevar el scroll a la posición de esa etapa (`lenis.scrollTo`) para que el teclado no quede “en una etapa invisible”. Aplicar la misma regla en cualquier pin.
**Aceptación**: la pista efectivamente “completa” el recorrido; el contador siempre coincide con la etapa visible.

### 8.6 Proyectos destacados — **cinematográfico** (N × 100svh)
**Objetivo**: cada proyecto es una escena. Sensación de **capas y profundidad** (dolly en Z). El componente es **data-driven**: itera `projects.filter(featured)`; funciona con 1 o con 12.
**Marco de entrada (cadena desde 8.5)**: en los últimos ~25svh antes del pin, alrededor del área de la primera imagen se dibujan las otras tres aristas del marco (laterales `scaleY`, inferior `scaleX`) a partir de la línea que viene de Proceso; al empezar el pin, la foto se **abre dentro del marco** (clip-path desde el centro) y las aristas se desvanecen.
**Estructura**: `<section>` con `<ol>` de N slides apiladas (`position:absolute; inset:0`) y una capa fija con: etiqueta `PROYECTOS SELECCIONADOS` (arriba izq.), contador `01 / 05` con roll (abajo izq., **permanece fijo**), ayuda de scroll (abajo der.).
**Slide** (desktop): columna izquierda ≈ 40vw con categoría (mono), título gigante en 2 líneas (`titleLines`), `VER PROYECTO →` (link real) y badge de contexto; a la derecha la **imagen grande** (~54vw × 70svh), con `data-cursor="ver"` y envuelta en el `<a>` del proyecto.
| Segmento de proyecto *i* | Qué pasa |
|---|---|
| **entrada** (0–.30) | imagen `yPercent 100→0`, `scale .8→1`, radio `24px→0`; título en máscara (`yPercent 110→0`, stagger .08); categoría y número en fade; el contador rueda a *i*; el fondo se interpola al `tone` del proyecto (T14, variables) |
| **permanencia** (.30–.70) | parallax interno de la imagen (`yPercent −6→+6`) + `scale 1→1.03` del wrapper; skew por velocidad ±1° en la capa externa (T13) |
| **salida** (.70–1.0, solapada .15 con la entrada de *i+1*) | la imagen actual **escala > 1** (`1.03→1.12`) y se desvanece mientras la siguiente **emerge desde atrás** (`scale .86→1`, `opacity 0→1`); el título actual sale hacia arriba por máscara; el siguiente entra después de que su imagen llegó al 60 % |
**Ordenamiento de capas**: la siguiente slide está *debajo* (z menor) de la actual hasta que la actual se desvanece (profundidad real). El último proyecto sale con un unpin normal hacia “Todos los proyectos”.
**Interacción**: el cursor se agranda con `VER`; click en cualquier parte de la imagen activa navega (T25). Solo la slide activa es interactiva (`inert` + `aria-hidden` en las demás; se actualiza **cuando cambia el índice**, no por frame). Foco sincronizado (si un link de la slide k recibe foco → `lenis.scrollTo` a su posición).
**Mobile / tablet / tier 1**: sin pin. Cada proyecto = bloque `min-height: 100svh` (imagen 4:5 arriba, título + CTA abajo), apilados con **`position: sticky; top: 0`** (el anterior se reduce a `scale .94` y se oscurece con una capa de `opacity` al ser cubierto), reveals T04/T02 sin scrub (`once`), contador `0i / 0N` inline.
**Sin JS / reduced**: lista vertical normal de proyectos con imagen y CTA.
**Aceptación**: hay sensación de capas (la actual “se acerca”, la siguiente “emerge”); el número no se mueve; el fondo cambia suave; 60 fps con N=5; no hay hover-dependencia.

### 8.7 Todos los proyectos — grilla editorial asimétrica
**Layout (cream)**: título `TODOS LOS PROYECTOS` (line masks). Grilla de 12 columnas con **patrón de filas calculado por índice** (cíclico): `[7 | 5]` → `[5 | 7]` → `[4 | 4 | 4]` …; **ratios** que ciclan `4:5 · 16:10 · 1:1 · 3:2`; **desfases verticales** (`margin-top` escalonado) para ritmo editorial. Agregar proyectos nunca rompe el layout (el patrón es una función de `index`).
**Card**: imagen con reveal por clip-path al entrar (T04, `once`), hover `scale 1→1.04` (`.8 s`, `ease.out`), debajo: título (display-m), meta mono (`CATEGORÍA · AÑO` si existe), y **`VER PROYECTO →`** que sube por máscara en hover/focus (**siempre visible en touch**). Cursor `VER →` (T19). Parallax leve y diferente por columna (`data-speed` .94–1.06) en 2–3 cards.
**Cierre**: tile final **no-proyecto**: “¿Tu proyecto es el próximo? Contanos qué querés resolver →” (sin datos inventados). Si hay más de 8 proyectos (`HOME_GRID_LIMIT`), mostrar los primeros 8 + link `VER TODOS →` a `/projects` (9.3).
**Separador cinético** (1.º de los 2–3 usos de T12): banda `DOS ORILLAS — DOS ORILLAS —` entre esta sección y El estudio, con velocidad ligada al scroll.
**Mobile**: una columna con anchos alternados (≈ 88 % izq. / 78 % der.) para conservar lo editorial.
**Aceptación**: no parece una grilla de cards iguales; el hover es un extra, no una condición.

### 8.8 El estudio — lectura con sticky split
**Layout (white)**: split 5/7. **Columna izquierda sticky** con el headline `DOS PERSONAS. / DOS ORILLAS. / UNA MISMA FORMA / DE TRABAJAR.` (cada línea se revela con scrub a medida que avanza la columna derecha: progreso 0, .25, .5, .75). **Columna derecha** que se desplaza: el párrafo lead “Dos Orillas nace de una idea simple: antes de construir una solución, hay que entender realmente el problema.” con **T03** (palabras que se encienden) → los dos párrafos (“Somos un estudio…”, “Trabajamos con negocios…”) → el trío **“Escuchamos. / Analizamos. / Y después construimos.”** en display-m, unidos por líneas Bridge verticales que se dibujan (ENTENDER → PENSAR → CONSTRUIR).
**Imágenes**: 2–3 fotos flotando en los espacios vacíos (no en cajas iguales): una chica (3:4), una apaisada, con T04 y `data-speed` diferentes (T06). Si existen fotos reales del trabajo/personas, tienen prioridad.
**Mobile**: apilado, sin sticky; headline completo, texto, trío con línea vertical, fotos con reveal.
**Reduced**: sin scrub; todo visible.
**Aceptación**: se lee con comodidad; el movimiento acompaña la lectura y no la interrumpe.

### 8.9 Equipo — personas, no CV
**Layout (cream)**: título `DOS MIRADAS. / UN MISMO EQUIPO.` Dos retratos grandes 4:5 (~34vw). **Estado inicial**: Santino a la izquierda (`y +12vh`) y Tobías a la derecha (`y −8vh`), bien separados. **Con el scroll** (pin 150 %, scrub): se desplazan hacia el centro, **se alinean** en la misma línea de base (`y→0`), y una **costura vertical Bridge** se dibuja entre ambos; luego aparecen los nombres y roles en máscara. Los retratos usan reveals con dirección semántica (Santino desde la izquierda, Tobías desde la derecha).
**Contenido** (`content/team.ts`):
- **SANTINO DACUY** — Analista en Sistemas · Licenciatura en Sistemas de Información en curso. `focus` `CONFIRMAR`: Diseño · UX/UI · Contenido · Backend y datos.
- **TOBÍAS CARBALLO** — Analista en Sistemas. `focus` `CONFIRMAR`: Desarrollo web · Bases de datos.
- `bio: null` (no inventar). **Prohibidas** las barras de porcentaje de skills (“HTML 90 %”) y cualquier cifra de experiencia.
**Interacción (desktop, puntero fino)**: sin selección, ambos equilibrados. Hover/focus en uno: su foto gana protagonismo (`scale 1.04` interno), la otra baja a `opacity .55` / `scale .98` (con capa de opacidad, sin `filter`), y aparecen —en máscara y *muy discretamente*— los `focus`. **Nombre y rol siempre visibles**; el resto es un extra. `:focus-within` activa lo mismo (teclado). Sin hover (touch / `hover:none`): todo visible.
**Mobile**: stack vertical sin pin, reveals T04, costura vertical a la izquierda.
**Imágenes**: `/team/santino-01.webp`, `/team/tobias-01.webp` (opcional `-02` para el estado hover); `<Media>` las toma solas al existir.
**Aceptación**: se ve a dos personas; sin tono de CV.

### 8.10 Herramientas — “las herramientas cambian, el criterio no”
**Layout (cream)**: título `LAS HERRAMIENTAS CAMBIAN. / EL CRITERIO NO.` (la primera frase en peso ligero/itálica; la segunda firme). **Dos marquees** en sentidos **opuestos** (las dos orillas), texto mono/uppercase mediano (no logos, no “tech flex”): React · Next.js · JavaScript · TypeScript · Node.js · Python · SQL · PostgreSQL · MongoDB · Redis · Docker · Supabase · AWS · Figma · APIs REST · GSAP. Una **línea vertical Bridge fija** en el centro del viewport atraviesa ambas filas (“el criterio” no se mueve mientras las herramientas pasan). Subtexto: “Elegimos tecnología en función de lo que haya que resolver.” Velocidad ligada al scroll (T12); hover pausa (desktop).
**Mobile**: mismos marquees más lentos y chicos. **Reduced / sin JS**: lista en 2–3 columnas con hairlines.
**A11y**: un `<ul>` real para lectores de pantalla; las copias del loop son `aria-hidden`.

### 8.11 CTA final — emocional
**Layout**: `navy-deep` pantalla completa. Texto enorme `TENÉS UNA IDEA. / UN PROBLEMA. / O ALGO QUE PODRÍA / FUNCIONAR MEJOR.` (cada línea se revela con scrub al avanzar; la última en *Instrument Serif* itálica con acento). Luego **`HABLEMOS.`** (display-xl) con una Bridge que se dibuja debajo.
**Botón** `CONTANOS QUÉ QUERÉS RESOLVER →` (grande, rectangular, hairline): en hover el fondo se llena con `clip-path` desde la izquierda (crema, texto navy), la flecha se desplaza `translateX(6px)`, **una línea fina atraviesa el componente** (`scaleX 0→1`), y el botón se “expande” suavemente; magnético (T20). Navega a `#contacto` con Lenis.
Debajo, en mono: `Dos Orillas Estudio · Concepción del Uruguay · Entre Ríos · Argentina`.
**Cadena opcional**: la línea vertical de Herramientas desciende hasta el CTA y gira para ser la línea de `HABLEMOS.` (“el criterio se vuelve puente”).
**Mobile**: tipografía más chica con el mismo impacto; botón a ancho completo.

### 8.12 Contacto
**Layout (navy-deep, continuación)**: columna izquierda: `<h2>` “Conversemos”, email (`dosorillasestudio@gmail.com`) con botón **Copiar email** + toast, Instagram `@dosorillas.estudio` (link real), ubicación en mono. Derecha: **formulario** con campos *Nombre · Email · Negocio / empresa · ¿Qué querés resolver?* y helper del textarea “No hace falta que tengas la solución. Contanos qué está pasando.”
**Campos**: label **visible y estática** encima (no placeholder-como-label), borde inferior 1 px que se “conecta” (Bridge `scaleX`) al enfocar, `autocomplete` (`name`, `email`, `organization`), `inputmode`, `aria-invalid`, `aria-describedby`. Validación con Zod (cliente y servidor), mensajes en voz de marca (3.3), **resumen de errores** arriba al fallar el submit (el foco va a él), honeypot oculto.
**Estados**: `idle` · `loading` (el botón dice `ENVIANDO…` y una línea recorre su borde) · `success` (el form se reemplaza por el mensaje, una Bridge se completa a todo el ancho, el foco va al título del mensaje) · `error` (mensaje con salida alternativa por email). Todo anunciado con `aria-live`.
**Mobile**: apilado.

### 8.13 Footer — cortina
**Layout (ink)**: footer-cortina (T27). Una banda marquee fina `DOS ORILLAS — DOS ORILLAS —` arriba (3.er uso de T12). Wordmark **`DOS ORILLAS / ESTUDIO`** gigante a ancho completo (cada línea sube con scrub corto al quedar descubierta). Menú (Estudio · Soluciones · Proyectos · Equipo · Contacto) con T22, Instagram, Email, “Primero entendemos. Después hacemos.”, `Concepción del Uruguay · Entre Ríos · Argentina`, **reloj local** (dato real, opcional), **año dinámico** (componente cliente `<Year/>` o `suppressHydrationWarning`, para que no quede congelado en el año del build), toggle “Reducir movimiento”, botón **Volver arriba** (`lenis.scrollTo(0, {duration: 2})`). Una Bridge hairline en el borde superior.

---

## 9. Páginas de proyecto, transiciones entre páginas y extras de ruta

### 9.1 Case study — `/projects/[slug]` (SSG con `generateStaticParams`)
Misma calidad de animación que la home. Se arma **solo con los bloques que tengan contenido** (`null` = el bloque no existe).
1. **Hero**: la portada en full-bleed (es el destino de la transición, `view-transition-name: project-cover`), título gigante en máscara por `titleLines`, fila de metadatos mono (`CATEGORÍA · AÑO · CONTEXTO`), indicación de scroll. Parallax interno de la portada.
2. **Overview** (`intro`): lead con T03.
3. **Problema** (`challenge`) · **Proceso** (`approach`) · **Solución** (`solution`): cada bloque con **etiqueta sticky a la izquierda** (`01 — PROBLEMA`, mono) y texto a la derecha (T24). Entre bloques, imágenes con T04/T05. El **key visual** (9.5) va en *Solución* o, si no hay portada real, en el hero.
4. **Tecnologías**: lista mono con hairlines (sin logos gigantes, sin “tech flex”).
5. **Galería**: ratios mezclados con reveals y parallax leve; en desktop, opción de tira horizontal arrastrable con `Draggable` (+ inercia) y cursor `DRAG`; en mobile, tira nativa con `scroll-snap-type: x mandatory` y `overscroll-behavior-x: contain`.
6. **Resultado**: **solo si `result` existe** y es real.
7. **Links**: `VER EN VIVO ↗` / `VER CÓDIGO ↗` solo si hay URL.
8. **Siguiente proyecto**: bloque enorme con la portada del siguiente; al entrar, la imagen se abre con scrub (`clip-path inset(15%) → inset(0)`); es un **link con click** (nunca navegación automática por scroll). Cíclico (el último apunta al primero).
- **Índice lateral** (desktop): `01 Overview … 07 Resultado` (solo los existentes) con el capítulo activo marcado (ScrollTrigger). En mobile se omite.
- Metadata por proyecto (`generateMetadata`), OG dinámico (`opengraph-image.tsx`) con la portada o, si no existe, una tarjeta tipográfica de marca.

### 9.2 Transición portada → case study (View Transitions API)
**Objetivo**: al hacer click en una portada, **esa misma foto se expande hasta ocupar la pantalla** y luego aparece el contenido. Nada de *fade to white*, cambio brusco ni spinner.
**Primero**: revisar la documentación de la versión instalada de Next/React. Si existe soporte **estable** (`experimental.viewTransition` / componente `<ViewTransition>`), preferirlo. Si no, implementación manual:
1. `TransitionLink` (cliente) intercepta click izquierdo sin modificadores. Si `!document.startViewTransition` o tier 0 → navegación normal.
2. Asigna `style.viewTransitionName = 'project-cover'` **solo** a la imagen clickeada (el nombre debe ser único en el documento en ese instante).
3. `const t = document.startViewTransition(() => new Promise<void>(res => { pending = res; router.push(href); }))`.
4. `PageTransition` (en el layout) detecta el cambio de `pathname`, espera a que el hero destino esté pintado/decodificado y llama a `pending()`.
5. Al terminar (`t.finished`) se limpia el nombre inline. El hero del destino lleva el mismo nombre por CSS.
6. Ajustar con CSS: `::view-transition-group(project-cover){animation-duration:.9s;animation-timing-function:cubic-bezier(.76,0,.24,1)}` y para `root`: salida/entrada con leve desplazamiento + fade (≤ .5 s). `prefers-reduced-motion` → sin VT.
7. **Back**: el link “← Todos los proyectos” guarda `sessionStorage['last-cover']=slug`; al volver a la home, antes de resolver la promesa, se asigna el nombre a la card correspondiente y se hace `lenis.scrollTo(card, {immediate:true})` para que la foto **aterrice** en su lugar. El botón “atrás” del navegador usa un crossfade simple (no debe romperse).
8. **Prefetch**: `router.prefetch(href)` en hover/in-view; las páginas son estáticas para que no haya estado de carga visible entre captura y destino.
9. **Fallback sin VT (Firefox viejo / WebView)**: clonar la imagen en una capa `position: fixed` en su rectángulo actual y animarla a pantalla completa con **GSAP Flip** (`Flip.getState` → `Flip.from`, `ease.inOut`, `.9 s`) mientras carga la ruta; al llegar, retirar el clon.
10. Rutas sin portada (404, `/projects`, legales): **cortina de marca** (T26).

### 9.3 `/projects` (alias `/proyectos` con redirect 308) — índice con filtros
Solo aporta valor cuando hay muchos proyectos; construirlo en la fase de extras. Misma grilla asimétrica que 8.7 + **filtros** (`Todos · Web & E-commerce · Sistemas · Datos · IA · Arquitectura`, solo las categorías con proyectos) como `<fieldset>` de botones `aria-pressed`; el estado vive en la URL (`?c=datos`). El cambio se anima con **Flip** (T32). Tier 0: sin animación.

### 9.4 404 y estados vacíos
`not-found.tsx`: “Este puente no llega a ningún lado.” + `VOLVER AL INICIO →`, con una línea Bridge **cortada** que se reconecta al hover/focus. Sin gags largos.

### 9.5 Key visuals por proyecto (cuando no hay capturas reales)
Los **screenshots reales tienen prioridad** apenas existan. Mientras tanto, cada proyecto con `keyVisual` muestra un **esquema conceptual** en SVG (colores de tokens, líneas finas, sin UI falsa, sin números, sin métricas) rotulado discretamente `ESQUEMA CONCEPTUAL`. Se dibujan con T15, se animan al entrar al viewport y se pausan fuera de pantalla (`IntersectionObserver`). En reduced-motion quedan estáticos y completos.
- **`event-flow` — Transacciones en tiempo real**: nodos `API (Next.js)` → topic `comandos` → `Procesador` → topic `eventos` → `SSE` → `Timeline`; rama `DLQ` desde el procesador. “Paquetes” (puntos/cuadraditos) recorren los caminos con `MotionPathPlugin`, escalonados; cada tanto uno se desvía a la DLQ (**sin estadística**, es ilustrativo). Hover/focus en un nodo resalta su camino (el texto descriptivo siempre está en el DOM).
- **`geo` — Gestión aeropuertaria**: plano con retícula fina, un puñado de puntos abstractos; un **círculo de radio** se expande desde un punto y los puntos dentro se resaltan (búsqueda geográfica / cercanos); al costado, barras de **orden sin valores** (ranking de popularidad); a menor “zoom” los puntos se funden en un **cluster** (círculo mayor).
- **`clusters` — Clasificador de frutas (ART1)**: filas de **celdas binarias** (5 columnas = características) que se “encienden” y se asignan a **prototipos** (columnas de clusters); si un patrón no coincide, aparece un prototipo nuevo. Dos etapas encadenadas (variedad → calidad) como en la arquitectura real. Sin accuracy, sin porcentajes.
- **`dw-structure` — Retail Vision**: **esquema en estrella** de contorno (4 bloques `HECHOS` rodeados de bloques `DIMENSIÓN`, **sin nombres de campos inventados**), una flecha `ETL → modelo → dashboards` y un par de ejes **vacíos** marcados “a completar”. Sin KPIs.
- **`commerce-flow` — Mate Único**: flujo tipográfico `CATÁLOGO → CARRITO → PAGO → ENVÍO` con ramas `GOOGLE LOGIN`, `MERCADO PAGO` y `PANEL ADMIN` (todo funcionalidad contemplada). Sin mockups de pantallas.

---

## 10. Interacciones globales

### 10.1 Navbar
- Desktop: izquierda **logo**; derecha `Estudio · Soluciones · Proyectos · Equipo` + `Conversemos →`. Sobre el Hero, **transparente**.
- Al pasar un umbral de scroll (~80 px): reduce altura (88 → 64 px) con **una sola transición CSS** (no por frame), adopta el fondo del contexto (crema o negro según `data-nav`), hairline inferior `--line`, y **adapta logo y texto** (`--fg`) por sección (`ScrollTrigger.onToggle` → `data-nav="light|dark"`). Transición ≤ .4 s, `ease.soft`.
- Link activo con subrayado Bridge (`scaleX`); el link activo sigue el capítulo vigente (10.3). Hover: T22. `Conversemos →`: T21 + flecha.
- Anclas: `Estudio → #estudio`, `Soluciones → #soluciones`, `Proyectos → #proyectos`, `Equipo → #equipo`, `Conversemos → #contacto` (con `lenis.scrollTo`).
- Skip link y `<nav aria-label="Principal">`.

### 10.2 Menú mobile (fullscreen, **diseñado**)
- Al abrir: `lenis.stop()`; el `<main>` **escala a 0,96** (`transform-origin: top center`, leve radio) y se atenúa; el overlay aparece con `clip-path: inset(0 0 100% 0) → inset(0)` (`.8 s`, `ease.inOut`); los links entran escalonados (máscara `yPercent 110 → 0`, stagger `.06`); una **fotografía/textura editorial** ocupa parte del fondo (con grain; un placeholder si aún no hay foto).
- Links enormes con numeral mono: `01 Estudio · 02 Soluciones · 03 Proyectos · 04 Equipo · 05 Conversemos`. Pie: email, Instagram, ciudad.
- A11y: `aria-modal`, **focus trap**, `Esc` cierra, resto del documento `inert`, foco vuelve al botón, botón con `aria-expanded`/`aria-controls`, etiquetas “Abrir menú / Cerrar menú”. Al elegir un ancla: cerrar y luego scrollear (tras ~.6 s). Reduced: solo fade.

### 10.3 Indicador de progreso y capítulos
- Línea **vertical azul de 1 px** en el borde derecho (en mobile, horizontal de 1–2 px arriba), con relleno `scaleY` ligado al scroll (T28 con fallback GSAP). **No debe parecer una barra de carga**: muy sutil, sin porcentaje.
- Marcas en la línea para los 5 grandes capítulos y una **etiqueta mono** que aparece ~1,4 s al cruzar cada uno: `01 ESTUDIO · 02 SOLUCIONES · 03 PROYECTOS · 04 EQUIPO · 05 CONTACTO`.
- Mapeo de capítulos ↔ secciones: **01 Estudio** = Hero + La distancia + Manifiesto (`#estudio`) · **02 Soluciones** = Soluciones + Proceso · **03 Proyectos** = Destacados + Todos · **04 Equipo** = El estudio + Equipo + Herramientas (`#equipo`) · **05 Contacto** = CTA + Contacto + Footer (`#contacto`).

### 10.4 Cursor contextual
Reglas completas en T19. Estados: *default* (punto de 8 px), *ver* (círculo ~84 px con `VER`), *drag* (`DRAG`), *link* (anillo mayor sin texto). Solo desktop con `(hover:hover) and (pointer:fine)`, desactivado en touch, mobile y reduced-motion. **No** ocultar el cursor del sistema donde haya riesgo de UX (texto, formularios).

### 10.5 Colores/tema
`ThemeController` (T14) lee `data-theme` de cada `<section>` y de `projects[i].tone`; la navbar y el cursor consumen `--fg/--bg`. Documentar en `DECISIONS.md` el par texto/fondo de cada tema con su ratio de contraste.

---

## 11. Contacto, SEO y accesibilidad

### 11.1 Backend del formulario
- `POST /api/contact` (Route Handler): valida con **Zod**, descarta honeypot, **rate limit** simple por IP (en memoria; opcional Upstash), envía con **Resend** a `CONTACT_TO_EMAIL` (`replyTo` = email del visitante; asunto “Nuevo mensaje desde la web — {nombre}”; texto plano + HTML simple escapado). **No almacena** datos. Errores del servidor se loguean sin datos personales.
- Si faltan las variables de entorno: responder 503 con mensaje seguro y que el cliente ofrezca `mailto:dosorillasestudio@gmail.com` como alternativa.
- Resend requiere dominio verificado para enviar desde una dirección propia (para pruebas, `onboarding@resend.dev`). Si todavía no hay dominio, documentar en `DECISIONS.md` la alternativa elegida (Formspree/Web3Forms o SMTP con contraseña de aplicación vía Nodemailer).
- Cloudflare Turnstile opcional. Línea de privacidad bajo el botón: “Usamos tus datos solo para responderte.” `CONFIRMAR`; página `/privacidad` **PENDIENTE** (crear estructura vacía, sin texto legal inventado).

### 11.2 SEO
- `title`: **Dos Orillas Estudio — Soluciones digitales** · `description`: “Diseñamos y desarrollamos soluciones digitales para negocios. Web, sistemas, automatización y datos desde Concepción del Uruguay.”
- Metadata API con `metadataBase` (`NEXT_PUBLIC_SITE_URL`), **canonical**, OpenGraph, Twitter cards (`summary_large_image`), `opengraph-image.tsx`, favicon (desde `mark.svg`), `apple-touch-icon`, `manifest`, `theme-color`.
- `sitemap.ts` (home + cada proyecto + `/projects` si existe), `robots.ts` (permitir en producción; **`noindex` en previews**).
- **JSON-LD** `ProfessionalService`/`Organization`: `name`, `url`, `logo`, `email`, `sameAs` (Instagram), `address` (`addressLocality: Concepción del Uruguay`, `addressRegion: Entre Ríos`, `addressCountry: AR`). **Sin** ratings, precios, teléfono, horarios ni `areaServed` no confirmados. Un `BreadcrumbList` en proyectos.
- Un único `<h1>` por página; jerarquía h2/h3 limpia; contenido real en el HTML (los reveals no lo ocultan al crawler).

### 11.3 Accesibilidad (WCAG AA)
- HTML semántico: `header`, `nav`, `main`, `section[aria-labelledby]`, `footer`; botones y enlaces **reales**; jerarquía de títulos correcta.
- **Foco visible** siempre (anillo 2 px de acento + offset 3 px, legible en temas claros y oscuros); jamás `outline: none` sin reemplazo. Orden de tab = orden visual/lectura. **Skip link**.
- Teclado: todo operable sin mouse; pins con **sincronización de foco** (8.5/8.6); menú con trap; formulario completo.
- Contraste AA verificado por tema (5.1). Objetivos táctiles ≥ 44 px. Zoom de texto al 200 % sin pérdida.
- Imágenes reales con `alt` descriptivo; decorativas y placeholders con `alt=""`/`aria-hidden`. Copias de marquee `aria-hidden`. Cursor, líneas y grain decorativos con `aria-hidden`.
- Cambio de ruta: anunciar el título en una región `aria-live="polite"` y mover el foco al `<h1>`.
- **Reduced motion**: T30 + toggle en el footer + tier 0. Nada esencial depende de hover ni de animación.
- Verificación: `axe` sin violaciones serias/críticas + pasada manual con lector de pantalla (VoiceOver o NVDA) por la home, el menú, el formulario y un case study.

---

## 12. Performance y degradación adaptativa

### 12.1 Presupuestos (medir con Lighthouse **mobile** y desktop; fallar la fase si se incumplen)
| Métrica | Objetivo |
|---|---|
| LCP | ≤ 2,5 s (apuntar a ≤ 2,2 s) en mobile 4G simulado |
| CLS | ≤ 0,05 |
| INP | ≤ 200 ms |
| TBT (lab, mobile) | ≤ 200 ms (**no** miles de ms) |
| Lighthouse mobile — Performance | ≥ 90 (home) · desktop ≥ 95 · Accesibilidad/Best Practices/SEO ≥ 95 |
| JS inicial (first load, gzip) | ≤ ~170 KB; GSAP core + ScrollTrigger + Lenis ≤ ~60 KB; **0 KB** de WebGL en carga inicial |
| Imágenes | ninguna > 300 KB a su tamaño entregado; Hero ≤ 180 KB c/u en mobile |
| Fuentes | ≤ 4 archivos, ≤ ~120 KB totales |
| ScrollTriggers vivos en home | ≤ ~60 (verlo con `?debug`); el resto con IntersectionObserver / `ScrollTrigger.batch` |

### 12.2 Estrategias
- Server Components por defecto; los *islands* de cliente son pequeños y por componente (no `'use client'` en `page.tsx`). Secciones animadas bajo el fold con `next/dynamic`.
- **Recortar imports de GSAP**: núcleo + ScrollTrigger en el bundle principal; `SplitText`, `Flip`, `Draggable`, `MotionPathPlugin`, `DrawSVGPlugin` con `import()` dinámico en las secciones que los usan. Three/OGL solo en tier 3.
- Callbacks de `gsap.ticker` en **O(1)**, sin lecturas de layout; sin `setState` por frame; usar refs, `quickTo`, `quickSetter`. Pausar tickers/marquees/skew/WebGL cuando la sección no está visible o la pestaña está oculta.
- `will-change`: añadirlo al **entrar** en la animación y quitarlo al salir (`onToggle`); nunca global; máximo ~8 capas promovidas simultáneas.
- `contain`/`content-visibility: auto` + `contain-intrinsic-size` solo en secciones largas **sin** ScrollTrigger (Todos, texto de Estudio). Nunca en pins.
- Evitar `filter: blur()` grandes, `box-shadow` animado, `backdrop-filter` en elementos que se mueven.
- Mobile: scroll nativo por defecto, parallax mínimo, sin grain, imágenes más chicas, sin cursor, sin WebGL.
- Cargar solo lo necesario: **preload únicamente del Hero** (imágenes + fuente display); el resto lazy; los proyectos no se cargan todos de golpe (imágenes de slides no activas con `loading="lazy"` y `fetchpriority="low"`).

### 12.3 Medición
Scripts `pnpm perf:lh` (Lighthouse CI mobile y desktop), perfil en Chrome con CPU 4× slowdown como proxy de un Android de gama media, medidor de FPS (`?debug`). Registrar resultados por fase en `DECISIONS.md`.

---

## 13. Deploy en Vercel

- Repo nuevo → importar en Vercel (preset Next.js). Node LTS. Variables en Production y Preview: `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`.
- Dominio propio **PENDIENTE**: mientras tanto `*.vercel.app` (`NEXT_PUBLIC_SITE_URL` debe coincidir con el dominio canónico real; si no está definido, derivar de las variables del sistema de Vercel).
- Previews con `X-Robots-Tag: noindex`. Producción indexable. Redirect `/proyectos → /projects`.
- Páginas estáticas (SSG); solo `/api/contact` es dinámico. `poweredByHeader: false`; headers de seguridad básicos (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, CSP razonable).
- Activar **Vercel Analytics** y **Speed Insights** (livianos, sin cookies) si el equipo lo aprueba.
- Imágenes: pre-optimizadas con el script y servidas con `next/image`; verificar cuotas de optimización del plan y documentar si se usa `unoptimized` para assets ya optimizados.
- ⚠️ **`CONFIRMAR` plan de Vercel**: el plan *Hobby* está pensado para uso personal/no comercial; un sitio que promociona servicios de un estudio es uso comercial, por lo que podría corresponder plan Pro (o evaluar Cloudflare Pages / Netlify). Verificar los términos vigentes antes de publicar.
- Checklist pre-lanzamiento: Lighthouse OK, QA (14), contenido auditado (sin datos inventados), OG probado (previsualizar en WhatsApp/LinkedIn/X), formulario probado en producción, `sitemap.xml` y `robots.txt` correctos, favicon, 404.

---

## 14. QA, Definition of Done y anti-patrones

### 14.1 Tests automatizados (Playwright + axe)
a) **Sin overflow horizontal**: `document.documentElement.scrollWidth <= innerWidth` en 320, 375, 768, 1024, 1440, 1920.
b) **Sin errores de consola**.
c) **Sin leaks de ScrollTrigger**: exponer el conteo en `?debug` (`window.__stCount`); navegar home → proyecto → home 5 veces; el conteo vuelve al valor base.
d) **Reduced motion** (`page.emulateMedia({ reducedMotion:'reduce' })`): contenido visible, `html[data-motion-tier="0"]`, **0** `.pin-spacer`, sin loader.
e) **Teclado**: Tab recorre links/botones/campos en orden, foco visible, no hay trampas, el menú mobile atrapa y devuelve el foco.
f) **axe**: 0 violaciones serias/críticas en home, proyecto, 404.
g) **Formulario**: validaciones, estados loading/success/error (mock de la API).
h) **Capturas por escena** en posiciones clave (inicio / medio / fin de cada pin) para detectar regresiones.
i) **Smoke mobile**: iPhone SE (375×667) y Pixel 7.
j) **Lighthouse CI** con los umbrales de 12.1.

### 14.2 Revisión manual
Las 10 verificaciones del brief original **más**: sincronía Lenis/ScrollTrigger sin saltos al inicio/fin de pins ni al redimensionar · recarga a mitad de página aterriza bien (`history.scrollRestoration = 'manual'` + refresh) · atrás/adelante conserva posición · la barra de URL de iOS Safari no rompe los pins (svh/dvh) · cargar fuentes no desplaza escenas · cambio de orientación · zoom 200 % · 320 px de ancho (el loader no se corta) · el contenido no depende de hover · sin textos ficticios · sin métricas inventadas (buscar números, `%`, “+”, “clientes”) · ningún texto de la lista de frases prohibidas · identidad Dos Orillas en cada escena · el logo no fue redibujado.

### 14.3 Definition of Done
1. Todas las escenas (8.0–8.13) implementadas con su variante mobile y reduced.
2. `docs/ANIMATIONS.md` completo (intención por animación).
3. Presupuestos de 12.1 cumplidos y registrados.
4. 0 violaciones axe serias/críticas; navegación completa por teclado.
5. Contenido 100 % real o placeholder claramente marcado; `docs/CONTENT_TODO.md` actualizado.
6. Agregar un proyecto = editar `data/projects.ts` + subir imágenes (documentado en `README.md`).
7. Subir imágenes con los nombres de 5.8 las prioriza automáticamente.
8. Deploy en Vercel funcionando (preview o producción) con formulario operativo.
9. Cero `any` innecesarios, sin código muerto, `lint` y `typecheck` limpios.

### 14.4 Anti-patrones (prohibido)
- Pin dentro de un ancestro con `transform`; `overflow: hidden` en `body`; `100vw` sin compensar; `100vh` en mobile.
- Capturar el wheel a mano; scroll-snap global; bloquear scroll durante animaciones de contenido.
- Dos sistemas animando la misma propiedad del mismo elemento (GSAP + CSS scroll-driven, GSAP + Motion).
- `ScrollTrigger.create` fuera de `gsap.context`/`matchMedia`; no hacer `revert` en el cleanup.
- `setState` de React a 60 fps; lecturas de layout (`getBoundingClientRect`) dentro de `onUpdate`/ticker sin cachear.
- Animar `width/height/top/left/box-shadow`; `will-change` global; muchas capas promovidas.
- Ocultar contenido con `display:none` para “revelarlo”; texto que existe solo después de ejecutar JS.
- Animar letra por letra en párrafos; bounce/elastic; parallax en *todo*; `skew` en texto.
- Gradientes violeta/azul de startup, neón, glassmorphism, sombras por todos lados, emojis como recurso, stock corporativo, robots, MacBook flotando, dashboards falsos, código cayendo, planeta 3D, partículas random.
- Buzzwords y frases vacías (1.4). Métricas, clientes, testimonios o años inventados.

---

## 15. Fases de ejecución

Al cerrar **cada** fase: `lint` + `typecheck` + `build`, capturas en 375/768/1024/1440/1920, Lighthouse mobile, actualizar `docs/*`, commit. Si una fase rompe un presupuesto o la accesibilidad, se corrige antes de avanzar.

| Fase | Contenido | Entregable / criterio de aceptación |
|---|---|---|
| **F0 · Base** | repo, Next + TS + Tailwind v4, fuentes, tokens y temas, grain, layout shell, `content/` y `data/` con los 5 proyectos, `<Media>` + placeholders + manifest, scripts de imágenes, `docs/` | `pnpm build` verde; home con secciones vacías semánticas; placeholders editoriales |
| **F1 · Motion core** | `lib/gsap.ts`, `SmoothScroll` (Lenis↔ST), tiers + `matchMedia`, tokens/easings, `RevealText`, `ImageReveal`, `ParallaxImage`, `Bridge`, `ThemeController`, modo `?debug`, reduced-motion, estrategia sin-FOUC | demo interna de cada recurso; sin leaks; sync perfecto |
| **F2 · Shell global** | `Nav`, `MobileMenu`, `ScrollProgress`/capítulos, `Cursor`, `Footer` cortina, `Preloader` | navegación completa por teclado; loader ≤ 1,5 s; 320 px OK |
| **F3 · Escenas insignia** | **Hero** y **La distancia** (desktop + mobile + reduced) | **checkpoint de revisión visual y Lighthouse**: aprobar el nivel de movimiento antes de seguir |
| **F4 · Narrativa** | Manifiesto, Soluciones (+ preview de cursor y acordeón), Proceso (horizontal + vertical) con la cadena Bridge | cadena de capítulos funcionando; contador sincronizado |
| **F5 · Proyectos** | Destacados (dolly), Todos (grilla asimétrica), `ProjectCard`, data-driven | agregar un 6.º proyecto de prueba no rompe nada (luego se elimina) |
| **F6 · Case studies** | `/projects/[slug]`, VT portada→caso (+ back y fallback), key visuals, siguiente proyecto | transición fluida en Chrome/Safari y fallback verificado |
| **F7 · Cierre de historia** | El estudio, Equipo, Herramientas, CTA, Contacto (+ API), 404 | formulario real operativo (o fallback `mailto`) |
| **F8 · Calidad** | SEO/JSON-LD/OG, pasada de accesibilidad, pasada de performance (tiers, presupuestos), auditoría de contenido | DoD 3, 4, 5 |
| **F9 · QA y deploy** | tests Playwright/axe/LHCI, deploy en Vercel (preview → producción), correcciones | DoD completo |
| **F10 · Extras (opcional)** | WebGL Nivel 3 del Hero y/o transición de imágenes, `/projects` con filtros Flip, reloj del footer, métricas de eventos | solo si F9 está verde y los presupuestos siguen cumplidos |

**Informe final de Codex**: qué se hizo · decisiones (`DECISIONS.md`) · límites conocidos · lista de `CONTENT_TODO` · cómo agregar un proyecto/imágenes · cómo deployar.

---

## 16. Extras propuestos y lista de assets

### 16.1 Qué se agregó respecto del brief original (para que lo conozcas y lo apruebes)
1. **Tiers de movimiento + autodegradación por FPS** y toggle “Reducir movimiento” del usuario (a11y y performance reales en mobile).
2. **Presupuestos de performance con umbrales medibles** (TBT, LCP, KB) y estrategia de imports dinámicos de GSAP.
3. **“La distancia” como escena tipográfica con línea de cota** (para no repetir el Hero) y **cadena de capítulos** (la línea de Soluciones → pista de Proceso → marco de Proyectos).
4. **Dolly en Z** para los proyectos destacados (capas reales) y **marco dibujado** de entrada.
5. **Marquees en sentidos opuestos** (las dos orillas) con una línea vertical fija (“el criterio”) en Herramientas.
6. **Footer-cortina** + wordmark que se revela; **reloj local** real de Concepción del Uruguay.
7. **Key visuals conceptuales** por proyecto (flujo de eventos, geo/cluster, ART1, estrella DW, flujo de compra) mientras no haya capturas.
8. **Filtros animados con Flip** en `/projects` (cuando haya muchos proyectos).
9. **404 temática**, **toast de copiar email**, **resumen de errores accesible** en el formulario.
10. **Pipeline de imágenes** (sharp → AVIF/WebP + LQIP) y **`<Media>` que prioriza automáticamente** los archivos reales.
11. **Estrategia sin-FOUC / progressive enhancement**, sincronización de foco en pins, `inert` en slides inactivas.
12. **Modo `?debug`** (markers, FPS, tier, conteo de triggers) y **tests anti-leak** de ScrollTrigger.
13. `docs/ANIMATIONS.md` (intención de cada animación) y `docs/CONTENT_TODO.md`.

### 16.2 Qué tiene que aportar el equipo (Codex deja placeholders hasta entonces)
- **Marca**: `logo.svg`, `logo-light.svg`, `mark.svg`.
- **Fotos**: Hero ×2 (orilla 1 y orilla 2) · Manifiesto ×1 vertical · Soluciones ×4 (opcional) · El estudio ×2–3 · Equipo ×2 (retratos) · por proyecto: `cover` + 2–4 de galería (capturas reales del sistema funcionando).
- **Textos por proyecto** (todo opcional, se omite si falta): año, problema, proceso, solución, resultado (**solo si es real**), links en vivo / GitHub.
- **Equipo**: bios cortas y confirmación de los `focus`.
- **Confirmaciones**: alcance geográfico y modalidad (presencial/remota), texto de privacidad, badge de contexto (“Caso de estudio” / “Proyecto académico”) y si se mencionan colaboradores de cursada.
- **Infra**: dominio, plan de Vercel, método de envío de mails (Resend/dominio verificado u otra opción), cuenta de Instagram enlazada.

### 16.3 Decisiones abiertas (con valor por defecto para no bloquear)
| Tema | Default si no hay respuesta |
|---|---|
| Label de contexto en proyectos | “Caso de estudio” |
| Años de los proyectos | no se muestran |
| WebGL (Nivel 3) | no se implementa hasta F10 |
| Reloj local en el footer | se implementa (es un dato real) |
| `availability` en el footer | oculto (`null`) |
| Envío de mails | Resend + fallback `mailto` |
| Analytics | Vercel Analytics + Speed Insights desactivados hasta aprobación |

---

## Kickoff (primer mensaje a Codex)
> Leé este documento completo. Empezá por **F0**. No pidas confirmación entre fases salvo bloqueo real; documentá decisiones en `docs/DECISIONS.md`. Al terminar **F3** detenete y mostrame capturas + resultados de Lighthouse mobile del Hero y de “La distancia” para aprobar el nivel de movimiento antes de continuar. Recordá en todo momento: **narrativa primero, nada inventado, todo con intención, y que funcione perfecto sin movimiento.**

**Principio rector**: cada sección responde *“¿por qué se mueve así?”*. Si no hay respuesta ligada a narrativa, jerarquía, interacción, conexión, dos orillas o descubrimiento, **no se anima**. El objetivo no es demostrar cuántas animaciones sabemos hacer: es construir una web que se recuerde y que, al terminarla, haga pensar *“estos chicos entienden de diseño, saben desarrollar, hay criterio detrás, y me gustaría mostrarles mi problema.”*