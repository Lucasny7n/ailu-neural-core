import type { IntentResult, ConversationResponse, ConversationSuggestion } from "./intentTypes";
import type { BuiltMemoryContext } from "../memory-core/memoryTypes";
import type { ActiveContext } from "../neural-space/galaxyGraph";

export function buildConversationResponse(
  userRequest: string,
  intent: IntentResult,
  memoryContext?: BuiltMemoryContext,
  activeContext?: ActiveContext,
  activeContextUsed = false,
  activeContextIgnoredReason?: string,
): ConversationResponse {
  const normalized = userRequest.toLowerCase();
  const target = intent.targetNodes[0] ?? "core";
  const memoryAnswer = answerFromMemory(memoryContext);
  const contextPrefix = activeContextUsed && activeContext ? `Usando contexto ativo: ${activeContext.title}. ` : "";
  const ignoredPrefix = activeContextIgnoredReason ? `${activeContextIgnoredReason} ` : "";

  if (activeContextUsed && activeContext && (intent.intent === "question" || intent.intent === "explain" || intent.intent === "unknown")) {
    return {
      title: "Contexto ativo aplicado",
      body: `${contextPrefix}${summarizeActiveContext(activeContext, memoryAnswer)}`,
      suggestions: [
        navigate("open-context", "Abrir contexto", activeContext.nodeId ?? target),
        action("plan-from-context", "Criar plano", "cria um plano com base nisso"),
      ],
    };
  }

  if (intent.intent === "conversation") {
    return {
      title: "Canal do operador ativo",
      body: `${ignoredPrefix}Estou online no Neural Core. Posso conversar, explicar uma região, abrir objetos da galáxia, rodar diagnósticos seguros ou preparar uma ação com aprovação.`,
      suggestions: [
        navigate("abrir-ia", "Abrir IA", "ai"),
        diagnostic("diag-system", "Diagnosticar sistema", "system-overview", "system"),
        action("prepare-ollama", "Preparar teste do Ollama", "prepara teste operacional do ollama"),
      ],
    };
  }

  if (intent.intent === "app-feedback") {
    return {
      title: "Feedback registrado",
      body: "Entendi o feedback visual. Isso não vira comando do sistema. Vou tratar como ajuste de experiência: hierarquia, densidade técnica, contraste e comportamento da galáxia neural.",
      suggestions: [
        navigate("open-core", "Abrir Núcleo", "core"),
        navigate("open-actions", "Abrir Ações", "actions"),
      ],
    };
  }

  if (intent.intent === "app-navigation") {
    return {
      title: "Navegação neural",
      body: `${ignoredPrefix}Foquei ${target}. Navegação não executa comandos e não precisa de aprovação.`,
      suggestions: [
        diagnostic("diag-target", "Diagnosticar", diagnosticFor(target), target),
        action("prepare-target", "Preparar ação", `diagnosticar ${target}`),
      ],
    };
  }

  if (intent.intent === "explain" || intent.intent === "question") {
    if (memoryAnswer) {
      return {
        title: "Memória recuperada",
        body: `${contextPrefix}${memoryAnswer}`,
        suggestions: [
          navigate("open-memory", "Abrir Memória", "memory"),
          diagnostic("diag-target", "Diagnosticar", diagnosticFor(target), target),
        ],
      };
    }
    return explainResponse(normalized, target);
  }

  if (intent.intent === "safe-diagnostic") {
    return {
      title: "Diagnóstico seguro",
      body: `${contextPrefix}${ignoredPrefix}Vou executar apenas leitura segura. Isso não altera arquivos, serviços, pacotes ou configurações, então não abre Approval Layer.`,
      suggestions: [
        navigate("open-target", "Abrir objeto", target),
        diagnostic("diag-target", "Diagnosticar", diagnosticFor(target), target),
        action("prepare-action", "Preparar ação", `otimiza ${target}`),
      ],
    };
  }

  return {
    title: "Intenção ambígua",
    body: `${ignoredPrefix}Não vou transformar isso em comando. Posso responder, abrir um objeto da galáxia ou rodar um diagnóstico seguro se você especificar o alvo.`,
    suggestions: [
      navigate("open-system", "Abrir Sistema", "system"),
      diagnostic("diag-system", "Diagnosticar sistema", "system-overview", "system"),
    ],
  };
}

function answerFromMemory(memoryContext?: BuiltMemoryContext): string | undefined {
  if (!memoryContext?.notes.length) {
    return undefined;
  }
  const primaryChunk = memoryContext.chunks[0]?.content;
  const primaryNote = memoryContext.notes[0];
  const body = primaryChunk ?? primaryNote.summary;
  if (!body) {
    return undefined;
  }
  const sources = memoryContext.notes
    .slice(0, 4)
    .map((note) => `[${note.kind}] ${note.title}`)
    .join("; ");
  return `${body.trim()}\n\nMemórias usadas: ${sources}`;
}

function summarizeActiveContext(activeContext: ActiveContext, memoryAnswer?: string): string {
  if (memoryAnswer) {
    return memoryAnswer;
  }
  const description = activeContext.description ?? "Objeto selecionado na galáxia neural.";
  const source = activeContext.sourcePath ?? activeContext.memoryNoteId;
  const sourceText = source ? ` Fonte: ${source}.` : "";
  return `${description}${sourceText} Posso detalhar, transformar em plano, resumir relações ou diagnosticar quando for um componente do sistema.`;
}

function explainResponse(input: string, target: string): ConversationResponse {
  if (input.includes("zram")) {
    return {
      title: "ZRAM",
      body: "ZRAM é um bloco de swap comprimido em RAM. No Arch, ela ajuda quando a memória aperta porque comprime páginas antes de jogar pressão para disco. O ponto técnico é observar tamanho, uso, algoritmo e prioridade.",
      suggestions: [
        navigate("open-zram", "Abrir ZRAM", "ram-zram"),
        diagnostic("diag-zram", "Diagnosticar", "ram-zram", "ram-zram"),
        action("optimize-zram", "Preparar otimização", "otimiza minha zram"),
      ],
    };
  }

  if (input.includes("pipewire")) {
    return {
      title: "PipeWire",
      body: "PipeWire é a camada moderna de áudio e vídeo no Linux. No seu Arch ele normalmente trabalha com WirePlumber para gerenciar dispositivos, volume, Bluetooth e apps de áudio.",
      suggestions: [
        navigate("open-audio", "Abrir Áudio", "audio"),
        diagnostic("diag-audio", "Diagnosticar", "audio", "audio"),
        action("restart-pipewire", "Preparar reinício", "reinicia pipewire"),
      ],
    };
  }

  if (input.includes("hyprland")) {
    return {
      title: "Hyprland",
      body: "Hyprland é o compositor Wayland que controla monitores, workspaces, janelas e parte do comportamento visual da sessão. No Neural Core ele aparece como região de interface, não como comando automático.",
      suggestions: [
        navigate("open-hyprland", "Abrir Hyprland", "hyprland"),
        diagnostic("diag-hyprland", "Diagnosticar", "hyprland", "hyprland"),
      ],
    };
  }

  return {
    title: "Resposta técnica",
    body: `Posso explicar ${target}, abrir a região neural relacionada ou rodar um diagnóstico seguro. Não vou criar plano operacional sem pedido claro de alteração.`,
    suggestions: [
      navigate("open-target", "Abrir objeto", target),
      diagnostic("diag-target", "Diagnosticar", diagnosticFor(target), target),
    ],
  };
}

function navigate(id: string, label: string, nodeId: string): ConversationSuggestion {
  return { id, label, kind: "navigate", nodeId };
}

function diagnostic(id: string, label: string, diagnosticKey: string, nodeId?: string): ConversationSuggestion {
  return { id, label, kind: "diagnostic", diagnosticKey, nodeId };
}

function action(id: string, label: string, prompt: string): ConversationSuggestion {
  return { id, label, kind: "action-plan", prompt };
}

function diagnosticFor(nodeId: string): string {
  const map: Record<string, string> = {
    kernel: "kernel",
    system: "system-overview",
    systemd: "systemd",
    hyprland: "hyprland",
    packages: "packages",
    ollama: "ollama",
    bluetooth: "bluetooth",
    network: "network",
    audio: "audio",
    pipewire: "audio",
    gpu: "gpu",
    "ram-zram": "ram-zram",
    zram: "ram-zram",
    storage: "disk",
    disk: "disk",
  };
  return map[nodeId] ?? "system-overview";
}
