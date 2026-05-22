import type { ReactNode } from "react";
import { ApprovalLayer } from "../approval/ApprovalLayer";
import type { AppRoute } from "../../store/useNeuralStore";
import { ContextAwareCommandConsole } from "./ContextAwareCommandConsole";
import { CockpitFooter } from "./CockpitFooter";
import { CockpitLeftContextPanel } from "./CockpitLeftContextPanel";
import { CockpitRightObjectPanel } from "./CockpitRightObjectPanel";
import { CockpitSidebar } from "./CockpitSidebar";
import { CockpitTopbar } from "./CockpitTopbar";

interface CockpitShellProps {
  route: AppRoute;
  children: ReactNode;
}

export function CockpitShell({ route, children }: CockpitShellProps): JSX.Element {
  const isNeuralRoute = route === "neural";

  return (
    <div className={`ailu-root ${isNeuralRoute ? "ailu-root--neural" : "ailu-root--route"}`}>
      <CockpitTopbar />
      <CockpitSidebar />
      <main className={isNeuralRoute ? "ailu-main ailu-main--neural" : "ailu-main ailu-main--route"}>
        {isNeuralRoute ? (
          <section className="ailu-stage" aria-label="Cockpit Neural Ailu">
            <div className="ailu-stage__canvas">{children}</div>
            <CockpitLeftContextPanel />
            <CockpitRightObjectPanel />
            <div className="ailu-stage__console">
              <ContextAwareCommandConsole />
            </div>
          </section>
        ) : (
          <section className="ailu-route-stage">{children}</section>
        )}
      </main>
      <CockpitFooter />
      <ApprovalLayer />
    </div>
  );
}
