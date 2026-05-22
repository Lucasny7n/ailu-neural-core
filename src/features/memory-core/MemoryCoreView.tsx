import { useEffect, useMemo, useState } from "react";
import { MemoryBacklinksPanel } from "./MemoryBacklinksPanel";
import { MemoryCapturePanel } from "./MemoryCapturePanel";
import { MemoryGraphPanel } from "./MemoryGraphPanel";
import { MemoryImportPanel } from "./MemoryImportPanel";
import { MemoryNoteEditor } from "./MemoryNoteEditor";
import { MemorySearch } from "./MemorySearch";
import { MemorySourcesPanel } from "./MemorySourcesPanel";
import { useMemoryStore } from "./useMemoryStore";
import type { MemoryNoteKind } from "./memoryTypes";

export function MemoryCoreView(): JSX.Element {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<MemoryNoteKind | "all">("all");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newKind, setNewKind] = useState<MemoryNoteKind>("note");

  const {
    stats,
    notes,
    selectedNote,
    selectedNoteContent,
    searchResults,
    graph,
    backlinks,
    related,
    lastBuiltContext,
    importProgress,
    loading,
    error,
    initVault,
    scanVault,
    importPath,
    createNote,
    updateNote,
    deleteNote,
    getNote,
    search,
    pinNote,
    unpinNote,
    captureDecision,
    captureRule,
  } = useMemoryStore();

  useEffect(() => {
    void initVault();
  }, [initVault]);

  const visibleNotes = useMemo(
    () =>
      notes.filter((note) => {
        if (kind !== "all" && note.kind !== kind) {
          return false;
        }
        if (pinnedOnly && !note.pinned) {
          return false;
        }
        return true;
      }),
    [kind, notes, pinnedOnly],
  );

  async function handleCreateNote(): Promise<void> {
    const title = newTitle.trim() || "Nova memória";
    const content = `---\ntitle: ${title}\nkind: ${newKind}\ntags: [${newKind}, ailu]\n---\n\n# ${title}\n\n`;
    await createNote(title, newKind, content);
    setNewTitle("");
  }

  return (
    <main className="memory-core-view">
      <header className="memory-core-top">
        <div>
          <span className="hud-kicker">Núcleo de Memória Ailu</span>
          <h1>Vault local, SQLite, busca e contexto real</h1>
        </div>
        <div className="memory-stats">
          <strong>{stats?.notes ?? 0}</strong>
          <span>notas</span>
          <strong>{stats?.chunks ?? 0}</strong>
          <span>chunks</span>
          <strong>{stats?.links ?? 0}</strong>
          <span>links</span>
          <strong>{stats?.ftsAvailable ? "FTS" : "LIKE"}</strong>
          <span>busca</span>
        </div>
      </header>

      {error ? <div className="memory-error">{error}</div> : null}

      <section className="memory-core-grid">
        <aside className="memory-list-panel">
          <MemorySearch
            query={query}
            kind={kind}
            pinnedOnly={pinnedOnly}
            onQueryChange={setQuery}
            onKindChange={setKind}
            onPinnedOnlyChange={setPinnedOnly}
            onSearch={() => void search(query)}
          />
          <div className="memory-create-row">
            <input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Nova nota..." />
            <select value={newKind} onChange={(event) => setNewKind(event.target.value as MemoryNoteKind)}>
              {["note", "project", "system", "conversation", "decision", "action", "rule", "import"].map((item) => (
                <option key={item} value={item}>
                  {kindLabel(item as MemoryNoteKind)}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => void handleCreateNote()} disabled={loading}>
              Criar
            </button>
          </div>
          <div className="memory-note-list">
            {visibleNotes.map((note) => (
              <button
                key={note.id}
                type="button"
                className={selectedNote?.id === note.id ? "active" : ""}
                onClick={() => void getNote(note.id)}
              >
                <span>{kindLabel(note.kind)}</span>
                <strong>{note.title}</strong>
                <em>{note.summary ?? note.path}</em>
              </button>
            ))}
          </div>
          <div className="memory-search-results">
            {searchResults.slice(0, 5).map((result) => (
              <code key={`${result.note.id}-${result.chunk?.id ?? "note"}`}>
                {result.score.toFixed(1)} {result.matchedBy.join("+")} {result.snippet}
              </code>
            ))}
          </div>
        </aside>

        <MemoryNoteEditor
          note={selectedNote}
          content={selectedNoteContent}
          loading={loading}
          onSave={(content) => updateNote(selectedNote?.id ?? "", content)}
          onDelete={() => deleteNote(selectedNote?.id ?? "")}
          onPin={() => pinNote(selectedNote?.id ?? "")}
          onUnpin={() => unpinNote(selectedNote?.id ?? "")}
        />

        <aside className="memory-right-panel">
          <MemoryImportPanel importProgress={importProgress} loading={loading} onImport={importPath} onScan={scanVault} />
          <MemoryBacklinksPanel backlinks={backlinks} related={related} onOpen={(noteId) => void getNote(noteId)} />
          <MemorySourcesPanel context={lastBuiltContext} onOpen={(noteId) => void getNote(noteId)} />
          <MemoryGraphPanel graph={graph} />
          <MemoryCapturePanel
            loading={loading}
            onDecision={async (content) => {
              await captureDecision(content);
            }}
            onRule={async (content) => {
              await captureRule(content);
            }}
          />
        </aside>
      </section>
    </main>
  );
}

function kindLabel(kind: MemoryNoteKind): string {
  const labels: Record<MemoryNoteKind, string> = {
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
