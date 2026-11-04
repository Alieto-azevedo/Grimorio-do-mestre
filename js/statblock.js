// Ficha de combate: leitura de statblocks colados (Pathfinder 1e, inglês ou português) e exibição com rolagens
G.statblock = (function () {
  const PARADAS = [
    'DEFENSE', 'OFFENSE', 'STATISTICS', 'TACTICS', 'ECOLOGY', 'SPECIAL ABILITIES', 'DEFESA', 'ATAQUE', 'ESTATÍSTICAS', 'TÁTICAS', 'ECOLOGIA',
    'Init', 'Senses', 'Perception', 'Aura', 'AC', 'hp', 'Fort', 'Ref', 'Will', 'Defensive Abilities', 'DR', 'Immune', 'Resist', 'SR', 'Weaknesses',
    'Speed', 'Melee', 'Ranged', 'Space', 'Reach', 'Special Attacks', 'Spell-Like Abilities', 'Spells Known', 'Spells Prepared',
    'Str', 'Base Atk', 'Feats', 'Skills', 'Racial Modifiers', 'Languages', 'SQ', 'Gear', 'Combat Gear', 'Environment', 'Organization', 'Treasure',
    'Iniciativa', 'Sentidos', 'Percepção', 'CA', 'PV', 'Von', 'RD', 'Imunidades', 'Resistências', 'RM', 'Fraquezas', 'Deslocamento',
    'Corpo a corpo', 'Corpo-a-corpo', 'À distância', 'Distância', 'Ataques Especiais', 'For', 'BBA', 'Talentos', 'Perícias', 'Idiomas', 'Equipamento'
  ];
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const RE_PARADA = '(?:' + PARADAS.map(escRe).join('|') + ')';

  function campo(texto, rotulos) {
    for (const r of rotulos) {
      const re = new RegExp('(?:^|[\\s;,(])' + escRe(r) + '\\s+(.+?)(?=\\s*;|\\s+' + RE_PARADA + '(?:\\s|\\b)|\\n|$)', 's');
      const m = texto.match(re);
      if (m) return m[1].trim().replace(/[;,.]$/, '');
    }
    return '';
  }
  function numero(texto, re) { const m = texto.match(re); return m ? m[1].replace('+', '') : ''; }

  // Interpreta o texto colado e devolve os campos da ficha
  function ler(bruto) {
    const original = String(bruto || '').replace(/\r/g, '').trim();
    const t = original.replace(/[–—−]/g, '-').replace(/ /g, ' ');
    const linhas = t.split('\n').map(l => l.trim()).filter(Boolean);
    let nome = (linhas[0] || '').replace(/\s+(CR|ND)\s*[\d/]+.*$/i, '').trim();
    if (/^(init|ac|hp|iniciativa|ca\b|pv\b)/i.test(nome)) nome = '';
    const f = {
      nome,
      nd: numero(t, /\b(?:CR|ND)\s*(\d+\/\d+|\d+)/i),
      xp: numero(t, /\bXP\s*([\d.,]+)/i).replace(/[.,]/g, ''),
      ini: numero(t, /\b(?:Init(?:iative)?|Iniciativa)\s*([+-]?\d+)/i),
      percepcao: numero(t, /\b(?:Perception|Percepção)\s*([+-]?\d+)/i),
      ca: numero(t, /\b(?:AC|CA)\s*(\d+)/),
      toque: numero(t, /\b(?:touch|toque)\s*(\d+)/i),
      surpreso: numero(t, /\b(?:flat-footed|surpreso|desprevenido)\s*(\d+)/i),
      pv: numero(t, /\b(?:hp|PV)\s*(\d+)/),
      dv: (t.match(/\b(?:hp|PV)\s*\d+\s*\(([^)]+)\)/) || [])[1] || '',
      fort: numero(t, /\bFort(?:itude)?\s*([+-]\d+)/i),
      ref: numero(t, /\bRef(?:lexos)?\s*([+-]\d+)/i),
      von: numero(t, /\b(?:Will|Von(?:tade)?)\s*([+-]\d+)/i),
      desloc: campo(t, ['Speed', 'Deslocamento']),
      cac: campo(t, ['Melee', 'Corpo a corpo', 'Corpo-a-corpo']),
      dist: campo(t, ['Ranged', 'À distância', 'Distância']),
      especial: campo(t, ['Special Attacks', 'Ataques Especiais']),
      defesas: [
        (t.match(/\b(?:regeneration|regeneração|fast healing|cura acelerada)\s+\d+(?:\s*\([^)]*\))?/i) || [])[0],
        campo(t, ['Defensive Abilities']) && 'Hab. defensivas ' + campo(t, ['Defensive Abilities']),
        campo(t, ['DR', 'RD']) && 'RD ' + campo(t, ['DR', 'RD']),
        campo(t, ['Immune', 'Imunidades']) && 'Imune ' + campo(t, ['Immune', 'Imunidades']),
        campo(t, ['Resist', 'Resistências']) && 'Resist. ' + campo(t, ['Resist', 'Resistências']),
        campo(t, ['SR', 'RM']) && 'RM ' + campo(t, ['SR', 'RM']),
        campo(t, ['Weaknesses', 'Fraquezas']) && 'Fraquezas ' + campo(t, ['Weaknesses', 'Fraquezas'])
      ].filter(Boolean).join('; '),
      atributos: (t.match(/\b(?:Str|For)\s*(\d+|-)\s*,\s*(?:Dex|Des)\s*(\d+|-)\s*,\s*Con\s*(\d+|-)\s*,\s*Int\s*(\d+|-)\s*,\s*(?:Wis|Sab)\s*(\d+|-)\s*,\s*(?:Cha|Car)\s*(\d+|-)/i) || []).slice(1).join(' / '),
      cmb: numero(t, /\b(?:CMB|BMC)\s*([+-]?\d+)/),
      cmd: numero(t, /\b(?:CMD|DMC)\s*(\d+)/),
      original
    };
    if (!f.xp && f.nd && G.XP_POR_ND[f.nd]) f.xp = String(G.XP_POR_ND[f.nd]);
    return f;
  }

  // Divide "bite +1 (1d4 plus disease), 2 claws +3 (1d6+1)" em ataques roláveis
  function ataques(texto) {
    if (!texto) return [];
    const partes = [];
    let nivel = 0, atual = '';
    const s = texto.replace(/\s+or\s+|\s+ou\s+/gi, ' | ');
    for (const c of s) {
      if (c === '(') nivel++;
      if (c === ')') nivel--;
      if ((c === ',' || c === '|') && nivel === 0) { partes.push(atual); atual = ''; } else atual += c;
    }
    partes.push(atual);
    return partes.map(p => p.trim()).filter(Boolean).map(p => {
      const m = p.match(/^(?:(\d+)\s+)?(.+?)\s+([+-]\d+(?:\/[+-]\d+)*)(?:\s+(?:touch|toque))?\s*(?:\((.+)\))?$/i);
      if (!m) return { texto: p };
      const danoExpr = ((m[4] || '').match(/\d+d\d+(?:\s*[+-]\s*\d+)?/) || [''])[0].replace(/\s/g, '');
      return { texto: p, qtd: +m[1] || 1, nome: m[2], bonus: m[3].split('/').map(Number), dano: m[4] || '', danoExpr };
    });
  }

  const mod = (v) => (v === '' || v == null) ? '—' : (+v >= 0 ? '+' + (+v) : String(v));

  // Renderiza a ficha como nó HTML com botões de rolagem
  function render(f, nome) {
    const { h } = G;
    if (!f || !Object.values(f).some(v => v)) return h('div', { class: 'vazio-p' }, 'Sem ficha de combate.');
    const rolar = (expr, rotulo) => G.mostrarRolagem(G.dados.rolar(expr), rotulo);
    const stat = (rot, val, expr, titulo) => h('button', {
      class: 'stat' + (expr ? ' rolavel-btn' : ''), title: titulo || '', disabled: !expr,
      onclick: expr ? () => rolar(expr, `${nome ? nome + ' · ' : ''}${rot}`) : null
    }, h('small', null, rot), h('b', null, val));

    const linhaAtaques = (rot, txt) => {
      const lista = ataques(txt);
      if (!lista.length) return null;
      return h('div', { class: 'ficha-ataques' }, h('div', { class: 'ficha-rot' }, rot),
        lista.map(a => a.bonus ? h('div', { class: 'ataque' },
          h('span', { class: 'ataque-nome' }, (a.qtd > 1 ? a.qtd + '× ' : '') + a.nome),
          a.bonus.map((b, i) => h('button', { class: 'chip-rolar', onclick: () => rolar('1d20' + mod(b), `${a.nome}${a.bonus.length > 1 ? ' (' + (i + 1) + 'º)' : ''}`) }, '🎲 ' + mod(b))),
          a.danoExpr ? h('button', { class: 'chip-rolar dano', onclick: () => rolar(a.danoExpr, `Dano · ${a.nome}`) }, '💥 ' + a.danoExpr) : null,
          a.dano && a.dano.replace(a.danoExpr, '').trim() ? h('small', { class: 'ataque-extra' }, a.dano.replace(a.danoExpr, '').replace(/^[\s,]+/, '')) : null
        ) : h('div', { class: 'ataque' }, a.texto)));
    };

    const pre = f.original ? h('details', { class: 'ficha-original' }, h('summary', null, 'Statblock original'), h('pre', null, f.original)) : null;
    if (pre) G.dadosClicaveis(pre);
    return h('div', { class: 'ficha' },
      (f.nd || f.xp) ? h('div', { class: 'ficha-topo' }, f.nd ? h('span', { class: 'selo-nd' }, 'ND ' + f.nd) : null, f.xp ? h('span', null, f.xp + ' XP') : null) : null,
      h('div', { class: 'ficha-stats' },
        stat('CA', f.ca || '—', null, [f.toque && 'toque ' + f.toque, f.surpreso && 'surpreso ' + f.surpreso].filter(Boolean).join(', ')),
        stat('PV', f.pv || '—', f.dv && /\d+d\d+/.test(f.dv) ? f.dv.replace(/\s/g, '').match(/\d+d\d+(?:[+-]\d+)?/)[0] : null, f.dv ? 'Rolar PV: ' + f.dv : ''),
        stat('Inic.', mod(f.ini), f.ini !== '' ? '1d20' + mod(f.ini) : null),
        stat('Perc.', mod(f.percepcao), f.percepcao !== '' && f.percepcao != null ? '1d20' + mod(f.percepcao) : null),
        stat('Fort', mod(f.fort), f.fort ? '1d20' + mod(f.fort) : null),
        stat('Ref', mod(f.ref), f.ref ? '1d20' + mod(f.ref) : null),
        stat('Von', mod(f.von), f.von ? '1d20' + mod(f.von) : null)),
      (f.toque || f.surpreso) ? h('div', { class: 'ficha-linha' }, h('b', null, 'CA '), [f.toque && `toque ${f.toque}`, f.surpreso && `surpreso ${f.surpreso}`].filter(Boolean).join(' · ')) : null,
      f.desloc ? h('div', { class: 'ficha-linha' }, h('b', null, 'Deslocamento '), f.desloc) : null,
      linhaAtaques('Corpo a corpo', f.cac),
      linhaAtaques('À distância', f.dist),
      f.especial ? h('div', { class: 'ficha-linha' }, h('b', null, 'Ataques especiais '), f.especial) : null,
      f.defesas ? h('div', { class: 'ficha-linha' }, h('b', null, 'Defesas '), f.defesas) : null,
      f.atributos ? h('div', { class: 'ficha-linha' }, h('b', null, 'For/Des/Con/Int/Sab/Car '), f.atributos) : null,
      (f.cmb || f.cmd) ? h('div', { class: 'ficha-linha' }, h('b', null, 'BMC/DMC '), `${mod(f.cmb)} / ${f.cmd || '—'}`) : null,
      pre);
  }

  return { ler, ataques, render };
})();
