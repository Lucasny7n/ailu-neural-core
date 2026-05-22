import type { AppConfig } from "../config/configTypes";
import type { BuiltMemoryContext } from "../memory-core/memoryTypes";
import type { ActiveContext } from "../neural-space/galaxyGraph";
import type { ActionPlanResult, AiProviderStatus } from "./aiTypes";
import { createFallbackPlan } from "./fallbackPlanner";
import { generatePlanWithOllama, getOllamaStatus } from "./ollamaClient";
import { buildPlannerPrompt } from "./plannerPrompt";
import { parseStructuredActionPlan } from "./structuredActionParser";
import { generatePlanWithOpenClaude, getOpenClaudeStatus } from "./openClaudeClient";
import { generatePlanWithOpenAiCompatible, getOpenAiCompatibleStatus } from "./openAiCompatibleClient";

export async function listProviderStatus(config: AppConfig): Promise<AiProviderStatus> {
  switch (config.aiProviderType) {
    case "openclaude-cli":
      return getOpenClaudeStatus();
    case "openai-compatible":
      return getOpenAiCompatibleStatus(config.openaiBaseUrl, config.openaiApiKey);
    case "ollama-legacy":
      return getOllamaStatus(config);
    default:
      return {
        providerId: "disabled",
        status: "not_configured",
        message: "IA desativada.",
        models: [],
      };
  }
}

export async function generateSystemActionPlan(
  userRequest: string,
  config: AppConfig,
  memoryContext?: BuiltMemoryContext,
  activeContext?: ActiveContext,
): Promise<ActionPlanResult> {
  const providerStatus = await listProviderStatus(config);

  if (providerStatus.status === "ready") {
    try {
      const prompt = buildPlannerPrompt(userRequest, config, memoryContext, activeContext);
      let raw = "";

      switch (config.aiProviderType) {
        case "openclaude-cli":
          raw = await generatePlanWithOpenClaude(prompt);
          break;
        case "openai-compatible":
          raw = await generatePlanWithOpenAiCompatible(prompt, config.openaiBaseUrl, config.defaultModel, config.openaiApiKey);
          break;
        case "ollama-legacy":
          raw = await generatePlanWithOllama(prompt, config);
          break;
      }

      const plan = parseStructuredActionPlan(raw);
      return {
        plan: {
          ...plan,
          userRequest,
          provider: config.aiProviderType,
          model: config.defaultModel,
          requiresConfirmation: true,
        },
        providerStatus,
        source: "ai",
      };
    } catch (error) {
      console.error("AI Generation failed:", error);
      const fallbackPlan = createFallbackPlan(userRequest, config);
      return { plan: fallbackPlan, providerStatus, source: "fallback" };
    }
  }

  const fallbackPlan = createFallbackPlan(userRequest, config);
  return { plan: fallbackPlan, providerStatus, source: "fallback" };
}
