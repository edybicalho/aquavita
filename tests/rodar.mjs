// Testes do site: preços em todo lugar, carrinho, "Monte seu sistema" e ataques pela URL.
// Uso (na pasta do site):  node tests/rodar.mjs
// Precisa do Node 22+ e do Google Chrome instalado. Não altera nenhum arquivo do site.
import http from 'http'; import fs from 'fs'; import path from 'path'; import { spawn, execFileSync } from 'child_process';
import { fileURLToPath } from 'url'; import os from 'os';
const AQUI = path.dirname(fileURLToPath(import.meta.url)), RAIZ = path.dirname(AQUI);
const CHROME = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find(f => fs.existsSync(f));
const sleep = ms => new Promise(r => setTimeout(r, ms));
let falhou = false;

// 1) preços: products.js x páginas x JSON-LD x feeds
console.log('== Preços em todos os lugares');
const saida = execFileSync(process.execPath, [path.join(AQUI, 'precos.cjs'), RAIZ], { encoding: 'utf8' });
console.log(saida.trim()); if (!/TODOS OS PREÇOS CONFEREM/.test(saida)) falhou = true;

// Local page links and image resources, including each srcset URL.
console.log('\n== Links locais das paginas');
const links = execFileSync(process.execPath, [path.join(AQUI, 'links.cjs'), RAIZ], { encoding: 'utf8' });
console.log(links.trim()); if (!/0 quebrados/.test(links)) falhou = true;

// 2) servidor local só para o teste
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(RAIZ, path.normalize(p)); if (!f.startsWith(RAIZ)) { r.writeHead(403); return r.end(); }
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': tipos[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
const BASE = `http://localhost:${srv.address().port}`;

// 3) navegador: abre a página, roda o teste, junta erros do console
async function noNavegador(url, arquivo) {
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'LOJA-teste-'));
  const porta = 9400 + Math.floor(Math.random() * 500);
  const ch = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${porta}`, `--user-data-dir=${perfil}`, '--window-size=1280,900', 'about:blank']);
  try {
    let abas; for (let i = 0; i < 60 && !abas; i++) { try { abas = await (await fetch(`http://127.0.0.1:${porta}/json`)).json(); } catch { await sleep(250); } }
    const ws = new WebSocket(abas.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
    let id = 0; const pend = {}, erros = [];
    ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; }
      if (m.method === 'Runtime.exceptionThrown') erros.push('exceção: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).split('\n')[0]);
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') erros.push('console: ' + m.params.args.map(a => a.value ?? a.description).join(' ')); };
    const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
    await send('Runtime.enable'); await send('Page.enable'); await send('Page.navigate', { url }); await sleep(3500);
    const r = await send('Runtime.evaluate', { expression: fs.readFileSync(path.join(AQUI, 'navegador', arquivo), 'utf8'), awaitPromise: true, returnByValue: true });
    ws.close(); return { valor: r.result.result?.value, erros };
  } finally { ch.kill(); await sleep(300); try { fs.rmSync(perfil, { recursive: true, force: true }); } catch {} }
}

if (!CHROME) { console.log('\nChrome não encontrado: testes no navegador pulados (defina CHROME=caminho).'); falhou = true; }
else {
  console.log('\n== Carrinho: todas as variações de todos os produtos');
  const c = await noNavegador(BASE + '/', 'carrinho.js');
  console.log(`${c.valor.conferencias} conferências, ${c.valor.totalErros} erros`, c.valor.erros, c.erros);
  if (c.valor.totalErros || c.erros.length) falhou = true;

  console.log('\n== Monte seu sistema: total da tela = total do carrinho');
  const m = await noNavegador(BASE + '/?monte=1', 'monte.js');
  console.log(`${m.valor.combinacoesTestadas} combinações, ${m.valor.totalErros} erros`, m.valor.erros, m.erros);
  if (m.valor.totalErros || !m.valor.combinacoesTestadas || m.erros.length) falhou = true;

  console.log('\n== Ataques pela URL (código injetado não pode rodar)');
  const X = encodeURIComponent('"><img src=x onerror="window.__xss=1"><svg onload="window.__xss=2">'), J = encodeURIComponent('javascript:window.__xss=3');
  const urls = ['busca', 'categoria', 'marca', 'produto', 'comparar', 'monte', 'carrinho', 'utm_source', 'gclid'].map(k => `/?${k}=${X}`)
    .concat([`/?busca=${J}`, `/?x=1#produto=${X}`, `/produto/motobomba-syllent-1-2-cv.html?opcao=${X}`]);
  let ruins = 0;
  for (const u of urls) { const a = await noNavegador(BASE + u, 'ataque.js'); if (a.valor.xss || a.valor.injetado || a.valor.jsLink || a.erros.length) { ruins++; console.log('FALHA', u, a.valor, a.erros); } }
  console.log(`${urls.length - ruins} de ${urls.length} ataques bloqueados`); if (ruins) falhou = true;
}
srv.close();
console.log(falhou? '\nRESULTADO: HÁ PROBLEMAS (veja acima)' : '\nRESULTADO: TUDO CERTO');
process.exit(falhou? 1 : 0);
