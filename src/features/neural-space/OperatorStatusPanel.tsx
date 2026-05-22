import { useEffect, useState } from "react";
import { listProviderStatus } from "../ai-router/aiRouter";
import type { AiProviderStatus } from "../ai-router/aiTypes";
import { useMemoryStore } from "../memory-core/useMemoryStore";
import { getSystemSnapshot, listRecentActions } from "../system-agent/systemAgentClient";
import { useNeuralStore } from "../../store/useNeuralStore";

export function OperatorStatusPanel(): JSX.Element {
  const config = useNeuralStore((state) => state.config);
  const activePlan = useNeuralStore((state) => state.activePlan);
  const activeContext = useNeuralStore((state) => state.activeContext);
  const snapshot = useNeuralStore((state) => state.snapshot);
  const recentActions = useNeuralStore((state) => state.recentActions);
  const setSnapshot = useNeuralStore((state) => state.setSnapshot);
  const setRecentActions = useNeuralStore((state) => state.setRecentActions);
  const addTelemetry = useNeuralStore((state) => state.addTelemetry);
  const memoryStats = useMemoryStore((state) => state.stats);
  const getMemoryStats = useMemoryStore((state) => state.getStats);
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
        addTelemetry({ level: "warn", message: "Snapshot do System Agent indisponível fora do Tauri." });
      });
    listRecentActions(12)
      .then((actions) => {
        if (alive) {
          setRecentActions(actions);
        }
      })
      .catch(() => undefined);
    void getMemoryStats();
    return () => {
      alive = false;
    };
  }, [addTelemetry, config, getMemoryStats, setRecentActions, setSnapshot]);

  return (
    <aside className="hud-panel left-panel hud-corners">
      <div className="hud-kicker">Painel compacto</div>
      <h1 className="hud-title">Núcleo operacional</h1>
      <div className="status-grid-compact">
        <StatusLine label="Contexto" value={activeContext?.title ?? "nenhum"} tone={activeContext ? "success" : "info"} />
        <StatusLine label="Influência" value={activeContext ? influenceLabel(activeContext.relatedIds.length) : "Baixa"} />
        <StatusLine label="IA" value={providerStatus?.status === "ready" ? "Pronto" : "Offline"} tone={providerStatus?.status === "ready" ? "success" : "warn"} />
        <StatusLine label="Modelo" value={config.defaultModel} />
        <StatusLine label="Memória" value={memoryStats ? `${memoryStats.notes} notas` : "indisponível"} tone={memoryStats && memoryStats.notes > 0 ? "success" : "warn"} />
        <StatusLine label="Chunks" value={memoryStats ? String(memoryStats.chunks) : "indisponível"} />
        <StatusLine label="Sistema" value={snapshot ? "Saúde lida" : "indisponível"} tone={snapshot ? "success" : "warn"} />
        <StatusLine label="Ações" value={activePlan ? "pendente" : String(recentActions.length)} tone={activePlan ? "approval" : "info"} />
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

function influenceLabel(count: number): string {
  if (count >= 4) {
    return "Alta";
  }
  if (count >= 2) {
    return "Média";
  }
  return "Baixa";
}
