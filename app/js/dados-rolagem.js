// Rolagem de dados: "1d20+5", "2d6+1d4-1", "4d6kh3", "2d20kl1", "d%"
G.dados = (function () {
  const historico = [];
  const d = (faces) => 1 + Math.floor(Math.random() * faces);

  function rolar(expressao) {
    const expr = String(expressao || '').toLowerCase().replace(/\s+/g, '').replace(/d%/g, 'd100');
    if (!expr) throw new Error('Expressão vazia');
    if (!/^[+-]?(\d*d\d+(k[hl]\d+)?|\d+)([+-](\d*d\d+(k[hl]\d+)?|\d+))*$/.test(expr)) {
      throw new Error('Expressão inválida. Use algo como 1d20+5 ou 4d6kh3');
    }
    const termos = expr.match(/[+-]?[^+-]+/g);
    let total = 0;
    const partes = [];
    for (const termo of termos) {
      const sinal = termo.startsWith('-') ? -1 : 1;
      const corpo = termo.replace(/^[+-]/, '');
      const m = corpo.match(/^(\d*)d(\d+)(?:k([hl])(\d+))?$/);
      if (m) {
        const qtd = G.limitar(parseInt(m[1] || '1', 10), 1, 200);
        const faces = G.limitar(parseInt(m[2], 10), 2, 1000);
        const rolagens = Array.from({ length: qtd }, () => d(faces));
        let mantidos = rolagens.map((v, i) => i);
        if (m[3]) {
          const n = G.limitar(parseInt(m[4], 10), 1, qtd);
          mantidos = rolagens.map((v, i) => [v, i]).sort((a, b) => m[3] === 'h' ? b[0] - a[0] : a[0] - b[0]).slice(0, n).map(x => x[1]);
        }
        const soma = mantidos.reduce((s, i) => s + rolagens[i], 0);
        total += sinal * soma;
        partes.push({ tipo: 'dado', sinal, qtd, faces, rolagens, mantidos, soma, texto: corpo });
      } else {
        const v = parseInt(corpo, 10);
        total += sinal * v;
        partes.push({ tipo: 'num', sinal, valor: v });
      }
    }
    const dadoUnico = partes.filter(p => p.tipo === 'dado');
    const critico = dadoUnico.length === 1 && dadoUnico[0].faces === 20 && dadoUnico[0].mantidos.length === 1
      ? (dadoUnico[0].rolagens[dadoUnico[0].mantidos[0]] === 20 ? 'max' : dadoUnico[0].rolagens[dadoUnico[0].mantidos[0]] === 1 ? 'min' : null)
      : null;
    const r = { expr: expressao.trim(), total, partes, critico, quando: Date.now() };
    historico.unshift(r);
    if (historico.length > 100) historico.pop();
    G.emitir && G.emitir('rolagem', r);
    return r;
  }

  function detalhe(r) {
    return r.partes.map((p, idx) => {
      const s = idx === 0 ? (p.sinal < 0 ? '−' : '') : (p.sinal < 0 ? ' − ' : ' + ');
      if (p.tipo === 'num') return s + p.valor;
      const vals = p.rolagens.map((v, i) => p.mantidos.includes(i) ? String(v) : `<s>${v}</s>`).join(', ');
      return `${s}[${vals}]`;
    }).join('');
  }

  const mod = (v) => { const n = parseInt(v, 10) || 0; return n >= 0 ? `+${n}` : `${n}`; };

  return { rolar, detalhe, historico, d, mod };
})();
