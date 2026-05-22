import { FormEvent, useState } from "react";
import { generateSystemActionPlan } from "../ai-router/aiRouter";
import { buildConversationResponse } from "../ai-router/conversationResponder";
import { classifyOperatorIntent, diagnosticKeyForNode } from "../ai-router/intentRouter";
import type { ConversationSuggestion } from "../ai-router/intentTypes";
import { detectMemoryCapture } from "../memory-core/memoryClient";
import { MemoryContextPanel } from "../memory-core/MemoryContextPanel";
import type { BuiltMemoryContext } from "../memory-core/memoryTypes";
import { useMemoryStore } from "../memory-core/useMemoryStore";
import { recordSystemAction, runSafeDiagnostic } from "../system-agent/systemAgentClient";
import { localMemoryGraphService } from "../memory-graph/localMemoryGraphService";
import { useNeuralStore } from "../../store/useNeuralStore";
import { emitNeuralEvent } from "./neuralEvents";

export function OperatorCommandConsole(): JSX.Element {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const config = useNeuralStore((state) => state.config);
  const operatorExchange = useNeuralStore((state) => state.operatorExchange);
  const setActivePlan = useNeuralStore((state) => state.setActivePlan);
  const setOperatorExchange = useNeuralStore((state) => state.setOperatorExchange);
  const addTelemetry = useNeuralStore((state) => state.addTelemetry);
  const addDiagnostic = useNeuralStore((state) => state.addDiagnostic);
  const setNodeStatus = useNeuralStore((state) => state.setNodeStatus);
  const selectNode = useNeuralStore((state) => state.selectNode);
  const setRoute = useNeuralStore((state) => state.setRoute);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const request = value.trim();
    if (!request || busy) {
      return;
    }

    await handleOperatorRequest(request);
  }

  async function handleOperatorRequest(request: string): Promise<void> {
    setBusy(true);
    const intent = classifyOperatorIntent(request);
    let memoryContext: BuiltMemoryContext | undefined = undefined;
    try {
      memoryContext = await useMemoryStore.getState().buildContext(request, intent.intent, intent.targetNodes);
    } catch (error) {
      addTelemetry({
        level: "warn",
        message: error instanceof Error ? `Memory Core indisponivel: ${error.message}` : "Memory Core indisponivel.",
      });
    }

    const capture = detectMemoryCapture(request);
    if (capture) {
      try {
        const detail =
          capture.kind === "decision"
            ? await useMemoryStore.getState().captureDecision(capture.content)
            : await useMemoryStore.getState().captureRule(capture.content);
        const response = {
          title: capture.kind === "decision" ? "Decisao salva" : "Regra salva",
          body: `Memoria persistida em ${detail.note.path}. Ela ja foi indexada no vault local e entra nas proximas recuperacoes de contexto.`,
          suggestions: [
            { id: "open-memory-core", label: "Abrir Memory", kind: "navigate" as const, nodeId: "memory" },
          ],
        };
        setOperatorExchange({
          userMessage: request,
          intent: { ...intent, intent: "question", responseMode: "answer", requiresApproval: false, shouldCreateActionPlan: false },
          response,
          memoryContext,
          createdAt: new Date().toISOString(),
        });
        addTelemetry({ level: "success", message: `MEMORY captured ${capture.kind}: ${detail.note.title}` });
        setNodeStatus("memory", "success");
        setValue("");
        return;
      } catch (error) {
        addTelemetry({
          level: "error",
          message: error instanceof Error ? error.message : "Falha ao capturar memoria.",
        });
      } finally {
        setBusy(false);
      }
      return;
    }

    const response = buildConversationResponse(request, intent, memoryContext);
    setOperatorExchange({
      userMessage: request,
      intent,
      response,
      memoryContext,
      createdAt: new Date().toISOString(),
    });
    addTelemetry({
      level: "info",
      message: `intent=${intent.intent} confidence=${intent.confidence.toFixed(2)} mode=${intent.responseMode}`,
    });

    try {
      if (intent.responseMode === "navigate") {
        setActivePlan(undefined);
        const targetNodeId = intent.targetNodes[0] ?? "core";
        setRoute("neural");
        selectNode(targetNodeId);
        setNodeStatus(targetNodeId, "ready");
        setNodeStatus("core", "ready");
        addTelemetry({ level: "success", message: `NAV focus node=${targetNodeId.toUpperCase()}` });
        setValue("");
        return;
      }

      if (intent.responseMode === "answer" || intent.responseMode === "feedback") {
        setActivePlan(undefined);
        setNodeStatus("core", "ready");
        addTelemetry({ level: "success", message: `ANSWER ${intent.summary}` });
        setValue("");
        return;
      }

      if (intent.responseMode === "diagnostic") {
        setActivePlan(undefined);
        await runDiagnosticIntent(intent.targetNodes);
        setNodeStatus("core", "ready");
        setValue("");
        return;
      }

      setNodeStatus("core", "thinking");
      emitNeuralEvent({ name: "core:thinking", nodeId: "core" });
      const result = await generateSystemActionPlan(request, config, memoryContext);
      setActivePlan(result.plan, result.source);
      result.plan.targetNodes.forEach((nodeId) => setNodeStatus(nodeId, "approval"));
      selectNode(result.plan.targetNodes[0] ?? "actions");
      addTelemetry({
        level: result.source === "ai" ? "success" : "warn",
        message:
          result.source === "ai"
            ? `Plano criado por ${result.plan.model}.`
            : `Fallback local criou plano; IA: ${result.providerStatus.message}`,
      });
      await localMemoryGraphService.addEpisode({
        id: result.plan.id,
        title: result.plan.title,
        body: result.plan.description,
        source: result.source === "ai" ? "ai" : "system",
        createdAt: result.plan.createdAt,
        relatedNodes: result.plan.targetNodes.length ? result.plan.targetNodes : ["core"],
      });
      try {
        await recordSystemAction(result.plan, "planned");
        await useMemoryStore.getState().captureAction(
          JSON.stringify({ request, plan: result.plan, source: result.source }, null, 2),
          result.plan.title,
        );
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

  async function runDiagnosticIntent(targetNodes: string[]): Promise<void> {
    const targetNodeId = targetNodes[0] ?? "system";
    const diagnosticKey = diagnosticKeyForNode(targetNodeId) ?? "system-overview";
    await runDiagnosticByKey(diagnosticKey, targetNodeId);
  }

  async function runDiagnosticByKey(diagnosticKey: string, targetNodeId: string): Promise<void> {
    setRoute("neural");
    selectNode(targetNodeId);
    setNodeStatus(targetNodeId, "running");
    addTelemetry({ level: "info", message: `RUN diagnostic=${diagnosticKey} approval=false` });
    try {
      const diagnostic = await runSafeDiagnostic(diagnosticKey);
      addDiagnostic(diagnostic);
      setNodeStatus(targetNodeId, diagnostic.status === "success" ? "success" : "warning");
      addTelemetry({
        level: diagnostic.status === "success" ? "success" : "warn",
        message: `OK diagnostic ${diagnosticKey} status=${diagnostic.status}`,
      });
    } catch (error) {
      setNodeStatus(targetNodeId, "error");
      addTelemetry({
        level: "error",
        message: error instanceof Error ? `ERR diagnostic ${diagnosticKey}: ${error.message}` : `ERR diagnostic ${diagnosticKey}`,
      });
    }
  }

  async function handleSuggestion(suggestion: ConversationSuggestion): Promise<void> {
    if (suggestion.kind === "navigate" && suggestion.nodeId) {
      setRoute("neural");
      selectNode(suggestion.nodeId);
      addTelemetry({ level: "success", message: `NAV focus node=${suggestion.nodeId.toUpperCase()}` });
      return;
    }
    if (suggestion.kind === "diagnostic" && suggestion.diagnosticKey) {
      await runDiagnosticByKey(suggestion.diagnosticKey, suggestion.nodeId ?? "system");
      return;
    }
    if (suggestion.kind === "action-plan" && suggestion.prompt) {
      await handleOperatorRequest(suggestion.prompt);
    }
  }

  async function handleSaveConversation(): Promise<void> {
    if (!operatorExchange) {
      return;
    }
    await useMemoryStore
      .getState()
      .captureConversation(operatorExchange.userMessage, operatorExchange.response.body, operatorExchange.response.title);
    addTelemetry({ level: "success", message: "MEMORY conversation captured" });
  }

  async function handleSaveDecision(): Promise<void> {
    if (!operatorExchange) {
      return;
    }
    await useMemoryStore.getState().captureDecision(operatorExchange.response.body);
    addTelemetry({ level: "success", message: "MEMORY decision captured" });
  }

  async function handleSaveRule(): Promise<void> {
    if (!operatorExchange) {
      return;
    }
    await useMemoryStore.getState().captureRule(operatorExchange.response.body);
    addTelemetry({ level: "success", message: "MEMORY rule captured" });
  }

  return (
    <section className="operator-console hud-corners">
      {operatorExchange ? (
        <div className="operator-response">
          <div className="operator-response__meta">
            <span>{operatorExchange.intent.intent}</span>
            <strong>{operatorExchange.response.title}</strong>
            <em>{Math.round(operatorExchange.intent.confidence * 100)}%</em>
          </div>
          <p>{operatorExchange.response.body}</p>
          {operatorExchange.response.suggestions.length > 0 ? (
            <div className="operator-suggestions">
              {operatorExchange.response.suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  className={`hud-button suggestion-${suggestion.kind}`}
                  onClick={() => void handleSuggestion(suggestion)}
                  disabled={busy}
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      <MemoryContextPanel
        onOpenMemoryCore={() => setRoute("memory")}
        onSaveConversation={() => void handleSaveConversation()}
        onSaveDecision={() => void handleSaveDecision()}
        onSaveRule={() => void handleSaveRule()}
      />
      <form onSubmit={handleSubmit}>
        <label htmlFor="operator-command">OPERATOR INTENT CHANNEL</label>
        <div className="operator-input-row">
          <input
            id="operator-command"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="ORDEM DO OPERADOR > conversar, perguntar, diagnosticar ou preparar ação..."
            autoComplete="off"
          />
          <button type="submit" className="hud-button hud-button--primary" disabled={busy || !value.trim()}>
            {busy ? "Analisando" : "Enviar"}
          </button>
        </div>
      </form>
    </section>
  );
}
