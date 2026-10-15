# Publicación de Dos Orillas

La entrega actual, por indicación del usuario el 14/10/2026, es un ZIP local para abrir en su IDE. La publicación se hará más adelante. Esta guía conserva los pasos para ese momento; no acredita un despliegue ni contiene dominio o credenciales inventados.

## Cuenta y plan

El prompt pide confirmar el plan antes de publicar. La documentación y los términos de Vercel consultados el 13/10/2026 limitan Hobby a uso personal/no comercial; este sitio promociona servicios de un estudio. Elegir un plan compatible con ese uso antes de desplegar. No se inició una suscripción ni una prueba de pago.

- [Plan Hobby](https://vercel.com/docs/plans/hobby)
- [Términos de Vercel, sección Hobby](https://vercel.com/legal/terms)
- [Planes disponibles](https://vercel.com/docs/plans)

## Proyecto y preview

1. Importar `dos-orillas-web` como un proyecto nuevo, preset Next.js, gestor pnpm y Node 22.
2. Usar `pnpm build`; el script genera el manifest de imágenes y el CSS narrativo antes de compilar con webpack.
3. Configurar las variables desde el panel de Vercel. Nunca incorporarlas a Git o al ZIP fuente.
4. En Preview, mantener `SITE_INDEXING=preview` y `DEPLOYMENT_ENV=preview`.
5. Asignar a `NEXT_PUBLIC_SITE_URL` una URL HTTPS real, sin ruta adicional. Puede ser el dominio real `*.vercel.app` asignado por Vercel mientras no haya dominio propio.
6. Publicar el preview y comprobar home, índice, cinco casos, navegación de vuelta, tamaños móviles, teclado, movimiento reducido, 404 y formulario.

Las variables son específicas por entorno y los cambios requieren un nuevo despliegue. Referencias: [entornos](https://vercel.com/docs/deployments/environments) y [variables](https://vercel.com/docs/environment-variables).

## Correo

Configurar `RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL` para el entorno correspondiente. El destinatario previsto es `dosorillasestudio@gmail.com`; el remitente debe pertenecer a un dominio verificado en Resend.

Sin remitente/clave configurados, `/api/contact` responde que el envío no está disponible y el formulario conserva los campos y el enlace al email. Los tests con mocks no acreditan entrega real: comprobarla desde el preview con una dirección autorizada antes de anunciar el formulario como operativo.

Dejar `CONTACT_IP_HEADER` vacío hasta comprobar que el proveedor sobrescribe de forma confiable el encabezado elegido. El límite en memoria es local a cada instancia y puede reiniciarse; si se necesita un límite compartido entre instancias, agregar un almacén distribuido como mejora de infraestructura.

## Producción

1. Confirmar la URL canónica final y el envío de correo.
2. En Production, configurar `SITE_INDEXING=production`, `DEPLOYMENT_ENV=production` y la URL real en `NEXT_PUBLIC_SITE_URL`.
3. Desplegar nuevamente. La configuración exige URL válida, runtime de producción y ausencia de un entorno preview para permitir indexación.
4. Comprobar que `/robots.txt`, `/sitemap.xml`, los canonical y las imágenes Open Graph usan el dominio final; el sitemap debe contener home, índice y los cinco casos.
5. Repetir Lighthouse aislado sobre la URL pública y probar el correo real.

Analytics y Speed Insights permanecen desactivados hasta la aprobación prevista en el prompt. La política de privacidad se publica sólo después de aprobar su texto; el borrador no forma parte de las rutas públicas.
