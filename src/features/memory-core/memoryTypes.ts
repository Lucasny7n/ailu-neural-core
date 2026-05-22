export type MemoryNoteKind =
  | "note"
  | "project"
  | "system"
  | "conversation"
  | "decision"
  | "action"
  | "rule"
  | "import";

export interface MemoryConfig {
  vaultPath: string;
  autoCaptureConversations: boolean;
  autoCaptureActions: boolean;
  autoCaptureDecisions: boolean;
  autoCaptureRules: boolean;
  autoIndexOnStartup: boolean;
  maxContextNotes: number;
  maxContextChunks: number;
  maxContextChars: number;
  enableFileWatcher: boolean;
  showMemorySources: boolean;
  useLocalEmbeddingsIfAvailable: boolean;
  embeddingProvider: string;
  embeddingModel: string;
  maxImportFileBytes: number;
}

export interface MemoryNote {
  id: string;
  path: string;
  title: string;
  kind: MemoryNoteKind;
  summary?: string;
  pinned: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  lastIndexedAt?: string;
}

export interface MemoryChunk {
  id: string;
  noteId: string;
  chunkIndex: number;
  heading?: string;
  content: string;
  tokenEstimate: number;
}

export interface MemorySearchResult {
  note: MemoryNote;
  chunk?: MemoryChunk;
  score: number;
  snippet: string;
  matchedBy: string[];
}

export interface MemoryGraphNode {
  id: string;
  kind: string;
  label: string;
  noteId?: string;
  weight: number;
  metadata?: Record<string, unknown>;
}

export interface MemoryGraphEdge {
  id: string;
  fromId: string;
  toId: string;
  relation: string;
  weight: number;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryGraph {
  nodes: MemoryGraphNode[];
  edges: MemoryGraphEdge[];
}

export interface BuiltMemoryContext {
  summary: string;
  notes: MemoryNote[];
  chunks: MemoryChunk[];
  graphEdges: MemoryGraphEdge[];
  sourceLabels: string[];
  totalChars: number;
  reason: string;
}

export interface MemoryNoteDetail {
  note: MemoryNote;
  content: string;
  chunks: MemoryChunk[];
  tags: string[];
  aliases: string[];
}

export interface MemoryStats {
  notes: number;
  chunks: number;
  links: number;
  unresolvedLinks: number;
  tags: number;
  pinned: number;
  lastIndexedAt?: string;
  vaultPath: string;
  ftsAvailable: boolean;
}

export interface MemoryImportJob {
  id: string;
  sourcePath: string;
  category?: string;
  status: string;
  filesFound: number;
  filesImported: number;
  filesSkipped: number;
  filesErrored: number;
  startedAt?: string;
  finishedAt?: string;
}
