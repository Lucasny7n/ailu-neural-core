import type { MemoryNoteKind } from "./memoryTypes";

interface MemorySearchProps {
  query: string;
  kind: MemoryNoteKind | "all";
  pinnedOnly: boolean;
  onQueryChange: (query: string) => void;
  onKindChange: (kind: MemoryNoteKind | "all") => void;
  onPinnedOnlyChange: (enabled: boolean) => void;
  onSearch: () => void;
}

const kinds: Array<MemoryNoteKind | "all"> = [
  "all",
  "note",
  "project",
  "system",
  "conversation",
  "decision",
  "action",
  "rule",
  "import",
];

export function MemorySearch({
  query,
  kind,
  pinnedOnly,
  onQueryChange,
  onKindChange,
  onPinnedOnlyChange,
  onSearch,
}: MemorySearchProps): JSX.Element {
  return (
    <div className="memory-search">
      <div className="memory-search__row">
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSearch();
            }
          }}
          placeholder="Buscar no vault local..."
        />
        <button type="button" className="hud-button hud-button--primary" onClick={onSearch}>
          Buscar
        </button>
      </div>
      <div className="memory-filters">
        {kinds.map((item) => (
          <button
            key={item}
            type="button"
            className={kind === item ? "active" : ""}
            onClick={() => onKindChange(item)}
          >
            {kindLabel(item)}
          </button>
        ))}
        <label>
          <input
            type="checkbox"
            checked={pinnedOnly}
            onChange={(event) => onPinnedOnlyChange(event.target.checked)}
          />
          fixadas
        </label>
      </div>
    </div>
  );
}

function kindLabel(kind: MemoryNoteKind | "all"): string {
  const labels: Record<MemoryNoteKind | "all", string> = {
    all: "todas",
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
