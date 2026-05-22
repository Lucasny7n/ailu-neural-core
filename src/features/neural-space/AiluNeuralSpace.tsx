import { useNeuralStore } from "../../store/useNeuralStore";
import { ActiveContextBridge } from "./ActiveContextBridge";
import { NeuralGalaxyScene } from "./NeuralGalaxyScene";

export function AiluNeuralSpace(): JSX.Element {
  const selectedConnectionId = useNeuralStore((state) => state.selectedConnectionId);
  return (
    <div className="neural-space">
      <NeuralGalaxyScene />
      <ActiveContextBridge />
      <div className={`travel-vignette ${selectedConnectionId ? "is-active" : ""}`} />
    </div>
  );
}
