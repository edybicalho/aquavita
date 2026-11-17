/* AquaVita Peças — página de produto (HTML gerado por tools/build.py) */
(() => {
  'use strict';
  const P = window.PRODUTO; if (!P) return;
  const CFG = window.LOJA_CONFIG || {}, T = window.LOJA_TRACK;
  const WHATS = CFG.whatsapp || '5511900000000';
  const PARCELAS = 10, PIX_OFF = 0.06;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  // dinheiro: mesmo arredondamento do carrinho (meio centavo sobe, sem ruído do ponto flutuante)
  const r2 = n => Math.round(Number((n * 100).toPrecision(12))) / 100;
  const brl = n => r2(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const wa = msg => `https://wa.me/${WHATS}?text=${encodeURIComponent(msg)}`;
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  /* ---------- Variação escolhida ---------- */
  const itens = P.opcao? P.opcao.itens : [];
  let sel = itens.length === 1? itens[0] : null;
  if (itens.length > 1) {
    const want = new URLSearchParams(location.search).get('opcao') || read('LOJA-opt', {})[P.id];
    sel = itens.find(i => i.valor === want) || null;
  }
  const price = () => sel
? { cheio: sel.cheio, pix: r2(sel.cheio * (1 - PIX_OFF)), parcela: r2(sel.cheio / PARCELAS), estoque: sel.estoque }
    : { cheio: P.cheio, pix: P.pix, parcela: P.parcela, estoque: P.estoque };
  const fullName = () => (sel? `${P.name} — ${sel.rotulo}` : P.name);
  const item = q => ({ item_id: P.id.slice(0, 50), item_name: P.name, item_brand: P.brand, item_category: P.cat, item_variant: sel? sel.rotulo : undefined, price: price().pix, quantity: q });

  let qty = 1;
  function paint() {
    const pr = price(), need = itens.length > 1 && !sel;
    $('#pOld').textContent = brl(pr.cheio);
    $('#pPix').textContent = brl(pr.pix);
    $('#pInst').innerHTML = `ou <b>${PARCELAS}x de ${brl(pr.parcela)}</b> sem juros no cartão`;
    $('#pFrom').hidden = !(P.varia && !sel);
    const st = $('#stock');
    st.textContent = pr.estoque? 'Em estoque' : 'Fora de estoque';
    st.classList.toggle('stock--out', !pr.estoque);
    $('#buyIn').hidden = !pr.estoque; $('#buyOut').hidden = pr.estoque;
    $('#notify').href = wa(`Olá! Quero ser avisado quando chegar: ${fullName()}`);
    $('#ask').href = wa(`Olá! Tenho uma dúvida sobre: ${fullName()}`);
    $$('[data-buynow] span').forEach(s => { s.textContent = need? 'Escolha uma opção' : 'Comprar pelo WhatsApp'; });
    const sb = $('#stickyPrice'); if (sb) sb.textContent = brl(pr.pix);
    $$('[data-stickybtn]').forEach(b => { b.hidden = !pr.estoque; });
  }

  /* ---------- Tema e contador do carrinho ---------- */
  const root = document.documentElement;
  $('#themeBtn').addEventListener('click', () => {
    const t = root.dataset.theme === 'dark'? 'light' : 'dark';
    root.dataset.theme = t; try { localStorage.setItem('LOJA-theme', t); } catch {}
  });
  const count = $('#cartCount');
  function syncCount() {
    const c = read('LOJA-cart', {});
    const n = c && typeof c === 'object'? Object.values(c).reduce((a, b) => a + (Math.floor(Number(b)) > 0? Math.min(Math.floor(Number(b)), 99) : 0), 0) : 0;
    count.textContent = n; count.hidden = n === 0;
  }
  addEventListener('storage', syncCount);

  /* ---------- Galeria ---------- */
  const main = $('#galMain');
  $$('.gal__thumbs button').forEach(b => b.addEventListener('click', () => {
    main.src = b.dataset.src;
    $$('.gal__thumbs button').forEach(x => x.setAttribute('aria-current', String(x === b)));
  }));

  /* ---------- Opções e quantidade ---------- */
  const optBox = $('#opt');
  $$('input[name=opt]').forEach(i => {
    if (sel && i.value === sel.valor) i.checked = true;
    i.addEventListener('change', () => {
      sel = itens.find(x => x.valor === i.value);
      const m = read('LOJA-opt', {}); m[P.id] = sel.valor; write('LOJA-opt', m);
      optBox.classList.remove('is-missing'); $('.opt__label', optBox).textContent = P.opcao.nome;
      paint();
    });
  });
  function needOption() {
    if (itens.length < 2 || sel) return false;
    optBox.classList.add('is-missing');
    $('.opt__label', optBox).textContent = `${P.opcao.nome}: escolha para continuar`;
    optBox.scrollIntoView({ block: 'center', behavior: 'smooth' });
    return true;
  }
  const out = $('#qty');
  $$('[data-q]').forEach(b => b.addEventListener('click', () => {
    qty = Math.max(1, Math.min(99, qty + Number(b.dataset.q))); out.textContent = qty;
  }));

  /* ---------- Adicionar ao carrinho ---------- */
  const added = $('#added');
  let tAdded;
  $$('[data-addcart]').forEach(b => b.addEventListener('click', () => {
    if (needOption()) return;
    if (!price().estoque) return;
    let cart = read('LOJA-cart', {});
    if (!cart || typeof cart !== 'object' || Array.isArray(cart)) cart = {};
    // mesma chave do carrinho da loja: "id|valor" quando há escolha (voltagem, spots, potência)
    const key = itens.length > 1? `${P.id}|${sel.valor}` : P.id;
    const atual = Math.floor(Number(cart[key])) > 0? Math.floor(Number(cart[key])) : 0;
    cart[key] = Math.min(atual + qty, 99);
    write('LOJA-cart', cart); syncCount();
    if (T) T.event('add_to_cart', { value: r2(price().pix * qty), items: [item(qty)] });
    added.classList.add('show');
    clearTimeout(tAdded); tAdded = setTimeout(() => added.classList.remove('show'), 7000);
  }));

  /* ---------- Comprar agora pelo WhatsApp ---------- */
  $$('[data-buynow]').forEach(a => a.addEventListener('click', e => {
    if (needOption()) return e.preventDefault();
    const pr = price(), code = T? T.orderCode() : '', total = r2(pr.pix * qty);
    const msg = `Olá! Quero comprar pelo site${code? ` (código ${code})` : ''}:\n\n• ${qty}x ${fullName()} — ${brl(total)}\n\nTotal no PIX: ${brl(total)}\nou ${PARCELAS}x de ${brl(pr.parcela * qty)} sem juros`;
    a.href = T? T.waUrl(wa(msg)) : wa(msg);
    if (T) {
      const ev = T.event('begin_checkout', { value: total, transaction_id: code, items: [item(qty)] });
      T.hook('pedido', { evento_id: ev.id, codigo: code, valor_pix: total, itens: [item(qty)] });
    }
  }));

  /* ---------- Barra fixa no celular ---------- */
  const sticky = $('#stickyBuy'), cta = $('#buyMain');
  if (sticky && cta && 'IntersectionObserver' in window)
    new IntersectionObserver(([en]) => sticky.classList.toggle('show', !en.isIntersecting && en.boundingClientRect.top < 0)).observe(cta);

  /* ---------- Compartilhar ---------- */
  const share = $('#shareBtn');
  if (share) share.addEventListener('click', async () => {
    const data = { title: P.name, text: `${P.name} — ${brl(price().pix)} no PIX`, url: location.href.split(/[?#]/)[0] };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(data.url); $('span', share).textContent = 'Link copiado'; }
      if (T) T.event('share', { item_id: P.id.slice(0, 50) });
    } catch {}
  });

  paint(); syncCount();
  if (T) T.event('view_item', { value: price().pix, items: [item(1)] });
})();
