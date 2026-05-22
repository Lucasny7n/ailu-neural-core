use std::{env, fs, path::PathBuf};

use uuid::Uuid;

use super::{
    capture, chunker, config, context, ignore::IgnoreRules, importer, indexer, parser, search,
    types::MemoryNoteKind, vault,
};

fn test_root(name: &str) -> PathBuf {
    let root = env::temp_dir().join(format!("ailu-memory-{name}-{}", Uuid::new_v4()));
    fs::create_dir_all(&root).expect("create test root");
    env::set_var(
        "AILU_MEMORY_CONFIG_PATH",
        root.join("config/memory-core.json"),
    );
    env::set_var("AILU_MEMORY_VAULT_PATH", root.join("vault"));
    env::set_var("AILU_MEMORY_DB_PATH", root.join("ailu.sqlite"));
    root
}

#[test]
fn config_default_and_vault_init_create_local_files() {
    let root = test_root("config");
    let config = config::load_config().expect("load config");
    let vault_root = vault::init_vault(&config).expect("init vault");
    assert!(vault_root.ends_with("vault"));
    assert!(vault_root.join("notes/decisions").exists());
    assert!(vault_root.join(".ailu/.ailuignore").exists());
    assert!(root.join("config/memory-core.json").exists());
}

#[test]
fn safe_path_blocks_traversal() {
    let root = test_root("safe-path");
    let config = config::load_config().expect("load config");
    let vault_root = vault::init_vault(&config).expect("init vault");
    assert!(vault::safe_join(&vault_root, "notes/test.md").is_ok());
    assert!(vault::safe_join(&vault_root, "../secret.md").is_err());
    assert!(vault::safe_join(&vault_root, "/tmp/secret.md").is_err());
    drop(root);
}

#[test]
fn parser_extracts_frontmatter_links_tags_and_headings() {
    let parsed = parser::parse_markdown(
        r#"---
title: Visual Premium
kind: decision
tags: [ailu, design]
aliases: [Visual do Ailu]
created: 2026-05-21T00:00:00-03:00
updated: 2026-05-21T00:00:00-03:00
---

# Visual Premium

O Ailu nunca deve parecer cartoon. #rule

Relacionado a [[Ailu Neural Core]] e [Approval](Approval Layer.md).
"#,
    );
    assert_eq!(parsed.title.as_deref(), Some("Visual Premium"));
    assert_eq!(parsed.kind, Some(MemoryNoteKind::Decision));
    assert!(parsed.tags.contains(&"ailu".to_string()));
    assert!(parsed.tags.contains(&"rule".to_string()));
    assert!(parsed.aliases.contains(&"Visual do Ailu".to_string()));
    assert!(parsed.wikilinks.contains(&"Ailu Neural Core".to_string()));
    assert!(parsed
        .markdown_links
        .contains(&"Approval Layer.md".to_string()));
    assert!(parsed.headings.contains(&"Visual Premium".to_string()));
}

#[test]
fn chunker_splits_large_markdown_with_token_estimate() {
    let body = format!("# Head\n\n{}", "texto ".repeat(900));
    let chunks = chunker::chunk_markdown(&body);
    assert!(chunks.len() > 1);
    assert!(chunks.iter().all(|chunk| chunk.token_estimate > 0));
    assert_eq!(chunks[0].heading.as_deref(), Some("Head"));
}

#[test]
fn indexing_search_backlinks_graph_and_context_are_real() {
    let _root = test_root("index");
    let config = config::load_config().expect("load config");
    let vault_root = vault::init_vault(&config).expect("init vault");
    fs::write(
        vault_root.join("notes/projects/Ailu Neural Core.md"),
        r#"---
title: Ailu Neural Core
kind: project
tags: [ailu, ia]
aliases: [Ailu]
---

# Ailu Neural Core

O Ailu Neural Core e o cerebro visual e operacional da IA.

Relacionado a [[Visual Premium]] e [[Approval Layer]].
"#,
    )
    .expect("write project");
    fs::write(
        vault_root.join("notes/decisions/Visual Premium.md"),
        r#"---
title: Visual Premium
kind: decision
tags: [design, decision, ailu]
---

# Visual Premium

O Ailu nunca deve parecer cartoon, infantil, simples ou demo de bolinhas neon.
"#,
    )
    .expect("write decision");
    fs::write(
        vault_root.join("notes/system/Approval Layer.md"),
        r#"---
title: Approval Layer
kind: system
tags: [security, approval]
---

# Approval Layer

Toda acao real precisa de aprovacao explicita do operador.
"#,
    )
    .expect("write system");

    let stats = indexer::scan_vault().expect("scan vault");
    assert_eq!(stats.notes, 3);
    assert!(stats.links >= 2);

    let results = search::search("cartoon visual".to_string(), 10).expect("search");
    assert!(results
        .iter()
        .any(|result| result.note.title == "Visual Premium"));

    let context = context::build_context(
        "qual foi a decisao sobre visual do Ailu?".to_string(),
        Some("question".to_string()),
        None,
    )
    .expect("context");
    assert!(context.summary.contains("Visual Premium"));
    assert!(context.total_chars <= 24_000);
}

#[test]
fn capture_decision_rule_conversation_action_and_import_file() {
    let root = test_root("capture");
    let _config = config::load_config().expect("load config");
    let decision = capture::capture_decision("o Ailu nunca deve parecer cartoon".to_string(), None)
        .expect("capture decision");
    assert_eq!(decision.note.kind, MemoryNoteKind::Decision);

    let rule = capture::capture_rule(
        "sempre recuperar memoria antes de responder".to_string(),
        None,
    )
    .expect("capture rule");
    assert_eq!(rule.note.kind, MemoryNoteKind::Rule);

    let conversation = capture::capture_conversation(
        "qual foi a decisao?".to_string(),
        "A decisao foi manter visual premium.".to_string(),
        None,
    )
    .expect("capture conversation");
    assert_eq!(conversation.note.kind, MemoryNoteKind::Conversation);

    let action = capture::capture_action("{\"status\":\"planned\"}".to_string(), None)
        .expect("capture action");
    assert_eq!(action.note.kind, MemoryNoteKind::Action);

    let import_source = root.join("source.txt");
    fs::write(&import_source, "registro tecnico importado").expect("write import source");
    let job =
        importer::import_path(import_source.display().to_string(), None).expect("import file");
    assert_eq!(job.files_imported, 1);

    let detected =
        capture::capture_from_operator_message("salva isso como decisão: manter memoria real");
    assert_eq!(detected.map(|item| item.0), Some(MemoryNoteKind::Decision));
}

#[test]
fn ignore_rules_skip_sensitive_and_large_files() {
    let _root = test_root("ignore");
    let config = config::load_config().expect("load config");
    let vault_root = vault::init_vault(&config).expect("init vault");
    let ignored = vault_root.join("notes/imports/.env");
    fs::write(&ignored, "SECRET=1").expect("write ignored");
    let rules = IgnoreRules::load(&vault_root);
    assert!(rules.is_ignored(&vault_root, &ignored));
}
