# Abrir el proyecto en tu IDE

1. Descomprimí el ZIP y abrí la carpeta `dos-orillas-web` en tu IDE.
2. El proyecto está probado con Node.js 22.14 y pnpm 11.25.0. Si necesitás pnpm, ejecutá `npm install --global pnpm@11.25.0`.
3. Abrí una terminal dentro de esa carpeta y ejecutá:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

4. Abrí **http://127.0.0.1:3000**. Para detener el servidor, usá **Ctrl+C**.

Para revisar la compilación de producción:

```sh
pnpm lint
pnpm typecheck
pnpm build
pnpm start
```

## Qué contiene el ZIP

Incluye todo el código de la aplicación, las doce secciones de la home, el índice y los cinco casos de proyectos, el formulario/API, SEO, estilos, animaciones, videos de escritorio y móvil, posters, logos oficiales, fuentes locales, scripts, documentación y el lockfile de dependencias.

Las dependencias se instalan desde `pnpm-lock.yaml`; `node_modules` y las compilaciones/cachés se regeneran en tu computadora. El ZIP no incluye credenciales, archivos temporales ni informes de prueba voluminosos. El resumen de las pruebas está en `docs/VALIDATION.md` y el historial técnico en `docs/DECISIONS.md`.

## Configuración y contenido

Podés desarrollar sin configurar correo ni hosting. Si querés probar un proveedor de envío, copiá `.env.example` a `.env.local` y completá las variables necesarias. Sin esa configuración, el formulario conserva la alternativa de escribir a `dosorillasestudio@gmail.com` y no informa un envío exitoso.

- Texto e identidad: `content/`.
- Proyectos: `data/projects.ts`.
- Imágenes, videos, logos y fuentes: `public/`.
- Estilos: `styles/`.
- Secciones y componentes: `components/`.
- Contenido opcional que todavía no se aportó: `docs/CONTENT_TODO.md`.

Las capturas y fotos faltantes se omiten o se representan mediante esquemas identificados como conceptuales. No hace falta completarlas para abrir la aplicación. La web se entrega local y no fue publicada.

La funcionalidad y la compilación están comprobadas. Queda pendiente el objetivo de rendimiento móvil del prompt: la última medición fue78, frente a99 en escritorio. Los valores y límites completos están en `docs/VALIDATION.md`; no se presenta esta entrega como una aprobación global de todos los gates para publicar.
