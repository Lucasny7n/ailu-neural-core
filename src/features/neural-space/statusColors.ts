import type { NeuralNodeStatus } from "./neuralGraph";

export const statusColors: Record<NeuralNodeStatus, string> = {
  idle: "#38d5ff",
  ready: "#66f2b0",
  thinking: "#38d5ff",
  approval: "#ffb84d",
  running: "#198cff",
  success: "#66f2b0",
  warning: "#ffbf4d",
  danger: "#ff5c7a",
  error: "#ff5c7a",
};

export function statusLabel(status: NeuralNodeStatus): string {
  const labels: Record<NeuralNodeStatus, string> = {
    idle: "IDLE",
    ready: "READY",
    thinking: "THINKING",
    approval: "APPROVAL",
    running: "RUNNING",
    success: "SUCCESS",
    warning: "WARNING",
    danger: "DANGER",
    error: "ERROR",
  };
  return labels[status];
}
