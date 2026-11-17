// Dados técnicos usados pela calculadora "Monte seu sistema" e pelos comparativos.
// Fonte: pesquisa de 14/11/2026 (pasta pesquisa/): manuais e sites dos fabricantes
// (Syllent, Sanspray, Komeco) e, onde não há fabricante, revendas. null = não informado.
// "127" é a rede de 110/127 V; os manuais Syllent indicam 120 V nesse caso.
// Ao cadastrar um produto novo, acrescente-o aqui para ele entrar nas duas ferramentas.
window.TECNICO = {
  // ---------- Motobombas ----------
  // corrente: A por tensão · vazao: m³/h (vazaoRef: altura em que foi medida) · pressao: mca
  motobombas: {
    'motobomba-syllent-1-3-cv': { cv: '1/3', corrente: { 127: 5.0, 220: 2.6 }, vazao: 10.3, vazaoRef: '2 m', pressao: 10.0, peso: 3.52, codigo: 'MB63E0111A/P · MB63E0114A/P' },
    'motobomba-syllent-1-2-cv': { cv: '1/2', corrente: { 127: 6.0, 220: 3.2 }, vazao: 11.5, vazaoRef: '2 m', pressao: 12.0, peso: 3.94, codigo: 'MB63E0112A/P · MB63E0115A/P' },
    'motobomba-syllent-3-4-cv': { cv: '3/4', corrente: { 127: 8.3, 220: 4.5 }, vazao: 21.6, vazaoRef: '2 m', pressao: 12.0, peso: 6.55, garantia: '2 anos', codigo: 'MB42E0213AS' },
    'motobomba-syllent-super-2-0-cv': { cv: '2', corrente: { 127: 13.5, 220: 6.5 }, vazao: 26.8, vazaoRef: '2 m', pressao: 16.5, peso: 8.3, garantia: '2 anos', codigo: 'MB42E0216AS · MB42E0217AS' },
    'motobomba-komeco-aquajet-260-hidromassagem-e-spa': { cv: '1', corrente: { 127: 6.75, 220: 3.4 }, vazao: 15.6, vazaoRef: 'máxima', pressao: 10.0, peso: 8.5, ip: 'IP44', garantia: '12 meses' },
    'motobomba-lepono-lspa-1-2-cv': { cv: '1/2', corrente: null, vazao: 15.7, vazaoRef: '4 m', pressao: 12, ip: 'IPX5', garantia: '18 meses', codigo: 'LSPA600' },
    'motobomba-lepono-lspa-1-0-cv': { cv: '1', corrente: null, vazao: 15.1, vazaoRef: 'máxima', pressao: 15, ip: 'IPX5', garantia: '18 meses', codigo: 'LSPA1100' },
    'motobomba-lepono-lspa-1-5-cv': { cv: '1,5', corrente: null, vazao: null, pressao: null, ip: 'IPX5', garantia: '18 meses', codigo: 'LSPA1300' },
    'motobomba-claw-1-2cv': { cv: '1/2', corrente: null, vazao: null, pressao: null },
    'motobomba-claw-3-4-cv-hidromassagem-e-spa': { cv: '3/4', corrente: null, vazao: null, pressao: null },
  },

  // ---------- Aquecedores e controladores (a "central" da banheira) ----------
  // saidas: quantas motobombas comanda · bombaMax: limite por saída (A, ou CV por tensão)
  // versoes: w, v, a (corrente), fio (mm²), dr (A) · ref: 'geral' = fio e DR pela potência, sem manual do modelo
  centrais: {
    'aquecedor-sanspray-line-clean-3-funcoes': {
      tipo: 'Aquecedor', painel: '3 funções', saidas: 1, bombaMax: { a: 10.9 }, temp: '20 a 40 °C', garantia: '1 ano',
      recursos: {},
      versoes: [
        { w: 4700, v: 127, a: 37.0, fio: 10, dr: 63, valor: '4700W/110V' },
        { w: 5000, v: 220, a: 22.7, fio: 6, dr: 40, valor: '5000W/220V' },
        { w: 8000, v: 220, a: 36.4, fio: 10, dr: 63, valor: '8000W/220V' },
      ],
    },
    'aquecedor-sanspray-line-clean-4-funcoes-8-000w-220v': {
      tipo: 'Aquecedor', painel: '4 funções', saidas: 1, bombaMax: { a: 10.9 }, temp: '20 a 40 °C', garantia: '1 ano',
      recursos: { cromo: true },
      versoes: [{ w: 8000, v: 220, a: 36.4, fio: 10, dr: 63 }],
    },
    'aquecedor-sanspray-duo-digital-8000-w-220v': {
      tipo: 'Aquecedor', painel: 'Duo (2 hidros + luz)', saidas: 2, bombaMax: { a: 10.9 }, temp: '20 a 40 °C', garantia: '1 ano',
      recursos: { cromo: true },
      versoes: [{ w: 8000, v: 220, a: 36.4, fio: 10, dr: 63 }],
    },
    'aquecedor-digital-smart-sanspray-5f-pro-8-000w-220': {
      tipo: 'Aquecedor', painel: '5F PRO (digital)', saidas: 3, bombaMax: null, temp: '20 a 40 °C', garantia: '1 ano',
      recursos: { cromo: true, app: true },
      versoes: [{ w: 8000, v: 220, a: 36.4, fio: 10, dr: 63 }],
    },
    'aquecedor-digital-smart-sanspray-8f-pro-8-000w-220': {
      tipo: 'Aquecedor', painel: '8F PRO (digital)', saidas: 3, bombaMax: null, temp: '20 a 40 °C', garantia: '1 ano',
      recursos: { cromo: true, app: true, borbulhador: true, filtro: true },
      versoes: [{ w: 8000, v: 220, a: 36.4, fio: 10, dr: 63 }],
    },
    'aquecedor-digital-smart-wave-ultra-s': {
      tipo: 'Aquecedor', painel: 'Controll Wave Ultra S', saidas: 4, bombaMax: null, temp: '20 a 40 °C', garantia: '12 meses',
      recursos: { cromo: true, app: true, voz: true, borbulhador: true, filtro: true },
      versoes: [{ w: 8000, v: 220, a: 36.4, fio: 16, dr: 63 }],
    },
    'aquecedor-sinapse-avantime-serial': {
      tipo: 'Aquecedor', painel: 'Avantime', saidas: 1, bombaMax: { cv: { 127: 1, 220: 1.5 } }, temp: '21 a 40 °C', garantia: '12 meses',
      recursos: {},
      versoes: [
        { w: 5000, v: 127, a: 39.4, fio: 10, dr: 63, valor: '5000W/110V', ref: 'geral' },
        { w: 5000, v: 220, a: 22.7, fio: 6, dr: 40, valor: '5000W/220V', ref: 'geral' },
        { w: 8000, v: 220, a: 36.4, fio: 10, dr: 63, valor: '8000W/220V', ref: 'geral' },
      ],
    },
    'controlador-sinapse-spamax-4-home-8000w-220': {
      tipo: 'Controlador', painel: 'Spamax 4 Home', saidas: 2, bombaMax: { cv: { 220: 1.5 } }, temp: '21 a 40 °C', garantia: '12 meses',
      recursos: { cromo: true },
      versoes: [{ w: 8000, v: 220, a: 36.4, fio: 10, dr: 63, ref: 'geral' }],
    },
    'controlador-sinapse-spamax-5-home-8000w-220': {
      tipo: 'Controlador', painel: 'Spamax 5 Home', saidas: 3, bombaMax: { cv: { 220: 1.5 } }, temp: '21 a 40 °C', garantia: '12 meses',
      recursos: { cromo: true },
      versoes: [{ w: 8000, v: 220, a: 36.4, fio: 10, dr: 63, ref: 'geral' }],
    },
    'controlador-sinapse-spamax-8-home-8000w-220': {
      tipo: 'Controlador', painel: 'Spamax 8 Home', saidas: 4, bombaMax: { cv: { 220: 1.5 } }, temp: '21 a 40 °C', garantia: '12 meses',
      recursos: { cromo: true },
      versoes: [{ w: 8000, v: 220, a: 36.4, fio: 10, dr: 63, ref: 'geral' }],
    },
  },

  // ---------- Kits (motobomba + aquecedor Sanspray 3 Funções, 220 V) ----------
  // motor: id da motobomba avulsa, ou os dados da motobomba quando ela não é vendida separada
  kits: {
    'kit-motobomba-syllent-1-3-cv-aquecedor-sanspray-3-funcoes-digital-220v': { motor: 'motobomba-syllent-1-3-cv' },
    'kit-motobomba-syllent-1-2-cv-aquecedor-sanspray-3-funcoes-digital-220v': { motor: 'motobomba-syllent-1-2-cv' },
    'kit-motobomba-syllent-3-4-cv-aquecedor-sanspray-3-funcoes-digital-220v': { motor: 'motobomba-syllent-3-4-cv' },
    'kit-motobomba-syllent-1-0-cv-aquecedor-sanspray-3-funcoes-digital-220v': { motor: { cv: '1', corrente: { 220: 4.9 }, vazao: 22.9, vazaoRef: '2 m', pressao: 13.2, peso: 7.4, garantia: '2 anos', codigo: 'MB42E0214AS' } },
    'kit-motobomba-syllent-1-5-cv-aquecedor-sanspray-3-funcoes-digital-220v': { motor: { cv: '1,5', corrente: { 220: 5.4 }, vazao: 25.0, vazaoRef: '2 m', pressao: 14.4, peso: 8.2, garantia: '2 anos', codigo: 'MB42E0215AS' } },
    'kit-motobomba-syllent-2-0-cv-aquecedor-sanspray-3-funcoes-digital-220v': { motor: 'motobomba-syllent-super-2-0-cv' },
    'kit-motobombalepono-aquecedor3f': { motor: 'motobomba-lepono-lspa-1-2-cv' },
    'kit-motobomba-lepono-lspa-1-0-cv-aquecedor-sanspray-3-funcoes-digital-220v': { motor: 'motobomba-lepono-lspa-1-0-cv' },
    'kit-motobomba-lepono-lspa-1-5-cv-aquecedor-sanspray-3-funcoes-digital-220v': { motor: 'motobomba-lepono-lspa-1-5-cv' },
  },
};
