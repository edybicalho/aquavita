// Testes em tela de celular: o Chrome simula o aparelho (tamanho, toque, densidade de tela e navegador).
// Uso (na pasta do site):  node tests/celular.mjs
// Mostra, por aparelho e página: rolagem para o lado, itens vazando, botões pequenos para o dedo,
// letra miúda e erros. Não substitui abrir num celular de verdade (Safari do iPhone é outro motor).
import http from 'http'; import fs from 'fs'; import path from 'path'; import os from 'os';
import { spawn } from 'child_process'; import { fileURLToPath } from 'url';

const AQUI = path.dirname(fileURLToPath(import.meta.url)), RAIZ = path.dirname(AQUI);
const CHROME = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find(f => fs.existsSync(f));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const AND = 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36';
export const APARELHOS = {
  'iPhone SE': { width: 375, height: 667, dpr: 2, ua: IOS },
  'iPhone 14': { width: 390, height: 844, dpr: 3, ua: IOS },
  'Android pequeno': { width: 360, height: 760, dpr: 3, ua: AND },
  'Android grande': { width: 412, height: 915, dpr: 2.6, ua: AND },
};
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.woff2': 'font/woff2' };
export const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(RAIZ, path.normalize(p)); if (!f.startsWith(RAIZ)) { r.writeHead(403); return r.end(); }
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': tipos[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
}).listen(0);
export const BASE = () => `http://localhost:${srv.address().port}`;

// abre a página no aparelho; "antes" roda primeiro (ex.: abrir o carrinho); "shot" salva uma captura
export async function abrir(aparelho, url, script, { shot, antes, alturaShot } = {}) {
  const A = APARELHOS[aparelho], perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'LOJA-cel-'));
  const porta = 9400 + Math.floor(Math.random() * 500);
  const ch = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${porta}`, `--user-data-dir=${perfil}`, 'about:blank']);
  try {
    let abas; for (let i = 0; i < 80 && !abas; i++) { try { abas = await (await fetch(`http://127.0.0.1:${porta}/json`)).json(); } catch { await sleep(250); } }
    const ws = new WebSocket(abas.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => { ws.onopen = r; });
    let id = 0; const pend = {}, erros = [];
    ws.onmessage = ev => {
      const m = JSON.parse(ev.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; }
      if (m.method === 'Runtime.exceptionThrown') erros.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).split('\n')[0]);
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') erros.push(m.params.args.map(a => a.value ?? a.description).join(' '));
    };
    const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
    await send('Runtime.enable'); await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: A.width, height: A.height, deviceScaleFactor: A.dpr, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await send('Emulation.setUserAgentOverride', { userAgent: A.ua }); if (process.env.LENTO) await send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await send('Page.navigate', { url: BASE() + url }); await sleep(3500);
    if (antes) { await send('Runtime.evaluate', { expression: antes, awaitPromise: true }); await sleep(700); }
    const r = script? await send('Runtime.evaluate', { expression: script, awaitPromise: true, returnByValue: true }) : null;
    if (shot) {
      const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70, ...(alturaShot? { clip: { x: 0, y: 0, width: A.width, height: alturaShot, scale: 1 }, captureBeyondViewport: true } : {}) });
      fs.writeFileSync(shot, Buffer.from(s.result.data, 'base64'));
    }
    ws.close();
    return { valor: r && (r.result.result?.value ?? r.result.exceptionDetails?.exception?.description), erros };
  } finally { ch.kill(); await sleep(300); try { fs.rmSync(perfil, { recursive: true, force: true }); } catch {} }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const chk = fs.readFileSync(path.join(AQUI, 'navegador', 'celular.js'), 'utf8');
  const PAGINAS = { 'início': '/', 'anúncio kits': '/?categoria=kits', 'produto': '/produto/controlador-sinapse-spamax-5-home-8000w-220.html' };
  const res = {}; let problemas = 0;
  for (const ap of Object.keys(APARELHOS)) for (const [pg, url] of Object.entries(PAGINAS)) {
    const r = await abrir(ap, url, chk); res[`${ap} · ${pg}`] = { ...r.valor, erros: r.erros };
    if (r.valor.rolagemLateral || r.valor.vazam.length || r.erros.length) problemas++;
    process.stdout.write('.');
  }
  console.log('\n' + JSON.stringify(res, null, 1));
  console.log(problemas? `\n${problemas} combinação(ões) aparelho/página com rolagem lateral, item vazando ou erro` : '\nSem rolagem lateral, sem itens vazando e sem erros');
  srv.close(); process.exit(problemas? 1 : 0);
}
