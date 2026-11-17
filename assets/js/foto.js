/* AquaVita Peças — "Fotografe sua peça".
   O visitante envia a foto da peça antiga; o servidor de IA (server/ia-proxy.mjs, rota /api/identificar)
   lê marca, potência e voltagem e devolve até três produtos do catálogo. O site mostra a leitura,
   as sugestões e leva ao WhatsApp para um consultor confirmar.
   Sem servidor configurado (config.js > ai), a seção funciona em modo demonstração: os três exemplos
   mostram respostas prontas e uma foto enviada vai para o WhatsApp. */
(() => {
  'use strict';
  const app = document.getElementById('fotoApp');
  const L = window.LOJA;
  if (!app || !L) return;
  const $ = id => document.getElementById(id);
  const CFG = (window.LOJA_CONFIG || {}).ai || {};
  const fotoEndpoint = endpoint => {
    const match = endpoint.match(/^(.*?)(?:\/?api\/chat)\/?$/);
    if (!match) return endpoint;
    const base = match[1];
    if (/^https?:\/\//i.test(base)) return `${base}/api/identificar`;
    const localBase = base.replace(/^\/+/, '');
    return `${localBase ? localBase + '/' : ''}api/identificar`;
  };
  const localEndpoint = value => value.startsWith('/') && !value.startsWith('//') ? value.replace(/^\/+/, '') : value;
  const ENDPOINT = localEndpoint(CFG.foto || (CFG.endpoint ? fotoEndpoint(CFG.endpoint) : ''));
  const T = window.LOJA_TRACK;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const { esc, brl, wa, icon } = L;
  const byId = Object.assign(Object.create(null), Object.fromEntries((window.PRODUTOS || []).map(p => [p.id, p])));

  const drop = $('fotoDrop'), input = $('fotoInput'), previa = $('fotoPrevia'), img = $('fotoImg'), status = $('fotoStatus');
  const acoes = $('fotoAcoes'), aceite = $('fotoAceite'), ir = $('fotoIr'), res = $('fotoRes');
  let foto = null, ocupado = false;

  /* Respostas prontas dos exemplos (lidas a partir das próprias fotos de exemplo) */
  const EXEMPLOS = {
    motobomba: {
      img: 'assets/img/foto/exemplo-motobomba.webp',
      r: { tipo_peca: 'motobomba', marca: 'Syllent', modelo: 'Linha Geração 2 (corpo azul, tampa preta)', codigo: '', potencia: '', tensao: '', corrente: '', outros: [],
        ilegivel: ['potência', 'tensão'], confianca: 'media',
        sugestoes: [
          { id: 'motobomba-syllent-1-2-cv', motivo: 'Mesma marca e mesmo formato de corpo da foto.' },
          { id: 'motobomba-syllent-1-3-cv', motivo: 'Mesma linha Geração 2, em versão de menor potência.' },
        ],
        observacao: 'A foto mostra a marca, mas não a etiqueta. Fotografe a etiqueta na lateral do motor para confirmar a potência e a voltagem.' },
    },
    painel: {
      img: 'assets/img/foto/exemplo-painel.webp',
      r: { tipo_peca: 'aquecedor', marca: 'Sanspray', modelo: 'DuoColors (painel digital)', codigo: '', potencia: '', tensao: '', corrente: '',
        outros: ['Comando para 2 motobombas', 'Botão de iluminação', 'Ajuste de temperatura'], ilegivel: ['potência', 'tensão'], confianca: 'alta',
        sugestoes: [{ id: 'aquecedor-sanspray-duo-digital-8000-w-220v', motivo: 'Mesmo painel Sanspray Duo, com comando para duas motobombas e iluminação.' }],
        observacao: 'O Duo do site é de 8000 W em 220 V. Confira a voltagem da sua instalação com o consultor.' },
    },
    sensor: {
      img: 'assets/img/foto/exemplo-sensor.webp',
      r: { tipo_peca: 'outra_peca', marca: '', modelo: 'Sensor de nível', codigo: 'F 15 24 212709', potencia: '', tensao: '', corrente: '',
        outros: ['Indicador de nível: 2 (baixo)'], ilegivel: [], confianca: 'alta', sugestoes: [],
        observacao: 'O sensor de nível ainda não está no site. Um consultor verifica no estoque completo da loja.' },
    },
  };

  const TIPOS = { motobomba: 'Motobomba', aquecedor: 'Aquecedor', controlador: 'Controlador', kit: 'Kit', outra_peca: 'Outra peça', nao_e_peca: 'Não parece uma peça' };
  const CONF = { alta: ['Leitura clara', 'ok'], media: ['Leitura parcial', 'mid'], baixa: ['Leitura incerta', 'low'] };

  /* ---------- foto: reduz para ~1024 px no próprio aparelho antes de enviar ---------- */
  function reduzir(file) {
    return new Promise((ok, falha) => {
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => {
        const s = Math.min(1, 1024 / Math.max(im.naturalWidth, im.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        ok(c.toDataURL('image/jpeg', 0.85));
      };
      im.onerror = () => { URL.revokeObjectURL(url); falha(new Error('imagem')); };
      im.src = url;
    });
  }

  function mostrarPrevia(src) {
    img.src = src; previa.hidden = false; drop.hidden = true;
    previa.classList.remove('is-scan', 'is-done');
    status.textContent = '';
  }
  function reiniciar() {
    foto = null; previa.hidden = true; drop.hidden = false; acoes.hidden = true; res.hidden = true; res.innerHTML = '';
    input.value = ''; aceite.checked = false; ir.disabled = true;
  }

  input.addEventListener('change', async () => {
    const f = input.files && input.files[0];
    if (!f) return;
    if (!/^image\//.test(f.type) && !/\.(heic|heif)$/i.test(f.name)) return L.toast('Escolha uma imagem (foto da peça).');
    try { foto = await reduzir(f); } catch { return L.toast('Não consegui abrir esta imagem. Tente outra foto.'); }
    mostrarPrevia(foto);
    res.hidden = true; res.innerHTML = '';
    if (!ENDPOINT) { acoes.hidden = true; return semServidor(); }
    acoes.hidden = false; ir.disabled = !aceite.checked;
  });
  aceite.addEventListener('change', () => { ir.disabled = !aceite.checked || !foto; });
  $('fotoTrocar').addEventListener('click', () => { reiniciar(); input.click(); });

  // arrastar e soltar no computador
  ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('is-over'); }));
  drop.addEventListener('drop', e => {
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!f) return;
    const dt = new DataTransfer(); dt.items.add(f); input.files = dt.files;
    input.dispatchEvent(new Event('change'));
  });

  /* ---------- leitura: animação de varredura enquanto a IA trabalha ---------- */
  const FRASES = ['Lendo a etiqueta…', 'Reconhecendo marca e modelo…', `Comparando com os ${Object.keys(byId).length} produtos do catálogo…`];
  function varrer() {
    previa.classList.add('is-scan'); previa.classList.remove('is-done');
    let i = 0; status.textContent = FRASES[0];
    const t = setInterval(() => { i = (i + 1) % FRASES.length; status.textContent = FRASES[i]; }, 1100);
    return () => { clearInterval(t); previa.classList.remove('is-scan'); previa.classList.add('is-done'); status.textContent = 'Leitura concluída'; };
  }

  ir.addEventListener('click', async () => {
    if (!foto || ocupado || !aceite.checked) return;
    ocupado = true; ir.disabled = true; res.hidden = true;
    const parar = varrer();
    try {
      const ctrl = new AbortController(), to = setTimeout(() => ctrl.abort(), 45000);
      const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imagem: foto }), signal: ctrl.signal });
      clearTimeout(to);
      const j = await r.json().catch(() => ({}));
      parar();
      if (!r.ok || !j.tipo_peca) throw Object.assign(new Error('falha'), { codigo: r.status });
      mostrar(j, false);
      if (T) T.event('foto_identificar', { modo: 'ia', tipo: j.tipo_peca, confianca: j.confianca, sugestoes: j.sugestoes.length });
    } catch (err) {
      parar(); status.textContent = '';
      falhou(err.codigo === 429? 'Muitas fotos em pouco tempo. Aguarde alguns minutos ou envie pelo WhatsApp.' : 'Não consegui ler esta foto agora.');
    } finally { ocupado = false; ir.disabled = !aceite.checked; }
  });

  app.addEventListener('click', e => {
    const ex = e.target.closest('[data-exemplo]');
    if (!ex || ocupado) return;
    const E = EXEMPLOS[ex.dataset.exemplo];
    ocupado = true; foto = null; acoes.hidden = true; res.hidden = true;
    mostrarPrevia(E.img);
    const parar = varrer();
    setTimeout(() => { parar(); mostrar(E.r, true); ocupado = false; }, reduce? 300 : 2600);
    if (T) T.event('foto_identificar', { modo: 'exemplo', exemplo: ex.dataset.exemplo });
  });

  /* ---------- resultado ---------- */
  const campo = (rotulo, v) => `<div class="fr__campo${v? '' : ' is-vazio'}"><dt>${rotulo}</dt><dd>${v? esc(v) : 'não visível'}</dd></div>`;

  function resumo(r) {
    const partes = [TIPOS[r.tipo_peca] || 'Peça', r.marca, r.modelo, r.potencia, r.tensao, r.codigo && `código ${r.codigo}`].filter(Boolean);
    return partes.join(' · ');
  }
  function linkWhats(r, sugestoes) {
    const linhas = ['Olá! Usei a identificação por foto do site.', `A leitura foi: ${resumo(r)}.`];
    if (r.ilegivel && r.ilegivel.length) linhas.push(`Não deu para ler: ${r.ilegivel.join(', ')}.`);
    if (sugestoes.length) linhas.push(`O site sugeriu: ${sugestoes.map(s => byId[s.id].name).join('; ')}.`);
    linhas.push('Vou enviar a foto aqui para vocês confirmarem a peça certa.');
    return wa(linhas.join('\n'));
  }
  // se a IA leu a voltagem, já deixa a variação certa escolhida no produto
  function voltagemDe(p, r) {
    if (!p.opcao || p.opcao.nome !== 'Voltagem' || !r.tensao) return null;
    const v = /22\d/.test(r.tensao)? '220' : /1[12]\d/.test(r.tensao)? '110' : '';
    const it = v && p.opcao.itens.find(i => i.valor.startsWith(v));
    return it? it.valor : null;
  }

  function mostrar(r, exemplo) {
    const sugestoes = (r.sugestoes || []).filter(s => byId[s.id]);
    const [confTxt, confCls] = CONF[r.confianca] || CONF.baixa;
    const cards = sugestoes.map((s, i) => {
      const p = byId[s.id];
      return `<article class="fr__prod" style="--i:${i}">
        <a href="${L.urlOf(p)}" class="fr__img"><img src="${p.img}" alt="" width="96" height="96" loading="lazy"></a>
        <div class="fr__info">
          <small>${esc(p.brand)}${p.estoque? '' : ' · fora de estoque'}</small>
          <a href="${L.urlOf(p)}"><b>${esc(p.name.replace(/ – Hidromassagem e Spa$/, ''))}</b></a>
          <p>${esc(s.motivo)}</p>
          <div class="fr__preco">${p.varia? '<small>a partir de</small> ' : ''}<b>${brl(p.pix)}</b> <span>no PIX</span></div>
        </div>
        <div class="fr__cta">
          ${p.estoque? `<button type="button" class="btn btn--primary btn--sm" data-fadd="${p.id}">${icon('cart')} Adicionar</button>` : ''}
          <a class="btn btn--ghost-dark btn--sm" href="${L.urlOf(p)}">Ver produto</a>
        </div>
      </article>`;
    }).join('');
    res.innerHTML = `
      ${exemplo? '<p class="fr__demo">Exemplo de demonstração · resposta pronta para esta foto</p>' : ''}
      <div class="fr__topo"><h3>O que a IA leu na foto</h3><span class="fr__conf fr__conf--${confCls}">${confTxt}</span></div>
      <dl class="fr__dados">
        ${campo('Tipo', TIPOS[r.tipo_peca])}${campo('Marca', r.marca)}${campo('Modelo', r.modelo)}
        ${campo('Potência', r.potencia)}${campo('Tensão', r.tensao)}${campo('Código', r.codigo)}
      </dl>
      ${r.outros && r.outros.length? `<ul class="fr__outros">${r.outros.map(o => `<li>${esc(o)}</li>`).join('')}</ul>` : ''}
      ${r.observacao? `<p class="fr__obs">${icon('spark')}<span>${esc(r.observacao)}</span></p>` : ''}
      ${sugestoes.length? `<h4>${sugestoes.length === 1? 'Peça compatível no catálogo' : 'Peças compatíveis no catálogo'}</h4><div class="fr__prods">${cards}</div>`
        : '<p class="fr__nada">Nenhuma peça do site corresponde a esta foto. A loja tem mais itens do que o site mostra: um consultor confere para você.</p>'}
      <a class="btn btn--wa btn--block fr__whats" target="_blank" rel="noopener" href="${linkWhats(r, sugestoes)}">${icon('wa')} Confirmar com um consultor no WhatsApp</a>
      <p class="fr__nota">Leitura automática por inteligência artificial. Antes de comprar, um consultor confirma se a peça serve na sua banheira.</p>`;
    res.hidden = false;
    res.querySelectorAll('[data-fadd]').forEach(b => b.addEventListener('click', () => {
      const p = byId[b.dataset.fadd], v = voltagemDe(p, r);
      if (v && L.setVariant) L.setVariant(p.id, v);
      L.add(p.id);
    }));
    if (matchMedia('(max-width:860px)').matches) res.scrollIntoView({ behavior: reduce? 'auto' : 'smooth', block: 'start' });
  }

  function semServidor() {
    res.innerHTML = `
      <div class="fr__topo"><h3>Foto recebida</h3><span class="fr__conf fr__conf--mid">Leitura automática em breve</span></div>
      <p class="fr__obs">${icon('spark')}<span>A leitura por inteligência artificial é ligada quando o site for publicado. Enquanto isso, envie esta foto para um consultor: ele identifica a peça para você.</span></p>
      <a class="btn btn--wa btn--block fr__whats" target="_blank" rel="noopener" href="${wa('Olá! Quero identificar uma peça da minha banheira. Vou enviar a foto aqui.')}">${icon('wa')} Enviar a foto pelo WhatsApp</a>
      <p class="fr__nota">Quer ver como funciona? Toque em um dos exemplos acima.</p>`;
    res.hidden = false;
  }
  function falhou(msg) {
    res.innerHTML = `<p class="fr__obs fr__obs--erro">${icon('spark')}<span>${esc(msg)} Tente uma foto mais de perto da etiqueta ou envie para um consultor.</span></p>
      <a class="btn btn--wa btn--block fr__whats" target="_blank" rel="noopener" href="${wa('Olá! Quero identificar uma peça da minha banheira. Vou enviar a foto aqui.')}">${icon('wa')} Enviar a foto pelo WhatsApp</a>`;
    res.hidden = false;
  }
})();
