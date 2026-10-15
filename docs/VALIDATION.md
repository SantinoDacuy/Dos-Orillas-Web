# Validación de la entrega local

Revisión del 14/10/2026. La entrega solicitada es el proyecto fuente en ZIP; la web no se publicó. La funcionalidad está integrada y comprobada, pero el presupuesto móvil de rendimiento sigue pendiente: no se declara un PASS global del prompt. Los informes completos permanecen en el espacio de trabajo de QA y se excluyen del ZIP para no incluir cachés, navegadores y capturas voluminosas.

## Comprobaciones realizadas

- Home completa en 320, 375, 768, 1024, 1440 y 1920 px, movimiento reducido y sin JavaScript: aprobada, sin desbordamiento horizontal ni errores de consola. Menú móvil, retorno de foco y dos integrantes del equipo comprobados.
- Hero: 14 perfiles y 185 controles aprobados. La película de escritorio conserva 1924×1076, 24 fps; reproducción, pausa, cambio de visibilidad, posters y alternativa estática comprobados.
- Estilos narrativos: 6 escenarios y 53 controles aprobados, incluidos enlaces/hash antes de finalizar una descarga lenta y cancelación del reanclaje ante interacción real.
- Shell: 7 escenarios y 81 controles aprobados. Readiness: 3 escenarios y 43 controles aprobados, con CPU 4× y retraso de scripts de 4200 ms.
- Carrusel/grilla: 5 escenarios afectados de la versión integrada, 313 controles aprobados. La suite extensa y la prueba temporal de seis proyectos cubrieron 17 escenarios y 1096 controles; los cinco datos originales se restauraron byte a byte.
- Casos de proyectos: 4 escenarios de navegación, 171 controles aprobados; otros 4 escenarios afectados de tamaño, texto 200% y navegación repetida sumaron 395 controles aprobados.
- Contacto: 9 escenarios y 257 controles aprobados con API interceptada. Servidor: 16 casos y 5184 aserciones aprobadas con proveedor simulado. Estas pruebas no envían correos ni acreditan entrega real.
- Cierre editorial: 6 perfiles con/sin JavaScript a375/1024/1440, 48 comprobaciones y 12 capturas aprobadas; navegación por Equipo, teclado, CTA→Contacto y geometría comprobados.
- SEO servido: 187 controles aprobados. La ruta legal pendiente responde 404 con contenido y navegación útiles en los cuatro perfiles comprobados.
- Fuentes locales: 2299 comparaciones de contornos y 12 corpus de shaping conservaron el diseño, las métricas y los ejes. Los cuatro WOFF2 suman 92924 B.

Los nombres de informe y el historial de cambios se conservan en `DECISIONS.md`. Las comprobaciones específicas se repiten cuando cambia el comportamiento o su fuente; no se atribuyen resultados de un checkpoint anterior a una versión distinta.

## Alcance

Chrome instalado 154 se usa para interacción. Lighthouse 13.5.0 usa Chrome Headless Shell 156.0.8078.4 y conserva los perfiles y presupuestos del pedido. Las mediciones de rendimiento se ejecutan aisladas de builds y navegadores funcionales, sobre el mismo servidor de producción después de terminar la QA funcional y readiness.

Medición final de esta fuente:

- Escritorio: Performance99, accesibilidad100, buenas prácticas100 y SEO100; LCP945.774 ms, TBT75 ms y CLS0.0001085. Aprueba todos los límites de ese perfil.
- Móvil: Performance78, accesibilidad100, buenas prácticas100 y SEO100; LCP3815.5105 ms, TBT447.0015 ms y CLS0.0005071. Performance, LCP y TBT no aprueban los límites originales de90/2500ms/200ms; CLS y las demás auditorías sí.
- Ambos: JS inicial166474 B, cuatro fuentes92924 B. Poster móvil39406 B, escritorio112962 B; todas las imágenes iniciales quedan debajo de300000 B. Sin WebGL inicial. Aprueban esos presupuestos.

SEO excluye únicamente `is-crawlable`, porque la entrega local conserva noindex de forma deliberada. La medición no acredita indexación lista para publicar. No se cambiaron emulación, throttling, flags ni umbrales para conseguir una aprobación. Antes de publicar hay que resolver y volver a medir el rendimiento móvil; el ZIP entrega la aplicación completa con esta limitación documentada.

La aplicación funciona localmente sin hosting ni correo configurado. El envío real requiere las variables descritas en `.env.example`; mientras tanto conserva el email de contacto y nunca declara un envío exitoso. No se probaron dispositivos físicos, Safari en macOS, NVDA ni INP con tráfico real.
