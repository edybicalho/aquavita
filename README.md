# AquaVita Peças — site

Site estático (HTML, CSS e JavaScript puro). Pode ser hospedado em qualquer servidor de arquivos. A página inicial é o `index.html`; cada produto tem a sua página em `produto/`.

Duas coisas concentram quase toda a manutenção:

- **`assets/js/config.js`** — liga as integrações (Google, Meta, WhatsApp, IA). Campo vazio = recurso desligado, nada externo é carregado.
- **`assets/js/products.js`** — preço, estoque e variações de todos os produtos. Depois de editar, rode o gerador:

```bash
python3 tools/miniaturas.py          # só se trocou ou acrescentou fotos (precisa do Pillow: pip install pillow)
python3 tools/build.py https://www.seudominio.com.br
```

As miniaturas da galeria (160 px, `assets/img/produtos/mini/`) deixam cada página de produto ~200 KB mais leve. Sem elas, o gerador usa a foto inteira.

**Domínio:** o `index.html` traz o endereço `https://aquavitapecas.com.br` em `canonical`, `og:url`, `og:image` e no JSON-LD (linhas do topo). Se o domínio final for outro, troque ali também.

O gerador recria as páginas de produto, os feeds do Google e da Meta, o `sitemap.xml` e o `robots.txt`. **Rode-o com o endereço definitivo do site antes de publicar** (os arquivos entregues foram gerados com `https://aquavitapecas.com.br`).

## Página inicial: experiência de rolagem (scroll-craft)

A home abre com uma experiência construída com o [scroll-craft](https://github.com/nateherkai/scroll-craft) (licença MIT):

1. **A banheira que se desmonta.** Fotos geradas por IA (kie.ai) da mesma banheira de hidromassagem: montada e desmontada. A desmontada foi separada em **camadas** (`assets/img/xp/camadas/`): um fundo só com o casco (`fundo-*.webp`) e um recorte por peça. Na rolagem, a foto montada some e as 10 peças saem de dentro da banheira, uma depois da outra, girando até o seu lugar; depois flutuam de leve. No peça por peça, a peça da vez sobe com um halo de luz e o resto da cena escurece. A rolagem troca uma pela outra e depois percorre as peças uma por vez: a câmera aproxima da peça da vez e, na lista ao lado, aparecem nome, descrição e link. Na vista desmontada, antes do close, cada peça tem um marcador numerado. Clicar numa peça (na foto ou na lista) leva até ela. As fotos levam a etiqueta "Imagem ilustrativa".
2. **As linhas.** Um trilho lateral com as quatro linhas (marcas, faixa e preço de entrada), que filtra o catálogo.
3. **A loja.** Foto da loja física, avaliações e endereço.

Depois disso a página continua como loja (assistente, catálogo, contato).

- **Anúncios não passam por ela.** Quem chega por `/?categoria=`, `/?marca=`, `/?busca=` ou por uma página de produto não carrega a experiência.
- **Arquivos:** marcação no `index.html` (bloco `#xp`), `assets/css/xp.css`, `assets/js/xp.js`, `assets/js/banheira.js`, imagens em `assets/img/xp/`. O motor fica em `assets/vendor/scrollcraft/` e **não deve ser editado**.
- **Acrescentar uma peça à banheira** (em `index.html`, ato `#banheira`): copie um `<li data-part="...">` da lista `.tub-list` e ajuste o nome, o texto, o link e a posição da peça na foto desmontada (`data-x`, `data-y`, em porcentagem da largura e da altura da foto). A ordem da lista é a ordem do destaque; a numeração e a contagem são automáticas. `data-zoom` define o quanto a câmera aproxima daquela peça (perto de 4 para peças pequenas, 2 para as médias, 1.35 para o casco); a partir de 3, uma mira circular marca a peça. Uma peça que **não aparece na foto** pode entrar na lista, mas o marcador ficaria sobre outra coisa: para ela aparecer, é preciso gerar uma nova foto desmontada que a inclua.
- **A janela de cada peça** é montada a partir do mesmo `<li>`: o texto do `<p>`, a dica de compra em `data-dica` e, quando a peça tem produtos no catálogo, `data-cat` (`motobombas`, `aquecedores`, `controladores` ou `kits`). Com `data-cat`, a janela mostra sozinha os três modelos mais em conta em estoque (com preço e link para a página do produto) e o botão que abre o catálogo filtrado. Sem `data-cat`, o botão vira "Pedir pelo WhatsApp". As setas da janela e as setas do teclado passam de uma peça para outra.
- **Camadas das peças:** cada `<div class="tubp-part">` dentro de `#tubParts` tem a posição do recorte em porcentagem da foto (`left`, `top`, `width`, `data-h`) e a rotação de saída (`data-rot`); o `data-part` casa com o `<li data-part>` da lista. Posições e tamanhos estão em `camadas/camadas.json`. Para **trocar a foto de uma peça**, substitua o `.webp` dela por outro recorte com fundo transparente, do mesmo tamanho (ou ajuste `width`/`data-h`). Os recortes foram feitos por script a partir da foto desmontada; a bomba e o ralo têm pequenas imperfeições que só aparecem bem de perto. A **tubulação** foi refeita em 15/11 com IA (kie.ai, modelo `google/nano-banana-edit`, 4 créditos): a foto antiga dos canos foi enviada como referência e a IA devolveu os mesmos canos, inteiros, em fundo branco; o recorte e a cor foram ajustados para a cena. Ela é guardada com o dobro da resolução (`escala: 2` no `camadas.json`), para ficar nítida na aproximação.
- **Gerar ou refazer as fotos:** os pedidos usados estão em `pasta de trabalho local` (`preamble.txt`, `p1.txt` a `p3.txt`); cada foto custa cerca de 28 créditos da kie.ai pela tabela. Ao trocar a foto desmontada, as posições `data-x`/`data-y` precisam ser conferidas de novo.
- **Trocar as fotos por um vídeo** (quando houver créditos): o vídeo da montada para a desmontada entra no lugar das duas `<img class="tubp-img">`, como `<video data-sc-scrub data-sc-src="...">` do scroll-craft; os marcadores e a lista continuam iguais.
- **Os números do bloco `#xp` são escritos à mão** (preços de entrada, contagem de modelos). Ao mudar preço ou catálogo, atualize-os também: eles não são gerados pelo `tools/build.py`.
- Com "reduzir movimento" ativado no aparelho, a banheira troca de montada para desmontada sem animação. Sem JavaScript, os textos aparecem empilhados.

## Estrutura

| Caminho | O que é |
|---|---|
| `index.html` | Loja: catálogo, assistente, comparador, carrinho |
| `produto/<id>.html` | Uma página por produto (**gerada**, não edite à mão) |
| `assets/js/config.js` | Configuração das integrações |
| `assets/js/products.js` | Catálogo: preço, estoque, variações |
| `data/detalhes.json` | Descrição, ficha técnica e fotos de cada produto |
| `assets/js/app.js` | Catálogo, filtros, carrinho, visualização rápida |
| `assets/js/extras.js` | Assistente "Encontre sua peça", comparador, tema, animações |
| `assets/js/plus.js` | Busca (lista de sugestões, buscas recentes, mais procurados), favoritos, páginas de destino, barra inferior |
| `assets/js/micro.js` + `assets/css/micro.css` | Microanimações da loja: foto voa até o carrinho, botão "Adicionado", número do carrinho, preço que sobe, faíscas no favorito, onda nos botões (só na página inicial; respeita "reduzir movimento") |
| `assets/js/produto.js` | Comportamento da página de produto |
| `assets/css/xp.css`, `assets/js/xp.js`, `assets/vendor/scrollcraft/` | Experiência de rolagem da página inicial e o motor scroll-craft |
| `assets/js/track.js` | Medição, consentimento LGPD, atribuição, webhooks |
| `assets/js/ia.js` + `server/ia-proxy.mjs` | Chat de IA e o servidor dele |
| `tools/build.py` | Gerador (páginas de produto, feeds, sitemap) |
| `feed/`, `sitemap.xml`, `robots.txt` | **Gerados** |

## 1. Campanhas no Google e na Meta

### Passo a passo para ligar

1. Em `config.js`, bloco `tracking`, preencha **ou** `gtmId` (Google Tag Manager, recomendado) **ou** `ga4Id` + `googleAdsId` + `metaPixelId`.
2. Sem GTM, preencha também `googleAdsLabels.checkout` e `googleAdsLabels.whatsapp` com os rótulos das ações de conversão criadas no Google Ads.
3. Rode `python3 tools/build.py https://www.seudominio.com.br` e publique.
4. No Merchant Center, cadastre o feed `https://www.seudominio.com.br/feed/google-merchant.xml`. No Gerenciador de Comércio da Meta, cadastre `…/feed/meta-catalogo.csv`.
5. Abra o site com `?debug-track=1` e confira os eventos no console do navegador.

### Eventos enviados

| Evento (GA4) | Meta Pixel | Quando |
|---|---|---|
| `view_item_list` | — | lista de produtos exibida |
| `search` | `Search` | busca no catálogo |
| `view_item` | `ViewContent` | página de produto ou visualização rápida |
| `add_to_cart` / `remove_from_cart` | `AddToCart` | carrinho |
| `add_to_wishlist` | `AddToWishlist` | favorito |
| `begin_checkout` | `InitiateCheckout` | "Finalizar pelo WhatsApp" e "Comprar pelo WhatsApp" (leva o código do pedido em `transaction_id` e o valor) |
| `generate_lead` | `Contact` | qualquer outro clique para o WhatsApp (parâmetro `local` diz de onde) |
| `assistente_concluido`, `share`, `ia_aberta`, `ia_mensagem` | evento personalizado | uso dos recursos |

O `item_id` enviado nos eventos é o mesmo `item_group_id` dos feeds, para os anúncios de catálogo e o remarketing dinâmico casarem com o que a pessoa viu.

### O que usar como conversão

A venda fecha no WhatsApp, então o site mede a **intenção de compra**, não o pagamento:

- **Conversão principal:** `begin_checkout` (com valor). É o sinal mais próximo da venda.
- **Conversão secundária:** `generate_lead` (conversas iniciadas).
- **Venda real:** cada pedido leva um código (`PED-XXXXX`) na mensagem do cliente. Registre os pedidos pagos com esse código e importe como conversão offline no Google Ads e na Meta (ou envie pela API de Conversões a partir do webhook `pedido`). Sem isso, as campanhas otimizam para conversa, não para venda.

### Páginas de destino

| Endereço | Uso |
|---|---|
| `/produto/<id>.html` | anúncio de um produto, Shopping, catálogo da Meta |
| `/produto/<id>.html?opcao=<valor>` | abre o produto já na variação (voltagem, spots, potência) |
| `/?categoria=kits` (`motobombas`, `aquecedores`, `controladores`) | anúncio de categoria: abre direto nos produtos, com título próprio |
| `/?marca=Syllent` · `/?busca=1/2 cv` | anúncio por marca ou termo |

Nas páginas de destino o topo institucional é trocado por um título que repete a promessa do anúncio, e os produtos aparecem logo abaixo. `utm_*`, `gclid`, `gbraid`, `wbraid` e `fbclid` são preservados no endereço e guardados durante a visita. Com `attribution.appendToWhatsApp: true`, a origem vai no fim da mensagem de WhatsApp (ex.: `[ref: google · cpc · kits-verao]`).

### Feeds

`feed/google-merchant.xml` e `feed/meta-catalogo.csv` têm uma linha por variação (78 itens para 30 produtos), agrupadas por `item_group_id`, com preço e estoque de cada uma. O preço do feed e do dado estruturado da página é o **valor cheio** (cartão em 10x sem juros, informado em `installment`); o desconto do PIX não entra porque depende da forma de pagamento.

**Atenção — Google Shopping:** o Merchant Center exige que o comprador consiga concluir a compra no site (carrinho e pagamento online). Como o fechamento aqui é pelo WhatsApp, os produtos podem ser reprovados no Shopping/Performance Max com feed. Campanhas de Pesquisa, Display, Demand Gen e todas as da Meta (inclusive catálogo e clique para WhatsApp) não têm essa exigência. Para liberar o Shopping, o caminho é ligar o botão de compra ao checkout da loja (WooCommerce).

### Consentimento (LGPD)

Com `requireConsent: true` (padrão), nenhuma tag é carregada antes de o visitante aceitar. O banner aparece quando há algum ID configurado, com "Aceitar todos", "Só o essencial" e "Personalizar"; o rodapé ganha o link "Preferências de cookies". O site usa o Consent Mode v2 do Google. O texto do banner e a política de privacidade devem ser revisados por quem responde pela LGPD na empresa.

## 2. WhatsApp

Funciona sem servidor:

- **Pedido completo pelo carrinho:** a mensagem leva cada produto numerado, com quantidade, opção escolhida, preço no PIX (e o unitário quando há mais de um), o total no cartão e no PIX, a forma de pagamento preferida, o CEP com a cidade e o nome. O total da forma escolhida vai em negrito. Pagamento, CEP e nome são **opcionais** e ficam guardados só no navegador do visitante (`LOJA-pedido`). A cidade vem do **ViaCEP** (`viacep.com.br`, gratuito, sem chave); se ele não responder, a mensagem segue só com o CEP. Código em `app.js` (`pedMsg`, `pedLink`).

- Mensagem pronta em todos os botões (pedido, compra direta, dúvida, "avise-me", resultado do assistente).
- Cada pedido leva **código**, **variação escolhida**, **valor** e **origem** do visitante.
- O número é trocado em um só lugar: `whatsapp` em `config.js`.

Para recursos da **API oficial do WhatsApp Business** (resposta automática, recuperação de carrinho, catálogo, mensagens de modelo) é preciso uma conta no WhatsApp Business Platform e um servidor ou ferramenta de automação (n8n, Make, ou um provedor). O site já entrega os dados: preencha `webhooks.pedido` e `webhooks.lead` e ele envia um `POST` com este JSON:

```json
{
  "tipo": "pedido",
  "evento_id": "m3x9k2-ab12cd",
  "codigo": "PED-4QKGL",
  "valor_pix": 419.18,
  "itens": [{ "item_id": "...", "item_name": "...", "item_variant": "220 V", "price": 419.18, "quantity": 1 }],
  "atribuicao": { "utm_source": "google", "utm_campaign": "kits-verao", "gclid": "..." },
  "pagina": "https://...",
  "consentimento": { "analytics": true, "ads": true },
  "enviado_em": "2026-11-10T12:00:00.000Z"
}
```

O corpo é enviado como `text/plain` (para não exigir configuração de CORS); faça o `JSON.parse` no servidor. O `evento_id` é o mesmo enviado ao Pixel, o que permite deduplicar com a **API de Conversões da Meta**. Respeite o campo `consentimento` antes de usar os dados para anúncios. O site não coleta o telefone do cliente: ele só chega quando a pessoa envia a mensagem.

## 3. Chat de IA

Só aparece na loja quando `ai.endpoint` está preenchido (ou `ai.demo: true`, que mostra a janela com uma busca simples no catálogo, identificada como demonstração).

```bash
cd server
npm install
ANTHROPIC_API_KEY=sua-chave ALLOWED_ORIGIN=https://www.seudominio.com.br node ia-proxy.mjs
```

Depois, em `config.js`: `ai.endpoint: 'https://seu-servidor/api/chat'`.

- A chave da API fica **só no servidor**. Nunca a coloque em `config.js`.
- O servidor lê `assets/js/products.js`, então a IA responde com os mesmos produtos e preços do site.
- Proteções: origem permitida (`ALLOWED_ORIGIN`; sem ela, só aceita pedidos de `localhost`), 30 mensagens por IP a cada 10 minutos, tamanho máximo de mensagem, 40 s de limite por resposta da API e um teto diário para o site inteiro (`LIMITE_DIA`, padrão 1500 perguntas/fotos por dia; passou disso, o chat responde "ocupado" até o dia seguinte), para proteger os créditos da API. Atrás de um proxy (Nginx, Cloudflare, Render), defina `TRUST_PROXY=1` para o limite por IP usar o endereço real do visitante; sem proxy, deixe desligado (o cabeçalho `X-Forwarded-For` pode ser inventado).
- Modelo: `claude-opus-5-5` por padrão; troque com a variável `IA_MODEL` (um modelo menor custa menos por conversa).
- As instruções da IA estão na constante `SYSTEM` de `server/ia-proxy.mjs`.
- Precisa de hospedagem com Node 20+; hospedagem só de arquivos não serve para esta parte.

## Fotografe sua peça (identificação por foto com IA)

Seção `#foto` da página inicial (depois do assistente). O visitante tira ou escolhe uma foto da peça antiga (de preferência a etiqueta); a IA lê tipo, marca, modelo, código, potência e tensão, diz o que não deu para ler, e sugere até 3 produtos do catálogo, cada um com o motivo. Daí a pessoa adiciona ao carrinho (se a tensão foi lida, a variação 110/220 V já vem escolhida) ou confirma com um consultor no WhatsApp, com a leitura já escrita na mensagem.

- **Arquivos:** `assets/js/foto.js`, `assets/css/foto.css`, fotos de exemplo em `assets/img/foto/`, rota `POST /api/identificar` em `server/ia-proxy.mjs`.
- **Como ligar:** o mesmo servidor do chat (veja "Chat de IA"). Em `config.js`, `ai.endpoint` preenchido já liga a foto (troca `/api/chat` por `/api/identificar`); `ai.foto` permite outro endereço. Sem servidor, a seção funciona em **modo demonstração**: os três exemplos (motobomba, painel, sensor) mostram respostas prontas, marcadas como demonstração, e uma foto enviada pelo visitante é encaminhada para o WhatsApp.
- **Como funciona por dentro:** o navegador reduz a foto para ~1024 px (JPEG) antes de enviar. O servidor manda a foto ao Claude com o catálogo (`products.js` + dados técnicos de `tecnico.js`) e exige a resposta num formato fixo (JSON com lista fechada de ids do catálogo, então a IA não consegue inventar produto). O servidor ainda filtra ids repetidos e limita a 3. A foto não é gravada em lugar nenhum.
- **Cuidados:** a leitura nunca é tratada como certeza: a tela sempre diz "um consultor confirma antes da compra". Há caixa de consentimento (LGPD) antes do envio; a foto vai para a API da Anthropic (transferência internacional), então o texto de privacidade da loja deve citar isso. Confirme com quem responde pela LGPD.
- **Custo:** com o modelo padrão do servidor (`IA_MODEL`, hoje `claude-opus-5-5`), cerca de US$ 0,02 a 0,03 por foto. Um modelo menor (ex.: `IA_MODEL=claude-haiku-5-5`) custa muito menos por foto, mas lê etiquetas difíceis com menos precisão; vale testar com fotos reais da loja antes de trocar.
- **Testado** com uma API simulada (formato do pedido, imagem, catálogo, filtro de ids, erros) e no navegador (exemplos, consentimento, carrinho com 220 V). **Ainda falta testar com a chave real** e com fotos de etiquetas de verdade.
- Evento de medição: `foto_identificar` (modo `exemplo` ou `ia`).

## Diagnóstico guiado "Minha hidro não liga"

Seção `#diag` (depois da foto da peça). A pessoa responde perguntas de sim/não e chega a um resultado com: causa provável, o que fazer em passos, selo "Você mesmo pode verificar" ou "Chame um eletricista ou técnico", as peças do catálogo que costumam resolver, link para o catálogo filtrado, atalho para "Fotografe sua peça" e WhatsApp com todas as respostas escritas. Cobre: não liga, códigos E1–E4 (painéis Sanspray), não esquenta, barulho ou jato fraco, disjuntor desarmando e luz que não acende — 38 telas, 70 caminhos, no máximo 7 cliques.

- **Arquivos:** perguntas e resultados em `assets/js/diag-arvore.js` (editável, com o formato explicado no topo); tela em `assets/js/diag.js`; estilo em `assets/css/diag.css`.
- **Fontes:** manuais Sanspray Line Clean (p. 5, 6, 9–17), Syllent Geração II e Super Syllent (p. 2, 4–8), Komeco Aquajet (p. 7–11), da pasta `pesquisa/manuais`, mais pesquisa na internet (16/11/2026). As páginas estão citadas nos comentários do arquivo.
- **Regras de segurança do conteúdo:** o cliente só faz verificações seguras (nível de água, olhar a alavanca do disjuntor, religar uma vez só, ajustar temperatura, rearme do termostato com o disjuntor desligado, como manda o manual Sanspray). Tudo que envolve abrir partes elétricas ou a motobomba é marcado como trabalho de técnico. Peças fora do site (capacitor, acionador, sensor, refletor) mandam consultar a loja, sem prometer estoque.
- **Links para anúncio e posts:** `/?diagnostico=1` abre direto no diagnóstico. Os sintomas ao lado do quadro também são atalhos.
- **Teste automático** de todos os caminhos (estrutura, cliques no computador e no celular, voltar, largura da tela) — roteiro em `scratchpad` da conversa de 16/11; resultado: 70/70 aprovados.
- Evento de medição: `diagnostico` (com o resultado e o número de passos).
- **Revisar com o cliente:** os textos dos resultados e se a loja tem capacitor, acionador, sensor de nível e refletores para indicar no site.

## Faixa de prova social

Logo depois da experiencia da banheira e nas paginas de anuncio aparece uma mensagem sobre avaliacoes da loja e depoimentos ficticios claramente marcados como exemplo. Substitua-os por avaliacoes reais autorizadas ao personalizar o modelo.

## Busca

A busca do topo filtra o catálogo **enquanto a pessoa digita** e mostra sugestões com foto e preço. O motor fica em `assets/js/app.js` (`matches`, `score`, `rank`, `correct`) e é o mesmo para a lista de sugestões, o catálogo e o chat de IA de demonstração.

- **Erros de digitação:** "motobonba", "aqecedor", "syllnet" e "komeko" encontram o produto certo e mostram "Você quis dizer …?".
- **Sinônimos:** lista `SINONIMOS` em `app.js` (bomba = motobomba, painel = controlador, luz/led = cromoterapia…). Palavras que não filtram nada (hidro, spa, banheira…) ficam em `RUIDO`. Edite as duas listas para ensinar palavras novas.
- **Medidas:** 1/2 = meio = 0,5; "220v" = 220 V; produtos 110 e 220 V também aparecem em "bivolt".
- **Buscas recentes** ficam no navegador do visitante (`LOJA-buscas`); os **mais procurados** são uma lista fixa em `plus.js`.
- Números precisam ser exatos ("221" não acha 220). A ficha técnica de `data/detalhes.json` ainda não entra na busca.

## 4. Manutenção do catálogo

- **Mudar preço ou estoque:** edite `cheio`/`pix`/`parcela`/`estoque` em `assets/js/products.js` (e os `itens` de `opcao`, quando houver variações) e rode `tools/build.py`. Regra usada: `pix = cheio × 0,94` e `parcela = cheio ÷ 10`.
- **Novo produto:** acrescente o item em `products.js`, a descrição/ficha/fotos em `data/detalhes.json` (mesma chave `id`), as imagens em `assets/img/produtos/` e rode `tools/build.py`.
- **Mudar cabeçalho, rodapé ou textos da página de produto:** edite o modelo dentro de `tools/build.py` e rode-o.

Os preços, estoques, descrições e fotos atuais foram copiados do site da loja em 10/11/2026 e **não se atualizam sozinhos**.

## 5. Como estender

- `LOJA_TRACK.on(e => { ... })` recebe todo evento (`e.name`, `e.params`); `LOJA_TRACK.event('nome', { ... })` registra um evento próprio.
- Eventos do documento na loja: `LOJA:add`, `LOJA:remove`, `LOJA:modal`, `LOJA:fav`, `LOJA:cart`, `LOJA:render`, `LOJA:wizard`.
- `window.LOJA` expõe `add(id)`, `openModal(id)`, `openCart()`, `priceOf(id)`, `state`, `render()`, `byId`, entre outras.

## O que ainda depende de terceiros

| Item | Depende de |
|---|---|
| IDs de GTM/GA4/Google Ads/Pixel | contas de anúncio do cliente |
| Google Shopping aprovado | pagamento online no site (checkout) + domínio verificado no Merchant Center |
| Medir venda paga | rotina de importar pedidos pagos (código `PED-…`) ou API de Conversões |
| Automação de WhatsApp | conta WhatsApp Business Platform + servidor/automação |
| Chat de IA no ar | chave da API + hospedagem Node |
| Preço e estoque sempre atualizados | integração com o sistema da loja (hoje a atualização é manual) |
| Política de troca/devolução e de privacidade | textos da loja |

## Pesquisa de produtos (14/11/2026)

- `pesquisa/<id>.json`: ficha, textos, perguntas frequentes, fontes e conflitos de cada produto, levantados na internet (sites da Syllent, Sanspray e Komeco, manuais, Loja do Mecânico, Mercado Livre). `pesquisa/fotos/` e `pesquisa/manuais/` guardam as fotos e os PDFs originais. **Essa pasta é de trabalho: não suba para o servidor.**
- `tools/aplicar_pesquisa.py` passa a pesquisa para `data/detalhes.json` (sempre a partir de `data/detalhes.orig.json`, o cadastro antigo) e converte as fotos para `assets/img/produtos/<id>-pN.webp`. Depois rode `tools/build.py`.
- Ficaram de fora: as duas motobombas Claw (sem fonte confiável) e o texto do Spamax Home 9 (a única fonte descreve só o painel; confirmar o que é vendido).

## Monte seu sistema e comparativos (14/11/2026)

Duas seções novas na página inicial, logo depois do assistente:

- **Monte seu sistema** (`#monte`): a pessoa escolhe a tensão (127 ou 220 V), quantas motobombas a banheira tem e os recursos que quer. O site mostra os aquecedores e controladores que servem, as motobombas que cada um aceita (confere a corrente da motobomba com o limite da saída do aquecedor, por exemplo 10,9 A nos Sanspray), o fio e o disjuntor DR da instalação, o total no PIX e os botões "Adicionar ao carrinho" e "Confirmar com consultor" (WhatsApp com o sistema montado).
- **Comparativos** (`#comparar`): tabelas de motobombas, aquecedores, controladores e kits, com vazão, pressão, corrente, recursos, fio/DR, garantia e preço.
- **Links para anúncio:** `/?monte=1` e `/?comparar=motobombas` (ou `aquecedores`, `controladores`, `kits`) abrem direto na ferramenta, sem a experiência de rolagem, com título próprio.
- **Arquivos:** `assets/js/tecnico.js` (os números técnicos), `assets/js/sistema.js` e `assets/css/sistema.css`. Preço e estoque continuam vindo de `products.js`.
- **Produto novo:** acrescente-o em `tecnico.js` para que ele entre nas duas ferramentas. `null` = dado não informado (aparece "—" e o site manda confirmar com o consultor).
- Evento `LOJA:sistema` é disparado a cada resposta, para medição.

## Testes (rode depois de mudar preço, produto ou código)

```bash
node tests/rodar.mjs
```

Confere, sem alterar nada: (1) **todos os preços** do `products.js` contra as 30 páginas de produto, o JSON-LD, o feed do Google e o CSV da Meta (614 conferências); (2) o **carrinho** com todas as variações de todos os produtos — preço de cada linha, totais no PIX e no cartão, desconto, parcela e a mensagem do WhatsApp (912 conferências); (3) o **Monte seu sistema** — o total mostrado é o mesmo que o carrinho cobra (88 combinações); (4) **ataques pela URL** (código injetado em `?busca=`, `?produto=` etc. não pode rodar). Precisa do Node 22+ e do Google Chrome. Termina com `RESULTADO: TUDO CERTO` ou aponta o problema.

O teste de preços também confere os números escritos à mão na página inicial (preço "A partir de" e "Ver os N modelos" de cada linha): se um preço mudar e o `index.html` ficar para trás, ele avisa.

**Celular:** `node tests/celular.mjs` abre o início, uma página de anúncio e uma de produto em quatro aparelhos simulados (iPhone SE, iPhone 14, Android pequeno e grande) e aponta rolagem para o lado, itens vazando, botões pequenos para o dedo e letra miúda. Os ajustes de toque ficam em `assets/css/toque.css` (só valem em tela de toque). Não substitui abrir num celular de verdade, principalmente no Safari do iPhone.

**Publicação:** o `.htaccess` liga a compressão (texto ~70% menor), o cache de fotos e fontes e cabeçalhos de segurança, em hospedagens Apache/LiteSpeed (a maioria). Depois que o HTTPS estiver ativo, descomente a linha `Strict-Transport-Security`. Ele também bloqueia o acesso às pastas internas (`tools/`, `tests/`, `server/`).

**Título das páginas de anúncio por categoria:** o texto existe em dois lugares (o `LP` do `plus.js` e um script pequeno logo depois de `#lpSub` no `index.html`, que faz o título aparecer na hora). Ao mudar, mude nos dois.

O servidor do chat de IA tem teste próprio: `tests/servidor-ia.mjs` (instruções no topo do arquivo).

**Carrinho:** cada linha é produto + variação (chave `id` ou `id|valor` no `localStorage` `LOJA-cart`). O preço vem sempre da linha, então trocar a voltagem ou os spots na tela não altera o que já está no carrinho. Quantidades fora de 1–99 e itens que não existem mais no catálogo são descartados ao abrir o site. Todo valor em dinheiro passa pelo mesmo arredondamento (`r2`: meio centavo sobe), no site, na página de produto e no gerador.

