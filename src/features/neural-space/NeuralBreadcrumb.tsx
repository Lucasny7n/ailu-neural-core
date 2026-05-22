import { useNeuralStore } from "../../store/useNeuralStore";
import { getNodePath } from "./neuralGraph";

export function NeuralBreadcrumb(): JSX.Element {
  const selectedNodeId = useNeuralStore((state) => state.selectedNodeId);
  const selectNode = useNeuralStore((state) => state.selectNode);
  const goBackFocus = useNeuralStore((state) => state.goBackFocus);
  const addTelemetry = useNeuralStore((state) => state.addTelemetry);
  const path = getNodePath(selectedNodeId);

  return (
    <nav className="neural-breadcrumb hud-corners" aria-label="Neural breadcrumb">
      <button
        type="button"
        className="hud-button hud-button--micro"
        onClick={() => {
          selectNode("core");
          addTelemetry({ level: "success", message: "NAV focus node=CORE" });
        }}
      >
        CORE
      </button>
      <button
        type="button"
        className="hud-button hud-button--micro"
        onClick={() => {
          goBackFocus();
          addTelemetry({ level: "info", message: "NAV back focus" });
        }}
      >
        VOLTAR
      </button>
      <div className="breadcrumb-path">
        {path.map((node, index) => (
          <button key={node.id} type="button" onClick={() => selectNode(node.id)}>
            {index > 0 ? "/" : ""}
            {node.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
