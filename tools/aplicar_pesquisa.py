"""Aplica a pesquisa de produtos (pesquisa/<id>.json) em data/detalhes.json.

Sempre parte de data/detalhes.orig.json (cópia criada na primeira execução), então
pode ser rodado de novo sem duplicar nada. Depois rode tools/build.py.

    python3 tools/aplicar_pesquisa.py
    python3 tools/build.py https://aquavitapecas.com.br
"""
import html
import json
import os
import re
import shutil
import sys

from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DET = os.path.join(RAIZ, "data", "detalhes.json")
ORIG = os.path.join(RAIZ, "data", "detalhes.orig.json")
PESQ = os.path.join(RAIZ, "pesquisa")
IMG = os.path.join(RAIZ, "assets", "img", "produtos")

# Produtos em que a pesquisa não achou base confiável: não mexe no texto nem na ficha.
SO_FOTOS = {
    "controlador-sinapse-spamax-home-9-8000w-220",  # anúncio é do painel avulso; confirmar o que é vendido
}
IGNORAR = {"motobomba-claw-1-2cv", "motobomba-claw-3-4-cv-hidromassagem-e-spa"}

# Fotos recusadas na conferência visual (banner de logos, foto amadora, selo de propaganda).
FOTOS_FORA = {
    "aquecedor-digital-smart-wave-ultra-s/03.jpg",
    "kit-motobomba-syllent-1-0-cv-aquecedor-sanspray-3-funcoes-digital-220v/03.jpg",
    "kit-motobomba-syllent-2-0-cv-aquecedor-sanspray-3-funcoes-digital-220v/02.jpg",
}

FONTE = r"(?:site|site oficial|site do kit|site da Sanspray|anúncio|anúncios|catálogo|catálogo consultado|cadastro|cadastro atual|descrição do produto|revenda|Loja do Mecânico|Mercado Livre)"
PALAVRAS_FONTE = re.compile(
    r"\b(site|anúncio|anúncios|catálogo|cadastro|Loja do Mecânico|Mercado Livre|ML|manual|fabricante|"
    r"confirm\w*|revenda|terceiros|Extra|vendedor|desenho|ver conflitos)\b", re.I)


def limpa(t: str) -> str:
    """Tira as notas de origem que os agentes deixaram no texto."""
    if not t:
        return t
    # "Segundo o anúncio, o painel..." -> "O painel..."
    t = re.sub(r"\b(?:Segundo|Conforme|De acordo com) (?:o|a|os|as) " + FONTE + r"[^,.<]*,\s*(\w)",
               lambda m: m.group(1).upper(), t)
    # "..., segundo o site" / "... conforme a Loja do Mecânico"
    t = re.sub(r",?\s*\b(?:segundo|conforme|de acordo com) (?:o|a|os|as) " + FONTE + r"[^.,;)<\"]*", "", t)

    # parênteses que só dizem a origem do dado
    def par(m):
        dentro = m.group(1)
        if not PALAVRAS_FONTE.search(dentro):
            return m.group(0)
        partes = [p.strip() for p in re.split(r"[;,]", dentro)]
        resto = [p for p in partes if p and not PALAVRAS_FONTE.search(p)]
        return f" ({', '.join(resto)})" if resto else ""
    t = re.sub(r"\s*\(([^()]*)\)", par, t)
    t = re.sub(r"\s{2,}", " ", t)
    t = re.sub(r"\s+([.,;:])", r"\1", t)
    return t.strip()


INTERNO = re.compile(
    r"\b(anúncios?|catálogo|cadastro|Loja do Mecânico|Mercado Livre|não confirmad\w*|sem confirmação|revenda|"
    r"terceiros|comprador|infográfico|fora de linha|sem fonte|texto atual do site)\b", re.I)


def sem_interno(t: str) -> str:
    """Remove frases inteiras que falam da pesquisa (fontes, conflitos), e não do produto."""
    t = re.sub(r"(?<=[>.!?])([^<>.!?]*)([.!?]?)",
               lambda m: "" if INTERNO.search(m.group(1)) else m.group(0), t)
    t = re.sub(r"<(li|p)>\s*</\1>", "", t)
    t = re.sub(r"<ul>\s*</ul>", "", t)
    t = re.sub(r"<h3>[^<]*</h3>\s*(?=<h3>|$)", "", t)
    return re.sub(r"\s{2,}", " ", t).strip()


def valor_ok(v: str) -> str:
    partes = [p.strip() for p in re.split(r";", v)]
    return "; ".join(p for p in partes if p and not INTERNO.search(p))


def frases(t: str) -> str:
    return " ".join(f for f in re.split(r"(?<=[.!?])\s+", t) if f and not INTERNO.search(f)).strip()


def chave(k: str) -> str:
    k = k.lower()
    for raiz in ("peso", "dimens", "tens", "garantia", "spot", "pontos de luz", "potência"):
        if raiz in k:
            return raiz
    return k


def converte_fotos(pid, fotos):
    saida = []
    n = 0
    for f in fotos:
        rel = (f.get("arquivo") or "").replace("fotos/", "", 1)
        if not rel or rel in FOTOS_FORA:
            continue
        src = os.path.join(PESQ, "fotos", rel)
        if not os.path.exists(src):
            continue
        n += 1
        nome = f"{pid}-p{n}.webp"
        try:
            im = Image.open(src)
            im = im.convert("RGBA") if im.mode in ("P", "LA", "RGBA") else im.convert("RGB")
            if im.mode == "RGBA":
                fundo = Image.new("RGB", im.size, "white")
                fundo.paste(im, mask=im.split()[3])
                im = fundo
            im.thumbnail((1200, 1200))
            im.save(os.path.join(IMG, nome), "WEBP", quality=82)
        except Exception as e:  # imagem corrompida
            print("  foto ignorada", src, e, file=sys.stderr)
            n -= 1
            continue
        saida.append(f"assets/img/produtos/{nome}")
    return saida


def main():
    if not os.path.exists(ORIG):
        shutil.copy(DET, ORIG)
    det = json.load(open(ORIG, encoding="utf-8"))
    for pid, d in det.items():
        arq = os.path.join(PESQ, pid + ".json")
        if pid in IGNORAR or not os.path.exists(arq):
            continue
        p = json.load(open(arq, encoding="utf-8"))
        novas = converte_fotos(pid, p.get("fotos") or [])
        d["galeria"] = (d.get("galeria") or []) + [x for x in novas if x not in (d.get("galeria") or [])]
        mud = [f"+{len(novas)} fotos"]
        if pid in SO_FOTOS:
            print(pid, *mud)
            continue

        desc = p.get("descricao_html") or ""
        if len(re.sub("<[^>]+>", "", desc)) >= 500:
            desc = sem_interno(limpa(desc))
            caixa = [limpa(x) for x in (p.get("na_caixa") or []) if x and not INTERNO.search(x)]
            if caixa and "vem na caixa" not in desc.lower():
                desc += "<h3>O que vem na caixa</h3><ul>" + "".join(f"<li>{html.escape(x)}</li>" for x in caixa) + "</ul>"
            faq = [{"p": limpa(x["p"]), "r": frases(limpa(x["r"]))} for x in (p.get("faq") or []) if x.get("p") and x.get("r")]
            faq = [x for x in faq if x["r"] and not INTERNO.search(x["p"])]
            if faq:
                desc += "<h3>Perguntas frequentes</h3>" + "".join(
                    f"<p><strong>{html.escape(x['p'])}</strong><br>{html.escape(x['r'])}</p>" for x in faq)
            d["descricao"] = desc
            mud.append("texto")

        res = [limpa(x) for x in (p.get("resumo") or []) if x and not INTERNO.search(x)]
        if len(res) >= 3:
            d["resumo"] = "<ul>" + "".join(f"<li>{html.escape(x)}</li>" for x in res[:5]) + "</ul>"
            mud.append("destaques")

        ficha = [[limpa(k), valor_ok(limpa(v))] for k, v in (p.get("ficha") or []) if k and v]
        ficha = [r for r in ficha if r[0] and r[1] and not INTERNO.search(r[0])]
        if len(ficha) >= 5:
            novas_chaves = {chave(k) for k, _ in ficha}
            antigas = [r for r in (d.get("ficha") or []) if chave(r[0]) not in novas_chaves]
            d["ficha"] = ficha + antigas
            mud.append(f"ficha {len(d['ficha'])} itens")
        print(pid, *mud)
    json.dump(det, open(DET, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
