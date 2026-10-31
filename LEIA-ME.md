# Grimório do Mestre — app de desktop

Organizador de campanha (no estilo do Notion) com ferramentas de narração para Pathfinder 1e. Funciona offline e guarda tudo no seu PC.

## O que tem

**Campanha**: Sessões, Missões, NPCs, Facções, Locais, Itens, Personagens (PJs), Criaturas e Notas
- Cada página tem propriedades (status, atitude, facção, local, ND…), tags, imagem de capa e texto livre em Markdown.
- `[[Nome da página]]` cria um link para outra página, e o editor autocompleta. Se você renomear uma página, os links nas outras são atualizados.
- `- [ ] segredo` vira uma caixa de seleção clicável, usada para segredos, pistas e tarefas.
- Cole imagens com Ctrl+V ou arraste-as para dentro do texto.
- No fim de cada página aparecem as páginas ligadas a ela: membros de uma facção, quem vive num local e onde ela é mencionada.
- Missões têm um quadro em colunas: arraste os cartões entre Disponível, Ativa e Concluída.
- Expressões de dados no texto (ex.: `1d8+4`) viram botões: clique para rolar.

**Ferramentas de mesa**
- **Mesa ao vivo**: a sessão atual com segredos e pistas para marcar, um diário com horário (Enter anota), os NPCs e locais em cena e um combate compacto, tudo na mesma tela.
- **Iniciativa**: adiciona o grupo e criaturas em quantidade (Goblin 1, 2, 3…), dano e cura (Enter / Shift+Enter), PV temporários, condições com duração em rodadas (expiram sozinhas) e registro do combate. Atalhos: Espaço = próximo turno, Shift+Espaço = turno anterior, N = novo, G = grupo, C = criatura.
- **Encontros**: orçamento de XP do PF1 por nível, tamanho do grupo e dificuldade; gerador aleatório por terreno; envio para a iniciativa; anotação numa sessão ou missão.
- **Bestiário**: cerca de 50 criaturas de referência do PF1, mais as criaturas da sua campanha.
- **Dados**: expressões como `2d6+3`, `4d6kh3` e `2d20kl1`, atalhos salvos e histórico. Há também um rolador rápido no topo da tela.
- **Geradores**: NPC completo (salva como página), nomes por raça, taverna, rumor, gancho, complicação, clima e bugiganga.

Também tem busca com **Ctrl+K**, nova página com **Ctrl+N**, alternância entre edição e leitura com **Ctrl+E** e tema escuro ou claro (pergaminho).

## Como gerar o instalador (.exe)

**Opção A, pelo GitHub (sem instalar nada no PC):** envie esta pasta para o repositório `Grimorio-do-mestre`. Na aba **Actions**, rode **"Gerar instalador Windows"** e baixe o `.exe` em *Artifacts*. Se você criar uma tag `v1.0.0`, o instalador também é publicado em **Releases**.

**Opção B, no seu PC:** instale o [Node.js LTS](https://nodejs.org) e dê dois cliques em `gerar-instalador.bat`. O instalador aparece na pasta `dist`. Para só testar sem instalar, use `abrir-sem-instalar.bat`.

> O Windows pode mostrar o aviso "O Windows protegeu o computador", porque o instalador não tem assinatura digital paga. Clique em *Mais informações → Executar assim mesmo*.

## Importar do Notion

1. No Notion, abra a página principal da campanha.
2. Clique em **⋯ → Exportar**, escolha **Markdown & CSV**, inclua tudo e marque **Incluir subpáginas** e **Criar pastas para subpáginas**.
3. No Grimório, clique em **⤓** (rodapé da barra lateral) e depois em **Escolher arquivo .zip do Notion**.

Tags do banco de dados definem o tipo da página: NPC, Monstro, Item e Mapas. As outras tags, como "Escrituras" e "Corp Kafra", viram facções com os NPCs ligados a elas. Páginas dentro de "Cidades" viram locais, e as de dentro de "Missões" viram missões. O banco "Personagens" vira PJs com CA, iniciativa e percepção. Imagens e links entre páginas vêm junto. Você pode importar de novo depois: o que já existe é atualizado, sem duplicar.

## Onde ficam os dados

`%APPDATA%\Grimório do Mestre\campanhas\` contém uma pasta por campanha, com `campanha.json`, `imagens\` e `backups\`. O app guarda uma cópia por dia dos últimos 14 dias. Para levar a campanha para outro PC, use **⤓ → Exportar esta campanha (.grimorio)**.

## Estrutura do código

- `main.js`: janela, arquivos, backups e o protocolo `grimorio://` das imagens
- `preload.js`: ponte segura com a interface
- `importador-notion.js` e `zip.js`: leitura da exportação do Notion
- `app/`: interface em HTML, CSS e JS puro (sem frameworks)
  - `js/estado.js`: dados da campanha e salvamento automático
  - `js/tipos.js`: tipos de página e seus campos (é aqui que se adiciona campos novos)
  - `js/paginas.js`: listas, páginas e editor
  - `js/iniciativa.js`, `encontros.js`, `bestiario.js`, `geradores.js`, `mesa.js`: ferramentas
  - `dados/`: bestiário de referência e tabelas dos geradores

Abrindo `app/index.html` direto no navegador, o app roda em modo de teste, salvando no próprio navegador.
