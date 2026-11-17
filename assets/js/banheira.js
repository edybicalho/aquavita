/* AquaVita Peças — a banheira que se desmonta com a rolagem (ato de abertura da página inicial).
   Duas fotos (montada e desmontada) trocadas pela rolagem; depois, uma peça por vez com um foco de luz.
   A lista de peças é o próprio HTML (.tub-list): cada <li> traz a posição da peça na foto (data-x, data-y).
   Roda depois de xp.js, que monta o motor scroll-craft. */
(() => {
  'use strict';
  const act = document.getElementById('banheira');
  if (!act || document.body.classList.contains('landing')) return;
  const media = document.getElementById('tubMedia');
  const hots = document.getElementById('tubHots');
  const rows = [...document.querySelectorAll('#tubList > li')];
  const states = [...act.querySelectorAll('.xp-state')];
  const stops = [...act.querySelectorAll('[data-tub-stop]')];
  const reduce = !!(window.ScrollCraft && window.ScrollCraft.reduce);

  /* Faixas da rolagem (progresso do ato, 0 a 1) */
  const OPEN_FROM = 0.1, OPEN_TO = 0.42;      // a banheira se desmonta
  const STEP_FROM = 0.46;                      // daqui em diante, uma peça por vez

  const parts = rows.map((li, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tubp-hot';
    b.style.left = li.dataset.x; b.style.top = li.dataset.y;
    b.textContent = i + 1;
    b.setAttribute('aria-label', li.querySelector('b').textContent);
    b.tabIndex = -1;                           // pelo teclado, a lista ao lado já cobre as peças
    hots.appendChild(b);
    li.style.setProperty('--n', `"${i + 1}"`);
    return { li, hot: b, btn: li.querySelector('button'), x: li.dataset.x, y: li.dataset.y, zoom: +(li.dataset.zoom || 3) };
  });
  /* A janela de cada peça: dica de compra, modelos do catálogo com preço e o botão que leva aos produtos */
  const L = window.LOJA, PRODUTOS = window.PRODUTOS || [];
  const esc = t => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  parts.forEach(P => {
    const info = P.li.querySelector('.tub-info'), cta = info.querySelector('a');
    const cat = P.li.dataset.cat, dica = P.li.dataset.dica;
    let extra = '';
    if (dica) extra += `<p class="tub-tip"><b>Para acertar na compra</b>${esc(dica)}</p>`;
    if (cat && L) {
      // os três modelos mais em conta que estão em estoque, como amostra da linha
      const mods = PRODUTOS.filter(x => x.cat === cat && x.estoque).sort((a, b) => a.pix - b.pix).slice(0, 3);
      extra += `<div class="tub-mods">${mods.map(m => `<a href="${L.urlOf(m)}" title="${esc(m.name)}">
          <img src="${m.img}" alt="" loading="lazy" width="96" height="96">
          <span>${esc(m.name.replace(/ – Hidromassagem e Spa$/, ''))}</span>
          <b>${m.varia? '<small>a partir de </small>' : ''}${L.brl(m.pix)}</b></a>`).join('')}</div>`;
    }
    cta.classList.add('xp-btn');
    if (!cat) { cta.classList.add('xp-btn--line'); cta.textContent = 'Pedir pelo WhatsApp'; }
    cta.insertAdjacentHTML('beforebegin', extra);
  });
  // navegação da janela: anterior, próxima e posição
  const nav = document.createElement('div');
  nav.className = 'tub-nav';
  nav.innerHTML = '<button type="button" data-tub-prev aria-label="Peça anterior">‹</button><span></span><button type="button" data-tub-next aria-label="Próxima peça">›</button>';
  document.getElementById('tubList').after(nav);
  const navCount = nav.querySelector('span');

  /* Peças em camadas: cada peça é uma imagem recortada (.tubp-part) que sai de dentro da banheira e voa
     até o seu lugar na vista explodida. A posição final é a da foto; o ponto de partida fica sob o casco. */
  const ORIGIN = { x: 63, y: 44 };             // de onde as peças saem (% da foto)
  const layers = [...document.querySelectorAll('.tubp-part')].map(el => {
    const cx = parseFloat(el.style.left) + parseFloat(el.style.width) / 2;
    const cy = parseFloat(el.style.top) + parseFloat(el.dataset.h || 0) / 2;
    return { el, part: el.dataset.part, dx: ORIGIN.x - cx, dy: ORIGIN.y - cy, rot: +(el.dataset.rot || 0), dist: Math.hypot(ORIGIN.x - cx, ORIGIN.y - cy) };
  });
  // as mais próximas da banheira saem primeiro, as mais distantes por último
  [...layers].sort((a, b) => a.dist - b.dist).forEach((L, i, arr) => { L.delay = 0.3 + 0.32 * i / Math.max(arr.length - 1, 1); });
  const layerOf = {};
  layers.forEach(L => { layerOf[L.part] = L; });
  const ease = t => 1 - Math.pow(1 - t, 3);
  function drawLayers(open) {
    layers.forEach(L => {
      const t = reduce? Math.round(open) : clamp((open - L.delay) / 0.38);
      const e = ease(t), k = 1 - e;
      const s = L.el.style;
      // em unidades da foto (cqw/cqh), para valer em qualquer tamanho de tela
      s.setProperty('--ox', (L.dx * k * 0.88).toFixed(2));
      s.setProperty('--oy', (L.dy * k * 0.88).toFixed(2));
      s.setProperty('--or', (L.rot * k).toFixed(1));
      s.setProperty('--os', (0.55 + 0.45 * e).toFixed(3));
      s.setProperty('--oo', clamp(t * 2.2).toFixed(3));
    });
  }

  const count = document.getElementById('tubCount');
  if (count) count.textContent = `${parts.length} peças`;

  const clamp = v => Math.min(1, Math.max(0, v));
  const progress = () => {
    const r = act.getBoundingClientRect();
    return clamp(-r.top / Math.max(r.height - innerHeight, 1));
  };
  const stepOf = p => (p < STEP_FROM? -1 : Math.min(parts.length - 1, Math.floor((p - STEP_FROM) / (1 - STEP_FROM) * parts.length)));
  const pOfStep = i => STEP_FROM + (i + 0.5) / parts.length * (1 - STEP_FROM);

  let lastP = -1, lastStep = -2, lastIntro = null, ticking = false, lastCur = -1;
  // a foto em resolução máxima só é baixada quando o close vai começar
  const imgB = document.getElementById('tubImgB');
  let hi = false;
  function hires() {
    if (hi || !imgB || !imgB.dataset.hires) return; hi = true;
    const pre = new Image();
    pre.onload = () => { imgB.removeAttribute('srcset'); imgB.src = pre.src; };
    pre.src = imgB.dataset.hires;
  }
  function draw() {
    ticking = false;
    const p = progress();
    if (Math.abs(p - lastP) < 0.0004) return;
    lastP = p;
    // 0 = montada, 1 = desmontada. O CSS faz a troca das fotos a partir deste valor.
    const open = clamp((p - OPEN_FROM) / (OPEN_TO - OPEN_FROM));
    if (open > 0.6) hires();
    media.style.setProperty('--open', (reduce? Math.round(open) : open).toFixed(3));
    drawLayers(open);

    const intro = p < 0.25;
    if (intro !== lastIntro) {
      lastIntro = intro;
      states[0].toggleAttribute('inert', !intro);
      states[1].toggleAttribute('inert', intro);
    }

    const step = stepOf(p);
    // a régua (Montada / Desmontada / Peças) acompanha a rolagem mesmo quando a peça da vez não muda
    const cur = p < OPEN_FROM + 0.05? 0 : step >= 0? 2 : 1;
    if (cur !== lastCur) { lastCur = cur; stops.forEach((b, i) => b.setAttribute('aria-current', String(i === cur))); }
    if (step === lastStep) return;
    lastStep = step;
    act.classList.toggle('is-stepping', step >= 0);
    parts.forEach((P, i) => {
      const on = i === step;
      P.hot.classList.toggle('is-on', on);
      P.li.classList.toggle('is-on', on);
      P.btn.setAttribute('aria-expanded', String(on));
    });
    const on = parts[step];
    // no peça-por-peça, a peça da vez se destaca e as outras ficam em segundo plano
    const focus = on && layerOf[on.li.dataset.part];
    act.classList.toggle('is-focus', !!focus);
    layers.forEach(L => L.el.classList.toggle('is-on', L === focus));
    // aproxima na peça da vez; fora do peça-por-peça, volta à vista inteira
    media.style.setProperty('--z', on? on.zoom : 1);
    act.classList.toggle('is-ring', !!on && on.zoom >= 3);
    if (on) navCount.textContent = `Peça ${step + 1} de ${parts.length}`;
    if (on) {
      hires();
      media.style.setProperty('--sx', on.x); media.style.setProperty('--sy', on.y);
      // em telas largas a lista rola para manter a peça ativa visível
      const list = on.li.parentElement;
      if (list.scrollHeight > list.clientHeight + 4)
        list.scrollTo({ top: on.li.offsetTop - list.clientHeight / 2 + on.li.offsetHeight / 2, behavior: 'auto' });
    }
  }
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(draw); } };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', () => { lastP = -1; request(); });
  draw();

  /* Clicar numa peça (na foto ou na lista) ou numa etapa leva a rolagem até ela */
  const goTo = p => {
    const top = act.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + (act.offsetHeight - innerHeight) * p, behavior: reduce? 'auto' : 'smooth' });
  };
  parts.forEach((P, i) => {
    P.btn.addEventListener('click', () => goTo(pOfStep(i)));
    P.hot.addEventListener('click', () => goTo(pOfStep(i)));
  });
  stops.forEach(b => b.addEventListener('click', () => goTo(+b.dataset.tubStop)));
  nav.addEventListener('click', e => {
    if (e.target.closest('[data-tub-prev]')) goTo(lastStep > 0? pOfStep(lastStep - 1) : 0.44);
    if (e.target.closest('[data-tub-next]')) {
      if (lastStep < parts.length - 1) goTo(pOfStep(lastStep + 1));
      else document.getElementById('categorias').scrollIntoView({ behavior: reduce? 'auto' : 'smooth' });
    }
  });
  // setas do teclado passam as peças enquanto a cena está na tela
  addEventListener('keydown', e => {
    if (lastStep < 0 || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    if (/^(input|textarea|select)$/i.test(document.activeElement.tagName)) return;
    const r = act.getBoundingClientRect();
    if (r.top > 0 || r.bottom < innerHeight) return;
    e.preventDefault();
    nav.querySelector(e.key === 'ArrowRight'? '[data-tub-next]' : '[data-tub-prev]').click();
  });
})();
