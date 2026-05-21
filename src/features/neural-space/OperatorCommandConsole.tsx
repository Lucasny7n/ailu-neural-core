import { FormEvent, useState } from "react";
import { generateSystemActionPlan } from "../ai-router/aiRouter";
import { recordSystemAction } from "../system-agent/systemAgentClient";
import { localMemoryGraphService } from "../memory-graph/localMemoryGraphService";
import { useNeuralStore } from "../../store/useNeuralStore";
import { emitNeuralEvent } from "./neuralEvents";

export function OperatorCommandConsole(): JSX.Element {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const config = useNeuralStore((state) => state.config);
  const setActivePlan = useNeuralStore((state) => state.setActivePlan);
  const addTelemetry = useNeuralStore((state) => state.addTelemetry);
  const setNodeStatus = useNeuralStore((state) => state.setNodeStatus);
  const selectNode = useNeuralStore((state) => state.selectNode);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const request = value.trim();
    if (!request || busy) {
      return;
    }

    setBusy(true);
    setNodeStatus("core", "thinking");
    addTelemetry({ level: "info", message: `Ordem recebida: ${request}` });
    emitNeuralEvent({ name: "core:thinking", nodeId: "core" });

    try {
      const result = await generateSystemActionPlan(request, config);
      setActivePlan(result.plan, result.source);
      result.plan.targetNodes.forEach((nodeId) => setNodeStatus(nodeId, "approval"));
      selectNode(result.plan.targetNodes[0] ?? "actions");
      addTelemetry({
        level: result.source === "ollama" ? "success" : "warn",
        message:
          result.source === "ollama"
            ? `Plano criado por ${result.plan.model}.`
            : `Fallback local criou plano; Ollama: ${result.providerStatus.message}`,
      });
      await localMemoryGraphService.addEpisode({
        id: result.plan.id,
        title: result.plan.title,
        body: result.plan.description,
        source: result.source === "ollama" ? "ai" : "system",
        createdAt: result.plan.createdAt,
        relatedNodes: result.plan.targetNodes.length ? result.plan.targetNodes : ["core"],
      });
      try {
        await recordSystemAction(result.plan, "planned");
      } catch {
        addTelemetry({ level: "warn", message: "Plano em memoria da UI; persistencia Tauri indisponivel." });
      }
      setNodeStatus("core", "approval");
      emitNeuralEvent({ name: "core:approval", nodeId: "core" });
      setValue("");
    } catch (error) {
      setNodeStatus("core", "error");
      addTelemetry({
        level: "error",
        message: error instanceof Error ? error.message : "Falha ao gerar plano de acao.",
      });
      emitNeuralEvent({ name: "core:error", nodeId: "core" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="operator-console" onSubmit={handleSubmit}>
      <label htmlFor="operator-command">ORDEM DO OPERADOR</label>
      <div className="operator-input-row">
        <input
          id="operator-command"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="ORDEM DO OPERADOR > descreva o que deseja fazer..."
          autoComplete="off"
        />
        <button type="submit" disabled={busy || !value.trim()}>
          {busy ? "Planejando" : "Planejar"}
        </button>
      </div>
    </form>
  );
}
