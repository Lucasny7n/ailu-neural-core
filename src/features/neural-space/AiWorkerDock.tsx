import { useNeuralStore } from "../../store/useNeuralStore";

const workers = ["system", "code", "fast", "heavy", "vision"];

export function AiWorkerDock(): JSX.Element {
  const config = useNeuralStore((state) => state.config);
  return (
    <section className="ai-worker-dock">
      <div className="worker active">
        <span>LOCAL</span>
        <strong>{config.defaultModel}</strong>
      </div>
      {workers.map((worker) => (
        <div className="worker future" key={worker}>
          <span>{worker}</span>
          <strong>future</strong>
        </div>
      ))}
    </section>
  );
}
