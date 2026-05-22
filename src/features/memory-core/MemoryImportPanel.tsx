import { useState } from "react";
import type { MemoryImportJob } from "./memoryTypes";

interface MemoryImportPanelProps {
  importProgress?: MemoryImportJob;
  loading: boolean;
  onImport: (path: string) => Promise<void>;
  onScan: () => Promise<void>;
}

export function MemoryImportPanel({ importProgress, loading, onImport, onScan }: MemoryImportPanelProps): JSX.Element {
  const [path, setPath] = useState("");
  return (
    <section className="memory-side-card">
      <header>
        <span className="hud-kicker">Importar</span>
        <strong>caminho real</strong>
      </header>
      <input value={path} onChange={(event) => setPath(event.target.value)} placeholder="/home/lucas/Documentos/..." />
      <div className="memory-side-actions">
        <button type="button" onClick={() => void onImport(path)} disabled={loading || !path.trim()}>
          Importar
        </button>
        <button type="button" onClick={() => void onScan()} disabled={loading}>
          Reindexar
        </button>
      </div>
      {importProgress ? (
        <code>
          {importProgress.status}: {importProgress.filesImported}/{importProgress.filesFound} importados
        </code>
      ) : (
        <code>sem job recente</code>
      )}
    </section>
  );
}
