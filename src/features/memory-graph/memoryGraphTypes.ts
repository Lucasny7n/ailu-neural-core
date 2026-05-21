export interface MemoryEpisode {
  id: string;
  title: string;
  body: string;
  source: "operator" | "system" | "ai";
  createdAt: string;
  relatedNodes: string[];
}

export interface MemoryEdge {
  id?: string;
  fromNode: string;
  toNode: string;
  relation: string;
  weight: number;
  source: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MemoryContext {
  summary: string;
  edges: MemoryEdge[];
  relatedNodes: string[];
}

export interface MemoryGraphService {
  addEpisode(input: MemoryEpisode): Promise<void>;
  addEdge(edge: MemoryEdge): Promise<void>;
  getRelatedNodes(nodeId: string): Promise<MemoryEdge[]>;
  getActionContext(userRequest: string): Promise<MemoryContext>;
}
