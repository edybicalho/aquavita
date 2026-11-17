(() => {
  'use strict';

  const CFG = window.LOJA_CONFIG || {};
  const T = window.LOJA_TRACK || null;
  const WHATS = CFG.whatsapp || '5511900000000';
  const PARCELAS = 10, PIX_OFF = 0.06;
  const CATS = [
    { id: '', label: 'Todos' },
    { id: 'motobombas', label: 'Motobombas' },
    { id: 'aquecedores', label: 'Aquecedores' },
    { id: 'controladores', label: 'Controladores' },
    { id: 'kits', label: 'Kits' },
  ];
  const PRODUTOS = window.PRODUTOS || [];
  const byId = Object.assign(Object.create(null), Object.fromEntries(PRODUTOS.map(p => [p.id, p]))); // sem herança: ?produto=constructor não engana

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
// dinheiro: arredonda centavos meio-para-cima, sem o ruído do ponto flutuante (145,345 vira 145,35, nunca 145,34)
  const r2 = n => Math.round(Number((n * 100).toPrecision(12))) / 100;
  const brl = n => r2(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const cheio = p => p.cheio || r2(p.parcela * PARCELAS);
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const wa = msg => `https://wa.me/${WHATS}?text=${encodeURIComponent(msg)}`;
  const icon = id => `<svg class="ic"><use href="#i-${id}"/></svg>`;
  const urlOf = p => `produto/${p.id}.html`;
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } };
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  /* ---------- Variações (voltagem, spots, potência) ---------- */
  let opt = load('LOJA-opt', {});            // { idDoProduto: valorEscolhido }
  const multi = p => !!(p.opcao && p.opcao.itens.length > 1);
  function variantOf(p) {
    if (!p.opcao) return null;
    if (p.opcao.itens.length === 1) return p.opcao.itens[0];
    return p.opcao.itens.find(i => i.valor === opt[p.id]) || null;
  }
  // Preço do produto na variação escolhida (ou o menor preço, quando nada foi escolhido)
  function priceOf(p, v = variantOf(p)) {
    if (!v) return { cheio: cheio(p), pix: p.pix, parcela: p.parcela, rotulo: '', estoque: p.estoque };
    return { cheio: v.cheio, pix: r2(v.cheio * (1 - PIX_OFF)), parcela: r2(v.cheio / PARCELAS), rotulo: v.rotulo, estoque: v.estoque };
  }
  const fullName = p => { const v = variantOf(p); return v? `${p.name} — ${v.rotulo}` : p.name; };

  /* ---------- Estado ---------- */
  const state = { cat: '', brand: '', sort: 'rel', q: '', fav: false };
  let favs = new Set([].concat(load('LOJA-favs', [])).filter(id => byId[id]));
  const saveFavs = () => store('LOJA-favs', [...favs]);

  /* ---------- Busca inteligente ---------- */
  // Vocabulário da loja: palavras do mesmo grupo valem a mesma coisa na busca
  // ("bomba" acha as motobombas, "led" acha os produtos com pontos de luz).
  // Pode editar à vontade; acento e maiúsculas não importam. Frações e números
  // (1/2 = 0,5 = 0.5; 1 = 1.0; 220v = 220 V) já são entendidos sozinhos.
  const SINONIMOS = [
    ['motobomba', 'bomba', 'motor'],
    ['aquecedor', 'aquecimento', 'aquecer', 'resistência'],
    ['controlador', 'painel', 'comando', 'controle', 'central', 'automação'],
    ['cromoterapia', 'cromo', 'luz', 'led', 'spot', 'iluminação', 'lâmpada'],
    ['kit', 'conjunto', 'combo'],
    ['syllent', 'silent'],
    ['1/2', 'meio'],
    ['110', '127'],
  ];
  // Palavras que não filtram nada: o catálogo inteiro é de hidro, spa e banheira
  const RUIDO = ['hidro', 'hidromassagem', 'spa', 'banheira', 'jacuzzi', 'ofuro',
    'de', 'da', 'do', 'das', 'dos', 'para', 'pra', 'com', 'e', 'a', 'o', 'as', 'os', 'em', 'no', 'na'];

  const CAT_LABEL = Object.fromEntries(CATS.map(c => [c.id, c.label]));
  // Texto canônico: sem acento, 0,5 → 0.5, 8.000 → 8000, 220v / 8000 W → número
  const canon = s => norm(String(s)).replace(/(\d),(\d)/g, '$1.$2').replace(/(\d)\.(\d{3})(?!\d)/g, '$1$2')
    .replace(/(\d)\s*(?:v|w|volts?|watts?)\b/g, '$1 ');
  // Plural simples: bombas → bomba, aquecedores → aquecedor, funções → funcao
  const stem = w => w.length > 3 && !/\d/.test(w)? w.replace(/oes$/, 'ao').replace(/([rzl])es$/, '$1').replace(/s$/, '') : w;
  const num = w => { const m = /^(\d+(?:\.\d+)?)(?:\/(\d+))?$/.exec(w); return m? (m[2]? m[1] / m[2] : +m[1]) : NaN; };
  // Palavras de um texto; "lspa1100" também vira "lspa" e "1100"
  function wordsOf(txt, split = true) {
    const out = [];
    (canon(txt).match(/[a-z0-9]+(?:[./][0-9]+)*/g) || []).forEach(w => {
      out.push(stem(w));
      const m = split && /^([a-z]+)(\d+)$|^(\d+)([a-z]+)$/.exec(w);
      if (m) out.push(...m.slice(1).filter(Boolean).map(stem));
    });
    return out;
  }
  const RUIDO_SET = new Set(RUIDO.map(w => stem(canon(w))));
  const SYN = new Map(), DISP = new Map(), OFICIAL = new Map(); // sinônimos · como mostrar · termo oficial do grupo
  SINONIMOS.forEach(g => {
    const ws = g.map(w => wordsOf(w, false).join(' '));
    ws.forEach(w => OFICIAL.has(w) || OFICIAL.set(w, ws[0]));
    ws.forEach(w => SYN.set(w, [...new Set([...(SYN.get(w) || []), ...ws])].filter(x => x !== w)));
  });

  // Índice de cada produto: palavra → peso (nome e marca 3, categoria 3, variações e ficha 2)
  function idx(p) {
    if (p._idx) return p._idx;
    const f = [[p.name, 3], [p.brand, 3], [CAT_LABEL[p.cat] || '', 3], [p.cat || '', 3]];
    if (p.opcao) f.push([p.opcao.nome, 2], ...p.opcao.itens.map(i => [`${i.rotulo} ${i.valor}`, 2]));
    const ficha = p.specs || p.ficha || p.spec; // ficha técnica, se um dia vier no objeto do produto
    if (ficha) f.push([typeof ficha === 'string'? ficha : (Array.isArray(ficha)? ficha : Object.entries(ficha)).flat(2).join(' '), 2]);
    const volts = p.opcao? canon(p.opcao.itens.map(i => i.rotulo).join(' ')) : '';
    if (/\b(110|127)\b/.test(volts) && /\b220\b/.test(volts)) f.push(['bivolt', 2]);
    const m = new Map();
    f.forEach(([txt, wt]) => wordsOf(txt).forEach(w => m.set(w, Math.max(m.get(w) || 0, wt))));
    return (p._idx = { words: [...m].map(([w, wt]) => ({ w, wt, n: num(w) })), cat: stem(canon(p.cat || '')), len: wordsOf(p.name).length });
  }

  // Vocabulário do catálogo (para corrigir erros de digitação) e a forma de exibir cada palavra
  const VOC = new Map();
  [...PRODUTOS, ...CATS.map(c => ({ name: c.label, brand: '', cat: c.id }))].forEach(p =>
    idx(p).words.forEach(({ w }) => VOC.set(w, (VOC.get(w) || 0) + 1)));
  SYN.forEach((_, w) => VOC.set(w, (VOC.get(w) || 0) + 1));
  const marcas = new Set(PRODUTOS.map(p => p.brand));
  [...PRODUTOS.map(p => `${p.name} ${p.brand}`), ...CATS.map(c => c.label), ...SINONIMOS.flat()].forEach(txt =>
    txt.split(/[^\p{L}\p{N}]+/u).forEach(o => {
      const w = wordsOf(o, false)[0];
      if (w && !/\d/.test(w) && !DISP.has(w)) DISP.set(w, marcas.has(o)? o : o.toLowerCase());
    }));
  const VOC_ALFA = [...VOC.keys()].filter(w => w.length >= 3 && !/\d/.test(w));

  // Distância de Damerau-Levenshtein (com troca de letras vizinhas); para cedo acima de max
  function dl(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let k = 1; k <= b.length; k++) d[0][k] = k;
    for (let i = 1; i <= a.length; i++) {
      let best = Infinity;
      for (let k = 1; k <= b.length; k++) {
        const c = a[i - 1] === b[k - 1]? 0 : 1;
        d[i][k] = Math.min(d[i - 1][k] + 1, d[i][k - 1] + 1, d[i - 1][k - 1] + c);
        if (i > 1 && k > 1 && a[i - 1] === b[k - 2] && a[i - 2] === b[k - 1]) d[i][k] = Math.min(d[i][k], d[i - 2][k - 2] + 1);
        best = Math.min(best, d[i][k]);
      }
      if (best > max) return max + 1;
    }
    return d[a.length][b.length];
  }
  const tolOf = t => t.length >= 7? 2 : t.length >= 4? 1 : 0;

  // Uma palavra da busca bate direto (igual, começo, pedaço, número igual) com esta palavra do catálogo?
  function direct(tk, e) {
    if (e.w === tk.t || tk.syn.includes(e.w)) return 4;
    if (!isNaN(tk.n)) return tk.n === e.n? 4 : tk.last && e.w.startsWith(tk.t)? 2 : 0;
    if (e.w.startsWith(tk.t) && (tk.t.length >= 3 || tk.last)) return 3;
    if (tk.t.length >= 3 && e.w.includes(tk.t)) return 2;
    return 0;
  }
  // Prepara cada palavra da busca; quando ela não existe no catálogo, procura a mais parecida
  // Palavra do catálogo mais parecida: lim = erros na palavra inteira; pre = erros no começo dela
  // (para a palavra que ainda está sendo digitada). No empate, a palavra mais comum no catálogo.
  function near(t, lim, pre) {
    let b = null;
    for (const w of VOC_ALFA) {
      let d = lim? dl(t, w, lim) : Infinity;
      if (d > lim) {
        const pd = pre && w.length > t.length? Math.min(...[-1, 0, 1].map(k => dl(t, w.slice(0, t.length + k), pre))) : Infinity;
        d = pd <= pre? pd + 0.5 : Infinity;
      }
      if (d < Infinity && (!b || d < b.d || (d === b.d && VOC.get(w) > VOC.get(b.w)))) b = { w, d };
    }
    return b;
  }
  // Prepara cada palavra da busca; quando ela não existe no catálogo, procura a mais parecida
  const tkCache = new Map();
  function token(t, last) {
    const key = `${t}|${last}`;
    if (tkCache.has(key)) return tkCache.get(key);
    const tk = { t, last, n: num(t), syn: SYN.get(t) || [], alvo: [], fix: '' };
    const tol = tolOf(t);
    if (t.length >= 3 && isNaN(tk.n) && ![...VOC.keys()].some(w => direct(tk, { w, n: num(w) }))) {
      let b = near(t, tol, last? Math.max(tol, 1) : 0);
      if (b) tk.alvo = [b.w, ...(SYN.get(b.w) || [])];
      else if (tol) b = near(t, tol + 1, 0);      // um erro a mais: só vira sugestão, não filtra
      if (b && t.length >= 4) { const w = OFICIAL.get(b.w) || b.w; tk.fix = DISP.get(w) || w; }
    }
    if (tkCache.size > 500) tkCache.clear();
    tkCache.set(key, tk);
    return tk;
  }
  // Palavras da busca (sem as de ruído); a última, sem espaço depois, ainda está sendo digitada
  function parse(q) {
    const ws = wordsOf(q || '', false).filter(w => !RUIDO_SET.has(w));
    const open = !/\s$/.test(q || '');
    return ws.map((w, i) => token(w, open && i === ws.length - 1));
  }
  // Qualidade da melhor palavra do produto para esta palavra da busca (0 = não achou)
  function hit(tk, e) {
    const d = direct(tk, e);
    return d? d : tk.alvo.includes(e.w)? 1.5 : 0;
  }
  const best = (tk, p) => idx(p).words.reduce((s, e) => Math.max(s, hit(tk, e) * e.wt), 0);

  // Todas as palavras precisam aparecer em algum lugar do produto
  function matches(p, q) {
    return parse(q).every(tk => best(tk, p) > 0);
  }
  // Relevância: igual > começo > pedaço > erro de digitação; bônus quando a palavra é a própria categoria
  function score(p, q) {
    const tks = parse(q), ix = idx(p);
    let s = 0;
    for (const tk of tks) {
      const b = best(tk, p);
      if (!b) return 0;
      s += b + ([tk.t, ...tk.syn, ...tk.alvo].includes(ix.cat)? 6 : 0);
    }
    if (tks.length > 1 && canon(p.name).includes(canon(q).trim())) s += 4;
    return s;
  }
  // Ordena por relevância; no empate: em estoque, nome mais curto (mais específico), ordem do catálogo
  function rank(list, q) {
    const k = new Map(list.map((p, i) => [p, [score(p, q), p.estoque? 1 : 0, -idx(p).len, -i]]));
    return [...list].sort((a, b) => { const x = k.get(a), y = k.get(b); return y[0] - x[0] || y[1] - x[1] || y[2] - x[2] || y[3] - x[3]; });
  }
  // "Você quis dizer": a busca com as palavras corrigidas (só se ela achar algo)
  function correct(q, ok = () => true) {
    let changed = false;
    const parts = String(q || '').split(/(\s+)/), fim = parts.length - 1;
    const fixed = parts.map((part, i) => {
      const ws = wordsOf(part, false);
      if (ws.length !== 1) return part;
      const tk = token(ws[0], i === fim);  // a última palavra (sem espaço depois) ainda está sendo digitada
      if (!tk.fix || norm(tk.fix) === norm(part)) return part;
      changed = true; return tk.fix;
    }).join('').trim();
    return changed && PRODUTOS.some(p => ok(p) && matches(p, fixed))? fixed : '';
  }
  // Destaca no texto as palavras que bateram com a busca (devolve HTML escapado)
  function highlight(text, q) {
    const tks = parse(q);
    if (!tks.length) return esc(text);
    return text.replace(/[\p{L}\p{N}]+(?:[.,/]\p{N}+[\p{L}\p{N}]*)*|[^\p{L}\p{N}]+/gu, piece => {
      const es = wordsOf(piece).map(w => ({ w, n: num(w) }));
      if (!es.length) return esc(piece);
      const n = norm(piece);
      let part = '';
      for (const tk of tks) for (const e of es) {
        const h = hit(tk, e);
        // começo ou pedaço da palavra: marca só o trecho, quando as posições batem
        if (h === 2 || h === 3) {
          const i = n.indexOf(tk.t);
          if (n.length === piece.length && i >= 0) {
            part = part || `${esc(piece.slice(0, i))}<mark>${esc(piece.slice(i, i + tk.t.length))}</mark>${esc(piece.slice(i + tk.t.length))}`;
            continue;
          }
        }
        if (h) return `<mark>${esc(piece)}</mark>`;
      }
      return part || esc(piece);
    });
  }

  /* Carrinho: uma linha por produto + variação. Chave "id" (produto sem escolha) ou "id|valor"
     (voltagem, spots, potência). O preço sai sempre da linha, nunca da escolha atual na tela,
     então trocar a opção depois não muda o que já está no carrinho. */
  const keyOf = (p, v) => (multi(p)? `${p.id}|${v.valor}` : p.id);
  function lineOf(key) {
    const [id, valor, sobra] = String(key).split('|');
    const p = byId[id]; if (!p || sobra !== undefined) return null;
    let v = null;
    if (multi(p)) { v = p.opcao.itens.find(i => i.valor === valor); if (!v) return null; }
    else if (valor !== undefined) return null;
    else if (p.opcao) v = p.opcao.itens[0];
    return { key, p, v, pr: priceOf(p, v) };
  }
  // quantidade sempre inteira de 1 a 99 (o que vier diferente do navegador é descartado)
  const qtyOk = q => { const n = Math.floor(Number(q)); return n >= 1? Math.min(n, 99) : 0; };
  function cleanCart(raw) {
    const out = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
    for (const [k, q0] of Object.entries(raw)) {
      const q = qtyOk(q0); if (!q) continue;
      let key = k;
      const old = byId[k];
      if (old && multi(old)) { const v = variantOf(old); if (!v) continue; key = keyOf(old, v); } // carrinho antigo: só o id
      if (!lineOf(key)) continue;
      out[key] = Math.min((out[key] || 0) + q, 99);
    }
    return out;
  }
  let cart = cleanCart(load('LOJA-cart', {}));
  const lines = () => Object.keys(cart).map(k => { const l = lineOf(k); return l && { ...l, q: cart[k] }; }).filter(Boolean);
  const save = () => store('LOJA-cart', cart);

  /* ---------- Catálogo ---------- */
  const grid = $('#grid'), empty = $('#empty'), count = $('#resultCount');

  function priceHTML(p, v) {
    const pr = priceOf(p, v);
    const from = p.varia && !v? '<small class="price__from">a partir de</small>' : '';
    return `<div class="price">
      <div class="price__old">${brl(pr.cheio)}</div>
      ${from}
      <div class="price__pix"><b>${brl(pr.pix)}</b><span>6% OFF no PIX</span></div>
      <div class="price__inst">ou ${PARCELAS}x de ${brl(pr.parcela)} sem juros</div>
    </div>`;
  }
  const notifyURL = p => wa(`Olá! Quero ser avisado quando chegar: ${fullName(p)}`);

  function cardHTML(p, i) {
    const action = !p.estoque
? `<a class="btn btn--ghost-dark btn--block" target="_blank" rel="noopener" href="${notifyURL(p)}">Avise-me</a>`
      : multi(p)
? `<button class="btn btn--primary btn--block" data-view="${p.id}">Escolher opções</button>`
        : `<button class="btn btn--primary btn--block" data-add="${p.id}">${icon('cart')} Adicionar</button>`;
    return `<article class="card${p.estoque? '' : ' is-out'}" style="animation-delay:${Math.min(i, 12) * 30}ms">
      <span class="badge${p.estoque? '' : ' badge--out'}">${p.estoque? '6% OFF' : 'Fora de estoque'}</span>
      <button class="fav" data-fav="${p.id}" aria-pressed="${favs.has(p.id)}" aria-label="Favoritar ${esc(p.name)}">${icon('heart')}</button>
      <button class="card__img" data-view="${p.id}" aria-label="Visualização rápida de ${esc(p.name)}">
        <img src="${p.img}" alt="" loading="lazy" width="510" height="510">
        <span class="card__quick">Visualização rápida</span>
      </button>
      <div class="card__body">
        <div class="card__top"><span class="card__brand">${p.brand}</span>
          <label class="cmpck"><input type="checkbox" data-cmp="${p.id}"><span>Comparar</span></label></div>
        <h3 class="card__name"><a href="${urlOf(p)}">${esc(p.name)}</a></h3>
        ${priceHTML(p, null)}
        ${action}
      </div>
    </article>`;
  }

  function filtered() {
    let list = PRODUTOS.filter(p =>
      (!state.cat || p.cat === state.cat) &&
      (!state.brand || p.brand === state.brand) &&
      (!state.fav || favs.has(p.id)) &&
      matches(p, state.q));
    // Destaques + busca: mais relevantes primeiro; no empate, em estoque antes (e a ordem do catálogo)
    if (state.sort === 'rel' && state.q) list = rank(list, state.q);
    if (state.sort === 'asc') list = [...list].sort((a, b) => a.pix - b.pix);
    if (state.sort === 'desc') list = [...list].sort((a, b) => b.pix - a.pix);
    if (state.sort === 'az') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    return list;
  }

  function render() {
    const list = filtered();
    grid.innerHTML = list.map(cardHTML).join('');
    empty.hidden = list.length > 0;
    grid.hidden = list.length === 0;
    count.textContent = list.length === 1? '1 produto' : `${list.length} produtos`;
    $('#emptyWa').href = wa(state.q? `Olá! Estou procurando: ${state.q}` : 'Olá! Não encontrei o que procuro no site.');
    emptyFix(list.length? '' : correct(state.q, p => (!state.cat || p.cat === state.cat) && (!state.brand || p.brand === state.brand) && (!state.fav || favs.has(p.id))));
    $$('#catChips .chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.cat === state.cat)));
    document.dispatchEvent(new CustomEvent('LOJA:render'));
  }

  $('#catChips').innerHTML = CATS.map(c => {
    const n = c.id? PRODUTOS.filter(p => p.cat === c.id).length : PRODUTOS.length;
    return `<button class="chip" data-cat="${c.id}" aria-pressed="false">${c.label}<span>${n}</span></button>`;
  }).join('');
  $('#brandSel').insertAdjacentHTML('beforeend',
    [...new Set(PRODUTOS.map(p => p.brand))].sort().map(b => `<option>${b}</option>`).join(''));

  function setCat(cat) { state.cat = cat; render(); }
  $('#catChips').addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) setCat(c.dataset.cat); });
  $('#brandSel').addEventListener('change', e => { state.brand = e.target.value; render(); });
  $('#sortSel').addEventListener('change', e => { state.sort = e.target.value; render(); });
  $('#clearFilters').addEventListener('click', () => {
    Object.assign(state, { cat: '', brand: '', q: '', fav: false });
    $('#brandSel').value = ''; $('#searchInput').value = ''; render();
  });

  // Links de categoria (menu, cards, rodapé)
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-cat]');
    if (a) { setCat(a.dataset.cat); closeMenu(); }
  });

  // Busca instantânea: o catálogo acompanha a digitação (sem rolar a página)
  const searchInput = $('#searchInput');
  let t;
  searchInput.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => { const q = searchInput.value.trim(); if (q !== state.q) { state.q = q; render(); } }, 150);
  });
  // Lista vazia: oferece a busca corrigida ("Você quis dizer …?")
  const fixEl = document.createElement('p');
  fixEl.className = 'empty__fix'; fixEl.hidden = true;
  empty.querySelector('p').after(fixEl);
  function emptyFix(fix) {
    fixEl.hidden = !fix;
    fixEl.innerHTML = fix? `Você quis dizer <button type="button" class="linkbtn" data-fix="${esc(fix)}">${esc(fix)}</button>?` : '';
  }
  fixEl.addEventListener('click', e => {
    const b = e.target.closest('[data-fix]'); if (!b) return;
    searchInput.value = state.q = b.dataset.fix; render();
  });
  $('#searchForm').addEventListener('submit', e => {
    e.preventDefault();
    state.q = searchInput.value.trim(); render();
    searchInput.blur();
    $('#catalogo').scrollIntoView();
  });

  // Menu mobile
  const menuBtn = $('#menuBtn'), nav = $('#nav');
  function closeMenu() { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  menuBtn.addEventListener('click', () => {
    menuBtn.setAttribute('aria-expanded', String(nav.classList.toggle('open')));
  });
  nav.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });

  /* ---------- Carrinho ---------- */
  const drawer = $('#drawer'), overlay = $('#overlay'), cartBtn = $('#cartBtn');
  const cartItems = $('#cartItems'), cartFoot = $('#cartFoot'), cartCount = $('#cartCount');
  let lastFocus = null;

  function totals() {
    let pix = 0, full = 0, qty = 0;
    for (const { pr, q } of lines()) { pix += r2(pr.pix * q); full += r2(pr.cheio * q); qty += q; }
    return { pix: r2(pix), full: r2(full), qty };
  }

  function renderCart() {
    const ls = lines();
    const { pix, full, qty } = totals();
    cartCount.textContent = qty; cartCount.hidden = qty === 0;
    cartBtn.setAttribute('aria-label', `Abrir carrinho (${qty} ${qty === 1? 'item' : 'itens'})`);

    if (!ls.length) {
      cartItems.innerHTML = `<div class="drawer__empty">${icon('cart')}<b>Seu carrinho está vazio</b><p>Adicione produtos para montar seu pedido.</p></div>`;
      cartFoot.innerHTML = `<button class="btn btn--ghost-dark btn--block" data-close>Continuar comprando</button>`;
      document.dispatchEvent(new CustomEvent('LOJA:cart'));
      return;
    }
    cartItems.innerHTML = ls.map(({ key, p, q, pr }) => {
      const id = esc(key);
      return `<div class="item">
        <a href="${urlOf(p)}"><img src="${p.img}" alt=""></a>
        <div>
          <div class="item__name">${esc(p.name)}</div>
          ${pr.rotulo? `<div class="item__opt">${esc(p.opcao.nome)}: ${esc(pr.rotulo)}</div>` : ''}
          <div class="item__price">${brl(pr.pix * q)}</div>
          <button class="item__rm" data-rm="${id}">Remover</button>
        </div>
        <div class="qty">
          <button data-dec="${id}" aria-label="Diminuir quantidade">${icon('minus')}</button>
          <output>${q}</output>
          <button data-inc="${id}" aria-label="Aumentar quantidade">${icon('plus')}</button>
        </div>
      </div>`;
    }).join('');

    cartFoot.innerHTML = `
      <div class="sum"><span>No cartão em até ${PARCELAS}x sem juros</span><span>${brl(full)}</span></div>
      <div class="sum"><span>Desconto PIX / boleto (6%)</span><span class="save">− ${brl(r2(full - pix))}</span></div>
      <div class="sum sum--total"><span>Total no PIX</span><b>${brl(pix)}</b></div>
      <fieldset class="ped">
        <legend>Para agilizar o atendimento <small>(opcional)</small></legend>
        <div class="ped__pay" role="radiogroup" aria-label="Forma de pagamento">
          <label><input type="radio" name="pedPag" value="pix"${ped.pag !== 'cartao'? ' checked' : ''}><span><b>PIX ou boleto</b><small>${brl(pix)}</small></span></label>
          <label><input type="radio" name="pedPag" value="cartao"${ped.pag === 'cartao'? ' checked' : ''}><span><b>Cartão</b><small>${PARCELAS}x de ${brl(r2(full / PARCELAS))}</small></span></label>
        </div>
        <div class="ped__row">
          <label class="ped__cep"><span>CEP para o frete</span><input id="pedCep" inputmode="numeric" autocomplete="postal-code" maxlength="9" placeholder="00000-000" value="${esc(ped.cep || '')}"></label>
          <label class="ped__nome"><span>Seu nome</span><input id="pedNome" autocomplete="given-name" maxlength="40" placeholder="Como podemos te chamar?" value="${esc(ped.nome || '')}"></label>
        </div>
        <p class="ped__cidade" id="pedCidade" aria-live="polite">${ped.cidade? `${icon('pin')} ${esc(ped.cidade)}` : ''}</p>
      </fieldset>
      <a class="btn btn--wa btn--lg btn--block" data-checkout target="_blank" rel="noopener" href="#">${icon('wa')} Finalizar pelo WhatsApp</a>
      <p class="drawer__note">O consultor confirma o frete, o prazo e o pagamento com você. Nada é cobrado pelo site.</p>`;
    pedLink();
    document.dispatchEvent(new CustomEvent('LOJA:cart'));
  }

  /* ---------- Pedido pelo WhatsApp: mensagem completa ----------
     Forma de pagamento, CEP (a cidade vem do ViaCEP) e nome são opcionais e ficam só neste navegador. */
  const PED_KEY = 'LOJA-pedido';
  const ped = (() => { try { return JSON.parse(localStorage.getItem(PED_KEY)) || {}; } catch { return {}; } })();
  const savePed = () => { try { localStorage.setItem(PED_KEY, JSON.stringify(ped)); } catch {} };
  const cepFmt = v => { const d = v.replace(/\D/g, '').slice(0, 8); return d.length > 5? `${d.slice(0, 5)}-${d.slice(5)}` : d; };
  function pedMsg() {
    const { full, pix } = totals(); // os mesmos números do carrinho na tela
    const msgLines = lines().map(({ p, q, pr }, i) => {
      const opt = pr.rotulo? `\n   ${p.opcao.nome}: ${pr.rotulo}` : '';
      const each = q > 1? ` (${brl(pr.pix)} cada)` : '';
      return `${i + 1}. *${q}x ${p.name}*${opt}\n   ${brl(pr.pix * q)} no PIX${each}`;
    });
    const code = T? T.orderCode() : '';
    const cartao = ped.pag === 'cartao';
    const out = [`Olá! Quero finalizar meu pedido do site${code? ` (código ${code})` : ''}:`, '', ...msgLines, ''];
    // o total da forma de pagamento escolhida vem em negrito; o outro fica como referência
    const tCartao = `Total no cartão: ${brl(full)} (${PARCELAS}x de ${brl(r2(full / PARCELAS))} sem juros)`;
    const tPix = `Total no PIX/boleto: ${brl(pix)} (6% de desconto, − ${brl(r2(full - pix))})`;
    out.push(cartao? `*${tCartao}*` : `*${tPix}*`, cartao? tPix : tCartao, '');
    out.push(`Pagamento: ${cartao? `cartão em até ${PARCELAS}x sem juros` : 'PIX ou boleto (com 6% de desconto)'}`);
    const cep = (ped.cep || '').replace(/\D/g, '');
    out.push(cep.length === 8? `Entrega: CEP ${cepFmt(cep)}${ped.cidade? ` — ${ped.cidade}` : ''}. Pode calcular o frete?` : 'Entrega: vou informar o CEP para o frete.');
    if (ped.nome) out.push(`Nome: ${ped.nome.trim()}`);
    return out.join('\n');
  }
  // atualiza o link a cada mudança (o track.js, que mede o clique, lê o link antes de abrir)
  function pedLink() { const a = cartFoot.querySelector('[data-checkout]'); if (a) a.href = wa(pedMsg()); }
  let cepReq = 0;
  async function cidadeDoCep(cep) {
    const box = $('#pedCidade'), my = ++cepReq;
    ped.cidade = ''; if (box) box.textContent = '';
    if (cep.length !== 8) return pedLink();
    if (box) box.textContent = 'Buscando cidade…';
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: AbortSignal.timeout? AbortSignal.timeout(6000) : undefined });
      const d = await r.json();
      if (my !== cepReq) return;
      ped.cidade = d && !d.erro? `${d.localidade}/${d.uf}` : '';
      if (box) box.innerHTML = ped.cidade? `${icon('pin')} ${esc(ped.cidade)}` : 'CEP não encontrado. Confira os números.';
    } catch { if (my === cepReq && box) box.textContent = ''; }
    savePed(); pedLink();
  }
  cartFoot.addEventListener('input', e => {
    if (e.target.id === 'pedCep') {
      e.target.value = cepFmt(e.target.value);
      const d = e.target.value.replace(/\D/g, '');
      ped.cep = e.target.value;
      if (d.length === 8 || ped.cidade) cidadeDoCep(d);
    }
    if (e.target.id === 'pedNome') ped.nome = e.target.value.slice(0, 40);
    if (e.target.name === 'pedPag') ped.pag = e.target.value;
    savePed(); pedLink();
  });
  cartFoot.addEventListener('change', e => { if (e.target.name === 'pedPag') { ped.pag = e.target.value; savePed(); pedLink(); } });

  // Devolve false quando o produto precisa de uma escolha (abre a visualização rápida)
  function add(id, q = 1) {
    const p = byId[id]; if (!p) return false;
    const v = variantOf(p);
    if (multi(p) && !v) { openModal(id); toast(`Escolha: ${p.opcao.nome.toLowerCase()}`); return false; }
    if (!priceOf(p, v).estoque) { toast('Esta opção está sem estoque'); return false; }
    q = qtyOk(q); if (!q) return false;
    const key = keyOf(p, v);
    cart[key] = Math.min((cart[key] || 0) + q, 99);
    save(); renderCart();
    document.dispatchEvent(new CustomEvent('LOJA:add', { detail: { id, key, qty: q } }));
    cartBtn.classList.remove('bump'); void cartBtn.offsetWidth; cartBtn.classList.add('bump');
    toast('Adicionado ao carrinho');
    return true;
  }

  function openCart() {
    lastFocus = document.activeElement;
    drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
    overlay.hidden = false; document.body.style.overflow = 'hidden';
    drawer.focus();
  }
  function closeCart() {
    drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true');
    overlay.hidden = true; document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  cartBtn.addEventListener('click', openCart);
  $('#cartClose').addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeCart(); });

  drawer.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const { inc, dec, rm } = b.dataset;
    if ('close' in b.dataset) return closeCart();
    const k = inc || dec || rm;
    if (k && !Object.prototype.hasOwnProperty.call(cart, k)) return;
    const line = k && lineOf(k);
    if (inc) cart[inc] = Math.min(cart[inc] + 1, 99);
    if (dec) { cart[dec]--; if (cart[dec] < 1) delete cart[dec]; }
    if (rm) delete cart[rm];
    if ((dec || rm) && line) document.dispatchEvent(new CustomEvent('LOJA:remove', { detail: { id: line.p.id, key: k, qty: rm? 0 : 1 } }));
    if (inc || dec || rm) { save(); renderCart(); }
  });

  /* ---------- Visualização rápida ---------- */
  const modal = $('#modal'), modalBody = $('#modalBody');
  let modalQty = 1, modalId = null;

  function modalInfo(p) {
    const v = variantOf(p), pr = priceOf(p, v), need = multi(p) && !v;
    const options = multi(p)? `<div class="opt" id="mOpt"><span class="opt__label">${esc(p.opcao.nome)}</span>
        <div class="opt__list">${p.opcao.itens.map(i => `<label><input type="radio" name="mopt" value="${esc(i.valor)}"${v && v.valor === i.valor? ' checked' : ''}><span>${esc(i.rotulo)}${i.estoque? '' : ' · esgotado'}</span></label>`).join('')}</div></div>` : '';
    const buy = pr.estoque
? `<div class="modal__buy">
           <div class="qty">
             <button data-mq="-1" aria-label="Diminuir quantidade">${icon('minus')}</button>
             <output id="mq">${modalQty}</output>
             <button data-mq="1" aria-label="Aumentar quantidade">${icon('plus')}</button>
           </div>
           <button class="btn btn--primary btn--lg" data-madd="${p.id}">${icon('cart')} ${need? 'Escolha uma opção' : 'Adicionar ao carrinho'}</button>
         </div>`
      : `<a class="btn btn--primary btn--lg" target="_blank" rel="noopener" href="${notifyURL(p)}">Avise-me quando chegar</a>`;
    return `
        <span class="card__brand">${p.brand}</span>
        <h3>${esc(p.name)}</h3>
        <span class="stock${pr.estoque? '' : ' stock--out'}">${pr.estoque? 'Em estoque' : 'Fora de estoque'}</span>
        ${priceHTML(p, v)}
        ${options}
        ${buy}
        <div class="modal__row">
          <a class="btn btn--ghost-dark" target="_blank" rel="noopener" href="${wa(`Olá! Tenho uma dúvida sobre: ${fullName(p)}`)}">${icon('wa')} Tirar dúvida</a>
          <button class="btn btn--ghost-dark" data-share="${p.id}">${icon('share')} Compartilhar</button>
          <button class="btn btn--ghost-dark fav fav--inline" data-fav="${p.id}" aria-pressed="${favs.has(p.id)}" aria-label="Favoritar">${icon('heart')}</button>
        </div>
        <a class="modal__full" href="${urlOf(p)}">Ver descrição e ficha técnica completas ${icon('arrow')}</a>
        <ul class="modal__perks">
          <li>${icon('truck')} Enviamos para todo o Brasil</li>
          <li>${icon('shield')} Pagamento 100% seguro</li>
          <li>${icon('headset')} Conferimos a compatibilidade antes do envio</li>
        </ul>`;
  }

  function openModal(id) {
    const p = byId[id]; if (!p) return;
    modalQty = 1; modalId = id;
    modalBody.innerHTML = `
      <div class="modal__img"><img src="${p.img}" alt="${esc(p.name)}"></div>
      <div class="modal__info" id="mInfo">${modalInfo(p)}</div>`;
    if (!modal.open) modal.showModal();
    document.dispatchEvent(new CustomEvent('LOJA:modal', { detail: id }));
  }
  $('#modalClose').addEventListener('click', () => modal.close());
  modal.addEventListener('change', e => {
    if (e.target.name !== 'mopt') return;
    const p = byId[modalId];
    opt[p.id] = e.target.value; store('LOJA-opt', opt);
    $('#mInfo').innerHTML = modalInfo(p);
  });
  modal.addEventListener('click', e => {
    if (e.target === modal) return modal.close();
    const mf = e.target.closest('[data-fav]');
    if (mf) return toggleFav(mf.dataset.fav);
    const q = e.target.closest('[data-mq]');
    if (q) { modalQty = Math.max(1, Math.min(99, modalQty + Number(q.dataset.mq))); $('#mq').textContent = modalQty; }
    const a = e.target.closest('[data-madd]');
    if (a) {
      const p = byId[a.dataset.madd];
      if (multi(p) && !variantOf(p)) { $('#mOpt').classList.add('is-missing'); return; }
      if (add(p.id, modalQty)) { modal.close(); openCart(); }
    }
  });

  grid.addEventListener('click', e => {
    const fv = e.target.closest('[data-fav]');
    if (fv) return toggleFav(fv.dataset.fav);
    const addBtn = e.target.closest('[data-add]');
    if (addBtn) return add(addBtn.dataset.add);
    const view = e.target.closest('[data-view]');
    if (view) openModal(view.dataset.view);
  });

  function toggleFav(id) {
    const on = !favs.has(id);
    if (on) favs.add(id); else favs.delete(id);
    saveFavs();
    $$(`[data-fav="${id}"]`).forEach(b => b.setAttribute('aria-pressed', String(on)));
    toast(on? 'Salvo nos favoritos' : 'Removido dos favoritos');
    document.dispatchEvent(new CustomEvent('LOJA:fav', { detail: { id, on } }));
    if (state.fav && !on) render(); else document.dispatchEvent(new CustomEvent('LOJA:favs'));
  }

  /* ---------- Contato ---------- */
  $('#contactForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const url = wa(`Olá! Sou ${f.get('nome')}.\nAssunto: ${f.get('assunto')}\n\n${f.get('msg')}`);
    if (T) T.lead('formulario-contato', { assunto: f.get('assunto') });
    window.open(T? T.waUrl(url) : url, '_blank', 'noopener');
  });

  /* ---------- Toast ---------- */
  const toastEl = $('#toast'); let tt;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('show'), 1800);
  }

  // O carrinho pode mudar em outra aba (ex.: página de produto)
  addEventListener('storage', e => {
    if (e.key === 'LOJA-cart') { cart = cleanCart(load('LOJA-cart', {})); renderCart(); }
    if (e.key === 'LOJA-opt') { opt = load('LOJA-opt', {}); }
  });

  window.LOJA = {
    PRODUTOS, byId, brl, cheio, esc, wa, icon, priceHTML, add, openCart, closeCart, openModal, toast, PARCELAS,
    state, render, favs, matches, score, rank, correct, highlight, cart: () => cart, lines, line: lineOf, r2, modal, drawer, urlOf, fullName,
    priceOf: id => priceOf(byId[id]),
    setVariant: (id, valor) => { opt[id] = valor; store('LOJA-opt', opt); },
  };
  render();
  renderCart();
})();
