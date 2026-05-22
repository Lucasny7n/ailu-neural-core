import type { MemoryNote } from "./memoryTypes";

interface MemoryBacklinksPanelProps {
  backlinks: MemoryNote[];
  related: MemoryNote[];
  onOpen: (noteId: string) => void;
}

export function MemoryBacklinksPanel({ backlinks, related, onOpen }: MemoryBacklinksPanelProps): JSX.Element {
  return (
    <section className="memory-side-card">
      <header>
        <span className="hud-kicker">Links de retorno</span>
        <strong>{backlinks.length}</strong>
      </header>
      <MemoryNoteButtons notes={backlinks} empty="sem backlinks" onOpen={onOpen} />
      <header>
        <span className="hud-kicker">Relacionadas</span>
        <strong>{related.length}</strong>
      </header>
      <MemoryNoteButtons notes={related} empty="sem relacionadas" onOpen={onOpen} />
    </section>
  );
}

function MemoryNoteButtons({
  notes,
  empty,
  onOpen,
}: {
  notes: MemoryNote[];
  empty: string;
  onOpen: (noteId: string) => void;
}): JSX.Element {
  if (!notes.length) {
    return <code>{empty}</code>;
  }
  return (
    <div className="memory-note-buttons">
      {notes.slice(0, 8).map((note) => (
        <button key={note.id} type="button" onClick={() => onOpen(note.id)}>
          <span>{note.kind}</span>
          {note.title}
        </button>
      ))}
    </div>
  );
}
