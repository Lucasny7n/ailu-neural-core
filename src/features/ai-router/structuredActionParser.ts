import type {
  ActionIntent,
  PlannedCommand,
  RiskLevel,
  SystemActionPlan,
} from "./aiTypes";

const validIntents: ActionIntent[] = [
  "diagnose",
  "install",
  "remove",
  "restart-service",
  "edit-config",
  "backup",
  "query",
  "optimize",
  "unknown",
];

const validRisks: RiskLevel[] = ["low", "medium", "high", "critical"];

export function parseStructuredActionPlan(raw: string): SystemActionPlan {
  const json = extractJson(raw);
  const parsed: unknown = JSON.parse(json);
  const plan = normalizePlan(parsed);
  if (!plan) {
    throw new Error("Resposta da IA nao segue o contrato SystemActionPlan.");
  }
  return plan;
}

export function normalizePlan(value: unknown): SystemActionPlan | null {
  if (!isRecord(value)) {
    return null;
  }

  const commandsValue = value.commands;
  if (!Array.isArray(commandsValue)) {
    return null;
  }

  const commands = commandsValue.map(normalizeCommand).filter(isPresent);
  if (commands.length === 0) {
    return null;
  }

  const intent = normalizeIntent(value.intent);
  const riskLevel = normalizeRisk(value.riskLevel ?? value.risk_level);
  const now = new Date().toISOString();

  return {
    id: stringOr(value.id, createId("plan")),
    userRequest: stringOr(value.userRequest ?? value.user_request, ""),
    title: stringOr(value.title, "Plano de ação"),
    description: stringOr(value.description, "Plano estruturado aguardando autorização."),
    intent,
    riskLevel,
    riskSummary: stringOr(value.riskSummary ?? value.risk_summary, "Risco nao detalhado."),
    commands,
    affectedFiles: stringArray(value.affectedFiles ?? value.affected_files),
    affectedPackages: stringArray(value.affectedPackages ?? value.affected_packages),
    affectedServices: stringArray(value.affectedServices ?? value.affected_services),
    targetNodes: stringArray(value.targetNodes ?? value.target_nodes),
    requiresConfirmation: true,
    model: stringOr(value.model, "qwen2.5-coder:1.5b"),
    provider: stringOr(value.provider, "ollama-local"),
    createdAt: stringOr(value.createdAt ?? value.created_at, now),
  };
}

function normalizeCommand(value: unknown): PlannedCommand | null {
  if (!isRecord(value)) {
    return null;
  }
  const command = stringOr(value.command, "").trim();
  if (!command) {
    return null;
  }
  return {
    id: stringOr(value.id, createId("cmd")),
    command,
    description: stringOr(value.description, "Comando planejado"),
    cwd: optionalString(value.cwd),
    timeoutMs: optionalNumber(value.timeoutMs ?? value.timeout_ms),
    requiresSudo: Boolean(value.requiresSudo ?? value.requires_sudo),
    destructive: Boolean(value.destructive),
  };
}

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
  }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

function normalizeIntent(value: unknown): ActionIntent {
  return typeof value === "string" && validIntents.includes(value as ActionIntent)
    ? (value as ActionIntent)
    : "unknown";
}

function normalizeRisk(value: unknown): RiskLevel {
  return typeof value === "string" && validRisks.includes(value as RiskLevel)
    ? (value as RiskLevel)
    : "medium";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
