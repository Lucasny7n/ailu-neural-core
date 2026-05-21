import { FormEvent, useState } from "react";
import { saveConfigState } from "../system-agent/systemAgentClient";
import { useNeuralStore } from "../../store/useNeuralStore";

export function SettingsView(): JSX.Element {
  const config = useNeuralStore((state) => state.config);
  const setConfig = useNeuralStore((state) => state.setConfig);
  const addTelemetry = useNeuralStore((state) => state.addTelemetry);
  const [draft, setDraft] = useState(config);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const saved = await saveConfigState({ ...draft, requireApprovalForAllActions: true });
    setConfig(saved);
    addTelemetry({ level: "success", message: "Configuracoes salvas." });
  }

  return (
    <main className="route-view">
      <header className="route-header">
        <div>
          <span>SETTINGS</span>
          <h1>Configuração local</h1>
        </div>
      </header>
      <form className="settings-form" onSubmit={handleSubmit}>
        <label>
          Endpoint Ollama
          <input
            value={draft.ollamaBaseUrl}
            onChange={(event) => setDraft({ ...draft, ollamaBaseUrl: event.target.value })}
          />
        </label>
        <label>
          Modelo padrão
          <input
            value={draft.defaultModel}
            onChange={(event) => setDraft({ ...draft, defaultModel: event.target.value })}
          />
        </label>
        <label>
          Partículas máximas
          <input
            type="number"
            min={80}
            max={1400}
            value={draft.maxParticles}
            onChange={(event) => setDraft({ ...draft, maxParticles: Number(event.target.value) })}
          />
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={draft.reducedMotion}
            onChange={(event) => setDraft({ ...draft, reducedMotion: event.target.checked })}
          />
          Reduced motion
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={draft.enableCommandExecution}
            onChange={(event) => setDraft({ ...draft, enableCommandExecution: event.target.checked })}
          />
          Execução habilitada
        </label>
        <label className="toggle-row locked">
          <input type="checkbox" checked readOnly />
          Aprovação obrigatória para todas as ações
        </label>
        <button type="submit">Salvar</button>
      </form>
    </main>
  );
}
