"""
ISE Hiring — Icon Generator
Run: python3 make_icons.py
Requires: pip install pillow
"""
from PIL import Image, ImageDraw

def make_icon(size, path, bg=(27, 46, 75)):
    img  = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    r    = int(size * 0.22)
    draw.rounded_rectangle([0, 0, size-1, size-1], radius=r, fill=bg + (255,))

    # H shape (Hiring) — two vertical bars + one horizontal bar
    bw = int(size * 0.14)
    bh = int(size * 0.52)
    x0 = int(size * 0.18)
    x1 = int(size * 0.68)
    y0 = int(size * 0.24)

    # Left vertical bar
    draw.rounded_rectangle([x0, y0, x0+bw, y0+bh], radius=int(bw*.35), fill=(255, 255, 255, 230))
    # Right vertical bar
    draw.rounded_rectangle([x1, y0, x1+bw, y0+bh], radius=int(bw*.35), fill=(255, 255, 255, 230))
    # Horizontal connector
    mid = y0 + bh//2 - bw//2
    draw.rounded_rectangle([x0, mid, x1+bw, mid+bw], radius=int(bw*.35), fill=(255, 255, 255, 230))

    img.save(path, 'PNG')
    print(f'Saved: {path}')

make_icon(192, 'icon-192.png')
make_icon(512, 'icon-512.png')
make_icon(180, 'icon-180.png')
print('Done! Upload these 3 PNG files to your GitHub repo.')
