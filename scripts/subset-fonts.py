"""Regenerate the four local WOFF2 files without changing their type design.

Optional asset maintenance tool: python -m pip install "fonttools[woff]==4.66.1"
then python scripts/subset-fonts.py. Normal pnpm builds do not need Python.
Sources are the original Fontsource Latin files installed by pnpm.
"""

from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SOURCES = {
    "bricolage.woff2": "@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2",
    "geist.woff2": "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2",
    "geist-mono.woff2": "@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2",
    "instrument-serif-italic.woff2": "@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2",
}

# Keep all ASCII, every Spanish accented letter, and every character in the
# editable site copy/components. Keep the source's complete punctuation,
# combining-mark, currency and arrow coverage as well. This is a glyph subset,
# never a variable-font instance: all source axes/ranges and features remain.
characters = set(range(0x20, 0x7F)) | set(map(ord, "ÁÉÍÓÚÜÑáéíóúüñ¿¡"))
for directory in ("content", "components", "data", "app"):
    for extension in ("*.ts", "*.tsx"):
        for source in (ROOT / directory).rglob(extension):
            characters.update(map(ord, source.read_text(encoding="utf-8")))

for filename, relative_source in SOURCES.items():
    source = ROOT / "node_modules" / relative_source
    font = TTFont(source, recalcTimestamp=False)
    cmap = font.getBestCmap()
    keep = {value for value in cmap if value in characters or value >= 0x200}
    options = subset.Options()
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    options.name_legacy = True
    options.notdef_glyph = True
    options.notdef_outline = True
    options.recommended_glyphs = True
    options.glyph_names = True
    options.hinting = True
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=keep)
    subsetter.subset(font)
    font.flavor = "woff2"
    target = ROOT / "public" / "fonts" / filename
    font.save(target)
    print(f"{filename}: {source.stat().st_size:,} -> {target.stat().st_size:,} bytes")
