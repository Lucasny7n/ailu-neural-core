use std::{env, fs, path::PathBuf};

use rusqlite::{params, Connection, OptionalExtension};

use crate::memory_core::{
    config,
    error::MemoryResult,
    migrations,
    types::{MemoryChunk, MemoryNote, MemoryNoteKind, MemoryStats},
};

pub fn app_data_dir() -> MemoryResult<PathBuf> {
    dirs::data_local_dir()
        .map(|path| path.join("ailu-neural-core"))
        .ok_or_else(|| "could not resolve ~/.local/share".to_string())
}

pub fn database_path() -> MemoryResult<PathBuf> {
    if let Ok(path) = env::var("AILU_MEMORY_DB_PATH") {
        return Ok(PathBuf::from(path));
    }
    Ok(app_data_dir()?.join("ailu-neural-core.sqlite"))
}

pub fn open_connection() -> MemoryResult<Connection> {
    fs::create_dir_all(app_data_dir()?).map_err(|error| error.to_string())?;
    let path = database_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    let conn = Connection::open(path).map_err(|error| error.to_string())?;
    conn.pragma_update(None, "foreign_keys", "ON")
        .map_err(|error| error.to_string())?;
    Ok(conn)
}

pub fn init_database() -> MemoryResult<bool> {
    let conn = open_connection()?;
    migrations::apply_migrations(&conn)
}

pub fn fts_available(conn: &Connection) -> bool {
    conn.query_row(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='memory_chunks_fts'",
        [],
        |row| row.get::<_, String>(0),
    )
    .optional()
    .ok()
    .flatten()
    .is_some()
}

pub fn row_to_note(row: &rusqlite::Row<'_>) -> rusqlite::Result<MemoryNote> {
    let kind_text: String = row.get("kind")?;
    Ok(MemoryNote {
        id: row.get("id")?,
        path: row.get("path")?,
        title: row.get("title")?,
        kind: kind_text.parse().unwrap_or(MemoryNoteKind::Note),
        summary: row.get("summary")?,
        pinned: row.get::<_, i64>("pinned")? != 0,
        archived: row.get::<_, i64>("archived")? != 0,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        last_indexed_at: row.get("last_indexed_at")?,
    })
}

pub fn row_to_chunk(row: &rusqlite::Row<'_>) -> rusqlite::Result<MemoryChunk> {
    Ok(MemoryChunk {
        id: row.get("id")?,
        note_id: row.get("note_id")?,
        chunk_index: row.get::<_, i64>("chunk_index")? as u32,
        heading: row.get("heading")?,
        content: row.get("content")?,
        token_estimate: row.get::<_, i64>("token_estimate")? as u32,
    })
}

pub fn get_note(conn: &Connection, note_id: &str) -> MemoryResult<MemoryNote> {
    conn.query_row(
        "SELECT * FROM memory_notes WHERE id = ?1",
        params![note_id],
        row_to_note,
    )
    .map_err(|error| error.to_string())
}

pub fn get_note_by_path(conn: &Connection, path: &str) -> MemoryResult<Option<MemoryNote>> {
    conn.query_row(
        "SELECT * FROM memory_notes WHERE path = ?1",
        params![path],
        row_to_note,
    )
    .optional()
    .map_err(|error| error.to_string())
}

pub fn list_notes(conn: &Connection, limit: u32) -> MemoryResult<Vec<MemoryNote>> {
    let mut stmt = conn
        .prepare(
            "SELECT * FROM memory_notes WHERE archived = 0 ORDER BY pinned DESC, updated_at DESC LIMIT ?1",
        )
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map(params![limit], row_to_note)
        .map_err(|error| error.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

pub fn chunks_for_note(conn: &Connection, note_id: &str) -> MemoryResult<Vec<MemoryChunk>> {
    let mut stmt = conn
        .prepare("SELECT * FROM memory_chunks WHERE note_id = ?1 ORDER BY chunk_index ASC")
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map(params![note_id], row_to_chunk)
        .map_err(|error| error.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

pub fn string_values(conn: &Connection, sql: &str, note_id: &str) -> MemoryResult<Vec<String>> {
    let mut stmt = conn.prepare(sql).map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map(params![note_id], |row| row.get::<_, String>(0))
        .map_err(|error| error.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

pub fn stats() -> MemoryResult<MemoryStats> {
    let config = config::load_config()?;
    let conn = open_connection()?;
    migrations::apply_migrations(&conn)?;
    let count = |table: &str| -> MemoryResult<u32> {
        let sql = format!("SELECT COUNT(*) FROM {table}");
        conn.query_row(&sql, [], |row| row.get::<_, i64>(0))
            .map(|value| value as u32)
            .map_err(|error| error.to_string())
    };
    let last_indexed_at = conn
        .query_row("SELECT MAX(last_indexed_at) FROM memory_notes", [], |row| {
            row.get::<_, Option<String>>(0)
        })
        .map_err(|error| error.to_string())?;
    Ok(MemoryStats {
        notes: count("memory_notes")?,
        chunks: count("memory_chunks")?,
        links: count("memory_links")?,
        unresolved_links: count("memory_unresolved_links")?,
        tags: count("memory_tags")?,
        pinned: conn
            .query_row(
                "SELECT COUNT(*) FROM memory_notes WHERE pinned = 1",
                [],
                |row| row.get::<_, i64>(0),
            )
            .map(|value| value as u32)
            .map_err(|error| error.to_string())?,
        last_indexed_at,
        vault_path: config::expanded_vault_path(&config)?.display().to_string(),
        fts_available: fts_available(&conn),
    })
}
