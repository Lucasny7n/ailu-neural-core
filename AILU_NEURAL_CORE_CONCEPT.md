# Conceito do Ailu Neural Core

Ailu Neural Core é uma galáxia operacional 3D para navegar por IA, memória, sistema e ações locais.

O operador seleciona objetos na galáxia. A IA entende o objeto como Contexto Ativo. Qualquer ação real continua bloqueada pela Approval Layer.

## Experiência

- Núcleo central: Ailu Neural Core.
- Estrelas principais: Memória, IA, Sistema, Interface, Hardware, CPU, GPU, RAM/ZRAM, Armazenamento, Conectividade, Áudio e Ações.
- Planetas: subáreas reais ou conceituais.
- Cabos: relações vivas entre memória, sistema, IA e ação.
- Console: ponto principal de conversa, diagnóstico e planejamento.

A tela deve parecer cockpit/Jarvis cyberpunk, não dashboard SaaS.

## Contexto Ativo

Ao clicar em qualquer objeto:

1. o objeto é selecionado;
2. a câmera foca;
3. o painel direito muda;
4. o console mostra `Contexto ativo`;
5. a IA usa esse contexto em pedidos referenciais.

Exemplo:

```txt
Selecionado: Arquivos
Operador: resuma isso
Resposta: usa Arquivos como contexto.
```

Outro alvo claro ignora o contexto:

```txt
Selecionado: Arquivos
Operador: apaga steam
Resultado: plano de ação para Steam com Approval, sem tratar Arquivos como alvo.
```

## Camadas do Produto

- Camada conversacional: perguntas e explicações sem comando.
- Camada visual: Galáxia Neural 3D clicável.
- Camada de memória: vault, notas, arquivos, decisões e contexto.
- Camada operacional: diagnóstico, plano, aprovação e execução.

## Não Objetivos

- Não é reparo autônomo.
- Não executa comandos vindos de conversa normal.
- Não finge Memory Core quando o vault está vazio.
- Não usa cloud obrigatória.
- Não substitui a autorização humana.
