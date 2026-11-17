/**
 * AquaVita Peças — servidor do chat de IA (Claude).
 *
 * O site (assets/js/ia.js) envia POST /api/chat { messages: [{ role, content }] }
 * e recebe { reply }. A chave da API fica só aqui, nunca no navegador.
 *
 * Como rodar:
 *   cd server && npm install
 *   ANTHROPIC_API_KEY=... ALLOWED_ORIGIN=https://seu-dominio node ia-proxy.mjs
 *
 * Depois, em assets/js/config.js:  ai.endpoint = 'https://seu-servidor/api/chat'
 *
 * Também atende POST /api/identificar { imagem: "data:image/jpeg;base64,...", nota?: "..." }
 * ("Fotografe sua peça", assets/js/foto.js): a IA lê a etiqueta/foto da peça antiga e devolve
 * { leitura, sugestoes: [{ id, motivo }], confianca, observacao }. A foto não é gravada em lugar nenhum.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import Anthropic from "@anthropic-ai/sdk";

const PORT = Number(process.env.PORT || 8787);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || ""; // ex.: https://aquavitapecas.com.br
const MODEL = process.env.IA_MODEL || "claude-opus-5-5";
const MAX_MESSAGES = 20;
const MAX_CHARS = 1000;
const RATE_LIMIT = { janelaMs: 10 * 60 * 1000, max: 30 }; // por IP

const here = path.dirname(fileURLToPath(import.meta.url));

// Catálogo: lido do mesmo arquivo que o site usa, para nunca divergir
function carregarCatalogo() {
  const src = fs.readFileSync(path.join(here, "../assets/js/products.js"), "utf8");
  const json = src.slice(src.indexOf("["), src.lastIndexOf("]") + 1);
  return JSON.parse(json).map((p) => ({
    id: p.id,
    nome: p.name,
    categoria: p.cat,
    marca: p.brand,
    preco_pix: p.pix,
    parcela_10x: p.parcela,
    em_estoque: p.estoque,
  }));
}

const SYSTEM = `Você é o assistente virtual do AquaVita Peças, distribuidora de peças e acessórios para banheiras de hidromassagem e spas, com loja física em São Paulo (Rua Exemplo, 100 — Centro, São Paulo/SP) e envio para todo o Brasil.

Seu papel é ajudar quem visita o site a encontrar a peça certa no catálogo abaixo e tirar dúvidas simples de compra. Quem escreve geralmente não é técnico: está trocando uma peça que quebrou e não tem certeza do modelo. Responda em português do Brasil, em tom cordial e direto, com respostas curtas (em geral até quatro frases), porque a conversa acontece em uma janela pequena de chat.

Condições de compra: 6% de desconto no PIX ou boleto; cartão em até 10x sem juros. O frete e o prazo dependem do CEP e são calculados por um consultor humano no WhatsApp (11) 90000-0000.

Quando recomendar um produto, cite-o pelo identificador entre colchetes duplos, por exemplo [[motobomba-claw-1-2cv]]. O site transforma esse marcador em um cartão com foto, preço e botão de compra, então não repita preço nem nome completo ao lado do marcador. Recomende no máximo três produtos por resposta e prefira os que estão em estoque.

Use somente o catálogo abaixo como fonte sobre produtos, preços e estoque. A loja tem mais itens do que o site mostra (cromoterapia, acessórios, peças de reposição): se a pessoa pedir algo que não está na lista, diga que não aparece no site e que um consultor pode verificar o estoque completo. Não invente especificações técnicas, prazos, garantias ou políticas que não estejam aqui.

Compatibilidade é o ponto em que um erro custa caro para o cliente. Você pode ajudar a pessoa a identificar o que procurar (potência em CV e voltagem na etiqueta da bomba antiga, marca, número de funções do aquecedor), mas não afirme que uma peça serve em uma banheira específica: oriente a confirmar com um consultor, de preferência enviando uma foto da peça antiga. Instalação elétrica e hidráulica deve ser feita por profissional qualificado.

Se a conversa sair do assunto da loja, redirecione com gentileza para o que você pode ajudar.

Catálogo do site (JSON):
${JSON.stringify(carregarCatalogo())}`;

// ---------- "Fotografe sua peça": catálogo com os dados técnicos ----------
// tecnico.js é um arquivo do navegador (window.TECNICO = {...}); lido aqui numa caixa isolada
function carregarTecnico() {
  try {
    const ctx = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(here, "../assets/js/tecnico.js"), "utf8"), ctx, { timeout: 1000 });
    return ctx.window.TECNICO || {};
  } catch (err) {
    console.warn("tecnico.js não pôde ser lido; a identificação segue sem os dados técnicos.", err.message);
    return {};
  }
}
function catalogoTecnico() {
  const src = fs.readFileSync(path.join(here, "../assets/js/products.js"), "utf8");
  const produtos = JSON.parse(src.slice(src.indexOf("["), src.lastIndexOf("]") + 1));
  const T = carregarTecnico();
  return produtos.map((p) => {
    const t = (T.motobombas || {})[p.id] || (T.centrais || {})[p.id] || null;
    const item = { id: p.id, nome: p.name, categoria: p.cat, marca: p.brand, em_estoque: p.estoque };
    if (p.opcao) item.opcoes = { [p.opcao.nome]: p.opcao.itens.map((i) => i.rotulo) };
    if (t) {
      const tec = {};
      for (const k of ["cv", "codigo", "tipo", "painel", "saidas", "corrente"]) if (t[k] != null) tec[k] = t[k];
      if (Array.isArray(t.versoes)) tec.versoes = t.versoes.map((v) => `${v.w} W / ${v.v} V`);
      item.tecnico = tec;
    }
    return item;
  });
}
const CATALOGO_FOTO = catalogoTecnico();
const IDS = CATALOGO_FOTO.map((p) => p.id);

const SYSTEM_FOTO = `Você trabalha no AquaVita Peças, loja de peças para banheiras de hidromassagem e spas em São Paulo. Um cliente enviou a foto de uma peça antiga (de preferência a etiqueta) para descobrir qual peça comprar no site.

Sua tarefa: ler a foto com cuidado e indicar, do catálogo abaixo, até três produtos que podem substituir a peça.

Como ler:
- Registre só o que está realmente visível na foto (marca, modelo, código, potência em CV ou W, tensão em V, corrente em A). Campo que não aparece ou não dá para ler fica como texto vazio ("") e entra na lista "ilegivel". Nunca deduza um número que não esteja escrito.
- Reconhecer a marca pelo logotipo ou o tipo de peça pelo formato é permitido, mas a confiança cai para "media" ou "baixa" quando potência e tensão não estão legíveis.

Como sugerir:
- Uma motobomba substitui outra quando a potência (CV) e a tensão batem; mesma marca e mesmo código são ainda melhores. Um aquecedor ou central substitui outro quando a linha, o número de funções/motobombas e a potência/tensão batem.
- Se a potência ou a tensão não estiverem legíveis, sugira os modelos mais prováveis e diga na observação qual informação falta e onde fotografar (por exemplo, a etiqueta prateada na lateral do motor).
- Se a peça não existe no catálogo (sensor, jato, válvula, cano, peça de outra categoria) ou a foto não mostra uma peça, deixe "sugestoes" vazia e explique na observação que um consultor pode verificar o estoque completo da loja.
- Prefira produtos em estoque. Nunca afirme que a peça serve com certeza: a compra sempre é confirmada por um consultor.

Escreva em português do Brasil, frases curtas e simples. "motivo" tem uma frase; "observacao" tem até duas frases.

Catálogo do site (JSON):
${JSON.stringify(CATALOGO_FOTO)}`;

const SCHEMA_FOTO = {
  type: "object",
  additionalProperties: false,
  required: ["tipo_peca", "marca", "modelo", "codigo", "potencia", "tensao", "corrente", "outros", "ilegivel", "confianca", "sugestoes", "observacao"],
  properties: {
    tipo_peca: { type: "string", enum: ["motobomba", "aquecedor", "controlador", "kit", "outra_peca", "nao_e_peca"] },
    marca: { type: "string" },
    modelo: { type: "string" },
    codigo: { type: "string" },
    potencia: { type: "string" },
    tensao: { type: "string" },
    corrente: { type: "string" },
    outros: { type: "array", items: { type: "string" } },
    ilegivel: { type: "array", items: { type: "string" } },
    confianca: { type: "string", enum: ["alta", "media", "baixa"] },
    sugestoes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "motivo"],
        properties: { id: { type: "string", enum: IDS }, motivo: { type: "string" } },
      },
    },
    observacao: { type: "string" },
  },
};

const MAX_IMAGEM = 2_000_000; // caracteres base64 (~1,5 MB); o site já reduz a foto para ~1024 px

function validarFoto(body) {
  if (!body || typeof body.imagem !== "string") return null;
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(body.imagem);
  if (!m || m[2].length > MAX_IMAGEM) return null;
  const nota = typeof body.nota === "string"? body.nota.slice(0, 300).trim() : "";
  return { mediaType: m[1], data: m[2], nota };
}

async function identificar({ mediaType, data, nota }) {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    // leitura de etiqueta: esforço baixo responde rápido; o JSON vem sempre no formato do SCHEMA_FOTO
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA_FOTO } },
    system: [{ type: "text", text: SYSTEM_FOTO, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data } },
          { type: "text", text: nota? `Identifique a peça desta foto. O cliente escreveu: "${nota}"` : "Identifique a peça desta foto." },
        ],
      },
    ],
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });
  if (response.stop_reason === "refusal") return { erro: "recusado" };
  if (response.stop_reason === "max_tokens") return { erro: "incompleto" };
  const texto = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  let r;
  try { r = JSON.parse(texto); } catch { return { erro: "incompleto" }; } // resposta torta da IA não é culpa do visitante
  // segurança extra: só ids do catálogo, sem repetir, no máximo três
  const vistos = new Set();
  r.sugestoes = (r.sugestoes || []).filter((s) => IDS.includes(s.id) && !vistos.has(s.id) && vistos.add(s.id)).slice(0, 3);
  return r;
}

// lê ANTHROPIC_API_KEY do ambiente; desiste antes do navegador (45-60 s) em vez de esperar 10 min
const client = new Anthropic({ timeout: 40_000, maxRetries: 1 });

// ---------- limite simples por IP ----------
const acessos = new Map();
// teto do dia para o site todo (protege os créditos da API mesmo contra muitos IPs diferentes)
const LIMITE_DIA = Number(process.env.LIMITE_DIA || 1500);
let dia = "", usosHoje = 0;
function dentroDoTetoDiario() {
  const hoje = new Date().toISOString().slice(0, 10);
  if (hoje !== dia) { dia = hoje; usosHoje = 0; }
  if (usosHoje >= LIMITE_DIA) return false;
  usosHoje++;
  return true;
}

function dentroDoLimite(ip) {
  const agora = Date.now();
  const lista = (acessos.get(ip) || []).filter((t) => agora - t < RATE_LIMIT.janelaMs);
  if (lista.length >= RATE_LIMIT.max) return false;
  lista.push(agora);
  acessos.set(ip, lista);
  return true;
}
setInterval(() => {
  const agora = Date.now();
  for (const [ip, lista] of acessos) if (!lista.some((t) => agora - t < RATE_LIMIT.janelaMs)) acessos.delete(ip);
}, 60_000).unref();

function validar(body) {
  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) return null;
  const msgs = body.messages.slice(-MAX_MESSAGES);
  for (const m of msgs) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) return null;
    if (typeof m.content !== "string" || !m.content.trim() || m.content.length > MAX_CHARS * 4) return null;
  }
  if (msgs[0].role !== "user" || msgs[msgs.length - 1].role !== "user") return null;
  if (msgs[msgs.length - 1].content.length > MAX_CHARS) return null;
  return msgs.map((m) => ({ role: m.role, content: m.content }));
}

async function responder(messages) {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    // Conversa curta de atendimento: esforço baixo responde mais rápido e custa menos
    output_config: { effort: "low" },
    // O prompt + catálogo é igual em toda requisição: fica em cache
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    messages,
    // Se o modelo recusar por política de segurança, a API tenta outro modelo na mesma chamada
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });

  if (response.stop_reason === "refusal") {
    return "Não consigo ajudar com esse pedido. Posso ajudar com produtos do nosso catálogo ou encaminhar você a um consultor.";
  }
  const texto = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  return texto || "Não consegui formular uma resposta. Pode reformular a pergunta?";
}

function enviar(res, status, obj, origin) {
  const headers = { "Content-Type": "application/json; charset=utf-8", Vary: "Origin" };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  const origem = req.headers.origin || "";
  // sem ALLOWED_ORIGIN, só aceita o próprio computador (teste local)
  const origemOk = ALLOWED_ORIGIN? origem === ALLOWED_ORIGIN : /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origem);
  const cors = origemOk? origem : "";

  if (req.method === "OPTIONS") return enviar(res, origemOk? 204 : 403, {}, cors);
  const rota = req.url.startsWith("/api/chat")? "chat" : req.url.startsWith("/api/identificar")? "foto" : "";
  if (req.method !== "POST" || !rota) return enviar(res, 404, { error: "not_found" }, cors);
  if (!origemOk) return enviar(res, 403, { error: "origin_not_allowed" }, "");

  // X-Forwarded-For pode ser inventado pelo visitante: só vale atrás de um proxy confiável (TRUST_PROXY=1),
  // e aí o último endereço da lista é o que o proxy viu
  const xff = process.env.TRUST_PROXY === "1"? (req.headers["x-forwarded-for"] || "").split(",").pop().trim() : "";
  const ip = xff || req.socket.remoteAddress || "?";
  if (!dentroDoLimite(ip)) return enviar(res, 429, { error: "rate_limited" }, cors);

  const partes = [];
  let tam = 0;
  try {
    for await (const chunk of req) {
      partes.push(chunk); tam += chunk.length;
      if (tam > (rota === "foto"? MAX_IMAGEM + 4_000 : 64_000)) return enviar(res, 413, { error: "payload_too_large" }, cors);
    }
    const raw = Buffer.concat(partes).toString("utf8"); // junta antes de decodificar: acento partido entre pedaços não estraga
    if (rota === "foto") {
      const foto = validarFoto(JSON.parse(raw));
      if (!foto) return enviar(res, 400, { error: "invalid_image" }, cors);
      if (!dentroDoTetoDiario()) return enviar(res, 503, { error: "busy" }, cors);
      const resultado = await identificar(foto);
      return enviar(res, resultado.erro? 422 : 200, resultado, cors);
    }
    const messages = validar(JSON.parse(raw));
    if (!messages) return enviar(res, 400, { error: "invalid_request" }, cors);

    if (!dentroDoTetoDiario()) return enviar(res, 503, { error: "busy" }, cors);
    const reply = await responder(messages);
    return enviar(res, 200, { reply }, cors);
  } catch (err) {
    if (err instanceof SyntaxError) return enviar(res, 400, { error: "invalid_json" }, cors);
    if (err instanceof Anthropic.RateLimitError) return enviar(res, 503, { error: "busy" }, cors);
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("Chave da API inválida ou ausente (ANTHROPIC_API_KEY).");
      return enviar(res, 500, { error: "server_misconfigured" }, cors);
    }
    if (err instanceof Anthropic.APIError) {
      console.error("Erro da API:", err.status, err.message);
      return enviar(res, 502, { error: "upstream_error" }, cors);
    }
    console.error(err);
    return enviar(res, 500, { error: "internal_error" }, cors);
  }
});

server.listen(PORT, () => {
  console.log(`Chat de IA em http://localhost:${PORT}/api/chat e foto da peça em /api/identificar  (modelo: ${MODEL})`);
  if (!ALLOWED_ORIGIN) console.warn("Aviso: sem ALLOWED_ORIGIN, só pedidos de localhost são aceitos. Defina o endereço do site antes de publicar.");
});
