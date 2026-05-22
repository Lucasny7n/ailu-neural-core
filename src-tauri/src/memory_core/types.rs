use serde::{Deserialize, Serialize};
use std::str::FromStr;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MemoryNoteKind {
    Note,
    Project,
    System,
    Conversation,
    Decision,
    Action,
    Rule,
    Dream,
    Import,
}

impl MemoryNoteKind {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Note => "note",
            Self::Project => "project",
            Self::System => "system",
            Self::Conversation => "conversation",
            Self::Decision => "decision",
            Self::Action => "action",
            Self::Rule => "rule",
            Self::Dream => "dream",
            Self::Import => "import",
        }
    }

    pub fn folder(self) -> &'static str {
        match self {
            Self::Note => "notes",
            Self::Project => "projects",
            Self::System => "system",
            Self::Conversation => "conversations",
            Self::Decision => "decisions",
            Self::Action => "actions",
            Self::Rule => "rules",
            Self::Dream => "dreams",
            Self::Import => "imports",
        }
    }
}

impl FromStr for MemoryNoteKind {
    type Err = String;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        match value.trim().to_lowercase().as_str() {
            "note" => Ok(Self::Note),
            "project" => Ok(Self::Project),
            "system" => Ok(Self::System),
            "conversation" => Ok(Self::Conversation),
            "decision" => Ok(Self::Decision),
            "action" => Ok(Self::Action),
            "rule" => Ok(Self::Rule),
            "dream" => Ok(Self::Dream),
            "import" => Ok(Self::Import),
            other => Err(format!("invalid memory note kind: {other}")),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryConfig {
    pub vault_path: String,
    pub auto_capture_conversations: bool,
    pub auto_capture_actions: bool,
    pub auto_capture_decisions: bool,
    pub auto_capture_rules: bool,
    pub auto_index_on_startup: bool,
    pub max_context_notes: u32,
    pub max_context_chunks: u32,
    pub max_context_chars: u32,
    pub enable_file_watcher: bool,
    pub show_memory_sources: bool,
    pub use_local_embeddings_if_available: bool,
    pub embedding_provider: String,
    pub embedding_model: String,
    pub max_import_file_bytes: u64,
}

impl Default for MemoryConfig {
    fn default() -> Self {
        Self {
            vault_path: "~/.local/share/ailu-neural-core/memory".to_string(),
            auto_capture_conversations: true,
            auto_capture_actions: true,
            auto_capture_decisions: true,
            auto_capture_rules: true,
            auto_index_on_startup: true,
            max_context_notes: 12,
            max_context_chunks: 24,
            max_context_chars: 24_000,
            enable_file_watcher: false,
            show_memory_sources: true,
            use_local_embeddings_if_available: false,
            embedding_provider: "none".to_string(),
            embedding_model: "nomic-embed-text".to_string(),
            max_import_file_bytes: 2_097_152,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryNote {
    pub id: String,
    pub path: String,
    pub title: String,
    pub kind: MemoryNoteKind,
    pub summary: Option<String>,
    pub pinned: bool,
    pub archived: bool,
    pub created_at: String,
    pub updated_at: String,
    pub last_indexed_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryChunk {
    pub id: String,
    pub note_id: String,
    pub chunk_index: u32,
    pub heading: Option<String>,
    pub content: String,
    pub token_estimate: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemorySearchResult {
    pub note: MemoryNote,
    pub chunk: Option<MemoryChunk>,
    pub score: f64,
    pub snippet: String,
    pub matched_by: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryGraphNode {
    pub id: String,
    pub kind: String,
    pub label: String,
    pub note_id: Option<String>,
    pub weight: f64,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryGraphEdge {
    pub id: String,
    pub from_id: String,
    pub to_id: String,
    pub relation: String,
    pub weight: f64,
    pub source: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryGraph {
    pub nodes: Vec<MemoryGraphNode>,
    pub edges: Vec<MemoryGraphEdge>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BuiltMemoryContext {
    pub summary: String,
    pub notes: Vec<MemoryNote>,
    pub chunks: Vec<MemoryChunk>,
    pub graph_edges: Vec<MemoryGraphEdge>,
    pub source_labels: Vec<String>,
    pub total_chars: u32,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryNoteDetail {
    pub note: MemoryNote,
    pub content: String,
    pub chunks: Vec<MemoryChunk>,
    pub tags: Vec<String>,
    pub aliases: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryStats {
    pub notes: u32,
    pub chunks: u32,
    pub links: u32,
    pub unresolved_links: u32,
    pub tags: u32,
    pub pinned: u32,
    pub last_indexed_at: Option<String>,
    pub vault_path: String,
    pub fts_available: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryImportJob {
    pub id: String,
    pub source_path: String,
    pub category: Option<String>,
    pub status: String,
    pub files_found: u32,
    pub files_imported: u32,
    pub files_skipped: u32,
    pub files_errored: u32,
    pub started_at: Option<String>,
    pub finished_at: Option<String>,
}

#[derive(Debug, Clone)]
pub struct ParsedChunk {
    pub heading: Option<String>,
    pub content: String,
    pub token_estimate: u32,
    pub content_hash: String,
}
