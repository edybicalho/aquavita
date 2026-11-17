#!/usr/bin/env python3
"""Gera tudo o que depende do catálogo:

  produto/<id>.html         uma página por produto (destino de anúncios, Google Shopping, SEO)
  feed/google-merchant.xml  Google Merchant Center
  feed/meta-catalogo.csv    Catálogo da Meta
  sitemap.xml, robots.txt

Fontes: assets/js/products.js (preço, estoque, variações) e data/detalhes.json (descrição, ficha, fotos).

Uso:
  python3 tools/build.py https://www.seudominio.com.br

Rode de novo sempre que mudar preço, estoque, produto ou o cabeçalho/rodapé.
"""
import csv
import html
import json
import os
import re
import sys
from datetime import date

PARCELAS = 10
PIX_OFF = 0.06
CATS = {
    "motobombas": ("Motobombas", "Motobombas para hidromassagem"),
    "aquecedores": ("Aquecedores", "Aquecedores para banheira e spa"),
    "controladores": ("Controladores de spa", "Controladores de spa"),
    "kits": ("Kits", "Kits motobomba + aquecedor"),
}
REVIEWS = [("Exemplo de depoimento: aqui entra uma avaliação real da sua loja no Google.", "Nome do cliente · Google"), ("Exemplo de depoimento: conte aqui como foi o atendimento da sua loja.", "Nome do cliente · Google"), ("Exemplo de depoimento: compartilhe uma experiência real de compra.", "Nome do cliente · Google")]
e = lambda s: html.escape(str(s), quote=True)  # noqa: E731


RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def mini(foto):
    """Miniatura de 160 px da galeria (tools/miniaturas.py); sem ela, usa a foto inteira."""
    pasta, nome = os.path.split(foto)
    m = pasta + "/mini/" + nome
    return m if os.path.exists(os.path.join(RAIZ, m)) else foto


def sku_de(d, p):
    """SKU do fabricante quando parece um código de verdade (tem letra, ex.: SPAMAX5);
    números soltos como "9" ou "5-1" vieram da numeração interna da loja antiga e são trocados pelo id."""
    sku = (d.get("sku") or "").strip()
    return sku if re.search(r"[A-Za-z]", sku) else p["id"][:50]


def r2(n):
    """Arredonda centavos como o site (JavaScript): meio centavo sobe."""
    from decimal import Decimal, ROUND_HALF_UP
    return float(Decimal(repr(n)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def brl(n):
    return "R$ " + f"{r2(n):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def ic(name):
    return f'<svg class="ic"><use href="#i-{name}"/></svg>'


def plain(fragment, limit=None):
    t = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", fragment))).strip()
    if limit and len(t) > limit:
        t = t[: limit - 1].rsplit(" ", 1)[0] + "…"
    return t


def formatar(desc):
    """Descrições que vieram como um bloco só ("* TÍTULO * – item – item") viram títulos e listas."""
    if not desc or "<li>" in desc or desc.count(" – ") < 3:
        return desc
    partes = re.split(r"\*\s*([^*<>]{3,60}?)\s*\*", plain(desc))
    out = []
    for i, parte in enumerate(partes):
        parte = parte.strip()
        if not parte:
            continue
        if i % 2 == 1:
            out.append(f"<h3>{e(parte.capitalize())}</h3>")
            continue
        parte = re.sub(r"(?:^|\s)(\d{2})\s–\s", r" – \1× ", parte)          # "01 – Bojo" -> item "01× Bojo"
        parte = re.sub(r"\sGARANTIA DE F[AÁ]BRICA:", " – Garantia de fábrica:", parte).strip()
        itens = [x.strip() for x in re.split(r"\s–\s|^–\s", parte) if x.strip()]
        if parte.startswith("–") or i > 0:
            out.append("<ul>" + "".join(f"<li>{e(x)}</li>" for x in itens) + "</ul>")
        else:
            out.append(f"<p>{e(itens[0])}</p>")
            if len(itens) > 1:
                out.append("<ul>" + "".join(f"<li>{e(x)}</li>" for x in itens[1:]) + "</ul>")
    return "".join(out)


def page(p, d, todos, base, sprite):
    cat_curto, cat_longo = CATS[p["cat"]]
    url = f"{base}/produto/{p['id']}.html"
    fotos = d["galeria"] or [p["img"]]
    desc_meta = plain(d["descricao"] or p["name"], 155) or p["name"]
    itens = p["opcao"]["itens"] if p.get("opcao") else []
    multi = len(itens) > 1

    thumbs = ""
    if len(fotos) > 1:
        thumbs = '<div class="gal__thumbs">' + "".join(
            f'<button data-src="../{e(f)}" aria-current="{"true" if i == 0 else "false"}" aria-label="Foto {i + 1}"><img src="../{e(mini(f))}" alt="" loading="lazy" decoding="async" width="76" height="76"></button>'
            for i, f in enumerate(fotos)) + "</div>"

    opt = ""
    if multi:
        opt = (f'<div class="opt" id="opt"><span class="opt__label">{e(p["opcao"]["nome"])}</span><div class="opt__list">'
               + "".join(f'<label><input type="radio" name="opt" value="{e(i["valor"])}"><span>{e(i["rotulo"])}{"" if i["estoque"] else " · esgotado"}</span></label>' for i in itens)
               + "</div></div>")

    resumo = [x.strip(" –-.") for x in re.split(r"<br>|</p>|</li>| – ", d.get("resumo") or "") if plain(x).strip(" –-.")]
    resumo = [plain(x).strip(" –-.") for x in resumo][:5]
    if len(itens) == 1:
        resumo.append(f'{p["opcao"]["nome"]}: {itens[0]["rotulo"]}')
    hl = '<ul class="buy__hl">' + "".join(f"<li>{e(x)}</li>" for x in resumo) + "</ul>" if resumo else ""

    ficha = [("Marca", p["brand"]), ("Categoria", cat_longo)] + [(k[:1].upper() + k[1:], v) for k, v in d["ficha"]]
    spec = '<table class="spec">' + "".join(f"<tr><th scope=\"row\">{e(k)}</th><td>{e(v)}</td></tr>" for k, v in ficha) + "</table>"

    rel = [x for x in todos if x["cat"] == p["cat"] and x["id"] != p["id"] and x["estoque"]]
    rel = sorted(rel, key=lambda x: (x["brand"] != p["brand"], abs(x["pix"] - p["pix"])))[:4]
    relacionados = "".join(
        f'<a href="{e(x["id"])}.html"><img src="../{e(x["img"])}" alt="" loading="lazy" width="510" height="510"><b>{e(x["name"])}</b>'
        f'<span>{"<small>a partir de </small>" if x.get("varia") else ""}{brl(x["pix"])} <small>no PIX</small></span></a>' for x in rel)

    ld = [{
        "@context": "https://schema.org", "@type": "Product", "name": p["name"], "sku": sku_de(d, p),
        "brand": {"@type": "Brand", "name": p["brand"]}, "category": cat_longo,
        "image": [f"{base}/{f}" for f in fotos], "description": plain(d["descricao"] or p["name"], 4500), "url": url,
        "offers": ({
            "@type": "AggregateOffer", "priceCurrency": "BRL", "offerCount": len(itens),
            "lowPrice": f'{min(i["cheio"] for i in itens):.2f}', "highPrice": f'{max(i["cheio"] for i in itens):.2f}',
            "availability": "https://schema.org/" + ("InStock" if p["estoque"] else "OutOfStock"),
        } if multi and p.get("varia") else {
            "@type": "Offer", "priceCurrency": "BRL", "price": f'{p["cheio"]:.2f}', "url": url,
            "itemCondition": "https://schema.org/NewCondition",
            "availability": "https://schema.org/" + ("InStock" if p["estoque"] else "OutOfStock"),
            "seller": {"@type": "Organization", "name": "AquaVita Peças"},
        }),
    }, {
        "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Início", "item": f"{base}/"},
            {"@type": "ListItem", "position": 2, "name": cat_curto, "item": f"{base}/?categoria={p['cat']}"},
            {"@type": "ListItem", "position": 3, "name": p["name"], "item": url},
        ]}]
    dados = {k: p[k] for k in ("id", "name", "cat", "brand", "pix", "cheio", "parcela", "estoque", "opcao")}
    dados["varia"] = bool(p.get("varia"))
    wa_duvida = "https://wa.me/5511900000000?text=" + "Ol%C3%A1!%20Vou%20enviar%20uma%20foto%20da%20pe%C3%A7a%20que%20preciso%20trocar."

    return f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{e(p["name"])} | AquaVita Peças</title>
<meta name="description" content="{e(desc_meta)}">
<link rel="canonical" href="{e(url)}">
<meta name="theme-color" content="#0a1e46">
<meta property="og:type" content="product">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="AquaVita Peças">
<meta property="og:title" content="{e(p["name"])}">
<meta property="og:description" content="{e(desc_meta)}">
<meta property="og:url" content="{e(url)}">
<meta property="og:image" content="{e(base)}/{e(fotos[0])}">
<meta property="product:price:amount" content="{p["cheio"]:.2f}">
<meta property="product:price:currency" content="BRL">
<meta property="product:availability" content="{"in stock" if p["estoque"] else "out of stock"}">
<meta property="product:brand" content="{e(p["brand"])}">
<meta property="product:retailer_item_id" content="{e(p["id"][:50])}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="../assets/img/logo.png">
<link rel="preload" as="font" type="font/woff2" href="../assets/fonts/inter-latin-wght-normal.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="../assets/fonts/sora-latin-wght-normal.woff2" crossorigin>
<link rel="preload" as="image" href="../{e(fotos[0])}">
<link rel="stylesheet" href="../assets/css/fonts.css">
<link rel="stylesheet" href="../assets/css/style.css">
<link rel="stylesheet" href="../assets/css/extras.css">
<link rel="stylesheet" href="../assets/css/plus.css">
<link rel="stylesheet" href="../assets/css/integracoes.css">
<link rel="stylesheet" href="../assets/css/produto.css">
<link rel="stylesheet" href="../assets/css/toque.css">
<script>(function(){{try{{var t=localStorage.getItem('LOJA-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}}catch(e){{}}}})()</script>
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body class="pdp-page">
{sprite}
<a class="skip" href="#conteudo">Ir para o produto</a>

<div class="topbar">
  <div class="wrap topbar__in">
    <span class="demo-tag">Site de demonstração · AquaVita Peças é uma loja fictícia</span>
    <span>{ic("pix")} <b>6% OFF</b> no PIX ou boleto</span>
    <span class="hide-sm">{ic("card")} Até <b>10x sem juros</b></span>
    <span class="hide-sm">{ic("truck")} Enviamos para todo o Brasil</span>
    <a class="hide-md" href="tel:+5511900000000">{ic("phone")} (11) 90000-0000</a>
  </div>
</div>

<header class="header header--pdp">
  <div class="wrap header__in">
    <a class="brand" href="../index.html" aria-label="AquaVita Peças — início">
      <img src="../assets/img/logo.png" alt="" width="56" height="56">
      <span class="brand__txt"><b>AquaVita Peças</b><small>Peças para banheiras e spas</small></span>
    </a>
    <form class="search" role="search" action="../index.html" method="get">
      {ic("search")}
      <input name="busca" type="search" placeholder="Busque por motobomba, aquecedor, Syllent…" aria-label="Buscar produtos" autocomplete="off">
    </form>
    <a class="btn btn--wa hide-md" href="https://wa.me/5511900000000?text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20preciso%20de%20ajuda." target="_blank" rel="noopener">{ic("wa")} Falar com consultor</a>
    <button class="iconbtn themebtn" id="themeBtn" aria-label="Alternar tema claro/escuro"><svg class="ic ic-moon"><use href="#i-moon"/></svg><svg class="ic ic-sun"><use href="#i-sun"/></svg></button>
    <a class="cartbtn" href="../index.html?carrinho=1" aria-label="Ver carrinho">
      {ic("cart")}
      <span class="cartbtn__n" id="cartCount" hidden>0</span>
    </a>
  </div>
</header>

<main id="conteudo">
  <div class="wrap">
    <nav class="crumbs" aria-label="Você está em">
      <a href="../index.html">Início</a> <span>›</span>
      <a href="../index.html?categoria={p["cat"]}">{e(cat_curto)}</a> <span>›</span>
      <span aria-current="page">{e(p["name"])}</span>
    </nav>

    <div class="pdp">
      <div class="gal">
        <div class="gal__main"><img id="galMain" src="../{e(fotos[0])}" alt="{e(p["name"])}" width="900" height="900" fetchpriority="high"></div>
        {thumbs}
      </div>

      <div class="buy">
        <span class="card__brand">{e(p["brand"])}</span>
        <h1>{e(p["name"])}</h1>
        <div class="buy__meta">
          <span class="stock{"" if p["estoque"] else " stock--out"}" id="stock">{"Em estoque" if p["estoque"] else "Fora de estoque"}</span>
          <a href="../index.html#avaliacoes"><span class="stars" aria-hidden="true">{ic("star") * 5}</span> Veja as avaliações da loja no Google</a>
        </div>

        <div class="buy__price">
          <div class="price">
            <div class="price__old" id="pOld">{brl(p["cheio"])}</div>
            <small class="price__from" id="pFrom"{"" if p.get("varia") else " hidden"}>a partir de</small>
            <div class="price__pix"><b id="pPix">{brl(p["pix"])}</b><span>6% OFF no PIX ou boleto</span></div>
            <div class="price__inst" id="pInst">ou <b>{PARCELAS}x de {brl(p["parcela"])}</b> sem juros no cartão</div>
          </div>
        </div>
        {hl}
        {opt}

        <div id="buyIn"{"" if p["estoque"] else " hidden"}>
          <div class="buy__row" id="buyMain">
            <div class="qty">
              <button data-q="-1" aria-label="Diminuir quantidade">{ic("minus")}</button>
              <output id="qty">1</output>
              <button data-q="1" aria-label="Aumentar quantidade">{ic("plus")}</button>
            </div>
            <a class="btn btn--wa btn--lg" data-buynow target="_blank" rel="noopener" href="https://wa.me/5511900000000">{ic("wa")} <span>Comprar pelo WhatsApp</span></a>
          </div>
          <button class="btn btn--ghost-dark btn--lg buy__cart" data-addcart>{ic("cart")} Adicionar ao carrinho</button>
        </div>
        <div id="buyOut"{" hidden" if p["estoque"] else ""}>
          <div class="buy__row"><a class="btn btn--primary btn--lg" id="notify" target="_blank" rel="noopener" href="#">Avise-me quando chegar</a></div>
        </div>

        <div class="modal__row" style="margin-top:10px">
          <a class="btn btn--ghost-dark" id="ask" target="_blank" rel="noopener" href="#">{ic("wa")} Tirar dúvida</a>
          <button class="btn btn--ghost-dark" id="shareBtn">{ic("share")} <span>Compartilhar</span></button>
        </div>

        <ul class="buy__trust">
          <li>{ic("truck")} Enviamos para todo o Brasil</li>
          <li>{ic("shield")} Pagamento 100% seguro</li>
          <li>{ic("headset")} Consultor confere a compatibilidade</li>
          <li>{ic("pin")} Loja física em São Paulo</li>
        </ul>
      </div>
    </div>

    <section class="pdp-sec">
      <div class="pdp-cols">
        <div>
          <h2>Descrição</h2>
          <div class="prose">{formatar(d["descricao"]) or f"<p>{e(p['name'])}.</p>"}</div>
        </div>
        <div>
          <h2>Ficha técnica</h2>
          {spec}
        </div>
      </div>
    </section>

    <section class="pdp-sec">
      <div class="helpband">
        <div>
          <p class="kicker kicker--light">Não tem certeza se serve?</p>
          <h2>Mande uma foto da peça antiga. A gente identifica.</h2>
          <p>Nossos consultores conferem potência, voltagem e encaixe antes de você comprar, para a peça chegar certa.</p>
        </div>
        <a class="btn btn--wa btn--lg" href="{wa_duvida}" target="_blank" rel="noopener">{ic("wa")} Enviar foto no WhatsApp</a>
      </div>
    </section>

    {f'<section class="pdp-sec"><h2>Você também pode gostar</h2><div class="rel">{relacionados}</div></section>' if relacionados else ''}

    <section class="pdp-sec">
      <h2>O que dizem sobre a loja no Google</h2>
      <div class="reviews reviews--3">
        {"".join(f'<figure class="review"><blockquote>Exemplo de depoimento: aqui entra uma avaliação real da sua loja no Google.</blockquote><figcaption><span class="avatar">N</span>Nome do cliente &#183; Google</figcaption></figure>' for t, n in REVIEWS)}
      </div>
    </section>
  </div>
</main>

<footer class="footer" style="margin-top:40px">
  <div class="wrap footer__bottom" style="border-top:0;padding-top:28px">
    <span>AquaVita Peças © {date.today().year} · <a href="../index.html">Ver todos os produtos</a> · <a href="../index.html#contato">Contato</a> <button class="cookie-link" id="cookiePrefs" hidden>· Preferências de cookies</button></span>
    <span>CNPJ 00.000.000/0001-00 · Rua Exemplo, 100 — Centro, São Paulo/SP · vendas@aquavitapecas.com.br</span>
  </div>
</footer>

<a class="fab" href="https://wa.me/5511900000000?text=Ol%C3%A1!%20Vim%20pelo%20site." target="_blank" rel="noopener" aria-label="Conversar no WhatsApp">{ic("wa")}</a>

<div class="stickybuy" id="stickyBuy">
  <div><b id="stickyPrice">{brl(p["pix"])}</b><small>no PIX ou boleto</small></div>
  <a class="btn btn--wa" data-buynow data-stickybtn target="_blank" rel="noopener" href="https://wa.me/5511900000000">{ic("wa")} <span>Comprar pelo WhatsApp</span></a>
</div>
<div class="added" id="added" role="status">Adicionado ao carrinho <a class="btn btn--primary" href="../index.html?carrinho=1">Ver carrinho</a></div>

<script>window.PRODUTO = {json.dumps(dados, ensure_ascii=False)};</script>
<script defer src="../assets/js/config.js"></script>
<script defer src="../assets/js/track.js"></script>
<script defer src="../assets/js/produto.js"></script>
</body>
</html>
"""


def main():
    if len(sys.argv) != 2 or not sys.argv[1].startswith("http"):
        sys.exit("Informe o endereço do site. Ex.: python3 tools/build.py https://www.seudominio.com.br")
    base = sys.argv[1].rstrip("/")
    raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src = open(os.path.join(raiz, "assets/js/products.js"), encoding="utf-8").read()
    produtos = json.loads(src[src.index("["): src.rindex("]") + 1])
    detalhes = json.load(open(os.path.join(raiz, "data/detalhes.json"), encoding="utf-8"))
    index = open(os.path.join(raiz, "index.html"), encoding="utf-8").read()
    sprite = re.search(r'<svg width="0" height="0".*?</svg>', index, re.S).group(0)
    for pasta in ("produto", "feed"):
        os.makedirs(os.path.join(raiz, pasta), exist_ok=True)

    # ---------- páginas de produto ----------
    for p in produtos:
        d = detalhes.get(p["id"], {"descricao": "", "resumo": "", "ficha": [], "galeria": []})
        open(os.path.join(raiz, "produto", p["id"] + ".html"), "w", encoding="utf-8").write(page(p, d, produtos, base, sprite))

    # ---------- feeds (uma linha por variação) ----------
    linhas = []
    for p in produtos:
        d = detalhes.get(p["id"], {})
        fotos = d.get("galeria") or [p["img"]]
        descricao = plain(d.get("descricao") or p["name"], 4500)
        itens = p["opcao"]["itens"] if p.get("opcao") else [None]
        for it in itens:
            varia = it is not None and len(itens) > 1
            cheio = it["cheio"] if it else p["cheio"]
            linhas.append({
                "id": (p["id"][:38] + "-" + re.sub(r"[^a-z0-9]+", "", it["valor"].lower())[:10]) if varia else p["id"][:50],
                "group": p["id"][:50],
                "title": (p["name"] + (f' — {it["rotulo"]}' if varia else ""))[:150],
                "description": descricao,
                "link": f'{base}/produto/{p["id"]}.html' + (f'?opcao={it["valor"]}' if varia else ""),
                "image_link": f"{base}/{fotos[0]}",
                "extra_images": [f"{base}/{f}" for f in fotos[1:5]],
                "availability": "in_stock" if (it["estoque"] if it else p["estoque"]) else "out_of_stock",
                "price": cheio, "parcela": r2(cheio / PARCELAS),
                "brand": p["brand"], "product_type": CATS[p["cat"]][1],
            })

    x = html.escape
    itens_xml = []
    for r in linhas:
        extras = "".join(f"\n      <g:additional_image_link>{x(u)}</g:additional_image_link>" for u in r["extra_images"])
        itens_xml.append(f"""    <item>
      <g:id>{x(r['id'])}</g:id>
      <g:item_group_id>{x(r['group'])}</g:item_group_id>
      <g:title>{x(r['title'])}</g:title>
      <g:description>{x(r['description'])}</g:description>
      <g:link>{x(r['link'])}</g:link>
      <g:image_link>{x(r['image_link'])}</g:image_link>{extras}
      <g:availability>{r['availability']}</g:availability>
      <g:price>{r['price']:.2f} BRL</g:price>
      <g:installment><g:months>{PARCELAS}</g:months><g:amount>{r['parcela']:.2f} BRL</g:amount></g:installment>
      <g:brand>{x(r['brand'])}</g:brand>
      <g:condition>new</g:condition>
      <g:product_type>{x(r['product_type'])}</g:product_type>
      <g:identifier_exists>no</g:identifier_exists>
    </item>""")
    open(os.path.join(raiz, "feed/google-merchant.xml"), "w", encoding="utf-8").write(f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>AquaVita Peças</title>
    <link>{x(base)}</link>
    <description>Peças e acessórios para banheiras e spas</description>
{chr(10).join(itens_xml)}
  </channel>
</rss>
""")
    with open(os.path.join(raiz, "feed/meta-catalogo.csv"), "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["id", "item_group_id", "title", "description", "availability", "condition", "price",
                    "link", "image_link", "additional_image_link", "brand", "product_type"])
        for r in linhas:
            w.writerow([r["id"], r["group"], r["title"], r["description"], r["availability"].replace("_", " "), "new",
                        f"{r['price']:.2f} BRL", r["link"], r["image_link"], ",".join(r["extra_images"]),
                        r["brand"], r["product_type"]])

    # ---------- sitemap e robots ----------
    hoje = date.today().isoformat()
    urls = [f"{base}/"] + [f"{base}/?categoria={c}" for c in CATS] + [f"{base}/produto/{p['id']}.html" for p in produtos]
    open(os.path.join(raiz, "sitemap.xml"), "w", encoding="utf-8").write(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(f"  <url><loc>{x(u)}</loc><lastmod>{hoje}</lastmod></url>\n" for u in urls) + "</urlset>\n")
    open(os.path.join(raiz, "robots.txt"), "w", encoding="utf-8").write(f"User-agent: *\nDisallow: /\n\nSitemap: {base}/sitemap.xml\n")

    print(f"{len(produtos)} páginas de produto · {len(linhas)} itens nos feeds · sitemap com {len(urls)} endereços (base: {base})")


if __name__ == "__main__":
    main()
