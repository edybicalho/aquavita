/* AquaVita Peças — "Minha hidro não liga": diagnóstico guiado.
   As perguntas e os resultados ficam em assets/js/diag-arvore.js (window.DIAG_ARVORE), para editar sem mexer aqui.
   Cada resposta leva a outra pergunta ou a um resultado com a causa provável, o que fazer, se precisa de
   técnico, as peças do catálogo e o WhatsApp com o caminho inteiro das respostas.
   Endereço direto para anúncios e posts: /?diagnostico=1 */
(() => {
  'use strict';
  const app = document.getElementById('diagApp');
  const A = window.DIAG_ARVORE, L = window.LOJA;
  if (!app || !A || !L) return;
  const { esc, brl, wa, icon } = L;
  const byId = Object.assign(Object.create(null), Object.fromEntries((window.PRODUTOS || []).map(p => [p.id, p])));
  const T = window.LOJA_TRACK;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CATS = { motobombas: 'motobombas', aquecedores: 'aquecedores', controladores: 'controladores', kits: 'kits' };

  let caminho = [];            // [{ no, opcao }] respostas dadas até aqui
  let atual = A.inicio;

  const passos = () => caminho.length + 1;

  function render(foco) {
    const n = A.nos[atual];
    if (!n) return;
    const migalhas = caminho.map((c, i) => `<li><button type="button" data-dg-ir="${i}" title="Voltar a esta pergunta">${esc(A.nos[c.no].curto || A.nos[c.no].titulo)}: <b>${esc(A.nos[c.no].opcoes[c.opcao].texto)}</b></button></li>`).join('');
    const topo = `<div class="dg-topo">
        ${caminho.length? `<button type="button" class="dg-voltar" data-dg-voltar>${icon('arrow')} Voltar</button>` : '<span></span>'}
        <span class="dg-passo">${n.tipo === 'resultado'? 'Resultado' : `Pergunta ${passos()}`}</span>
        ${caminho.length? '<button type="button" class="dg-reiniciar" data-dg-reiniciar>Recomeçar</button>' : '<span></span>'}
      </div>
      ${caminho.length? `<ol class="dg-migalhas">${migalhas}</ol>` : ''}`;
    const corpo = n.tipo === 'pergunta'? pergunta(n) : resultado(n);
    app.innerHTML = `<div class="dg-no${n.tipo === 'resultado'? ' dg-no--res' : ''}" data-no="${atual}">${topo}${corpo}</div>`;
    if (foco) {
      const h = app.querySelector('h3');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      const r = app.getBoundingClientRect();
      // desconta o cabeçalho fixo (no celular ele é mais alto, com a busca)
      const hdr = (document.querySelector('.header') || {}).offsetHeight || 80;
      if (r.top < hdr || r.top > innerHeight * 0.5) scrollTo({ top: r.top + scrollY - hdr - 12, behavior: reduce? 'auto' : 'smooth' });
    }
  }

  function pergunta(n) {
    const grade = n.opcoes.length > 3 && n.opcoes.every(o => o.icone);
    return `${n.alerta? `<p class="dg-alerta">${icon('shield')}<span>${esc(n.alerta)}</span></p>` : ''}
      <h3>${esc(n.titulo)}</h3>
      ${n.texto? `<p class="dg-texto">${esc(n.texto)}</p>` : ''}
      <div class="dg-opcoes${grade? ' dg-opcoes--grade' : ''}">
        ${n.opcoes.map((o, i) => `<button type="button" class="dg-opt" data-opt="${i}" style="--i:${i}">
          ${o.icone? `<span class="dg-opt__ic" aria-hidden="true">${o.icone}</span>` : ''}
          <span class="dg-opt__tx"><b>${esc(o.texto)}</b>${o.detalhe? `<small>${esc(o.detalhe)}</small>` : ''}</span>
          <span class="dg-opt__seta" aria-hidden="true">›</span></button>`).join('')}
      </div>`;
  }

  function resultado(n) {
    const prods = (n.produtos || []).filter(id => byId[id]);
    const cards = prods.map((id, i) => {
      const p = byId[id];
      return `<a class="dg-prod" data-dg-prod="${id}" href="${L.urlOf(p)}" style="--i:${i}">
        <img src="${p.img}" alt="" width="72" height="72" loading="lazy">
        <span><small>${esc(p.brand)}${p.estoque? '' : ' · fora de estoque'}</small><b>${esc(p.name.replace(/ – Hidromassagem e Spa$/, ''))}</b>
        <em>${p.varia? 'a partir de ' : ''}${brl(p.pix)} no PIX</em></span></a>`;
    }).join('');
    const nivel = n.tecnico
? `<span class="dg-selo dg-selo--tec">${icon('shield')} Chame um eletricista ou técnico</span>`
      : `<span class="dg-selo dg-selo--voce">${icon('check')} Você mesmo pode verificar</span>`;
    return `<div class="dg-res">
        ${nivel}
        <h3>${esc(n.titulo)}</h3>
        <p class="dg-causa"><b>Causa provável:</b> ${esc(n.causa)}</p>
        ${n.alerta? `<p class="dg-alerta">${icon('shield')}<span>${esc(n.alerta)}</span></p>` : ''}
        <h4>O que fazer</h4>
        <ol class="dg-fazer">${n.fazer.map(f => `<li>${esc(f)}</li>`).join('')}</ol>
        ${cards? `<h4>${prods.length === 1? 'Peça que costuma resolver' : 'Peças que costumam resolver'}</h4><div class="dg-prods">${cards}</div>` : ''}
        ${n.categoria && CATS[n.categoria]? `<a class="dg-cat" href="#catalogo" data-cat="${n.categoria}">Ver todos os modelos ${icon('arrow')}</a>` : ''}
        ${n.peca? `<p class="dg-peca">${icon('spark')}<span>${esc(n.peca)} <a href="#foto">Fotografe a peça antiga</a> e descubra o modelo certo.</span></p>` : ''}
        <a class="btn btn--wa btn--block dg-whats" target="_blank" rel="noopener" href="${linkWhats(n)}">${icon('wa')} Falar com um técnico da loja</a>
        <p class="dg-nota">Diagnóstico orientativo, com base nos manuais dos fabricantes. Não abra painéis elétricos nem mexa em partes ligadas na tomada: na dúvida, chame um profissional.</p>
      </div>`;
  }

  function linkWhats(n) {
    const respostas = caminho.map(c => `• ${A.nos[c.no].curto || A.nos[c.no].titulo} ${A.nos[c.no].opcoes[c.opcao].texto}`).join('\n');
    return wa(`Olá! Fiz o diagnóstico "Minha hidro não liga" no site.\n${respostas}\n\nResultado: ${n.titulo}.\nPodem me ajudar?`);
  }

  app.addEventListener('click', e => {
    const opt = e.target.closest('[data-opt]');
    if (opt) {
      const n = A.nos[atual], i = +opt.dataset.opt;
      caminho.push({ no: atual, opcao: i });
      atual = n.opcoes[i].ir;
      render(true);
      if (A.nos[atual].tipo === 'resultado' && T) T.event('diagnostico', { resultado: atual, passos: caminho.length });
      return;
    }
    if (e.target.closest('[data-dg-voltar]')) { const c = caminho.pop(); if (c) { atual = c.no; render(true); } return; }
    if (e.target.closest('[data-dg-reiniciar]')) { caminho = []; atual = A.inicio; render(true); return; }
    const ir = e.target.closest('[data-dg-ir]');
    if (ir) { const k = +ir.dataset.dgIr; atual = caminho[k].no; caminho = caminho.slice(0, k); render(true); return; }
    const cat = e.target.closest('.dg-cat[data-cat]');
    if (cat) { e.preventDefault(); Object.assign(L.state, { cat: cat.dataset.cat, q: '', brand: '' }); L.render(); document.getElementById('catalogo').scrollIntoView({ behavior: reduce? 'auto' : 'smooth' }); }
  });

  // os sintomas ao lado do quadro são atalhos: começam o diagnóstico já na resposta escolhida da primeira pergunta
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-dg-atalho]');
    if (!b) return;
    const i = +b.dataset.dgAtalho, raiz = A.nos[A.inicio];
    if (!raiz.opcoes[i]) return;
    caminho = [{ no: A.inicio, opcao: i }]; atual = raiz.opcoes[i].ir;
    render(true);
  });

  // o quadro só é montado quando a seção chega perto da tela (deixa a abertura da página mais leve);
  // link direto ou navegador antigo: monta já
  const secao = document.getElementById('diag');
  if (!secao || !('IntersectionObserver' in window) || new URLSearchParams(location.search).has('diagnostico')) render(false);
  else {
    const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { io.disconnect(); if (!caminho.length) render(false); } }, { rootMargin: '800px 0px' });
    io.observe(secao);
  }
  // link direto (/?diagnostico=1): rola até a seção depois que a página monta
  if (new URLSearchParams(location.search).has('diagnostico'))
    addEventListener('load', () => setTimeout(() => document.getElementById('diag').scrollIntoView({ behavior: 'auto' }), 150));
})();
