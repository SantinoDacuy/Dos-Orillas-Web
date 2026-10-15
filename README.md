# Dos Orillas Estudio

> **Soluciones digitales pensadas desde el problema, no desde la herramienta.**  
> Concepción del Uruguay · Entre Ríos, Argentina.

Sitio web oficial de **Dos Orillas Estudio**, desarrollado con arquitectura moderna sobre **Next.js 16 (App Router)**, **React 19**, **TypeScript estricto**, **GSAP**, **Framer Motion** y **Lenis**.

---

## 🌊 Filosofía & Manifiesto

> *"No hacemos tecnología porque sí. La hacemos cuando puede mejorar algo.  
> Hacemos que la tecnología se adapte al negocio, no al revés."*

Dos Orillas es un estudio de soluciones digitales que ayuda a comercios, empresas y organizaciones a transformar y optimizar sus procesos mediante software a medida, automatizaciones, plataformas web y análisis de datos.

---

## ✨ Características y Experiencia Visual

- **Hero Cinematográfico**: Video Full HD en bucle con poster optimizado SSR para máxima velocidad de carga (LCP), tipografía de marca oficial y navegación en cápsula flotante con efecto *glassmorphism*.
- **Escena «La Distancia»**: Metáfora interactiva de las dos orillas conectadas por un puente tecnológico láser cian con pulsos de energía, métricas de orilla y tarjetas de fases de trabajo (*01 Diagnóstico*, *02 Estrategia*, *03 Construcción*).
- **Manifiesto con Fondo Dinámico Full-Bleed**: Fondo atmosférico reactivo de pantalla completa impulsado por un carrusel *filmstrip* interactivo con desplazamiento manual (*drag* y clic) y efectos de scroll en texto (*reveal* y tachado dinámico).
- **Catálogo de Proyectos & Casos de Estudio**: Navegación por proyectos reales con fichas detalladas por capítulos (desafío, arquitectura, impacto y métricas).
- **Motion System de Tres Niveles**: Integración armónica de GSAP ScrollTrigger y Framer Motion con soporte completo para modo de movimiento reducido (`prefers-reduced-motion`).
- **Sistema de Temas Dinámico**: Paleta de colores curada con tema principal azul marino profundo (`navy-deep` `#071725`), detalles en cian neón (`#38bdf8`), marfil (`#F2EEE6`) y contrastes armónicos.
- **Tipografía Oficial Integrada**: Tipografías Bricolage Grotesque, Geist y Instrument Serif servidas localmente en formato WOFF2 para cero dependencias externas y privacidad total.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Components) |
| **Librería UI** | [React 19](https://react.dev/) |
| **Lenguaje** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) |
| **Animaciones & Scroll** | [GSAP](https://greensock.com/gsap/) (ScrollTrigger), [Framer Motion](https://www.framer.com/motion/), [Lenis](https://github.com/darkroomengineering/lenis) |
| **Estilos & Diseño** | Vanilla CSS modular, Design Tokens, Tailwind CSS v4 |
| **Testing & Calidad** | [Playwright](https://playwright.dev/) (E2E & Accessibility con Axe Core), ESLint 9 |
| **Package Manager** | [pnpm](https://pnpm.io/) |

---

## 🚀 Inicio Rápido

### Requisitos Previos

- **Node.js**: `>= 22.14.0` (LTS recomendado)
- **pnpm**: `>= 11.25.0` (Instalar con `npm install --global pnpm@11.25.0` si no lo tenés)

### Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/SantinoDacuy/Dos-Orillas-Web.git
   cd Dos-Orillas-Web
   ```

2. Instalar dependencias:
   ```bash
   pnpm install
   ```

3. Variables de entorno (opcional):
   ```bash
   cp .env.example .env.local
   ```

4. Iniciar el servidor de desarrollo:
   ```bash
   pnpm dev
   ```
   Abrí [http://127.0.0.1:3000](http://127.0.0.1:3000) en tu navegador.

---

## 📦 Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `pnpm dev` | Inicia el servidor de desarrollo local en el puerto 3000 |
| `pnpm build` | Compila el bundle de producción optimizado |
| `pnpm start` | Inicia el servidor con la versión compilada de producción |
| `pnpm lint` | Ejecuta ESLint para validar sintaxis y buenas prácticas |
| `pnpm typecheck` | Comprueba tipos en todo el proyecto con TypeScript (`tsc --noEmit`) |
| `pnpm test:e2e` | Ejecuta las pruebas automatizadas de integración con Playwright |
| `pnpm perf:lh` | Auditoría de rendimiento y accesibilidad con Lighthouse |

---

## 📂 Estructura del Proyecto

```
dos-orillas-web/
├── app/                  # Rutas y páginas de Next.js App Router
│   ├── layout.tsx        # Shell global, fuentes y preloads
│   ├── page.tsx          # Home page con las secciones narrativas
│   └── projects/         # Página y casos de estudio de proyectos
├── components/           # Componentes reutilizables
│   ├── layout/           # Navbar cápsula, footer, logo oficial
│   ├── sections/         # Hero, Distancia, Manifiesto, Proceso, etc.
│   └── ui/               # Primitivas UI (HeroCarousel, Media, etc.)
├── content/              # Copys, textos editoriales y configuración de marca
├── data/                 # Datos estructurados de proyectos y casos
├── docs/                 # Documentación técnica y registro de decisiones
├── lib/                  # Utilidades, configuración GSAP y helpers
├── public/               # Assets estáticos (logos SVG, videos, imágenes, fuentes)
│   ├── brand/            # Isologotipos oficiales de Dos Orillas
│   ├── fonts/            # Archivos WOFF2 locales optimizados
│   ├── images/           # Fotografías y texturas
│   ├── projects/         # Material gráfico de casos de estudio
│   └── visuals/          # Video cinematográfico Full HD y posters
└── styles/               # Hojas de estilo modulares y tokens de diseño
```

---

## 🔒 Privacidad y Rendimiento

- **Cero Fuentes Externas**: Ningún recurso depende de CDNs externas de terceros (Google Fonts, etc.), garantizando cumplimiento de privacidad y tiempos de carga instantáneos.
- **Degradación Elegante**: Toda la narrativa y el contenido son 100% legibles y accesibles aún con JavaScript deshabilitado o en dispositivos con bajo rendimiento.

---

## 📬 Contacto

- **Estudio**: Dos Orillas Estudio
- **Ubicación**: Concepción del Uruguay, Entre Ríos, Argentina
- **Email**: [dosorillasestudio@gmail.com](mailto:dosorillasestudio@gmail.com)
- **Web**: [http://127.0.0.1:3000](http://127.0.0.1:3000)
