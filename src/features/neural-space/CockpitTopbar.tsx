import { useEffect, useState } from "react";
import { listProviderStatus } from "../ai-router/aiRouter";
import type { AiProviderStatus } from "../ai-router/aiTypes";
import { useMemoryStore } from "../memory-core/useMemoryStore";
import { useNeuralStore } from "../../store/useNeuralStore";

export function CockpitTopbar(): JSX.Element {
  const config = useNeuralStore((state) => state.config);
  const activePlan = useNeuralStore((state) => state.activePlan);
  const viewMode = useNeuralStore((state) => state.viewMode);
  const memoryStats = useMemoryStore((state) => state.stats);
  const getMemoryStats = useMemoryStore((state) => state.getStats);
  const [providerStatus, setProviderStatus] = useState<AiProviderStatus | null>(null);
  const [systemTime, setSystemTime] = useState(() => new Date().toLocaleTimeString("pt-BR"));

  useEffect(() => {
    const timer = window.setInterval(() => setSystemTime(new Date().toLocaleTimeString("pt-BR")), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let alive = true;
    listProviderStatus(config).then((status) => {
      if (alive) {
        setProviderStatus(status);
      }
    });
    void getMemoryStats();
    return () => {
      alive = false;
    };
  }, [config, getMemoryStats]);

  return (
    <header className="ailu-topbar hud-grid-bg" aria-label="Estado do cockpit">
      <div className="ailu-brand">
        <div className="ailu-brand__sigil" aria-hidden="true">
          <span />
        </div>
        <div>
          <strong>AILU NEURAL CORE</strong>
          <span>Console do Operador</span>
        </div>
      </div>
      <div className="ailu-topbar__metrics">
        <Metric label="Estado do Núcleo" value="Operacional" tone="success" />
        <Metric
          label="Modo da IA"
          value={providerStatus?.status === "ready" ? "Online" : providerStatus?.status === "running" ? "Executando" : "N/D"}
          tone={providerStatus?.status === "ready" ? "cyan" : "warn"}
        />
        <Metric label="Memória" value={memoryStats && memoryStats.notes > 0 ? "Ativa" : "Vazia"} tone="memory" />
        <Metric label="Aprovação" value={activePlan ? "Pendente" : "Protegida"} tone={activePlan ? "approval" : "success"} />
        <Metric label="Hora do Sistema" value={systemTime} />
        <Metric label="Link Neural" value={viewMode === "cockpit" ? "Cockpit" : "Exploração"} tone="cyan" />
        <Metric label="Operador" value="Nível V7" tone="cyan" />
      </div>
    </header>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "cyan" | "success" | "warn" | "approval" | "memory";
}): JSX.Element {
  return (
    <div className={`ailu-topbar__metric tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
