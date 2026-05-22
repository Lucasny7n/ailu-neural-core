use std::{fs, path::Path};

use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use uuid::Uuid;

use crate::memory_core::{
    db,
    error::MemoryResult,
    ignore::{self, IgnoreRules},
    parser,
    types::{MemoryConfig, MemoryNote},
    vault,
};

pub fn index_links_for_note(
    conn: &Connection,
    from_note_id: &str,
    wikilinks: &[String],
    markdown_links: &[String],
) -> MemoryResult<()> {
    conn.execute(
        "DELETE FROM memory_links WHERE from_note_id = ?1",
        params![from_note_id],
    )
    .map_err(|error| error.to_string())?;
    conn.execute(
        "DELETE FROM memory_unresolved_links WHERE from_note_id = ?1",
        params![from_note_id],
    )
    .map_err(|error| error.to_string())?;

    for link in wikilinks.iter().chain(markdown_links.iter()) {
        let link_text = normalize_link_text(link);
        if link_text.is_empty() {
            continue;
        }
        if let Some(to_note_id) = resolve_note_id(conn, &link_text)? {
            if to_note_id != from_note_id {
                conn.execute(
                    "INSERT OR IGNORE INTO memory_links (id, from_note_id, to_note_id, link_text, relation, created_at)
                     VALUES (?1, ?2, ?3, ?4, 'links_to', ?5)",
                    params![
                        vault::stable_id("link", &format!("{from_note_id}:{to_note_id}:{link_text}")),
                        from_note_id,
                        to_note_id,
                        link_text,
                        Utc::now().to_rfc3339()
                    ],
                )
                .map_err(|error| error.to_string())?;
            }
        } else {
            conn.execute(
                "INSERT INTO memory_unresolved_links (id, from_note_id, link_text, created_at) VALUES (?1, ?2, ?3, ?4)",
                params![Uuid::new_v4().to_string(), from_note_id, link_text, Utc::now().to_rfc3339()],
            )
            .map_err(|error| error.to_string())?;
        }
    }
    Ok(())
}

pub fn resolve_all(config: &MemoryConfig, root: &Path, conn: &Connection) -> MemoryResult<()> {
    conn.execute("DELETE FROM memory_links", [])
        .map_err(|error| error.to_string())?;
    conn.execute("DELETE FROM memory_unresolved_links", [])
        .map_err(|error| error.to_string())?;

    let rules = IgnoreRules::load(root);
    let files = ignore::walk_text_files(config, root, &rules)?;
    for path in files {
        let relative = vault::relative_path(root, &path)?;
        let Some(note) = db::get_note_by_path(conn, &relative)? else {
            continue;
        };
        let content = fs::read_to_string(&path).map_err(|error| error.to_string())?;
        let parsed = parser::parse_markdown(&content);
        index_links_for_note(conn, &note.id, &parsed.wikilinks, &parsed.markdown_links)?;
    }
    Ok(())
}

pub fn get_backlinks(note_id: &str) -> MemoryResult<Vec<MemoryNote>> {
    let conn = db::open_connection()?;
    let mut stmt = conn
        .prepare(
            r#"
            SELECT n.* FROM memory_links l
            JOIN memory_notes n ON n.id = l.from_note_id
            WHERE l.to_note_id = ?1
            ORDER BY n.updated_at DESC
            "#,
        )
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map(params![note_id], db::row_to_note)
        .map_err(|error| error.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

pub fn get_related(note_id: &str, limit: u32) -> MemoryResult<Vec<MemoryNote>> {
    let conn = db::open_connection()?;
    let mut stmt = conn
        .prepare(
            r#"
            WITH direct AS (
              SELECT to_note_id AS id FROM memory_links WHERE from_note_id = ?1
              UNION
              SELECT from_note_id AS id FROM memory_links WHERE to_note_id = ?1
            ),
            same_tags AS (
              SELECT DISTINCT t2.note_id AS id
              FROM memory_tags t1
              JOIN memory_tags t2 ON t2.tag = t1.tag
              WHERE t1.note_id = ?1 AND t2.note_id != ?1
            )
            SELECT DISTINCT n.* FROM memory_notes n
            JOIN (
              SELECT id FROM direct
              UNION
              SELECT id FROM same_tags
            ) r ON r.id = n.id
            ORDER BY n.pinned DESC, n.updated_at DESC
            LIMIT ?2
            "#,
        )
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map(params![note_id, limit], db::row_to_note)
        .map_err(|error| error.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

fn resolve_note_id(conn: &Connection, link_text: &str) -> MemoryResult<Option<String>> {
    let normalized = normalize_title(link_text);
    let file_like = normalized.trim_end_matches(".md");
    let by_title = conn
        .query_row(
            "SELECT id FROM memory_notes WHERE lower(title) = ?1 LIMIT 1",
            params![file_like],
            |row| row.get::<_, String>(0),
        )
        .optional()
        .map_err(|error| error.to_string())?;
    if by_title.is_some() {
        return Ok(by_title);
    }

    let by_alias = conn
        .query_row(
            "SELECT note_id FROM memory_aliases WHERE lower(alias) = ?1 LIMIT 1",
            params![file_like],
            |row| row.get::<_, String>(0),
        )
        .optional()
        .map_err(|error| error.to_string())?;
    if by_alias.is_some() {
        return Ok(by_alias);
    }

    conn.query_row(
        "SELECT id FROM memory_notes WHERE lower(path) LIKE ?1 LIMIT 1",
        params![format!("%{}%", file_like.replace(' ', "-"))],
        |row| row.get::<_, String>(0),
    )
    .optional()
    .map_err(|error| error.to_string())
}

fn normalize_link_text(input: &str) -> String {
    input
        .split('#')
        .next()
        .unwrap_or(input)
        .trim()
        .trim_matches('/')
        .trim_end_matches(".md")
        .replace("%20", " ")
}

fn normalize_title(input: &str) -> String {
    normalize_link_text(input).to_lowercase()
}
