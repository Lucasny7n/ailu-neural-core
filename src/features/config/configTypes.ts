export type ProviderType =
  | "openclaude-cli"
  | "openai-compatible"
  | "ollama-legacy"
  | "disabled";

export interface AppConfig {
  aiProviderType: ProviderType;
  defaultModel: string;
  ollamaBaseUrl: string;
  openaiBaseUrl: string;
  openaiApiKey: string;
  theme: "neural-dark";
  galaxyQuality: "low" | "medium" | "high" | "ultra";
  particleDensity: "low" | "medium" | "high";
  showSecondaryConnections: boolean;
  showOrbits: boolean;
  reducedMotion: boolean;
  maxParticles: number;
  enableCommandExecution: boolean;
  requireApprovalForAllActions: true;
  voiceEnabled: boolean;
  voiceAutoSpeak: boolean;
}

export const defaultAppConfig: AppConfig = {
  aiProviderType: "ollama-legacy",
  defaultModel: "qwen2.5-coder:1.5b",
  ollamaBaseUrl: "http://localhost:11434",
  openaiBaseUrl: "",
  openaiApiKey: "",
  theme: "neural-dark",
  galaxyQuality: "high",
  particleDensity: "medium",
  showSecondaryConnections: true,
  showOrbits: true,
  reducedMotion: false,
  maxParticles: 1000,
  enableCommandExecution: true,
  requireApprovalForAllActions: true,
  voiceEnabled: true,
  voiceAutoSpeak: false,
};
