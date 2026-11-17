// Roda dentro da página, numa tela de celular: procura problemas de layout e de toque
(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const W = innerWidth, H = innerHeight, out = { largura: W };
  const nome = el => ((el.id? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim()? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '')) || el.tagName.toLowerCase();
  const visivel = el => {
    const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05 && !el.closest('[hidden],[inert],[aria-hidden=true]');
  };
  // áreas que rolam para o lado de propósito
  const ROLA = '[class*=rail],[class*=scroll],[class*=thumbs],[class*=chips],[class*=tabs],.cmpt,[class*=marquee],[class*=provas],.sc-stage,[class*=tubp],[class*=track]';
  const alturaTotal = document.documentElement.scrollHeight;
  const vazam = new Map(), pequenos = new Map(), letras = new Map();
  for (let y = 0; y <= alturaTotal; y += Math.round(H * 0.8)) {
    scrollTo(0, y); await sleep(120);
    for (const el of document.querySelectorAll('body *')) {
      if (!visivel(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > H) continue;
      if ((r.right > W + 1 || r.left < -1) && !el.closest(ROLA) && !el.matches('.skip') && getComputedStyle(el).position !== 'fixed') vazam.set(nome(el), Math.round(r.right - W));
      if (el.matches('a[href],button,input:not([type=hidden]),select,[role=button]') && (r.width < 40 || r.height < 40) && !el.closest('p')) {
        const t = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30);
        pequenos.set(nome(el) + ' "' + t + '"', Math.round(r.width) + 'x' + Math.round(r.height));
      }
      if ([...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 2)) {
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 12) letras.set(nome(el) + ' "' + el.textContent.trim().replace(/\s+/g, ' ').slice(0, 25) + '"', fs + 'px');
      }
    }
  }
  scrollTo(0, 0); await sleep(200);
  out.rolagemLateral = Math.max(0, document.documentElement.scrollWidth - W);
  out.vazam = [...vazam].slice(0, 12);
  out.toquePequeno = [...pequenos].slice(0, 30); out.totalToquePequeno = pequenos.size;
  out.letraMiuda = [...letras].slice(0, 15); out.totalLetraMiuda = letras.size;
  out.fixos = [...document.querySelectorAll('body *')].filter(e => visivel(e) && getComputedStyle(e).position === 'fixed')
    .map(e => { const r = e.getBoundingClientRect(); return nome(e) + ` ${Math.round(r.top)}-${Math.round(r.bottom)}`; });
  return out;
})()
