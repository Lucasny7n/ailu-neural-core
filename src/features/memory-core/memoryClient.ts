import { safeInvoke, isTauriRuntime } from "../../lib/tauri";
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

const devNotes: MemoryNoteDetail[] = [];

export async function memoryGetConfig(): Promise<MemoryConfig> {
  if (!isTauriRuntime()) {
    return defaultMemoryConfig();
  }
  return safeInvoke<MemoryConfig>("memory_get_config");
}

export async function memorySetConfig(config: MemoryConfig): Promise<MemoryConfig> {
  if (!isTauriRuntime()) {
    return config;
  }
  return safeInvoke<MemoryConfig>("memory_set_config", { configValue: config });
}

export async function memoryInitVault(): Promise<MemoryStats> {
  if (!isTauriRuntime()) {
    return devStats();
  }
  return safeInvoke<MemoryStats>("memory_init_vault");
}

export async function memoryScanVault(): Promise<MemoryStats> {
  if (!isTauriRuntime()) {
    return devStats();
  }
  return safeInvoke<MemoryStats>("memory_scan_vault");
}

export async function memoryImportPath(sourcePath: string, category?: string): Promise<MemoryImportJob> {
  if (!isTauriRuntime()) {
    return {
      id: `dev-import-${Date.now()}`,
      sourcePath,
      category,
      status: "browser-dev-only",
      filesFound: 0,
      filesImported: 0,
      filesSkipped: 0,
      filesErrored: 0,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    };
  }
  return safeInvoke<MemoryImportJob>("memory_import_path", { sourcePath, category });
}

export async function memoryCreateNote(
  title: string,
  kind: MemoryNoteKind,
  content: string,
): Promise<MemoryNoteDetail> {
  if (!isTauriRuntime()) {
    return devCreateNote(title, kind, content);
  }
  return safeInvoke<MemoryNoteDetail>("memory_create_note", { title, kind, content });
}

export async function memoryUpdateNote(noteId: string, content: string): Promise<MemoryNoteDetail> {
  if (!isTauriRuntime()) {
    const found = devNotes.find((detail) => detail.note.id === noteId);
    if (!found) {
      throw new Error("Memoria dev nao encontrada.");
    }
    found.content = content;
    found.note.updatedAt = new Date().toISOString();
    return found;
  }
  return safeInvoke<MemoryNoteDetail>("memory_update_note", { noteId, content });
}

export async function memoryDeleteNote(noteId: string): Promise<void> {
  if (!isTauriRuntime()) {
    const index = devNotes.findIndex((detail) => detail.note.id === noteId);
    if (index >= 0) {
      devNotes.splice(index, 1);
    }
    return;
  }
  return safeInvoke<void>("memory_delete_note", { noteId });
}

export async function memoryGetNote(noteId: string): Promise<MemoryNoteDetail> {
  if (!isTauriRuntime()) {
    const found = devNotes.find((detail) => detail.note.id === noteId);
    if (!found) {
      throw new Error("Memoria dev nao encontrada.");
    }
    return found;
  }
  return safeInvoke<MemoryNoteDetail>("memory_get_note", { noteId });
}

export async function memorySearch(query: string, limit = 24): Promise<MemorySearchResult[]> {
  if (!isTauriRuntime()) {
    return devSearch(query, limit);
  }
  return safeInvoke<MemorySearchResult[]>("memory_search", { query, limit });
}

export async function memoryGetGraph(limit = 160): Promise<MemoryGraph> {
  if (!isTauriRuntime()) {
    return devGraph();
  }
  return safeInvoke<MemoryGraph>("memory_get_graph", { limit });
}

export async function memoryGetBacklinks(noteId: string): Promise<MemoryNote[]> {
  if (!isTauriRuntime()) {
    return devNotes.filter((detail) => detail.content.includes(noteId)).map((detail) => detail.note);
  }
  return safeInvoke<MemoryNote[]>("memory_get_backlinks", { noteId });
}

export async function memoryGetRelated(noteId: string, limit = 12): Promise<MemoryNote[]> {
  if (!isTauriRuntime()) {
    return devNotes.filter((detail) => detail.note.id !== noteId).slice(0, limit).map((detail) => detail.note);
  }
  return safeInvoke<MemoryNote[]>("memory_get_related", { noteId, limit });
}

export async function memoryBuildContext(
  userMessage: string,
  intentKind?: string,
  targetNodes?: string[],
): Promise<BuiltMemoryContext> {
  if (!isTauriRuntime()) {
    return devBuildContext(userMessage);
  }
  return safeInvoke<BuiltMemoryContext>("memory_build_context", { userMessage, intentKind, targetNodes });
}

export async function memoryCaptureConversation(
  operatorMessage: string,
  ailuResponse: string,
  summary?: string,
): Promise<MemoryNoteDetail> {
  if (!isTauriRuntime()) {
    return devCreateNote(`Conversa - ${operatorMessage.slice(0, 42)}`, "conversation", `${operatorMessage}\n\n${ailuResponse}`);
  }
  return safeInvoke<MemoryNoteDetail>("memory_capture_conversation", { operatorMessage, ailuResponse, summary });
}

export async function memoryCaptureDecision(content: string, title?: string): Promise<MemoryNoteDetail> {
  if (!isTauriRuntime()) {
    return devCreateNote(title ?? `Decisao - ${content.slice(0, 42)}`, "decision", content);
  }
  return safeInvoke<MemoryNoteDetail>("memory_capture_decision", { content, title });
}

export async function memoryCaptureRule(content: string, title?: string): Promise<MemoryNoteDetail> {
  if (!isTauriRuntime()) {
    return devCreateNote(title ?? `Regra - ${content.slice(0, 42)}`, "rule", content);
  }
  return safeInvoke<MemoryNoteDetail>("memory_capture_rule", { content, title });
}

export async function memoryCaptureAction(payloadJson: string, title?: string): Promise<MemoryNoteDetail> {
  if (!isTauriRuntime()) {
    return devCreateNote(title ?? "Acao operacional", "action", payloadJson);
  }
  return safeInvoke<MemoryNoteDetail>("memory_capture_action", { payloadJson, title });
}

export async function memoryCaptureDream(content: string, title?: string): Promise<MemoryNoteDetail> {
  if (!isTauriRuntime()) {
    return devCreateNote(title ?? "Sonho Neural", "dream", content);
  }
  return safeInvoke<MemoryNoteDetail>("memory_capture_dream", { content, title });
}

export async function memoryPinNote(noteId: string): Promise<MemoryNote> {
  if (!isTauriRuntime()) {
    const found = await memoryGetNote(noteId);
    found.note.pinned = true;
    return found.note;
  }
  return safeInvoke<MemoryNote>("memory_pin_note", { noteId });
}

export async function memoryUnpinNote(noteId: string): Promise<MemoryNote> {
  if (!isTauriRuntime()) {
    const found = await memoryGetNote(noteId);
    found.note.pinned = false;
    return found.note;
  }
  return safeInvoke<MemoryNote>("memory_unpin_note", { noteId });
}

export async function memoryForgetNote(noteId: string): Promise<void> {
  if (!isTauriRuntime()) {
    await memoryDeleteNote(noteId);
    return;
  }
  return safeInvoke<void>("memory_forget_note", { noteId });
}

export async function memoryGetStats(): Promise<MemoryStats> {
  if (!isTauriRuntime()) {
    return devStats();
  }
  return safeInvoke<MemoryStats>("memory_get_stats");
}

export function detectMemoryCapture(message: string): { kind: "decision" | "rule"; content: string } | undefined {
  const normalized = message.trim().toLowerCase();
  const decisionPrefixes = ["salva isso como decisão:", "salva isso como decisao:", "decidimos que "];
  for (const prefix of decisionPrefixes) {
    if (normalized.startsWith(prefix)) {
      return { kind: "decision", content: message.slice(prefix.length).trim() };
    }
  }
  const rulePrefixes = [
    "salva isso como regra:",
    "a partir de agora ",
    "sempre faça ",
    "sempre faca ",
    "nunca faça ",
    "nunca faca ",
  ];
  for (const prefix of rulePrefixes) {
    if (normalized.startsWith(prefix)) {
      return { kind: "rule", content: message.slice(prefix.length).trim() };
    }
  }
  if (normalized.startsWith("o ailu deve ") || normalized.startsWith("o ailu não deve ") || normalized.startsWith("o ailu nao deve ")) {
    return { kind: "rule", content: message.trim() };
  }
  return undefined;
}

function defaultMemoryConfig(): MemoryConfig {
  return {
    vaultPath: "~/.local/share/ailu-neural-core/memory",
    autoCaptureConversations: true,
    autoCaptureActions: true,
    autoCaptureDecisions: true,
    autoCaptureRules: true,
    autoIndexOnStartup: true,
    maxContextNotes: 12,
    maxContextChunks: 24,
    maxContextChars: 24000,
    enableFileWatcher: false,
    showMemorySources: true,
    useLocalEmbeddingsIfAvailable: false,
    embeddingProvider: "none",
    embeddingModel: "nomic-embed-text",
    maxImportFileBytes: 2097152,
  };
}

function devCreateNote(title: string, kind: MemoryNoteKind, content: string): MemoryNoteDetail {
  const now = new Date().toISOString();
  const id = `dev-${kind}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const note: MemoryNote = {
    id,
    path: `browser-dev/${id}.md`,
    title,
    kind,
    summary: content.replace(/\s+/g, " ").slice(0, 180),
    pinned: false,
    archived: false,
    createdAt: now,
    updatedAt: now,
    lastIndexedAt: now,
  };
  const detail: MemoryNoteDetail = {
    note,
    content,
    chunks: [
      {
        id: `${id}-chunk-0`,
        noteId: id,
        chunkIndex: 0,
        content,
        tokenEstimate: Math.ceil(content.length / 4),
      },
    ],
    tags: [kind],
    aliases: [],
  };
  devNotes.unshift(detail);
  return detail;
}

function devSearch(query: string, limit: number): MemorySearchResult[] {
  const normalized = query.toLowerCase();
  const tokens = normalized.split(/\s+/).filter((token) => token.length > 2);
  return devNotes
    .filter((detail) => {
      const haystack = `${detail.note.title} ${detail.note.summary ?? ""} ${detail.content}`.toLowerCase();
      return normalized.length === 0 || haystack.includes(normalized) || tokens.some((token) => haystack.includes(token));
    })
    .slice(0, limit)
    .map((detail) => ({
      note: detail.note,
      chunk: detail.chunks[0],
      score: (detail.note.pinned ? 3 : 1) + tokens.filter((token) => `${detail.note.title} ${detail.content}`.toLowerCase().includes(token)).length,
      snippet: detail.content.slice(0, 220),
      matchedBy: normalized ? ["browser-dev"] : ["recent"],
    }));
}

function devBuildContext(userMessage: string): BuiltMemoryContext {
  const results = devSearch(userMessage, 6);
  const notes = results.map((result) => result.note);
  const chunks = results.flatMap((result) => (result.chunk ? [result.chunk] : []));
  return {
    summary: notes.length
      ? `MEMORIA LOCAL RECUPERADA:\n${notes.map((note) => `- [${note.kind}] ${note.title}: ${note.summary ?? ""}`).join("\n")}`
      : "MEMORIA LOCAL RECUPERADA: nenhum contexto salvo relevante encontrado.",
    notes,
    chunks,
    graphEdges: [],
    sourceLabels: notes.map((note) => `[${note.kind}] ${note.title}`),
    totalChars: chunks.reduce((total, chunk) => total + chunk.content.length, 0),
    reason: "browser dev fallback",
  };
}

function devGraph(): MemoryGraph {
  return {
    nodes: devNotes.map((detail) => ({
      id: `note:${detail.note.id}`,
      kind: detail.note.kind,
      label: detail.note.title,
      noteId: detail.note.id,
      weight: detail.note.pinned ? 2 : 1,
    })),
    edges: [],
  };
}

function devStats(): MemoryStats {
  return {
    notes: devNotes.length,
    chunks: devNotes.reduce((total, note) => total + note.chunks.length, 0),
    links: 0,
    unresolvedLinks: 0,
    tags: devNotes.reduce((total, note) => total + note.tags.length, 0),
    pinned: devNotes.filter((note) => note.note.pinned).length,
    vaultPath: "browser-dev-only",
    ftsAvailable: false,
  };
}
