// Tipos de página da campanha (o "banco de dados" do Grimório)
G.ATITUDES = ['Aliado', 'Amigável', 'Neutro', 'Desconfiado', 'Hostil'];

G.TIPOS = {
  sessao: {
    nome: 'Sessão', plural: 'Sessões', icone: '📜', cor: 'ouro',
    campos: [
      { id: 'numero', nome: 'Nº', tipo: 'numero' },
      { id: 'data', nome: 'Data', tipo: 'data' },
      { id: 'status', nome: 'Status', tipo: 'selecao', opcoes: ['Planejada', 'Jogada', 'Cancelada'] }
    ],
    modelo: '## Resumo\n\n\n## Início forte\n\n\n## Cenas\n- \n\n## Segredos e pistas\n- [ ] \n- [ ] \n- [ ] \n\n## NPCs\n- \n\n## Locais\n- \n\n## Encontros\n\n\n## Tesouro\n- \n\n## Diário da mesa\n',
    subtitulo: (e) => [e.campos.numero ? `Sessão ${e.campos.numero}` : '', e.campos.data ? G.dataCurta(e.campos.data + 'T12:00') : '', e.campos.status].filter(Boolean).join(' · ')
  },
  missao: {
    nome: 'Missão', plural: 'Missões', icone: '⚔️', cor: 'lacre',
    campos: [
      { id: 'status', nome: 'Status', tipo: 'selecao', opcoes: ['Disponível', 'Ativa', 'Concluída', 'Falhou', 'Abandonada'] },
      { id: 'nivel', nome: 'Nível', tipo: 'texto', dica: 'ex.: 1–3' },
      { id: 'contratante', nome: 'Contratante', tipo: 'ref', alvo: 'npc' },
      { id: 'local', nome: 'Local', tipo: 'ref', alvo: 'local' },
      { id: 'recompensa', nome: 'Recompensa', tipo: 'texto' }
    ],
    modelo: '## Gancho\n\n\n## Objetivo\n\n\n## Complicações\n- \n\n## Encontros\n\n\n## Recompensa\n- \n',
    subtitulo: (e) => [e.campos.status, e.campos.nivel ? 'Nível ' + e.campos.nivel : ''].filter(Boolean).join(' · ')
  },
  npc: {
    nome: 'NPC', plural: 'NPCs', icone: '🎭', cor: 'musgo',
    campos: [
      { id: 'raca', nome: 'Raça', tipo: 'texto' },
      { id: 'ocupacao', nome: 'Ocupação', tipo: 'texto' },
      { id: 'local', nome: 'Onde vive', tipo: 'ref', alvo: 'local' },
      { id: 'faccao', nome: 'Facção', tipo: 'ref', alvo: 'faccao' },
      { id: 'atitude', nome: 'Atitude', tipo: 'selecao', opcoes: G.ATITUDES },
      { id: 'estado', nome: 'Estado', tipo: 'selecao', opcoes: ['Vivo', 'Morto', 'Desaparecido', 'Desconhecido'] }
    ],
    modelo: '## Aparência\n\n\n## Personalidade\n\n\n## Objetivos\n\n\n## Segredos\n- [ ] \n\n## Falas marcantes\n> \n',
    subtitulo: (e) => [e.campos.raca, e.campos.ocupacao].filter(Boolean).join(' · ')
  },
  faccao: {
    nome: 'Facção', plural: 'Facções', icone: '🛡️', cor: 'arcano',
    campos: [
      { id: 'tipoFaccao', nome: 'Tipo', tipo: 'texto', dica: 'guilda, culto, ordem…' },
      { id: 'lider', nome: 'Líder', tipo: 'ref', alvo: 'npc' },
      { id: 'sede', nome: 'Sede', tipo: 'ref', alvo: 'local' },
      { id: 'atitude', nome: 'Atitude com o grupo', tipo: 'selecao', opcoes: G.ATITUDES }
    ],
    modelo: '## Objetivos\n\n\n## Recursos\n\n\n## Segredos\n- [ ] \n',
    subtitulo: (e) => e.campos.tipoFaccao || ''
  },
  local: {
    nome: 'Local', plural: 'Locais', icone: '🏰', cor: 'terra',
    campos: [
      { id: 'tipoLocal', nome: 'Tipo', tipo: 'selecao', opcoes: ['Cidade', 'Vila', 'Região', 'Reino', 'Masmorra', 'Construção', 'Taverna', 'Templo', 'Ermo', 'Plano', 'Mapa'] },
      { id: 'regiao', nome: 'Fica em', tipo: 'ref', alvo: 'local' },
      { id: 'populacao', nome: 'População', tipo: 'texto' }
    ],
    modelo: '## Descrição\n\n\n## Pontos de interesse\n- \n\n## NPCs importantes\n- \n\n## Rumores\n- \n',
    subtitulo: (e) => [e.campos.tipoLocal, e.campos.populacao].filter(Boolean).join(' · ')
  },
  item: {
    nome: 'Item', plural: 'Itens', icone: '💎', cor: 'ouro',
    campos: [
      { id: 'raridade', nome: 'Raridade', tipo: 'selecao', opcoes: ['Comum', 'Incomum', 'Raro', 'Muito raro', 'Lendário', 'Artefato'] },
      { id: 'valor', nome: 'Valor', tipo: 'texto', dica: 'ex.: 250 PO' },
      { id: 'portador', nome: 'Com quem está', tipo: 'texto' }
    ],
    modelo: '## Descrição\n\n\n## Propriedades\n- \n\n## História\n\n',
    subtitulo: (e) => [e.campos.raridade, e.campos.valor].filter(Boolean).join(' · ')
  },
  jogador: {
    nome: 'Personagem', plural: 'Personagens (PJs)', icone: '🧙', cor: 'arcano',
    campos: [
      { id: 'jogador', nome: 'Jogador', tipo: 'texto' },
      { id: 'classe', nome: 'Classe', tipo: 'texto' },
      { id: 'raca', nome: 'Raça', tipo: 'texto' },
      { id: 'nivel', nome: 'Nível', tipo: 'numero' },
      { id: 'pvMax', nome: 'PV máx.', tipo: 'numero' },
      { id: 'ca', nome: 'CA', tipo: 'numero' },
      { id: 'iniciativa', nome: 'Mod. Iniciativa', tipo: 'numero' },
      { id: 'percepcao', nome: 'Percepção', tipo: 'numero' },
      { id: 'idiomas', nome: 'Idiomas', tipo: 'texto' },
      { id: 'link', nome: 'Ficha', tipo: 'url' }
    ],
    modelo: '## Histórico\n\n\n## Ganchos pessoais\n- \n\n## Anotações do mestre\n\n',
    subtitulo: (e) => [e.campos.jogador ? 'Jogador: ' + e.campos.jogador : '', e.campos.classe, e.campos.nivel ? 'nv ' + e.campos.nivel : ''].filter(Boolean).join(' · ')
  },
  criatura: {
    nome: 'Criatura', plural: 'Criaturas da campanha', icone: '🐉', cor: 'lacre',
    campos: [
      { id: 'nd', nome: 'ND', tipo: 'texto' },
      { id: 'ca', nome: 'CA', tipo: 'numero' },
      { id: 'pv', nome: 'PV', tipo: 'numero' },
      { id: 'iniciativa', nome: 'Iniciativa', tipo: 'numero' },
      { id: 'percepcao', nome: 'Percepção', tipo: 'numero' },
      { id: 'tipoCriatura', nome: 'Tipo', tipo: 'texto', dica: 'humanoide, morto-vivo…' },
      { id: 'terreno', nome: 'Terreno', tipo: 'texto' }
    ],
    modelo: '## Bloco de estatísticas\n\n\n## Táticas\n\n\n## Tesouro\n- \n',
    subtitulo: (e) => [e.campos.nd ? 'ND ' + e.campos.nd : '', e.campos.tipoCriatura].filter(Boolean).join(' · ')
  },
  nota: {
    nome: 'Nota', plural: 'Notas e lore', icone: '📖', cor: 'tinta',
    campos: [],
    modelo: '',
    subtitulo: (e) => (e.tags || []).join(', ')
  }
};

G.ORDEM_TIPOS = ['sessao', 'missao', 'npc', 'faccao', 'local', 'item', 'jogador', 'criatura', 'nota'];
