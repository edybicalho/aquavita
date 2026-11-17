"""Gera as miniaturas da galeria das páginas de produto (160 px, webp).

As miniaturas aparecem com 76 px na tela; 160 px deixa nítido em tela de celular (2x).
Rode depois de trocar ou acrescentar fotos em assets/img/produtos/, e antes do build.py:

    python tools/miniaturas.py
    python tools/build.py https://aquavitapecas.com.br

Precisa do Pillow (pip install pillow). Sem as miniaturas, o build.py usa a foto inteira.
"""
import os
import sys

from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEM = os.path.join(RAIZ, "assets", "img", "produtos")
DESTINO = os.path.join(ORIGEM, "mini")
LADO = 160


def main():
    os.makedirs(DESTINO, exist_ok=True)
    feitas = 0
    nomes = {f for f in os.listdir(ORIGEM) if f.lower().endswith(".webp")}
    for nome in sorted(nomes):
        src, dst = os.path.join(ORIGEM, nome), os.path.join(DESTINO, nome)
        if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
            continue
        with Image.open(src) as im:
            im = im.convert("RGBA") if im.mode in ("P", "LA", "RGBA") else im.convert("RGB")
            im.thumbnail((LADO, LADO), Image.LANCZOS)
            im.save(dst, "WEBP", quality=80, method=6)
        feitas += 1
    # miniaturas de fotos que não existem mais
    for nome in os.listdir(DESTINO):
        if nome not in nomes:
            os.remove(os.path.join(DESTINO, nome))
    print(f"miniaturas: {feitas} geradas, {len(nomes)} no total")


if __name__ == "__main__":
    sys.exit(main())
