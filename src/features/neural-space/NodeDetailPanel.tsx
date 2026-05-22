import { useMemo, useState } from "react";
import { generateSystemActionPlan } from "../ai-router/aiRouter";
import { useMemoryStore } from "../memory-core/useMemoryStore";
import { runSafeDiagnostic, recordSystemAction } from "../system-agent/systemAgentClient";
import { useNeuralStore } from "../../store/useNeuralStore";
import { getChildNodes, getNodePath, getRelatedNodeIds, nodeById } from "./neuralGraph";
import { memoryGraphNodeId } from "./memoryGraphNodeId";
import { statusLabel } from "./statusColors";

export function NodeDetailPanel(): JSX.Element {
  const selectedNodeId = useNeuralStore((state) => state.selectedNodeId);
  const nodeStatusById = useNeuralStore((state) => state.nodeStatusById);
  const config = useNeuralStore((state) => state.config);
  const setNodeStatus = useNeuralStore((state) => state.setNodeStatus);
  const addTelemetry = useNeuralStore((state) => state.addTelemetry);
  const addDiagnostic = useNeuralStore((state) => state.addDiagnostic);
  const setActivePlan = useNeuralStore((state) => state.setActivePlan);
  const selectNode = useNeuralStore((state) => state.selectNode);
  const setRoute = useNeuralStore((state) => state.setRoute);
  const telemetry = useNeuralStore((state) => state.telemetry);
  const memoryGraph = useMemoryStore((state) => state.graph);
  const buildMemoryContext = useMemoryStore((state) => state.buildContext);
  const [busyAction, setBusyAction] = useState<"diagnostic" | "plan" | null>(null);

  const node = nodeById.get(selectedNodeId) ?? nodeById.get("core");
  const memoryNode = memoryGraph.nodes.find((item) => memoryGraphNodeId(item.id) === selectedNodeId);
  const breadcrumb = useMemo(
    () =>
      memoryNode
        ? `AILU NEURAL CORE / MEMORY / ${memoryNode.label}`
        : getNodePath(selectedNodeId).map((item) => item.label).join(" / "),
    [memoryNode, selectedNodeId],
  );

  if (memoryNode) {
    return (
      <aside className="hud-panel right-panel hud-corners">
        <div className="hud-kicker">MEMORY NODE / REAL VAULT GRAPH</div>
        <h2 className="hud-title">{memoryNode.label}</h2>
        <div className="breadcrumb">{breadcrumb}</div>
        <div className="detail-grid">
          <span>Kind</span>
          <strong>{memoryNode.kind}</strong>
          <span>Weight</span>
          <strong>{memoryNode.weight.toFixed(1)}</strong>
          <span>Note</span>
          <strong>{memoryNode.noteId ?? "cluster"}</strong>
        </div>
        <p>{typeof memoryNode.metadata?.summary === "string" ? memoryNode.metadata.summary : "No persistido no SQLite do Memory Core."}</p>
        <div className="panel-actions">
          <button type="button" onClick={() => setRoute("memory")}>
            Abrir no editor
          </button>
          <button
            type="button"
            onClick={() => {
              void buildMemoryContext(memoryNode.label, memoryNode.kind, memoryNode.noteId ? [memoryNode.noteId] : []);
              addTelemetry({ level: "success", message: `MEMORY context selected=${memoryNode.label}` });
            }}
          >
            Usar contexto
          </button>
          <button type="button" onClick={() => useNeuralStore.getState().selectNode("memory")}>
            Voltar
          </button>
        </div>
      </aside>
    );
  }

  if (!node) {
    return <aside className="hud-panel right-panel">Nodo indisponivel.</aside>;
  }

  const activeNode = node;
  const status = nodeStatusById[node.id] ?? node.status;
  const childNodes = getChildNodes(activeNode.id);
  const relatedIds = getRelatedNodeIds(activeNode.id);
  const recentEvents = telemetry
    .filter((entry) => entry.message.toLowerCase().includes(activeNode.id.toLowerCase()))
    .slice(0, 3);

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
    <aside className="hud-panel right-panel hud-corners">
      <div className="hud-kicker">NODE DETAIL / NEURAL REGION</div>
      <h2 className="hud-title">{node.label}</h2>
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
        <span>Relations</span>
        <strong>{relatedIds.length ? relatedIds.join(" / ") : "none"}</strong>
      </div>
      <div className="node-relations">
        <span>Subnodes</span>
        <div>
          {childNodes.length ? (
            childNodes.slice(0, 6).map((child) => (
              <button key={child.id} type="button" className="hud-button hud-button--micro" onClick={() => selectNode(child.id)}>
                {child.label}
              </button>
            ))
          ) : (
            <em>leaf node</em>
          )}
        </div>
      </div>
      <div className="node-events">
        <span>Recent Events</span>
        {recentEvents.length ? (
          recentEvents.map((event) => <code key={event.id}>{event.message}</code>)
        ) : (
          <code>no local events yet</code>
        )}
      </div>
      <div className="panel-actions">
        <button type="button" onClick={handleDiagnostic} disabled={!node.diagnosticsKey || busyAction !== null}>
          {busyAction === "diagnostic" ? "Rodando" : "Diagnosticar"}
        </button>
        <button
          type="button"
          onClick={() => {
            const firstChild = childNodes[0];
            if (firstChild) {
              selectNode(firstChild.id);
              addTelemetry({ level: "info", message: `NAV explore from=${activeNode.id} to=${firstChild.id}` });
            }
          }}
          disabled={childNodes.length === 0}
        >
          Explorar
        </button>
        <button
          type="button"
          onClick={() => {
            setRoute("diagnostics");
            addTelemetry({ level: "info", message: `NAV diagnostics node=${activeNode.id}` });
          }}
        >
          Ver logs
        </button>
        <button type="button" onClick={handlePrepareAction} disabled={busyAction !== null}>
          {busyAction === "plan" ? "Planejando" : "Preparar ação"}
        </button>
      </div>
      <button type="button" className="ghost-button hud-button" onClick={() => useNeuralStore.getState().selectNode("core")}>
        Voltar ao core
      </button>
    </aside>
  );
}
