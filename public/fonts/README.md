Fuentes autohospedadas provenientes de paquetes oficiales Fontsource (SIL Open Font License). Los cuatro WOFF2 suman 92.924 bytes. El subset conserva ASCII completo, ñ, vocales acentuadas, diéresis, signos del español y los signos, marcas combinantes, monedas y flechas del Latin original. La regeneración incorpora los caracteres de `content/`, `components/`, `data/` y `app/`. Otros caracteres usan las familias de fallback declaradas en CSS.

Se mantienen el diseño, hinting, kerning, ligaduras y ejes variables: Bricolage wght 200–800; Geist y Geist Mono wght 100–900. Instrument Serif es la variante italic 400 original. No se animan ejes tipográficos durante scroll. Los textos de licencia y nombres internos permanecen sin cambios.

Los archivos ya están listos para `pnpm dev` y `pnpm build`. La regeneración es opcional: instalar `fonttools[woff]==4.66.1` en Python y ejecutar `python scripts/subset-fonts.py` después de `pnpm install`. El script parte siempre de los originales Fontsource de `node_modules`; actualizarlo o regenerar el subset si se agrega texto en otros idiomas.

- Bricolage Grotesque — https://github.com/ateliertriay/bricolage
- Geist / Geist Mono — https://github.com/vercel/geist-font
- Instrument Serif — https://github.com/Instrument/instrument-serif
