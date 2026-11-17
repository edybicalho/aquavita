// Confere TODOS os preços: products.js x páginas de produto x JSON-LD x feed Google x CSV Meta
const fs = require('fs'), path = require('path'), vm = require('vm');
const R = process.argv[2];
const r2 = n => Math.round(Number((n * 100).toPrecision(12))) / 100;
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(R, 'assets/js/products.js'), 'utf8'), ctx);
const P = ctx.window.PRODUTOS; let erros = [], conf = 0;
const err = m => erros.push(m), eq = (a, b, m) => { conf++; if (Math.abs(a - b) > 1e-9) err(`${m}: ${a} != ${b}`); };
const brl = n => 'R$ ' + r2(n).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const feed = fs.readFileSync(path.join(R, 'feed/google-merchant.xml'), 'utf8');
const items = [...feed.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => { const g = t => (m[1].match(new RegExp(`<g:${t}>([^<]*)<`)) || [])[1]; return { id: g('id'), group: g('item_group_id'), link: g('link').replace(/&amp;/g, '&'), price: g('price'), avail: g('availability'), parc: (m[1].match(/<g:amount>([^<]*)</) || [])[1] }; });
const csv = fs.readFileSync(path.join(R, 'feed/meta-catalogo.csv'), 'utf8').trim().split(/\r?\n/);
const ids = new Set();
for (const p of P) {
  if (ids.has(p.id)) err('id repetido ' + p.id); ids.add(p.id);
  for (const k of ['pix', 'cheio', 'parcela']) if (!(typeof p[k] === 'number' && p[k] > 0 && r2(p[k]) === p[k])) err(`${p.id}.${k} inválido: ${p[k]}`);
  const its = p.opcao ? p.opcao.itens : [];
  for (const i of its) { if (!(i.cheio > 0 && r2(i.cheio) === i.cheio)) err(`${p.id} ${i.valor} cheio inválido ${i.cheio}`); if (/[|]/.test(i.valor)) err('valor com | ' + i.valor); }
  if (new Set(its.map(i => i.valor)).size !== its.length) err('variação repetida em ' + p.id);
  const base = its.length ? Math.min(...its.map(i => i.cheio)) : p.cheio;
  eq(p.cheio, base, `${p.id} cheio = menor variação`);
  eq(p.pix, r2(p.cheio * 0.94), `${p.id} pix = cheio - 6%`);
  eq(p.parcela, r2(p.cheio / 10), `${p.id} parcela = cheio / 10`);
  if (its.length && p.estoque !== its.some(i => i.estoque)) err(`${p.id} estoque geral não bate com as variações`);
  if (its.length > 1 !== !!p.varia && new Set(its.map(i => i.cheio)).size > 1 !== !!p.varia) err(`${p.id} flag varia (${p.varia}) inconsistente`);
  // página do produto
  const html = fs.readFileSync(path.join(R, 'produto', p.id + '.html'), 'utf8');
  const txt = id => (html.match(new RegExp(`id="${id}"[^>]*>([^<]*)<`)) || [])[1];
  conf++; if (txt('pOld') !== brl(p.cheio)) err(`${p.id} página pOld ${txt('pOld')} != ${brl(p.cheio)}`);
  conf++; if (txt('pPix') !== brl(p.pix)) err(`${p.id} página pPix ${txt('pPix')} != ${brl(p.pix)}`);
  conf++; if (!html.includes(`10x de ${brl(p.parcela)}</b>`)) err(`${p.id} página parcela`);
  conf++; if (txt('stickyPrice') !== brl(p.pix)) err(`${p.id} preço fixo do celular`);
  const embed = JSON.parse(html.match(/window\.PRODUTO = (.*?);<\/script>/)[1]);
  conf++; if (JSON.stringify(embed.opcao) !== JSON.stringify(p.opcao) || embed.pix !== p.pix || embed.cheio !== p.cheio || embed.estoque !== p.estoque) err(`${p.id} dados embutidos na página diferem do products.js`);
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  const off = [].concat(ld).find(x => x['@type'] === 'Product')?.offers;
  if (off) { conf++; if (off['@type'] === 'AggregateOffer') { if (+off.lowPrice !== base || +off.highPrice !== Math.max(...its.map(i => i.cheio))) err(`${p.id} JSON-LD faixa`); } else if (+off.price !== p.cheio) err(`${p.id} JSON-LD price ${off.price}`);
    const av = /InStock/.test(off.availability) ; if (off.availability && av !== p.estoque) err(`${p.id} JSON-LD estoque`); }
  else err(`${p.id} sem offers no JSON-LD`);
  // feed: uma linha por variação
  const fi = items.filter(x => x.link.split('?')[0].endsWith(`/produto/${p.id}.html`));
  const esperadas = its.length > 1 ? its : [its[0] || null];
  conf++; if (fi.length !== esperadas.length) err(`${p.id} feed tem ${fi.length} linhas, esperado ${esperadas.length}`);
  for (const i of esperadas) {
    const ch = i ? i.cheio : p.cheio, est = i ? i.estoque : p.estoque;
    const f = its.length > 1 ? fi.find(x => x.link.endsWith('?opcao=' + i.valor)) : fi[0];
    if (!f) { err(`${p.id} ${i && i.valor} sem linha no feed`); continue; }
    conf += 3;
    if (f.price !== ch.toFixed(2) + ' BRL') err(`${p.id} ${i && i.valor} feed price ${f.price} != ${ch}`);
    if (f.parc !== r2(ch / 10).toFixed(2) + ' BRL') err(`${p.id} ${i && i.valor} feed parcela ${f.parc}`);
    if ((f.avail === 'in_stock') !== est) err(`${p.id} ${i && i.valor} feed estoque`);
    const linha = csv.find(l => l.startsWith(f.id + ','));
    conf++; if (!linha || !linha.includes(ch.toFixed(2) + ' BRL')) err(`${p.id} ${i && i.valor} CSV Meta preço`);
  }
}
// números escritos à mão na página inicial (trilho das linhas): contagem e "A partir de" de cada linha
{
  const idx = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
  const blocos = [...idx.matchAll(/<dt>A partir de<\/dt><dd>([^<]+)<\/dd>[\s\S]*?data-cat="(\w+)">Ver os (\d+)/g)];
  conf++; if (blocos.length !== 4) err(`página inicial: esperava 4 linhas no trilho, achei ${blocos.length}`);
  for (const [, aPartir, cat, n] of blocos) {
    const ps = P.filter(p => p.cat === cat);
    const menor = Math.min(...ps.filter(p => p.estoque).map(p => p.pix));
    conf += 2;
    if (aPartir.trim() !== brl(menor) + ' no PIX') err(`página inicial, ${cat}: "A partir de ${aPartir}" mas o menor preço em estoque é ${brl(menor)} (atualize o index.html)`);
    if (Number(n) !== ps.length) err(`página inicial, ${cat}: "Ver os ${n}" mas o catálogo tem ${ps.length}`);
  }
}
conf++; if (items.length !== csv.length - 1) err(`feed ${items.length} x CSV ${csv.length - 1}`);
conf++; if (new Set(items.map(i => i.id)).size !== items.length) err('id repetido no feed');
console.log(`${P.length} produtos, ${items.length} linhas de feed, ${conf} conferências`);
console.log(erros.length ? 'ERROS:\n' + erros.join('\n') : 'TODOS OS PREÇOS CONFEREM');
