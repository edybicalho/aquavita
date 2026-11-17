/* AquaVita Peças — faixa de prova social: as frases dos clientes se revezam.
   Pausa com o mouse em cima, com o foco dentro ou com a aba escondida; com "reduzir movimento", só troca pelos pontos. */
(() => {
  'use strict';
  const box = document.getElementById('provasFala');
  if (!box) return;
  const figs = [...box.querySelectorAll('figure')];
  if (figs.length < 2) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dots = document.createElement('div');
  dots.className = 'provas__dots';
  dots.innerHTML = figs.map((_, i) => `<button type="button" aria-label="Avaliação ${i + 1} de ${figs.length}"></button>`).join('');
  box.appendChild(dots);
  const btns = [...dots.children];
  let cur = 0, timer = 0, paused = false;
  function show(i) {
    cur = (i + figs.length) % figs.length;
    figs.forEach((f, k) => { f.classList.toggle('is-on', k === cur); f.setAttribute('aria-hidden', String(k !== cur)); });
    btns.forEach((b, k) => b.setAttribute('aria-current', String(k === cur)));
  }
  const tick = () => { if (!paused && !document.hidden) show(cur + 1); };
  const start = () => { if (!reduce) { clearInterval(timer); timer = setInterval(tick, 5500); } };
  dots.addEventListener('click', e => { const i = btns.indexOf(e.target.closest('button')); if (i >= 0) { show(i); start(); } });
  box.addEventListener('pointerenter', () => { paused = true; });
  box.addEventListener('pointerleave', () => { paused = false; });
  box.addEventListener('focusin', () => { paused = true; });
  box.addEventListener('focusout', () => { paused = false; });
  show(0); start();
})();
