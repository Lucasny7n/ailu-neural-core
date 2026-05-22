use chrono::Utc;

use crate::memory_core::{
    config,
    error::MemoryResult,
    indexer,
    types::{MemoryNoteDetail, MemoryNoteKind},
    vault,
};

pub fn capture_decision(content: String, title: Option<String>) -> MemoryResult<MemoryNoteDetail> {
    let clean = strip_capture_prefix(&content);
    let title = title.unwrap_or_else(|| title_from("Decisao", &clean));
    let body = format!(
        "{}\n\n## Impacto\n\nDecisao registrada pelo operador para continuidade do Ailu.\n\n## Relacionado\n\n- [[Ailu Neural Core]]\n",
        clean.trim()
    );
    write_capture(title, MemoryNoteKind::Decision, body)
}

pub fn capture_rule(content: String, title: Option<String>) -> MemoryResult<MemoryNoteDetail> {
    let clean = strip_capture_prefix(&content);
    let title = title.unwrap_or_else(|| title_from("Regra", &clean));
    let body = format!(
        "{}\n\n## Aplicacao\n\nRegra persistente do operador. Use antes de responder ou planejar acoes.\n",
        clean.trim()
    );
    write_capture(title, MemoryNoteKind::Rule, body)
}

pub fn capture_conversation(
    operator_message: String,
    ailu_response: String,
    summary: Option<String>,
) -> MemoryResult<MemoryNoteDetail> {
    let summary_text =
        summary.unwrap_or_else(|| summarize(&format!("{operator_message} {ailu_response}")));
    let title = format!("Conversa - {}", summarize(&operator_message));
    let body = format!(
        "## Operador\n\n{}\n\n## Ailu\n\n{}\n\n## Resumo\n\n{}\n\n## Decisoes detectadas\n\n- nenhuma decisao automatica confirmada\n\n## Proximos passos\n\n- revisar se esta conversa deve virar regra ou decisao\n",
        operator_message.trim(),
        ailu_response.trim(),
        summary_text.trim()
    );
    write_capture(title, MemoryNoteKind::Conversation, body)
}

pub fn capture_action(
    payload_json: String,
    title: Option<String>,
) -> MemoryResult<MemoryNoteDetail> {
    let title = title.unwrap_or_else(|| "Acao operacional registrada".to_string());
    let body = format!(
        "## Registro operacional\n\n```json\n{}\n```\n\n## Resultado\n\nRegistro criado pelo Approval Layer/System Agent.\n",
        payload_json.trim()
    );
    write_capture(title, MemoryNoteKind::Action, body)
}

pub fn capture_dream(content: String, title: Option<String>) -> MemoryResult<MemoryNoteDetail> {
    let clean = content.trim();
    let title = title.unwrap_or_else(|| title_from("Sonho", clean));
    let body = format!(
        "{}\n\n## Garantias\n\n- sugestao de curadoria gerada a partir de memoria local disponivel\n- nenhum comando real executado\n- nenhuma memoria apagada\n\n## Relacionado\n\n- [[Ailu Neural Core]]\n- [[Memoria]]\n",
        clean
    );
    write_capture(title, MemoryNoteKind::Dream, body)
}

fn write_capture(
    title: String,
    kind: MemoryNoteKind,
    body: String,
) -> MemoryResult<MemoryNoteDetail> {
    let config = config::load_config()?;
    let now = Utc::now().to_rfc3339();
    let frontmatter = format!(
        "---\ntitle: {title}\nkind: {}\ntags: [{}, ailu]\ncreated: {now}\nupdated: {now}\n---\n\n# {title}\n\n{body}\n",
        kind.as_str(),
        kind.as_str()
    );
    let path = vault::create_note_file(&config, &title, kind, &frontmatter, true)?;
    let note = indexer::index_note_path(&path)?;
    indexer::note_detail(&note.id)
}

#[allow(dead_code)]
pub fn capture_from_operator_message(message: &str) -> Option<(MemoryNoteKind, String)> {
    let normalized = message.trim().to_lowercase();
    for prefix in [
        "salva isso como decisao:",
        "salva isso como decisão:",
        "decidimos que ",
    ] {
        if normalized.starts_with(prefix) {
            return Some((
                MemoryNoteKind::Decision,
                message[prefix.len()..].trim().to_string(),
            ));
        }
    }
    for prefix in [
        "salva isso como regra:",
        "a partir de agora ",
        "sempre faca ",
        "sempre faça ",
        "nunca faca ",
        "nunca faça ",
    ] {
        if normalized.starts_with(prefix) {
            return Some((
                MemoryNoteKind::Rule,
                message[prefix.len()..].trim().to_string(),
            ));
        }
    }
    if normalized.starts_with("o ailu deve ")
        || normalized.starts_with("o ailu nao deve ")
        || normalized.starts_with("o ailu não deve ")
    {
        return Some((MemoryNoteKind::Rule, message.trim().to_string()));
    }
    None
}

fn strip_capture_prefix(content: &str) -> String {
    let trimmed = content.trim();
    for prefix in [
        "salva isso como decisao:",
        "salva isso como decisão:",
        "salva isso como regra:",
        "decidimos que ",
        "a partir de agora ",
    ] {
        if trimmed.to_lowercase().starts_with(prefix) {
            return trimmed[prefix.len()..].trim().to_string();
        }
    }
    trimmed.to_string()
}

fn title_from(prefix: &str, content: &str) -> String {
    format!("{prefix} - {}", summarize(content))
}

fn summarize(content: &str) -> String {
    let text = content
        .split_whitespace()
        .take(12)
        .collect::<Vec<_>>()
        .join(" ");
    if text.is_empty() {
        "memoria sem titulo".to_string()
    } else {
        text.chars().take(80).collect()
    }
}
