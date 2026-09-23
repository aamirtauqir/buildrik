"""Regenerates the Clone Phase-1 raster fixtures. Distinct colours per file so a
wrong src on the canvas is visible at a glance. Sizes match what the prototype's
details rail prints (hero 2400x1600, menu-cover 1600x1000)."""
from pathlib import Path
from PIL import Image, ImageDraw

HERE = Path(__file__).parent
FILES = {
    "hero-dark.jpg":      ((2400, 1600), (24, 28, 36)),
    "menu-cover.png":     ((1600, 1000), (222, 184, 135)),
    "team-photo.jpg":     ((1800, 1200), (70, 130, 180)),
    "pasta-closeup.jpg":  ((1200, 1200), (205, 92, 92)),
    "terrace-night.jpg":  ((2000, 1125), (25, 25, 112)),
}
for name, (size, rgb) in FILES.items():
    im = Image.new("RGB", size, rgb)
    d = ImageDraw.Draw(im)
    d.text((40, 40), name, fill=(255, 255, 255))
    if name.endswith(".jpg"):
        im.save(HERE / name, quality=60, optimize=True)
    else:
        im.save(HERE / name, optimize=True)
    print(name, size, (HERE / name).stat().st_size, "bytes")
