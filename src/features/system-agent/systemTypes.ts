import type { PlannedCommand, SystemActionPlan } from "../ai-router/aiTypes";
import type { AppConfig } from "../config/configTypes";

export interface CommandExecutionLog {
  id: string;
  actionId: string;
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  createdAt: string;
}

export interface DiagnosticResult {
  key: string;
  title: string;
  status: "success" | "warning" | "error";
  output: string;
  generatedAt: string;
}

export interface SystemSnapshot {
  generatedAt: string;
  kernel: string;
  hostname: string;
  uptime: string;
  memory: string;
  swap: string;
  disk: string;
  failedUnits: string;
  hyprland: string;
  ollama: string;
  gpu: string;
}

export interface ActionSummary {
  id: string;
  userRequest: string;
  title: string;
  intent: string;
  riskLevel: string;
  status: string;
  provider: string;
  model: string;
  createdAt: string;
}

export interface ExecuteApprovedActionInput {
  actionId: string;
  approvalToken: string;
  commands: PlannedCommand[];
}

export type { AppConfig, SystemActionPlan };
