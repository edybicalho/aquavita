/* AquaVita Peças — assistente, comparador, tema e movimento */
(() => {
  'use strict';
  const L = window.LOJA; if (!L) return;
  const { PRODUTOS, byId, brl, cheio, esc, wa, icon, add, openModal, toast, PARCELAS } = L;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  const CAT_LABEL = { motobombas: 'Motobomba', aquecedores: 'Aquecedor', controladores: 'Controlador de spa', kits: 'Kit bomba + aquecedor' };

  // Potência (CV) lida do nome do produto
  function cv(p) {
    const m = p.name.match(/(\d)\/(\d)\s*cv|(\d[.,]\d)\s*cv/i);
    if (!m) return null;
    return m[1]? Number(m[1]) / Number(m[2]) : Number(m[3].replace(',', '.'));
  }
  function cvLabel(p) {
    const m = p.name.match(/(\d\/\d|\d[.,]\d)\s*cv/i);
    return m? `${m[1].replace('.', ',')} CV` : '—';
  }

  /* ================= Tema ================= */
  const root = document.documentElement;
  $('#themeBtn').addEventListener('click', () => {
    const t = root.dataset.theme === 'dark'? 'light' : 'dark';
    root.dataset.theme = t;
    try { localStorage.setItem('LOJA-theme', t); } catch {}
    $('meta[name=theme-color]').content = t === 'dark'? '#071226' : '#0a1e46';
  });

  /* ================= Assistente ================= */
  const wiz = $('#wizard');
  let ans = {}, trail = [];

  const POT = [
    { v: 'low', b: 'Até 1/2 CV', s: '1/3 e 1/2 CV', f: x => x !== null && x <= 0.5 },
    { v: 'mid', b: '3/4 a 1 CV', s: 'Potência intermediária', f: x => x !== null && x > 0.5 && x <= 1 },
    { v: 'high', b: '1,5 a 2 CV', s: 'Alta potência', f: x => x !== null && x > 1 },
    { v: 'any', b: 'Não sei a potência', s: 'Mostrar todas as opções', f: () => true },
  ];
  const PRI = [
    { v: 'preco', b: 'Menor preço', s: 'O mais em conta que resolve' },
    { v: 'meio', b: 'Custo-benefício', s: 'Equilíbrio entre preço e linha' },
    { v: 'top', b: 'Top de linha', s: 'O modelo mais completo' },
  ];

  const pool = () => PRODUTOS.filter(p => p.cat === ans.tipo);
  const hasPot = () => ans.tipo === 'motobombas' || ans.tipo === 'kits';
  const brands = () => [...new Set(pool().filter(p => !ans.pot || POT.find(o => o.v === ans.pot).f(cv(p))).map(p => p.brand))].sort();

  function steps() {
    const s = ['tipo'];
    if (ans.tipo) {
      if (hasPot()) s.push('pot');
      if (brands().length > 1) s.push('marca');
      s.push('pri');
    } else s.push('pot', 'marca', 'pri');
    return s;
  }

  function nextStep() {
    return steps().find(k => !(k in ans)) || 'fim';
  }

  function opt(key, v, b, s, wide) {
    return `<button class="wiz__opt${wide? ' wiz__opt--wide' : ''}" data-k="${key}" data-v="${v}"><b>${b}</b><small>${s}</small></button>`;
  }

  function results() {
    let list = pool();
    let note = '';
    if (ans.pot) list = list.filter(p => POT.find(o => o.v === ans.pot).f(cv(p)));
    if (ans.marca && ans.marca !== 'any') {
      const f = list.filter(p => p.brand === ans.marca);
      if (f.length) list = f; else note = `Não há ${ans.marca} nessa combinação no site — estas são as opções mais próximas.`;
    }
    list = [...list].sort((a, b) => a.pix - b.pix);
    if (ans.pri === 'top') list.reverse();
    if (ans.pri === 'meio' && list.length > 2) {
      const mid = list[Math.floor((list.length - 1) / 2)].pix;
      list.sort((a, b) => Math.abs(a.pix - mid) - Math.abs(b.pix - mid));
    }
    list.sort((a, b) => Number(b.estoque) - Number(a.estoque));
    return { list: list.slice(0, 3), note };
  }

  function summary() {
    const parts = [CAT_LABEL[ans.tipo]];
    if (ans.pot && ans.pot !== 'any') parts.push(POT.find(o => o.v === ans.pot).b);
    if (ans.marca && ans.marca !== 'any') parts.push(ans.marca);
    if (ans.pri) parts.push(PRI.find(o => o.v === ans.pri).b.toLowerCase());
    return parts.join(' · ');
  }

  function renderWiz() {
    const k = nextStep(), all = steps();
    const idx = k === 'fim'? all.length : all.indexOf(k);
    const pct = Math.round((idx / all.length) * 100);
    let body = '';

    if (k === 'tipo') {
      body = `<p class="wiz__q">O que você precisa?</p><p class="wiz__hint">Escolha o tipo de peça para a sua banheira ou spa.</p>
        <div class="wiz__opts">
          ${opt('tipo', 'motobombas', 'Motobomba', 'A bomba que movimenta a água')}
          ${opt('tipo', 'aquecedores', 'Aquecedor', 'Mantém a água na temperatura')}
          ${opt('tipo', 'controladores', 'Controlador de spa', 'Painel que comanda o spa')}
          ${opt('tipo', 'kits', 'Kit bomba + aquecedor', 'Motobomba e aquecedor no mesmo pedido')}
          <a class="wiz__opt wiz__opt--wide" target="_blank" rel="noopener" href="${wa('Olá! Não sei qual peça preciso para minha banheira/spa. Podem me ajudar?')}"><b>Não tenho certeza</b><small>Fale com um consultor e envie uma foto da peça antiga</small></a>
        </div>`;
    } else if (k === 'pot') {
      body = `<p class="wiz__q">Qual a potência da motobomba?</p><p class="wiz__hint">Em geral está na etiqueta da bomba atual, indicada em CV.</p>
        <div class="wiz__opts">${POT.filter(o => o.v === 'any' || pool().some(p => o.f(cv(p)))).map(o => opt('pot', o.v, o.b, o.s)).join('')}</div>`;
    } else if (k === 'marca') {
      body = `<p class="wiz__q">Tem preferência de marca?</p><p class="wiz__hint">Manter a mesma marca da peça antiga costuma facilitar a troca.</p>
        <div class="wiz__opts">${brands().map(b => opt('marca', b, b, 'Ver opções da marca')).join('')}${opt('marca', 'any', 'Tanto faz', 'Mostrar todas as marcas')}</div>`;
    } else if (k === 'pri') {
      body = `<p class="wiz__q">O que pesa mais na sua escolha?</p><p class="wiz__hint">Usamos isso para ordenar as sugestões.</p>
        <div class="wiz__opts">${PRI.map(o => opt('pri', o.v, o.b, o.s)).join('')}</div>`;
    } else {
      const { list, note } = results();
      document.dispatchEvent(new CustomEvent('LOJA:wizard', { detail: { respostas: { ...ans }, sugestoes: list.map(p => p.id) } }));
      const msg = `Olá! Usei o assistente do site (${summary()}) e quero confirmar a compatibilidade${list[0]? ` de: ${list[0].name}` : ''}.`;
      body = `<p class="wiz__q">${list.length? 'Nossas sugestões para você' : 'Nenhuma opção no site para essa combinação'}</p>
        <p class="wiz__hint">${esc(summary())}</p>
        ${note? `<p class="wiz__note">${esc(note)}</p>` : ''}
        <div class="wiz__res">${list.map((p, i) => `
          <div class="wiz__item">
            <img src="${p.img}" alt="" data-wview="${p.id}">
            <div>
              ${i === 0? '<span class="tag">Melhor combinação</span>' : ''}
              <b>${esc(p.name)}</b>
              <div class="p">${brl(p.pix)} <small>no PIX · ${PARCELAS}x de ${brl(p.parcela)}</small></div>
            </div>
            ${p.estoque
? `<button class="btn btn--primary" data-wadd="${p.id}">${icon('cart')} Adicionar</button>`
              : `<a class="btn btn--ghost-dark" target="_blank" rel="noopener" href="${wa(`Olá! Quero ser avisado quando chegar: ${p.name}`)}">Avise-me</a>`}
          </div>`).join('')}</div>
        <div class="wiz__foot">
          <a class="btn btn--wa" target="_blank" rel="noopener" href="${wa(msg)}">${icon('wa')} Confirmar compatibilidade</a>
          <button class="btn btn--ghost-dark" data-restart>Recomeçar</button>
        </div>`;
    }

    wiz.innerHTML = `
      <div class="wiz__bar"><i style="width:${Math.max(pct, 6)}%"></i></div>
      <div class="wiz__meta">
        ${trail.length? `<button class="wiz__back" data-back>${icon('back')} Voltar</button>` : '<span></span>'}
        <span>${k === 'fim'? 'Resultado' : `Pergunta ${idx + 1} de ${all.length}`}</span>
      </div>
      <div class="wiz__step">${body}</div>`;
  }

  wiz.addEventListener('click', e => {
    const o = e.target.closest('button[data-k]');
    if (o) { ans[o.dataset.k] = o.dataset.v; trail.push(o.dataset.k); return renderWiz(); }
    if (e.target.closest('[data-back]')) { delete ans[trail.pop()]; return renderWiz(); }
    if (e.target.closest('[data-restart]')) { ans = {}; trail = []; return renderWiz(); }
    const a = e.target.closest('[data-wadd]'); if (a) return add(a.dataset.wadd);
    const v = e.target.closest('[data-wview]'); if (v) openModal(v.dataset.wview);
  });
  renderWiz();

  /* ================= Comparador ================= */
  const MAX = 3;
  let cmp = [];
  const bar = $('#cmpBar'), cmpModal = $('#cmpModal'), cmpBody = $('#cmpBody');

  function syncCmp() {
    $$('[data-cmp]').forEach(c => { c.checked = cmp.includes(c.dataset.cmp); });
    bar.hidden = cmp.length === 0;
    document.body.classList.toggle('has-cmp', cmp.length > 0);
    $('#cmpThumbs').innerHTML = cmp.map(id => `<img src="${byId[id].img}" alt="">`).join('');
    $('#cmpLabel').textContent = cmp.length < 2? 'Escolha mais 1' : `Comparar (${cmp.length})`;
    $('#cmpOpen').disabled = cmp.length < 2;
    $('#cmpOpen').style.opacity = cmp.length < 2? .6 : 1;
  }

  document.addEventListener('change', e => {
    const c = e.target.closest('[data-cmp]'); if (!c) return;
    const id = c.dataset.cmp;
    if (c.checked) {
      if (cmp.length >= MAX) { c.checked = false; return toast(`Compare até ${MAX} produtos por vez`); }
      cmp.push(id);
    } else cmp = cmp.filter(x => x !== id);
    syncCmp();
  });
  document.addEventListener('LOJA:render', syncCmp);

  function renderCmp() {
    const ps = cmp.map(id => byId[id]);
    const min = Math.min(...ps.map(p => p.pix));
    const row = (label, fn) => `<tr><th scope="row">${label}</th>${ps.map(p => `<td>${fn(p)}</td>`).join('')}</tr>`;
    cmpBody.innerHTML = `<h3>Comparar produtos</h3>
      <table>
        <thead><tr><th></th>${ps.map(p => `<td><img src="${p.img}" alt=""><b>${esc(p.name)}</b><button class="cmp__rm" data-crm="${p.id}">Remover</button></td>`).join('')}</tr></thead>
        <tbody>
          ${row('Preço no PIX', p => `<span class="big${p.pix === min? ' best' : ''}">${brl(p.pix)}</span>${p.pix === min? '<br><small class="best">Menor preço</small>' : ''}`)}
          ${row('No cartão', p => `${PARCELAS}x de ${brl(p.parcela)}<br><small class="muted">${brl(cheio(p))} sem juros</small>`)}
          ${row('Tipo', p => CAT_LABEL[p.cat])}
          ${row('Marca', p => p.brand)}
          ${ps.some(p => cv(p) !== null)? row('Potência', cvLabel) : ''}
          ${row('Disponibilidade', p => p.estoque? '<span class="best">Em estoque</span>' : 'Fora de estoque')}
          ${row('', p => p.estoque
? `<button class="btn btn--primary" data-cadd="${p.id}">${icon('cart')} Adicionar</button>`
            : `<a class="btn btn--ghost-dark" target="_blank" rel="noopener" href="${wa(`Olá! Quero ser avisado quando chegar: ${p.name}`)}">Avise-me</a>`)}
        </tbody>
      </table>`;
  }

  $('#cmpOpen').addEventListener('click', () => { if (cmp.length >= 2) { renderCmp(); cmpModal.showModal(); } });
  $('#cmpClear').addEventListener('click', () => { cmp = []; syncCmp(); });
  $('#cmpClose').addEventListener('click', () => cmpModal.close());
  cmpModal.addEventListener('click', e => {
    if (e.target === cmpModal) return cmpModal.close();
    const a = e.target.closest('[data-cadd]'); if (a) return add(a.dataset.cadd);
    const r = e.target.closest('[data-crm]');
    if (r) { cmp = cmp.filter(x => x !== r.dataset.crm); syncCmp(); cmp.length >= 2? renderCmp() : cmpModal.close(); }
  });
  syncCmp();

  /* ================= Movimento ================= */
  // Surgir ao rolar
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    revealEls.forEach(el => io.observe(el));
  } else revealEls.forEach(el => el.classList.add('in'));

  // Quem navega por teclado não pode cair em bloco ainda invisível
  document.addEventListener('focusin', e => { const r = e.target.closest && e.target.closest('.reveal'); if (r) r.classList.add('in'); });

  // Progresso de rolagem + sombra do cabeçalho
  const prog = $('#progress'), header = $('.header');
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      prog.style.setProperty('--p', max > 0? (scrollY / max).toFixed(4) : 0);
      header.classList.toggle('scrolled', scrollY > 40);
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Contadores
  if (!reduce && 'IntersectionObserver' in window) {
    const co = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      co.unobserve(en.target);
      const el = en.target, end = Number(el.dataset.count), t0 = performance.now(), dur = 1400;
      (function tick(now) {
        const k = Math.min(1, (now - t0) / dur), ease = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(end * ease);
        if (k < 1) requestAnimationFrame(tick);
      })(t0);
    }), { threshold: .6 });
    $$('[data-count]').forEach(el => { el.textContent = '0'; co.observe(el); });
  }

  if (!reduce) {
    // Bolhas do hero
    const bub = $('#bubbles');
    if (bub)
    for (let i = 0; i < 16; i++) {
      const b = document.createElement('i'), s = 8 + Math.random() * 26;
      b.style.cssText = `left:${Math.random() * 100}%;width:${s}px;height:${s}px;animation-duration:${9 + Math.random() * 12}s;animation-delay:${-Math.random() * 20}s`;
      bub.appendChild(b);
    }
    // Paralaxe do hero
    const hero = $('.hero'), art = $('.hero__art');
    if (matchMedia('(hover: hover)').matches) {
      if (hero) hero.addEventListener('pointermove', e => {
        const r = hero.getBoundingClientRect();
        art.style.setProperty('--px', ((e.clientX - r.left) / r.width - .5).toFixed(3));
        art.style.setProperty('--py', ((e.clientY - r.top) / r.height - .5).toFixed(3));
      });
      if (hero) hero.addEventListener('pointerleave', () => { art.style.setProperty('--px', 0); art.style.setProperty('--py', 0); });
      // Brilho nos cards
      $('#grid').addEventListener('pointermove', e => {
        const c = e.target.closest('.card'); if (!c) return;
        const r = c.getBoundingClientRect();
        c.style.setProperty('--mx', `${e.clientX - r.left}px`);
        c.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    }
  }
})();
