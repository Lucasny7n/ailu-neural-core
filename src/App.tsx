import { useEffect } from "react";
import { ActionsView } from "./features/actions/ActionsView";
import { ProvidersView } from "./features/ai-router/ProvidersView";
import { SettingsView } from "./features/config/SettingsView";
import { AiluNeuralSpace } from "./features/neural-space/AiluNeuralSpace";
import { DiagnosticsView } from "./features/system-agent/DiagnosticsView";
import { getConfigState } from "./features/system-agent/systemAgentClient";
import { useNeuralStore, type AppRoute } from "./store/useNeuralStore";
import "./styles.css";

const routes: Array<{ id: AppRoute; label: string }> = [
  { id: "neural", label: "Neural Space" },
  { id: "actions", label: "Actions" },
  { id: "providers", label: "Providers" },
  { id: "diagnostics", label: "Diagnostics" },
  { id: "settings", label: "Settings" },
];

export function App(): JSX.Element {
  const route = useNeuralStore((state) => state.route);
  const setRoute = useNeuralStore((state) => state.setRoute);
  const setConfig = useNeuralStore((state) => state.setConfig);

  useEffect(() => {
    getConfigState().then(setConfig);
  }, [setConfig]);

  return (
    <div className="app-shell">
      <nav className="app-sidebar" aria-label="Navegacao principal">
        <div className="brand-mark">
          <span>AI</span>
        </div>
        {routes.map((item) => (
          <button
            key={item.id}
            type="button"
            className={route === item.id ? "active" : ""}
            onClick={() => setRoute(item.id)}
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
