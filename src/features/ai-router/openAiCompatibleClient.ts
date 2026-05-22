import type { AiProviderStatus } from "./aiTypes";

interface OpenAIModel {
  id: string;
  object: string;
}

interface OpenAIModelsResponse {
  data: OpenAIModel[];
}

interface OpenAIChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function getOpenAiCompatibleStatus(baseUrl: string, apiKey?: string): Promise<AiProviderStatus> {
  if (!baseUrl) {
    return {
      providerId: "openai-compatible",
      status: "not_configured",
      message: "Base URL não configurada.",
      models: [],
    };
  }

  try {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${baseUrl}/models`, { headers });
    if (!response.ok) {
      return {
        providerId: "openai-compatible",
        status: "error",
        message: `Servidor retornou HTTP ${response.status}`,
        models: [],
      };
    }

    const payload = (await response.json()) as OpenAIModelsResponse;
    return {
      providerId: "openai-compatible",
      status: "ready",
      message: "Servidor compatível com OpenAI pronto.",
      models: payload.data.map(m => ({ name: m.id, id: m.id })),
    };
  } catch (error) {
    return {
      providerId: "openai-compatible",
      status: "unavailable",
      message: error instanceof Error ? error.message : "Servidor indisponível.",
      models: [],
    };
  }
}

export async function generatePlanWithOpenAiCompatible(
  prompt: string,
  baseUrl: string,
  model: string,
  apiKey?: string
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI-compatible HTTP ${response.status}`);
  }

  const payload = (await response.json()) as OpenAIChatResponse;
  const content = payload.choices[0]?.message.content;
  if (!content) {
    throw new Error("Resposta vazia do servidor.");
  }
  return content;
}
