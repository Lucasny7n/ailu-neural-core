import { useState } from "react";
import type { MemoryNote } from "./memoryTypes";

interface MemoryNoteEditorProps {
  note?: MemoryNote;
  content: string;
  loading: boolean;
  onSave: (content: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onPin: () => Promise<void>;
  onUnpin: () => Promise<void>;
}

export function MemoryNoteEditor({
  note,
  content,
  loading,
  onSave,
  onDelete,
  onPin,
  onUnpin,
}: MemoryNoteEditorProps): JSX.Element {
  if (!note) {
    return (
      <section className="memory-editor empty">
        <span>Selecione ou crie uma nota.</span>
      </section>
    );
  }

  return (
    <MemoryNoteEditorDraft
      key={note.id}
      note={note}
      content={content}
      loading={loading}
      onSave={onSave}
      onDelete={onDelete}
      onPin={onPin}
      onUnpin={onUnpin}
    />
  );
}

function MemoryNoteEditorDraft({
  note,
  content,
  loading,
  onSave,
  onDelete,
  onPin,
  onUnpin,
}: Required<Pick<MemoryNoteEditorProps, "note">> & Omit<MemoryNoteEditorProps, "note">): JSX.Element {
  const [draft, setDraft] = useState(content);

  return (
    <section className="memory-editor">
      <header>
        <div>
          <span className="hud-kicker">{kindLabel(note.kind)}</span>
          <h2>{note.title}</h2>
          <small>{note.path}</small>
        </div>
        <div className="memory-editor__actions">
          <button type="button" onClick={note.pinned ? onUnpin : onPin} disabled={loading}>
            {note.pinned ? "Desfixar" : "Fixar"}
          </button>
          <button type="button" onClick={() => void onSave(draft)} disabled={loading}>
            Salvar
          </button>
          <button type="button" className="danger-button" onClick={() => void onDelete()} disabled={loading}>
            Apagar
          </button>
        </div>
      </header>
      <div className="memory-editor__body">
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} spellCheck={false} />
        <article className="memory-preview">
          {draft.split("\n").map((line, index) => (
            <p key={`${index}-${line.slice(0, 12)}`} className={line.startsWith("#") ? "memory-preview__heading" : ""}>
              {line || "\u00a0"}
            </p>
          ))}
        </article>
      </div>
    </section>
  );
}

function kindLabel(kind: MemoryNote["kind"]): string {
  const labels: Record<MemoryNote["kind"], string> = {
    note: "nota",
    project: "projeto",
    system: "sistema",
    conversation: "conversa",
    decision: "decisão",
    action: "ação",
    rule: "regra",
    import: "arquivo",
  };
  return labels[kind];
}
