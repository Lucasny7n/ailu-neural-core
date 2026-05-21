import { useNeuralStore } from "../../store/useNeuralStore";

export function TelemetryDeck(): JSX.Element {
  const telemetry = useNeuralStore((state) => state.telemetry);
  const executionLogs = useNeuralStore((state) => state.executionLogs);

  return (
    <section className="telemetry-deck">
      <div className="hud-kicker">TELEMETRY</div>
      <div className="telemetry-stream">
        {executionLogs.slice(0, 4).map((log) => (
          <div key={log.id} className={`telemetry-line ${log.exitCode === 0 ? "success" : "error"}`}>
            <time>{new Date(log.createdAt).toLocaleTimeString()}</time>
            <span>{log.command}</span>
            <code>exit {log.exitCode}</code>
          </div>
        ))}
        {telemetry.slice(0, 8).map((entry) => (
          <div key={entry.id} className={`telemetry-line ${entry.level}`}>
            <time>{new Date(entry.createdAt).toLocaleTimeString()}</time>
            <span>{entry.message}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
