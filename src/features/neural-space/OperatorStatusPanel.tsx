import { useEffect, useState } from "react";
import { listProviderStatus } from "../ai-router/aiRouter";
import type { AiProviderStatus } from "../ai-router/aiTypes";
import { getSystemSnapshot, listRecentActions } from "../system-agent/systemAgentClient";
import { useNeuralStore } from "../../store/useNeuralStore";

export function OperatorStatusPanel(): JSX.Element {
  const config = useNeuralStore((state) => state.config);
  const activePlan = useNeuralStore((state) => state.activePlan);
  const snapshot = useNeuralStore((state) => state.snapshot);
  const setSnapshot = useNeuralStore((state) => state.setSnapshot);
  const setRecentActions = useNeuralStore((state) => state.setRecentActions);
  const addTelemetry = useNeuralStore((state) => state.addTelemetry);
  const [providerStatus, setProviderStatus] = useState<AiProviderStatus | null>(null);

  useEffect(() => {
    let alive = true;
    listProviderStatus(config).then((status) => {
      if (alive) {
        setProviderStatus(status);
      }
    });
    getSystemSnapshot()
      .then((nextSnapshot) => {
        if (alive) {
          setSnapshot(nextSnapshot);
        }
      })
      .catch(() => {
        addTelemetry({ level: "warn", message: "Snapshot do System Agent indisponivel fora do Tauri." });
      });
    listRecentActions(12)
      .then((actions) => {
        if (alive) {
          setRecentActions(actions);
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [addTelemetry, config, setRecentActions, setSnapshot]);

  return (
    <aside className="hud-panel left-panel">
      <div className="hud-kicker">OPERATOR STATUS</div>
      <h1>Ailu Neural Space</h1>
      <div className="status-list">
        <StatusLine label="Provider" value="Ollama Local" tone={providerStatus?.status === "ready" ? "success" : "warn"} />
        <StatusLine label="Modelo" value={config.defaultModel} />
        <StatusLine label="Ollama" value={providerStatus?.message ?? "verificando"} />
        <StatusLine label="Sistema" value={snapshot?.kernel ?? "aguardando Tauri"} />
        <StatusLine label="Ações pendentes" value={activePlan ? "1 aguardando operador" : "0"} tone={activePlan ? "approval" : "success"} />
      </div>
    </aside>
  );
}

function StatusLine({
  label,
  value,
  tone = "info",
}: {
  label: string;
  value: string;
  tone?: "info" | "success" | "warn" | "approval";
}): JSX.Element {
  return (
    <div className={`status-line tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
