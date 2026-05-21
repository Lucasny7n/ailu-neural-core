import type { AppConfig } from "../config/configTypes";
import type { AiProviderStatus, OllamaModel } from "./aiTypes";

interface OllamaTagsResponse {
  models?: Array<{
    name?: string;
    modified_at?: string;
    size?: number;
  }>;
}

interface OllamaGenerateResponse {
  response?: string;
  error?: string;
}

export async function getOllamaStatus(config: AppConfig): Promise<AiProviderStatus> {
  try {
    const response = await fetchWithTimeout(`${config.ollamaBaseUrl}/api/tags`, {
      method: "GET",
    });
    if (!response.ok) {
      return {
        providerId: "ollama-local",
        status: "error",
        message: `Ollama respondeu HTTP ${response.status}.`,
        models: [],
      };
    }
    const payload = (await response.json()) as OllamaTagsResponse;
    const models = normalizeModels(payload);
    const hasDefaultModel = models.some((model) => model.name === config.defaultModel);
    return {
      providerId: "ollama-local",
      status: hasDefaultModel || models.length > 0 ? "ready" : "not_configured",
      message: hasDefaultModel
        ? "Ollama local pronto com modelo padrao instalado."
        : models.length > 0
          ? "Ollama local responde, mas o modelo padrao nao foi encontrado."
          : "Ollama local responde sem modelos instalados.",
      models,
    };
  } catch (error) {
    return {
      providerId: "ollama-local",
      status: "unavailable",
      message: error instanceof Error ? error.message : "Ollama indisponivel.",
      models: [],
    };
  }
}

export async function generatePlanWithOllama(prompt: string, config: AppConfig): Promise<string> {
  const response = await fetchWithTimeout(`${config.ollamaBaseUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.defaultModel,
      prompt,
      stream: false,
      format: "json",
    }),
  }, 45_000);

  if (!response.ok) {
    throw new Error(`Ollama generate HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as OllamaGenerateResponse;
  if (payload.error) {
    throw new Error(payload.error);
  }
  if (!payload.response) {
    throw new Error("Ollama retornou resposta vazia.");
  }
  return payload.response;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = 5_000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

function normalizeModels(payload: OllamaTagsResponse): OllamaModel[] {
  return (payload.models ?? [])
    .filter((model) => typeof model.name === "string")
    .map((model) => ({
      name: model.name ?? "",
      modifiedAt: model.modified_at,
      size: model.size,
    }));
}
