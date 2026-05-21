import { useNeuralStore } from "../../store/useNeuralStore";

const steps = ["ordem recebida", "plano criado", "aguardando aprovação", "aprovado", "executando", "concluído", "memória salva"];

export function ActionTimeline(): JSX.Element {
  const activePlan = useNeuralStore((state) => state.activePlan);
  const executionLogs = useNeuralStore((state) => state.executionLogs);
  const activeIndex = activePlan ? (executionLogs.length > 0 ? 5 : 2) : 0;

  return (
    <section className="action-timeline">
      {steps.map((step, index) => (
        <div key={step} className={`timeline-step ${index <= activeIndex ? "active" : ""}`}>
          <span />
          <strong>{step}</strong>
        </div>
      ))}
    </section>
  );
}
