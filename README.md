# Ailu Neural Core

Ailu Neural Core é um cockpit local em Tauri/React/Rust para operar IA, memória e diagnóstico do sistema com uma Galáxia Neural 3D. O app é independente do `ailu-ai-studio`.

## Estado Atual

- Galáxia Neural 3D com núcleo central dominante, estrelas, planetas, órbitas, cabos vivos e partículas.
- Seleção clicável de estrelas, planetas, memórias e conexões.
- Contexto Ativo no store e no console do operador.
- Intent Engine com regra explícita: pedidos referenciais usam o contexto ativo; ordens com outro alvo claro ignoram esse contexto.
- Console em português para conversa, diagnóstico, ação, memória e exploração.
- Memory Core local com vault Markdown, SQLite, busca, chunks, backlinks, grafo e contexto recuperado.
- Approval Layer obrigatório para qualquer ação real.
- Diagnósticos seguros de leitura podem rodar sem aprovação porque não alteram o sistema.
- Provedores de IA configuráveis: Ollama local (legado), OpenClaude Bridge (opcional) e Compatível com OpenAI.
- Voz nativa: Botão "Escutar" para transcrição e "Falar" para respostas da IA via Web Speech API.
- Galáxia Neural 3D aprimorada: Núcleo maior, mais brilho, partículas densas e estética Cyberpunk profunda.
- Contexto Ativo real: A IA utiliza o objeto selecionado para responder perguntas contextuais ("isso está normal?", "resuma").

## Instalação

```bash
npm install
```

Requisitos:

- Node.js e npm
- Rust e Cargo
- Dependências nativas do Tauri v2 no Linux
- Opcional: Ollama local

## Desenvolvimento

Frontend:

```bash
npm run dev
```

Desktop:

```bash
npm run tauri:dev
```

## Validação

```bash
npm run lint
npm run typecheck
npm run test -- --run
npm run build
npm run test:ux
cargo fmt --check --manifest-path src-tauri/Cargo.toml
cargo check --manifest-path src-tauri/Cargo.toml
cargo test --manifest-path src-tauri/Cargo.toml -- --test-threads=1
git diff --check
```

## Galáxia Neural

A tela principal não é dashboard. Ela representa o sistema como uma galáxia operacional:

- Núcleo: Ailu Neural Core.
- Estrelas: Memória, IA, Sistema, Interface, Hardware, CPU, GPU, RAM/ZRAM, Armazenamento, Conectividade, Áudio e Ações.
- Planetas: notas, arquivos, decisões, Ollama, Kernel, Hyprland, PipeWire, planos, aprovações e outros subdomínios.
- Conexões: relações entre memória, sistema, IA, hardware e ações.

Ao clicar em um objeto, ele vira Contexto Ativo. O console mostra esse contexto e a IA usa isso em mensagens como `resuma isso`, `explica`, `isso está normal?` ou `quais decisões existem aqui?`.

Se o operador pedir outro alvo claro, como `apaga steam`, `reinicia pipewire` ou `mostra gpu`, o contexto ativo é ignorado para evitar confusão operacional.

## Memory Core

O vault local fica em:

```txt
~/.local/share/ailu-neural-core/memory-vault/
```

O Memory Core indexa Markdown/texto, gera chunks, backlinks, tags, grafo e contexto para respostas e planos. Se estiver vazio, a galáxia mostra o estado honesto: nenhuma memória indexada.

## Approval Layer

A IA nunca executa comandos diretamente.

Fluxo:

1. Operador envia pedido.
2. Intent Engine classifica.
3. Se for conversa/pergunta/navegação, responde sem Approval.
4. Se for diagnóstico seguro, roda apenas leitura.
5. Se for ação real, AI Router cria um plano.
6. Approval Layer mostra risco, comandos, pacotes, serviços e arquivos.
7. Só `Autorizar execução` envia comandos ao executor Tauri.

## Segurança

- Sem execução escondida.
- Sem `sudo` automático.
- Sem endpoint remoto de execução.
- Sem secrets no MVP.
- Importação de memória não executa conteúdo importado.
- Planos destrutivos começam por diagnóstico e exigem revisão explícita.
