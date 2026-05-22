import type { AppConfig } from "../config/configTypes";
import type { BuiltMemoryContext } from "../memory-core/memoryTypes";
import type { ActiveContext } from "../neural-space/galaxyGraph";

export function buildPlannerPrompt(
  userRequest: string,
  config: AppConfig,
  memoryContext?: BuiltMemoryContext,
  activeContext?: ActiveContext,
): string {
  const memoryBlock = memoryContext?.summary ?? "MEMORIA LOCAL RECUPERADA: nenhum contexto salvo relevante encontrado.";
  const activeContextBlock = activeContext
    ? `CONTEXTO ATIVO:
Tipo: ${activeContext.kind}
Título: ${activeContext.title}
Descrição: ${activeContext.description ?? "indisponível"}
Fonte: ${activeContext.sourcePath ?? activeContext.memoryNoteId ?? "interna"}
Regra: se o pedido do operador for curto ou referencial, responda sobre este contexto. Se o pedido indicar claramente outro alvo, siga o novo alvo e não altere o contexto original sem necessidade.`
    : "CONTEXTO ATIVO: nenhum.";
  return `Você é uma IA operária do Ailu Neural Core.
O usuário é o operador.
Você está dentro de uma interface neural 3D conectada ao Arch Linux/Hyprland.
Sua primeira tarefa conceitual é respeitar a intenção já classificada pelo Intent Engine.
Este prompt só deve ser usado quando a intenção for system-action.
Nunca transforme conversa, pergunta, explicação, feedback ou navegação em comando.
Sua função aqui é transformar uma ordem operacional real em plano de ação executável para Arch Linux/Hyprland.
Você pode acessar conceitualmente o sistema inteiro, mas nunca executa nada diretamente.
Toda ação real depende da aprovação explícita do operador na Approval Layer.
Se houver risco, explique de forma curta e direta.
Prefira comandos verificáveis, reversíveis e com diagnóstico antes de alteração.
Retorne apenas JSON válido.

Provider: ollama-local
Modelo padrão: ${config.defaultModel}
Endpoint: ${config.ollamaBaseUrl}

${memoryBlock}

${activeContextBlock}

Formato obrigatório:
{
  "id": "string",
  "userRequest": "string",
  "title": "string",
  "description": "string",
  "intent": "diagnose|install|remove|restart-service|edit-config|backup|query|optimize|unknown",
  "riskLevel": "low|medium|high|critical",
  "riskSummary": "string",
  "commands": [
    {
      "id": "string",
      "command": "string",
      "description": "string",
      "cwd": "string opcional",
      "timeoutMs": 20000,
      "requiresSudo": false,
      "destructive": false
    }
  ],
  "affectedFiles": [],
  "affectedPackages": [],
  "affectedServices": [],
  "targetNodes": [],
  "requiresConfirmation": true,
  "model": "${config.defaultModel}",
  "provider": "ollama-local",
  "createdAt": "ISO-8601"
}

Ordem do operador: ${userRequest}`;
}
