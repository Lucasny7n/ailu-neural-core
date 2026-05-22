use crate::memory_core::{types::ParsedChunk, vault};

const MAX_CHUNK_CHARS: usize = 1_600;
const OVERLAP_CHARS: usize = 160;

pub fn chunk_markdown(body: &str) -> Vec<ParsedChunk> {
    let sections = split_by_headings(body);
    let mut chunks = Vec::new();

    for (heading, content) in sections {
        if content.trim().is_empty() {
            continue;
        }
        for part in split_large_text(&content, MAX_CHUNK_CHARS, OVERLAP_CHARS) {
            let trimmed = part.trim().to_string();
            if trimmed.is_empty() {
                continue;
            }
            chunks.push(ParsedChunk {
                heading: heading.clone(),
                token_estimate: ((trimmed.chars().count() as f64) / 4.0).ceil() as u32,
                content_hash: vault::content_hash(&trimmed),
                content: trimmed,
            });
        }
    }

    if chunks.is_empty() && !body.trim().is_empty() {
        let content = body.trim().to_string();
        chunks.push(ParsedChunk {
            heading: None,
            token_estimate: ((content.chars().count() as f64) / 4.0).ceil() as u32,
            content_hash: vault::content_hash(&content),
            content,
        });
    }

    chunks
}

fn split_by_headings(body: &str) -> Vec<(Option<String>, String)> {
    let mut sections = Vec::new();
    let mut current_heading: Option<String> = None;
    let mut current = String::new();

    for line in body.lines() {
        let trimmed = line.trim_start();
        if trimmed.starts_with('#') {
            if !current.trim().is_empty() {
                sections.push((current_heading.take(), current.trim().to_string()));
                current.clear();
            }
            current_heading = Some(trimmed.trim_start_matches('#').trim().to_string());
        }
        current.push_str(line);
        current.push('\n');
    }

    if !current.trim().is_empty() {
        sections.push((current_heading, current.trim().to_string()));
    }
    sections
}

fn split_large_text(input: &str, max_chars: usize, overlap_chars: usize) -> Vec<String> {
    if input.chars().count() <= max_chars {
        return vec![input.to_string()];
    }
    let chars: Vec<char> = input.chars().collect();
    let mut chunks = Vec::new();
    let mut start = 0;
    while start < chars.len() {
        let end = (start + max_chars).min(chars.len());
        chunks.push(chars[start..end].iter().collect());
        if end == chars.len() {
            break;
        }
        start = end.saturating_sub(overlap_chars);
    }
    chunks
}
