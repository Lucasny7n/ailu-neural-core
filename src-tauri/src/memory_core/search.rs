use std::collections::{HashMap, HashSet};

use rusqlite::{params, Connection};

use crate::memory_core::{
    db,
    error::MemoryResult,
    types::{MemoryChunk, MemoryNote, MemoryNoteKind, MemorySearchResult},
};

pub fn search(query: String, limit: u32) -> MemoryResult<Vec<MemorySearchResult>> {
    let conn = db::open_connection()?;
    let query = query.trim().to_string();
    if query.is_empty() {
        return recent_notes(&conn, limit);
    }

    if db::fts_available(&conn) {
        if let Ok(results) = search_fts(&conn, &query, limit) {
            if !results.is_empty() {
                return Ok(results);
            }
        }
    }

    search_manual(&conn, &query, limit)
}

pub fn recent_notes(conn: &Connection, limit: u32) -> MemoryResult<Vec<MemorySearchResult>> {
    Ok(db::list_notes(conn, limit)?
        .into_iter()
        .map(|note| MemorySearchResult {
            snippet: note.summary.clone().unwrap_or_else(|| note.title.clone()),
            note,
            chunk: None,
            score: 1.0,
            matched_by: vec!["recent".to_string()],
        })
        .collect())
}

fn search_fts(conn: &Connection, query: &str, limit: u32) -> MemoryResult<Vec<MemorySearchResult>> {
    let safe_query = query
        .split_whitespace()
        .filter(|part| {
            part.chars()
                .all(|ch| ch.is_alphanumeric() || ch == '-' || ch == '_')
        })
        .collect::<Vec<_>>()
        .join(" OR ");
    if safe_query.is_empty() {
        return search_manual(conn, query, limit);
    }
    let mut stmt = conn
        .prepare(
            r#"
            SELECT n.*, c.id AS chunk_id, c.note_id, c.chunk_index, c.heading, c.content, c.token_estimate,
                   bm25(memory_chunks_fts) AS rank
            FROM memory_chunks_fts f
            JOIN memory_chunks c ON c.id = f.chunk_id
            JOIN memory_notes n ON n.id = c.note_id
            WHERE memory_chunks_fts MATCH ?1 AND n.archived = 0
            ORDER BY n.pinned DESC, rank ASC
            LIMIT ?2
            "#,
        )
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map(params![safe_query, limit], |row| {
            let note = db::row_to_note(row)?;
            let chunk = MemoryChunk {
                id: row.get("chunk_id")?,
                note_id: row.get("note_id")?,
                chunk_index: row.get::<_, i64>("chunk_index")? as u32,
                heading: row.get("heading")?,
                content: row.get("content")?,
                token_estimate: row.get::<_, i64>("token_estimate")? as u32,
            };
            Ok((note, chunk))
        })
        .map_err(|error| error.to_string())?;

    let mut results = Vec::new();
    for row in rows {
        let (note, chunk) = row.map_err(|error| error.to_string())?;
        results.push(MemorySearchResult {
            score: score_note(&note, Some(&chunk), query),
            snippet: snippet_for(&chunk.content, query),
            note,
            chunk: Some(chunk),
            matched_by: vec!["fts".to_string()],
        });
    }
    results.sort_by(|a, b| {
        b.score
            .partial_cmp(&a.score)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    Ok(results)
}

fn search_manual(
    conn: &Connection,
    query: &str,
    limit: u32,
) -> MemoryResult<Vec<MemorySearchResult>> {
    let notes = load_notes(conn)?;
    let chunks = load_chunks(conn)?;
    let aliases = grouped_strings(conn, "SELECT note_id, alias FROM memory_aliases")?;
    let tags = grouped_strings(conn, "SELECT note_id, tag FROM memory_tags")?;
    let query_lower = query.to_lowercase();
    let tokens = query_lower
        .split_whitespace()
        .filter(|token| token.len() > 1)
        .map(ToString::to_string)
        .collect::<Vec<_>>();

    let mut results = Vec::new();
    let mut seen_note_only = HashSet::new();

    for note in notes {
        let note_aliases = aliases.get(&note.id).cloned().unwrap_or_default();
        let note_tags = tags.get(&note.id).cloned().unwrap_or_default();
        let mut matched_by = Vec::new();
        let mut score = score_text(&note.title, &query_lower, &tokens, 10.0, 4.0);
        if score > 0.0 {
            matched_by.push("title".to_string());
        }
        if note_aliases
            .iter()
            .any(|alias| alias.to_lowercase().contains(&query_lower))
        {
            score += 8.0;
            matched_by.push("alias".to_string());
        }
        if note_tags.iter().any(|tag| {
            tokens
                .iter()
                .any(|token| tag.to_lowercase().contains(token))
        }) {
            score += 6.0;
            matched_by.push("tag".to_string());
        }
        if let Some(summary) = &note.summary {
            let summary_score = score_text(summary, &query_lower, &tokens, 4.0, 1.5);
            if summary_score > 0.0 {
                score += summary_score;
                matched_by.push("summary".to_string());
            }
        }
        if note.pinned {
            score += 2.0;
        }
        score += kind_boost(note.kind);

        for chunk in chunks.iter().filter(|chunk| chunk.note_id == note.id) {
            let chunk_score = score_text(&chunk.content, &query_lower, &tokens, 3.0, 1.0);
            if chunk_score > 0.0 {
                let mut chunk_matches = matched_by.clone();
                chunk_matches.push("chunk".to_string());
                results.push(MemorySearchResult {
                    note: note.clone(),
                    chunk: Some(chunk.clone()),
                    score: score + chunk_score,
                    snippet: snippet_for(&chunk.content, query),
                    matched_by: unique(chunk_matches),
                });
            }
        }

        if score > 0.0 && seen_note_only.insert(note.id.clone()) {
            results.push(MemorySearchResult {
                snippet: note.summary.clone().unwrap_or_else(|| note.title.clone()),
                note,
                chunk: None,
                score,
                matched_by: unique(matched_by),
            });
        }
    }

    results.sort_by(|a, b| {
        b.score
            .partial_cmp(&a.score)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    results.truncate(limit as usize);
    Ok(results)
}

fn load_notes(conn: &Connection) -> MemoryResult<Vec<MemoryNote>> {
    let mut stmt = conn
        .prepare("SELECT * FROM memory_notes WHERE archived = 0")
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map([], db::row_to_note)
        .map_err(|error| error.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

fn load_chunks(conn: &Connection) -> MemoryResult<Vec<MemoryChunk>> {
    let mut stmt = conn
        .prepare("SELECT * FROM memory_chunks")
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map([], db::row_to_chunk)
        .map_err(|error| error.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

fn grouped_strings(conn: &Connection, sql: &str) -> MemoryResult<HashMap<String, Vec<String>>> {
    let mut stmt = conn.prepare(sql).map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|error| error.to_string())?;
    let mut map: HashMap<String, Vec<String>> = HashMap::new();
    for row in rows {
        let (note_id, value) = row.map_err(|error| error.to_string())?;
        map.entry(note_id).or_default().push(value);
    }
    Ok(map)
}

fn score_note(note: &MemoryNote, chunk: Option<&MemoryChunk>, query: &str) -> f64 {
    let query_lower = query.to_lowercase();
    let tokens = query_lower
        .split_whitespace()
        .map(ToString::to_string)
        .collect::<Vec<_>>();
    let mut score = score_text(&note.title, &query_lower, &tokens, 10.0, 4.0);
    if let Some(summary) = &note.summary {
        score += score_text(summary, &query_lower, &tokens, 4.0, 1.5);
    }
    if let Some(chunk) = chunk {
        score += score_text(&chunk.content, &query_lower, &tokens, 3.0, 1.0);
    }
    if note.pinned {
        score += 2.0;
    }
    score + kind_boost(note.kind)
}

fn score_text(text: &str, query: &str, tokens: &[String], exact: f64, partial: f64) -> f64 {
    let lower = text.to_lowercase();
    if lower == query {
        return exact * 2.0;
    }
    let mut score = if lower.contains(query) { exact } else { 0.0 };
    for token in tokens {
        if lower.contains(token) {
            score += partial;
        }
    }
    score
}

fn kind_boost(kind: MemoryNoteKind) -> f64 {
    match kind {
        MemoryNoteKind::Decision => 2.4,
        MemoryNoteKind::Rule => 2.2,
        MemoryNoteKind::Project => 1.4,
        MemoryNoteKind::System => 1.2,
        MemoryNoteKind::Action => 0.8,
        MemoryNoteKind::Conversation => 0.5,
        _ => 0.0,
    }
}

fn snippet_for(content: &str, query: &str) -> String {
    let lower = content.to_lowercase();
    let query_lower = query.to_lowercase();
    let start = lower.find(&query_lower).unwrap_or(0).saturating_sub(80);
    let snippet: String = content.chars().skip(start).take(260).collect();
    snippet.replace('\n', " ").trim().to_string()
}

fn unique(values: Vec<String>) -> Vec<String> {
    let mut seen = HashSet::new();
    values
        .into_iter()
        .filter(|value| seen.insert(value.clone()))
        .collect()
}
