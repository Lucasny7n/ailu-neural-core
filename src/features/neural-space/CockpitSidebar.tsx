import { useNeuralStore, type AppRoute } from "../../store/useNeuralStore";

interface NavItem {
  id: string;
  label: string;
  route: AppRoute;
  objectId?: string;
}

const navItems: NavItem[] = [
  { id: "overview", label: "Visão Geral", route: "neural", objectId: "core" },
  { id: "core", label: "Núcleo", route: "neural", objectId: "core" },
  { id: "memory", label: "Memória", route: "memory", objectId: "memory" },
  { id: "actions", label: "Ações", route: "actions", objectId: "actions" },
  { id: "interface", label: "Interface", route: "neural", objectId: "interface" },
  { id: "ai", label: "IA", route: "providers", objectId: "ai" },
  { id: "system", label: "Sistema", route: "diagnostics", objectId: "system" },
  { id: "connectivity", label: "Conectividade", route: "neural", objectId: "connectivity" },
  { id: "storage", label: "Armazenamento", route: "neural", objectId: "storage" },
  { id: "settings", label: "Configurações", route: "settings" },
];

export function CockpitSidebar(): JSX.Element {
  const route = useNeuralStore((state) => state.route);
  const selectedGalaxyObjectId = useNeuralStore((state) => state.selectedGalaxyObjectId);
  const viewMode = useNeuralStore((state) => state.viewMode);
  const setRoute = useNeuralStore((state) => state.setRoute);
  const setViewMode = useNeuralStore((state) => state.setViewMode);
  const focusGalaxyObject = useNeuralStore((state) => state.focusGalaxyObject);
  const addTelemetry = useNeuralStore((state) => state.addTelemetry);

  return (
    <aside className="ailu-sidebar hud-grid-bg" aria-label="Navegação principal">
      <div className="ailu-sidebar__section">
        {navItems.map((item) => {
          const active = route === item.route && (!item.objectId || selectedGalaxyObjectId === item.objectId);
          return (
            <button
              key={item.id}
              type="button"
              className={`ailu-nav-button ${active ? "is-active" : ""}`}
              onClick={() => {
                setRoute(item.route);
                if (item.objectId) {
                  focusGalaxyObject(item.objectId);
                }
                addTelemetry({ level: "info", message: `Navegação: ${item.label}` });
              }}
            >
              <span className="ailu-nav-button__icon" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="ailu-sidebar__mode">
        <span className="hud-section-title">Modo de visualização</span>
        <button
          type="button"
          className={`hud-button ${viewMode === "exploration" ? "active" : ""}`}
          onClick={() => {
            setRoute("neural");
            setViewMode("exploration");
            addTelemetry({ level: "info", message: "Modo exploração ativado." });
          }}
        >
          Ver galáxia inteira
        </button>
        <button
          type="button"
          className={`hud-button ${viewMode === "cockpit" ? "active" : ""}`}
          onClick={() => {
            setRoute("neural");
            setViewMode("cockpit");
            focusGalaxyObject("core");
            addTelemetry({ level: "info", message: "Modo cockpit ativado." });
          }}
        >
          Voltar ao cockpit
        </button>
      </div>
    </aside>
  );
}
