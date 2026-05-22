import { useEffect } from "react";
import { useMemoryStore } from "./useMemoryStore";
import { MemorySourcesPanel } from "./MemorySourcesPanel";

interface MemoryContextPanelProps {
  onOpenMemoryCore?: () => void;
  onSaveConversation?: () => void;
  onSaveDecision?: () => void;
  onSaveRule?: () => void;
}

export function MemoryContextPanel({
  onOpenMemoryCore,
  onSaveConversation,
  onSaveDecision,
  onSaveRule,
}: MemoryContextPanelProps): JSX.Element {
  const stats = useMemoryStore((state) => state.stats);
  const context = useMemoryStore((state) => state.lastBuiltContext);
  const getStats = useMemoryStore((state) => state.getStats);

  useEffect(() => {
    void getStats();
  }, [getStats]);

  return (
    <section className="memory-context-panel hud-corners">
      <header>
        <span className="hud-kicker">Contexto de Memória</span>
        <strong>{stats?.notes ?? 0} notas</strong>
      </header>
      <div className="memory-context-grid">
        <span>chunks</span>
        <strong>{stats?.chunks ?? 0}</strong>
        <span>links</span>
        <strong>{stats?.links ?? 0}</strong>
        <span>usadas</span>
        <strong>{context ? `${context.notes.length}/${context.chunks.length}` : "0/0"}</strong>
        <span>limite</span>
        <strong>{context ? `${(context.totalChars / 1000).toFixed(1)}k` : "0k"}</strong>
      </div>
      <div className="memory-context-actions">
        <button type="button" onClick={onOpenMemoryCore}>Abrir</button>
        <button type="button" onClick={onSaveConversation}>Conversa</button>
        <button type="button" onClick={onSaveDecision}>Decisão</button>
        <button type="button" onClick={onSaveRule}>Regra</button>
      </div>
      <MemorySourcesPanel context={context} />
    </section>
  );
}
