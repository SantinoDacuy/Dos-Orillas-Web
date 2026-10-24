Fuentes autohospedadas provenientes de paquetes oficiales Fontsource (SIL Open Font License).

- Archivo (variable, ejes wght 100-900 y wdth 62-125): titulares. El eje de ancho permite títulos expandidos y subtítulos normales dentro de una sola familia.
- Geist (variable, wght 100-900): texto corrido, botones y UI.
- Geist Mono (variable, wght 100-900): datos y etiquetas técnicas.

Los archivos conservan diseño, hinting, kerning, ligaduras y ejes originales; no se animan ejes durante el scroll. Equipo usa Anton e Inter desde Google Fonts con estilos en línea (intocable).

La regeneración del subset es opcional: instalar `fonttools[woff]==4.66.1` en Python y ejecutar `python scripts/subset-fonts.py` después de `pnpm install`.

- Archivo — https://github.com/Omnibus-Type/Archivo
- Geist / Geist Mono — https://github.com/vercel/geist-font
