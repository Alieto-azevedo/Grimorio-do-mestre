// Tipos de página da Biblioteca
G.ATITUDES = ['Aliado', 'Amigável', 'Neutro', 'Desconfiado', 'Hostil'];

G.TIPOS = {
  sessao: {
    nome: 'Sessão', plural: 'Sessões', icone: '📜', cor: 'ouro',
    campos: [
      { id: 'numero', nome: 'Nº', tipo: 'numero' },
      { id: 'data', nome: 'Data', tipo: 'data' },
      { id: 'status', nome: 'Status', tipo: 'selecao', opcoes: ['Planejada', 'Jogada', 'Cancelada'] }
    ],
    modelo: '## Resumo\n\n\n## Início forte\n\n\n## Cenas\n- \n\n## Segredos e pistas\n- [ ] \n- [ ] \n- [ ] \n\n## NPCs\n- \n\n## Encontros\n- \n\n## Tesouro\n- \n\n## Diário da mesa\n',
    sub: (e) => [e.campos.data ? G.dataCurta(e.campos.data) : '', e.campos.status].filter(Boolean).join(' · ')
  },
  missao: {
    nome: 'Missão', plural: 'Missões', icone: '⚔️', cor: 'lacre',
    campos: [
      { id: 'status', nome: 'Status', tipo: 'selecao', opcoes: ['Disponível', 'Ativa', 'Concluída', 'Falhou'] },
      { id: 'nivel', nome: 'Nível', tipo: 'texto', dica: 'ex.: 1–3' },
      { id: 'contratante', nome: 'Contratante', tipo: 'ref', alvo: 'npc' },
      { id: 'local', nome: 'Local', tipo: 'ref', alvo: 'local' },
      { id: 'recompensa', nome: 'Recompensa', tipo: 'texto' }
    ],
    modelo: '## Gancho\n\n\n## Objetivo\n\n\n## Complicações\n- \n\n## Encontros\n- \n\n## Recompensa\n- \n',
    sub: (e) => [e.campos.status, e.campos.nivel ? 'nível ' + e.campos.nivel : ''].filter(Boolean).join(' · ')
  },
  npc: {
    nome: 'NPC', plural: 'NPCs', icone: '🎭', cor: 'musgo', ficha: true,
    campos: [
      { id: 'raca', nome: 'Raça', tipo: 'texto' },
      { id: 'ocupacao', nome: 'Ocupação', tipo: 'texto' },
      { id: 'local', nome: 'Onde vive', tipo: 'ref', alvo: 'local' },
      { id: 'faccao', nome: 'Facção', tipo: 'ref', alvo: 'faccao' },
      { id: 'atitude', nome: 'Atitude', tipo: 'selecao', opcoes: G.ATITUDES },
      { id: 'estado', nome: 'Estado', tipo: 'selecao', opcoes: ['Vivo', 'Morto', 'Desaparecido'] }
    ],
    modelo: '## Aparência\n\n\n## Personalidade\n\n\n## Objetivos\n\n\n## Segredos\n- [ ] \n\n## Falas\n> \n',
    sub: (e) => [e.campos.raca, e.campos.ocupacao].filter(Boolean).join(' · ')
  },
  criatura: {
    nome: 'Criatura', plural: 'Bestiário', icone: '🐉', cor: 'lacre', ficha: true,
    campos: [
      { id: 'tipoCriatura', nome: 'Tipo', tipo: 'texto', dica: 'humanoide, morto-vivo…' },
      { id: 'terreno', nome: 'Terreno', tipo: 'texto' }
    ],
    modelo: '## Táticas\n\n\n## Tesouro\n- \n',
    sub: (e) => [e.ficha && e.ficha.nd ? 'ND ' + e.ficha.nd : '', e.campos.tipoCriatura].filter(Boolean).join(' · ')
  },
  local: {
    nome: 'Local', plural: 'Locais', icone: '🏰', cor: 'terra',
    campos: [
      { id: 'tipoLocal', nome: 'Tipo', tipo: 'selecao', opcoes: ['Cidade', 'Vila', 'Região', 'Reino', 'Masmorra', 'Construção', 'Taverna', 'Templo', 'Ermo', 'Mapa'] },
      { id: 'regiao', nome: 'Fica em', tipo: 'ref', alvo: 'local' },
      { id: 'populacao', nome: 'População', tipo: 'texto' }
    ],
    modelo: '## Descrição\n\n\n## Pontos de interesse\n- \n\n## NPCs\n- \n\n## Rumores\n- \n',
    sub: (e) => [e.campos.tipoLocal, e.campos.populacao].filter(Boolean).join(' · ')
  },
  faccao: {
    nome: 'Facção', plural: 'Facções', icone: '🛡️', cor: 'arcano',
    campos: [
      { id: 'tipoFaccao', nome: 'Tipo', tipo: 'texto', dica: 'guilda, culto, ordem…' },
      { id: 'lider', nome: 'Líder', tipo: 'ref', alvo: 'npc' },
      { id: 'sede', nome: 'Sede', tipo: 'ref', alvo: 'local' },
      { id: 'atitude', nome: 'Atitude', tipo: 'selecao', opcoes: G.ATITUDES }
    ],
    modelo: '## Objetivos\n\n\n## Recursos\n\n\n## Segredos\n- [ ] \n',
    sub: (e) => e.campos.tipoFaccao || ''
  },
  item: {
    nome: 'Item', plural: 'Itens', icone: '💎', cor: 'ouro',
    campos: [
      { id: 'raridade', nome: 'Raridade', tipo: 'selecao', opcoes: ['Comum', 'Incomum', 'Raro', 'Muito raro', 'Lendário', 'Artefato'] },
      { id: 'valor', nome: 'Valor', tipo: 'texto', dica: 'ex.: 250 PO' },
      { id: 'portador', nome: 'Com quem está', tipo: 'texto' }
    ],
    modelo: '## Descrição\n\n\n## Propriedades\n- \n',
    sub: (e) => [e.campos.raridade, e.campos.valor].filter(Boolean).join(' · ')
  },
  jogador: {
    nome: 'Personagem', plural: 'Grupo (PJs)', icone: '🧙', cor: 'arcano', ficha: true,
    campos: [
      { id: 'jogador', nome: 'Jogador', tipo: 'texto' },
      { id: 'classe', nome: 'Classe', tipo: 'texto' },
      { id: 'raca', nome: 'Raça', tipo: 'texto' },
      { id: 'nivel', nome: 'Nível', tipo: 'numero' },
      { id: 'link', nome: 'Ficha online', tipo: 'url' }
    ],
    modelo: '## Histórico\n\n\n## Ganchos pessoais\n- \n',
    sub: (e) => [e.campos.jogador, e.campos.classe, e.campos.nivel ? 'nv ' + e.campos.nivel : ''].filter(Boolean).join(' · ')
  },
  nota: {
    nome: 'Nota', plural: 'Lore e notas', icone: '📖', cor: 'tinta',
    campos: [],
    modelo: '',
    sub: (e) => (e.tags || []).join(', ')
  }
};

G.ORDEM_TIPOS = ['sessao', 'missao', 'npc', 'criatura', 'local', 'faccao', 'item', 'jogador', 'nota'];

G.XP_POR_ND = { '1/8': 50, '1/6': 65, '1/4': 100, '1/3': 135, '1/2': 200, 1: 400, 2: 600, 3: 800, 4: 1200, 5: 1600, 6: 2400, 7: 3200, 8: 4800, 9: 6400, 10: 9600, 11: 12800, 12: 19200, 13: 25600, 14: 38400, 15: 51200, 16: 76800, 17: 102400, 18: 153600, 19: 204800, 20: 307200 };
G.ndNumero = (nd) => { const s = String(nd || '').trim(); if (s.includes('/')) { const [a, b] = s.split('/'); return a / b; } return parseFloat(s.replace(',', '.')) || 0; };
