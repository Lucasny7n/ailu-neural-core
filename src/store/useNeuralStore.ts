import { create } from "zustand";
import type { ConversationResponse, IntentResult } from "../features/ai-router/intentTypes";
import type { SystemActionPlan } from "../features/ai-router/aiTypes";
import { defaultAppConfig, type AppConfig } from "../features/config/configTypes";
import type { BuiltMemoryContext } from "../features/memory-core/memoryTypes";
import {
  connectionToActiveContext,
  galaxyConnectionById,
  galaxyObjectById,
  toActiveContext,
  type ActiveContext,
} from "../features/neural-space/galaxyGraph";
import type { NeuralNodeStatus } from "../features/neural-space/neuralGraph";
import type {
  ActionSummary,
  CommandExecutionLog,
  DiagnosticResult,
  SystemSnapshot,
} from "../features/system-agent/systemTypes";
import type { VoiceStatus } from "../features/voice/voiceClient";

export type AppRoute = "neural" | "memory" | "actions" | "providers" | "diagnostics" | "settings";

export interface TelemetryEntry {
  id: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
  createdAt: string;
}

export interface OperatorExchange {
  userMessage: string;
  intent: IntentResult;
  response: ConversationResponse;
  memoryContext?: BuiltMemoryContext;
  activeContext?: ActiveContext;
  activeContextUsed?: boolean;
  activeContextIgnoredReason?: string;
  createdAt: string;
}

export interface TravelState {
  connectionId: string;
  fromNodeId: string;
  toNodeId: string;
  startedAt: number;
}

export interface QueuedConsoleCommand {
  id: string;
  text: string;
}

interface NeuralState {
  route: AppRoute;
  selectedNodeId: string;
  selectedGalaxyObjectId: string;
  selectedConnectionId?: string;
  activeContext?: ActiveContext;
  activeContextHistory: ActiveContext[];
  queuedConsoleCommand?: QueuedConsoleCommand;
  focusedConnectionId?: string;
  focusHistory: string[];
  travelState?: TravelState;
  expandedNodeIds: string[];
  nodeStatusById: Record<string, NeuralNodeStatus>;
  activePlan?: SystemActionPlan;
  planSource?: "ai" | "fallback";
  operatorExchange?: OperatorExchange;
  lastMemoryContext?: BuiltMemoryContext;
  telemetry: TelemetryEntry[];
  executionLogs: CommandExecutionLog[];
  diagnostics: DiagnosticResult[];
  snapshot?: SystemSnapshot;
  recentActions: ActionSummary[];
  config: AppConfig;
  voiceStatus: VoiceStatus;
  setRoute: (route: AppRoute) => void;
  selectNode: (nodeId: string) => void;
  selectGalaxyObject: (objectId: string, context?: ActiveContext) => void;
  selectGalaxyConnection: (connectionId: string, context?: ActiveContext) => void;
  focusGalaxyObject: (objectId: string, context?: ActiveContext) => void;
  returnToCore: () => void;
  setActiveContext: (context: ActiveContext) => void;
  clearActiveContext: () => void;
  queueConsoleCommand: (text: string) => void;
  clearQueuedConsoleCommand: (id: string) => void;
  goBackFocus: () => void;
  focusConnection: (connectionId: string) => void;
  startConnectionTravel: (connectionId: string, fromNodeId: string, toNodeId: string) => void;
  setNodeStatus: (nodeId: string, status: NeuralNodeStatus) => void;
  setActivePlan: (plan: SystemActionPlan | undefined, source?: "ai" | "fallback") => void;
  setOperatorExchange: (exchange: OperatorExchange) => void;
  setLastMemoryContext: (context: BuiltMemoryContext | undefined) => void;
  addTelemetry: (entry: Omit<TelemetryEntry, "id" | "createdAt">) => void;
  setExecutionLogs: (logs: CommandExecutionLog[]) => void;
  addDiagnostic: (diagnostic: DiagnosticResult) => void;
  setSnapshot: (snapshot: SystemSnapshot) => void;
  setRecentActions: (actions: ActionSummary[]) => void;
  setConfig: (config: AppConfig) => void;
  setVoiceStatus: (status: VoiceStatus) => void;
}

export const useNeuralStore = create<NeuralState>((set) => ({
  route: "neural",
  selectedNodeId: "core",
  selectedGalaxyObjectId: "core",
  selectedConnectionId: undefined,
  activeContext: toActiveContext(galaxyObjectById.get("core")!),
  activeContextHistory: [],
  queuedConsoleCommand: undefined,
  focusedConnectionId: undefined,
  focusHistory: [],
  travelState: undefined,
  expandedNodeIds: ["core"],
  nodeStatusById: {},
  activePlan: undefined,
  planSource: undefined,
  operatorExchange: undefined,
  lastMemoryContext: undefined,
  telemetry: [
    {
      id: "boot",
      level: "info",
      message: "Ailu Neural Core inicializado.",
      createdAt: new Date().toISOString(),
    },
  ],
  executionLogs: [],
  diagnostics: [],
  snapshot: undefined,
  recentActions: [],
  config: defaultAppConfig,
  voiceStatus: { state: "idle", isAvailable: false },
  setRoute: (route) => set({ route }),
  selectNode: (nodeId) =>
    set((state) => {
      const objectItem = galaxyObjectById.get(nodeId);
      const nextContext = objectItem ? toActiveContext(objectItem) : state.activeContext;
      return {
        selectedNodeId: nodeId,
        selectedGalaxyObjectId: objectItem ? nodeId : state.selectedGalaxyObjectId,
        selectedConnectionId: undefined,
        activeContext: nextContext,
        activeContextHistory: pushContextHistory(state.activeContextHistory, state.activeContext, nextContext),
        focusHistory: state.selectedNodeId === nodeId ? state.focusHistory : [...state.focusHistory, state.selectedNodeId].slice(-20),
        expandedNodeIds: state.expandedNodeIds.includes(nodeId)
          ? state.expandedNodeIds
          : [...state.expandedNodeIds, nodeId],
      };
    }),
  selectGalaxyObject: (objectId, context) =>
    set((state) => {
      const objectItem = galaxyObjectById.get(objectId);
      const nextContext = context ?? (objectItem ? toActiveContext(objectItem) : state.activeContext);
      return {
        selectedGalaxyObjectId: objectId,
        selectedNodeId: objectItem ? objectId : state.selectedNodeId,
        selectedConnectionId: undefined,
        focusedConnectionId: undefined,
        activeContext: nextContext,
        activeContextHistory: pushContextHistory(state.activeContextHistory, state.activeContext, nextContext),
        focusHistory:
          state.selectedGalaxyObjectId === objectId
            ? state.focusHistory
            : [...state.focusHistory, state.selectedGalaxyObjectId].slice(-20),
        expandedNodeIds: state.expandedNodeIds.includes(objectId)
          ? state.expandedNodeIds
          : [...state.expandedNodeIds, objectId],
      };
    }),
  selectGalaxyConnection: (connectionId, context) =>
    set((state) => {
      const connection = galaxyConnectionById.get(connectionId);
      const nextContext = context ?? (connection ? connectionToActiveContext(connection) : state.activeContext);
      return {
        selectedConnectionId: connectionId,
        focusedConnectionId: connectionId,
        activeContext: nextContext,
        activeContextHistory: pushContextHistory(state.activeContextHistory, state.activeContext, nextContext),
      };
    }),
  focusGalaxyObject: (objectId, context) => useNeuralStore.getState().selectGalaxyObject(objectId, context),
  returnToCore: () => useNeuralStore.getState().selectGalaxyObject("core"),
  setActiveContext: (context) =>
    set((state) => ({
      activeContext: context,
      activeContextHistory: pushContextHistory(state.activeContextHistory, state.activeContext, context),
    })),
  clearActiveContext: () => set({ activeContext: undefined }),
  queueConsoleCommand: (text) =>
    set({
      queuedConsoleCommand: {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        text,
      },
    }),
  clearQueuedConsoleCommand: (id) =>
    set((state) => ({
      queuedConsoleCommand: state.queuedConsoleCommand?.id === id ? undefined : state.queuedConsoleCommand,
    })),
  goBackFocus: () =>
    set((state) => {
      const previous = state.focusHistory.at(-1);
      if (!previous) {
        const coreContext = toActiveContext(galaxyObjectById.get("core")!);
        return {
          selectedNodeId: "core",
          selectedGalaxyObjectId: "core",
          selectedConnectionId: undefined,
          activeContext: coreContext,
          activeContextHistory: pushContextHistory(state.activeContextHistory, state.activeContext, coreContext),
          focusHistory: [],
        };
      }
      const objectItem = galaxyObjectById.get(previous);
      const nextContext = objectItem ? toActiveContext(objectItem) : state.activeContext;
      return {
        selectedNodeId: previous,
        selectedGalaxyObjectId: objectItem ? previous : state.selectedGalaxyObjectId,
        selectedConnectionId: undefined,
        activeContext: nextContext,
        activeContextHistory: pushContextHistory(state.activeContextHistory, state.activeContext, nextContext),
        focusHistory: state.focusHistory.slice(0, -1),
        expandedNodeIds: state.expandedNodeIds.includes(previous)
          ? state.expandedNodeIds
          : [...state.expandedNodeIds, previous],
      };
    }),
  focusConnection: (connectionId) => set({ focusedConnectionId: connectionId }),
  startConnectionTravel: (connectionId, fromNodeId, toNodeId) =>
    set({
      focusedConnectionId: connectionId,
      travelState: {
        connectionId,
        fromNodeId,
        toNodeId,
        startedAt: performance.now(),
      },
    }),
  setNodeStatus: (nodeId, status) =>
    set((state) => ({
      nodeStatusById: {
        ...state.nodeStatusById,
        [nodeId]: status,
      },
    })),
  setActivePlan: (plan, source) => set({ activePlan: plan, planSource: source }),
  setOperatorExchange: (exchange) => set({ operatorExchange: exchange, lastMemoryContext: exchange.memoryContext }),
  setLastMemoryContext: (context) => set({ lastMemoryContext: context }),
  addTelemetry: (entry) =>
    set((state) => ({
      telemetry: [
        {
          ...entry,
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          createdAt: new Date().toISOString(),
        },
        ...state.telemetry,
      ].slice(0, 160),
    })),
  setExecutionLogs: (logs) => set({ executionLogs: logs }),
  addDiagnostic: (diagnostic) =>
    set((state) => ({
      diagnostics: [diagnostic, ...state.diagnostics.filter((item) => item.key !== diagnostic.key)].slice(0, 20),
    })),
  setSnapshot: (snapshot) => set({ snapshot }),
  setRecentActions: (actions) => set({ recentActions: actions }),
  setConfig: (config) => set({ config: { ...defaultAppConfig, ...config, requireApprovalForAllActions: true } }),
  setVoiceStatus: (voiceStatus) => set({ voiceStatus }),
}));

function pushContextHistory(
  history: ActiveContext[],
  previous: ActiveContext | undefined,
  next: ActiveContext | undefined,
): ActiveContext[] {
  if (!next || previous?.id === next.id) {
    return history;
  }
  const item = previous ?? next;
  return [item, ...history.filter((entry) => entry.id !== item.id)].slice(0, 12);
}
