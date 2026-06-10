"""Render the headset panda PNG to MATCH nkma-panda-headset.svg exactly.
Reproduces the SVG's literal coordinates/beziers (240 space) in Pillow."""
from PIL import Image, ImageDraw, ImageFilter
import math

CANVAS = 1024
BG = (212, 38, 59, 255)        # #d4263b red-pink
RED = (15, 6, 8, 255)          # dark panda
FACE = (212, 38, 59, 255)      # face = bg red-pink

S = 4
W = CANVAS * S
sc = W / 240.0
def X(v): return v * sc
img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

def cubic(p0, p1, p2, p3, n=40):
    out = []
    for i in range(n + 1):
        t = i / n; u = 1 - t
        x = u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0]
        y = u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]
        out.append((x, y))
    return out

def quad(p0, p1, p2, n=24):
    out = []
    for i in range(n + 1):
        t = i / n; u = 1 - t
        x = u*u*p0[0] + 2*u*t*p1[0] + t*t*p2[0]
        y = u*u*p0[1] + 2*u*t*p1[1] + t*t*p2[1]
        out.append((x, y))
    return out

def arc(cx, cy, rx, ry, a0, a1, n=32):
    out = []
    for i in range(n + 1):
        a = math.radians(a0 + (a1 - a0) * i / n)
        out.append((cx + rx*math.cos(a), cy + ry*math.sin(a)))
    return out

def poly(pts, fill):
    d.polygon([(X(x), X(y)) for x, y in pts], fill=fill)

def stroke(pts, color, w):
    d.line([(X(x), X(y)) for x, y in pts], fill=color, width=int(w*sc), joint="curve")

def circle(cx, cy, r, fill, oc=None, ow=0):
    d.ellipse([X(cx-r), X(cy-r), X(cx+r), X(cy+r)], fill=fill,
              outline=oc, width=int(ow*sc) if ow else 0)

def ellipse(cx, cy, rx, ry, fill):
    d.ellipse([X(cx-rx), X(cy-ry), X(cx+rx), X(cy+ry)], fill=fill)

def rrect(x0, y0, w, h, r, fill):
    d.rounded_rectangle([X(x0), X(y0), X(x0+w), X(y0+h)], radius=X(r), fill=fill)

OW = 9
# --- band: bigger arc spanning wider + higher, thicker stroke ---
band = cubic((30,132),(30,42),(92,26),(120,26)) + cubic((120,26),(148,26),(210,42),(210,132))
stroke(band, RED, 16)

# --- ears: dark fill + red outline (stroke as thick outline via two circles) ---
for cx in (80, 160):
    circle(cx, 80, 27 + OW/2, RED)       # red outer
for cx in (80, 160):
    circle(cx, 80, 27 - OW/2, FACE)      # dark inner

# --- head: M120 64 C167 64 195 95 195 134 C195 177 163 201 120 201 C77 201 45 177 45 134 C45 95 73 64 120 64 Z
head = (cubic((120,64),(167,64),(195,95),(195,134)) +
        cubic((195,134),(195,177),(163,201),(120,201)) +
        cubic((120,201),(77,201),(45,177),(45,134)) +
        cubic((45,134),(45,95),(73,64),(120,64)))
# red outline = draw filled red slightly larger, then dark fill inside
# (approximate stroke by drawing the path stroked + filled dark)
poly(head, FACE)
stroke(head + [head[0]], RED, OW)

# --- ear-cups: bigger, pushed slightly outward to frame the head ---
rrect(22, 104, 38, 64, 18, RED); rrect(30, 115, 22, 42, 11, FACE)
rrect(180, 104, 38, 64, 18, RED); rrect(188, 115, 22, 42, 11, FACE)

# --- smile below the bandana so it reads as a panda face ---
stroke(quad((96,176),(120,190),(144,176)), RED, 7)
# little nose just above the smile
ellipse(120, 168, 7, 5, RED)

# --- bandana band across the eye level (robber mask), with #NKMA text ---
from PIL import ImageFont
# band: a red rectangle spanning the face at eye level, slight downward sag at center
by0, by1 = 114, 154
# band sits BETWEEN the ear-cups so it does not cover them
d.rectangle([X(40), X(by0), X(200), X(by1)], fill=RED)  # extend ends under the cups so they tuck behind
# #NKMA text in dark, centered on the band
fpath = None
for f in ("ariblk.ttf","arialbd.ttf","impact.ttf"):
    try: ImageFont.truetype("C:/Windows/Fonts/"+f, 10); fpath="C:/Windows/Fonts/"+f; break
    except OSError: pass
font = ImageFont.truetype(fpath, int(26*sc))
txt = "#NKMA"
tb = d.textbbox((0,0), txt, font=font)
tw, th = tb[2]-tb[0], tb[3]-tb[1]
d.text((X(120)-tw/2-tb[0], X((by0+by1)/2)-th/2-tb[1]), txt, font=font, fill=FACE)

# redraw ear-cups on top so the bandana never covers them
rrect(22, 104, 38, 64, 18, RED); rrect(30, 115, 22, 42, 11, FACE)
rrect(180, 104, 38, 64, 18, RED); rrect(188, 115, 22, 42, 11, FACE)

# --- smile below the bandana so it reads as a panda face ---
stroke(quad((96,176),(120,190),(144,176)), RED, 7)
# little nose just above the smile
ellipse(120, 168, 7, 5, RED)

img = img.resize((CANVAS, CANVAS), Image.LANCZOS)
# center the panda content vertically/horizontally in the square
bbox = img.split()[3].getbbox()
out = Image.new("RGBA", (CANVAS, CANVAS), BG)
if bbox:
    cropped = img.crop(bbox)
    cw, ch = cropped.size
    out.alpha_composite(cropped, ((CANVAS - cw) // 2, (CANVAS - ch) // 2))
else:
    out = Image.alpha_composite(out, img)
out.convert("RGB").save("nkma-panda-headset.png")
print("saved nkma-panda-headset.png")







