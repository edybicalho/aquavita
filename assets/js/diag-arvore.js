/* AquaVita Peças — perguntas e resultados do diagnóstico "Minha hidro não liga" (tela em assets/js/diag.js).
   Fontes: manuais Sanspray Line Clean 3/4 funções (rev. 29), Syllent Geração II, Super Syllent e Komeco Aquajet
   (pasta pesquisa/manuais; páginas citadas nos comentários) e pesquisa na internet de 16/11/2026.
   Regras: o cliente só faz verificações seguras (nível de água, disjuntor, painel); tudo que envolve abrir partes
   elétricas ou a motobomba é marcado tecnico: true. Nunca orientar a insistir em religar.

   Pergunta:  { tipo: 'pergunta', titulo, curto (rótulo curto para o histórico), texto?, alerta?, opcoes: [{ texto, detalhe?, icone?, ir }] }
   Resultado: { tipo: 'resultado', titulo, causa, fazer: [...], tecnico, produtos?: [ids de products.js], categoria?, peca?, alerta? }
   Um nó pode ser alcançado por mais de um caminho, mas sem voltar para trás (sem ciclos). */
window.DIAG_ARVORE = {
  inicio: 'inicio',
  nos: {
    inicio: {
      tipo: 'pergunta', curto: 'Problema', titulo: 'O que está acontecendo com a sua hidro?',
      opcoes: [
        { icone: '⏻', texto: 'Não liga', detalhe: 'Aperto o botão e nada funciona', ir: 'nl_agua' },
        { icone: '⚠', texto: 'Aparece um código no painel', detalhe: 'E1, E2, E3 ou E4', ir: 'cod' },
        { icone: '🌡', texto: 'Não esquenta', detalhe: 'Os jatos funcionam, a água fica fria', ir: 'aq_jatos' },
        { icone: '🔊', texto: 'Barulho ou jato fraco', detalhe: 'Ronco, bolhas, vibração', ir: 'br_tipo' },
        { icone: '⚡', texto: 'O disjuntor desarma', detalhe: 'Cai a energia ao ligar', ir: 'dr_quando' },
        { icone: '💡', texto: 'A luz não acende', detalhe: 'Cromoterapia ou LED', ir: 'luz_jatos' },
      ],
    },

    /* ---------- NÃO LIGA ---------- */
    nl_agua: {
      tipo: 'pergunta', curto: 'Água', titulo: 'A água cobre todos os jatos e o sensor de nível?',
      texto: 'Por segurança, a hidro só liga com a água acima dos jatos mais altos. Abaixo do sensor, o sistema desliga sozinho.',
      opcoes: [
        { texto: 'Não, o nível está baixo', ir: 'r_nivel' },
        { texto: 'Sim, está bem cheia', ir: 'nl_disjuntor' },
      ],
    },
    nl_disjuntor: {
      tipo: 'pergunta', curto: 'Disjuntor', titulo: 'O disjuntor da banheira, no quadro de luz, está ligado?',
      alerta: 'Só olhe a alavanca do disjuntor. Não abra o quadro nem mexa em fios.',
      opcoes: [
        { texto: 'Está desligado ou desarmado', ir: 'nl_religou' },
        { texto: 'Está ligado', ir: 'nl_botao' },
        { texto: 'Não sei qual é o disjuntor', ir: 'r_sem_energia' },
      ],
    },
    nl_religou: {
      tipo: 'pergunta', curto: 'Ao religar', titulo: 'Religue o disjuntor uma vez só. O que aconteceu?',
      texto: 'Não insista em religar várias vezes seguidas: isso pode danificar a motobomba.',
      opcoes: [
        { texto: 'A hidro voltou a funcionar', ir: 'r_religou' },
        { texto: 'O disjuntor desarmou de novo', ir: 'dr_quando' },
        { texto: 'Ficou ligado, mas a hidro continua sem ligar', ir: 'nl_botao' },
      ],
    },
    nl_botao: {
      tipo: 'pergunta', curto: 'Ao apertar o botão', titulo: 'Quando você aperta o botão da hidro, o que acontece?',
      opcoes: [
        { texto: 'Nada: nenhum som, nenhuma luz', ir: 'nl_tipo_painel' },
        { texto: 'O painel acende, mas o motor não liga', ir: 'r_painel_sem_motor' },
        { texto: 'O motor faz um zumbido, mas não gira', ir: 'r_zumbido' },
        { texto: 'Liga por alguns segundos e desliga', ir: 'r_liga_desliga' },
      ],
    },
    nl_tipo_painel: {
      tipo: 'pergunta', curto: 'Comando', titulo: 'Como você liga a sua hidro?',
      opcoes: [
        { texto: 'Por um painel digital, com visor ou números', detalhe: 'E o painel fica apagado', ir: 'r_sem_energia' },
        { texto: 'Por um botão redondo na borda da banheira', detalhe: 'Sem visor', ir: 'r_acionador' },
      ],
    },

    r_nivel: {
      tipo: 'resultado', tecnico: false, titulo: 'Falta água na banheira',
      causa: 'Com a água abaixo do sensor de nível, o sistema desliga a motobomba e o aquecimento por segurança.',
      fazer: [
        'Encha a banheira até a água cobrir os jatos mais altos.',
        'Se a banheira tiver sensor de nível com luz, confira se a luz vermelha acendeu (acesa = água detectada).',
        'Com a banheira cheia, desligue o disjuntor da banheira por 1 minuto e religue para rearmar a proteção.',
        'Tente ligar de novo. Se não ligar com a banheira cheia, refaça o diagnóstico respondendo "Sim, está bem cheia".',
      ],
    },
    r_religou: {
      tipo: 'resultado', tecnico: false, titulo: 'A proteção tinha desligado o sistema',
      causa: 'A motobomba tem proteção contra superaquecimento e contra funcionar sem água: ela desliga e só volta depois que o disjuntor é rearmado.',
      fazer: [
        'Use normalmente, sempre com a água acima dos jatos.',
        'Antes de ligar, encha bem a banheira: as motobombas de hidro não puxam água sozinhas e precisam estar cheias.',
        'Se voltar a desligar sozinha, não insista: chame um técnico para ver a causa (falta de água, ventilação do motor ou tensão baixa).',
      ],
      categoria: 'motobombas',
    },
    r_sem_energia: {
      tipo: 'resultado', tecnico: true, titulo: 'A energia não está chegando ao comando da hidro',
      causa: 'Disjuntor exclusivo da banheira desarmado, falta de energia no circuito ou cabo de alimentação/conector do painel solto.',
      fazer: [
        'Confira se há energia no restante da casa.',
        'Peça a um eletricista para localizar o disjuntor exclusivo da banheira (que deve ter proteção DR) e conferir a energia e os cabos que chegam ao aquecedor ou à central.',
        'Se a energia chega e o painel continua apagado, o painel ou a central (placa) pode estar com defeito.',
      ],
      categoria: 'controladores',
      produtos: ['aquecedor-sanspray-line-clean-3-funcoes', 'aquecedor-sanspray-duo-digital-8000-w-220v'],
      peca: 'Se o técnico confirmar que o aquecedor ou a central queimou, a troca precisa ser do mesmo tipo (número de funções e potência).',
    },
    r_acionador: {
      tipo: 'resultado', tecnico: true, titulo: 'Provável problema no botão acionador ou na mangueirinha dele',
      causa: 'O botão da borda liga a hidro por ar, através de uma mangueira fina. Mangueira solta, furada ou botão com defeito impedem o acionamento.',
      fazer: [
        'Desligue o disjuntor da banheira antes de qualquer verificação.',
        'Se a banheira tiver tampa de inspeção, um técnico confere se a mangueira do botão está bem encaixada nas duas pontas e sem furos.',
        'Se a mangueira estiver boa, o problema pode ser o próprio botão, a central que ele aciona ou a motobomba.',
      ],
      peca: 'Botão acionador e mangueira são peças simples de trocar. Não estão no site: consulte a loja pelo WhatsApp.',
    },
    r_painel_sem_motor: {
      tipo: 'resultado', tecnico: true, titulo: 'A motobomba não está partindo',
      causa: 'A proteção da motobomba pode ter desligado (superaquecimento ou falta de água), ou a motobomba ou o comando dela está com defeito.',
      fazer: [
        'Veja se aparece algum código no painel (E1, E2, E3). Se aparecer, refaça o diagnóstico escolhendo "Aparece um código no painel".',
        'Confira se a banheira está bem cheia e espere o motor esfriar.',
        'Desligue o disjuntor da banheira por 1 minuto e religue uma vez. Não insista se não funcionar.',
        'Se continuar, chame um técnico para testar a motobomba ligada direto na rede e o comando.',
      ],
      categoria: 'motobombas',
      produtos: ['motobomba-syllent-1-2-cv', 'motobomba-lepono-lspa-1-2-cv', 'motobomba-komeco-aquajet-260-hidromassagem-e-spa'],
      peca: 'Se for preciso trocar a motobomba, a nova precisa ter a mesma potência (CV) e a mesma voltagem.',
    },
    r_zumbido: {
      tipo: 'resultado', tecnico: true, titulo: 'Capacitor da motobomba ou motor travado',
      causa: 'Zumbido sem girar costuma ser capacitor danificado ou eixo do motor travado por sujeira ou por ficar muito tempo parado.',
      alerta: 'Desligue logo o disjuntor: o motor zumbindo parado esquenta e pode queimar. Não tente religar várias vezes.',
      fazer: [
        'Desligue o disjuntor da banheira.',
        'Chame um técnico para testar o capacitor e destravar e limpar o motor.',
        'Se o motor estiver queimado ou o eixo não destravar, a solução é trocar a motobomba.',
      ],
      categoria: 'motobombas',
      produtos: ['motobomba-syllent-1-2-cv', 'motobomba-lepono-lspa-1-2-cv', 'motobomba-komeco-aquajet-260-hidromassagem-e-spa'],
      peca: 'O capacitor é uma peça barata: a loja ajuda a achar o modelo certo pela etiqueta do motor.',
    },
    r_liga_desliga: {
      tipo: 'resultado', tecnico: false, titulo: 'A motobomba está desligando por proteção',
      causa: 'O sensor da motobomba desliga o motor se ela fica sem água por alguns segundos (ar na bomba) ou se esquenta demais. Oscilação de tensão também causa isso.',
      fazer: [
        'Desligue a hidro e complete a água: ela precisa cobrir bem os jatos e a motobomba precisa estar cheia de água.',
        'Confira se há espaço livre (cerca de 30 cm) e ventilação atrás do motor.',
        'Rearme pelo disjuntor (desligue 1 minuto e religue) e teste uma vez.',
        'Se continuar ligando e desligando, chame um técnico para medir a tensão e checar a instalação.',
      ],
      categoria: 'motobombas',
    },

    /* ---------- CÓDIGOS DE ERRO (painel Sanspray Line Clean, manual p. 17) ---------- */
    cod: {
      tipo: 'pergunta', curto: 'Código', titulo: 'Qual código aparece no painel?',
      texto: 'Estes códigos são dos aquecedores Sanspray. Painéis de outras marcas usam códigos diferentes.',
      opcoes: [
        { texto: 'E1', detalhe: 'Pisca no visor', ir: 'r_e1' },
        { texto: 'E2', ir: 'r_e2' },
        { texto: 'E3', ir: 'r_e3' },
        { texto: 'E4', ir: 'r_e4' },
        { texto: 'Outro código ou outra marca', ir: 'r_outro_codigo' },
      ],
    },
    r_e1: {
      tipo: 'resultado', tecnico: false, titulo: 'E1: o sensor não está detectando água',
      causa: 'Falta água na banheira, ou o sensor de nível está solto, desregulado ou com cola demais.',
      fazer: [
        'Encha a banheira até cobrir os jatos mais altos (o sensor fica nessa altura).',
        'Confira se a luz vermelha do sensor acende com a água.',
        'Se a banheira está cheia e o E1 continua, o sensor precisa ser refixado ou regulado: peça a um técnico.',
      ],
      peca: 'Se o sensor de nível estiver com defeito, consulte a loja: ele não está no site.',
    },
    r_e2: {
      tipo: 'resultado', tecnico: true, titulo: 'E2: aquecimento sem água ou falha da motobomba',
      causa: 'O aquecimento foi ligado sem água suficiente, ou a motobomba falhou durante o aquecimento.',
      fazer: [
        'Encha a banheira até o nível correto e tente de novo.',
        'Se a banheira está cheia e o E2 continua, a motobomba precisa de reparo ou troca: chame um técnico para testá-la.',
      ],
      categoria: 'motobombas',
      produtos: ['motobomba-syllent-1-2-cv', 'motobomba-lepono-lspa-1-2-cv'],
      peca: 'Na troca, use uma motobomba com a mesma potência e voltagem, compatível com o aquecedor.',
    },
    r_e3: {
      tipo: 'resultado', tecnico: false, titulo: 'E3: água muito quente ou falha da motobomba',
      causa: 'A água entrou muito quente (aquecedor solar, a gás ou outra fonte), ou o disjuntor caiu no meio do aquecimento, ou a motobomba falhou.',
      fazer: [
        'Se a água está muito quente, esvazie um pouco e complete com água mais fria.',
        'Se a água já está em temperatura ambiente, mantenha o botão da hidro pressionado até o E3 sumir do painel.',
        'Se o E3 voltar com a água fria, chame um técnico: a motobomba pode estar com defeito.',
      ],
      categoria: 'motobombas',
    },
    r_e4: {
      tipo: 'resultado', tecnico: false, titulo: 'E4: água muito fria',
      causa: 'O sensor leu a água abaixo de 0 °C, o que só acontece em locais muito frios ou com o sensor com defeito.',
      fazer: [
        'Troque a água por água acima de 1 °C e ligue a motobomba para circular.',
        'Se o E4 aparecer com a água em temperatura normal, peça a um técnico para verificar o sensor de temperatura.',
      ],
    },
    r_outro_codigo: {
      tipo: 'resultado', tecnico: false, titulo: 'Vamos identificar pelo modelo do seu painel',
      causa: 'Cada fabricante usa códigos próprios. O significado depende do modelo do painel ou da central.',
      fazer: [
        'Anote o código exatamente como aparece no visor.',
        'Tire uma foto do painel e da etiqueta do aquecedor ou da central.',
        'Envie para um técnico da loja pelo WhatsApp: ele consulta o manual do seu modelo.',
      ],
      peca: 'Também dá para descobrir o modelo do painel pela foto.',
    },

    /* ---------- NÃO ESQUENTA (Sanspray p. 10, 13, 14, 16, 17) ---------- */
    aq_jatos: {
      tipo: 'pergunta', curto: 'Jatos', titulo: 'Os jatos (a motobomba) funcionam normalmente?',
      texto: 'O aquecedor só aquece com a motobomba ligada e a água circulando.',
      opcoes: [
        { texto: 'Sim, só a água não esquenta', ir: 'aq_temp' },
        { texto: 'Não, os jatos também não funcionam', ir: 'nl_agua' },
      ],
    },
    aq_temp: {
      tipo: 'pergunta', curto: 'Temperatura', titulo: 'Como está o aquecimento?',
      texto: 'No painel, aperte as teclas de temperatura para ver o valor programado (de 20 a 40 °C).',
      opcoes: [
        { texto: 'A temperatura programada está baixa ou não sei', ir: 'r_temp_prog' },
        { texto: 'Está programada alta e não esquenta nada', ir: 'r_termostato' },
        { texto: 'Esquenta, mas muito devagar', ir: 'r_lento' },
      ],
    },
    r_temp_prog: {
      tipo: 'resultado', tecnico: false, titulo: 'Ajuste a temperatura no painel',
      causa: 'O aquecedor desliga sozinho quando a água atinge a temperatura programada. Se ela estiver baixa, parece que não esquenta.',
      fazer: [
        'Aperte as teclas de temperatura e programe um valor acima da temperatura da água (entre 20 e 40 °C).',
        'O símbolo de termômetro do painel fica vermelho enquanto está aquecendo.',
        'Depois de alguns segundos, o visor volta a mostrar a temperatura atual da água.',
      ],
    },
    r_termostato: {
      tipo: 'resultado', tecnico: true, titulo: 'O termostato de segurança do aquecedor pode ter desarmado',
      causa: 'Ele desarma se a água superaquece ou se a circulação para de repente. Também pode ser o conector do painel solto ou a resistência queimada.',
      alerta: 'Faça o passo 1 antes de tocar no aquecedor. Não retire a capa de borracha do botão.',
      fazer: [
        'Desligue o disjuntor da banheira.',
        'Confirme que a água está abaixo de 40 °C.',
        'Aperte o botão do termostato de segurança, no alto do aquecedor (fica sob uma capa de borracha).',
        'Religue o disjuntor e programe a temperatura. Se continuar sem aquecer, chame um técnico para testar o conector do painel e a resistência.',
      ],
      categoria: 'aquecedores',
      produtos: ['aquecedor-sanspray-line-clean-3-funcoes', 'aquecedor-sanspray-line-clean-4-funcoes-8-000w-220v'],
      peca: 'Se a resistência queimou, o técnico avalia o conserto ou a troca do aquecedor.',
    },
    r_lento: {
      tipo: 'resultado', tecnico: true, titulo: 'Aquecimento lento: potência, tensão ou circulação',
      causa: 'O tempo de aquecimento depende do volume da banheira e da potência do aquecedor. Tensão abaixo da nominal e filtros no circuito do aquecedor também deixam o aquecimento mais lento.',
      fazer: [
        'Peça a um eletricista para medir a tensão que chega ao aquecedor (deve ser a da etiqueta: 127 ou 220 V).',
        'Não deve haver filtro ou outro acessório no circuito do aquecedor: um técnico confere a instalação.',
        'Se a banheira é grande para a potência do aquecedor, a solução é um modelo mais potente.',
      ],
      categoria: 'aquecedores',
      produtos: ['aquecedor-sanspray-line-clean-4-funcoes-8-000w-220v', 'aquecedor-sanspray-duo-digital-8000-w-220v'],
    },

    /* ---------- BARULHO / JATO FRACO (Komeco p. 8 e 11; Syllent GII p. 5-8, Super Syllent p. 6-8) ---------- */
    br_tipo: {
      tipo: 'pergunta', curto: 'Sintoma', titulo: 'Como é o problema?',
      opcoes: [
        { texto: 'Chiado de "chuveiro" ao ligar, que passa logo', ir: 'r_ar_normal' },
        { texto: 'Bolhas ou barulho contínuo, com jato fraco', ir: 'br_succao' },
        { texto: 'Ronco ou chiado metálico vindo do motor', ir: 'r_rolamento' },
        { texto: 'Vibra muito', ir: 'r_vibra' },
        { texto: 'Liga e desliga sozinha', ir: 'r_liga_desliga' },
      ],
    },
    br_succao: {
      tipo: 'pergunta', curto: 'Água e sucção', titulo: 'A água cobre bem os jatos e a grade de sucção está limpa?',
      texto: 'A sucção é a grade por onde a água sai da banheira para a motobomba. Cabelo e sujeira entopem.',
      opcoes: [
        { texto: 'Não, ou não conferi', ir: 'r_succao' },
        { texto: 'Sim, está tudo certo', ir: 'r_cavitacao' },
      ],
    },
    r_ar_normal: {
      tipo: 'resultado', tecnico: false, titulo: 'É ar saindo da tubulação: normal',
      causa: 'Nos primeiros instantes, o ar que ficou na tubulação faz um barulho parecido com o de chuveiro. Ele some quando a água circula.',
      fazer: [
        'Encha bem a banheira antes de ligar.',
        'Espere alguns segundos para o fluxo normalizar.',
        'Se o barulho não passar, refaça o diagnóstico escolhendo "Bolhas ou barulho contínuo".',
      ],
    },
    r_succao: {
      tipo: 'resultado', tecnico: false, titulo: 'Falta água na sucção',
      causa: 'Com pouca água ou sucção entupida, entra ar na motobomba: dá bolhas, barulho e jato fraco. A motobomba de hidro não puxa água sozinha.',
      fazer: [
        'Desligue a hidro.',
        'Encha a banheira até cobrir bem os jatos.',
        'Limpe a grade de sucção (cabelo e sujeira).',
        'Ligue de novo. Se continuar, refaça o diagnóstico respondendo "Sim, está tudo certo".',
      ],
    },
    r_cavitacao: {
      tipo: 'resultado', tecnico: true, titulo: 'Provável problema na instalação hidráulica',
      causa: 'Motobomba acima do nível da água, cano de sucção fino (menos de 40 mm), muitas curvas, jatos voltados para a sucção ou tensão baixa reduzem o fluxo e causam ruído (cavitação).',
      fazer: [
        'Um técnico deve conferir se a motobomba está na parte mais baixa e se o primeiro jato fica acima dela.',
        'Os canos devem ter pelo menos 40 mm, com poucas curvas e conexões.',
        'Peça também para medir a tensão no momento da partida.',
      ],
    },
    r_rolamento: {
      tipo: 'resultado', tecnico: true, titulo: 'Desgaste no rolamento do motor',
      causa: 'Ronco ou chiado metálico contínuo vindo do motor costuma ser rolamento gasto. Bolha de ar e sujeira na sucção também fazem barulho.',
      fazer: [
        'Primeiro, confira se a banheira está cheia e a sucção limpa.',
        'Se o ronco continuar, pare de usar e chame um técnico: o rolamento gasto pode travar o motor.',
        'O técnico avalia a troca do rolamento ou da motobomba.',
      ],
      categoria: 'motobombas',
      produtos: ['motobomba-syllent-1-2-cv', 'motobomba-lepono-lspa-1-2-cv', 'motobomba-komeco-aquajet-260-hidromassagem-e-spa'],
      peca: 'Para trocar a motobomba, a nova precisa ter a mesma potência (CV) e voltagem.',
    },
    r_vibra: {
      tipo: 'resultado', tecnico: true, titulo: 'Fixação da motobomba ou da tubulação',
      causa: 'Tubulação sem apoio força a motobomba e faz vibrar. A base da motobomba também precisa estar bem fixa.',
      fazer: [
        'Com o disjuntor desligado, um técnico confere a fixação da base da motobomba.',
        'Toda a tubulação deve ter apoio próprio, sem pesar sobre a motobomba.',
        'Se a vibração vier do motor mesmo com tudo fixo, pode ser rolamento.',
      ],
    },

    /* ---------- DISJUNTOR DESARMA (Sanspray p. 5, 6, 11, 17; Syllent GII p. 2 e 6; Komeco p. 9) ---------- */
    dr_quando: {
      tipo: 'pergunta', curto: 'Quando desarma', titulo: 'Quando o disjuntor desarma?',
      alerta: 'Disjuntor que desarma é proteção contra choque elétrico. Não insista em religar e não use a banheira até um eletricista avaliar.',
      opcoes: [
        { texto: 'Assim que o aquecimento liga', ir: 'r_dr_aquecedor' },
        { texto: 'Assim que a motobomba liga', ir: 'r_dr_motor' },
        { texto: 'Em dias de chuva ou depois de lavar o banheiro', ir: 'r_dr_umidade' },
        { texto: 'Sem motivo aparente', ir: 'r_dr_geral' },
      ],
    },
    r_dr_aquecedor: {
      tipo: 'resultado', tecnico: true, titulo: 'Disjuntor incompatível ou fuga no aquecedor',
      causa: 'O disjuntor pode ser pequeno para a potência do aquecedor, ou há umidade ou curto no aquecedor ou nos cabos.',
      fazer: [
        'Não use a banheira até a avaliação.',
        'Um eletricista deve conferir o disjuntor: para aquecedores de 8000 W em 220 V ou 4700 W em 127 V, o fabricante indica 63 A; para 5000 W em 220 V, 40 A.',
        'O circuito precisa ser exclusivo, com DR de 30 mA e aterramento.',
        'Se o aquecedor estiver com curto, o técnico avalia o conserto ou a troca.',
      ],
      categoria: 'aquecedores',
    },
    r_dr_motor: {
      tipo: 'resultado', tecnico: true, titulo: 'Fuga de corrente na motobomba',
      causa: 'Isolamento do motor danificado ou umidade na motobomba ou nas conexões dela fazem o DR desarmar na partida.',
      fazer: [
        'Não use a banheira até a avaliação.',
        'Um eletricista deve medir a isolação da motobomba e conferir o aterramento e o DR de 30 mA.',
        'Se o motor estiver com fuga, a motobomba precisa ser trocada.',
      ],
      categoria: 'motobombas',
      produtos: ['motobomba-syllent-1-2-cv', 'motobomba-lepono-lspa-1-2-cv', 'motobomba-komeco-aquajet-260-hidromassagem-e-spa'],
      peca: 'A motobomba nova precisa ter a mesma potência (CV) e voltagem da antiga.',
    },
    r_dr_umidade: {
      tipo: 'resultado', tecnico: true, titulo: 'Umidade chegando a alguma conexão elétrica',
      causa: 'Água ou umidade em caixas de ligação, tomadas, no botão acionador ou no compartimento da motobomba causam fuga de corrente.',
      fazer: [
        'Não use a banheira até a avaliação.',
        'Um eletricista deve procurar o ponto de umidade e vedar as conexões.',
        'O botão acionador deve ficar na borda, sem contato direto com a água nem embaixo do chuveiro.',
      ],
    },
    r_dr_geral: {
      tipo: 'resultado', tecnico: true, titulo: 'Avaliação elétrica necessária',
      causa: 'O DR desarma quando detecta fuga de corrente: pode ser a motobomba, o aquecedor, a fiação ou a umidade.',
      fazer: [
        'Não use a banheira até a avaliação.',
        'Anote quando o desarme acontece (ao ligar o quê, em que horário, se choveu): isso ajuda o eletricista.',
        'Um eletricista deve medir a isolação de cada equipamento e conferir o aterramento e o DR de 30 mA exclusivo da banheira.',
      ],
    },

    /* ---------- LUZ ---------- */
    luz_jatos: {
      tipo: 'pergunta', curto: 'Jatos', titulo: 'Os jatos funcionam normalmente?',
      opcoes: [
        { texto: 'Sim, só a luz não acende', ir: 'r_luz' },
        { texto: 'Não, nada funciona', ir: 'nl_agua' },
      ],
    },
    r_luz: {
      tipo: 'resultado', tecnico: true, titulo: 'Refletor de LED ou ligação da cromoterapia',
      causa: 'O refletor de LED pode ter queimado, a ligação dele ao comando pode estar solta, ou a saída de iluminação do comando falhou.',
      fazer: [
        'Confira no painel se a função de iluminação está ligada.',
        'Se a banheira tem mais de um refletor e só um apagou, o problema provavelmente é o próprio refletor.',
        'Para trocar o refletor ou conferir a ligação, chame um técnico (é uma parte elétrica dentro da banheira).',
      ],
      categoria: 'controladores',
      produtos: ['controlador-sinapse-spamax-4-home-8000w-220', 'aquecedor-sanspray-line-clean-4-funcoes-8-000w-220v'],
      peca: 'Refletores de LED não estão no site: consulte a loja pelo WhatsApp.',
    },
  },
};
