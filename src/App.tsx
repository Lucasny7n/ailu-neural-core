import { useEffect } from "react";
import { ActionsView } from "./features/actions/ActionsView";
import { ProvidersView } from "./features/ai-router/ProvidersView";
import { SettingsView } from "./features/config/SettingsView";
import { MemoryCoreView } from "./features/memory-core/MemoryCoreView";
import { AiluNeuralSpace } from "./features/neural-space/AiluNeuralSpace";
import { CockpitShell } from "./features/neural-space/CockpitShell";
import { DiagnosticsView } from "./features/system-agent/DiagnosticsView";
import { getConfigState } from "./features/system-agent/systemAgentClient";
import { useNeuralStore, type AppRoute } from "./store/useNeuralStore";
import "./styles.css";

export function App(): JSX.Element {
  const route = useNeuralStore((state) => state.route);
  const setConfig = useNeuralStore((state) => state.setConfig);

  useEffect(() => {
    getConfigState().then(setConfig);
  }, [setConfig]);

  return (
    <CockpitShell route={route}>
      {renderRoute(route)}
    </CockpitShell>
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
