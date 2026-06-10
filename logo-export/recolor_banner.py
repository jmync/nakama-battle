"""Recolor the banner's magenta-pink glow to the site's neon red (#ff2d2d),
preserving brightness/shadows so silhouettes and lighting stay intact."""
from PIL import Image
import colorsys

src = Image.open("image.jpg").convert("RGB")
W, H = src.size
px = src.load()
out = Image.new("RGB", (W, H))
op = out.load()

# Target the icon's red-pink (#d4263b) so the banner matches the logo.
TARGET_H = colorsys.rgb_to_hls(212/255, 38/255, 59/255)[0]

for y in range(H):
    for x in range(W):
        r, g, b = px[x, y]
        h, l, s = colorsys.rgb_to_hls(r/255, g/255, b/255)
        hue_deg = h * 360
        if s > 0.12 and l > 0.06:
            if hue_deg >= 250 or hue_deg <= 25:
                # magenta/pink -> icon red-pink (#d4263b); keep its brightness
                h = TARGET_H
            elif 180 <= hue_deg < 270:
                # blue/navy/purple -> neutral dark (NKMA ink), kill the blue
                s = 0.0
                l = min(l, 0.05)   # crush toward near-black like #0a0a0a
        nr, ng, nb = colorsys.hls_to_rgb(h, l, s)
        op[x, y] = (int(nr*255), int(ng*255), int(nb*255))

out.save("image-recolored.png")
print(f"saved image-recolored.png  ({W}x{H})")
