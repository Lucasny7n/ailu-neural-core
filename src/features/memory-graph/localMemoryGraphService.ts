import { safeInvoke } from "../../lib/tauri";
import type { MemoryContext, MemoryEdge, MemoryEpisode, MemoryGraphService } from "./memoryGraphTypes";

const localEdges = new Map<string, MemoryEdge>();

export const localMemoryGraphService: MemoryGraphService = {
  async addEpisode(input: MemoryEpisode): Promise<void> {
    const edges = input.relatedNodes.slice(1).map((nodeId) => ({
      fromNode: input.relatedNodes[0] ?? "core",
      toNode: nodeId,
      relation: input.title,
      weight: 0.5,
      source: input.source,
    }));
    await Promise.all(edges.map((edge) => localMemoryGraphService.addEdge(edge)));
  },

  async addEdge(edge: MemoryEdge): Promise<void> {
    const key = edge.id ?? `${edge.fromNode}:${edge.toNode}:${edge.relation}`;
    localEdges.set(key, edge);
    try {
      await safeInvoke<MemoryEdge>("add_memory_edge", { edge });
    } catch {
      // Browser preview keeps an in-memory graph; Tauri persists it.
    }
  },

  async getRelatedNodes(nodeId: string): Promise<MemoryEdge[]> {
    try {
      return await safeInvoke<MemoryEdge[]>("get_related_memory_edges", { nodeId });
    } catch {
      return [...localEdges.values()].filter(
        (edge) => edge.fromNode === nodeId || edge.toNode === nodeId,
      );
    }
  },

  async getActionContext(userRequest: string): Promise<MemoryContext> {
    const lower = userRequest.toLowerCase();
    const edges = [...localEdges.values()].filter((edge) =>
      `${edge.fromNode} ${edge.toNode} ${edge.relation}`.toLowerCase().includes(lower),
    );
    return {
      summary: edges.length
        ? "Contexto encontrado na memória operacional local."
        : "Sem memória operacional relacionada ainda.",
      edges,
      relatedNodes: [...new Set(edges.flatMap((edge) => [edge.fromNode, edge.toNode]))],
    };
  },
};
