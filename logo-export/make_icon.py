"""Square 'NKMA' icon styled like the REGISTER button:
solid pink/red background (#d4263b) with bold black text (#0a0406).
'NKMA' in Perfect Action, stacked NK / MA. Strokes thickened via dilation."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter

PA = "../public/fonts/PerfectAction.ttf"
PINK = (212, 38, 59)
INK = (10, 4, 6)
CANVAS = 1024
DILATE = 5          # stroke-thickening passes (higher = bolder)

scratch = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
def measure(txt, font):
    b = scratch.textbbox((0, 0), txt, font=font)
    return b, b[2] - b[0], b[3] - b[1]
def fit(txt, tw, th, lo=40, hi=800):
    best = lo
    while lo <= hi:
        mid = (lo + hi) // 2
        _, w, h = measure(txt, ImageFont.truetype(PA, mid))
        if w <= tw and h <= th: best = mid; lo = mid + 1
        else: hi = mid - 1
    return best

PAD = int(CANVAS * 0.17)
inner = CANVAS - PAD * 2
row_h = inner // 2
size = min(fit("NK", inner, int(row_h * 0.9)),
           fit("MA", inner, int(row_h * 0.9)))
pa = ImageFont.truetype(PA, size)

nkb, nkw, nkh = measure("NK", pa)
mab, maw, mah = measure("MA", pa)
row_gap = int(size * 0.04)
total_h = nkh + row_gap + mah
y = (CANVAS - total_h) // 2

# Draw text as a black mask, then dilate (MaxFilter) to thicken strokes.
mask = Image.new("L", (CANVAS, CANVAS), 0)
md = ImageDraw.Draw(mask)
md.text(((CANVAS - nkw) // 2 - nkb[0], y - nkb[1]), "NK", font=pa, fill=255)
md.text(((CANVAS - maw) // 2 - mab[0], y + nkh + row_gap - mab[1]), "MA", font=pa, fill=255)
for _ in range(DILATE):
    mask = mask.filter(ImageFilter.MaxFilter(3))   # grow black strokes by 1px each pass

img = Image.new("RGB", (CANVAS, CANVAS), PINK)
ink = Image.new("RGB", (CANVAS, CANVAS), INK)
img = Image.composite(ink, img, mask)

img.save("nkma-icon.png")
print(f"saved nkma-icon.png (bold NKMA)  size={size}, dilate={DILATE}")
