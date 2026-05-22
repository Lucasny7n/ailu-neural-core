import { useEffect, useState } from "react";
import { listProviderStatus } from "../ai-router/aiRouter";
import type { AiProviderStatus } from "../ai-router/aiTypes";
import { useMemoryStore } from "../memory-core/useMemoryStore";
import { useNeuralStore } from "../../store/useNeuralStore";

export function TelemetryDeck(): JSX.Element {
  const config = useNeuralStore((state) => state.config);
  const activePlan = useNeuralStore((state) => state.activePlan);
  const executionLogs = useNeuralStore((state) => state.executionLogs);
  const voiceStatus = useNeuralStore((state) => state.voiceStatus);
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

  const voiceLabel = !voiceStatus.isAvailable ? "Indisponível" : 
    voiceStatus.state === "listening" ? "Ouvindo" :
    voiceStatus.state === "speaking" ? "Falando" :
    voiceStatus.state === "processing" ? "Analisando" : "Pronta";

  return (
    <section className="telemetry-deck galaxy-footer hud-corners">
      <div className="footer-status-grid">
        <FooterLine label="Voz" value={voiceLabel} tone={voiceStatus.state === "listening" ? "approval" : "info"} />
        <FooterLine label="Áudio" value="Pronto" />
        <FooterLine label="Memória" value={memoryStats && memoryStats.notes > 0 ? "Ativa" : "Vazia"} />
        <FooterLine label="IA" value={providerStatus?.status === "ready" ? "Online" : "Offline"} />
        <FooterLine label="Executor" value={executionLogs.length ? "Com histórico" : "Em espera"} />
        <FooterLine label="Aprovação" value={activePlan ? "Pendente" : "Protegida"} tone={activePlan ? "approval" : "success"} />
      </div>
    </section>
  );
}

function FooterLine({
  label,
  value,
  tone = "info",
}: {
  label: string;
  value: string;
  tone?: "info" | "success" | "approval";
}): JSX.Element {
  return (
    <div className={`footer-line tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
