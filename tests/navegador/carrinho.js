(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const L = window.LOJA, erros = []; let conf = 0;
  const r2 = n => Math.round(Number((n * 100).toPrecision(12))) / 100;
  const brl = n => r2(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const ok = (c, m) => { conf++; if (!c) erros.push(m); };
  const esperado = {}; // key -> {nome, rotulo, q, pix, cheio}
  let n = 0;
  // 1) adiciona TODAS as variações de TODOS os produtos, com quantidades diferentes
  for (const p of L.PRODUTOS) {
    const its = p.opcao? p.opcao.itens : [null];
    for (const i of its) {
      const q = (n++ % 4) + 1;
      if (i && p.opcao.itens.length > 1) L.setVariant(p.id, i.valor);
      const ch = i? i.cheio : p.cheio, est = i? i.estoque : p.estoque;
      const res = L.add(p.id, q);
      document.querySelector('dialog[open]')?.close();
      if (!est) { ok(res === false, `sem estoque entrou: ${p.id} ${i && i.valor}`); continue; }
      ok(res === true, `não entrou: ${p.id} ${i && i.valor}`);
      const key = p.opcao && p.opcao.itens.length > 1? `${p.id}|${i.valor}` : p.id;
      const e = esperado[key] || (esperado[key] = { nome: p.name, rotulo: i? i.rotulo : '', q: 0, pix: r2(ch * 0.94), cheio: ch });
      e.q = Math.min(e.q + q, 99);
    }
  }
  const conferir = (etapa) => {
    const ls = L.lines();
    ok(ls.length === Object.keys(esperado).length, `${etapa}: ${ls.length} linhas, esperado ${Object.keys(esperado).length}`);
    let tp = 0, tc = 0;
    for (const [k, e] of Object.entries(esperado)) {
      const l = ls.find(x => x.key === k);
      if (!l) { ok(false, `${etapa}: falta linha ${k}`); continue; }
      ok(l.q === e.q, `${etapa}: ${k} qtd ${l.q} != ${e.q}`);
      ok(l.pr.pix === e.pix, `${etapa}: ${k} pix ${l.pr.pix} != ${e.pix}`);
      ok(l.pr.cheio === e.cheio, `${etapa}: ${k} cheio ${l.pr.cheio} != ${e.cheio}`);
      tp += r2(e.pix * e.q); tc += r2(e.cheio * e.q);
    }
    tp = r2(tp); tc = r2(tc);
    const foot = document.querySelector('#cartFoot').textContent.replace(/\s+/g, ' ');
    ok(document.querySelector('.sum--total b').textContent.replace(/\s/g, ' ') === brl(tp).replace(/\s/g, ' '), `${etapa}: total PIX na tela ${document.querySelector('.sum--total b').textContent} != ${brl(tp)}`);
    ok(foot.includes(brl(tc).replace(/\s/g, ' ')), `${etapa}: total cartão ${brl(tc)} não aparece`);
    ok(foot.includes(brl(r2(tc - tp)).replace(/\s/g, ' ')), `${etapa}: desconto ${brl(r2(tc - tp))} não aparece`);
    ok(foot.includes(`10x de ${brl(r2(tc / 10))}`.replace(/\s/g, ' ')), `${etapa}: parcela do cartão`);
    const href = document.querySelector('[data-checkout]').href;
    ok(href.startsWith('https://wa.me/5511900000000?text='), `${etapa}: link do WhatsApp ${href.slice(0, 40)}`);
    const msg = decodeURIComponent(href.split('?text=')[1]).replace(/\u00a0/g, ' ');
    const sp = s => s.replace(/\u00a0/g, ' ');
    for (const [k, e] of Object.entries(esperado)) {
      ok(msg.includes(`*${e.q}x ${e.nome}*`), `${etapa}: mensagem sem ${e.q}x ${e.nome}`);
      ok(msg.includes(sp(`${brl(r2(e.pix * e.q))} no PIX`)), `${etapa}: mensagem sem valor da linha ${k}`);
      if (e.rotulo) ok(msg.includes(`: ${e.rotulo}`), `${etapa}: mensagem sem a opção ${e.rotulo}`);
    }
    ok(msg.includes(sp(`Total no PIX/boleto: ${brl(tp)}`)), `${etapa}: total PIX na mensagem`);
    ok(msg.includes(sp(`Total no cartão: ${brl(tc)} (10x de ${brl(r2(tc / 10))}`)), `${etapa}: total cartão na mensagem`);
    // quantidade do ícone
    ok(Number(document.querySelector('#cartCount').textContent) === Object.values(esperado).reduce((a, e) => a + e.q, 0), `${etapa}: contador do carrinho`);
    return { tp, tc };
  };
  const t1 = conferir('depois de adicionar');
  // 2) troca a opção de todos os produtos com variação: nada no carrinho pode mudar de preço
  for (const p of L.PRODUTOS) if (p.opcao && p.opcao.itens.length > 1) L.setVariant(p.id, p.opcao.itens[p.opcao.itens.length - 1].valor);
  L.openCart(); await sleep(50);
  const t2 = conferir('depois de trocar as opções');
  ok(t1.tp === t2.tp && t1.tc === t2.tc, 'total mudou ao trocar opções');
  // 3) limite de 99 unidades
  const k0 = Object.keys(esperado)[0];
  for (let j = 0; j < 30; j++) L.add(k0.split('|')[0], 9);
  document.querySelector('dialog[open]')?.close();
  ok(L.cart()[k0] <= 99, 'passou de 99 unidades');
  // 4) botões + / − / remover
  const k1 = Object.keys(esperado)[1], antes = L.cart()[k1];
  document.querySelector(`[data-inc="${CSS.escape(k1)}"]`).click();
  ok(L.cart()[k1] === Math.min(antes + 1, 99), 'botão + ');
  document.querySelector(`[data-dec="${CSS.escape(k1)}"]`).click();
  ok(L.cart()[k1] === antes, 'botão − ');
  document.querySelector(`[data-rm="${CSS.escape(k1)}"]`).click();
  ok(!(k1 in L.cart()), 'remover');
  // 5) quantidade inválida
  const total0 = JSON.stringify(L.cart());
  ['-5', 0, 'abc', NaN, 2.7].forEach(q => L.add(L.PRODUTOS[0].id, q));
  ok(L.cart()[L.PRODUTOS[0].id] === (JSON.parse(total0)[L.PRODUTOS[0].id] || 0) + 2 || L.cart()[L.PRODUTOS[0].id] === 99, 'quantidade inválida aceita (só 2.7 -> 2 deveria entrar)');
  return { conferencias: conf, erros: erros.slice(0, 30), totalErros: erros.length, totalPix: t1.tp, totalCartao: t1.tc, linhas: Object.keys(esperado).length };
})()
