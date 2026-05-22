export type ActionIntent =
  | "diagnose"
  | "install"
  | "remove"
  | "restart-service"
  | "edit-config"
  | "backup"
  | "query"
  | "optimize"
  | "unknown";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface PlannedCommand {
  id: string;
  command: string;
  description: string;
  cwd?: string;
  timeoutMs?: number;
  requiresSudo: boolean;
  destructive: boolean;
}

export interface SystemActionPlan {
  id: string;
  userRequest: string;
  title: string;
  description: string;
  intent: ActionIntent;
  riskLevel: RiskLevel;
  riskSummary: string;
  commands: PlannedCommand[];
  affectedFiles: string[];
  affectedPackages: string[];
  affectedServices: string[];
  targetNodes: string[];
  requiresConfirmation: true;
  model: string;
  provider: string;
  createdAt: string;
}

export type ProviderType =
  | "openclaude-cli"
  | "openai-compatible"
  | "ollama-legacy"
  | "disabled";

export interface AiProviderConfig {
  id: string;
  name: string;
  type: ProviderType;
  enabled: boolean;
  baseUrl?: string;
  apiKey?: string;
  defaultModel: string;
  command?: string;
}

export interface AiModel {
  name: string;
  id: string;
  details?: string;
}

export interface AiProviderStatus {
  providerId: string;
  status: "ready" | "not_configured" | "unavailable" | "running" | "error";
  message: string;
  models: AiModel[];
}

export interface ActionPlanResult {
  plan: SystemActionPlan;
  source: "ai" | "fallback";
  providerStatus: AiProviderStatus;
}
