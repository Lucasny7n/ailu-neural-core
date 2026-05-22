import { invoke } from "@tauri-apps/api/core";
import type { AiProviderStatus } from "./aiTypes";

export async function getOpenClaudeStatus(): Promise<AiProviderStatus> {
  try {
    const version = await invoke<string>("ai_provider_check_openclaude");
    return {
      providerId: "openclaude-cli",
      status: "ready",
      message: `OpenClaude CLI detectado: ${version}`,
      models: [{ name: "Claude 3.5 Sonnet (via CLI)", id: "claude-3-5-sonnet" }],
    };
  } catch (error) {
    return {
      providerId: "openclaude-cli",
      status: "unavailable",
      message: error instanceof Error ? error.message : String(error),
      models: [],
    };
  }
}

export async function generatePlanWithOpenClaude(prompt: string): Promise<string> {
  try {
    return await invoke<string>("ai_provider_run_openclaude_prompt", { prompt });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}
