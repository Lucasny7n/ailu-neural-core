# CODEX V23 — AILU NEURAL CORE: ARRUMAR IA, COMANDOS, FUNCOES REAIS E VISUAL

Projeto:
`/home/lucas/ailu-neural-core`

Base:
branch atual baseada no PR #2, commit fd4165566e5eb491482ff8ced664d62b79839001.

Problema real:
O app abre, testes passam, mas ainda esta ruim para uso real.

O usuario testou e relatou:
1. Visual ainda esta feio e distante da referencia.
2. Chat nao responde de verdade quando o operador manda mensagem.
3. Comandos nao executam fluxo correto.
4. Muitas funcoes parecem fachada.
5. Cockpit ainda nao parece o alvo.
6. A experiencia nao parece uma IA operacional.
7. Precisa funcionar, nao apenas compilar.

Referencia visual:
`/home/lucas/Downloads/ChatGPT Image 21 de mai. de 2026, 21_29_45.png`

Objetivo:
Corrigir o Ailu para ficar usavel e operacional, mantendo build passando.

Regras absolutas:
- Nao usar sudo.
- Nao remover Tauri, React, Three, R3F, Approval Layer, Memory Core, Provider Layer, Voice.
- Nao usar `@ts-nocheck`.
- Nao usar `eslint-disable` para esconder problema.
- Nao deixar botao morto.
- Nao deixar UI em ingles.
- Nao fingir dado real.
- Nao executar comando real sem Approval.
- Nao commitar quebrado.
- Corrigir TypeScript direito.

Prioridade 1 — chat da IA precisa responder:
Corrigir `ContextAwareCommandConsole`, `ai-router`, provider fallback e stores.
Quando o operador digitar:
- `oi`
- `o que e zram?`
- `isso esta normal?`
- `resuma isso`
a UI deve responder no console, mesmo se provider externo estiver offline.
Se provider estiver offline, usar fallback local honesto em portugues.
Nao deixar input enviar e nada acontecer.

Prioridade 2 — comandos precisam virar plano:
Quando o operador digitar:
- `apaga steam`
- `reinicia pipewire`
- `instala firefox`
- `limpa cache`
o app deve criar plano estruturado e abrir Approval Layer.
Nada deve executar direto.
Approval deve mostrar comandos, risco, alvo e botoes:
- Autorizar execucao
- Editar plano
- Copiar comandos
- Cancelar

Prioridade 3 — botoes precisam funcionar:
Revisar todos os botoes visiveis no cockpit, console, painel direito, sidebar e footer.
Cada botao deve:
- executar acao real segura;
- navegar;
- focar objeto;
- abrir painel;
- alterar estado;
- ou ficar desabilitado com motivo claro.
Sem botao morto.

Prioridade 4 — contexto ativo real:
Clicar em no, planeta, memoria, componente ou conexao deve:
- selecionar objeto;
- atualizar painel direito;
- atualizar console;
- definir contexto ativo;
- fazer perguntas referenciais usarem contexto.
Exemplos:
Selecionou GPU e digitou `isso esta normal?` → responder sobre GPU.
Selecionou conexao e digitou `explique essa ligacao` → explicar a relacao.
Selecionou memoria e digitou `resuma isso` → resumir memoria.

Prioridade 5 — visual:
Melhorar visual sem quebrar.
A tela deve se aproximar mais da referencia:
- cockpit preenchido;
- centro sem vazio morto;
- nucleo mais forte;
- conexoes mais densas;
- clusters mais visiveis;
- paineis menos quadrados;
- console mais operacional;
- topbar e sidebar mais premium;
- footer tecnico.
Nao transformar em mock estatico.
A galaxia precisa continuar Three.js real.

Prioridade 6 — configurações e rotas:
Garantir que Configuracoes, Memoria, Providers, Acoes e Diagnosticos nao fiquem cortadas.
Sem overflow horizontal.
Layout deve caber em 1920x1080.

Prioridade 7 — Memory Core e Dreaming minimo:
- Salvar decisao precisa persistir memoria.
- Sonhar agora precisa gerar resumo simples ou explicar falta de memoria.
- Auditoria jsonl precisa registrar.
- Nao inventar memoria falsa.

Prioridade 8 — Provider/Qwen/Ollama/OpenClaude:
Tela de providers deve permitir:
- escolher provider;
- modelo manual;
- testar conexao;
- salvar;
- mostrar erro claro.
Se offline, console deve continuar com fallback local.

Testes obrigatorios:
Rodar e corrigir ate passar:
- npm run lint
- npm run typecheck
- npm run test -- --run
- npm run build
- npm run test:ux
- cargo fmt --check --manifest-path src-tauri/Cargo.toml
- cargo check --manifest-path src-tauri/Cargo.toml
- cargo test --manifest-path src-tauri/Cargo.toml -- --test-threads=1
- git diff --check

Screenshots obrigatorias:
Gerar:
- /tmp/ailu-v23-home-cockpit.png
- /tmp/ailu-v23-chat-response.png
- /tmp/ailu-v23-approval-command.png
- /tmp/ailu-v23-settings-fixed.png
- /tmp/ailu-v23-reference-compare.png

Commit e push:
No final:
- git add -A
- git commit -m "Fix Ailu AI chat, commands, cockpit UX and workflows"
- git push -u origin HEAD

Resumo final:
Responder com:
- arquivos alterados
- o que foi corrigido no chat
- o que foi corrigido nos comandos
- o que foi corrigido no visual
- testes
- screenshots
- commit
- push
- pendencias reais
