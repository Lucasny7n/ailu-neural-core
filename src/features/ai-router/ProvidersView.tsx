import { useEffect, useState } from "react";
import { buildDefaultProvider, listProviderStatus } from "./aiRouter";
import type { AiProviderStatus } from "./aiTypes";
import { useNeuralStore } from "../../store/useNeuralStore";

export function ProvidersView(): JSX.Element {
  const config = useNeuralStore((state) => state.config);
  const [status, setStatus] = useState<AiProviderStatus | null>(null);

  useEffect(() => {
    listProviderStatus(config).then(setStatus);
  }, [config]);

  const provider = buildDefaultProvider(config);

  return (
    <main className="route-view">
      <header className="route-header">
        <div>
          <span>PROVIDERS</span>
          <h1>Ollama Local</h1>
        </div>
        <button type="button" onClick={() => listProviderStatus(config).then(setStatus)}>
          Testar conexão
        </button>
      </header>

      <section className="provider-panel">
        <div className="detail-grid">
          <span>ID</span>
          <strong>{provider.id}</strong>
          <span>Endpoint</span>
          <strong>{provider.baseUrl}</strong>
          <span>Modelo padrão</span>
          <strong>{provider.defaultModel}</strong>
          <span>Status</span>
          <strong>{status?.status ?? "testing"}</strong>
          <span>Mensagem</span>
          <strong>{status?.message ?? "Verificando runtime local."}</strong>
        </div>
      </section>

      <section className="data-grid">
        {(status?.models ?? []).length === 0 ? (
          <div className="empty-state">Nenhum modelo retornado por /api/tags.</div>
        ) : (
          status?.models.map((model) => (
            <article className="data-card" key={model.name}>
              <div className="card-row">
                <span>ollama</span>
                <strong>{model.name}</strong>
              </div>
              <p>{model.size ? `${Math.round(model.size / 1024 / 1024)} MB` : "tamanho indisponivel"}</p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
