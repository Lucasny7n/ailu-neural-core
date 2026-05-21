import { safeInvoke } from "../../lib/tauri";
import type { SystemActionPlan } from "../ai-router/aiTypes";
import { defaultAppConfig, type AppConfig } from "../config/configTypes";
import type {
  ActionSummary,
  CommandExecutionLog,
  DiagnosticResult,
  ExecuteApprovedActionInput,
  SystemSnapshot,
} from "./systemTypes";

export async function getSystemSnapshot(): Promise<SystemSnapshot> {
  return safeInvoke<SystemSnapshot>("get_system_snapshot");
}

export async function runSafeDiagnostic(key: string): Promise<DiagnosticResult> {
  return safeInvoke<DiagnosticResult>("run_safe_diagnostic", { key });
}

export async function recordSystemAction(plan: SystemActionPlan, status = "planned"): Promise<void> {
  await safeInvoke<void>("record_system_action", { plan, status });
}

export async function executeApprovedAction(
  input: ExecuteApprovedActionInput,
): Promise<CommandExecutionLog[]> {
  return safeInvoke<CommandExecutionLog[]>("execute_approved_action", {
    actionId: input.actionId,
    approvalToken: input.approvalToken,
    commands: input.commands,
  });
}

export async function listRecentActions(limit = 50): Promise<ActionSummary[]> {
  return safeInvoke<ActionSummary[]>("list_recent_actions", { limit });
}

export async function getConfigState(): Promise<AppConfig> {
  try {
    return await safeInvoke<AppConfig>("get_config_state");
  } catch {
    return defaultAppConfig;
  }
}

export async function saveConfigState(config: AppConfig): Promise<AppConfig> {
  try {
    return await safeInvoke<AppConfig>("save_config_state", {
      config: { ...config, requireApprovalForAllActions: true },
    });
  } catch {
    return { ...config, requireApprovalForAllActions: true };
  }
}
