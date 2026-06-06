"""Square '#NKMA' icon for a Discord profile (1:1).
Layout: NK over MA (stacked, centered), with '#' on the LEFT, vertically
centered between the two rows. 'NKMA' in Perfect Action; '#' in a clean
fallback font (demo Perfect Action watermarks its #).
Gold/red neon outline + glow, transparent background."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter

PA = "../public/fonts/PerfectAction.ttf"
GOLD = (255, 56, 56, 255)
GLOW = (255, 56, 56)
STROKE = 9
CANVAS = 1024

HASH_FONT_PATH = None
for f in ("ariblk.ttf", "arialbd.ttf", "impact.ttf", "segoeuib.ttf"):
    try:
        ImageFont.truetype("C:/Windows/Fonts/" + f, 100); HASH_FONT_PATH = "C:/Windows/Fonts/" + f; break
    except OSError:
        continue

scratch = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
def measure(txt, font):
    b = scratch.textbbox((0, 0), txt, font=font, stroke_width=STROKE)
    return b, b[2] - b[0], b[3] - b[1]
def fit(txt, fp, tw, th, lo=40, hi=700):
    best = lo
    while lo <= hi:
        mid = (lo + hi) // 2
        _, w, h = measure(txt, ImageFont.truetype(fp, mid))
        if w <= tw and h <= th: best = mid; lo = mid + 1
        else: hi = mid - 1
    return best

PAD = int(CANVAS * 0.12)
inner = CANVAS - PAD * 2

# The '#' sits on the left and takes some width; reserve ~30% for it.
hash_w_budget = int(inner * 0.30)
stack_w_budget = inner - hash_w_budget
row_h = inner // 2

size = min(fit("NK", PA, stack_w_budget, row_h * 0.92),
           fit("MA", PA, stack_w_budget, row_h * 0.92))
pa = ImageFont.truetype(PA, size)
hashf = ImageFont.truetype(HASH_FONT_PATH, int(size * 1.15))  # # a bit taller

nkb, nkw, nkh = measure("NK", pa)
mab, maw, mah = measure("MA", pa)
hb, hw, hh = measure("#", hashf)

row_gap = int(size * 0.05)
stack_w = max(nkw, maw)
stack_h = nkh + row_gap + mah
gap_hash = int(size * 0.10)
group_w = hw + gap_hash + stack_w

# center the whole (# + stack) group in the canvas
gx = (CANVAS - group_w) // 2
gy = (CANVAS - stack_h) // 2

# '#' vertically centered against the stack height
hx = gx - hb[0]
hy = gy + (stack_h - hh) // 2 - hb[1]

stack_x = gx + hw + gap_hash
nkx = stack_x + (stack_w - nkw) // 2 - nkb[0]
nky = gy - nkb[1]
max_ = stack_x + (stack_w - maw) // 2 - mab[0]
may = gy + nkh + row_gap - mab[1]

def layer(fill, sfill):
    img = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.text((hx, hy), "#", font=hashf, fill=fill, stroke_width=STROKE, stroke_fill=sfill)
    d.text((nkx, nky), "NK", font=pa, fill=fill, stroke_width=STROKE, stroke_fill=sfill)
    d.text((max_, may), "MA", font=pa, fill=fill, stroke_width=STROKE, stroke_fill=sfill)
    return img

glow = layer(GLOW + (255,), GLOW + (255,))
gb = glow.filter(ImageFilter.GaussianBlur(40))
gs = glow.filter(ImageFilter.GaussianBlur(16))
main = layer((0, 0, 0, 0), GOLD)
blank = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
out = Image.new("RGBA", (CANVAS, CANVAS), (10, 6, 8, 255))  # solid near-black bg (--ink)
out = Image.alpha_composite(out, Image.blend(blank, gb, 0.45))
out = Image.alpha_composite(out, Image.blend(blank, gs, 0.55))
out = Image.alpha_composite(out, main)
out.convert("RGB").save("nkma-icon.png")
print(f"saved nkma-icon.png (1024x1024, black bg)  letter size={size}")
