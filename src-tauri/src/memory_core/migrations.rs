use rusqlite::{Connection, OptionalExtension};

use crate::memory_core::error::MemoryResult;

pub fn apply_migrations(conn: &Connection) -> MemoryResult<bool> {
    conn.execute_batch(
        r#"
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS memory_notes (
          id TEXT PRIMARY KEY,
          path TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          kind TEXT NOT NULL CHECK (kind IN ('note','project','system','conversation','decision','action','rule','dream','import')),
          summary TEXT,
          content_hash TEXT NOT NULL,
          pinned INTEGER NOT NULL DEFAULT 0,
          archived INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          last_indexed_at TEXT
        );

        CREATE TABLE IF NOT EXISTS memory_note_versions (
          id TEXT PRIMARY KEY,
          note_id TEXT NOT NULL REFERENCES memory_notes(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          content_hash TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS memory_chunks (
          id TEXT PRIMARY KEY,
          note_id TEXT NOT NULL REFERENCES memory_notes(id) ON DELETE CASCADE,
          chunk_index INTEGER NOT NULL,
          heading TEXT,
          content TEXT NOT NULL,
          token_estimate INTEGER NOT NULL,
          content_hash TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS memory_links (
          id TEXT PRIMARY KEY,
          from_note_id TEXT NOT NULL REFERENCES memory_notes(id) ON DELETE CASCADE,
          to_note_id TEXT NOT NULL REFERENCES memory_notes(id) ON DELETE CASCADE,
          link_text TEXT,
          relation TEXT NOT NULL DEFAULT 'links_to',
          created_at TEXT NOT NULL,
          UNIQUE(from_note_id, to_note_id, link_text)
        );

        CREATE TABLE IF NOT EXISTS memory_unresolved_links (
          id TEXT PRIMARY KEY,
          from_note_id TEXT NOT NULL REFERENCES memory_notes(id) ON DELETE CASCADE,
          link_text TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS memory_tags (
          note_id TEXT NOT NULL REFERENCES memory_notes(id) ON DELETE CASCADE,
          tag TEXT NOT NULL,
          PRIMARY KEY (note_id, tag)
        );

        CREATE TABLE IF NOT EXISTS memory_aliases (
          note_id TEXT NOT NULL REFERENCES memory_notes(id) ON DELETE CASCADE,
          alias TEXT NOT NULL,
          PRIMARY KEY (note_id, alias)
        );

        CREATE TABLE IF NOT EXISTS memory_graph_nodes (
          id TEXT PRIMARY KEY,
          kind TEXT NOT NULL,
          label TEXT NOT NULL,
          note_id TEXT,
          weight REAL NOT NULL DEFAULT 1.0,
          metadata_json TEXT,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS memory_graph_edges (
          id TEXT PRIMARY KEY,
          from_id TEXT NOT NULL,
          to_id TEXT NOT NULL,
          relation TEXT NOT NULL,
          weight REAL NOT NULL DEFAULT 1.0,
          source TEXT,
          metadata_json TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE(from_id, to_id, relation)
        );

        CREATE TABLE IF NOT EXISTS memory_context_uses (
          id TEXT PRIMARY KEY,
          user_message TEXT NOT NULL,
          intent_kind TEXT,
          selected_note_ids_json TEXT NOT NULL,
          selected_chunk_ids_json TEXT NOT NULL,
          reason TEXT,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS memory_import_jobs (
          id TEXT PRIMARY KEY,
          source_path TEXT NOT NULL,
          category TEXT,
          status TEXT NOT NULL,
          files_found INTEGER NOT NULL DEFAULT 0,
          files_imported INTEGER NOT NULL DEFAULT 0,
          files_skipped INTEGER NOT NULL DEFAULT 0,
          files_errored INTEGER NOT NULL DEFAULT 0,
          started_at TEXT,
          finished_at TEXT
        );

        CREATE TABLE IF NOT EXISTS memory_events (
          id TEXT PRIMARY KEY,
          event_type TEXT NOT NULL,
          note_id TEXT,
          payload_json TEXT,
          created_at TEXT NOT NULL
        );

        "#,
    )
    .map_err(|error| error.to_string())?;

    ensure_memory_notes_accepts_dream(conn)?;
    create_indexes(conn)?;

    let fts_result = conn.execute_batch(
        r#"
        CREATE VIRTUAL TABLE IF NOT EXISTS memory_notes_fts USING fts5(
          note_id UNINDEXED,
          title,
          summary
        );

        CREATE VIRTUAL TABLE IF NOT EXISTS memory_chunks_fts USING fts5(
          chunk_id UNINDEXED,
          note_id UNINDEXED,
          heading,
          content
        );
        "#,
    );

    Ok(fts_result.is_ok())
}

fn ensure_memory_notes_accepts_dream(conn: &Connection) -> MemoryResult<()> {
    let schema = conn
        .query_row(
            "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'memory_notes'",
            [],
            |row| row.get::<_, String>(0),
        )
        .optional()
        .map_err(|error| error.to_string())?;
    if schema.as_deref().is_none_or(|sql| sql.contains("'dream'")) {
        return Ok(());
    }

    conn.execute_batch(
        r#"
        PRAGMA foreign_keys = OFF;
        PRAGMA legacy_alter_table = ON;

        ALTER TABLE memory_notes RENAME TO memory_notes_old;

        CREATE TABLE memory_notes (
          id TEXT PRIMARY KEY,
          path TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          kind TEXT NOT NULL CHECK (kind IN ('note','project','system','conversation','decision','action','rule','dream','import')),
          summary TEXT,
          content_hash TEXT NOT NULL,
          pinned INTEGER NOT NULL DEFAULT 0,
          archived INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          last_indexed_at TEXT
        );

        INSERT INTO memory_notes (
          id, path, title, kind, summary, content_hash, pinned, archived, created_at, updated_at, last_indexed_at
        )
        SELECT id, path, title, kind, summary, content_hash, pinned, archived, created_at, updated_at, last_indexed_at
        FROM memory_notes_old;

        DROP TABLE memory_notes_old;

        PRAGMA legacy_alter_table = OFF;
        PRAGMA foreign_keys = ON;
        "#,
    )
    .map_err(|error| error.to_string())
}

fn create_indexes(conn: &Connection) -> MemoryResult<()> {
    conn.execute_batch(
        r#"
        CREATE INDEX IF NOT EXISTS idx_memory_notes_kind ON memory_notes(kind);
        CREATE INDEX IF NOT EXISTS idx_memory_notes_updated ON memory_notes(updated_at);
        CREATE INDEX IF NOT EXISTS idx_memory_chunks_note ON memory_chunks(note_id);
        CREATE INDEX IF NOT EXISTS idx_memory_links_from ON memory_links(from_note_id);
        CREATE INDEX IF NOT EXISTS idx_memory_links_to ON memory_links(to_note_id);
        CREATE INDEX IF NOT EXISTS idx_memory_tags_tag ON memory_tags(tag);
        "#,
    )
    .map_err(|error| error.to_string())
}
