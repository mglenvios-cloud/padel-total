from PIL import Image
import sys

src = 'padel_court_hero.png'
out = 'padel_court_hero.webp'
try:
    im = Image.open(src)
    im.save(out, 'WEBP', quality=80, method=6)
    print('Saved', out)
except Exception as e:
    print('Error:', e)
    sys.exit(1)
