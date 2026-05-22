use chrono::Utc;
use rusqlite::params;
use uuid::Uuid;

use crate::memory_core::{
    config, db,
    error::MemoryResult,
    graph, search,
    types::{BuiltMemoryContext, MemoryChunk, MemoryNote, MemoryNoteKind},
};

pub fn build_context(
    user_message: String,
    intent_kind: Option<String>,
    target_nodes: Option<Vec<String>>,
) -> MemoryResult<BuiltMemoryContext> {
    db::init_database()?;
    let config = config::load_config()?;
    let conn = db::open_connection()?;
    let query = if let Some(nodes) = &target_nodes {
        if nodes.is_empty() {
            user_message.clone()
        } else {
            format!("{} {}", user_message, nodes.join(" "))
        }
    } else {
        user_message.clone()
    };
    let mut results = search::search(query, config.max_context_notes.saturating_mul(3).max(12))?;
    results.sort_by(|a, b| {
        priority(&b.note)
            .partial_cmp(&priority(&a.note))
            .unwrap_or(std::cmp::Ordering::Equal)
            .then_with(|| {
                b.score
                    .partial_cmp(&a.score)
                    .unwrap_or(std::cmp::Ordering::Equal)
            })
    });

    let mut notes: Vec<MemoryNote> = Vec::new();
    let mut chunks: Vec<MemoryChunk> = Vec::new();
    let mut source_labels = Vec::new();
    let mut total_chars = 0usize;

    for result in results {
        if notes.len() >= config.max_context_notes as usize
            && chunks.len() >= config.max_context_chunks as usize
        {
            break;
        }
        if !notes.iter().any(|note| note.id == result.note.id)
            && notes.len() < config.max_context_notes as usize
        {
            source_labels.push(format!(
                "[{}] {}",
                result.note.kind.as_str(),
                result.note.title
            ));
            total_chars += result
                .note
                .summary
                .as_ref()
                .map(|value| value.len())
                .unwrap_or(result.note.title.len());
            notes.push(result.note.clone());
        }
        if let Some(chunk) = result.chunk {
            if chunks.len() < config.max_context_chunks as usize
                && !chunks.iter().any(|existing| existing.id == chunk.id)
                && total_chars + chunk.content.len() <= config.max_context_chars as usize
            {
                total_chars += chunk.content.len();
                chunks.push(chunk);
            }
        }
        if total_chars >= config.max_context_chars as usize {
            break;
        }
    }

    let note_ids = notes.iter().map(|note| note.id.clone()).collect::<Vec<_>>();
    let chunk_ids = chunks
        .iter()
        .map(|chunk| chunk.id.clone())
        .collect::<Vec<_>>();
    let graph_edges = graph::edges_for_notes(&note_ids, 32)?;
    let summary = if notes.is_empty() {
        "MEMORIA LOCAL RECUPERADA: nenhum contexto salvo relevante encontrado.".to_string()
    } else {
        let mut lines = vec!["MEMORIA LOCAL RECUPERADA:".to_string()];
        for note in &notes {
            let summary = note
                .summary
                .clone()
                .unwrap_or_else(|| "sem resumo salvo".to_string());
            lines.push(format!(
                "- [{}] {}: {}",
                note.kind.as_str(),
                note.title,
                truncate(&summary, 220)
            ));
        }
        lines.push("Use esta memoria para continuidade. Nao invente memoria ausente.".to_string());
        lines.join("\n")
    };
    let reason = if notes.is_empty() {
        "lexical search returned no persisted memory".to_string()
    } else {
        format!(
            "selected {} notes and {} chunks under {} chars",
            notes.len(),
            chunks.len(),
            config.max_context_chars
        )
    };

    conn.execute(
        "INSERT INTO memory_context_uses (id, user_message, intent_kind, selected_note_ids_json, selected_chunk_ids_json, reason, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            Uuid::new_v4().to_string(),
            user_message,
            intent_kind,
            serde_json::to_string(&note_ids).map_err(|error| error.to_string())?,
            serde_json::to_string(&chunk_ids).map_err(|error| error.to_string())?,
            &reason,
            Utc::now().to_rfc3339()
        ],
    )
    .map_err(|error| error.to_string())?;

    Ok(BuiltMemoryContext {
        summary,
        notes,
        chunks,
        graph_edges,
        source_labels,
        total_chars: total_chars as u32,
        reason,
    })
}

fn priority(note: &MemoryNote) -> f64 {
    let kind = match note.kind {
        MemoryNoteKind::Decision => 8.0,
        MemoryNoteKind::Rule => 7.5,
        MemoryNoteKind::Project => 5.0,
        MemoryNoteKind::System => 4.0,
        MemoryNoteKind::Dream => 2.8,
        MemoryNoteKind::Action => 2.0,
        MemoryNoteKind::Conversation => 1.5,
        _ => 1.0,
    };
    kind + if note.pinned { 10.0 } else { 0.0 }
}

fn truncate(input: &str, max: usize) -> String {
    if input.chars().count() <= max {
        return input.to_string();
    }
    format!(
        "{}...",
        input
            .chars()
            .take(max.saturating_sub(3))
            .collect::<String>()
    )
}
