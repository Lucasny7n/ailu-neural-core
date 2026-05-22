use std::{fs, path::Path};

use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use uuid::Uuid;

use crate::memory_core::{
    chunker, config, db,
    error::{io_context, MemoryResult},
    graph,
    ignore::{self, IgnoreRules},
    linker, migrations, parser,
    types::{MemoryNote, MemoryNoteDetail, MemoryNoteKind, MemoryStats},
    vault,
};

pub fn scan_vault() -> MemoryResult<MemoryStats> {
    let (config, root) = vault::ensure_vault()?;
    db::init_database()?;
    let conn = db::open_connection()?;
    migrations::apply_migrations(&conn)?;
    let rules = IgnoreRules::load(&root);
    let files = ignore::walk_text_files(&config, &root, &rules)?;
    for path in files {
        index_file(&config, &root, &conn, &path)?;
    }
    linker::resolve_all(&config, &root, &conn)?;
    graph::rebuild_graph(&conn)?;
    db::stats()
}

pub fn index_note_path(path: &Path) -> MemoryResult<MemoryNote> {
    let config = config::load_config()?;
    let root = vault::init_vault(&config)?;
    db::init_database()?;
    let conn = db::open_connection()?;
    let note = index_file(&config, &root, &conn, path)?;
    linker::resolve_all(&config, &root, &conn)?;
    graph::rebuild_graph(&conn)?;
    Ok(note)
}

pub fn index_file(
    _config: &crate::memory_core::types::MemoryConfig,
    root: &Path,
    conn: &Connection,
    path: &Path,
) -> MemoryResult<MemoryNote> {
    let content =
        fs::read_to_string(path).map_err(|error| io_context("read memory source", path, error))?;
    let relative = vault::relative_path(root, path)?;
    let parsed = parser::parse_markdown(&content);
    let title = parsed
        .title
        .clone()
        .or_else(|| {
            path.file_stem()
                .and_then(|stem| stem.to_str())
                .map(ToString::to_string)
        })
        .unwrap_or_else(|| "Untitled memory".to_string());
    let kind = parsed
        .kind
        .unwrap_or_else(|| vault::infer_kind_from_path(&relative));
    let now = Utc::now().to_rfc3339();
    let note_id = vault::stable_id("note", &relative);
    let content_hash = vault::content_hash(&content);
    let existing = existing_note(conn, &note_id)?;

    if existing.as_ref().is_some_and(|note| note.1 == content_hash) {
        return db::get_note(conn, &note_id);
    }

    let created_at = existing
        .as_ref()
        .map(|note| note.0.clone())
        .or(parsed.created.clone())
        .unwrap_or_else(|| now.clone());
    let updated_at = parsed.updated.clone().unwrap_or_else(|| now.clone());
    let summary = (!parsed.summary.is_empty()).then_some(parsed.summary.clone());

    conn.execute(
        r#"
        INSERT INTO memory_notes (
            id, path, title, kind, summary, content_hash, pinned, archived, created_at, updated_at, last_indexed_at
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, COALESCE((SELECT pinned FROM memory_notes WHERE id = ?1), 0), 0, ?7, ?8, ?9)
        ON CONFLICT(id) DO UPDATE SET
            path = excluded.path,
            title = excluded.title,
            kind = excluded.kind,
            summary = excluded.summary,
            content_hash = excluded.content_hash,
            archived = 0,
            updated_at = excluded.updated_at,
            last_indexed_at = excluded.last_indexed_at
        "#,
        params![
            &note_id,
            &relative,
            &title,
            kind.as_str(),
            &summary,
            &content_hash,
            &created_at,
            &updated_at,
            &now
        ],
    )
    .map_err(|error| error.to_string())?;

    conn.execute(
        "INSERT INTO memory_note_versions (id, note_id, content, content_hash, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![Uuid::new_v4().to_string(), &note_id, &content, &content_hash, &now],
    )
    .map_err(|error| error.to_string())?;

    clear_note_index(conn, &note_id)?;
    insert_tags(conn, &note_id, &parsed.tags)?;
    insert_aliases(conn, &note_id, &parsed.aliases)?;
    insert_chunks(conn, &note_id, &parsed.body)?;
    linker::index_links_for_note(conn, &note_id, &parsed.wikilinks, &parsed.markdown_links)?;
    update_fts(
        conn,
        &note_id,
        &title,
        summary.as_deref().unwrap_or(""),
        &parsed.body,
    )?;

    conn.execute(
        "INSERT INTO memory_events (id, event_type, note_id, payload_json, created_at) VALUES (?1, 'note_indexed', ?2, ?3, ?4)",
        params![
            Uuid::new_v4().to_string(),
            &note_id,
            serde_json::json!({ "path": relative }).to_string(),
            &now
        ],
    )
    .map_err(|error| error.to_string())?;

    db::get_note(conn, &note_id)
}

pub fn create_note(
    title: String,
    kind: MemoryNoteKind,
    content: String,
) -> MemoryResult<MemoryNoteDetail> {
    let config = config::load_config()?;
    let path = vault::create_note_file(
        &config,
        &title,
        kind,
        &content,
        matches!(
            kind,
            MemoryNoteKind::Decision
                | MemoryNoteKind::Rule
                | MemoryNoteKind::Conversation
                | MemoryNoteKind::Action
        ),
    )?;
    let note = index_note_path(&path)?;
    note_detail(&note.id)
}

pub fn update_note(note_id: String, content: String) -> MemoryResult<MemoryNoteDetail> {
    let config = config::load_config()?;
    let root = vault::init_vault(&config)?;
    db::init_database()?;
    let conn = db::open_connection()?;
    let note = db::get_note(&conn, &note_id)?;
    vault::update_note(&root, &note.path, &content)?;
    let path = vault::safe_join(&root, &note.path)?;
    index_file(&config, &root, &conn, &path)?;
    linker::resolve_all(&config, &root, &conn)?;
    graph::rebuild_graph(&conn)?;
    note_detail(&note_id)
}

pub fn delete_note(note_id: String) -> MemoryResult<()> {
    let config = config::load_config()?;
    let root = vault::init_vault(&config)?;
    let conn = db::open_connection()?;
    if let Ok(note) = db::get_note(&conn, &note_id) {
        vault::delete_note(&root, &note.path)?;
    }
    conn.execute("DELETE FROM memory_notes WHERE id = ?1", params![note_id])
        .map_err(|error| error.to_string())?;
    graph::rebuild_graph(&conn)?;
    Ok(())
}

pub fn forget_note(note_id: String) -> MemoryResult<()> {
    let conn = db::open_connection()?;
    conn.execute("DELETE FROM memory_notes WHERE id = ?1", params![note_id])
        .map_err(|error| error.to_string())?;
    graph::rebuild_graph(&conn)?;
    Ok(())
}

pub fn pin_note(note_id: String, pinned: bool) -> MemoryResult<MemoryNote> {
    let conn = db::open_connection()?;
    conn.execute(
        "UPDATE memory_notes SET pinned = ?1, updated_at = ?2 WHERE id = ?3",
        params![if pinned { 1 } else { 0 }, Utc::now().to_rfc3339(), note_id],
    )
    .map_err(|error| error.to_string())?;
    db::get_note(&conn, &note_id)
}

pub fn note_detail(note_id: &str) -> MemoryResult<MemoryNoteDetail> {
    let config = config::load_config()?;
    let root = vault::init_vault(&config)?;
    let conn = db::open_connection()?;
    let note = db::get_note(&conn, note_id)?;
    let content = vault::read_note(&root, &note.path)?;
    let chunks = db::chunks_for_note(&conn, note_id)?;
    let tags = db::string_values(
        &conn,
        "SELECT tag FROM memory_tags WHERE note_id = ?1 ORDER BY tag",
        note_id,
    )?;
    let aliases = db::string_values(
        &conn,
        "SELECT alias FROM memory_aliases WHERE note_id = ?1 ORDER BY alias",
        note_id,
    )?;
    Ok(MemoryNoteDetail {
        note,
        content,
        chunks,
        tags,
        aliases,
    })
}

pub fn get_note_by_id(note_id: String) -> MemoryResult<MemoryNoteDetail> {
    note_detail(&note_id)
}

fn existing_note(conn: &Connection, note_id: &str) -> MemoryResult<Option<(String, String)>> {
    conn.query_row(
        "SELECT created_at, content_hash FROM memory_notes WHERE id = ?1",
        params![note_id],
        |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)),
    )
    .optional()
    .map_err(|error| error.to_string())
}

fn clear_note_index(conn: &Connection, note_id: &str) -> MemoryResult<()> {
    for sql in [
        "DELETE FROM memory_chunks WHERE note_id = ?1",
        "DELETE FROM memory_tags WHERE note_id = ?1",
        "DELETE FROM memory_aliases WHERE note_id = ?1",
        "DELETE FROM memory_links WHERE from_note_id = ?1",
        "DELETE FROM memory_unresolved_links WHERE from_note_id = ?1",
    ] {
        conn.execute(sql, params![note_id])
            .map_err(|error| error.to_string())?;
    }
    if db::fts_available(conn) {
        let _ = conn.execute(
            "DELETE FROM memory_notes_fts WHERE note_id = ?1",
            params![note_id],
        );
        let _ = conn.execute(
            "DELETE FROM memory_chunks_fts WHERE note_id = ?1",
            params![note_id],
        );
    }
    Ok(())
}

fn insert_tags(conn: &Connection, note_id: &str, tags: &[String]) -> MemoryResult<()> {
    for tag in tags {
        let tag = tag.trim().trim_start_matches('#').to_lowercase();
        if !tag.is_empty() {
            conn.execute(
                "INSERT OR IGNORE INTO memory_tags (note_id, tag) VALUES (?1, ?2)",
                params![note_id, tag],
            )
            .map_err(|error| error.to_string())?;
        }
    }
    Ok(())
}

fn insert_aliases(conn: &Connection, note_id: &str, aliases: &[String]) -> MemoryResult<()> {
    for alias in aliases {
        let alias = alias.trim();
        if !alias.is_empty() {
            conn.execute(
                "INSERT OR IGNORE INTO memory_aliases (note_id, alias) VALUES (?1, ?2)",
                params![note_id, alias],
            )
            .map_err(|error| error.to_string())?;
        }
    }
    Ok(())
}

fn insert_chunks(conn: &Connection, note_id: &str, body: &str) -> MemoryResult<()> {
    for (index, chunk) in chunker::chunk_markdown(body).into_iter().enumerate() {
        let chunk_id = vault::stable_id(
            "chunk",
            &format!("{note_id}:{index}:{}", chunk.content_hash),
        );
        conn.execute(
            "INSERT INTO memory_chunks (id, note_id, chunk_index, heading, content, token_estimate, content_hash) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                chunk_id,
                note_id,
                index as i64,
                chunk.heading,
                chunk.content,
                chunk.token_estimate as i64,
                chunk.content_hash
            ],
        )
        .map_err(|error| error.to_string())?;
    }
    Ok(())
}

fn update_fts(
    conn: &Connection,
    note_id: &str,
    title: &str,
    summary: &str,
    _body: &str,
) -> MemoryResult<()> {
    if !db::fts_available(conn) {
        return Ok(());
    }
    let _ = conn.execute(
        "INSERT INTO memory_notes_fts (note_id, title, summary) VALUES (?1, ?2, ?3)",
        params![note_id, title, summary],
    );
    let mut stmt = conn
        .prepare("SELECT id, note_id, heading, content FROM memory_chunks WHERE note_id = ?1")
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map(params![note_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<String>>(2)?,
                row.get::<_, String>(3)?,
            ))
        })
        .map_err(|error| error.to_string())?;
    for row in rows {
        let (chunk_id, note_id, heading, content) = row.map_err(|error| error.to_string())?;
        let _ = conn.execute(
            "INSERT INTO memory_chunks_fts (chunk_id, note_id, heading, content) VALUES (?1, ?2, ?3, ?4)",
            params![chunk_id, note_id, heading.unwrap_or_default(), content],
        );
    }
    Ok(())
}
