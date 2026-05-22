import { useEffect } from "react";
import { listRecentActions } from "../system-agent/systemAgentClient";
import { useNeuralStore } from "../../store/useNeuralStore";

export function ActionsView(): JSX.Element {
  const recentActions = useNeuralStore((state) => state.recentActions);
  const executionLogs = useNeuralStore((state) => state.executionLogs);
  const setRecentActions = useNeuralStore((state) => state.setRecentActions);
  const addTelemetry = useNeuralStore((state) => state.addTelemetry);

  useEffect(() => {
    listRecentActions(80)
      .then(setRecentActions)
      .catch(() => addTelemetry({ level: "warn", message: "Histórico SQLite indisponível fora do Tauri." }));
  }, [addTelemetry, setRecentActions]);

  return (
    <main className="route-view">
      <header className="route-header">
        <div>
          <span>Ações</span>
          <h1>Histórico operacional</h1>
        </div>
        <button type="button" onClick={() => listRecentActions(80).then(setRecentActions)}>
          Atualizar
        </button>
      </header>

      <section className="data-grid">
        {recentActions.length === 0 ? (
          <div className="empty-state">Nenhuma ação persistida ainda.</div>
        ) : (
          recentActions.map((action) => (
            <article className="data-card" key={action.id}>
              <div className="card-row">
                <span>{action.intent}</span>
                <strong>{action.title}</strong>
              </div>
              <p>{action.userRequest}</p>
              <div className="card-row compact">
                <span>{action.riskLevel}</span>
                <span>{action.status}</span>
                <span>{action.provider}</span>
                <span>{new Date(action.createdAt).toLocaleString()}</span>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="log-output">
        <h2>Últimos resultados</h2>
        {executionLogs.length === 0 ? (
          <div className="empty-state">Nenhum comando executado nesta sessão.</div>
        ) : (
          executionLogs.map((log) => (
            <article key={log.id} className="log-card">
              <div className="card-row compact">
                <strong>{log.command}</strong>
                <span>saída {log.exitCode}</span>
                <span>{log.durationMs}ms</span>
              </div>
              <pre>{[log.stdout, log.stderr].filter(Boolean).join("\n")}</pre>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
