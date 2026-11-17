/* AquaVita Peças — experiência de rolagem da página inicial.
   O motor é o scroll-craft (assets/vendor/scrollcraft), usado sem alterações.
   Aqui fica só o que é próprio desta página: a altura do cabeçalho e o teclado no trilho das linhas. */
(() => {
  'use strict';
  const xp = document.getElementById('xp');
  if (!xp || !window.ScrollCraft) return;
  // Páginas de destino de anúncio (?categoria=, ?marca=, ?busca=) não carregam a experiência
  if (document.body.classList.contains('landing')) return;

  // O cabeçalho da loja é fixo: os palcos precisam saber a altura dele
  const header = document.querySelector('.header');
  const setHdr = () => { if (header) document.documentElement.style.setProperty('--xp-hdr', `${header.offsetHeight}px`); };
  setHdr(); addEventListener('resize', setHdr);

  ScrollCraft.mount(xp);

  /* ---------- Teclado: focar um item do trilho leva a rolagem até ele ---------- */
  const range = document.getElementById('categorias');
  const rail = range && range.querySelector('[data-sc-pan]');
  if (rail && !ScrollCraft.reduce) rail.addEventListener('focusin', e => {
    const item = e.target.closest('.xp-rail > *'); if (!item) return;
    const over = rail.scrollWidth - innerWidth; if (over <= 0) return;
    const want = item.offsetLeft + item.offsetWidth / 2 - innerWidth / 2;
    const p = Math.min(1, Math.max(0, want / (over * 1.04)));
    const top = range.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + (range.offsetHeight - innerHeight) * p, behavior: 'auto' });
  });

})();
