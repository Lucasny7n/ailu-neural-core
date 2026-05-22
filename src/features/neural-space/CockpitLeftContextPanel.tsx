import { useMemoryStore } from "../memory-core/useMemoryStore";
import { useNeuralStore } from "../../store/useNeuralStore";

export function CockpitLeftContextPanel(): JSX.Element {
  const activeContext = useNeuralStore((state) => state.activeContext);
  const telemetry = useNeuralStore((state) => state.telemetry);
  const selectedConnectionId = useNeuralStore((state) => state.selectedConnectionId);
  const memoryStats = useMemoryStore((state) => state.stats);

  const focusLabel = activeContext?.sourcePath ?? activeContext?.memoryNoteId ?? activeContext?.title ?? "Nenhuma memória selecionada.";
  const influence = activeContext ? Math.min(100, 42 + activeContext.relatedIds.length * 9) : 0;

  return (
    <aside className="hud-panel hud-panel-floating cockpit-left-panel hud-corners">
      <div className="hud-section-title">Contexto Ativo</div>
      <div className="context-card">
        <span>Objeto em foco</span>
        <strong>{focusLabel}</strong>
        <em>{activeContext?.subtitle ?? activeContext?.kind ?? "Sem contexto carregado"}</em>
      </div>
      <div className="hud-meter">
        <div>
          <span>Influência</span>
          <strong>{activeContext ? `${influence}%` : "N/D"}</strong>
        </div>
        <div className="hud-meter__bar">
          <span style={{ width: `${influence}%` }} />
        </div>
      </div>
      <div className="context-tags">
        {(activeContext?.relatedIds.length ? activeContext.relatedIds.slice(0, 6) : ["sem relações"]).map((tag) => (
          <span key={tag} className="hud-chip">
            {tag}
          </span>
        ))}
      </div>
      <div className="status-grid-compact">
        <StatusLine label="Tipo" value={activeContext?.kind ?? "nenhum"} />
        <StatusLine label="Domínio" value={activeContext?.domain ?? "N/D"} />
        <StatusLine label="Ligação" value={selectedConnectionId ?? "nenhuma"} />
        <StatusLine label="Memória" value={memoryStats ? `${memoryStats.notes} notas` : "N/D"} />
      </div>
      <div className="telemetry-mini">
        <span className="hud-section-title">Telemetria curta</span>
        {telemetry.slice(0, 4).map((entry) => (
          <p key={entry.id} className={`telemetry-mini__line tone-${entry.level}`}>
            {entry.message}
          </p>
        ))}
      </div>
    </aside>
  );
}

function StatusLine({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="status-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
