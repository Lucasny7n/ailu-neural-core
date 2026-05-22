import { useEffect, useState } from "react";
import { ApprovalLayer } from "../approval/ApprovalLayer";
import { listProviderStatus } from "../ai-router/aiRouter";
import type { AiProviderStatus } from "../ai-router/aiTypes";
import { useMemoryStore } from "../memory-core/useMemoryStore";
import { useNeuralStore } from "../../store/useNeuralStore";
import { ActiveContextBridge } from "./ActiveContextBridge";
import { ContextAwareCommandConsole } from "./ContextAwareCommandConsole";
import { GalaxyBreadcrumb } from "./GalaxyBreadcrumb";
import { NeuralGalaxyScene } from "./NeuralGalaxyScene";
import { OperatorStatusPanel } from "./OperatorStatusPanel";
import { SelectedObjectPanel } from "./SelectedObjectPanel";
import { TelemetryDeck } from "./TelemetryDeck";

export function AiluNeuralSpace(): JSX.Element {
  const selectedConnectionId = useNeuralStore((state) => state.selectedConnectionId);
  return (
    <main className="neural-space">
      <NeuralGalaxyScene />
      <ActiveContextBridge />
      <div className={`travel-vignette ${selectedConnectionId ? "is-active" : ""}`} />
      <div className="hud-layer">
        <NeuralTopbar />
        <OperatorStatusPanel />
        <GalaxyBreadcrumb />
        <SelectedObjectPanel />
        <ContextAwareCommandConsole />
        <TelemetryDeck />
      </div>
      <ApprovalLayer />
    </main>
  );
}

function NeuralTopbar(): JSX.Element {
  const config = useNeuralStore((state) => state.config);
  const activePlan = useNeuralStore((state) => state.activePlan);
  const activeContext = useNeuralStore((state) => state.activeContext);
  const returnToCore = useNeuralStore((state) => state.returnToCore);
  const memoryStats = useMemoryStore((state) => state.stats);
  const [providerStatus, setProviderStatus] = useState<AiProviderStatus | null>(null);

  useEffect(() => {
    let alive = true;
    listProviderStatus(config).then((status) => {
      if (alive) {
        setProviderStatus(status);
      }
    });
    return () => {
      alive = false;
    };
  }, [config]);

  return (
    <header className="neural-topbar hud-corners">
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <strong>AILU NEURAL CORE</strong>
        <span>IA: {providerStatus?.status === "ready" ? "Online" : "Offline"}</span>
        <span>Memória: {memoryStats && memoryStats.notes > 0 ? "Ativa" : "Vazia"}</span>
        <span>Aprovação: {activePlan ? "Pendente" : "Protegida"}</span>
      </div>
      
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <span>Contexto: <strong>{activeContext?.title ?? "Geral"}</strong></span>
        <button type="button" className="hud-button hud-button--micro" onClick={returnToCore}>
          Ver galáxia inteira
        </button>
      </div>
    </header>
  );
}
