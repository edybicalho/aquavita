(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const L = window.LOJA, r2 = L.r2, M = document.querySelector('#monte'); const erros = []; let testadas = 0, comEscolha = 0;
  const limpar = () => { for (const k of Object.keys(L.cart())) document.querySelector(`[data-rm="${CSS.escape(k)}"]`)?.click(); };
  const num = t => Number(t.replace(/[^\d,]/g, '').replace(',', '.'));
  const tensoes = [...M.querySelectorAll('button')].filter(b => /^(127|220)\s*V?$/.test(b.textContent.trim()) || /^\s*(127|220) V/.test(b.textContent));
  for (const tb of tensoes) {
    tb.click(); await sleep(60);
    const nbtns = [...M.querySelectorAll('button')].filter(b => /^[1-4]$/.test(b.textContent.trim()));
    for (const nb of (nbtns.length? nbtns : [null])) {
      if (nb) { nb.click(); await sleep(60); }
      M.querySelector('[data-todos]')?.click(); await sleep(40);
      const cens = [...M.querySelectorAll('[data-central]')].map(b => b.dataset.central);
      for (const c of cens) {
        M.querySelector(`[data-central="${c}"]`)?.click(); await sleep(40);
        M.querySelector('[data-todos]')?.click(); await sleep(40);
        const mots = [...M.querySelectorAll('[data-motor]')].map(b => b.dataset.motor);
        for (const m of mots) {
          M.querySelector(`[data-motor="${m}"]`)?.click(); await sleep(30);
          const totEl = [...M.querySelectorAll('span')].find(s => /no PIX/.test(s.textContent) && s.querySelector('small') && s.closest('.sys__sum, .sys__total, [class*=total]'));
          const tela = totEl && totEl.textContent;
          if (!tela || /a partir/.test(tela)) { comEscolha++; continue; }
          limpar(); await sleep(30);
          M.querySelector('#sysAdd').click(); await sleep(60);
          document.querySelector('dialog[open]')?.close();
          const soma = r2(L.lines().reduce((a, l) => a + r2(l.pr.pix * l.q), 0));
          testadas++;
          if (Math.abs(soma - num(tela)) > 0.001) erros.push(`${tb.textContent.trim()} n=${nb? nb.textContent : 1} ${c} + ${m}: tela ${tela} x carrinho ${soma}`);
        }
      }
    }
  }
  return { combinacoesTestadas: testadas, puladasPorPrecisarEscolherSpots: comEscolha, erros: erros.slice(0, 15), totalErros: erros.length };
})()
