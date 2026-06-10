"""Wide '#NKMA' logo styled like nkma-icon: red-pink background (#d4263b),
bold dark text (#0a0406). NKMA in Perfect Action, # in a bold fallback.
Strokes thickened via dilation."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter

PA_FONT = "../public/fonts/PerfectAction.ttf"
PINK = (212, 38, 59)      # #d4263b
INK = (10, 4, 6)          # #0a0406
SIZE = 320
PAD = 130
GAP = 30
DILATE = 5

pa = ImageFont.truetype(PA_FONT, SIZE)
hash_font = None
for f in ("ariblk.ttf", "arialbd.ttf", "impact.ttf", "segoeuib.ttf"):
    try:
        hash_font = ImageFont.truetype("C:/Windows/Fonts/" + f, int(SIZE * 0.82)); break
    except OSError:
        continue
if hash_font is None:
    hash_font = ImageFont.truetype(PA_FONT, SIZE)

scratch = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
def measure(txt, font):
    b = scratch.textbbox((0, 0), txt, font=font)
    return b, b[2] - b[0], b[3] - b[1]

hb, hw, hh = measure("#", hash_font)
nb, nw, nh = measure("NKMA", pa)
content_w = hw + GAP + nw
content_h = max(hh, nh)
W = content_w + PAD * 2
H = content_h + PAD * 2

hx = PAD - hb[0]
hy = PAD - hb[1] + (content_h - hh) // 2
nx = PAD + hw + GAP - nb[0]
ny = PAD - nb[1] + (content_h - nh) // 2

# draw text as a mask, then dilate to fatten the thin Perfect Action strokes
mask = Image.new("L", (W, H), 0)
md = ImageDraw.Draw(mask)
md.text((hx, hy), "#", font=hash_font, fill=255)
md.text((nx, ny), "NKMA", font=pa, fill=255)
for _ in range(DILATE):
    mask = mask.filter(ImageFilter.MaxFilter(3))

img = Image.new("RGB", (W, H), PINK)
ink = Image.new("RGB", (W, H), INK)
img = Image.composite(ink, img, mask)
img.save("nkma-logo.png")
print(f"saved nkma-logo.png  ({W}x{H})  pink bg, bold dark text")
