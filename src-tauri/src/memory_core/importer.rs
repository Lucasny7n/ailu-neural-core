use std::{
    fs,
    path::{Path, PathBuf},
};

use chrono::Utc;
use rusqlite::params;
use uuid::Uuid;

use crate::memory_core::{
    config, db,
    error::{io_context, MemoryResult},
    ignore::{self, IgnoreRules},
    indexer,
    types::{MemoryConfig, MemoryImportJob, MemoryNoteKind},
    vault,
};

pub fn import_path(source_path: String, category: Option<String>) -> MemoryResult<MemoryImportJob> {
    let config = config::load_config()?;
    let root = vault::init_vault(&config)?;
    db::init_database()?;
    let conn = db::open_connection()?;
    let started_at = Utc::now().to_rfc3339();
    let mut job = MemoryImportJob {
        id: Uuid::new_v4().to_string(),
        source_path: source_path.clone(),
        category,
        status: "running".to_string(),
        files_found: 0,
        files_imported: 0,
        files_skipped: 0,
        files_errored: 0,
        started_at: Some(started_at.clone()),
        finished_at: None,
    };
    save_job(&conn, &job)?;

    let source = PathBuf::from(&source_path);
    let files = collect_import_files(&config, &source)?;
    job.files_found = files.len() as u32;
    for file in files {
        match import_file(&config, &root, &file) {
            Ok(path) => {
                if indexer::index_note_path(&path).is_ok() {
                    job.files_imported += 1;
                } else {
                    job.files_errored += 1;
                }
            }
            Err(_) => job.files_skipped += 1,
        }
    }
    job.status = if job.files_errored > 0 {
        "completed_with_errors"
    } else {
        "completed"
    }
    .to_string();
    job.finished_at = Some(Utc::now().to_rfc3339());
    save_job(&conn, &job)?;
    Ok(job)
}

fn collect_import_files(config: &MemoryConfig, source: &Path) -> MemoryResult<Vec<PathBuf>> {
    if !source.exists() {
        return Err(format!("import source not found: {}", source.display()));
    }
    if source.is_file() {
        return Ok(vec![source.to_path_buf()]);
    }
    let rules = IgnoreRules::load(source);
    let mut files = Vec::new();
    collect_recursive(config, source, source, &rules, &mut files)?;
    Ok(files)
}

fn collect_recursive(
    config: &MemoryConfig,
    root: &Path,
    dir: &Path,
    rules: &IgnoreRules,
    files: &mut Vec<PathBuf>,
) -> MemoryResult<()> {
    for entry in fs::read_dir(dir).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path();
        if rules.is_ignored(root, &path) {
            continue;
        }
        if path.is_dir() {
            collect_recursive(config, root, &path, rules, files)?;
        } else if ignore::should_index_file(config, root, &path, rules)? {
            files.push(path);
        }
    }
    Ok(())
}

fn import_file(config: &MemoryConfig, vault_root: &Path, source: &Path) -> MemoryResult<PathBuf> {
    let metadata =
        fs::metadata(source).map_err(|error| io_context("read import metadata", source, error))?;
    if metadata.len() > config.max_import_file_bytes {
        return Err(format!(
            "import skipped, file larger than limit: {}",
            source.display()
        ));
    }
    let content = fs::read_to_string(source)
        .map_err(|error| io_context("read import source", source, error))?;
    let ext = source
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or("")
        .to_lowercase();
    let file_stem = source
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("imported-memory");
    let title = file_stem.replace(['_', '-'], " ");
    let date = Utc::now().format("%Y-%m-%d").to_string();
    let relative = format!("notes/imports/{date}/{}.md", vault::slugify(&title));
    let target = vault::safe_join(vault_root, &relative)?;
    let now = Utc::now().to_rfc3339();
    let markdown = if ext == "md" && content.trim_start().starts_with("---") {
        content
    } else if ext == "md" {
        format!("---\ntitle: {title}\nkind: import\ntags: [import]\ncreated: {now}\nupdated: {now}\n---\n\n{content}")
    } else {
        format!(
            "---\ntitle: {title}\nkind: import\ntags: [import, {ext}]\ncreated: {now}\nupdated: {now}\n---\n\n# {title}\n\nImported from `{}`.\n\n```{ext}\n{}\n```\n",
            source.display(),
            content.trim()
        )
    };
    fs::write(&target, markdown)
        .map_err(|error| io_context("write imported memory", &target, error))?;
    let _ = MemoryNoteKind::Import;
    Ok(target)
}

fn save_job(conn: &rusqlite::Connection, job: &MemoryImportJob) -> MemoryResult<()> {
    conn.execute(
        r#"
        INSERT INTO memory_import_jobs (
            id, source_path, category, status, files_found, files_imported, files_skipped,
            files_errored, started_at, finished_at
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
        ON CONFLICT(id) DO UPDATE SET
            status = excluded.status,
            files_found = excluded.files_found,
            files_imported = excluded.files_imported,
            files_skipped = excluded.files_skipped,
            files_errored = excluded.files_errored,
            finished_at = excluded.finished_at
        "#,
        params![
            job.id,
            job.source_path,
            job.category,
            job.status,
            job.files_found as i64,
            job.files_imported as i64,
            job.files_skipped as i64,
            job.files_errored as i64,
            job.started_at,
            job.finished_at
        ],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}
