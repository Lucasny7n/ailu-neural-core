use chrono::Utc;
use rusqlite::{params, Connection};

use crate::memory_core::{
    db,
    error::MemoryResult,
    types::{MemoryGraph, MemoryGraphEdge, MemoryGraphNode},
    vault,
};

pub fn rebuild_graph(conn: &Connection) -> MemoryResult<()> {
    conn.execute("DELETE FROM memory_graph_edges", [])
        .map_err(|error| error.to_string())?;
    conn.execute("DELETE FROM memory_graph_nodes", [])
        .map_err(|error| error.to_string())?;

    let now = Utc::now().to_rfc3339();
    let mut note_stmt = conn
        .prepare("SELECT * FROM memory_notes WHERE archived = 0")
        .map_err(|error| error.to_string())?;
    let notes = note_stmt
        .query_map([], db::row_to_note)
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())?;

    for note in &notes {
        conn.execute(
            "INSERT OR REPLACE INTO memory_graph_nodes (id, kind, label, note_id, weight, metadata_json, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                format!("note:{}", note.id),
                note.kind.as_str(),
                note.title,
                note.id,
                if note.pinned { 2.0 } else { 1.0 },
                serde_json::json!({ "path": note.path, "summary": note.summary }).to_string(),
                &now
            ],
        )
        .map_err(|error| error.to_string())?;
    }

    let mut tag_stmt = conn
        .prepare("SELECT tag, COUNT(*) AS weight FROM memory_tags GROUP BY tag")
        .map_err(|error| error.to_string())?;
    let tags = tag_stmt
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        })
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())?;

    for (tag, weight) in tags {
        let tag_id = format!("tag:{tag}");
        conn.execute(
            "INSERT OR REPLACE INTO memory_graph_nodes (id, kind, label, note_id, weight, metadata_json, updated_at)
             VALUES (?1, 'tag', ?2, NULL, ?3, NULL, ?4)",
            params![tag_id, tag, weight as f64, &now],
        )
        .map_err(|error| error.to_string())?;
    }

    insert_link_edges(conn, &now)?;
    insert_tag_edges(conn, &now)?;
    insert_kind_edges(conn, &now)?;
    Ok(())
}

pub fn get_graph(limit: u32) -> MemoryResult<MemoryGraph> {
    let conn = db::open_connection()?;
    let mut node_stmt = conn
        .prepare("SELECT id, kind, label, note_id, weight, metadata_json FROM memory_graph_nodes ORDER BY weight DESC, label ASC LIMIT ?1")
        .map_err(|error| error.to_string())?;
    let nodes = node_stmt
        .query_map(params![limit], |row| {
            let metadata_json: Option<String> = row.get(5)?;
            Ok(MemoryGraphNode {
                id: row.get(0)?,
                kind: row.get(1)?,
                label: row.get(2)?,
                note_id: row.get(3)?,
                weight: row.get(4)?,
                metadata: metadata_json.and_then(|json| serde_json::from_str(&json).ok()),
            })
        })
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())?;

    let mut edge_stmt = conn
        .prepare("SELECT id, from_id, to_id, relation, weight, source, metadata_json FROM memory_graph_edges ORDER BY weight DESC, updated_at DESC LIMIT ?1")
        .map_err(|error| error.to_string())?;
    let edges = edge_stmt
        .query_map(params![limit.saturating_mul(4)], |row| {
            let metadata_json: Option<String> = row.get(6)?;
            Ok(MemoryGraphEdge {
                id: row.get(0)?,
                from_id: row.get(1)?,
                to_id: row.get(2)?,
                relation: row.get(3)?,
                weight: row.get(4)?,
                source: row.get(5)?,
                metadata: metadata_json.and_then(|json| serde_json::from_str(&json).ok()),
            })
        })
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())?;

    Ok(MemoryGraph { nodes, edges })
}

pub fn edges_for_notes(note_ids: &[String], limit: u32) -> MemoryResult<Vec<MemoryGraphEdge>> {
    if note_ids.is_empty() {
        return Ok(Vec::new());
    }
    let graph = get_graph(limit)?;
    Ok(graph
        .edges
        .into_iter()
        .filter(|edge| {
            note_ids
                .iter()
                .any(|id| edge.from_id.contains(id) || edge.to_id.contains(id))
        })
        .take(limit as usize)
        .collect())
}

fn insert_link_edges(conn: &Connection, now: &str) -> MemoryResult<()> {
    let mut stmt = conn
        .prepare("SELECT from_note_id, to_note_id, relation, link_text FROM memory_links")
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, Option<String>>(3)?,
            ))
        })
        .map_err(|error| error.to_string())?;
    for row in rows {
        let (from, to, relation, link_text) = row.map_err(|error| error.to_string())?;
        insert_edge(
            conn,
            &format!("note:{from}"),
            &format!("note:{to}"),
            &relation,
            2.0,
            "wikilink",
            link_text.map(|text| serde_json::json!({ "text": text })),
            now,
        )?;
    }
    Ok(())
}

fn insert_tag_edges(conn: &Connection, now: &str) -> MemoryResult<()> {
    let mut stmt = conn
        .prepare("SELECT note_id, tag FROM memory_tags")
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|error| error.to_string())?;
    for row in rows {
        let (note_id, tag) = row.map_err(|error| error.to_string())?;
        insert_edge(
            conn,
            &format!("note:{note_id}"),
            &format!("tag:{tag}"),
            "tagged",
            1.2,
            "tag",
            None,
            now,
        )?;
    }
    Ok(())
}

fn insert_kind_edges(conn: &Connection, now: &str) -> MemoryResult<()> {
    for kind in [
        "decision",
        "rule",
        "dream",
        "action",
        "conversation",
        "system",
        "project",
    ] {
        conn.execute(
            "INSERT OR IGNORE INTO memory_graph_nodes (id, kind, label, note_id, weight, metadata_json, updated_at)
             VALUES (?1, 'kind', ?2, NULL, 1.0, NULL, ?3)",
            params![format!("kind:{kind}"), kind, now],
        )
        .map_err(|error| error.to_string())?;
    }
    let mut stmt = conn
        .prepare("SELECT id, kind FROM memory_notes")
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|error| error.to_string())?;
    for row in rows {
        let (note_id, kind) = row.map_err(|error| error.to_string())?;
        insert_edge(
            conn,
            &format!("note:{note_id}"),
            &format!("kind:{kind}"),
            "kind",
            0.6,
            "kind",
            None,
            now,
        )?;
    }
    Ok(())
}

fn insert_edge(
    conn: &Connection,
    from: &str,
    to: &str,
    relation: &str,
    weight: f64,
    source: &str,
    metadata: Option<serde_json::Value>,
    now: &str,
) -> MemoryResult<()> {
    conn.execute(
        "INSERT OR REPLACE INTO memory_graph_edges (id, from_id, to_id, relation, weight, source, metadata_json, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8)",
        params![
            vault::stable_id("edge", &format!("{from}:{to}:{relation}")),
            from,
            to,
            relation,
            weight,
            source,
            metadata.map(|value| value.to_string()),
            now
        ],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}
