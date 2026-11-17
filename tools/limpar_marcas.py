#!/usr/bin/env python3
"""Remove product images flagged with a store watermark and rebuild clean covers."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS = ROOT / "assets" / "img" / "produtos"
MARKED = set([
  "controlador-sinapse-spamax-home-9-8000w-220-p1.webp",
  "controlador-sinapse-spamax-home-9-8000w-220-p2.webp",
  "kit-motobomba-lepono-lspa-1-0-cv-aquecedor-sanspray-3-funcoe-2.webp",
  "kit-motobomba-lepono-lspa-1-0-cv-aquecedor-sanspray-3-funcoe-3.webp",
  "kit-motobomba-lepono-lspa-1-0-cv-aquecedor-sanspray-3-funcoe-4.webp",
  "kit-motobomba-lepono-lspa-1-0-cv-aquecedor-sanspray-3-funcoe-5.webp",
  "kit-motobomba-lepono-lspa-1-5-cv-aquecedor-sanspray-3-funcoe-2.webp",
  "kit-motobomba-lepono-lspa-1-5-cv-aquecedor-sanspray-3-funcoe-3.webp",
  "kit-motobomba-lepono-lspa-1-5-cv-aquecedor-sanspray-3-funcoe-4.webp",
  "kit-motobomba-lepono-lspa-1-5-cv-aquecedor-sanspray-3-funcoe-5.webp",
  "kit-motobomba-syllent-1-0-cv-aquecedor-sanspray-3-funcoes-di-2.webp",
  "kit-motobomba-syllent-1-0-cv-aquecedor-sanspray-3-funcoes-di-3.webp",
  "kit-motobomba-syllent-1-0-cv-aquecedor-sanspray-3-funcoes-di-4.webp",
  "kit-motobomba-syllent-1-0-cv-aquecedor-sanspray-3-funcoes-di-5.webp",
  "kit-motobomba-syllent-1-2-cv-aquecedor-sanspray-3-funcoes-di-2.webp",
  "kit-motobomba-syllent-1-2-cv-aquecedor-sanspray-3-funcoes-di-5.webp",
  "kit-motobomba-syllent-1-3-cv-aquecedor-sanspray-3-funcoes-di-2.webp",
  "kit-motobomba-syllent-1-3-cv-aquecedor-sanspray-3-funcoes-di-5.webp",
  "kit-motobomba-syllent-1-5-cv-aquecedor-sanspray-3-funcoes-di-2.webp",
  "kit-motobomba-syllent-1-5-cv-aquecedor-sanspray-3-funcoes-di-3.webp",
  "kit-motobomba-syllent-1-5-cv-aquecedor-sanspray-3-funcoes-di-4.webp",
  "kit-motobomba-syllent-1-5-cv-aquecedor-sanspray-3-funcoes-di-5.webp",
  "kit-motobomba-syllent-2-0-cv-aquecedor-sanspray-3-funcoes-di-2.webp",
  "kit-motobomba-syllent-2-0-cv-aquecedor-sanspray-3-funcoes-di-3.webp",
  "kit-motobomba-syllent-2-0-cv-aquecedor-sanspray-3-funcoes-di-4.webp",
  "kit-motobomba-syllent-2-0-cv-aquecedor-sanspray-3-funcoes-di-5.webp",
  "kit-motobomba-syllent-3-4-cv-aquecedor-sanspray-3-funcoes-di-2.webp",
  "kit-motobomba-syllent-3-4-cv-aquecedor-sanspray-3-funcoes-di-3.webp",
  "kit-motobomba-syllent-3-4-cv-aquecedor-sanspray-3-funcoes-di-4.webp",
  "kit-motobomba-syllent-3-4-cv-aquecedor-sanspray-3-funcoes-di-5.webp",
  "kit-motobombalepono-aquecedor3f-2.webp",
  "kit-motobombalepono-aquecedor3f-3.webp",
  "kit-motobombalepono-aquecedor3f-4.webp",
  "kit-motobombalepono-aquecedor3f-5.webp",
  "motobomba-claw-1-2cv-1.webp",
  "motobomba-claw-1-2cv-2.webp",
  "motobomba-claw-1-2cv-3.webp",
  "motobomba-claw-1-2cv-4.webp",
  "motobomba-claw-1-2cv-5.webp",
  "motobomba-claw-1-2cv.webp",
  "motobomba-claw-3-4-cv-hidromassagem-e-spa-1.webp",
  "motobomba-claw-3-4-cv-hidromassagem-e-spa-2.webp",
  "motobomba-claw-3-4-cv-hidromassagem-e-spa-3.webp",
  "motobomba-claw-3-4-cv-hidromassagem-e-spa-4.webp",
  "motobomba-claw-3-4-cv-hidromassagem-e-spa-5.webp",
  "motobomba-claw-3-4-cv-hidromassagem-e-spa.webp",
  "motobomba-lepono-lspa-1-0-cv-1.webp",
  "motobomba-lepono-lspa-1-0-cv-2.webp",
  "motobomba-lepono-lspa-1-0-cv-3.webp",
  "motobomba-lepono-lspa-1-0-cv-4.webp",
  "motobomba-lepono-lspa-1-0-cv-5.webp",
  "motobomba-lepono-lspa-1-0-cv.webp",
  "motobomba-lepono-lspa-1-2-cv-1.webp",
  "motobomba-lepono-lspa-1-2-cv-2.webp",
  "motobomba-lepono-lspa-1-2-cv-3.webp",
  "motobomba-lepono-lspa-1-2-cv-4.webp",
  "motobomba-lepono-lspa-1-2-cv-5.webp",
  "motobomba-lepono-lspa-1-2-cv.webp",
  "motobomba-lepono-lspa-1-5-cv-1.webp",
  "motobomba-lepono-lspa-1-5-cv-2.webp",
  "motobomba-lepono-lspa-1-5-cv-3.webp",
  "motobomba-lepono-lspa-1-5-cv-4.webp",
  "motobomba-lepono-lspa-1-5-cv-5.webp",
  "motobomba-lepono-lspa-1-5-cv.webp",
  "motobomba-syllent-1-2-cv-1.webp",
  "motobomba-syllent-1-2-cv-2.webp",
  "motobomba-syllent-1-2-cv-3.webp",
  "motobomba-syllent-1-2-cv-4.webp",
  "motobomba-syllent-1-2-cv-5.webp",
  "motobomba-syllent-1-2-cv.webp",
  "motobomba-syllent-1-3-cv-1.webp",
  "motobomba-syllent-1-3-cv-2.webp",
  "motobomba-syllent-1-3-cv-5.webp",
  "motobomba-syllent-1-3-cv.webp",
  "motobomba-syllent-3-4-cv-1.webp",
  "motobomba-syllent-3-4-cv-2.webp",
  "motobomba-syllent-3-4-cv-3.webp",
  "motobomba-syllent-3-4-cv-4.webp",
  "motobomba-syllent-3-4-cv-5.webp",
  "motobomba-syllent-3-4-cv.webp",
  "motobomba-syllent-super-2-0-cv-1.webp",
  "motobomba-syllent-super-2-0-cv-2.webp",
  "motobomba-syllent-super-2-0-cv-3.webp",
  "motobomba-syllent-super-2-0-cv-4.webp",
  "motobomba-syllent-super-2-0-cv-5.webp",
  "motobomba-syllent-super-2-0-cv.webp"
])
PUMP_10 = "motobomba-lepono-lspa-1-0-cv"
CLAWS = (
    "motobomba-claw-1-2cv",
    "motobomba-claw-3-4-cv-hidromassagem-e-spa",
)
ILLUSTRATION = "assets/img/produtos/foto-ilustrativa.webp"


def illustration():
    """Create a simple neutral pump illustration at 900x900."""
    scale = 3
    im = Image.new("RGB", (900 * scale, 900 * scale), "white")
    d = ImageDraw.Draw(im)
    def box(coords):
        return tuple(round(v * scale) for v in coords)
    body = "#d9dee6"
    edge = "#aab3c1"
    # Horizontal motor body with rounded ends, base feet, and a short outlet nozzle.
    d.rounded_rectangle(box((190, 365, 660, 535)), radius=58 * scale, fill=body, outline=edge, width=5 * scale)
    d.ellipse(box((170, 365, 275, 535)), fill="#c8ced8", outline=edge, width=5 * scale)
    d.ellipse(box((610, 365, 700, 535)), fill="#e5e8ed", outline=edge, width=5 * scale)
    d.rounded_rectangle(box((360, 310, 465, 370)), radius=12 * scale, fill=body, outline=edge, width=5 * scale)
    d.rectangle(box((385, 270, 440, 320)), fill=body, outline=edge, width=5 * scale)
    d.rounded_rectangle(box((285, 520, 355, 555)), radius=8 * scale, fill=edge)
    d.rounded_rectangle(box((525, 520, 595, 555)), radius=8 * scale, fill=edge)
    regular = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 30 * scale)
    bold = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 42 * scale)
    color = "#647084"
    for text, font, y in (("Foto ilustrativa", bold, 650), ("Coloque aqui a foto do produto", regular, 715)):
        b = d.textbbox((0, 0), text, font=font)
        x = (im.width - (b[2] - b[0])) // 2
        d.text((x, y * scale), text, font=font, fill=color)
    im.resize((900, 900), Image.Resampling.LANCZOS).save(PRODUCTS / "foto-ilustrativa.webp", "WEBP", quality=88, method=6)


def make_cover(product_id, gallery):
    if not gallery:
        raise RuntimeError(f"No clean gallery images for cover: {product_id}")
    src = ROOT / gallery[0]
    if not src.is_file():
        raise FileNotFoundError(src)
    with Image.open(src) as source:
        source = source.convert("RGBA")
        canvas = Image.new("RGBA", (510, 510), "white")
        # Fit the complete photo in a 450px box, leaving about 6% margin.
        fitted = ImageOps.contain(source, (450, 450), method=Image.Resampling.LANCZOS)
        canvas.alpha_composite(fitted, ((510 - fitted.width) // 2, (510 - fitted.height) // 2))
        canvas.convert("RGB").save(PRODUCTS / f"{product_id}.webp", "WEBP", quality=82, method=6)


def main():
    details_path = ROOT / "data" / "detalhes.json"
    details = json.loads(details_path.read_text(encoding="utf-8"))
    original_path = ROOT / "data" / "detalhes.orig.json"
    original = json.loads(original_path.read_text(encoding="utf-8"))
    removed = {Path(name).name for name in MARKED}

    # Remove flagged paths from both source files.
    for dataset in (details, original):
        for product in dataset.values():
            product["galeria"] = [p for p in product.get("galeria", []) if Path(p).name not in removed]

    # Reuse the clean 1.0 CV photos for the 1.5 CV and 1.2 CV variants.
    one_zero = [f"assets/img/produtos/{PUMP_10}-p{i}.webp" for i in (1, 2, 3)]
    for dataset in (details, original):
        dataset["motobomba-lepono-lspa-1-5-cv"]["galeria"] = list(one_zero)
        gallery_12 = dataset["motobomba-lepono-lspa-1-2-cv"].setdefault("galeria", [])
        for p in one_zero[1:]:
            if p not in gallery_12:
                gallery_12.append(p)
        for product_id in CLAWS:
            dataset[product_id]["galeria"] = [ILLUSTRATION]

    illustration()
    # Recreate every marked cover from the first clean image in its final gallery.
    covers = [Path(n).stem for n in MARKED if Path(n).stem + ".webp" == n and Path(n).stem in details]
    for product_id in sorted(covers):
        make_cover(product_id, details[product_id].get("galeria", []))

    details_path.write_text(json.dumps(details, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    original_path.write_text(json.dumps(original, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # Delete flagged non-cover files and their old generated miniatures.
    deleted = 0
    for name in sorted(removed):
        path = PRODUCTS / name
        if path.stem not in covers and path.is_file():
            path.unlink()
            deleted += 1
        mini = PRODUCTS / "mini" / name
        if mini.is_file():
            mini.unlink()
    print(f"Marked files: {len(MARKED)}; covers rebuilt: {len(covers)}; other marked files deleted: {deleted}")
    print("Final galleries:")
    for product_id in ("motobomba-lepono-lspa-1-5-cv", "motobomba-lepono-lspa-1-2-cv", *CLAWS):
        print(f"  {product_id}: {len(details[product_id].get('galeria', []))} photo(s)")


if __name__ == "__main__":
    main()
