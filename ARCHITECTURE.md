# Arquitetura

## Frontend

- React, TypeScript e Vite.
- React Three Fiber, Three.js e Drei para a Galáxia Neural 3D.
- Zustand para estado global.
- CSS global para HUD, cockpit e responsividade.

Áreas principais:

- `src/features/neural-space/`: Galáxia Neural, objetos 3D, conexões, contexto ativo, painéis e console.
- `src/features/ai-router/`: Intent Engine, resposta conversacional, Ollama, prompt de planejamento, parser e fallback planner.
- `src/features/approval/`: camada de autorização obrigatória.
- `src/features/system-agent/`: cliente Tauri para diagnóstico e execução aprovada.
- `src/features/memory-core/`: vault local, store, UI de notas, busca, importação, grafo e contexto.
- `src/features/memory-graph/`: serviço pequeno para relações operacionais locais.

## Backend

- Tauri v2.
- Rust.
- SQLite via `rusqlite`.
- Config local: `~/.config/ailu-neural-core/config.json`.
- Banco local: `~/.local/share/ailu-neural-core/ailu-neural-core.sqlite`.

Módulos:

- `diagnostics.rs`: comandos seguros de leitura.
- `executor.rs`: executor sequencial com token de aprovação.
- `db.rs`: schema SQLite, logs, ações, config e relações.
- `commands.rs`: superfície Tauri.
- `src-tauri/src/memory_core/`: vault, parser, chunker, indexer, linker, grafo, busca, contexto, captura e importação.

## Fluxo de Comando

1. O operador digita no `ContextAwareCommandConsole`.
2. `intentRouter` classifica a mensagem.
3. `resolveIntentWithActiveContext` decide se o Contexto Ativo deve ser usado ou ignorado.
4. `memory_build_context` recupera memórias reais quando disponível.
5. Conversa, explicação, feedback e navegação respondem direto na UI.
6. Diagnóstico seguro chama leitura Tauri sem Approval.
7. Ação real chama `aiRouter`.
8. `aiRouter` usa Ollama ou fallback local.
9. `ApprovalLayer` exibe o plano.
10. O executor Rust só roda depois de autorização explícita.
11. Logs, ações e memórias são persistidos quando Tauri está disponível.

## Galáxia Neural

`galaxyGraph.ts` define objetos e conexões:

- `GalaxyObject`: núcleo, estrela, planeta, memória, componente, ação ou conexão.
- `GalaxyConnection`: cabo 3D com relação, força e cor.
- `ActiveContext`: objeto selecionado que orienta respostas referenciais.

A cena 3D usa:

- câmera perspectiva;
- zoom/orbit/drag;
- órbitas;
- cabos curvos;
- partículas viajando;
- foco suave de câmera;
- clique em objeto e conexão.

## Memory Core na Galáxia

Quando `memory_get_graph` retorna dados reais, notas e arquivos viram corpos roxos no campo de memória. Se o vault está vazio, apenas a estrutura base aparece e a UI informa que não há memória indexada.

## Limites Atuais

- Busca de memória é lexical/FTS com fallback LIKE.
- Embeddings são opcionais e não obrigatórios.
- Graphiti real ainda não está integrado.
- Multiagentes e execução autônoma estão fora do MVP.
