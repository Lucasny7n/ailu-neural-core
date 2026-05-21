import { useMemo, useState } from "react";
import { generateSystemActionPlan } from "../ai-router/aiRouter";
import { runSafeDiagnostic, recordSystemAction } from "../system-agent/systemAgentClient";
import { useNeuralStore } from "../../store/useNeuralStore";
import { getNodePath, nodeById } from "./neuralGraph";
import { statusLabel } from "./statusColors";

export function NodeDetailPanel(): JSX.Element {
  const selectedNodeId = useNeuralStore((state) => state.selectedNodeId);
  const nodeStatusById = useNeuralStore((state) => state.nodeStatusById);
  const config = useNeuralStore((state) => state.config);
  const setNodeStatus = useNeuralStore((state) => state.setNodeStatus);
  const addTelemetry = useNeuralStore((state) => state.addTelemetry);
  const addDiagnostic = useNeuralStore((state) => state.addDiagnostic);
  const setActivePlan = useNeuralStore((state) => state.setActivePlan);
  const [busyAction, setBusyAction] = useState<"diagnostic" | "plan" | null>(null);

  const node = nodeById.get(selectedNodeId) ?? nodeById.get("core");
  const breadcrumb = useMemo(
    () => getNodePath(selectedNodeId).map((item) => item.label).join(" / "),
    [selectedNodeId],
  );

  if (!node) {
    return <aside className="hud-panel right-panel">Nodo indisponivel.</aside>;
  }

  const activeNode = node;
  const status = nodeStatusById[node.id] ?? node.status;

  async function handleDiagnostic(): Promise<void> {
    if (!activeNode.diagnosticsKey || busyAction) {
      return;
    }
    setBusyAction("diagnostic");
    setNodeStatus(activeNode.id, "running");
    addTelemetry({ level: "info", message: `Diagnostico seguro iniciado: ${activeNode.label}` });
    try {
      const diagnostic = await runSafeDiagnostic(activeNode.diagnosticsKey);
      addDiagnostic(diagnostic);
      setNodeStatus(activeNode.id, diagnostic.status === "success" ? "success" : "warning");
      addTelemetry({ level: diagnostic.status === "success" ? "success" : "warn", message: `${diagnostic.title}: concluido.` });
    } catch (error) {
      setNodeStatus(activeNode.id, "error");
      addTelemetry({
        level: "error",
        message: error instanceof Error ? error.message : "Falha no diagnostico seguro.",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handlePrepareAction(): Promise<void> {
    if (busyAction) {
      return;
    }
    setBusyAction("plan");
    setNodeStatus(activeNode.id, "thinking");
    try {
      const result = await generateSystemActionPlan(`diagnosticar ${activeNode.label}`, config);
      setActivePlan(result.plan, result.source);
      setNodeStatus(activeNode.id, "approval");
      try {
        await recordSystemAction(result.plan, "planned");
      } catch {
        addTelemetry({ level: "warn", message: "Plano criado sem persistencia Tauri." });
      }
      addTelemetry({ level: "info", message: `Plano preparado para ${activeNode.label}.` });
    } catch (error) {
      setNodeStatus(activeNode.id, "error");
      addTelemetry({
        level: "error",
        message: error instanceof Error ? error.message : "Falha ao preparar acao.",
      });
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <aside className="hud-panel right-panel">
      <div className="hud-kicker">NODE DETAIL</div>
      <h2>{node.label}</h2>
      <div className="breadcrumb">{breadcrumb}</div>
      <div className={`status-pill status-${status}`}>{statusLabel(status)}</div>
      <p>{node.description}</p>
      <div className="detail-grid">
        <span>Tipo</span>
        <strong>{node.type}</strong>
        <span>Depth</span>
        <strong>{node.depth}</strong>
        <span>Diag</span>
        <strong>{node.diagnosticsKey ?? "manual"}</strong>
      </div>
      <div className="panel-actions">
        <button type="button" onClick={handleDiagnostic} disabled={!node.diagnosticsKey || busyAction !== null}>
          {busyAction === "diagnostic" ? "Rodando" : "Diagnosticar"}
        </button>
        <button type="button" onClick={handlePrepareAction} disabled={busyAction !== null}>
          {busyAction === "plan" ? "Planejando" : "Preparar ação"}
        </button>
      </div>
      <button type="button" className="ghost-button" onClick={() => useNeuralStore.getState().selectNode("core")}>
        Voltar ao core
      </button>
    </aside>
  );
}
