#!/usr/bin/env python3
"""Concatenate the NIGHTJAR sources into one self-contained HTML page.
Writes ../index.html (full document) and, if given, an artifact fragment path."""
import pathlib, sys
src = pathlib.Path(__file__).parent
css_order = ['base.css', 'screens.css', 'cif.css', 'orbital.css', 'cctv.css', 'aerial.css', 'sigint.css', 'bio.css', 'ops.css', 'netmap.css', 'archive.css']
js_order = ['core.js', 'geo.js', 'data.js', 'gfx.js', 'desktop.js', 'screens.js', 'cues.js',
            'apps/cif.js', 'apps/orbital.js', 'apps/cctv.js', 'apps/aerial.js', 'apps/sigint.js', 'apps/bio.js',
            'apps/ops.js', 'apps/netmap.js', 'apps/archive.js', 'main.js']
css = '\n'.join((src / 'css' / f).read_text() for f in css_order if (src / 'css' / f).exists())
js = '\n'.join((src / 'js' / f).read_text() for f in js_order if (src / 'js' / f).exists())
head = (src / 'head.html').read_text()
body = (src / 'body.html').read_text()
fragment = f"{head}<style>\n{css}\n</style>\n{body}<script>\n{js}\n</script>\n"
full = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">\n'
        f"{head}<style>\n{css}\n</style>\n</head>\n<body>\n{body}<script>\n{js}\n</script>\n</body>\n</html>\n")
(src.parent / 'index.html').write_text(full)
if len(sys.argv) > 1:
    pathlib.Path(sys.argv[1]).write_text(fragment)
print(f"index.html {len(full)/1024:.0f} KB")
