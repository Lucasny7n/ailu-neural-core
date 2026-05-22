export function memoryGraphNodeId(id: string): string {
  return `memory-node-${id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}
