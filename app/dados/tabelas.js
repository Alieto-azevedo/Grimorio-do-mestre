// Tabelas para os geradores de improviso
G.TABELAS = {
  nomes: {
    Humano: {
      m: ['Aldric', 'Bertram', 'Cedric', 'Dorian', 'Edmund', 'Falk', 'Gareth', 'Halvard', 'Ivo', 'Joran', 'Kael', 'Leoric', 'Matthias', 'Niklas', 'Osric', 'Piers', 'Roderick', 'Silas', 'Tobias', 'Ulric', 'Valen', 'Wendel'],
      f: ['Adela', 'Brienne', 'Celeste', 'Dália', 'Elise', 'Freya', 'Gisela', 'Helena', 'Isolde', 'Jessa', 'Katrina', 'Liesel', 'Marta', 'Nadia', 'Odette', 'Petra', 'Rosalind', 'Selene', 'Tamsin', 'Ursula', 'Vera', 'Wilma'],
      sobrenomes: ['Ashford', 'Blackwood', 'Corvo-Alto', 'Dunmore', 'Ferro-Velho', 'Grimsby', 'Holt', 'Kessler', 'Lorne', 'Marlow', 'Pedra-Branca', 'Ravensworth', 'Thorne', 'Valmont', 'Whitlock']
    },
    Elfo: {
      m: ['Aelar', 'Caelynn', 'Erevan', 'Galinndan', 'Heian', 'Ivellios', 'Laucian', 'Mindartis', 'Naeris', 'Peren', 'Quarion', 'Riardon', 'Soveliss', 'Thamior', 'Varis'],
      f: ['Adrie', 'Birel', 'Drusilia', 'Enna', 'Felosial', 'Ielenia', 'Keyleth', 'Leshanna', 'Lia', 'Meriele', 'Naivara', 'Quelenna', 'Sariel', 'Shanairra', 'Valanthe'],
      sobrenomes: ['Amakiir', 'Galanodel', 'Holimion', 'Liadon', 'Meliamne', 'Nailo', 'Siannodel', 'Xiloscient', 'Folha-de-Prata', 'Brisa-Lunar']
    },
    'Anão': {
      m: ['Adrik', 'Baern', 'Brottor', 'Dain', 'Eberk', 'Fargrim', 'Gardain', 'Harbek', 'Kildrak', 'Morgran', 'Orsik', 'Rurik', 'Taklinn', 'Thord', 'Vondal'],
      f: ['Amber', 'Bardryn', 'Dagnal', 'Eldeth', 'Finellen', 'Gunnloda', 'Helja', 'Hlin', 'Kathra', 'Mardred', 'Riswynn', 'Sannl', 'Torbera', 'Vistra', 'Helga'],
      sobrenomes: ['Barba-de-Ferro', 'Martelo-Rubro', 'Jewelbraid', 'Punho-de-Pedra', 'Forjafunda', 'Escudo-Negro', 'Rocha-Alta', 'Malho-Antigo']
    },
    Halfling: {
      m: ['Alton', 'Cade', 'Eldon', 'Garret', 'Lyle', 'Milo', 'Osborn', 'Perrin', 'Reed', 'Roscoe', 'Wellby'],
      f: ['Andry', 'Bree', 'Callie', 'Cora', 'Euphemia', 'Jillian', 'Kithri', 'Lavinia', 'Merla', 'Nedda', 'Seraphina'],
      sobrenomes: ['Pé-Leve', 'Bom-Barril', 'Folhaverde', 'Colina-Mansa', 'Fundo-de-Panela', 'Tealeaf', 'Underbough']
    },
    Gnomo: {
      m: ['Alston', 'Boddynock', 'Dimble', 'Fonkin', 'Gimble', 'Glim', 'Melvin', 'Orryn', 'Roondar', 'Warryn', 'Zook'],
      f: ['Bimpnottin', 'Carlin', 'Ellyjobell', 'Lilli', 'Loopmottin', 'Nissa', 'Orla', 'Roywyn', 'Tana', 'Zanna'],
      sobrenomes: ['Engrenagem', 'Tristocarpo', 'Fagulha', 'Murnig', 'Nackle', 'Timbers', 'Turen', 'Bolso-Fundo']
    },
    'Meio-orc': {
      m: ['Dench', 'Feng', 'Gell', 'Henk', 'Holg', 'Imsh', 'Keth', 'Krusk', 'Mhurren', 'Ront', 'Shump', 'Thokk'],
      f: ['Baggi', 'Emen', 'Engong', 'Grakka', 'Kansif', 'Myev', 'Neega', 'Ovak', 'Ownka', 'Shautha', 'Vola', 'Volen'],
      sobrenomes: ['Olho-Só', 'Dente-Partido', 'Mão-de-Pedra', 'Sem-Clã', 'Quebra-Crânio']
    },
    Drow: {
      m: ['Alton', 'Belgos', 'Driz', 'Ilphrin', 'Jarlaxle', 'Kelnozz', 'Nalfein', 'Pharaun', 'Ryld', 'Valas', 'Zaknafein'],
      f: ['Akordia', 'Chalithra', 'Eclavdra', 'Ilvara', 'Malice', 'Naestra', 'Quenthel', 'Sabal', 'Triel', 'Veylana', 'Vierna'],
      sobrenomes: ["T'sarran", 'Thonneldris', "Do'Urden", 'Baenre', 'Mizzrym', 'Xorlarrin', 'Despana']
    }
  },
  ocupacoes: ['taverneiro', 'ferreiro', 'guarda', 'sacerdote', 'mercador ambulante', 'ladrão', 'caçador', 'escriba', 'curandeira', 'pescador', 'bardo', 'mercenário', 'contrabandista', 'nobre falido', 'alquimista', 'estalajadeiro', 'coveiro', 'cartógrafo', 'acólito', 'mendigo informante', 'cavalariço', 'agiota', 'vidente', 'carpinteiro', 'soldado aposentado'],
  aparencias: ['cicatriz atravessando o rosto', 'olhos de cores diferentes', 'tatuagem de serpente no pescoço', 'cabelo raspado de um lado', 'dentes de ouro', 'mãos sempre sujas de tinta', 'manca de uma perna', 'roupas finas porém remendadas', 'barba trançada com contas', 'voz rouca e baixa', 'sardas e sorriso fácil', 'unhas pintadas de preto', 'usa um tapa-olho', 'cheira a ervas', 'muito alto e curvado', 'sempre de capuz', 'anéis em todos os dedos'],
  personalidades: ['desconfiado de forasteiros', 'fala demais quando bebe', 'extremamente educado', 'ri de tudo, mesmo do perigo', 'ganancioso, mas honesto', 'melancólico e saudosista', 'impaciente e direto', 'curioso sobre magia', 'devoto fervoroso de Luminna', 'covarde, mas leal', 'sarcástico', 'orgulhoso do próprio trabalho', 'supersticioso', 'gentil com crianças e animais', 'mente por hábito', 'competitivo'],
  motivacoes: ['pagar uma dívida antiga', 'proteger a família', 'vingar um irmão morto', 'ficar rico rápido', 'ser reconhecido pela guilda', 'fugir do passado', 'encontrar um amor perdido', 'provar que não é um fracasso', 'servir à igreja', 'descobrir a verdade sobre os pais', 'manter o negócio funcionando', 'conseguir um título de nobreza'],
  segredos: ['é informante da Guilda das Sombras', 'deve dinheiro a quem não devia', 'tem sangue drow escondido', 'roubou algo de um templo', 'já foi aventureiro e abandonou o grupo para morrer', 'sabe de uma passagem secreta sob a cidade', 'é procurado em outra cidade', 'adora secretamente um deus proibido', 'tem um filho ilegítimo nobre', 'falsifica documentos', 'está sendo chantageado', 'viu algo que não deveria na catedral'],
  falas: ['"Se quiser informação, primeiro pague a bebida."', '"Não é da minha conta… mas vou contar mesmo assim."', '"Pela luz de Luminna, de novo não."', '"Já vi gente mais forte que você sair daqui carregada."', '"Tudo tem um preço, meu caro."', '"Ah… as estradas são longas e a sorte nunca dura…"', '"Eu não vi nada. Ninguém viu nada."', '"Vocês têm cara de quem procura encrenca."'],
  tavernaA: ['O Pônei', 'O Javali', 'A Caneca', 'O Dragão', 'A Sereia', 'O Corvo', 'O Machado', 'A Lanterna', 'O Barril', 'O Grifo', 'A Coroa', 'O Cálice', 'O Bardo', 'A Raposa', 'O Leitão'],
  tavernaB: ['Pesaroso', 'Bêbado', 'Dourado', 'Caolho', 'Risonho', 'Afogado', 'de Ferro', 'Adormecido', 'Faminto', 'Perdido', 'Rubro', 'Furtivo', 'Desdentado', 'Sortudo', 'Partido'],
  pratos: ['Ensopado de javali com cerveja preta', 'Torta de rins e cogumelos', 'Peixe do rio assado na brasa', 'Pão escuro com queijo de cabra e mel', 'Costela de cervo com batatas', 'Sopa de cebola gratinada', 'Linguiça apimentada com repolho', 'Galinha recheada com castanhas', 'Mingau de aveia com frutas secas', 'Guisado misterioso do dia (não pergunte)'],
  clima: ['Céu limpo, sol forte', 'Nublado e abafado', 'Garoa fina e constante', 'Chuva forte com trovoadas', 'Névoa densa até o meio-dia', 'Vento cortante do norte', 'Calor seco, poeira no ar', 'Frio intenso, geada pela manhã', 'Neve leve', 'Tempestade se formando no horizonte', 'Noite de lua cheia e céu estrelado', 'Chuva de granizo breve'],
  rumores: ['Dizem que há luzes estranhas na torre abandonada à noite.', 'Um mercador sumiu na estrada do pântano — só acharam a carroça.', 'A igreja está recrutando aventureiros em segredo.', 'Alguém anda comprando todo o enxofre da cidade.', 'Viram um kobold usando uma coroa perto das minas.', 'O capitão da guarda recebeu uma carta da capital e ficou pálido.', 'O taverneiro esconde algo no porão.', 'Uma criança jura ter visto uma mulher-aranha no bosque.', 'Os esgotos estão cheios de ratos do tamanho de cães.', 'Um nobre oferece ouro por notícias do filho desaparecido.', 'Há um mapa de tesouro sendo leiloado no Mercado Noturno.', 'Os sinos do templo tocaram sozinhos ontem à meia-noite.'],
  complicacoes: ['Um rival chega antes do grupo.', 'O contratante mentiu sobre a recompensa.', 'Uma tempestade bloqueia o caminho.', 'Um inocente é feito refém.', 'A guarda local acusa o grupo de um crime.', 'O alvo pede ajuda em vez de lutar.', 'Uma terceira facção entra na disputa.', 'O equipamento de alguém quebra no pior momento.', 'Um aliado é revelado como traidor.', 'O mapa estava errado — o lugar é outro.'],
  ganchos: ['Uma carta selada chega endereçada a um dos PJs, de alguém que deveria estar morto.', 'Uma caravana pede escolta por uma rota infestada de bandidos.', 'O templo precisa de alguém para recuperar uma relíquia roubada.', 'Uma vila próxima parou de mandar notícias há uma semana.', 'Um alquimista paga bem por ingredientes raros do pântano.', 'Um nobre quer que alguém vigie a própria esposa — discretamente.', 'Uma criatura ferida aparece pedindo ajuda na língua comum.', 'A Corporação K.A.F.R.A. abre missões de Rank Bronze com prazo curto.'],
  bugigangas: ['um dado de osso com 7 faces', 'uma chave sem fechadura conhecida', 'um medalhão com retrato riscado', 'uma pena que nunca se molha', 'um mapa rasgado ao meio', 'um frasco com um olho flutuando', 'uma moeda de um reino que não existe', 'um diário com páginas em branco que esquentam', 'um sino que não faz som', 'uma pedra que aponta para o norte', 'um anel de casamento gravado "para sempre, Z."', 'uma estatueta de sapo de jade']
};
