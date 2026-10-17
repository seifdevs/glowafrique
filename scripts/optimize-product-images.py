#!/usr/bin/env python3
"""Create optimized WebP copies of assets/products without changing originals."""
from pathlib import Path
from PIL import Image, ImageOps
import hashlib

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'assets' / 'products'
DEST = ROOT / 'assets' / 'products-web'
EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.bmp', '.tif', '.tiff'}

files = sorted(p for p in SOURCE.rglob('*') if p.is_file() and p.suffix.lower() in EXTENSIONS)
for source in files:
    relative = source.relative_to(SOURCE)
    rel_posix = relative.as_posix()
    digest = hashlib.sha256(rel_posix.encode('utf-8')).hexdigest()[:8]
    target = DEST / relative.parent / f'{source.stem}--{digest}.webp'
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original)
        image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
        if image.mode in ('RGBA', 'LA') or (image.mode == 'P' and 'transparency' in image.info):
            rgba = image.convert('RGBA')
            background = Image.new('RGBA', rgba.size, '#FFF8EE')
            background.alpha_composite(rgba)
            image = background.convert('RGB')
        else:
            image = image.convert('RGB')
        image.save(target, 'WEBP', quality=88, method=6)
print(f'Optimized {len(files)} images into {DEST.relative_to(ROOT)}; originals were left unchanged.')
