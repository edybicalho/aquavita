/* AquaVita Peças — busca inteligente, favoritos, links compartilháveis, barra inferior */
(() => {
  'use strict';
  const L = window.LOJA; if (!L) return;
  const { PRODUTOS, byId, brl, esc, icon, wa, add, openCart, openModal, toast, state, render, favs, matches, modal, drawer } = L;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const CATS = { motobombas: 'Motobombas', aquecedores: 'Aquecedores', controladores: 'Controladores de spa', kits: 'Kits' };

  /* ================= Estado na URL (links compartilháveis) ================= */
  const brandSel = $('#brandSel'), sortSel = $('#sortSel'), input = $('#searchInput');

  function readURL() {
    const q = new URLSearchParams(location.search);
    const cat = q.get('categoria'), marca = q.get('marca'), ordem = q.get('ordem');
    if (Object.prototype.hasOwnProperty.call(CATS, cat)) state.cat = cat;
    if (marca && PRODUTOS.some(p => p.brand === marca)) { state.brand = marca; brandSel.value = marca; }
    if (['asc', 'desc', 'az'].includes(ordem)) { state.sort = ordem; sortSel.value = ordem; }
    if (q.get('busca')) { state.q = q.get('busca').slice(0, 80); input.value = state.q; }
    return !!(state.cat || state.brand || state.q);
  }
  // Atualiza só os parâmetros da loja; utm_*, gclid, fbclid etc. ficam no endereço para as tags lerem
  function writeURL() {
    const q = new URLSearchParams(location.search);
    const set = (k, v) => { if (v) q.set(k, v); else q.delete(k); };
    set('categoria', state.cat); set('marca', state.brand);
    set('ordem', state.sort !== 'rel'? state.sort : ''); set('busca', state.q);
    const s = q.toString();
    try { history.replaceState(null, '', location.pathname + (s? `?${s}` : '') + location.hash); } catch {}
  }

  /* Página de destino: quem chega por anúncio ou link filtrado vê direto os produtos,
     com título próprio (ex.: /?categoria=kits) */
  // os mesmos textos estão no index.html (script logo após #lpSub), para o título nascer escrito: mude nos dois
  const LP = {
    motobombas: ['Motobombas para hidromassagem e spa', 'Syllent, Lepono, Claw e Komeco, de 1/3 a 2 CV, em 110 V e 220 V.'],
    aquecedores: ['Aquecedores para banheira e spa', 'Linhas Sanspray e Sinapse, com painel digital.'],
    controladores: ['Controladores de spa Sinapse Spamax', 'Aquecimento, hidromassagem e cromoterapia em um só painel.'],
    kits: ['Kits motobomba + aquecedor', 'Motobomba Syllent ou Lepono com aquecedor Sanspray 3 funções, prontos para instalar.'],
  };
  const baseTitle = document.title;
  function landing() {
    if (/landing--(monte|comparar)/.test(document.body.className) && !state.cat && !state.brand && !state.q) return;
    let h, sub = 'Peças originais para banheiras e spas, com atendimento de consultores especializados.';
    if (state.q) h = `Resultados para “${state.q}”`;
    else if (state.cat) { [h, sub] = LP[state.cat]; if (state.brand) h += ` ${state.brand}`; }
    else if (state.brand) h = `Produtos ${state.brand} para banheira e spa`;
    else h = 'Peças para banheiras e spas';
    $('#lpTitle').textContent = h; $('#lpSub').textContent = sub;
    document.title = `${h} | AquaVita Peças`;
  }
  const hadParams = readURL();
  if (hadParams) { document.body.classList.add('landing'); render(); }
  document.addEventListener('LOJA:render', () => {
    writeURL();
    if (document.body.classList.contains('landing')) landing(); else document.title = baseTitle;
  });
  if (hadParams) landing();
  if (new URLSearchParams(location.search).get('carrinho')) openCart();

  // Produto aberto fica no endereço (#produto=...)
  const productURL = id => new URL(L.urlOf(byId[id]), location.href).href;
  document.addEventListener('LOJA:modal', e => {
    try { history.replaceState(null, '', `${location.pathname}${location.search}#produto=${e.detail}`); } catch {}
  });
  modal.addEventListener('close', () => {
    if (location.hash.startsWith('#produto=')) {
      try { history.replaceState(null, '', location.pathname + location.search); } catch {}
    }
  });
  const fromHash = () => {
    const m = location.hash.match(/^#produto=([\w-]+)$/);
    if (m && byId[m[1]] && !modal.open) openModal(m[1]);
  };
  // Link de anúncio / feed de produtos: ?produto=<id>
  const qp = new URLSearchParams(location.search).get('produto');
  if (qp && byId[qp]) openModal(qp);
  addEventListener('hashchange', fromHash);
  fromHash();

  // Compartilhar
  modal.addEventListener('click', async e => {
    const b = e.target.closest('[data-share]'); if (!b) return;
    const p = byId[b.dataset.share], url = productURL(p.id);
    const data = { title: p.name, text: `${p.name} — ${brl(p.pix)} no PIX`, url };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(url); toast('Link copiado'); }
    } catch (err) {
      if (err && err.name !== 'AbortError') toast('Não foi possível compartilhar');
    }
  });

  /* ================= Busca com sugestões ================= */
  const box = $('#suggest'), form = $('#searchForm');
  const { correct, highlight } = L;
  // Mais procurados (montado a partir do catálogo): edite à vontade
  const TOP = ['Motobomba 1/2 CV', 'Aquecedor', 'Controlador', 'Kit', 'Syllent', 'Cromoterapia'];
  const RECENTES = 'LOJA-buscas';
  let sel = -1, items = [], uid = 0;

  function recent() {
    try {
      const a = JSON.parse(localStorage.getItem(RECENTES));
      return Array.isArray(a)? a.filter(s => typeof s === 'string' && s.trim()).slice(0, 5) : [];
    } catch { return []; }
  }
  // Grava só quando a pessoa conclui a busca (enviar, escolher produto, ver resultados)
  function remember(q) {
    q = (q || '').trim().slice(0, 60);
    if (q.length < 2) return;
    try { localStorage.setItem(RECENTES, JSON.stringify([q, ...recent().filter(s => norm(s) !== norm(q))].slice(0, 5))); } catch {}
  }

  const opt = (cls, attrs, inner) => `<button type="button" class="${cls}" role="option" id="sg-${uid++}" aria-selected="false" ${attrs}>${inner}</button>`;
  const group = (label, html) => {
    const id = `sg-l${uid++}`;
    return `<div role="group" aria-labelledby="${id}"><div class="suggest__label" id="${id}" role="presentation">${label}</div>${html}</div>`;
  };
  const chips = html => `<div class="suggest__chips" role="presentation">${html}</div>`;

  function closeBox() {
    box.hidden = true; sel = -1;
    input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant');
  }

  // Campo vazio: buscas recentes e mais procurados
  function emptyHTML() {
    const rec = recent();
    let html = '';
    if (rec.length) html += group('Buscas recentes', rec.map(s => opt('suggest__recent', `data-sq="${esc(s)}"`, `${icon('search')}<span>${esc(s)}</span>`)).join(''));
    return html + group('Mais procurados', chips(TOP.map(s => opt('suggest__chip', `data-sq="${esc(s)}"`, esc(s))).join('')));
  }

  function resultsHTML(q) {
    const found = L.rank(PRODUTOS.filter(p => matches(p, q)), q);
    const fix = correct(q);
    // Categoria aparece quando alguma palavra da busca é ela (ou sinônimo / erro de digitação dela)
    const words = q.split(/\s+/).filter(w => w.length > 1);
    const cats = Object.entries(CATS).filter(([id, label]) => words.some(w => matches({ name: label, brand: '', cat: id }, w)));
    let html = fix? opt('suggest__fix', `data-sq="${esc(fix)}"`, `${icon('spark')}<span>Você quis dizer: <b>${esc(fix)}</b>?</span>`) : '';
    if (cats.length) html += group('Categorias', chips(cats.map(([id, l]) => opt('suggest__chip', `data-scat="${id}"`, esc(l))).join('')));
    if (found.length) {
      html += group('Produtos', found.slice(0, 5).map(p => opt('suggest__item', `data-sview="${p.id}"`, `
          <img src="${p.img}" alt="" width="48" height="48">
          <span><b>${highlight(p.name, q)}</b><small>${esc(p.brand)} · <i class="${p.estoque? 'ok' : 'out'}">${p.estoque? 'Em estoque' : 'Fora de estoque'}</i></small></span>
          <span class="p">${brl(p.pix)}<small>no PIX</small></span>`)).join(''));
      html += opt('suggest__all', 'data-sall', `<span>Ver ${found.length === 1? 'o resultado' : `os ${found.length} resultados`}</span>${icon('arrow')}`);
    } else if (!cats.length) {
      html += `<div class="suggest__empty" role="presentation"><span>Nada no site para “${esc(q)}”.</span>
        <a role="option" id="sg-${uid++}" aria-selected="false" target="_blank" rel="noopener" href="${wa(`Olá! Estou procurando: ${q}`)}">${icon('wa')} Perguntar a um consultor</a></div>`;
    }
    return html;
  }

  function showBox() {
    const q = input.value.trim();
    if (q.length === 1) return closeBox();
    uid = 0;
    box.innerHTML = q? resultsHTML(q) : emptyHTML();
    box.hidden = false; sel = -1;
    input.setAttribute('aria-expanded', 'true'); input.removeAttribute('aria-activedescendant');
    items = $$('[role=option]', box);
    if (matchMedia('(max-width:620px)').matches) box.style.top = `${form.getBoundingClientRect().bottom}px`;
    else box.style.top = '';
  }
  function move(i) {
    sel = i;
    items.forEach((it, k) => it.setAttribute('aria-selected', String(k === sel)));
    input.setAttribute('aria-activedescendant', items[sel].id);
    items[sel].scrollIntoView({ block: 'nearest' });
  }
  // Busca pronta (recente, mais procurado, correção): preenche o campo e filtra o catálogo na hora
  function useQuery(q) { input.value = q; state.q = q; render(); showBox(); }

  function goCatalog() { closeBox(); input.blur(); $('#catalogo').scrollIntoView(); }

  input.addEventListener('input', showBox);
  input.addEventListener('focus', showBox);
  input.addEventListener('keydown', e => {
    if (box.hidden) { if (e.key === 'ArrowDown') { e.preventDefault(); showBox(); } return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!items.length) return;
      const d = e.key === 'ArrowDown'? 1 : -1;
      move(sel < 0? (d > 0? 0 : items.length - 1) : (sel + d + items.length) % items.length);
    } else if (e.key === 'Enter' && sel >= 0) {
      e.preventDefault(); items[sel].click();
    } else if (e.key === 'Escape') { e.preventDefault(); closeBox(); }
  });
  box.addEventListener('mousedown', e => e.preventDefault()); // mantém o foco no campo
  box.addEventListener('click', e => {
    const q = input.value.trim();
    const v = e.target.closest('[data-sview]');
    if (v) { remember(q); closeBox(); return openModal(v.dataset.sview); }
    const s = e.target.closest('[data-sq]');
    if (s) return useQuery(s.dataset.sq);
    const c = e.target.closest('[data-scat]');
    if (c) { input.value = ''; Object.assign(state, { q: '', cat: c.dataset.scat }); render(); return goCatalog(); }
    if (e.target.closest('[data-sall]')) { remember(q); state.q = q; render(); return goCatalog(); }
    if (e.target.closest('a[role=option]')) closeBox();
  });
  form.addEventListener('submit', () => { remember(input.value); closeBox(); });
  document.addEventListener('click', e => { if (!form.contains(e.target)) closeBox(); });
  addEventListener('scroll', () => { if (!box.hidden && document.activeElement !== input) closeBox(); }, { passive: true });

  // Atalho "/" foca a busca
  document.addEventListener('keydown', e => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^(input|textarea|select)$/i.test(document.activeElement.tagName)) return;
    if (modal.open || drawer.classList.contains('open')) return;
    e.preventDefault(); input.focus({ preventScroll: true });
  });

  /* ================= Favoritos ================= */
  const favToggle = $('#favToggle');
  function syncFavs() {
    $('#favCount').textContent = favs.size;
    favToggle.setAttribute('aria-pressed', String(state.fav));
  }
  favToggle.addEventListener('click', () => { state.fav = !state.fav; render(); });
  document.addEventListener('LOJA:favs', syncFavs);
  document.addEventListener('LOJA:render', syncFavs);
  syncFavs();

  /* ================= Sugestão no carrinho ================= */
  const HEATER = 'aquecedor-sanspray-line-clean-3-funcoes', PUMP = 'motobomba-lepono-lspa-1-2-cv';
  document.addEventListener('LOJA:cart', () => {
    const ls = L.lines(); // linhas do carrinho (produto + variação)
    $('#tabCount').textContent = ls.reduce((n, l) => n + l.q, 0);
    $('#tabCount').hidden = ls.length === 0;
    if (!ls.length) return;
    const has = c => ls.some(l => l.p.cat === c);
    let s = null;
    if (!has('kits')) {
      if (has('motobombas') && !has('aquecedores')) s = byId[HEATER];
      else if (has('aquecedores') && !has('motobombas')) s = byId[PUMP];
    }
    if (!s || !s.estoque) return;
    $('#cartItems').insertAdjacentHTML('beforeend', `
      <div class="upsell"><small>Combine com</small>
        <div class="upsell__in">
          <img src="${s.img}" alt="">
          <div><b>${esc(s.name)}</b><span>${brl(s.pix)}</span></div>
          <button class="btn btn--primary" data-upsell="${s.id}">${icon('plus')} Incluir</button>
        </div>
      </div>`);
  });
  drawer.addEventListener('click', e => {
    const u = e.target.closest('[data-upsell]'); if (u) add(u.dataset.upsell);
  });

  // Foco preso dentro do carrinho aberto
  drawer.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const f = $$('a[href],button:not([disabled])', drawer).filter(el => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === drawer)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ================= Barra inferior ================= */
  $('#tabCart').addEventListener('click', openCart);
  $('#tabFav').addEventListener('click', () => {
    if (!favs.size) return toast('Toque no coração de um produto para salvar');
    state.fav = true; render(); $('#catalogo').scrollIntoView();
  });
  document.dispatchEvent(new CustomEvent('LOJA:cart'));
})();
