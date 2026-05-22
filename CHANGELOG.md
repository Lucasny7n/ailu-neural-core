# Changelog

## 0.5.0 (V11 - Surgical Cyberpunk)

- **Visual Overhaul:** Galáxia 3D muito mais impactante com núcleo central maior, estrelas principais maiores, conexões mais densas e partículas com glow intenso.
- **Cyberpunk UI:** CSS aprimorado com fundos mais profundos, painéis translúcidos com blur (24px) e saturação, e estética cyberpunk refinada.
- **Provider Layer:** Desacoplamento do Ollama; agora suporta OpenClaude Bridge (opcional) e Provedores compatíveis com OpenAI.
- **Voz Nativa:** Implementado suporte a reconhecimento de voz (Escutar) e síntese de voz (Falar respostas) via Web Speech API.
- **Contexto Ativo Real:** Refinamento da influência do contexto selecionado nas respostas da IA, permitindo perguntas como "isso está normal?" usarem os dados do objeto focado.
- **Configurações Expandidas:** Nova tela de configurações permitindo trocar provedor de IA, escolher modelos Qwen, ajustar voz e detalhes visuais.
- **Tradução Completa:** Todos os estados dos nós e mensagens do sistema traduzidos para Português do Brasil.
- **Backend Rust:** Adicionado suporte nativo no Tauri para detecção e execução do OpenClaude CLI.

## 0.4.0

- Transformou a tela principal em Galáxia Neural 3D com núcleo dominante, estrelas, planetas, órbitas, cabos e partículas.
- Adicionou `galaxyGraph.ts` com objetos, domínios, conexões e adapter para Memory Core real.
- Adicionou Contexto Ativo no store, histórico de contexto, seleção de objeto e seleção de conexão.
- Adicionou console consciente de contexto com modos Conversar, Diagnosticar, Preparar ação, Memória e Exploração.
- Adicionou resolução de intenção com contexto ativo: mensagens referenciais usam o objeto selecionado; ações com alvo claro ignoram o contexto.
- Integração visual do Memory Core na galáxia, com estado vazio honesto.
- Reduziu poluição da tela principal, removendo docks extras do primeiro viewport e mantendo topbar, painéis compactos, console e rodapé.
- Traduziu a UI visível para português.
- Adicionou settings de qualidade da galáxia, densidade de partículas, conexões secundárias, órbitas e redução de animação.
- Gerou screenshots de validação em `/tmp/ailu-neural-core-v7-*.png`.

## 0.3.0

- Adicionou Memory Core em Rust com vault local, `.ailuignore`, SQLite, parser, chunker, indexer, linker, grafo, busca, contexto, captura e importação.
- Adicionou comandos Tauri para config, scan, import, CRUD, busca, grafo, backlinks, relacionados, contexto, pin/unpin, forget e stats.
- Adicionou UI de memória com editor, busca, filtros, importação, backlinks, fontes, captura e grafo.
- Integração inicial do Memory Core no console.
- Testes Rust e TypeScript para parser, vault, busca, contexto, captura, importação, UI e Approval.

## 0.2.0

- Redesenhou o Neural Space como cockpit técnico.
- Adicionou núcleo holográfico, nós tipados, cabos com glow, hitbox maior e partículas.
- Adicionou Intent Engine para separar conversa, pergunta, diagnóstico seguro, navegação, feedback e ação real.
- Diagnósticos seguros deixaram de abrir Approval.
- Ações reais continuam exigindo Approval.
- Adicionou cobertura Playwright para exemplos de intenção.

## 0.1.0

- Criou o projeto inicial com Tauri v2, React, TypeScript, Vite, React Three Fiber e Zustand.
- Adicionou cena 3D inicial.
- Adicionou console do operador.
- Adicionou AI Router local com Ollama.
- Adicionou fallback planner seguro.
- Adicionou Approval Layer.
- Adicionou System Agent em Rust com diagnósticos, executor aprovado e SQLite.
