import type { AppConfig } from "../config/configTypes";
import type { ActionPlanResult, AiProviderConfig, AiProviderStatus } from "./aiTypes";
import { createFallbackPlan } from "./fallbackPlanner";
import { generatePlanWithOllama, getOllamaStatus } from "./ollamaClient";
import { buildPlannerPrompt } from "./plannerPrompt";
import { parseStructuredActionPlan } from "./structuredActionParser";

export function buildDefaultProvider(config: AppConfig): AiProviderConfig {
  return {
    id: "ollama-local",
    name: "Ollama Local",
    type: "local",
    baseUrl: config.ollamaBaseUrl,
    defaultModel: config.defaultModel,
    enabled: true,
  };
}

export async function listProviderStatus(config: AppConfig): Promise<AiProviderStatus> {
  return getOllamaStatus(config);
}

export async function generateSystemActionPlan(
  userRequest: string,
  config: AppConfig,
): Promise<ActionPlanResult> {
  const providerStatus = await getOllamaStatus(config);

  if (providerStatus.status === "ready") {
    try {
      const prompt = buildPlannerPrompt(userRequest, config);
      const raw = await generatePlanWithOllama(prompt, config);
      const plan = parseStructuredActionPlan(raw);
      return {
        plan: {
          ...plan,
          userRequest,
          provider: "ollama-local",
          model: config.defaultModel,
          requiresConfirmation: true,
        },
        providerStatus,
        source: "ollama",
      };
    } catch {
      const fallbackPlan = createFallbackPlan(userRequest, config);
      return { plan: fallbackPlan, providerStatus, source: "fallback" };
    }
  }

  const fallbackPlan = createFallbackPlan(userRequest, config);
  return { plan: fallbackPlan, providerStatus, source: "fallback" };
}
