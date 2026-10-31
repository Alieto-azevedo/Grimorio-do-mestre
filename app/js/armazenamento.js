// Camada de armazenamento: usa os arquivos do PC (app instalado) ou o navegador (modo de teste)
G.arm = (function () {
  const nativo = window.grimorioNativo;

  if (nativo) {
    return {
      nativo: true,
      listar: () => nativo.listar(),
      carregar: (id) => nativo.carregar(id),
      salvar: (id, dados) => nativo.salvar(id, JSON.stringify(dados)),
      criar: (dados) => nativo.criar(dados),
      excluir: (id) => nativo.excluir(id),
      async salvarImagem(campId, arquivo) {
        const bytes = new Uint8Array(await arquivo.arrayBuffer());
        return 'img:' + await nativo.salvarImagem(campId, arquivo.name || 'imagem.png', bytes);
      },
      urlImagem: (campId, ref) => ref.startsWith('img:') ? `grimorio://img/${campId}/${encodeURIComponent(ref.slice(4))}` : ref,
      exportar: (id) => nativo.exportar(id),
      importarBackup: () => nativo.importarBackup(),
      importarNotion: (id) => nativo.importarNotion(id),
      abrirPasta: (id) => nativo.abrirPasta(id),
      abrirLink: (url) => nativo.abrirLink(url)
    };
  }

  // ---- Modo navegador (desenvolvimento/teste) ----
  const L = window.localStorage;
  const chaveLista = 'grimorio:campanhas';
  const lista = () => { try { return JSON.parse(L.getItem(chaveLista)) || []; } catch { return []; } };
  const imagens = {};

  return {
    nativo: false,
    async listar() {
      return lista().map(id => {
        try {
          const d = JSON.parse(L.getItem('grimorio:camp:' + id));
          return { id, nome: d.nome, editado: d.editado || 0, total: Object.keys(d.entidades || {}).length };
        } catch { return null; }
      }).filter(Boolean).sort((a, b) => b.editado - a.editado);
    },
    async carregar(id) { try { return JSON.parse(L.getItem('grimorio:camp:' + id)); } catch { return null; } },
    async salvar(id, dados) { L.setItem('grimorio:camp:' + id, JSON.stringify(dados)); return true; },
    async criar(dados) {
      const id = G.uid();
      dados.id = id;
      L.setItem('grimorio:camp:' + id, JSON.stringify(dados));
      L.setItem(chaveLista, JSON.stringify([...lista(), id]));
      return id;
    },
    async excluir(id) {
      L.removeItem('grimorio:camp:' + id);
      L.setItem(chaveLista, JSON.stringify(lista().filter(x => x !== id)));
      return true;
    },
    async salvarImagem(campId, arquivo) {
      const url = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(arquivo); });
      const nome = G.uid();
      imagens[nome] = url;
      try { L.setItem('grimorio:img:' + nome, url); } catch { /* sem espaço: fica só na memória */ }
      return 'img:' + nome;
    },
    urlImagem(campId, ref) {
      if (!ref.startsWith('img:')) return ref;
      const n = ref.slice(4);
      return imagens[n] || L.getItem('grimorio:img:' + n) || '';
    },
    async exportar(id) {
      const d = await this.carregar(id);
      const blob = new Blob([JSON.stringify({ formato: 'grimorio-backup', versao: 1, campanha: d, imagens: {} })], { type: 'application/json' });
      const a = G.h('a', { href: URL.createObjectURL(blob), download: (d.nome || 'campanha') + '.grimorio' });
      a.click();
      return true;
    },
    async importarBackup() { G.aviso('No modo navegador, use o app instalado para importar.', 'erro'); return null; },
    async importarNotion() { G.aviso('A importação do Notion funciona no app instalado.', 'erro'); return null; },
    async abrirPasta() { G.aviso('Disponível apenas no app instalado.'); },
    async abrirLink(url) { window.open(url, '_blank'); }
  };
})();
