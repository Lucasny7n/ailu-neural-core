import { useEffect, useState } from "react";
import { listProviderStatus } from "./aiRouter";
import type { AiProviderStatus } from "./aiTypes";
import { useNeuralStore } from "../../store/useNeuralStore";

export function ProvidersView(): JSX.Element {
  const config = useNeuralStore((state) => state.config);
  const [status, setStatus] = useState<AiProviderStatus | null>(null);

  useEffect(() => {
    listProviderStatus(config).then(setStatus);
  }, [config]);

  return (
    <main className="route-view">
      <header className="route-header">
        <div>
          <span>Provedores de IA</span>
          <h1>{config.aiProviderType.toUpperCase()}</h1>
        </div>
        <button type="button" onClick={() => listProviderStatus(config).then(setStatus)}>
          Testar conexão
        </button>
      </header>

      <section className="provider-panel">
        <div className="detail-grid">
          <span>Provedor</span>
          <strong>{config.aiProviderType}</strong>
          <span>Modelo padrão</span>
          <strong>{config.defaultModel}</strong>
          <span>Status</span>
          <strong>{statusLabel(status?.status)}</strong>
          <span>Mensagem</span>
          <strong>{status?.message ?? "Verificando runtime."}</strong>
        </div>
      </section>

      <section className="data-grid">
        {(status?.models ?? []).length === 0 ? (
          <div className="empty-state">Nenhum modelo detectado para este provedor.</div>
        ) : (
          status?.models.map((model) => (
            <article className="data-card" key={model.id}>
              <div className="card-row">
                <span>modelo</span>
                <strong>{model.name}</strong>
              </div>
              <p>{model.details ?? "Sem detalhes extras"}</p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

function statusLabel(status: AiProviderStatus["status"] | undefined): string {
  const labels: Record<AiProviderStatus["status"], string> = {
    ready: "pronto",
    not_configured: "não configurado",
    unavailable: "indisponível",
    running: "rodando",
    error: "erro",
  };
  return status ? labels[status] : "testando";
}
