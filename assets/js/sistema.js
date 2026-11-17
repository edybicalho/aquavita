/* AquaVita Peças — "Monte seu sistema" (compatibilidade e instalação elétrica) e comparativos.
   Os números vêm de assets/js/tecnico.js; preços e estoque, de assets/js/products.js. */
(() => {
  'use strict';
  const L = window.LOJA, T = window.TECNICO; if (!L || !T) return;
  const { byId, brl, esc, wa, icon, add, openModal, toast, setVariant } = L;
  const $ = (s, el = document) => el.querySelector(s);
  const PIX = 0.94;
  const r2 = L.r2; // mesmo arredondamento do carrinho
  const num = (n, d = 1) => n == null? '—' : n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const cvNum = s => s == null? null : s.includes('/')? s.split('/').reduce((a, b) => a / b) : Number(s.replace(',', '.'));
  const prod = id => byId[id];
  const motorOf = id => T.motobombas[id] || null;
  const RECURSOS = { cromo: 'Cromoterapia', app: 'Aplicativo no celular', voz: 'Alexa / Google', borbulhador: 'Borbulhador', filtro: 'Filtragem programada' };

  // Tensões em que a motobomba é vendida (o rótulo "110 V" do catálogo é a rede de 127 V)
  function tensoes(p, todas) {
    if (!p.opcao || p.opcao.nome !== 'Voltagem') return [220];
    return p.opcao.itens.filter(i => todas || i.estoque).map(i => i.valor === '110v'? 127 : 220);
  }
  // Preço no PIX de uma variação (valor) ou o menor preço do produto
  function pix(p, valor) {
    const it = valor && p.opcao && p.opcao.itens.find(i => i.valor === valor);
    return it? r2(it.cheio * PIX) : p.pix;
  }
  // Variação de voltagem da motobomba para a tensão escolhida (127 V usa a de 110 V)
  const vMot = p => (p.opcao && p.opcao.nome === 'Voltagem')? (st.v === 127? '110v' : '220v') : undefined;
  const temVariasOpcoes = (p, valor) => p.opcao && p.opcao.itens.length > 1 && !(valor && p.opcao.itens.some(i => i.valor === valor));

  /* ================= Monte seu sistema ================= */
  const box = $('#sys');
  const st = { v: null, n: 1, rec: new Set(), central: null, motor: null, todos: false };

  function versao(c) { return c.versoes.filter(x => x.v === st.v).sort((a, b) => b.w - a.w)[0] || null; }

  function centrais() {
    return Object.entries(T.centrais)
      .map(([id, c]) => ({ id, c, p: prod(id), ver: versao(c) }))
      .filter(x => x.p && x.ver && x.c.saidas >= st.n && [...st.rec].every(r => x.c.recursos[r]))
      .sort((a, b) => Number(b.p.estoque) - Number(a.p.estoque) || pix(a.p, a.ver.valor) - pix(b.p, b.ver.valor));
  }

  // Resultado da checagem motobomba x saída do aquecedor
  function checa(m, c) {
    const lim = c.bombaMax;
    if (!lim) return { ok: true, txt: 'Compatível com as saídas do aquecedor' };
    if (lim.a) {
      const a = m.corrente && m.corrente[st.v];
      if (a == null) return { ok: null, txt: 'Corrente não informada pelo fabricante: o consultor confirma' };
      return a <= lim.a
? { ok: true, txt: `${num(a, 2)} A, dentro do limite de ${num(lim.a)} A da saída` }
        : { ok: false, txt: `${num(a, 1)} A em ${st.v} V passa do limite de ${num(lim.a)} A da saída do aquecedor` };
    }
    const max = lim.cv && lim.cv[st.v], cv = cvNum(m.cv);
    if (max == null || cv == null) return { ok: null, txt: 'O consultor confirma a compatibilidade' };
    return cv <= max
? { ok: true, txt: `Até ${num(max, max % 1? 1 : 0)} CV por saída em ${st.v} V` }
      : { ok: false, txt: `Passa de ${num(max, max % 1? 1 : 0)} CV, o máximo por saída em ${st.v} V` };
  }

  function motores(c) {
    return Object.entries(T.motobombas)
      .map(([id, m]) => ({ id, m, p: prod(id) }))
      .filter(x => x.p && x.p.estoque && tensoes(x.p).includes(st.v))
      .map(x => ({ ...x, chk: checa(x.m, c) }))
      .sort((a, b) => (a.chk.ok === false) - (b.chk.ok === false) || (a.chk.ok === null) - (b.chk.ok === null) || pix(a.p, vMot(a.p)) - pix(b.p, vMot(b.p)));
  }

  const btn = (k, v, label, on, sub = '') =>
    `<button type="button" class="sys__opt" data-k="${k}" data-v="${v}" aria-pressed="${on}"><b>${label}</b>${sub? `<small>${sub}</small>` : ''}</button>`;

  function renderSys() {
    if (!box) return;
    const perguntas = `
      <div class="sys__q">
        <p class="sys__lbl"><span>1</span> Qual a tensão no ponto da banheira?</p>
        <div class="sys__opts">${btn('v', 127, '127 V', st.v === 127, 'a rede chamada de 110')}${btn('v', 220, '220 V', st.v === 220)}</div>
        <details class="sys__help"><summary>Como saber?</summary><p>Veja a etiqueta do disjuntor que alimenta a banheira ou pergunte ao eletricista. Aquecedores de 8.000 W só funcionam em 220 V. Se não tiver certeza, <a href="${wa('Olá! Não sei qual é a tensão da minha instalação. Podem me ajudar a escolher aquecedor e motobomba?')}" target="_blank" rel="noopener">fale com um consultor</a>.</p></details>
      </div>
      <div class="sys__q">
        <p class="sys__lbl"><span>2</span> Quantas motobombas a banheira tem?</p>
        <div class="sys__opts sys__opts--n">${[1, 2, 3, 4].map(n => btn('n', n, String(n), st.n === n)).join('')}</div>
        <p class="sys__hint">Conte os motores que ficam embaixo da banheira. A maioria das banheiras residenciais tem 1.</p>
      </div>
      <div class="sys__q">
        <p class="sys__lbl"><span>3</span> Quer algum destes recursos? <small>opcional</small></p>
        <div class="sys__opts sys__opts--rec">${Object.entries(RECURSOS).filter(([k]) => k !== 'filtro').map(([k, t]) => btn('rec', k, t, st.rec.has(k))).join('')}</div>
      </div>`;

    let res;
    if (!st.v) {
      res = `<div class="sys__empty">${icon('spark')}<b>Comece pela tensão</b><p>Com a tensão e o número de motobombas mostramos o aquecedor certo, as motobombas que ele aceita e o fio e o disjuntor que a instalação precisa.</p></div>`;
    } else {
      const lista = centrais();
      if (!lista.length) {
        res = `<div class="sys__empty"><b>Nenhum aquecedor do site atende essa combinação</b><p>${st.v === 127? 'Em 127 V há poucas opções e todas comandam 1 motobomba. Os modelos com mais recursos são de 220 V.' : 'Tente tirar algum recurso ou diminuir o número de motobombas.'}</p>
          <a class="btn btn--wa" target="_blank" rel="noopener" href="${wa(`Olá! Procuro aquecedor para banheira em ${st.v} V com ${st.n} motobomba(s)${st.rec.size? ` e ${[...st.rec].map(r => RECURSOS[r]).join(', ')}` : ''}. Vocês têm?`)}">${icon('wa')} Perguntar ao consultor</a></div>`;
      } else {
        if (!lista.some(x => x.id === st.central)) st.central = lista[0].id;
        const cen = lista.find(x => x.id === st.central);
        const mot = motores(cen.c);
        const bons = mot.filter(x => x.chk.ok !== false);
        if (!bons.some(x => x.id === st.motor)) st.motor = bons[0]? bons[0].id : null;
        const mSel = mot.find(x => x.id === st.motor);
        const ver = cen.ver;
        const total = pix(cen.p, ver.valor) + (mSel? pix(mSel.p, vMot(mSel.p)) * st.n : 0);
        const recTags = c => Object.keys(RECURSOS).filter(r => c.recursos[r]).map(r => `<i>${RECURSOS[r]}</i>`).join('');
        const fora = mot.filter(x => x.chk.ok === false);

        res = `
        <div class="sys__step">
          <p class="sys__h">${icon('check')} ${lista.some(x => x.c.tipo === 'Controlador')? 'Aquecedor ou controlador' : 'Aquecedor'} para ${st.n} motobomba${st.n > 1? 's' : ''} em ${st.v} V</p>
          <div class="sys__cards">${lista.slice(0, 4).map(x => `
            <button type="button" class="sys__card" data-central="${x.id}" aria-pressed="${x.id === st.central}">
              <img src="${x.p.img}" alt="" loading="lazy" width="64" height="64">
              <span><b>${esc(x.p.name)}</b>
                <small>${x.c.tipo} · comanda até ${x.c.saidas} motobomba${x.c.saidas > 1? 's' : ''} · ${num(x.ver.w / 1000, 1).replace(',0', '')} kW</small>
                <span class="sys__tags">${recTags(x.c)}</span>
                <span class="sys__price">${temVariasOpcoes(x.p, x.ver.valor)? '<small>a partir de </small>' : ''}${brl(pix(x.p, x.ver.valor))} <small>no PIX</small>${x.p.estoque? '' : ' <em>sem estoque</em>'}</span>
              </span>
            </button>`).join('')}</div>
          ${lista.length > 4? `<p class="sys__hint">Mais ${lista.length - 4} opç${lista.length - 4 > 1? 'ões' : 'ão'} no comparativo de aquecedores, logo abaixo.</p>` : ''}
        </div>

        <div class="sys__step">
          <p class="sys__h">${icon('check')} Motobomba${st.n > 1? `s (${st.n} iguais)` : ''} que funciona${st.n > 1? 'm' : ''} com ele em ${st.v} V</p>
          ${bons.length? `<div class="sys__mots">${bons.filter((x, i) => st.todos || i < 5 || x.id === st.motor).map(x => `
            <button type="button" class="sys__mot" data-motor="${x.id}" aria-pressed="${x.id === st.motor}">
              <img src="${x.p.img}" alt="" loading="lazy" width="48" height="48">
              <span><b>${esc(x.p.name)}</b><small>${x.m.vazao? `Vazão ${num(x.m.vazao)} m³/h · ` : ''}${x.m.pressao? `pressão ${num(x.m.pressao)} mca · ` : ''}${x.chk.ok === null? '<em>' + x.chk.txt + '</em>' : x.chk.txt}</small></span>
              <span class="sys__price">${brl(pix(x.p, vMot(x.p)))}</span>
            </button>`).join('')}</div>${!st.todos && bons.length > 5? `<button type="button" class="sys__mais" data-todos>Ver mais ${bons.length - 5} motobomba${bons.length - 5 > 1? 's' : ''}</button>` : ''}` : '<p class="sys__hint">Nenhuma motobomba do site em estoque nessa tensão. Fale com um consultor.</p>'}
          ${fora.length? `<details class="sys__fora"><summary>${fora.length} motobomba${fora.length > 1? 's' : ''} não serve${fora.length > 1? 'm' : ''} neste aquecedor</summary><ul>${fora.map(x => `<li><b>${esc(x.p.name)}</b>: ${x.chk.txt}.</li>`).join('')}</ul></details>` : ''}
        </div>

        <div class="sys__step sys__elet">
          <p class="sys__h">${icon('shield')} Instalação elétrica do aquecedor</p>
          <dl>
            <div><dt>Corrente</dt><dd>${num(ver.a)} A</dd></div>
            <div><dt>Fio mínimo</dt><dd>${ver.fio} mm²</dd></div>
            <div><dt>Disjuntor DR</dt><dd>${ver.dr} A · 30 mA</dd></div>
            <div><dt>Circuito</dt><dd>Exclusivo, com aterramento</dd></div>
          </dl>
          <ul>
            ${ver.ref === 'geral'? `<li>Valores de referência para aparelhos de ${num(ver.w / 1000, 1).replace(',0', '')} kW em ${ver.v} V. Confira no manual que acompanha o produto.</li>` : '<li>Valores do manual do fabricante.</li>'}
            <li>A motobomba é ligada na saída do aquecedor e não precisa de circuito próprio.</li>
            ${cen.p.brand === 'Sanspray'? '<li><b>Sem disjuntor DR e aterramento a garantia Sanspray não vale.</b></li>' : '<li>Use disjuntor DR e aterramento: protegem contra choque e são exigidos pelos fabricantes.</li>'}
            <li>Nunca ligue a motobomba sem água. A instalação deve ser feita por eletricista, conforme a NBR 5410.</li>
          </ul>
        </div>

        ${st.v === 220 && st.n === 1 && !st.rec.size? `<p class="sys__kit">${icon('spark')} Prefere tudo junto? Os <a href="?categoria=kits#catalogo" data-kits>kits motobomba + aquecedor 3 funções</a> já vêm combinados.</p>` : ''}

        <div class="sys__sum">
          <div><small>Seu sistema</small><b>${esc(cen.p.name)}${mSel? ` + ${st.n > 1? st.n + '× ' : ''}${esc(mSel.p.name)}` : ''}</b>
            <span>${brl(total)} <small>no PIX${temVariasOpcoes(cen.p, ver.valor)? ' · a partir de' : ''}</small></span></div>
          <div class="sys__acts">
            <button type="button" class="btn btn--primary" id="sysAdd">${icon('cart')} Adicionar ao carrinho</button>
            <a class="btn btn--wa" target="_blank" rel="noopener" id="sysWa" href="${wa(`Olá! Montei meu sistema no site:\n• ${cen.p.name}${ver.valor? ` (${ver.w} W / ${ver.v} V)` : ''}\n${mSel? `• ${st.n}× ${mSel.p.name} (${st.v} V)\n` : ''}Instalação: ${st.v} V, fio de ${ver.fio} mm², DR de ${ver.dr} A.\nPodem confirmar a compatibilidade?`)}">${icon('wa')} Confirmar com consultor</a>
          </div>
        </div>`;
      }
    }
    box.innerHTML = `<div class="sys__form">${perguntas}</div><div class="sys__res" aria-live="polite">${res}</div>`;
  }

  box && box.addEventListener('click', e => {
    const o = e.target.closest('.sys__opt');
    if (o) {
      const { k, v } = o.dataset;
      if (k === 'v') st.v = Number(v);
      if (k === 'n') st.n = Number(v);
      if (k === 'rec') st.rec.has(v)? st.rec.delete(v) : st.rec.add(v);
      renderSys();
      document.dispatchEvent(new CustomEvent('LOJA:sistema', { detail: { tensao: st.v, motobombas: st.n, recursos: [...st.rec] } }));
      return;
    }
    const c = e.target.closest('[data-central]'); if (c) { st.central = c.dataset.central; renderSys(); return; }
    if (e.target.closest('[data-todos]')) { st.todos = true; renderSys(); return; }
    const m = e.target.closest('[data-motor]'); if (m) { st.motor = m.dataset.motor; renderSys(); return; }
    if (e.target.closest('[data-kits]')) { e.preventDefault(); L.state.cat = 'kits'; L.render(); $('#catalogo').scrollIntoView({ behavior: 'smooth' }); return; }
    if (e.target.closest('#sysAdd')) {
      const cen = T.centrais[st.central], ver = versao(cen);
      if (ver.valor) setVariant(st.central, ver.valor);
      // se faltar escolher os spots, a loja abre a janela de escolha e nada mais entra no carrinho
      if (!add(st.central, 1)) return;
      if (st.motor) {
        const mp = prod(st.motor), v = vMot(mp);
        if (v) setVariant(st.motor, v);
        add(st.motor, st.n);
      }
    }
  });
  renderSys();

  /* ================= Comparativos ================= */
  const tabs = $('#cmpTabs'), area = $('#cmpArea');
  const ABAS = { motobombas: 'Motobombas', aquecedores: 'Aquecedores', controladores: 'Controladores', kits: 'Kits' };
  let aba = 'motobombas';

  const sim = v => v? `<span class="ok" aria-label="Sim">${icon('check')}</span>` : '<span class="no" aria-label="Não">—</span>';
  const prodCell = p => `<th scope="row"><a href="produto/${p.id}.html"><img src="${p.img}" alt="" loading="lazy" width="48" height="48"><span>${esc(p.name)}${p.estoque? '' : '<em>sem estoque</em>'}</span></a></th>`;
  const precoCell = p => `<td class="cmpt__p">${p.opcao && p.opcao.itens.length > 1? '<small>a partir de</small>' : ''}${brl(p.pix)}<small>no PIX</small></td>`;
  const best = (v, max) => v != null && v === max? ' class="best"' : '';
  const corr = (m, so220) => m.corrente? (so220? [220] : [127, 220]).filter(t => m.corrente[t] != null).map(t => `${num(m.corrente[t])} A <small>${t} V</small>`).join('<br>') : '—';
  const vaz = m => m.vazao? `${num(m.vazao)}<small>${m.vazaoRef === 'máxima'? 'máx.' : 'a ' + m.vazaoRef}</small>` : '—';

  function tabela() {
    let head, rows, nota;
    if (aba === 'motobombas' || aba === 'kits') {
      const lista = Object.entries(aba === 'kits'? T.kits : T.motobombas)
        .map(([id, x]) => ({ id, p: prod(id), m: aba === 'kits'? (typeof x.motor === 'string'? motorOf(x.motor) : x.motor) : x }))
        .filter(x => x.p && x.m).sort((a, b) => a.p.pix - b.p.pix);
      const maxV = Math.max(...lista.map(x => x.m.vazao || 0)), maxP = Math.max(...lista.map(x => x.m.pressao || 0));
      head = `<th scope="col">${aba === 'kits'? 'Kit' : 'Motobomba'}</th><th scope="col">Potência</th><th scope="col">Vazão (m³/h)</th><th scope="col">Pressão máx. (mca)</th><th scope="col">Corrente</th><th scope="col">${aba === 'kits'? 'Aquecedor' : 'Tensões'}</th><th scope="col">Garantia</th><th scope="col">Preço</th>`;
      rows = lista.map(({ p, m }) => `<tr>${prodCell(p)}
        <td>${m.cv} CV</td><td${best(m.vazao, maxV)}>${vaz(m)}</td><td${best(m.pressao, maxP)}>${num(m.pressao)}</td><td>${corr(m, aba === 'kits')}</td>
        <td>${aba === 'kits'? '3 Funções · 5.000 ou 8.000 W · 220 V' : tensoes(p, true).map(t => t + ' V').join(' / ')}</td><td>${m.garantia || '—'}</td>${precoCell(p)}</tr>`).join('');
      nota = 'Vazão informada pelo fabricante a 2 m de altura (Syllent) e a 4 m (Lepono LSPA 600); Komeco e Lepono LSPA 1100 informam a vazão máxima. Quanto maior a altura, menor a vazão. “—” = o fabricante não informa.';
    } else {
      const tipo = aba === 'aquecedores'? 'Aquecedor' : 'Controlador';
      const lista = Object.entries(T.centrais).filter(([, c]) => c.tipo === tipo)
        .map(([id, c]) => ({ id, c, p: prod(id) })).filter(x => x.p).sort((a, b) => a.p.pix - b.p.pix);
      const rec = ['cromo', 'app', 'voz', 'borbulhador'].filter(r => lista.some(x => x.c.recursos[r]));
      head = `<th scope="col">${tipo}</th><th scope="col">Potência e tensão</th><th scope="col">Motobombas</th>${rec.map(r => `<th scope="col">${RECURSOS[r]}</th>`).join('')}<th scope="col">Fio e DR (8 kW)</th><th scope="col">Temperatura</th><th scope="col">Garantia</th><th scope="col">Preço</th>`;
      rows = lista.map(({ c, p }) => {
        const v8 = c.versoes.find(v => v.w === 8000);
        return `<tr>${prodCell(p)}
        <td>${c.versoes.map(v => `${num(v.w / 1000, 1).replace(',0', '')} kW <small>${v.v} V</small>`).join('<br>')}</td>
        <td>até ${c.saidas}</td>${rec.map(r => `<td>${sim(c.recursos[r])}</td>`).join('')}
        <td>${v8? `${v8.fio} mm² · DR ${v8.dr} A` : '—'}</td><td>${c.temp}</td><td>${c.garantia}</td>${precoCell(p)}</tr>`;
      }).join('');
      nota = 'Todos os aparelhos de 8 kW em 220 V puxam cerca de 36,4 A e pedem circuito exclusivo com disjuntor DR e aterramento. O Wave Ultra S pede fio de 16 mm².';
    }
    area.innerHTML = `<div class="cmpt" tabindex="0" role="region" aria-label="Tabela comparativa de ${ABAS[aba].toLowerCase()}"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div><p class="cmpt__nota">${nota}</p>`;
  }

  function renderTabs() {
    if (!tabs) return;
    tabs.innerHTML = Object.entries(ABAS).map(([k, t]) => `<button type="button" class="chip" role="tab" aria-selected="${k === aba}" data-aba="${k}">${t}</button>`).join('');
    tabela();
  }
  tabs && tabs.addEventListener('click', e => { const b = e.target.closest('[data-aba]'); if (b) { aba = b.dataset.aba; renderTabs(); } });
  if (tabs && area) renderTabs();

  /* ================= Páginas de destino: /?comparar=aquecedores e /?monte=1 ================= */
  const q = new URLSearchParams(location.search);
  const alvo = Object.prototype.hasOwnProperty.call(ABAS, q.get('comparar') || '')? 'comparar' : q.has('monte')? 'monte' : null;
  if (alvo) {
    if (alvo === 'comparar') { aba = q.get('comparar'); renderTabs(); }
    document.body.classList.add('landing', `landing--${alvo}`);
    const [h, sub] = alvo === 'monte'
? ['Qual aquecedor e motobomba servem na sua banheira?', 'Responda três perguntas e veja o que é compatível, com fio e disjuntor certos para a instalação.']
      : [`Comparativo de ${ABAS[aba].toLowerCase()} para hidromassagem`, 'Vazão, pressão, recursos, instalação e preço lado a lado, com dados dos fabricantes.'];
    $('#lpTitle').textContent = h; $('#lpSub').textContent = sub;
    document.title = `${h} | AquaVita Peças`;
  }
})();
