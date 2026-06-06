"""Square 'NKMA' icon for a Discord profile (1:1).
Layout: NK over MA (stacked, centered) to fill the square.
Perfect Action font, gold/red neon outline + soft glow, TRANSPARENT background."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter

PA = "../public/fonts/PerfectAction.ttf"
GOLD = (255, 56, 56, 255)
GLOW = (255, 56, 56)
STROKE = 9
CANVAS = 1024

scratch = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
def measure(txt, font):
    b = scratch.textbbox((0, 0), txt, font=font, stroke_width=STROKE)
    return b, b[2] - b[0], b[3] - b[1]
def fit(txt, tw, th, lo=40, hi=700):
    best = lo
    while lo <= hi:
        mid = (lo + hi) // 2
        _, w, h = measure(txt, ImageFont.truetype(PA, mid))
        if w <= tw and h <= th: best = mid; lo = mid + 1
        else: hi = mid - 1
    return best

PAD = int(CANVAS * 0.14)
inner = CANVAS - PAD * 2
row_h = inner // 2

size = min(fit("NK", inner, int(row_h * 0.92)),
           fit("MA", inner, int(row_h * 0.92)))
pa = ImageFont.truetype(PA, size)

nkb, nkw, nkh = measure("NK", pa)
mab, maw, mah = measure("MA", pa)
row_gap = int(size * 0.05)
total_h = nkh + row_gap + mah
y = (CANVAS - total_h) // 2

def layer(fill, sfill):
    img = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.text(((CANVAS - nkw) // 2 - nkb[0], y - nkb[1]), "NK", font=pa, fill=fill, stroke_width=STROKE, stroke_fill=sfill)
    d.text(((CANVAS - maw) // 2 - mab[0], y + nkh + row_gap - mab[1]), "MA", font=pa, fill=fill, stroke_width=STROKE, stroke_fill=sfill)
    return img

glow = layer(GLOW + (255,), GLOW + (255,))
gb = glow.filter(ImageFilter.GaussianBlur(40))
gs = glow.filter(ImageFilter.GaussianBlur(16))
main = layer((0, 0, 0, 0), GOLD)
blank = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
out = Image.alpha_composite(blank.copy(), Image.blend(blank, gb, 0.32))
out = Image.alpha_composite(out, Image.blend(blank, gs, 0.45))
out = Image.alpha_composite(out, main)
out.save("nkma-icon.png")
out.save("nkma-icon-stack.png")
print(f"saved nkma-icon.png (transparent NK/MA, 1024x1024)  letter size={size}")
