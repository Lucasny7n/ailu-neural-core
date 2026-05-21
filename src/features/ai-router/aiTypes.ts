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

export interface AiProviderConfig {
  id: "ollama-local";
  name: string;
  type: "local";
  baseUrl: string;
  defaultModel: string;
  enabled: boolean;
}

export interface OllamaModel {
  name: string;
  modifiedAt?: string;
  size?: number;
}

export interface AiProviderStatus {
  providerId: string;
  status: "ready" | "not_configured" | "unavailable" | "running" | "error";
  message: string;
  models: OllamaModel[];
}

export interface ActionPlanResult {
  plan: SystemActionPlan;
  source: "ollama" | "fallback";
  providerStatus: AiProviderStatus;
}
