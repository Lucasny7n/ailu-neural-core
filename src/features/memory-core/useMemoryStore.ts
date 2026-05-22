import { create } from "zustand";
import {
  memoryBuildContext,
  memoryCaptureAction,
  memoryCaptureConversation,
  memoryCaptureDecision,
  memoryCaptureDream,
  memoryCaptureRule,
  memoryCreateNote,
  memoryDeleteNote,
  memoryForgetNote,
  memoryGetBacklinks,
  memoryGetConfig,
  memoryGetGraph,
  memoryGetNote,
  memoryGetRelated,
  memoryGetStats,
  memoryImportPath,
  memoryInitVault,
  memoryPinNote,
  memoryScanVault,
  memorySearch,
  memoryUnpinNote,
  memoryUpdateNote,
} from "./memoryClient";
import type {
  BuiltMemoryContext,
  MemoryConfig,
  MemoryGraph,
  MemoryImportJob,
  MemoryNote,
  MemoryNoteDetail,
  MemoryNoteKind,
  MemorySearchResult,
  MemoryStats,
} from "./memoryTypes";

interface MemoryState {
  config?: MemoryConfig;
  stats?: MemoryStats;
  notes: MemoryNote[];
  selectedNote?: MemoryNote;
  selectedNoteContent: string;
  searchResults: MemorySearchResult[];
  graph: MemoryGraph;
  backlinks: MemoryNote[];
  related: MemoryNote[];
  lastBuiltContext?: BuiltMemoryContext;
  importProgress?: MemoryImportJob;
  indexProgress?: string;
  loading: boolean;
  error?: string;
  initVault: () => Promise<void>;
  scanVault: () => Promise<void>;
  importPath: (sourcePath: string, category?: string) => Promise<void>;
  createNote: (title: string, kind: MemoryNoteKind, content: string) => Promise<MemoryNoteDetail>;
  updateNote: (noteId: string, content: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  getNote: (noteId: string) => Promise<void>;
  search: (query: string) => Promise<void>;
  getGraph: () => Promise<void>;
  buildContext: (userMessage: string, intentKind?: string, targetNodes?: string[]) => Promise<BuiltMemoryContext>;
  captureConversation: (operatorMessage: string, ailuResponse: string, summary?: string) => Promise<MemoryNoteDetail>;
  captureDecision: (content: string, title?: string) => Promise<MemoryNoteDetail>;
  captureRule: (content: string, title?: string) => Promise<MemoryNoteDetail>;
  captureAction: (payloadJson: string, title?: string) => Promise<MemoryNoteDetail>;
  captureDream: (content: string, title?: string) => Promise<MemoryNoteDetail>;
  pinNote: (noteId: string) => Promise<void>;
  unpinNote: (noteId: string) => Promise<void>;
  forgetNote: (noteId: string) => Promise<void>;
  getStats: () => Promise<void>;
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  notes: [],
  selectedNoteContent: "",
  searchResults: [],
  graph: { nodes: [], edges: [] },
  backlinks: [],
  related: [],
  loading: false,

  initVault: async () => {
    await run(set, async () => {
      const [config, stats] = await Promise.all([memoryGetConfig(), memoryInitVault()]);
      const results = await memorySearch("", 80);
      const graph = await memoryGetGraph();
      set({ config, stats, searchResults: results, notes: results.map((result) => result.note), graph });
    });
  },

  scanVault: async () => {
    await run(set, async () => {
      set({ indexProgress: "scanning" });
      const stats = await memoryScanVault();
      const results = await memorySearch("", 80);
      const graph = await memoryGetGraph();
      set({ stats, searchResults: results, notes: results.map((result) => result.note), graph, indexProgress: "done" });
    });
  },

  importPath: async (sourcePath, category) => {
    await run(set, async () => {
      const importProgress = await memoryImportPath(sourcePath, category);
      const stats = await memoryGetStats();
      const graph = await memoryGetGraph();
      set({ importProgress, stats, graph });
    });
  },

  createNote: async (title, kind, content) => {
    let detail!: MemoryNoteDetail;
    await run(set, async () => {
      detail = await memoryCreateNote(title, kind, content);
      setSelectedDetail(set, detail);
    });
    return detail;
  },

  updateNote: async (noteId, content) => {
    await run(set, async () => {
      const detail = await memoryUpdateNote(noteId, content);
      setSelectedDetail(set, detail);
    });
  },

  deleteNote: async (noteId) => {
    await run(set, async () => {
      await memoryDeleteNote(noteId);
      const results = await memorySearch("", 80);
      set({
        notes: results.map((result) => result.note),
        searchResults: results,
        selectedNote: undefined,
        selectedNoteContent: "",
      });
    });
  },

  getNote: async (noteId) => {
    await run(set, async () => {
      const detail = await memoryGetNote(noteId);
      setSelectedDetail(set, detail);
      const [backlinks, related] = await Promise.all([memoryGetBacklinks(noteId), memoryGetRelated(noteId)]);
      set({ backlinks, related });
    });
  },

  search: async (query) => {
    await run(set, async () => {
      const results = await memorySearch(query, 80);
      set({ searchResults: results, notes: results.map((result) => result.note) });
    });
  },

  getGraph: async () => {
    await run(set, async () => {
      const graph = await memoryGetGraph();
      set({ graph });
    });
  },

  buildContext: async (userMessage, intentKind, targetNodes) => {
    let context!: BuiltMemoryContext;
    await run(set, async () => {
      context = await memoryBuildContext(userMessage, intentKind, targetNodes);
      set({ lastBuiltContext: context });
    });
    return context;
  },

  captureConversation: async (operatorMessage, ailuResponse, summary) => {
    const detail = await memoryCaptureConversation(operatorMessage, ailuResponse, summary);
    setSelectedDetail(set, detail);
    return detail;
  },

  captureDecision: async (content, title) => {
    const detail = await memoryCaptureDecision(content, title);
    setSelectedDetail(set, detail);
    return detail;
  },

  captureRule: async (content, title) => {
    const detail = await memoryCaptureRule(content, title);
    setSelectedDetail(set, detail);
    return detail;
  },

  captureAction: async (payloadJson, title) => {
    const detail = await memoryCaptureAction(payloadJson, title);
    setSelectedDetail(set, detail);
    return detail;
  },

  captureDream: async (content, title) => {
    const detail = await memoryCaptureDream(content, title);
    setSelectedDetail(set, detail);
    return detail;
  },

  pinNote: async (noteId) => {
    await run(set, async () => {
      await memoryPinNote(noteId);
      await get().getNote(noteId);
      await get().search("");
    });
  },

  unpinNote: async (noteId) => {
    await run(set, async () => {
      await memoryUnpinNote(noteId);
      await get().getNote(noteId);
      await get().search("");
    });
  },

  forgetNote: async (noteId) => {
    await run(set, async () => {
      await memoryForgetNote(noteId);
      const results = await memorySearch("", 80);
      set({ searchResults: results, notes: results.map((result) => result.note), selectedNote: undefined, selectedNoteContent: "" });
    });
  },

  getStats: async () => {
    await run(set, async () => {
      const stats = await memoryGetStats();
      set({ stats });
    });
  },
}));

async function run(
  set: (partial: Partial<MemoryState>) => void,
  task: () => Promise<void>,
): Promise<void> {
  set({ loading: true, error: undefined });
  try {
    await task();
  } catch (error) {
    set({ error: error instanceof Error ? error.message : "Falha no Núcleo de Memória." });
  } finally {
    set({ loading: false });
  }
}

function setSelectedDetail(set: (partial: Partial<MemoryState>) => void, detail: MemoryNoteDetail): void {
  set({
    selectedNote: detail.note,
    selectedNoteContent: detail.content,
    backlinks: [],
    related: [],
  });
}
