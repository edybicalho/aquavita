// Catálogo do site. É a fonte de preço e estoque de TUDO: loja, páginas de produto, IA e feeds.
// pix: preço com 6% OFF · cheio: preço no cartão · parcela: 10x sem juros (menor variação)
// opcao: variações do produto (voltagem, spots, potência), cada uma com preço cheio e estoque
// Depois de editar, rode:  python3 tools/build.py https://www.seudominio.com.br
window.PRODUTOS = [
  {
    "id": "motobomba-komeco-aquajet-260-hidromassagem-e-spa",
    "name": "Motobomba Komeco Aquajet 260 – Hidromassagem e Spa",
    "cat": "motobombas",
    "brand": "Komeco",
    "img": "assets/img/produtos/motobomba-komeco-aquajet-260-hidromassagem-e-spa.webp",
    "pix": 419.18,
    "parcela": 44.59,
    "estoque": true,
    "cheio": 445.94,
    "varia": false,
    "opcao": null
  },
  {
    "id": "motobomba-claw-3-4-cv-hidromassagem-e-spa",
    "name": "Motobomba Claw 3/4 Cv – Hidromassagem e Spa",
    "cat": "motobombas",
    "brand": "Claw",
    "img": "assets/img/produtos/motobomba-claw-3-4-cv-hidromassagem-e-spa.webp",
    "pix": 502.2,
    "parcela": 53.43,
    "estoque": true,
    "cheio": 534.26,
    "varia": false,
    "opcao": {
      "nome": "Voltagem",
      "itens": [
        {
          "valor": "220v",
          "rotulo": "220 V",
          "cheio": 534.26,
          "estoque": true
        }
      ]
    }
  },
  {
    "id": "motobomba-syllent-1-2-cv",
    "name": "Motobomba Syllent Geração 2 – 1/2 CV",
    "cat": "motobombas",
    "brand": "Syllent",
    "img": "assets/img/produtos/motobomba-syllent-1-2-cv.webp",
    "pix": 993.82,
    "parcela": 105.73,
    "estoque": true,
    "cheio": 1057.26,
    "varia": false,
    "opcao": {
      "nome": "Voltagem",
      "itens": [
        {
          "valor": "110v",
          "rotulo": "110 V",
          "cheio": 1057.26,
          "estoque": true
        },
        {
          "valor": "220v",
          "rotulo": "220 V",
          "cheio": 1057.26,
          "estoque": true
        }
      ]
    }
  },
  {
    "id": "motobomba-syllent-3-4-cv",
    "name": "Motobomba Syllent Super 3/4 CV – Hidromassagem e Spa",
    "cat": "motobombas",
    "brand": "Syllent",
    "img": "assets/img/produtos/motobomba-syllent-3-4-cv.webp",
    "pix": 1366.24,
    "parcela": 145.35,
    "estoque": true,
    "cheio": 1453.45,
    "varia": false,
    "opcao": {
      "nome": "Voltagem",
      "itens": [
        {
          "valor": "220v",
          "rotulo": "220 V",
          "cheio": 1453.45,
          "estoque": true
        }
      ]
    }
  },
  {
    "id": "motobomba-syllent-1-3-cv",
    "name": "Motobomba Syllent Geração 2 – 1/3 CV",
    "cat": "motobombas",
    "brand": "Syllent",
    "img": "assets/img/produtos/motobomba-syllent-1-3-cv.webp",
    "pix": 968.6,
    "parcela": 103.04,
    "estoque": true,
    "cheio": 1030.43,
    "varia": false,
    "opcao": {
      "nome": "Voltagem",
      "itens": [
        {
          "valor": "110v",
          "rotulo": "110 V",
          "cheio": 1030.43,
          "estoque": true
        },
        {
          "valor": "220v",
          "rotulo": "220 V",
          "cheio": 1030.43,
          "estoque": true
        }
      ]
    }
  },
  {
    "id": "motobomba-lepono-lspa-1-0-cv",
    "name": "Motobomba Lepono LSPA1100 – 1.0 CV",
    "cat": "motobombas",
    "brand": "Lepono",
    "img": "assets/img/produtos/motobomba-lepono-lspa-1-0-cv.webp",
    "pix": 647.66,
    "parcela": 68.9,
    "estoque": true,
    "cheio": 689.0,
    "varia": true,
    "opcao": {
      "nome": "Voltagem",
      "itens": [
        {
          "valor": "110v",
          "rotulo": "110 V",
          "cheio": 794.84,
          "estoque": true
        },
        {
          "valor": "220v",
          "rotulo": "220 V",
          "cheio": 689.0,
          "estoque": true
        }
      ]
    }
  },
  {
    "id": "motobomba-lepono-lspa-1-5-cv",
    "name": "Motobomba Lepono LSPA 1300 – 1.5 CV",
    "cat": "motobombas",
    "brand": "Lepono",
    "img": "assets/img/produtos/motobomba-lepono-lspa-1-5-cv.webp",
    "pix": 910.89,
    "parcela": 96.9,
    "estoque": true,
    "cheio": 969.03,
    "varia": false,
    "opcao": {
      "nome": "Voltagem",
      "itens": [
        {
          "valor": "110v",
          "rotulo": "110 V",
          "cheio": 969.03,
          "estoque": true
        },
        {
          "valor": "220v",
          "rotulo": "220 V",
          "cheio": 969.03,
          "estoque": true
        }
      ]
    }
  },
  {
    "id": "motobomba-lepono-lspa-1-2-cv",
    "name": "Motobomba Lepono LSPA 600 – 1/2 CV",
    "cat": "motobombas",
    "brand": "Lepono",
    "img": "assets/img/produtos/motobomba-lepono-lspa-1-2-cv.webp",
    "pix": 516.07,
    "parcela": 54.9,
    "estoque": true,
    "cheio": 549.01,
    "varia": false,
    "opcao": {
      "nome": "Voltagem",
      "itens": [
        {
          "valor": "110v",
          "rotulo": "110 V",
          "cheio": 549.01,
          "estoque": true
        },
        {
          "valor": "220v",
          "rotulo": "220 V",
          "cheio": 549.01,
          "estoque": true
        }
      ]
    }
  },
  {
    "id": "motobomba-syllent-super-2-0-cv",
    "name": "Motobomba Syllent Super 2.0 CV – Hidromassagem e Spa",
    "cat": "motobombas",
    "brand": "Syllent",
    "img": "assets/img/produtos/motobomba-syllent-super-2-0-cv.webp",
    "pix": 1613.68,
    "parcela": 171.67,
    "estoque": true,
    "cheio": 1716.68,
    "varia": false,
    "opcao": {
      "nome": "Voltagem",
      "itens": [
        {
          "valor": "110v",
          "rotulo": "110 V",
          "cheio": 1716.68,
          "estoque": true
        },
        {
          "valor": "220v",
          "rotulo": "220 V",
          "cheio": 1716.68,
          "estoque": false
        }
      ]
    }
  },
  {
    "id": "motobomba-claw-1-2cv",
    "name": "Motobomba Claw 1/2 Cv – Hidromassagem e Spa",
    "cat": "motobombas",
    "brand": "Claw",
    "img": "assets/img/produtos/motobomba-claw-1-2cv.webp",
    "pix": 399.52,
    "parcela": 42.5,
    "estoque": true,
    "cheio": 425.02,
    "varia": false,
    "opcao": {
      "nome": "Voltagem",
      "itens": [
        {
          "valor": "110v",
          "rotulo": "110 V",
          "cheio": 425.02,
          "estoque": true
        },
        {
          "valor": "220v",
          "rotulo": "220 V",
          "cheio": 425.02,
          "estoque": true
        }
      ]
    }
  },
  {
    "id": "controlador-sinapse-spamax-5-home-8000w-220",
    "name": "Controlador Sinapse Spamax 5 Home – 8000W 220V",
    "cat": "controladores",
    "brand": "Sinapse",
    "img": "assets/img/produtos/controlador-sinapse-spamax-5-home-8000w-220.webp",
    "pix": 2525.91,
    "parcela": 268.71,
    "estoque": true,
    "cheio": 2687.14,
    "varia": true,
    "opcao": {
      "nome": "Pontos de luz (spots)",
      "itens": [
        {
          "valor": "0",
          "rotulo": "Sem spots",
          "cheio": 2687.14,
          "estoque": true
        },
        {
          "valor": "1",
          "rotulo": "1 spot",
          "cheio": 2873.58,
          "estoque": true
        },
        {
          "valor": "2",
          "rotulo": "2 spots",
          "cheio": 3060.02,
          "estoque": true
        },
        {
          "valor": "3",
          "rotulo": "3 spots",
          "cheio": 3246.46,
          "estoque": true
        },
        {
          "valor": "4",
          "rotulo": "4 spots",
          "cheio": 3432.9,
          "estoque": true
        }
      ]
    }
  },
  {
    "id": "controlador-sinapse-spamax-4-home-8000w-220",
    "name": "Controlador Sinapse Spamax 4 Home – 8000W 220V",
    "cat": "controladores",
    "brand": "Sinapse",
    "img": "assets/img/produtos/controlador-sinapse-spamax-4-home-8000w-220.webp",
    "pix": 2168.39,
    "parcela": 230.68,
    "estoque": true,
    "cheio": 2306.8,
    "varia": true,
    "opcao": {
      "nome": "Pontos de luz (spots)",
      "itens": [
        {
          "valor": "0",
          "rotulo": "Sem spots",
          "cheio": 2306.8,
          "estoque": true
        },
        {
          "valor": "1",
          "rotulo": "1 spot",
          "cheio": 2493.24,
          "estoque": true
        },
        {
          "valor": "2",
          "rotulo": "2 spots",
          "cheio": 2679.68,
          "estoque": true
        },
        {
          "valor": "3",
          "rotulo": "3 spots",
          "cheio": 2866.12,
          "estoque": true
        },
        {
          "valor": "4",
          "rotulo": "4 spots",
          "cheio": 3052.56,
          "estoque": true
        }
      ]
    }
  },
  {
    "id": "controlador-sinapse-spamax-8-home-8000w-220",
    "name": "Controlador Sinapse Spamax 8 Home – 8000W 220V",
    "cat": "controladores",
    "brand": "Sinapse",
    "img": "assets/img/produtos/controlador-sinapse-spamax-8-home-8000w-220.webp",
    "pix": 2739.84,
    "parcela": 291.47,
    "estoque": true,
    "cheio": 2914.72,
    "varia": true,
    "opcao": {
      "nome": "Pontos de luz (spots)",
      "itens": [
        {
          "valor": "0",
          "rotulo": "Sem spots",
          "cheio": 2914.72,
          "estoque": true
        },
        {
          "valor": "1",
          "rotulo": "1 spot",
          "cheio": 3101.16,
          "estoque": true
        },
        {
          "valor": "2",
          "rotulo": "2 spots",
          "cheio": 3287.6,
          "estoque": true
        },
        {
          "valor": "3",
          "rotulo": "3 spots",
          "cheio": 3474.04,
          "estoque": true
        },
        {
          "valor": "4",
          "rotulo": "4 spots",
          "cheio": 3660.48,
          "estoque": true
        }
      ]
    }
  },
  {
    "id": "controlador-sinapse-spamax-home-9-8000w-220",
    "name": "Controlador Sinapse Spamax Home 9 – 8000w – 220V",
    "cat": "controladores",
    "brand": "Sinapse",
    "img": "assets/img/produtos/controlador-sinapse-spamax-home-9-8000w-220.webp",
    "pix": 3019.18,
    "parcela": 321.19,
    "estoque": true,
    "cheio": 3211.89,
    "varia": true,
    "opcao": {
      "nome": "Pontos de luz (spots)",
      "itens": [
        {
          "valor": "0",
          "rotulo": "Sem spots",
          "cheio": 3211.89,
          "estoque": true
        },
        {
          "valor": "1",
          "rotulo": "1 spot",
          "cheio": 3398.33,
          "estoque": true
        },
        {
          "valor": "2",
          "rotulo": "2 spots",
          "cheio": 3584.77,
          "estoque": true
        },
        {
          "valor": "3",
          "rotulo": "3 spots",
          "cheio": 3771.21,
          "estoque": true
        },
        {
          "valor": "4",
          "rotulo": "4 spots",
          "cheio": 3957.65,
          "estoque": true
        }
      ]
    }
  },
  {
    "id": "aquecedor-digital-smart-sanspray-8f-pro-8-000w-220",
    "name": "Aquecedor Digital Smart Sanspray – 8F PRO 8.000W – 220V",
    "cat": "aquecedores",
    "brand": "Sanspray",
    "img": "assets/img/produtos/aquecedor-digital-smart-sanspray-8f-pro-8-000w-220.webp",
    "pix": 2548.81,
    "parcela": 271.15,
    "estoque": true,
    "cheio": 2711.5,
    "varia": true,
    "opcao": {
      "nome": "Pontos de luz (spots)",
      "itens": [
        {
          "valor": "0",
          "rotulo": "Sem spots",
          "cheio": 2711.5,
          "estoque": true
        },
        {
          "valor": "1",
          "rotulo": "1 spot",
          "cheio": 2800.26,
          "estoque": true
        },
        {
          "valor": "2",
          "rotulo": "2 spots",
          "cheio": 2889.02,
          "estoque": true
        },
        {
          "valor": "3",
          "rotulo": "3 spots",
          "cheio": 2977.78,
          "estoque": true
        },
        {
          "valor": "4",
          "rotulo": "4 spots",
          "cheio": 3066.54,
          "estoque": true
        }
      ]
    }
  },
  {
    "id": "aquecedor-digital-smart-sanspray-5f-pro-8-000w-220",
    "name": "Aquecedor Digital Smart Sanspray – 5F PRO 8.000W – 220V",
    "cat": "aquecedores",
    "brand": "Sanspray",
    "img": "assets/img/produtos/aquecedor-digital-smart-sanspray-5f-pro-8-000w-220.webp",
    "pix": 2030.86,
    "parcela": 216.05,
    "estoque": true,
    "cheio": 2160.49,
    "varia": true,
    "opcao": {
      "nome": "Pontos de luz (spots)",
      "itens": [
        {
          "valor": "0",
          "rotulo": "Sem spots",
          "cheio": 2160.49,
          "estoque": true
        },
        {
          "valor": "1",
          "rotulo": "1 spot",
          "cheio": 2249.25,
          "estoque": true
        },
        {
          "valor": "2",
          "rotulo": "2 spots",
          "cheio": 2338.01,
          "estoque": true
        },
        {
          "valor": "3",
          "rotulo": "3 spots",
          "cheio": 2426.77,
          "estoque": true
        },
        {
          "valor": "4",
          "rotulo": "4 spots",
          "cheio": 2515.53,
          "estoque": true
        }
      ]
    }
  },
  {
    "id": "aquecedor-digital-smart-wave-ultra-s",
    "name": "Aquecedor Digital Smart Sanspray – Wave Ultra S",
    "cat": "aquecedores",
    "brand": "Sanspray",
    "img": "assets/img/produtos/aquecedor-digital-smart-wave-ultra-s.webp",
    "pix": 3036.85,
    "parcela": 323.07,
    "estoque": false,
    "cheio": 3230.69,
    "varia": true,
    "opcao": {
      "nome": "Pontos de luz (spots)",
      "itens": [
        {
          "valor": "0",
          "rotulo": "Sem spots",
          "cheio": 3230.69,
          "estoque": false
        },
        {
          "valor": "1",
          "rotulo": "1 spot",
          "cheio": 3319.45,
          "estoque": false
        },
        {
          "valor": "2",
          "rotulo": "2 spots",
          "cheio": 3408.21,
          "estoque": false
        },
        {
          "valor": "3",
          "rotulo": "3 spots",
          "cheio": 3496.97,
          "estoque": false
        },
        {
          "valor": "4",
          "rotulo": "4 spots",
          "cheio": 3585.73,
          "estoque": false
        }
      ]
    }
  },
  {
    "id": "kit-motobombalepono-aquecedor3f",
    "name": "Kit Motobomba Lepono LSPA 1/2 CV + Aquecedor Sanspray 3 Funções Digital (220v)",
    "cat": "kits",
    "brand": "Lepono",
    "img": "assets/img/produtos/kit-motobombalepono-aquecedor3f.webp",
    "pix": 1222.45,
    "parcela": 130.05,
    "estoque": true,
    "cheio": 1300.48,
    "varia": false,
    "opcao": {
      "nome": "Potência do aquecedor",
      "itens": [
        {
          "valor": "5000-whatts",
          "rotulo": "5.000 W",
          "cheio": 1300.48,
          "estoque": true
        },
        {
          "valor": "8000-watts",
          "rotulo": "8.000 W",
          "cheio": 1300.48,
          "estoque": true
        }
      ]
    }
  },
  {
    "id": "aquecedor-sanspray-line-clean-3-funcoes",
    "name": "Aquecedor Sanspray 3 Funções Digital",
    "cat": "aquecedores",
    "brand": "Sanspray",
    "img": "assets/img/produtos/aquecedor-sanspray-line-clean-3-funcoes.webp",
    "pix": 779.29,
    "parcela": 82.9,
    "estoque": true,
    "cheio": 829.03,
    "varia": false,
    "opcao": {
      "nome": "Potência do aquecedor",
      "itens": [
        {
          "valor": "4700W/110V",
          "rotulo": "4700W/110V",
          "cheio": 829.03,
          "estoque": true
        },
        {
          "valor": "5000W/220V",
          "rotulo": "5000W/220V",
          "cheio": 829.03,
          "estoque": true
        },
        {
          "valor": "8000W/220V",
          "rotulo": "8000W/220V",
          "cheio": 829.03,
          "estoque": true
        }
      ]
    }
  },
  {
    "id": "kit-motobomba-lepono-lspa-1-0-cv-aquecedor-sanspray-3-funcoes-digital-220v",
    "name": "Kit Motobomba Lepono LSPA 1.0 CV + Aquecedor Sanspray 3 Funções Digital (220v)",
    "cat": "kits",
    "brand": "Lepono",
    "img": "assets/img/produtos/kit-motobomba-lepono-lspa-1-0-cv-aquecedor-sanspray-3-funcoe.webp",
    "pix": 1296.58,
    "parcela": 137.93,
    "estoque": true,
    "cheio": 1379.34,
    "varia": true,
    "opcao": {
      "nome": "Potência do aquecedor",
      "itens": [
        {
          "valor": "5000-whatts",
          "rotulo": "5.000 W",
          "cheio": 1379.34,
          "estoque": true
        },
        {
          "valor": "8000-watts",
          "rotulo": "8.000 W",
          "cheio": 1380.45,
          "estoque": true
        }
      ]
    }
  },
  {
    "id": "aquecedor-sanspray-line-clean-4-funcoes-8-000w-220v",
    "name": "Aquecedor Sanspray Line Clean – 4 Funções 8.000W – 220V",
    "cat": "aquecedores",
    "brand": "Sanspray",
    "img": "assets/img/produtos/aquecedor-sanspray-line-clean-4-funcoes-8-000w-220v.webp",
    "pix": 1226.39,
    "parcela": 130.47,
    "estoque": true,
    "cheio": 1304.67,
    "varia": false,
    "opcao": null
  },
  {
    "id": "kit-motobomba-syllent-1-0-cv-aquecedor-sanspray-3-funcoes-digital-220v",
    "name": "Kit Motobomba Syllent 1.0 CV + Aquecedor Sanspray 3 Funções Digital (220v)",
    "cat": "kits",
    "brand": "Syllent",
    "img": "assets/img/produtos/kit-motobomba-syllent-1-0-cv-aquecedor-sanspray-3-funcoes-di.webp",
    "pix": 1964.48,
    "parcela": 208.99,
    "estoque": false,
    "cheio": 2089.87,
    "varia": false,
    "opcao": {
      "nome": "Potência do aquecedor",
      "itens": [
        {
          "valor": "5000-whatts",
          "rotulo": "5.000 W",
          "cheio": 2089.87,
          "estoque": false
        },
        {
          "valor": "8000-watts",
          "rotulo": "8.000 W",
          "cheio": 2089.87,
          "estoque": false
        }
      ]
    }
  },
  {
    "id": "aquecedor-sinapse-avantime-serial",
    "name": "Aquecedor Sinapse Avantime Light/Serial",
    "cat": "aquecedores",
    "brand": "Sinapse",
    "img": "assets/img/produtos/aquecedor-sinapse-avantime-serial.webp",
    "pix": 1042.61,
    "parcela": 110.92,
    "estoque": true,
    "cheio": 1109.16,
    "varia": false,
    "opcao": {
      "nome": "Potência do aquecedor",
      "itens": [
        {
          "valor": "5000W/110V",
          "rotulo": "5000W/110V",
          "cheio": 1109.16,
          "estoque": true
        },
        {
          "valor": "5000W/220V",
          "rotulo": "5000W/220V",
          "cheio": 1109.16,
          "estoque": true
        },
        {
          "valor": "8000W/220V",
          "rotulo": "8000W/220V",
          "cheio": 1109.16,
          "estoque": true
        }
      ]
    }
  },
  {
    "id": "kit-motobomba-syllent-1-2-cv-aquecedor-sanspray-3-funcoes-digital-220v",
    "name": "Kit Motobomba Syllent 1/2 CV + Aquecedor Sanspray 3 Funções Digital (220v)",
    "cat": "kits",
    "brand": "Syllent",
    "img": "assets/img/produtos/kit-motobomba-syllent-1-2-cv-aquecedor-sanspray-3-funcoes-di.webp",
    "pix": 1593.56,
    "parcela": 169.53,
    "estoque": true,
    "cheio": 1695.28,
    "varia": false,
    "opcao": {
      "nome": "Potência do aquecedor",
      "itens": [
        {
          "valor": "5000-whatts",
          "rotulo": "5.000 W",
          "cheio": 1695.28,
          "estoque": true
        },
        {
          "valor": "8000-watts",
          "rotulo": "8.000 W",
          "cheio": 1695.28,
          "estoque": true
        }
      ]
    }
  },
  {
    "id": "aquecedor-sanspray-duo-digital-8000-w-220v",
    "name": "Aquecedor Sanspray Duo Digital 8000 W – 220V",
    "cat": "aquecedores",
    "brand": "Sanspray",
    "img": "assets/img/produtos/aquecedor-sanspray-duo-digital-8000-w-220v.webp",
    "pix": 913.1,
    "parcela": 97.14,
    "estoque": true,
    "cheio": 971.38,
    "varia": false,
    "opcao": null
  },
  {
    "id": "kit-motobomba-lepono-lspa-1-5-cv-aquecedor-sanspray-3-funcoes-digital-220v",
    "name": "Kit Motobomba Lepono LSPA 1.5 CV + Aquecedor Sanspray 3 Funções Digital (220v)",
    "cat": "kits",
    "brand": "Lepono",
    "img": "assets/img/produtos/kit-motobomba-lepono-lspa-1-5-cv-aquecedor-sanspray-3-funcoe.webp",
    "pix": 1609.52,
    "parcela": 171.23,
    "estoque": true,
    "cheio": 1712.25,
    "varia": false,
    "opcao": {
      "nome": "Potência do aquecedor",
      "itens": [
        {
          "valor": "5000-whatts",
          "rotulo": "5.000 W",
          "cheio": 1712.25,
          "estoque": true
        },
        {
          "valor": "8000-watts",
          "rotulo": "8.000 W",
          "cheio": 1712.25,
          "estoque": true
        }
      ]
    }
  },
  {
    "id": "kit-motobomba-syllent-3-4-cv-aquecedor-sanspray-3-funcoes-digital-220v",
    "name": "Kit Motobomba Syllent 3/4 CV + Aquecedor Sanspray 3 Funções Digital (220v)",
    "cat": "kits",
    "brand": "Syllent",
    "img": "assets/img/produtos/kit-motobomba-syllent-3-4-cv-aquecedor-sanspray-3-funcoes-di.webp",
    "pix": 1864.97,
    "parcela": 198.4,
    "estoque": true,
    "cheio": 1984.01,
    "varia": false,
    "opcao": {
      "nome": "Potência do aquecedor",
      "itens": [
        {
          "valor": "5000-whatts",
          "rotulo": "5.000 W",
          "cheio": 1984.01,
          "estoque": true
        },
        {
          "valor": "8000-watts",
          "rotulo": "8.000 W",
          "cheio": 1984.01,
          "estoque": true
        }
      ]
    }
  },
  {
    "id": "kit-motobomba-syllent-1-3-cv-aquecedor-sanspray-3-funcoes-digital-220v",
    "name": "Kit Motobomba Syllent 1/3 CV + Aquecedor Sanspray 3 Funções Digital (220v)",
    "cat": "kits",
    "brand": "Syllent",
    "img": "assets/img/produtos/kit-motobomba-syllent-1-3-cv-aquecedor-sanspray-3-funcoes-di.webp",
    "pix": 1697.14,
    "parcela": 180.55,
    "estoque": true,
    "cheio": 1805.47,
    "varia": true,
    "opcao": {
      "nome": "Potência do aquecedor",
      "itens": [
        {
          "valor": "5000-whatts",
          "rotulo": "5.000 W",
          "cheio": 1805.47,
          "estoque": true
        },
        {
          "valor": "8000-watts",
          "rotulo": "8.000 W",
          "cheio": 1806.21,
          "estoque": true
        }
      ]
    }
  },
  {
    "id": "kit-motobomba-syllent-1-5-cv-aquecedor-sanspray-3-funcoes-digital-220v",
    "name": "Kit Motobomba Syllent 1.5 CV + Aquecedor Sanspray 3 Funções Digital (220v)",
    "cat": "kits",
    "brand": "Syllent",
    "img": "assets/img/produtos/kit-motobomba-syllent-1-5-cv-aquecedor-sanspray-3-funcoes-di.webp",
    "pix": 1942.2,
    "parcela": 206.62,
    "estoque": false,
    "cheio": 2066.17,
    "varia": false,
    "opcao": {
      "nome": "Potência do aquecedor",
      "itens": [
        {
          "valor": "5000-whatts",
          "rotulo": "5.000 W",
          "cheio": 2066.17,
          "estoque": false
        },
        {
          "valor": "8000-watts",
          "rotulo": "8.000 W",
          "cheio": 2066.17,
          "estoque": false
        }
      ]
    }
  },
  {
    "id": "kit-motobomba-syllent-2-0-cv-aquecedor-sanspray-3-funcoes-digital-220v",
    "name": "Kit Motobomba Syllent 2.0 CV + Aquecedor Sanspray 3 Funções Digital (220v)",
    "cat": "kits",
    "brand": "Syllent",
    "img": "assets/img/produtos/kit-motobomba-syllent-2-0-cv-aquecedor-sanspray-3-funcoes-di.webp",
    "pix": 2098.15,
    "parcela": 223.21,
    "estoque": true,
    "cheio": 2232.07,
    "varia": false,
    "opcao": {
      "nome": "Potência do aquecedor",
      "itens": [
        {
          "valor": "5000-whatts",
          "rotulo": "5.000 W",
          "cheio": 2232.07,
          "estoque": true
        },
        {
          "valor": "8000-watts",
          "rotulo": "8.000 W",
          "cheio": 2232.07,
          "estoque": true
        }
      ]
    }
  }
];
