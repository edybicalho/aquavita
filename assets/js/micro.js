/* AquaVita Peças — microanimações da loja.
   - a foto do produto voa até o carrinho ao adicionar, e o carrinho responde;
   - o botão confirma "Adicionado" por um instante;
   - o número do carrinho salta quando muda;
   - os preços sobem até o valor final na primeira vez que o card aparece;
   - o coração solta faíscas ao favoritar;
   - os botões fazem uma onda no toque.
   Só escuta eventos que o app.js já dispara (LOJA:add, LOJA:fav, LOJA:render): não muda o comportamento da loja. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const visible = el => !!el && el.offsetParent !== null && el.getBoundingClientRect().width > 0;

  /* ---------- Clique em "Adicionar": guarda de onde saiu a foto e qual botão foi ---------- */
  let lastBtn = null, lastImg = null, lastAt = 0;
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-add],[data-madd]');
    if (!b) return;
    lastBtn = b; lastAt = performance.now();
    const box = b.closest('.card') || b.closest('.modal') || b.closest('dialog');
    lastImg = box && (box.querySelector('.card__img img') || box.querySelector('.modal__media img, .modal img'));
  }, true);

  /* ---------- A foto voa até o carrinho ---------- */
  function target() {
    const tab = $('#tabCart');
    return visible(tab)? (tab.querySelector('.tabbar__cart') || tab) : $('#cartBtn');
  }
  function fly(img, to) {
    const a = img.getBoundingClientRect(), b = to.getBoundingClientRect();
    if (!a.width || a.bottom < 0 || a.top > innerHeight) return pulse(to);
    const size = Math.min(a.width, a.height, 140);
    const ghost = img.cloneNode();
    ghost.className = 'mc-fly'; ghost.removeAttribute('loading');
    Object.assign(ghost.style, { width: `${size}px`, height: `${size}px`, left: `${a.left + a.width / 2 - size / 2}px`, top: `${a.top + a.height / 2 - size / 2}px` });
    document.body.appendChild(ghost);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    // trajetória em arco: sobe um pouco antes de cair no carrinho
    const lift = Math.min(160, Math.abs(dy) * 0.35 + 60);
    const anim = ghost.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.45}px,${Math.min(dy * 0.45, 0) - lift}px) scale(.62)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px,${dy}px) scale(.12)`, opacity: 0.35 }
    ], { duration: 720, easing: 'cubic-bezier(.45,0,.2,1)' });
    anim.onfinish = () => { ghost.remove(); pulse(to); };
  }
  function pulse(el) {
    if (!el) return;
    el.classList.remove('mc-hit'); void el.offsetWidth; el.classList.add('mc-hit');
  }

  /* ---------- Botão confirma "Adicionado" ---------- */
  function confirmBtn(b) {
    if (!b || b.classList.contains('mc-done')) return;
    const html = b.innerHTML, w = b.offsetWidth;
    b.style.minWidth = `${w}px`;
    b.classList.add('mc-done');
    b.innerHTML = '<svg class="ic mc-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg> Adicionado';
    setTimeout(() => { if (b.isConnected) { b.innerHTML = html; b.classList.remove('mc-done'); b.style.minWidth = ''; } }, 1500);
  }

  document.addEventListener('LOJA:add', () => {
    // só reage ao clique que acabou de acontecer (outros add() vêm de recompra, links etc.)
    const fresh = performance.now() - lastAt < 1000;
    if (fresh) confirmBtn(lastBtn);
    if (!reduce) {
      const to = target();
      if (fresh && lastImg && to) fly(lastImg, to); else pulse(to);
    }
    lastBtn = lastImg = null;
  });

  /* ---------- O número do carrinho salta quando muda ---------- */
  ['#cartCount', '#tabCount'].forEach(sel => {
    const el = $(sel); if (!el) return;
    let last = el.textContent;
    new MutationObserver(() => {
      if (el.textContent === last) return;
      last = el.textContent;
      el.classList.remove('mc-pop'); void el.offsetWidth; el.classList.add('mc-pop');
    }).observe(el, { childList: true, characterData: true, subtree: true });
  });

  if (reduce) return;   // daqui para baixo, só movimento

  /* ---------- Preço sobe até o valor final (uma vez por produto, na primeira vez que aparece) ---------- */
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const parse = t => Number(t.replace(/[^\d,]/g, '').replace(',', '.'));
  const seen = new Set();
  const io = 'IntersectionObserver' in window && new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    io.unobserve(en.target);
    const el = en.target, final = el.textContent, end = parse(final);
    if (!end) return;
    const start = end * 0.82, t0 = performance.now(), dur = 750;
    el.classList.add('mc-count');
    (function tick(now) {
      if (!el.isConnected) return;
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = k < 1? fmt.format(start + (end - start) * e).replace(/ /g, ' ') : final;
      if (k < 1) requestAnimationFrame(tick); else el.classList.remove('mc-count');
    })(t0);
  }), { threshold: 0.7 });
  function watchPrices() {
    if (!io) return;
    $$('.card').forEach(c => {
      const id = c.querySelector('[data-view]')?.dataset.view;
      const b = c.querySelector('.price__pix b');
      if (!id || !b || seen.has(id)) return;
      seen.add(id); io.observe(b);
    });
  }
  document.addEventListener('LOJA:render', watchPrices);
  watchPrices();

  /* ---------- Coração solta faíscas ao favoritar ---------- */
  let lastFav = null;
  document.addEventListener('click', e => { lastFav = e.target.closest('[data-fav]'); }, true);
  document.addEventListener('LOJA:fav', e => {
    if (!e.detail || !e.detail.on || !lastFav) return;
    const r = lastFav.getBoundingClientRect();
    const burst = document.createElement('span');
    burst.className = 'mc-burst';
    burst.style.left = `${r.left + r.width / 2}px`; burst.style.top = `${r.top + r.height / 2}px`;
    for (let i = 0; i < 8; i++) { const s = document.createElement('i'); s.style.setProperty('--a', `${i * 45}deg`); burst.appendChild(s); }
    document.body.appendChild(burst);
    setTimeout(() => burst.remove(), 700);
    lastFav = null;
  });

  /* ---------- Onda no toque dos botões ---------- */
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest('.btn'); if (!b || b.disabled) return;
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2;
    const w = document.createElement('span');
    w.className = 'mc-wave';
    Object.assign(w.style, { width: `${d}px`, height: `${d}px`, left: `${e.clientX - r.left - d / 2}px`, top: `${e.clientY - r.top - d / 2}px` });
    if (getComputedStyle(b).position === 'static') b.classList.add('mc-rel');
    b.appendChild(w);
    setTimeout(() => w.remove(), 600);
  }, { passive: true });
})();
