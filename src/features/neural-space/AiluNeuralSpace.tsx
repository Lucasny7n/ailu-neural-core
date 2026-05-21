import { ApprovalLayer } from "../approval/ApprovalLayer";
import { ActionTimeline } from "./ActionTimeline";
import { AiWorkerDock } from "./AiWorkerDock";
import { NeuralScene } from "./NeuralScene";
import { NodeDetailPanel } from "./NodeDetailPanel";
import { OperatorCommandConsole } from "./OperatorCommandConsole";
import { OperatorStatusPanel } from "./OperatorStatusPanel";
import { TelemetryDeck } from "./TelemetryDeck";

export function AiluNeuralSpace(): JSX.Element {
  return (
    <main className="neural-space">
      <NeuralScene />
      <div className="hud-layer">
        <OperatorStatusPanel />
        <NodeDetailPanel />
        <OperatorCommandConsole />
        <TelemetryDeck />
        <ActionTimeline />
        <AiWorkerDock />
      </div>
      <ApprovalLayer />
    </main>
  );
}
