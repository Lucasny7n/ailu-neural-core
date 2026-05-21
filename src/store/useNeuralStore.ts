import { create } from "zustand";
import type { SystemActionPlan } from "../features/ai-router/aiTypes";
import { defaultAppConfig, type AppConfig } from "../features/config/configTypes";
import type { NeuralNodeStatus } from "../features/neural-space/neuralGraph";
import type {
  ActionSummary,
  CommandExecutionLog,
  DiagnosticResult,
  SystemSnapshot,
} from "../features/system-agent/systemTypes";

export type AppRoute = "neural" | "actions" | "providers" | "diagnostics" | "settings";

export interface TelemetryEntry {
  id: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
  createdAt: string;
}

interface NeuralState {
  route: AppRoute;
  selectedNodeId: string;
  focusedConnectionId?: string;
  expandedNodeIds: string[];
  nodeStatusById: Record<string, NeuralNodeStatus>;
  activePlan?: SystemActionPlan;
  planSource?: "ollama" | "fallback";
  telemetry: TelemetryEntry[];
  executionLogs: CommandExecutionLog[];
  diagnostics: DiagnosticResult[];
  snapshot?: SystemSnapshot;
  recentActions: ActionSummary[];
  config: AppConfig;
  setRoute: (route: AppRoute) => void;
  selectNode: (nodeId: string) => void;
  focusConnection: (connectionId: string) => void;
  setNodeStatus: (nodeId: string, status: NeuralNodeStatus) => void;
  setActivePlan: (plan: SystemActionPlan | undefined, source?: "ollama" | "fallback") => void;
  addTelemetry: (entry: Omit<TelemetryEntry, "id" | "createdAt">) => void;
  setExecutionLogs: (logs: CommandExecutionLog[]) => void;
  addDiagnostic: (diagnostic: DiagnosticResult) => void;
  setSnapshot: (snapshot: SystemSnapshot) => void;
  setRecentActions: (actions: ActionSummary[]) => void;
  setConfig: (config: AppConfig) => void;
}

export const useNeuralStore = create<NeuralState>((set) => ({
  route: "neural",
  selectedNodeId: "core",
  focusedConnectionId: undefined,
  expandedNodeIds: ["core"],
  nodeStatusById: {},
  activePlan: undefined,
  planSource: undefined,
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
  setRoute: (route) => set({ route }),
  selectNode: (nodeId) =>
    set((state) => ({
      selectedNodeId: nodeId,
      expandedNodeIds: state.expandedNodeIds.includes(nodeId)
        ? state.expandedNodeIds
        : [...state.expandedNodeIds, nodeId],
    })),
  focusConnection: (connectionId) => set({ focusedConnectionId: connectionId }),
  setNodeStatus: (nodeId, status) =>
    set((state) => ({
      nodeStatusById: {
        ...state.nodeStatusById,
        [nodeId]: status,
      },
    })),
  setActivePlan: (plan, source) => set({ activePlan: plan, planSource: source }),
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
  setConfig: (config) => set({ config: { ...config, requireApprovalForAllActions: true } }),
}));
