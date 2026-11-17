/* AquaVita Peças — chat de atendimento com IA.
   Só aparece quando config.js tem ai.endpoint (ou ai.demo = true).
   O navegador fala apenas com o SEU servidor (server/ia-proxy.mjs); a chave da API fica lá. */
(() => {
  'use strict';
  const L = window.LOJA, CFG = (window.LOJA_CONFIG || {}).ai || {}, T = window.LOJA_TRACK;
  if (!L || !(CFG.endpoint || CFG.demo)) return;
  const { PRODUTOS, byId, brl, esc, icon, wa, add, openModal, matches } = L;
  const NOME = CFG.nome || 'Assistente';
  const DEMO = !CFG.endpoint;
  const MAX_TURNS = 20;

  const btn = document.createElement('button');
  btn.className = 'iabtn'; btn.setAttribute('aria-label', `Abrir ${NOME}`); btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = `${icon('spark')}<span>Pergunte à IA</span>`;
  const panel = document.createElement('section');
  panel.className = 'ia'; panel.hidden = true; panel.setAttribute('aria-label', NOME);
  panel.innerHTML = `
    <header class="ia__head">
      <span class="ia__av">${icon('spark')}</span>
      <div><b>${esc(NOME)}</b><small>${DEMO? 'Modo demonstração · IA ainda não conectada' : 'Atendimento por inteligência artificial'}</small></div>
      <button class="iconbtn" data-ia-close aria-label="Fechar">${icon('x')}</button>
    </header>
    <div class="ia__log" id="iaLog" role="log" aria-live="polite"></div>
    <div class="ia__chips" id="iaChips">
      <button>Qual motobomba de 1/2 CV vocês têm?</button>
      <button>Quero um kit com aquecedor</button>
      <button>Formas de pagamento</button>
    </div>
    <form class="ia__form" id="iaForm">
      <input id="iaInput" maxlength="500" autocomplete="off" placeholder="Escreva sua dúvida…" aria-label="Sua mensagem">
      <button class="ia__send" aria-label="Enviar">${icon('send')}</button>
    </form>
    <p class="ia__note">${DEMO? 'Demonstração: as respostas vêm de uma busca no catálogo.' : 'Respostas geradas por IA e podem conter erros.'} Confirme compatibilidade com um consultor antes de comprar.</p>`;
  document.body.append(btn, panel);

  const log = panel.querySelector('#iaLog'), input = panel.querySelector('#iaInput'), form = panel.querySelector('#iaForm');
  const history = [];
  let busy = false;

  function productCard(p) {
    return `<div class="ia__prod">
      <img src="${p.img}" alt="" data-ia-view="${p.id}">
      <div><b>${esc(p.name)}</b><span>${brl(p.pix)} <small>no PIX</small></span></div>
      ${p.estoque? `<button class="btn btn--primary" data-ia-add="${p.id}">${icon('plus')}</button>` : '<small class="ia__out">sem estoque</small>'}
    </div>`;
  }
  // A IA cita produtos como [[id-do-produto]]; aqui viram cartões
  function renderReply(text) {
    const ids = [];
    const clean = text.replace(/\[\[([\w-]+)\]\]/g, (_, id) => { if (byId[id] && !ids.includes(id)) ids.push(id); return ''; });
    const html = esc(clean.trim()).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>');
    return `<p>${html}</p>${ids.slice(0, 4).map(id => productCard(byId[id])).join('')}`;
  }
  function bubble(role, html) {
    const d = document.createElement('div');
    d.className = `ia__msg ia__msg--${role}`; d.innerHTML = html;
    log.appendChild(d); log.scrollTop = log.scrollHeight;
    return d;
  }
  const handoff = () => {
    const last = [...history].reverse().find(m => m.role === 'user');
    return `<a class="btn btn--wa ia__wa" target="_blank" rel="noopener" href="${wa(`Olá! Estava falando com o assistente do site${last? ` sobre: "${last.content.slice(0, 200)}"` : ''} e quero continuar com um consultor.`)}">${icon('wa')} Falar com um consultor</a>`;
  };

  function demoReply(q) {
    if (/pagamento|parcel|pix|boleto|cart[aã]o/i.test(q))
      return 'Você pode pagar no PIX ou boleto com 6% de desconto, ou no cartão em até 10x sem juros.';
    if (/frete|entrega|envio|prazo/i.test(q))
      return 'Enviamos para todo o Brasil. O frete e o prazo são calculados pelo consultor conforme o seu CEP.';
    const stop = new Set(['qual', 'quais', 'voces', 'vocês', 'tem', 'têm', 'quero', 'preciso', 'para', 'com', 'uma', 'um', 'de', 'do', 'da', 'que', 'o', 'a', 'os', 'as', 'e']);
    const terms = q.toLowerCase().replace(/[?!.,]/g, ' ').split(/\s+/).filter(w => w && !stop.has(w));
    let found = PRODUTOS.filter(p => matches(p, terms.join(' ')));
    for (let i = terms.length - 1; !found.length && i > 0; i--) found = PRODUTOS.filter(p => matches(p, terms.slice(0, i).join(' ')));
    if (!found.length) return 'Não encontrei isso no catálogo do site. Um consultor pode verificar o estoque completo da loja para você.';
    return `Encontrei ${found.length} ${found.length === 1? 'opção' : 'opções'} no catálogo:` + found.slice(0, 3).map(p => `[[${p.id}]]`).join('');
  }

  async function ask(text) {
    if (busy || !text) return;
    busy = true; panel.querySelector('#iaChips').hidden = true;
    history.push({ role: 'user', content: text });
    bubble('user', `<p>${esc(text)}</p>`);
    if (T) T.event('ia_mensagem', { modo: DEMO? 'demo' : 'ia', turno: history.filter(m => m.role === 'user').length });
    const wait = bubble('bot', '<span class="ia__dots"><i></i><i></i><i></i></span>');
    let reply;
    try {
      if (DEMO) { await new Promise(r => setTimeout(r, 500)); reply = demoReply(text); }
      else {
        const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 60000);
        const res = await fetch(CFG.endpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal,
          // a conversa enviada precisa começar por uma pergunta do cliente (o servidor recusa se começar pela resposta)
          body: JSON.stringify({ messages: (h => h.slice(h.findIndex(m => m.role === 'user')))(history.slice(-MAX_TURNS)) }),
        });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        reply = (await res.json()).reply;
        if (typeof reply !== 'string' || !reply.trim()) throw new Error('resposta vazia');
      }
      history.push({ role: 'assistant', content: reply });
      wait.innerHTML = renderReply(reply) + (history.length >= 4? handoff() : '');
    } catch (err) {
      history.pop();
      wait.classList.add('ia__msg--err');
      wait.innerHTML = `<p>Não consegui responder agora. Você pode tentar de novo ou falar direto com a equipe.</p>${handoff()}`;
      if (T) T.event('ia_erro', { motivo: String(err && err.message).slice(0, 60) });
    }
    log.scrollTop = log.scrollHeight;
    busy = false;
  }

  function toggle(open) {
    panel.hidden = !open; btn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('ia-open', open);
    if (open) {
      if (!log.children.length) bubble('bot', `<p>Olá! Sou o ${esc(NOME)}. Posso ajudar a encontrar motobombas, aquecedores, controladores e kits do nosso catálogo. O que você procura?</p>`);
      input.focus();
      if (T) T.event('ia_aberta', { modo: DEMO? 'demo' : 'ia' });
    } else btn.focus();
  }
  btn.addEventListener('click', () => toggle(panel.hidden));
  panel.addEventListener('click', e => {
    if (e.target.closest('[data-ia-close]')) return toggle(false);
    const a = e.target.closest('[data-ia-add]'); if (a) return add(a.dataset.iaAdd);
    const v = e.target.closest('[data-ia-view]'); if (v) return openModal(v.dataset.iaView);
    const c = e.target.closest('.ia__chips button'); if (c) ask(c.textContent);
  });
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
  form.addEventListener('submit', e => { e.preventDefault(); const t = input.value.trim(); input.value = ''; ask(t); });
})();
