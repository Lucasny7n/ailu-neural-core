# Modelo de Segurança

Ailu Neural Core segue um modelo local de aprovação explícita.

## Regras

- IA planeja.
- Operador revisa.
- Approval Layer autoriza.
- Executor roda apenas depois da autorização.
- Logs são salvos.
- Nenhum comando roda escondido.
- Nenhum endpoint remoto de execução existe.
- O app não usa `sudo` automaticamente.
- Conversa, pergunta, explicação, feedback e navegação nunca abrem Approval.
- Diagnósticos seguros podem rodar sem Approval porque são leitura.
- Ações reais sempre abrem Approval.
- Captura de memória escreve só no vault configurado.
- Importação de memória lê caminhos fornecidos pelo operador e não executa conteúdo.

## Contexto Ativo

O Contexto Ativo melhora respostas curtas, mas não substitui segurança.

Usa o contexto quando o pedido é referencial:

- `resuma isso`
- `explica`
- `isso está normal?`
- `quais decisões existem aqui?`

Ignora o contexto quando há alvo claro diferente:

- `apaga steam`
- `reinicia pipewire`
- `diagnostica bluetooth`
- `mostra gpu`

Isso evita que um arquivo selecionado vire alvo acidental de uma ação de sistema.

## Token de Aprovação

O frontend envia:

```txt
approval:<actionId>
```

O Rust executor rejeita execução se o token não corresponder ao plano.

Esse gate é local e não pretende ser fronteira criptográfica. A proteção principal é revisão explícita na UI, comandos visíveis e superfície Tauri local.

## Comandos Destrutivos

Planos mostram:

- nível de risco;
- flag destrutiva;
- sudo;
- arquivos afetados;
- pacotes afetados;
- serviços afetados.

Planos de alto risco, como remoção do Steam, começam por diagnóstico e exigem edição manual para qualquer remoção real.

## Persistência

SQLite armazena:

- planos;
- logs;
- aprovações;
- snapshots;
- eventos do grafo;
- relações;
- notas, chunks, tags, aliases, links, usos de contexto e importações.

## Vault de Memória

O Memory Core cria `.ailu/.ailuignore` para bloquear secrets, bancos, build output, binários, mídia e arquivos grandes. Caminhos são normalizados e traversal `../` é rejeitado em operações relativas ao vault.

Não há sync cloud, indexação remota ou dependência externa obrigatória.
