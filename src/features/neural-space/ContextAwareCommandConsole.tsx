import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { generateSystemActionPlan } from "../ai-router/aiRouter";
import { buildConversationResponse } from "../ai-router/conversationResponder";
import {
  classifyOperatorIntent,
  diagnosticKeyForNode,
  resolveIntentWithActiveContext,
} from "../ai-router/intentRouter";
import type { ConversationSuggestion } from "../ai-router/intentTypes";
import { detectMemoryCapture } from "../memory-core/memoryClient";
import type { BuiltMemoryContext } from "../memory-core/memoryTypes";
import { useMemoryStore } from "../memory-core/useMemoryStore";
import { localMemoryGraphService } from "../memory-graph/localMemoryGraphService";
import { recordSystemAction, runSafeDiagnostic } from "../system-agent/systemAgentClient";
import { useNeuralStore } from "../../store/useNeuralStore";
import { emitNeuralEvent } from "./neuralEvents";
import { voiceClient } from "../voice/voiceClient";

type ConsoleMode = "conversation" | "diagnostic" | "action" | "memory" | "explore";

export function ContextAwareCommandConsole(): JSX.Element {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<ConsoleMode>("conversation");
  const voiceStatus = useNeuralStore((state) => state.voiceStatus);
  const setVoiceStatus = useNeuralStore((state) => state.setVoiceStatus);
  const handledQueueId = useRef<string | undefined>(undefined);
  const config = useNeuralStore((state) => state.config);
  const activeContext = useNeuralStore((state) => state.activeContext);
  const selectedConnectionId = useNeuralStore((state) => state.selectedConnectionId);
  const queuedConsoleCommand = useNeuralStore((state) => state.queuedConsoleCommand);
  const operatorExchange = useNeuralStore((state) => state.operatorExchange);
  const setActivePlan = useNeuralStore((state) => state.setActivePlan);
  const setOperatorExchange = useNeuralStore((state) => state.setOperatorExchange);
  const addTelemetry = useNeuralStore((state) => state.addTelemetry);
  const addDiagnostic = useNeuralStore((state) => state.addDiagnostic);
  const setNodeStatus = useNeuralStore((state) => state.setNodeStatus);
  const selectGalaxyObject = useNeuralStore((state) => state.selectGalaxyObject);
  const clearActiveContext = useNeuralStore((state) => state.clearActiveContext);
  const clearQueuedConsoleCommand = useNeuralStore((state) => state.clearQueuedConsoleCommand);
  const setRoute = useNeuralStore((state) => state.setRoute);

  const runDiagnosticByKey = useCallback(
    async (diagnosticKey: string, targetNodeId: string): Promise<void> => {
      setRoute("neural");
      selectGalaxyObject(targetNodeId);
      setNodeStatus(targetNodeId, "running");
      addTelemetry({ level: "info", message: `Leitura segura iniciada: ${diagnosticKey}` });
      try {
        const diagnostic = await runSafeDiagnostic(diagnosticKey);
        addDiagnostic(diagnostic);
        setNodeStatus(targetNodeId, diagnostic.status === "success" ? "success" : "warning");
        addTelemetry({
          level: diagnostic.status === "success" ? "success" : "warn",
          message: `Diagnóstico concluído: ${diagnostic.title}`,
        });
      } catch (error) {
        setNodeStatus(targetNodeId, "error");
        addTelemetry({
          level: "error",
          message: error instanceof Error ? error.message : "Falha no diagnóstico seguro.",
        });
      }
    },
    [addDiagnostic, addTelemetry, selectGalaxyObject, setNodeStatus, setRoute],
  );

  const handleOperatorRequest = useCallback(
    async (rawRequest: string): Promise<void> => {
      const request = requestForMode(rawRequest, mode);
      if (!request || busy) {
        return;
      }
      setBusy(true);
      const baseIntent = classifyOperatorIntent(request);
      const resolution = resolveIntentWithActiveContext(request, baseIntent, activeContext);
      const intent = resolution.intent;
      let memoryContext: BuiltMemoryContext | undefined = undefined;

      try {
        const memoryQuery = resolution.activeContextUsed && activeContext ? `${request}\n${activeContext.title}\n${activeContext.description ?? ""}` : request;
        memoryContext = await useMemoryStore.getState().buildContext(memoryQuery, intent.intent, intent.targetNodes);
      } catch (error) {
        addTelemetry({
          level: "warn",
          message: error instanceof Error ? `Núcleo de Memória indisponível: ${error.message}` : "Núcleo de Memória indisponível.",
        });
      }

      const capture = detectMemoryCapture(request);
      if (capture || mode === "memory") {
        try {
          const content = capture?.content ?? request;
          const detail =
            capture?.kind === "rule"
              ? await useMemoryStore.getState().captureRule(content)
              : await useMemoryStore.getState().captureDecision(content);
          setOperatorExchange({
            userMessage: request,
            intent: { ...intent, intent: "question", responseMode: "answer", requiresApproval: false, shouldCreateActionPlan: false },
            response: {
              title: capture?.kind === "rule" ? "Regra salva" : "Decisão salva",
              body: `Memória persistida em ${detail.note.path}. Ela entra nas próximas recuperações de contexto.`,
              suggestions: [{ id: "open-memory-core", label: "Abrir Memória", kind: "navigate", nodeId: "memory" }],
            },
            memoryContext,
            activeContext,
            activeContextUsed: resolution.activeContextUsed,
            activeContextIgnoredReason: resolution.activeContextIgnoredReason,
            createdAt: new Date().toISOString(),
          });
          addTelemetry({ level: "success", message: `Memória salva: ${detail.note.title}` });
          if (config.voiceAutoSpeak) voiceClient.speak(capture?.kind === "rule" ? "Regra salva" : "Decisão salva");
          setNodeStatus("memory", "success");
          setValue("");
          return;
        } catch (error) {
          addTelemetry({
            level: "error",
            message: error instanceof Error ? error.message : "Falha ao salvar memória.",
          });
        } finally {
          setBusy(false);
        }
        return;
      }

      const response = buildConversationResponse(
        request,
        intent,
        memoryContext,
        activeContext,
        resolution.activeContextUsed,
        resolution.activeContextIgnoredReason,
      );
      setOperatorExchange({
        userMessage: request,
        intent,
        response,
        memoryContext,
        activeContext,
        activeContextUsed: resolution.activeContextUsed,
        activeContextIgnoredReason: resolution.activeContextIgnoredReason,
        createdAt: new Date().toISOString(),
      });
      addTelemetry({
        level: "info",
        message: resolution.activeContextUsed
          ? `Contexto ativo usado: ${activeContext?.title ?? "nenhum"}`
          : resolution.activeContextIgnoredReason ?? `Intenção: ${intent.intent}`,
      });

      if (config.voiceAutoSpeak) voiceClient.speak(response.body);

      try {
        if (intent.responseMode === "navigate") {
          setActivePlan(undefined);
          const targetNodeId = intent.targetNodes[0] ?? "core";
          setRoute("neural");
          selectGalaxyObject(targetNodeId);
          setNodeStatus(targetNodeId, "success");
          setValue("");
          return;
        }

        if (intent.responseMode === "answer" || intent.responseMode === "feedback") {
          setActivePlan(undefined);
          setNodeStatus("core", "success");
          setValue("");
          return;
        }

        if (intent.responseMode === "diagnostic") {
          setActivePlan(undefined);
          const targetNodeId = intent.targetNodes[0] ?? activeContext?.nodeId ?? "system";
          const diagnosticKey = diagnosticKeyForNode(targetNodeId) ?? "system-overview";
          await runDiagnosticByKey(diagnosticKey, targetNodeId);
          setValue("");
          return;
        }

        setNodeStatus("core", "thinking");
        emitNeuralEvent({ name: "core:thinking", nodeId: "core" });
        const planRequest =
          resolution.activeContextUsed && activeContext
            ? `${request}\n\nCONTEXTO ATIVO:\nTipo: ${activeContext.kind}\nTítulo: ${activeContext.title}\nDescrição: ${activeContext.description ?? "indisponível"}\nFonte: ${activeContext.sourcePath ?? activeContext.memoryNoteId ?? "interna"}`
            : request;
        const result = await generateSystemActionPlan(planRequest, config, memoryContext, resolution.activeContextUsed ? activeContext : undefined);
        setActivePlan(result.plan, result.source);
        result.plan.targetNodes.forEach((nodeId) => setNodeStatus(nodeId, "approval"));
        selectGalaxyObject(result.plan.targetNodes[0] ?? "actions");
        addTelemetry({
          level: result.source === "ai" ? "success" : "warn",
          message:
            result.source === "ai"
              ? `Plano criado por ${result.plan.model}.`
              : `Plano local criado; IA: ${result.providerStatus.message}`,
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
            JSON.stringify({ request, activeContext: resolution.activeContextUsed ? activeContext : undefined, plan: result.plan, source: result.source }, null, 2),
            result.plan.title,
          );
        } catch {
          addTelemetry({ level: "warn", message: "Plano em memória da UI; persistência Tauri indisponível." });
        }
        setNodeStatus("core", "approval");
        emitNeuralEvent({ name: "core:approval", nodeId: "core" });
        setValue("");
      } catch (error) {
        setNodeStatus("core", "error");
        addTelemetry({
          level: "error",
          message: error instanceof Error ? error.message : "Falha ao gerar plano de ação.",
        });
        emitNeuralEvent({ name: "core:error", nodeId: "core" });
      } finally {
        setBusy(false);
      }
    },
    [
      activeContext,
      addTelemetry,
      busy,
      config,
      mode,
      runDiagnosticByKey,
      selectGalaxyObject,
      setActivePlan,
      setNodeStatus,
      setOperatorExchange,
      setRoute,
    ],
  );

  useEffect(() => {
    setVoiceStatus({ state: "idle", isAvailable: voiceClient.isAvailable() });
    voiceClient.onTranscript((text) => {
      setValue(text);
      void handleOperatorRequest(text);
    });
    voiceClient.onStateChange((status) => {
      setVoiceStatus(status);
    });
  }, [setVoiceStatus, handleOperatorRequest]);

  useEffect(() => {
    if (!queuedConsoleCommand || handledQueueId.current === queuedConsoleCommand.id) {
      return;
    }
    handledQueueId.current = queuedConsoleCommand.id;
    setValue(queuedConsoleCommand.text);
    void handleOperatorRequest(queuedConsoleCommand.text).finally(() => {
      clearQueuedConsoleCommand(queuedConsoleCommand.id);
    });
  }, [clearQueuedConsoleCommand, handleOperatorRequest, queuedConsoleCommand]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await handleOperatorRequest(value.trim());
  }

  async function handleSaveDecision(): Promise<void> {
    const content = value.trim() || operatorExchange?.response.body;
    if (!content) {
      return;
    }
    try {
      const detail = await useMemoryStore.getState().captureDecision(content);
      addTelemetry({ level: "success", message: `Decisão salva: ${detail.note.title}` });
      setValue("");
    } catch (error) {
      addTelemetry({ level: "error", message: error instanceof Error ? error.message : "Falha ao salvar decisão." });
    }
  }

  async function handleDreamNow(): Promise<void> {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      const memoryState = useMemoryStore.getState();
      const dreamContext = await memoryState.buildContext(
        `sonhar agora ${activeContext?.title ?? ""} ${activeContext?.description ?? ""}`,
        "dream",
        activeContext?.nodeId ? [activeContext.nodeId] : undefined,
      );
      if (!dreamContext.notes.length && !dreamContext.chunks.length) {
        const intent = classifyOperatorIntent("sonhar agora");
        setOperatorExchange({
          userMessage: "Sonhar agora",
          intent: { ...intent, responseMode: "answer", requiresApproval: false, shouldCreateActionPlan: false },
          response: {
            title: "Memória insuficiente",
            body: "Não há memórias suficientes para sonhar. Salve decisões ou importe arquivos para alimentar o núcleo.",
            suggestions: [{ id: "open-memory-core", label: "Abrir Memória", kind: "navigate", nodeId: "memory" }],
          },
          memoryContext: dreamContext,
          activeContext,
          activeContextUsed: Boolean(activeContext),
          createdAt: new Date().toISOString(),
        });
        addTelemetry({ level: "warn", message: "Dreaming Engine sem memória suficiente." });
        return;
      }

      const sourceList = dreamContext.sourceLabels.slice(0, 6).join(", ") || "memória local recuperada";
      const body = [
        "## Sonho Neural",
        "",
        `Contexto focado: ${activeContext?.title ?? "Núcleo geral"}`,
        `Fontes: ${sourceList}`,
        "",
        "## Sugestão de relação",
        "",
        `Relacionar ${activeContext?.title ?? "o núcleo"} com as memórias recentes para revisar decisões, regras e ações salvas antes do próximo plano.`,
        "",
        "## Curadoria sugerida",
        "",
        "- revisar memórias sem tags",
        "- transformar decisões recorrentes em regras",
        "- manter ações reais atrás do Approval Layer",
      ].join("\n");
      const detail = await memoryState.captureDream(body, `Sonho Neural - ${activeContext?.title ?? "Núcleo"}`);
      await memoryState.getGraph();
      const intent = classifyOperatorIntent("sonhar agora");
      setOperatorExchange({
        userMessage: "Sonhar agora",
        intent: { ...intent, responseMode: "answer", requiresApproval: false, shouldCreateActionPlan: false },
        response: {
          title: "Sonho salvo",
          body: `Dreaming Engine criou ${detail.note.path}. Nenhum comando real foi executado.`,
          suggestions: [{ id: "open-memory-core", label: "Abrir Memória", kind: "navigate", nodeId: "memory" }],
        },
        memoryContext: dreamContext,
        activeContext,
        activeContextUsed: Boolean(activeContext),
        createdAt: new Date().toISOString(),
      });
      addTelemetry({ level: "success", message: `Sonho salvo: ${detail.note.title}` });
      setNodeStatus("memory", "success");
    } catch (error) {
      addTelemetry({ level: "error", message: error instanceof Error ? error.message : "Falha no Dreaming Engine." });
    } finally {
      setBusy(false);
    }
  }

  async function handleSuggestion(suggestion: ConversationSuggestion): Promise<void> {
    if (suggestion.kind === "navigate" && suggestion.nodeId) {
      setRoute("neural");
      selectGalaxyObject(suggestion.nodeId);
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

  return (
    <section className="operator-console context-console hud-corners">
      <div className="context-console__bar">
        <span>Contexto ativo: <strong>{activeContext?.title ?? "nenhum"}</strong></span>
        <span>Voz: <strong>{voiceStatusLabel(voiceStatus.state, voiceStatus.isAvailable)}</strong></span>
        <div style={{ display: "flex", gap: "8px" }}>
          {activeContext ? (
            <button type="button" className="hud-button hud-button--micro" onClick={clearActiveContext}>
              Limpar contexto
            </button>
          ) : null}
          <button
            type="button"
            className={`hud-button hud-button--micro ${voiceStatus.state === "listening" ? "active" : ""}`}
            onClick={() => voiceStatus.state === "listening" ? voiceClient.stopListening() : voiceClient.startListening()}
            disabled={!voiceStatus.isAvailable}
          >
            {voiceStatus.state === "listening" ? "Parar Escuta" : "Escutar"}
          </button>
          {voiceStatus.state === "speaking" && (
            <button type="button" className="hud-button hud-button--micro" onClick={() => voiceClient.stopSpeaking()}>
              Parar Fala
            </button>
          )}
        </div>
      </div>

      {operatorExchange ? (
        <div className="operator-response">
          <div className="operator-response__meta">
            <span>{intentLabel(operatorExchange.intent.intent)}</span>
            <strong>{operatorExchange.response.title}</strong>
            <em>{Math.round(operatorExchange.intent.confidence * 100)}%</em>
          </div>
          {operatorExchange.activeContextUsed && operatorExchange.activeContext ? (
            <div className="context-usage context-usage--used">Usando contexto ativo: {operatorExchange.activeContext.title}</div>
          ) : operatorExchange.activeContextIgnoredReason ? (
            <div className="context-usage context-usage--ignored">{operatorExchange.activeContextIgnoredReason}</div>
          ) : null}
          <p>{operatorExchange.response.body}</p>
          <div style={{ marginTop: "8px" }}>
            <button type="button" className="hud-button hud-button--micro" onClick={() => voiceClient.speak(operatorExchange.response.body)}>
              Falar resposta
            </button>
          </div>
          {operatorExchange.memoryContext?.sourceLabels.length ? (
            <div className="memory-used-line">
              <span>Memórias usadas</span>
              <strong>{operatorExchange.memoryContext.sourceLabels.slice(0, 3).join(" / ")}</strong>
            </div>
          ) : null}
          {operatorExchange.response.suggestions.length > 0 ? (
            <div className="operator-suggestions">
              {operatorExchange.response.suggestions.map((suggestion) => (
                <button key={suggestion.id} type="button" className={`hud-button suggestion-${suggestion.kind}`} onClick={() => void handleSuggestion(suggestion)} disabled={busy}>
                  {suggestion.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="console-modes" aria-label="Modo do console">
        <button type="button" className={mode === "conversation" ? "active" : ""} onClick={() => setMode("conversation")}>Conversar</button>
        <button type="button" className={mode === "diagnostic" ? "active" : ""} onClick={() => setMode("diagnostic")}>Diagnosticar</button>
        <button type="button" onClick={() => void handleOperatorRequest(value.trim() || "resuma isso")} disabled={busy}>Resumir</button>
        <button type="button" onClick={() => void handleOperatorRequest("explique essa ligação")} disabled={busy || !selectedConnectionId}>Explicar ligação</button>
        <button type="button" className={mode === "action" ? "active" : ""} onClick={() => setMode("action")}>Preparar ação</button>
        <button type="button" onClick={() => void handleSaveDecision()}>Salvar decisão</button>
        <button type="button" onClick={() => void handleDreamNow()} disabled={busy}>Sonhar agora</button>
        <button
          type="button"
          className={voiceStatus.state === "listening" ? "active" : ""}
          onClick={() => voiceClient.startListening()}
          disabled={!voiceStatus.isAvailable || voiceStatus.state === "listening"}
          title={voiceStatus.isAvailable ? "Iniciar reconhecimento de voz" : "Reconhecimento indisponível"}
        >
          Escutar
        </button>
        <button type="button" onClick={() => { voiceClient.stopListening(); voiceClient.stopSpeaking(); }}>
          Parar
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <label htmlFor="operator-command">Canal de Entrada {voiceStatus.state === "listening" && "(Ouvindo...)"}</label>
        <div className="operator-input-row">
          <input
            id="operator-command"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Pergunte, converse, diagnostique ou prepare uma ação..."
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

function requestForMode(request: string, mode: ConsoleMode): string {
  if (mode === "diagnostic" && !/diagnostica|diagnosticar|verifica|verificar|mostra|status/i.test(request)) {
    return `diagnostica ${request}`;
  }
  if (mode === "action" && !/prepara|preparar|apaga|remove|instala|reinicia|limpa|otimiza/i.test(request)) {
    return `preparar ação ${request}`;
  }
  if (mode === "explore" && !/abre|abrir|foca|mostra/i.test(request)) {
    return `abre ${request}`;
  }
  return request;
}

function intentLabel(intent: string): string {
  const labels: Record<string, string> = {
    conversation: "Conversa",
    question: "Pergunta",
    explain: "Explicação",
    "safe-diagnostic": "Diagnóstico",
    "system-action": "Ação",
    "app-navigation": "Navegação",
    "app-feedback": "Feedback",
    "settings-change": "Configuração",
    unknown: "Ambígua",
  };
  return labels[intent] ?? intent;
}

function voiceStatusLabel(state: string, available: boolean): string {
  if (!available) {
    return "Reconhecimento indisponível";
  }
  const labels: Record<string, string> = {
    idle: "Inativa",
    listening: "Ouvindo",
    processing: "Processando",
    speaking: "Falando",
    error: "Erro",
  };
  return labels[state] ?? "N/D";
}
