import { useState } from "react";

interface MemoryCapturePanelProps {
  loading: boolean;
  onDecision: (content: string) => Promise<void>;
  onRule: (content: string) => Promise<void>;
}

export function MemoryCapturePanel({ loading, onDecision, onRule }: MemoryCapturePanelProps): JSX.Element {
  const [content, setContent] = useState("");
  return (
    <section className="memory-side-card">
      <header>
        <span className="hud-kicker">Capturar</span>
        <strong>decisão/regra</strong>
      </header>
      <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Conteúdo persistente..." />
      <div className="memory-side-actions">
        <button type="button" onClick={() => void onDecision(content)} disabled={loading || !content.trim()}>
          Salvar decisão
        </button>
        <button type="button" onClick={() => void onRule(content)} disabled={loading || !content.trim()}>
          Salvar regra
        </button>
      </div>
    </section>
  );
}
