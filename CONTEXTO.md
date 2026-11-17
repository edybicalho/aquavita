# Site modelo AquaVita Peças — como personalizar para uma loja nova

Este projeto é um modelo demonstrativo para lojas de peças de banheiras e spas. Antes de publicar, personalize:

- Nome e domínio em `index.html`; gere páginas, feeds e sitemap com `python tools/build.py https://dominio`.
- WhatsApp em `assets/js/config.js`, e-mail, endereço e CNPJ em `index.html` e `tools/build.py`.
- Logo em `assets/img/logo.png` e banner em `assets/img/banner2.webp`.
- Troque os depoimentos de exemplo por avaliações reais autorizadas e atualize a foto da loja.
- Atualize o catálogo em `assets/js/products.js` e `data/detalhes.json`, além das imagens correspondentes.
- Rode `python tools/build.py https://dominio`, `node tests/rodar.mjs` e `node tests/celular.mjs`.

As imagens e avaliações presentes são ilustrativas. AquaVita Peças é uma loja fictícia.


Publicação para cliente real: remova a meta `noindex` do `index.html` e do template em `tools/build.py`; no `robots.txt`, volte `Disallow: /` para `Allow: /` antes de publicar.
