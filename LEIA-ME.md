# Grimório do Mestre

App para mestres de RPG (Pathfinder 1e) que funciona no celular e no PC, instalável pela tela inicial (PWA), com sincronização pelo Firebase e funcionamento offline.

## Duas áreas

**⚔️ Sessão**: o que você usa durante o jogo, num tema escuro.
- **Mesa**: a sessão em andamento, com segredos e pistas para marcar, NPCs e locais em cena, o roteiro e um diário com horário (o campo fixo no rodapé anota direto na página da sessão).
- **Combate**: iniciativa pensada para o toque. Toque numa linha para dano, cura, PV temporários, condições com duração em rodadas e a ficha da criatura com botões de ataque e dano.
- **Dados**: d4 a d100, quantidade e modificador, expressões como `4d6kh3`, atalhos salvos e histórico.
- **Improviso**: NPC completo (salva e põe em cena), nome, taverna, rumor, gancho, complicação, clima e bugiganga.
- **Consultar**: abre qualquer página da biblioteca numa janela rápida, sem sair da mesa.

**📚 Biblioteca**: a campanha inteira, num tema claro de pergaminho.
- Sessões, Missões, NPCs, Bestiário, Locais, Facções, Itens, Grupo (PJs) e Lore.
- Links `[[Nome]]` entre páginas, com sugestões enquanto você digita. Renomear uma página atualiza os links nas outras.
- `- [ ]` cria caixas de seleção para segredos, pistas e tarefas.
- **Ficha de combate** em NPCs, criaturas e PJs: cole o statblock (d20pfsrd, Archives of Nethys ou o texto do Notion) e o app preenche CA, PV, iniciativa, salvaguardas e ataques. O bestiário só tem o que você colocar.
- Importação do Notion (.zip "Markdown & CSV") e do Grimório antigo (.grimorio), além de backup em arquivo.

## Ligar a sincronização (Firebase)

1. Em https://console.firebase.google.com, crie um projeto (ex.: `grimorio-do-mestre`). O Analytics não é necessário.
2. Em **Authentication → Sign-in method**, ative **E-mail/senha**.
3. Em **Firestore Database**, crie o banco (modo produção, região `southamerica-east1`). Na aba **Regras**, cole o conteúdo de `firestore.rules` e publique.
4. Em **Authentication → Settings → Domínios autorizados**, adicione `alieto-azevedo.github.io`.
5. Em **Configurações do projeto → Seus apps → Web (</>)**, registre o app e copie o objeto `firebaseConfig`.
6. Cole esse objeto em `config.js` (`window.FIREBASE_CONFIG = { ... }`) ou mande para o Claude colocar.

Sem isso o app funciona em **modo local**, com os dados só no aparelho.

## Publicação

Cada envio para a branch `main` publica o site automaticamente pelo GitHub Pages (workflow `publicar.yml`). Na primeira vez, ative em **Settings → Pages → Source: GitHub Actions**.

Endereço: https://alieto-azevedo.github.io/Grimorio-do-mestre/

O app de desktop antigo (Electron) está guardado na branch `desktop-antigo`.

## Código

HTML, CSS e JavaScript puros, sem etapa de build. O Firebase é carregado do servidor do Google quando a sincronização está configurada.
- `js/loja.js`: estado e sincronização. `js/armazenamento-*.js`: modo local e Firebase.
- `js/sessao.js`, `combate.js`, `ferramentas.js`: a área Sessão.
- `js/biblioteca.js`, `pagina.js`: a área Biblioteca. `js/statblock.js`: leitura dos statblocks.
- `js/importar.js`: Notion, Grimório antigo e backups.
