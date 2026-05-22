import { useMemoryStore } from "../memory-core/useMemoryStore";
import { useNeuralStore } from "../../store/useNeuralStore";

export function CockpitFooter(): JSX.Element {
  const voiceStatus = useNeuralStore((state) => state.voiceStatus);
  const activePlan = useNeuralStore((state) => state.activePlan);
  const executionLogs = useNeuralStore((state) => state.executionLogs);
  const memoryStats = useMemoryStore((state) => state.stats);

  return (
    <footer className="ailu-footer hud-grid-bg" aria-label="Rodapé técnico">
      <FooterCell label="Canal de voz" value={voiceLabel(voiceStatus.state)} tone={voiceStatus.state === "error" ? "warn" : "success"} />
      <FooterCell label="Motor de áudio" value={voiceStatus.isAvailable ? "Disponível" : "N/D"} />
      <FooterCell label="Memória do núcleo" value={memoryStats ? `${memoryStats.notes} notas` : "Vazia"} tone="memory" />
      <FooterCell label="Motor de IA" value="Roteador protegido" tone="cyan" />
      <FooterCell label="Executor" value={activePlan ? "Aguardando aprovação" : executionLogs.length ? "Histórico local" : "Em espera"} tone={activePlan ? "approval" : "neutral"} />
      <div className="hud-waveform" aria-hidden="true">
        {Array.from({ length: 34 }, (_, index) => (
          <span key={index} style={{ height: `${6 + ((index * 7) % 18)}px` }} />
        ))}
      </div>
    </footer>
  );
}

function FooterCell({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "cyan" | "success" | "warn" | "approval" | "memory";
}): JSX.Element {
  return (
    <div className={`ailu-footer__cell tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function voiceLabel(state: string): string {
  const labels: Record<string, string> = {
    idle: "Inativa",
    listening: "Ouvindo",
    processing: "Processando",
    speaking: "Falando",
    error: "Erro",
  };
  return labels[state] ?? "N/D";
}
