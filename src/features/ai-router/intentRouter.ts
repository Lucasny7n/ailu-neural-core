import type { IntentResult, OperatorIntent, ResponseMode } from "./intentTypes";
import type { ActiveContext } from "../neural-space/galaxyGraph";

interface IntentRule {
  intent: OperatorIntent;
  responseMode: ResponseMode;
  confidence: number;
  summary: string;
  targetNodes: string[];
  requiresApproval: boolean;
  shouldRunDiagnostics: boolean;
  shouldCreateActionPlan: boolean;
  match: (input: string) => boolean;
}

const actionWords = [
  "apaga",
  "apagar",
  "remove",
  "remover",
  "instala",
  "instalar",
  "reinicia",
  "reiniciar",
  "restart",
  "otimiza",
  "otimizar",
  "limpa",
  "limpar",
  "edita",
  "editar",
  "altera",
  "alterar",
  "corrige",
  "corrigir",
  "prepara",
  "preparar",
  "aplica",
  "aplicar",
  "mata",
  "matar",
  "cria backup",
];

const diagnosticWords = [
  "verifica",
  "verificar",
  "diagnostica",
  "diagnosticar",
  "mostra",
  "mostrar",
  "status",
  "falhando",
  "erros",
  "boa",
  "bom",
  "ok",
  "normal",
];

const feedbackWords = ["horrivel", "horrível", "feio", "ruim", "bugado", "poluido", "poluído", "lento"];

const explainPrefixes = ["o que é", "o que e", "explica", "explique", "me explica", "como funciona"];

const nodeAliases: Array<{ nodeId: string; terms: string[]; diagnosticKey?: string }> = [
  { nodeId: "kernel", terms: ["kernel", "linux"], diagnosticKey: "kernel" },
  { nodeId: "journal-kernel", terms: ["journal", "log do kernel", "erros do kernel"], diagnosticKey: "kernel-logs" },
  { nodeId: "systemd", terms: ["systemd", "servicos", "serviços", "services"], diagnosticKey: "systemd" },
  { nodeId: "hyprland", terms: ["hyprland", "compositor", "workspaces"], diagnosticKey: "hyprland" },
  { nodeId: "quickshell", terms: ["quickshell", "end-4", "end4"] },
  { nodeId: "packages", terms: ["pacman", "yay", "pacotes", "aur"], diagnosticKey: "packages" },
  { nodeId: "ollama", terms: ["ollama", "modelo", "modelos", "qwen"], diagnosticKey: "ollama" },
  { nodeId: "memory", terms: ["memoria do app", "memória do app", "memoria ativa", "memória ativa", "graphiti", "memory"] },
  { nodeId: "bluetooth", terms: ["bluetooth"], diagnosticKey: "bluetooth" },
  { nodeId: "network", terms: ["network", "rede", "wifi", "wi-fi", "dns"], diagnosticKey: "network" },
  { nodeId: "audio", terms: ["audio", "áudio", "som"], diagnosticKey: "audio" },
  { nodeId: "pipewire", terms: ["pipewire"], diagnosticKey: "audio" },
  { nodeId: "wireplumber", terms: ["wireplumber"], diagnosticKey: "audio" },
  { nodeId: "gpu", terms: ["gpu", "video", "vídeo", "radeon", "mesa"], diagnosticKey: "gpu" },
  { nodeId: "ram-zram", terms: ["ram", "zram", "swap", "memoria", "memória"], diagnosticKey: "ram-zram" },
  { nodeId: "storage", terms: ["armazenamento", "storage"], diagnosticKey: "disk" },
  { nodeId: "disk", terms: ["disco", "disk", "ssd"], diagnosticKey: "disk" },
  { nodeId: "actions", terms: ["acoes", "ações", "approval", "aprovação", "aprovacao"] },
];

const rules: IntentRule[] = [
  {
    intent: "conversation",
    responseMode: "answer",
    confidence: 0.96,
    summary: "Saudação ou conversa curta.",
    targetNodes: ["core"],
    requiresApproval: false,
    shouldRunDiagnostics: false,
    shouldCreateActionPlan: false,
    match: (input) => /^(oi|ola|olá|bom dia|boa tarde|boa noite|e ai|e aí)\b/.test(input),
  },
  {
    intent: "app-feedback",
    responseMode: "feedback",
    confidence: 0.92,
    summary: "Feedback sobre a interface ou experiencia do app.",
    targetNodes: ["core"],
    requiresApproval: false,
    shouldRunDiagnostics: false,
    shouldCreateActionPlan: false,
    match: (input) =>
      feedbackWords.some((word) => input.includes(word)) &&
      (input.includes("visual") || input.includes("interface") || input.includes("tela") || input.includes("app")),
  },
  {
    intent: "app-navigation",
    responseMode: "navigate",
    confidence: 0.9,
    summary: "Pedido para abrir ou focar uma area neural.",
    targetNodes: [],
    requiresApproval: false,
    shouldRunDiagnostics: false,
    shouldCreateActionPlan: false,
    match: (input) => /^(abre|abrir|vai para|foca|focar|mostra o nó|mostra no)\b/.test(input),
  },
  {
    intent: "explain",
    responseMode: "answer",
    confidence: 0.9,
    summary: "Pedido de explicação conceitual.",
    targetNodes: [],
    requiresApproval: false,
    shouldRunDiagnostics: false,
    shouldCreateActionPlan: false,
    match: (input) => explainPrefixes.some((prefix) => input.startsWith(prefix)),
  },
  {
    intent: "question",
    responseMode: "answer",
    confidence: 0.82,
    summary: "Pergunta sem pedido de execução.",
    targetNodes: [],
    requiresApproval: false,
    shouldRunDiagnostics: false,
    shouldCreateActionPlan: false,
    match: (input) => input.endsWith("?") && !diagnosticWords.some((word) => input.includes(word)),
  },
  {
    intent: "system-action",
    responseMode: "action-plan",
    confidence: 0.94,
    summary: "Pedido de alteração real ou operação com risco.",
    targetNodes: [],
    requiresApproval: true,
    shouldRunDiagnostics: false,
    shouldCreateActionPlan: true,
    match: (input) => actionWords.some((word) => input.includes(word)),
  },
  {
    intent: "safe-diagnostic",
    responseMode: "diagnostic",
    confidence: 0.86,
    summary: "Pedido de leitura segura ou verificação sem alteração.",
    targetNodes: [],
    requiresApproval: false,
    shouldRunDiagnostics: true,
    shouldCreateActionPlan: false,
    match: (input) => diagnosticWords.some((word) => input.includes(word)),
  },
];

export function classifyOperatorIntent(rawInput: string): IntentResult {
  const input = normalizeInput(rawInput);
  const matchedRule = rules.find((rule) => rule.match(input));
  const targets = inferTargetNodes(input);

  if (!matchedRule) {
    return {
      intent: "unknown",
      confidence: 0.44,
      summary: "Intenção ambígua. Responder sem executar comandos.",
      targetNodes: targets.length ? targets : ["core"],
      requiresApproval: false,
      shouldRunDiagnostics: false,
      shouldCreateActionPlan: false,
      responseMode: "answer",
    };
  }

  return {
    intent: matchedRule.intent,
    confidence: matchedRule.confidence,
    summary: matchedRule.summary,
    targetNodes: targets.length ? targets : defaultTargetsFor(matchedRule.intent),
    requiresApproval: matchedRule.requiresApproval,
    shouldRunDiagnostics: matchedRule.shouldRunDiagnostics,
    shouldCreateActionPlan: matchedRule.shouldCreateActionPlan,
    responseMode: matchedRule.responseMode,
  };
}

export function inferTargetNodes(rawInput: string): string[] {
  const input = normalizeInput(rawInput);
  const matches = nodeAliases
    .filter((alias) => alias.terms.some((term) => input.includes(term)))
    .map((alias) => alias.nodeId);
  return [...new Set(matches)];
}

export function diagnosticKeyForNode(nodeId: string): string | undefined {
  return nodeAliases.find((alias) => alias.nodeId === nodeId)?.diagnosticKey;
}

export interface ActiveContextIntentResolution {
  intent: IntentResult;
  activeContextUsed: boolean;
  activeContextIgnoredReason?: string;
}

export function resolveIntentWithActiveContext(
  rawInput: string,
  intentResult: IntentResult,
  activeContext?: ActiveContext,
): ActiveContextIntentResolution {
  if (!activeContext) {
    return { intent: intentResult, activeContextUsed: false };
  }

  if (intentResult.intent === "conversation" || intentResult.intent === "app-feedback") {
    return { intent: intentResult, activeContextUsed: false };
  }

  const input = normalizeInput(rawInput);
  const explicitTargets = inferTargetNodes(input);
  const activeNodeId = activeContext.nodeId ?? activeContext.id;
  const hasExplicitDifferentTarget = explicitTargets.some((target) => target !== activeNodeId);
  const asksFromContext = intentResult.requiresApproval
    ? hasExplicitContextReference(input)
    : isContextualRequest(input);
  const isActionAboutNewTarget = intentResult.requiresApproval && !asksFromContext;

  if (hasExplicitDifferentTarget || isActionAboutNewTarget) {
    return {
      intent: {
        ...intentResult,
        targetNodes: explicitTargets.length ? explicitTargets : intentResult.targetNodes,
      },
      activeContextUsed: false,
      activeContextIgnoredReason: explicitTargets.length
        ? `Contexto ativo ignorado: comando direcionado para ${explicitTargets.join(", ")}.`
        : "Contexto ativo ignorado: o pedido indica uma ação sobre outro alvo.",
    };
  }

  if (!asksFromContext) {
    return { intent: intentResult, activeContextUsed: false };
  }

  const targetNodes = [activeNodeId];
  const responseMode: ResponseMode =
    intentResult.responseMode === "action-plan" && input.includes("plano") ? "action-plan" : intentResult.responseMode === "diagnostic" ? "diagnostic" : "answer";
  const intent: OperatorIntent =
    responseMode === "diagnostic" ? "safe-diagnostic" : responseMode === "action-plan" ? "system-action" : "question";

  return {
    intent: {
      ...intentResult,
      intent,
      responseMode,
      targetNodes,
      requiresApproval: responseMode === "action-plan",
      shouldCreateActionPlan: responseMode === "action-plan",
      shouldRunDiagnostics: responseMode === "diagnostic",
      confidence: Math.max(intentResult.confidence, 0.88),
      summary: `Pedido referencial usando Contexto Ativo: ${activeContext.title}.`,
    },
    activeContextUsed: true,
  };
}

function defaultTargetsFor(intent: OperatorIntent): string[] {
  if (intent === "app-feedback" || intent === "conversation" || intent === "unknown") {
    return ["core"];
  }
  return ["system"];
}

function normalizeInput(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isContextualRequest(input: string): boolean {
  const shortRequest = input.split(/\s+/).filter(Boolean).length <= 5;
  return shortRequest || hasExplicitContextReference(input);
}

function hasExplicitContextReference(input: string): boolean {
  const contextualTerms = [
    "isso",
    "isto",
    "aqui",
    "esse",
    "essa",
    "este",
    "esta",
    "deste",
    "dessa",
    "nesse",
    "nessa",
    "selecionado",
    "contexto",
    "arquivo",
    "memoria",
    "resuma",
    "resume",
    "explica",
    "explique",
    "melhore",
    "organiza",
    "decisoes",
    "decisao",
    "detalha",
    "transforma",
    "com base nisso",
    "base nisso",
    "errado",
    "normal",
  ];
  return contextualTerms.some((term) => input.includes(term));
}
