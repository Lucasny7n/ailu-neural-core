pub mod capture;
pub mod chunker;
pub mod config;
pub mod context;
pub mod db;
pub mod error;
pub mod graph;
pub mod ignore;
pub mod importer;
pub mod indexer;
pub mod linker;
pub mod migrations;
pub mod parser;
pub mod search;
pub mod types;
pub mod vault;

#[cfg(test)]
mod tests;

use self::{
    error::MemoryResult,
    types::{
        BuiltMemoryContext, MemoryConfig, MemoryGraph, MemoryImportJob, MemoryNote,
        MemoryNoteDetail, MemoryNoteKind, MemorySearchResult, MemoryStats,
    },
};
use tauri::Emitter;

#[tauri::command]
pub fn memory_get_config() -> MemoryResult<MemoryConfig> {
    config::load_config()
}

#[tauri::command]
pub fn memory_set_config(config_value: MemoryConfig) -> MemoryResult<MemoryConfig> {
    config::save_config(&config_value)?;
    config::load_config()
}

#[tauri::command]
pub fn memory_init_vault(app: tauri::AppHandle) -> MemoryResult<MemoryStats> {
    let config = config::load_config()?;
    vault::init_vault(&config)?;
    db::init_database()?;
    let stats = db::stats()?;
    let _ = app.emit("memory-index-progress", &stats);
    Ok(stats)
}

#[tauri::command]
pub fn memory_scan_vault(app: tauri::AppHandle) -> MemoryResult<MemoryStats> {
    let _ = app.emit(
        "memory-index-progress",
        serde_json::json!({ "status": "running" }),
    );
    let stats = indexer::scan_vault()?;
    let _ = app.emit("memory-index-progress", &stats);
    Ok(stats)
}

#[tauri::command(rename_all = "camelCase")]
pub fn memory_import_path(
    app: tauri::AppHandle,
    source_path: String,
    category: Option<String>,
) -> MemoryResult<MemoryImportJob> {
    let _ = app.emit(
        "memory-import-progress",
        serde_json::json!({ "status": "running", "sourcePath": source_path }),
    );
    let job = importer::import_path(source_path, category)?;
    let _ = app.emit("memory-import-progress", &job);
    Ok(job)
}

#[tauri::command(rename_all = "camelCase")]
pub fn memory_create_note(
    app: tauri::AppHandle,
    title: String,
    kind: MemoryNoteKind,
    content: String,
) -> MemoryResult<MemoryNoteDetail> {
    let detail = indexer::create_note(title, kind, content)?;
    let _ = app.emit("memory-note-updated", &detail);
    Ok(detail)
}

#[tauri::command(rename_all = "camelCase")]
pub fn memory_update_note(
    app: tauri::AppHandle,
    note_id: String,
    content: String,
) -> MemoryResult<MemoryNoteDetail> {
    let detail = indexer::update_note(note_id, content)?;
    let _ = app.emit("memory-note-updated", &detail);
    Ok(detail)
}

#[tauri::command(rename_all = "camelCase")]
pub fn memory_delete_note(note_id: String) -> MemoryResult<()> {
    indexer::delete_note(note_id)
}

#[tauri::command(rename_all = "camelCase")]
pub fn memory_get_note(note_id: String) -> MemoryResult<MemoryNoteDetail> {
    indexer::get_note_by_id(note_id)
}

#[tauri::command]
pub fn memory_search(query: String, limit: Option<u32>) -> MemoryResult<Vec<MemorySearchResult>> {
    search::search(query, limit.unwrap_or(24).clamp(1, 200))
}

#[tauri::command]
pub fn memory_get_graph(limit: Option<u32>) -> MemoryResult<MemoryGraph> {
    graph::get_graph(limit.unwrap_or(160).clamp(16, 800))
}

#[tauri::command(rename_all = "camelCase")]
pub fn memory_get_backlinks(note_id: String) -> MemoryResult<Vec<MemoryNote>> {
    linker::get_backlinks(&note_id)
}

#[tauri::command(rename_all = "camelCase")]
pub fn memory_get_related(note_id: String, limit: Option<u32>) -> MemoryResult<Vec<MemoryNote>> {
    linker::get_related(&note_id, limit.unwrap_or(12).clamp(1, 80))
}

#[tauri::command(rename_all = "camelCase")]
pub fn memory_build_context(
    app: tauri::AppHandle,
    user_message: String,
    intent_kind: Option<String>,
    target_nodes: Option<Vec<String>>,
) -> MemoryResult<BuiltMemoryContext> {
    let context = context::build_context(user_message, intent_kind, target_nodes)?;
    let _ = app.emit("memory-context-built", &context);
    Ok(context)
}

#[tauri::command(rename_all = "camelCase")]
pub fn memory_capture_conversation(
    app: tauri::AppHandle,
    operator_message: String,
    ailu_response: String,
    summary: Option<String>,
) -> MemoryResult<MemoryNoteDetail> {
    let detail = capture::capture_conversation(operator_message, ailu_response, summary)?;
    let _ = app.emit("memory-capture-created", &detail);
    Ok(detail)
}

#[tauri::command(rename_all = "camelCase")]
pub fn memory_capture_decision(
    app: tauri::AppHandle,
    content: String,
    title: Option<String>,
) -> MemoryResult<MemoryNoteDetail> {
    let detail = capture::capture_decision(content, title)?;
    let _ = app.emit("memory-capture-created", &detail);
    Ok(detail)
}

#[tauri::command(rename_all = "camelCase")]
pub fn memory_capture_rule(
    app: tauri::AppHandle,
    content: String,
    title: Option<String>,
) -> MemoryResult<MemoryNoteDetail> {
    let detail = capture::capture_rule(content, title)?;
    let _ = app.emit("memory-capture-created", &detail);
    Ok(detail)
}

#[tauri::command(rename_all = "camelCase")]
pub fn memory_capture_action(
    app: tauri::AppHandle,
    payload_json: String,
    title: Option<String>,
) -> MemoryResult<MemoryNoteDetail> {
    let detail = capture::capture_action(payload_json, title)?;
    let _ = app.emit("memory-capture-created", &detail);
    Ok(detail)
}

#[tauri::command(rename_all = "camelCase")]
pub fn memory_capture_dream(
    app: tauri::AppHandle,
    content: String,
    title: Option<String>,
) -> MemoryResult<MemoryNoteDetail> {
    let detail = capture::capture_dream(content, title)?;
    let _ = app.emit("memory-capture-created", &detail);
    Ok(detail)
}

#[tauri::command(rename_all = "camelCase")]
pub fn memory_pin_note(note_id: String) -> MemoryResult<MemoryNote> {
    indexer::pin_note(note_id, true)
}

#[tauri::command(rename_all = "camelCase")]
pub fn memory_unpin_note(note_id: String) -> MemoryResult<MemoryNote> {
    indexer::pin_note(note_id, false)
}

#[tauri::command(rename_all = "camelCase")]
pub fn memory_forget_note(note_id: String) -> MemoryResult<()> {
    indexer::forget_note(note_id)
}

#[tauri::command]
pub fn memory_get_stats() -> MemoryResult<MemoryStats> {
    db::stats()
}
