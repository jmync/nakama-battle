"""Panda mascot PFP, clean B&W style (red-accent on dark site bg).
Red ears/outline/eye-patches/nose, white face. Square 1024x1024."""
from PIL import Image, ImageDraw, ImageFilter

CANVAS = 1024
BG = (20, 10, 14, 255)        # --bg #140a0e
RED = (255, 45, 45, 255)
WHITE = (250, 245, 245, 255)

S = 3
W = CANVAS * S
img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# 0..120 design space, centered
scale = W / 124.0
ox = (W - 120 * scale) / 2
oy = (W - 120 * scale) / 2
def bb(cx, cy, rx, ry): return [ (ox+(cx-rx)*scale, oy+(cy-ry)*scale), (ox+(cx+rx)*scale, oy+(cy+ry)*scale) ]
def ell(cx, cy, rx, ry, fill): d.ellipse(bb(cx, cy, rx, ry), fill=fill)
def rell(cx, cy, rx, ry, deg, fill):
    tmp = Image.new("RGBA", (W, W), (0,0,0,0)); ImageDraw.Draw(tmp).ellipse(bb(cx,cy,rx,ry), fill=fill)
    img.alpha_composite(tmp.rotate(deg, center=(ox+cx*scale, oy+cy*scale), resample=Image.BICUBIC))

# --- RED base (ears + head) = the outline color ---
ell(33, 33, 16, 16, RED)     # left ear
ell(87, 33, 16, 16, RED)     # right ear
ell(60, 62, 41, 39, RED)     # head (red, acts as outline)

# --- WHITE face inset (slightly smaller, leaving a red rim = outline) ---
ell(33, 34, 11, 11, WHITE)   # left inner ear
ell(87, 34, 11, 11, WHITE)   # right inner ear
ell(60, 63, 34.5, 32.5, WHITE)  # white face

# --- RED eye-patches (angled almonds) ---
rell(45, 60, 11, 15, 22, RED)
rell(75, 60, 11, 15, -22, RED)
# white eye highlights
ell(46, 58, 3.4, 3.4, WHITE)
ell(74, 58, 3.4, 3.4, WHITE)

# --- nose + tiny mouth ---
ell(60, 76, 5.2, 4.0, RED)
ell(60, 83, 3.0, 2.4, RED)   # small mouth dot

img = img.resize((CANVAS, CANVAS), Image.LANCZOS)

# soft red glow from silhouette
a = img.split()[3]
red_layer = Image.new("RGBA", (CANVAS, CANVAS), (255,45,45,0)); red_layer.putalpha(a)
glow = red_layer.filter(ImageFilter.GaussianBlur(22))

out = Image.new("RGBA", (CANVAS, CANVAS), BG)
blank = Image.new("RGBA", (CANVAS, CANVAS), (0,0,0,0))
out = Image.alpha_composite(out, Image.blend(blank, glow, 0.45))
out = Image.alpha_composite(out, img)
out.convert("RGB").save("nkma-panda.png")
print("saved nkma-panda.png (1024x1024)")
