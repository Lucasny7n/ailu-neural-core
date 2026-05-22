import { useMemo, useState } from "react";
import type { PlannedCommand, SystemActionPlan } from "../ai-router/aiTypes";
import { executeApprovedAction, recordSystemAction } from "../system-agent/systemAgentClient";
import { useNeuralStore } from "../../store/useNeuralStore";
import { galaxyObjectById } from "../neural-space/galaxyGraph";
import { emitNeuralEvent } from "../neural-space/neuralEvents";

export function ApprovalLayer(): JSX.Element | null {
  const activePlan = useNeuralStore((state) => state.activePlan);
  if (!activePlan) {
    return null;
  }
  return <ApprovalDialog key={activePlan.id} initialPlan={activePlan} />;
}

function ApprovalDialog({ initialPlan }: { initialPlan: SystemActionPlan }): JSX.Element {
  const config = useNeuralStore((state) => state.config);
  const setActivePlan = useNeuralStore((state) => state.setActivePlan);
  const setExecutionLogs = useNeuralStore((state) => state.setExecutionLogs);
  const addTelemetry = useNeuralStore((state) => state.addTelemetry);
  const setNodeStatus = useNeuralStore((state) => state.setNodeStatus);
  const [draftPlan, setDraftPlan] = useState<SystemActionPlan>(initialPlan);
  const [editing, setEditing] = useState(false);
  const [running, setRunning] = useState(false);

  const commandText = useMemo(
    () => draftPlan.commands.map((command) => command.command).join("\n"),
    [draftPlan],
  );

  function updateCommand(index: number, value: string): void {
    setDraftPlan((current) => {
      const commands = current.commands.map((command, commandIndex) =>
        commandIndex === index ? { ...command, command: value } : command,
      );
      return { ...current, commands };
    });
  }

  async function handleCopy(): Promise<void> {
    await navigator.clipboard.writeText(commandText);
    addTelemetry({ level: "success", message: "Comandos copiados para a área de transferência." });
  }

  async function handleCancel(): Promise<void> {
    draftPlan.targetNodes.forEach((nodeId) => setNodeStatus(nodeId, "idle"));
    setNodeStatus("core", "ready");
    setActivePlan(undefined);
    try {
      await recordSystemAction(draftPlan, "canceled");
    } catch {
      // Cancelamento em preview web não tem persistência local.
    }
    addTelemetry({ level: "warn", message: "Plano cancelado pelo operador." });
  }

  async function handleExecute(): Promise<void> {
    if (!config.enableCommandExecution) {
      addTelemetry({ level: "warn", message: "Execução desabilitada nas configurações." });
      return;
    }
    setRunning(true);
    setActivePlan(draftPlan);
    setNodeStatus("core", "running");
    draftPlan.targetNodes.forEach((nodeId) => setNodeStatus(nodeId, "running"));
    emitNeuralEvent({ name: "core:running", nodeId: "core" });

    try {
      await recordSystemAction(draftPlan, "approved");
    } catch {
      addTelemetry({ level: "warn", message: "Aprovação sem persistência Tauri." });
    }

    try {
      const logs = await executeApprovedAction({
        actionId: draftPlan.id,
        approvalToken: `approval:${draftPlan.id}`,
        commands: draftPlan.commands,
      });
      setExecutionLogs(logs);
      const failed = logs.some((log) => log.exitCode !== 0);
      setNodeStatus("core", failed ? "error" : "success");
      draftPlan.targetNodes.forEach((nodeId) => setNodeStatus(nodeId, failed ? "error" : "success"));
      addTelemetry({
        level: failed ? "error" : "success",
        message: failed ? "Execucao concluida com falha." : "Execucao aprovada concluida.",
      });
      emitNeuralEvent({ name: failed ? "core:error" : "core:success", nodeId: "core" });
      if (!failed) {
        setActivePlan(undefined);
      }
    } catch (error) {
      setNodeStatus("core", "error");
      draftPlan.targetNodes.forEach((nodeId) => setNodeStatus(nodeId, "error"));
      addTelemetry({
        level: "error",
        message: error instanceof Error ? error.message : "Executor local falhou.",
      });
      emitNeuralEvent({ name: "core:error", nodeId: "core" });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="approval-backdrop" role="dialog" aria-modal="true" aria-labelledby="approval-title">
      <section className="approval-panel hud-corners">
        <div className="approval-header">
          <div>
            <div className="hud-kicker">Evento crítico de autorização</div>
            <h2 id="approval-title">AGUARDANDO AUTORIZAÇÃO DO OPERADOR</h2>
            <p>Nenhuma alteração será executada sem confirmação explícita.</p>
          </div>
        <span className={`risk-badge risk-${draftPlan.riskLevel}`}>{riskLabel(draftPlan.riskLevel)}</span>
        </div>

        <div className="approval-grid">
          <div>
            <span>Pedido original</span>
            <strong>{draftPlan.userRequest}</strong>
          </div>
          <div>
            <span>Ação</span>
            <strong>{draftPlan.title}</strong>
          </div>
          <div>
            <span>Provider / modelo</span>
            <strong>{draftPlan.provider} / {draftPlan.model}</strong>
          </div>
          <div>
            <span>Destino neural</span>
            <strong>{draftPlan.targetNodes.map(targetLabel).join(", ") || "Núcleo"}</strong>
          </div>
        </div>

        <p className="approval-description">{draftPlan.description}</p>
        <p className="risk-summary">{draftPlan.riskSummary}</p>

        <div className="approval-meta">
          <MetaBlock title="Arquivos" values={draftPlan.affectedFiles} />
          <MetaBlock title="Pacotes" values={draftPlan.affectedPackages} />
          <MetaBlock title="Serviços" values={draftPlan.affectedServices} />
        </div>

        <div className="command-stack">
          {draftPlan.commands.map((command, index) => (
            <CommandEditor
              key={command.id}
              command={command}
              index={index}
              editing={editing}
              onChange={(value) => updateCommand(index, value)}
            />
          ))}
        </div>

        <div className="approval-actions">
          <button type="button" className="execute-button" onClick={handleExecute} disabled={running}>
            {running ? "EXECUTANDO" : "AUTORIZAR EXECUÇÃO"}
          </button>
          <button type="button" onClick={() => setEditing((current) => !current)} disabled={running}>
            {editing ? "BLOQUEAR EDIÇÃO" : "EDITAR PLANO"}
          </button>
          <button type="button" onClick={handleCopy}>
            COPIAR COMANDOS
          </button>
          <button type="button" onClick={handleCancel} disabled={running}>
            CANCELAR
          </button>
        </div>
      </section>
    </div>
  );
}

function MetaBlock({ title, values }: { title: string; values: string[] }): JSX.Element {
  return (
    <div>
      <span>{title}</span>
        <strong>{values.length ? values.join(", ") : "nenhum"}</strong>
    </div>
  );
}

function CommandEditor({
  command,
  index,
  editing,
  onChange,
}: {
  command: PlannedCommand;
  index: number;
  editing: boolean;
  onChange: (value: string) => void;
}): JSX.Element {
  return (
    <div className="command-editor">
      <div className="command-meta">
        <span>#{index + 1}</span>
        <strong>{command.description}</strong>
        <em>{command.requiresSudo ? "sudo" : "usuário"} / {command.destructive ? "destrutivo" : "seguro"}</em>
      </div>
      {editing ? (
        <textarea value={command.command} onChange={(event) => onChange(event.target.value)} rows={2} />
      ) : (
        <code>{command.command}</code>
      )}
    </div>
  );
}

function riskLabel(level: string): string {
  const labels: Record<string, string> = {
    low: "baixo",
    medium: "médio",
    high: "alto",
    critical: "crítico",
  };
  return labels[level] ?? level;
}

function targetLabel(nodeId: string): string {
  return galaxyObjectById.get(nodeId)?.label ?? nodeId;
}
