export interface AppConfig {
  defaultProvider: string;
  defaultModel: string;
  ollamaBaseUrl: string;
  theme: "neural-dark";
  reducedMotion: boolean;
  maxParticles: number;
  enableCommandExecution: boolean;
  requireApprovalForAllActions: true;
}

export const defaultAppConfig: AppConfig = {
  defaultProvider: "ollama-local",
  defaultModel: "qwen2.5-coder:1.5b",
  ollamaBaseUrl: "http://localhost:11434",
  theme: "neural-dark",
  reducedMotion: false,
  maxParticles: 700,
  enableCommandExecution: true,
  requireApprovalForAllActions: true,
};
