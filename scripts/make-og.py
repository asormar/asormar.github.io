"""Generates assets/og.png — the 1200x630 card shown when the site is shared
on LinkedIn, WhatsApp, Slack or X.

Regenerate after changing the name, education lines or tech list:

    python scripts/make-og.py

Fonts fall back to whatever the platform has; on Windows it uses Segoe UI and
Consolas, which sit close enough to Archivo and DM Mono at this size.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
PAPER = (248, 248, 249)
INK = (28, 28, 30)
INK_2 = (108, 110, 116)
INK_3 = (150, 152, 158)
MARK = (192, 39, 24)
RULE = (223, 224, 227)

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "og.png"

FONT_DIRS = [Path("C:/Windows/Fonts"), Path("/usr/share/fonts"), Path("/Library/Fonts")]


def font(names, size):
    for name in names:
        for directory in FONT_DIRS:
            candidate = directory / name
            if candidate.exists():
                return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


bold = font(["segoeuib.ttf", "DejaVuSans-Bold.ttf", "Arial Bold.ttf"], 66)
mono = font(["consola.ttf", "DejaVuSansMono.ttf", "Menlo.ttc"], 25)
mono_sm = font(["consola.ttf", "DejaVuSansMono.ttf", "Menlo.ttc"], 21)

img = Image.new("RGB", (W, H), PAPER)
d = ImageDraw.Draw(img)

PAD = 84

# Top rule, matching the site's masthead border
d.rectangle([PAD, 78, W - PAD, 81], fill=INK)

d.text((PAD, 132), "Alejandro Sorolla", font=bold, fill=INK)
d.text((PAD, 206), "Martínez", font=bold, fill=INK)

d.text((PAD, 316), "Máster en Tecnologías Audiovisuales, UPV", font=mono, fill=INK_2)
d.text((PAD, 354), "Grado en Tecnología Digital y Multimedia, UPV", font=mono, fill=INK_2)
d.text((PAD, 392), "Valencia", font=mono, fill=INK_3)

# Accent rule
d.rectangle([PAD, 452, PAD + 108, 455], fill=MARK)

# Tech chips, laid out on one row
chips = ["Python", "C++17", "JavaScript", "LightGBM", "OpenCV", "Puppeteer"]
x = PAD
y = 492
for label in chips:
    box = d.textbbox((0, 0), label, font=mono_sm)
    w = box[2] - box[0]
    d.rectangle([x, y, x + w + 30, y + 46], outline=RULE, width=2)
    d.text((x + 15, y + 12), label, font=mono_sm, fill=INK_2)
    x += w + 30 + 10

d.text((PAD, H - 74), "asormar.github.io", font=mono_sm, fill=MARK)

OUT.parent.mkdir(parents=True, exist_ok=True)
img.save(OUT, "PNG", optimize=True)
print(f"{OUT.relative_to(ROOT)} — {OUT.stat().st_size // 1024} KB")

# --- apple-touch-icon (180x180) ---
ICON = ROOT / "assets" / "apple-touch-icon.png"
icon = Image.new("RGB", (180, 180), PAPER)
di = ImageDraw.Draw(icon)
di.rectangle([28, 28, 152, 40], fill=INK)
di.text((28, 76), "as", font=font(["consolab.ttf", "DejaVuSansMono-Bold.ttf"], 62), fill=INK)
di.rectangle([28, 142, 78, 154], fill=MARK)
icon.save(ICON, "PNG", optimize=True)
print(f"{ICON.relative_to(ROOT)} — {ICON.stat().st_size // 1024} KB")
