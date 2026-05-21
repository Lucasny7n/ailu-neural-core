export type NeuralEventName =
  | "core:ready"
  | "core:thinking"
  | "core:approval"
  | "core:running"
  | "core:success"
  | "core:error"
  | "node:selected"
  | "connection:travel";

export interface NeuralEvent {
  name: NeuralEventName;
  nodeId?: string;
  connectionId?: string;
  createdAt: string;
}

type NeuralEventListener = (event: NeuralEvent) => void;

const listeners = new Set<NeuralEventListener>();

export function emitNeuralEvent(event: Omit<NeuralEvent, "createdAt">): void {
  const payload: NeuralEvent = {
    ...event,
    createdAt: new Date().toISOString(),
  };
  listeners.forEach((listener) => listener(payload));
}

export function subscribeNeuralEvents(listener: NeuralEventListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
