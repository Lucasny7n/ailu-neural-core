# Memory Core

Memory Core é a camada local de memória do Ailu Neural Core. Ele grava notas Markdown, indexa em SQLite, monta backlinks, cria grafo e recupera contexto antes de respostas ou planos.

## Armazenamento

- Vault: `~/.local/share/ailu-neural-core/memory-vault/`
- Config: `~/.config/ailu-neural-core/memory-core.json`
- SQLite: `~/.local/share/ailu-neural-core/ailu-neural-core.sqlite`

## O Que Indexa

O MVP indexa `.md`, `.txt`, `.json` e `.log`.

Markdown suporta:

- `title`
- `kind`
- `tags`
- `aliases`
- `created`
- `updated`

O parser também lê headings, tags inline, wikilinks e links Markdown.

`.ailuignore` bloqueia secrets, bancos, binários, build output, mídia, arquivos compactados e metadados internos.

## Uso Pela IA

Antes de responder ou planejar, o app chama `memory_build_context`. O retorno inclui:

- notas;
- chunks;
- arestas;
- fontes;
- resumo compacto.

O AI Router recebe esse bloco no prompt. A resposta conversacional mostra as memórias usadas quando houver fonte real.

## Uso Pela Galáxia

`memory_get_graph` alimenta a estrela Memória:

- notas viram corpos roxos;
- arquivos importados viram objetos de memória;
- decisões e ações recebem destaque;
- backlinks viram conexões;
- se não houver dados, a UI mostra estado vazio honesto.

## Capturas

- `salva isso como decisão: ...`
- `salva isso como regra: ...`
- salvar decisão pelo console;
- salvar ação depois de plano registrado.

Cada captura grava Markdown real, atualiza SQLite e entra nas próximas recuperações.

## Limites

- Busca lexical/FTS5 com fallback LIKE.
- Embeddings continuam opcionais.
- Watcher de arquivo ainda não é padrão.
- O fallback de desenvolvimento no browser serve para Vite/testes; Tauri usa comandos reais.
- Graphiti real ainda não está acoplado.
