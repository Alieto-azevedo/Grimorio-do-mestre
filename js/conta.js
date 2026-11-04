// Conta, login e campanhas
(function () {
  const { h } = G;

  G.rota('conta', (alvo) => {
    document.body.classList.toggle('sem-campanha', !G.loja.id);
    const caixa = h('div', { class: 'conta' });
    alvo.appendChild(caixa);
    if (!G.arm.usuario) { telaLogin(caixa); return; }
    telaCampanhas(caixa);
  });

  function telaLogin(caixa) {
    const email = h('input', { class: 'campo largo', type: 'email', placeholder: 'E-mail', autocomplete: 'email' });
    const senha = h('input', { class: 'campo largo', type: 'password', placeholder: 'Senha', autocomplete: 'current-password' });
    const erro = h('p', { class: 'erro' });
    const tentar = async (fn) => {
      erro.textContent = '';
      try { await fn(email.value.trim(), senha.value); }
      catch (e) {
        const msg = { 'auth/invalid-credential': 'E-mail ou senha incorretos.', 'auth/invalid-email': 'E-mail inválido.', 'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.', 'auth/email-already-in-use': 'Esse e-mail já tem conta — use Entrar.', 'auth/network-request-failed': 'Sem internet.' };
        erro.textContent = msg[e.code] || e.message;
      }
    };
    caixa.append(
      h('div', { class: 'selo-grande' }, '✦'),
      h('h1', null, 'Grimório do Mestre'),
      h('p', { class: 'dica' }, 'Entre para sincronizar suas campanhas entre o celular e o computador.'),
      h('form', { class: 'form-login', onsubmit: (e) => { e.preventDefault(); tentar((a, b) => G.arm.entrar(a, b)); } },
        email, senha, erro,
        h('button', { class: 'btn primario largo' }, 'Entrar'),
        h('button', { type: 'button', class: 'btn largo', onclick: () => tentar((a, b) => G.arm.criarConta(a, b)) }, 'Criar conta'),
        h('button', { type: 'button', class: 'link', onclick: () => { if (!email.value.trim()) { erro.textContent = 'Digite o e-mail primeiro.'; return; } G.arm.redefinirSenha(email.value.trim()).then(() => G.aviso('E-mail de redefinição enviado')).catch(e => { erro.textContent = e.message; }); } }, 'Esqueci a senha')));
  }

  async function telaCampanhas(caixa) {
    const lista = await G.arm.listarCampanhas().catch(e => { G.aviso(e.message, 'erro'); return []; });
    const criar = async () => {
      const nome = await G.perguntar('Nome da campanha', '', 'ex.: A Queda de Ravenford');
      if (!nome) return;
      const id = await G.arm.criarCampanha(G.loja.metaPadrao(nome));
      await abrir(id, 'biblioteca');
    };
    caixa.append(
      h('div', { class: 'selo-grande' }, '✦'),
      h('h1', null, 'Suas campanhas'),
      h('p', { class: 'dica' }, G.arm.tipo === 'local'
        ? 'Modo local: os dados ficam só neste aparelho. Configure o Firebase para sincronizar com outros aparelhos.'
        : `Conectado como ${G.arm.usuario.email}`),
      h('div', { class: 'lista' }, lista.map(c => h('div', { class: 'camp-item' + (c.id === G.loja.id ? ' atual' : '') },
        h('button', { class: 'camp-abrir', onclick: () => abrir(c.id) }, h('b', null, c.nome), h('small', null, c.id === G.loja.id ? 'aberta agora' : G.tempoRelativo(c.editado))),
        h('details', { class: 'menu' }, h('summary', { class: 'btn-icone' }, '⋯'), h('div', { class: 'menu-lista' },
          h('button', { class: 'perigo', onclick: async () => { if (await G.confirmar(`Excluir a campanha "${c.nome}" e todas as páginas? Não dá para desfazer.`, 'Excluir')) { if (c.id === G.loja.id) G.loja.fechar(); await G.arm.excluirCampanha(c.id); G.renderizar(); } } }, '🗑 Excluir campanha')))))),
      !lista.length ? h('p', { class: 'dica' }, 'Nenhuma campanha ainda.') : null,
      h('button', { class: 'btn primario largo', onclick: criar }, '＋ Nova campanha'),
      h('details', { class: 'bloco ajuda' }, h('summary', null, '📱 Instalar no celular'),
        h('p', null, 'Android (Chrome): menu ⋮ → “Adicionar à tela inicial” / “Instalar app”.'),
        h('p', null, 'iPhone (Safari): botão Compartilhar → “Adicionar à Tela de Início”.'),
        h('p', null, 'No PC (Chrome/Edge): ícone de instalar na barra de endereço.')),
      G.arm.tipo === 'firebase' ? h('button', { class: 'btn largo', onclick: async () => { G.loja.fechar(); await G.arm.sair(); } }, 'Sair da conta') : null);
  }

  async function abrir(id, destino) {
    try {
      await G.loja.abrir(id);
      document.body.classList.remove('sem-campanha');
      G.ir(destino || 'sessao/mesa');
    } catch (e) { G.aviso('Não consegui abrir: ' + e.message, 'erro'); }
  }
  G.abrirCampanha = abrir;
})();
