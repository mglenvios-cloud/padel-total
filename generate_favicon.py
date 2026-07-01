from PIL import Image, ImageDraw, ImageFont

size = (64, 64)
img = Image.new("RGBA", size, (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# Draw a round blue circle with white border
r = 4
bbox = (r, r, size[0] - r - 1, size[1] - r - 1)
d.ellipse(bbox, fill=(0, 212, 255, 255), outline=(255, 255, 255, 255), width=4)

# Draw a centered 'P'
try:
    font = ImageFont.truetype("arial.ttf", 36)
except Exception:
    font = ImageFont.load_default()

text = "P"
try:
    bbox = d.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
except AttributeError:
    w, h = font.getsize(text)

d.text(((size[0] - w) / 2, (size[1] - h) / 2 - 2), text, font=font, fill=(0, 0, 0, 255))

img.save("favicon.ico", sizes=[(64, 64), (32, 32), (16, 16)])
print("favicon.ico created")
