/* ============================================================
   AquaVita Peças — CONFIGURAÇÃO DE INTEGRAÇÕES
   Preencha os campos abaixo para ligar cada recurso.
   Campo vazio ('') = recurso desligado; nada é carregado.
   Guia completo: README.md na raiz do projeto.
   ============================================================ */
window.LOJA_CONFIG = {
  // Endereço público do site, sem barra no final (usado em links compartilhados e feeds)
  siteUrl: '',

  // WhatsApp que recebe pedidos e dúvidas (só números, com DDI)
  whatsapp: '5511900000000',

  tracking: {
    // Opção A (recomendada): Google Tag Manager. Ex.: 'GTM-XXXXXXX'
    // Com GTM preenchido, GA4/Ads/Meta devem ser configurados DENTRO do GTM
    // e os três campos abaixo são ignorados.
    gtmId: '',

    // Opção B: tags diretas, sem GTM
    ga4Id: '',              // Ex.: 'G-XXXXXXXXXX'
    googleAdsId: '',        // Ex.: 'AW-123456789'
    metaPixelId: '',        // Ex.: '123456789012345'

    // Rótulos de conversão do Google Ads (Ferramentas > Conversões)
    googleAdsLabels: {
      checkout: '',         // disparado em "Finalizar pelo WhatsApp"
      whatsapp: '',         // disparado em qualquer outro clique para o WhatsApp
    },

    // LGPD: true = só carrega as tags depois que o visitante aceitar
    requireConsent: true,

    // true = mostra cada evento no console do navegador (para conferência)
    debug: false,
  },

  attribution: {
    // Acrescenta a origem do visitante (ex.: "ref: google · cpc · kits-verao")
    // no fim das mensagens de WhatsApp, para a equipe saber de qual anúncio veio
    appendToWhatsApp: true,
  },

  // Endereços do seu servidor/automação (n8n, Make, API própria) que recebem
  // um POST em JSON. É por aqui que entram: WhatsApp Business API (mensagens
  // automáticas, recuperação de carrinho), CRM e API de Conversões da Meta.
  webhooks: {
    pedido: '',             // ao clicar em "Finalizar pelo WhatsApp"
    lead: '',               // ao clicar em qualquer outro botão de WhatsApp
  },

  ai: {
    // Endereço do servidor de IA (veja server/ia-proxy.mjs). Ex.: 'https://seu-dominio/api/chat'
    // A chave da API NUNCA fica aqui: ela mora só no servidor.
    endpoint: '',
    // true = mostra o chat em modo demonstração (busca no catálogo, sem IA)
    demo: false,
    nome: 'Assistente AquaVita Peças',
    // "Fotografe sua peça": endereço da leitura por foto. Vazio = o mesmo servidor do chat
    // (troca /api/chat por /api/identificar). Sem servidor, a seção mostra só os exemplos.
    foto: '',
  },
};
