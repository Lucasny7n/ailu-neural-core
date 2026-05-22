import type { BuiltMemoryContext } from "./memoryTypes";

interface MemorySourcesPanelProps {
  context?: BuiltMemoryContext;
  onOpen?: (noteId: string) => void;
}

export function MemorySourcesPanel({ context, onOpen }: MemorySourcesPanelProps): JSX.Element {
  return (
    <section className="memory-sources">
      <header>
        <span className="hud-kicker">Memórias usadas</span>
        <strong>{context ? `${context.notes.length} notas / ${context.chunks.length} chunks` : "0 notas"}</strong>
      </header>
      {context?.notes.length ? (
        <div className="memory-source-list">
          {context.notes.map((note) => (
            <button key={note.id} type="button" onClick={() => onOpen?.(note.id)}>
              <span>{note.kind}</span>
              <strong>{note.title}</strong>
              <em>{note.summary ?? "sem resumo"}</em>
            </button>
          ))}
        </div>
      ) : (
        <code>nenhuma memória recuperada para a última resposta</code>
      )}
    </section>
  );
}
