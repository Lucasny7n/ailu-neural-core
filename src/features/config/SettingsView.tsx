import { FormEvent, useState } from "react";
import { saveConfigState } from "../system-agent/systemAgentClient";
import { useNeuralStore } from "../../store/useNeuralStore";
import { listProviderStatus } from "../ai-router/aiRouter";
import type { AiProviderStatus, ProviderType } from "../ai-router/aiTypes";
import type { AppConfig } from "./configTypes";

export function SettingsView(): JSX.Element {
  const config = useNeuralStore((state) => state.config);
  const setConfig = useNeuralStore((state) => state.setConfig);
  const addTelemetry = useNeuralStore((state) => state.addTelemetry);
  const [draft, setDraft] = useState(config);
  const [status, setStatus] = useState<AiProviderStatus | null>(null);
  const [checking, setChecking] = useState(false);

  async function checkStatus(): Promise<void> {
    setChecking(true);
    try {
      const s = await listProviderStatus(draft);
      setStatus(s);
    } finally {
      setChecking(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const saved = await saveConfigState({ ...draft, requireApprovalForAllActions: true });
    setConfig(saved);
    addTelemetry({ level: "success", message: "Configurações salvas." });
  }

  return (
    <main className="route-view">
      <header className="route-header">
        <div>
          <span>Configurações</span>
          <h1>Configuração do Sistema</h1>
        </div>
      </header>

      <form className="settings-form" onSubmit={handleSubmit}>
        <section className="settings-section">
          <h2>Inteligência Artificial</h2>
          <label>
            Provedor de IA
            <select
              value={draft.aiProviderType}
              onChange={(event) => setDraft({ ...draft, aiProviderType: event.target.value as ProviderType })}
            >
              <option value="ollama-legacy">Ollama (Legado)</option>
              <option value="openclaude-cli">OpenClaude Bridge</option>
              <option value="openai-compatible">Compatível com OpenAI</option>
              <option value="disabled">Desativado</option>
            </select>
          </label>

          {draft.aiProviderType === "ollama-legacy" && (
            <label>
              Endpoint Ollama
              <input
                value={draft.ollamaBaseUrl}
                onChange={(event) => setDraft({ ...draft, ollamaBaseUrl: event.target.value })}
                placeholder="http://localhost:11434"
              />
            </label>
          )}

          {draft.aiProviderType === "openai-compatible" && (
            <>
              <label>
                Base URL OpenAI
                <input
                  value={draft.openaiBaseUrl}
                  onChange={(event) => setDraft({ ...draft, openaiBaseUrl: event.target.value })}
                  placeholder="https://api.openai.com/v1"
                />
              </label>
              <label>
                API Key (opcional)
                <input
                  type="password"
                  value={draft.openaiApiKey}
                  onChange={(event) => setDraft({ ...draft, openaiApiKey: event.target.value })}
                />
              </label>
            </>
          )}

          <label>
            Modelo principal
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
              {["qwen2.5-coder:1.5b", "qwen2.5-coder:3b", "qwen2.5-coder:7b", "qwen2.5-coder:14b", "claude-3-5-sonnet"].map(m => (
                <button
                  key={m}
                  type="button"
                  className={`hud-button hud-button--micro ${draft.defaultModel === m ? "active" : ""}`}
                  onClick={() => setDraft({ ...draft, defaultModel: m })}
                >
                  {m}
                </button>
              ))}
            </div>
            <input
              style={{ marginTop: "8px" }}
              value={draft.defaultModel}
              onChange={(event) => setDraft({ ...draft, defaultModel: event.target.value })}
              placeholder="ou digite o nome do modelo..."
            />
          </label>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "10px" }}>
            <button type="button" onClick={() => void checkStatus()} disabled={checking}>
              {checking ? "Verificando..." : "Testar Conexão"}
            </button>
            {status && (
              <span style={{ fontSize: "0.8rem", color: status.status === "ready" ? "var(--success)" : "var(--danger)" }}>
                {status.message}
              </span>
            )}
          </div>
        </section>

        <section className="settings-section">
          <h2>Voz e Resposta</h2>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={draft.voiceEnabled}
              onChange={(event) => setDraft({ ...draft, voiceEnabled: event.target.checked })}
            />
            Habilitar reconhecimento de voz
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={draft.voiceAutoSpeak}
              onChange={(event) => setDraft({ ...draft, voiceAutoSpeak: event.target.checked })}
            />
            Falar respostas automaticamente
          </label>
        </section>

        <section className="settings-section">
          <h2>Visual da Galáxia</h2>
          <label>
            Qualidade 3D
            <select
              value={draft.galaxyQuality}
              onChange={(event) => setDraft({ ...draft, galaxyQuality: event.target.value as AppConfig["galaxyQuality"] })}
            >
              <option value="low">Baixa (Performance)</option>
              <option value="medium">Média</option>
              <option value="high">Alta (Recomendado)</option>
              <option value="ultra">Ultra (Glow Máximo)</option>
            </select>
          </label>
          <label>
            Densidade de Partículas
            <select
              value={draft.particleDensity}
              onChange={(event) => setDraft({ ...draft, particleDensity: event.target.value as AppConfig["particleDensity"] })}
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={draft.showSecondaryConnections}
              onChange={(event) => setDraft({ ...draft, showSecondaryConnections: event.target.checked })}
            />
            Mostrar conexões secundárias
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={draft.showOrbits}
              onChange={(event) => setDraft({ ...draft, showOrbits: event.target.checked })}
            />
            Mostrar órbitas planetárias
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={draft.reducedMotion}
              onChange={(event) => setDraft({ ...draft, reducedMotion: event.target.checked })}
            />
            Reduzir animações (Motion)
          </label>
        </section>

        <section className="settings-section">
          <h2>Segurança</h2>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={draft.enableCommandExecution}
              onChange={(event) => setDraft({ ...draft, enableCommandExecution: event.target.checked })}
            />
            Permitir execução de comandos reais
          </label>
          <label className="toggle-row locked">
            <input type="checkbox" checked readOnly />
            Aprovação manual obrigatória para todas as ações
          </label>
        </section>

        <button type="submit" className="hud-button hud-button--primary" style={{ marginTop: "20px", height: "46px" }}>
          Salvar todas as configurações
        </button>
      </form>
    </main>
  );
}
