import { useEffect } from "react";
import { ActionsView } from "./features/actions/ActionsView";
import { ProvidersView } from "./features/ai-router/ProvidersView";
import { SettingsView } from "./features/config/SettingsView";
import { MemoryCoreView } from "./features/memory-core/MemoryCoreView";
import { AiluNeuralSpace } from "./features/neural-space/AiluNeuralSpace";
import { DiagnosticsView } from "./features/system-agent/DiagnosticsView";
import { getConfigState } from "./features/system-agent/systemAgentClient";
import { useNeuralStore, type AppRoute } from "./store/useNeuralStore";
import "./styles.css";

const navItems: Array<{ id: string; label: string; route?: AppRoute; objectId?: string }> = [
  { id: "overview", label: "Visão Geral", route: "neural", objectId: "core" },
  { id: "core", label: "Núcleo", route: "neural", objectId: "core" },
  { id: "memory", label: "Memória", route: "neural", objectId: "memory" },
  { id: "actions", label: "Ações", route: "neural", objectId: "actions" },
  { id: "interface", label: "Interface", route: "neural", objectId: "interface" },
  { id: "ai", label: "IA", route: "neural", objectId: "ai" },
  { id: "system", label: "Sistema", route: "neural", objectId: "system" },
  { id: "connectivity", label: "Conectividade", route: "neural", objectId: "connectivity" },
  { id: "storage", label: "Armazenamento", route: "neural", objectId: "storage" },
  { id: "settings", label: "Configurações", route: "settings" },
];

export function App(): JSX.Element {
  const route = useNeuralStore((state) => state.route);
  const selectedGalaxyObjectId = useNeuralStore((state) => state.selectedGalaxyObjectId);
  const setRoute = useNeuralStore((state) => state.setRoute);
  const focusGalaxyObject = useNeuralStore((state) => state.focusGalaxyObject);
  const setConfig = useNeuralStore((state) => state.setConfig);

  useEffect(() => {
    getConfigState().then(setConfig);
  }, [setConfig]);

  return (
    <div className="app-shell">
      <nav className="app-sidebar" aria-label="Navegação principal">
        <div className="brand-mark">
          <span>AI</span>
        </div>
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={(item.route === route && (!item.objectId || selectedGalaxyObjectId === item.objectId)) ? "active" : ""}
            onClick={() => {
              setRoute(item.route ?? "neural");
              if (item.objectId) {
                focusGalaxyObject(item.objectId);
              }
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="app-content">{renderRoute(route)}</div>
    </div>
  );
}

function renderRoute(route: AppRoute): JSX.Element {
  switch (route) {
    case "actions":
      return <ActionsView />;
    case "memory":
      return <MemoryCoreView />;
    case "providers":
      return <ProvidersView />;
    case "diagnostics":
      return <DiagnosticsView />;
    case "settings":
      return <SettingsView />;
    case "neural":
    default:
      return <AiluNeuralSpace />;
  }
}
