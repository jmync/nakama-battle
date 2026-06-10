"""Recolor + sharpen the banner, shift up, and add a soft red glow edge
around the photo content band."""
from PIL import Image, ImageFilter, ImageDraw, ImageEnhance
import colorsys

SRC = "image.jpg"
TARGET_H = colorsys.rgb_to_hls(212/255, 38/255, 59/255)[0]   # #d4263b hue
DARK = (20, 10, 14)        # site --bg #140a0e
RED = (212, 38, 59)
SHIFT_FRAC = 0.14

src = Image.open(SRC).convert("RGB")
W, H = src.size
px = src.load()
img = Image.new("RGB", (W, H))
op = img.load()

# --- recolor: magenta->red-pink, blue->dark ---
for y in range(H):
    for x in range(W):
        r, g, b = px[x, y]
        h, l, s = colorsys.rgb_to_hls(r/255, g/255, b/255)
        hd = h * 360
        if s > 0.12 and l > 0.06:
            if hd >= 250 or hd <= 25:
                h = TARGET_H
            elif 180 <= hd < 270:
                s = 0.0; l = min(l, 0.05)
        nr, ng, nb = colorsys.hls_to_rgb(h, l, s)
        op[x, y] = (int(nr*255), int(ng*255), int(nb*255))

# --- clarity: unsharp mask + slight contrast ---
img = img.filter(ImageFilter.UnsharpMask(radius=2.2, percent=140, threshold=2))
img = ImageEnhance.Contrast(img).enhance(1.08)
img = ImageEnhance.Sharpness(img).enhance(1.25)

# --- find the photo content band (rows that aren't basically black) ---
gray = img.convert("L")
gp = gray.load()
rows = []
for y in range(H):
    bright = sum(gp[x, y] for x in range(0, W, 8))
    rows.append(bright)
thr = max(rows) * 0.06
ys = [y for y, v in enumerate(rows) if v > thr]
top, bot = (min(ys), max(ys)) if ys else (0, H)

# --- shift up ---
shift = int(H * SHIFT_FRAC)
canvas = Image.new("RGB", (W, H), DARK)
canvas.paste(img, (0, -shift))
img = canvas
top -= shift; bot -= shift

# --- soft red glow edge around the content band ---
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
inset = 10
gd.rectangle([inset, max(0, top - 6), W - inset, min(H, bot + 6)],
             outline=RED + (255,), width=6)
glow = glow.filter(ImageFilter.GaussianBlur(7))
out = img.convert("RGBA")
out = Image.alpha_composite(out, glow)
# crisp thin red line on top of the glow
ld = ImageDraw.Draw(out)
ld.rectangle([inset, max(0, top - 6), W - inset, min(H, bot + 6)],
             outline=RED + (255,), width=2)

out.convert("RGB").save("image-recolored.png")
print(f"saved image-recolored.png  band y={top}..{bot}, shift={shift}")
