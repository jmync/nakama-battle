"""Render a #NKMA logo. 'NKMA' uses the Perfect Action font (CHORUS BATTLE font);
the '#' uses a clean bold fallback (the demo font watermarks its # glyph).
Gold/red outline + soft red glow on a transparent background."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter

PA_FONT = "../public/fonts/PerfectAction.ttf"
SIZE = 320
GOLD = (255, 56, 56, 255)
GLOW = (255, 56, 56)
STROKE = 9
PAD = 130
GAP = 24  # space between # and NKMA

pa = ImageFont.truetype(PA_FONT, SIZE)
# Fallback bold font for the '#'. Try a few common Windows fonts.
hash_font = None
for f in ("ariblk.ttf", "arialbd.ttf", "impact.ttf", "segoeuib.ttf"):
    try:
        hash_font = ImageFont.truetype("C:/Windows/Fonts/" + f, int(SIZE * 0.82))
        break
    except OSError:
        continue
if hash_font is None:
    hash_font = ImageFont.truetype(PA_FONT, SIZE)  # last resort

scratch = ImageDraw.Draw(Image.new("RGBA", (10, 10)))

def measure(txt, font):
    b = scratch.textbbox((0, 0), txt, font=font, stroke_width=STROKE)
    return b, b[2] - b[0], b[3] - b[1]

hb, hw, hh = measure("#", hash_font)
nb, nw, nh = measure("NKMA", pa)

content_w = hw + GAP + nw
content_h = max(hh, nh)
W = content_w + PAD * 2
H = content_h + PAD * 2

# baseline-ish vertical centering per piece
hx = PAD - hb[0]
hy = PAD - hb[1] + (content_h - hh) // 2
nx = PAD + hw + GAP - nb[0]
ny = PAD - nb[1] + (content_h - nh) // 2

def draw_layer(fill, stroke_fill):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.text((hx, hy), "#", font=hash_font, fill=fill, stroke_width=STROKE, stroke_fill=stroke_fill)
    d.text((nx, ny), "NKMA", font=pa, fill=fill, stroke_width=STROKE, stroke_fill=stroke_fill)
    return img

# glow: solid red, blurred
glow = draw_layer(GLOW + (255,), GLOW + (255,))
glow_big = glow.filter(ImageFilter.GaussianBlur(34))
glow_sm = glow.filter(ImageFilter.GaussianBlur(14))

# main: hollow (transparent fill), gold outline
main = draw_layer((0, 0, 0, 0), GOLD)

out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
out = Image.alpha_composite(out, Image.blend(Image.new("RGBA", (W, H), (0, 0, 0, 0)), glow_big, 0.30))
out = Image.alpha_composite(out, Image.blend(Image.new("RGBA", (W, H), (0, 0, 0, 0)), glow_sm, 0.45))
out = Image.alpha_composite(out, main)

out.save("nkma-logo.png")
print(f"saved nkma-logo.png  ({W}x{H})  hash_font={hash_font.path}")
