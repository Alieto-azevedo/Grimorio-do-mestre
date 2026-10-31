// Bestiário de referência (Pathfinder 1e, conteúdo OGL resumido). Valores para uso rápido em mesa — confira o livro para detalhes.
G.XP_POR_ND = { '1/8': 50, '1/6': 65, '1/4': 100, '1/3': 135, '1/2': 200, 1: 400, 2: 600, 3: 800, 4: 1200, 5: 1600, 6: 2400, 7: 3200, 8: 4800, 9: 6400, 10: 9600, 11: 12800, 12: 19200, 13: 25600, 14: 38400, 15: 51200, 16: 76800, 17: 102400, 18: 153600, 19: 204800, 20: 307200 };
G.TERRENOS = { masmorra: 'Masmorra', subterraneo: 'Subterrâneo', floresta: 'Floresta', pantano: 'Pântano', colinas: 'Colinas', montanha: 'Montanha', planicie: 'Planície', urbano: 'Urbano', deserto: 'Deserto', aquatico: 'Aquático' };

G.BESTIARIO = [
  // nome, original, nd, tipo, tamanho, terrenos, ca, pv, dv, ini, percepcao, fort, ref, von, desloc, ataques, especial
  ['Goblin', 'Goblin', '1/3', 'Humanoide (goblinoide)', 'P', ['floresta', 'colinas', 'masmorra'], 16, 6, '1d10+1', 6, -1, 3, 2, -1, '9 m', 'Espada curta +2 (1d4/19–20); arco curto +4 (1d4/×3)', 'Visão no escuro 18 m'],
  ['Kobold', 'Kobold', '1/4', 'Humanoide (reptiliano)', 'P', ['masmorra', 'subterraneo', 'montanha'], 15, 5, '1d10', 1, 5, 2, 1, -1, '9 m', 'Lança +1 (1d6–1/×3); funda +3 (1d3–1)', 'Visão no escuro; sensibilidade à luz; armadilhas'],
  ['Orc', 'Orc', '1/3', 'Humanoide (orc)', 'M', ['colinas', 'montanha', 'planicie'], 13, 6, '1d10+1', 0, -1, 3, 0, -1, '9 m', 'Falchion +5 (2d4+4/18–20); azagaia +1 (1d6+3)', 'Ferocidade; sensibilidade à luz'],
  ['Hobgoblin', 'Hobgoblin', '1/2', 'Humanoide (goblinoide)', 'M', ['colinas', 'floresta', 'planicie'], 16, 17, '2d10+6', 2, 2, 5, 2, 1, '9 m', 'Espada longa +4 (1d8+1/19–20); arco longo +4 (1d8/×3)', 'Visão no escuro; disciplinados'],
  ['Gnoll', 'Gnoll', '1', 'Humanoide (gnoll)', 'M', ['planicie', 'colinas', 'deserto'], 15, 11, '2d8+2', 0, 2, 4, 0, 0, '9 m', 'Machado de batalha +3 (1d8+2/×3); arco longo +1 (1d8/×3)', 'Visão no escuro'],
  ['Bugbear', 'Bugbear', '2', 'Humanoide (goblinoide)', 'M', ['floresta', 'montanha', 'masmorra'], 17, 16, '3d8+3', 1, 8, 2, 4, 1, '9 m', 'Maça-estrela +5 (1d8+3); azagaia +3 (1d6+2)', 'Visão no escuro; furtivo (+4 Furtividade)'],
  ['Esqueleto', 'Skeleton (human)', '1/3', 'Morto-vivo', 'M', ['masmorra'], 16, 4, '1d8', 6, 0, 0, 2, 2, '9 m', 'Cimitarra quebrada +0 (1d6); 2 garras –3 (1d4+1)', 'RD 5/concussão; imune a frio e efeitos mentais'],
  ['Esqueleto arqueiro', 'Skeleton archer', '1/3', 'Morto-vivo', 'M', ['masmorra'], 16, 4, '1d8', 6, 0, 0, 2, 2, '9 m', 'Arco curto +2 (1d6/×3); garras +0 (1d4)', 'RD 5/concussão; imune a frio'],
  ['Zumbi humano', 'Zombie (human)', '1/2', 'Morto-vivo', 'M', ['masmorra', 'pantano', 'urbano'], 12, 12, '2d8+3', 0, 0, 0, 0, 3, '9 m', 'Pancada +4 (1d6+4)', 'RD 5/cortante; ações escalonadas (só uma ação por turno)'],
  ['Carniçal', 'Ghoul', '1', 'Morto-vivo', 'M', ['masmorra', 'urbano', 'pantano'], 14, 13, '2d8+4', 2, 7, 2, 2, 5, '9 m', 'Mordida +3 (1d6+1 + doença e paralisia); 2 garras +3 (1d6+1 + paralisia)', 'Paralisia 1d4+1 rodadas (Fort CD 13; elfos imunes); febre do carniçal'],
  ['Lobo', 'Wolf', '1', 'Animal', 'M', ['floresta', 'planicie', 'colinas'], 14, 13, '2d8+4', 2, 8, 5, 5, 1, '15 m', 'Mordida +2 (1d6+1 + derrubar)', 'Faro; visão na penumbra'],
  ['Lobo atroz', 'Dire wolf', '3', 'Animal', 'G', ['floresta', 'montanha', 'colinas'], 14, 37, '5d8+15', 2, 10, 7, 6, 2, '15 m', 'Mordida +7 (1d8+6 + derrubar)', 'Faro; visão na penumbra'],
  ['Rato atroz', 'Dire rat', '1/3', 'Animal', 'P', ['masmorra', 'urbano'], 14, 5, '1d8+1', 3, 4, 3, 5, 1, '12 m, escalar 6 m, nadar 6 m', 'Mordida +1 (1d4 + doença)', 'Febre do esgoto (Fort CD 11)'],
  ['Enxame de ratos', 'Rat swarm', '2', 'Animal (enxame)', 'Mi', ['masmorra', 'urbano'], 14, 16, '3d8+3', 6, 8, 4, 6, 2, '4,5 m', 'Enxame (1d6 + doença)', 'Distração (Fort CD 12); imune a armas; faro'],
  ['Aranha gigante', 'Giant spider', '1', 'Verme', 'M', ['floresta', 'masmorra', 'subterraneo'], 14, 16, '3d8+3', 3, 4, 4, 4, 1, '9 m, escalar 9 m', 'Mordida +2 (1d6 + veneno)', 'Teia (+5 toque, CD 12); veneno For 1d2 (Fort CD 14); sentido sísmico'],
  ['Centopeia gigante', 'Giant centipede', '1/2', 'Verme', 'M', ['masmorra', 'subterraneo', 'floresta'], 14, 5, '1d8+1', 2, 4, 3, 2, 0, '12 m, escalar 12 m', 'Mordida +2 (1d6–1 + veneno)', 'Veneno Des 1d3 (Fort CD 13)'],
  ['Estirge', 'Stirge', '1/2', 'Besta mágica', 'Mi', ['pantano', 'floresta', 'masmorra'], 16, 5, '1d10', 4, 1, 2, 6, 1, '3 m, voo 12 m', 'Toque +7 (prender)', 'Drenar sangue (1 Con por rodada presa)'],
  ['Morcego atroz', 'Dire bat', '2', 'Animal', 'G', ['masmorra', 'subterraneo', 'montanha'], 14, 22, '4d8+4', 2, 12, 5, 6, 3, '6 m, voo 12 m', 'Mordida +5 (1d8+4)', 'Percepção às cegas 12 m'],
  ['Javali', 'Boar', '2', 'Animal', 'M', ['floresta', 'planicie', 'colinas'], 14, 18, '2d8+9', 0, 6, 6, 3, 1, '12 m', 'Chifrada +4 (1d8+4)', 'Ferocidade'],
  ['Crocodilo', 'Crocodile', '2', 'Animal', 'G', ['pantano', 'aquatico'], 14, 22, '3d8+9', 1, 8, 6, 4, 2, '6 m, nadar 9 m', 'Mordida +5 (1d8+4 + agarrar); cauda +0 (1d12+2)', 'Rolar da morte; investida veloz'],
  ['Sapo gigante', 'Giant frog', '1', 'Animal', 'M', ['pantano', 'aquatico'], 12, 15, '2d8+6', 1, 6, 6, 4, 1, '9 m, nadar 9 m', 'Mordida +3 (1d6+2 + agarrar)', 'Puxar com a língua (4,5 m); engolir'],
  ['Lagarto-homem', 'Lizardfolk', '1', 'Humanoide (reptiliano)', 'M', ['pantano'], 17, 11, '2d8+2', 0, 1, 4, 0, 0, '9 m, nadar 4,5 m', 'Clava pesada +2 (1d6+1); mordida +0 (1d4)', 'Prender a respiração'],
  ['Troglodita', 'Troglodyte', '1', 'Humanoide (reptiliano)', 'M', ['subterraneo', 'masmorra'], 15, 13, '2d8+4', -1, 0, 7, -1, 0, '9 m', 'Clava +2 (1d6+1); garra +1 (1d4); mordida +1 (1d4)', 'Fedor (Fort CD 13, enjoado); visão no escuro'],
  ['Ogro', 'Ogre', '3', 'Humanoide (gigante)', 'G', ['colinas', 'montanha', 'floresta'], 17, 30, '4d8+12', -1, 5, 6, 0, 3, '9 m', 'Clava grande +7 (2d8+7)', 'Alcance 3 m; visão no escuro'],
  ['Urso pardo', 'Grizzly bear', '4', 'Animal', 'G', ['floresta', 'montanha'], 16, 42, '5d8+20', 1, 6, 8, 5, 2, '12 m', '2 garras +7 (1d6+5 + agarrar); mordida +7 (1d6+5)', 'Faro'],
  ['Urso-coruja', 'Owlbear', '4', 'Besta mágica', 'G', ['floresta', 'colinas'], 15, 47, '5d10+20', 5, 12, 8, 4, 2, '9 m', '2 garras +6 (1d6+4 + agarrar); mordida +6 (1d6+4)', 'Faro; visão no escuro'],
  ['Troll', 'Troll', '5', 'Humanoide (gigante)', 'G', ['montanha', 'pantano', 'floresta'], 16, 63, '6d8+36', 2, 8, 11, 4, 3, '9 m', 'Mordida +8 (1d8+5); 2 garras +8 (1d6+5)', 'Regeneração 5 (ácido ou fogo); dilacerar (1d6+7)'],
  ['Gárgula', 'Gargoyle', '4', 'Humanoide monstruoso', 'M', ['montanha', 'urbano', 'masmorra'], 16, 42, '5d10+15', 6, 5, 4, 6, 4, '12 m, voo 18 m', '2 garras +7 (1d6+2); mordida +7 (1d4+2); chifre +7 (1d4+2)', 'RD 10/mágica; congelar (parece estátua)'],
  ['Harpia', 'Harpy', '4', 'Humanoide monstruoso', 'M', ['montanha', 'colinas', 'pantano'], 16, 38, '7d10', 2, 7, 2, 7, 6, '6 m, voo 24 m', 'Maça-estrela +8/+3 (1d8+1); 2 garras +3 (1d6)', 'Canção cativante (Von CD 16)'],
  ['Diabrete', 'Imp', '2', 'Extraplanar (diabo)', 'Mi', ['masmorra', 'urbano'], 17, 16, '3d10', 3, 7, 1, 6, 4, '6 m, voo 15 m', 'Ferrão +8 (1d4 + veneno)', 'RD 5/bem ou prata; invisibilidade à vontade; regeneração 2'],
  ['Ettercap', 'Ettercap', '3', 'Aberração', 'M', ['floresta'], 15, 30, '4d8+12', 7, 8, 4, 4, 6, '9 m, escalar 9 m', 'Mordida +5 (1d8+2 + veneno); 2 garras +5 (1d4+2)', 'Teia; armadilhas de teia; veneno Des 1d2'],
  ['Aparição', 'Wight', '3', 'Morto-vivo', 'M', ['masmorra', 'pantano', 'colinas'], 15, 26, '4d8+8', 1, 11, 3, 2, 5, '9 m', 'Pancada +4 (1d4+1 + nível negativo)', 'Criar cria; resistência a energia positiva'],
  ['Sombra', 'Shadow', '3', 'Morto-vivo (incorpóreo)', 'M', ['masmorra', 'urbano'], 13, 19, '3d8+6', 2, 8, 3, 3, 4, '—, voo 12 m', 'Toque incorpóreo +4 (1d6 de dano de Força)', 'Incorpóreo; criar cria; furtividade nas sombras'],
  ['Cubo gelatinoso', 'Gelatinous cube', '3', 'Gosma', 'G', ['masmorra'], 4, 50, '4d8+32', -5, -5, 9, -4, -4, '4,5 m', 'Pancada +2 (1d6 + 1d6 ácido)', 'Engolfar (Ref CD 12); transparente; paralisia'],
  ['Grick', 'Grick', '3', 'Aberração', 'M', ['subterraneo', 'masmorra'], 16, 27, '5d8+5', 2, 9, 2, 3, 6, '9 m, escalar 6 m', 'Mordida +4 (1d4+1); 4 tentáculos +4 (1d4+1)', 'RD 10/mágica; faro'],
  ['Minotauro', 'Minotaur', '4', 'Humanoide monstruoso', 'G', ['masmorra'], 14, 45, '6d10+12', 0, 10, 6, 5, 5, '9 m', 'Machado grande +9/+4 (3d6+6/×3); chifrada +4 (1d6+2)', 'Investida poderosa (chifrada 2d6+6); astúcia natural'],
  ['Basilisco', 'Basilisk', '5', 'Besta mágica', 'M', ['deserto', 'subterraneo', 'colinas'], 17, 52, '7d10+14', -1, 9, 9, 4, 3, '6 m', 'Mordida +10 (1d8+4)', 'Olhar petrificante (Fort CD 17)'],
  ['Mantícora', 'Manticore', '5', 'Besta mágica', 'G', ['montanha', 'colinas'], 17, 57, '6d10+24', 1, 9, 9, 6, 3, '9 m, voo 15 m', 'Mordida +10 (1d8+5); 2 garras +10 (2d4+5)', '4 espinhos +8 à distância (1d6+5)'],
  ['Serpe', 'Wyvern', '6', 'Dragão', 'G', ['colinas', 'montanha'], 19, 73, '7d12+28', 1, 15, 9, 6, 6, '6 m, voo 18 m', 'Ferrão +10 (1d6+4 + veneno); mordida +10 (2d6+4); 2 asas +5 (1d6+2)', 'Veneno Con 1d4 (Fort CD 17); agarrar'],
  ['Fogo-fátuo', "Will-o'-wisp", '6', 'Aberração', 'P', ['pantano', 'floresta'], 26, 40, '9d8', 13, 17, 3, 12, 9, 'voo 15 m', 'Toque +17 (2d8 eletricidade)', 'Imune a magia; alimentar-se de medo; invisível à vontade'],
  ['Múmia', 'Mummy', '5', 'Morto-vivo', 'M', ['deserto', 'masmorra'], 20, 60, '8d8+24', 0, 16, 4, 2, 8, '6 m', 'Pancada +14 (1d8+10 + podridão)', 'Desespero (Von CD 16); RD 5/—; vulnerável a fogo'],
  ['Gigante da colina', 'Hill giant', '7', 'Humanoide (gigante)', 'G', ['colinas'], 21, 85, '10d8+40', -1, 6, 11, 2, 3, '9 m', 'Clava grande +14/+9 (2d8+10); pedra +6 (1d8+10)', 'Arremessar e apanhar pedras'],
  ['Bandido', 'Bandit', '1/2', 'Humanoide (humano)', 'M', ['urbano', 'planicie', 'floresta', 'colinas'], 15, 11, '2d8+2', 2, 3, 2, 3, 0, '9 m', 'Espada curta +3 (1d6+1/19–20); arco curto +3 (1d6/×3)', 'Emboscada'],
  ['Guarda da cidade', 'Guard', '1/2', 'Humanoide (humano)', 'M', ['urbano'], 16, 13, '2d10+2', 1, 3, 4, 1, 0, '6 m', 'Alabarda +4 (1d10+3/×3); besta leve +2 (1d8/19–20)', '—'],
  ['Drow', 'Drow', '1/3', 'Humanoide (elfo)', 'M', ['subterraneo', 'masmorra'], 16, 6, '1d8+1', 2, 6, 0, 3, 2, '9 m', 'Espada curta +1 (1d6/19–20); besta de mão +3 (1d4 + veneno de sono)', 'Resistência a magia 7; magias de drow; cegueira pela luz'],
  ['Escorpião gigante', 'Giant scorpion', '3', 'Verme', 'G', ['deserto', 'subterraneo'], 16, 37, '5d8+15', 0, 4, 7, 1, 1, '15 m', '2 pinças +6 (1d6+4 + agarrar); ferrão +6 (1d6+4 + veneno)', 'Veneno For 1d2 (Fort CD 17); constringir'],
  ['Cria de vampiro', 'Vampire spawn', '4', 'Morto-vivo', 'M', ['urbano', 'masmorra'], 15, 26, '4d8+8', 1, 11, 3, 2, 5, '9 m', 'Pancada +4 (1d4+1 + dreno de energia)', 'RD 5/prata; recuperação rápida 2; dominar'],
  ['Grifo', 'Griffon', '4', 'Besta mágica', 'G', ['montanha', 'colinas', 'planicie'], 17, 42, '5d10+15', 2, 12, 7, 6, 2, '9 m, voo 24 m', 'Mordida +7 (1d6+3); 2 garras +7 (1d4+3)', 'Bote; faro'],
  ['Elemental de lama pequeno', 'Mud elemental (small)', '1', 'Elemental', 'P', ['pantano'], 15, 13, '2d10+2', -1, 4, 4, -1, 0, '6 m, escavar 6 m', 'Pancada +4 (1d6+3)', 'Envolver em lama; imunidades elementais'],
  ['Cão goblin', 'Goblin dog', '1', 'Animal', 'M', ['floresta', 'colinas'], 13, 9, '1d8+5', 2, 1, 3, 4, 0, '15 m', 'Mordida +2 (1d6 + alergia)', 'Resposta alérgica (Fort CD 12, coceira); faro']
].map(([nome, original, nd, tipo, tamanho, terrenos, ca, pv, dv, ini, percepcao, fort, ref, von, desloc, ataques, especial]) => ({
  id: G.normalizar(original).replace(/[^a-z0-9]+/g, '-'),
  nome, original, nd, xp: G.XP_POR_ND[nd], tipo, tamanho, terrenos, ca, pv, dv, ini, percepcao, fort, ref, von, desloc, ataques, especial
}));

// Converte ND (ex.: "1/3") em número
G.ndNumero = (nd) => { const s = String(nd || '').trim(); if (s.includes('/')) { const [a, b] = s.split('/'); return a / b; } return parseFloat(s.replace(',', '.')) || 0; };
G.xpDoND = (nd) => {
  const s = String(nd || '').trim();
  if (G.XP_POR_ND[s]) return G.XP_POR_ND[s];
  const n = G.ndNumero(s);
  if (n >= 1) return G.XP_POR_ND[Math.round(n)] || 0;
  return n >= 0.45 ? 200 : n >= 0.3 ? 135 : n >= 0.2 ? 100 : n >= 0.15 ? 65 : n > 0 ? 50 : 0;
};
