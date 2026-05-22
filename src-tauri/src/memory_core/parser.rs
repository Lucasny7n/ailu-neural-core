use std::str::FromStr;

use crate::memory_core::types::MemoryNoteKind;

#[derive(Debug, Clone, Default)]
pub struct ParsedNote {
    pub title: Option<String>,
    pub kind: Option<MemoryNoteKind>,
    pub tags: Vec<String>,
    pub aliases: Vec<String>,
    pub created: Option<String>,
    pub updated: Option<String>,
    pub headings: Vec<String>,
    pub wikilinks: Vec<String>,
    pub markdown_links: Vec<String>,
    pub summary: String,
    pub body: String,
}

pub fn parse_markdown(content: &str) -> ParsedNote {
    let (frontmatter, body) = split_frontmatter(content);
    let mut parsed = ParsedNote {
        body: body.to_string(),
        ..ParsedNote::default()
    };

    if let Some(frontmatter) = frontmatter {
        for line in frontmatter.lines() {
            if let Some((key, value)) = line.split_once(':') {
                apply_frontmatter_value(&mut parsed, key.trim(), value.trim());
            }
        }
    }

    parsed.headings = parse_headings(body);
    parsed.wikilinks = parse_wikilinks(body);
    parsed.markdown_links = parse_markdown_links(body);
    parsed.tags = merge_unique(parsed.tags, parse_inline_tags(body));
    parsed.summary = build_summary(body);

    if parsed.title.is_none() {
        parsed.title = parsed.headings.first().cloned();
    }

    parsed
}

fn split_frontmatter(content: &str) -> (Option<&str>, &str) {
    let normalized = content.strip_prefix('\u{feff}').unwrap_or(content);
    if !normalized.starts_with("---\n") {
        return (None, normalized);
    }
    let rest = &normalized[4..];
    if let Some(end) = rest.find("\n---") {
        let frontmatter = &rest[..end];
        let after = &rest[end + 4..];
        let body = after.strip_prefix('\n').unwrap_or(after);
        return (Some(frontmatter), body);
    }
    (None, normalized)
}

fn apply_frontmatter_value(parsed: &mut ParsedNote, key: &str, value: &str) {
    match key.to_lowercase().as_str() {
        "title" => parsed.title = Some(clean_scalar(value)),
        "kind" => parsed.kind = MemoryNoteKind::from_str(&clean_scalar(value)).ok(),
        "tags" => parsed.tags = parse_array_or_scalar(value),
        "aliases" => parsed.aliases = parse_array_or_scalar(value),
        "created" => parsed.created = Some(clean_scalar(value)),
        "updated" => parsed.updated = Some(clean_scalar(value)),
        _ => {}
    }
}

fn parse_array_or_scalar(value: &str) -> Vec<String> {
    let trimmed = value.trim();
    if trimmed.starts_with('[') && trimmed.ends_with(']') {
        return trimmed
            .trim_start_matches('[')
            .trim_end_matches(']')
            .split(',')
            .map(clean_scalar)
            .filter(|item| !item.is_empty())
            .collect();
    }
    if trimmed.is_empty() {
        return Vec::new();
    }
    vec![clean_scalar(trimmed)]
}

fn clean_scalar(value: &str) -> String {
    value
        .trim()
        .trim_matches('"')
        .trim_matches('\'')
        .trim()
        .to_string()
}

fn parse_headings(body: &str) -> Vec<String> {
    body.lines()
        .filter_map(|line| {
            let trimmed = line.trim_start();
            if !trimmed.starts_with('#') {
                return None;
            }
            let title = trimmed.trim_start_matches('#').trim();
            (!title.is_empty()).then(|| title.to_string())
        })
        .collect()
}

fn parse_wikilinks(body: &str) -> Vec<String> {
    let mut links = Vec::new();
    let mut rest = body;
    while let Some(start) = rest.find("[[") {
        rest = &rest[start + 2..];
        if let Some(end) = rest.find("]]") {
            let raw = &rest[..end];
            let target = raw.split('|').next().unwrap_or(raw).trim();
            if !target.is_empty() {
                links.push(target.to_string());
            }
            rest = &rest[end + 2..];
        } else {
            break;
        }
    }
    merge_unique(Vec::new(), links)
}

fn parse_markdown_links(body: &str) -> Vec<String> {
    let mut links = Vec::new();
    let mut rest = body;
    while let Some(label_end) = rest.find("](") {
        rest = &rest[label_end + 2..];
        if let Some(target_end) = rest.find(')') {
            let target = rest[..target_end].trim();
            if !target.is_empty()
                && !target.starts_with("http://")
                && !target.starts_with("https://")
            {
                links.push(target.to_string());
            }
            rest = &rest[target_end + 1..];
        } else {
            break;
        }
    }
    merge_unique(Vec::new(), links)
}

fn parse_inline_tags(body: &str) -> Vec<String> {
    body.split(|ch: char| ch.is_whitespace() || matches!(ch, ',' | ';' | ')' | '(' | '[' | ']'))
        .filter_map(|token| token.strip_prefix('#'))
        .map(|tag| tag.trim_matches(|ch: char| !ch.is_alphanumeric() && ch != '-' && ch != '_'))
        .filter(|tag| !tag.is_empty() && !tag.chars().all(|ch| ch.is_ascii_digit()))
        .map(|tag| tag.to_lowercase())
        .collect()
}

fn build_summary(body: &str) -> String {
    let mut summary = String::new();
    for line in body.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty()
            || trimmed.starts_with('#')
            || trimmed.starts_with("```")
            || trimmed.starts_with("---")
        {
            continue;
        }
        if !summary.is_empty() {
            summary.push(' ');
        }
        summary.push_str(trimmed);
        if summary.len() > 240 {
            break;
        }
    }
    truncate_chars(&summary, 260)
}

fn merge_unique(mut first: Vec<String>, second: Vec<String>) -> Vec<String> {
    for item in second {
        if !first
            .iter()
            .any(|existing| existing.eq_ignore_ascii_case(&item))
        {
            first.push(item);
        }
    }
    first
}

fn truncate_chars(input: &str, max: usize) -> String {
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
