import { useEffect } from "react";
import { getSystemSnapshot, runSafeDiagnostic } from "./systemAgentClient";
import { useNeuralStore } from "../../store/useNeuralStore";

const diagnostics = [
  ["system-overview", "Sistema"],
  ["kernel-logs", "Kernel"],
  ["systemd", "Systemd"],
  ["hyprland", "Hyprland"],
  ["ram-zram", "RAM/ZRAM"],
  ["disk", "Disco"],
  ["gpu", "GPU"],
  ["audio", "Áudio"],
  ["network", "Rede"],
  ["bluetooth", "Bluetooth"],
  ["ollama", "Ollama"],
  ["packages", "Pacotes"],
] as const;

export function DiagnosticsView(): JSX.Element {
  const snapshot = useNeuralStore((state) => state.snapshot);
  const diagnosticsState = useNeuralStore((state) => state.diagnostics);
  const setSnapshot = useNeuralStore((state) => state.setSnapshot);
  const addDiagnostic = useNeuralStore((state) => state.addDiagnostic);
  const addTelemetry = useNeuralStore((state) => state.addTelemetry);

  useEffect(() => {
    getSystemSnapshot().then(setSnapshot).catch(() => undefined);
  }, [setSnapshot]);

  async function handleDiagnostic(key: string): Promise<void> {
    addTelemetry({ level: "info", message: `Diagnóstico iniciado: ${key}` });
    try {
      const result = await runSafeDiagnostic(key);
      addDiagnostic(result);
      addTelemetry({ level: result.status === "success" ? "success" : "warn", message: `${result.title}: concluído.` });
    } catch (error) {
      addTelemetry({
        level: "error",
        message: error instanceof Error ? error.message : "Diagnóstico falhou.",
      });
    }
  }

  return (
    <main className="route-view">
      <header className="route-header">
        <div>
          <span>Diagnósticos</span>
          <h1>Leitura segura do sistema</h1>
        </div>
        <button type="button" onClick={() => getSystemSnapshot().then(setSnapshot)}>
          Snapshot
        </button>
      </header>

      <section className="snapshot-grid">
        <SnapshotCard title="Kernel" value={snapshot?.kernel} />
        <SnapshotCard title="Uptime" value={snapshot?.uptime} />
        <SnapshotCard title="GPU" value={snapshot?.gpu} />
        <SnapshotCard title="Ollama" value={snapshot?.ollama} />
      </section>

      <section className="diagnostic-actions">
        {diagnostics.map(([key, label]) => (
          <button key={key} type="button" onClick={() => handleDiagnostic(key)}>
            {label}
          </button>
        ))}
      </section>

      <section className="log-output">
        {diagnosticsState.length === 0 ? (
          <div className="empty-state">Selecione um diagnóstico para coletar dados.</div>
        ) : (
          diagnosticsState.map((diagnostic) => (
            <article key={diagnostic.key} className="log-card">
              <div className="card-row compact">
                <strong>{diagnostic.title}</strong>
                <span>{diagnostic.status}</span>
                <span>{new Date(diagnostic.generatedAt).toLocaleString()}</span>
              </div>
              <pre>{diagnostic.output}</pre>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

function SnapshotCard({ title, value }: { title: string; value?: string }): JSX.Element {
  return (
    <article className="data-card">
      <span>{title}</span>
      <strong>{value?.trim() || "indisponível"}</strong>
    </article>
  );
}
