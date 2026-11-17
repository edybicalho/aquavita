/* AquaVita Peças — medição, consentimento (LGPD), atribuição e webhooks.
   Carrega ANTES de app.js. Sem IDs em config.js, nada externo é carregado. */
(() => {
  'use strict';
  const CFG = window.LOJA_CONFIG || {};
  const TR = CFG.tracking || {};
  const hasGoogle = !!(TR.gtmId || TR.ga4Id || TR.googleAdsId);
  const hasMeta = !!(TR.metaPixelId && !TR.gtmId);
  const hasAny = hasGoogle || hasMeta;
  const debug = TR.debug || /[?&]debug-track=1/.test(location.search);
  const store = {
    get(k, s = localStorage) { try { return JSON.parse(s.getItem(k)); } catch { return null; } },
    set(k, v, s = localStorage) { try { s.setItem(k, JSON.stringify(v)); } catch {} },
    del(k, s = localStorage) { try { s.removeItem(k); } catch {} },
  };

  /* ================= Atribuição (UTM e IDs de clique) ================= */
  const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'gbraid', 'wbraid', 'fbclid'];
  const qs = new URLSearchParams(location.search);
  let attr = store.get('LOJA-attr', sessionStorage) || {};
  const fresh = {};
  KEYS.forEach(k => { const v = qs.get(k); if (v) fresh[k] = v.slice(0, 200); });
  if (Object.keys(fresh).length) {
    attr = { ...fresh, landing: location.pathname + location.search, ts: Date.now() };
    store.set('LOJA-attr', attr, sessionStorage);
  } else if (!attr.ts && document.referrer && !document.referrer.includes(location.host)) {
    try { attr = { referrer: new URL(document.referrer).hostname, ts: Date.now() }; store.set('LOJA-attr', attr, sessionStorage); } catch {}
  }
  function refLabel() {
    const src = attr.utm_source || (attr.gclid || attr.gbraid || attr.wbraid? 'google' : attr.fbclid? 'meta' : '');
    if (!src) return '';
    const med = attr.utm_medium || (attr.gclid || attr.fbclid? 'ads' : '');
    return [src, med, attr.utm_campaign].filter(Boolean).join(' · ').slice(0, 80);
  }

  /* ================= Código do pedido ================= */
  function orderCode() {
    let c = store.get('LOJA-order');
    if (!c) {
      const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      c = 'PED-' + Array.from({ length: 5 }, () => abc[Math.floor(Math.random() * abc.length)]).join('');
      store.set('LOJA-order', c);
    }
    return c;
  }

  /* ================= WhatsApp ================= */
  function waUrl(url) {
    try {
      const u = new URL(url, location.href);
      if (!/(^|\.)wa\.me$|whatsapp\.com$/.test(u.hostname)) return url;
      if (CFG.whatsapp && u.hostname === 'wa.me') u.pathname = '/' + CFG.whatsapp;
      const ref = refLabel();
      const txt = u.searchParams.get('text');
      if (ref && txt && (CFG.attribution || {}).appendToWhatsApp !== false && !txt.includes('[ref:'))
        u.searchParams.set('text', `${txt}\n\n[ref: ${ref}]`);
      return u.toString().replace(/\+/g, '%20');
    } catch { return url; }
  }

  /* ================= Consentimento (LGPD + Consent Mode v2) ================= */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  let consent = store.get('LOJA-consent');           // { analytics, ads, ts }
  const needConsent = TR.requireConsent !== false;
  const granted = k => !needConsent || !!(consent && consent[k]);
  const consentState = () => ({
    analytics_storage: granted('analytics')? 'granted' : 'denied',
    ad_storage: granted('ads')? 'granted' : 'denied',
    ad_user_data: granted('ads')? 'granted' : 'denied',
    ad_personalization: granted('ads')? 'granted' : 'denied',
  });

  /* ================= Carregamento das tags ================= */
  let googleLoaded = false, metaLoaded = false;
  const inject = src => { const s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); };

  function loadTags() {
    let loadedNow = false;
    if (hasGoogle && !googleLoaded && (granted('analytics') || granted('ads'))) {
      googleLoaded = true;
      // Consent Mode v2: começa tudo negado e só então aplica a escolha do visitante
      gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
      gtag('consent', 'update', consentState());
      if (TR.gtmId) {
        window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
        inject('https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(TR.gtmId));
      } else {
        gtag('js', new Date());
        if (TR.ga4Id) gtag('config', TR.ga4Id);
        if (TR.googleAdsId) gtag('config', TR.googleAdsId);
        inject('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(TR.ga4Id || TR.googleAdsId));
      }
      loadedNow = true;
    } else if (googleLoaded) gtag('consent', 'update', consentState());

    if (hasMeta && !metaLoaded && granted('ads')) {
      metaLoaded = true;
      /* snippet padrão do Meta Pixel */
      const n = window.fbq = function () { n.callMethod? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!window._fbq) window._fbq = n;
      n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
      inject('https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', TR.metaPixelId);
      window.fbq('track', 'PageView');
      loadedNow = true;
    } else if (metaLoaded && window.fbq) window.fbq('consent', granted('ads')? 'grant' : 'revoke');
    if (loadedNow) flush();
  }

  /* ================= Eventos ================= */
  const META = { view_item: 'ViewContent', add_to_cart: 'AddToCart', begin_checkout: 'InitiateCheckout', search: 'Search', add_to_wishlist: 'AddToWishlist', generate_lead: 'Contact' };
  const log = [], pending = [], listeners = [];
  const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  // item_id é o mesmo id usado nos feeds (item_group_id), para os anúncios de catálogo casarem
  function item(p, qty = 1) {
    const pr = window.LOJA && window.LOJA.priceOf? window.LOJA.priceOf(p.id) : null;
    return { item_id: p.id.slice(0, 50), item_name: p.name, item_brand: p.brand, item_category: p.cat, item_variant: (pr && pr.rotulo) || undefined, price: pr? pr.pix : p.pix, quantity: qty };
  }
  function send(e) {
    if (googleLoaded) {
      if (TR.gtmId) {
        if (e.params.items) window.dataLayer.push({ ecommerce: null });
        const { items, value, currency, ...rest } = e.params;
        window.dataLayer.push({ event: e.name, event_id: e.id, ...rest, ...(items? { ecommerce: { currency, value, items } } : { value, currency }) });
      } else gtag('event', e.name, e.params);
      const lbl = (TR.googleAdsLabels || {})[e.name === 'begin_checkout'? 'checkout' : e.name === 'generate_lead'? 'whatsapp' : ''];
      if (lbl && TR.googleAdsId && !TR.gtmId && granted('ads'))
        gtag('event', 'conversion', { send_to: `${TR.googleAdsId}/${lbl}`, value: e.params.value, currency: 'BRL', transaction_id: e.params.transaction_id });
    }
    if (metaLoaded && window.fbq) {
      const p = { currency: 'BRL', value: e.params.value };
      if (e.params.items) { p.content_ids = e.params.items.map(i => i.item_id); p.content_type = 'product_group'; p.num_items = e.params.items.reduce((n, i) => n + i.quantity, 0); }
      if (e.params.search_term) p.search_string = e.params.search_term;
      // event_id permite deduplicar com a API de Conversões (servidor)
      if (META[e.name]) window.fbq('track', META[e.name], p, { eventID: e.id });
      else window.fbq('trackCustom', e.name, { ...e.params, items: undefined }, { eventID: e.id });
    }
  }
  function flush() { pending.splice(0).forEach(send); }

  function event(name, params = {}) {
    const e = { name, id: uid(), ts: Date.now(), params: { ...params } };
    if (e.params.items) e.params.currency = 'BRL';
    log.push(e); if (log.length > 200) log.shift();
    if (debug) console.info('[track]', name, e.params);
    listeners.forEach(fn => { try { fn(e); } catch {} });
    if (!hasAny) return e;
    if (googleLoaded || metaLoaded) send(e); else if (pending.length < 50) pending.push(e);
    return e;
  }

  function hook(kind, payload) {
    const url = (CFG.webhooks || {})[kind];
    if (!url) return;
    // LGPD: os identificadores de clique de anúncio (gclid, fbclid...) só seguem com consentimento de anúncios
    const atrib = granted('ads')? attr : Object.fromEntries(Object.entries(attr).filter(([k]) => !/^(gclid|gbraid|wbraid|fbclid)$/.test(k)));
    const body = JSON.stringify({ tipo: kind, ...payload, atribuicao: atrib, pagina: location.href, consentimento: consent || null, enviado_em: new Date().toISOString() });
    try {
      if (!(navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' }))))
        fetch(url, { method: 'POST', body, keepalive: true, mode: 'no-cors' }).catch(() => {});
    } catch {}
  }

  function lead(local, extra = {}) {
    const e = event('generate_lead', { method: 'whatsapp', local, ...extra });
    hook('lead', { evento_id: e.id, local, ...extra });
  }

  /* ================= Ligações com a loja ================= */
  const L = () => window.LOJA;
  // item de uma linha do carrinho: preço e variação da própria linha
  const lineItem = (l, qty) => ({ item_id: l.p.id.slice(0, 50), item_name: l.p.name, item_brand: l.p.brand, item_category: l.p.cat, item_variant: l.pr.rotulo || undefined, price: l.pr.pix, quantity: qty });
  const cartItems = () => L().lines().map(l => lineItem(l, l.q));
  const r2 = n => Math.round(Number((n * 100).toPrecision(12))) / 100; // igual ao carrinho
  const total = items => r2(items.reduce((n, i) => n + r2(i.price * i.quantity), 0));

  document.addEventListener('LOJA:add', e => {
    const l = L().line(e.detail.key || e.detail.id); if (!l) return;
    const it = lineItem(l, e.detail.qty);
    event('add_to_cart', { value: r2(it.price * it.quantity), items: [it] });
  });
  document.addEventListener('LOJA:remove', e => {
    const l = L().line(e.detail.key || e.detail.id);
    if (l) event('remove_from_cart', { value: l.pr.pix, items: [lineItem(l, 1)] });
  });
  document.addEventListener('LOJA:modal', e => {
    const p = L().byId[e.detail];
    event('view_item', { value: p.pix, items: [item(p)] });
  });
  document.addEventListener('LOJA:fav', e => {
    if (!e.detail.on) return;
    const p = L().byId[e.detail.id];
    event('add_to_wishlist', { value: p.pix, items: [item(p)] });
  });
  document.addEventListener('LOJA:wizard', e => event('assistente_concluido', { ...e.detail.respostas, sugestoes: e.detail.sugestoes.join(',') }));
  document.addEventListener('LOJA:cart', () => { if (window.LOJA && !Object.keys(L().cart()).length) store.del('LOJA-order'); });

  let tList, lastQ = '';
  document.addEventListener('LOJA:render', () => {
    clearTimeout(tList);
    tList = setTimeout(() => {
      const s = L().state;
      if (s.q && s.q !== lastQ) event('search', { search_term: s.q });
      lastQ = s.q;
      const cards = [...document.querySelectorAll('#grid [data-view]')].slice(0, 12).map(b => item(L().byId[b.dataset.view]));
      if (cards.length) event('view_item_list', { item_list_id: s.cat || 'todos', item_list_name: s.cat || 'Todos os produtos', items: cards });
    }, 900);
  });

  // Cliques para o WhatsApp: corrige o número, anexa a origem e mede
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href*="wa.me/"],a[href*="whatsapp.com/"]');
    if (a) {
      a.href = waUrl(a.href);
      if (a.hasAttribute('data-buynow')) return; // medido pela própria página de produto
      if (a.hasAttribute('data-checkout')) {
        const items = cartItems(), value = total(items), code = orderCode();
        const ev = event('begin_checkout', { value, transaction_id: code, items });
        hook('pedido', { evento_id: ev.id, codigo: code, valor_pix: value, itens: items });
      } else {
        const sec = a.closest('section[id],footer,header,aside,dialog');
        lead(a.classList.contains('fab')? 'botao-flutuante' : (sec && (sec.id || sec.tagName.toLowerCase())) || 'pagina');
      }
    }
    if (e.target.closest('[data-share]')) event('share', { method: navigator.share? 'nativo' : 'copiar-link', item_id: e.target.closest('[data-share]').dataset.share });
  }, true);

  /* ================= Banner de cookies ================= */
  function banner() {
    if (document.getElementById('cookieBar')) return;
    const el = document.createElement('div');
    el.id = 'cookieBar'; el.className = 'cookiebar'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Preferências de cookies');
    el.innerHTML = `
      <div class="cookiebar__txt"><b>Sua privacidade</b>
        <p>Usamos cookies para medir o uso do site e mostrar anúncios mais relevantes. Você escolhe o que permitir.</p>
        <div class="cookiebar__opts" hidden>
          <label><input type="checkbox" checked disabled> Essenciais (carrinho, favoritos, tema)</label>
          <label><input type="checkbox" id="ckAnalytics"> Medição de audiência</label>
          <label><input type="checkbox" id="ckAds"> Anúncios e remarketing</label>
        </div>
      </div>
      <div class="cookiebar__btns">
        <button class="btn btn--ghost-dark" data-ck="custom">Personalizar</button>
        <button class="btn btn--ghost-dark" data-ck="none">Só o essencial</button>
        <button class="btn btn--primary" data-ck="all">Aceitar todos</button>
      </div>`;
    document.body.appendChild(el);
    if (consent) { el.querySelector('#ckAnalytics').checked = !!consent.analytics; el.querySelector('#ckAds').checked = !!consent.ads; }
    el.addEventListener('click', ev => {
      const b = ev.target.closest('[data-ck]'); if (!b) return;
      const opts = el.querySelector('.cookiebar__opts');
      if (b.dataset.ck === 'custom' && opts.hidden) { opts.hidden = false; b.textContent = 'Salvar escolhas'; return; }
      const all = b.dataset.ck === 'all', none = b.dataset.ck === 'none';
      consent = { analytics: all || (!none && el.querySelector('#ckAnalytics').checked), ads: all || (!none && el.querySelector('#ckAds').checked), ts: Date.now() };
      store.set('LOJA-consent', consent);
      el.remove(); loadTags();
    });
  }
  function boot() {
    const link = document.getElementById('cookiePrefs');
    if (hasAny && needConsent) {
      if (link) { link.hidden = false; link.addEventListener('click', banner); }
      if (!consent) banner();
    }
    loadTags();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.LOJA_TRACK = { event, lead, hook, waUrl, orderCode, log, attribution: () => ({ ...attr }), on: fn => listeners.push(fn), consent: () => consent };
})();
